# BookSpace

System zarządzania rezerwacjami noclegowymi oparty na architekturze rozproszonej (decoupled).

## Opis projektu
BookSpace to aplikacja webowa służąca do rezerwacji noclegów online. System składa się z backendu pełniącego rolę API REST oraz lekkiego frontendu typu Single Page Application (SPA). Projekt kładzie nacisk na przejrzystość procesów oraz wydajność działania.

## Stack technologiczny
- **Backend**: Python 3.13, Django 6.0, Django REST Framework (DRF)
- **Autentykacja**: JSON Web Tokens (Simple JWT)
- **Baza danych**: PostgreSQL (Supabase)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **DevOps**: Docker, Gunicorn

## Kluczowe funkcjonalności
- **Autentykacja bezstanowa**: Bezpieczne zarządzanie użytkownikami z wykorzystaniem tokenów JWT.
- **Zarządzanie ofertami**: Endpointy API REST umożliwiające przeglądanie i filtrowanie ofert noclegowych.
- **Panel administracyjny**: Dostosowany interfejs zarządzania zintegrowany z Django Jazzmin.
- **Funkcje użytkownika**: Zarządzanie profilami oraz listą ulubionych ofert (w trakcie rozwoju).
- **Konteneryzacja**: Standaryzowane środowisko Docker zapewniające spójność między etapami developmentu i wdrożenia.

## Architektura systemu
Projekt realizuje architekturę odseparowaną:
- **Backend**: Warstwa logiki biznesowej i źródło danych dostępne przez API REST.
- **Frontend**: Wydajne SPA komunikujące się z serwerem za pomocą asynchronicznych zapytań (Fetch API).
- **Baza danych**: Relacyjna baza PostgreSQL hostowana na platformie Supabase.

## Instalacja i uruchomienie
### Wymagania
- Docker & Docker Compose
- Git

### Uruchomienie lokalne
1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/Marcelcie/Booking.git
   cd Booking
   ```
2. Uruchom kontenery:
   ```bash
   docker-compose up --build
   ```

## Zespół projektowy
- **Frontend Development**: Aleks Kapusta, Mateusz Żbikowski
- **Backend Development**: Piotr Baran, Marcel Cieśliński
- **Projekt bazy danych**: Mateusz Bonifatiuk
- **Quality Assurance**: Ksawery Justynowicz
