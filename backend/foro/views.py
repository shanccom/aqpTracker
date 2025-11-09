from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action
from .models import Distrito, Estado, Incidencia, Reporte, TipoReaccion, Comentario, Reaccion, Notificacion, IncidenciaImagen
from .serializers import (
    DistritoSerializer, EstadoSerializer, IncidenciaSerializer,
    ReporteSerializer, TipoReaccionSerializer, ComentarioSerializer,
    ReaccionSerializer, NotificacionSerializer, IncidenciaMinSerializer
)
from django.shortcuts import get_object_or_404
from difflib import SequenceMatcher
from django.utils import timezone
from datetime import timedelta


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

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def mine(self, request):
        """Return incidencias created by the authenticated user."""
        perfil = getattr(request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=request.user).first()
        qs = Incidencia.objects.filter(usuario=perfil).order_by('-fecha_creacion')
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Create an incidencia, but try to match against existing incidencias first.

        Matching strategy (simple):
        - If lat/lon provided, search recent incidencias within a small radius (e.g., 200m)
        - Compute fuzzy similarity between titles (and descriptions) using SequenceMatcher
        - If a candidate exceeds the threshold, create a Reporte linking the user to that incidencia
          and return the existing incidencia instead of creating a duplicate.
        - Otherwise, create a normal incidencia and save any uploaded images from 'imagenes'.
        """
        perfil = getattr(request.user, 'perfil', None)
        if not perfil:
            from usuario.models import Perfil as PerfilModel
            perfil = PerfilModel.objects.filter(user=request.user).first()

        title = (request.data.get('titulo') or '').strip()
        description = (request.data.get('descripcion') or '').strip()

        # parse lat/lon if provided
        lat = request.data.get('latitud')
        lon = request.data.get('longitud')
        try:
            lat = float(lat) if lat not in (None, '', 'null') else None
            lon = float(lon) if lon not in (None, '', 'null') else None
        except Exception:
            lat = lon = None

        # search window
        candidates = Incidencia.objects.none()
        recent_cutoff = timezone.now() - timedelta(days=30)

        if lat is not None and lon is not None:
            # rough degree delta (approx): 1 deg lat ~ 111 km
            radius_km = 0.2  # 200 meters
            delta = radius_km / 111.0
            candidates = Incidencia.objects.filter(
                latitud__isnull=False, longitud__isnull=False,
                latitud__gte=lat - delta, latitud__lte=lat + delta,
                longitud__gte=lon - delta, longitud__lte=lon + delta,
                fecha_creacion__gte=recent_cutoff
            ).order_by('-fecha_creacion')[:50]
        else:
            # fallback: recent incidencias with similar words in title
            words = [w for w in title.split()[:4] if len(w) > 2]
            if words:
                q = None
                from django.db.models import Q
                for w in words:
                    q = (Q(titulo__icontains=w) | q) if q is not None else Q(titulo__icontains=w)
                candidates = Incidencia.objects.filter(q, fecha_creacion__gte=recent_cutoff).order_by('-fecha_creacion')[:50]

        # compute fuzzy similarity
        best = None
        best_score = 0.0
        for cand in candidates:
            score_title = SequenceMatcher(None, title.lower(), (cand.titulo or '').lower()).ratio() if title and cand.titulo else 0.0
            score_desc = SequenceMatcher(None, description.lower(), (cand.descripcion or '').lower()).ratio() if description and cand.descripcion else 0.0
            score = max(score_title, 0.7 * score_desc)
            if score > best_score:
                best_score = score
                best = cand

        MATCH_THRESHOLD = 0.7
        if best and best_score >= MATCH_THRESHOLD:
            # create a Reporte linking the user to the existing incidencia
            report, created = Reporte.objects.get_or_create(usuario=perfil, incidencia=best)
            serializer = self.get_serializer(best, context={'request': request})
            return Response({'matched': True, 'score': best_score, 'incidencia': serializer.data, 'report_created': created}, status=status.HTTP_200_OK)

        # otherwise create a new incidencia normally
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incidencia = serializer.save(usuario=perfil)

        # handle multiple uploaded images from the 'imagenes' field (multipart/form-data)
        files = request.FILES.getlist('imagenes') if hasattr(request, 'FILES') else []
        for idx, f in enumerate(files):
            IncidenciaImagen.objects.create(incidencia=incidencia, imagen=f, orden=idx)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


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


from rest_framework.views import APIView


class PreviewIncidenciasAPIView(APIView):
    """Lightweight endpoint for frontend preview of incidencias.

    Returns a compact list (using IncidenciaMinSerializer) filtered by:
      - district_id
      - estado (name or id)
      - lat,lng,radius (km)
      - from_date, to_date (YYYY-MM-DD or ISO)

    This endpoint is intentionally separate from the main ViewSet to avoid
    changing existing behavior.
    """
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, *args, **kwargs):
        params = request.query_params
        qs = Incidencia.objects.all().order_by('-fecha_creacion')

        # district filter: accept either id (district_id) or name (district)
        district_id = params.get('district_id')
        district_name = params.get('district')
        if district_id:
            try:
                qs = qs.filter(distrito_id=int(district_id))
            except Exception:
                pass
        elif district_name:
            qs = qs.filter(distrito__nombre__iexact=district_name)

        # estado filter (id or name)
        estado = params.get('estado')
        if estado:
            if estado.isdigit():
                qs = qs.filter(estado_id=int(estado))
            else:
                qs = qs.filter(estado__nombre__iexact=estado)

        # date range
        from django.utils.dateparse import parse_date, parse_datetime
        from datetime import datetime
        from_date = params.get('from_date')
        to_date = params.get('to_date')
        try:
            if from_date:
                dt_from = parse_datetime(from_date) or (parse_date(from_date) and datetime.combine(parse_date(from_date), datetime.min.time()))
                if dt_from:
                    qs = qs.filter(fecha_creacion__gte=dt_from)
            if to_date:
                dt_to = parse_datetime(to_date) or (parse_date(to_date) and datetime.combine(parse_date(to_date), datetime.max.time()))
                if dt_to:
                    qs = qs.filter(fecha_creacion__lte=dt_to)
        except Exception:
            # ignore invalid date formats, frontend should validate
            pass

        # proximity filter (approximate, degrees)
        lat = params.get('lat')
        lng = params.get('lng')
        if lat and lng:
            try:
                latf = float(lat); lngf = float(lng)
                radius_km = float(params.get('radius', 0.5))
                delta = radius_km / 111.0
                qs = qs.filter(latitud__isnull=False, longitud__isnull=False,
                               latitud__gte=latf - delta, latitud__lte=latf + delta,
                               longitud__gte=lngf - delta, longitud__lte=lngf + delta)
            except Exception:
                pass

        # limit results to protect the frontend
        limit = 200
        results = qs[:limit]

        serializer = IncidenciaMinSerializer(results, many=True, context={'request': request})
        return Response(serializer.data)
