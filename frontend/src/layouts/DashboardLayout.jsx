import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Home, Clock, Building2, Users, Briefcase, CalendarClock,
  Calendar, Plane, CheckSquare, Umbrella, Handshake, FileBarChart2,
  User, LogOut, Menu
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { leaves, attendanceChanges, rosterChanges, refresh } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    // Refresh counts whenever user lands on a page that shows pending items
    const watchedPaths = ['/leaves', '/changes', '/roster'];
    if (watchedPaths.includes(location.pathname)) refresh();
  }, [location.pathname]);

  const menuItems = [
    { label: 'Home',        path: '/',            icon: Home,          badge: 0               },
    { label: 'Attendance',  path: '/attendance',  icon: Clock,         badge: 0               },
    { label: 'Departments', path: '/departments', icon: Building2,     badge: 0               },
    { label: 'Employees',   path: '/employees',   icon: Users,         badge: 0               },
    { label: 'Designations',path: '/designations',icon: Briefcase,     badge: 0               },
    { label: 'Shifts',      path: '/shifts',      icon: CalendarClock, badge: 0               },
    { label: 'Roster',      path: '/roster',      icon: Calendar,      badge: rosterChanges   },
    { label: 'Leaves',      path: '/leaves',      icon: Plane,         badge: leaves          },
    { label: 'Att. Changes',path: '/changes',     icon: CheckSquare,   badge: attendanceChanges},
    { label: 'Holidays',    path: '/holidays',    icon: Umbrella,      badge: 0               },
    { label: 'Vendors',     path: '/vendors',     icon: Handshake,     badge: 0               },
  ];

  const isAdmin = user?.role === 'Admin';
  const handleLogout = () => { logout(); navigate('/login'); };

  const NavItems = ({ collapsed }) => (
    <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
      {!collapsed && (
        <p className="px-2 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attendance</p>
      )}
      {menuItems.map(({ label, path, icon: Icon, badge }) => {
        const active = location.pathname === path;
        return (
          <Link
            key={path}
            to={path}
            title={collapsed ? (badge > 0 ? `${label} (${badge} pending)` : label) : undefined}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              active ? 'bg-white text-[#1e40af] shadow-xs' : 'text-slate-700 hover:bg-white/40'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="relative shrink-0">
              <Icon className={`h-4 w-4 ${active ? 'text-[#1e40af]' : 'text-slate-500'}`} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] px-0.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            {!collapsed && <span className="flex-1">{label}</span>}
            {!collapsed && badge > 0 && (
              <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          to="/reports"
          title={collapsed ? 'Reports' : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            location.pathname === '/reports' ? 'bg-white text-[#1e40af] shadow-xs' : 'text-slate-700 hover:bg-white/40'
          } ${collapsed ? 'justify-center' : ''}`}
        >
          <FileBarChart2 className={`h-4 w-4 shrink-0 ${location.pathname === '/reports' ? 'text-[#1e40af]' : 'text-slate-500'}`} />
          {!collapsed && <span>Reports</span>}
        </Link>
      )}
      <div className="border-t border-slate-300/30 my-2" />
      <Link
        to="/profile"
        title={collapsed ? 'Profile' : undefined}
        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          location.pathname === '/profile' ? 'bg-white text-[#1e40af] shadow-xs' : 'text-slate-700 hover:bg-white/40'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <User className={`h-4 w-4 shrink-0 ${location.pathname === '/profile' ? 'text-[#1e40af]' : 'text-slate-500'}`} />
        {!collapsed && <span>Profile</span>}
      </Link>
      <button
        onClick={handleLogout}
        title={collapsed ? 'Logout' : undefined}
        className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-all cursor-pointer ${collapsed ? 'justify-center' : ''}`}
      >
        <LogOut className="h-4 w-4 text-rose-600 shrink-0" />
        {!collapsed && <span>Logout</span>}
      </button>
    </nav>
  );

  const SidebarShell = ({ collapsed, onToggle, children: nav }) => (
    <div className="h-full flex flex-col bg-[#add8e6] border-r border-[#69bae0]/30">
      <div className="h-11 flex items-center px-2.5 gap-2 border-b border-sky-300/20 shrink-0 select-none">
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-[#2c3e50] hover:bg-white/30 cursor-pointer transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
        {!collapsed && (
          <span className="font-bold text-[#1e293b] text-sm tracking-tight truncate">Attendance ESSL</span>
        )}
      </div>
      {nav}
    </div>
  );

  return (
    <div className="h-screen flex bg-[#faf6f0] overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — fixed overlay */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-52 shadow-xl transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarShell collapsed={false} onToggle={() => setMobileOpen(false)}>
          <NavItems collapsed={false} />
        </SidebarShell>
      </aside>

      {/* Desktop sidebar — inline */}
      <aside className={`hidden lg:block shrink-0 transition-all duration-300 ${desktopCollapsed ? 'w-12' : 'w-52'}`}>
        <SidebarShell collapsed={desktopCollapsed} onToggle={() => setDesktopCollapsed(!desktopCollapsed)}>
          <NavItems collapsed={desktopCollapsed} />
        </SidebarShell>
      </aside>

      {/* Right viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden h-11 flex items-center px-3 gap-3 bg-[#add8e6] border-b border-sky-300/20 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-lg text-[#2c3e50] hover:bg-white/30 cursor-pointer transition-colors"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="font-bold text-[#1e293b] text-sm tracking-tight">Attendance ESSL</span>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-5 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
