from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/', include('apps.departments.urls')),
    path('api/', include('apps.designations.urls')),
    path('api/', include('apps.shifts.urls')),
    path('api/', include('apps.employees.urls')),
    path('api/', include('apps.attendance.urls')),
    path('api/', include('apps.leaves.urls')),
    path('api/', include('apps.attendance_changes.urls')),
    path('api/', include('apps.roster.urls')),
    path('api/', include('apps.roster_changes.urls')),
    path('api/', include('apps.holidays.urls')),
    path('api/', include('apps.vendors.urls')),
    path('api/', include('apps.dashboard.urls')),
    path('api/', include('apps.reports.urls')),
    path('api/', include('apps.activity_logs.urls')),
]
