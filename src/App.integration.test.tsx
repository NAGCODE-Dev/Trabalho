import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import { db } from './lib/db'

describe('App integration', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('importa item por texto e mostra no checklist operacional', async () => {
    render(<App />)

    await screen.findByText(/Separação segura de pedidos/i)
    const importButton = await screen.findByRole('button', { name: /Importar texto como backup/i })
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
})
