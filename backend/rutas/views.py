from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero
# Algoritmo rutas
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import calcular_distancia, encontrar_paraderos_cercanos_con_distancia, estimar_tiempo_entre_coordenadas, obtener_tiempo_recorrido_entre_paradas

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
    print("🚀 INICIANDO BÚSQUEDA DE RUTAS")
    print("=" * 50)
    
    if not punto_a or not punto_b:
        return Response({'error': 'Faltan las coordenadas de punto_a o punto_b'}, status=400)

    try:
        # 1. Encontrar paraderos cercanos
        RADIO_METROS = 2000  
        
        print("🔍 Buscando paraderos cercanos...")
        paraderos_cerca_a = encontrar_paraderos_cercanos_con_distancia(punto_a, RADIO_METROS)
        paraderos_cerca_b = encontrar_paraderos_cercanos_con_distancia(punto_b, RADIO_METROS)
        
        print(f"📊 Paraderos cerca A: {len(paraderos_cerca_a)}")
        print(f"📊 Paraderos cerca B: {len(paraderos_cerca_b)}")
        
        if not paraderos_cerca_a or not paraderos_cerca_b:
            return Response({
                'error': 'No se encontraron paraderos cercanos a uno o ambos puntos',
                'detalles': {
                    'paraderos_cerca_a': len(paraderos_cerca_a),
                    'paraderos_cerca_b': len(paraderos_cerca_b)
                }
            }, status=404)
            
        ids_paraderos_cerca_a = [p['paradero'].id for p in paraderos_cerca_a]
        ids_paraderos_cerca_b = [p['paradero'].id for p in paraderos_cerca_b]
            
        # 2. Buscar Recorridos
        print("🔄 Buscando recorridos...")
        recorridos_a = Recorrido.objects.filter(
            recorrido_paraderos__paradero_id__in=ids_paraderos_cerca_a
        ).distinct()
        
        recorridos_b = Recorrido.objects.filter(
            recorrido_paraderos__paradero_id__in=ids_paraderos_cerca_b
        ).distinct()
        
        print(f"📊 Recorridos A: {recorridos_a.count()}")
        print(f"📊 Recorridos B: {recorridos_b.count()}")
        
        # 3. Intersección
        recorridos_finales = recorridos_a & recorridos_b
        print(f"🎯 Recorridos finales: {recorridos_finales.count()}")
        
        # 4. Calcular información detallada para cada ruta
        respuesta = []
        for rec in recorridos_finales:
            print(f"   ➕ Procesando: {rec.ruta.nombre} ({rec.sentido})")
            
            # Encontrar los paraderos específicos usados en esta ruta
            paradero_a_cercano = next((p for p in paraderos_cerca_a 
                                    if p['paradero'].id in [rp.paradero_id for rp in 
                                       RecorridoParadero.objects.filter(recorrido=rec)]), None)
            paradero_b_cercano = next((p for p in paraderos_cerca_b 
                                    if p['paradero'].id in [rp.paradero_id for rp in 
                                       RecorridoParadero.objects.filter(recorrido=rec)]), None)
            
            if not paradero_a_cercano or not paradero_b_cercano:
                continue
                
            # Calcular tiempo estimado de viaje
            tiempo_viaje = obtener_tiempo_recorrido_entre_paradas(
                rec, paradero_a_cercano['paradero'], paradero_b_cercano['paradero']
            )
            
            # Si no se puede calcular tiempo específico, estimar basado en coordenadas
            if not tiempo_viaje:
                coord_a = {
                    'lat': paradero_a_cercano['paradero'].latitud,
                    'lng': paradero_a_cercano['paradero'].longitud
                }
                coord_b = {
                    'lat': paradero_b_cercano['paradero'].latitud,
                    'lng': paradero_b_cercano['paradero'].longitud
                }
                tiempo_viaje = estimar_tiempo_entre_coordenadas(coord_a, coord_b)
            
            # Tiempo total incluyendo caminata
            tiempo_caminata_a = paradero_a_cercano['tiempo_caminando_minutos']
            tiempo_caminata_b = paradero_b_cercano['tiempo_caminando_minutos']
            tiempo_total = tiempo_viaje + tiempo_caminata_a + tiempo_caminata_b
            
            ruta_info = {
                'id': rec.id,
                'nombre_ruta': rec.ruta.nombre,      
                'empresa': rec.ruta.empresa.nombre,  
                'sentido': rec.sentido,              
                'color': rec.color_linea,
                'coordenadas': rec.coordenadas,
                # NUEVOS CAMPOS CON TIEMPOS ESTIMADOS
                'tiempo_estimado': {
                    'total_minutos': round(tiempo_total, 1),
                    'en_bus_minutos': round(tiempo_viaje, 1),
                    'caminata_minutos': round(tiempo_caminata_a + tiempo_caminata_b, 1),
                    'caminata_desde_origen': round(tiempo_caminata_a, 1),
                    'caminata_hasta_destino': round(tiempo_caminata_b, 1)
                },
                'paraderos': {
                    'origen': {
                        'nombre': paradero_a_cercano['paradero'].nombre,
                        'distancia_metros': round(paradero_a_cercano['distancia_metros']),
                        'orden_en_ruta': RecorridoParadero.objects.get(
                            recorrido=rec, paradero=paradero_a_cercano['paradero']
                        ).orden
                    },
                    'destino': {
                        'nombre': paradero_b_cercano['paradero'].nombre,
                        'distancia_metros': round(paradero_b_cercano['distancia_metros']),
                        'orden_en_ruta': RecorridoParadero.objects.get(
                            recorrido=rec, paradero=paradero_b_cercano['paradero']
                        ).orden
                    }
                },
                'distancia_total_metros': calcular_distancia(
                    {'lat': rec.coordenadas[0][0], 'lng': rec.coordenadas[0][1]},
                    {'lat': rec.coordenadas[-1][0], 'lng': rec.coordenadas[-1][1]}
                ) if rec.coordenadas else 0
            }
            respuesta.append(ruta_info)
        
        # Ordenar por tiempo total más corto
        respuesta.sort(key=lambda x: x['tiempo_estimado']['total_minutos'])
        
        print(f"✅ Respuesta enviada: {len(respuesta)} rutas")
        print("=" * 50)
        
        return Response(respuesta)
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        import traceback
        error_traceback = traceback.format_exc()
        print(error_traceback)
        
        return Response({
            'error': 'Error interno del servidor',
            'detalles': str(e),
            'traceback': error_traceback
        }, status=500)

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