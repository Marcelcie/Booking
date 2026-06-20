// ===== MOJ-HOTEL.JS — Panel właściciela obiektu =====
// Wymaga: auth.js (escapeHTML, showToast, fetchWithAuth, fetchUserProfile, getAuthToken)

let currentEditOfferId = null;
let ownerOffers = []; // cache ofert właściciela dla filtra

// ===== INICJALIZACJA =====
async function loadOwnerData() {
  const token = getAuthToken();
  if (!token) { window.location.href = "login.html"; return; }

  const user = await fetchUserProfile();
  if (!user) { window.location.href = "login.html"; return; }
  if (user.role !== 'owner') { window.location.href = "konto.html"; return; }

  document.getElementById("owner-name").textContent = escapeHTML(user.name);

  // Równolegle pobierz stats, oferty i rezerwacje
  await Promise.all([loadOwnerStats(), loadOwnerOffers(), loadOwnerBookings()]);
}

// ===== STATYSTYKI =====
async function loadOwnerStats() {
  const res = await fetchWithAuth(`${API_BASE}/api/owner/stats/`);
  if (!res || !res.ok) return;
  const data = await res.json();

  const el = (id) => document.getElementById(id);
  if (el('stats-offers'))   el('stats-offers').textContent   = data.offers_count || 0;
  if (el('stats-bookings')) el('stats-bookings').textContent = data.confirmed_bookings || 0;
  if (el('stats-revenue'))  el('stats-revenue').textContent  = `${(data.total_revenue || 0).toFixed(2)} PLN`;
}

