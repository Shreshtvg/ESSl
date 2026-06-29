import { useState, useEffect } from 'react';
import {
  Check,
  X,
  Trash2,
  HelpCircle,
  Search,
  FileSpreadsheet,
  FileText,
  CalendarClock,
  SlidersHorizontal
} from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useToast } from '../contexts/ToastContext';

export default function AttendanceChanges() {
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog(s => ({ ...s, open: false }));
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [historyPeriod, setHistoryPeriod] = useState('Today');

  // Approval Modal States
  const [actioningRequest, setActioningRequest] = useState(null);
  const [privilegeError, setPrivilegeError] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const chgRes = await apiClient.get('/attendance-changes');
      if (chgRes.success) {
        setChanges(chgRes.data);
      }
    } catch (err) {
      console.error('Failed to load punch correction requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenAction = (request) => {
    if (request.status !== 'Pending') {
      toast.info(`This request is already ${request.status} and cannot be changed.`);
      return;
    }
    if (user?.role !== 'Supervisor') {
      setPrivilegeError(true);
      return;
    }
    setActioningRequest(request);
  };

  const handleApproveStatus = async (id, statusValue) => {
    if (user?.role !== 'Supervisor') {
      setPrivilegeError(true);
      setActioningRequest(null);
      return;
    }
    try {
      const res = await apiClient.patch(`/attendance-changes/${id}`, {
        status: statusValue
      });
      if (res.success) {
        setActioningRequest(null);
        loadAll();
        refreshNotifications();
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  const handleDelete = (id) => {
    openConfirm(
      'Delete Change Request',
      'This action is permanent and cannot be undone.',
      async () => {
        try {
          const res = await apiClient.delete(`/attendance-changes/${id}`);
          if (res.success) loadAll();
        } catch (err) {
          toast.error(err.message || 'Deletion failed');
        }
      }
    );
  };

  // Date formatter (e.g. "2026-06-22" -> "22 Jun 2026")
  const formatDateToMockup = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const yr = parts[0];
      const moIndex = parseInt(parts[1], 10) - 1;
      const dy = parseInt(parts[2], 10);
      const date = new Date(yr, moIndex, dy);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }); // e.g. "01 Apr 2026"
      }
    }
    return dateStr;
  };

  // Filtering Pending requests
  const pendingRequests = changes.filter((c) => {
    if (c.status !== 'Pending') return false;
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (c.employee_name || '').toLowerCase().includes(q) ||
      (c.employee_code || '').toLowerCase().includes(q) ||
      (c.reason || '').toLowerCase().includes(q) ||
      (c.requested_check_in || '').toLowerCase().includes(q) ||
      (c.requested_check_out || '').toLowerCase().includes(q)
    );
  });

  // Filtering Resolved history requests by period
  const historyRequests = changes.filter((c) => {
    if (c.status === 'Pending') return false;
    if (historyPeriod === 'All') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const parts = (c.attendance_date || '').split('-');
    if (parts.length !== 3) return false;
    const rec = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    if (historyPeriod === 'Today') {
      return rec.getTime() === today.getTime();
    }
    if (historyPeriod === 'This Week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return rec >= weekStart && rec <= today;
    }
    if (historyPeriod === 'This Month') {
      return rec.getMonth() === today.getMonth() && rec.getFullYear() === today.getFullYear();
    }
    return true;
  });

  // Excel Export Handler — exports only resolved (Approved/Rejected) requests matching current period filter
  const exportToExcel = () => {
    if (historyRequests.length === 0) {
      toast.info('No resolved requests to export. Try changing the period filter.');
      return;
    }
    const BOM = '﻿';
    let csv = BOM + 'Employee Code,Employee Name,Date,Requested Status,Check In,Check Out,Reason,Reviewed By,Status\n';
    historyRequests.forEach((c) => {
      const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      csv += [
        esc(c.employee_code),
        esc(c.employee_name),
        esc(formatDateToMockup(c.attendance_date)),
        esc(c.requested_status),
        esc(c.requested_check_in),
        esc(c.requested_check_out),
        esc(c.reason),
        esc(c.approver_name),
        esc(c.status),
      ].join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Attendance_Changes_History_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // PDF Export Handler — opens a print-preview window with the filtered history table
  const exportToPdf = () => {
    if (historyRequests.length === 0) {
      toast.info('No resolved requests to export. Try changing the period filter.');
      return;
    }
    const tableRows = historyRequests.map((c) => {
      const statusClass = c.status === 'Approved' ? 'approved' : 'rejected';
      return `<tr>
        <td>${c.employee_code || ''}</td>
        <td>${c.employee_name || ''}</td>
        <td>${formatDateToMockup(c.attendance_date)}</td>
        <td>${c.requested_status || ''}</td>
        <td>${c.requested_check_in || '-'}</td>
        <td>${c.requested_check_out || '-'}</td>
        <td>${c.reason || ''}</td>
        <td>${c.approver_name || ''}</td>
        <td class="${statusClass}">${c.status}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Attendance Changes History &mdash; ${historyPeriod}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 24px; color: #1e293b; }
    h2 { font-size: 15px; margin: 0 0 4px; }
    .meta { font-size: 10px; color: #64748b; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a5f; color: #fff; padding: 6px 8px; text-align: left; font-size: 10px; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; }
    tr:nth-child(even) td { background: #f8fafc; }
    .approved { color: #059669; font-weight: bold; }
    .rejected { color: #dc2626; font-weight: bold; }
    @media print { @page { margin: 1cm; } body { margin: 0; } }
  </style>
</head>
<body>
  <h2>Attendance Changes History</h2>
  <p class="meta">Period: <strong>${historyPeriod}</strong> &nbsp;&bull;&nbsp; Generated: ${systemCurrentDate} &nbsp;&bull;&nbsp; Records: ${historyRequests.length}</p>
  <table>
    <thead>
      <tr>
        <th>Emp Code</th><th>Employee Name</th><th>Date</th><th>Type</th>
        <th>Check In</th><th>Check Out</th><th>Reason</th><th>Reviewed By</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
</body>
</html>`;

    const pw = window.open('', '_blank', 'width=960,height=640');
    if (pw) {
      pw.document.write(html);
      pw.document.close();
      pw.focus();
      setTimeout(() => pw.print(), 400);
    }
  };

  const systemCurrentDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* PRIVILEGE ERROR BANNER */}
      {privilegeError && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-semibold shadow-xs">
          <span>You do not have the privilege to approve or reject attendance change requests. Only Supervisors can perform this action.</span>
          <button onClick={() => setPrivilegeError(false)} className="ml-4 text-red-500 hover:text-red-700 font-bold text-sm leading-none cursor-pointer">✕</button>
        </div>
      )}

      {/* HEADER SECTION WITH EXPORT BUTTONS */}
      <div className="flex justify-between items-start bg-transparent py-1">
        <div className="space-y-1">
          <h2 className="font-sans font-bold text-[#2c3e50] text-[#1e293b] text-xl">
            Approve Attendance Changes
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          {/* EXCEL EXPORT BUTTON */}
          <button
            onClick={exportToExcel}
            className="px-3.5 py-1.5 bg-[#ebf5fb] text-slate-700 hover:bg-[#d8eaf6] border border-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <span className="text-emerald-600 font-extrabold text-xs">📊</span>
            <span>Excel</span>
          </button>

          {/* PDF EXPORT BUTTON */}
          <button
            onClick={exportToPdf}
            className="px-3.5 py-1.5 bg-[#ebf5fb] text-slate-700 hover:bg-[#d8eaf6] border border-slate-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <span className="text-red-500 font-extrabold text-xs">📕</span>
            <span>PDF</span>
          </button>

        </div>
      </div>

      {/* PENDING REQUESTS CONTAINER */}
      <div className="space-y-3.5">
        <div className="border-b border-slate-100 pb-1">
          <h3 className="font-sans font-bold text-[#2c5270] text-sm tracking-tight">
            Pending Requests
          </h3>
        </div>

        {/* SEARCH BOX */}
        <div className="w-full max-w-xs relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-450" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 outline-none rounded-xl text-xs text-slate-700 bg-white focus:bg-white transition-all font-sans font-semibold focus:border-[#ab93d6]"
          />
        </div>

        {loading ? (
          <div className="h-32 flex items-center justify-center bg-white border border-slate-100 rounded-2xl">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#ab93d6]"></div>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                    <th className="py-2.5 px-6 font-bold w-1/4">Employee</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Date</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Type</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Check In</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Check Out</th>
                    <th className="py-2.5 px-6 font-bold w-1/5">Reason</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Requested By</th>
                    <th className="py-2.5 px-6 font-bold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                  {pendingRequests.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2 px-3 sm:px-4 font-semibold text-slate-800 leading-tight">
                        {c.employee_code} - {c.employee_name}
                      </td>
                      <td className="py-2 px-3 sm:px-4 font-mono font-medium text-slate-600">
                        {formatDateToMockup(c.attendance_date)}
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-slate-600 font-semibold text-xs">
                        {c.requested_status || 'Present'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 font-mono font-semibold text-emerald-600 text-center sm:text-left">
                        {c.requested_check_in || '-'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 font-mono font-semibold text-amber-600 text-center sm:text-left">
                        {c.requested_check_out || '-'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-slate-600 font-medium whitespace-normal break-words max-w-xs leading-relaxed">
                        {c.reason || 'Forgot to punch'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-slate-700 font-semibold">
                        {c.approver_name || 'Shwetha Supervisor'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-center">
                        <button
                          onClick={() => handleOpenAction(c)}
                          id={`actions-pending-btn-${c.id}`}
                          className="bg-[#fff9eb] hover:bg-[#ffeec2] text-[#d97706] font-bold px-3 py-1 rounded-lg text-xs leading-none transition-all cursor-pointer shadow-2xs active:scale-[0.97]"
                        >
                          Pending
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-2xs">
            <CalendarClock className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No pending adjustment requests list</p>
            <p className="text-xs text-slate-400">All clock changes have been corrected or processed.</p>
          </div>
        )}
      </div>

      {/* HISTORY SECTION */}
      <div className="space-y-3.5 pt-2">
        <div className="border-b border-slate-100 pb-1">
          <h3 className="font-sans font-bold text-[#2c5270] text-sm tracking-tight">
            History
          </h3>
        </div>

        {/* PERIOD DROPDOWN CARD */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-3xs flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Period:</span>
            <select
              value={historyPeriod}
              onChange={(e) => setHistoryPeriod(e.target.value)}
              className="border border-slate-200 outline-none rounded-xl px-3 py-1.5 text-xs text-slate-705 bg-white font-sans font-bold cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <option value="Today">Today</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="All">All Period</option>
            </select>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono">
            {systemCurrentDate}
          </span>
        </div>

        {historyRequests.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 text-xs font-bold font-sans">
                    <th className="py-2.5 px-4 font-bold w-1/4">Employee</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Date</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Type</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Check In</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Check Out</th>
                    <th className="py-2.5 px-4 font-bold w-1/5">Reason</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Reviewed By</th>
                    <th className="py-2.5 px-4 font-bold text-center">Status</th>
                    <th className="py-2.5 px-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {historyRequests.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2 px-4 font-semibold text-slate-800 leading-tight">
                        {c.employee_code} - {c.employee_name}
                      </td>
                      <td className="py-2 px-3 sm:px-4 font-mono font-medium text-slate-600">
                        {formatDateToMockup(c.attendance_date)}
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-slate-600 font-semibold">
                        {c.requested_status || 'Present'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 font-mono font-semibold text-emerald-600">
                        {c.requested_check_in || '-'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 font-mono font-semibold text-amber-600">
                        {c.requested_check_out || '-'}
                      </td>
                      <td className="py-2 px-4 text-slate-600 font-medium whitespace-normal break-words max-w-xs leading-relaxed">
                        {c.reason || '-'}
                      </td>
                      <td className="py-2 px-3 sm:px-4 text-slate-700 font-semibold">
                        {c.approver_name || '-'}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 bg-[#fbebeb] text-[#cf3a3a] hover:bg-[#f6dfdf] rounded-lg cursor-pointer transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl shadow-3xs">
            <p className="text-xs text-slate-400 font-bold tracking-wide">
              No history for this period.
            </p>
          </div>
        )}
      </div>

      {/* ACTION APPROVAL MODAL */}
      <Modal
        id="approve-action-modal"
        isOpen={actioningRequest !== null}
        onClose={() => setActioningRequest(null)}
        title="Approve / Reject Punch Correction"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
            <p className="text-slate-650">
              <strong className="text-slate-800">Employee:</strong> {actioningRequest?.employee_code} - {actioningRequest?.employee_name}
            </p>
            <p className="text-slate-650">
              <strong className="text-slate-800">Target Date:</strong> {formatDateToMockup(actioningRequest?.attendance_date)}
            </p>
            <p className="text-slate-650">
              <strong className="text-slate-800">Requested Status:</strong>{' '}
              <span className="font-semibold text-blue-700">{actioningRequest?.requested_status || 'Present'}</span>
            </p>
            {actioningRequest?.requested_status === 'Present' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="bg-white p-2 rounded-xl border border-slate-150">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Req Check In</span>
                  <span className="font-mono text-emerald-600 font-bold text-sm">{actioningRequest?.requested_check_in || '-'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-150">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Req Check Out</span>
                  <span className="font-mono text-amber-600 font-bold text-sm">{actioningRequest?.requested_check_out || '-'}</span>
                </div>
              </div>
            )}
            <p className="text-slate-650 pt-1">
              <strong className="text-slate-800">Reason Given:</strong> <span className="italic">"{actioningRequest?.reason || 'No reason specified'}"</span>
            </p>
          </div>

          <p className="text-xs text-slate-500 font-semibold text-center leading-normal">
            Select the appropriate review state for this punch correction.
          </p>

          <div className="grid grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
            <button
              onClick={() => setActioningRequest(null)}
              type="button"
              className="px-3 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id={`reject-action-btn-${actioningRequest?.id}`}
              onClick={() => handleApproveStatus(actioningRequest.id, 'Rejected')}
              type="button"
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
            >
              Reject Request
            </button>
            <button
              id={`approve-action-btn-${actioningRequest?.id}`}
              onClick={() => handleApproveStatus(actioningRequest.id, 'Approved')}
              type="button"
              className="px-3 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
            >
              Approve Correct
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => { confirmDialog.onConfirm?.(); closeConfirm(); }}
        onCancel={closeConfirm}
      />
    </div>
  );
}
