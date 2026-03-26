import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyOrder } from '../hooks/usePersistentOrdersApp'
import { appendPilotLogs, appendScanStructureMemory, appendShortageHistory, db, loadSnapshot, saveCurrentOrder } from './db'

describe('db persistence', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('salva e recupera pedido em andamento', async () => {
    const order = createEmptyOrder('PED-TESTE')
    await saveCurrentOrder(order)
    const snapshot = await loadSnapshot()
    expect(snapshot.currentOrder?.reference).toBe('PED-TESTE')
  })

  it('preserva histórico mínimo de faltas', async () => {
    await appendShortageHistory([
      {
        id: 'hist-1',
        productCode: '789',
        normalizedDescription: 'produto',
        productLabel: 'Produto',
        occurrenceType: 'total-shortage',
        missingQuantity: 3,
        createdAt: new Date().toISOString(),
        lastOrderReference: 'PED-1',
      },
    ])
    const snapshot = await loadSnapshot()
    expect(snapshot.shortageHistory).toHaveLength(1)
    expect(snapshot.shortageHistory[0].productLabel).toBe('Produto')
  })

  it('preserva memória estrutural sem conteúdo do scan', async () => {
    await appendScanStructureMemory([
      {
        id: 'scan-1',
        createdAt: new Date().toISOString(),
        parserVersion: 'bling-heuristic-v2',
        sourceEngine: 'tesseract.js',
        lineCount: 10,
        extractedCount: 6,
        uncertainCount: 1,
        dominantDelimiter: 'spaces',
        codePatternKinds: ['numeric', 'alphanumeric'],
        unitHints: ['UN', 'CX'],
        detectedLabels: ['codigo', 'valor-total'],
        lineShapes: ['A A 9 A 9 9,99 9,99'],
      },
    ])
    const snapshot = await loadSnapshot()
    expect(snapshot.scanStructureMemory).toHaveLength(1)
    expect(snapshot.scanStructureMemory[0].lineShapes[0]).not.toContain('Produto')
  })

  it('mantém logs técnicos locais limitados', async () => {
    await appendPilotLogs(
      Array.from({ length: 205 }, (_, index) => ({
        id: `log-${index}`,
        createdAt: new Date(Date.now() + index * 1000).toISOString(),
        level: 'info' as const,
        event: 'app_bootstrap' as const,
        message: `Log ${index}`,
      })),
    )
    const snapshot = await loadSnapshot()
    expect(snapshot.pilotLogs.length).toBeLessThanOrEqual(200)
    expect(snapshot.pilotLogs[0].message).toBe('Log 204')
  })
})
