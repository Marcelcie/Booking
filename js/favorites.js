function getFavorites() {
  const data = localStorage.getItem("bookspace_favorites");
  return data ? JSON.parse(data) : [];
}

function saveFavorites(items) {
  localStorage.setItem("bookspace_favorites", JSON.stringify(items));
}

function isFavorite(id) {
  return getFavorites().some(item => String(item.id) === String(id));
}

function toggleFavorite(item) {
  const favorites = getFavorites();
  const exists = favorites.some(fav => String(fav.id) === String(item.id));

  let updated;
  if (exists) {
    updated = favorites.filter(fav => String(fav.id) !== String(item.id));
  } else {
    updated = [...favorites, item];
  }

  saveFavorites(updated);
  updateFavoriteButtons();
  renderFavoritesOnAccount();
}

function updateFavoriteButtons() {
  document.querySelectorAll(".favorite-btn").forEach(btn => {
    const id = btn.dataset.offerId;
    if (isFavorite(id)) {
      btn.classList.add("active");
      btn.innerHTML = "❤";
    } else {
      btn.classList.remove("active");
      btn.innerHTML = "♡";
    }
  });
}

function bindFavoriteButtons() {
  document.querySelectorAll(".favorite-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const item = {
        id: btn.dataset.offerId,
        title: btn.dataset.title,
        location: btn.dataset.location,
        type: btn.dataset.type,
        price: btn.dataset.price,
        image: btn.dataset.image,
        link: btn.dataset.link || "oferta-szczegoly.html"
      };

      toggleFavorite(item);
    });
  });

  updateFavoriteButtons();
}

function renderFavoritesOnAccount() {
  const container = document.getElementById("favorites-list");
  if (!container) return;

  const favorites = getFavorites();

  if (!favorites.length) {
    container.innerHTML = "<p>Brak ulubionych ofert. Dodaj je klikając serduszko przy obiektach.</p>";
    return;
  }

  container.innerHTML = favorites.map(item => `
    <div class="favorite-account-card">
      <img src="${item.image}" alt="${item.title}" />
      <div class="favorite-account-content">
        <h4>${item.title}</h4>
        <p>📍 ${item.location}</p>
        <p><strong>Typ:</strong> ${item.type}</p>
        <p><strong>Cena od:</strong> ${item.price} zł</p>
        <a href="${item.link}" class="offer-btn">Zobacz ofertę</a>
      </div>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  bindFavoriteButtons();
  renderFavoritesOnAccount();
});