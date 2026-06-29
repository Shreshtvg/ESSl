import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, HelpCircle, Search, Mail, Phone, MapPin } from 'lucide-react';
import apiClient from '../api/client';
import Modal from '../components/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export default function Employees() {
  const { user } = useAuth();
  const toast = useToast();
  const [dbEmployees, setDbEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [filterDept, setFilterDept] = useState('All');
  const [filterBranch, setFilterBranch] = useState('EcoWorld');

  // Dual Search Box States
  const [activeSearch, setActiveSearch] = useState('');
  const [inactiveSearch, setInactiveSearch] = useState('');

  // Pagination
  const [activePage, setActivePage] = useState(1);
  const [inactivePage, setInactivePage] = useState(1);
  const PER_PAGE = 20;

  // Selection state for Inactive Table
  const [selectedInactive, setSelectedInactive] = useState({});

  // Modal controls
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmEmp, setDeleteConfirmEmp] = useState(null);

  // Form states
  const [employeeCode, setEmployeeCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designationId, setDesignationId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [branch, setBranch] = useState('EcoWorld');
  const [status, setStatus] = useState('Active');

  // Load backend data
  const loadAncillaryAndEmployees = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desgRes, shiftRes] = await Promise.all([
        apiClient.get('/employees'),
        apiClient.get('/departments'),
        apiClient.get('/designations'),
        apiClient.get('/shifts')
      ]);

      if (empRes.success) setDbEmployees(empRes.data);
      if (deptRes.success) {
        setDepartments(deptRes.data);
        if (deptRes.data.length > 0) setDepartmentId(deptRes.data[0].id);
      }
      if (desgRes.success) {
        setDesignations(desgRes.data);
        if (desgRes.data.length > 0) setDesignationId(desgRes.data[0].id);
      }
      if (shiftRes.success) {
        setShifts(shiftRes.data);
        if (shiftRes.data.length > 0) setShiftId(shiftRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAncillaryAndEmployees();
  }, []);

  // Form modal operations
  const handleOpenAdd = () => {
    setIsEditing(false);
    setEmployeeCode(`250${dbEmployees.length + 22}`);
    setName('');
    setEmail('');
    setPhone('');
    if (departments.length > 0) setDepartmentId(departments[0].id);
    if (designations.length > 0) setDesignationId(designations[0].id);
    if (shifts.length > 0) setShiftId(shifts[0].id);
    setBranch('EcoWorld');
    setStatus('Active');
    setModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setIsEditing(true);
    setEditingId(emp.id);
    setEmployeeCode(emp.employee_code);
    setName(emp.name);
    setEmail(emp.email || `${emp.name?.toLowerCase().replace(/\s+/g, '')}@safehalo.in`);
    setPhone(emp.phone || '');
    
    const matchedDept = departments.find(d => d.name === emp.department_name);
    if (matchedDept) setDepartmentId(matchedDept.id);
    
    const matchedDesg = designations.find(d => d.name === emp.designation_name);
    if (matchedDesg) setDesignationId(matchedDesg.id);
    
    setShiftId(emp.shift_id || (shifts[0]?.id || ''));
    setBranch(emp.branch || 'EcoWorld');
    setStatus(emp.status || 'Active');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      employee_code: employeeCode,
      name,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@safehalo.in`,
      phone,
      department_id: departmentId ? Number(departmentId) : null,
      designation_id: designationId ? Number(designationId) : null,
      shift_id: shiftId ? Number(shiftId) : null,
      branch,
      status
    };

    try {
      let res;
      if (isEditing) {
        res = await apiClient.put(`/employees/${editingId}`, payload);
      } else {
        res = await apiClient.post('/employees', payload);
      }

      if (res.success) {
        setModalOpen(false);
        await loadAncillaryAndEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const startDelete = (emp) => {
    setDeleteConfirmEmp(emp);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmEmp) return;
    try {
      const res = await apiClient.delete(`/employees/${deleteConfirmEmp.id}`);
      if (res.success) {
        setDeleteConfirmEmp(null);
        await loadAncillaryAndEmployees();
      }
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  // Compile full list matching active (9) and inactive (212)
  const getMappedCategorizedLists = () => {
    const active = dbEmployees.filter(emp => emp.status === 'Active').map(emp => ({
      ...emp,
      department_name: emp.department_name || "-",
      designation_name: emp.designation_name || "-",
      shift_name: emp.shift_name || "-"
    }));
    const inactive = dbEmployees.filter(emp => emp.status === 'Inactive').map(emp => ({
      ...emp,
      department_name: emp.department_name || "-",
      designation_name: emp.designation_name || "-",
      shift_name: emp.shift_name || "-"
    }));
    return { active, inactive };
  };

  const { active: rawActive, inactive: rawInactive } = getMappedCategorizedLists();

  // Apply selectors (Department & Branch filters)
  const filterEmployeeList = (list) => {
    return list.filter(emp => {
      const matchedBranch = filterBranch === 'All' || String(emp.branch).toLowerCase() === String(filterBranch).toLowerCase();
      
      let matchedDept = true;
      if (filterDept !== 'All') {
        const deptNode = departments.find(d => String(d.id) === String(filterDept));
        if (deptNode) {
          matchedDept = String(emp.department_name).toLowerCase() === String(deptNode.name).toLowerCase();
        } else {
          matchedDept = String(emp.department_name).toLowerCase() === String(filterDept).toLowerCase();
        }
      }
      return matchedBranch && matchedDept;
    });
  };

  const filteredActiveBeforeSearch = filterEmployeeList(rawActive);
  const filteredInactiveBeforeSearch = filterEmployeeList(rawInactive);

  // Apply search query independently
  const filteredActive = filteredActiveBeforeSearch.filter(emp => {
    const query = activeSearch.trim().toLowerCase();
    return !query ||
           emp.name.toLowerCase().includes(query) ||
           emp.employee_code.toLowerCase().includes(query) ||
           emp.department_name.toLowerCase().includes(query);
  });

  const filteredInactive = filteredInactiveBeforeSearch.filter(emp => {
    const query = inactiveSearch.trim().toLowerCase();
    return !query ||
           emp.name.toLowerCase().includes(query) ||
           emp.employee_code.toLowerCase().includes(query) ||
           emp.department_name.toLowerCase().includes(query);
  });

  // Paginated slices
  const totalActivePages = Math.max(1, Math.ceil(filteredActive.length / PER_PAGE));
  const totalInactivePages = Math.max(1, Math.ceil(filteredInactive.length / PER_PAGE));
  const safeActivePage = Math.min(activePage, totalActivePages);
  const safeInactivePage = Math.min(inactivePage, totalInactivePages);
  const pagedActive = filteredActive.slice((safeActivePage - 1) * PER_PAGE, safeActivePage * PER_PAGE);
  const pagedInactive = filteredInactive.slice((safeInactivePage - 1) * PER_PAGE, safeInactivePage * PER_PAGE);

  const Pagination = ({ page, total, onChange }) => {
    if (total <= 1) return null;
    const pages = Array.from({ length: total }, (_, i) => i + 1);
    const visible = pages.filter(p => p === 1 || p === total || Math.abs(p - page) <= 1);
    const withGaps = [];
    visible.forEach((p, i) => {
      if (i > 0 && p - visible[i - 1] > 1) withGaps.push('…');
      withGaps.push(p);
    });
    return (
      <div className="flex items-center justify-end gap-1 px-4 py-3 border-t border-slate-100 bg-slate-50/30 text-[11px] font-semibold select-none">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >Prev</button>
        {withGaps.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                p === page
                  ? 'bg-[#b3d7eb] border-[#88c0d8] text-[#2c5270] font-bold'
                  : 'border-slate-200 text-slate-500 hover:bg-white'
              }`}
            >{p}</button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === total}
          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >Next</button>
      </div>
    );
  };

  // Select all operations for inactive page
  const allInactiveSelected = filteredInactive.length > 0 && 
                               filteredInactive.every(emp => selectedInactive[emp.id]);

  const handleSelectAllInactive = () => {
    if (allInactiveSelected) {
      setSelectedInactive({});
    } else {
      const updated = {};
      filteredInactive.forEach(emp => {
        updated[emp.id] = true;
      });
      setSelectedInactive(updated);
    }
  };

  const handleSelectOneInactive = (id) => {
    setSelectedInactive(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleMarkSelectedAsInactive = async () => {
    const selectedIds = Object.keys(selectedInactive).filter(id => selectedInactive[id]);
    if (selectedIds.length === 0) {
      toast.info('Please select at least one employee to update.');
      return;
    }
    try {
      for (const id of selectedIds) {
        const emp = dbEmployees.find(e => String(e.id) === String(id));
        if (emp) {
          await apiClient.put(`/employees/${id}`, { ...emp, status: 'Inactive' });
        }
      }
      setSelectedInactive({});
      await loadAncillaryAndEmployees();
    } catch (err) {
      toast.error(err.message || 'Failed to update employee status');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* HEADER ROW */}
      <div className="flex justify-between items-center py-1">
        <h2 className="font-sans font-bold text-slate-800 text-xl">Employees</h2>
        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
          <button
            id="register-employee-top-btn"
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-[#ab93d6] hover:bg-[#9a7ecb] active:scale-[0.98] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all duration-155 cursor-pointer focus:outline-none"
          >
            <Plus className="h-4 w-4 stroke-[3.5]" />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* FILTER DROPDOWNS BAR */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          {/* Department */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Department:</span>
            <select
              value={filterDept}
              onChange={(e) => { setFilterDept(e.target.value); setActivePage(1); setInactivePage(1); }}
              className="border border-slate-200 outline-none rounded-lg px-2.5 py-1.5 text-slate-705 bg-slate-50 focus:bg-white font-bold cursor-pointer transition-all"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Branch */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Branch:</span>
            <select
              value={filterBranch}
              onChange={(e) => { setFilterBranch(e.target.value); setActivePage(1); setInactivePage(1); }}
              className="border border-slate-200 outline-none rounded-lg px-2.5 py-1.5 text-slate-705 bg-slate-50 focus:bg-white font-bold cursor-pointer transition-all"
            >
              <option value="All">All Branches</option>
              <option value="EcoWorld">EcoWorld</option>
            </select>
          </div>
        </div>

        {/* Legend counts matching exactly screenshot */}
        <div className="text-xs text-slate-500 font-bold font-mono">
          Active: {filteredActiveBeforeSearch.length} | Inactive: {filteredInactiveBeforeSearch.length}
        </div>
      </div>

      {/* ACTIVE EMPLOYEES ROW */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 select-none">
          <span className="w-2.5 h-2.5 bg-[#43a047] rounded-full inline-block" />
          <h3 className="font-sans font-bold text-slate-800 text-[14px]">
            Active Employees ({filteredActiveBeforeSearch.length})
          </h3>
        </div>

        {/* Active Search box */}
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={activeSearch}
            onChange={(e) => { setActiveSearch(e.target.value); setActivePage(1); }}
            className="w-full border border-slate-250 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 bg-white placeholder-slate-400 outline-none"
          />
        </div>

        {/* Active Grid */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#b3d7eb] text-[#2c5270] text-xs font-bold divide-x divide-white select-none">
                  <th className="py-2 px-3 sm:px-4 font-bold">Employee ID</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Name</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Department</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Designation</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Branch</th>
                  <th className="py-2.5 px-5 font-bold text-center">Shift</th>
                  <th className="py-2.5 px-5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {pagedActive.length > 0 ? (
                  pagedActive.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/40 divide-x divide-slate-100/40">
                      <td className="py-2 px-3 sm:px-4font-semibold text-slate-700">{emp.employee_code}</td>
                      <td className="py-2 px-3 sm:px-4font-semibold text-blue-800">{emp.name}</td>
                      <td className="py-2 px-3 sm:px-4text-slate-600">{emp.department_name}</td>
                      <td className="py-2 px-3 sm:px-4text-slate-600">{emp.designation_name}</td>
                      <td className="py-2 px-3 sm:px-4text-slate-600">{emp.branch}</td>
                      <td className="py-2 px-3 sm:px-4text-center text-slate-500">{emp.shift_name}</td>
                      <td className="py-2 px-3 sm:px-4text-center space-x-1.5">
                        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1 px-1.5 bg-[#ebf5fb] text-[#2c82c9] hover:bg-[#d4eafd] rounded-md inline-flex items-center transition-colors cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => startDelete(emp)}
                              className="p-1 px-1.5 bg-[#fdeded] text-[#cb3131] hover:bg-[#fbd3d3] rounded-md inline-flex items-center transition-colors cursor-pointer"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-medium font-sans">
                      No matching active employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/30 text-[11px] text-slate-400 font-semibold">
            <span>{filteredActive.length > 0 ? `${(safeActivePage - 1) * PER_PAGE + 1}–${Math.min(safeActivePage * PER_PAGE, filteredActive.length)} of ${filteredActive.length}` : '0 records'}</span>
            <Pagination page={safeActivePage} total={totalActivePages} onChange={setActivePage} />
          </div>
        </div>
      </div>

      {/* INACTIVE EMPLOYEES ROW */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center gap-2 select-none">
          <span className="w-2.5 h-2.5 bg-[#d32f2f] rounded-full inline-block" />
          <h3 className="font-sans font-bold text-slate-800 text-[14px] flex items-center gap-1.5">
            Inactive Employees ({filteredInactiveBeforeSearch.length})
            <span className="text-xs font-semibold text-slate-400 font-sans">No attendance in last 30 days</span>
          </h3>
        </div>

        {/* Action Select controls */}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-semibold select-none cursor-pointer">
            <input
              type="checkbox"
              checked={allInactiveSelected}
              onChange={handleSelectAllInactive}
              className="rounded text-[#ab93d6] focus:ring-[#ab93d6] border-slate-300"
            />
            <span>Select All</span>
          </label>
          <button
            onClick={handleMarkSelectedAsInactive}
            className="px-3 py-1.5 bg-[#fdeded] text-[#cb3131] whitespace-nowrap border border-[#f5abab] hover:bg-[#fbd3d3] text-[11px] font-bold rounded-lg cursor-pointer transition-colors"
          >
            Mark Selected as Inactive
          </button>
        </div>

        {/* Inactive Search Box */}
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={inactiveSearch}
            onChange={(e) => { setInactiveSearch(e.target.value); setInactivePage(1); }}
            className="w-full border border-slate-250 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 bg-white placeholder-slate-400 outline-none"
          />
        </div>

        {/* Inactive Grid with Checkboxes */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5c6c6] text-[#6b2323] text-xs font-bold divide-x divide-white select-none">
                  <th className="py-2.5 px-5 font-bold w-12 text-center"></th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Employee ID</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Name</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Department</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Designation</th>
                  <th className="py-2 px-3 sm:px-4 font-bold">Branch</th>
                  <th className="py-2.5 px-5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {pagedInactive.length > 0 ? (
                  pagedInactive.map((emp) => (
                    <tr key={emp.id} className="hover:bg-rose-50/10 divide-x divide-slate-100/40">
                      <td className="py-2 px-3 sm:px-4text-center">
                        <input
                          type="checkbox"
                          checked={!!selectedInactive[emp.id]}
                          onChange={() => handleSelectOneInactive(emp.id)}
                          className="rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                        />
                      </td>
                      <td className="py-2 px-3 sm:px-4font-semibold text-slate-700">{emp.employee_code}</td>
                      <td className="py-2 px-3 sm:px-4font-semibold text-blue-800">{emp.name}</td>
                      <td className="py-2 px-3 sm:px-4text-slate-600">{emp.department_name}</td>
                      <td className="py-2 px-3 sm:px-4text-slate-600">{emp.designation_name}</td>
                      <td className="py-2 px-3 sm:px-4text-slate-600">{emp.branch}</td>
                      <td className="py-2 px-3 sm:px-4text-center space-x-1.5">
                        {(user?.role === 'Admin' || user?.role === 'Supervisor') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1 px-1.5 bg-[#ebf5fb] text-[#2c82c9] hover:bg-[#d4eafd] rounded-md inline-flex items-center transition-colors cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => startDelete(emp)}
                              className="p-1 px-1.5 bg-[#fdeded] text-[#cb3131] hover:bg-[#fbd3d3] rounded-md inline-flex items-center transition-colors cursor-pointer"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-400 font-medium font-sans">
                      No matching inactive employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-100 bg-slate-50/30 text-[11px] text-slate-400 font-semibold">
            <span>{filteredInactive.length > 0 ? `${(safeInactivePage - 1) * PER_PAGE + 1}–${Math.min(safeInactivePage * PER_PAGE, filteredInactive.length)} of ${filteredInactive.length}` : '0 records'}</span>
            <Pagination page={safeInactivePage} total={totalInactivePages} onChange={setInactivePage} />
          </div>
        </div>
      </div>

      {/* ADD/EDIT FORM MODAL */}
      <Modal id="employee-register-modal" isOpen={modalOpen} onClose={() => setModalOpen(false)} title={isEditing ? 'Modify Employee Profile' : 'Staff Onboarding Form'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Employee Code</label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="e.g. 54228"
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all font-mono font-bold"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First Last Name"
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Contact Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="digits only"
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Company Branch</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer font-semibold"
              >
                <option value="EcoWorld">EcoWorld</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Department</label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer font-semibold"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Designation</label>
              <select
                value={designationId}
                onChange={(e) => setDesignationId(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer font-semibold"
              >
                {designations.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Assigned Shift</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer font-semibold"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.start_time}-{s.end_time})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Status Badge</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white transition-all cursor-pointer font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
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
              id="submit-emp-bottom-btn"
              type="submit"
              className="px-4 py-2 bg-[#ab93d6] hover:bg-[#967ebe] text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-colors"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        id="delete-emp-confirm-modal"
        isOpen={deleteConfirmEmp !== null}
        onClose={() => setDeleteConfirmEmp(null)}
        title="Confirm Employee Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Are you absolutely sure you want to delete the employee <strong className="text-slate-800 font-bold">"{deleteConfirmEmp?.name}"</strong> (ID: {deleteConfirmEmp?.employee_code})? This will permanently erase their profile, assignment structures, and associated history logs.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setDeleteConfirmEmp(null)}
              type="button"
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-medium cursor-pointer hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-delete-emp-btn"
              onClick={handleConfirmDelete}
              type="button"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
