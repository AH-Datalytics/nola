export default function DataTable({ columns, data, maxHeight = '400px' }) {
  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-warm-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-left font-semibold text-navy-900 border-b border-gray-200 ${
                  col.align === 'right' ? 'text-right' : ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`px-4 py-3 ${col.align === 'right' ? 'text-right' : ''} ${
                    col.className || ''
                  }`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
