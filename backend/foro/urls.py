from rest_framework.routers import DefaultRouter
from .views import (
    DistritoViewSet, EstadoViewSet, IncidenciaViewSet,
    ComentarioViewSet, ReaccionViewSet, ReporteViewSet,
    TipoReaccionViewSet, NotificacionViewSet
)

router = DefaultRouter()
router.register(r'distritos', DistritoViewSet)
router.register(r'estados', EstadoViewSet)
router.register(r'incidencias', IncidenciaViewSet)
router.register(r'comentarios', ComentarioViewSet)
router.register(r'reacciones', ReaccionViewSet)
router.register(r'reportes', ReporteViewSet)
router.register(r'tiporeacciones', TipoReaccionViewSet)
router.register(r'notificaciones', NotificacionViewSet)

urlpatterns = router.urls
