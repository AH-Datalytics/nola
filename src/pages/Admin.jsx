import { useState } from 'react';
import {
  Users,
  Upload,
  Settings,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import ChartCard from '../components/ChartCard';
import DataTable from '../components/DataTable';

// Mock user data
const mockUsers = [
  { id: 1, name: 'LaToya Cantrell', role: 'Admin', email: 'mayor@nola.gov', lastLogin: '2026-02-03 09:15 AM', status: 'Active' },
  { id: 2, name: 'Chief Deputy', role: 'Admin', email: 'deputy@nola.gov', lastLogin: '2026-02-02 04:30 PM', status: 'Active' },
  { id: 3, name: 'Policy Analyst', role: 'Viewer', email: 'analyst@nola.gov', lastLogin: '2026-02-03 08:45 AM', status: 'Active' },
  { id: 4, name: 'Communications Dir', role: 'Viewer', email: 'comms@nola.gov', lastLogin: '2026-02-01 11:20 AM', status: 'Active' },
  { id: 5, name: 'Budget Officer', role: 'Viewer', email: 'budget@nola.gov', lastLogin: '2026-01-28 03:15 PM', status: 'Active' },
  { id: 6, name: 'NOPD Liaison', role: 'Viewer', email: 'nopd@nola.gov', lastLogin: '2026-02-02 10:00 AM', status: 'Active' },
  { id: 7, name: 'Former Analyst', role: 'Viewer', email: 'former@nola.gov', lastLogin: '2025-12-15 02:30 PM', status: 'Inactive' },
];

// Mock audit log
const mockAuditLog = [
  { timestamp: '2026-02-03 09:15:23', user: 'Mayor Cantrell', action: 'Logged in', details: 'Dashboard access' },
  { timestamp: '2026-02-03 08:45:12', user: 'Policy Analyst', action: 'Viewed report', details: 'Murder statistics export' },
  { timestamp: '2026-02-02 16:30:45', user: 'Admin', action: 'Data upload', details: 'Updated crime data Q4 2025' },
  { timestamp: '2026-02-02 14:22:18', user: 'Chief Deputy', action: 'Settings changed', details: 'Email alerts enabled' },
  { timestamp: '2026-02-02 10:05:33', user: 'NOPD Liaison', action: 'Data export', details: 'Response time report' },
  { timestamp: '2026-02-01 11:20:00', user: 'Communications Dir', action: 'Logged in', details: 'Dashboard access' },
  { timestamp: '2026-01-31 09:00:00', user: 'Admin', action: 'User created', details: 'Added Budget Officer account' },
  { timestamp: '2026-01-30 15:45:22', user: 'Admin', action: 'Data refresh', details: 'Synced 311 API data' },
];

export default function Admin() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    autoRefresh: '15',
    dataRetention: '365',
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelect = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const userColumns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    {
      key: 'role',
      header: 'Role',
      render: (val) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          val === 'Admin' ? 'bg-gold-100 text-gold-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {val}
        </span>
      ),
    },
    { key: 'lastLogin', header: 'Last Login' },
    {
      key: 'status',
      header: 'Status',
      render: (val) => (
        <span className={`flex items-center gap-1 ${
          val === 'Active' ? 'text-teal-600' : 'text-gray-400'
        }`}>
          {val === 'Active' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {val}
        </span>
      ),
    },
  ];

  const auditColumns = [
    { key: 'timestamp', header: 'Timestamp' },
    { key: 'user', header: 'User' },
    { key: 'action', header: 'Action' },
    { key: 'details', header: 'Details' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Administration</h1>
        <p className="text-gray-500 mt-1 text-sm lg:text-base">System settings, user management, and audit logs</p>
      </div>

      {/* Admin-only banner */}
      <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-gold-600" />
        <p className="text-sm text-gold-800">
          This section is only visible to administrators. Changes here affect all users.
        </p>
      </div>

      {/* User Management */}
      <ChartCard
        title="User Management"
        subtitle="Manage dashboard access and permissions"
      >
        <div className="mb-4 flex justify-end">
          <button className="px-4 py-2 bg-navy-800 text-white text-sm rounded-lg hover:bg-navy-700 transition-colors flex items-center gap-2">
            <Users className="w-4 h-4" />
            Add User
          </button>
        </div>
        <DataTable
          columns={userColumns}
          data={mockUsers}
          maxHeight="350px"
        />
      </ChartCard>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Upload */}
        <ChartCard
          title="Data Upload"
          subtitle="Import new datasets"
        >
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-navy-400 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">
              Drag files here to upload
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supported formats: CSV, Excel, Parquet
            </p>
            <button className="px-4 py-2 bg-warm-gray-100 text-gray-700 text-sm rounded-lg hover:bg-warm-gray-200 transition-colors">
              Browse Files
            </button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm p-3 bg-warm-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>crime_data_2025.csv</span>
              </div>
              <span className="text-teal-600">Uploaded Jan 15</span>
            </div>
            <div className="flex items-center justify-between text-sm p-3 bg-warm-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span>response_times_q4.parquet</span>
              </div>
              <span className="text-teal-600">Uploaded Jan 10</span>
            </div>
          </div>
        </ChartCard>

        {/* System Settings */}
        <ChartCard
          title="System Settings"
          subtitle="Configure dashboard behavior"
        >
          <div className="space-y-6">
            {/* Email Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-navy-900">Email Alerts</div>
                <div className="text-sm text-gray-500">
                  Send daily summary to administrators
                </div>
              </div>
              <button
                onClick={() => handleToggle('emailAlerts')}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.emailAlerts ? 'bg-teal-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.emailAlerts ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Auto-refresh */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-navy-900">Auto-refresh Interval</div>
                <div className="text-sm text-gray-500">
                  How often to refresh live data
                </div>
              </div>
              <div className="relative">
                <select
                  value={settings.autoRefresh}
                  onChange={(e) => handleSelect('autoRefresh', e.target.value)}
                  className="appearance-none bg-warm-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                >
                  <option value="5">5 minutes</option>
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* Data Retention */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-navy-900">Data Retention Period</div>
                <div className="text-sm text-gray-500">
                  How long to keep historical data
                </div>
              </div>
              <div className="relative">
                <select
                  value={settings.dataRetention}
                  onChange={(e) => handleSelect('dataRetention', e.target.value)}
                  className="appearance-none bg-warm-gray-50 border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                >
                  <option value="90">90 days</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                  <option value="730">2 years</option>
                  <option value="0">Indefinite</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {/* API Status */}
            <div className="pt-4 border-t border-gray-200">
              <div className="font-medium text-navy-900 mb-3">API Connections</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>NOLA 311 Socrata API</span>
                  <span className="flex items-center gap-1 text-teal-600">
                    <span className="w-2 h-2 bg-teal-500 rounded-full" />
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>FRED Economic Data</span>
                  <span className="flex items-center gap-1 text-gray-400">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Not configured
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Audit Log */}
      <ChartCard
        title="Audit Log"
        subtitle="Recent system activity"
      >
        <DataTable
          columns={auditColumns}
          data={mockAuditLog}
          maxHeight="350px"
        />
      </ChartCard>
    </div>
  );
}
