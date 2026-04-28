from rest_framework import serializers
from .models import Offer

class OfferSerializer(serializers.ModelSerializer):
    tags_list = serializers.ListField(
        child=serializers.CharField(), source='get_tags_list', read_only=True
    )

    class Meta:
        model = Offer
        fields = '__all__'
