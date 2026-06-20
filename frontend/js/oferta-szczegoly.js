document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const offerId = urlParams.get('id');

  if (offerId) {
    loadOfferDetails(offerId);
  } else {
    document.getElementById("details-header-content").innerHTML = "<h2>Nie znaleziono oferty.</h2>";
  }
});

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function loadOfferDetails(id) {
  try {
    const response = await fetch(`${API_BASE}/api/offers/${id}/`);
    if (!response.ok) throw new Error("Nie znaleziono oferty");
    const offer = await response.json();
    
    let bookedDates = [];
    try {
      const availResponse = await fetch(`${API_BASE}/api/offers/${id}/availability/`);
      if (availResponse.ok) {
        const availData = await availResponse.json();
        if (availData.booked_dates) {
          bookedDates = availData.booked_dates;
        }
      }
    } catch(e) { console.error("Błąd pobierania dostępności", e); }

    renderOfferDetails(offer, bookedDates);
  } catch (error) {
    console.error("Błąd:", error);
    document.getElementById("details-header-content").innerHTML = "<h2>Błąd ładowania szczegółów oferty.</h2>";
  }
}

function renderOfferDetails(offer, bookedDates = []) {
  // Nagłówek
  const headerContent = document.getElementById("details-header-content");
  if (headerContent) {
    headerContent.innerHTML = `
      <div>
        <span class="details-badge">${escapeHtml(offer.type)}</span>
        <h2>${escapeHtml(offer.title)}</h2>
        <p class="details-location">📍 ${escapeHtml(offer.location)}</p>
        <div class="details-stars-row">
          <div class="offer-stars">
            ${'<span class="star filled">★</span>'.repeat(offer.stars)}
            ${'<span class="star">☆</span>'.repeat(5 - offer.stars)}
          </div>
          <span class="offer-stars-text">${offer.stars}/5</span>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap: 15px; text-align: right;">
        <div style="display:flex; flex-direction:column; justify-content: center;">
          <span style="font-weight: bold; font-size: 16px; color: #1d3557;">${getRatingLabel(offer.rating)}</span>
          <span style="font-size: 13px; color: #718096;">${offer.reviews_count} opinii</span>
        </div>
        <div style="background-color: #3182ce; color: white; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${offer.rating}
        </div>
      </div>
    `;
    // Przywracamy grid układ z oryginalnego HTML
    headerContent.style.display = "flex";
    headerContent.style.justifyContent = "space-between";
    headerContent.style.alignItems = "center";
    headerContent.style.width = "100%";
  }

  // Galeria - bierzemy głowne zdjecie i generujemy placeholder poboczne, jesli ich nie ma
  const gallery = document.querySelector(".gallery-grid");
  if (gallery) {
    gallery.innerHTML = `
      <div class="gallery-main" style="position: relative;">
        <button class="favorite-btn"
          data-offer-id="${offer.id}"
          data-title="${escapeHtml(offer.title)}"
          data-location="${escapeHtml(offer.location)}"
          data-type="${escapeHtml(offer.type)}"
          data-price="${offer.price}"
          data-image="${escapeHtml(offer.image_url)}"
          data-link="oferta-szczegoly.html?id=${offer.id}"
          type="button">♡</button>
        <img src="${escapeHtml(offer.image_url)}" alt="${escapeHtml(offer.title)}" onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&h=650&fit=crop';" />
      </div>
      <div class="gallery-side">
        <img src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&h=300&fit=crop&seed=${offer.id}a" onerror="this.style.display='none'" />
        <img src="https://images.unsplash.com/photo-1582719478250-c89cae9dc85b?w=500&h=300&fit=crop&seed=${offer.id}b" onerror="this.style.display='none'" />
        <img src="https://images.unsplash.com/photo-1611892440504-42a416e85609?w=500&h=300&fit=crop&seed=${offer.id}c" onerror="this.style.display='none'" />
        <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500&h=300&fit=crop&seed=${offer.id}d" onerror="this.style.display='none'" />
      </div>
    `;
  }

  // Główna treść
  const mainContent = document.getElementById("details-main-content");
  if (mainContent) {
    const tagsArray = offer.tags_list || [];
    
    // Generowanie HTML dla opinii
    let reviewsHtml = '';
    if (offer.reviews && offer.reviews.length > 0) {
      reviewsHtml = `
        <div class="details-card">
          <h3>Prawdziwe opinie gości</h3>
          <div class="reviews-list">
            ${offer.reviews.map(review => `
              <div class="review-item" style="border-bottom: 1px solid #e2e8f0; padding: 15px 0; margin-bottom: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
                  <strong style="font-size: 16px; color: #1d3557;">${escapeHtml(review.author_name)}</strong>
                  <span style="background-color: #3182ce; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 14px;">${review.rating}/10</span>
                </div>
                <p style="color: #4a5568; font-size: 15px; margin: 0; line-height: 1.5;">${escapeHtml(review.body)}</p>
                <small style="color: #a0aec0; font-size: 12px; display: block; margin-top: 8px;">Dodano: ${escapeHtml(review.created_at)}</small>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Generowanie HTML dla FAQ
    let faqsHtml = '';
    if (offer.faqs && offer.faqs.length > 0) {
      faqsHtml = `
        <div class="details-card">
          <h3>Najczęściej zadawane pytania (FAQ)</h3>
          <div class="faq-list">
            ${offer.faqs.map(faq => `
              <div class="faq-item" style="border-bottom: 1px solid #e2e8f0; padding: 12px 0;">
                <strong style="color: #1d3557; display: block; font-size: 15px; margin-bottom: 5px;">${escapeHtml(faq.question)}</strong>
                <p style="color: #475569; font-size: 14px; margin: 0;">${escapeHtml(faq.answer)}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Generowanie HTML dla pokoi
    let roomsHtml = '';
    if (offer.rooms && offer.rooms.length > 0) {
      roomsHtml = `
        <div class="details-card">
          <h3>Dostępne pokoje</h3>
          <div class="rooms-list" style="display:flex; flex-direction:column; gap:10px;">
            ${offer.rooms.map(room => `
              <div class="room-item" style="background:#f8fafc; border:1px solid #e2e8f0; padding:15px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <strong style="color: #1d3557; font-size: 16px;">${escapeHtml(room.name)}</strong>
                  <span style="display:block; font-size:13px; color:#64748b; margin-top:4px;">Wielkość: ${room.capacity} os. | Ilość pokoi: ${room.quantity} | Cena: ${room.price} zł / noc</span>
                </div>
                <div style="font-size:24px; color:#3b82f6;">🛏️</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    mainContent.innerHTML = `
      <div class="details-card">
        <h3>Opis obiektu</h3>
        <p>${escapeHtml(offer.description)}</p>
      </div>
      <div class="details-card">
        <h3>Najważniejsze udogodnienia</h3>
        <div class="amenities-grid">
          ${tagsArray.map(tag => `<div class="amenity-item">✅ ${escapeHtml(tag)}</div>`).join('')}
        </div>
      </div>
      ${roomsHtml}
      ${faqsHtml}
      ${reviewsHtml}
    `;
  }

  // Booking box
  const bookingBox = document.getElementById("booking-box-content");
  if (bookingBox) {
    bookingBox.innerHTML = `
      <div class="booking-card">
        <p class="booking-small">Cena od</p>
        <h3>${offer.price} zł</h3>
        <p class="booking-sub">za noc</p>
        <div class="booking-info">
          <p><strong>Ocena:</strong> ${offer.rating}/10</p>
          <p><strong>Opinie:</strong> ${offer.reviews_count}</p>
          <p><strong>Typ obiektu:</strong> ${escapeHtml(offer.type)}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <label style="font-weight:bold; font-size: 14px; margin-bottom: 8px; display:block; color: #1d3557;">Dostępność obiektu:</label>
          <input type="text" id="inline-calendar" style="display:none;" />
        </div>

        <button type="button" class="booking-btn" onclick="window.location.href='rezerwacja-wybor.html?id=${offer.id}'">Zarezerwuj teraz</button>
        <button type="button" class="secondary-btn" onclick="window.location.href='oferty.html'">Wróć do ofert</button>
      </div>
    `;
    
    // Initialize flatpickr
    if (window.flatpickr) {
      flatpickr("#inline-calendar", {
        inline: true,
        minDate: "today",
        locale: "pl",
        disable: bookedDates.map(d => ({
            from: d.from,
            to: d.to
        }))
      });
    }
  }

  if (typeof window.bindFavoriteButtons === "function") {
    window.bindFavoriteButtons();
  }
}

function getRatingLabel(rating) {
  const value = Number(rating);
  if (value >= 9.0) return "Fantastyczny";
  if (value >= 8.0) return "Bardzo dobry";
  if (value >= 7.0) return "Dobry";
  if (value >= 4.0) return "Przeciętny";
  return "Zły";
}
