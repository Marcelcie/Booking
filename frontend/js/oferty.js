document.addEventListener("DOMContentLoaded", () => {
  const priceRange = document.getElementById("priceRange");
  const priceRangeValue = document.getElementById("priceRangeValue");

  if (priceRange && priceRangeValue) {
    priceRange.addEventListener("input", () => {
      priceRangeValue.textContent = `${priceRange.value} zł`;
    });
  }

  const pills = document.querySelectorAll(".pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(btn => btn.classList.remove("active"));
      pill.classList.add("active");
    });
  });

  const viewButtons = document.querySelectorAll(".view-btn");
  const offersResults = document.getElementById("offersResults");

  viewButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      viewButtons.forEach(item => item.classList.remove("active"));
      btn.classList.add("active");

      const viewType = btn.dataset.view;

      if (offersResults) {
        offersResults.classList.remove("list-view", "grid-view");
        offersResults.classList.add(`${viewType}-view`);
      }
    });
  });
});
// --- Dodane dynamiczne ładowanie ofert z bazy danych ---
async function loadOfertyData() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/offers/');
    if (!response.ok) throw new Error('Błąd sieci');
    const offers = await response.json();
    renderOffers(offers);
  } catch (error) {
    console.error('Błąd ładowania ofert:', error);
    const container = document.getElementById('offersResults');
    if (container) container.innerHTML = '<p>Nie udało się pobrać ofert.</p>';
  }
}

function renderOffers(offers) {
  const container = document.getElementById('offersResults');
  if (!container) return;

  container.innerHTML = offers.map(offer => `
    <div class="offer-result-card">
      <button class="favorite-btn"
        data-offer-id="${offer.id}"
        data-title="${offer.title}"
        data-location="${offer.location}"
        data-type="${offer.type}"
        data-price="${offer.price}"
        data-image="${offer.image_url}"
        data-link="oferta-szczegoly.html?id=${offer.id}"
        type="button">♡</button>

      <div class="offer-result-image">
        <img src="${offer.image_url}" alt="${offer.title}" />
      </div>

      <div class="offer-result-content">
        <div class="offer-result-main">
          <span class="offer-type-badge">${offer.type}</span>
          <h3>${offer.title}</h3>
          <p class="offer-result-location">📍 ${offer.location}</p>

          <div class="offer-stars-row">
            <div class="offer-stars">
              ${'<span class="star filled">★</span>'.repeat(offer.stars)}
              ${'<span class="star">☆</span>'.repeat(5 - offer.stars)}
            </div>
            <span class="offer-stars-text">${offer.stars}/5</span>
          </div>

          <p class="offer-result-description">${offer.description}</p>

          <div class="offer-tags">
            ${(offer.tags_list || []).map(tag => `<span>${tag}</span>`).join('')}
          </div>
        </div>

        <div class="offer-result-side">
          <p class="offer-rating-label">${(offer.rating >= 9.0 ? 'Fantastyczny' : 'Bardzo dobry')}</p>
          <div class="offer-rating">${offer.rating}</div>
          <p class="offer-reviews">${offer.reviews_count} opinii</p>

          <div class="offer-price-box">
            <p>Od</p>
            <strong>${offer.price} zł</strong>
            <a href="oferta-szczegoly.html?id=${offer.id}" class="offer-btn">Zobacz ofertę</a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  loadOfertyData();
});
