from datetime import datetime

from apps.activity_logs.services import log_activity
from apps.core.utils import calculate_hours, weekday_name
from apps.employees.models import Employee
from .models import Attendance


class AttendanceService:
    def get_attendance_by_date(self, date, department_id=None):
        day_name = weekday_name(date)

        employees = (
            Employee.objects.select_related('department', 'designation')
            .filter(status='Active')
        )
        if department_id:
            employees = employees.filter(department_id=department_id)
        employees = employees.order_by('department__name', 'employee_code')

        records = {
            a.employee_id: a
            for a in Attendance.objects.filter(attendance_date=date)
        }

        departments_map = {}
        order = []
        for emp in employees:
            dept_name = emp.department.name if emp.department else 'Unassigned'
            if dept_name not in departments_map:
                departments_map[dept_name] = {
                    'departmentId': emp.department_id,
                    'departmentName': dept_name,
                    'employees': [],
                }
                order.append(dept_name)

            rec = records.get(emp.id)
            if rec:
                status = rec.status
                check_in = rec.check_in or ''
                check_out = rec.check_out or ''
                hours = rec.hours or 0
                attendance_id = rec.id
            else:
                fixed_week_off = emp.department.fixed_week_off if emp.department else None
                status = 'Week Off' if fixed_week_off == day_name else 'Absent'
                check_in = ''
                check_out = ''
                hours = 0
                attendance_id = None

            departments_map[dept_name]['employees'].append({
                'employeeId': emp.id,
                'employeeCode': emp.employee_code,
                'employeeName': emp.name,
                'designation': emp.designation.name if emp.designation else 'Unassigned',
                'branch': emp.branch,
                'shiftId': emp.shift_id,
                'attendanceId': attendance_id,
                'attendanceDate': date,
                'checkIn': check_in,
                'checkOut': check_out,
                'hours': hours,
                'status': status,
            })

        return [departments_map[name] for name in order]

    def save_attendance(self, employee_id, attendance_date, check_in, check_out, hours, status):
        obj, _ = Attendance.objects.update_or_create(
            employee_id=employee_id,
            attendance_date=attendance_date,
            defaults={
                'check_in': check_in,
                'check_out': check_out,
                'hours': hours,
                'status': status,
            },
        )
        return obj

    def update_attendance(self, record, user_id):
        employee_id = record.get('employeeId')
        attendance_date = record.get('attendanceDate')
        check_in = record.get('checkIn')
        check_out = record.get('checkOut')
        status = record.get('status')

        hours = 0
        if status == 'Present':
            hours = calculate_hours(check_in, check_out)

        obj = self.save_attendance(
            employee_id, attendance_date,
            check_in or None, check_out or None, hours, status,
        )
        log_activity(
            f'Attendance for employee ID {employee_id} updated for date {attendance_date}. '
            f'Status: {status}',
            'Info', user_id,
        )
        return {
            'id': obj.id,
            'employeeId': employee_id,
            'attendanceDate': attendance_date,
            'checkIn': check_in,
            'checkOut': check_out,
            'hours': hours,
            'status': status,
        }

    def get_summary(self, date):
        day_name = weekday_name(date)
        employees = list(
            Employee.objects.select_related('department').filter(status='Active')
        )
        records = {
            a.employee_id: a.status
            for a in Attendance.objects.filter(attendance_date=date)
        }

        present = absent = leave = week_off = holiday = 0
        for emp in employees:
            status = records.get(emp.id)
            if status:
                if status == 'Present':
                    present += 1
                elif status == 'Leave':
                    leave += 1
                elif status == 'Absent':
                    absent += 1
                elif status == 'Week Off':
                    week_off += 1
                elif status == 'Holiday':
                    holiday += 1
            else:
                fixed_week_off = emp.department.fixed_week_off if emp.department else None
                if fixed_week_off == day_name:
                    week_off += 1
                else:
                    absent += 1

        return {
            'total': len(employees),
            'present': present,
            'absent': absent,
            'leave': leave,
            'weekOff': week_off,
            'holiday': holiday,
        }


attendance_service = AttendanceService()
