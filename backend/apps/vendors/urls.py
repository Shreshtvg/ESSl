from django.urls import path

from .views import VendorListView, VendorDetailView

urlpatterns = [
    path('vendors', VendorListView.as_view()),
    path('vendors/<int:pk>', VendorDetailView.as_view()),
]
