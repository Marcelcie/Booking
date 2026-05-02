# 🏨 BookSpace - System Rezerwacji 🚀

Witaj w repozytorium **BookSpace**! To w pełni zbrojona aplikacja do zarządzania ofertami i rezerwacjami, składająca się z potężnego backendu w Django i lekkiego, responsywnego frontendu w Vanilla JavaScript. Całość zamknięta w eleganckim, Dockerowym kontenerze, gotowa do wdrożenia.

## 🛠️ Technologie

System został zbudowany w oparciu o nowoczesny stack technologiczny:

*   **Backend:** Python 3.13, Django 6.0, Django Rest Framework (DRF)
*   **Autoryzacja:** JSON Web Tokens (Simple JWT)
*   **Baza danych:** PostgreSQL (hostowana na Supabase)
*   **Frontend:** HTML5, CSS3, Vanilla JS
*   **Infrastruktura:** Docker, Gunicorn

## ✨ Główne funkcjonalności

*   🔐 **Bezpieczny system kont:** Rejestracja i logowanie oparte na tokenach JWT. Brak przestarzałych sesji – pełna gotowość na architekturę bezstanową (Stateless).
*   🏠 **Zarządzanie ofertami:** Przeglądanie dostępnych miejsc (hotele, apartamenty) poprzez dedykowane API.
*   🛡️ **Customowy Panel Administratora:** Wzbogacony o motyw *Jazzmin* panel administracyjny do wygodnego zarządzania bazą danych i użytkownikami.
*   ❤️ **Ulubione (W trakcie prac):** Możliwość zapisywania i zarządzania ulubionymi ofertami z poziomu konta użytkownika.
*   🐳 **Docker Ready:** Środowisko deweloperskie i produkcyjne spakowane w jeden obraz kontenera. Zero problemów z konfiguracją lokalną ("u mnie działa").

## 🚀 Jak odpalić to cudo lokalnie?

Instalacja jest banalnie prosta dzięki konteneryzacji. 

### 1. Sklonuj repozytorium
```bash
git clone [https://github.com/Marcelcie/Booking.git](https://github.com/Marcelcie/Booking.git)
cd Booking
```

### Podziękowania zespołowi za doprowadzenie projektu do końca
  Skład:
  * Frontend: Aleks Kapusta,Mateusz Żbikowski
  * Backend: Piotr Baran, Marcel Cieśliński
  * baza danych: Mateusz Bonifatiuk
  * QA tester: Ksawery Justynowicz
