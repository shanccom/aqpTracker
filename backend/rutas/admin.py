from django.contrib import admin
from .models import Empresa, Ruta, Recorrido, Paradero, RecorridoParadero

@admin.register(Empresa)
class EmpresaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'color_principal')
    search_fields = ('nombre',)


class RecorridoInline(admin.TabularInline):
    model = Recorrido
    extra = 0
    fields = ('sentido', 'color_linea', 'grosor_linea')
    readonly_fields = ('coordenadas',)


@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'empresa', 'nombre')
    list_filter = ('empresa',)
    search_fields = ('codigo', 'nombre', 'empresa__nombre')
    inlines = [RecorridoInline]


@admin.register(Recorrido)
class RecorridoAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'sentido', 'color_linea')
    list_filter = ('ruta__empresa', 'sentido')
    search_fields = ('ruta__codigo', 'ruta__nombre')
    readonly_fields = ('coordenadas',)


@admin.register(Paradero)
class ParaderoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'latitud', 'longitud', 'es_popular')
    list_filter = ('es_popular',)
    search_fields = ('nombre',)


@admin.register(RecorridoParadero)
class RecorridoParaderoAdmin(admin.ModelAdmin):
    list_display = ('recorrido', 'paradero', 'orden', 'distancia_metros')
    list_filter = ('recorrido__ruta__empresa',)
    search_fields = ('recorrido__ruta__codigo', 'paradero__nombre')