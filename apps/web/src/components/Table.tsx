import type { ReactNode } from "react";

export interface TableColumn<Row> {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  className?: string;
}

export interface TableProps<Row> {
  columns: TableColumn<Row>[];
  data: Row[];
  getRowKey: (row: Row) => string | number;
  emptyState?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  className?: string;
  wrapperClassName?: string;
}

export default function Table<Row>({
  columns,
  data,
  getRowKey,
  emptyState = "No records found.",
  loading = false,
  loadingLabel = "Loading…",
  className = "",
  wrapperClassName = "",
}: TableProps<Row>) {
  return (
    <div className={["table-scroll", wrapperClassName].filter(Boolean).join(" ")}>
      <table className={["data-table", className].filter(Boolean).join(" ")}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={column.className}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} role="status" className="table-state">
                {loadingLabel}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="table-state">
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key} className={column.className}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
