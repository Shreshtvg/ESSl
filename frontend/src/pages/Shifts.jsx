import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HelpCircle } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Shifts() {
  const { user } = useAuth();
  const toast = useToast();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmShift, setDeleteConfirmShift] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');

  const loadShifts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/shifts');
      if (res.success) {
        setShifts(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setStartTime('09:00');
    setEndTime('18:00');
    setModalOpen(true);
  };

  const handleOpenEdit = (shift) => {
    setIsEditing(true);
    setEditingId(shift.id);
    setName(shift.name);
    setStartTime(shift.start_time);
    setEndTime(shift.end_time);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !startTime || !endTime) return;

    try {
      let res;
      if (isEditing) {
        res = await apiClient.put(`/shifts/${editingId}`, {
          name,
          start_time: startTime,
          end_time: endTime
        });
      } else {
        res = await apiClient.post('/shifts', {
          name,
          start_time: startTime,
          end_time: endTime
        });
      }

      if (res.success) {
        setModalOpen(false);
        loadShifts();
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const startDelete = (shift) => {
    setDeleteConfirmShift(shift);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmShift) return;
    try {
      const res = await apiClient.delete(`/shifts/${deleteConfirmShift.id}`);
      if (res.success) {
        setDeleteConfirmShift(null);
        loadShifts();
      }
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-slate-800 text-xl">Shifts</h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="add-shift-button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#ab93d6] hover:bg-[#9a7ecb] active:scale-[0.98] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all duration-155 shadow-sm focus:outline-none"
          >
            <Plus className="h-4 w-4 stroke-[3.5]" />
            <span>Add Shift Range</span>
          </button>
        )}
      </div>

      {/* DATA GRID */}
      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ab93d6]"></div>
        </div>
      ) : shifts.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                  <th className="py-2 px-3 sm:px-4 font-bold">ID</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Shift Label</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Check In Limit</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Check Out Limit</th>
                  {(user?.role === 'Admin' || user?.role === 'Supervisor') && <th className="py-2.5 px-6 font-bold text-center w-32">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-2 px-3 sm:px-4 font-mono text-slate-500">#{shift.id}</td>
                    <td className="py-2 px-3 sm:px-4 font-bold text-slate-800">{shift.name}</td>
                    <td className="py-2 px-3 sm:px-4 font-mono font-semibold text-emerald-600">{shift.start_time}</td>
                    <td className="py-2 px-3 sm:px-4 font-mono font-semibold text-amber-600">{shift.end_time}</td>
                    {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                      <td className="py-2 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            id={`edit-shift-${shift.id}`}
                            onClick={() => handleOpenEdit(shift)}
                            className="p-1.5 bg-[#e3effa] text-[#4290d2] hover:bg-[#cee4f8] rounded-md cursor-pointer transition-all"
                            title="Edit Shift"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`delete-shift-${shift.id}`}
                            onClick={() => startDelete(shift)}
                            className="p-1.5 bg-[#fbe3e3] text-[#cf3a3a] hover:bg-[#f8cfcf] rounded-md cursor-pointer transition-all"
                            title="Delete Shift"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
          <HelpCircle className="h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">No shifts created yet</p>
          <p className="text-xs text-slate-400">Apply standard work timings above to configure shifts.</p>
        </div>
      )}

      {/* FORM MODAL */}
      <Modal id="add-shift-modal" isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Modify Shift Details' : 'Configure New Work Shift'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Shift Name / Label</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Regular Day Shift"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Standard Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Standard End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-shift-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Save Shift
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        id="delete-shift-confirm-modal"
        isOpen={deleteConfirmShift !== null}
        onClose={() => setDeleteConfirmShift(null)}
        title="Confirm Shift Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you sure you want to delete the shift <strong className="text-slate-800 font-bold">"{deleteConfirmShift?.name}"</strong>? Any employees currently scheduled under this shift will have their shifts unassigned.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirmShift(null)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-shift-btn"
              onClick={handleConfirmDelete}
              type="button"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Delete Shift
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
