let rankingData = {
  topRated: [],
  popular: [],
  cheapest: [],
  premium: []
};

let rankingList = document.getElementById("ranking-list");
let rankingTabs = document.querySelectorAll(".ranking-tab");


function Rating(rating){
  if(rating >= 9.5) return "Fantastyczny";
  if(rating >= 9.0) return "Wspaniały";
  if(rating >= 8.0) return "Bardzo dobry";
  if(rating >= 7.0) return "Dobry";
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

  rankingList.innerHTML = items.map((item, index) => `
    <article class="ranking-card ${getCardClass(index)}">
      <div class="ranking-position ${getPlaceClass(index)}">${index + 1}</div>

      <div class="ranking-image">
        <img src="${item.image_url}" alt="${item.title}" />
      </div>

      <div class="ranking-content">
        <div class="ranking-main">
          <span class="offer-type-badge">${item.type}</span>
          <h3>${item.title}</h3>
          <p class="offer-result-location">📍 ${item.location}</p>

          <div class="offer-stars-row">
            <div class="offer-stars">
              ${renderStars(item.stars)}
            </div>
            <span class="offer-stars-text">${item.stars}/5</span>
          </div>

          <p class="ranking-description">${item.description}</p>
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

// Funkcja ładująca z Twojego API w Django
async function loadRankingData() {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/ranking/");
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