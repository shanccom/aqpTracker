from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers as drf_serializers
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth.models import User
from .serializers import RegistroSerializer, MyTokenObtainPairSerializer, PerfilCompletoSerializer, CambiarPasswordSerializer
from .models import Perfil
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

# REGISTRO
class RegistroView(generics.CreateAPIView):
    serializer_class = RegistroSerializer
    # allow multipart/form-data for optional foto upload
    parser_classes = [MultiPartParser, FormParser, JSONParser]

# LOGIN JWT
class LoginView(TokenObtainPairView):

    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        data = request.data or {}
        email = data.get('email')
        password = data.get('password')
        username = data.get('username')

        if email and not username:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({'detail': 'Correo no registrado'}, status=status.HTTP_400_BAD_REQUEST)
            username = user.username

        if not username or not password:
            return Response({'detail': 'Se requiere username/email y password'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data={'username': username, 'password': password})
        try:
            serializer.is_valid(raise_exception=True)
        except drf_serializers.ValidationError as exc:
            return Response({'detail': exc.detail}, status=status.HTTP_401_UNAUTHORIZED)

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            user = None

        profile_data = None
        if user:
            perfil, _ = Perfil.objects.get_or_create(user=user)
            profile_data = PerfilCompletoSerializer(perfil, context={'request': request}).data

        # Devolver tokens y datos de perfil
        response_data = dict(serializer.validated_data)
        response_data['profile'] = profile_data
        return Response(response_data, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """Cierra sesión invalidando (blacklist) el refresh token si está activado.

    Body esperado: { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': "Se requiere el token 'refresh' en el body."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except AttributeError:
            return Response({'detail': 'Blacklist no está activado. Habilita rest_framework_simplejwt.token_blacklist en INSTALLED_APPS para invalidar tokens en el servidor.'}, status=status.HTTP_501_NOT_IMPLEMENTED)
        except Exception as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'Logout exitoso'}, status=status.HTTP_205_RESET_CONTENT)


class PerfilUsuarioView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    # allow JSON and multipart/form-data (for uploading 'foto')
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_serializer_class(self):
        if self.request.method in ('PATCH', 'PUT'):
            from .serializers import PerfilUpdateSerializer
            return PerfilUpdateSerializer
        return PerfilCompletoSerializer

    def get_object(self):
        perfil, _ = Perfil.objects.get_or_create(user=self.request.user)
        return perfil

class CambiarPasswordView(generics.UpdateAPIView):
    serializer_class = CambiarPasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"old_password": ["Contraseña incorrecta"]}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Contraseña actualizada correctamente"}, status=status.HTTP_200_OK)

class EliminarCuentaView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
