from bookings.models import Offer, Review
from django.db.models import Avg
import random

first_names = ['Jan', 'Anna', 'Kamil', 'Katarzyna', 'Piotr', 'Magdalena', 'Tomasz', 'Michał', 'Agnieszka', 'Krzysztof']
last_names = ['Kowalski', 'Nowak', 'Zieliński', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zając']

comments_good = [
    "Świetne miejsce, na pewno wrócimy!",
    "Bardzo czysto, doskonała lokalizacja. Gospodarz bardzo pomocny.",
    "Wszystko zgodnie z opisem. Bardzo polecam ten obiekt.",
    "Cudowny pobyt, niczego nam nie brakowało. Widoki z okna niesamowite.",
    "Wysoki standard wykończenia. Wygodne łóżka."
]
comments_avg = [
    "Przyzwoicie, ale bez rewelacji. Trochę głośno w nocy.",
    "Dobre miejsce na krótki pobyt. Czystość mogłaby być lepsza.",
    "Ogólnie ok, chociaż zdjęcia sugerowały nieco wyższy standard.",
    "Znośnie, cena adekwatna do jakości. Drobne usterki w łazience."
]
comments_bad = [
    "Zdecydowanie odradzam. Brudno i nieprzyjemny zapach.",
    "Totalna pomyłka. Miejsce kompletnie niezgodne z opisem i zdjęciami.",
    "Hałas, brak podstawowego wyposażenia. Stracone pieniądze."
]

Review.objects.all().delete()
offers = Offer.objects.all()

for offer in offers:
    num_reviews = random.randint(3, 6)
    
    # Przechowujemy oryginalną ocenę do losowania opinii
    original_rating = offer.rating
    ratings = []
    
    for _ in range(num_reviews):
        # Losujemy ocenę pojedynczej opinii w oparciu o średnią obiektu
        rating = original_rating + random.uniform(-1.5, 1.5)
        rating = round(max(1.0, min(10.0, rating)), 1)
        ratings.append(rating)
        
        name = random.choice(first_names) + ' ' + random.choice(last_names)[0] + '.'
        
        if rating >= 7.5:
            body = random.choice(comments_good)
        elif rating >= 4.5:
            body = random.choice(comments_avg)
        else:
            body = random.choice(comments_bad)
            
        Review.objects.create(offer=offer, author_name=name, rating=rating, body=body)
    
    # Aktualizujemy zagregowane pola w obiekcie oferty
    offer.reviews_count = len(ratings)
    offer.rating = round(sum(ratings) / len(ratings), 1)
    offer.save()

print("Pomyślnie zaktualizowano oceny i wygenerowano nowe opinie dla wszystkich ofert!")
