import math

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