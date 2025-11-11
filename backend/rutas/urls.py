from django.urls import path
from . import views

app_name = 'rutas'

urlpatterns = [
    
    # API Endpoints
    path('empresas/', views.empresas_list, name='empresas_list'), # TODAS LAS EMPRESAS
    path('empresas/<int:empresa_id>/rutas/', views.empresa_rutas, name='empresa_rutas'), #TODAS LAS RUTAS DE UNA EMPRESA
    path('ruta/<int:ruta_id>/json/', views.ruta_json, name='ruta_json'), # RECORRIDO IDA Y VUELTA
    path('recorrido/<int:recorrido_id>/json/', views.recorrido_json, name='recorrido_json'), #SOLO UN RECORRIDO
]