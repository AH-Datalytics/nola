import { useState, useEffect } from 'react';
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
import { AlertTriangle, Timer, Construction, Briefcase, Users } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import { COLORS, tooltipStyle, formatMonth, formatNumber } from '../utils/chartConfig';

// Import static data
import crimesData from '../data/crimes.json';
import responseTimesData from '../data/response-times.json';
import unemploymentData from '../data/unemployment.json';
import populationData from '../data/population.json';

export default function Overview() {
  const [potholeData, setPotholeData] = useState(null);
  const [potholeLoading, setPotholeLoading] = useState(true);
  const [potholeError, setPotholeError] = useState(null);
  const [crimesView, setCrimesView] = useState('monthly'); // 'monthly' or 'rolling'

  // Fetch 311 pothole data
  useEffect(() => {
    const fetchPotholeData = async () => {
      try {
        // Get open pothole count
        const openResponse = await fetch(
          `https://data.nola.gov/resource/2jgv-pqrq.json?$select=count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND request_status='Pending'`
        );

        if (!openResponse.ok) throw new Error('API request failed');

        const openData = await openResponse.json();
        const openCount = parseInt(openData[0]?.total || 0);

        // Get monthly trend for potholes (last 12 months)
        const trendResponse = await fetch(
          `https://data.nola.gov/resource/2jgv-pqrq.json?$select=date_trunc_ym(date_created) as month,count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND date_created>'2024-01-01'&$group=month&$order=month`
        );

        const trendData = await trendResponse.json();

        setPotholeData({
          openCount,
          monthlyTrend: trendData.map(d => ({
            month: d.month?.slice(0, 7) || '',
            count: parseInt(d.total || 0)
          })).filter(d => d.month)
        });
      } catch (err) {
        console.error('Error fetching 311 data:', err);
        setPotholeError('Unable to load 311 data');
      } finally {
        setPotholeLoading(false);
      }
    };

    fetchPotholeData();
  }, []);

  // Calculate KPI values
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Crimes YTD
  const crimesYTD = crimesData
    .filter(d => d.month.startsWith(`${currentYear}`))
    .reduce((sum, d) => sum + (d.murders || 0), 0);

  const lastYearCrimesYTD = crimesData
    .filter(d => {
      const [year, month] = d.month.split('-');
      return parseInt(year) === currentYear - 1 && parseInt(month) <= currentMonth;
    })
    .reduce((sum, d) => sum + (d.murders || 0), 0);

  const crimesTrend = lastYearCrimesYTD > 0
    ? ((crimesYTD - lastYearCrimesYTD) / lastYearCrimesYTD) * 100
    : 0;

  // Response time
  const latestResponseTime = responseTimesData.summary?.latestMedian || 0;
  const monthlyResponse = responseTimesData.monthly || [];
  const prevMonthResponse = monthlyResponse.length >= 2
    ? monthlyResponse[monthlyResponse.length - 2]?.median_response
    : latestResponseTime;
  const responseTrend = prevMonthResponse > 0
    ? ((latestResponseTime - prevMonthResponse) / prevMonthResponse) * 100
    : 0;

  // Unemployment
  const latestUnemployment = unemploymentData[unemploymentData.length - 1];
  const prevUnemployment = unemploymentData[unemploymentData.length - 2];
  const unemploymentTrend = prevUnemployment?.rate
    ? ((latestUnemployment.rate - prevUnemployment.rate) / prevUnemployment.rate) * 100
    : 0;

  // Population
  const latestPopulation = populationData[populationData.length - 1];
  const prevPopulation = populationData[populationData.length - 2];
  const populationTrend = prevPopulation?.population
    ? ((latestPopulation.population - prevPopulation.population) / prevPopulation.population) * 100
    : 0;

  // Prepare chart data - last 24 months
  const last24Months = crimesData.slice(-24).map(d => ({
    month: d.month,
    murders: d.murders
  }));

  // 12-month rolling average for crimes (need more data for calculation)
  const crimesRolling = crimesData.slice(-36).map((d, i, arr) => {
    if (i < 11) return { month: d.month, rolling: null };
    const window = arr.slice(i - 11, i + 1);
    const avg = window.reduce((sum, w) => sum + (w.murders || 0), 0) / 12;
    return { month: d.month, rolling: parseFloat(avg.toFixed(1)) };
  }).slice(-24);

  const responseChartData = monthlyResponse.slice(-24).map(d => ({
    month: d.month,
    median: d.median_response?.toFixed(1)
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Operations Overview</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Executive summary of key city metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Murders YTD"
          value={crimesYTD}
          subtitle={`${currentYear} through ${new Date().toLocaleString('default', { month: 'short' })}`}
          trend={crimesTrend}
          trendLabel={`vs ${lastYearCrimesYTD} same period last year`}
          icon={AlertTriangle}
          color="coral"
        />
        <KPICard
          title="Avg Response Time"
          value={`${latestResponseTime.toFixed(1)} min`}
          subtitle="Median dispatch to arrival"
          trend={responseTrend}
          trendLabel="vs previous month"
          icon={Timer}
          color="navy"
        />
        <KPICard
          title="Pending Pothole Requests"
          value={potholeLoading ? '...' : formatNumber(potholeData?.openCount || 0)}
          subtitle="Awaiting resolution"
          icon={Construction}
          color="gold"
          loading={potholeLoading}
        />
        <KPICard
          title="Unemployment Rate"
          value={`${latestUnemployment?.rate?.toFixed(1) || '-'}%`}
          subtitle={latestUnemployment?.month || ''}
          trend={unemploymentTrend}
          trendLabel="vs previous month"
          icon={Briefcase}
          color="teal"
        />
        <KPICard
          title="Population"
          value={`${(latestPopulation?.population / 1000).toFixed(0)}K`}
          subtitle={`${latestPopulation?.year} estimate`}
          trend={populationTrend}
          trendLabel="vs previous year"
          icon={Users}
          color="navy"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crimes trend with toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="font-semibold text-navy-900 text-sm lg:text-base">Murders</h3>
              <p className="text-xs lg:text-sm text-gray-500 mt-0.5">
                {crimesView === 'monthly' ? 'Monthly count, 24-month view' : '12-month rolling average'}
              </p>
            </div>
            <div className="flex bg-warm-gray-100 rounded-lg p-1 self-start sm:self-auto">
              <button
                onClick={() => setCrimesView('monthly')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  crimesView === 'monthly'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-gray-600 hover:text-navy-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCrimesView('rolling')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                  crimesView === 'rolling'
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-gray-600 hover:text-navy-900'
                }`}
              >
                12mo Rolling
              </button>
            </div>
          </div>
          <div className="p-3 lg:p-6">
            <ResponsiveContainer width="100%" height={280}>
              {crimesView === 'monthly' ? (
                <BarChart data={last24Months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    width={40}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value) => [value, 'Murders (monthly count)']}
                    labelFormatter={formatMonth}
                  />
                  <Bar
                    dataKey="murders"
                    fill={COLORS.coral}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={crimesRolling}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={formatMonth}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    width={40}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(value) => [value, 'Avg murders/month (12mo rolling)']}
                    labelFormatter={formatMonth}
                  />
                  <Line
                    type="monotone"
                    dataKey="rolling"
                    stroke={COLORS.coral}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.coral }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Response time trend */}
        <ChartCard title="Police Response Time" subtitle="Median minutes, 24-month trend">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={responseChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={40}
                domain={[0, 'auto']}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [`${value} min`, 'Median Response']}
                labelFormatter={formatMonth}
              />
              <Line
                type="monotone"
                dataKey="median"
                stroke={COLORS.navy}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: COLORS.navy }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* 311 Pothole chart */}
      <ChartCard
        title="311 Roadway Requests"
        subtitle="Monthly submissions (2024-present)"
        loading={potholeLoading}
      >
        {potholeError ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {potholeError}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={potholeData?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={50}
                domain={[0, 'auto']}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [formatNumber(value), 'Requests']}
                labelFormatter={formatMonth}
              />
              <Bar
                dataKey="count"
                fill={COLORS.gold}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  );
}
