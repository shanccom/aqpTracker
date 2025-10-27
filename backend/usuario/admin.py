from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as DefaultUserAdmin
from .models import Perfil


class PerfilInline(admin.StackedInline):
	model = Perfil
	can_delete = False
	verbose_name_plural = 'Perfiles'


class CustomUserAdmin(DefaultUserAdmin):
	inlines = (PerfilInline,)

try:
	admin.site.unregister(User)
except Exception:
	pass

admin.site.register(User, CustomUserAdmin)

@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
	list_display = ('user', 'telefono', 'direccion')
	search_fields = ('user__username', 'user__email', 'telefono', 'direccion')
	autocomplete_fields = ('user',)
