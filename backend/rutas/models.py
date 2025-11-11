from django.db import models

class Empresa(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    color_principal = models.CharField(max_length=7, default='#3B82F6')  # Color hex para identificación visual
    
    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Ruta(models.Model):
    SENTIDO_CHOICES = [
        ('IDA', 'Ida'),
        ('VUELTA', 'Vuelta'),
    ]
    
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='rutas')
    nombre = models.CharField(max_length=200)
    codigo = models.CharField(max_length=50, unique=True)  # Ej: "R01-IDA"
    sentido = models.CharField(max_length=10, choices=SENTIDO_CHOICES)
    color_linea = models.CharField(max_length=7, default='#EF4444')  # Color para mostrar en mapa
    grosor_linea = models.IntegerField(default=3)
    coordenadas = models.JSONField()  # Lista de [lat, lng] del recorrido completo
    archivo_kml = models.CharField(max_length=255, blank=True)  # Nombre del archivo KML original
    
    class Meta:
        verbose_name = 'Ruta'
        verbose_name_plural = 'Rutas'
        ordering = ['empresa', 'codigo']
    
    def __str__(self):
        return f"{self.empresa.nombre} - {self.nombre} ({self.sentido})"


class Paradero(models.Model):
    nombre = models.CharField(max_length=200)
    latitud = models.FloatField()
    longitud = models.FloatField()
    es_popular = models.BooleanField(default=False)  # Para destacar paraderos importantes
    descripcion = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Paradero'
        verbose_name_plural = 'Paraderos'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class RutaParadero(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='ruta_paraderos')
    paradero = models.ForeignKey(Paradero, on_delete=models.CASCADE, related_name='paradero_rutas')
    orden = models.IntegerField(default=0)  # Orden del paradero en la ruta
    distancia_metros = models.FloatField()  # Distancia desde la ruta al paradero
    
    class Meta:
        verbose_name = 'Ruta-Paradero'
        verbose_name_plural = 'Rutas-Paraderos'
        ordering = ['ruta', 'orden']
        unique_together = ['ruta', 'paradero']
    
    def __str__(self):
        return f"{self.ruta.codigo} - {self.paradero.nombre}"