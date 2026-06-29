from django.db import models


class Shift(models.Model):
    name = models.CharField(max_length=200, unique=True)
    start_time = models.CharField(max_length=10)  # e.g. "09:00"
    end_time = models.CharField(max_length=10)    # e.g. "18:00"

    class Meta:
        db_table = 'shifts'
        ordering = ['name']

    def __str__(self):
        return self.name
