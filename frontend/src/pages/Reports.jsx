import { useState, useEffect } from 'react';
import { Download, Printer, FileSpreadsheet, FileText, ArrowRight, HelpCircle } from 'lucide-react';
import apiClient from '../api/client';
import { exportToExcel, exportToPDF } from '../utils/export';

export default function Reports() {
  const getInitialDates = () => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - 7); // Default to last 7 days range
    return {
      start: past.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  const dates = getInitialDates();
  const [startDate, setStartDate] = useState(dates.start);
  const [endDate, setEndDate] = useState(dates.end);
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState('All');

  const [departments, setDepartments] = useState([]);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await apiClient.get('/departments');
        if (res.success) setDepartments(res.data);
      } catch (err) {
        console.error('Failed to load departments selection:', err);
      }
    }
    loadDepts();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        departmentId: selectedDept,
        branch: selectedBranch,
      });
      const res = await apiClient.get(`/reports?${params.toString()}`);
      if (res.success) {
        setReportData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.message || 'Connecting to report API fail');
    } finally {
      setLoading(false);
    }
  };

  // Live filtering: re-fetch whenever any filter changes. Debounced so rapid
  // changes (e.g. picking dates) collapse into a single request. Also runs
  // once on mount to load the initial report.
  useEffect(() => {
    const timer = setTimeout(() => {
      generateReport();
    }, 350);
    return () => clearTimeout(timer);
  }, [startDate, endDate, selectedDept, selectedBranch]);

  const handleExcelExport = () => {
    if (reportData.length === 0) return;
    const mappedRows = reportData.map(row => ({
      'Emp Code': row.employeeCode,
      'Name': row.employeeName,
      'Department': row.departmentName,
      'Designation': row.designationName,
      'Branch': row.branch,
      'Total Days present': row.presentCount,
      'Total Days absent': row.absentCount,
      'Total Days on Leave': row.leaveCount,
      'Total hours Logged': row.totalHours,
      'AVG hours per Day': row.avgHours
    }));

    exportToExcel(
      ['Employee Code', 'Employee Name', 'Department', 'Designation', 'Branch', 'Days Present', 'Days Absent', 'Days Leave', 'Total Hours Logged', 'Average Hours/Day'],
      mappedRows,
      `Attendix_ERP_Report_${startDate}_to_${endDate}`
    );
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* FILTER BUILDER SELECTORS */}
      <form onSubmit={(e) => { e.preventDefault(); generateReport(); }} className="bg-white p-3 sm:p-4 lg:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="font-display font-semibold text-slate-800 text-base">Corporate Report Query Engine</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white font-mono"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Filter Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white font-semibold"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Filter Physical Branch</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full border border-slate-200 outline-none rounded-xl px-3 py-2 text-xs text-slate-700 bg-slate-50 focus:bg-white font-semibold"
            >
              <option value="All">All Branches</option>
              <option value="EcoWorld">EcoWorld</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-slate-100 flex-wrap gap-3">
          <p className="text-[10px] text-slate-400 font-medium">Query Coordinates: {startDate} <ArrowRight className="h-3 w-3 inline" /> {endDate}</p>
          <div className="flex items-center gap-3">
            {reportData.length > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExcelExport}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold transition-all border border-emerald-100 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Excel Export</span>
                </button>
                <button
                  type="button"
                  onClick={exportToPDF}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-semibold transition-all border border-blue-100 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print PDF</span>
                </button>
              </div>
            ) : (
              <span className="text-[10px] font-semibold text-slate-400 italic">Nothing to export</span>
            )}
          </div>
        </div>
      </form>

      {/* RESULTS GRID */}
      {loading ? (
        <div className="h-52 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : reportData.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="py-2 px-3 sm:px-4">Emp Code</th>
                  <th className="py-2 px-3 sm:px-4">Employee</th>
                  <th className="py-2 px-3 sm:px-4">Branch</th>
                  <th className="py-2 px-3 sm:px-4 text-center">Presents</th>
                  <th className="py-2 px-3 sm:px-4 text-center">Absents</th>
                  <th className="py-2 px-3 sm:px-4 text-center">Leaves</th>
                  <th className="py-2 px-3 sm:px-4 text-center">Total Hours</th>
                  <th className="py-2 px-3 sm:px-4 text-center">Avg Hours/Day</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2 px-3 sm:px-4 font-mono font-bold text-[#1e40af]">{row.employeeCode}</td>
                    <td className="py-2 px-3 sm:px-4">
                      <div className="font-bold text-slate-800">{row.employeeName}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{row.departmentName} • {row.designationName}</div>
                    </td>
                    <td className="py-2 px-3 sm:px-4 font-medium text-slate-600">{row.branch}</td>
                    <td className="py-2 px-3 sm:px-4 text-center font-bold text-emerald-600 font-mono">{row.presentCount}</td>
                    <td className="py-2 px-3 sm:px-4 text-center font-bold text-red-500 font-mono">{row.absentCount}</td>
                    <td className="py-2 px-3 sm:px-4 text-center font-bold text-amber-500 font-mono">{row.leaveCount}</td>
                    <td className="py-2 px-3 sm:px-4 text-center font-bold font-mono text-slate-800">{row.totalHours} hrs</td>
                    <td className="py-2 px-3 sm:px-4 text-center">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        row.avgHours >= 8 ? 'bg-emerald-100 text-emerald-800' :
                        row.avgHours >= 4 ? 'bg-amber-100 text-amber-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {row.avgHours} hrs
                      </span>
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
          <p className="text-sm font-semibold text-slate-500">No analytical report lines retrieved</p>
          <p className="text-xs text-slate-400">Specify dates parameters and click &quot;Generate Spreadsheet Report&quot;.</p>
        </div>
      )}
    </div>
  );
}
