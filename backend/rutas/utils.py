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