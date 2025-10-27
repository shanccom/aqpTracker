from rest_framework import serializers
from .models import Distrito, Estado, Incidencia, Reporte, TipoReaccion, Comentario, Reaccion, Notificacion
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

    class Meta:
        model = Incidencia
        fields = [
            'id', 'usuario', 'titulo', 'descripcion', 'imagen', 'distrito',
            'latitud', 'longitud', 'estado', 'fecha_creacion', 'fecha_actualizacion',
            'comentarios', 'reacciones'
        ]


class IncidenciaMinSerializer(serializers.ModelSerializer):
    """Compact incidencia representation for lists (used inside Reporte list)."""
    distrito = serializers.CharField(source='distrito.nombre', read_only=True)
    estado = serializers.CharField(source='estado.nombre', read_only=True)
    imagen = serializers.SerializerMethodField()
    comentarios_count = serializers.SerializerMethodField()
    reacciones_count = serializers.SerializerMethodField()

    class Meta:
        model = Incidencia
        fields = ['id', 'titulo', 'imagen', 'distrito', 'estado', 'latitud', 'longitud', 'comentarios_count', 'reacciones_count']

    def get_comentarios_count(self, obj):
        return obj.comentarios.count()

    def get_reacciones_count(self, obj):
        return obj.reacciones.count()

    def get_imagen(self, obj):
        # return absolute URL for image, or a default static placeholder
        request = self.context.get('request') if hasattr(self, 'context') else None
        if obj.imagen:
            try:
                return request.build_absolute_uri(obj.imagen.url) if request else obj.imagen.url
            except Exception:
                return obj.imagen.url
        # fallback to a static placeholder (ensure this file exists under STATICFILES)
        from django.conf import settings
        placeholder = (settings.STATIC_URL or '/') + 'img/incidencia.png'
        return request.build_absolute_uri(placeholder) if request else placeholder


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
