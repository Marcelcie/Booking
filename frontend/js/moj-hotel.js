let currentEditOfferId = null;

async function loadOwnerData() {
  const token = getAuthToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  const user = await fetchUserProfile();
  if (!user || user.role !== 'owner') {
    window.location.href = "konto.html"; // Jeśli nie jest właścicielem, wraca na zwykłe konto
    return;
  }

  document.getElementById("owner-name").textContent = user.name;

  await loadOwnerOffers(token);
  await loadOwnerBookings(token);
}

async function loadOwnerOffers(token) {
  try {
    const res = await fetch(`${API_BASE}/api/owner/offers/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const offers = await res.json();
    
    document.getElementById("stats-offers").textContent = offers.length;
    const list = document.getElementById("owner-offers-list");
    
    if (offers.length === 0) {
      list.innerHTML = `<p style="color: #666;">Nie dodałeś jeszcze żadnych obiektów. Kliknij przycisk powyżej, aby zacząć.</p>`;
      return;
    }

    list.innerHTML = offers.map(offer => `
      <div class="offer-card">
        <img src="${offer.image_url}" alt="${offer.title}">
        <div class="offer-details">
          <h4 style="margin-bottom:5px; color:#1d3557;">${offer.title}</h4>
          <p style="margin:2px 0; color:#4b5563; font-size:14px;">📍 ${offer.location} | 💰 ${offer.price} PLN / noc</p>
          <span class="offer-type-badge">${offer.type}</span>
        </div>
        <div class="offer-actions">
          <button class="btn-secondary" onclick='editOffer(${JSON.stringify(offer).replace(/'/g, "&#39;")})'>Edytuj</button>
          <button class="btn-danger" onclick="deleteOffer(${offer.id})">Usuń</button>
        </div>
      </div>
    `).join("");
  } catch (e) {
    document.getElementById("owner-offers-list").innerHTML = `<p style="color: red;">Błąd ładowania obiektów.</p>`;
  }
}

async function loadOwnerBookings(token) {
  try {
    const res = await fetch(`${API_BASE}/api/owner/bookings/`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (!res.ok) throw new Error();
    const bookings = await res.json();
    
    document.getElementById("stats-bookings").textContent = bookings.length;
    const list = document.getElementById("owner-bookings-list");
    
    if (bookings.length === 0) {
      list.innerHTML = `<p style="color: #666;">Brak rezerwacji w twoich obiektach.</p>`;
      return;
    }

    list.innerHTML = bookings.map(b => `
      <div class="booking-card">
        <div class="booking-info">
          <h4>🏨 ${b.offer_details.title}</h4>
          <p><strong>👤 Gość:</strong> ${b.guest_name} (<a href="mailto:${b.guest_email}">${b.guest_email}</a>) | 📞 Tel: ${b.guest_phone || 'brak'}</p>
          <p><strong>📅 Termin:</strong> ${b.check_in} do ${b.check_out} | 🧑‍🤝‍🧑 ${b.guests} gości</p>
          <p><strong>💳 Cena całkowita:</strong> ${b.total_price} PLN</p>
          <p>Status: <strong style="color: ${b.status === 'confirmed' ? 'green' : 'red'};">${b.status === 'confirmed' ? 'Potwierdzona' : 'Anulowana'}</strong></p>
        </div>
        ${b.status === 'confirmed' ? `
        <div class="booking-actions">
          <button class="btn-danger" onclick="cancelGuestBooking(${b.id})">Anuluj rezerwację</button>
        </div>
        ` : ''}
      </div>
    `).join("");
  } catch (e) {
    document.getElementById("owner-bookings-list").innerHTML = `<p style="color: red;">Błąd ładowania rezerwacji.</p>`;
  }
}

function openOfferModal() {
  currentEditOfferId = null;
  document.getElementById("offer-form").reset();
  document.getElementById("modal-title").textContent = "Dodaj nowy obiekt";
  document.getElementById("offer-modal").style.display = "flex";
}

function closeOfferModal() {
  document.getElementById("offer-modal").style.display = "none";
}

function editOffer(offer) {
  currentEditOfferId = offer.id;
  document.getElementById("offer-title").value = offer.title;
  document.getElementById("offer-location").value = offer.location;
  document.getElementById("offer-type").value = offer.type;
  document.getElementById("offer-category").value = offer.category_name || '';
  document.getElementById("offer-price").value = offer.price;
  document.getElementById("offer-stars").value = offer.stars;
  document.getElementById("offer-image").value = offer.image_url;
  document.getElementById("offer-description").value = offer.description;
  
  document.getElementById("modal-title").textContent = "Edytuj obiekt";
  document.getElementById("offer-modal").style.display = "flex";
}

document.getElementById("offer-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const token = getAuthToken();
  if (!token) return;

  const payload = {
    title: document.getElementById("offer-title").value,
    location: document.getElementById("offer-location").value,
    type: document.getElementById("offer-type").value,
    category: document.getElementById("offer-category").value,
    price: document.getElementById("offer-price").value,
    stars: document.getElementById("offer-stars").value,
    image_url: document.getElementById("offer-image").value,
    description: document.getElementById("offer-description").value
  };

  try {
    const url = currentEditOfferId 
      ? `${API_BASE}/api/owner/offers/${currentEditOfferId}/`
      : `${API_BASE}/api/owner/offers/`;
    const method = currentEditOfferId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(currentEditOfferId ? "Oferta została zaktualizowana!" : "Oferta została dodana pomyślnie!");
      closeOfferModal();
      loadOwnerData();
    } else {
      alert("Wystąpił błąd podczas zapisywania.");
    }
  } catch (err) {
    alert("Błąd połączenia z serwerem.");
  }
});

async function deleteOffer(id) {
  if (!confirm("Czy na pewno chcesz usunąć tę ofertę? UWAGA: Ta operacja usunie również wszystkie powiązane z nią rezerwacje użytkowników!")) return;
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/owner/offers/${id}/`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok || res.status === 204) {
      alert("Oferta została pomyślnie usunięta.");
      loadOwnerData();
    } else {
      alert("Wystąpił błąd podczas usuwania oferty.");
    }
  } catch (err) {
    alert("Błąd połączenia z serwerem.");
  }
}

async function cancelGuestBooking(id) {
  if (!confirm("Czy na pewno chcesz anulować tę rezerwację klienta?")) return;
  const token = getAuthToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/owner/bookings/${id}/cancel/`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.ok) {
      alert("Rezerwacja została anulowana.");
      loadOwnerData();
    } else {
      alert("Błąd podczas anulowania rezerwacji.");
    }
  } catch (err) {
    alert("Błąd połączenia z serwerem.");
  }
}

document.addEventListener("DOMContentLoaded", loadOwnerData);
