import { useState, useEffect } from 'react';
import { 
  Plus, 
  Check, 
  X, 
  Trash2, 
  Edit2, 
  Search, 
  HelpCircle, 
  PlaneTakeoff, 
  CalendarDays,
  Pencil
} from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useToast } from '../contexts/ToastContext';

export default function LeaveRequests() {
  const { user } = useAuth();
  const { refresh: refreshNotifications } = useNotifications();
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog(s => ({ ...s, open: false }));

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & sorting
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLeave, setEditingLeave] = useState(null);

  // Add form properties
  const [employeeId, setEmployeeId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveType, setLeaveType] = useState('Casual');
  const [reason, setReason] = useState('');

  // Edit form properties
  const [editStatus, setEditStatus] = useState('Pending');
  const [editLeaveType, setEditLeaveType] = useState('Casual');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editReason, setEditReason] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [leavesRes, empRes] = await Promise.all([
        apiClient.get('/leaves'),
        apiClient.get('/employees')
      ]);

      if (leavesRes.success) {
        setLeaves(leavesRes.data);
      }
      if (empRes.success) {
        setEmployees(empRes.data);
        if (empRes.data.length > 0) {
          setEmployeeId(empRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenAdd = () => {
    if (employees.length > 0) setEmployeeId(employees[0].id);
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setLeaveType('Casual');
    setReason('');
    setAddModalOpen(true);
  };

  const handleSaveAdd = async (e) => {
    e.preventDefault();
    if (!employeeId || !startDate || !endDate || !leaveType) return;

    try {
      const res = await apiClient.post('/leaves', {
        employee_id: Number(employeeId),
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason: reason.trim(),
        status: 'Pending'
      });
      if (res.success) {
        setAddModalOpen(false);
        loadAll();
      }
    } catch (err) {
      toast.error(err.message || 'Error submitting leave request');
    }
  };

  const handleOpenEdit = (l) => {
    if (l.status !== 'Pending') {
      toast.info(`This leave is already ${l.status} and cannot be edited.`);
      return;
    }
    setEditingLeave(l);
    setEditStatus(l.status || 'Pending');
    setEditLeaveType(l.leave_type || 'Casual');
    setEditStartDate(l.start_date || '');
    setEditEndDate(l.end_date || '');
    setEditReason(l.reason || '');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingLeave) return;

    try {
      const payload = user?.role === 'Supervisor'
        ? { status: editStatus }
        : { leave_type: editLeaveType, start_date: editStartDate, end_date: editEndDate, reason: editReason };

      const res = await apiClient.patch(`/leaves/${editingLeave.id}`, payload);
      if (res.success) {
        setEditModalOpen(false);
        setEditingLeave(null);
        loadAll();
        refreshNotifications();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update leave request');
    }
  };

  const handleDelete = (id) => {
    openConfirm(
      'Delete Leave Request',
      'This action is permanent and cannot be undone.',
      async () => {
        try {
          const res = await apiClient.delete(`/leaves/${id}`);
          if (res.success) loadAll();
        } catch (err) {
          toast.error(err.message || 'Failed to delete leave request');
        }
      }
    );
  };

  // Convert "2026-04-06" to "06 Apr 2026"
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
        }); // e.g. "06 Apr 2026"
      }
    }
    return dateStr;
  };

  // Filter list
  const filteredLeaves = leaves.filter((l) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (l.employee_name || '').toLowerCase().includes(q) ||
      (l.employee_code || '').toLowerCase().includes(q) ||
      (l.leave_type || '').toLowerCase().includes(q) ||
      (l.status || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* TITLE ROW WITH PURPLE ADD LEAVE BUTTON */}
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-[#1e293b] text-xl">
          Leaves
        </h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="add-leave-btn-header"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#ab93d6] hover:bg-[#9a7ecb] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all duration-150 shadow-xs cursor-pointer select-none focus:outline-none"
          >
            Add Leave
          </button>
        )}
      </div>

      {/* ALL LEAVES BAR */}
      <div className="space-y-3.5">
        <div className="border-b border-slate-100 pb-1">
          <h3 className="font-sans font-bold text-[#2c5270] text-sm tracking-tight">
            All Leaves
          </h3>
        </div>

        {/* SEARCH FORM BAR */}
        <div className="w-full max-w-xs relative animate-fadeIn">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-slate-450" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 outline-none rounded-xl text-xs text-slate-705 bg-white focus:bg-white transition-all font-sans font-semibold focus:border-[#ab93d6]"
          />
        </div>

        {/* LEAVES GRID DATATABLE */}
        {loading ? (
          <div className="h-32 flex items-center justify-center bg-white border border-slate-100 rounded-2xl">
            <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#ab93d6]"></div>
          </div>
        ) : filteredLeaves.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                    <th className="py-2 px-3 sm:px-4 font-bold">Employee</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Type</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">From</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">To</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Status</th>
                    <th className="py-2.5 px-6 font-bold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                  {filteredLeaves.map((l) => {
                    const isApproved = l.status === 'Approved';
                    const isPending = l.status === 'Pending';
                    const isRejected = l.status === 'Rejected';

                    return (
                      <tr key={l.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="py-2 px-3 sm:px-4 font-semibold text-slate-800">
                          {l.employee_code} - {l.employee_name}
                        </td>
                        <td className="py-2 px-3 sm:px-4 text-slate-600 font-semibold font-sans">
                          {l.leave_type || 'Other'}
                        </td>
                        <td className="py-2 px-3 sm:px-4 font-mono font-medium text-slate-600">
                          {formatDateToMockup(l.start_date)}
                        </td>
                        <td className="py-2 px-3 sm:px-4 font-mono font-medium text-slate-600">
                          {formatDateToMockup(l.end_date)}
                        </td>
                        <td className="py-3 px-6">
                          <span
                            className={`font-bold font-sans ${
                              isApproved ? 'text-emerald-600' :
                              isPending ? 'text-[#d97706]' :
                              'text-red-500'
                            }`}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            {/* PEINCIL / EDIT ACTION BUTTON */}
                            <button
                              id={`edit-leave-${l.id}`}
                              onClick={() => handleOpenEdit(l)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                l.status === 'Pending'
                                  ? 'bg-[#eaf4fc] text-[#4ea0e6] hover:bg-[#d8eafb] cursor-pointer'
                                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                              }`}
                              title={l.status === 'Pending' ? 'Edit / Approve Leave' : `Already ${l.status}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            {/* DELETE ACTION BUTTON */}
                            <button
                              id={`delete-leave-${l.id}`}
                              onClick={() => handleDelete(l.id)}
                              className="p-1.5 bg-[#fbebeb] text-[#cf3a3a] hover:bg-[#f6dfdf] rounded-lg cursor-pointer transition-colors"
                              title="Delete Leave"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-2 shadow-2xs">
            <PlaneTakeoff className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">No active leave records</p>
            <p className="text-xs text-slate-400">Click &quot;Add Leave&quot; above to book time off.</p>
          </div>
        )}
      </div>

      {/* EDIT LEAVE MODAL — role-based: Admin edits details, Supervisor approves */}
      <Modal
        id="edit-leave-modal"
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Leave"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {/* Employee (always readonly) */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Employee</label>
            <div className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-100 font-semibold">
              {editingLeave?.employee_code} - {editingLeave?.employee_name}
            </div>
          </div>

          {user?.role === 'Supervisor' ? (
            /* Supervisor: only approve/reject */
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-semibold font-sans cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          ) : (
            /* Admin: edit leave details */
            <>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Leave Type</label>
                <select
                  value={editLeaveType}
                  onChange={(e) => setEditLeaveType(e.target.value)}
                  className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-semibold font-sans cursor-pointer"
                >
                  <option value="Casual">Casual</option>
                  <option value="Comp Off">Comp Off</option>
                  <option value="Sick">Sick</option>
                  <option value="Maternity">Maternity</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Start Date</label>
                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => {
                      setEditStartDate(e.target.value);
                      if (editEndDate < e.target.value) setEditEndDate(e.target.value);
                    }}
                    className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">End Date</label>
                  <input
                    type="date"
                    value={editEndDate}
                    min={editStartDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Reason</label>
                <textarea
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all h-20 resize-none font-sans"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setEditModalOpen(false)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-650 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-edit-leave-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
            >
              {user?.role === 'Supervisor' ? 'Save Approval' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD LEAVE FORM MODAL */}
      <Modal id="add-leave-modal" isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSaveAdd} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Requested Staff Profile</label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-semibold font-sans cursor-pointer"
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.employee_code} - {e.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Leave Commenced Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Leave Concluded Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Leave Category Classification</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-semibold font-sans cursor-pointer"
            >
              <option value="Casual">Casual</option>
              <option value="Comp Off">Comp Off</option>
              <option value="Sick">Sick</option>
              <option value="Maternity">Maternity</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Statement Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Family gathering, out of station chore, medical consult..."
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all h-20 resize-none font-sans"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setAddModalOpen(false)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-leave-request-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Submit Leave Request
            </button>
          </div>
        </form>
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
