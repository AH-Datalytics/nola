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
import { Timer, TrendingUp, TrendingDown, Phone, Clock, Calendar } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { COLORS, tooltipStyle, formatMonth, formatNumber } from '../utils/chartConfig';

import responseData from '../data/response-times.json';

export default function PoliceResponse() {
  const { monthly, summary } = responseData;
  const [metricType, setMetricType] = useState('median'); // 'median', 'mean', 'p90'

  // Calculate trends
  const stats = useMemo(() => {
    if (!monthly || monthly.length < 2) return {};

    const latestMonth = monthly[monthly.length - 1];
    const prevMonth = monthly[monthly.length - 2];
    const yearAgoMonth = monthly.find(m => {
      const [y, mo] = m.month.split('-');
      const [ly, lm] = latestMonth.month.split('-');
      return parseInt(y) === parseInt(ly) - 1 && mo === lm;
    });

    const monthlyChange = prevMonth?.median_response
      ? ((latestMonth.median_response - prevMonth.median_response) / prevMonth.median_response) * 100
      : 0;

    const yearlyChange = yearAgoMonth?.median_response
      ? ((latestMonth.median_response - yearAgoMonth.median_response) / yearAgoMonth.median_response) * 100
      : 0;

    // Calculate averages
    const last12 = monthly.slice(-12);
    const avg12Month = last12.reduce((sum, m) => sum + m.median_response, 0) / last12.length;

    // Find best and worst months in last 12
    const best = last12.reduce((min, m) => m.median_response < min.median_response ? m : min, last12[0]);
    const worst = last12.reduce((max, m) => m.median_response > max.median_response ? m : max, last12[0]);

    return {
      latestMedian: latestMonth?.median_response,
      latestMean: latestMonth?.mean_response,
      latestP90: latestMonth?.p90_response,
      latestMonth: latestMonth?.month,
      monthlyChange,
      yearlyChange,
      totalCalls: summary?.totalCalls || 0,
      avg12Month,
      bestMonth: best,
      worstMonth: worst,
    };
  }, [monthly, summary]);

  // Get the current metric label for display
  const metricLabels = {
    median: 'Median',
    mean: 'Average',
    p90: '90th Percentile',
  };

  // Last 24 months for main chart
  const trendData = useMemo(() => {
    return (monthly || []).slice(-24).map(d => ({
      month: d.month,
      median: parseFloat(d.median_response?.toFixed(1)),
      mean: parseFloat(d.mean_response?.toFixed(1)),
      p90: parseFloat(d.p90_response?.toFixed(1)),
      calls: d.call_count,
    }));
  }, [monthly]);

  // Full history for long-term chart
  const fullHistory = useMemo(() => {
    return (monthly || []).map(d => ({
      month: d.month,
      median: parseFloat(d.median_response?.toFixed(1)),
      mean: parseFloat(d.mean_response?.toFixed(1)),
      p90: parseFloat(d.p90_response?.toFixed(1)),
    }));
  }, [monthly]);

  // Monthly incidents chart data
  const incidentsData = useMemo(() => {
    return (monthly || []).slice(-24).map(d => ({
      month: d.month,
      calls: d.call_count,
    }));
  }, [monthly]);

  // Table data - monthly breakdown
  const tableData = useMemo(() => {
    return (monthly || []).slice(-12).reverse().map(d => ({
      month: formatMonth(d.month),
      median: `${d.median_response?.toFixed(1)} min`,
      mean: `${d.mean_response?.toFixed(1)} min`,
      p90: `${d.p90_response?.toFixed(1)} min`,
      calls: d.call_count,
    }));
  }, [monthly]);

  const tableColumns = [
    { key: 'month', header: 'Month' },
    { key: 'median', header: 'Median', align: 'right' },
    { key: 'mean', header: 'Average', align: 'right' },
    { key: 'p90', header: '90th %ile', align: 'right' },
    { key: 'calls', header: 'Incidents', align: 'right', render: (val) => formatNumber(val) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Police Response Times</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Daily average response time analysis</p>
      </div>

      {/* Context banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
        <TrendingDown className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-teal-800 font-medium">
            Response time tracking since 2015
          </p>
          <p className="text-sm text-teal-700 mt-1">
            Data shows daily average response times across {formatNumber(stats.totalCalls)} total incidents.
            Use the toggle to view median, average, or 90th percentile response times.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Median Response"
          value={`${stats.latestMedian?.toFixed(1) || '-'} min`}
          subtitle={formatMonth(stats.latestMonth)}
          trend={stats.monthlyChange}
          trendLabel="vs previous month"
          icon={Timer}
          color="navy"
        />
        <KPICard
          title="Year-over-Year Change"
          value={`${stats.yearlyChange > 0 ? '+' : ''}${stats.yearlyChange?.toFixed(1) || 0}%`}
          subtitle="Same month comparison"
          icon={stats.yearlyChange < 0 ? TrendingDown : TrendingUp}
          color={stats.yearlyChange < 0 ? 'teal' : 'coral'}
        />
        <KPICard
          title="12-Month Average"
          value={`${stats.avg12Month?.toFixed(1) || '-'} min`}
          subtitle="Rolling median average"
          icon={Clock}
          color="navy"
        />
        <KPICard
          title="Total Incidents"
          value={formatNumber(stats.totalCalls)}
          subtitle="Since 2015"
          icon={Phone}
          color="navy"
        />
      </div>

      {/* Main trend chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-semibold text-navy-900 text-sm lg:text-base">Response Time Trend</h3>
            <p className="text-xs lg:text-sm text-gray-500 mt-0.5">
              {metricLabels[metricType]} minutes, 24-month view
            </p>
          </div>
          <div className="flex bg-warm-gray-100 rounded-lg p-1 self-start sm:self-auto">
            <button
              onClick={() => setMetricType('median')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                metricType === 'median'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              Median
            </button>
            <button
              onClick={() => setMetricType('mean')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                metricType === 'mean'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              Avg
            </button>
            <button
              onClick={() => setMetricType('p90')}
              className={`px-2 lg:px-3 py-1 lg:py-1.5 text-xs lg:text-sm font-medium rounded-md transition-colors ${
                metricType === 'p90'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-navy-900'
              }`}
            >
              90th
            </button>
          </div>
        </div>
        <div className="p-3 lg:p-6">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={45}
                domain={[0, 'auto']}
                label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6B7280' } }}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value, name) => [`${value} min`, metricLabels[metricType]]}
                labelFormatter={formatMonth}
              />
              <Line
                type="monotone"
                dataKey={metricType}
                name={metricLabels[metricType]}
                stroke={COLORS.navy}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Long-term trend */}
        <ChartCard
          title="Long-Term Trend"
          subtitle="Full history since 2015"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={fullHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tickFormatter={(val) => {
                  const [year, month] = val.split('-');
                  return month === '01' ? year : '';
                }}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval={11}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={40}
                domain={[0, 'auto']}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [`${value} min`, 'Median']}
                labelFormatter={formatMonth}
              />
              <Line
                type="monotone"
                dataKey="median"
                stroke={COLORS.navy}
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly incidents */}
        <ChartCard
          title="Monthly Incident Volume"
          subtitle="Number of calls per month"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incidentsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={50}
                domain={[0, 'auto']}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [formatNumber(value), 'Incidents']}
                labelFormatter={formatMonth}
              />
              <Bar dataKey="calls" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly breakdown table */}
      <ChartCard
        title="Monthly Breakdown"
        subtitle="Last 12 months detail"
      >
        <DataTable
          columns={tableColumns}
          data={tableData}
          maxHeight="400px"
        />
      </ChartCard>
    </div>
  );
}
