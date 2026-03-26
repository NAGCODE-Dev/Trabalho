import { Badge } from '../../../components/ui/badge'
import { statusMeta } from '../../orders/utils'
import type { ItemStatus } from '../../orders/types'

export function StatusBadge({ status }: { status: ItemStatus }) {
  const meta = statusMeta[status]
  return <Badge className={meta.chip}>{meta.label}</Badge>
}
