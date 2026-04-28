from rest_framework import serializers
from .models import Offer, Category, Tag

class OfferSerializer(serializers.ModelSerializer):
    tags_list = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field='name', source='tags'
    )
    category_name = serializers.SlugRelatedField(
        read_only=True, slug_field='name', source='category'
    )

    class Meta:
        model = Offer
        fields = '__all__'
