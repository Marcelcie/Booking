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
let allFetchedOffers = [];

// --- Dodane dynamiczne ładowanie ofert z bazy danych ---
async function loadOfertyData() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/offers/');
    if (!response.ok) throw new Error('Błąd sieci');
    allFetchedOffers = await response.json();
    applyFilters();
  } catch (error) {
    console.error('Błąd ładowania ofert:', error);
    const container = document.getElementById('offersResults');
    if (container) container.innerHTML = '<p>Nie udało się pobrać ofert.</p>';
  }
}

function applyFilters() {
  const searchLocationInput = document.getElementById("search-location");
  const priceInput = document.getElementById("priceRange");
  const activePill = document.querySelector(".filter-pills .pill.active");
  const sortSelect = document.getElementById("sort");
  
  let filtered = allFetchedOffers;
  
  // 1. Lokalizacja (ignorowanie polskich znaków np. krakow == kraków)
  let locFilter = "";
  if (searchLocationInput) {
    locFilter = searchLocationInput.value.toLowerCase().trim();
    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
    if (locFilter) {
      const normalizedLocFilter = normalize(locFilter);
      filtered = filtered.filter(offer => 
        offer.location && normalize(offer.location.toLowerCase()).includes(normalizedLocFilter)
      );
    }
  }

  // 2. Cena
  let priceFilter = null;
  if (priceInput) {
    priceFilter = parseInt(priceInput.value, 10);
    filtered = filtered.filter(offer => offer.price <= priceFilter);
  }

  // 3. Typ obiektu
  let typeFilter = "";
  if (activePill && activePill.textContent !== "Wszystkie") {
    typeFilter = activePill.textContent.toLowerCase();
    filtered = filtered.filter(offer => offer.type && offer.type.toLowerCase() === typeFilter);
  }

  // 4. Sortowanie
  if (sortSelect) {
    const sortVal = sortSelect.value;
    if (sortVal === "Najtańsze") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortVal === "Najdroższe") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortVal === "Najwyżej oceniane") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortVal === "Najpopularniejsze") {
      filtered.sort((a, b) => b.reviews_count - a.reviews_count);
    }
  }

  renderOffers(filtered);
  updateActiveFilters(locFilter, priceFilter, typeFilter);
}

function updateActiveFilters(loc, price, type) {
  const container = document.querySelector(".active-filters");
  if (!container) return;
  
  container.innerHTML = "";
  if (loc) {
    container.innerHTML += `<span class="active-filter-tag">${loc.charAt(0).toUpperCase() + loc.slice(1)}</span>`;
  }
  if (price) {
    container.innerHTML += `<span class="active-filter-tag">Do ${price} zł</span>`;
  }
  if (type) {
    container.innerHTML += `<span class="active-filter-tag">${type.charAt(0).toUpperCase() + type.slice(1)}</span>`;
  }
}

function renderOffers(offers) {
  const container = document.getElementById('offersResults');
  if (!container) return;

  container.innerHTML = offers.map(offer => `
    <div class="offer-result-card">
      <div class="offer-result-image" style="position: relative;">
        <button class="favorite-btn"
          data-offer-id="${offer.id}"
          data-title="${offer.title}"
          data-location="${offer.location}"
          data-type="${offer.type}"
          data-price="${offer.price}"
          data-image="${offer.image_url}"
          data-link="oferta-szczegoly.html?id=${offer.id}"
          type="button">♡</button>
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

  if (typeof window.bindFavoriteButtons === "function") {
    window.bindFavoriteButtons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Odczyt parametru wyszukiwania z adresu URL
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get('location');
  
  if (locationParam) {
    const searchLocationInput = document.getElementById("search-location");
    if (searchLocationInput) searchLocationInput.value = locationParam;
  }

  // Obsługa przycisku "Zastosuj filtry" na stronie ofert
  const filterBtn = document.querySelector(".filter-btn");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      applyFilters();
    });
  }

  loadOfertyData();
});
