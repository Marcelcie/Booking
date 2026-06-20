import os
import django
from bookings.models import Offer, Category, Tag

# Upewniamy się, że kategorie istnieją
categories_mapping = {
    'hotel': Category.objects.get(id=2),       # Hotele
    'apartament': Category.objects.get(id=3),  # Apartamenty
    'resort': Category.objects.get(id=4),      # Resorty
}

new_offers_data = [
    {
        'title': 'Pałac na Wodzie Staniszów',
        'location': 'Staniszów',
        'description': 'Historyczny, osiemnastowieczny Pałac na Wodzie otoczony malowniczym parkiem krajobrazowym ze stawami u podnóża Karkonoszy. Wyjątkowe, indywidualnie zaprojektowane pokoje z antycznymi meblami przenoszą gości w czasy dawnej świetności. Nasza restauracja serwuje tradycyjne dania kuchni polskiej i dolnośląskiej w nowoczesnym wydaniu. Oferujemy również relaks w luksusowym spa.',
        'price': 480,
        'rating': 9.0,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&h=650&fit=crop',
        'type': 'hotel',
        'category': categories_mapping['hotel'],
        'tags': ['Historyczne', 'Spa & Wellness', 'Darmowy Parking', 'Śniadanie wliczone w cenę', 'Strefa relaksu']
    },
    {
        'title': 'Apartament Szklane Domy',
        'location': 'Zakopane',
        'description': 'Nowoczesny design i luksus w samym sercu polskich Tatr. Szklane Domy to prestiżowy kompleks apartamentów oferujący panoramiczne widoki na pasmo Gubałówki i Tatr Wysokich przez w pełni przeszklone ściany salonu. Do dyspozycji gości pozostaje prywatna strefa saun, w pełni wyposażony aneks kuchenny, podziemny garaż oraz strefa fitness.',
        'price': 460,
        'rating': 8.9,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&h=650&fit=crop',
        'type': 'apartament',
        'category': categories_mapping['apartament'],
        'tags': ['Widok na góry', 'Balkon/Taras', 'Sauna', 'Szybkie Wi-Fi', 'Darmowy Parking', 'Rodzinne']
    },
    {
        'title': 'Apartament Baltic Sands',
        'location': 'Kołobrzeg',
        'description': 'Stylowy apartament zlokalizowany zaledwie 100 metrów od plaży i nadmorskiej promenady w Kołobrzegu. Wykończony w jasnych, morskich barwach, zapewnia idealny klimat do relaksu. Goście mogą cieszyć się szumem fal z przestronnego balkonu. W pełni wyposażona kuchnia, wygodne łóżko małżeńskie i Smart TV zapewnią komfortowy pobyt o każdej porze roku.',
        'price': 350,
        'rating': 8.7,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1000&h=650&fit=crop',
        'type': 'apartament',
        'category': categories_mapping['apartament'],
        'tags': ['Widok na morze', 'Balkon/Taras', 'Smart TV z Netflixem', 'Szybkie Wi-Fi', 'Akceptacja zwierząt']
    },
    {
        'title': 'Eco Glamping Dolina Sanu',
        'location': 'Solina',
        'description': 'Ekologiczny ośrodek glampingowy zlokalizowany na malowniczym wzgórzu z panoramicznym widokiem na zakole Sanu i Jezioro Solińskie. Oferujemy pobyt w luksusowych namiotach safari wyposażonych w prywatne łazienki, tarasy widokowe oraz ekologiczne ogrzewanie kominkowe. Na miejscu znajduje się tradycyjna ruska bania oraz strefa jogi na świeżym powietrzu.',
        'price': 320,
        'rating': 9.2,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1533873984035-25970ab07461?w=1000&h=650&fit=crop',
        'type': 'resort',
        'category': categories_mapping['resort'],
        'tags': ['Akceptacja zwierząt', 'Strefa relaksu', 'Wypożyczalnia rowerów', 'Widok na góry', 'Aktywne']
    },
    {
        'title': 'Hotel Marina Bay & Yacht Club',
        'location': 'Gdańsk',
        'description': 'Pięciogwiazdkowy, ultranowoczesny hotel położony bezpośrednio przy marinie jachtowej w Gdańsku. Oferujemy luksusowe pokoje o marynistycznym wystroju, wyśmienitą restaurację serwującą dania kuchni śródziemnomorskiej, basen typu infinity z widokiem na marinę oraz elitarny klub jachtowy. Perfekcyjna lokalizacja blisko zabytkowego Starego Miasta.',
        'price': 720,
        'rating': 9.6,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1000&h=650&fit=crop',
        'type': 'hotel',
        'category': categories_mapping['hotel'],
        'tags': ['Basen', 'Widok na morze', 'Spa & Wellness', 'Room Service 24/7', 'Klimatyzacja', 'Miejskie']
    },
    {
        'title': 'Chata pod Świerkami',
        'location': 'Karpacz',
        'description': 'Przytulny, całoroczny domek z bala usytuowany na skraju Karkonoskiego Parku Narodowego w Karpaczu. Otoczony wiekowymi świerkami, oferuje pełną prywatność i bezpośrednią bliskość natury. W domku znajduje się klimatyczny kominek, prywatna sauna fińska, grill oraz duży ogród. Idealne miejsce dla rodzin szukających oddechu w górach.',
        'price': 380,
        'rating': 8.8,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1475855581690-80abb135d446?w=1000&h=650&fit=crop',
        'type': 'domek',
        'category': categories_mapping['resort'],
        'tags': ['Widok na góry', 'Sauna', 'Balkon/Taras', 'Darmowy Parking', 'Rodzinne']
    },
    {
        'title': 'Apartament Loft w Manufakturze',
        'location': 'Łódź',
        'description': 'Stylowy, industrialny apartament w bezpośrednim sąsiedztwie kultowego łódzkiego kompleksu Manufaktura. Posiada wysokie sufity, oryginalną XIX-wieczną czerwoną cegłę na ścianach oraz nowoczesne, luksusowe meble. Wyposażony w szybkie łącze Wi-Fi, dedykowaną strefę roboczą oraz aneks kuchenny z ekspresem. Doskonały wybór na city break.',
        'price': 260,
        'rating': 8.5,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1000&h=650&fit=crop',
        'type': 'apartament',
        'category': categories_mapping['apartament'],
        'tags': ['Szybkie Wi-Fi', 'Smart TV z Netflixem', 'Klimatyzacja', 'Miejskie']
    },
    {
        'title': 'Willa Hrebenarka Pensjonat',
        'location': 'Szczawnica',
        'description': 'Tradycyjna pensjonatowa willa o historycznej architekturze uzdrowiskowej w Szczawnicy. Położona w malowniczym sąsiedztwie Parku Dolnego, oferuje eleganckie pokoje z tarasami, strefę wellness z jacuzzi i sauną oraz ogród z widokiem na Pieniny. Doskonałe miejsce do regeneracji sił, picia wód mineralnych oraz pieszych wycieczek.',
        'price': 310,
        'rating': 8.6,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000&h=650&fit=crop',
        'type': 'villa',
        'category': categories_mapping['apartament'],
        'tags': ['Widok na góry', 'Balkon/Taras', 'Darmowy Parking', 'Strefa relaksu']
    },
    {
        'title': 'Hotel Górski Kryształ',
        'location': 'Szklarska Poręba',
        'description': 'Nowoczesny czterogwiazdkowy hotel położony w otoczeniu karkonoskich lasów w Szklarskiej Porębie. Oferujemy komfortowe pokoje z balkonami, bogate zaplecze Spa & Wellness z krytym basenem, saunami i gabinetami masażu. Restauracja serwuje wyborne dania oparte na lokalnych produktach. Znakomita baza wypadowa na narty.',
        'price': 470,
        'rating': 9.0,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1000&h=650&fit=crop',
        'type': 'hotel',
        'category': categories_mapping['hotel'],
        'tags': ['Basen', 'Spa & Wellness', 'Sauna', 'Darmowy Parking', 'Śniadanie wliczone w cenę', 'Widok na góry']
    },
    {
        'title': 'Resort Dolina Wiatru',
        'location': 'Wetlina',
        'description': 'Ekskluzywny resort wypoczynkowy w sercu Bieszczad. Oferujemy zakwaterowanie w luksusowych, całorocznych domach z kominkiem oraz eleganckich pokojach hotelowych. Na terenie resortu znajduje się strefa spa, zewnętrzny basen z podgrzewaną wodą, stadnina koni oraz restauracja serwująca dania kuchni bojkowskiej. Niezrównany komfort pośród połonin.',
        'price': 590,
        'rating': 9.3,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&h=650&fit=crop',
        'type': 'resort',
        'category': categories_mapping['resort'],
        'tags': ['Basen', 'Spa & Wellness', 'Akceptacja zwierząt', 'Widok na góry', 'Aktywne', 'Rodzinne']
    }
]

created_count = 0
for data in new_offers_data:
    offer, created = Offer.objects.get_or_create(
        title=data['title'],
        defaults={
            'location': data['location'],
            'description': data['description'],
            'price': data['price'],
            'rating': data['rating'],
            'stars': data['stars'],
            'image_url': data['image_url'],
            'type': data['type'],
            'category': data['category']
        }
    )
    if created:
        created_count += 1
        # Powiąż tagi
        for tag_name in data['tags']:
            tag, _ = Tag.objects.get_or_create(name=tag_name)
            offer.tags.add(tag)

print(f"Pomyślnie dodano {created_count} nowych ofert do bazy danych!")
