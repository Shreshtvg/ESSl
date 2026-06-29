from apps.activity_logs.services import log_activity
from .models import Vendor
from .serializers import VendorSerializer


class VendorService:
    def get_vendors(self):
        qs = Vendor.objects.all().order_by('name')
        return VendorSerializer(qs, many=True).data

    def get_vendor(self, vendor_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return None
        return VendorSerializer(vendor).data

    def create_vendor(self, data, user_id):
        vendor = Vendor.objects.create(
            name=data.get('name'),
            contact_person=data.get('contact_person'),
            email=data.get('email'),
            phone=data.get('phone'),
            service_provided=data.get('service_provided'),
        )
        log_activity(f"Vendor contract added for '{vendor.name}'", 'Info', user_id)
        return VendorSerializer(vendor).data

    def update_vendor(self, vendor_id, data, user_id):
        vendor = Vendor.objects.get(id=vendor_id)
        vendor.name = data.get('name')
        vendor.contact_person = data.get('contact_person')
        vendor.email = data.get('email')
        vendor.phone = data.get('phone')
        vendor.service_provided = data.get('service_provided')
        vendor.save()
        log_activity(f"Vendor contract '{vendor.name}' modified", 'Info', user_id)
        return VendorSerializer(vendor).data

    def delete_vendor(self, vendor_id, user_id):
        try:
            vendor = Vendor.objects.get(id=vendor_id)
        except Vendor.DoesNotExist:
            return False
        name = vendor.name
        vendor.delete()
        log_activity(f"Vendor contract with '{name}' terminated", 'Info', user_id)
        return True


vendor_service = VendorService()
