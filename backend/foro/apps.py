from django.apps import AppConfig


class ForoConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "foro"

    def ready(self):
        # import signals to connect post_save handlers
        try:
            from . import signals  # noqa: F401
        except Exception:
            # avoid breaking imports during migrations if something is not ready
            pass
