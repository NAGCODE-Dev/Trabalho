import Dexie, { type Table } from 'dexie'
import {
  type AppStateSnapshot,
  type MinimalShortageRecord,
  type Order,
  type PilotLogEntry,
  type ScanStructureProfile,
} from '../features/orders/types'

interface AppMeta {
  key: string
  value: boolean
}

class OrdersAppDatabase extends Dexie {
  currentOrder!: Table<Order, string>
  shortageHistory!: Table<MinimalShortageRecord, string>
  scanStructureMemory!: Table<ScanStructureProfile, string>
  pilotLogs!: Table<PilotLogEntry, string>
  meta!: Table<AppMeta, string>

  constructor() {
    super('warehouse-order-check')
    this.version(1).stores({
      currentOrder: 'id, updatedAt',
      shortageHistory: 'id, productCode, normalizedDescription, createdAt',
      meta: 'key',
    })
    this.version(2).stores({
      currentOrder: 'id, updatedAt',
      shortageHistory: 'id, productCode, normalizedDescription, createdAt',
      scanStructureMemory: 'id, createdAt, parserVersion, sourceEngine',
      meta: 'key',
    })
    this.version(3).stores({
      currentOrder: 'id, updatedAt',
      shortageHistory: 'id, productCode, normalizedDescription, createdAt',
      scanStructureMemory: 'id, createdAt, parserVersion, sourceEngine',
      pilotLogs: 'id, createdAt, level, event, orderReference, pageId',
      meta: 'key',
    })
  }
}

export const db = new OrdersAppDatabase()

export async function loadSnapshot(): Promise<AppStateSnapshot> {
  const [currentOrder, shortageHistory, scanStructureMemory, pilotLogs] = await Promise.all([
    db.currentOrder.toCollection().first(),
    db.shortageHistory.orderBy('createdAt').reverse().toArray(),
    db.scanStructureMemory.orderBy('createdAt').reverse().limit(50).toArray(),
    db.pilotLogs.orderBy('createdAt').reverse().limit(200).toArray(),
  ])

  return {
    currentOrder: currentOrder ?? null,
    shortageHistory,
    scanStructureMemory,
    pilotLogs,
  }
}

export async function saveCurrentOrder(order: Order | null) {
  await db.transaction('rw', db.currentOrder, async () => {
    await db.currentOrder.clear()
    if (order) {
      await db.currentOrder.put(order)
    }
  })
}

export async function appendShortageHistory(records: MinimalShortageRecord[]) {
  if (records.length === 0) return
  await db.shortageHistory.bulkPut(records)
}

export async function appendScanStructureMemory(records: ScanStructureProfile[]) {
  if (records.length === 0) return
  await db.scanStructureMemory.bulkPut(records)
}

export async function appendPilotLogs(records: PilotLogEntry[]) {
  if (records.length === 0) return
  await db.pilotLogs.bulkPut(records)
  const total = await db.pilotLogs.count()
  if (total > 200) {
    const overflow = total - 200
    const oldest = await db.pilotLogs.orderBy('createdAt').limit(overflow).primaryKeys()
    await db.pilotLogs.bulkDelete(oldest)
  }
}

export async function hasSeededDemo() {
  const entry = await db.meta.get('seeded-demo')
  return entry?.value ?? false
}

export async function setSeededDemo(value: boolean) {
  await db.meta.put({ key: 'seeded-demo', value })
}
