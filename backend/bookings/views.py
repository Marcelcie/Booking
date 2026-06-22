from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth.models import User
from django.db.models import Prefetch, Sum, Count
from .models import Offer, Category, Tag, Booking, Favorite, UserProfile, Notification, OfferBlock, Room, FAQ
from .serializers import (
    OfferSerializer, 
    RegisterSerializer, 
    LoginSerializer,
    ContactMessageSerializer,
    BookingSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
    OwnerBookingSerializer,
    NotificationSerializer
)

# --- CUSTOM PERMISSIONS ---
class IsOwner(BasePermission):
    """Zezwala tylko właścicielom obiektów hotelowych."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return profile.is_owner

# --- HELPER: tworzenie powiadomień ---
def create_notification(user, message, notification_type, booking=None):
    Notification.objects.create(
        user=user,
        message=message,
        notification_type=notification_type,
        related_booking=booking
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
        serializer = OfferSerializer(offers, many=True, context={'request': request})
        return Response(serializer.data)

# --- OFERTY I RANKINGI ---

class OfferListView(APIView):
    """
    Zwraca listę wszystkich dostępnych ofert.
    Opcjonalne query params: check_in, check_out (format YYYY-MM-DD)
    """
    def get(self, request):
        offers = Offer.objects.filter(is_active=True).select_related('category').prefetch_related('tags', 'reviews', 'rooms', 'faqs')
        
        # Filtrowanie dostępności po datach
        check_in = request.query_params.get('check_in')
        check_out = request.query_params.get('check_out')
        
        # Filtrowanie po liczbie gości
        guests = request.query_params.get('guests')
        if guests:
            try:
                guests_int = int(guests)
                from django.db.models import Sum, F
                offers = offers.annotate(
                    total_capacity=Sum(F('rooms__capacity') * F('rooms__quantity'))
                ).filter(total_capacity__gte=guests_int).distinct()
            except ValueError:
                pass
                
        context = {'check_in': check_in, 'check_out': check_out, 'request': request}
        serializer = OfferSerializer(offers, many=True, context=context)
        return Response(serializer.data)

class OfferDetailView(APIView):
    """
    Zwraca szczegóły jednej konkretnej oferty po jej ID.
    """
    def get(self, request, pk):
        try:
            offer = Offer.objects.select_related('category').prefetch_related('tags', 'reviews').get(pk=pk, is_active=True)
            serializer = OfferSerializer(offer, context={'request': request})
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
                queryset=Offer.objects.filter(is_active=True).select_related('category').prefetch_related('tags', 'reviews')
            )
        ).all()
        data = {}
        for cat in categories:
            data[cat.name] = OfferSerializer(cat.offers.all(), many=True, context={'request': request}).data
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
            
            # Dodanie blokad właściciela
            blocks = offer.blocks.all()
            for b in blocks:
                booked_ranges.append({'from': b.start_date.strftime('%Y-%m-%d'), 'to': b.end_date.strftime('%Y-%m-%d')})
                
            return Response({'available': True, 'booked_dates': booked_ranges})
        
        overlapping_booking = Booking.objects.filter(
            offer=offer,
            status='confirmed',
            check_in__lt=check_out,
            check_out__gt=check_in
        ).exists()
        
        from datetime import datetime
        try:
            ci = datetime.strptime(check_in, '%Y-%m-%d').date()
            co = datetime.strptime(check_out, '%Y-%m-%d').date()
            overlapping_block = offer.blocks.filter(
                start_date__lt=co,
                end_date__gt=ci
            ).exists()
        except Exception:
            overlapping_block = False
            
        return Response({
            'available': not (overlapping_booking or overlapping_block),
            'offer_id': pk,
            'check_in': check_in,
            'check_out': check_out
        })

class RankingGroupedView(APIView):
    """
    Zwraca dynamiczne rankingi (top oceniane, najtańsze itp.).
    """
    def get(self, request):
        base_qs = Offer.objects.filter(is_active=True).select_related('category').prefetch_related('tags', 'reviews')
        from django.db.models import Min
        cheapest_qs = base_qs.annotate(
            min_room_price=Min('rooms__price')
        ).order_by('min_room_price', 'price')[:5]

        data = {
            'topRated': OfferSerializer(base_qs.order_by('-rating')[:5], many=True, context={'request': request}).data,
            'popular': OfferSerializer(base_qs.order_by('-reviews_count')[:5], many=True, context={'request': request}).data,
            'cheapest': OfferSerializer(cheapest_qs, many=True, context={'request': request}).data,
            'premium': OfferSerializer(base_qs.filter(stars=5).order_by('-rating')[:5], many=True, context={'request': request}).data
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
        serializer = BookingSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            booking = serializer.save(user=request.user)
            # --- Powiadomienie dla właściciela obiektu ---
            if booking.offer.owner:
                create_notification(
                    user=booking.offer.owner,
                    message=f"Nowa rezerwacja od {request.user.first_name or request.user.email} w '{booking.offer.title}' ({booking.check_in} – {booking.check_out}).",
                    notification_type='booking_created',
                    booking=booking
                )
            # --- Potwierdzenie dla gościa ---
            create_notification(
                user=request.user,
                message=f"Twoja rezerwacja w '{booking.offer.title}' ({booking.check_in} – {booking.check_out}) została potwierdzona!",
                notification_type='booking_confirmed',
                booking=booking
            )
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
        # --- Powiadomienie dla właściciela ---
        if booking.offer.owner:
            create_notification(
                user=booking.offer.owner,
                message=f"Gość {request.user.first_name or request.user.email} anulował rezerwację w '{booking.offer.title}' ({booking.check_in} – {booking.check_out}).",
                notification_type='booking_cancelled_guest',
                booking=booking
            )
        return Response({'message': 'Rezerwacja została anulowana.', 'status': 'cancelled'})

# --- WŁAŚCICIEL (OWNER) ---

class OwnerOfferListView(APIView):
    """Widok ofert stworzonych przez właściciela"""
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request):
        offers = Offer.objects.filter(owner=request.user).select_related('category').prefetch_related('tags', 'reviews')
        serializer = OfferSerializer(offers, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        data = request.data
        try:
            category_name = data.get('category', 'Inne')
            category, _ = Category.objects.get_or_create(display_name=category_name, defaults={'name': category_name.lower()})
            
            image_file = request.FILES.get('image')
            
            offer = Offer.objects.create(
                owner=request.user,
                category=category,
                title=data.get('title', 'Nowa oferta'),
                type=data.get('type', 'hotel'),
                location=data.get('location', 'Polska'),
                description=data.get('description', ''),
                price=data.get('price') or None,
                rating=0.0,
                stars=data.get('stars', 3),
                image_url=data.get('image_url', ''),
                image=image_file,
                is_active=str(data.get('is_active', 'true')).lower() == 'true'
            )
            
            # Obsługa tagów
            tags_raw = data.get('tags')
            if tags_raw:
                tags_list = []
                if isinstance(tags_raw, str):
                    if tags_raw.startswith('[') and tags_raw.endswith(']'):
                        import json
                        try:
                            tags_list = json.loads(tags_raw)
                        except Exception:
                            tags_list = [t.strip() for t in tags_raw.split(',') if t.strip()]
                    else:
                        tags_list = [t.strip() for t in tags_raw.split(',') if t.strip()]
                elif isinstance(tags_raw, list):
                    tags_list = tags_raw
                
                for tag_name in tags_list:
                    if tag_name:
                        tag, _ = Tag.objects.get_or_create(name=str(tag_name).lower().strip())
                        offer.tags.add(tag)
                        
            return Response(OfferSerializer(offer, context={'request': request}).data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OwnerOfferDetailView(APIView):
    """Aktualizacja lub usuwanie oferty właściciela (wspiera częściową aktualizację jak PATCH)"""
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk, owner=request.user)
            return Response(OfferSerializer(offer, context={'request': request}).data)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
            
    def patch(self, request, pk):
        return self.put(request, pk)

    def put(self, request, pk):
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
            
            if 'image' in request.FILES:
                offer.image = request.FILES['image']
            
            if 'is_active' in data:
                offer.is_active = str(data['is_active']).lower() == 'true'
            
            if 'category' in data:
                cat, _ = Category.objects.get_or_create(display_name=data['category'], defaults={'name': data['category'].lower()})
                offer.category = cat
                
            offer.save()
            
            if 'tags' in data:
                offer.tags.clear()
                tags_raw = data['tags']
                tags_list = []
                if isinstance(tags_raw, str):
                    if tags_raw.startswith('[') and tags_raw.endswith(']'):
                        import json
                        try:
                            tags_list = json.loads(tags_raw)
                        except Exception:
                            tags_list = [t.strip() for t in tags_raw.split(',') if t.strip()]
                    else:
                        tags_list = [t.strip() for t in tags_raw.split(',') if t.strip()]
                elif isinstance(tags_raw, list):
                    tags_list = tags_raw
                
                for tag_name in tags_list:
                    if tag_name:
                        tag, _ = Tag.objects.get_or_create(name=str(tag_name).lower().strip())
                        offer.tags.add(tag)
                        
            return Response(OfferSerializer(offer, context={'request': request}).data)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk, owner=request.user)
            offer.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OwnerBookingListView(APIView):
    """Widok rezerwacji w obiektach właściciela – z paginacją i filtrowaniem"""
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request):
        status_filter = request.query_params.get('status', None)
        offer_id_filter = request.query_params.get('offer_id', None)
        page = max(int(request.query_params.get('page', 1)), 1)
        per_page = min(int(request.query_params.get('per_page', 20)), 100)

        bookings = Booking.objects.filter(offer__owner=request.user).select_related('offer', 'user', 'user__profile').order_by('-created_at')
        if status_filter:
            bookings = bookings.filter(status=status_filter)
        if offer_id_filter:
            bookings = bookings.filter(offer_id=offer_id_filter)

        total = bookings.count()
        confirmed_count = Booking.objects.filter(offer__owner=request.user, status='confirmed').count()
        offset = (page - 1) * per_page
        serializer = OwnerBookingSerializer(bookings[offset:offset + per_page], many=True)
        return Response({
            'results': serializer.data,
            'total': total,
            'confirmed_count': confirmed_count,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page if total else 1,
        })

class OwnerBookingCancelView(APIView):
    """Anulowanie rezerwacji klienta przez właściciela"""
    permission_classes = [IsAuthenticated, IsOwner]
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.select_related('user', 'offer').get(pk=pk, offer__owner=request.user)
            if booking.status == 'cancelled':
                return Response({'error': 'Rezerwacja już jest anulowana'}, status=status.HTTP_400_BAD_REQUEST)
            booking.status = 'cancelled'
            booking.save()
            # Powiadomienie dla gościa
            create_notification(
                user=booking.user,
                message=f"Właściciel anulował Twoją rezerwację w '{booking.offer.title}' ({booking.check_in} – {booking.check_out}).",
                notification_type='booking_cancelled_owner',
                booking=booking
            )
            return Response({'message': 'Rezerwacja anulowana', 'status': 'cancelled'})
        except Booking.DoesNotExist:
            return Response({'error': 'Rezerwacja nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OwnerStatsView(APIView):
    """Statystyki i przychody właściciela"""
    permission_classes = [IsAuthenticated, IsOwner]

    def get(self, request):
        offers_count = Offer.objects.filter(owner=request.user).count()
        all_bookings = Booking.objects.filter(offer__owner=request.user)
        confirmed = all_bookings.filter(status='confirmed')
        total_revenue = confirmed.aggregate(total=Sum('total_price'))['total'] or 0
        return Response({
            'offers_count': offers_count,
            'total_bookings': all_bookings.count(),
            'confirmed_bookings': confirmed.count(),
            'total_revenue': float(total_revenue),
        })

# --- POWIADOMIENIA ---
class NotificationListView(APIView):
    """Lista powiadomień zalogowanego użytkownika"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:50]
        serializer = NotificationSerializer(notifications, many=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({
            'notifications': serializer.data,
            'unread_count': unread_count,
        })

class NotificationMarkReadView(APIView):
    """Oznaczanie powiadomienia jako przeczytane"""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        if pk:
            # Jedno konkretne powiadomienie
            try:
                n = Notification.objects.get(pk=pk, user=request.user)
                n.is_read = True
                n.save()
                return Response({'message': 'Oznaczono jako przeczytane'})
            except Notification.DoesNotExist:
                return Response({'error': 'Nie znaleziono'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Wszystkie nieprzeczytane
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            return Response({'message': 'Wszystkie oznaczono jako przeczytane'})

class OwnerOfferToggleActiveView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def post(self, request, pk):
        try:
            offer = Offer.objects.get(pk=pk, owner=request.user)
            offer.is_active = not offer.is_active
            offer.save()
            return Response({'is_active': offer.is_active})
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OwnerOfferBlockListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def get(self, request, offer_id):
        try:
            offer = Offer.objects.get(pk=offer_id, owner=request.user)
            blocks = offer.blocks.all().order_by('start_date')
            data = [{'id': b.id, 'start_date': b.start_date.strftime('%Y-%m-%d'), 'end_date': b.end_date.strftime('%Y-%m-%d')} for b in blocks]
            return Response(data)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
            
    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(pk=offer_id, owner=request.user)
            start_date_str = request.data.get('start_date')
            end_date_str = request.data.get('end_date')
            if not start_date_str or not end_date_str:
                return Response({'error': 'Podaj datę początkową i końcową.'}, status=status.HTTP_400_BAD_REQUEST)
                
            from datetime import datetime
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
            
            if start_date >= end_date:
                return Response({'error': 'Data początkowa musi być wcześniejsza niż końcowa.'}, status=status.HTTP_400_BAD_REQUEST)
                
            block = OfferBlock.objects.create(offer=offer, start_date=start_date, end_date=end_date)
            return Response({
                'id': block.id,
                'start_date': block.start_date.strftime('%Y-%m-%d'),
                'end_date': block.end_date.strftime('%Y-%m-%d')
            }, status=status.HTTP_201_CREATED)
        except Offer.DoesNotExist:
            return Response({'error': 'Oferta nie istnieje'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError:
            return Response({'error': 'Nieprawidłowy format daty (użyj RRRR-MM-DD).'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OwnerBlockDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def delete(self, request, pk):
        try:
            block = OfferBlock.objects.get(pk=pk, offer__owner=request.user)
            block.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except OfferBlock.DoesNotExist:
            return Response({'error': 'Blokada nie istnieje'}, status=status.HTTP_404_NOT_FOUND)

class OwnerRoomListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(pk=offer_id, owner=request.user)
            name = request.data.get('name', 'Pokój')
            capacity = int(request.data.get('capacity', 2))
            quantity = int(request.data.get('quantity', 1))
            price = float(request.data.get('price', 0.00))
            room = Room.objects.create(offer=offer, name=name, capacity=capacity, quantity=quantity, price=price)
            return Response({'id': room.id, 'name': room.name, 'capacity': room.capacity, 'quantity': room.quantity, 'price': room.price}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OwnerRoomDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def delete(self, request, pk):
        try:
            room = Room.objects.get(pk=pk, offer__owner=request.user)
            room.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Room.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class OwnerFAQListView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def post(self, request, offer_id):
        try:
            offer = Offer.objects.get(pk=offer_id, owner=request.user)
            question = request.data.get('question')
            answer = request.data.get('answer')
            if not question or not answer:
                return Response({'error': 'Brak pytania lub odpowiedzi'}, status=status.HTTP_400_BAD_REQUEST)
            faq = FAQ.objects.create(offer=offer, question=question, answer=answer)
            return Response({'id': faq.id, 'question': faq.question, 'answer': faq.answer}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OwnerFAQDetailView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]
    
    def delete(self, request, pk):
        try:
            faq = FAQ.objects.get(pk=pk, offer__owner=request.user)
            faq.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except FAQ.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

