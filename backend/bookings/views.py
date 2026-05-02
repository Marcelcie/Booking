from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import login
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from .models import Offer, Category
from .serializers import (
    OfferSerializer, 
    RegisterSerializer, 
    LoginSerializer
)

# --- REJESTRACJA I LOGOWANIE ---
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

class LoginView(APIView):
    """
    Logowanie użytkownika
    """
    def post(self,request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            login(request,user)
            return Response(
                {"message":"Zalogowano poprawnie"},status=status.HTTP_200_OK   
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
        return Response({
            'name': user.first_name or user.username,
            'email': user.email,
            'role': 'user'
        })

# --- ULUBIONE (WATCHLIST) ---
from .models import Favorite

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
        favorites = Favorite.objects.filter(user=request.user)
        offers = [fav.offer for fav in favorites]
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

# --- OFERTY I RANKINGI ---

class OfferListView(APIView):
    """
    Zwraca listę wszystkich dostępnych ofert.
    """
    def get(self, request):
        offers = Offer.objects.all()
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

class OfferDetailView(APIView):
    """
    Zwraca szczegóły jednej konkretnej oferty po jej ID.
    """
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
            serializer = OfferSerializer(offer)
            return Response(serializer.data)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OfferGroupedView(APIView):
    """
    Zwraca oferty pogrupowane według kategorii.
    """
    def get(self, request):
        categories = Category.objects.all()
        data = {}
        for cat in categories:
            offers = Offer.objects.filter(category=cat)
            data[cat.name] = OfferSerializer(offers, many=True).data
        return Response(data)

class RankingGroupedView(APIView):
    """
    Zwraca dynamiczne rankingi (top oceniane, najtańsze itp.).
    """
    def get(self, request):
        data = {
            'topRated': OfferSerializer(Offer.objects.order_by('-rating')[:5], many=True).data,
            'popular': OfferSerializer(Offer.objects.order_by('-reviews_count')[:5], many=True).data,
            'cheapest': OfferSerializer(Offer.objects.order_by('price')[:5], many=True).data,
            'premium': OfferSerializer(Offer.objects.filter(stars=5).order_by('-rating')[:5], many=True).data
        }
        return Response(data)
