import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  AlertTriangle,
  Timer,
  Construction,
  TrendingUp,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/murders', icon: AlertTriangle, label: 'Murders' },
  { to: '/response-times', icon: Timer, label: 'Response Times' },
  { to: '/311', icon: Construction, label: '311 / Potholes' },
  { to: '/economy', icon: TrendingUp, label: 'Economy' },
];

export default function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-warm-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-900 text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-6 h-6 text-navy-900" fill="currentColor">
                <path d="M50 5 C50 5 45 15 45 25 C45 35 50 40 50 40 C50 40 55 35 55 25 C55 15 50 5 50 5 Z M30 35 C20 35 10 45 10 55 C10 65 20 70 30 70 C35 70 40 68 43 65 C40 60 38 55 38 50 C38 45 40 40 43 35 C40 33 35 35 30 35 Z M70 35 C65 35 60 33 57 35 C60 40 62 45 62 50 C62 55 60 60 57 65 C60 68 65 70 70 70 C80 70 90 65 90 55 C90 45 80 35 70 35 Z M50 45 C45 45 40 50 40 60 C40 70 45 95 50 95 C55 95 60 70 60 60 C60 50 55 45 50 45 Z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">New Orleans</div>
              <div className="text-xs text-gold-400">Mayor's Office</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-navy-700 text-gold-400'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <div className="my-4 border-t border-navy-700" />
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-navy-700 text-gold-400'
                      : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                  }`
                }
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Admin</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-navy-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gold-400">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user?.name}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-navy-900 font-medium">Operations Center</span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-coral-500 rounded-full" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span
                className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  isAdmin
                    ? 'bg-gold-400/20 text-gold-500'
                    : 'bg-teal-500/20 text-teal-500'
                }`}
              >
                {user?.role?.toUpperCase()}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-coral-500 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
