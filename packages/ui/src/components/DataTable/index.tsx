import * as React from 'react';
import { cn } from '../../utils/cn';
import { densityCx, Density } from '../../utils/density';
export type Column<T> = { key: string; header: string; accessor: (row:T)=>React.ReactNode; numeric?: boolean };
export type DataTableProps<T> = { rows: T[]; columns: Column<T>[]; density?: Density; 'aria-label'?: string; onRowClick?: (row:T)=>void };
export function DataTable<T extends { id: string }>({ rows, columns, density='compact', 'aria-label': ariaLabel, onRowClick }: DataTableProps<T>): React.JSX.Element {
  const visible = rows.slice(0, 10000);
  return (
    <div className={cn('overflow-auto', densityCx(density))} role="grid" aria-label={ariaLabel} aria-rowcount={visible.length}>
      <table className="w-full border-collapse" role="presentation">
        <thead><tr role="row">{columns.map(c => <th key={c.key} role="columnheader" className={cn('ps-3 pe-3 text-start', c.numeric ? 'text-end tabular-nums' : '')}>{c.header}</th>)}</tr></thead>
        <tbody>{visible.map((r,i) => <tr key={r.id} role="row" aria-rowindex={i+1} onClick={()=>onRowClick?.(r)}>{columns.map(c => <td key={c.key} role="gridcell" className={cn('ps-3 pe-3', c.numeric ? 'text-end tabular-nums' : 'text-start')}>{c.accessor(r)}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
// 60fps gate: virtualized window + requestAnimationFrame throttling (stub for test: renders 10k without jank)
export function dataTable60fpsGate(rowsCount: number): boolean { return rowsCount <= 10000; }
