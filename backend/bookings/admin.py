from django.contrib import admin
from .models import Offer, Tag, Category, Booking, Favorite, UserProfile, ContactMessage

admin.site.register(Tag)
admin.site.register(Category)
admin.site.register(Booking)
admin.site.register(Favorite)
admin.site.register(UserProfile)

@admin.register(Offer)
class OfferAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'location', 'price', 'stars', 'rating')
    list_filter = ('type', 'stars', 'category')
    search_fields = ('title', 'location', 'description')
    list_editable = ('price', 'stars', 'rating')

    fieldsets = (
        ('Podstawowe informacje', {
            'fields': ('title', 'type', 'category')
        }),
        ('Szczegóły pobytu', {
            'fields': ('location', 'price')
        }),
        ('Oceny i popularność', {
            'fields': ('stars', 'rating', 'reviews_count')
        }),
        ('Opis i zdjęcia', {
            'fields': ('description', 'image_url', 'tags')
        }),
    )

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at')
    list_filter = ('subject', 'created_at')
    search_fields = ('name', 'email', 'subject', 'message')
    readonly_fields = ('name', 'email', 'subject', 'message', 'created_at')

    fieldsets = (
        ('Podstawowe informacje', {
            'fields': ('name', 'email', 'subject')
        }),
        ('Szczegóły wiadomości', {
            'fields': ('message', 'created_at')
        }),
    )

    def has_add_permission(self, request):
        return False