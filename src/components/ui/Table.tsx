import type { ReactNode } from 'react';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
}

export function Table<T>({
  columns,
  rows,
  empty,
  rowClassName,
}: {
  columns: TableColumn<T>[];
  rows: T[];
  empty?: ReactNode;
  rowClassName?: (row: T, index: number) => string | undefined;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-30 text-xs font-semibold tracking-wide text-neutral-70 uppercase">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-2 font-medium first:pl-4 last:pr-4">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              className={`transition-ads border-b border-neutral-20 last:border-0 hover:bg-neutral-10 ${
                rowClassName?.(row, index) ?? ''
              }`}
              style={{ transitionProperty: 'background-color' }}
            >
              {columns.map((column) => {
                if (column.render) {
                  return (
                    <td key={column.key} className="px-3 py-2 align-middle first:pl-4 last:pr-4">
                      {column.render(row)}
                    </td>
                  );
                }

                const raw = (row as Record<string, unknown>)[column.key];
                const value = raw === null || raw === undefined || raw === '' ? '—' : String(raw);

                return (
                  <td key={column.key} className="px-3 py-2 align-middle first:pl-4 last:pr-4">
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="p-4">
          {empty ?? <p className="text-center text-sm text-neutral-70">Nothing to show.</p>}
        </div>
      )}
    </div>
  );
}
