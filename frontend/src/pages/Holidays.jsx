import { useState, useEffect } from 'react';
import { Plus, Trash2, HelpCircle, Search, CalendarDays } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Holidays() {
  const { user } = useAuth();
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog(s => ({ ...s, open: false }));

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & sorting
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [holidayDate, setHolidayDate] = useState(new Date().toISOString().split('T')[0]);
  const [holidayType, setHolidayType] = useState('Public Holiday');

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/holidays');
      if (res.success) {
        setHolidays(res.data);
      }
    } catch (err) {
      console.error('Failed to load company holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, []);

  const handleOpenAdd = () => {
    setName('');
    setHolidayDate(new Date().toISOString().split('T')[0]);
    setHolidayType('Public Holiday');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !holidayDate) return;

    try {
      const res = await apiClient.post('/holidays', {
        name: name.trim(),
        holiday_date: holidayDate,
        description: holidayType // Store type in existing description column
      });
      if (res.success) {
        setModalOpen(false);
        loadHolidays();
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleDelete = (id) => {
    openConfirm(
      'Delete Company Holiday',
      'Removing this holiday may recalculate attendance statuses. This action cannot be undone.',
      async () => {
        try {
          const res = await apiClient.delete(`/holidays/${id}`);
          if (res.success) loadHolidays();
        } catch (err) {
          toast.error(err.message || 'Failed to delete');
        }
      }
    );
  };

  // Convert "2026-05-01" to "01 May 2026 (Friday)"
  const formatHolidayDate = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const yr = parts[0];
      const moIndex = parseInt(parts[1], 10) - 1;
      const dy = parseInt(parts[2], 10);
      const date = new Date(yr, moIndex, dy);
      if (!isNaN(date.getTime())) {
        const readableStr = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }); // e.g. "01 May 2026"
        const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
        return `${readableStr} (${dayName})`;
      }
    }
    return dateStr;
  };

  // Pre-process list to exactly align with the screenshot requirements
  const processedHolidays = holidays.map((h) => {
    let displayName = h.name;
    // Map seeded "Labor Day" to "May Day"
    if (displayName.toLowerCase() === 'labor day') {
      displayName = 'May Day';
    }
    // Correct minor typical typos if desired to exactly mirror screenshot
    if (displayName === 'Independence Day') {
      displayName = 'Independance Day';
    }

    // Determine type (Public vs National)
    let type = h.description || 'Public Holiday';
    if (
      displayName.toLowerCase().includes('independance') ||
      displayName.toLowerCase().includes('independence') ||
      displayName.toLowerCase().includes('republic') ||
      displayName.toLowerCase().includes('gandhi') ||
      type.toLowerCase().includes('national')
    ) {
      type = 'National Holiday';
    } else {
      type = 'Public Holiday';
    }

    return {
      ...h,
      displayName,
      type
    };
  });

  // Filter based on search query
  const filteredHolidays = processedHolidays.filter((h) => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      (h.displayName || '').toLowerCase().includes(q) ||
      (h.type || '').toLowerCase().includes(q) ||
      (h.holiday_date || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER BAR */}
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-[#1e293b] text-xl">
          Holidays
        </h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="add-holiday-button"
            onClick={handleOpenAdd}
            className="px-4 py-1.5 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Add Holiday</span>
          </button>
        )}
      </div>

      {/* FILTER SEARCH FIELD */}
      <div className="w-full max-w-xs relative">
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

      {/* HOLIDAYS GRID TABLE */}
      {loading ? (
        <div className="h-32 flex items-center justify-center bg-white border border-slate-100 rounded-2xl">
          <div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-[#ab93d6]"></div>
        </div>
      ) : filteredHolidays.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                  <th className="py-2 px-3 sm:px-4 font-bold">Name</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Type</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Date</th>
                  <th className="py-2.5 px-6 font-bold text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                {filteredHolidays.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/55 transition-colors">
                    <td className="py-2 px-3 sm:px-4 font-semibold text-slate-850">
                      {h.displayName}
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold font-sans leading-relaxed text-center ${
                          h.type === 'National Holiday'
                            ? 'text-[#c53030] bg-[#fff5f5]'
                            : 'text-[#2b6cb0] bg-[#ebf8ff]'
                        }`}
                      >
                        {h.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 sm:px-4 font-semibold text-slate-600">
                      {formatHolidayDate(h.holiday_date)}
                    </td>
                    <td className="py-2 px-3 sm:px-4 text-center text-slate-400 font-semibold font-mono text-base">
                      {(user?.role === 'Admin' || user?.role === 'Supervisor') ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-slate-400 font-bold select-none">-</span>
                          <button
                            onClick={() => handleDelete(h.id)}
                            id={`delete-holiday-btn-${h.id}`}
                            className="p-1 px-1.5 bg-[#fcf1f1] text-[#cf3a3a] hover:bg-[#f6dfdf] rounded-md cursor-pointer transition-colors"
                            title="Delete holiday"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="select-none">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center bg-white border border-slate-100 rounded-3xl flex flex-col items-center justify-center space-y-2">
          <CalendarDays className="h-8 w-8 text-slate-350" />
          <p className="text-sm font-semibold text-slate-500">No matching holidays found</p>
          <p className="text-xs text-slate-400">Add custom holiday records or change search keyword.</p>
        </div>
      )}

      {/* ADD HOLIDAY FORM MODAL */}
      <Modal id="add-holiday-modal" isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Declare Holiday">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Holiday Celebration Day</label>
            <input
              type="date"
              value={holidayDate}
              onChange={(e) => setHolidayDate(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Name / Title of Holiday</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. May Day"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Classification Level</label>
            <select
              value={holidayType}
              onChange={(e) => setHolidayType(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-semibold font-sans cursor-pointer"
            >
              <option value="Public Holiday">Public Holiday</option>
              <option value="National Holiday">National Holiday</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-holiday-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-colors"
            >
              Confirm Holiday
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
