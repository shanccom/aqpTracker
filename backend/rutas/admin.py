from django.contrib import admin

from .models import Empresa, Ruta, Paradero, RutaParadero

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'color_principal')
    search_fields = ('nombre',)


@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'empresa', 'nombre', 'sentido', 'color_linea')
    list_filter = ('empresa', 'sentido')
    search_fields = ('codigo', 'nombre', 'empresa__nombre')
    readonly_fields = ('coordenadas',)


@admin.register(Paradero)
class ParaderoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'latitud', 'longitud', 'es_popular')
    list_filter = ('es_popular',)
    search_fields = ('nombre',)


@admin.register(RutaParadero)
class RutaParaderoAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'paradero', 'orden', 'distancia_metros')
    list_filter = ('ruta__empresa',)
    search_fields = ('ruta__codigo', 'paradero__nombre')