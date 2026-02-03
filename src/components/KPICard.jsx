import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function KPICard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  loading,
  color = 'navy',
}) {
  const colorClasses = {
    navy: 'text-navy-800',
    gold: 'text-gold-500',
    teal: 'text-teal-500',
    coral: 'text-coral-500',
  };

  const iconBgClasses = {
    navy: 'bg-navy-100',
    gold: 'bg-gold-100',
    teal: 'bg-teal-100',
    coral: 'bg-coral-100',
  };

  const getTrendIcon = () => {
    if (trend === undefined || trend === null) return null;
    if (trend > 0) return <TrendingUp className="w-4 h-4" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === undefined || trend === null) return 'text-gray-500';
    // For murders/crime, down is good (green), up is bad (red)
    // For economy/addresses, up is good, down is bad
    // The caller should handle this by passing the appropriate trend sign
    if (trend > 0) return 'text-coral-500';
    if (trend < 0) return 'text-teal-500';
    return 'text-gray-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-16 h-5 bg-gray-200 rounded" />
        </div>
        <div className="w-24 h-8 bg-gray-200 rounded mb-2" />
        <div className="w-32 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-start justify-between mb-4">
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBgClasses[color]}`}>
            <Icon className={`w-5 h-5 ${colorClasses[color]}`} />
          </div>
        )}
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className={`text-3xl font-bold mb-1 ${colorClasses[color]}`}>
        {value}
      </div>

      <div className="text-sm text-gray-600 font-medium">{title}</div>

      {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}

      {trendLabel && (
        <div className="text-xs text-gray-500 mt-2">{trendLabel}</div>
      )}
    </div>
  );
}
