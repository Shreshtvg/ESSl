from django.db.models import Q

from apps.activity_logs.services import log_activity
from .models import Employee
from .serializers import EmployeeSerializer


class EmployeeService:
    def get_employees(self, filters=None):
        filters = filters or {}
        qs = Employee.objects.select_related('department', 'designation', 'shift').all()

        search = filters.get('search')
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(employee_code__icontains=search)
                | Q(email__icontains=search)
            )
        if filters.get('department_id'):
            qs = qs.filter(department_id=filters['department_id'])
        if filters.get('designation_id'):
            qs = qs.filter(designation_id=filters['designation_id'])
        if filters.get('shift_id'):
            qs = qs.filter(shift_id=filters['shift_id'])
        if filters.get('branch'):
            qs = qs.filter(branch=filters['branch'])
        if filters.get('status'):
            qs = qs.filter(status=filters['status'])

        qs = qs.order_by('employee_code')
        return EmployeeSerializer(qs, many=True).data

    def get_employee(self, emp_id):
        try:
            emp = Employee.objects.select_related('department', 'designation', 'shift').get(id=emp_id)
        except Employee.DoesNotExist:
            return None
        return EmployeeSerializer(emp).data

    def create_employee(self, data, user_id):
        emp = Employee.objects.create(
            employee_code=data.get('employee_code'),
            name=data.get('name'),
            email=data.get('email'),
            phone=data.get('phone'),
            department_id=data.get('department_id'),
            designation_id=data.get('designation_id'),
            shift_id=data.get('shift_id'),
            branch=data.get('branch') or 'Main Branch',
            status=data.get('status') or 'Active',
        )
        log_activity(
            f"Employee '{emp.name}' ({emp.employee_code}) was registered", 'Info', user_id
        )
        return EmployeeSerializer(emp).data

    def update_employee(self, emp_id, data, user_id):
        emp = Employee.objects.get(id=emp_id)
        emp.employee_code = data.get('employee_code')
        emp.name = data.get('name')
        emp.email = data.get('email')
        emp.phone = data.get('phone')
        emp.department_id = data.get('department_id')
        emp.designation_id = data.get('designation_id')
        emp.shift_id = data.get('shift_id')
        emp.branch = data.get('branch')
        emp.status = data.get('status')
        emp.save()
        log_activity(f"Employee '{emp.name}' details were updated", 'Info', user_id)
        return EmployeeSerializer(emp).data

    def delete_employee(self, emp_id, user_id):
        try:
            emp = Employee.objects.get(id=emp_id)
        except Employee.DoesNotExist:
            return False
        name, code = emp.name, emp.employee_code
        emp.delete()
        log_activity(f"Employee '{name}' ({code}) was deleted", 'Info', user_id)
        return True


employee_service = EmployeeService()