// ===== OFERTY WŁAŚCICIELA =====
async function loadOwnerOffers() {
  const list = document.getElementById("owner-offers-list");
  list.innerHTML = `<p style="color:#666;">Ładowanie...</p>`;
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/`);
    if (!res || !res.ok) throw new Error();
    ownerOffers = await res.json();
    renderOwnerOffers(ownerOffers);
    populateOfferFilter(ownerOffers);
  } catch {
    list.innerHTML = `<p style="color:red;">Błąd ładowania obiektów.</p>`;
  }
}

function renderOwnerOffers(offers) {
  const list = document.getElementById("owner-offers-list");
  if (!offers || offers.length === 0) {
    list.innerHTML = `<p style="color:#666;">Nie dodałeś jeszcze żadnych obiektów. Kliknij przycisk powyżej, aby zacząć.</p>`;
    return;
  }
  list.innerHTML = offers.map(offer => `
    <div class="owner-offer-card" style="${!offer.is_active ? 'opacity:0.75;' : ''}">
      <img src="${escapeHTML(offer.image_url)}" alt="${escapeHTML(offer.title)}" onerror="this.src='../images/favicon.png'">
      <div class="owner-offer-details">
        <h4 style="margin-bottom:5px; color:#1d3557;">${escapeHTML(offer.title)}</h4>
        <p style="margin:2px 0; color:#4b5563; font-size:14px;">📍 ${escapeHTML(offer.location)} | 💰 ${escapeHTML(String(offer.price))} PLN / noc</p>
        <span class="offer-type-badge">${escapeHTML(offer.type)}</span>
        ${!offer.is_active ? `<span class="offer-type-badge" style="background:#fee2e2;color:#dc2626;font-weight:bold;">Niewidoczny</span>` : ''}
        ${offer.tags_list && offer.tags_list.length ? `<div style="margin-top:5px;">${offer.tags_list.map(t => `<span class="offer-type-badge" style="background:#f0fdf4;color:#16a34a;">${escapeHTML(t)}</span>`).join(' ')}</div>` : ''}
      </div>
      <div class="owner-offer-actions" style="display:flex; flex-direction:column; gap:6px;">
        <div style="display:flex; gap:6px;">
          <a href="zarzadzaj-hotelem.html?id=${offer.id}" class="btn-secondary" style="text-decoration:none; text-align:center; flex:1; line-height:22px;">Zarządzaj</a>
          <button class="btn-danger" style="flex:1;" onclick="deleteOffer(${offer.id})">Usuń</button>
        </div>
        <div style="display:flex; gap:6px;">
          <button class="btn-secondary" style="font-size:12px; padding:6px 10px; background:${offer.is_active ? '#e0f2fe' : '#fef08a'}; color:${offer.is_active ? '#0369a1' : '#854d0e'}; border:none;" onclick="toggleOfferActive(${offer.id})">
            ${offer.is_active ? '👁️ Ukryj' : '👁️ Pokaż'}
          </button>
          <button class="btn-secondary" style="font-size:12px; padding:6px 10px; background:#f3e8ff; color:#6b21a8; border:none;" onclick="openBlockModal(${offer.id}, '${escapeHTML(offer.title)}')">
            📅 Dostępność
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function populateOfferFilter(offers) {
  const select = document.getElementById("filter-offer");
  if (!select) return;
  select.innerHTML = `<option value="">Wszystkie obiekty</option>` +
    offers.map(o => `<option value="${o.id}">${escapeHTML(o.title)}</option>`).join('');
}

// ===== REZERWACJE GOŚCI =====
async function loadOwnerBookings(page = 1) {
  const list = document.getElementById("owner-bookings-list");
  list.innerHTML = `<p style="color:#666;">Ładowanie...</p>`;
  try {
    const statusFilter  = document.getElementById("filter-status")?.value || '';
    const offerFilter   = document.getElementById("filter-offer")?.value || '';
    const perPage = 10;
    let url = `${API_BASE}/api/owner/bookings/?page=${page}&per_page=${perPage}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (offerFilter)  url += `&offer_id=${offerFilter}`;

    const res = await fetchWithAuth(url);
    if (!res || !res.ok) throw new Error();
    const data = await res.json();
    const bookings = data.results || [];
    const totalPages = data.total_pages || 1;
    const total = data.total || 0;

    // Aktualizuj licznik w stats
    const statsEl = document.getElementById("stats-bookings");
    if (statsEl) statsEl.textContent = data.confirmed_count ?? total;

    if (bookings.length === 0) {
      list.innerHTML = `<p style="color:#666;">Brak rezerwacji dla wybranych filtrów.</p>`;
      return;
    }

    list.innerHTML = bookings.map(b => `
      <div class="booking-card">
        <div class="booking-info">
          <h4>🏨 ${escapeHTML(b.offer_details?.title || '—')}</h4>
          <p><strong>👤 Gość:</strong> ${escapeHTML(b.guest_name || '—')} 
             (<a href="mailto:${escapeHTML(b.guest_email)}">${escapeHTML(b.guest_email)}</a>)
             ${b.guest_phone ? `| 📞 ${escapeHTML(b.guest_phone)}` : ''}
          </p>
          <p><strong>📅 Termin:</strong> ${escapeHTML(b.check_in)} – ${escapeHTML(b.check_out)} | 🧑‍🤝‍🧑 ${escapeHTML(String(b.guests))} gości</p>
          <p><strong>💳 Łącznie:</strong> ${escapeHTML(String(b.total_price))} PLN</p>
          <p>Status: <strong style="color:${b.status === 'confirmed' ? '#16a34a' : '#dc2626'};">
            ${b.status === 'confirmed' ? 'Potwierdzona ✓' : 'Anulowana ✗'}
          </strong></p>
        </div>
        ${b.status === 'confirmed' ? `
        <div class="booking-actions">
          <button class="btn-danger" onclick="cancelGuestBooking(${b.id})">Anuluj</button>
        </div>` : ''}
      </div>
    `).join('');

    // Paginacja
    if (totalPages > 1) {
      const pag = document.createElement('div');
      pag.style.cssText = 'display:flex;gap:8px;margin-top:15px;justify-content:center;';
      for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = i === page ? 'btn-primary' : 'btn-secondary';
        btn.style.minWidth = '36px';
        btn.onclick = () => loadOwnerBookings(i);
        pag.appendChild(btn);
      }
      list.appendChild(pag);
    }
  } catch {
    list.innerHTML = `<p style="color:red;">Błąd ładowania rezerwacji.</p>`;
  }
}

// ===== MODAL OFERTY =====
function openOfferModal() {
  currentEditOfferId = null;
  document.getElementById("offer-form").reset();
  const fileInput = document.getElementById("offer-image-file");
  if (fileInput) fileInput.value = "";
  const activeInput = document.getElementById("offer-is-active");
  if (activeInput) activeInput.value = "true";
  document.getElementById("modal-title").textContent = "Dodaj nowy obiekt";
  document.getElementById("offer-modal").style.display = "flex";
}

function closeOfferModal() {
  document.getElementById("offer-modal").style.display = "none";
}

// Zamknięcie po kliknięciu tła
document.getElementById("offer-modal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("offer-modal")) closeOfferModal();
});

function editOffer(offer) {
  currentEditOfferId = offer.id;
  document.getElementById("offer-title").value       = offer.title || '';
  document.getElementById("offer-location").value    = offer.location || '';
  document.getElementById("offer-type").value        = offer.type || 'hotel';
  document.getElementById("offer-category").value    = offer.category_name || '';
  document.getElementById("offer-price").value       = offer.price || '';
  document.getElementById("offer-stars").value       = offer.stars || 3;
  document.getElementById("offer-image").value       = offer.image_url || '';
  const fileInput = document.getElementById("offer-image-file");
  if (fileInput) fileInput.value = "";
  const activeInput = document.getElementById("offer-is-active");
  if (activeInput) activeInput.value = offer.is_active === false ? "false" : "true";
  document.getElementById("offer-description").value = offer.description || '';
  document.getElementById("offer-tags").value        = (offer.tags_list || []).join(', ');
  document.getElementById("modal-title").textContent = "Edytuj obiekt";
  document.getElementById("offer-modal").style.display = "flex";
}

// ===== WALIDACJA FORMULARZA =====
function validateOfferForm() {
  const title    = document.getElementById("offer-title").value.trim();
  const location = document.getElementById("offer-location").value.trim();
  const category = document.getElementById("offer-category").value.trim();
  const price    = Number(document.getElementById("offer-price").value);
  const stars    = Number(document.getElementById("offer-stars").value);
  const imageUrl = document.getElementById("offer-image").value.trim();

  if (!title)      { showToast("Podaj nazwę obiektu.", "error"); return false; }
  if (!location)   { showToast("Podaj lokalizację.", "error"); return false; }
  if (!category)   { showToast("Podaj kategorię.", "error"); return false; }
  if (!price || price <= 0) { showToast("Cena musi być większa od zera.", "error"); return false; }
  if (stars < 1 || stars > 5) { showToast("Gwiazdki muszą być w zakresie 1–5.", "error"); return false; }
  if (imageUrl && !/^https?:\/\/.+/.test(imageUrl)) { showToast("Link do zdjęcia musi zaczynać się od http:// lub https://", "error"); return false; }
  return true;
}

// ===== ZAPIS OFERTY (ADD / EDIT) =====
document.getElementById("offer-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateOfferForm()) return;

  const tagsRaw = document.getElementById("offer-tags").value.trim();
  const tagsArr = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  const formData = new FormData();
  formData.append("title", document.getElementById("offer-title").value.trim());
  formData.append("location", document.getElementById("offer-location").value.trim());
  formData.append("type", document.getElementById("offer-type").value);
  formData.append("category", document.getElementById("offer-category").value.trim());
  formData.append("price", Number(document.getElementById("offer-price").value));
  formData.append("stars", Number(document.getElementById("offer-stars").value));
  formData.append("description", document.getElementById("offer-description").value.trim());
  formData.append("image_url", document.getElementById("offer-image").value.trim());
  
  const activeInput = document.getElementById("offer-is-active");
  if (activeInput) {
    formData.append("is_active", activeInput.value === "true");
  }
  
  // Przekazanie tagów jako stringified JSON
  formData.append("tags", JSON.stringify(tagsArr));

  const fileInput = document.getElementById("offer-image-file");
  if (fileInput && fileInput.files[0]) {
    formData.append("image", fileInput.files[0]);
  }

  const submitBtn = e.target.querySelector('[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Zapisywanie...';

  try {
    const url    = currentEditOfferId ? `${API_BASE}/api/owner/offers/${currentEditOfferId}/` : `${API_BASE}/api/owner/offers/`;
    const method = currentEditOfferId ? "PUT" : "POST";
    const res    = await fetchWithAuth(url, { method, body: formData });

    if (res && res.ok) {
      const savedOffer = await res.json();
      showToast(currentEditOfferId ? "Oferta zaktualizowana!" : "Oferta dodana pomyślnie! Przekierowanie do zarządzania...", "success");
      closeOfferModal();
      if (!currentEditOfferId) {
        setTimeout(() => { window.location.href = `zarzadzaj-hotelem.html?id=${savedOffer.id}`; }, 1000);
      } else {
        await loadOwnerData();
      }
    } else {
      const err = res ? await res.json() : null;
      showToast(err?.error || "Błąd podczas zapisywania.", "error");
    }
  } catch { showToast("Błąd połączenia z serwerem.", "error"); }
  finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Zapisz';
  }
});

// ===== USUWANIE OFERTY =====
async function deleteOffer(id) {
  if (!confirm("Czy na pewno chcesz usunąć tę ofertę?\nUWAGA: Usunie też wszystkie jej rezerwacje!")) return;

  const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${id}/`, { method: "DELETE" });
  if (res && (res.ok || res.status === 204)) {
    showToast("Oferta została usunięta.", "success");
    await loadOwnerData();
  } else {
    showToast("Błąd podczas usuwania oferty.", "error");
  }
}

// ===== ANULOWANIE REZERWACJI GOŚCIA =====
async function cancelGuestBooking(id) {
  if (!confirm("Czy na pewno chcesz anulować tę rezerwację klienta? Zostanie on o tym powiadomiony.")) return;
  const res = await fetchWithAuth(`${API_BASE}/api/owner/bookings/${id}/cancel/`, { method: "POST" });
  if (res && res.ok) {
    showToast("Rezerwacja anulowana. Gość otrzymał powiadomienie.", "success");
    await loadOwnerBookings();
    await loadOwnerStats();
  } else {
    showToast("Błąd podczas anulowania rezerwacji.", "error");
  }
}

// ===== FILTRY REZERWACJI =====
document.getElementById("filter-status")?.addEventListener("change", () => loadOwnerBookings());
document.getElementById("filter-offer")?.addEventListener("change",  () => loadOwnerBookings());

// ===== START =====
document.addEventListener("DOMContentLoaded", loadOwnerData);

// ===== PRZEŁĄCZANIE AKTYWNOŚCI (WIDOCZNOŚCI) OFERTY =====
async function toggleOfferActive(offerId) {
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${offerId}/toggle-active/`, {
      method: "POST"
    });
    if (!res || !res.ok) throw new Error("Błąd podczas przełączania aktywności obiektu.");
    const data = await res.json();
    
    ownerOffers = ownerOffers.map(o => o.id === offerId ? { ...o, is_active: data.is_active } : o);
    renderOwnerOffers(ownerOffers);
    showToast(data.is_active ? "Obiekt jest teraz widoczny." : "Obiekt został ukryty.", "success");
  } catch (err) {
    showToast(err.message || "Błąd sieci.", "error");
  }
}

// ===== ZARZĄDZANIE BLOKADAMI DOSTĘPNOŚCI =====
let currentBlockOfferId = null;

function openBlockModal(offerId, offerTitle) {
  currentBlockOfferId = offerId;
  document.getElementById("block-modal-title").textContent = `Zarządzaj dostępnością: ${offerTitle}`;
  document.getElementById("block-start-date").value = "";
  document.getElementById("block-end-date").value = "";
  document.getElementById("block-modal").style.display = "flex";
  loadOfferBlocks(offerId);
}

function closeBlockModal() {
  document.getElementById("block-modal").style.display = "none";
  currentBlockOfferId = null;
}

async function loadOfferBlocks(offerId) {
  const container = document.getElementById("block-list-container");
  container.innerHTML = `<p style="color:#666;">Ładowanie okresów...</p>`;
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${offerId}/blocks/`);
    if (!res || !res.ok) throw new Error("Nie udało się załadować blokad.");
    const blocks = await res.json();
    if (blocks.length === 0) {
      container.innerHTML = `<p style="color:#666; font-size:14px; margin:0;">Brak zdefiniowanych blokad w tym obiekcie.</p>`;
      return;
    }
    container.innerHTML = blocks.map(b => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid #eef2f6;">
        <span style="font-size:14px; color:#374151;">📅 <strong>${escapeHTML(b.start_date)}</strong> do <strong>${escapeHTML(b.end_date)}</strong></span>
        <button class="btn-danger" style="padding:4px 8px; font-size:12px; margin:0;" onclick="deleteOfferBlock(${b.id}, ${offerId})">Usuń</button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p style="color:red; font-size:14px; margin:0;">Błąd ładowania: ${escapeHTML(err.message)}</p>`;
  }
}

async function handleBlockSubmit(e) {
  e.preventDefault();
  if (!currentBlockOfferId) return;
  
  const start = document.getElementById("block-start-date").value;
  const end = document.getElementById("block-end-date").value;
  
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${currentBlockOfferId}/blocks/`, {
      method: "POST",
      body: JSON.stringify({ start_date: start, end_date: end })
    });
    if (!res || !res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Błąd podczas dodawania blokady.");
    }
    
    document.getElementById("block-start-date").value = "";
    document.getElementById("block-end-date").value = "";
    loadOfferBlocks(currentBlockOfferId);
    showToast("Dodano blokadę terminu.", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function deleteOfferBlock(blockId, offerId) {
  if (!confirm("Czy na pewno chcesz usunąć tę blokadę dostępności?")) return;
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/blocks/${blockId}/`, {
      method: "DELETE"
    });
    if (!res || !res.ok) throw new Error("Błąd podczas usuwania blokady.");
    loadOfferBlocks(offerId);
    showToast("Usunięto blokadę terminu.", "success");
  } catch (err) {
    showToast(err.message, "error");
  }
}
