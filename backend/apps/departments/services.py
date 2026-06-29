from apps.activity_logs.services import log_activity
from .models import Department
from .serializers import DepartmentSerializer


class DepartmentService:
    def get_departments(self):
        qs = Department.objects.all().order_by('name')
        return DepartmentSerializer(qs, many=True).data

    def get_department(self, dept_id):
        try:
            dept = Department.objects.get(id=dept_id)
        except Department.DoesNotExist:
            return None
        return DepartmentSerializer(dept).data

    def create_department(self, data, user_id):
        dept = Department.objects.create(
            name=data.get('name'),
            description=data.get('description'),
            fixed_week_off=data.get('fixed_week_off') or 'Sunday',
        )
        log_activity(f"Department '{dept.name}' created", 'Info', user_id)
        return DepartmentSerializer(dept).data

    def update_department(self, dept_id, data, user_id):
        dept = Department.objects.get(id=dept_id)
        dept.name = data.get('name')
        dept.description = data.get('description')
        dept.fixed_week_off = data.get('fixed_week_off')
        dept.save()
        log_activity(f"Department '{dept.name}' details updated", 'Info', user_id)
        return DepartmentSerializer(dept).data

    def delete_department(self, dept_id, user_id):
        try:
            dept = Department.objects.get(id=dept_id)
        except Department.DoesNotExist:
            return False
        name = dept.name
        dept.delete()
        log_activity(f"Department '{name}' deleted", 'Info', user_id)
        return True


department_service = DepartmentService()
