from django.urls import path

from .views import (
    RegisterView, 
    UserProfileView, 
    OfferListView, 
    OfferDetailView, 
    OfferGroupedView, 
    OfferAvailabilityView,
    RankingGroupedView,
    FavoriteListView,
    FavoriteToggleView,
    ContactMessageView,
    BookingListCreateView,
    BookingCancelView,
    ChangePasswordView,
    OwnerOfferListView,
    OwnerOfferDetailView,
    OwnerBookingListView,
    OwnerBookingCancelView
)

urlpatterns = [
    path('offers/', OfferListView.as_view(), name='offer-list'),
    path('offers/<int:pk>/', OfferDetailView.as_view(), name='offer-detail'),
    path('offers/<int:pk>/availability/', OfferAvailabilityView.as_view(), name='offer-availability'),
    path('grouped-offers/', OfferGroupedView.as_view(), name='grouped-offers'),
    path('ranking/', RankingGroupedView.as_view(), name='ranking-offers'),
    path('favorites/', FavoriteListView.as_view(), name='favorites-list'),
    path('favorites/toggle/<int:offer_id>/', FavoriteToggleView.as_view(), name='favorites-toggle'),
    path('register/', RegisterView.as_view(), name='register'),
    path('me/', UserProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('contact/',ContactMessageView.as_view(),name='contact'),
    path('bookings/', BookingListCreateView.as_view(), name='booking-list-create'),
    path('bookings/<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('owner/offers/', OwnerOfferListView.as_view(), name='owner-offers-list'),
    path('owner/offers/<int:pk>/', OwnerOfferDetailView.as_view(), name='owner-offers-detail'),
    path('owner/bookings/', OwnerBookingListView.as_view(), name='owner-bookings-list'),
    path('owner/bookings/<int:pk>/cancel/', OwnerBookingCancelView.as_view(), name='owner-bookings-cancel'),
]