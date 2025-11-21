from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero
# Algoritmo rutas
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import buscar_rutas_con_transbordo, calcular_distancia, calcular_distancia_ruta_segmento, encontrar_paraderos_cercanos_con_distancia, estimar_tiempo_entre_coordenadas, extraer_segmento_ruta, obtener_tiempo_recorrido_entre_paradas

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

# Buscador rutas
@api_view(['POST'])
def buscar_rutas_view(request):
    punto_a = request.data.get('punto_a') 
    punto_b = request.data.get('punto_b')
    
    print("=" * 50)
    print("🚀 INICIANDO BÚSQUEDA COMPLETA DE RUTAS")
    print("=" * 50)
    print(f"📍 Punto A: {punto_a}")
    print(f"🎯 Punto B: {punto_b}")
    
    if not punto_a or not punto_b:
        return Response({'error': 'Faltan las coordenadas de punto_a o punto_b'}, status=400)

    try:
        RADIO_METROS = 2000
        respuesta = []
        
        # FASE 1: Buscar rutas directas
        print("1️⃣  BUSCANDO RUTAS DIRECTAS...")
        rutas_directas = buscar_rutas_directas(punto_a, punto_b, RADIO_METROS)
        respuesta.extend(rutas_directas)
        
        print(f"   ✅ Rutas directas encontradas: {len(rutas_directas)}")
        
        # FASE 2: Buscar rutas con transbordo (si hay pocas rutas directas)
        if len(respuesta) < 3:  
            print("2️⃣  BUSCANDO RUTAS CON TRANSBORDO...")
            rutas_combinadas = buscar_rutas_con_transbordo(punto_a, punto_b, RADIO_METROS)
            respuesta.extend([r for r in rutas_combinadas if r is not None])
            print(f"   ✅ Rutas con transbordo encontradas: {len(rutas_combinadas)}")
        
        # Ordenar por tiempo total más corto
        respuesta.sort(key=lambda x: x['tiempo_estimado']['total_minutos'])
        
        # Limitar a 10 resultados máximo
        respuesta = respuesta[:10]
        
        print(f"🎯 TOTAL RUTAS ENCONTRADAS: {len(respuesta)}")
        print("=" * 50)
        
        return Response(respuesta)
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        error_traceback = traceback.format_exc()
        print(error_traceback)
        
        return Response({
            'error': 'Error interno del servidor',
            'detalles': str(e)
        }, status=500)
def buscar_rutas_directas(punto_a, punto_b, radio_metros):
    """Busca rutas que pasen directamente por ambos puntos"""
    from .models import Recorrido, RecorridoParadero
    
    rutas_directas = []
    
    paraderos_cerca_a = encontrar_paraderos_cercanos_con_distancia(punto_a, radio_metros)
    paraderos_cerca_b = encontrar_paraderos_cercanos_con_distancia(punto_b, radio_metros)
    
    if not paraderos_cerca_a or not paraderos_cerca_b:
        return rutas_directas
    
    ids_paraderos_cerca_a = [p['paradero'].id for p in paraderos_cerca_a]
    ids_paraderos_cerca_b = [p['paradero'].id for p in paraderos_cerca_b]
    
    recorridos_a = Recorrido.objects.filter(
        recorrido_paraderos__paradero_id__in=ids_paraderos_cerca_a
    ).distinct()
    
    recorridos_b = Recorrido.objects.filter(
        recorrido_paraderos__paradero_id__in=ids_paraderos_cerca_b
    ).distinct()
    
    recorridos_finales = recorridos_a & recorridos_b
    
    for rec in recorridos_finales:
        ruta_info = construir_info_ruta_directa(rec, paraderos_cerca_a, paraderos_cerca_b, punto_a, punto_b)
        if ruta_info:
            rutas_directas.append(ruta_info)
    
    return rutas_directas

