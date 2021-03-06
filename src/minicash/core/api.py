from django.db import transaction
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework_bulk.mixins import BulkCreateModelMixin

from minicash.core.settings import minicash_settings
from minicash.utils.views import MassDeleteView
from .filters import RecordFilter
from .models import Record, Asset, Tag
from .permissions import IsAssetRemovable
from .serializers import (
    AssetSerializer,
    CreateAssetSerializer,
    CreateRecordSerializer,
    ReadRecordSerializer,
    TagSerializer,
    UpdateAssetSerializer,
)


class RecordsPagination(PageNumberPagination):
    page_size = minicash_settings.PAGINATOR_DEFAULT_PAGE_SIZE
    page_size_query_param = 'page_size'

    def get_paginated_response(self, data):
        return Response([
            {
                'links': {
                    'next': self.get_next_link(),
                    'previous': self.get_previous_link()
                },
                'count': self.page.paginator.count,
                'num_pages': self.page.paginator.num_pages,
                'page_size': self.get_page_size(self.request),
            },
            data
        ])


class RecordsView(BulkCreateModelMixin, ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = (IsAuthenticated,)
    filter_class = RecordFilter

    def get_queryset(self):
        return Record.objects.for_owner(self.request.user) \
                             .order_by('-created_dt')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ReadRecordSerializer
        else:
            return CreateRecordSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        super().perform_create(serializer)
        instances = self._get_serializer_instances(serializer)
        # assets on instances have to be refreshed when bulk-updates are performed
        refresh_assets = len(instances) > 1
        for instance in instances:
            instance.update_assets_after_create(refresh_assets=refresh_assets)

    @transaction.atomic
    def perform_update(self, serializer):
        old_delta = serializer.instance.delta
        old_asset_to = serializer.instance.asset_to
        old_asset_from = serializer.instance.asset_from

        super().perform_update(serializer)
        serializer.instance.update_assets_after_update(
            old_delta, old_asset_to, old_asset_from)

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.update_assets_before_destroy()
        super().perform_destroy(instance)

    def _get_serializer_instances(self, serializer):
        if not serializer.instance:
            return []
        elif isinstance(serializer.instance, list):
            return serializer.instance
        else:
            return [serializer.instance]


class RecordsDeleteView(MassDeleteView):
    model_class = Record

    @transaction.atomic
    def perform_destroy(self, instance):
        instance.update_assets_before_destroy()
        super().perform_destroy(instance)


class PaginatedRecordsView(RecordsView):
    pagination_class = RecordsPagination


class AssetsView(ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = (IsAuthenticated, IsAssetRemovable,)

    def get_queryset(self):
        return Asset.objects.for_owner(self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateAssetSerializer
        elif self.request.method in ['PUT', 'PATCH']:
            return UpdateAssetSerializer
        else:
            return AssetSerializer


class TagsView(ModelViewSet):
    authentication_classes = (SessionAuthentication, BasicAuthentication)
    permission_classes = (IsAuthenticated,)
    serializer_class = TagSerializer

    def get_queryset(self):
        return Tag.objects.for_owner(self.request.user)


class TagsDeleteView(MassDeleteView):
    model_class = Tag
