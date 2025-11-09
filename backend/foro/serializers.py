from rest_framework import serializers
from .models import Distrito, Estado, Incidencia, Reporte, TipoReaccion, Comentario, Reaccion, Notificacion, IncidenciaImagen
from usuario.models import Perfil


class DistritoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Distrito
        fields = ['id', 'nombre', 'descripcion']


class EstadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estado
        fields = ['id', 'nombre', 'descripcion']


class PerfilMinSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    foto = serializers.SerializerMethodField()

    class Meta:
        model = Perfil
        fields = ['id', 'email', 'first_name', 'last_name', 'foto']

    def get_foto(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        if obj.foto:
            try:
                return request.build_absolute_uri(obj.foto.url) if request else obj.foto.url
            except Exception:
                return obj.foto.url
        # no foto set
        from django.conf import settings
        placeholder = (settings.STATIC_URL or '/') + 'img/profile.jpg'
        return request.build_absolute_uri(placeholder) if request else placeholder


class ComentarioSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)
    respuestas = serializers.SerializerMethodField()

    class Meta:
        model = Comentario
        fields = ['id', 'usuario', 'incidencia', 'contenido', 'respuesta_a', 'respuestas', 'fecha_creacion']

    def get_respuestas(self, obj):
        qs = obj.respuestas.all().order_by('fecha_creacion')
        return ComentarioSerializer(qs, many=True).data


class TipoReaccionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoReaccion
        fields = ['id', 'nombre', 'emoji', 'descripcion']


class ReaccionSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)
    tipo = serializers.PrimaryKeyRelatedField(queryset=TipoReaccion.objects.all(), write_only=False)

    def to_representation(self, instance):
        # Use nested representation for tipo on output
        rep = super().to_representation(instance)
        rep['tipo'] = TipoReaccionSerializer(instance.tipo).data if instance.tipo else None
        return rep

    class Meta:
        model = Reaccion
        fields = ['id', 'usuario', 'incidencia', 'comentario', 'tipo', 'fecha']


class IncidenciaSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)
    distrito = DistritoSerializer(read_only=True)
    estado = EstadoSerializer(read_only=True)
    comentarios = ComentarioSerializer(many=True, read_only=True)
    reacciones = ReaccionSerializer(many=True, read_only=True)
    imagenes = serializers.SerializerMethodField()
    reports_count = serializers.SerializerMethodField()
    primer_reportero = serializers.SerializerMethodField()

    class Meta:
        model = Incidencia
        fields = [
            'id', 'usuario', 'titulo', 'descripcion', 'distrito',
            'direccion',
            'latitud', 'longitud', 'estado', 'fecha_creacion', 'fecha_actualizacion',
            'imagenes', 'reports_count', 'primer_reportero', 'comentarios', 'reacciones'
        ]

    def get_imagenes(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        imgs = []
        for im in obj.imagenes.all():
            try:
                url = request.build_absolute_uri(im.imagen.url) if request else im.imagen.url
            except Exception:
                url = im.imagen.url
            imgs.append({'id': im.id, 'url': url})
        # fallback to legacy imagen field if no related images
        legacy_imagen = getattr(obj, 'imagen', None)
        if not imgs and legacy_imagen:
            try:
                url = request.build_absolute_uri(legacy_imagen.url) if request else legacy_imagen.url
            except Exception:
                url = legacy_imagen.url
            imgs.append({'id': None, 'url': url})
        return imgs

    def get_reports_count(self, obj):
        return obj.reporte_set.count()

    def get_primer_reportero(self, obj):
        first = obj.reporte_set.order_by('fecha_reporte').select_related('usuario').first()
        if not first:
            return None
        return PerfilMinSerializer(first.usuario, context=self.context).data


class IncidenciaMinSerializer(serializers.ModelSerializer):
    """Compact incidencia representation for lists (used inside Reporte list)."""
    # include a minimal usuario representation so the frontend can show the owner
    usuario = PerfilMinSerializer(read_only=True)
    fecha_creacion = serializers.DateTimeField(read_only=True)
    descripcion = serializers.SerializerMethodField()
    distrito = serializers.CharField(source='distrito.nombre', read_only=True)
    estado = serializers.CharField(source='estado.nombre', read_only=True)
    imagen = serializers.SerializerMethodField()
    reports_count = serializers.SerializerMethodField()
    comentarios_count = serializers.SerializerMethodField()
    reacciones_count = serializers.SerializerMethodField()

    class Meta:
        model = Incidencia
        fields = [
            'id', 'titulo', 'imagen', 'descripcion', 'usuario', 'fecha_creacion',
            'distrito', 'estado', 'direccion', 'latitud', 'longitud', 'comentarios_count',
            'reacciones_count', 'reports_count'
        ]

    def get_comentarios_count(self, obj):
        return obj.comentarios.count()

    def get_reacciones_count(self, obj):
        return obj.reacciones.count()

    def get_imagen(self, obj):
        # return absolute URL for image, or a default static placeholder
        request = self.context.get('request') if hasattr(self, 'context') else None
        # prefer first related image
        first = obj.imagenes.first() if hasattr(obj, 'imagenes') else None
        if first:
            try:
                return request.build_absolute_uri(first.imagen.url) if request else first.imagen.url
            except Exception:
                return first.imagen.url
        legacy_imagen = getattr(obj, 'imagen', None)
        if legacy_imagen:
            try:
                return request.build_absolute_uri(legacy_imagen.url) if request else legacy_imagen.url
            except Exception:
                return legacy_imagen.url
        # fallback to a static placeholder (ensure this file exists under STATICFILES)
        from django.conf import settings
        placeholder = (settings.STATIC_URL or '/') + 'img/incidencia.png'
        return request.build_absolute_uri(placeholder) if request else placeholder

    def get_descripcion(self, obj):
        # provide a short preview for list views (truncate to avoid large payloads)
        txt = (obj.descripcion or '')
        return txt if len(txt) <= 300 else txt[:297] + '...'

    def get_reports_count(self, obj):
        return obj.reporte_set.count()


class IncidenciaImagenSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = IncidenciaImagen
        fields = ['id', 'url']

    def get_url(self, obj):
        request = self.context.get('request') if hasattr(self, 'context') else None
        try:
            return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
        except Exception:
            return obj.imagen.url


class ReporteSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)
    # nested read-only incidencia summary
    incidencia = IncidenciaMinSerializer(read_only=True)
    # allow writing incidencia by id (write-only)
    incidencia_id = serializers.PrimaryKeyRelatedField(write_only=True, source='incidencia', queryset=Incidencia.objects.all())

    class Meta:
        model = Reporte
        fields = ['id', 'usuario', 'incidencia', 'incidencia_id', 'fecha_reporte']


class NotificacionSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)
    actor = PerfilMinSerializer(read_only=True)
    incidencia = IncidenciaMinSerializer(read_only=True)

    class Meta:
        model = Notificacion
        fields = ['id', 'usuario', 'actor', 'mensaje', 'incidencia', 'leida', 'fecha_creacion']
