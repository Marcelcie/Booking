import os
import django
from bookings.models import Offer, Tag
import random

# Tagi udogodnień
tag_names = [
    'Szybkie Wi-Fi', 'Darmowy Parking', 'Basen', 'Spa & Wellness', 
    'Śniadanie wliczone w cenę', 'Klimatyzacja', 'Balkon/Taras', 
    'Widok na morze', 'Widok na góry', 'Akceptacja zwierząt', 
    'Strefa relaksu', 'Zestaw do kawy i herbaty', 'Siłownia', 
    'Room Service 24/7', 'Smart TV z Netflixem', 'Sauna', 'Wypożyczalnia rowerów'
]

# Dodaj tagi do bazy
tags_obj = {}
for name in tag_names:
    tag, created = Tag.objects.get_or_create(name=name)
    tags_obj[name] = tag

updates = {
    1: {
        'title': 'Premium Apartament Centrum',
        'description': 'Ekskluzywny, dwupokojowy apartament zlokalizowany w samym sercu historycznego centrum. Idealny zarówno na romantyczny weekend, jak i pobyt biznesowy. Wnętrze zaprojektowano z dbałością o najmniejsze detale, łącząc nowoczesny minimalizm z elementami klasycznej elegancji. Goście mają do dyspozycji przestronny salon, w pełni wyposażony aneks kuchenny oraz luksusową sypialnię z łóżkiem king-size.',
        'mandatory_tags': ['Szybkie Wi-Fi', 'Smart TV z Netflixem', 'Klimatyzacja', 'Zestaw do kawy i herbaty']
    },
    2: {
        'title': 'Boutique Hotel Stary Młyn & Spa',
        'description': 'Zabytkowy Boutique Hotel Stary Młyn to oaza spokoju, w której historia łączy się z najwyższym standardem wypoczynku. Nasze wnętrza zachowują unikalny charakter odrestaurowanego młyna, oferując gościom niezapomnianą atmosferę. Zrelaksuj się w naszej nagradzanej strefie Spa & Wellness, skosztuj wyśmienitej kuchni w autorskiej restauracji i ciesz się wyjątkową gościnnością, która sprawi, że poczujesz się jak w domu.',
        'mandatory_tags': ['Spa & Wellness', 'Śniadanie wliczone w cenę', 'Sauna', 'Room Service 24/7']
    },
    3: {
        'title': 'Apartament Panorama City View',
        'description': 'Poczuj puls miasta z zapierającym dech w piersiach widokiem z najwyższych pięter apartamentowca. Panorama City View to luksusowa przestrzeń dla wymagających podróżników. Panoramiczne okna od podłogi do sufitu dostarczają nie tylko pięknych widoków, ale i mnóstwo naturalnego światła. W ofercie znajduje się nowocześnie urządzony salon, prywatny balkon oraz dostęp do podziemnego, strzeżonego parkingu.',
        'mandatory_tags': ['Balkon/Taras', 'Szybkie Wi-Fi', 'Klimatyzacja', 'Darmowy Parking']
    },
    4: {
        'title': 'Baltic Dream Resort & Wellness',
        'description': 'Luksusowy kurort położony zaledwie kilka kroków od piaszczystej plaży. Baltic Dream Resort to idealne miejsce na wymarzone wakacje nad morzem. Kompleks oferuje strefę basenową z podgrzewaną wodą, luksusowe zabiegi wellness, przestronne pokoje z panoramicznym widokiem na morze oraz elegancką restaurację serwującą świeże owoce morza. Odkryj nowy wymiar relaksu przy szumie morskich fal.',
        'mandatory_tags': ['Widok na morze', 'Basen', 'Spa & Wellness', 'Klimatyzacja', 'Śniadanie wliczone w cenę']
    },
    5: {
        'title': 'Creative Hub & Design Hostel',
        'description': 'Nowoczesny i inspirujący hostel dla młodych duchem podróżników oraz cyfrowych nomadów. Creative Hub to nie tylko miejsce do spania, ale prężna społeczność i przestrzeń do pracy zdalnej. Znajdziesz tu komfortowe, nowoczesne łóżka, przestrzeń coworkingową, kawiarnię serwującą doskonałą kawę specialty oraz strefę gier. Wszystko to zaprojektowane w unikalnym, industrialnym i modnym stylu.',
        'mandatory_tags': ['Szybkie Wi-Fi', 'Strefa relaksu', 'Wypożyczalnia rowerów', 'Zestaw do kawy i herbaty']
    },
    6: {
        'title': 'Rezydencja Villa Mazurska',
        'description': 'Prywatna rezydencja usytuowana w cichej, malowniczej zatoce, otoczona dziewiczym lasem. Villa Mazurska to kwintesencja relaksu blisko natury w standardzie pięciogwiazdkowym. Do dyspozycji gości oddajemy prywatny pomost, wypożyczalnię sprzętu wodnego oraz eleganckie, wykończone naturalnym drewnem pokoje. Wieczory można spędzać przy blasku ogniska z lampką wina na przestronnym tarasie.',
        'mandatory_tags': ['Akceptacja zwierząt', 'Balkon/Taras', 'Darmowy Parking', 'Strefa relaksu']
    },
    7: {
        'title': 'Executive Hotel Business Park',
        'description': 'Bezkompromisowy hotel stworzony z myślą o profesjonalistach. Położony w centrum biznesowym, zapewnia idealne warunki do pracy oraz regeneracji po ciężkim dniu. Przestronne pokoje wyposażone są w ergonomiczne biurka oraz najszybsze łącze internetowe w mieście. Dodatkowo goście mogą korzystać z całodobowej siłowni, nowoczesnego centrum konferencyjnego oraz świetnie zaopatrzonego drink-baru.',
        'mandatory_tags': ['Szybkie Wi-Fi', 'Darmowy Parking', 'Siłownia', 'Śniadanie wliczone w cenę', 'Klimatyzacja']
    },
    8: {
        'title': 'Loft Industrial Premium',
        'description': 'Zachwycający apartament loftowy w odrestaurowanej, XIX-wiecznej fabryce. Surowa cegła, stalowe elementy i wysokie sufity tworzą niesamowity i unikatowy klimat. Apartament składa się z rozległej części dziennej połączonej z designerską kuchnią oraz przytulnej sypialni na antresoli. Idealne rozwiązanie dla miłośników nowoczesnego designu szukających nieszablonowych wrażeń podczas pobytu w mieście.',
        'mandatory_tags': ['Smart TV z Netflixem', 'Szybkie Wi-Fi', 'Klimatyzacja', 'Zestaw do kawy i herbaty']
    },
    9: {
        'title': 'Pensjonat Górski Przystanek',
        'description': 'Klimatyczny pensjonat u podnóża majestatycznych szczytów, oferujący niezapomniane widoki oraz bliskość głównych szlaków turystycznych. Górski Przystanek to połączenie tradycyjnej, regionalnej architektury z nowoczesnym komfortem. Po aktywnym dniu na stoku lub szlaku zrelaksuj się w naszej zewnętrznej saunie lub skosztuj domowej, lokalnej kuchni przygotowywanej z ekologicznych produktów.',
        'mandatory_tags': ['Widok na góry', 'Sauna', 'Darmowy Parking', 'Śniadanie wliczone w cenę']
    },
    10: {
        'title': 'Eco Resort & Glamping Las',
        'description': 'Prawdziwa ucieczka od zgiełku cywilizacji. Eco Resort Las oferuje ekskluzywny wypoczynek w luksusowych, w pełni przeszklonych namiotach sferycznych, które pozwalają zasypiać pod gwiazdami. Ośrodek działa w pełnej harmonii z naturą, wykorzystując odnawialne źródła energii. Na miejscu znajdziesz leśne spa, jadalnię serwującą dania wegańskie i możliwość wynajęcia rowerów elektrycznych na wyprawy w głąb puszczy.',
        'mandatory_tags': ['Akceptacja zwierząt', 'Spa & Wellness', 'Strefa relaksu', 'Wypożyczalnia rowerów']
    },
    11: {
        'title': 'Ekskluzywny Apartament Nad Motławą',
        'description': 'Apartament klasy premium usytuowany w najbardziej prestiżowej lokalizacji w mieście. Przestronne okna oferują malowniczy widok na historyczną rzekę Motławę oraz zabytkowy Żuraw. Wnętrze wykończono materiałami najwyższej jakości. Do dyspozycji gości pozostaje prywatna strefa wypoczynkowa, nowoczesna kuchnia z ekspresem ciśnieniowym, a sam apartamentowiec dysponuje dostępem do elitarnej strefy basenowej i saun.',
        'mandatory_tags': ['Basen', 'Widok na morze', 'Klimatyzacja', 'Smart TV z Netflixem']
    }
}

for o_id, data in updates.items():
    try:
        offer = Offer.objects.get(id=o_id)
        offer.title = data['title']
        offer.description = data['description']
        offer.save()
        
        # Wyczyść stare tagi
        offer.tags.clear()
        
        # Dodaj tagi obowiązkowe
        tags_to_add = [tags_obj[tag_name] for tag_name in data['mandatory_tags']]
        
        # Dobierz 2-3 losowe tagi z pozostałych
        remaining_tags = [t for name, t in tags_obj.items() if name not in data['mandatory_tags']]
        random.shuffle(remaining_tags)
        tags_to_add.extend(remaining_tags[:random.randint(2, 3)])
        
        for t in tags_to_add:
            offer.tags.add(t)
            
    except Offer.DoesNotExist:
        continue

print("Pomyślnie zaktualizowano tytuły, opisy i udogodnienia dla ofert!")
