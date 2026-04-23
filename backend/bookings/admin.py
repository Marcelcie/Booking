from django.contrib import admin
from django.contrib import admin
from .models import Offer, Category, Tag, Booking, Favorite, UserProfile

admin.site.register(Offer)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Booking)
admin.site.register(Favorite)
admin.site.register(UserProfile)