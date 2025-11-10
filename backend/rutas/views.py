from .models import Empresa, Ruta, Parada, RutaParada

from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import EmpresaSerializer, ParadaSerializer, RutaListSerializer, RutaDetailSerializer
from django.db import models


class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['nombre']

class ParadaViewSet(viewsets.ModelViewSet):
    queryset = Parada.objects.all()
    serializer_class = ParadaSerializer
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['nombre', 'direccion']
    filterset_fields = ['es_terminal']

class RutaViewSet(viewsets.ModelViewSet):
    queryset = Ruta.objects.select_related('empresa').prefetch_related('paradas__parada')
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['codigo', 'nombre', 'empresa__nombre']
    filterset_fields = ['empresa', 'activa']
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RutaDetailSerializer
        return RutaListSerializer
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Estadísticas generales del sistema"""
        total_rutas = Ruta.objects.filter(activa=True).count()
        total_empresas = Empresa.objects.count()
        total_paradas = Parada.objects.count()
        precio_promedio = Ruta.objects.aggregate(models.Avg('precio'))['precio__avg']
        
        return Response({
            'total_rutas': total_rutas,
            'total_empresas': total_empresas,
            'total_paradas': total_paradas,
            'precio_promedio': round(precio_promedio, 2) if precio_promedio else 0
        })
    
    @action(detail=False, methods=['get'])
    def buscar_conexion(self, request):
        """Encuentra rutas que pasan cerca de dos puntos"""
        lat_origen = request.query_params.get('lat_origen')
        lng_origen = request.query_params.get('lng_origen')
        lat_destino = request.query_params.get('lat_destino')
        lng_destino = request.query_params.get('lng_destino')
        radio = float(request.query_params.get('radio', 0.01))  # ~1km
        
        if not all([lat_origen, lng_origen, lat_destino, lng_destino]):
            return Response({'error': 'Faltan coordenadas'}, status=400)
        
        # Buscar paradas cercanas al origen y destino
        paradas_origen = Parada.objects.filter(
            latitud__range=(float(lat_origen) - radio, float(lat_origen) + radio),
            longitud__range=(float(lng_origen) - radio, float(lng_origen) + radio)
        )
        
        paradas_destino = Parada.objects.filter(
            latitud__range=(float(lat_destino) - radio, float(lat_destino) + radio),
            longitud__range=(float(lng_destino) - radio, float(lng_destino) + radio)
        )
        
        # Encontrar rutas que pasen por ambas zonas
        rutas_origen = RutaParada.objects.filter(parada__in=paradas_origen).values_list('ruta_id', flat=True)
        rutas_destino = RutaParada.objects.filter(parada__in=paradas_destino).values_list('ruta_id', flat=True)
        
        rutas_comunes = Ruta.objects.filter(id__in=set(rutas_origen) & set(rutas_destino), activa=True)
        
        return Response(RutaListSerializer(rutas_comunes, many=True).data)