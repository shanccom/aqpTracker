import os
import xml.etree.ElementTree as ET
from math import radians, sin, cos, sqrt, atan2
from django.core.management.base import BaseCommand
from django.conf import settings
from rutas.models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero


class Command(BaseCommand):
    help = 'Carga rutas desde archivos KML y asocia paraderos cercanos'

    PARADEROS_POPULARES = [
        {'nombre': 'Plaza de Armas', 'lat': -16.3989, 'lng': -71.5370, 'popular': True},
        {'nombre': 'Parque Mayta Cápac', 'lat': -16.4067, 'lng': -71.5228, 'popular': True},
        {'nombre': 'Terminal Terrestre', 'lat': -16.4298, 'lng': -71.5192, 'popular': True},
        {'nombre': 'Mercado San Camilo', 'lat': -16.4024, 'lng': -71.5369, 'popular': True},
        {'nombre': 'Parque Selva Alegre', 'lat': -16.4186, 'lng': -71.5271, 'popular': True},
        {'nombre': 'Cerro Colorado', 'lat': -16.3656, 'lng': -71.5625, 'popular': True},
        {'nombre': 'Paucarpata', 'lat': -16.4324, 'lng': -71.4923, 'popular': True},
        {'nombre': 'Cayma', 'lat': -16.3727, 'lng': -71.5470, 'popular': True},
        {'nombre': 'UNSA Medicina', 'lat': -16.41244, 'lng': -71.53511, 'popular': True},
        {'nombre': 'UNSA Ingeniería', 'lat': -16.40274, 'lng': -71.52546, 'popular': True},
        {'nombre': 'Mariscal Castilla', 'lat': -16.39942, 'lng': -71.52157, 'popular': True},
    ]

    def calcular_distancia(self, lat1, lng1, lat2, lng2):
        """Calcula la distancia en metros entre dos coordenadas usando Haversine"""
        R = 6371000
        
        lat1_rad = radians(lat1)
        lat2_rad = radians(lat2)
        delta_lat = radians(lat2 - lat1)
        delta_lng = radians(lng2 - lng1)
        
        a = sin(delta_lat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(delta_lng / 2) ** 2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        
        return R * c

    def parsear_kml(self, archivo_path):
        """Extrae las coordenadas de un archivo KML"""
        tree = ET.parse(archivo_path)
        root = tree.getroot()
        
        ns = {'kml': 'http://www.opengis.net/kml/2.2'}
        coordenadas = []
        
        for coordinates in root.findall('.//kml:coordinates', ns):
            coords_text = coordinates.text.strip()
            for coord in coords_text.split():
                if coord:
                    partes = coord.split(',')
                    if len(partes) >= 2:
                        lng = float(partes[0])
                        lat = float(partes[1])
                        coordenadas.append([lat, lng])
        
        return coordenadas

    def crear_paraderos(self):
        """Crea los paraderos populares en la base de datos"""
        self.stdout.write('Creando paraderos populares...')
        
        for paradero_data in self.PARADEROS_POPULARES:
            paradero, created = Paradero.objects.get_or_create(
                nombre=paradero_data['nombre'],
                defaults={
                    'latitud': paradero_data['lat'],
                    'longitud': paradero_data['lng'],
                    'es_popular': paradero_data['popular']
                }
            )
            if created:
                self.stdout.write(f'  ✓ Creado: {paradero.nombre}')

    def asociar_paraderos(self, recorrido, coordenadas):
        """Asocia paraderos cercanos al recorrido"""
        paraderos = Paradero.objects.all()
        distancia_maxima = 100
        
        for paradero in paraderos:
            distancia_minima = float('inf')
            
            for coord in coordenadas:
                distancia = self.calcular_distancia(
                    coord[0], coord[1],
                    paradero.latitud, paradero.longitud
                )
                if distancia < distancia_minima:
                    distancia_minima = distancia
            
            if distancia_minima <= distancia_maxima:
                RecorridoParadero.objects.get_or_create(
                    recorrido=recorrido,
                    paradero=paradero,
                    defaults={
                        'distancia_metros': distancia_minima,
                        'orden': 0
                    }
                )
                self.stdout.write(f'    ✓ Paradero "{paradero.nombre}" asociado ({distancia_minima:.1f}m)')

    def extraer_info_nombre(self, nombre_archivo):
        """Extrae sentido y nombre base del archivo"""
        nombre_base = os.path.splitext(nombre_archivo)[0]
        
        # Detectar sentido
        if nombre_base.startswith('IDA'):
            sentido = 'IDA'
            nombre_ruta = nombre_base.replace('IDA - ', '').replace('IDA-', '').strip()
        elif nombre_base.startswith('VUELTA'):
            sentido = 'VUELTA'
            nombre_ruta = nombre_base.replace('VUELTA - ', '').replace('VUELTA-', '').strip()
        else:
            sentido = 'IDA'
            nombre_ruta = nombre_base
        
        return sentido, nombre_ruta

    def add_arguments(self, parser):
        parser.add_argument('empresa_nombre', type=str, help='Nombre de la empresa')
        parser.add_argument('kml_folder', type=str, help='Carpeta con los archivos KML')

    def handle(self, *args, **options):
        empresa_nombre = options['empresa_nombre']
        kml_folder = options['kml_folder']
        
        # Crear o obtener la empresa
        empresa, created = Empresa.objects.get_or_create(
            nombre=empresa_nombre,
            defaults={'descripcion': f'Empresa de transporte {empresa_nombre}'}
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'✓ Empresa "{empresa_nombre}" creada'))
        else:
            self.stdout.write(f'→ Usando empresa existente: "{empresa_nombre}"')
        
        # Crear paraderos populares
        self.crear_paraderos()
        
        # Verificar carpeta
        if not os.path.exists(kml_folder):
            self.stdout.write(self.style.ERROR(f'✗ La carpeta {kml_folder} no existe'))
            return
        
        archivos_kml = [f for f in os.listdir(kml_folder) if f.endswith('.kml')]
        
        self.stdout.write(f'\nProcesando {len(archivos_kml)} archivos KML...\n')
        
        # Agrupar archivos por ruta
        rutas_agrupadas = {}
        
        for archivo in archivos_kml:
            sentido, nombre_ruta = self.extraer_info_nombre(archivo)
            
            if nombre_ruta not in rutas_agrupadas:
                rutas_agrupadas[nombre_ruta] = {}
            
            rutas_agrupadas[nombre_ruta][sentido] = archivo
        
        # Procesar cada ruta
        for nombre_ruta, archivos_sentidos in rutas_agrupadas.items():
            self.stdout.write(f'\n📍 Ruta: {nombre_ruta}')
            
            # Crear código único
            codigo = f"{empresa.nombre[:3].upper()}-{nombre_ruta[:10].upper()}"
            
            # Crear o obtener la ruta
            ruta, ruta_created = Ruta.objects.get_or_create(
                codigo=codigo,
                defaults={
                    'empresa': empresa,
                    'nombre': nombre_ruta
                }
            )
            
            if ruta_created:
                self.stdout.write(f'  ✓ Ruta creada: {ruta.codigo}')
            else:
                self.stdout.write(f'  → Ruta existente: {ruta.codigo}')
            
            # Procesar cada sentido
            for sentido, archivo in archivos_sentidos.items():
                archivo_path = os.path.join(kml_folder, archivo)
                
                self.stdout.write(f'  📄 {sentido}: {archivo}')
                
                # Parsear KML
                coordenadas = self.parsear_kml(archivo_path)
                
                if not coordenadas:
                    self.stdout.write(self.style.WARNING(f'    ⚠ No se encontraron coordenadas'))
                    continue
                
                # Color según sentido
                color = '#EF4444' if sentido == 'IDA' else '#3B82F6'
                
                # Crear o actualizar recorrido
                recorrido, rec_created = Recorrido.objects.get_or_create(
                    ruta=ruta,
                    sentido=sentido,
                    defaults={
                        'coordenadas': coordenadas,
                        'archivo_kml': archivo,
                        'color_linea': color
                    }
                )
                
                if rec_created:
                    self.stdout.write(f'    ✓ Recorrido creado: {len(coordenadas)} puntos')
                    self.asociar_paraderos(recorrido, coordenadas)
                else:
                    self.stdout.write(f'    → Recorrido ya existe')
        
        self.stdout.write(self.style.SUCCESS(f'\n✅ Proceso completado'))