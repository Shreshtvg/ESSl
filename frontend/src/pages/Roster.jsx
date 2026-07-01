import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Check, X } from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useToast } from '../contexts/ToastContext';

export default function Roster() {
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const toast = useToast();
  const [rosters, setRosters] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rosterRequests, setRosterRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDept, setSelectedDept] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [myRequestsOpen, setMyRequestsOpen] = useState(true);

  const [gridChanges, setGridChanges] = useState({});
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [rostRes, empRes, deptRes, reqRes] = await Promise.all([
        apiClient.get('/rosters'),
        apiClient.get('/employees'),
        apiClient.get('/departments'),
        apiClient.get('/roster-changes')
      ]);
      if (rostRes.success) setRosters(rostRes.data);
      if (empRes.success) setEmployees(empRes.data);
      if (deptRes.success) setDepartments(deptRes.data);
      if (reqRes.success) setRosterRequests(reqRes.data);
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const getDatesForMonth = (monthSelect) => {
    const baseDate = new Date();
    let year = baseDate.getFullYear();
    let month = baseDate.getMonth();

    if (monthSelect === 'Last Month') {
      month -= 1;
      if (month < 0) { month = 11; year -= 1; }
    } else if (monthSelect === 'Next Month') {
      month += 1;
      if (month > 11) { month = 0; year += 1; }
    }

    const endDate = new Date(year, month + 1, 0);
    const dates = [];
    const curr = new Date(year, month, 1);
    while (curr <= endDate) {
      const dayNum = String(curr.getDate()).padStart(2, '0');
      const daysArr = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
      const dayName = daysArr[curr.getDay()];
      const yyyy = curr.getFullYear();
      const mm = String(curr.getMonth() + 1).padStart(2, '0');
      const dd = String(curr.getDate()).padStart(2, '0');
      dates.push({ dayNum, dayName, dateStr: `${yyyy}-${mm}-${dd}`, rawDate: new Date(curr) });
      curr.setDate(curr.getDate() + 1);
    }
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const rangeText = `${String(1).padStart(2,'0')} ${monthNames[month].slice(0,3)} ${year} - ${String(endDate.getDate()).padStart(2,'0')} ${monthNames[month].slice(0,3)} ${year}`;
    return { dates, rangeText };
  };

  const bothFiltersSet = selectedDept !== '' && selectedMonth !== '';
  const { dates, rangeText } = bothFiltersSet ? getDatesForMonth(selectedMonth) : { dates: [], rangeText: '' };
  const { dates: requestDates } = getDatesForMonth('Current Month');

  const getCellStatus = (emp, date) => {
    const changeKey = `${emp.id}_${date.dateStr}`;
    if (gridChanges[changeKey] !== undefined) return gridChanges[changeKey];

    const override = rosters.find(r => r.employee_id === emp.id && r.roster_date === date.dateStr);
    if (override) return (override.status || 'W').toLowerCase();

    const dayOfWeek = date.rawDate.toLocaleDateString('en-US', { weekday: 'long' });
    const isWeekOff = String(emp.fixed_week_off || '').toLowerCase() === dayOfWeek.toLowerCase();
    return isWeekOff ? 'wo' : 'w';
  };

  const getOriginalStatus = (emp, date) => {
    const override = rosters.find(r => r.employee_id === emp.id && r.roster_date === date.dateStr);
    if (override) return (override.status || 'W').toLowerCase();
    const dow = date.rawDate.toLocaleDateString('en-US', { weekday: 'long' });
    return String(emp.fixed_week_off || '').toLowerCase() === dow.toLowerCase() ? 'wo' : 'w';
  };

  const handleCellClick = (emp, date) => {
    if (user?.role !== 'Admin' && user?.role !== 'Supervisor') return;
    const currentStatus = getCellStatus(emp, date);
    const nextStatus = currentStatus === 'w' ? 'wo' : currentStatus === 'wo' ? 'co' : 'w';

    // Apply the new status to ALL dates with the same weekday in the visible month
    const clickedDay = date.rawDate.getDay();
    const updatedChanges = { ...gridChanges };

    dates.forEach(d => {
      if (d.rawDate.getDay() !== clickedDay) return;
      const key = `${emp.id}_${d.dateStr}`;
      if (nextStatus === getOriginalStatus(emp, d)) {
        delete updatedChanges[key];
      } else {
        updatedChanges[key] = nextStatus;
      }
    });

    setGridChanges(updatedChanges);
  };

  // Save → submit change requests for approval
  const saveAllChanges = async () => {
    const changeEntries = Object.entries(gridChanges);
    if (changeEntries.length === 0) return;
    setSaving(true);
    try {
      for (const [key, status] of changeEntries) {
        const sep = key.indexOf('_');
        const empId = key.slice(0, sep);
        const dateStr = key.slice(sep + 1);
        const res = await apiClient.post('/roster-changes', {
          employee_id: Number(empId),
          roster_date: dateStr,
          requested_status: status.toUpperCase()
        });
        if (!res.success) throw new Error(res.message || 'Submit failed');
      }
      setGridChanges({});
      await loadAll();
      toast.success('Changes submitted for supervisor approval!');
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(err.message || 'Failed to submit roster change request');
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (id, status) => {
    const req = rosterRequests.find(r => r.id === id);
    if (req && req.status !== 'Pending') {
      toast.info(`This request is already ${req.status} and cannot be changed.`);
      return;
    }
    try {
      const res = await apiClient.patch(`/roster-changes/${id}`, { status });
      if (res.success) { await loadAll(); refreshNotifications(); }
    } catch (err) {
      toast.error(err.message || 'Review failed');
    }
  };

  const pendingRequests = rosterRequests.filter(r => r.status === 'Pending');
  const deptEmployees = employees.filter(emp =>
    String(emp.department_name).toLowerCase() === String(selectedDept).toLowerCase()
  );
  const numChanges = Object.keys(gridChanges).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[Number(m)-1]}`;
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-slate-800 text-xl">Roster</h2>
      </div>

      {/* MY REQUESTS — calendar grid style */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
        <button
          onClick={() => setMyRequestsOpen(!myRequestsOpen)}
          className="w-full flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors select-none text-left"
        >
          <div className="flex items-center gap-4">
            <span className="font-bold text-sm text-slate-700 flex items-center gap-1.5">
              {myRequestsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              My Requests
              {pendingRequests.length > 0 && (
                <span className="ml-1 bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </span>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 border-2 border-[#f59e0b] rounded-xs" />
                <span className="text-slate-500 text-[11px] font-medium">Pending</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-[#10b981] rounded-xs" />
                <span className="text-slate-500 text-[11px] font-medium">Approved</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 bg-[#ef4444] rounded-xs" />
                <span className="text-slate-500 text-[11px] font-medium">Rejected</span>
              </span>
            </div>
          </div>
        </button>

        {myRequestsOpen && (
          <div className="p-4 border-t border-slate-100">
            {rosterRequests.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-4">No roster change requests yet.</p>
            ) : (() => {
              // Build a map: employeeId → { code, name, requests: Map<dateStr, req> }
              const empMap = new Map();
              rosterRequests.forEach(req => {
                if (!empMap.has(req.employee_id)) {
                  empMap.set(req.employee_id, { code: req.employee_code, name: req.employee_name, reqByDate: new Map() });
                }
                empMap.get(req.employee_id).reqByDate.set(req.roster_date, req);
              });
              const empRows = Array.from(empMap.values());
              // Get employee fixed_week_off for default cell calculation
              const empMeta = new Map(employees.map(e => [e.id, e]));

              return (
                <div className="overflow-x-auto select-none rounded-xl border border-slate-200">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold divide-x divide-white">
                        <th className="py-2.5 px-4 font-bold min-w-[180px] w-[200px]">Employee</th>
                        {requestDates.map(d => (
                          <th key={d.dateStr} className="py-2.5 px-1 font-bold text-center text-[10px] whitespace-nowrap min-w-[34px]">
                            <div>{d.dayNum}</div>
                            <div className="font-normal text-[9px] opacity-80">{d.dayName}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {empRows.map(emp => {
                        const meta = Array.from(empMap.entries()).find(([, v]) => v === emp);
                        const empId = meta ? meta[0] : null;
                        const empData = empMeta.get(empId);
                        return (
                          <tr key={`${emp.code}-${emp.name}`} className="hover:bg-slate-50/40 divide-x divide-slate-150/40">
                            <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50/20">{emp.code} - {emp.name}</td>
                            {requestDates.map(d => {
                              const req = emp.reqByDate.get(d.dateStr);
                              if (req) {
                                // Cell has a request — style by status
                                const label = req.requested_status;
                                let cellStyle = '';
                                if (req.status === 'Pending') {
                                  cellStyle = label === 'WO'
                                    ? 'bg-white border-2 border-[#f59e0b] text-[#d97706]'
                                    : label === 'CO'
                                    ? 'bg-white border-2 border-[#facc15] text-amber-700'
                                    : 'bg-white border-2 border-[#7ed29b] text-emerald-700';
                                } else if (req.status === 'Approved') {
                                  cellStyle = label === 'WO'
                                    ? 'bg-[#fbcaca] text-rose-900 border border-[#f5abab]'
                                    : label === 'CO'
                                    ? 'bg-[#fef08a] text-amber-900 border border-[#facc15]'
                                    : 'bg-[#a6ecbe] text-emerald-900 border border-[#7ed29b]';
                                } else {
                                  // Rejected — muted
                                  cellStyle = 'bg-slate-100 text-slate-400 border border-slate-200 line-through';
                                }

                                const supervisorCanAct = user?.role === 'Supervisor' && req.status === 'Pending';
                                return (
                                  <td key={d.dateStr} className="py-2 px-0.5 text-center bg-white">
                                    {supervisorCanAct ? (
                                      <div className="flex flex-col items-center gap-0.5">
                                        <span className={`inline-flex items-center justify-center w-7 h-5 font-bold rounded text-[8px] select-none uppercase shadow-xs ${cellStyle}`}>
                                          {label}
                                        </span>
                                        <div className="flex gap-0.5">
                                          <button onClick={() => handleReview(req.id, 'Approved')} className="p-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded cursor-pointer" title="Approve">
                                            <Check className="h-2.5 w-2.5" />
                                          </button>
                                          <button onClick={() => handleReview(req.id, 'Rejected')} className="p-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded cursor-pointer" title="Reject">
                                            <X className="h-2.5 w-2.5" />
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className={`inline-flex items-center justify-center w-7 h-7 font-bold rounded text-[9px] select-none uppercase shadow-xs ${cellStyle}`}>
                                        {label}
                                      </span>
                                    )}
                                  </td>
                                );
                              }
                              // Default cell: compute W or WO
                              const dow = d.rawDate.toLocaleDateString('en-US', { weekday: 'long' });
                              const isWO = empData && String(empData.fixed_week_off || '').toLowerCase() === dow.toLowerCase();
                              return (
                                <td key={d.dateStr} className="py-2 px-0.5 text-center bg-white">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 font-bold rounded text-[9px] select-none uppercase shadow-xs ${
                                    isWO ? 'bg-[#fbcaca] text-rose-900 border border-[#f5abab]' : 'bg-[#a6ecbe] text-emerald-900 border border-[#7ed29b]'
                                  }`}>
                                    {isWO ? 'wo' : 'w'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* FILTER + CONTROLS */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="border border-slate-200 outline-none rounded-lg px-2.5 py-1.5 text-slate-705 bg-slate-50 focus:bg-white font-bold cursor-pointer"
              >
                <option value="">-- Select Department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-slate-200 outline-none rounded-lg px-2.5 py-1.5 text-slate-705 bg-slate-50 focus:bg-white font-bold cursor-pointer"
              >
                <option value="">-- Select Month --</option>
                <option value="Last Month">Last Month</option>
                <option value="Current Month">Current Month</option>
                <option value="Next Month">Next Month</option>
              </select>
            </div>
          </div>
          {bothFiltersSet && (
            <div className="text-xs font-mono font-bold text-slate-500">{rangeText}</div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-end items-stretch sm:items-center pt-2 border-t border-slate-100">
          {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
            <button
              id="save-roster-changes-btn"
              onClick={saveAllChanges}
              disabled={numChanges === 0 || saving}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2 bg-[#ab93d6] hover:bg-[#967ebe] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs ${
                numChanges === 0 ? 'opacity-55 cursor-not-allowed' : ''
              }`}
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Submitting...' : `Submit for Approval (${numChanges})`}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1 select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-[#a6ecbe] border border-[#7ed29b] rounded" />
            <span className="text-slate-600 font-semibold">W - Working</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-[#fbcaca] border border-[#f5abab] rounded" />
            <span className="text-slate-600 font-semibold">WO - Week Off</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 bg-[#fef08a] border border-[#facc15] rounded" />
            <span className="text-slate-600 font-semibold">CO - Comp Off</span>
          </div>
        </div>
      </div>

      {/* ROSTER GRID */}
      {!bothFiltersSet ? (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
          <p className="text-sm font-semibold text-slate-500 font-sans">Please select a department and month to view the roster.</p>
        </div>
      ) : loading ? (
        <div className="h-44 flex items-center justify-center bg-white border border-slate-100 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ab93d6]"></div>
        </div>
      ) : deptEmployees.length > 0 ? (
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs pb-1 select-none">
            <span className="font-bold text-slate-800 text-sm">
              {selectedDept} <span className="text-slate-400 font-bold ml-1">({deptEmployees.length} employees)</span>
            </span>
            {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
              <span className="text-slate-400 font-medium">Click cell to cycle · Submit for supervisor approval</span>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold divide-x divide-white">
                  <th className="py-2.5 px-4 font-bold min-w-[200px] w-[220px]">Employee</th>
                  {dates.map((d) => (
                    <th key={d.dateStr} className="py-2.5 px-1 font-bold text-center text-[10px] whitespace-nowrap min-w-[34px]">
                      <div>{d.dayNum}</div>
                      <div className="font-normal text-[9px] opacity-80">{d.dayName}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {deptEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/40 divide-x divide-slate-150/40">
                    <td className="py-2 px-3 font-semibold text-slate-700 bg-slate-50/20">{emp.employee_code} - {emp.name}</td>
                    {dates.map((d) => {
                      const status = getCellStatus(emp, d);
                      const hasPendingReq = rosterRequests.some(
                        r => r.employee_id === emp.id && r.roster_date === d.dateStr && r.status === 'Pending'
                      );
                      let style = '';
                      if (status === 'w') style = 'bg-[#a6ecbe] text-emerald-900 border border-[#7ed29b]';
                      else if (status === 'wo') style = 'bg-[#fbcaca] text-rose-900 border border-[#f5abab]';
                      else style = 'bg-[#fef08a] text-amber-900 border border-[#facc15]';

                      return (
                        <td
                          key={d.dateStr}
                          onClick={() => handleCellClick(emp, d)}
                          className={`py-2 px-0.5 text-center bg-white relative ${
                            user?.role === 'Admin' || user?.role === 'Supervisor'
                              ? 'cursor-pointer hover:brightness-95 transition-all'
                              : ''
                          }`}
                        >
                          <span className={`inline-flex items-center justify-center w-7 h-7 font-bold rounded text-[9px] select-none uppercase shadow-xs ${style}`}>
                            {status}
                          </span>
                          {hasPendingReq && (
                            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full" title="Pending approval" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-100 rounded-2xl">
          <p className="text-sm font-semibold text-slate-500 font-sans">No employees in this department.</p>
        </div>
      )}
    </div>
  );
}
