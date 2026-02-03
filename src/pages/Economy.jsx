import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Home, Briefcase, DollarSign, Users } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { COLORS, tooltipStyle, formatMonth, formatNumber, formatPercent } from '../utils/chartConfig';

import unemploymentData from '../data/unemployment.json';
import addressesData from '../data/addresses.json';
import homePricesData from '../data/home-prices.json';
import householdIncomeData from '../data/household-income.json';

export default function Economy() {
  // Calculate statistics
  const stats = useMemo(() => {
    const latest = unemploymentData[unemploymentData.length - 1];
    const prev = unemploymentData[unemploymentData.length - 2];
    const yearAgo = unemploymentData.find(d => {
      const [y, m] = d.month.split('-');
      const [ly, lm] = latest.month.split('-');
      return parseInt(y) === parseInt(ly) - 1 && m === lm;
    });

    const latestAddresses = addressesData[addressesData.length - 1];
    const yearAgoAddresses = addressesData.find(d => {
      const [y, m] = d.month.split('-');
      const [ly, lm] = latestAddresses.month.split('-');
      return parseInt(y) === parseInt(ly) - 1 && m === lm;
    });

    // COVID peak
    const covidPeak = unemploymentData.reduce((max, d) =>
      (d.rate || 0) > (max?.rate || 0) ? d : max
    , null);

    // Pre-COVID baseline (Feb 2020)
    const preCovid = unemploymentData.find(d => d.month === '2020-02');

    // Calculate 5-year average
    const last5Years = unemploymentData.slice(-60);
    const avg5Year = last5Years.reduce((sum, d) => sum + (d.rate || 0), 0) / last5Years.length;

    // Home prices
    const latestHomePrice = homePricesData[homePricesData.length - 1];
    const yearAgoHomePrice = homePricesData.find(d => {
      const [y, m] = d.month.split('-');
      const [ly, lm] = latestHomePrice.month.split('-');
      return parseInt(y) === parseInt(ly) - 1 && m === lm;
    });
    const homePriceYoY = yearAgoHomePrice?.medianPrice
      ? ((latestHomePrice.medianPrice - yearAgoHomePrice.medianPrice) / yearAgoHomePrice.medianPrice) * 100
      : 0;

    // Household income
    const latestIncome = householdIncomeData[householdIncomeData.length - 1];
    const prevIncome = householdIncomeData[householdIncomeData.length - 2];
    const incomeChange = prevIncome?.income
      ? ((latestIncome.income - prevIncome.income) / prevIncome.income) * 100
      : 0;

    return {
      currentRate: latest?.rate,
      currentMonth: latest?.month,
      monthlyChange: prev?.rate ? latest.rate - prev.rate : 0,
      yearlyChange: yearAgo?.rate ? latest.rate - yearAgo.rate : 0,
      covidPeak,
      preCovid,
      avg5Year,
      latestAddresses: latestAddresses?.addresses,
      addressMonth: latestAddresses?.month,
      addressYoY: yearAgoAddresses?.addresses
        ? ((latestAddresses.addresses - yearAgoAddresses.addresses) / yearAgoAddresses.addresses) * 100
        : 0,
      latestMedianPrice: latestHomePrice?.medianPrice,
      latestAvgPrice: latestHomePrice?.avgPrice,
      homePriceMonth: latestHomePrice?.month,
      homePriceYoY,
      latestIncome: latestIncome?.income,
      incomeYear: latestIncome?.year,
      incomeChange,
    };
  }, []);

  // Chart data
  const unemploymentChartData = useMemo(() => {
    return unemploymentData.slice(-120).map(d => ({
      month: d.month,
      rate: d.rate,
    }));
  }, []);

  const addressesChartData = useMemo(() => {
    return addressesData.slice(-60).map(d => ({
      month: d.month,
      addresses: d.addresses,
    }));
  }, []);

  // Combined chart for recent data
  const recentData = useMemo(() => {
    const last24Unemployment = unemploymentData.slice(-24);
    return last24Unemployment.map(u => {
      const addressEntry = addressesData.find(a => a.month === u.month);
      return {
        month: u.month,
        unemployment: u.rate,
        addresses: addressEntry?.addresses,
      };
    });
  }, []);

  // Annual summary table
  const annualData = useMemo(() => {
    const years = {};
    unemploymentData.forEach(d => {
      const year = d.month.split('-')[0];
      if (parseInt(year) >= 2015) {
        if (!years[year]) years[year] = { rates: [], addresses: [] };
        if (d.rate) years[year].rates.push(d.rate);
      }
    });
    addressesData.forEach(d => {
      const year = d.month.split('-')[0];
      if (years[year] && d.addresses) {
        years[year].addresses.push(d.addresses);
      }
    });

    return Object.entries(years)
      .map(([year, data]) => ({
        year,
        avgRate: data.rates.length > 0
          ? (data.rates.reduce((a, b) => a + b, 0) / data.rates.length).toFixed(1)
          : '-',
        maxRate: data.rates.length > 0 ? Math.max(...data.rates).toFixed(1) : '-',
        minRate: data.rates.length > 0 ? Math.min(...data.rates).toFixed(1) : '-',
        avgAddresses: data.addresses.length > 0
          ? Math.round(data.addresses.reduce((a, b) => a + b, 0) / data.addresses.length)
          : '-',
      }))
      .reverse();
  }, []);

  const tableColumns = [
    { key: 'year', header: 'Year' },
    { key: 'avgRate', header: 'Avg Unemployment %', align: 'right' },
    { key: 'minRate', header: 'Low', align: 'right' },
    { key: 'maxRate', header: 'High', align: 'right' },
    { key: 'avgAddresses', header: 'Avg Addresses', align: 'right', render: (val) => typeof val === 'number' ? formatNumber(val) : val },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Economy & Demographics</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">Economic indicators and population metrics for Orleans Parish</p>
      </div>

      {/* Data sources note */}
      <div className="bg-warm-gray-100 border border-warm-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          <strong>Data Sources:</strong> Unemployment rate from FRED (LAORLE0URN).
          Median household income from FRED (MHILA22071A052NCEN).
          Home prices from Realtor.com via Econdata.
          Active residential addresses from USPS delivery data via The Data Center.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          title="Unemployment Rate"
          value={`${stats.currentRate?.toFixed(1) || '-'}%`}
          subtitle={formatMonth(stats.currentMonth)}
          trend={stats.yearlyChange > 0 ? stats.yearlyChange * 10 : stats.yearlyChange * 10}
          trendLabel={`${stats.yearlyChange > 0 ? '+' : ''}${stats.yearlyChange?.toFixed(1)}pp vs last year`}
          icon={Briefcase}
          color={stats.currentRate > 5 ? 'coral' : 'teal'}
        />
        <KPICard
          title="Median Home Price"
          value={`$${formatNumber(stats.latestMedianPrice)}`}
          subtitle={formatMonth(stats.homePriceMonth)}
          trend={stats.homePriceYoY}
          trendLabel="vs same month last year"
          icon={Home}
          color="navy"
        />
        <KPICard
          title="Avg Home Price"
          value={`$${formatNumber(stats.latestAvgPrice)}`}
          subtitle={formatMonth(stats.homePriceMonth)}
          icon={Home}
          color="navy"
        />
        <KPICard
          title="Median Household Income"
          value={`$${formatNumber(stats.latestIncome)}`}
          subtitle={`${stats.incomeYear} (annual)`}
          trend={stats.incomeChange}
          trendLabel="vs previous year"
          icon={DollarSign}
          color="teal"
        />
        <KPICard
          title="Active Addresses"
          value={formatNumber(stats.latestAddresses)}
          subtitle={formatMonth(stats.addressMonth)}
          trend={stats.addressYoY}
          trendLabel="vs same month last year"
          icon={Home}
          color="navy"
        />
        <KPICard
          title="COVID Peak Unemployment"
          value={`${stats.covidPeak?.rate?.toFixed(1) || '-'}%`}
          subtitle={formatMonth(stats.covidPeak?.month)}
          icon={TrendingDown}
          color="coral"
        />
      </div>

      {/* Main unemployment chart */}
      <ChartCard
        title="Unemployment Rate Trend"
        subtitle="10-year monthly view (FRED LAORLE0URN)"
      >
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={unemploymentChartData}>
            <defs>
              <linearGradient id="unemploymentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.navy} stopOpacity={0.3} />
                <stop offset="95%" stopColor={COLORS.navy} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
            <XAxis
              dataKey="month"
              tickFormatter={(val) => {
                const [year, month] = val.split('-');
                return month === '01' ? year : '';
              }}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              interval={11}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              width={40}
              domain={[0, 'auto']}
              label={{ value: '%', position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value) => [`${value}%`, 'Unemployment Rate']}
              labelFormatter={formatMonth}
            />
            <ReferenceLine
              y={stats.avg5Year}
              stroke={COLORS.gold}
              strokeDasharray="5 5"
              label={{ value: '5yr avg', fill: COLORS.gold, fontSize: 10 }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke={COLORS.navy}
              strokeWidth={2}
              fill="url(#unemploymentGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Home Prices Chart */}
      <ChartCard
        title="Home Listing Prices"
        subtitle="Median and average listing prices for Orleans Parish"
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={homePricesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
            <XAxis
              dataKey="month"
              tickFormatter={(val) => {
                const [year, month] = val.split('-');
                return month === '01' ? year : '';
              }}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              interval={11}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              width={70}
              domain={[0, 'auto']}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name) => [`$${formatNumber(value)}`, name === 'medianPrice' ? 'Median Price' : 'Average Price']}
              labelFormatter={formatMonth}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="medianPrice"
              name="Median Price"
              stroke={COLORS.navy}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              name="Average Price"
              stroke={COLORS.teal}
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Median Household Income */}
        <ChartCard
          title="Median Household Income"
          subtitle="Annual income for Orleans Parish (FRED)"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={householdIncomeData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11, fill: '#6B7280' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={60}
                domain={[0, 'auto']}
                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}K`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [`$${formatNumber(value)}`, 'Median Income']}
              />
              <Area
                type="monotone"
                dataKey="income"
                stroke={COLORS.teal}
                strokeWidth={2}
                fill="url(#incomeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Active addresses trend */}
        <ChartCard
          title="Active Residential Addresses"
          subtitle="Orleans Parish housing occupancy proxy"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={addressesChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                tick={{ fontSize: 11, fill: '#6B7280' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6B7280' }}
                width={55}
                domain={['dataMin - 5000', 'dataMax + 5000']}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
              />
              <Tooltip
                {...tooltipStyle}
                formatter={(value) => [formatNumber(value), 'Addresses']}
                labelFormatter={formatMonth}
              />
              <Line
                type="monotone"
                dataKey="addresses"
                stroke={COLORS.coral}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Annual summary table */}
      <ChartCard
        title="Annual Summary"
        subtitle="Yearly economic indicators (2015-present)"
      >
        <DataTable
          columns={tableColumns}
          data={annualData}
          maxHeight="400px"
        />
      </ChartCard>

      {/* Additional FRED data note */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-navy-900 mb-3">Additional Data Available</h3>
        <p className="text-sm text-gray-600 mb-4">
          The following economic indicators are available from FRED for Orleans Parish, LA
          and could be integrated for a more comprehensive economic dashboard:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-warm-gray-50 rounded-lg">
            <div className="text-sm font-medium text-navy-800">Total Population</div>
            <div className="text-xs text-gray-500 mt-1">LAORLE0POP</div>
          </div>
          <div className="p-4 bg-warm-gray-50 rounded-lg">
            <div className="text-sm font-medium text-navy-800">GDP All Industries</div>
            <div className="text-xs text-gray-500 mt-1">GDPALL22071</div>
          </div>
          <div className="p-4 bg-warm-gray-50 rounded-lg">
            <div className="text-sm font-medium text-navy-800">Labor Force</div>
            <div className="text-xs text-gray-500 mt-1">LAORLE0LF</div>
          </div>
        </div>
      </div>
    </div>
  );
}
