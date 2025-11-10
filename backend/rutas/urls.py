from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmpresaViewSet, ParadaViewSet, RutaViewSet

router = DefaultRouter()
router.register(r'empresas', EmpresaViewSet)
router.register(r'paradas', ParadaViewSet)
router.register(r'rutas', RutaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]