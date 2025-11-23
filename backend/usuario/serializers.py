from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.contrib.auth import authenticate
from .models import Perfil
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = ['telefono', 'direccion', 'foto']

class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    foto = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'telefono', 'foto']

    def create(self, validated_data):
        # Normalize email
        email = validated_data['email'].strip().lower()
        try:
            user = User.objects.create_user(
                username=email,  # username = email
                email=email,
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', '')
            )
        except IntegrityError:
            raise serializers.ValidationError({'email': 'Este correo ya está registrado'})
        # create profile and set optional fields
        telefono = validated_data.get('telefono', None)
        foto = validated_data.get('foto', None)
        # if no foto uploaded, assign default avatar located in media/usuarios
        if not foto:
            foto = 'usuarios/circulo-azul-usuario-blanco_78370-4707.avif'
        Perfil.objects.create(user=user, telefono=telefono or None, foto=foto)
        return user
    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("Este correo ya está registrado")
        return email

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer que añade el email del usuario al payload del token.
    No toca la validación: la resolución email->username se hará en la vista.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        return token

class PerfilCompletoSerializer(serializers.ModelSerializer):
    telefono = serializers.CharField(required=False)
    direccion = serializers.CharField(required=False)
    foto = serializers.ImageField(required=False)
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)
    date_joined = serializers.DateTimeField(source='user.date_joined', read_only=True)

    class Meta:
        model = Perfil
        fields = ['telefono', 'direccion', 'foto', 'first_name', 'last_name', 'email', 'date_joined']
    


class PerfilUpdateSerializer(serializers.ModelSerializer):
   
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)

    class Meta:
        model = Perfil
        fields = ['telefono', 'direccion', 'foto', 'first_name', 'last_name']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        # Apply first_name/last_name if provided
        for attr in ('first_name', 'last_name'):
            if attr in user_data:
                setattr(user, attr, user_data[attr])
        user.save()
        return super().update(instance, validated_data)

    def validate(self, attrs):
        initial = getattr(self, 'initial_data', {}) or {}
        if 'email' in initial:
            raise serializers.ValidationError({'email': 'No está permitido cambiar el email desde este endpoint.'})
        if 'password' in initial or 'old_password' in initial or 'new_password' in initial:
            raise serializers.ValidationError({'password': 'No está permitido cambiar la contraseña aquí. Usa /api/usuario/cambiar-password/.'})
        return attrs

class CambiarPasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("La nueva contraseña debe tener al menos 6 caracteres.")
        return value
