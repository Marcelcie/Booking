from django.urls import path

from .views import (
    RegisterView, 
    LoginView, 
    UserProfileView, 
    OfferListView, 
    OfferDetailView, 
    OfferGroupedView, 
    RankingGroupedView,
    FavoriteListView,
    FavoriteToggleView
)

urlpatterns = [
    path('offers/', OfferListView.as_view(), name='offer-list'),
    path('offers/<int:pk>/', OfferDetailView.as_view(), name='offer-detail'),
    path('grouped-offers/', OfferGroupedView.as_view(), name='grouped-offers'),
    path('ranking/', RankingGroupedView.as_view(), name='ranking-offers'),
    path('favorites/', FavoriteListView.as_view(), name='favorites-list'),
    path('favorites/toggle/<int:offer_id>/', FavoriteToggleView.as_view(), name='favorites-toggle'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),    
    path('me/', UserProfileView.as_view(), name='user-profile'),
]