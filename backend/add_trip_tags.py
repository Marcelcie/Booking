from bookings.models import Offer, Tag

tag_names = ['Rodzinne', 'Historyczne', 'Miejskie', 'Aktywne']

tags_obj = {}
for name in tag_names:
    tag, created = Tag.objects.get_or_create(name=name)
    tags_obj[name] = tag

# Rodzinne
for o_id in [4, 6, 9]:
    try:
        offer = Offer.objects.get(id=o_id)
        offer.tags.add(tags_obj['Rodzinne'])
    except Offer.DoesNotExist:
        pass

# Historyczne
for o_id in [1, 2]:
    try:
        offer = Offer.objects.get(id=o_id)
        offer.tags.add(tags_obj['Historyczne'])
    except Offer.DoesNotExist:
        pass

# Miejskie
for o_id in [3, 7, 8]:
    try:
        offer = Offer.objects.get(id=o_id)
        offer.tags.add(tags_obj['Miejskie'])
    except Offer.DoesNotExist:
        pass

# Aktywne
for o_id in [5, 9, 10]:
    try:
        offer = Offer.objects.get(id=o_id)
        offer.tags.add(tags_obj['Aktywne'])
    except Offer.DoesNotExist:
        pass

print("Pomyślnie dodano i przypisano tagi wyjazdów do ofert w bazie danych!")
