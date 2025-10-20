from rest_framework import serializers
from .models import Ruta, PuntoRuta

class PuntoRutaSerializer(serializers.ModelSerializer):
    class Meta:
        model = PuntoRuta
        fields = ['latitud', 'longitud', 'orden']

class RutaSerializer(serializers.ModelSerializer):
    puntos = PuntoRutaSerializer(many=True)
    class Meta:
        model = Ruta
        fields = ['id', 'nombre', 'descripcion', 'puntos']