def construir_info_ruta_directa(recorrido, paraderos_cerca_a, paraderos_cerca_b, punto_a, punto_b):
    """Construye información para rutas directas CON SEGMENTOS RELEVANTES"""
    try:
        # Encontrar los paraderos específicos usados en esta ruta
        paradero_a_cercano = next((p for p in paraderos_cerca_a 
                                if p['paradero'].id in [rp.paradero_id for rp in 
                                   RecorridoParadero.objects.filter(recorrido=recorrido)]), None)
        paradero_b_cercano = next((p for p in paraderos_cerca_b 
                                if p['paradero'].id in [rp.paradero_id for rp in 
                                   RecorridoParadero.objects.filter(recorrido=recorrido)]), None)
        
        if not paradero_a_cercano or not paradero_b_cercano:
            return None
        
        # EXTRAER SOLO EL SEGMENTO RELEVANTE
        coordenadas_segmento = extraer_segmento_ruta(
            recorrido, 
            paradero_a_cercano['paradero'], 
            paradero_b_cercano['paradero']
        )
        
        # Si no se puede extraer segmento específico, usar todo el recorrido
        if not coordenadas_segmento:
            coordenadas_segmento = recorrido.coordenadas
        
        # Calcular distancia REAL del segmento
        distancia_segmento = calcular_distancia_ruta_segmento(
            recorrido,
            paradero_a_cercano['paradero'],
            paradero_b_cercano['paradero']
        )
        
        # Calcular tiempo estimado de viaje
        tiempo_viaje = obtener_tiempo_recorrido_entre_paradas(
            recorrido, paradero_a_cercano['paradero'], paradero_b_cercano['paradero']
        )
        
        # Si no se puede calcular tiempo específico, estimar basado en distancia real
        if not tiempo_viaje:
            # Usar distancia real del segmento para estimación más precisa
            velocidad_promedio = 20  # km/h
            tiempo_viaje = (distancia_segmento / 1000) / velocidad_promedio * 60
        
        # Tiempo total incluyendo caminata
        tiempo_caminata_a = paradero_a_cercano['tiempo_caminando_minutos']
        tiempo_caminata_b = paradero_b_cercano['tiempo_caminando_minutos']
        tiempo_total = tiempo_viaje + tiempo_caminata_a + tiempo_caminata_b
        
        ruta_info = {
            'id': recorrido.id,
            'nombre_ruta': recorrido.ruta.nombre,      
            'empresa': recorrido.ruta.empresa.nombre,  
            'sentido': recorrido.sentido,              
            'color': recorrido.color_linea,
            'coordenadas': coordenadas_segmento,  # ← SOLO SEGMENTO RELEVANTE
            'tiempo_estimado': {
                'total_minutos': round(tiempo_total, 1),
                'en_bus_minutos': round(tiempo_viaje, 1),
                'caminata_minutos': round(tiempo_caminata_a + tiempo_caminata_b, 1),
                'caminata_desde_origen': round(tiempo_caminata_a, 1),
                'caminata_hasta_destino': round(tiempo_caminata_b, 1),
                'tiempo_transbordo': 0
            },
            'distancias': {
                'total_metros': round(distancia_segmento),
                'en_bus_metros': round(distancia_segmento),
                'caminata_metros': round(
                    paradero_a_cercano['distancia_metros'] + 
                    paradero_b_cercano['distancia_metros']
                ),
                'caminata_desde_origen': round(paradero_a_cercano['distancia_metros']),
                'caminata_hasta_destino': round(paradero_b_cercano['distancia_metros'])
            },
            'paraderos': {
                'origen': {
                    'nombre': paradero_a_cercano['paradero'].nombre,
                    'distancia_metros': round(paradero_a_cercano['distancia_metros']),
                    'orden_en_ruta': RecorridoParadero.objects.get(
                        recorrido=recorrido, paradero=paradero_a_cercano['paradero']
                    ).orden,
                    'ruta': recorrido.ruta.nombre
                },
                'destino': {
                    'nombre': paradero_b_cercano['paradero'].nombre,
                    'distancia_metros': round(paradero_b_cercano['distancia_metros']),
                    'orden_en_ruta': RecorridoParadero.objects.get(
                        recorrido=recorrido, paradero=paradero_b_cercano['paradero']
                    ).orden,
                    'ruta': recorrido.ruta.nombre
                }
            },
            'segmentos': [
                {
                    'ruta_id': recorrido.id,
                    'ruta_nombre': recorrido.ruta.nombre,
                    'empresa': recorrido.ruta.empresa.nombre,
                    'color': recorrido.color_linea,
                    'desde': paradero_a_cercano['paradero'].nombre,
                    'hasta': paradero_b_cercano['paradero'].nombre,
                    'tiempo_minutos': round(tiempo_viaje, 1),
                    'distancia_metros': round(distancia_segmento),
                    'tipo': 'bus',
                    'orden_inicio': RecorridoParadero.objects.get(
                        recorrido=recorrido, paradero=paradero_a_cercano['paradero']
                    ).orden,
                    'orden_fin': RecorridoParadero.objects.get(
                        recorrido=recorrido, paradero=paradero_b_cercano['paradero']
                    ).orden
                }
            ],
            'tipo': 'directa',
            'transbordos': 0
        }
        return ruta_info
        
    except Exception as e:
        print(f"Error construyendo ruta directa: {e}")
        return None

@api_view(['GET'])
def debug_test(request):
    """Endpoint simple para debug de URLs"""
    return Response({
        'status': 'ok',
        'message': '¡El endpoint de debug funciona!',
        'available_endpoints': [
            'GET /api/rutas/debug/',
            'GET /api/rutas/empresas/',
            'POST /api/rutas/buscar/'
        ]
    })