from calendar import monthrange
from datetime import date as date_cls, datetime

from apps.attendance.models import Attendance
from apps.core.utils import weekday_name
from apps.departments.models import Department
from apps.employees.models import Employee
from apps.holidays.models import Holiday
from apps.leaves.models import LeaveRequest
from apps.vendors.models import Vendor

MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]


class ReportService:
    def get_reports(self, start_date=None, end_date=None, department_id=None, branch=None):
        employees = Employee.objects.select_related('department', 'designation').all()
        if department_id and department_id != 'All':
            employees = employees.filter(department_id=int(department_id))
        if branch and branch != 'All':
            employees = employees.filter(branch=branch)
        employees = employees.order_by('employee_code')

        emp_ids = [e.id for e in employees]
        att_qs = Attendance.objects.filter(employee_id__in=emp_ids)
        if start_date:
            att_qs = att_qs.filter(attendance_date__gte=start_date)
            att_qs = att_qs.filter(attendance_date__gte=start_date)
        if end_date:
            att_qs = att_qs.filter(attendance_date__lte=end_date)

        agg = {eid: {'present': 0, 'absent': 0, 'leave': 0, 'hours': 0.0} for eid in emp_ids}
        for a in att_qs:
            bucket = agg[a.employee_id]
            if a.status == 'Present':
                bucket['present'] += 1
            elif a.status == 'Absent':
                bucket['absent'] += 1
            elif a.status == 'Leave':
                bucket['leave'] += 1
            bucket['hours'] += a.hours or 0

        result = []
        for emp in employees:
            b = agg[emp.id]
            present_count = b['present']
            total_hours = b['hours']
            avg_hours = round(total_hours / present_count, 1) if present_count > 0 else 0
            result.append({
                'employeeCode': emp.employee_code,
                'employeeName': emp.name,
                'branch': emp.branch,
                'departmentName': emp.department.name if emp.department else None,
                'designationName': emp.designation.name if emp.designation else None,
                'presentCount': present_count,
                'absentCount': b['absent'],
                'leaveCount': b['leave'],
                'totalHours': round(total_hours, 2),
                'avgHours': avg_hours,
            })
        return result

    def get_attendance_report(self, start_date=None, end_date=None, department_id=None):
        qs = Attendance.objects.select_related(
            'employee', 'employee__department', 'employee__designation'
        ).all()
        if start_date:
            qs = qs.filter(attendance_date__gte=start_date)
        if end_date:
            qs = qs.filter(attendance_date__lte=end_date)
        if department_id:
            qs = qs.filter(employee__department_id=int(department_id))
        qs = qs.order_by('-attendance_date', 'employee__employee_code')

        return [
            {
                'id': a.id,
                'employee_id': a.employee_id,
                'attendance_date': a.attendance_date.strftime('%Y-%m-%d'),
                'check_in': a.check_in,
                'check_out': a.check_out,
                'hours': a.hours,
                'status': a.status,
                'employee_name': a.employee.name,
                'employee_code': a.employee.employee_code,
                'branch': a.employee.branch,
                'department_name': a.employee.department.name if a.employee.department else None,
                'designation_name': a.employee.designation.name if a.employee.designation else None,
            }
            for a in qs
        ]

    def get_leave_report(self, start_date=None, end_date=None, status=None):
        qs = LeaveRequest.objects.select_related('employee', 'employee__department').all()
        if start_date:
            qs = qs.filter(start_date__gte=start_date)
        if end_date:
            qs = qs.filter(end_date__lte=end_date)
        if status:
            qs = qs.filter(status=status)
        qs = qs.order_by('-start_date')

        return [
            {
                'id': lr.id,
                'employee_id': lr.employee_id,
                'start_date': lr.start_date.strftime('%Y-%m-%d'),
                'end_date': lr.end_date.strftime('%Y-%m-%d'),
                'leave_type': lr.leave_type,
                'reason': lr.reason,
                'status': lr.status,
                'employee_name': lr.employee.name,
                'employee_code': lr.employee.employee_code,
                'department_name': lr.employee.department.name if lr.employee.department else None,
            }
            for lr in qs
        ]

    def get_department_report(self):
        result = []
        for d in Department.objects.all().order_by('name'):
            total_employees = Employee.objects.filter(department_id=d.id).count()
            total_presents = (
                Attendance.objects.filter(
                    employee__department_id=d.id, status='Present'
                ).values('employee_id').distinct().count()
            )
            total_leaves = (
                Attendance.objects.filter(
                    employee__department_id=d.id, status='Leave'
                ).values('employee_id').distinct().count()
            )
            result.append({
                'id': d.id,
                'name': d.name,
                'description': d.description,
                'total_employees': total_employees,
                'total_presents': total_presents,
                'total_leaves': total_leaves,
            })
        return result

    def get_vendor_report(self):
        """Aggregated vendor view: vendor_name, employee_count, total_hours."""
        departments = list(Department.objects.all())
        result = []
        for vendor in Vendor.objects.all().order_by('name'):
            service = (vendor.service_provided or '').lower()
            matched_dept_ids = [
                d.id for d in departments
                if d.name.lower() in service or service in d.name.lower()
            ] if service else []

            if matched_dept_ids:
                emp_ids = list(
                    Employee.objects.filter(department_id__in=matched_dept_ids)
                    .values_list('id', flat=True)
                )
            else:
                emp_ids = []

            employee_count = len(emp_ids)
            total_hours = 0.0
            if emp_ids:
                for a in Attendance.objects.filter(employee_id__in=emp_ids):
                    total_hours += a.hours or 0

            result.append({
                'vendor_name': vendor.name,
                'employee_count': employee_count,
                'total_hours': round(total_hours, 2),
            })
        return result

    def get_monthly_attendance_report(self, year, month, branch=None,
                                      department_id=None, shift_id=None):
        y = int(year)
        m = int(month)
        last_day = monthrange(y, m)[1]
        start_date = f'{y}-{m:02d}-01'
        end_date = f'{y}-{m:02d}-{last_day:02d}'

        employees = Employee.objects.select_related('department', 'designation').filter(status='Active')
        if branch and branch != 'All':
            employees = employees.filter(branch=branch)
        if department_id and department_id != 'All':
            employees = employees.filter(department_id=int(department_id))
        if shift_id and shift_id != 'All':
            employees = employees.filter(shift_id=int(shift_id))
        employees = list(employees.order_by('department__name', 'employee_code'))

        if not employees:
            return {
                'month': MONTH_NAMES[m - 1], 'year': y,
                'principalEmployer': 'Brookfield', 'site': '-', 'departments': [],
            }

        emp_ids = [e.id for e in employees]
        att_map = {}
        for a in Attendance.objects.filter(
            attendance_date__range=[start_date, end_date], employee_id__in=emp_ids
        ):
            att_map[(a.employee_id, a.attendance_date.strftime('%Y-%m-%d'))] = a

        holiday_set = set(
            h.holiday_date.strftime('%Y-%m-%d')
            for h in Holiday.objects.filter(holiday_date__range=[start_date, end_date])
        )
        vendors = list(Vendor.objects.all())

        dates = [f'{y}-{m:02d}-{d:02d}' for d in range(1, last_day + 1)]

        dept_map = {}
        dept_order = []
        for emp in employees:
            stats = {'manHours': 0.0, 'present': 0, 'absent': 0, 'natHolWork': 0,
                     'compOff': 0, 'pubHol': 0, 'weekOff': 0}
            fixed_week_off = emp.department.fixed_week_off if emp.department else None

            for date in dates:
                rec = att_map.get((emp.id, date))
                if rec:
                    status = rec.status
                    hours = rec.hours or 0
                else:
                    status = 'Week Off' if weekday_name(date) == fixed_week_off else 'Absent'
                    hours = 0
                stats['manHours'] += hours
                is_holiday = date in holiday_set
                if status == 'Present':
                    if is_holiday:
                        stats['natHolWork'] += 1
                    else:
                        stats['present'] += 1
                elif status in ('Absent', 'Leave'):
                    stats['absent'] += 1
                elif status == 'Comp Off':
                    stats['compOff'] += 1
                elif status == 'Holiday':
                    stats['pubHol'] += 1
                elif status == 'Week Off':
                    stats['weekOff'] += 1

            bill_days = stats['present'] + stats['natHolWork'] + stats['compOff']
            bill_nat_hol = bill_days + stats['pubHol']
            dept_name = emp.department.name if emp.department else 'Unassigned'

            if dept_name not in dept_map:
                dept_map[dept_name] = {
                    'departmentName': dept_name, 'employees': [], 'designationTotals': {}
                }
                dept_order.append(dept_name)
            dept = dept_map[dept_name]
            dept['employees'].append({
                'employeeCode': emp.employee_code,
                'name': emp.name,
                'designation': emp.designation.name if emp.designation else '-',
                'manHours': round(stats['manHours'], 1),
                'present': stats['present'],
                'absent': stats['absent'],
                'natHolWork': stats['natHolWork'],
                'compOff': stats['compOff'],
                'pubHol': stats['pubHol'],
                'weekOff': stats['weekOff'],
                'billDays': bill_days,
                'billNatHol': bill_nat_hol,
                'f26Pres': stats['present'],
            })
            desg_key = emp.designation.name if emp.designation else '-'
            dept['designationTotals'][desg_key] = (
                dept['designationTotals'].get(desg_key, 0) + stats['manHours']
            )

        departments = []
        for name in dept_order:
            dept = dept_map[name]
            dept_lower = dept['departmentName'].lower()
            vendor = next(
                (v for v in vendors if dept_lower in (v.service_provided or '').lower()), None
            )
            total_man_days = sum(e['manHours'] for e in dept['employees'])
            departments.append({
                'departmentName': dept['departmentName'],
                'contractorName': vendor.name if vendor else '-',
                'employees': dept['employees'],
                'designationTotals': [
                    {'designation': desg, 'totalManDays': round(total, 1)}
                    for desg, total in dept['designationTotals'].items()
                ],
                'totalManDays': round(total_man_days, 1),
            })

        return {
            'month': MONTH_NAMES[m - 1], 'year': y,
            'principalEmployer': 'Brookfield',
            'site': employees[0].branch or '-',
            'departments': departments,
        }


report_service = ReportService()
