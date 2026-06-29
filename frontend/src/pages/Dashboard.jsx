import { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  FileText, 
  CalendarMinus,
  GitBranch
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEcoExpanded, setIsEcoExpanded] = useState(true);

  // Dynamic formatting of day name to match "Tuesday, 23 Jun 2026" exactly
  const getFormattedDate = () => {
    const d = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await apiClient.get('/dashboard/stats');
        if (res.success) {
          setStats(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.message || 'Connecting to server failed');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div id="dashboard-loader" className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
        Error loading statistical dashboard: {error}
      </div>
    );
  }

  // Safely find department stats
  const departmentsList = stats?.deptStats || [];
  
  // Custom layout order matching screenshot exactly
  const customOrder = [
    'Property Management',
    'Security',
    'STP',
    'Technical',
    'Housekeeping',
    'Waste Management',
    'Horticulture',
    'Parking Management'
  ];

  const sortedDepts = [...departmentsList].sort((a, b) => {
    const idxA = customOrder.indexOf(a.department);
    const idxB = customOrder.indexOf(b.department);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.department.localeCompare(b.department);
  });

  return (
    <div id="dashboard-essl-root" className="space-y-3 sm:space-y-4">
      <div className="space-y-0.5">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-xs text-slate-500">
          Welcome, <span className="font-bold text-slate-700">{user?.name || 'User'}</span> — {getFormattedDate()}
        </p>
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-2 gap-3">
        <div id="pending-leaves" className="bg-[#efeaf8] rounded-xl p-4 flex flex-col items-center justify-center text-center font-sans h-24 select-none">
          <span className="text-[10px] font-semibold text-[#6e589a]/90 mb-1">Pending Leaves</span>
          <span className="text-4xl font-normal text-[#4d3663]">{stats?.cards?.pendingLeaves ?? 1}</span>
        </div>
        <div id="pending-changes" className="bg-[#efeaf8] rounded-xl p-4 flex flex-col items-center justify-center text-center font-sans h-24 select-none">
          <span className="text-[10px] font-semibold text-[#6e589a]/90 mb-1">Pending Att. Changes</span>
          <span className="text-4xl font-normal text-[#4d3663]">{stats?.cards?.pendingChanges ?? 1}</span>
        </div>
      </div>

      {/* COLLAPSIBLE ECOWORLD SECTION */}
      <div className="bg-white rounded-xl border border-slate-150/80 shadow-xs overflow-hidden">
        <button
          id="ecoworld-section-header"
          onClick={() => setIsEcoExpanded(!isEcoExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50/50 transition-colors border-b border-slate-100 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            {isEcoExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
            <GitBranch className="h-4 w-4 text-slate-400 rotate-90" />
            <span className="font-bold text-[#1f4277] text-xs sm:text-sm tracking-tight">
              EcoWorld <span className="text-slate-400 font-normal">({stats?.cards?.totalEmployees ?? 0})</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold font-sans">
            <span className="text-[#10b981]">P: <span className="font-normal text-slate-600">{stats?.cards?.present ?? 0}</span></span>
            <span className="text-rose-500">A: <span className="font-semibold text-rose-500">{stats?.cards?.absent ?? 0}</span></span>
            <span className="text-slate-500">L: <span className="font-normal text-slate-600">{stats?.cards?.leave ?? 0}</span></span>
          </div>
        </button>

        {isEcoExpanded && (
          <div className="p-3 sm:p-4 space-y-3">
            {/* 4 KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total</span>
                <span className="text-xl font-black text-slate-800">{stats?.cards?.totalEmployees ?? 0}</span>
              </div>
              <div className="bg-[#e2f5ec] border border-[#c4ebd8] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-wider mb-0.5">Present</span>
                <span className="text-xl font-black text-emerald-700">{stats?.cards?.present ?? 0}</span>
              </div>
              <div className="bg-[#fdeded] border border-[#fbd3d3] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wider mb-0.5">Absent</span>
                <span className="text-xl font-black text-red-600">{stats?.cards?.absent ?? 0}</span>
              </div>
              <div className="bg-[#fef3eb] border border-[#fde2cb] rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-xs">
                <span className="text-[9px] text-amber-600 font-bold uppercase tracking-wider mb-0.5">Leave</span>
                <span className="text-xl font-black text-orange-600">{stats?.cards?.leave ?? 0}</span>
              </div>
            </div>

            {/* DEPARTMENT TABLE */}
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table id="dept-essl-table" className="w-full text-left border-collapse min-w-[360px]">
                <thead>
                  <tr className="bg-[#b3d3e8]/45 text-[#1f4277] border-b border-slate-200 text-xs font-bold">
                    <th className="py-2 px-3 sm:px-4 font-bold text-left">Department</th>
                    <th className="py-2 px-3 font-bold text-center">Total</th>
                    <th className="py-2 px-3 font-bold text-center">Present</th>
                    <th className="py-2 px-3 font-bold text-center">Absent</th>
                    <th className="py-2 px-3 font-bold text-center">Leave</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {sortedDepts.map((d, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 sm:px-4 font-semibold text-slate-700">{d.department}</td>
                      <td className="py-2 px-3 text-center font-semibold text-slate-600">{d.total}</td>
                      <td className="py-2 px-3 text-center font-semibold text-[#10b981]">{d.present || 0}</td>
                      <td className={`py-2 px-3 text-center font-semibold ${d.absent > 0 ? 'text-[#991b1b]' : 'text-slate-500'}`}>{d.absent || 0}</td>
                      <td className={`py-2 px-3 text-center font-semibold ${d.leave > 0 ? 'text-[#f59e0b]' : 'text-slate-500'}`}>{d.leave || 0}</td>
                    </tr>
                  ))}
                  {sortedDepts.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-400 italic text-xs">No departments.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
