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
        'title': 'Luksusowy Hotel Grand Palace',
        'location': 'Warszawa',
        'description': 'Pięciogwiazdkowy Hotel Grand Palace zlokalizowany w samym sercu stolicy, tuż obok Pałacu Kultury i Nauki. Oferujemy przestronne pokoje o najwyższym standardzie, wykwintną kuchnię międzynarodową w hotelowej restauracji, nowoczesne centrum fitness oraz ekskluzywną strefę Spa. To idealne miejsce dla osób ceniących sobie luksus i bliskość najważniejszych atrakcji turystycznych i biznesowych miasta.',
        'price': 650,
        'rating': 9.3,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&h=650&fit=crop',
        'type': 'hotel',
        'category': categories_mapping['hotel'],
        'tags': ['Spa & Wellness', 'Szybkie Wi-Fi', 'Śniadanie wliczone w cenę', 'Klimatyzacja', 'Siłownia', 'Room Service 24/7', 'Miejskie']
    },
    {
        'title': 'Przytulna Chata pod Giewontem',
        'location': 'Zakopane',
        'description': 'Klimatyczny domek w stylu podhalańskim, usytuowany w cichej dzielnicy Zakopanego z bezpośrednim, zapierającym dech w piersiach widokiem na Giewont. Chata posiada klimatyczny kominek z kamienia, tradycyjne drewniane wykończenie z bali, dużą jadalnię oraz przestronny taras. Bliskość szlaków turystycznych czyni go doskonałą bazą wypadową w Tatry. Idealne miejsce dla rodzin szukających górskiego relaksu.',
        'price': 420,
        'rating': 8.9,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1000&h=650&fit=crop',
        'type': 'domek',
        'category': categories_mapping['resort'],
        'tags': ['Widok na góry', 'Balkon/Taras', 'Akceptacja zwierząt', 'Darmowy Parking', 'Rodzinne']
    },
    {
        'title': 'Willa Słoneczny Brzeg',
        'location': 'Sopot',
        'description': 'Ekskluzywna willa położona zaledwie 150 metrów od piaszczystej plaży w Sopocie. Oferuje luksusowo wykończone apartamenty z tarasami, z których roztacza się kojący widok na Zatokę Gdańską. Goście mogą korzystać z prywatnego, zacisznego ogrodu, strefy grillowej oraz bezpłatnej wypożyczalni rowerów do malowniczych przejażdżek wzdłuż nadmorskich alejek. Doskonały wybór na wakacyjny wypoczynek w Trójmieście.',
        'price': 580,
        'rating': 9.1,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&h=650&fit=crop',
        'type': 'villa',
        'category': categories_mapping['apartament'],
        'tags': ['Widok na morze', 'Balkon/Taras', 'Wypożyczalnia rowerów', 'Darmowy Parking', 'Rodzinne', 'Aktywne']
    },
    {
        'title': 'Hostel Sleep & Go',
        'location': 'Poznań',
        'description': 'Tani, niezwykle nowoczesny hostel w centrum Poznania, dedykowany studentom, backpackerom i osobom szukającym ekonomicznego noclegu. Oferujemy jasne pokoje wieloosobowe oraz prywatne dwójki z ergonomicznymi miejscami do pracy zdalnej. Do dyspozycji gości jest wspólna, w pełni wyposażona kuchnia, darmowa świeżo parzona kawa i herbata oraz strefa relaksu z grami planszowymi i konsolą. Świetny punkt startowy do pieszych wędrówek po Starym Mieście.',
        'price': 120,
        'rating': 7.8,
        'stars': 3,
        'image_url': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=1000&h=650&fit=crop',
        'type': 'hostel',
        'category': categories_mapping['apartament'],
        'tags': ['Szybkie Wi-Fi', 'Strefa relaksu', 'Zestaw do kawy i herbaty', 'Miejskie']
    },
    {
        'title': 'Hotel Wellness & Spa Mazury',
        'location': 'Giżycko',
        'description': 'Otoczony mazurskimi jeziorami kompleks Wellness to oaza luksusu i głębokiego wyciszenia. Oferujemy szeroką gamę zabiegów regeneracyjnych, rozbudowany kompleks basenowy, sauny fińskie oraz prywatną trawiastą plażę z pomostem. Nasze komfortowe pokoje z widokiem na jezioro gwarantują udany odpoczynek. Restauracja serwuje wyśmienite, tradycyjne dania kuchni polskiej z rybami z lokalnych połowów.',
        'price': 490,
        'rating': 8.7,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&h=650&fit=crop',
        'type': 'wellness',
        'category': categories_mapping['hotel'],
        'tags': ['Spa & Wellness', 'Sauna', 'Basen', 'Darmowy Parking', 'Śniadanie wliczone w cenę', 'Rodzinne']
    },
    {
        'title': 'Glamping Pod Gwiazdami',
        'location': 'Bieszczady',
        'description': 'Luksusowy glamping w sercu dzikich Bieszczad. Oferujemy pobyt w klimatyzowanych namiotach sferycznych z prywatnym jacuzzi na tarasie i przeszklonym sufitem, przez który można obserwować rozgwieżdżone niebo bez wstawania z łóżka. Doświadcz piękna bieszczadzkiej przyrody bez rezygnowania z wygody. Idealne miejsce na romantyczną ucieczkę od zgiełku miasta.',
        'price': 390,
        'rating': 9.4,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1470246973918-29a93221c455?w=1000&h=650&fit=crop',
        'type': 'resort',
        'category': categories_mapping['resort'],
        'tags': ['Akceptacja zwierząt', 'Strefa relaksu', 'Klimatyzacja', 'Balkon/Taras', 'Wypożyczalnia rowerów', 'Aktywne']
    },
    {
        'title': 'Apartament Staromiejski Rynek',
        'location': 'Wrocław',
        'description': 'Elegancki i przestronny apartament położony tuż przy malowniczym wrocławskim Rynku. Apartament wyróżnia się stylowym, nowoczesnym designem i pełnym wyposażeniem (w tym ekspresem ciśnieniowym i zmywarką). W okolicy znajdują się liczne klimatyczne kawiarnie, restauracje oraz zabytkowe uliczki Ostrowa Tumskiego. Wspaniały wybór dla osób pragnących poczuć niepowtarzalną atmosferę stolicy Dolnego Śląska.',
        'price': 290,
        'rating': 8.8,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1000&h=650&fit=crop',
        'type': 'apartament',
        'category': categories_mapping['apartament'],
        'tags': ['Szybkie Wi-Fi', 'Smart TV z Netflixem', 'Klimatyzacja', 'Miejskie', 'Historyczne']
    },
    {
        'title': 'Hotel Zamek Ryn Premium',
        'location': 'Ryn',
        'description': 'Wyjątkowy hotel zlokalizowany w odrestaurowanym, XIV-wiecznym Zamku Krzyżackim na Mazurach. Wnętrza wiernie oddają ducha epoki, oferując jednocześnie wszelkie nowoczesne udogodnienia premium. Goście mogą relaksować się w podziemnym basenie zlokalizowanym w gotyckich kryptach, grać w kręgle lub zwiedzać zabytkowe mury z przewodnikiem. Poczuj magię historii w luksusowym wydaniu.',
        'price': 520,
        'rating': 9.2,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1000&h=650&fit=crop',
        'type': 'hotel',
        'category': categories_mapping['hotel'],
        'tags': ['Historyczne', 'Basen', 'Spa & Wellness', 'Sauna', 'Śniadanie wliczone w cenę']
    },
    {
        'title': 'Bieszczadzka Ostoja nad Potokiem',
        'location': 'Wetlina',
        'description': 'Tradycyjny drewniany domek z bala, otoczony malowniczymi łąkami i lasami Bieszczadzkiego Parku Narodowego. Wyposażony w kamienny kominek, w pełni funkcjonalną kuchnię, strefę grillową oraz duży taras z leżakami. Idealny na spokojny urlop z rodziną lub wypady na połoniny. Wokół panuje cisza, spokój i niczym niezmącony kontakt z bieszczadzką dziką naturą.',
        'price': 310,
        'rating': 8.6,
        'stars': 4,
        'image_url': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1000&h=650&fit=crop',
        'type': 'domek',
        'category': categories_mapping['resort'],
        'tags': ['Widok na góry', 'Balkon/Taras', 'Akceptacja zwierząt', 'Darmowy Parking', 'Rodzinne']
    },
    {
        'title': 'Apartament Royal Wawel View',
        'location': 'Kraków',
        'description': 'Ekskluzywny apartament z bezpośrednim, zapierającym dech w piersiach widokiem na Zamek Królewski na Wawelu. Oferuje salon z luksusowymi meblami, klimatyzowaną sypialnię z pościelą z najwyższej jakości bawełny oraz aneks kuchenny z profesjonalnym ekspresem do kawy. Lokalizacja umożliwia spacer do Rynku Głównego w zaledwie 5 minut. Wspaniałe, zabytkowe wnętrze dla miłośników miejskiej elegancji.',
        'price': 450,
        'rating': 9.5,
        'stars': 5,
        'image_url': 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1000&h=650&fit=crop',
        'type': 'apartament',
        'category': categories_mapping['apartament'],
        'tags': ['Miejskie', 'Historyczne', 'Szybkie Wi-Fi', 'Klimatyzacja', 'Smart TV z Netflixem', 'Zestaw do kawy i herbaty']
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
