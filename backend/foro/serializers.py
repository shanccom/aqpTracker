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

    class Meta:
        model = Perfil
        fields = ['id', 'email', 'first_name', 'last_name']


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


class ReporteSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)

    class Meta:
        model = Reporte
        fields = ['id', 'usuario', 'incidencia', 'fecha_reporte']


class NotificacionSerializer(serializers.ModelSerializer):
    usuario = PerfilMinSerializer(read_only=True)

    class Meta:
        model = Notificacion
        fields = ['id', 'usuario', 'mensaje', 'incidencia', 'leida', 'fecha_creacion']
