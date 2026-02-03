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
      <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-start justify-between mb-3 lg:mb-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-200 rounded-lg" />
          <div className="w-14 h-4 lg:w-16 lg:h-5 bg-gray-200 rounded" />
        </div>
        <div className="w-20 h-6 lg:w-24 lg:h-8 bg-gray-200 rounded mb-2" />
        <div className="w-28 h-3 lg:w-32 lg:h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100 card-hover">
      <div className="flex items-start justify-between mb-3 lg:mb-4">
        {Icon && (
          <div className={`p-2 lg:p-2.5 rounded-lg ${iconBgClasses[color]}`}>
            <Icon className={`w-4 h-4 lg:w-5 lg:h-5 ${colorClasses[color]}`} />
          </div>
        )}
        {trend !== undefined && trend !== null && (
          <div className={`flex items-center gap-1 text-xs lg:text-sm font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className={`text-2xl lg:text-3xl font-bold mb-1 ${colorClasses[color]}`}>
        {value}
      </div>

      <div className="text-xs lg:text-sm text-gray-600 font-medium">{title}</div>

      {subtitle && <div className="text-xs text-gray-400 mt-1 truncate">{subtitle}</div>}

      {trendLabel && (
        <div className="text-xs text-gray-500 mt-2 hidden sm:block">{trendLabel}</div>
      )}
    </div>
  );
}
