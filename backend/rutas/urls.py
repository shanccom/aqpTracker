from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),

    # 🔹 Vistas HTML
    path('empresa/<int:empresa_id>/', views.empresa_detalle, name='empresa_detalle'),
    path('ruta/<int:ruta_id>/', views.ruta_detalle, name='ruta_detalle'),

    # 🔹 Endpoints API JSON
    path('empresas/', views.empresa_list, name='empresa_list'),
    path('empresas/<int:empresa_id>/rutas/', views.rutas_por_empresa, name='rutas_por_empresa'),
    path('ruta/<int:ruta_id>/json/', views.ruta_json, name='ruta_json'),
    path('empresas/<int:empresa_id>/', views.empresa_detalle_api, name='empresa_detalle_api'),

    
]
