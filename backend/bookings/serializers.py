from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Offer, Category, Tag, ContactMessage, Booking, Review, Notification, Room, FAQ

class ContactMessageSerializer(serializers.ModelSerializer):
    topic = serializers.CharField(source='subject', required=True)
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'topic', 'message']

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'author_name', 'rating', 'body', 'created_at']

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = ['id', 'name', 'capacity', 'quantity', 'price']

class FAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ['id', 'question', 'answer']

class OfferSerializer(serializers.ModelSerializer):
    tags_list = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field='name', source='tags'
    )
    category_name = serializers.SlugRelatedField(
        read_only=True, slug_field='name', source='category'
    )
    reviews = ReviewSerializer(many=True, read_only=True)
    rooms = RoomSerializer(many=True, read_only=True)
    faqs = FAQSerializer(many=True, read_only=True)
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = '__all__'
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            request = self.context.get('request')
            if request:
                data['image_url'] = request.build_absolute_uri(instance.image.url)
            else:
                data['image_url'] = instance.image.url
        return data

    def get_is_available(self, obj):
        """Domyślnie True, chyba że kontekst zawiera daty do sprawdzenia."""
        check_in = self.context.get('check_in')
        check_out = self.context.get('check_out')
        if not check_in or not check_out:
            return True
        # Sprawdź czy istnieje nakładająca się aktywna rezerwacja
        overlapping = Booking.objects.filter(
            offer=obj,
            status='confirmed',
            check_in__lt=check_out,
            check_out__gt=check_in
        ).exists()
        if overlapping:
            return False

        # Sprawdź nakładające się blokady właściciela
        from datetime import datetime
        try:
            ci = datetime.strptime(check_in, '%Y-%m-%d').date()
            co = datetime.strptime(check_out, '%Y-%m-%d').date()
            blocked = obj.blocks.filter(
                start_date__lt=co,
                end_date__gt=ci
            ).exists()
            return not blocked
        except Exception:
            return True

class BookingSerializer(serializers.ModelSerializer):
    offer_details = OfferSerializer(source='offer', read_only=True)
    
    class Meta:
        model = Booking
        fields = ['id', 'offer', 'offer_details', 'check_in', 'check_out', 
                  'guests', 'rooms', 'room_type', 'total_price', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']
    
    def validate(self, attrs):
        check_in = attrs.get('check_in')
        check_out = attrs.get('check_out')
        offer = attrs.get('offer')

        # Blokada rezerwacji własnego obiektu przez właściciela
        request = self.context.get('request')
        if request and offer and offer.owner_id and offer.owner_id == request.user.id:
            raise serializers.ValidationError("Nie możesz zarezerwować własnego obiektu.")
        
        if check_in and check_out:
            if check_in >= check_out:
                raise serializers.ValidationError("Data wymeldowania musi być późniejsza niż data zameldowania.")
            
            # Sprawdź nakładające się rezerwacje
            overlapping = Booking.objects.filter(
                offer=offer,
                status='confirmed',
                check_in__lt=check_out,
                check_out__gt=check_in
            ).exists()
            if overlapping:
                raise serializers.ValidationError(
                    "Ten obiekt jest już zarezerwowany w wybranym terminie. Wybierz inne daty."
                )

            # Sprawdź nakładające się blokady właściciela
            blocked = offer.blocks.filter(
                start_date__lt=check_out,
                end_date__gt=check_in
            ).exists()
            if blocked:
                raise serializers.ValidationError(
                    "Ten obiekt jest niedostępny w wybranym terminie (blokada właściciela)."
                )
        
        return attrs

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
    is_owner = serializers.BooleanField(required=False, default=False)

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
        # Create UserProfile with is_owner flag
        from .models import UserProfile
        UserProfile.objects.create(user=user, is_owner=validated_data.get('is_owner', False))
        return user

class UserProfileUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    phone = serializers.CharField(required=False, allow_blank=True)

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Nowe hasła się nie zgadzają.")
        if len(attrs['new_password']) < 8:
            raise serializers.ValidationError("Nowe hasło musi mieć co najmniej 8 znaków.")
        return attrs

class OwnerBookingSerializer(serializers.ModelSerializer):
    offer_details = OfferSerializer(source='offer', read_only=True)
    guest_name = serializers.CharField(source='user.first_name', read_only=True)
    guest_email = serializers.CharField(source='user.email', read_only=True)
    guest_phone = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = ['id', 'offer', 'offer_details', 'check_in', 'check_out', 
                  'guests', 'rooms', 'room_type', 'total_price', 'status', 'created_at',
                  'guest_name', 'guest_email', 'guest_phone']
        read_only_fields = ['status', 'created_at']

    def get_guest_phone(self, obj):
        try:
            return obj.user.profile.phone
        except Exception:
            return ''

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'notification_type', 'is_read', 'created_at', 'related_booking']
        read_only_fields = ['id', 'message', 'notification_type', 'created_at', 'related_booking']