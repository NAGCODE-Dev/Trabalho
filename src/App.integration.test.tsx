import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { db } from './lib/db'
import { loadSnapshot } from './lib/db'
import { browserOCRAdapter } from './features/scanner/adapters'

async function flushReactWork() {
  await act(async () => {
    await Promise.resolve()
    await new Promise((resolve) => window.setTimeout(resolve, 0))
  })
}

describe('App integration', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await db.delete()
    await db.open()
  })

  it('importa item por texto e mostra no checklist operacional', async () => {
    render(<App />)

    await screen.findByText(/^Conferência$/i)
    const newOrderButtons = await screen.findAllByRole('button', { name: /^Novo pedido$/i })
    fireEvent.click(newOrderButtons[0])

    const createOrderButton = await screen.findByRole('button', { name: /Criar pedido/i })
    fireEvent.click(createOrderButton)

    const importButton = await screen.findByRole('button', { name: /Importar texto/i })
    fireEvent.click(importButton)

    const textarea = (await screen.findAllByRole('textbox')).find(
      (element) => (element as HTMLTextAreaElement).value.includes('Arroz 5kg;7891001'),
    ) as HTMLTextAreaElement
    fireEvent.change(textarea, {
      target: {
        value: 'Produto Integracao XYZ;INT-9001;UN;4;12,50;50,00',
      },
    })

    const confirmImport = await screen.findByRole('button', { name: /Importar itens válidos/i })
    fireEvent.click(confirmImport)

    await waitFor(() => {
      expect(screen.getByText(/Produto Integracao XYZ/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/INT-9001/i)).toBeInTheDocument()
  })

  it('não semeia histórico demo em banco limpo', async () => {
    render(<App />)

    fireEvent.click(await screen.findByRole('button', { name: /^Abrir histórico$/i }))

    await waitFor(() => {
      expect(screen.getByText(/Nenhum histórico mínimo salvo/i)).toBeInTheDocument()
    })
    expect(screen.queryByText(/Feijao Carioca 1kg/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Macarrao Espaguete 500g/i)).not.toBeInTheDocument()
  })

  it('conclui pedido com falta, preserva histórico mínimo e permite excluir o registro', async () => {
    render(<App />)

    const newOrderButtons = await screen.findAllByRole('button', { name: /^Novo pedido$/i })
    fireEvent.click(newOrderButtons[0])

    fireEvent.click(await screen.findByRole('button', { name: /Criar pedido/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Importar texto/i }))

    const textarea = (await screen.findAllByRole('textbox')).find(
      (element) => (element as HTMLTextAreaElement).value.includes('Arroz 5kg;7891001'),
    ) as HTMLTextAreaElement
    fireEvent.change(textarea, {
      target: {
        value: 'Macarrao QA 500g;7894004;UN;5;7,00;35,00',
      },
    })

    fireEvent.click(await screen.findByRole('button', { name: /Importar itens válidos/i }))

    await waitFor(() => {
      expect(screen.getByText(/Macarrao QA 500g/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^Falta$/i }))
    fireEvent.click(screen.getByRole('button', { name: /Revisão final/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar conclusão/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar revisão/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Concluir e liberar próxima lista/i }))
    await flushReactWork()

    await waitFor(() => {
      expect(screen.getByText(/Histórico mínimo de faltas/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/Macarrao QA 500g/i)).toBeInTheDocument()

    const snapshotAfterCompletion = await loadSnapshot()
    expect(snapshotAfterCompletion.currentOrder).toBeNull()
    expect(snapshotAfterCompletion.shortageHistory.some((entry) => entry.productLabel === 'Macarrao QA 500g')).toBe(true)

    const recordTitle = screen.getByText(/Macarrao QA 500g/i)
    const recordCard = recordTitle.closest('.rounded-3xl.border.border-slate-200.bg-slate-50.p-4') as HTMLElement
    fireEvent.click(within(recordCard).getByRole('button', { name: /Excluir/i }))
    fireEvent.click(await screen.findByRole('button', { name: /Confirmar exclusão/i }))
    await flushReactWork()

    await waitFor(() => {
      expect(screen.queryByText(/Macarrao QA 500g/i)).not.toBeInTheDocument()
    })

    const snapshotAfterDeletion = await loadSnapshot()
    expect(snapshotAfterDeletion.shortageHistory.some((entry) => entry.productLabel === 'Macarrao QA 500g')).toBe(false)
  })

  it('faz upload da página, revisa OCR e libera o checklist', async () => {
    vi.spyOn(browserOCRAdapter, 'processPage').mockResolvedValue({
      pageId: 'mock-page',
      extractedRows: ['Arroz OCR QA;7891111;UN;2;10,00;20,00'],
      uncertainRows: ['Linha ruim ??'],
      warnings: ['1 trecho exige revisão.'],
      rawText: 'Pedido PED-22222\nArroz OCR QA;7891111;UN;2;10,00;20,00\nLinha ruim ??',
      engine: 'mock-qa-ocr',
      detectedOrderReference: 'PED-22222',
    })

    render(<App />)

    const newOrderButtons = await screen.findAllByRole('button', { name: /^Novo pedido$/i })
    fireEvent.click(newOrderButtons[0])
    fireEvent.click(await screen.findByRole('button', { name: /Criar pedido/i }))

    const fileInput = document.querySelector('input[type="file"][accept="image/*"][multiple]') as HTMLInputElement
    const file = new File(['fake-image'], 'pedido_ocr.jpg', { type: 'image/jpeg' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/pedido_ocr\.jpg/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Ler páginas/i }))

    await waitFor(() => {
      expect(screen.getByText(/Revisão da leitura/i)).toBeInTheDocument()
      expect(screen.getByDisplayValue(/Arroz OCR QA/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/Linha ruim \?\?/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Liberar separação/i }))

    await waitFor(() => {
      expect(screen.getByText(/Arroz OCR QA/i)).toBeInTheDocument()
      expect(screen.getAllByText(/PED-22222/i).length).toBeGreaterThan(0)
    })
    expect(screen.getByText(/Checklist operacional/i)).toBeInTheDocument()
    expect(screen.getByText(/7891111/i)).toBeInTheDocument()
  })
})
