from django.urls import path
from . import views

urlpatterns = [
    # API Endpoints
    path('empresas/', views.empresas_list, name='empresas_list'),
    path('empresas/<int:empresa_id>/rutas/', views.empresa_rutas, name='empresa_rutas'),
    path('ruta/<int:ruta_id>/json/', views.ruta_json, name='ruta_json'),
    path('recorrido/<int:recorrido_id>/json/', views.recorrido_json, name='recorrido_json'),
    # Algoritmo rutas
    path('buscar/', views.buscar_rutas_view, name='buscar_rutas'),
    # Debug
    path('debug/', views.debug_test, name='debug_test'),
]