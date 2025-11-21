import math

from .models import RecorridoParadero
def calcular_distancia(coord1, coord2):
    """
    Calcula distancia en metros entre dos coordenadas usando Haversine
    """
    try:
        # Radio de la Tierra en metros
        R = 6371000
        
        lat1 = math.radians(coord1['lat'])
        lon1 = math.radians(coord1['lng'])
        lat2 = math.radians(coord2['lat'])
        lon2 = math.radians(coord2['lng'])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2) * math.sin(dlat/2) + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2) * math.sin(dlon/2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        distancia = R * c
        return distancia
        
    except Exception as e:
        print(f"Error calculando distancia: {e}")
        return float('inf')

def encontrar_paraderos_cercanos_con_distancia(punto, radio_metros=500, max_radio=5000):
    """
    Encuentra paraderos cercanos con la distancia exacta
    Con radio adaptable si no encuentra paraderos
    """
    from .models import Paradero
    
    todos_paraderos = Paradero.objects.all()
    paraderos_cercanos = []
    
    print(f"   🔍 Buscando en radio: {radio_metros}m")
    
    for paradero in todos_paraderos:
        coord_paradero = {'lat': paradero.latitud, 'lng': paradero.longitud}
        distancia = calcular_distancia(punto, coord_paradero)
        
        if distancia <= radio_metros:
            paraderos_cercanos.append({
                'paradero': paradero,
                'distancia_metros': distancia,
                'tiempo_caminando_minutos': round((distancia / 1000) / (5 / 60), 1)
            })
    
    # Si no encuentra paraderos y podemos aumentar el radio
    if not paraderos_cercanos and radio_metros < max_radio:
        nuevo_radio = min(radio_metros * 2, max_radio)
        print(f"   ⚡ Aumentando radio ")
        return encontrar_paraderos_cercanos_con_distancia(punto, nuevo_radio, max_radio)
    
    # Ordenar por distancia más cercana
    paraderos_cercanos.sort(key=lambda x: x['distancia_metros'])
    return paraderos_cercanos

def estimar_tiempo_entre_coordenadas(coord1, coord2):
    """
    Estima tiempo en minutos entre dos coordenadas geográficas
    Considera velocidad promedio de bus en ciudad con paradas
    """
    distancia_km = calcular_distancia(coord1, coord2) / 1000  # Convertir a km
    
    # Velocidad promedio ajustada para transporte urbano
    if distancia_km < 0.5:  # Distancias muy cortas
        velocidad_promedio = 15  # km/h - más lento por paradas frecuentes
    else:
        velocidad_promedio = 20  # km/h - velocidad típica en ciudad
    
    tiempo_horas = distancia_km / velocidad_promedio
    tiempo_minutos = tiempo_horas * 60
    
    # Añadir tiempo fijo por paradero (aproximación)
    tiempo_paradas = math.ceil(distancia_km / 0.3) * 0.2  # ~1 paradero cada 300m, 12 segundos por paradero
    
    return max(1, round(tiempo_minutos + tiempo_paradas, 1))  # Mínimo 1 minuto

def obtener_tiempo_recorrido_entre_paradas(recorrido, paradero_inicio, paradero_fin):
    """
    Calcula tiempo estimado entre dos paraderos específicos en un recorrido
    """
    try:
        from .models import RecorridoParadero
        
        # Obtener los RecorridoParadero para este recorrido ordenados
        rp_paraderos = RecorridoParadero.objects.filter(
            recorrido=recorrido
        ).select_related('paradero').order_by('orden')
        
        paraderos_list = list(rp_paraderos)
        
        # Encontrar índices de los paraderos
        inicio_idx = -1
        fin_idx = -1
        
        for i, rp in enumerate(paraderos_list):
            if rp.paradero_id == paradero_inicio.id:
                inicio_idx = i
            if rp.paradero_id == paradero_fin.id:
                fin_idx = i
        
        if inicio_idx == -1 or fin_idx == -1 or inicio_idx >= fin_idx:
            return None
        
        # Calcular tiempo sumando segmentos entre paraderos
        tiempo_total = 0
        for i in range(inicio_idx, fin_idx):
            coord_actual = {
                'lat': paraderos_list[i].paradero.latitud,
                'lng': paraderos_list[i].paradero.longitud
            }
            coord_siguiente = {
                'lat': paraderos_list[i+1].paradero.latitud, 
                'lng': paraderos_list[i+1].paradero.longitud
            }
            
            tiempo_segmento = estimar_tiempo_entre_coordenadas(coord_actual, coord_siguiente)
            tiempo_total += tiempo_segmento
        
        return tiempo_total
        
    except Exception as e:
        print(f"Error calculando tiempo entre paradas: {e}")
        return None
    
def buscar_rutas_con_transbordo(punto_a, punto_b, radio_metros=2000):
    """
    Busca combinaciones de 2 rutas con un paradero de transbordo
    """
    from .models import Paradero, Recorrido, RecorridoParadero
    
    print("🔄 BUSCANDO RUTAS CON TRANSBORDO...")
    
    # 1. Encontrar paraderos cercanos
    paraderos_cerca_a = encontrar_paraderos_cercanos_con_distancia(punto_a, radio_metros)
    paraderos_cerca_b = encontrar_paraderos_cercanos_con_distancia(punto_b, radio_metros)
    
    rutas_combinadas = []
    combinaciones_vistas = set()  # Para evitar duplicados
    
    # 2. Para cada paradero cerca de A, buscar rutas
    for paradero_info_a in paraderos_cerca_a:
        paradero_a = paradero_info_a['paradero']
        
        # Rutas que pasan por el paradero A
        rutas_desde_a = Recorrido.objects.filter(
            recorrido_paraderos__paradero=paradero_a
        ).distinct()
        
        print(f"   📍 Desde {paradero_a.nombre}: {rutas_desde_a.count()} rutas")
        
        for ruta_a in rutas_desde_a:
            # Paraderos en esta ruta (posibles transbordos) - excluir el paradero de origen
            paraderos_ruta_a = RecorridoParadero.objects.filter(
                recorrido=ruta_a
            ).exclude(paradero=paradero_a).select_related('paradero').order_by('orden')
            
            # Buscar rutas desde cada paradero de transbordo hasta B
            for rp_transbordo in paraderos_ruta_a:
                paradero_transbordo = rp_transbordo.paradero
                
                # Rutas que pasan por el paradero de transbordo y van cerca de B
                rutas_desde_transbordo = Recorrido.objects.filter(
                    recorrido_paraderos__paradero=paradero_transbordo
                ).exclude(id=ruta_a.id).distinct()  # Excluir la misma ruta
                
                for ruta_b in rutas_desde_transbordo:
                    # Verificar que ruta_b pase cerca de B
                    paradero_info_b = None
                    for p_info in paraderos_cerca_b:
                        if RecorridoParadero.objects.filter(
                            recorrido=ruta_b,
                            paradero=p_info['paradero']
                        ).exists():
                            paradero_info_b = p_info
                            break
                    
                    if paradero_info_b:
                        # Crear ID único para esta combinación
                        combo_id = f"{ruta_a.id}_{ruta_b.id}_{paradero_transbordo.id}"
                        
                        if combo_id not in combinaciones_vistas:
                            combinaciones_vistas.add(combo_id)
                            
                            # ¡Encontramos una combinación!
                            combinacion = construir_combinacion_rutas(
                                punto_a, punto_b, 
                                ruta_a, ruta_b, 
                                paradero_info_a, paradero_transbordo, paradero_info_b
                            )
                            if combinacion:
                                rutas_combinadas.append(combinacion)
    
    print(f"   ✅ Encontradas {len(rutas_combinadas)} combinaciones")
    return rutas_combinadas

def construir_combinacion_rutas(punto_a, punto_b, ruta_a, ruta_b, paradero_info_a, paradero_transbordo, paradero_info_b):
    """
    Construye la información completa de una ruta combinada
    """
    try:
        # Calcular tiempos para cada segmento
        tiempo_a = obtener_tiempo_recorrido_entre_paradas(ruta_a, paradero_info_a['paradero'], paradero_transbordo)
        if not tiempo_a:
            # Estimación basada en coordenadas si no se puede calcular exacto
            coord_inicio = {'lat': paradero_info_a['paradero'].latitud, 'lng': paradero_info_a['paradero'].longitud}
            coord_transbordo = {'lat': paradero_transbordo.latitud, 'lng': paradero_transbordo.longitud}
            tiempo_a = estimar_tiempo_entre_coordenadas(coord_inicio, coord_transbordo)
        
        tiempo_b = obtener_tiempo_recorrido_entre_paradas(ruta_b, paradero_transbordo, paradero_info_b['paradero'])
        if not tiempo_b:
            # Estimación basada en coordenadas
            coord_transbordo = {'lat': paradero_transbordo.latitud, 'lng': paradero_transbordo.longitud}
            coord_destino = {'lat': paradero_info_b['paradero'].latitud, 'lng': paradero_info_b['paradero'].longitud}
            tiempo_b = estimar_tiempo_entre_coordenadas(coord_transbordo, coord_destino)
        
        # Tiempos fijos
        tiempo_transbordo = 5  # minutos estimados para cambiar de bus
        tiempo_caminata_a = paradero_info_a['tiempo_caminando_minutos']
        tiempo_caminata_b = paradero_info_b['tiempo_caminando_minutos']
        
        # Tiempo total
        tiempo_total = tiempo_a + tiempo_b + tiempo_transbordo + tiempo_caminata_a + tiempo_caminata_b
        
        # Combinar coordenadas (eliminar duplicados cercanos)
        coordenadas_combinadas = combinar_coordenadas_sin_duplicados(ruta_a.coordenadas, ruta_b.coordenadas)
        
        # Obtener órdenes en las rutas
        orden_origen = RecorridoParadero.objects.get(
            recorrido=ruta_a, paradero=paradero_info_a['paradero']
        ).orden
        
        orden_transbordo_a = RecorridoParadero.objects.get(
            recorrido=ruta_a, paradero=paradero_transbordo
        ).orden
        
        orden_transbordo_b = RecorridoParadero.objects.get(
            recorrido=ruta_b, paradero=paradero_transbordo
        ).orden
        
        orden_destino = RecorridoParadero.objects.get(
            recorrido=ruta_b, paradero=paradero_info_b['paradero']
        ).orden
        
        return {
            'id': f"combinada_{ruta_a.id}_{ruta_b.id}",
            'nombre_ruta': f"{ruta_a.ruta.nombre} → {ruta_b.ruta.nombre}",
            'empresa': f"{ruta_a.ruta.empresa.nombre} + {ruta_b.ruta.empresa.nombre}",
            'sentido': 'COMBINADA',
            'color': '#8B5CF6',  # Color púrpura para rutas combinadas
            'coordenadas': coordenadas_combinadas,
            'tiempo_estimado': {
                'total_minutos': round(tiempo_total, 1),
                'en_bus_minutos': round(tiempo_a + tiempo_b, 1),
                'caminata_minutos': round(tiempo_caminata_a + tiempo_caminata_b, 1),
                'caminata_desde_origen': round(tiempo_caminata_a, 1),
                'caminata_hasta_destino': round(tiempo_caminata_b, 1),
                'tiempo_transbordo': tiempo_transbordo
            },
            'paraderos': {
                'origen': {
                    'nombre': paradero_info_a['paradero'].nombre,
                    'distancia_metros': round(paradero_info_a['distancia_metros']),
                    'orden_en_ruta': orden_origen,
                    'ruta': ruta_a.ruta.nombre
                },
                'transbordo': {
                    'nombre': paradero_transbordo.nombre,
                    'ruta_origen': ruta_a.ruta.nombre,
                    'ruta_destino': ruta_b.ruta.nombre,
                    'orden_en_ruta_origen': orden_transbordo_a,
                    'orden_en_ruta_destino': orden_transbordo_b
                },
                'destino': {
                    'nombre': paradero_info_b['paradero'].nombre,
                    'distancia_metros': round(paradero_info_b['distancia_metros']),
                    'orden_en_ruta': orden_destino,
                    'ruta': ruta_b.ruta.nombre
                }
            },
            'segmentos': [
                {
                    'ruta_id': ruta_a.id,
                    'ruta_nombre': ruta_a.ruta.nombre,
                    'empresa': ruta_a.ruta.empresa.nombre,
                    'color': ruta_a.color_linea,
                    'desde': paradero_info_a['paradero'].nombre,
                    'hasta': paradero_transbordo.nombre,
                    'tiempo_minutos': round(tiempo_a, 1),
                    'tipo': 'bus',
                    'orden_inicio': orden_origen,
                    'orden_fin': orden_transbordo_a
                },
                {
                    'ruta_id': ruta_b.id,
                    'ruta_nombre': ruta_b.ruta.nombre,
                    'empresa': ruta_b.ruta.empresa.nombre,
                    'color': ruta_b.color_linea,
                    'desde': paradero_transbordo.nombre,
                    'hasta': paradero_info_b['paradero'].nombre,
                    'tiempo_minutos': round(tiempo_b, 1),
                    'tipo': 'bus',
                    'orden_inicio': orden_transbordo_b,
                    'orden_fin': orden_destino
                }
            ],
            'tipo': 'combinada',
            'transbordos': 1,
            'distancia_total_metros': calcular_distancia(punto_a, punto_b)
        }
        
    except Exception as e:
        print(f"❌ Error construyendo combinación: {e}")
        return None

def combinar_coordenadas_sin_duplicados(coords1, coords2, tolerancia=0.0001):
    """
    Combina dos listas de coordenadas eliminando puntos muy cercanos
    """
    if not coords1:
        return coords2
    if not coords2:
        return coords1
    
    todas_coords = coords1.copy()
    
    for coord in coords2:
        # Verificar si la coordenada ya existe (o está muy cerca)
        es_duplicado = False
        for existing_coord in todas_coords:
            if (abs(coord[0] - existing_coord[0]) < tolerancia and 
                abs(coord[1] - existing_coord[1]) < tolerancia):
                es_duplicado = True
                break
        
        if not es_duplicado:
            todas_coords.append(coord)
    
    return todas_coords

def extraer_segmento_ruta(recorrido, paradero_inicio, paradero_fin):
    """
    Extrae solo las coordenadas del segmento entre dos paraderos específicos
    """
    try:
        from .models import RecorridoParadero
        
        # Obtener los RecorridoParadero ordenados
        rp_paraderos = RecorridoParadero.objects.filter(
            recorrido=recorrido
        ).select_related('paradero').order_by('orden')
        
        paraderos_list = list(rp_paraderos)
        
        # Encontrar índices de los paraderos
        inicio_idx = -1
        fin_idx = -1
        
        for i, rp in enumerate(paraderos_list):
            if rp.paradero_id == paradero_inicio.id:
                inicio_idx = i
            if rp.paradero_id == paradero_fin.id:
                fin_idx = i
        
        if inicio_idx == -1 or fin_idx == -1 or inicio_idx >= fin_idx:
            return None
        
        # Extraer coordenadas del segmento específico
        coordenadas_segmento = []
        
        # Agregar coordenadas entre paraderos
        for i in range(inicio_idx, fin_idx + 1):
            # Para cada paradero en el segmento, agregar sus coordenadas
            # y las coordenadas intermedias del recorrido
            if i < len(paraderos_list) - 1:
                # Agregar coordenadas entre paradero actual y siguiente
                coord_actual = [paraderos_list[i].paradero.latitud, paraderos_list[i].paradero.longitud]
                coord_siguiente = [paraderos_list[i+1].paradero.latitud, paraderos_list[i+1].paradero.longitud]
                
                # Encontrar coordenadas del recorrido entre estos puntos
                segmento_coords = encontrar_coordenadas_entre_puntos(
                    recorrido.coordenadas, 
                    coord_actual, 
                    coord_siguiente
                )
                coordenadas_segmento.extend(segmento_coords)
        
        # Si no pudimos extraer coordenadas específicas, usar aproximación
        if not coordenadas_segmento:
            return aproximar_segmento_ruta(recorrido, paradero_inicio, paradero_fin)
        
        # Eliminar duplicados y retornar
        return eliminar_coordenadas_duplicadas(coordenadas_segmento)
        
    except Exception as e:
        print(f"Error extrayendo segmento: {e}")
        return aproximar_segmento_ruta(recorrido, paradero_inicio, paradero_fin)

def encontrar_coordenadas_entre_puntos(coordenadas_completas, punto_inicio, punto_fin, tolerancia=0.001):
    """
    Encuentra coordenadas entre dos puntos en una lista de coordenadas
    """
    try:
        inicio_idx = -1
        fin_idx = -1
        
        # Encontrar índices aproximados
        for i, coord in enumerate(coordenadas_completas):
            if (abs(coord[0] - punto_inicio[0]) < tolerancia and 
                abs(coord[1] - punto_inicio[1]) < tolerancia):
                inicio_idx = i
            if (abs(coord[0] - punto_fin[0]) < tolerancia and 
                abs(coord[1] - punto_fin[1]) < tolerancia):
                fin_idx = i
        
        if inicio_idx != -1 and fin_idx != -1 and inicio_idx < fin_idx:
            return coordenadas_completas[inicio_idx:fin_idx + 1]
        else:
            return []
            
    except Exception as e:
        print(f"Error encontrando coordenadas entre puntos: {e}")
        return []

def aproximar_segmento_ruta(recorrido, paradero_inicio, paradero_fin):
    """
    Aproxima el segmento entre dos paraderos cuando no se puede extraer exactamente
    """
    try:
        # Coordenadas de inicio y fin
        coord_inicio = [paradero_inicio.latitud, paradero_inicio.longitud]
        coord_fin = [paradero_fin.latitud, paradero_fin.longitud]
        
        # Encontrar puntos más cercanos en el recorrido
        inicio_idx = encontrar_indice_mas_cercano(recorrido.coordenadas, coord_inicio)
        fin_idx = encontrar_indice_mas_cercano(recorrido.coordenadas, coord_fin)
        
        if inicio_idx != -1 and fin_idx != -1:
            # Asegurar orden correcto
            if inicio_idx > fin_idx:
                inicio_idx, fin_idx = fin_idx, inicio_idx
            
            return recorrido.coordenadas[inicio_idx:fin_idx + 1]
        else:
            # Fallback: línea recta entre puntos
            return [coord_inicio, coord_fin]
            
    except Exception as e:
        print(f"Error aproximando segmento: {e}")
        return []

def encontrar_indice_mas_cercano(coordenadas, punto_referencia):
    """
    Encuentra el índice de la coordenada más cercana a un punto de referencia
    """
    from .utils import calcular_distancia
    
    min_distancia = float('inf')
    indice_mas_cercano = -1
    
    for i, coord in enumerate(coordenadas):
        distancia = calcular_distancia(
            {'lat': coord[0], 'lng': coord[1]},
            {'lat': punto_referencia[0], 'lng': punto_referencia[1]}
        )
        if distancia < min_distancia:
            min_distancia = distancia
            indice_mas_cercano = i
    
    return indice_mas_cercano

def eliminar_coordenadas_duplicadas(coordenadas, tolerancia=0.0001):
    """
    Elimina coordenadas duplicadas o muy cercanas
    """
    if not coordenadas:
        return []
    
    coordenadas_unicas = [coordenadas[0]]
    
    for coord in coordenadas[1:]:
        ultima_coord = coordenadas_unicas[-1]
        if (abs(coord[0] - ultima_coord[0]) > tolerancia or 
            abs(coord[1] - ultima_coord[1]) > tolerancia):
            coordenadas_unicas.append(coord)
    
    return coordenadas_unicas

def calcular_distancia_ruta_segmento(recorrido, paradero_inicio, paradero_fin):
    """
    Calcula la distancia real del segmento de ruta entre dos paraderos
    """
    try:
        segmento_coords = extraer_segmento_ruta(recorrido, paradero_inicio, paradero_fin)
        
        if not segmento_coords or len(segmento_coords) < 2:
            # Fallback: distancia en línea recta
            return calcular_distancia(
                {'lat': paradero_inicio.latitud, 'lng': paradero_inicio.longitud},
                {'lat': paradero_fin.latitud, 'lng': paradero_fin.longitud}
            )
        
        # Calcular distancia sumando segmentos
        distancia_total = 0
        for i in range(len(segmento_coords) - 1):
            coord1 = {'lat': segmento_coords[i][0], 'lng': segmento_coords[i][1]}
            coord2 = {'lat': segmento_coords[i+1][0], 'lng': segmento_coords[i+1][1]}
            distancia_total += calcular_distancia(coord1, coord2)
        
        return distancia_total
        
    except Exception as e:
        print(f"Error calculando distancia de segmento: {e}")
        return calcular_distancia(
            {'lat': paradero_inicio.latitud, 'lng': paradero_inicio.longitud},
            {'lat': paradero_fin.latitud, 'lng': paradero_fin.longitud}
        )