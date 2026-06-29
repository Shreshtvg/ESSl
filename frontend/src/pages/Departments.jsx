import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HelpCircle, ArrowUpDown } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Departments() {
  const { user } = useAuth();
  const toast = useToast();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmDept, setDeleteConfirmDept] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [fixedWeekOff, setFixedWeekOff] = useState('Sunday');

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/departments');
      if (res.success) {
        setDepartments(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setName('');
    setDescription('');
    setFixedWeekOff('Sunday');
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setIsEditing(true);
    setEditingId(dept.id);
    setName(dept.name);
    setDescription(dept.description || '');
    setFixedWeekOff(dept.fixed_week_off || 'Sunday');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      let res;
      if (isEditing) {
        res = await apiClient.put(`/departments/${editingId}`, {
          name,
          description,
          fixed_week_off: fixedWeekOff
        });
      } else {
        res = await apiClient.post('/departments', {
          name,
          description,
          fixed_week_off: fixedWeekOff
        });
      }

      if (res.success) {
        setModalOpen(false);
        loadDepartments();
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const startDelete = (dept) => {
    setDeleteConfirmDept(dept);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmDept) return;
    try {
      const res = await apiClient.delete(`/departments/${deleteConfirmDept.id}`);
      if (res.success) {
        setDeleteConfirmDept(null);
        loadDepartments();
      }
    } catch (err) {
      toast.error(err.message || 'Delete operation failed');
    }
  };

  // Filter departments based on search query
  const filteredDepartments = departments.filter(dept => {
    const term = searchQuery.toLowerCase();
    return (
      dept.name.toLowerCase().includes(term) ||
      (dept.description || '').toLowerCase().includes(term) ||
      (dept.fixed_week_off || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-slate-800 text-xl">Departments</h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="add-dept-button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#ab93d6] hover:bg-[#9a7ecb] active:scale-[0.98] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all duration-155 shadow-sm focus:outline-none"
          >
            <Plus className="h-4 w-4 stroke-[3.5]" />
            <span>Add Department</span>
          </button>
        )}
      </div>
      
      {/* SEARCH BOX AND DATA LISTING */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-xs space-y-3">
        <div className="w-full max-w-sm">
          <input
            id="search-dept-input"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border border-slate-200 outline-none rounded-lg px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:border-[#ab93d6] transition-all"
          />
        </div>

        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ab93d6]"></div>
          </div>
        ) : filteredDepartments.length > 0 ? (
          <div className="border border-slate-200/60 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                    <th className="py-2 px-3 font-bold">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        Name <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-2 px-3 font-bold">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        Description <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-2 px-3 font-bold">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        Fixed Weekoff <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-2 px-3 font-bold">
                      <div className="flex items-center gap-1 cursor-pointer select-none">
                        Shifts <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-4 font-bold text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredDepartments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2 px-3 font-semibold text-slate-800">{dept.name}</td>
                      <td className="py-2 px-3 text-slate-500 font-sans">{dept.description || ''}</td>
                      <td className="py-2 px-3 font-medium text-slate-600">{dept.fixed_week_off || '-'}</td>
                      <td className="py-2 px-3 text-slate-500 font-mono">-</td>
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-2.5">
                          {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                            <>
                              <button
                                id={`edit-dept-${dept.id}`}
                                onClick={() => handleOpenEdit(dept)}
                                className="p-1.5 bg-[#e3effa] text-[#4290d2] hover:bg-[#cee4f8] rounded-md cursor-pointer transition-all"
                                title="Edit Department"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                id={`delete-dept-${dept.id}`}
                                onClick={() => startDelete(dept)}
                                className="p-1.5 bg-[#fbe3e3] text-[#cf3a3a] hover:bg-[#f8cfcf] rounded-md cursor-pointer transition-all"
                                title="Delete Department"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <HelpCircle className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-semibold text-slate-500 font-sans">No matching departments found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>

      {/* FORM MODAL */}
      <Modal id="add-dept-modal" isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Modify Department Details' : 'Register New Department'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Department Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. STP"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Short Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Primary purpose or staffing scope"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Declaration of Fixed Weekly Holiday</label>
            <select
              value={fixedWeekOff}
              onChange={(e) => setFixedWeekOff(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-semibold"
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
              <option value="Dynamic">Dynamic</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              type="button"
              className="px-4 py-2 border border-[#add8e6]/60 text-slate-600 rounded-xl text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="submit-dept-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Save Department Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        id="delete-dept-confirm-modal"
        isOpen={deleteConfirmDept !== null}
        onClose={() => setDeleteConfirmDept(null)}
        title="Confirm Department Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you absolutely sure you want to delete the department <strong className="text-slate-800 font-bold">"{deleteConfirmDept?.name}"</strong>? This action is irreversible. All designated personnel or designations under this scope will have their department assignment reset.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirmDept(null)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-dept-btn"
              onClick={handleConfirmDelete}
              type="button"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Yes, Delete Department
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
