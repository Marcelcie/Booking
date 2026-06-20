from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db.models import Prefetch
from rest_framework.permissions import IsAuthenticated
from .models import Offer, Category, Booking, Favorite, UserProfile
from .serializers import (
    OfferSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ContactMessageSerializer,
    BookingSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    OwnerBookingSerializer
)

# --- REJESTRACJA ---
class RegisterView(APIView):
    """
    rejestracja uzytkownika
    """
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Konto utworzone poprawnie"},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- PROFIL UŻYTKOWNIKA ---

class UserProfileView(APIView):
    """
    Zwraca dane zalogowanego użytkownika. 
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response({
            'name': user.first_name or user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'phone': profile.phone,
            'role': 'owner' if getattr(profile, 'is_owner', False) else 'user'
        })
    
    def put(self, request):
        """Aktualizacja profilu użytkownika."""
        serializer = UserProfileUpdateSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if 'first_name' in serializer.validated_data:
                user.first_name = serializer.validated_data['first_name']
            if 'last_name' in serializer.validated_data:
                user.last_name = serializer.validated_data['last_name']
            if 'email' in serializer.validated_data:
                user.email = serializer.validated_data['email']
            user.save()
            
            profile, _ = UserProfile.objects.get_or_create(user=user)
            if 'phone' in serializer.validated_data:
                profile.phone = serializer.validated_data['phone']
                profile.save()
            
            return Response({'message': 'Profil zaktualizowany pomyślnie.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    """
    Zmiana hasła zalogowanego użytkownika.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data['current_password']):
                return Response(
                    {'error': 'Obecne hasło jest nieprawidłowe.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Hasło zmienione pomyślnie.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# --- ULUBIONE (WATCHLIST) ---

class FavoriteToggleView(APIView):
    """
    Dodaje lub usuwa ofertę z listy ulubionych zalogowanego użytkownika.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(pk=offer_id)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
            
        favorite, created = Favorite.objects.get_or_create(user=request.user, offer=offer)
        
        if not created:
            favorite.delete()
            return Response({'status': 'removed'}, status=status.HTTP_200_OK)
            
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)

class FavoriteListView(APIView):
    """
    Pobiera listę ulubionych ofert zalogowanego użytkownika.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('offer', 'offer__category').prefetch_related('offer__tags', 'offer__reviews')
        offers = [fav.offer for fav in favorites]
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

# --- OFERTY I RANKINGI ---

class OfferListView(APIView):
    """
    Zwraca listę wszystkich dostępnych ofert.
    Opcjonalne query params: check_in, check_out (format YYYY-MM-DD)
    """
    def get(self, request):
        offers = Offer.objects.select_related('category').prefetch_related('tags', 'reviews').all()
        
        # Filtrowanie dostępności po datach
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        context = {'check_in': check_in, 'check_out': check_out}
        serializer = OfferSerializer(offers, many=True, context=context)
        return Response(serializer.data)

class OfferDetailView(APIView):
    """
    Zwraca szczegóły jednej konkretnej oferty po jej ID.
    """
    def get(self, request, pk):
        try:
            offer = Offer.objects.select_related('category').prefetch_related('tags', 'reviews').get(pk=pk)
            serializer = OfferSerializer(offer)
            return Response(serializer.data)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OfferGroupedView(APIView):
    """
    Zwraca oferty pogrupowane według kategorii.
    """
    def get(self, request):
        categories = Category.objects.prefetch_related(
            Prefetch(
                'offers',
                queryset=Offer.objects.select_related('category').prefetch_related('tags', 'reviews')
            )
        ).all()
        data = {}
        for cat in categories:
            data[cat.name] = OfferSerializer(cat.offers.all(), many=True).data
        return Response(data)

class OfferAvailabilityView(APIView):
    """
    Sprawdza dostępność oferty w podanym terminie.
    """
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        if not check_in or not check_out:
            bookings = Booking.objects.filter(offer=offer, status='confirmed')
            booked_ranges = [{'from': b.check_in, 'to': b.check_out} for b in bookings]
            return Response({'available': True, 'booked_dates': booked_ranges})
        
        overlapping = Booking.objects.filter(
            offer=offer,
            status='confirmed',
            check_in__lt=check_out,
            check_out__gt=check_in
        ).exists()
        
        return Response({
            'available': not overlapping,
            'offer_id': pk,
            'check_in': check_in,
            'check_out': check_out
        })

class RankingGroupedView(APIView):
    """
    Zwraca dynamiczne rankingi (top oceniane, najtańsze itp.).
    """
    def get(self, request):
        base_qs = Offer.objects.select_related('category').prefetch_related('tags', 'reviews')
        data = {
            'topRated': OfferSerializer(base_qs.order_by('-rating')[:5], many=True).data,
            'popular': OfferSerializer(base_qs.order_by('-reviews_count')[:5], many=True).data,
            'cheapest': OfferSerializer(base_qs.order_by('price')[:5], many=True).data,
            'premium': OfferSerializer(base_qs.filter(stars=5).order_by('-rating')[:5], many=True).data
        }
        return Response(data)

class ContactMessageView(APIView):
    """
    Formularz kontaktowy
    """
    authentication_classes = []
    permission_classes = []
    
    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message':'Wiadomosc zostala wyslana pomyślnie.'},status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingListCreateView(APIView):
    """
    Lista i tworzenie rezerwacji dla zalogowanego użytkownika
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookingCancelView(APIView):
    """
    Anulowanie rezerwacji zalogowanego użytkownika
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk, user=request.user)
        except Booking.DoesNotExist:
            return Response({'error': 'Rezerwacja nie istnieje.'}, status=status.HTTP_404_NOT_FOUND)
        
        if booking.status == 'cancelled':
            return Response({'error': 'Ta rezerwacja jest już anulowana.'}, status=status.HTTP_400_BAD_REQUEST)
        
        booking.status = 'cancelled'
        booking.save()
        return Response({'message': 'Rezerwacja została anulowana.', 'status': 'cancelled'})

# --- WŁAŚCICIEL (OWNER) ---

class OwnerOfferListView(APIView):
    """Widok ofert stworzonych przez właściciela"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not getattr(request.user.profile, 'is_owner', False):
            return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
        offers = Offer.objects.filter(owner=request.user).select_related('category').prefetch_related('tags', 'reviews')
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not getattr(request.user.profile, 'is_owner', False):
            return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
        
        data = request.data
        try:
            category_name = data.get('category', 'Inne')
            category, _ = Category.objects.get_or_create(display_name=category_name, defaults={'name': category_name.lower()})
            
            offer = Offer.objects.create(
                owner=request.user,
                category=category,
                title=data.get('title', 'Nowa oferta'),
                type=data.get('type', 'hotel'),
                location=data.get('location', 'Polska'),
                description=data.get('description', ''),
                price=data.get('price', 100),
                rating=0.0,
                stars=data.get('stars', 3),
                image_url=data.get('image_url', 'https://images.unsplash.com/photo-1566073771259-6a8506099945')
            )
            return Response(OfferSerializer(offer).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OwnerOfferDetailView(APIView):
    """Aktualizacja lub usuwanie oferty właściciela"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, pk):
        if not getattr(request.user.profile, 'is_owner', False):
            return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
        try:
            offer = Offer.objects.get(pk=pk, owner=request.user)
            data = request.data
            
            if 'title' in data: offer.title = data['title']
            if 'type' in data: offer.type = data['type']
            if 'location' in data: offer.location = data['location']
            if 'price' in data: offer.price = int(data['price'])
            if 'description' in data: offer.description = data['description']
            if 'stars' in data: offer.stars = int(data['stars'])
            if 'image_url' in data: offer.image_url = data['image_url']
            if 'category' in data:
                cat, _ = Category.objects.get_or_create(display_name=data['category'], defaults={'name': data['category'].lower()})
                offer.category = cat
                
            offer.save()
            return Response(OfferSerializer(offer).data)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        if not getattr(request.user.profile, 'is_owner', False):
            return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
        try:
            offer = Offer.objects.get(pk=pk, owner=request.user)
            offer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OwnerBookingListView(APIView):
    """Widok rezerwacji w obiektach właściciela"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not getattr(request.user.profile, 'is_owner', False):
            return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
        bookings = Booking.objects.filter(offer__owner=request.user).select_related('offer', 'user', 'user__profile')
        serializer = OwnerBookingSerializer(bookings, many=True)
        return Response(serializer.data)

class OwnerBookingCancelView(APIView):
    """Anulowanie rezerwacji klienta przez właściciela"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        if not getattr(request.user.profile, 'is_owner', False):
            return Response({'error': 'Brak uprawnień'}, status=status.HTTP_403_FORBIDDEN)
        try:
            booking = Booking.objects.get(pk=pk, offer__owner=request.user)
            if booking.status == 'cancelled':
                return Response({'error': 'Rezerwacja już jest anulowana'}, status=status.HTTP_400_BAD_REQUEST)
            booking.status = 'cancelled'
            booking.save()
            return Response({'message': 'Rezerwacja anulowana', 'status': 'cancelled'})
        except Booking.DoesNotExist:
            return Response({'error': 'Rezerwacja nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

