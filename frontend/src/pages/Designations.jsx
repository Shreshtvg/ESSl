import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HelpCircle, Search } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Designations() {
  const { user } = useAuth();
  const toast = useToast();
  const [confirmDialog, setConfirmDialog] = useState({ open: false, title: '', message: '', onConfirm: null });
  const openConfirm = (title, message, onConfirm) => setConfirmDialog({ open: true, title, message, onConfirm });
  const closeConfirm = () => setConfirmDialog(s => ({ ...s, open: false }));

  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Search + pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  // Form states
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [desgRes, deptRes] = await Promise.all([
        apiClient.get('/designations'),
        apiClient.get('/departments')
      ]);
      if (desgRes.success) setDesignations(desgRes.data);
      if (deptRes.success) {
        setDepartments(deptRes.data);
        if (deptRes.data.length > 0) setDepartmentId(deptRes.data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize rosters designations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    if (departments.length > 0) setDepartmentId(departments[0].id);
    setModalOpen(true);
  };

  const handleOpenEdit = (desg) => {
    setIsEditing(true);
    setEditingId(desg.id);
    setName(desg.name);
    setDepartmentId(desg.department_id || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      let res;
      if (isEditing) {
        res = await apiClient.put(`/designations/${editingId}`, {
          name,
          department_id: departmentId ? Number(departmentId) : null
        });
      } else {
        res = await apiClient.post('/designations', {
          name,
          department_id: departmentId ? Number(departmentId) : null
        });
      }

      if (res.success) {
        setModalOpen(false);
        loadAll();
      }
    } catch (err) {
      toast.error(err.message || 'Saving designation failed');
    }
  };

  const handleDelete = (id) => {
    openConfirm(
      'Delete Designation',
      'This will permanently remove the designation. This action cannot be undone.',
      async () => {
        try {
          const res = await apiClient.delete(`/designations/${id}`);
          if (res.success) loadAll();
        } catch (err) {
          toast.error(err.message || 'Delete operation failed');
        }
      }
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-slate-800 text-xl">Designations</h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="add-designation-button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#ab93d6] hover:bg-[#9a7ecb] active:scale-[0.98] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all duration-155 shadow-sm focus:outline-none"
          >
            <Plus className="h-4 w-4 stroke-[3.5]" />
            <span>Add Designation</span>
          </button>
        )}
      </div>

      {/* SEARCH */}
      <div className="relative w-64">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
          <Search className="h-3.5 w-3.5" />
        </span>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-slate-250 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 bg-white placeholder-slate-400 outline-none"
        />
      </div>

      {/* DATA GRID */}
      {loading ? (
        <div className="h-44 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ab93d6]"></div>
        </div>
      ) : (() => {
        const filtered = designations.filter(d => {
          const q = search.trim().toLowerCase();
          return !q || d.name.toLowerCase().includes(q) || (d.department_name || '').toLowerCase().includes(q);
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        const safePage = Math.min(page, totalPages);
        const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

        const Pagination = () => {
          if (totalPages <= 1) return null;
          const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
          const visible = pages.filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1);
          const withGaps = [];
          visible.forEach((p, i) => {
            if (i > 0 && p - visible[i - 1] > 1) withGaps.push('…');
            withGaps.push(p);
          });
          return (
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">Prev</button>
              {withGaps.map((p, i) =>
                p === '…' ? <span key={`g${i}`} className="px-1 text-slate-400">…</span> : (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${p === safePage ? 'bg-[#b3d7eb] border-[#88c0d8] text-[#2c5270] font-bold' : 'border-slate-200 text-slate-500 hover:bg-white'}`}>
                    {p}
                  </button>
                )
              )}
              <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors">Next</button>
            </div>
          );
        };

        if (filtered.length === 0) return (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <HelpCircle className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500">{designations.length === 0 ? 'No designations added yet' : 'No results match your search'}</p>
          </div>
        );

        return (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                    <th className="py-2 px-3 sm:px-4 font-bold">Name</th>
                    <th className="py-2 px-3 sm:px-4 font-bold">Department</th>
                    {(user?.role === 'Admin' || user?.role === 'Supervisor') && <th className="py-2.5 px-6 font-bold text-center w-32">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                  {paged.map((desg) => (
                    <tr key={desg.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2 px-3 sm:px-4font-semibold text-slate-800">{desg.name}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded text-[11px]">
                          {desg.department_name || 'Unassigned'}
                        </span>
                      </td>
                      {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                        <td className="py-2 px-3 sm:px-4text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              id={`edit-desg-${desg.id}`}
                              onClick={() => handleOpenEdit(desg)}
                              className="p-1.5 bg-[#e3effa] text-[#4290d2] hover:bg-[#cee4f8] rounded-md cursor-pointer transition-all"
                              title="Edit Designation"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`delete-desg-${desg.id}`}
                              onClick={() => handleDelete(desg.id)}
                              className="p-1.5 bg-[#fbe3e3] text-[#cf3a3a] hover:bg-[#f8cfcf] rounded-md cursor-pointer transition-all"
                              title="Delete Designation"
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
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/30 text-[11px] text-slate-400 font-semibold select-none">
              <span>{(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <Pagination />
            </div>
          </div>
        );
      })()}

      {/* FORM MODAL */}
      <Modal id="add-desg-modal" isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Modify Designation Details' : 'Add New Designation'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Designation Name / Title</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior Security Specialist"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Map to Department</label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer font-semibold"
            >
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
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
              id="submit-desg-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Save Designation
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
