import re
from datetime import date as date_cls

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.authentication.models import User
from apps.departments.models import Department
from apps.designations.models import Designation
from apps.shifts.models import Shift
from apps.holidays.models import Holiday
from apps.vendors.models import Vendor
from apps.employees.models import Employee
from apps.leaves.models import LeaveRequest
from apps.attendance_changes.models import AttendanceChange
from apps.attendance.models import Attendance
from apps.activity_logs.models import ActivityLog


class Command(BaseCommand):
    help = 'Seeds Eco World enterprise data for Attendix ERP'

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write("Database already seeded. Checking today's attendance...")
            self._ensure_today_attendance()
            return

        self.stdout.write('Seeding Eco World enterprise data for Attendix ERP...')
        with transaction.atomic():
            self._seed()
        self._ensure_today_attendance()

    # ──────────────────────────────────────────────────────────────────────
    def _seed(self):
        # 1. Users
        User.objects.create_user('rajesh.menon@ecoworld.in', 'Rajesh Menon', 'Admin@123', 'Admin')
        User.objects.create_user('priya.nair@ecoworld.in', 'Priya Nair', 'Sup@12345', 'Supervisor')
        User.objects.create_user('karthik.sub@ecoworld.in', 'Karthik Subramaniam', 'Sup@12345', 'Supervisor')

        # 2. Departments
        d_sec = Department.objects.create(name='Security', description='Security force and access control', fixed_week_off='Sunday')
        d_prop = Department.objects.create(name='Property Management', description='Facility operations and property upkeep', fixed_week_off='Sunday')
        d_stp = Department.objects.create(name='STP', description='Sewage Treatment Plant operations', fixed_week_off='Saturday')
        d_tech = Department.objects.create(name='Technical', description='Electrical, plumbing & MEP engineering', fixed_week_off='Sunday')
        d_hkp = Department.objects.create(name='Housekeeping', description='Premises hygiene and cleanliness', fixed_week_off='Sunday')
        d_waste = Department.objects.create(name='Waste Management', description='Solid & liquid waste handling', fixed_week_off='Sunday')
        d_hort = Department.objects.create(name='Horticulture', description='Landscape, greenery & garden maintenance', fixed_week_off='Sunday')
        d_park = Department.objects.create(name='Parking Management', description='Parking bays, valet & vehicle management', fixed_week_off='Sunday')

        # 3. Designations
        def desg(name, dept):
            return Designation.objects.create(name=name, department=dept)

        desg_sec_officer = desg('Security Officer', d_sec)
        desg_sec_superv = desg('Security Supervisor', d_sec)
        desg_sec_guard = desg('Security Guard', d_sec)
        desg_fac_mgr = desg('Facility Manager', d_prop)
        desg_fac_exec = desg('Facility Executive', d_prop)
        desg_shift_eng = desg('Shift Engineer', d_prop)
        desg_stp = desg('STP Operator', d_stp)
        desg_elec = desg('Electrician', d_tech)
        desg_technicn = desg('Technician', d_tech)
        desg_water_body = desg('Water Body Operator', d_tech)
        desg_hkp_lead = desg('Housekeeping Lead', d_hkp)
        desg_hkp_staff = desg('Housekeeping Staff', d_hkp)
        desg_hkp_janitor = desg('Sr. HK Janitor', d_hkp)
        desg_pantry_lady = desg('Pantry Lady', d_hkp)
        desg_waste_hndlr = desg('Waste Handler', d_waste)
        desg_field_staff = desg('Field Staff', d_waste)
        desg_waste_sup = desg('Supervisor', d_waste)
        desg_hort = desg('Horticulturist', d_hort)
        desg_gardener = desg('Gardener', d_hort)
        desg_garden_sup = desg('Garden Supervisor', d_hort)
        desg_park_mrshl = desg('Parking Marshal', d_park)
        desg_driver = desg('Driver', d_park)

        # 4. Shifts
        shift_gen = Shift.objects.create(name='General Shift', start_time='09:00', end_time='18:00')
        shift_morn = Shift.objects.create(name='Morning Shift', start_time='06:00', end_time='14:00')
        shift_night = Shift.objects.create(name='Night Shift', start_time='22:00', end_time='06:00')

        # 5. Holidays
        holidays = [
            ('2026-01-01', 'New Year Day', 'National rest day'),
            ('2026-01-26', 'Republic Day', 'National Republic Holiday'),
            ('2026-05-01', 'Labour Day', 'International Workers Day'),
            ('2026-08-15', 'Independence Day', 'National Independence Holiday'),
            ('2026-10-02', 'Gandhi Jayanti', 'National Holiday'),
            ('2026-11-14', 'Diwali', 'Festival of Lights'),
            ('2026-12-25', 'Christmas Day', 'Annual Christmas Holiday'),
        ]
        for hdate, hname, hdesc in holidays:
            Holiday.objects.create(holiday_date=hdate, name=hname, description=hdesc)

        # 6. Vendors
        vendors = [
            ('JLL India Pvt Ltd', 'Aravind Rajan', 'aravind.rajan@jll.com', '9880297101', 'Property Management'),
            ('Amazing Blooms', 'Denita Fernandes', 'amazingbloomsrd@yahoo.in', '9854517355', 'Horticulture'),
            ('247 Facility Solutions', 'Mohan Pillai', 'mohan.pillai@247fspl.com', '9741230045', 'Housekeeping'),
            ('Saahas Waste Management', 'Swetha Krishnan', 'swetha@saahaszerowaste.org', '9845001234', 'Waste Management'),
            ('Voltas Limited', 'Suresh Iyer', 'suresh.iyer@voltas.com', '9900112233', 'Technical / HVAC'),
            ('G4S Security Services', 'Ramesh Nambiar', 'ramesh.nambiar@g4s.com', '9811009988', 'Security Services'),
        ]
        for v in vendors:
            Vendor.objects.create(
                name=v[0], contact_person=v[1], email=v[2], phone=v[3], service_provided=v[4]
            )

        # 7. Employees
        BRANCH = 'EcoWorld'
        self._phone_base = 9845100001
        self.emp_id_map = {}

        def add_emp(code, name, dept, desg_obj, shift, status='Active'):
            slug = re.sub(r'[^a-z0-9.]', '', re.sub(r'\s+', '.', name.lower()))
            email = f'{slug}@ecoworld.in'
            phone = str(self._phone_base)
            self._phone_base += 1
            emp = Employee.objects.create(
                employee_code=code, name=name, email=email, phone=phone,
                department=dept, designation=desg_obj, shift=shift,
                branch=BRANCH, status=status,
            )
            self.emp_id_map[name] = emp.id
            return emp

        # SECURITY (Active: 12)
        add_emp('55558', 'Hiren Malo', d_sec, desg_sec_guard, shift_gen)
        add_emp('EW-SEC-001', 'Suresh Babu', d_sec, desg_sec_guard, shift_gen)
        add_emp('EW-SEC-002', 'Vinod Kumar', d_sec, desg_sec_guard, shift_night)
        add_emp('EW-SEC-003', 'Arjun Singh', d_sec, desg_sec_guard, shift_morn)
        add_emp('EW-SEC-004', 'Ravi Shankar', d_sec, desg_sec_superv, shift_gen)
        add_emp('EW-SEC-005', 'Mohammed Arif', d_sec, desg_sec_guard, shift_night)
        add_emp('EW-SEC-006', 'Bikram Thapa', d_sec, desg_sec_guard, shift_morn)
        add_emp('EW-SEC-007', 'Sunil Tamang', d_sec, desg_sec_guard, shift_gen)
        add_emp('EW-SEC-008', 'Deepak Rai', d_sec, desg_sec_guard, shift_night)
        add_emp('EW-SEC-009', 'Mohan Gurung', d_sec, desg_sec_guard, shift_morn)
        add_emp('EW-SEC-010', 'Raju Lama', d_sec, desg_sec_officer, shift_gen)
        add_emp('EW-SEC-011', 'Rajesh Paswan', d_sec, desg_sec_guard, shift_gen)

        # PROPERTY MANAGEMENT (Active: 8)
        add_emp('458261', 'Shankar H Y', d_prop, desg_shift_eng, shift_gen)
        add_emp('563251', 'Naresh Kumar Jyothi', d_prop, desg_fac_exec, shift_gen)
        add_emp('EW-PROP-001', 'Arun Menon', d_prop, desg_fac_mgr, shift_gen)
        add_emp('EW-PROP-002', 'Bindhu Nair', d_prop, desg_fac_exec, shift_gen)
        add_emp('EW-PROP-003', 'Chandrika Pillai', d_prop, desg_shift_eng, shift_gen)
        add_emp('EW-PROP-004', 'Dileesh Kumar', d_prop, desg_fac_exec, shift_gen)
        add_emp('EW-PROP-005', 'Elsa Mathew', d_prop, desg_fac_exec, shift_gen)
        add_emp('EW-PROP-006', 'Faisal Khan', d_prop, desg_shift_eng, shift_gen)

        # STP (Active: 5)
        add_emp('1512', 'Joseph', d_stp, desg_stp, shift_morn)
        add_emp('1314', 'Ranganatha R', d_stp, desg_stp, shift_morn)
        add_emp('1311', 'Kammari Suresh', d_stp, desg_stp, shift_morn)
        add_emp('1317', 'Chandre Gowda', d_stp, desg_stp, shift_morn)
        add_emp('2212', 'Gajendra', d_stp, desg_stp, shift_morn)

        # TECHNICAL (Active: 7)
        add_emp('12165', 'Aslam', d_tech, desg_water_body, shift_gen)
        add_emp('EW-TECH-001', 'Abdul Hameed', d_tech, desg_elec, shift_gen)
        add_emp('EW-TECH-002', 'Babu Raj', d_tech, desg_technicn, shift_gen)
        add_emp('EW-TECH-003', 'Chandrashekar', d_tech, desg_elec, shift_gen)
        add_emp('EW-TECH-004', 'Dinesh Mohan', d_tech, desg_technicn, shift_gen)
        add_emp('EW-TECH-005', 'Eswaran P', d_tech, desg_elec, shift_gen)
        add_emp('EW-TECH-006', 'Francis Joseph', d_tech, desg_technicn, shift_gen)

        # HOUSEKEEPING (Active: 15)
        add_emp('48529', 'Altaf Hussain', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('51691', 'Rahamat Ali', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('54002', 'Shambhunath', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('53568', 'Santush Das', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('56206', 'Dulal Uddin', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('56690', 'Khandakar', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('42448', 'Nandu', d_hkp, desg_hkp_janitor, shift_gen)
        add_emp('43911', 'Babanna', d_hkp, desg_hkp_janitor, shift_gen)
        add_emp('42375', 'Bharamappa', d_hkp, desg_hkp_janitor, shift_gen)
        add_emp('45294', 'Tabita Nag', d_hkp, desg_pantry_lady, shift_gen)
        add_emp('EW-HKP-001', 'Sushila Devi', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('EW-HKP-002', 'Hanumantha Reddy', d_hkp, desg_hkp_lead, shift_gen)
        add_emp('EW-HKP-003', 'Anjali Sharma', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('EW-HKP-004', 'Rekha Patel', d_hkp, desg_hkp_staff, shift_gen)
        add_emp('EW-HKP-005', 'Lalitha Bai', d_hkp, desg_hkp_staff, shift_gen)

        # WASTE MANAGEMENT (Active: 5)
        add_emp('920', 'Mallikarjun', d_waste, desg_field_staff, shift_morn)
        add_emp('635', 'Maneendra', d_waste, desg_waste_sup, shift_morn)
        add_emp('EW-WMST-001', 'Amarjeet Singh', d_waste, desg_waste_hndlr, shift_morn)
        add_emp('EW-WMST-002', 'Bhupinder Kumar', d_waste, desg_waste_hndlr, shift_morn)
        add_emp('EW-WMST-003', 'Charan Singh', d_waste, desg_waste_hndlr, shift_morn)

        # HORTICULTURE (Active: 6)
        add_emp('3266', 'Hanumantha', d_hort, desg_gardener, shift_morn)
        add_emp('2519', 'Puttaraj', d_hort, desg_gardener, shift_morn)
        add_emp('2905', 'Srinivas', d_hort, desg_gardener, shift_morn)
        add_emp('2434', 'Sushila', d_hort, desg_garden_sup, shift_morn)
        add_emp('EW-HORT-001', 'Annamalai R', d_hort, desg_hort, shift_morn)
        add_emp('EW-HORT-002', 'Boopalan S', d_hort, desg_gardener, shift_morn)

        # PARKING MANAGEMENT (Active: 6)
        add_emp('25021', 'Shib Sankar', d_park, desg_driver, shift_gen)
        add_emp('EW-PARK-001', 'Aakash Pandey', d_park, desg_park_mrshl, shift_gen)
        add_emp('EW-PARK-002', 'Bhushan Patil', d_park, desg_park_mrshl, shift_gen)
        add_emp('EW-PARK-003', 'Chetan Sawant', d_park, desg_park_mrshl, shift_gen)
        add_emp('EW-PARK-004', 'Dhruv Kulkarni', d_park, desg_park_mrshl, shift_gen)
        add_emp('EW-PARK-005', 'Eknath Jadhav', d_park, desg_park_mrshl, shift_gen)

        # INACTIVE EMPLOYEES
        inactive = [
            ('2246', 'Shivaraja K', d_stp, desg_stp, shift_morn),
            ('2240', 'Shivanna C', d_stp, desg_stp, shift_morn),
            ('2485', 'Azmir Hussain', d_stp, desg_stp, shift_morn),
            ('EW-SEC-012', 'Sanjay Kumar Singh', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-013', 'Amit Prasad', d_sec, desg_sec_guard, shift_night),
            ('EW-SEC-014', 'Dinesh Mandal', d_sec, desg_sec_guard, shift_morn),
            ('EW-SEC-015', 'Govind Mahato', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-016', 'Pramod Sharma', d_sec, desg_sec_guard, shift_night),
            ('EW-SEC-017', 'Satish Gupta', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-018', 'Ramesh Chandra', d_sec, desg_sec_guard, shift_morn),
            ('EW-SEC-019', 'Bhola Nath', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-020', 'Kanhaiya Lal', d_sec, desg_sec_guard, shift_night),
            ('EW-SEC-021', 'Manoj Tiwari', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-022', 'Ajay Verma', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-023', 'Vikas Yadav', d_sec, desg_sec_guard, shift_morn),
            ('EW-SEC-024', 'Rakesh Mishra', d_sec, desg_sec_guard, shift_night),
            ('EW-SEC-025', 'Pankaj Dubey', d_sec, desg_sec_guard, shift_gen),
            ('EW-SEC-026', 'Suresh Pal', d_sec, desg_sec_superv, shift_gen),
            ('EW-PROP-007', 'Geetha Krishnan', d_prop, desg_fac_exec, shift_gen),
            ('EW-PROP-008', 'Hari Prasad', d_prop, desg_shift_eng, shift_gen),
            ('EW-PROP-009', 'Indira Suresh', d_prop, desg_fac_exec, shift_gen),
            ('EW-PROP-010', 'Jayakumar M', d_prop, desg_fac_mgr, shift_gen),
            ('EW-PROP-011', 'Kavitha Rajan', d_prop, desg_fac_exec, shift_gen),
            ('EW-PROP-012', 'Lakshmi Devi', d_prop, desg_fac_exec, shift_gen),
            ('EW-TECH-007', 'Ganapathi R', d_tech, desg_technicn, shift_gen),
            ('EW-TECH-008', 'Harish Naidu', d_tech, desg_elec, shift_gen),
            ('EW-TECH-009', 'Ibrahim Shaikh', d_tech, desg_technicn, shift_gen),
            ('EW-TECH-010', 'Javed Akhtar', d_tech, desg_elec, shift_gen),
            ('EW-TECH-011', 'Kiran Reddy', d_tech, desg_technicn, shift_gen),
            ('EW-TECH-012', 'Lokesh Gowda', d_tech, desg_water_body, shift_gen),
            ('EW-HKP-006', 'Meenakshi S', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-007', 'Nirmala Kumari', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-008', 'Padma Devi', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-009', 'Radha Krishnan', d_hkp, desg_hkp_janitor, shift_gen),
            ('EW-HKP-010', 'Sumitra Singh', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-011', 'Tara Devi', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-012', 'Usha Rani', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-013', 'Vasantha Kumari', d_hkp, desg_pantry_lady, shift_gen),
            ('EW-HKP-014', 'Asha Latha', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-015', 'Bhagyalakshmi', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-016', 'Chitra Devi', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-017', 'Devaki Ammal', d_hkp, desg_pantry_lady, shift_gen),
            ('EW-HKP-018', 'Elakkiya S', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-HKP-019', 'Fatima Bibi', d_hkp, desg_hkp_staff, shift_gen),
            ('EW-WMST-004', 'Daljit Singh', d_waste, desg_waste_hndlr, shift_morn),
            ('EW-WMST-005', 'Eshwar Lal', d_waste, desg_waste_hndlr, shift_morn),
            ('EW-WMST-006', 'Faquir Chand', d_waste, desg_field_staff, shift_morn),
            ('EW-HORT-003', 'Chinnaraj P', d_hort, desg_gardener, shift_morn),
            ('EW-HORT-004', 'Dhandapani M', d_hort, desg_gardener, shift_morn),
            ('EW-HORT-005', 'Elangovan K', d_hort, desg_hort, shift_morn),
            ('EW-HORT-006', 'Ganesan T', d_hort, desg_gardener, shift_morn),
            ('EW-PARK-006', 'Farhan Sheikh', d_park, desg_park_mrshl, shift_gen),
            ('EW-PARK-007', 'Ganesh Pawar', d_park, desg_park_mrshl, shift_gen),
            ('EW-PARK-008', 'Hemant Kadam', d_park, desg_park_mrshl, shift_night),
            ('EW-PARK-009', 'Imran Shaikh', d_park, desg_driver, shift_gen),
            ('EW-PARK-010', 'Jitendra More', d_park, desg_park_mrshl, shift_morn),
        ]
        for code, name, dept, desg_obj, shift in inactive:
            add_emp(code, name, dept, desg_obj, shift, 'Inactive')

        # 8. Leave Requests
        today = date_cls.today().strftime('%Y-%m-%d')
        leave_entries = [
            ('Faisal Khan', 'Casual Leave', 'Personal work out of station', 'Approved'),
            ('Hanumantha Reddy', 'Sick Leave', 'Fever — not feeling well', 'Approved'),
            ('Boopalan S', 'Casual Leave', 'Family function', 'Approved'),
            ('Rekha Patel', 'Sick Leave', 'Medical appointment', 'Pending'),
        ]
        for name, ltype, reason, status in leave_entries:
            emp_id = self.emp_id_map.get(name)
            if emp_id:
                LeaveRequest.objects.create(
                    employee_id=emp_id, start_date=today, end_date=today,
                    leave_type=ltype, reason=reason, status=status,
                )

        # 9. Punch Correction
        corr_emp_id = self.emp_id_map.get('Shankar H Y')
        if corr_emp_id:
            AttendanceChange.objects.create(
                employee_id=corr_emp_id, attendance_date='2026-06-22',
                requested_check_in='09:00', requested_check_out='18:00',
                reason='Forgot to punch out due to shift overload', status='Pending',
            )

        # 10. Activity Logs
        ActivityLog.objects.create(text='Attendix ERP initialized for Eco World facility.', type='System', user_id=1)
        ActivityLog.objects.create(text='Admin Rajesh Menon logged in to Eco World cluster.', type='Auth', user_id=1)

        self.stdout.write(
            f'Seeded 64 active + {len(inactive)} inactive employees across 8 departments.'
        )

    # ──────────────────────────────────────────────────────────────────────
    def _ensure_today_attendance(self):
        today = date_cls.today().strftime('%Y-%m-%d')

        if Attendance.objects.filter(attendance_date=today).exists():
            self.stdout.write(f'Attendance for {today} already exists. Skipping.')
            return

        employees = list(
            Employee.objects.select_related('shift').filter(status='Active').order_by('id')
        )
        if not employees:
            self.stdout.write('No active employees found — skipping attendance seed.')
            return

        in_offsets = [-5, 2, -8, 3, 0, 7, -3, 10, -1, 5, 12, -6, 4, -2, 8, 1, -4, 6, 9, -7]
        out_offsets = [5, 15, 0, 22, 8, 30, 3, 10, 18, 25, 2, 12, 35, 7, 20, 0, 15, 5, 28, 10]
        status_pattern = (
            ['Present'] * 14 + ['Absent'] * 3 + ['Leave'] * 2 + ['Week Off']
        )

        present_count = absent_count = leave_count = wo_count = 0
        records = []

        def pad(n):
            return str(int(abs(n))).zfill(2)

        for idx, emp in enumerate(employees):
            status = status_pattern[idx % len(status_pattern)]
            if status == 'Present':
                start_str = emp.shift.start_time if emp.shift else '09:00'
                end_str = emp.shift.end_time if emp.shift else '18:00'
                sh, sm = [int(x) for x in start_str.split(':')]
                eh, em = [int(x) for x in end_str.split(':')]
                in_min = sh * 60 + sm + in_offsets[idx % len(in_offsets)]
                out_min = eh * 60 + em + out_offsets[idx % len(out_offsets)]
                check_in = f'{pad(in_min / 60)}:{pad(in_min % 60)}'
                check_out = f'{pad(out_min / 60)}:{pad(out_min % 60)}'
                hours = (out_min - in_min) / 60
                if hours < 0:
                    hours += 24
                records.append(Attendance(
                    employee_id=emp.id, attendance_date=today,
                    check_in=check_in, check_out=check_out,
                    hours=round(hours, 2), status='Present',
                ))
                present_count += 1
            else:
                records.append(Attendance(
                    employee_id=emp.id, attendance_date=today,
                    check_in=None, check_out=None, hours=0, status=status,
                ))
                if status == 'Absent':
                    absent_count += 1
                elif status == 'Leave':
                    leave_count += 1
                elif status == 'Week Off':
                    wo_count += 1

        Attendance.objects.bulk_create(records, ignore_conflicts=True)
        self.stdout.write(
            f'Attendance seeded for {today}: {present_count} Present · {absent_count} Absent · '
            f'{leave_count} Leave · {wo_count} Week Off (total {len(employees)})'
        )
