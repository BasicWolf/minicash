from django_filters import rest_framework as filters

from .models import Asset, Record, Tag


def user_tags(request):
    return Tag.objects.for_owner(request.user)

def user_assets(request):
    return Asset.objects.for_owner(request.user)


class RecordFilter(filters.FilterSet):
    dt_from = filters.DateTimeFilter(name='created_dt', lookup_expr='gte')
    dt_to = filters.DateTimeFilter(name='created_dt', lookup_expr='lte')
    tags_or = filters.ModelMultipleChoiceFilter(
        name='tags__name',
        to_field_name='name',
        queryset=user_tags,
        conjoined=False,
    )
    tags_and = filters.ModelMultipleChoiceFilter(
        name='tags__name',
        to_field_name='name',
        queryset=user_tags,
        conjoined=True,
    )

    assets_from = filters.ModelMultipleChoiceFilter(
        name='asset_from',
        queryset=user_assets,
        conjoined=False,
    )

    assets_to = filters.ModelMultipleChoiceFilter(
        name='asset_to',
        queryset=user_assets,
        conjoined=False,
    )

    class Meta:
        model = Record
        fields = [
            'assets_from',
            'assets_to',
            'dt_from',
            'dt_to',
            'tags_and',
            'tags_or'
        ]