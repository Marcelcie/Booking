let allOffers = {};
let currentCategory = null;
let currentSlide = 0;
let autoplayInterval = null;

const track = document.getElementById("offers-track");
const emptyBox = document.getElementById("offers-empty");
const categoryButtons = document.querySelectorAll(".tab-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");

/* GUEST PICKER */
const guestSummary = document.getElementById("guest-summary");
const guestDropdown = document.getElementById("guest-dropdown");
const countButtons = document.querySelectorAll(".count-btn");

let guestState = {
  adults: 2,
  children: 0,
  rooms: 1
};

function updateGuestSummary() {
  const adultText = guestState.adults === 1 ? "dorosły" : "dorosłych";
  const childText = guestState.children === 1 ? "dziecko" : "dzieci";
  const roomText = guestState.rooms === 1 ? "pokój" : "pokoje";

  const summaryText = `${guestState.adults} ${adultText} · ${guestState.children} ${childText} · ${guestState.rooms} ${roomText}`;

  document.getElementById("guest-summary-text").textContent = summaryText;
  document.getElementById("adults-count").textContent = guestState.adults;
  document.getElementById("children-count").textContent = guestState.children;
  document.getElementById("rooms-count").textContent = guestState.rooms;
}

if (guestSummary) {
  guestSummary.addEventListener("click", () => {
    guestDropdown.classList.toggle("open");
  });
}

document.addEventListener("click", (e) => {
  if (guestDropdown && !e.target.closest(".guest-picker")) {
    guestDropdown.classList.remove("open");
  }
});

countButtons.forEach(button => {
  button.addEventListener("click", () => {
    const target = button.dataset.target;
    const action = button.dataset.action;

    if (action === "plus") {
      guestState[target]++;
    }

    if (action === "minus") {
      if (target === "adults" && guestState.adults > 1) guestState.adults--;
      if (target === "children" && guestState.children > 0) guestState.children--;
      if (target === "rooms" && guestState.rooms > 1) guestState.rooms--;
    }

    updateGuestSummary();
  });
});

/* OFFERS */
async function loadOffers() {
  try {
    const response = await fetch(`${API_BASE}/api/grouped-offers/`);
    
    if (!response.ok) {
      throw new Error('Błąd pobierania danych z backendu!');
    }
    
    const data = await response.json();
    console.log("Dane pobrane z backendu:", data);
    
    allOffers = data;
    
    // Dynamicznie utwórz tabs z kategorii z bazy
    buildCategoryTabs();
    renderCarousel();
    startAutoplay();
  } catch (error) {
    if (emptyBox) {
      emptyBox.textContent = "Nie udało się załadować ofert.";
    }
    console.error("Błąd ładowania ofert:", error);
  }
}

function buildCategoryTabs() {
  const tabsContainer = document.querySelector(".offers-tabs");
  if (!tabsContainer) return;
  
  const categoryKeys = Object.keys(allOffers);
  if (categoryKeys.length === 0) return;
  
  // Ustaw domyślną kategorię na pierwszą dostępną
  currentCategory = categoryKeys[0];
  
  // Mapowanie nazw kategorii na polskie wyświetlane nazwy
  const displayNames = {
    'hotels': 'Hotele',
    'apartments': 'Apartamenty',
    'resorts': 'Resorty',
    'apartament': 'Apartamenty',
    'wellness': 'Wellness',
    'wedrowki': 'Wędrówki',
    'festiwale': 'Festiwale',
    'kultura': 'Kultura',
    'historyczne': 'Historyczne',
    'rodzinne': 'Rodzinne'
  };
  
  tabsContainer.innerHTML = "";
  
  // Dodaj przycisk "Wszystkie"
  const allBtn = document.createElement("button");
  allBtn.className = "tab-btn";
  allBtn.dataset.category = "__all__";
  allBtn.textContent = "Wszystkie";
  tabsContainer.appendChild(allBtn);
  
  categoryKeys.forEach((key, index) => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    if (index === 0) btn.classList.add("active");
    btn.dataset.category = key;
    btn.textContent = displayNames[key] || key.charAt(0).toUpperCase() + key.slice(1);
    tabsContainer.appendChild(btn);
  });
  
  // Oznacz pierwszą kategorię jako aktywną
  const firstCatBtn = tabsContainer.querySelector(`.tab-btn[data-category="${categoryKeys[0]}"]`);
  if (firstCatBtn) firstCatBtn.classList.add("active");
  
  // Rebind listeners
  tabsContainer.querySelectorAll(".tab-btn").forEach(button => {
    button.addEventListener("click", () => {
      tabsContainer.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");
      currentCategory = button.dataset.category;
      renderCarousel();
      startAutoplay();
    });
  });
}

function getRatingLabel(rating) {
  const value = Number(rating);
  if (value >= 9.0) return "Fantastyczny";
  if (value >= 8.0) return "Bardzo dobry";
  if (value >= 7.0) return "Dobry";
  if (value >= 4.0) return "Przeciętny";
  return "Zły";
}

function renderStars(stars) {
  let result = "";
  for (let i = 1; i <= 5; i++) {
    result += i <= stars
      ? `<span class="star filled">★</span>`
      : `<span class="star">☆</span>`;
  }
  return result;
}

