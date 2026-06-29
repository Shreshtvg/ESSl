export default function MonthlyAttendanceReportPrint({ data }) {
  if (!data || !data.departments || data.departments.length === 0) return null;

  return (
    <div id="monthly-report-print-area" className="hidden">
      {data.departments.map((dept, deptIdx) => (
        <div key={dept.departmentName} className="report-page" style={{ pageBreakBefore: deptIdx === 0 ? 'auto' : 'always' }}>
          <h1 style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
            Monthly Attendance Report
          </h1>

          <table className="report-meta-table">
            <tbody>
              <tr>
                <td className="label-cell">Name and address of the Principal Employer</td>
                <td>{data.principalEmployer}</td>
                <td className="label-cell">Name and address of the contractor</td>
                <td>{dept.contractorName}</td>
              </tr>
              <tr>
                <td className="label-cell">Name and location of the work site</td>
                <td>{data.site}</td>
                <td className="label-cell">Month</td>
                <td>{data.month}</td>
              </tr>
              <tr>
                <td className="label-cell">Department</td>
                <td colSpan={3}>{dept.departmentName}</td>
              </tr>
              <tr>
                <td className="label-cell">Year</td>
                <td colSpan={3}>{data.year}</td>
              </tr>
            </tbody>
          </table>

          <table className="report-main-table">
            <thead>
              <tr>
                <th>S N</th>
                <th>Emp Id</th>
                <th>Name</th>
                <th>Designation</th>
                <th>Man Hrs</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Nat Hol Work</th>
                <th>Comp Off</th>
                <th>Pub Hol</th>
                <th>Week Off</th>
                <th>Bill Days</th>
                <th>Bill+Nat Hol</th>
                <th>F26 Pres</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {dept.employees.map((emp, i) => (
                <tr key={emp.employeeCode}>
                  <td>{i + 1}</td>
                  <td>{emp.employeeCode}</td>
                  <td className="text-left">{emp.name}</td>
                  <td className="text-left">{emp.designation}</td>
                  <td>{emp.manHours.toFixed(1)}</td>
                  <td>{emp.present}</td>
                  <td>{emp.absent}</td>
                  <td>{emp.natHolWork}</td>
                  <td>{emp.compOff}</td>
                  <td>{emp.pubHol}</td>
                  <td>{emp.weekOff}</td>
                  <td>{emp.billDays}</td>
                  <td>{emp.billNatHol}</td>
                  <td>{emp.f26Pres}</td>
                  <td></td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} className="text-left font-bold">Total No of Employee Present</td>
                <td className="font-bold">{dept.totalManDays.toFixed(1)}</td>
                <td colSpan={9}></td>
              </tr>
            </tbody>
          </table>

          <div className="report-footer">
            <table className="designation-totals-table">
              <thead>
                <tr><th>Designation</th><th>Total Man Days</th></tr>
              </thead>
              <tbody>
                {dept.designationTotals.map(d => (
                  <tr key={d.designation}>
                    <td className="text-left">{d.designation}</td>
                    <td>{d.totalManDays.toFixed(1)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="text-left font-bold">Total</td>
                  <td className="font-bold">{dept.totalManDays.toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
            <div className="remarks-box">Remarks:</div>
          </div>

          <div className="signature-row">
            <span>Checked by</span>
            <span>Reviewed by</span>
            <span>Approved by</span>
          </div>
        </div>
      ))}
    </div>
  );
}
