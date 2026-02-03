// NOLA Dashboard Chart Color Palette
export const COLORS = {
  navy: '#1B2A4A',
  navyLight: '#2D4A7C',
  gold: '#D4AF37',
  goldLight: '#E5C158',
  teal: '#2A9D8F',
  tealLight: '#40B4A6',
  coral: '#E76F51',
  slateBlue: '#577590',
  warmGray: '#9CA3AF',
};

// Chart color sequences for different uses
export const CHART_COLORS = [
  COLORS.navy,
  COLORS.gold,
  COLORS.teal,
  COLORS.coral,
  COLORS.slateBlue,
  COLORS.navyLight,
  COLORS.goldLight,
  COLORS.tealLight,
];

// For status indicators
export const STATUS_COLORS = {
  open: COLORS.coral,
  closed: COLORS.teal,
  pending: COLORS.gold,
};

// Custom tooltip style
export const tooltipStyle = {
  contentStyle: {
    backgroundColor: 'white',
    border: '1px solid #E0E0D8',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '12px',
  },
  labelStyle: {
    color: '#1B2A4A',
    fontWeight: 600,
    marginBottom: '4px',
  },
};

// Format helpers
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '-';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
};

export const formatPercent = (num, decimals = 1) => {
  if (num === null || num === undefined) return '-';
  return `${num.toFixed(decimals)}%`;
};

export const formatMinutes = (num) => {
  if (num === null || num === undefined) return '-';
  if (num >= 60) {
    const hours = Math.floor(num / 60);
    const mins = Math.round(num % 60);
    return `${hours}h ${mins}m`;
  }
  return `${num.toFixed(1)} min`;
};

export const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
};

export const formatMonthFull = (dateStr) => {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[parseInt(month) - 1]} ${year}`;
};
