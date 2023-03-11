"""fighthealthinsurance URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path

from fighthealthinsurance import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path('scan', views.ScanView.as_view(), name="scan"),
    path('server_side_ocr', views.OCRView.as_view(), name="server_side_ocr"),
    path('', views.IndexView.as_view(), name="root"),
    path('process', views.ProcessView.as_view(), name="process"),
    path('privacy_policy', views.PrivacyPolicyView.as_view(), name="privacy_policy"),
    path('opt_out', views.OptOutView.as_view(), name="opt_out"),
    path('remove_data', views.RemoveDataView.as_view(), name="remove_data"),
    path('tos', views.TermsOfServiceView.as_view(), name="tos"),
    path('find_next_steps', views.FindNextSteps.as_view(), name="find_next_steps"),
    path('generate_appeal', views.GenerateAppeal.as_view(), name="generate_appeal"),
]
