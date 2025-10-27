from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Comentario, Reaccion, Notificacion, Incidencia


@receiver(post_save, sender=Comentario)
def comentario_post_save(sender, instance: Comentario, created, **kwargs):
    """Crear notificación cuando alguien comenta una incidencia de otro usuario."""
    if not created:
        return
    try:
        incidencia = instance.incidencia
        destinatario = incidencia.usuario
        autor = instance.usuario
        # no notificar si el autor es el mismo propietario
        if destinatario and autor and destinatario.pk != autor.pk:
            mensaje = f"{autor.user.first_name or autor.user.email} comentó tu incidencia: {incidencia.titulo}"
            Notificacion.objects.create(usuario=destinatario, mensaje=mensaje, incidencia=incidencia, actor=autor)
    except Exception:
        # defensivo: no romper la creación del comentario por fallos en notificación
        pass


@receiver(post_save, sender=Reaccion)
def reaccion_post_save(sender, instance: Reaccion, created, **kwargs):
    """Crear notificación cuando alguien reacciona a una incidencia o comentario ajeno."""
    if not created:
        return
    try:
        autor = instance.usuario
        # determinar el owner del target (incidencia o comentario)
        destino_incidencia = instance.incidencia
        destino_comentario = instance.comentario
        destinatario = None
        incidencia = None
        if destino_incidencia:
            incidencia = destino_incidencia
            destinatario = destino_incidencia.usuario
        elif destino_comentario:
            incidencia = destino_comentario.incidencia
            destinatario = destino_comentario.usuario
        # evitar notificar al mismo usuario
        if destinatario and autor and destinatario.pk != autor.pk:
            tipo_nombre = instance.tipo.nombre if instance.tipo else 'reaccion'
            mensaje = f"{autor.user.first_name or autor.user.email} reaccionó ({tipo_nombre}) a tu contenido"
            Notificacion.objects.create(usuario=destinatario, mensaje=mensaje, incidencia=incidencia, actor=autor)
    except Exception:
        pass
