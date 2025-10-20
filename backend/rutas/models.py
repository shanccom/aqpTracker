from django.db import models

class Ruta(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True, null=True)

class PuntoRuta(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='puntos')
    latitud = models.FloatField()
    longitud = models.FloatField()
    orden = models.PositiveIntegerField() 

    class Meta:
        ordering = ['orden']
    