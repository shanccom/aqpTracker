from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero
#Algoritmo rutas
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import calcular_distancia

def empresas_list(request):
    """API endpoint que lista todas las empresas"""
    empresas = Empresa.objects.all().values('id', 'nombre', 'descripcion', 'color_principal')
    return JsonResponse(list(empresas), safe=False)


def empresa_rutas(request, empresa_id):
    """API endpoint que lista las rutas de una empresa"""
    rutas = Ruta.objects.filter(empresa_id=empresa_id).values('id', 'nombre', 'codigo', 'empresa')
    return JsonResponse(list(rutas), safe=False)

def recorrido_json(request, recorrido_id):
    """API endpoint que devuelve los datos de un recorrido específico (IDA o VUELTA)"""
    recorrido = get_object_or_404(Recorrido, id=recorrido_id)
    paraderos_data = []
    
    for rp in RecorridoParadero.objects.filter(recorrido=recorrido).select_related('paradero'):
        paraderos_data.append({
            'nombre': rp.paradero.nombre,
            'latitud': rp.paradero.latitud,
            'longitud': rp.paradero.longitud,
            'es_popular': rp.paradero.es_popular,
            'orden': rp.orden,
            'distancia_metros': rp.distancia_metros
        })
    
    data = {
        'id': recorrido.id,
        'ruta_codigo': recorrido.ruta.codigo,
        'ruta_nombre': recorrido.ruta.nombre,
        'sentido': recorrido.sentido,
        'empresa': recorrido.ruta.empresa.nombre,
        'color_linea': recorrido.color_linea,
        'grosor_linea': recorrido.grosor_linea,
        'coordenadas': recorrido.coordenadas,
        'paraderos': paraderos_data
    }
    
    return JsonResponse(data)

def ruta_json(request, ruta_id):
    """API endpoint que devuelve ambos recorridos (IDA y VUELTA) de una ruta"""
    ruta = get_object_or_404(Ruta, id=ruta_id)
    recorridos_data = []
    
    for recorrido in ruta.recorridos.all():
        paraderos_data = []
        for rp in RecorridoParadero.objects.filter(recorrido=recorrido).select_related('paradero'):
            paraderos_data.append({
                'nombre': rp.paradero.nombre,
                'latitud': rp.paradero.latitud,
                'longitud': rp.paradero.longitud,
                'es_popular': rp.paradero.es_popular,
                'orden': rp.orden,
                'distancia_metros': rp.distancia_metros
            })
        
        recorridos_data.append({
            'id': recorrido.id,
            'sentido': recorrido.sentido,
            'color_linea': recorrido.color_linea,
            'grosor_linea': recorrido.grosor_linea,
            'coordenadas': recorrido.coordenadas,
            'paraderos': paraderos_data
        })
    
    data = {
        'codigo': ruta.codigo,
        'nombre': ruta.nombre,
        'empresa': ruta.empresa.nombre,
        'recorridos': recorridos_data
    }
    
    return JsonResponse(data)

#Buscador rutas
@api_view(['POST'])
def buscar_rutas_view(request):
    punto_a = request.data.get('punto_a') 
    punto_b = request.data.get('punto_b')
    
    if not punto_a or not punto_b:
        return Response({'error': 'Faltan las coordenadas de punto_a o punto_b'}, status=400)

    # Radio de búsqueda ajustado a 500m (estándar razonable)
    RADIO_METROS = 500  
    
    # 1. Filtrar paraderos cercanos
    todos_paraderos = Paradero.objects.all()
    ids_paraderos_cerca_a = []
    ids_paraderos_cerca_b = []

    for paradero in todos_paraderos:
        coord_paradero = {'lat': paradero.latitud, 'lng': paradero.longitud}
        
        if calcular_distancia(punto_a, coord_paradero) <= RADIO_METROS:
            ids_paraderos_cerca_a.append(paradero.id)
            
        if calcular_distancia(punto_b, coord_paradero) <= RADIO_METROS:
            ids_paraderos_cerca_b.append(paradero.id)
            
    # 2. Buscar Recorridos
    recorridos_a = Recorrido.objects.filter(
        recorrido_paraderos__paradero_id__in=ids_paraderos_cerca_a
    ).distinct()
    
    recorridos_b = Recorrido.objects.filter(
        recorrido_paraderos__paradero_id__in=ids_paraderos_cerca_b
    ).distinct()
    
    # 3. Intersección
    recorridos_finales = recorridos_a & recorridos_b
    
    # 4. Respuesta JSON
    respuesta = []
    for rec in recorridos_finales:
        respuesta.append({
            'id': rec.id,
            'nombre_ruta': rec.ruta.nombre,      
            'empresa': rec.ruta.empresa.nombre,  
            'sentido': rec.sentido,              
            'color': rec.color_linea,
            'coordenadas': rec.coordenadas,      
        })
        
    return Response(respuesta)