from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Paradero, RutaParadero


def empresa_list(request):
    empresas = Empresa.objects.all().values('id', 'nombre', 'descripcion', 'color_principal')
    return JsonResponse(list(empresas), safe=False)

# 🔹 API: Rutas de una empresa
def rutas_por_empresa(request, empresa_id):
    rutas = Ruta.objects.filter(empresa_id=empresa_id).values(
        'id', 'codigo', 'nombre', 'sentido', 'color_linea', 'grosor_linea'
    )
    return JsonResponse(list(rutas), safe=False)

def index(request):
    """Vista principal que muestra la lista de empresas"""
    empresas = Empresa.objects.all()
    return render(request, 'rutas/index.html', {'empresas': empresas})


def empresa_detalle(request, empresa_id):
    """Vista que muestra las rutas de una empresa específica"""
    empresa = get_object_or_404(Empresa, id=empresa_id)
    rutas = empresa.rutas.all()
    return render(request, 'rutas/empresa_detalle.html', {
        'empresa': empresa,
        'rutas': rutas
    })


def ruta_detalle(request, ruta_id):
    """Vista que muestra el detalle de una ruta con su mapa"""
    ruta = get_object_or_404(Ruta, id=ruta_id)
    paraderos = RutaParadero.objects.filter(ruta=ruta).select_related('paradero')
    
    return render(request, 'rutas/ruta_detalle.html', {
        'ruta': ruta,
        'paraderos': paraderos
    })


def ruta_json(request, ruta_id):
    ruta = get_object_or_404(Ruta, id=ruta_id)
    paraderos_data = []

    for rp in RutaParadero.objects.filter(ruta=ruta).select_related('paradero'):
        paraderos_data.append({
            'nombre': rp.paradero.nombre,
            'latitud': rp.paradero.latitud,
            'longitud': rp.paradero.longitud,
            'es_popular': rp.paradero.es_popular,
            'orden': rp.orden,
            'distancia_metros': rp.distancia_metros
        })

    data = {
        'codigo': ruta.codigo,
        'nombre': ruta.nombre,
        'sentido': ruta.sentido,
        'empresa': ruta.empresa.nombre,
        'color_linea': ruta.color_linea,
        'grosor_linea': ruta.grosor_linea,
        'coordenadas': ruta.coordenadas,
        'paraderos': paraderos_data
    }

    return JsonResponse(data)

def empresa_detalle_api(request, empresa_id):
    empresa = get_object_or_404(Empresa, id=empresa_id)
    data = {
        'id': empresa.id,
        'nombre': empresa.nombre,
        'descripcion': empresa.descripcion,
        'color_principal': empresa.color_principal,
    }
    return JsonResponse(data)