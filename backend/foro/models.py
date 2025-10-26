from django.db import models
from usuario.models import Perfil  # tu modelo de perfil con usuario


class Distrito(models.Model):
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True, null=True)
    # otros campos como imagenes nc, mejor hacerle un modelo aparte en caso se requiera añadir más info al distrito
    def __str__(self):
        return self.nombre

class Estado(models.Model):
    nombre = models.CharField(max_length=50, unique=True)  # Ej: 'Activo', 'En proceso', 'Resuelto', 'Falso'
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nombre

class Incidencia(models.Model):
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='incidencias')  # dueño de la incidencia
    titulo = models.CharField(max_length=120)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='incidencias/', blank=True, null=True)
    distrito = models.ForeignKey(Distrito, on_delete=models.SET_NULL, null=True, blank=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    estado = models.ForeignKey(Estado, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidencias')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    # reportes de otros usuarios
    reportado_por = models.ManyToManyField(Perfil, through='Reporte', related_name='incidencias_reportadas', blank=True)

    def __str__(self):
        return f"{self.titulo} ({self.usuario.user.email})"  # email como username

class Reporte(models.Model):
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    incidencia = models.ForeignKey(Incidencia, on_delete=models.CASCADE)
    fecha_reporte = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'incidencia')

    def __str__(self):
        return f"{self.usuario.user.email} reportó {self.incidencia.titulo}"


class TipoReaccion(models.Model):
    nombre = models.CharField(max_length=50, unique=True)
    emoji = models.CharField(max_length=10, blank=True, null=True)  
    descripcion = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.emoji or ''} {self.nombre}"


class Comentario(models.Model):
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    incidencia = models.ForeignKey(Incidencia, on_delete=models.CASCADE, related_name='comentarios')
    contenido = models.TextField()
    respuesta_a = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='respuestas')
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comentario de {self.usuario.user.email} en {self.incidencia.titulo}"


class Reaccion(models.Model):
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE)
    incidencia = models.ForeignKey(Incidencia, on_delete=models.CASCADE, related_name='reacciones', null=True, blank=True)
    comentario = models.ForeignKey(Comentario, on_delete=models.CASCADE, related_name='reacciones', null=True, blank=True)
    tipo = models.ForeignKey(TipoReaccion, on_delete=models.CASCADE)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('usuario', 'incidencia', 'comentario', 'tipo')

    def __str__(self):
        target = self.incidencia or self.comentario
        return f"{self.usuario.user.email} → {self.tipo.nombre} ({target})"

class Notificacion(models.Model):
    usuario = models.ForeignKey(Perfil, on_delete=models.CASCADE, related_name='notificaciones')
    mensaje = models.CharField(max_length=255)
    incidencia = models.ForeignKey(Incidencia, on_delete=models.CASCADE, null=True, blank=True)
    leida = models.BooleanField(default=False)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notif para {self.usuario.user.email}: {self.mensaje}"
