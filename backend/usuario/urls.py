from django.urls import path
from .views import RegistroView, LoginView, PerfilUsuarioView, CambiarPasswordView, EliminarCuentaView, LogoutView

urlpatterns = [
    path('registro/', RegistroView.as_view(), name='registro'),
    path('login/', LoginView.as_view(), name='login'),
    path('perfil/', PerfilUsuarioView.as_view(), name='perfil'),
    path('cambiar-password/', CambiarPasswordView.as_view(), name='cambiar_password'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('eliminar-cuenta/', EliminarCuentaView.as_view(), name='eliminar_cuenta'),
]
