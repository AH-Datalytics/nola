import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Construction, RefreshCw, Clock, CheckCircle, AlertCircle, MapPin } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { COLORS, STATUS_COLORS, tooltipStyle, formatNumber, formatMonth } from '../utils/chartConfig';

const API_BASE = 'https://data.nola.gov/resource/2jgv-pqrq.json';

export default function ThreeOneOne() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [data, setData] = useState({
    openPotholes: 0,
    totalPotholesYTD: 0,
    avgDaysToClose: 0,
    openPercent: 0,
    monthlyTrend: [],
    statusBreakdown: [],
    byDistrict: [],
    topRequestTypes: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch multiple queries in parallel
      const [
        openPotholesRes,
        totalPotholesRes,
        closedPotholesRes,
        monthlyTrendRes,
        statusRes,
        districtRes,
        topTypesRes,
      ] = await Promise.all([
        // Open pothole count
        fetch(`${API_BASE}?$select=count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND request_status='Pending'`),
        // Total potholes YTD
        fetch(`${API_BASE}?$select=count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND date_created>='2024-01-01'`),
        // Closed potholes with time to close
        fetch(`${API_BASE}?$select=avg(date_diff_d(case_close_date,date_created)) as avg_days&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND request_status='Closed' AND case_close_date>='2024-01-01'`),
        // Monthly trend
        fetch(`${API_BASE}?$select=date_trunc_ym(date_created) as month,count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND date_created>='2023-01-01'&$group=month&$order=month`),
        // Status breakdown for potholes
        fetch(`${API_BASE}?$select=request_status,count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND date_created>='2024-01-01'&$group=request_status`),
        // By district
        fetch(`${API_BASE}?$select=address_councildis,count(*) as total&$where=request_type='Roads and Streets' AND request_reason='Pothole' AND date_created>='2024-01-01' AND address_councildis IS NOT NULL&$group=address_councildis&$order=total DESC`),
        // Top request types (all types, not just potholes)
        fetch(`${API_BASE}?$select=request_type,request_status,count(*) as total&$where=date_created>='2024-01-01'&$group=request_type,request_status&$order=total DESC&$limit=100`),
      ]);

      // Check responses
      if (!openPotholesRes.ok || !totalPotholesRes.ok) {
        throw new Error('API request failed');
      }

      const [
        openPotholesData,
        totalPotholesData,
        closedData,
        monthlyData,
        statusData,
        districtData,
        topTypesData,
      ] = await Promise.all([
        openPotholesRes.json(),
        totalPotholesRes.json(),
        closedPotholesRes.json(),
        monthlyTrendRes.json(),
        statusRes.json(),
        districtRes.json(),
        topTypesRes.json(),
      ]);

      // Process top types data - aggregate by type and calculate open count
      const typeMap = new Map();
      topTypesData.forEach(item => {
        const type = item.request_type;
        if (!typeMap.has(type)) {
          typeMap.set(type, { type, total: 0, open: 0 });
        }
        const entry = typeMap.get(type);
        entry.total += parseInt(item.total || 0);
        if (item.request_status === 'Pending') {
          entry.open += parseInt(item.total || 0);
        }
      });

      const topTypes = Array.from(typeMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 15)
        .map(t => ({
          ...t,
          openPercent: ((t.open / t.total) * 100).toFixed(1),
          isPothole: t.type === 'Roads and Streets',
        }));

      // Calculate metrics
      const openPotholes = parseInt(openPotholesData[0]?.total || 0);
      const totalPotholesYTD = parseInt(totalPotholesData[0]?.total || 0);
      const avgDaysToClose = parseFloat(closedData[0]?.avg_days || 0);
      const openPercent = totalPotholesYTD > 0 ? (openPotholes / totalPotholesYTD * 100) : 0;

      // Process monthly trend
      const monthlyTrend = monthlyData
        .filter(d => d.month)
        .map(d => ({
          month: d.month.slice(0, 7),
          count: parseInt(d.total || 0),
        }));

      // Process status breakdown
      const statusBreakdown = statusData.map(d => ({
        status: d.request_status,
        count: parseInt(d.total || 0),
      }));

      // Process district data
      const byDistrict = districtData
        .filter(d => d.address_councildis)
        .map(d => ({
          district: `District ${d.address_councildis}`,
          count: parseInt(d.total || 0),
        }));

      setData({
        openPotholes,
        totalPotholesYTD,
        avgDaysToClose,
        openPercent,
        monthlyTrend,
        statusBreakdown,
        byDistrict,
        topRequestTypes: topTypes,
      });

      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching 311 data:', err);
      setError('Unable to load 311 data. The API may be temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const statusColors = {
    'Open': STATUS_COLORS.open,
    'Closed': STATUS_COLORS.closed,
    'Pending': STATUS_COLORS.pending,
  };

  const tableColumns = [
    {
      key: 'type',
      header: 'Request Type',
      render: (val, row) => (
        <span className={row.isPothole ? 'font-semibold text-gold-500' : ''}>
          {val}
          {row.isPothole && <span className="ml-2 text-xs bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded">Pothole</span>}
        </span>
      ),
    },
    { key: 'total', header: 'Total Requests', align: 'right', render: (val) => formatNumber(val) },
    { key: 'open', header: 'Pending', align: 'right', render: (val) => formatNumber(val) },
    {
      key: 'openPercent',
      header: '% Pending',
      align: 'right',
      render: (val) => (
        <span className={parseFloat(val) > 30 ? 'text-coral-500 font-medium' : ''}>
          {val}%
        </span>
      ),
    },
  ];

  if (error && !data.openPotholes) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">311 Service Requests</h1>
          <p className="text-gray-500 mt-1">Pothole and infrastructure requests</p>
        </div>
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-coral-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-coral-800 mb-2">Data Unavailable</h3>
          <p className="text-coral-700 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-coral-500 text-white rounded-lg hover:bg-coral-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">311 Service Requests</h1>
          <p className="text-gray-500 mt-1">Pothole and roadway infrastructure tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-navy-800 text-white rounded-lg hover:bg-navy-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Live data banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm text-blue-800">
          Live data from NOLA 311 Socrata API
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Pending Pothole Requests"
          value={formatNumber(data.openPotholes)}
          subtitle="Awaiting resolution"
          icon={Construction}
          color="gold"
          loading={loading}
        />
        <KPICard
          title="Total Requests YTD"
          value={formatNumber(data.totalPotholesYTD)}
          subtitle="Roadway/sidewalk issues in 2024"
          icon={MapPin}
          color="navy"
          loading={loading}
        />
        <KPICard
          title="Avg Days to Close"
          value={data.avgDaysToClose.toFixed(1)}
          subtitle="Mean resolution time"
          icon={Clock}
          color="teal"
          loading={loading}
        />
        <KPICard
          title="Still Pending"
          value={`${data.openPercent.toFixed(1)}%`}
          subtitle="Of 2024 requests unresolved"
          icon={AlertCircle}
          color={data.openPercent > 30 ? 'coral' : 'teal'}
          loading={loading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly trend */}
        <ChartCard
          title="Monthly Pothole Requests"
          subtitle="Submissions over time"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyTrend}>
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
              <Bar dataKey="count" fill={COLORS.gold} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Status breakdown */}
        <ChartCard
          title="Request Status"
          subtitle="Current status distribution"
          loading={loading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data.statusBreakdown}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                labelLine={true}
              >
                {data.statusBreakdown.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={statusColors[entry.status] || COLORS.warmGray}
                  />
                ))}
              </Pie>
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [formatNumber(value), 'Requests']}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* By district */}
      <ChartCard
        title="Requests by Council District"
        subtitle="2024 roadway requests by district"
        loading={loading}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.byDistrict} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} />
            <YAxis
              type="category"
              dataKey="district"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              width={80}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value) => [formatNumber(value), 'Requests']}
            />
            <Bar dataKey="count" fill={COLORS.navy} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* All request types table */}
      <ChartCard
        title="All 311 Request Types"
        subtitle="2024 requests ranked by volume (potholes highlighted)"
        loading={loading}
      >
        <DataTable
          columns={tableColumns}
          data={data.topRequestTypes}
          maxHeight="450px"
        />
      </ChartCard>
    </div>
  );
}
