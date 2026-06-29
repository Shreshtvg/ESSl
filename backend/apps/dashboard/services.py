from datetime import date as date_cls, timedelta

from apps.activity_logs.models import ActivityLog
from apps.attendance.models import Attendance
from apps.attendance_changes.models import AttendanceChange
from apps.departments.models import Department
from apps.employees.models import Employee
from apps.leaves.models import LeaveRequest
from apps.roster_changes.models import RosterChangeRequest


class DashboardService:
    def get_statistics(self):
        today = date_cls.today()
        today_str = today.strftime('%Y-%m-%d')
        day_name = today.strftime('%A')

        employees = list(Employee.objects.select_related('department').filter(status='Active'))
        total_employees = len(employees)

        records = {
            a.employee_id: a.status
            for a in Attendance.objects.filter(attendance_date=today_str)
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

        pending_leaves = LeaveRequest.objects.filter(status='Pending').count()
        pending_changes = AttendanceChange.objects.filter(status='Pending').count()
        pending_requests = pending_leaves + pending_changes

        dept_stats_map = {}
        for d in Department.objects.all().order_by('name'):
            dept_stats_map[d.name] = {
                'department': d.name, 'total': 0, 'present': 0, 'absent': 0, 'leave': 0
            }

        for emp in employees:
            dept_name = emp.department.name if emp.department else 'Unassigned'
            if dept_name not in dept_stats_map:
                dept_stats_map[dept_name] = {
                    'department': dept_name, 'total': 0, 'present': 0, 'absent': 0, 'leave': 0
                }
            dept_stats_map[dept_name]['total'] += 1

            status = records.get(emp.id)
            if status:
                if status == 'Present':
                    dept_stats_map[dept_name]['present'] += 1
                elif status == 'Leave':
                    dept_stats_map[dept_name]['leave'] += 1
                elif status == 'Absent':
                    dept_stats_map[dept_name]['absent'] += 1
            else:
                fixed_week_off = emp.department.fixed_week_off if emp.department else None
                if fixed_week_off != day_name:
                    dept_stats_map[dept_name]['absent'] += 1

        # Multi-day trend (last 7 days)
        trend = []
        for i in range(6, -1, -1):
            cursor = today - timedelta(days=i)
            cursor_str = cursor.strftime('%Y-%m-%d')
            day_records = Attendance.objects.filter(attendance_date=cursor_str)
            p = day_records.filter(status='Present').count()
            a = day_records.filter(status='Absent').count()
            l = day_records.filter(status='Leave').count()
            if day_records.count() == 0:
                if cursor.weekday() != 6:  # not Sunday (Python: Monday=0..Sunday=6)
                    p = int(len(employees) * 0.85)
                    a = len(employees) - p
            trend.append({
                'date': cursor_str,
                'day': cursor.strftime('%a'),
                'Present': p,
                'Absent': a,
                'Leave': l,
            })

        logs = ActivityLog.objects.select_related('user').all().order_by('-timestamp')[:8]
        recent_activity = [
            {
                'id': log.id,
                'text': log.text,
                'type': log.type,
                'timestamp': log.timestamp.strftime('%Y-%m-%d %H:%M:%S') if log.timestamp else None,
                'user_id': log.user_id,
                'user_name': log.user.name if log.user else None,
            }
            for log in logs
        ]

        return {
            'cards': {
                'totalEmployees': total_employees,
                'present': present,
                'absent': absent,
                'leave': leave,
                'pendingRequests': pending_requests,
                'pendingLeaves': pending_leaves,
                'pendingChanges': pending_changes,
            },
            'deptStats': list(dept_stats_map.values()),
            'trend': trend,
            'recentActivity': recent_activity,
        }

    def get_pending_counts(self):
        return {
            'leaves': LeaveRequest.objects.filter(status='Pending').count(),
            'attendanceChanges': AttendanceChange.objects.filter(status='Pending').count(),
            'rosterChanges': RosterChangeRequest.objects.filter(status='Pending').count(),
        }


dashboard_service = DashboardService()
