from django.db import models

class Empresa(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default='#3B82F6')  # Color hex para UI
    telefono = models.CharField(max_length=20, blank=True)
    
    class Meta:
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'
    
    def __str__(self):
        return self.nombre

class Ruta(models.Model):
    empresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, related_name='rutas')
    codigo = models.CharField(max_length=20, default='TEMP')  # Ej: "A-25", "B-12"
    nombre = models.CharField(max_length=200, default='Sin nombre')  # Ej: "Alto Selva Alegre - Centro"
    precio = models.DecimalField(max_digits=5, decimal_places=2, default=1.50)
    frecuencia_minutos = models.IntegerField(default=10)  # Cada cuántos minutos pasa
    horario_inicio = models.TimeField(default='05:00:00')
    horario_fin = models.TimeField(default='23:00:00')
    activa = models.BooleanField(default=True)
    distancia_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Ruta'
        verbose_name_plural = 'Rutas'
        unique_together = ['empresa', 'codigo']
        ordering = ['empresa', 'codigo']
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    @property
    def total_paradas(self):
        return self.paradas.count()
    
    @property
    def tiempo_total_estimado(self):
        ultima_parada = self.paradas.order_by('-orden').first()
        return ultima_parada.tiempo_estimado_desde_inicio if ultima_parada else 0

class Parada(models.Model):
    nombre = models.CharField(max_length=200)
    latitud = models.DecimalField(max_digits=10, decimal_places=7)
    longitud = models.DecimalField(max_digits=10, decimal_places=7)
    direccion = models.CharField(max_length=300)
    referencia = models.TextField(blank=True)  # Referencias cercanas
    es_terminal = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Parada'
        verbose_name_plural = 'Paradas'
        unique_together = ['latitud', 'longitud']
    
    def __str__(self):
        return self.nombre

class RutaParada(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='paradas')
    parada = models.ForeignKey(Parada, on_delete=models.CASCADE)
    orden = models.IntegerField()  # Orden secuencial: 1, 2, 3...
    tiempo_estimado_desde_inicio = models.IntegerField()  # Minutos desde terminal
    
    class Meta:
        verbose_name = 'Ruta-Parada'
        verbose_name_plural = 'Rutas-Paradas'
        ordering = ['orden']
        unique_together = ['ruta', 'orden']
    
    def __str__(self):
        return f"{self.ruta.codigo} - Parada {self.orden}: {self.parada.nombre}"