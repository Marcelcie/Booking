from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone

# --- TAGI ---
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    
    class Meta:
        verbose_name = "Tag"
        verbose_name_plural = "Tagi"
        
    def __str__(self):
        return self.name

# --- KATEGORIE ---
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    
    class Meta:
        verbose_name = "Kategoria"
        verbose_name_plural = "Kategorie"
        
    def __str__(self):
        return self.display_name

# --- OFERTY ---
class Offer(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='offers')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='owned_offers', verbose_name="Właściciel")
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    description = models.TextField()
    price = models.IntegerField()
    rating = models.FloatField()
    stars = models.IntegerField()
    reviews_count = models.IntegerField(default=0)
    image_url = models.URLField(max_length=1000, blank=True, null=True)
    image = models.ImageField(upload_to='offers/', null=True, blank=True, verbose_name="Zdjęcie")
    tags = models.ManyToManyField(Tag, related_name='offers')
    
    class Meta:
        verbose_name = "Oferta"
        verbose_name_plural = "Oferty"
        
    def __str__(self):
        return f"{self.title} ({self.location})"

# --- REZERWACJE ---
class Booking(models.Model):
    STATUS_CHOICES = [
        ('confirmed', 'Potwierdzona'),
        ('cancelled', 'Anulowana'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='bookings')
    check_in = models.DateField()
    check_out = models.DateField()
    guests = models.IntegerField(default=2)
    rooms = models.IntegerField(default=1)
    room_type = models.CharField(max_length=50, default='standard')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='confirmed')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Rezerwacja"
        verbose_name_plural = "Rezerwacje"
    
    def __str__(self):
        return f"Rezerwacja #{self.id} - {self.offer.title} ({self.check_in} -> {self.check_out})"

# --- ULUBIONE ---
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ('user', 'offer')
        verbose_name = "Ulubione"
        verbose_name_plural = "Ulubione"

# --- PROFIL ---
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    is_owner = models.BooleanField(default=False, verbose_name="Właściciel hotelu")
    
    class Meta:
        verbose_name = "Profil Użytkownika"
        verbose_name_plural = "Profile Użytkowników"
        
    def __str__(self):
        return f"Profil: {self.user.username}"

# --- KONTAKT ---
class ContactMessage(models.Model):
    name = models.CharField(max_length=100, verbose_name="Imię i nazwisko")
    email = models.EmailField(verbose_name="Adres e-mail")
    subject = models.CharField(max_length=200, verbose_name="Temat")
    message = models.TextField(verbose_name="Wiadomość")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data wysłania")

    class Meta:
        verbose_name = "Wiadomość kontaktowa"
        verbose_name_plural = "Wiadomości kontaktowe"

    def __str__(self):
        return f"{self.subject} - od: {self.name}"

# --- OPINIE ---
class Review(models.Model):
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE, related_name='reviews')
    author_name = models.CharField(max_length=100, verbose_name="Autor")
    rating = models.FloatField(verbose_name="Ocena")
    body = models.TextField(verbose_name="Treść opinii")
    created_at = models.DateField(auto_now_add=True, verbose_name="Data dodania")

    class Meta:
        verbose_name = "Opinia"
        verbose_name_plural = "Opinie"

    def __str__(self):
        return f"Opinia {self.author_name} - {self.offer.title} ({self.rating}/10)"

# --- POWIADOMIENIA ---
class Notification(models.Model):
    TYPE_CHOICES = [
        ('booking_created', 'Nowa rezerwacja'),
        ('booking_cancelled_guest', 'Anulowanie przez gościa'),
        ('booking_cancelled_owner', 'Anulowanie przez właściciela'),
        ('booking_confirmed', 'Potwierdzenie rezerwacji'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    notification_type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    related_booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Powiadomienie"
        verbose_name_plural = "Powiadomienia"
        ordering = ['-created_at']

    def __str__(self):
        return f"Powiadomienie dla {self.user.username}: {self.message[:50]}"
