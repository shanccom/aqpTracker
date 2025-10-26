from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action
from .models import Distrito, Estado, Incidencia, Reporte, TipoReaccion, Comentario, Reaccion, Notificacion
from .serializers import (
    DistritoSerializer, EstadoSerializer, IncidenciaSerializer,
    ReporteSerializer, TipoReaccionSerializer, ComentarioSerializer,
    ReaccionSerializer, NotificacionSerializer
)
from django.shortcuts import get_object_or_404


class DistritoViewSet(viewsets.ModelViewSet):
    queryset = Distrito.objects.all()
    serializer_class = DistritoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class EstadoViewSet(viewsets.ModelViewSet):
    queryset = Estado.objects.all()
    serializer_class = EstadoSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class IncidenciaViewSet(viewsets.ModelViewSet):
    queryset = Incidencia.objects.all().order_by('-fecha_creacion')
    serializer_class = IncidenciaSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        # set usuario as the Perfil of the requesting user (if exists)
        perfil = getattr(self.request.user, 'perfil', None)
        if not perfil:
            # try to fetch Perfil by user relation
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=self.request.user).first()
        serializer.save(usuario=perfil)


class ComentarioViewSet(viewsets.ModelViewSet):
    queryset = Comentario.objects.all().order_by('fecha_creacion')
    serializer_class = ComentarioSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        perfil = getattr(self.request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=self.request.user).first()
        serializer.save(usuario=perfil)


class ReaccionViewSet(viewsets.ModelViewSet):
    queryset = Reaccion.objects.all().order_by('-fecha')
    serializer_class = ReaccionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        perfil = getattr(self.request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=self.request.user).first()
        serializer.save(usuario=perfil)


class ReporteViewSet(viewsets.ModelViewSet):
    queryset = Reporte.objects.all().order_by('-fecha_reporte')
    serializer_class = ReporteSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        perfil = getattr(self.request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=self.request.user).first()
        serializer.save(usuario=perfil)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Return reportes created by the authenticated user (paginated)."""
        perfil = getattr(request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=request.user).first()
        qs = self.queryset.filter(usuario=perfil)
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class TipoReaccionViewSet(viewsets.ModelViewSet):
    queryset = TipoReaccion.objects.all()
    serializer_class = TipoReaccionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class NotificacionViewSet(viewsets.ModelViewSet):
    queryset = Notificacion.objects.all().order_by('-fecha_creacion')
    serializer_class = NotificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # limit notifications to the current user
        perfil = getattr(self.request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=self.request.user).first()
        return Notificacion.objects.filter(usuario=perfil).order_by('-fecha_creacion')
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_all_read(self, request):
        """Mark all notifications for the current user as read."""
        perfil = getattr(request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=request.user).first()
        qs = Notificacion.objects.filter(usuario=perfil, leida=False)
        updated = qs.update(leida=True)
        return Response({'marked': updated}, status=status.HTTP_200_OK)
from django.shortcuts import render

# Create your views here.
