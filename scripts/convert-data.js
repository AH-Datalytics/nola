import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'src', 'data');
const rootDir = path.join(__dirname, '..', '..');

console.log('🔄 Converting data files...');

// Convert Murders Excel
console.log('📊 Processing murders data...');
const murdersPath = path.join(rootDir, 'NOLA Murders by Month.xlsx');
if (existsSync(murdersPath)) {
  const workbook = XLSX.readFile(murdersPath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { raw: false, dateNF: 'yyyy-mm-dd' });

  // Filter to 2015+ for main use, but keep all for historical context
  const murdersData = data
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
    path.join(dataDir, 'murders.json'),
    JSON.stringify(murdersData, null, 2)
  );
  console.log(`   ✓ Processed ${murdersData.length} months of murder data`);
} else {
  console.log('   ⚠ Murders file not found');
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
  const homePricesData = lines.slice(1)
    .map(line => {
      const parts = line.split(',');
      const monthRaw = parts[0]; // YYYYMM format
      const year = monthRaw.slice(0, 4);
      const month = monthRaw.slice(4, 6);
      const medianPrice = parseFloat(parts[3]) || null;
      const avgPrice = parseFloat(parts[36]) || null;
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

// Convert Parquet file using Python
console.log('📊 Processing police response time data (parquet)...');
const parquetPath = path.join(rootDir, 'Call_For_Service_Response_Time.parquet');
const responseTimeOutputPath = path.join(dataDir, 'response-times.json');

if (existsSync(parquetPath) && !existsSync(responseTimeOutputPath)) {
  const pythonScript = `
import pyarrow.parquet as pq
import pandas as pd
import json
from datetime import datetime
import numpy as np

print('   Loading parquet file...')
df = pq.read_table('${parquetPath.replace(/\\/g, '\\\\')}').to_pandas()
print(f'   Loaded {len(df)} records')

# Parse dates - handle both formats
def parse_date(d):
    if pd.isna(d) or d is None or d == 'None':
        return None
    try:
        # Try MM/DD/YYYY format first
        if '/' in str(d):
            return pd.to_datetime(d, format='%m/%d/%Y %I:%M:%S %p')
        else:
            return pd.to_datetime(d)
    except:
        return None

print('   Parsing dates...')
df['TimeCreate_dt'] = df['TimeCreate'].apply(parse_date)
df['TimeArrive_dt'] = df['TimeArrive'].apply(parse_date)
df['TimeDispatch_dt'] = df['TimeDispatch'].apply(parse_date)

# Filter to 2015+
df = df[df['TimeCreate_dt'] >= '2015-01-01']
print(f'   Filtered to {len(df)} records from 2015+')

# Calculate response time in minutes (from dispatch to arrival)
df['response_minutes'] = (df['TimeArrive_dt'] - df['TimeDispatch_dt']).dt.total_seconds() / 60
# Also calculate total time from call creation to arrival
df['total_minutes'] = (df['TimeArrive_dt'] - df['TimeCreate_dt']).dt.total_seconds() / 60

# Remove invalid response times
df = df[(df['response_minutes'] > 0) & (df['response_minutes'] < 180)]  # 0-3 hours reasonable
print(f'   {len(df)} records with valid response times')

# Add month column
df['month'] = df['TimeCreate_dt'].dt.to_period('M').astype(str)

# Determine priority category (Emergency = 0 or 1 prefixed, Non-emergency = 2 prefixed)
df['is_emergency'] = df['Priority'].str.startswith(('0', '1'), na=False)

# Aggregate by month
print('   Aggregating by month...')
monthly = df.groupby('month').agg({
    'response_minutes': ['median', 'mean', lambda x: x.quantile(0.9), 'count'],
    'total_minutes': 'median'
}).reset_index()
monthly.columns = ['month', 'median_response', 'mean_response', 'p90_response', 'call_count', 'median_total']

# Emergency vs non-emergency monthly (with median, mean, p90)
emergency_monthly = df[df['is_emergency']].groupby('month').agg({
    'response_minutes': ['median', 'mean', lambda x: x.quantile(0.9)]
}).reset_index()
emergency_monthly.columns = ['month', 'emergency_median', 'emergency_mean', 'emergency_p90']

non_emergency_monthly = df[~df['is_emergency']].groupby('month').agg({
    'response_minutes': ['median', 'mean', lambda x: x.quantile(0.9)]
}).reset_index()
non_emergency_monthly.columns = ['month', 'non_emergency_median', 'non_emergency_mean', 'non_emergency_p90']

monthly = monthly.merge(emergency_monthly, on='month', how='left')
monthly = monthly.merge(non_emergency_monthly, on='month', how='left')

# By district
print('   Aggregating by district...')
by_district = df.groupby('District').agg({
    'response_minutes': ['median', 'count']
}).reset_index()
by_district.columns = ['district', 'median_response', 'call_count']
by_district = by_district[by_district['district'] > 0]  # Remove district 0

# By call type (top 15)
print('   Aggregating by call type...')
by_type = df.groupby('TypeText').agg({
    'response_minutes': ['median', 'count']
}).reset_index()
by_type.columns = ['type', 'median_response', 'call_count']
by_type = by_type.sort_values('call_count', ascending=False).head(15)

# Distribution buckets
print('   Computing response time distribution...')
bins = [0, 5, 10, 15, 20, 30, 45, 60, 120, 180]
labels = ['0-5', '5-10', '10-15', '15-20', '20-30', '30-45', '45-60', '60-120', '120+']
df['time_bucket'] = pd.cut(df['response_minutes'], bins=bins, labels=labels, right=False)
distribution = df['time_bucket'].value_counts().sort_index()
distribution_data = [{'bucket': str(k), 'count': int(v)} for k, v in distribution.items()]

# Priority breakdown
by_priority = df.groupby('Priority').agg({
    'response_minutes': ['median', 'count']
}).reset_index()
by_priority.columns = ['priority', 'median_response', 'call_count']
by_priority = by_priority.sort_values('call_count', ascending=False).head(10)

result = {
    'monthly': monthly.replace({np.nan: None}).to_dict('records'),
    'byDistrict': by_district.replace({np.nan: None}).to_dict('records'),
    'byType': by_type.replace({np.nan: None}).to_dict('records'),
    'distribution': distribution_data,
    'byPriority': by_priority.replace({np.nan: None}).to_dict('records'),
    'summary': {
        'totalCalls': int(len(df)),
        'overallMedian': float(df['response_minutes'].median()),
        'emergencyMedian': float(df[df['is_emergency']]['response_minutes'].median()),
        'latestMonth': monthly['month'].max(),
        'latestMedian': float(monthly[monthly['month'] == monthly['month'].max()]['median_response'].values[0])
    }
}

print('   Writing JSON output...')
with open('${responseTimeOutputPath.replace(/\\/g, '\\\\')}', 'w') as f:
    json.dump(result, f, indent=2)

print('   ✓ Response time data processed successfully')
`;

  try {
    execSync(`python3 -c "${pythonScript.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
      maxBuffer: 1024 * 1024 * 100
    });
  } catch (error) {
    console.error('   ⚠ Error processing parquet file:', error.message);
    // Write placeholder data if parquet processing fails
    writeFileSync(responseTimeOutputPath, JSON.stringify({
      monthly: [],
      byDistrict: [],
      byType: [],
      distribution: [],
      byPriority: [],
      summary: { totalCalls: 0, overallMedian: 0, emergencyMedian: 0, latestMonth: '', latestMedian: 0 }
    }, null, 2));
  }
} else if (existsSync(responseTimeOutputPath)) {
  console.log('   ✓ Response time data already exists, skipping');
} else {
  console.log('   ⚠ Parquet file not found');
}

console.log('✅ Data conversion complete!');
