from django.contrib import admin
from .models import (
	Distrito, Estado, Incidencia, Reporte,
	TipoReaccion, Comentario, Reaccion, Notificacion
)


@admin.register(Distrito)
class DistritoAdmin(admin.ModelAdmin):
	list_display = ('id', 'nombre')
	search_fields = ('nombre',)


@admin.register(Estado)
class EstadoAdmin(admin.ModelAdmin):
	list_display = ('id', 'nombre')
	search_fields = ('nombre',)


@admin.register(Incidencia)
class IncidenciaAdmin(admin.ModelAdmin):
	list_display = ('id', 'titulo', 'usuario', 'distrito', 'estado', 'fecha_creacion')
	search_fields = ('titulo', 'descripcion', 'usuario__user__email')
	list_filter = ('distrito', 'estado')
	readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
	autocomplete_fields = ('usuario',)


@admin.register(Reporte)
class ReporteAdmin(admin.ModelAdmin):
	list_display = ('id', 'usuario', 'incidencia', 'fecha_reporte')
	search_fields = ('usuario__user__email', 'incidencia__titulo')
	autocomplete_fields = ('usuario', 'incidencia')


@admin.register(TipoReaccion)
class TipoReaccionAdmin(admin.ModelAdmin):
	list_display = ('id', 'nombre', 'emoji')
	search_fields = ('nombre',)


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
	list_display = ('id', 'usuario', 'incidencia', 'respuesta_a', 'fecha_creacion')
	search_fields = ('contenido', 'usuario__user__email')
	autocomplete_fields = ('usuario', 'incidencia', 'respuesta_a')


@admin.register(Reaccion)
class ReaccionAdmin(admin.ModelAdmin):
	list_display = ('id', 'usuario', 'tipo', 'incidencia', 'comentario', 'fecha')
	search_fields = ('usuario__user__email', 'tipo__nombre')
	autocomplete_fields = ('usuario', 'incidencia', 'comentario')


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
	list_display = ('id', 'usuario', 'actor', 'mensaje', 'leida', 'fecha_creacion')
	search_fields = ('mensaje', 'usuario__user__email', 'actor__user__email')
	list_filter = ('leida',)
	autocomplete_fields = ('usuario', 'incidencia', 'actor')
