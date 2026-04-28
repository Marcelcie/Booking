document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const offerId = urlParams.get('id');

  if (offerId) {
    loadOfferDetails(offerId);
  } else {
    document.getElementById("details-header-content").innerHTML = "<h2>Nie znaleziono oferty.</h2>";
  }
});

async function loadOfferDetails(id) {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/offers/${id}/`);
    if (!response.ok) throw new Error("Nie znaleziono oferty");
    const offer = await response.json();
    renderOfferDetails(offer);
  } catch (error) {
    console.error("Błąd:", error);
    document.getElementById("details-header-content").innerHTML = "<h2>Błąd ładowania szczegółów oferty.</h2>";
  }
}

function renderOfferDetails(offer) {
  // Nagłówek
  const headerContent = document.getElementById("details-header-content");
  if (headerContent) {
    headerContent.innerHTML = `
      <div>
        <span class="details-badge">${offer.type}</span>
        <h2>${offer.title}</h2>
        <p class="details-location">📍 ${offer.location}</p>
        <div class="details-stars-row">
          <div class="offer-stars">
            ${'<span class="star filled">★</span>'.repeat(offer.stars)}
            ${'<span class="star">☆</span>'.repeat(5 - offer.stars)}
          </div>
          <span class="offer-stars-text">${offer.stars}/5</span>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:12px;">
        <button class="favorite-btn active" type="button" style="position:static;">♡</button>
        <div class="details-rating-box">
          <p class="offer-rating-label">${offer.ratingLabel || 'Bardzo dobry'}</p>
          <div class="offer-rating">${offer.rating}</div>
          <p class="offer-reviews">${offer.reviews} opinii</p>
        </div>
      </div>
    `;
    // Przywracamy grid układ z oryginalnego HTML
    headerContent.style.display = "flex";
    headerContent.style.justifyContent = "space-between";
    headerContent.style.width = "100%";
  }

  // Galeria - bierzemy głowne zdjecie i generujemy placeholder poboczne, jesli ich nie ma
  const gallery = document.querySelector(".gallery-grid");
  if (gallery) {
    gallery.innerHTML = `
      <div class="gallery-main">
        <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://picsum.photos/seed/fallback/1000/650';" />
      </div>
      <div class="gallery-side">
        <img src="https://picsum.photos/seed/${offer.id}a/500/300" />
        <img src="https://picsum.photos/seed/${offer.id}b/500/300" />
        <img src="https://picsum.photos/seed/${offer.id}c/500/300" />
        <img src="https://picsum.photos/seed/${offer.id}d/500/300" />
      </div>
    `;
  }

  // Główna treść
  const mainContent = document.getElementById("details-main-content");
  if (mainContent) {
    const tagsArray = offer.tags_list || [];
    mainContent.innerHTML = `
      <div class="details-card">
        <h3>Opis obiektu</h3>
        <p>${offer.description}</p>
      </div>
      <div class="details-card">
        <h3>Najważniejsze udogodnienia</h3>
        <div class="amenities-grid">
          ${tagsArray.map(tag => `<div class="amenity-item">✅ ${tag}</div>`).join('')}
        </div>
      </div>
    `;
  }

  // Booking box
  const bookingBox = document.getElementById("booking-box-content");
  if (bookingBox) {
    bookingBox.innerHTML = `
      <div class="booking-card">
        <p class="booking-small">Cena od</p>
        <h3>${offer.price} zł</h3>
        <p class="booking-sub">za noc</p>
        <div class="booking-info">
          <p><strong>Ocena:</strong> ${offer.rating}/10</p>
          <p><strong>Opinie:</strong> ${offer.reviews}</p>
          <p><strong>Typ obiektu:</strong> ${offer.type}</p>
        </div>
        <button type="button" class="booking-btn">Zarezerwuj teraz</button>
        <button type="button" class="secondary-btn" onclick="window.location.href='oferty.html'">Wróć do ofert</button>
      </div>
    `;
  }
}
