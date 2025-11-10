import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from rutas.models import Empresa, Ruta, Parada, RutaParada

# Crear empresa
cristo_rey = Empresa.objects.create(
    nombre='Cristo Rey',
    color='#EF4444',
    telefono='054-123456'
)

jesus_maria = Empresa.objects.create(
    nombre='Jesús María',
    color='#10B981',
    telefono='054-654321'
)

# Crear paradas
plaza_armas = Parada.objects.create(
    nombre='Plaza de Armas',
    latitud=-16.398870,
    longitud=-71.536930,
    direccion='Portal de la Municipalidad',
    referencia='Frente a la Catedral',
    es_terminal=True
)

mall_plaza = Parada.objects.create(
    nombre='Mall Plaza',
    latitud=-16.409123,
    longitud=-71.530456,
    direccion='Av. Ejército 1009',
    referencia='Frente a Mall Plaza'
)

cayma = Parada.objects.create(
    nombre='Cayma Terminal',
    latitud=-16.378910,
    longitud=-71.545670,
    direccion='Av. Cayma s/n',
    referencia='Terminal de Cayma',
    es_terminal=True
)

paucarpata = Parada.objects.create(
    nombre='Paucarpata Terminal',
    latitud=-16.425500,
    longitud=-71.502300,
    direccion='Av. Paucarpata s/n',
    referencia='Terminal de Paucarpata',
    es_terminal=True
)

# Crear rutas
ruta1 = Ruta.objects.create(
    empresa=cristo_rey,
    codigo='CR-01',
    nombre='Centro - Cayma',
    precio=1.50,
    frecuencia_minutos=8,
    distancia_km=5.2
)

ruta2 = Ruta.objects.create(
    empresa=jesus_maria,
    codigo='JM-05',
    nombre='Centro - Paucarpata',
    precio=1.50,
    frecuencia_minutos=12,
    distancia_km=8.5
)

# Asociar paradas a ruta 1 (Centro - Cayma)
RutaParada.objects.create(ruta=ruta1, parada=plaza_armas, orden=1, tiempo_estimado_desde_inicio=0)
RutaParada.objects.create(ruta=ruta1, parada=mall_plaza, orden=2, tiempo_estimado_desde_inicio=10)
RutaParada.objects.create(ruta=ruta1, parada=cayma, orden=3, tiempo_estimado_desde_inicio=25)

# Asociar paradas a ruta 2 (Centro - Paucarpata)
RutaParada.objects.create(ruta=ruta2, parada=plaza_armas, orden=1, tiempo_estimado_desde_inicio=0)
RutaParada.objects.create(ruta=ruta2, parada=mall_plaza, orden=2, tiempo_estimado_desde_inicio=15)
RutaParada.objects.create(ruta=ruta2, parada=paucarpata, orden=3, tiempo_estimado_desde_inicio=35)

print("✅ Datos cargados correctamente!")
print(f"📊 Empresas: {Empresa.objects.count()}")
print(f"📍 Paradas: {Parada.objects.count()}")
print(f"🚌 Rutas: {Ruta.objects.count()}")