import { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  Download, 
  Printer, 
  UserPlus, 
  Edit2, 
  HelpCircle,
  Calendar,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { exportToExcel } from '../utils/export';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Attendance() {
  const { user } = useAuth();
  const toast = useToast();
  
  const getTodayDateString = () => new Date().toISOString().split('T')[0];
  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [departments, setDepartments] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Period state mapping
  const [period, setPeriod] = useState('Today');

  // Dropdown filter states
  const [filterBranch, setFilterBranch] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterShift, setFilterShift] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Accordion expanding registers
  const [expandedDepts, setExpandedDepts] = useState({});

  // Editing attendance state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [editStatus, setEditStatus] = useState('Present');
  const [editReason, setEditReason] = useState('');
  const [editSubmitSuccess, setEditSubmitSuccess] = useState(false);

  // Sync Period with active Date
  useEffect(() => {
    if (period === 'Today') {
      setSelectedDate(getTodayDateString());
    } else if (period === 'Yesterday') {
      setSelectedDate(getYesterdayDateString());
    } else {
      setSelectedDate(getTodayDateString());
    }
  }, [period]);

  // Load ancillary lists
  useEffect(() => {
    async function initPage() {
      try {
        const [deptsRes, shiftsRes] = await Promise.all([
          apiClient.get('/departments'),
          apiClient.get('/shifts')
        ]);
        if (deptsRes.success) setDepartments(deptsRes.data);
        if (shiftsRes.success) setShifts(shiftsRes.data);
      } catch (err) {
        console.error('Ancillary list load failed:', err);
      }
    }
    initPage();
  }, []);

  // Fetch actual logs on dates
  const loadAttendance = async () => {
    setLoading(true);
    try {
      const url = `/attendance?date=${selectedDate}`;
      const res = await apiClient.get(url);
      if (res.success) {
        setAttendanceData(res.data);
        
        // Auto-expand all depts with entries on first load
        const expands = {};
        res.data.forEach(d => {
          expands[d.departmentName] = true;
        });
        setExpandedDepts(expands);
        setError('');
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Connecting to server failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const toggleDept = (deptName) => {
    setExpandedDepts(prev => ({
      ...prev,
      [deptName]: !prev[deptName]
    }));
  };

  // Triggers punch editing
  const handleEditClick = (employee) => {
    setEditingEmployee(employee);
    setEditCheckIn(employee.checkIn || '09:00');
    setEditCheckOut(employee.checkOut || '18:00');
    setEditStatus(employee.status || 'Present');
    setEditReason('');
    setEditSubmitSuccess(false);
    setEditModalOpen(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      if (user?.role === 'Supervisor') {
        // Supervisor saves directly — no change request needed
        const res = await apiClient.post('/attendance', {
          employeeId: editingEmployee.employeeId,
          attendanceDate: selectedDate,
          status: editStatus,
          checkIn: editStatus === 'Present' ? editCheckIn : null,
          checkOut: editStatus === 'Present' ? editCheckOut : null,
        });
        if (res.success) {
          setEditSubmitSuccess(true);
          loadAttendance();
        }
      } else {
        // Admin submits a change request for Supervisor approval
        const res = await apiClient.post('/attendance-changes', {
          employee_id: editingEmployee.employeeId,
          attendance_date: selectedDate,
          attendance_id: editingEmployee.attendanceId || null,
          requested_status: editStatus,
          requested_check_in: editStatus === 'Present' ? editCheckIn : null,
          requested_check_out: editStatus === 'Present' ? editCheckOut : null,
          reason: editReason || 'Manual correction requested'
        });
        if (res.success) {
          setEditSubmitSuccess(true);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    }
  };

  // Export dataset handler
  const triggerExcelExport = () => {
    if (!isFilterApplied) {
      toast.info('No data available — please select a filter first.');
      return;
    }
    const flatRows = [];
    filteredDepartments.forEach(dept => {
      dept.employees.forEach(emp => {
        flatRows.push({
          'Dept': dept.departmentName,
          'Emp Code': emp.employeeCode,
          'Name': emp.employeeName,
          'Designation': emp.designation,
          'Branch': emp.branch,
          'Check In': emp.status === 'Present' ? (emp.checkIn || '-') : '-',
          'Check Out': emp.status === 'Present' ? (emp.checkOut || '-') : '-',
          'Hours': emp.status === 'Present' ? (emp.hours || 0) : 0,
          'Status': emp.status
        });
      });
    });
    exportToExcel(['Department', 'Employee Code', 'Employee Name', 'Designation', 'Branch', 'Check In', 'Check Out', 'Hours', 'Status'], flatRows, `attendance_report_${selectedDate}`);
  };

  const triggerPdfExport = () => {
    if (!isFilterApplied) {
      toast.info('No data available — please select a filter first.');
      return;
    }
    if (filteredDepartments.length === 0) {
      toast.info('No data to export for the selected filters.');
      return;
    }

    const filterParts = [];
    if (filterBranch !== 'All') filterParts.push(`Branch: ${filterBranch}`);
    if (filterDept !== 'All') {
      const d = departments.find(dep => String(dep.id) === String(filterDept));
      filterParts.push(`Dept: ${d ? d.name : filterDept}`);
    }
    if (filterShift !== 'All') {
      const s = shifts.find(sh => String(sh.id) === String(filterShift));
      filterParts.push(`Shift: ${s ? s.name : filterShift}`);
    }
    const filterLabel = filterParts.length > 0 ? filterParts.join(' | ') : 'All';

    const { totalEmployees, present, absent, leave, weekOff, holiday } = sums;

    const tableRows = filteredDepartments.flatMap(dept =>
      dept.employees.map(emp => {
        const statusClass = (emp.status || '').toLowerCase().replace(/\s+/g, '-');
        return `<tr>
          <td>${dept.departmentName}</td>
          <td>${emp.employeeCode}</td>
          <td>${emp.employeeName}</td>
          <td>${emp.designation || ''}</td>
          <td>${emp.branch || ''}</td>
          <td>${emp.status === 'Present' ? (emp.checkIn || '-') : '-'}</td>
          <td>${emp.status === 'Present' ? (emp.checkOut || '-') : '-'}</td>
          <td>${emp.status === 'Present' ? (emp.hours || 0) : 0}</td>
          <td class="s-${statusClass}">${emp.status}</td>
        </tr>`;
      })
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Report &mdash; ${formatDateFriendly(selectedDate)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; color: #1e293b; }
    h2 { font-size: 15px; margin: 0 0 4px; }
    .meta { font-size: 10px; color: #64748b; margin-bottom: 8px; }
    .summary { display: flex; gap: 18px; margin-bottom: 14px; font-size: 11px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .s-present { color: #059669; font-weight: bold; }
    .s-absent { color: #dc2626; font-weight: bold; }
    .s-leave { color: #d97706; font-weight: bold; }
    .s-holiday { color: #7c3aed; font-weight: bold; }
    .s-week-off { color: #94a3b8; font-weight: bold; }
    @media print { @page { margin: 1cm; size: landscape; } body { margin: 0; } }
  </style>
</head>
<body>
  <h2>Attendance Report</h2>
  <p class="meta">Date: <strong>${formatDateFriendly(selectedDate)}</strong> &nbsp;&bull;&nbsp; Filter: ${filterLabel}</p>
  <div class="summary">
    <span>Total: ${totalEmployees}</span>
    <span style="color:#059669">Present: ${present}</span>
    <span style="color:#dc2626">Absent: ${absent}</span>
    <span style="color:#d97706">Leave: ${leave}</span>
    <span style="color:#94a3b8">Week Off: ${weekOff}</span>
    <span style="color:#7c3aed">Holiday: ${holiday}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Department</th><th>Emp Code</th><th>Name</th><th>Designation</th><th>Branch</th>
        <th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

    const pw = window.open('', '_blank', 'width=1050,height=700');
    if (pw) {
      pw.document.write(html);
      pw.document.close();
      pw.focus();
      setTimeout(() => pw.print(), 400);
    }
  };

  const triggerVendorReportExport = async () => {
    if (!isFilterApplied) {
      toast.info('No data available — please select a filter first.');
      return;
    }
    try {
      const res = await apiClient.get('/reports/vendors');
      if (res.success) {
        const flatRows = res.data.map(row => ({
          'Vendor Name': row.vendor_name,
          'Employee Count': row.employee_count,
          'Total Hours Work': row.total_hours
        }));
        exportToExcel(['Vendor Name', 'Employee Count', 'Total Hours Work'], flatRows, `vendor_report_${selectedDate}`);
      } else {
        toast.error('Failed to load vendor report');
      }
    } catch (err) {
      toast.error(err.message || 'Error exporting vendor report');
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case 'Present':
        return 'text-emerald-600 font-bold';
      case 'Absent':
        return 'text-rose-500 font-bold';
      case 'Leave':
        return 'text-orange-500 font-bold';
      case 'Holiday':
        return 'text-purple-600 font-bold';
      case 'Week Off':
        return 'text-slate-400 font-bold';
      case 'Comp Off':
        return 'text-cyan-600 font-bold';
      default:
        return 'text-slate-500 font-bold';
    }
  };

  // Client filtering
  const filteredDepartments = attendanceData.map(dept => {
    // If specific dept filter checks
    if (filterDept !== 'All' && String(dept.departmentId) !== String(filterDept)) {
      return null;
    }

    const matchedEmployees = dept.employees.filter(emp => {
      // Search match
      const mathQuery = searchQuery.trim().toLowerCase();
      const codeMatch = emp.employeeCode.toLowerCase().includes(mathQuery);
      const nameMatch = emp.employeeName.toLowerCase().includes(mathQuery);
      const searchOk = mathQuery === '' || codeMatch || nameMatch;

      // Branch match
      const branchOk = filterBranch === 'All' || emp.branch === filterBranch;

      // Shift match
      const shiftOk = filterShift === 'All' || String(emp.shiftId) === String(filterShift);

      return searchOk && branchOk && shiftOk;
    });

    if (matchedEmployees.length === 0) return null;

    return {
      ...dept,
      employees: matchedEmployees
    };
  }).filter(Boolean);

  const getAggregationSums = () => {
    let totalEmployees = 0;
    let present = 0;
    let absent = 0;
    let leave = 0;
    let weekOff = 0;
    let holiday = 0;

    filteredDepartments.forEach(dept => {
      dept.employees.forEach(emp => {
        totalEmployees++;
        if (emp.status === 'Present') present++;
        else if (emp.status === 'Absent') absent++;
        else if (emp.status === 'Leave') leave++;
        else if (emp.status === 'Week Off') weekOff++;
        else if (emp.status === 'Holiday') holiday++;
      });
    });

    return { totalEmployees, present, absent, leave, weekOff, holiday };
  };

  const sums = getAggregationSums();

  const formatDateFriendly = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${monthNames[monthIdx]} ${year}`;
  };

  // Verify if a filter is active
  const isFilterApplied = filterBranch !== 'All' || filterDept !== 'All' || filterShift !== 'All';

  return (
    <div id="attendance-screen" className="space-y-3 sm:space-y-4">
      {/* HEADER TITLE WITH FLOATED EXPORTS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 id="attendance-header-title" className="text-xl font-bold text-slate-800 tracking-tight">Attendance</h1>
        <div className="flex items-center gap-2">
          <button
            id="export-excel-btn"
            onClick={triggerExcelExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            id="export-pdf-btn"
            onClick={triggerPdfExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <Printer className="h-3.5 w-3.5 text-rose-500" />
            <span>PDF</span>
          </button>
          <button
            id="export-vendor-btn"
            onClick={triggerVendorReportExport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer transition-all"
          >
            <UserPlus className="h-3.5 w-3.5 text-blue-500" />
            <span>Vendor Report</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR CONTAINER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-700 font-medium">
          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Branch:</span>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none hover:bg-slate-50 transition-colors font-sans cursor-pointer focus:border-blue-400"
            >
              <option value="All">All Branches</option>
              <option value="EcoWorld">EcoWorld</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Department:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none hover:bg-slate-50 transition-colors font-sans cursor-pointer focus:border-blue-400"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Shift:</span>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none hover:bg-slate-50 transition-colors font-sans cursor-pointer focus:border-blue-400"
            >
              <option value="All">All Shifts</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Period:</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none hover:bg-slate-50 transition-colors font-sans cursor-pointer focus:border-blue-400"
            >
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
            </select>
          </div>
        </div>

        {/* Quiet Active Date Display on right */}
        <div className="text-xs text-slate-400 font-medium font-sans">
          {formatDateFriendly(selectedDate)}
        </div>
      </div>

      {/* RENDER BODY ONLY WHEN FILTER IS CHOSEN */}
      {!isFilterApplied ? (
        <div id="no-filter-message" className="p-16 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-3">
          <Filter className="h-10 w-10 text-slate-300 animate-pulse" />
          <p className="text-base font-bold text-slate-700">No active filter applied</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Please select a Branch, Department, or Shift from the filter bar above to fetch and load live employee attendance logs.
          </p>
        </div>
      ) : (
        <>
          {/* SUMMARY BAND CARDS (4 Columns) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Card */}
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total</span>
              <span className="text-xl font-black text-slate-750 mt-1">{sums.totalEmployees}</span>
            </div>

            {/* Present Card */}
            <div className="bg-[#e2f5ec] border border-[#c4ebd8] p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
              <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Present</span>
              <span className="text-xl font-black text-emerald-700 mt-1">{sums.present}</span>
            </div>

            {/* Absent Card */}
            <div className="bg-[#fdeded] border border-[#fbd3d3] p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
              <span className="text-[10px] text-rose-500 uppercase tracking-wider font-bold">Absent</span>
              <span className="text-xl font-black text-red-600 mt-1">{sums.absent}</span>
            </div>

            {/* Leave Card */}
            <div className="bg-[#fef3eb] border border-[#fde2cb] p-4 rounded-xl flex flex-col items-center justify-center text-center shadow-xs">
              <span className="text-[10px] text-amber-600 uppercase tracking-wider font-bold">Leave</span>
              <span className="text-xl font-black text-orange-650 mt-1">{sums.leave}</span>
            </div>
          </div>

          {/* COLOR LEGENDS ROW */}
          <div className="flex flex-wrap gap-4 items-center px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-500/95 tracking-wide select-none">
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#10b981] rounded-xs shadow-xs"></span> <span>8+ hrs</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#34d399] rounded-xs shadow-xs"></span> <span>4-8 hrs</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#fbbf24] rounded-xs shadow-xs"></span> <span>&lt;4 hrs</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#fda4af] rounded-xs shadow-xs"></span> <span>No C/O</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#ef4444] rounded-xs shadow-xs"></span> <span>Absent</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#f59e0b] rounded-xs shadow-xs"></span> <span>Leave</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#06b6d4] rounded-xs shadow-xs"></span> <span>CO</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#64748b] rounded-xs shadow-xs"></span> <span>WO</span></span>
            <span className="flex items-center gap-1"><span className="h-3 w-4 bg-[#8b5cf6] rounded-xs shadow-xs"></span> <span>Holiday</span></span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-4 bg-[#92400e]/50 rounded-xs shadow-xs flex items-center justify-center">
                <span className="h-1 w-1 bg-white rounded-full"></span>
              </span> 
              <span>Pending</span>
            </span>
          </div>

          {/* MAIN COLLAPSIBLE ACCORDIONS */}
          <div className="space-y-4">
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
              </div>
            ) : filteredDepartments.length > 0 ? (
              filteredDepartments.map((dept, idx) => {
                const isExpanded = !!expandedDepts[dept.departmentName];
                return (
                  <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Accordion Trigger Head */}
                    <button
                      id={`accordion-trigger-${dept.departmentName.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => toggleDept(dept.departmentName)}
                      className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-50 border-b border-slate-100 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-slate-500 font-bold" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-slate-500 font-bold" />
                        )}
                        <span className="font-sans font-bold text-slate-800 text-sm">
                          {dept.departmentName}
                          <span className="text-xs font-normal text-slate-400 ml-1.5">({dept.employees.length})</span>
                        </span>
                      </div>
                    </button>

                    {/* Table View (shown inside the accordion box) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden bg-[#faf8f5]/5"
                        >
                          {/* Search box nested inside */}
                          <div className="p-3 bg-white border-b border-slate-100">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full max-w-xs border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-blue-400 transition-all font-sans"
                            />
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="bg-[#b3d3e8]/30 border-b border-slate-200">
                                <tr className="text-[11px] font-semibold text-slate-600 select-none">
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Employee <span className="text-slate-400 ml-0.5">⇅</span>
                                  </th>
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Designation <span className="text-slate-400 ml-0.5">⇅</span>
                                  </th>
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Status <span className="text-slate-400 ml-0.5">⇅</span>
                                  </th>
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Check In <span className="text-slate-400 ml-0.5">⇅</span>
                                  </th>
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Check Out <span className="text-slate-400 ml-0.5">⇅</span>
                                  </th>
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Hours <span className="text-slate-400 ml-0.5">⇅</span>
                                  </th>
                                  <th className="py-2.5 px-4 font-bold text-slate-600 text-left">
                                    Actions
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 bg-white">
                                {dept.employees.map((emp) => (
                                  <tr key={emp.employeeId} className="hover:bg-slate-50/60 transition-colors">
                                    {/* Combined Code & Name column */}
                                    <td className="py-2 px-3 text-blue-700 font-semibold cursor-pointer hover:underline text-xs">
                                      {emp.employeeCode} - {emp.employeeName}
                                    </td>
                                    <td className="py-2 px-3 text-slate-600">{emp.designation}</td>
                                    
                                    {/* Unencapsulated text status column */}
                                    <td className="py-3 px-4">
                                      <span className={getStatusTextColor(emp.status)}>
                                        {emp.status}
                                      </span>
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-500">
                                      {emp.status === 'Present' ? (emp.checkIn || '-') : '-'}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-500">
                                      {emp.status === 'Present' ? (emp.checkOut || '-') : '-'}
                                    </td>
                                    <td className="py-2 px-3 font-mono text-slate-500 font-semibold">
                                      {emp.status === 'Present' ? (emp.hours ? `${emp.hours}` : '-') : '-'}
                                    </td>
                                    {/* Actions column */}
                                    <td className="py-3 px-4">
                                      {user?.role === 'Admin' || user?.role === 'Supervisor' ? (
                                        <button
                                          id={`edit-punch-${emp.employeeCode}`}
                                          onClick={() => handleEditClick(emp)}
                                          className="p-1.5 bg-sky-50 text-sky-600 hover:bg-sky-100 rounded-full transition-colors cursor-pointer inline-flex items-center justify-center shadow-xs"
                                          title="Modify punches"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                      ) : (
                                        <span className="text-slate-300 italic text-[11px]">No access</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                <HelpCircle className="h-8 w-8 text-slate-300" />
                <p className="text-sm font-semibold text-slate-500">No matching attendance records found</p>
                <p className="text-xs text-slate-400 font-sans">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* EDITABLE MODAL */}
      <Modal id="edit-attendance-modal" isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditSubmitSuccess(false); }} title={user?.role === 'Supervisor' ? `Edit Attendance - [${editingEmployee?.employeeCode}]` : `Request Attendance Change - [${editingEmployee?.employeeCode}]`}>
        {editSubmitSuccess ? (
          <div className="space-y-4 font-sans text-center py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              {user?.role === 'Supervisor' ? (
                <>
                  <p className="text-sm font-bold text-slate-800">Attendance Updated</p>
                  <p className="text-xs text-slate-500">The attendance record has been saved directly.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-800">Request Submitted</p>
                  <p className="text-xs text-slate-500">The attendance change request has been sent for Supervisor approval.</p>
                </>
              )}
            </div>
            <button
              onClick={() => { setEditModalOpen(false); setEditSubmitSuccess(false); }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={saveEdit} className="space-y-4 font-sans">
            <div className={`p-3 rounded-xl text-xs space-y-1 ${user?.role === 'Supervisor' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>
              <p className="font-semibold block">Employee: {editingEmployee?.employeeName}</p>
              <p>Target Date: <span className="font-mono font-bold">{selectedDate}</span></p>
              <p className={`text-[10px] mt-1 ${user?.role === 'Supervisor' ? 'text-emerald-600' : 'text-blue-600'}`}>
                {user?.role === 'Supervisor'
                  ? 'Changes will be saved directly to the attendance record.'
                  : 'This will create a change request pending Supervisor approval.'}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Requested Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
                <option value="Holiday">Holiday</option>
                <option value="Week Off">Week Off</option>
                <option value="Comp Off">Comp Off</option>
              </select>
            </div>

            {editStatus === 'Present' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-550">Punch Check-In</label>
                  <input
                    type="time"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-550">Punch Check-Out</label>
                  <input
                    type="time"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
              </div>
            )}

            {user?.role !== 'Supervisor' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Reason <span className="text-slate-400 font-normal">(required)</span></label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Forgot to punch out, shift overrun..."
                  rows={2}
                  required
                  className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all resize-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditModalOpen(false)}
                type="button"
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="submit-punch-save-btn"
                type="submit"
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors ${
                  user?.role === 'Supervisor'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {user?.role === 'Supervisor' ? 'Save Attendance' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}
