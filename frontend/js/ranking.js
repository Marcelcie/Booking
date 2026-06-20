let rankingData = {
  topRated: [],
  popular: [],
  cheapest: [],
  premium: []
};

let rankingList = document.getElementById("ranking-list");
let rankingTabs = document.querySelectorAll(".ranking-tab");

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function Rating(rating) {
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

function getPlaceClass(index) {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "";
}

function getCardClass(index) {
  if (index === 0) return "first-place";
  if (index === 1) return "second-place";
  if (index === 2) return "third-place";
  return "";
}

function renderRanking(tabName) {
  const items = rankingData[tabName];

  if (!items || items.length === 0) {
    rankingList.innerHTML = "<p style='text-align:center; padding: 40px; color: #6b7280;'>Brak ofert w tej kategorii rankingu.</p>";
    return;
  }

  rankingList.innerHTML = items.map((item, index) => `
    <article class="ranking-card ${getCardClass(index)}">
      <div class="ranking-position ${getPlaceClass(index)}">${index + 1}</div>

      <div class="ranking-image">
        <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop';" />
      </div>

      <div class="ranking-content">
        <div class="ranking-main">
          <span class="offer-type-badge">${escapeHtml(item.type)}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p class="offer-result-location">📍 ${escapeHtml(item.location)}</p>

          <div class="offer-stars-row">
            <div class="offer-stars">
              ${renderStars(item.stars)}
            </div>
            <span class="offer-stars-text">${item.stars}/5</span>
          </div>

          <p class="ranking-description">${escapeHtml(item.description)}</p>
        </div>

        <div class="ranking-side">
          <p class="offer-rating-label">${Rating(item.rating)}</p>
          <div class="offer-rating">${item.rating}</div>
          <p class="offer-reviews">${item.reviews_count} opinii</p>
          <strong class="ranking-price">Od ${item.price} zł</strong>
          <a href="oferta-szczegoly.html?id=${item.id}" class="offer-btn">Zobacz ofertę</a>
        </div>
      </div>
    </article>
  `).join("");
}

// Funkcja ładująca z API w Django
async function loadRankingData() {
  try {
    const response = await fetch(`${API_BASE}/api/ranking/`);
    if (!response.ok) throw new Error("Błąd sieci!");
    
    rankingData = await response.json();
    renderRanking("topRated"); // Renderujemy po załadowaniu danych
  } catch (error) {
    console.error("Błąd ładowania rankingu:", error);
    rankingList.innerHTML = "<p>Nie udało się pobrać danych rankingu.</p>";
  }
}

rankingTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    rankingTabs.forEach(btn => btn.classList.remove("active"));
    tab.classList.add("active");
    renderRanking(tab.dataset.tab);
  });
});


loadRankingData();