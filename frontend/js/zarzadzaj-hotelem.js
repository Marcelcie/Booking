let currentOfferId = null;
let offerData = null;

async function loadManageData() {
  const urlParams = new URLSearchParams(window.location.search);
  currentOfferId = urlParams.get('id');

  if (!currentOfferId) {
    document.getElementById("manage-title").textContent = "Brak ID obiektu";
    return;
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${currentOfferId}/`);
    if (!res || !res.ok) throw new Error("Nie udało się pobrać danych obiektu.");
    offerData = await res.json();
    document.getElementById("manage-title").textContent = `Zarządzaj: ${offerData.title}`;
    
    renderBasicData();
    renderRooms();
    renderFAQs();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===== DANE PODSTAWOWE =====
function renderBasicData() {
  const container = document.getElementById("basic-data-container");
  const fields = [
    { key: "title", label: "Nazwa", value: offerData.title, type: "text" },
    { key: "location", label: "Lokalizacja", value: offerData.location, type: "text" },
    { key: "price", label: "Cena bazowa", value: offerData.price, type: "number" },
    { key: "stars", label: "Gwiazdki", value: offerData.stars, type: "number", min: 1, max: 5 },
    { key: "description", label: "Opis", value: offerData.description, type: "textarea" },
    { key: "tags", label: "Tagi", value: (offerData.tags_list || []).join(', '), type: "text" }
  ];

  container.innerHTML = fields.map(f => `
    <div class="field-row" id="field-row-${f.key}">
      <div class="field-label">${f.label}</div>
      <div class="field-value" id="field-val-${f.key}">${escapeHTML(String(f.value))}</div>
      <div class="action-btns">
        <span class="edit-icon" onclick="startInlineEdit('${f.key}', '${f.type}', '${escapeHTML(String(f.value).replace(/'/g, "\\'"))}')">✏️</span>
      </div>
    </div>
  `).join('');
}

function startInlineEdit(key, type, currentValue) {
  const row = document.getElementById(`field-row-${key}`);
  let inputHtml = '';
  if (type === 'textarea') {
    inputHtml = `<textarea id="inline-input-${key}" class="inline-edit-input" rows="3">${currentValue}</textarea>`;
  } else {
    inputHtml = `<input type="${type}" id="inline-input-${key}" class="inline-edit-input" value="${currentValue}">`;
  }

  row.innerHTML = `
    <div class="field-label">${row.querySelector('.field-label').textContent}</div>
    <div class="field-value">${inputHtml}</div>
    <div class="action-btns">
      <button class="btn-primary" style="padding:4px 8px; font-size:12px;" onclick="saveInlineEdit('${key}')">Zapisz</button>
      <button class="btn-secondary" style="padding:4px 8px; font-size:12px;" onclick="renderBasicData()">Anuluj</button>
    </div>
  `;
}

async function saveInlineEdit(key) {
  const newVal = document.getElementById(`inline-input-${key}`).value;
  
  const formData = new FormData();
  if (key === 'tags') {
    formData.append('tags', JSON.stringify(newVal.split(',').map(t => t.trim()).filter(Boolean)));
  } else {
    formData.append(key, newVal);
  }

  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${currentOfferId}/`, {
      method: "PATCH",
      body: formData
    });
    if (!res || !res.ok) throw new Error("Błąd zapisu.");
    showToast("Zapisano zmiany.", "success");
    await loadManageData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===== POKOJE =====
function renderRooms() {
  const container = document.getElementById("rooms-list");
  if (!offerData.rooms || offerData.rooms.length === 0) {
    container.innerHTML = `<p style="color:#666;">Brak zdefiniowanych pokoi.</p>`;
    return;
  }
  container.innerHTML = offerData.rooms.map(r => `
    <div class="room-card">
      <div>
        <strong>${escapeHTML(r.name)}</strong><br>
        <span style="font-size:13px; color:#64748b;">Pojemność: ${r.capacity} os. | Ilość pokoi: ${r.quantity}</span>
      </div>
      <button class="btn-danger" style="padding:6px 10px; font-size:12px;" onclick="deleteRoom(${r.id})">Usuń</button>
    </div>
  `).join('');
}

document.getElementById("add-room-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("new-room-name").value;
  const cap = document.getElementById("new-room-capacity").value;
  const qty = document.getElementById("new-room-quantity").value;

  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${currentOfferId}/rooms/`, {
      method: "POST",
      body: JSON.stringify({ name: name, capacity: cap, quantity: qty })
    });
    if (!res.ok) throw new Error("Błąd dodawania pokoju.");
    document.getElementById("add-room-form").reset();
    showToast("Dodano pokój.", "success");
    await loadManageData();
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function deleteRoom(id) {
  if (!confirm("Usunąć ten pokój?")) return;
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/rooms/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error("Błąd usuwania.");
    showToast("Pokój usunięty.", "success");
    await loadManageData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ===== FAQ =====
function renderFAQs() {
  const container = document.getElementById("faqs-list");
  if (!offerData.faqs || offerData.faqs.length === 0) {
    container.innerHTML = `<p style="color:#666;">Brak FAQ.</p>`;
    return;
  }
  container.innerHTML = offerData.faqs.map(f => `
    <div class="faq-card" style="align-items:flex-start;">
      <div style="flex:1;">
        <strong style="color:#1e293b;">Q: ${escapeHTML(f.question)}</strong><br>
        <span style="font-size:13px; color:#475569; display:block; margin-top:4px;">A: ${escapeHTML(f.answer)}</span>
      </div>
      <button class="btn-danger" style="padding:6px 10px; font-size:12px; margin-left:15px;" onclick="deleteFAQ(${f.id})">Usuń</button>
    </div>
  `).join('');
}

document.getElementById("add-faq-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = document.getElementById("new-faq-question").value;
  const a = document.getElementById("new-faq-answer").value;

  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/offers/${currentOfferId}/faqs/`, {
      method: "POST",
      body: JSON.stringify({ question: q, answer: a })
    });
    if (!res.ok) throw new Error("Błąd dodawania FAQ.");
    document.getElementById("add-faq-form").reset();
    showToast("Dodano FAQ.", "success");
    await loadManageData();
  } catch (err) {
    showToast(err.message, "error");
  }
});

async function deleteFAQ(id) {
  if (!confirm("Usunąć to FAQ?")) return;
  try {
    const res = await fetchWithAuth(`${API_BASE}/api/owner/faqs/${id}/`, { method: "DELETE" });
    if (!res.ok) throw new Error("Błąd usuwania.");
    showToast("FAQ usunięte.", "success");
    await loadManageData();
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  loadManageData();
});
