from django.db import models

class Empresa(models.Model):
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True)
    color_principal = models.CharField(max_length=7, default='#3B82F6')
    
    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class Ruta(models.Model):
    """Representa una ruta completa (agrupa IDA y VUELTA)"""
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='rutas')
    nombre = models.CharField(max_length=200)  # "ALTO SELVA ALAGRE D"
    codigo = models.CharField(max_length=50, unique=True)  # "ASA-D"
    descripcion = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Ruta'
        verbose_name_plural = 'Rutas'
        ordering = ['empresa', 'nombre']
    
    def __str__(self):
        return f"{self.empresa.nombre} - {self.nombre}"


class Recorrido(models.Model):
    """Representa un sentido específico de una ruta (IDA o VUELTA)"""
    SENTIDO_CHOICES = [
        ('IDA', 'Ida'),
        ('VUELTA', 'Vuelta'),
    ]
    
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='recorridos')
    sentido = models.CharField(max_length=10, choices=SENTIDO_CHOICES)
    color_linea = models.CharField(max_length=7, default='#EF4444')
    grosor_linea = models.IntegerField(default=3)
    coordenadas = models.JSONField()  # Lista de [lat, lng] del recorrido
    archivo_kml = models.CharField(max_length=255, blank=True)
    
    class Meta:
        verbose_name = 'Recorrido'
        verbose_name_plural = 'Recorridos'
        ordering = ['ruta', 'sentido']
        unique_together = ['ruta', 'sentido']  # Solo un IDA y un VUELTA por ruta
    
    def __str__(self):
        return f"{self.ruta.codigo} - {self.sentido}"


class Paradero(models.Model):
    nombre = models.CharField(max_length=200)
    latitud = models.FloatField()
    longitud = models.FloatField()
    es_popular = models.BooleanField(default=False)
    descripcion = models.TextField(blank=True)
    
    class Meta:
        verbose_name = 'Paradero'
        verbose_name_plural = 'Paraderos'
        ordering = ['nombre']
    
    def __str__(self):
        return self.nombre


class RecorridoParadero(models.Model):
    """Asocia paraderos con recorridos específicos (IDA o VUELTA)"""
    recorrido = models.ForeignKey(Recorrido, on_delete=models.CASCADE, related_name='recorrido_paraderos')
    paradero = models.ForeignKey(Paradero, on_delete=models.CASCADE, related_name='paradero_recorridos')
    orden = models.IntegerField(default=0)
    distancia_metros = models.FloatField()
    
    class Meta:
        verbose_name = 'Recorrido-Paradero'
        verbose_name_plural = 'Recorridos-Paraderos'
        ordering = ['recorrido', 'orden']
        unique_together = ['recorrido', 'paradero']
    
    def __str__(self):
        return f"{self.recorrido} - {self.paradero.nombre}"