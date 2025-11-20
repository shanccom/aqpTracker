from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero
#Algoritmo rutas
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import analizar_cercania_ruta

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
        return Response({'error': 'Faltan coordenadas'}, status=400)

    # Solo por pruebas en pocas rutas
    RADIO_METROS = 1000
    
    # 1. TODOS los recorridos (IDA y VUELTA)
    # OJO: miles de rutas, sería lento. 
    # Para < 100 rutas, es rápido.
    todos_recorridos = Recorrido.objects.select_related('ruta', 'ruta__empresa').all()
    
    respuesta = []

    for rec in todos_recorridos:
        coordenadas_ruta = rec.coordenadas # La lista gigante de [lat, lng]
        
        if not coordenadas_ruta:
            continue

        # 2. ¿El Punto A está cerca de ALGÚN punto de esta línea?
        datos_inicio = analizar_cercania_ruta(punto_a, coordenadas_ruta)
        
        if datos_inicio['distancia'] > RADIO_METROS:
            continue # Si A no está cerca, descartamos la ruta y pasamos a la siguiente
            
        # 3. ¿El Punto B está cerca de ALGÚN punto de esta línea?
        datos_fin = analizar_cercania_ruta(punto_b, coordenadas_ruta)
        
        if datos_fin['distancia'] > RADIO_METROS:
            continue # Si B no está cerca, descartamos
            
        # 4. La ruta pasa cerca de A y cerca de B.
        # Se corta la línea usando los índices que ya encontramos.
        
        idx_inicio = datos_inicio['indice']
        idx_fin = datos_fin['indice']
        
        # Cortamos (Slice)
        inicio_real = min(idx_inicio, idx_fin)
        fin_real = max(idx_inicio, idx_fin)
        
        coords_finales = coordenadas_ruta[inicio_real : fin_real + 1]

        respuesta.append({
            'id': rec.id,
            'nombre_ruta': rec.ruta.nombre,      
            'empresa': rec.ruta.empresa.nombre,  
            'sentido': rec.sentido,              
            'color': rec.color_linea,
            'coordenadas': coords_finales, # Segmento exacto "esquina baja"
            'distancia_a_origen': int(datos_inicio['distancia']), # Dato curioso
            'distancia_a_destino': int(datos_fin['distancia'])
        })
        
    return Response(respuesta)