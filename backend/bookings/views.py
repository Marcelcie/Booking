from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Offer
from .serializers import OfferSerializer

class OfferListView(APIView):
    def get(self, request):
        offers = Offer.objects.all()
        serializer = OfferSerializer(offers, many=True)
        # Zwracamy w formacie zgodnym z frontendem.
        # Frontend oczekuje listy, a wewnątrz obiektów.
        # Format dla `script.js` (grupowanie po category) i `ranking.js` (grupowanie po ranking_category)
        return Response(serializer.data)

class OfferGroupedView(APIView):
    def get(self, request):
        # Dla script.js (strona główna) - grupowanie po kategoriach (wedrowki, wellness itp.)
        categories = ['wedrowki', 'wellness', 'festiwale', 'kultura', 'historyczne', 'rodzinne']
        data = {}
        for cat in categories:
            offers = Offer.objects.filter(category=cat)
            data[cat] = OfferSerializer(offers, many=True).data
        return Response(data)

class RankingGroupedView(APIView):
    def get(self, request):
        # Dla ranking.js
        categories = ['topRated', 'popular', 'cheapest', 'premium']
        data = {}
        for cat in categories:
            offers = Offer.objects.filter(ranking_category=cat)
            data[cat] = OfferSerializer(offers, many=True).data
        return Response(data)

class OfferDetailView(APIView):
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk)
            serializer = OfferSerializer(offer)
            return Response(serializer.data)
        except Offer.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
