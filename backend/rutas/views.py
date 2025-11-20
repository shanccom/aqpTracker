from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero
#Algoritmo rutas
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import calcular_distancia, encontrar_indice_mas_cercano

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

    RADIO_METROS = 500
    
    todos_paraderos = Paradero.objects.all()
    
    paraderos_cerca_a = []
    paraderos_cerca_b = []

    for paradero in todos_paraderos:
        coord_paradero = {'lat': paradero.latitud, 'lng': paradero.longitud}
        
        # Calculamos distancias
        dist_a = calcular_distancia(punto_a, coord_paradero)
        dist_b = calcular_distancia(punto_b, coord_paradero)
        
        #MEJORA 1: Guardamos el paradero Y SU DISTANCIA en una tupla
        if dist_a <= RADIO_METROS:
            paraderos_cerca_a.append({'obj': paradero, 'dist': dist_a})
            
        if dist_b <= RADIO_METROS:
            paraderos_cerca_b.append({'obj': paradero, 'dist': dist_b})
            
    #MEJORA 2: Ordenamos las listas por distancia (del más cercano al más lejano)
    paraderos_cerca_a.sort(key=lambda x: x['dist'])
    paraderos_cerca_b.sort(key=lambda x: x['dist'])
    
    #Extraemos solo los objetos ya ordenados para la lógica siguiente
    lista_ordenada_a = [item['obj'] for item in paraderos_cerca_a]
    lista_ordenada_b = [item['obj'] for item in paraderos_cerca_b]

    #Filtramos los IDs para la base de datos
    ids_a = [p.id for p in lista_ordenada_a]
    ids_b = [p.id for p in lista_ordenada_b]

    #Buscar Recorridos (Igual que antes)
    recorridos_a = Recorrido.objects.filter(recorrido_paraderos__paradero_id__in=ids_a).distinct()
    recorridos_b = Recorrido.objects.filter(recorrido_paraderos__paradero_id__in=ids_b).distinct()
    
    recorridos_finales = recorridos_a & recorridos_b
    
    respuesta = []
    
    for rec in recorridos_finales:
        paradero_inicio = None
        paradero_fin = None
        
        #MEJORA 3: Ahora al iterar, como la lista está ordenada por cercanía,
        # el 'break' se detendrá en el paradero MÁS CERCANO al click del usuario.
        
        for p in lista_ordenada_a:
            if rec.recorrido_paraderos.filter(paradero_id=p.id).exists():
                paradero_inicio = p
                break # Se detiene en el más cercano
        
        for p in lista_ordenada_b:
            if rec.recorrido_paraderos.filter(paradero_id=p.id).exists():
                paradero_fin = p
                break # Se detiene en el más cercano
        
        if not paradero_inicio or not paradero_fin:
            coords_finales = rec.coordenadas
        else:
            coord_p_inicio = {'lat': paradero_inicio.latitud, 'lng': paradero_inicio.longitud}
            coord_p_fin = {'lat': paradero_fin.latitud, 'lng': paradero_fin.longitud}
            
            idx_inicio = encontrar_indice_mas_cercano(coord_p_inicio, rec.coordenadas)
            idx_fin = encontrar_indice_mas_cercano(coord_p_fin, rec.coordenadas)
            
            inicio_real = min(idx_inicio, idx_fin)
            fin_real = max(idx_inicio, idx_fin)
            
            coords_finales = rec.coordenadas[inicio_real : fin_real + 1]

        respuesta.append({
            'id': rec.id,
            'nombre_ruta': rec.ruta.nombre,      
            'empresa': rec.ruta.empresa.nombre,  
            'sentido': rec.sentido,              
            'color': rec.color_linea,
            'coordenadas': coords_finales,
            'debug_info': f"Cortado de {paradero_inicio.nombre} a {paradero_fin.nombre}"
        })
        
    return Response(respuesta)