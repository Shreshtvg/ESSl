import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, HelpCircle, Handshake, Phone, Mail, User, Search, ArrowUpDown } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Vendors() {
  const { user } = useAuth();
  const toast = useToast();
  const [vendors, setVendors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmVendor, setDeleteConfirmVendor] = useState(null);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceProvided, setServiceProvided] = useState(''); // Serves as the "Department" in table

  const loadVendors = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/vendors');
      if (res.success) {
        setVendors(res.data);
      }
    } catch (err) {
      console.error('Failed to load vendors list:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await apiClient.get('/departments');
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (err) {
      console.error('Failed to load departments:', err);
    }
  };

  useEffect(() => {
    loadVendors();
    loadDepartments();
  }, []);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setEditingId(null);
    setName('');
    setContactPerson('');
    setEmail('');
    setPhone('');
    setServiceProvided('');
    setModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setIsEditing(true);
    setEditingId(v.id);
    setName(v.name || '');
    setContactPerson(v.contact_person || '');
    setEmail(v.email || '');
    setPhone(v.phone || '');
    setServiceProvided(v.service_provided || '');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const payload = {
        name: name.trim(),
        contact_person: contactPerson.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service_provided: serviceProvided
      };

      let res;
      if (isEditing) {
        res = await apiClient.put(`/vendors/${editingId}`, payload);
      } else {
        res = await apiClient.post('/vendors', payload);
      }

      if (res.success) {
        setModalOpen(false);
        loadVendors();
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const startDelete = (v) => {
    setDeleteConfirmVendor(v);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmVendor) return;
    try {
      const res = await apiClient.delete(`/vendors/${deleteConfirmVendor.id}`);
      if (res.success) {
        setDeleteConfirmVendor(null);
        loadVendors();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to remove vendor');
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedVendors = vendors
    .filter((v) => {
      const q = searchQuery.toLowerCase();
      return (
        (v.name || '').toLowerCase().includes(q) ||
        (v.contact_person || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.phone || '').toLowerCase().includes(q) ||
        (v.service_provided || '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center bg-transparent py-1">
        <h2 className="font-sans font-bold text-slate-800 text-xl">Vendors</h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="add-vendor-button"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#ab93d6] hover:bg-[#9a7ecb] active:scale-[0.98] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all duration-155 shadow-sm focus:outline-none"
          >
            <Plus className="h-4 w-4 stroke-[3.5]" />
            <span>Add Vendor</span>
          </button>
        )}
      </div>

      {/* DATA GRID & FILTERING */}
      <div className="bg-white rounded-xl p-3 sm:p-4 border border-slate-100 shadow-xs space-y-4">
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
            className="w-full pl-9 pr-4 py-2 border border-slate-200 outline-none rounded-xl text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans font-semibold focus:border-[#ab93d6]"
          />
        </div>

        {loading ? (
          <div className="h-44 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ab93d6]"></div>
          </div>
        ) : filteredAndSortedVendors.length > 0 ? (
          <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold font-sans">
                    <th
                      className="py-2.5 px-6 font-bold cursor-pointer hover:bg-[#a1ccde] transition-colors select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Name</span>
                        <ArrowUpDown className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-6 font-bold cursor-pointer hover:bg-[#a1ccde] transition-colors select-none"
                      onClick={() => handleSort('service_provided')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Department</span>
                        <ArrowUpDown className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-6 font-bold cursor-pointer hover:bg-[#a1ccde] transition-colors select-none"
                      onClick={() => handleSort('contact_person')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Contact Person</span>
                        <ArrowUpDown className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-6 font-bold cursor-pointer hover:bg-[#a1ccde] transition-colors select-none"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Phone</span>
                        <ArrowUpDown className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </th>
                    <th
                      className="py-2.5 px-6 font-bold cursor-pointer hover:bg-[#a1ccde] transition-colors select-none"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Email</span>
                        <ArrowUpDown className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </th>
                    <th className="py-2.5 px-6 font-bold cursor-default select-none">
                      <div className="flex items-center gap-1.5">
                        <span>Active</span>
                        <ArrowUpDown className="h-3 w-3 stroke-[2.5]" />
                      </div>
                    </th>
                    {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                      <th className="py-2.5 px-6 font-bold text-center w-32 select-none">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-705">
                  {filteredAndSortedVendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="py-2 px-3 sm:px-4 font-bold text-slate-800">{v.name}</td>
                      <td className="py-2 px-3 sm:px-4 text-slate-600">{v.service_provided || '-'}</td>
                      <td className="py-2 px-3 sm:px-4 text-slate-600">{v.contact_person || '-'}</td>
                      <td className="py-2 px-3 sm:px-4 font-mono text-slate-600">{v.phone || '-'}</td>
                      <td className="py-2 px-3 sm:px-4 font-mono text-slate-600">{v.email || '-'}</td>
                      <td className="py-2 px-3 sm:px-4 font-semibold text-emerald-600">Yes</td>
                      {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                        <td className="py-2 px-3 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-2.5">
                            <button
                              id={`edit-vendor-${v.id}`}
                              onClick={() => handleOpenEdit(v)}
                              className="p-1.5 bg-[#e3effa] text-[#4290d2] hover:bg-[#cee4f8] rounded-md cursor-pointer transition-all"
                              title="Edit Vendor"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`delete-vendor-${v.id}`}
                              onClick={() => startDelete(v)}
                              className="p-1.5 bg-[#fbe3e3] text-[#cf3a3a] hover:bg-[#f8cfcf] rounded-md cursor-pointer transition-all"
                              title="Delete Vendor"
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
          <div className="p-12 text-center bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <Handshake className="h-8 w-8 text-slate-350" />
            <p className="text-sm font-semibold text-slate-500">No contracted vendors found</p>
            <p className="text-xs text-slate-400">Add or match vendor contracts from setup options above.</p>
          </div>
        )}
      </div>

      {/* FORM MODAL (Add / Edit) */}
      <Modal
        id="add-vendor-modal"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={isEditing ? 'Edit Contracted Vendor Details' : 'Register Contracted Vendor Agency'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Vendor Corporate Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Knight Guard Security Agency"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Department Scope</label>
            <select
              value={serviceProvided}
              onChange={(e) => setServiceProvided(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-705 bg-slate-50 focus:bg-white transition-all font-sans font-semibold cursor-pointer"
              required
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Primary Contact Representative</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="Full name of representative"
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-sans"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contracts@agency.com"
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Phone Hotline</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telephone digits"
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono"
              />
            </div>
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
              id="submit-vendor-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#9a7ecb] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              {isEditing ? 'Save Vendor Changes' : 'Sign Contract Vendor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        id="delete-vendor-confirm-modal"
        isOpen={deleteConfirmVendor !== null}
        onClose={() => setDeleteConfirmVendor(null)}
        title="Confirm Vendor Contract Termination"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you absolutely sure you want to terminate/delete the vendor contract for <strong className="text-slate-800 font-bold">"{deleteConfirmVendor?.name}"</strong>? This will remove all directory representations from your partner list.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirmVendor(null)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-vendor-btn"
              onClick={handleConfirmDelete}
              type="button"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Yes, Terminate Vendor
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
