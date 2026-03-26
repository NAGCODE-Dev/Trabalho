import type { Order } from '../types'
import { OrderCard } from './OrderCard'

export function OrderList({
  orders,
  onOpen,
}: {
  orders: Order[]
  onOpen: (order: Order) => void
}) {
  return (
    <section className="grid gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} onOpen={() => onOpen(order)} />
      ))}
    </section>
  )
}
