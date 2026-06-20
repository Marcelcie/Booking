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

// --- Dynamiczne ładowanie ofert z bazy danych ---
async function loadOfertyData() {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const queryString = urlParams.toString();
    const fetchUrl = queryString ? `${API_BASE}/api/offers/?${queryString}` : `${API_BASE}/api/offers/`;
    const response = await fetch(fetchUrl);
    if (!response.ok) throw new Error('Błąd sieci');
    allFetchedOffers = await response.json();
    applyFilters();
  } catch (error) {
    console.error('Błąd ładowania ofert:', error);
    const container = document.getElementById('offersResults');
    if (container) container.innerHTML = '<p>Nie udało się pobrać ofert.</p>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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

  // 3. Typ obiektu (z pill filtrów lub z URL)
  let typeFilter = "";
  if (activePill && activePill.textContent !== "Wszystkie") {
    typeFilter = activePill.textContent.toLowerCase();
  } else {
    const urlParamsForType = new URLSearchParams(window.location.search);
    const typeParam = urlParamsForType.get('type');
    if (typeParam) {
      typeFilter = typeParam.toLowerCase();
    }
  }

  if (typeFilter) {
    const typeMapping = {
      "apartament": ["apartment", "apartament"],
      "hotel": ["hotel"],
      "villa": ["villa", "willa"],
      "hostel": ["hostel"],
      "domek": ["domek", "cabin", "house", "cottage"],
      "wellness": ["wellness", "spa", "resort"],
      "resort": ["wellness", "spa", "resort"],
      "pensjonat": ["guesthouse", "pensjonat"]
    };
    
    const mappedTypes = typeMapping[typeFilter] || [typeFilter];
    
    filtered = filtered.filter(offer => 
      offer.type && mappedTypes.some(t => offer.type.toLowerCase().includes(t))
    );
  }

  // 3b. Tag / Rodzaj wyjazdu (z URL)
  const urlParams = new URLSearchParams(window.location.search);
  const tagParam = urlParams.get('tag');
  let tagFilter = "";
  if (tagParam) {
    tagFilter = tagParam;
    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normalizedTagParam = normalize(tagFilter);
    filtered = filtered.filter(offer => 
      offer.tags_list && offer.tags_list.some(tag => normalize(tag).includes(normalizedTagParam))
    );
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
  const guestsParam = urlParams.get('guests');
  updateActiveFilters(locFilter, priceFilter, typeFilter, tagFilter, guestsParam);
}

function updateActiveFilters(loc, price, type, tag, guests) {
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
  if (tag) {
    container.innerHTML += `<span class="active-filter-tag">${tag} <a href="oferty.html" style="color: #ffffff; margin-left: 6px; font-weight: bold; text-decoration: none;">&times;</a></span>`;
  }
  if (guests) {
    container.innerHTML += `<span class="active-filter-tag">Goście: ${guests}</span>`;
  }
}

function renderOffers(offers) {
  const container = document.getElementById('offersResults');
  if (!container) return;

  if (offers.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding: 40px; color: #6b7280;">Brak ofert spełniających wybrane kryteria.</p>';
    return;
  }

  container.innerHTML = offers.map(offer => `
    <div class="offer-result-card">
      <div class="offer-result-image" style="position: relative;">
        <button class="favorite-btn"
          data-offer-id="${offer.id}"
          data-title="${escapeHtml(offer.title)}"
          data-location="${escapeHtml(offer.location)}"
          data-type="${escapeHtml(offer.type)}"
          data-price="${offer.price}"
          data-image="${escapeHtml(offer.image_url)}"
          data-link="oferta-szczegoly.html?id=${offer.id}"
          type="button">♡</button>
        <img src="${escapeHtml(offer.image_url)}" alt="${escapeHtml(offer.title)}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';" />
      </div>

      <div class="offer-result-content">
        <div class="offer-result-main">
          <span class="offer-type-badge">${escapeHtml(offer.type)}</span>
          <h3>${escapeHtml(offer.title)}</h3>
          <p class="offer-result-location">📍 ${escapeHtml(offer.location)}</p>

          <div class="offer-stars-row">
            <div class="offer-stars">
              ${'<span class="star filled">★</span>'.repeat(offer.stars)}
              ${'<span class="star">☆</span>'.repeat(5 - offer.stars)}
            </div>
            <span class="offer-stars-text">${offer.stars}/5</span>
          </div>

          <p class="offer-result-description">${escapeHtml(offer.description)}</p>

          <div class="offer-tags">
            ${(offer.tags_list || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>

        <div class="offer-result-side">
          <p class="offer-rating-label">${getRatingLabel(offer.rating)}</p>
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
  // Odczyt parametrów z adresu URL
  const urlParams = new URLSearchParams(window.location.search);
  const locationParam = urlParams.get('location');
  const typeParam = urlParams.get('type');
  
  if (locationParam) {
    const searchLocationInput = document.getElementById("search-location");
    if (searchLocationInput) searchLocationInput.value = locationParam;
  }
  
  // Obsługa parametru ?type= z URL - ustaw aktywny pill
  if (typeParam) {
    const pills = document.querySelectorAll(".pill");
    let matched = false;
    pills.forEach(pill => {
      if (pill.textContent.toLowerCase() === typeParam.toLowerCase()) {
        pills.forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        matched = true;
      }
    });
    // Jeśli nie znaleziono pasującego pill, odznacz "Wszystkie"
    if (!matched) {
      // Typ z URL nie pasuje do żadnego pill - zostaw "Wszystkie" aktywne
    }
  }

  // Obsługa przycisku "Zastosuj filtry" na stronie ofert
  const filterBtn = document.querySelector(".filter-btn");
  if (filterBtn) {
    filterBtn.addEventListener("click", () => {
      applyFilters();
    });
  }

  // Obsługa sortowania - natychmiast po zmianie
  const sortSelect = document.getElementById("sort");
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      applyFilters();
    });
  }

  loadOfertyData();
});

function getRatingLabel(rating) {
  const value = Number(rating);
  if (value >= 9.0) return "Fantastyczny";
  if (value >= 8.0) return "Bardzo dobry";
  if (value >= 7.0) return "Dobry";
  if (value >= 4.0) return "Przeciętny";
  return "Zły";
}
