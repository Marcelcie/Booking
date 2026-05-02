from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
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

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError("Błędny login lub hasło.")        
        attrs['user'] = user
        return attrs
    
class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    fullname = serializers.CharField(required=True)

    def validate(self, attrs):
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError("Użytkownik z tym adresem e-mail już istnieje.")
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Hasła się nie zgadzają.")
        if not attrs['password'] or len(attrs['password']) < 8:
            raise serializers.ValidationError("Hasło musi mieć co najmniej 8 znaków.")
        if not attrs['fullname']:
            raise serializers.ValidationError("Imię i nazwisko jest wymagane.")
        return attrs
    
    def create(self, validated_data):
        """
        tworzenie uzytkownika na podstawie formularza rejestracji
        """
        user = User.objects.create_user(
            first_name=validated_data.get('fullname', ''),
            email = validated_data['email'],
            password = validated_data['password'],
            username = validated_data['email'],
        )
        return user

    
    