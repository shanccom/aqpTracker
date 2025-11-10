from rest_framework import serializers
from .models import Empresa, Parada, Ruta, RutaParada

class EmpresaSerializer(serializers.ModelSerializer):
    total_rutas = serializers.IntegerField(source='rutas.count', read_only=True)
    
    class Meta:
        model = Empresa
        fields = ['id', 'nombre', 'color', 'telefono', 'total_rutas']

class ParadaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parada
        fields = ['id', 'nombre', 'latitud', 'longitud', 'direccion', 'referencia', 'es_terminal']

class RutaParadaSerializer(serializers.ModelSerializer):
    parada = ParadaSerializer()
    
    class Meta:
        model = RutaParada
        fields = ['id', 'orden', 'tiempo_estimado_desde_inicio', 'parada']

class RutaListSerializer(serializers.ModelSerializer):
    empresa_nombre = serializers.CharField(source='empresa.nombre', read_only=True)
    empresa_color = serializers.CharField(source='empresa.color', read_only=True)
    
    class Meta:
        model = Ruta
        fields = ['id', 'codigo', 'nombre', 'empresa_nombre', 'empresa_color', 
                  'precio', 'frecuencia_minutos', 'total_paradas', 'activa']

class RutaDetailSerializer(serializers.ModelSerializer):
    empresa = EmpresaSerializer()
    paradas = RutaParadaSerializer(many=True)
    
    class Meta:
        model = Ruta
        fields = ['id', 'codigo', 'nombre', 'empresa', 'precio', 'frecuencia_minutos',
                  'horario_inicio', 'horario_fin', 'activa', 'distancia_km', 
                  'total_paradas', 'tiempo_total_estimado', 'paradas']

