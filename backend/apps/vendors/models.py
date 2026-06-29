from django.db import models


class Vendor(models.Model):
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    service_provided = models.CharField(max_length=200, blank=True, null=True)

    class Meta:
        db_table = 'vendors'
        ordering = ['name']

    def __str__(self):
        return self.name
