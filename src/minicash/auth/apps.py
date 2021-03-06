from django.apps import AppConfig


class AuthConfig(AppConfig):
    name = 'minicash.auth'
    label = 'minicash_auth'

    def ready(self):
        from . import signals  # noqa: F401; pylint: disable=unused-variable
