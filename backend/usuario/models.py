from django.contrib.auth.models import User
from django.db import models

def user_directory_path(instance, filename):
    # Fotos guardadas en: usuarios/<username>/<filename>
    return f'usuarios/{instance.user.username}/{filename}'

class Perfil(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    telefono = models.CharField(max_length=15, blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    foto = models.ImageField(upload_to=user_directory_path, blank=True, null=True)

    def __str__(self):
        return self.user.username
