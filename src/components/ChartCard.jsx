import { Loader2 } from 'lucide-react';

export default function ChartCard({ title, subtitle, children, loading, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-navy-900">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-navy-600 animate-spin" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
