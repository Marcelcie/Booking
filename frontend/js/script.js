let allOffers = {};
let currentCategory = "wedrowki";
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
  const roomText = guestState.rooms === 1 ? "pokój" : "pokój";

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
    // Podłączamy prawdziwe Django API!
    const response = await fetch('http://127.0.0.1:8000/api/grouped-offers/');
    
    if (!response.ok) {
      throw new Error('Błąd pobierania danych z backendu!');
    }
    
    const data = await response.json();
    console.log("Dane pobrane z backendu:", data);
    
    allOffers = data;

    renderCarousel();
    startAutoplay();
  } catch (error) {
    if (emptyBox) {
      emptyBox.textContent = "Nie udało się załadować ofert.";
    }
    console.error("Błąd ładowania ofert:", error);
  }
}

function getRatingLabel(rating) {
  if (rating >= 9.5) return "Fantastyczny";
  if (rating >= 9.0) return "Wspaniały";
  if (rating >= 8.0) return "Bardzo dobry";
  if (rating >= 7.0) return "Dobry";
  return "Przyzwoity";
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

function renderCarousel() {
  const offers = (allOffers[currentCategory] || []).sort((a, b) => b.rating - a.rating);

  if (!offers.length) {
    track.innerHTML = "";
    emptyBox.textContent = "Brak ofert w tej kategorii.";
    return;
  }

  emptyBox.textContent = "";

  track.innerHTML = offers.map(offer => `
    <article class="offer-card">
      <button
        class="favorite-btn"
        data-offer-id="${offer.id || offer.title}"
        data-title="${offer.title}"
        data-location="${offer.location}"
        data-type="${offer.type}"
        data-price="${offer.price}"
        data-image="${offer.image}"
        data-link="pages/oferta-szczegoly.html"
        type="button"
      >♡</button>

      <div class="offer-image">
        <img src="${offer.image}" alt="${offer.title}" onerror="this.src='https://picsum.photos/seed/fallback/600/400';" />
      </div>

      <div class="offer-card-content">
        <span class="offer-type">${offer.type}</span>
        <h3>${offer.title}</h3>
        <p class="offer-location"><span class="location-icon">📍</span> ${offer.location}</p>

        <div class="offer-stars-row">
          <div class="offer-stars">
            ${renderStars(offer.stars)}
          </div>
          <span class="offer-stars-text">${offer.stars}/5</span>
        </div>

        <p class="offer-description">${offer.description}</p>

        <div class="offer-tags">
          ${offer.tags.map(tag => `<span>${tag}</span>`).join("")}
        </div>

        <div class="offer-bottom">
          <div class="offer-rating-box">
            <p class="offer-rating-label">${getRatingLabel(offer.rating)}</p>
            <div class="offer-rating">${offer.rating}</div>
            <p class="offer-reviews">${offer.reviews} opinii</p>
          </div>

          <div class="offer-price">
            <p>Od</p>
            <strong>${offer.price} zł</strong>
            <a href="pages/oferta-szczegoly.html" class="offer-btn">Zobacz ofertę</a>
          </div>
        </div>
      </div>
    </article>
  `).join("");

  currentSlide = 0;
  updateCarouselPosition();

  if (typeof bindFavoriteButtons === "function") {
    bindFavoriteButtons();
  }
}

function updateCarouselPosition() {
  const cards = document.querySelectorAll(".offer-card");
  if (!cards.length) return;

  const offers = allOffers[currentCategory] || [];
  const visibleCards = getVisibleCards();
  const maxSlide = Math.max(0, offers.length - visibleCards);

  if (currentSlide > maxSlide) {
    currentSlide = 0;
  }

  const cardWidth = cards[0].offsetWidth;
  const gap = window.innerWidth <= 768 ? 8 : window.innerWidth <= 1100 ? 14 : 18;
  const offset = currentSlide * (cardWidth + gap);

  track.style.transform = `translateX(-${offset}px)`;
}

function nextSlide() {
  const offers = allOffers[currentCategory] || [];
  const visibleCards = getVisibleCards();
  const maxSlide = Math.max(0, offers.length - visibleCards);

  if (currentSlide >= maxSlide) {
    currentSlide = 0;
  } else {
    currentSlide++;
  }

  updateCarouselPosition();
}

function prevSlide() {
  const offers = allOffers[currentCategory] || [];
  const visibleCards = getVisibleCards();
  const maxSlide = Math.max(0, offers.length - visibleCards);

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

categoryButtons.forEach(button => {
  button.addEventListener("click", () => {
    categoryButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    currentCategory = button.dataset.category;
    renderCarousel();
    startAutoplay();
  });
});

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