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
import { Home, Briefcase, DollarSign, Users, Building } from 'lucide-react';
import KPICard from '../components/KPICard';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';
import { COLORS, tooltipStyle, formatMonth, formatNumber, formatPercent } from '../utils/chartConfig';

import unemploymentData from '../data/unemployment.json';
import homePricesData from '../data/home-prices.json';
import householdIncomeData from '../data/household-income.json';
import populationData from '../data/population.json';
import addressesData from '../data/addresses.json';

export default function Economy() {
  // Calculate statistics
  const stats = useMemo(() => {
    // Unemployment
    const latestUnemployment = unemploymentData[unemploymentData.length - 1];
    const prevUnemployment = unemploymentData[unemploymentData.length - 2];
    const yearAgoUnemployment = unemploymentData.find(d => {
      const [y, m] = d.month.split('-');
      const [ly, lm] = latestUnemployment.month.split('-');
      return parseInt(y) === parseInt(ly) - 1 && m === lm;
    });

    // Home prices
    const latestHomePrice = homePricesData[homePricesData.length - 1];
    const yearAgoHomePrice = homePricesData.find(d => {
      const [y, m] = d.month.split('-');
      const [ly, lm] = latestHomePrice?.month?.split('-') || [];
      return parseInt(y) === parseInt(ly) - 1 && m === lm;
    });
    const avgPriceYoY = yearAgoHomePrice?.avgPrice
      ? ((latestHomePrice.avgPrice - yearAgoHomePrice.avgPrice) / yearAgoHomePrice.avgPrice) * 100
      : 0;

    // Household income
    const latestIncome = householdIncomeData[householdIncomeData.length - 1];
    const prevIncome = householdIncomeData[householdIncomeData.length - 2];
    const incomeChange = prevIncome?.income
      ? ((latestIncome.income - prevIncome.income) / prevIncome.income) * 100
      : 0;

    // Population
    const latestPopulation = populationData[populationData.length - 1];
    const prevPopulation = populationData[populationData.length - 2];
    const populationChange = prevPopulation?.population
      ? ((latestPopulation?.population - prevPopulation?.population) / prevPopulation?.population) * 100
      : 0;

    // Addresses
    const latestAddresses = addressesData[addressesData.length - 1];
    const yearAgoAddresses = addressesData.find(d => {
      const [y, m] = d.month.split('-');
      const [ly, lm] = latestAddresses?.month?.split('-') || [];
      return parseInt(y) === parseInt(ly) - 1 && m === lm;
    });
    const addressesYoY = yearAgoAddresses?.addresses
      ? ((latestAddresses.addresses - yearAgoAddresses.addresses) / yearAgoAddresses.addresses) * 100
      : 0;

    return {
      currentRate: latestUnemployment?.rate,
      currentMonth: latestUnemployment?.month,
      yearlyChange: yearAgoUnemployment?.rate ? latestUnemployment.rate - yearAgoUnemployment.rate : 0,
      latestAvgPrice: latestHomePrice?.avgPrice,
      homePriceMonth: latestHomePrice?.month,
      avgPriceYoY,
      latestIncome: latestIncome?.income,
      incomeYear: latestIncome?.year,
      incomeChange,
      latestPopulation: latestPopulation?.population,
      populationYear: latestPopulation?.year,
      populationChange,
      latestAddresses: latestAddresses?.addresses,
      addressesMonth: latestAddresses?.month,
      addressesYoY,
    };
  }, []);

  // Chart data
  const unemploymentChartData = useMemo(() => {
    return unemploymentData.slice(-120).map(d => ({
      month: d.month,
      rate: d.rate,
    }));
  }, []);

  // 5-year average for reference line
  const avg5Year = useMemo(() => {
    const last5Years = unemploymentData.slice(-60);
    return last5Years.reduce((sum, d) => sum + (d.rate || 0), 0) / last5Years.length;
  }, []);

  // Addresses chart data - yearly averages (all available years)
  const addressesChartData = useMemo(() => {
    const yearlyData = {};
    addressesData.forEach(d => {
      const year = parseInt(d.month.split('-')[0]);
      if (!yearlyData[year]) yearlyData[year] = [];
      if (d.addresses) yearlyData[year].push(d.addresses);
    });

    return Object.entries(yearlyData)
      .map(([year, values]) => ({
        year: parseInt(year),
        addresses: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      }))
      .sort((a, b) => a.year - b.year);
  }, []);

  // Annual summary table with all data
  const annualData = useMemo(() => {
    const years = {};

    // Initialize years from 2015+
    for (let y = 2015; y <= new Date().getFullYear(); y++) {
      years[y] = { rates: [], addresses: [], homePrices: [] };
    }

    // Unemployment data
    unemploymentData.forEach(d => {
      const year = parseInt(d.month.split('-')[0]);
      if (years[year] && d.rate) years[year].rates.push(d.rate);
    });

    // Addresses data
    addressesData.forEach(d => {
      const year = parseInt(d.month.split('-')[0]);
      if (years[year] && d.addresses) years[year].addresses.push(d.addresses);
    });

    // Home prices data
    homePricesData.forEach(d => {
      const year = parseInt(d.month.split('-')[0]);
      if (years[year] && d.medianPrice) years[year].homePrices.push(d.medianPrice);
    });

    return Object.entries(years)
      .map(([year, data]) => {
        // Find population for this year
        const popEntry = populationData.find(p => p.year === parseInt(year));
        // Find income for this year
        const incomeEntry = householdIncomeData.find(i => i.year === parseInt(year));

        return {
          year: parseInt(year),
          avgUnemployment: data.rates.length > 0
            ? parseFloat((data.rates.reduce((a, b) => a + b, 0) / data.rates.length).toFixed(1))
            : '-',
          avgHomePrice: data.homePrices.length > 0
            ? Math.round(data.homePrices.reduce((a, b) => a + b, 0) / data.homePrices.length)
            : '-',
          householdIncome: incomeEntry?.income || '-',
          population: popEntry?.population || '-',
          avgAddresses: data.addresses.length > 0
            ? Math.round(data.addresses.reduce((a, b) => a + b, 0) / data.addresses.length)
            : '-',
        };
      })
      .filter(d => d.year >= 2015)
      .reverse();
  }, []);

  const tableColumns = [
    { key: 'year', header: 'Year' },
    { key: 'avgUnemployment', header: 'Unemployment %', align: 'right' },
    { key: 'avgHomePrice', header: 'Avg Home Price', align: 'right', render: (val) => val !== '-' ? `$${formatNumber(val)}` : '-' },
    { key: 'householdIncome', header: 'Household Income', align: 'right', render: (val) => val !== '-' ? `$${formatNumber(val)}` : '-' },
    { key: 'population', header: 'Population', align: 'right', render: (val) => val !== '-' ? formatNumber(val) : '-' },
    { key: 'avgAddresses', header: 'Addresses', align: 'right', render: (val) => val !== '-' ? formatNumber(val) : '-' },
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
          <strong>Data Sources:</strong> Unemployment from FRED (LAORLE0URN).
          Household income from FRED (MHILA22071A052NCEN).
          Home prices from Realtor.com.
          Population from FRED (LAORLE0POP).
          Active addresses from USPS via The Data Center.
        </p>
      </div>

      {/* KPI Cards - 5 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          title="Avg Home Price"
          value={stats.latestAvgPrice ? `$${formatNumber(stats.latestAvgPrice)}` : '-'}
          subtitle={formatMonth(stats.homePriceMonth)}
          trend={stats.avgPriceYoY}
          trendLabel="vs same month last year"
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
          color="coral"
        />
        <KPICard
          title="Population"
          value={stats.latestPopulation ? `${(stats.latestPopulation / 1000).toFixed(0)}K` : '-'}
          subtitle={stats.populationYear ? `${stats.populationYear} (annual)` : 'Data not loaded'}
          trend={stats.populationChange || null}
          trendLabel={stats.populationChange ? "vs previous year" : undefined}
          icon={Users}
          color="navy"
        />
        <KPICard
          title="Active Addresses"
          value={formatNumber(stats.latestAddresses)}
          subtitle={formatMonth(stats.addressesMonth)}
          trend={stats.addressesYoY}
          trendLabel="vs same month last year"
          icon={Building}
          color="gold"
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
              y={avg5Year}
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
              formatter={(value, name) => [`$${formatNumber(value)}`, name === 'medianPrice' ? 'Median Listing Price' : 'Average Listing Price']}
              labelFormatter={formatMonth}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="medianPrice"
              name="Median Listing Price"
              stroke={COLORS.navy}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              name="Average Listing Price"
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

        {/* Population trend */}
        <ChartCard
          title="Population"
          subtitle="Orleans Parish annual population (FRED)"
        >
          {populationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={populationData}>
                <defs>
                  <linearGradient id="populationGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.coral} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.coral} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  width={55}
                  domain={[0, 'auto']}
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  {...tooltipStyle}
                  formatter={(value) => [formatNumber(value), 'Population']}
                />
                <Area
                  type="monotone"
                  dataKey="population"
                  stroke={COLORS.coral}
                  strokeWidth={2}
                  fill="url(#populationGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Population data not loaded</p>
                <p className="text-xs mt-1">Add population.csv to the data folder</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      {/* Active Residential Addresses */}
      <ChartCard
        title="Active Residential Addresses"
        subtitle="Orleans Parish yearly average (2015-present)"
      >
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={addressesChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E0E0D8" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: '#6B7280' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              width={55}
              domain={[0, 'auto']}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value) => [formatNumber(value), 'Avg Addresses']}
            />
            <Line
              type="monotone"
              dataKey="addresses"
              stroke={COLORS.gold}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Annual summary table */}
      <ChartCard
        title="Annual Summary"
        subtitle="Yearly economic indicators (2015-present)"
      >
        <DataTable
          columns={tableColumns}
          data={annualData}
          maxHeight="400px"
          sortable
        />
      </ChartCard>
    </div>
  );
}