function getVisibleCards() {
  if (window.innerWidth <= 768) return 1;
  if (window.innerWidth <= 1100) return 2;
  return 3;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderCarousel() {
  let offers;
  if (currentCategory === "__all__") {
    // Pokaż wszystkie oferty ze wszystkich kategorii
    offers = Object.values(allOffers).flat().sort((a, b) => b.rating - a.rating);
  } else {
    offers = (allOffers[currentCategory] || []).sort((a, b) => b.rating - a.rating);
  }

  if (!offers.length) {
    track.innerHTML = "";
    emptyBox.textContent = "Brak ofert w tej kategorii.";
    return;
  }

  emptyBox.textContent = "";

  track.innerHTML = offers.map(offer => {
    const tags = offer.tags_list || offer.tags || [];
    const tagsHtml = Array.isArray(tags) 
      ? tags.map(tag => `<span>${escapeHtml(typeof tag === 'string' ? tag : tag.name || '')}</span>`).join("") 
      : "";
    
    return `
    <article class="offer-card">
      <div class="offer-image" style="position: relative;">
        <button
          class="favorite-btn"
          data-offer-id="${offer.id || offer.title}"
          data-title="${escapeHtml(offer.title)}"
          data-location="${escapeHtml(offer.location)}"
          data-type="${escapeHtml(offer.type)}"
          data-price="${offer.price}"
          data-image="${escapeHtml(offer.image_url)}"
          data-link="pages/oferta-szczegoly.html?id=${offer.id}"
          type="button"
        >♡</button>
        <img src="${escapeHtml(offer.image_url)}" alt="${escapeHtml(offer.title)}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop';" />
      </div>

      <div class="offer-card-content">
        <span class="offer-type">${escapeHtml(offer.type)}</span>
        <h3>${escapeHtml(offer.title)}</h3>
        <p class="offer-location"><span class="location-icon">📍</span> ${escapeHtml(offer.location)}</p>

        <div class="offer-stars-row">
          <div class="offer-stars">
            ${renderStars(offer.stars)}
          </div>
          <span class="offer-stars-text">${offer.stars}/5</span>
        </div>

        <p class="offer-description">${escapeHtml(offer.description)}</p>

        <div class="offer-tags">
          ${tagsHtml}
        </div>

        <div class="offer-bottom">
          <div class="offer-rating-box">
            <p class="offer-rating-label">${getRatingLabel(offer.rating)}</p>
            <div class="offer-rating">${offer.rating}</div>
            <p class="offer-reviews">${offer.reviews_count} opinii</p>
          </div>

          <div class="offer-price">
            <p>Od</p>
            <strong>${offer.price} zł</strong>
            <a href="pages/oferta-szczegoly.html?id=${offer.id}" class="offer-btn">Zobacz ofertę</a>
          </div>
        </div>
      </div>
    </article>
  `}).join("");

  currentSlide = 0;
  updateCarouselPosition();

  if (typeof bindFavoriteButtons === "function") {
    bindFavoriteButtons();
  }
}

function updateCarouselPosition() {
  const cards = document.querySelectorAll(".offer-card");
  if (!cards.length) return;

  let offersCount;
  if (currentCategory === "__all__") {
    offersCount = Object.values(allOffers).flat().length;
  } else {
    offersCount = (allOffers[currentCategory] || []).length;
  }
  const visibleCards = getVisibleCards();
  const maxSlide = Math.max(0, offersCount - visibleCards);

  if (currentSlide > maxSlide) {
    currentSlide = 0;
  }

  const cardWidth = cards[0].offsetWidth;
  const gap = window.innerWidth <= 768 ? 8 : window.innerWidth <= 1100 ? 14 : 18;
  const offset = currentSlide * (cardWidth + gap);

  track.style.transform = `translateX(-${offset}px)`;
}

function nextSlide() {
  let offersCount;
  if (currentCategory === "__all__") {
    offersCount = Object.values(allOffers).flat().length;
  } else {
    offersCount = (allOffers[currentCategory] || []).length;
  }
  const visibleCards = getVisibleCards();
  const maxSlide = Math.max(0, offersCount - visibleCards);

  if (currentSlide >= maxSlide) {
    currentSlide = 0;
  } else {
    currentSlide++;
  }

  updateCarouselPosition();
}

function prevSlide() {
  let offersCount;
  if (currentCategory === "__all__") {
    offersCount = Object.values(allOffers).flat().length;
  } else {
    offersCount = (allOffers[currentCategory] || []).length;
  }
  const visibleCards = getVisibleCards();
  const maxSlide = Math.max(0, offersCount - visibleCards);

  if (currentSlide <= 0) {
    currentSlide = maxSlide;
  } else {
    currentSlide--;
  }

  updateCarouselPosition();
}

function startAutoplay() {
  stopAutoplay();
  autoplayInterval = setInterval(() => {
    nextSlide();
  }, 4000);
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
  }
}

if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    nextSlide();
    startAutoplay();
  });
}

if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    prevSlide();
    startAutoplay();
  });
}

window.addEventListener("resize", () => {
  updateCarouselPosition();
});

if (track) {
  track.addEventListener("mouseenter", stopAutoplay);
  track.addEventListener("mouseleave", startAutoplay);
}

updateGuestSummary();
loadOffers();