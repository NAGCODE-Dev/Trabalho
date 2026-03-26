import { Search, X } from 'lucide-react'
import { Input } from '../../../components/ui/input'
import { Button } from '../../../components/ui/button'
import type { OrderFilter } from '../../orders/types'

const filters: Array<{ value: OrderFilter; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'separated-complete', label: 'Completos' },
  { value: 'partial-shortage', label: 'Falta parcial' },
  { value: 'total-shortage', label: 'Em falta total' },
]

interface SearchAndFilterBarProps {
  query: string
  filter: OrderFilter
  visibleCount: number
  totalCount: number
  onQueryChange: (query: string) => void
  onFilterChange: (filter: OrderFilter) => void
  onClear: () => void
}

export function SearchAndFilterBar({
  query,
  filter,
  visibleCount,
  totalCount,
  onQueryChange,
  onFilterChange,
  onClear,
}: SearchAndFilterBarProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-11"
          placeholder="Buscar por descrição, código, unidade ou observação"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {filters.map((currentFilter) => (
          <Button
            key={currentFilter.value}
            variant={currentFilter.value === filter ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => onFilterChange(currentFilter.value)}
          >
            {currentFilter.label}
          </Button>
        ))}
        {(query.length > 0 || filter !== 'all') && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            <X className="h-4 w-4" />
            Limpar filtro
          </Button>
        )}
      </div>
      <p className="mt-3 text-sm font-medium text-slate-600">
        Exibindo {visibleCount} de {totalCount} itens
      </p>
    </div>
  )
}
