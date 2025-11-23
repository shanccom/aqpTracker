from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero
#Algoritmo rutas
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import analizar_cercania_ruta, calcular_distancia

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

    try:
        RADIO_METROS = 1000
        
        todos_recorridos = Recorrido.objects.select_related('ruta', 'ruta__empresa').all()
        
        rutas_directas = []

        for rec in todos_recorridos:
            coordenadas_ruta = rec.coordenadas
            
            if not coordenadas_ruta:
                continue

            datos_inicio = analizar_cercania_ruta(punto_a, coordenadas_ruta)
            
            if datos_inicio['distancia'] > RADIO_METROS:
                continue
                
            datos_fin = analizar_cercania_ruta(punto_b, coordenadas_ruta)
            
            if datos_fin['distancia'] > RADIO_METROS:
                continue
                
            idx_inicio = datos_inicio['indice']
            idx_fin = datos_fin['indice']
            
            inicio_real = min(idx_inicio, idx_fin)
            fin_real = max(idx_inicio, idx_fin)
            
            coords_finales = coordenadas_ruta[inicio_real : fin_real + 1]

            rutas_directas.append({
                'id': rec.id,
                'nombre_ruta': rec.ruta.nombre,      
                'empresa': rec.ruta.empresa.nombre,  
                'sentido': rec.sentido,              
                'color': rec.color_linea,
                'coordenadas': coords_finales,
                'distancia_a_origen': int(datos_inicio['distancia']),
                'distancia_a_destino': int(datos_fin['distancia'])
            })

        # Asegurar que devolvemos el formato correcto
        response_data = {
            'rutas_directas': rutas_directas,
            'rutas_combinadas': []  # Siempre incluirlo vacío
        }
        
        print(f"Devolviendo {len(rutas_directas)} rutas directas")
        return Response(response_data)

    except Exception as e:
        print(f"Error en buscar_rutas_view: {str(e)}")
        return Response({'error': 'Error interno del servidor'}, status=500)

