from django.db import models
from django.contrib.auth.models import User

# --- TAGI ---
class Tag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    def __str__(self):
        return self.name

# --- KATEGORIE ---
class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=100)
    def __str__(self):
        return self.display_name

# --- OFERTY ---
class Offer(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='offers')
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=100)
    location = models.CharField(max_length=255)
    description = models.TextField()
    price = models.IntegerField()
    rating = models.FloatField()
    stars = models.IntegerField()
    reviews_count = models.IntegerField(default=0)
    image_url = models.URLField(max_length=1000)
    tags = models.ManyToManyField(Tag, related_name='offers')
    def __str__(self):
        return f"{self.title} ({self.location})"

# --- REZERWACJE ---
class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    check_in = models.DateField()
    check_out = models.DateField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

# --- ULUBIONE ---
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    class Meta:
        unique_together = ('user', 'offer')

# --- PROFIL (TEGO BRAKOWAŁO!) ---
class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    def __str__(self):
        return f"Profil: {self.user.username}"