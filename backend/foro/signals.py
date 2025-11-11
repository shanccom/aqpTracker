from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Comentario, ReaccionIncidencia, ReaccionComentario, Notificacion, Incidencia


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


@receiver(post_save, sender=ReaccionIncidencia)
def reaccion_incidencia_post_save(sender, instance: ReaccionIncidencia, created, **kwargs):
    """Notificar cuando alguien reacciona a una incidencia ajena."""
    if not created:
        return
    try:
        autor = instance.usuario
        destino_incidencia = instance.incidencia
        destinatario = destino_incidencia.usuario if destino_incidencia else None
        incidencia = destino_incidencia
        if destinatario and autor and destinatario.pk != autor.pk:
            tipo_nombre = instance.tipo.nombre if instance.tipo else 'reaccion'
            mensaje = f"{autor.user.first_name or autor.user.email} reaccionó ({tipo_nombre}) a tu contenido"
            Notificacion.objects.create(usuario=destinatario, mensaje=mensaje, incidencia=incidencia, actor=autor)
    except Exception:
        pass


@receiver(post_save, sender=ReaccionComentario)
def reaccion_comentario_post_save(sender, instance: ReaccionComentario, created, **kwargs):
    """Notificar cuando alguien reacciona a un comentario ajeno."""
    if not created:
        return
    try:
        autor = instance.usuario
        destino_comentario = instance.comentario
        destinatario = destino_comentario.usuario if destino_comentario else None
        incidencia = destino_comentario.incidencia if destino_comentario else None
        if destinatario and autor and destinatario.pk != autor.pk:
            tipo_nombre = instance.tipo.nombre if instance.tipo else 'reaccion'
            mensaje = f"{autor.user.first_name or autor.user.email} reaccionó ({tipo_nombre}) a tu contenido"
            Notificacion.objects.create(usuario=destinatario, mensaje=mensaje, incidencia=incidencia, actor=autor)
    except Exception:
        pass
