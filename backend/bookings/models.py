from django.db import models

class Offer(models.Model):
    title = models.CharField(max_length=200)
    type = models.CharField(max_length=100) # np. Hotel, Apartament, Domek
    location = models.CharField(max_length=150)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stars = models.IntegerField(default=0) # 1-5
    rating = models.DecimalField(max_digits=3, decimal_places=1, default=0.0)
    ratingLabel = models.CharField(max_length=100, blank=True)
    reviews = models.IntegerField(default=0)
    description = models.TextField()
    image = models.URLField()
    tags = models.CharField(max_length=255, blank=True) # np. "Centrum, Parking, Wi-Fi"
    category = models.CharField(max_length=100, blank=True, default="wedrowki") # do kategoryzacji np. na glownej
    ranking_category = models.CharField(max_length=100, blank=True) # topRated, popular, cheapest, premium

    def __str__(self):
        return self.title

    def get_tags_list(self):
        if self.tags:
            return [tag.strip() for tag in self.tags.split(',')]
        return []