@api_view(['POST'])
def buscar_rutas_combinadas_view(request):
    punto_a = request.data.get('punto_a') 
    punto_b = request.data.get('punto_b')
    
    if not punto_a or not punto_b:
        return Response({'error': 'Faltan coordenadas'}, status=400)

    try:
        RADIO_METROS = 1000
        RADIO_TRANSBORDO = 100  # REDUCIDO: 100m máximo para transbordo (no caminar)
        
        todos_recorridos = Recorrido.objects.select_related('ruta', 'ruta__empresa').all()[:50]
        
        rutas_combinadas = []

        # Encontrar rutas cerca del punto A
        rutas_desde_a = []
        for rec in todos_recorridos:
            if not rec.coordenadas or len(rec.coordenadas) < 10:
                continue
                
            datos_inicio = analizar_cercania_ruta(punto_a, rec.coordenadas)
            if datos_inicio['distancia'] <= RADIO_METROS:
                rutas_desde_a.append({
                    'recorrido': rec,
                    'punto_inicio': datos_inicio,
                    'indice_inicio': datos_inicio['indice']
                })

        # Encontrar rutas cerca del punto B
        rutas_hasta_b = []
        for rec in todos_recorridos:
            if not rec.coordenadas or len(rec.coordenadas) < 10:
                continue
                
            datos_fin = analizar_cercania_ruta(punto_b, rec.coordenadas)
            if datos_fin['distancia'] <= RADIO_METROS:
                rutas_hasta_b.append({
                    'recorrido': rec,
                    'punto_fin': datos_fin,
                    'indice_fin': datos_fin['indice']
                })

        print(f"Rutas desde A: {len(rutas_desde_a)}, Rutas hasta B: {len(rutas_hasta_b)}")

        # Buscar combinaciones con mejoras
        combinaciones_encontradas = 0
        max_combinaciones = 15
        
        for ruta_a in rutas_desde_a[:8]:  # Limitar búsqueda
            for ruta_b in rutas_hasta_b[:8]:
                if combinaciones_encontradas >= max_combinaciones:
                    break
                    
                # 1. EVITAR MISMA RUTA (ya es ruta directa)
                if ruta_a['recorrido'].id == ruta_b['recorrido'].id:
                    continue
                
                # 2. VERIFICAR DIRECCIÓN GEOGRÁFICA
                if not tiene_direccion_correcta(ruta_a, ruta_b, punto_a, punto_b):
                    continue
                
                # 3. BUSCAR PUNTOS DE TRANSBORDO CERCANOS (100m máximo)
                puntos_transbordo = encontrar_transbordos_direccionales(
                    ruta_a['recorrido'].coordenadas,
                    ruta_b['recorrido'].coordenadas,
                    RADIO_TRANSBORDO,
                    ruta_a['indice_inicio'],
                    ruta_b['indice_fin']
                )
                
                for transbordo in puntos_transbordo[:1]:  # Solo el mejor transbordo por combinación
                    if combinaciones_encontradas >= max_combinaciones:
                        break
                        
                    # Validar segmentos
                    segmento_a = ruta_a['recorrido'].coordenadas[ruta_a['indice_inicio']:transbordo['indice_ruta_a'] + 1]
                    segmento_b = ruta_b['recorrido'].coordenadas[transbordo['indice_ruta_b']:ruta_b['indice_fin'] + 1]
                    
                    if len(segmento_a) < 2 or len(segmento_b) < 2:
                        continue
                        
                    # Validar que los segmentos tengan sentido (no sean muy cortos)
                    dist_segmento_a = calcular_distancia_total(segmento_a)
                    dist_segmento_b = calcular_distancia_total(segmento_b)
                    
                    if dist_segmento_a < 500 or dist_segmento_b < 500:  # Mínimo 500m por segmento
                        continue
                    
                    distancia_total = dist_segmento_a + dist_segmento_b
                    tiempo_estimado = (distancia_total / 4) / 60 + 3  # 3 min para transbordo corto
                    
                    rutas_combinadas.append({
                        'id': f"{ruta_a['recorrido'].id}-{ruta_b['recorrido'].id}-{transbordo['indice_ruta_a']}",
                        'rutas': [
                            {
                                'ruta': {
                                    'id': ruta_a['recorrido'].id,
                                    'nombre_ruta': ruta_a['recorrido'].ruta.nombre,
                                    'empresa': ruta_a['recorrido'].ruta.empresa.nombre,
                                    'sentido': ruta_a['recorrido'].sentido,
                                    'color': ruta_a['recorrido'].color_linea,
                                    'distancia_a_origen': int(ruta_a['punto_inicio']['distancia']),
                                    'distancia_a_destino': int(transbordo['distancia'])
                                },
                                'segmento_coordenadas': segmento_a,
                                'distancia': int(dist_segmento_a)
                            },
                            {
                                'ruta': {
                                    'id': ruta_b['recorrido'].id,
                                    'nombre_ruta': ruta_b['recorrido'].ruta.nombre,
                                    'empresa': ruta_b['recorrido'].ruta.empresa.nombre,
                                    'sentido': ruta_b['recorrido'].sentido,
                                    'color': ruta_b['recorrido'].color_linea,
                                    'distancia_a_origen': int(transbordo['distancia']),
                                    'distancia_a_destino': int(ruta_b['punto_fin']['distancia'])
                                },
                                'segmento_coordenadas': segmento_b,
                                'distancia': int(dist_segmento_b)
                            }
                        ],
                        'distancia_total': int(distancia_total),
                        'tiempo_estimado_minutos': int(tiempo_estimado),
                        'punto_transbordo': {
                            'lat': transbordo['coord'][0],
                            'lng': transbordo['coord'][1]
                        },
                        'distancia_transbordo': int(transbordo['distancia'])
                    })
                    combinaciones_encontradas += 1
                    print(f"Combinación encontrada: {ruta_a['recorrido'].ruta.nombre} -> {ruta_b['recorrido'].ruta.nombre}")

        # Ordenar por distancia total
        rutas_combinadas.sort(key=lambda x: x['distancia_total'])
        
        print(f"Encontradas {len(rutas_combinadas)} rutas combinadas válidas")
        return Response(rutas_combinadas[:10])

    except Exception as e:
        print(f"Error en buscar_rutas_combinadas_view: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': 'Error interno del servidor'}, status=500)

def tiene_direccion_correcta(ruta_a, ruta_b, punto_a, punto_b):
    """
    Verifica que las rutas tengan dirección correcta:
    - Ruta A debe ir desde punto_a hacia alguna dirección
    - Ruta B debe ir hacia punto_b desde alguna dirección
    - El transbordo debe estar lógicamente entre medio
    """
    try:
        coords_a = ruta_a['recorrido'].coordenadas
        coords_b = ruta_b['recorrido'].coordenadas
        
        if len(coords_a) < 2 or len(coords_b) < 2:
            return False
        
        # Para Ruta A: el punto A debe estar antes en la ruta que la mayoría de las coordenadas
        idx_a = ruta_a['indice_inicio']
        porcentaje_posicion_a = idx_a / len(coords_a)
        
        # Para Ruta B: el punto B debe estar después en la ruta que la mayoría de las coordenadas  
        idx_b = ruta_b['indice_fin']
        porcentaje_posicion_b = idx_b / len(coords_b)
        
        # Ruta A debe tener punto A en el primer 70% del recorrido
        # Ruta B debe tener punto B en el último 70% del recorrido
        if porcentaje_posicion_a > 0.7 or porcentaje_posicion_b < 0.3:
            return False
        
        # Verificar dirección general usando vectores aproximados
        inicio_a = coords_a[max(0, idx_a - 5)]  # Punto antes de A
        fin_a = coords_a[min(len(coords_a) - 1, idx_a + 5)]  # Punto después de A
        
        inicio_b = coords_b[max(0, idx_b - 5)]  # Punto antes de B
        fin_b = coords_b[min(len(coords_b) - 1, idx_b + 5)]  # Punto después de B
        
        # Calcular direcciones aproximadas
        dir_a_lat = fin_a[0] - inicio_a[0]
        dir_a_lng = fin_a[1] - inicio_a[1]
        
        dir_b_lat = fin_b[0] - inicio_b[0] 
        dir_b_lng = fin_b[1] - inicio_b[1]
        
        # La dirección general debe ser coherente (no opuesta)
        producto_punto = (dir_a_lat * dir_b_lat) + (dir_a_lng * dir_b_lng)
        
        # Si el producto punto es negativo, las direcciones son opuestas
        if producto_punto < -0.1:  # Margen para errores
            return False
            
        return True
        
    except Exception as e:
        print(f"Error en dirección: {e}")
        return True  # En caso de error, permitir la combinación

def encontrar_transbordos_direccionales(coordenadas_a, coordenadas_b, radio_maximo, indice_inicio_a, indice_fin_b):
    """
    Encuentra puntos de transbordo que respeten la dirección del viaje
    """
    puntos = []
    
    # Solo buscar transbordos después del inicio en A y antes del fin en B
    inicio_busqueda_a = indice_inicio_a
    fin_busqueda_a = min(len(coordenadas_a) - 1, indice_inicio_a + 100)  # Máximo 100 puntos después de A
    
    inicio_busqueda_b = max(0, indice_fin_b - 100)  # Máximo 100 puntos antes de B
    fin_busqueda_b = indice_fin_b
    
    # Muestreo más inteligente
    paso_a = max(1, (fin_busqueda_a - inicio_busqueda_a) // 15)
    paso_b = max(1, (fin_busqueda_b - inicio_busqueda_b) // 15)
    
    for i in range(inicio_busqueda_a, fin_busqueda_a, paso_a):
        if i >= len(coordenadas_a):
            break
            
        coord_a = coordenadas_a[i]
        punto_a = {'lat': coord_a[0], 'lng': coord_a[1]}
        
        # Buscar en ruta B puntos que estén "en el camino"
        for j in range(inicio_busqueda_b, fin_busqueda_b, paso_b):
            if j >= len(coordenadas_b):
                break
                
            coord_b = coordenadas_b[j]
            punto_b = {'lat': coord_b[0], 'lng': coord_b[1]}
            
            distancia = calcular_distancia(punto_a, punto_b)
            
            if distancia <= radio_maximo:
                puntos.append({
                    'indice_ruta_a': i,
                    'indice_ruta_b': j,
                    'coord': coord_a,
                    'distancia': distancia
                })
                break  # Un buen transbordo por punto A es suficiente
    
    # Ordenar por distancia (los más cercanos primero)
    puntos.sort(key=lambda x: x['distancia'])
    return puntos

def calcular_distancia_total(coordenadas):
    """Calcula distancia total optimizada"""
    if len(coordenadas) < 2:
        return 0
        
    distancia_total = 0
    paso = max(1, len(coordenadas) // 10)
    
    for i in range(0, len(coordenadas) - paso, paso):
        punto1 = {'lat': coordenadas[i][0], 'lng': coordenadas[i][1]}
        punto2 = {'lat': coordenadas[i + paso][0], 'lng': coordenadas[i + paso][1]}
        distancia_total += calcular_distancia(punto1, punto2)
    
    return distancia_total

def encontrar_puntos_transbordo_optimizado(coordenadas_a, coordenadas_b, radio_maximo, indice_inicio_a, indice_fin_b):
    """Versión optimizada para encontrar puntos de transbordo"""
    puntos = []
    
    # Muestrear coordenadas (no verificar cada punto)
    paso_a = max(1, len(coordenadas_a) // 20)  # Revisar ~20 puntos de la ruta A
    paso_b = max(1, len(coordenadas_b) // 20)  # Revisar ~20 puntos de la ruta B
    
    for i in range(indice_inicio_a, len(coordenadas_a), paso_a):
        if i >= len(coordenadas_a):
            break
            
        coord_a = coordenadas_a[i]
        punto_a = {'lat': coord_a[0], 'lng': coord_a[1]}
        
        for j in range(0, min(indice_fin_b + 1, len(coordenadas_b)), paso_b):
            if j >= len(coordenadas_b):
                break
                
            coord_b = coordenadas_b[j]
            punto_b = {'lat': coord_b[0], 'lng': coord_b[1]}
            
            distancia = calcular_distancia(punto_a, punto_b)
            
            if distancia <= radio_maximo:
                puntos.append({
                    'indice_ruta_a': i,
                    'indice_ruta_b': j,
                    'coord': coord_a,
                    'distancia': distancia
                })
                break  # Un transbordo por punto A es suficiente
    
    return puntos

def calcular_distancia_total(coordenadas):
    """Calcula la distancia total de una lista de coordenadas (optimizado)"""
    if len(coordenadas) < 2:
        return 0
        
    distancia_total = 0
    # Muestrear cada 10 puntos para hacerlo más rápido
    paso = max(1, len(coordenadas) // 10)
    
    for i in range(0, len(coordenadas) - paso, paso):
        punto1 = {'lat': coordenadas[i][0], 'lng': coordenadas[i][1]}
        punto2 = {'lat': coordenadas[i + paso][0], 'lng': coordenadas[i + paso][1]}
        distancia_total += calcular_distancia(punto1, punto2)
    
    return distancia_total