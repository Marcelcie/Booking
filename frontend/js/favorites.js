async function getFavorites() {
  const token = localStorage.getItem("bookspace_token");
  if (token) {
    try {
      const response = await fetch("http://127.0.0.1:8000/api/favorites/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const favIds = data.map(offer => parseInt(offer.id));
        localStorage.setItem("bookspace_favorites_ids", JSON.stringify(favIds));
        return data; 
      }
    } catch (e) { console.error(e); }
  }
  
  const data = localStorage.getItem("bookspace_favorites");
  return data ? JSON.parse(data) : [];
}

async function toggleFavorite(item) {
  const token = localStorage.getItem("bookspace_token");
  if (token) {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/favorites/toggle/${item.id}/`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        await getFavorites(); 
        await updateFavoriteButtons();
        await renderFavoritesOnAccount();
      }
    } catch(e) { console.error(e); }
  } else {
    const data = localStorage.getItem("bookspace_favorites");
    const favorites = data ? JSON.parse(data) : [];
    const exists = favorites.some(fav => String(fav.id) === String(item.id));

    let updated;
    if (exists) {
      updated = favorites.filter(fav => String(fav.id) !== String(item.id));
    } else {
      updated = [...favorites, item];
    }
    localStorage.setItem("bookspace_favorites", JSON.stringify(updated));
    await updateFavoriteButtons();
    await renderFavoritesOnAccount();
  }
}

async function updateFavoriteButtons() {
  const token = localStorage.getItem("bookspace_token");
  let ids = [];
  if (token) {
    ids = JSON.parse(localStorage.getItem("bookspace_favorites_ids") || "[]");
  } else {
    const data = localStorage.getItem("bookspace_favorites");
    const favs = data ? JSON.parse(data) : [];
    ids = favs.map(f => parseInt(f.id));
  }

  document.querySelectorAll(".favorite-btn").forEach(btn => {
    const id = parseInt(btn.dataset.offerId);
    if (ids.includes(id)) {
      btn.classList.add("active");
      btn.innerHTML = "❤";
    } else {
      btn.classList.remove("active");
      btn.innerHTML = "♡";
    }
  });
}

async function bindFavoriteButtons() {
  const buttons = document.querySelectorAll(".favorite-btn");
  buttons.forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
  });

  document.querySelectorAll(".favorite-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const item = {
        id: btn.dataset.offerId,
        title: btn.dataset.title,
        location: btn.dataset.location,
        type: btn.dataset.type,
        price: btn.dataset.price,
        image: btn.dataset.image,
        link: btn.dataset.link || "oferta-szczegoly.html"
      };

      await toggleFavorite(item);
    });
  });

  await updateFavoriteButtons();
}

async function renderFavoritesOnAccount() {
  const container = document.getElementById("favorites-list");
  const countEl = document.getElementById("favorites_watchlist_count");
  
  // Pobieramy listę ulubionych
  const favorites = await getFavorites();

  // Aktualizujemy licznik na samej górze w statystykach, jeśli istnieje
  if (countEl) {
    countEl.textContent = favorites.length;
  }

  // Jeśli nie ma kontenera na listę, to przerywamy (np. jesteśmy na innej podstronie)
  if (!container) return;

  if (!favorites.length) {
    container.innerHTML = "<p>Brak ulubionych ofert. Dodaj je klikając serduszko przy obiektach.</p>";
    return;
  }

  container.innerHTML = favorites.map(item => {
    const img = item.image_url || item.image;
    const link = item.link || `oferta-szczegoly.html?id=${item.id}`;
    return `
    <div class="favorite-account-card">
      <img src="${img}" alt="${item.title}" />
      <div class="favorite-account-content">
        <h4>${item.title}</h4>
        <p>📍 ${item.location}</p>
        <p><strong>Typ:</strong> ${item.type}</p>
        <p><strong>Cena od:</strong> ${item.price} zł</p>
        <a href="${link}" class="offer-btn">Zobacz ofertę</a>
      </div>
    </div>
  `}).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  await getFavorites();
  await bindFavoriteButtons();
  await renderFavoritesOnAccount();
});

window.bindFavoriteButtons = bindFavoriteButtons;