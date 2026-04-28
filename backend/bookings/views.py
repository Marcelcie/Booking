from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Offer, Category
from .serializers import OfferSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated

class OfferListView(APIView):
    def get(self, request):
        offers = Offer.objects.all()
        serializer = OfferSerializer(offers, many=True)
        return Response(serializer.data)

class OfferGroupedView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        data = {}
        for cat in categories:
            offers = Offer.objects.filter(category=cat)
            data[cat.name] = OfferSerializer(offers, many=True).data
        return Response(data)

class RankingGroupedView(APIView):
    def get(self, request):
        # Generujemy rankingi dynamicznie
        data = {
            'topRated': OfferSerializer(Offer.objects.order_by('-rating')[:5], many=True).data,
            'popular': OfferSerializer(Offer.objects.order_by('-reviews_count')[:5], many=True).data,
            'cheapest': OfferSerializer(Offer.objects.order_by('price')[:5], many=True).data,
            'premium': OfferSerializer(Offer.objects.filter(stars=5).order_by('-rating')[:5], many=True).data
        }
        return Response(data)

class OfferDetailView(APIView):
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
            serializer = OfferSerializer(offer)
            return Response(serializer.data)
        except Offer.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

class RegisterView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        fullname = request.data.get('fullname', '')

        if not email or not password:
            return Response({'error': 'Email and password are required'}, status=400)
            
        if User.objects.filter(username=email).exists():
            return Response({'error': 'User already exists'}, status=400)
            
        user = User.objects.create_user(username=email, email=email, password=password)
        user.first_name = fullname
        user.save()
        
        return Response({'message': 'User created successfully'})

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'name': user.first_name or user.username,
            'email': user.email,
            'role': 'user'
        })
