from django.urls import path
from .views import OfferListView, OfferGroupedView, RankingGroupedView, OfferDetailView

urlpatterns = [
    path('offers/', OfferListView.as_view(), name='offer-list'),
    path('offers/<int:pk>/', OfferDetailView.as_view(), name='offer-detail'),
    path('grouped-offers/', OfferGroupedView.as_view(), name='grouped-offers'),
    path('ranking/', RankingGroupedView.as_view(), name='ranking-offers'),
]
