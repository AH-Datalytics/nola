import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { COLORS, CHART_COLORS, tooltipStyle, formatMonth, formatMonthFull } from '../utils/chartConfig';

import crimesData from '../data/crimes.json';

export default function Crime() {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [trendView, setTrendView] = useState('monthly'); // 'monthly' or 'rolling'

  // Calculate statistics
  const stats = useMemo(() => {
    const currentYearData = crimesData.filter(d => d.month.startsWith(`${currentYear}`));
    const lastYearData = crimesData.filter(d => d.month.startsWith(`${currentYear - 1}`));
    const twoYearsAgoData = crimesData.filter(d => d.month.startsWith(`${currentYear - 2}`));

    const ytd = currentYearData.reduce((sum, d) => sum + (d.murders || 0), 0);
    const lastYearYtd = lastYearData
      .filter(d => parseInt(d.month.split('-')[1]) <= currentMonth)
      .reduce((sum, d) => sum + (d.murders || 0), 0);
    const lastYearTotal = lastYearData.reduce((sum, d) => sum + (d.murders || 0), 0);

    const monthlyAvg = currentYearData.length > 0
      ? ytd / currentYearData.length
      : 0;

    const highestMonth = currentYearData.reduce((max, d) =>
      (d.murders || 0) > (max?.murders || 0) ? d : max
    , null);

    const ytdChange = lastYearYtd > 0
      ? ((ytd - lastYearYtd) / lastYearYtd) * 100
      : 0;

    return {
      ytd,
      lastYearYtd,
      lastYearTotal,
      monthlyAvg,
      highestMonth,
      ytdChange,
    };
  }, [currentYear, currentMonth]);

  // Year-over-year comparison data
  const yoyData = useMemo(() => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return months.map((m, i) => {
      const monthNum = parseInt(m);
      const currentYearEntry = crimesData.find(d => d.month === `${currentYear}-${m}`);
      const lastYearVal = crimesData.find(d => d.month === `${currentYear - 1}-${m}`)?.murders ?? 0;
      const twoYearsVal = crimesData.find(d => d.month === `${currentYear - 2}-${m}`)?.murders ?? 0;

      // Only show current year data for months that have data (not future months)
      const currentYearVal = currentYearEntry ? currentYearEntry.crimes : null;

      return {
        month: monthNames[i],
        current: currentYearVal,
        lastYear: lastYearVal,
        twoYearsAgo: twoYearsVal,
      };
    });
  }, [currentYear]);

  // Cumulative comparison data (2025 vs 2024 since 2026 just started)
  const cumulativeData = useMemo(() => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let cumulative2025 = 0;
    let cumulative2024 = 0;

    return months.map((m, i) => {
      const entry2025 = crimesData.find(d => d.month === `2025-${m}`);
      const val2024 = crimesData.find(d => d.month === `2024-${m}`)?.murders ?? 0;

      if (entry2025) cumulative2025 += entry2025.murders;
      cumulative2024 += val2024;

      return {
        month: monthNames[i],
        cumulative2025: entry2025 ? cumulative2025 : null,
        cumulative2024,
      };
    });
  }, []);

  // Long-term trend (10 years)
  const longTermData = useMemo(() => {
    return crimesData.slice(-120); // Last 10 years
  }, []);

  // 12-month rolling average
  const rollingData = useMemo(() => {
    const data = crimesData.slice(-120);
    return data
      .map((d, i) => {
        if (i < 11) return null; // Need 12 months for rolling average
        const window = data.slice(i - 11, i + 1);
        const avg = window.reduce((sum, w) => sum + (w.murders || 0), 0) / 12;
        return { month: d.month, rolling: parseFloat(avg.toFixed(1)) };
      })
      .filter(d => d !== null);
  }, []);

  // Monthly table data (2025 vs 2024)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const tableData = useMemo(() => {
    return crimesData
      .filter(d => d.month.startsWith('2025'))
      .map(d => ({
        month: monthNames[parseInt(d.month.split('-')[1]) - 1],
        murders2025: d.murders,
        murders2024: crimesData.find(m => m.month === `2024-${d.month.split('-')[1]}`)?.murders || 0,
      }))
      .map(d => ({
        ...d,
        change: d.murders2024 > 0 ? ((d.murders2025 - d.murders2024) / d.murders2024 * 100).toFixed(1) : '-',
      }));
  }, []);

  const tableColumns = [
    { key: 'month', header: 'Month' },
    { key: 'murders2025', header: '2025', align: 'right' },
    { key: 'murders2024', header: '2024', align: 'right' },
    {
      key: 'change',
      header: 'Change',
      align: 'right',
      render: (val) => {
        if (val === '-') return '-';
        const num = parseFloat(val);
        const color = num > 0 ? 'text-coral-500' : num < 0 ? 'text-teal-500' : 'text-gray-500';
        return <span className={color}>{num > 0 ? '+' : ''}{val}%</span>;
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Crime Statistics</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Crime trends and analysis for New Orleans</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={`Murders YTD (${currentYear})`}
          value={stats.ytd}
          trend={stats.ytdChange}
          trendLabel={`vs ${stats.lastYearYtd} same period ${currentYear - 1}`}
          icon={AlertTriangle}
          color="coral"
        />
        <KPICard
          title="Monthly Average"
          value={stats.monthlyAvg.toFixed(1)}
          subtitle={`${currentYear} through ${new Date().toLocaleString('default', { month: 'long' })}`}
          icon={BarChart3}
          color="navy"
        />
        <KPICard
          title="Highest Month"
          value={stats.highestMonth?.murders || '-'}
          subtitle={stats.highestMonth ? formatMonthFull(stats.highestMonth.month) : '-'}
          icon={TrendingUp}
          color="coral"
        />
        <KPICard
          title={`Total ${currentYear - 1}`}
          value={stats.lastYearTotal}
          subtitle="Full year comparison"
          icon={Calendar}
          color="navy"
        />
      </div>

      {/* Main trend chart */}
      <ChartCard
        title="Monthly Murder Count"
        subtitle="Year-over-year comparison"
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={yoyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              width={40}
              domain={[0, 'auto']}
            />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Line
              type="monotone"
              dataKey="current"
              name={`${currentYear}`}
              stroke={COLORS.coral}
              strokeWidth={2.5}
              dot={{ fill: COLORS.coral, r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="lastYear"
              name={`${currentYear - 1}`}
              stroke={COLORS.navy}
              strokeWidth={2}
              dot={{ fill: COLORS.navy, r: 2 }}
            />
            <Line
              type="monotone"
              dataKey="twoYearsAgo"
              name={`${currentYear - 2}`}
              stroke={COLORS.teal}
              strokeWidth={2}
              dot={{ fill: COLORS.teal, r: 2 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumulative chart */}
        <ChartCard
          title="Cumulative Murder Total"
          subtitle="2025 vs 2024 running total"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={40}
                domain={[0, 'auto']}
              />
              <Tooltip {...tooltipStyle} />
              <Legend />
              <Line
                type="monotone"
                dataKey="cumulative2025"
                name="2025"
                stroke={COLORS.coral}
                strokeWidth={2.5}
                dot={{ fill: COLORS.coral, r: 3 }}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="cumulative2024"
                name="2024"
                stroke={COLORS.navy}
                strokeWidth={2}
                dot={{ fill: COLORS.navy, r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly comparison table */}
        <ChartCard
          title="Monthly Breakdown"
          subtitle="2025 vs 2024 murders by month"
        >
          <DataTable
            columns={tableColumns}
            data={tableData}
            maxHeight="280px"
          />
        </ChartCard>
      </div>

      {/* Long-term trend with toggle */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-navy-900">10-Year Trend</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {trendView === 'monthly' ? 'Monthly murder counts' : 'Average murders rolling over 12 months'}
            </p>
          </div>
          <div className="flex bg-warm-gray-100 rounded-lg p-1">
            <button
              onClick={() => setTrendView('monthly')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                trendView === 'monthly'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTrendView('rolling')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                trendView === 'rolling'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              12mo Rolling
            </button>
          </div>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            {trendView === 'monthly' ? (
              <BarChart data={longTermData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" vertical={false} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(val) => {
                    const [year, month] = val.split('-');
                    return month === '01' ? year : '';
                  }}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  interval={0}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  width={40}
                  domain={[0, 'auto']}
                  label={{ value: 'Count', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6B7280' } }}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [value, 'Murders (monthly count)']}
                  labelFormatter={formatMonthFull}
                />
                <Bar
                  dataKey="murders"
                  fill={COLORS.coral}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={rollingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(val) => {
                    const [year, month] = val.split('-');
                    return month === '01' ? year : '';
                  }}
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  interval={11}
                  label={{ value: 'Year', position: 'insideBottom', offset: -5, style: { fontSize: 11, fill: '#6B7280' } }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  width={40}
                  domain={[0, 'auto']}
                  label={{ value: '12mo Avg', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6B7280' } }}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [value, 'Avg murders/month (12mo rolling)']}
                  labelFormatter={formatMonthFull}
                />
                <Line
                  type="monotone"
                  dataKey="rolling"
                  stroke={COLORS.coral}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: COLORS.coral }}
                  connectNulls={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
