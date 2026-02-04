import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'src', 'data');
const rootDir = path.join(__dirname, '..', '..');

console.log('🔄 Converting data files...');

// Convert Murders Excel (outputs to crimes.json for the Crime section)
console.log('📊 Processing crime data...');
const murdersPath = path.join(rootDir, 'NOLA Murders by Month.xlsx');
if (existsSync(murdersPath)) {
  const workbook = XLSX.readFile(murdersPath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

  // Filter to 2015+ for main use, but keep all for historical context
  const crimesData = data
    .filter(row => row.Month && row.Murders !== undefined && row.Murders !== null)
    .map(row => {
      // Parse the date string - it should be in YYYY-MM-DD format now
      const dateStr = String(row.Month).slice(0, 10);
      const date = new Date(dateStr);
      const month = date.toISOString().slice(0, 7);
      return {
        month,
        murders: parseFloat(row.Murders)
      };
    })
    .filter(row => row.month && row.month >= '2015-01' && !isNaN(row.murders));

  writeFileSync(
    path.join(dataDir, 'crimes.json'),
    JSON.stringify(crimesData, null, 2)
  );
  console.log(`   ✓ Processed ${crimesData.length} months of crime data`);
} else {
  console.log('   ⚠ Crime data file not found');
}

// Convert Unemployment CSV
console.log('📊 Processing unemployment data...');
const unemploymentPath = path.join(rootDir, 'unemployment rate.csv');
if (existsSync(unemploymentPath)) {
  const csvContent = readFileSync(unemploymentPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const unemploymentData = lines.slice(1)
    .map(line => {
      const [date, rate] = line.split(',');
      return { month: date.slice(0, 7), rate: parseFloat(rate) || null };
    })
    .filter(row => row.month >= '2015-01' && row.rate !== null);

  writeFileSync(
    path.join(dataDir, 'unemployment.json'),
    JSON.stringify(unemploymentData, null, 2)
  );
  console.log(`   ✓ Processed ${unemploymentData.length} months of unemployment data`);
} else {
  console.log('   ⚠ Unemployment file not found');
}

// Convert Residential Addresses Excel
console.log('📊 Processing residential addresses data...');
const addressesPath = path.join(rootDir, 'TheDataCenter_ActiveResidentialAddresses.xlsx');
if (existsSync(addressesPath)) {
  const workbook = XLSX.readFile(addressesPath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Row 4 (index 4) has years, Row 5 (index 5) has months
  // Row 7 (index 7) has Orleans Parish totals
  const yearRow = rawData[4] || [];
  const monthRow = rawData[5] || [];
  const orleansTotals = rawData[7] || [];

  // Build date headers by filling in years
  let currentYear = null;
  const addressesData = [];

  for (let i = 1; i < orleansTotals.length; i++) {
    if (yearRow[i]) currentYear = yearRow[i];
    const monthName = monthRow[i];
    const count = orleansTotals[i];

    if (currentYear && monthName && count && typeof count === 'number') {
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'June': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      const monthNum = monthMap[monthName];
      if (monthNum) {
        const dateStr = `${currentYear}-${monthNum}`;
        if (dateStr >= '2015-01') {
          addressesData.push({ month: dateStr, addresses: count });
        }
      }
    }
  }

  // Sort by date
  addressesData.sort((a, b) => a.month.localeCompare(b.month));

  writeFileSync(
    path.join(dataDir, 'addresses.json'),
    JSON.stringify(addressesData, null, 2)
  );
  console.log(`   ✓ Processed ${addressesData.length} months of address data`);
} else {
  console.log('   ⚠ Addresses file not found');
}

// Convert Home Prices CSV
console.log('📊 Processing home prices data...');
const homePricesPath = path.join(rootDir, 'home_prices.csv');
if (existsSync(homePricesPath)) {
  const csvContent = readFileSync(homePricesPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');

  // Find column indices by name (handles quoted fields issue)
  const medianPriceIdx = headers.indexOf('median_listing_price');
  const avgPriceIdx = headers.indexOf('average_listing_price');

  const homePricesData = lines.slice(1)
    .map(line => {
      // Parse CSV properly handling quoted fields
      const parts = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);

      const monthRaw = parts[0]; // YYYYMM format
      const year = monthRaw.slice(0, 4);
      const month = monthRaw.slice(4, 6);
      const medianPrice = parseFloat(parts[medianPriceIdx]) || null;
      const avgPrice = parseFloat(parts[avgPriceIdx]) || null;
      return {
        month: `${year}-${month}`,
        medianPrice,
        avgPrice
      };
    })
    .filter(row => row.month >= '2015-01' && (row.medianPrice || row.avgPrice))
    .sort((a, b) => a.month.localeCompare(b.month));

  writeFileSync(
    path.join(dataDir, 'home-prices.json'),
    JSON.stringify(homePricesData, null, 2)
  );
  console.log(`   ✓ Processed ${homePricesData.length} months of home price data`);
} else {
  console.log('   ⚠ Home prices file not found');
}

// Convert Median Household Income CSV
console.log('📊 Processing median household income data...');
const incomePath = path.join(rootDir, 'median_household_income.csv');
if (existsSync(incomePath)) {
  const csvContent = readFileSync(incomePath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const incomeData = lines.slice(1)
    .map(line => {
      const [date, income] = line.split(',');
      const year = date.slice(0, 4);
      return {
        year: parseInt(year),
        income: parseInt(income) || null
      };
    })
    .filter(row => row.year >= 2015 && row.income)
    .sort((a, b) => a.year - b.year);

  writeFileSync(
    path.join(dataDir, 'household-income.json'),
    JSON.stringify(incomeData, null, 2)
  );
  console.log(`   ✓ Processed ${incomeData.length} years of household income data`);
} else {
  console.log('   ⚠ Median household income file not found');
}

// Convert Response Time CSV
console.log('📊 Processing police response time data (CSV)...');
const responseTimeCsvPath = path.join(rootDir, 'Response Time in Minutes.csv');
const responseTimeOutputPath = path.join(dataDir, 'response-times.json');

if (existsSync(responseTimeCsvPath)) {
  const csvContent = readFileSync(responseTimeCsvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  const monthMap = {
    'January': '01', 'February': '02', 'March': '03', 'April': '04',
    'May': '05', 'June': '06', 'July': '07', 'August': '08',
    'September': '09', 'October': '10', 'November': '11', 'December': '12'
  };

  // Parse daily data
  const dailyData = lines.slice(1).map(line => {
    const parts = line.split(',');
    const year = parts[0];
    const month = monthMap[parts[1]];
    const day = parts[2];
    const responseTime = parseFloat(parts[3]) || null;
    const incidents = parseInt(parts[4]) || 0;
    return {
      date: `${year}-${month}-${day.padStart(2, '0')}`,
      month: `${year}-${month}`,
      responseTime,
      incidents
    };
  }).filter(d => d.responseTime !== null && d.month >= '2015-01');

  // Aggregate to monthly (weighted average by incidents)
  const monthlyMap = {};
  dailyData.forEach(d => {
    if (!monthlyMap[d.month]) {
      monthlyMap[d.month] = { totalWeighted: 0, totalIncidents: 0, responseTimes: [] };
    }
    monthlyMap[d.month].totalWeighted += d.responseTime * d.incidents;
    monthlyMap[d.month].totalIncidents += d.incidents;
    monthlyMap[d.month].responseTimes.push(d.responseTime);
  });

  const monthly = Object.entries(monthlyMap)
    .map(([month, data]) => {
      const sorted = [...data.responseTimes].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const mean = data.totalWeighted / data.totalIncidents;
      const p90Index = Math.floor(sorted.length * 0.9);
      const p90 = sorted[p90Index] || sorted[sorted.length - 1];

      return {
        month,
        median_response: parseFloat(median.toFixed(2)),
        mean_response: parseFloat(mean.toFixed(2)),
        p90_response: parseFloat(p90.toFixed(2)),
        call_count: data.totalIncidents
      };
    })
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate overall stats
  const totalIncidents = monthly.reduce((sum, m) => sum + m.call_count, 0);
  const latestMonth = monthly[monthly.length - 1];
  const allResponseTimes = dailyData.map(d => d.responseTime);
  const sortedAll = [...allResponseTimes].sort((a, b) => a - b);
  const overallMedian = sortedAll[Math.floor(sortedAll.length / 2)];

  const result = {
    monthly,
    byDistrict: [],  // Not available in this dataset
    byType: [],      // Not available in this dataset
    distribution: [], // Not available in this dataset
    byPriority: [],  // Not available in this dataset
    summary: {
      totalCalls: totalIncidents,
      overallMedian: parseFloat(overallMedian.toFixed(2)),
      latestMonth: latestMonth?.month,
      latestMedian: latestMonth?.median_response
    }
  };

  writeFileSync(responseTimeOutputPath, JSON.stringify(result, null, 2));
  console.log(`   ✓ Processed ${monthly.length} months of response time data (${totalIncidents.toLocaleString()} total incidents)`);
} else {
  console.log('   ⚠ Response time CSV not found');
}

// Convert Population CSV (from FRED LAORLE0POP or similar)
console.log('📊 Processing population data...');
const populationPath = path.join(rootDir, 'population.csv');
if (existsSync(populationPath)) {
  const csvContent = readFileSync(populationPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  const populationData = lines.slice(1)
    .map(line => {
      const [date, population] = line.split(',');
      const year = parseInt(date.slice(0, 4));
      // FRED data is in thousands, so multiply by 1000
      return {
        year,
        population: Math.round(parseFloat(population) * 1000) || null
      };
    })
    .filter(row => row.year >= 2010 && row.population)
    .sort((a, b) => a.year - b.year);

  writeFileSync(
    path.join(dataDir, 'population.json'),
    JSON.stringify(populationData, null, 2)
  );
  console.log(`   ✓ Processed ${populationData.length} years of population data`);
} else {
  console.log('   ⚠ Population file not found');
}

console.log('✅ Data conversion complete!');
