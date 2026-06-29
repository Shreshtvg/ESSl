from apps.activity_logs.services import log_activity
from .models import Designation
from .serializers import DesignationSerializer


class DesignationService:
    def get_designations(self):
        qs = Designation.objects.select_related('department').all().order_by('name')
        return DesignationSerializer(qs, many=True).data

    def get_designation(self, desg_id):
        try:
            desg = Designation.objects.select_related('department').get(id=desg_id)
        except Designation.DoesNotExist:
            return None
        return DesignationSerializer(desg).data

    def create_designation(self, data, user_id):
        desg = Designation.objects.create(
            name=data.get('name'),
            department_id=data.get('department_id'),
        )
        log_activity(f"Designation '{desg.name}' was created", 'Info', user_id)
        return DesignationSerializer(desg).data

    def update_designation(self, desg_id, data, user_id):
        desg = Designation.objects.get(id=desg_id)
        desg.name = data.get('name')
        desg.department_id = data.get('department_id')
        desg.save()
        log_activity(f"Designation '{desg.name}' was updated", 'Info', user_id)
        return DesignationSerializer(desg).data

    def delete_designation(self, desg_id, user_id):
        try:
            desg = Designation.objects.get(id=desg_id)
        except Designation.DoesNotExist:
            return False
        name = desg.name
        desg.delete()
        log_activity(f"Designation '{name}' was deleted", 'Info', user_id)
        return True


designation_service = DesignationService()
