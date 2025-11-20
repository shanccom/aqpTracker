#rutas/utils.py
import math

def calcular_distancia(punto1, punto2):
    """
    Calcula la distancia en metros entre dos coordenadas usando la fórmula de Haversine.
    punto1 y punto2 deben ser diccionarios: {'lat': -16.xxx, 'lng': -71.xxx}
    """
    R = 6371000  #Radio de la Tierra en metros
    
    # Convertir grados a radianes
    lat1_rad = math.radians(punto1['lat'])
    lon1_rad = math.radians(punto1['lng'])
    lat2_rad = math.radians(punto2['lat'])
    lon2_rad = math.radians(punto2['lng'])
    
    #Diferencias
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    
    #Fórmula mágica
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def encontrar_indice_mas_cercano(coordenada_ref, lista_coordenadas):
    """
    Dada una coordenada de referencia (un paradero) y la lista de puntos de la ruta (polyline),
    encuentra el ÍNDICE del punto más cercano en esa lista.
    """
    mejor_indice = -1
    menor_distancia = float('inf') # Infinito

    for i, punto in enumerate(lista_coordenadas):
        # punto es [lat, lng] según el modelo JSONField
        # Convertimos a dict para usar tu función calcular_distancia
        coord_punto = {'lat': punto[0], 'lng': punto[1]} 
        
        dist = calcular_distancia(coordenada_ref, coord_punto)
        
        if dist < menor_distancia:
            menor_distancia = dist
            mejor_indice = i
            
    return mejor_indice