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
  Cell,
} from 'recharts';
import { Timer, AlertTriangle, MapPin, Phone, TrendingDown, Clock } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { COLORS, CHART_COLORS, tooltipStyle, formatMonth, formatMinutes, formatNumber } from '../utils/chartConfig';

import responseData from '../data/response-times.json';

export default function PoliceResponse() {
  const { monthly, byDistrict, byType, distribution, byPriority, summary } = responseData;
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

    return {
      latestMedian: latestMonth?.median_response,
      emergencyMedian: latestMonth?.emergency_median,
      monthlyChange,
      yearlyChange,
      totalCalls: summary?.totalCalls || 0,
    };
  }, [monthly, summary]);

  // Last 24 months for charts
  const trendData = useMemo(() => {
    return (monthly || []).slice(-24).map(d => ({
      month: d.month,
      median: d.median_response?.toFixed(1),
      mean: d.mean_response?.toFixed(1),
      p90: d.p90_response?.toFixed(1),
      emergencyMedian: d.emergency_median?.toFixed(1),
      emergencyMean: d.emergency_mean?.toFixed(1),
      emergencyP90: d.emergency_p90?.toFixed(1),
      nonEmergencyMedian: d.non_emergency_median?.toFixed(1),
      nonEmergencyMean: d.non_emergency_mean?.toFixed(1),
      nonEmergencyP90: d.non_emergency_p90?.toFixed(1),
    }));
  }, [monthly]);

  // Get the emergency/non-emergency dataKeys based on selected metric
  const emergencyKey = metricType === 'median' ? 'emergencyMedian' : metricType === 'mean' ? 'emergencyMean' : 'emergencyP90';
  const nonEmergencyKey = metricType === 'median' ? 'nonEmergencyMedian' : metricType === 'mean' ? 'nonEmergencyMean' : 'nonEmergencyP90';

  // Get the current metric label for display
  const metricLabels = {
    median: 'Median',
    mean: 'Average',
    p90: '90th Percentile',
  };

  // District data for bar chart
  const districtData = useMemo(() => {
    return (byDistrict || [])
      .filter(d => d.district > 0)
      .sort((a, b) => a.district - b.district)
      .map(d => ({
        district: `District ${d.district}`,
        median: d.median_response?.toFixed(1),
        calls: d.call_count,
      }));
  }, [byDistrict]);

  // Call type data
  const typeData = useMemo(() => {
    return (byType || []).slice(0, 10).map(d => ({
      type: d.type,
      median: d.median_response?.toFixed(1),
      calls: d.call_count,
    }));
  }, [byType]);

  // Distribution data
  const distributionData = useMemo(() => {
    return (distribution || []).map(d => ({
      bucket: d.bucket,
      count: d.count,
    }));
  }, [distribution]);

  const tableColumns = [
    { key: 'type', header: 'Call Type' },
    { key: 'median', header: 'Median (min)', align: 'right' },
    {
      key: 'calls',
      header: 'Total Calls',
      align: 'right',
      render: (val) => formatNumber(val)
    },
  ];

  const districtTableColumns = [
    { key: 'district', header: 'District' },
    { key: 'median', header: 'Median Response', align: 'right', render: (val) => `${val} min` },
    { key: 'calls', header: 'Total Calls', align: 'right', render: (val) => formatNumber(val) },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Police Response Times</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Call for service response analysis (dispatch to arrival)</p>
      </div>

      {/* Context banner */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
        <TrendingDown className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-teal-800 font-medium">
            NOPD reported significant improvements in response times
          </p>
          <p className="text-sm text-teal-700 mt-1">
            The department has focused on reducing dispatch-to-arrival times as a key performance metric.
            Data below shows median response times across {formatNumber(stats.totalCalls)} calls since 2015.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Current Median Response"
          value={`${stats.latestMedian?.toFixed(1) || '-'} min`}
          subtitle="Latest month, all calls"
          trend={stats.monthlyChange}
          trendLabel="vs previous month"
          icon={Timer}
          color="navy"
        />
        <KPICard
          title="Emergency Response"
          value={`${stats.emergencyMedian?.toFixed(1) || '-'} min`}
          subtitle="Priority 0-1 calls"
          icon={AlertTriangle}
          color="coral"
        />
        <KPICard
          title="Year-over-Year Change"
          value={`${stats.yearlyChange > 0 ? '+' : ''}${stats.yearlyChange?.toFixed(1) || 0}%`}
          subtitle="Same month comparison"
          icon={Clock}
          color={stats.yearlyChange < 0 ? 'teal' : 'coral'}
        />
        <KPICard
          title="Total Calls Analyzed"
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
              {metricLabels[metricType]} minutes by priority level, 24-month view
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
              formatter={(value, name) => [`${value} min`, name]}
              labelFormatter={formatMonth}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey={metricType}
              name={`All Calls (${metricLabels[metricType]})`}
              stroke={COLORS.navy}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey={emergencyKey}
              name={`Emergency (${metricLabels[metricType]})`}
              stroke={COLORS.coral}
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            <Line
              type="monotone"
              dataKey={nonEmergencyKey}
              name={`Non-Emergency (${metricLabels[metricType]})`}
              stroke={COLORS.teal}
              strokeWidth={2}
              dot={false}
              strokeDasharray="3 3"
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By District */}
        <ChartCard
          title="Response Time by District"
          subtitle="Median minutes by NOPD district"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={districtData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                domain={[0, 'auto']}
              />
              <YAxis
                type="category"
                dataKey="district"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={80}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value, name) => {
                  if (name === 'median') return [`${value} min`, 'Median Response'];
                  return [formatNumber(value), 'Calls'];
                }}
              />
              <Bar dataKey="median" fill={COLORS.navy} radius={[0, 4, 4, 0]}>
                {districtData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={parseFloat(entry.median) > 20 ? COLORS.coral : COLORS.navy}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Distribution histogram */}
        <ChartCard
          title="Response Time Distribution"
          subtitle="Call count by response time bucket"
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={distributionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 10, fill: '#6B7280' }}
                label={{ value: 'Minutes', position: 'insideBottom', offset: -5, style: { fontSize: 11 } }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={60}
                domain={[0, 'auto']}
                tickFormatter={(val) => formatNumber(val)}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [formatNumber(value), 'Calls']}
                labelFormatter={(label) => `${label} minutes`}
              />
              <Bar dataKey="count" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Response by call type table */}
      <ChartCard
        title="Response Time by Call Type"
        subtitle="Top call types by volume"
      >
        <DataTable
          columns={tableColumns}
          data={typeData}
          maxHeight="400px"
        />
      </ChartCard>

      {/* District detail table */}
      <ChartCard
        title="District Performance Detail"
        subtitle="All districts with call volumes"
      >
        <DataTable
          columns={districtTableColumns}
          data={districtData}
          maxHeight="320px"
        />
      </ChartCard>
    </div>
  );
}
