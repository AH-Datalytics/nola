import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export default function DataTable({ columns, data, maxHeight = '400px', sortable = false }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const sortedData = useMemo(() => {
    if (!sortable || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      // Handle numeric strings and numbers
      if (typeof aVal === 'string' && !isNaN(parseFloat(aVal))) {
        aVal = parseFloat(aVal);
      }
      if (typeof bVal === 'string' && !isNaN(parseFloat(bVal))) {
        bVal = parseFloat(bVal);
      }

      // Handle '-' as null/lowest
      if (aVal === '-') aVal = sortConfig.direction === 'asc' ? Infinity : -Infinity;
      if (bVal === '-') bVal = sortConfig.direction === 'asc' ? Infinity : -Infinity;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig, sortable]);

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const getSortIcon = (key) => {
    if (!sortable) return null;
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-3 h-3 text-navy-600" />
      : <ChevronDown className="w-3 h-3 text-navy-600" />;
  };

  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-warm-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                onClick={() => handleSort(col.key)}
                className={`px-4 py-3 text-left font-semibold text-navy-900 border-b border-gray-200 ${
                  col.align === 'right' ? 'text-right' : ''
                } ${sortable ? 'cursor-pointer hover:bg-warm-gray-100 select-none' : ''}`}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {getSortIcon(col.key)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, rowIdx) => (
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
