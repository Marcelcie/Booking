const urlParams = new URLSearchParams(window.location.search);
const offerId = urlParams.get("id");

let currentOffer = null;
let offerRooms = [];

if (!offerId) {
  alert("Brak ID oferty. Wróć do listy ofert i wybierz ofertę ponownie.");
  window.location.href = "oferty.html";
}

async function loadOffer() {
  try {
    const response = await fetch(`${API_BASE}/api/offers/${offerId}/`);

    if (!response.ok) {
      throw new Error("Nie udało się pobrać danych oferty.");
    }

    currentOffer = await response.json();

    offerRooms = currentOffer.rooms || [];
    renderRoomOptions();

    const imgEl = document.getElementById("summary-image");
    imgEl.src = currentOffer.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop";
    imgEl.onerror = () => { imgEl.src = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop"; };
    imgEl.alt = currentOffer.title;
    document.getElementById("summary-type").textContent = currentOffer.type;
    document.getElementById("summary-title").textContent = currentOffer.title;
    document.getElementById("summary-location").textContent = `📍 ${currentOffer.location}`;
    document.getElementById("summary-rating").textContent = currentOffer.rating;
    document.getElementById("summary-rating-label").textContent = getRatingLabel(currentOffer.rating);
    
    // Ustaw minimalną datę zameldowania na dziś
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("checkin").setAttribute("min", today);
    document.getElementById("checkout").setAttribute("min", today);

    updateSummary();
  } catch (error) {
    console.error("Błąd ładowania oferty:", error);
    alert("Nie udało się załadować oferty.");
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

function calculateNights(checkin, checkout) {
  if (!checkin || !checkout) return 0;

  const start = new Date(checkin);
  const end = new Date(checkout);
  const difference = end - start;

  if (difference <= 0) return 0;

  return difference / (1000 * 60 * 60 * 24);
}

function renderRoomOptions() {
  const container = document.getElementById("dynamic-rooms-list");
  if (!container) return;
  if (!offerRooms || offerRooms.length === 0) {
    container.innerHTML = `<p style="color:#ef4444; font-weight:bold;">Brak zdefiniowanych pokoi dla tego obiektu. Rezerwacja niemożliwa.</p>`;
    return;
  }
  container.innerHTML = offerRooms.map((room, index) => `
    <label class="room-option ${index === 0 ? 'active-option' : ''}">
      <input type="radio" name="roomType" value="${room.id}" ${index === 0 ? 'checked' : ''} onchange="updateSummary()" />
      <div class="room-option-box">
        <div>
          <h3>${escapeHTML(room.name)}</h3>
          <p>Pojemność: ${room.capacity} os. • Wolnych: ${room.quantity}</p>
        </div>
        <strong>${room.price} zł / noc</strong>
      </div>
    </label>
  `).join('');

  // Add listeners to new radio buttons for active class switching
  document.querySelectorAll('input[name="roomType"]').forEach(radio => {
    radio.addEventListener("change", function() {
      document.querySelectorAll(".room-option").forEach(lbl => lbl.classList.remove("active-option"));
      if (this.checked) {
        this.closest(".room-option").classList.add("active-option");
      }
    });
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, match => {
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
    return escapeMap[match];
  });
}

function getSelectedRoom() {
  if (offerRooms.length === 0) return null;
  const selectedInput = document.querySelector('input[name="roomType"]:checked');
  const selectedId = selectedInput ? parseInt(selectedInput.value, 10) : offerRooms[0].id;
  const room = offerRooms.find(r => r.id === selectedId);
  return room || offerRooms[0];
}

function formatGuests(value) {
  const number = Number(value);

  if (number === 1) return "1 osoba";
  if (number >= 2 && number <= 4) return `${number} osoby`;
  return `${number} osób`;
}

function formatRooms(value) {
  const number = Number(value);

  if (number === 1) return "1 pokój";
  if (number >= 2 && number <= 4) return `${number} pokoje`;
  return `${number} pokoi`;
}

function updateSummary() {
  const checkin = document.getElementById("checkin").value;
  const checkout = document.getElementById("checkout").value;
  const guests = document.getElementById("guests").value;
  const rooms = document.getElementById("rooms").value;

  const nights = calculateNights(checkin, checkout);
  const selectedRoom = getSelectedRoom();
  const totalPrice = nights * selectedRoom.price * Number(rooms);

  // Automatycznie ustaw minimalną datę wymeldowania
  if (checkin) {
    const nextDay = new Date(checkin);
    nextDay.setDate(nextDay.getDate() + 1);
    document.getElementById("checkout").setAttribute("min", nextDay.toISOString().split('T')[0]);
  }

  document.getElementById("summary-stay").innerHTML = `
    <h4>Twój pobyt</h4>
    <p><strong>Zameldowanie:</strong> ${checkin || "---"}</p>
    <p><strong>Wymeldowanie:</strong> ${checkout || "---"}</p>
    <p><strong>Długość pobytu:</strong> ${nights} ${nights === 1 ? "noc" : "noce"}</p>
    <p><strong>Goście:</strong> ${formatGuests(guests)}</p>
    <p><strong>Pokoje:</strong> ${formatRooms(rooms)}</p>
    <p><strong>Wariant:</strong> ${selectedRoom.name}</p>
  `;

  document.getElementById("summary-total-price").textContent = `${totalPrice} zł`;
}

function goBackToOffer() {
  window.location.href = `oferta-szczegoly.html?id=${offerId}`;
}

async function checkAvailability(checkin, checkout) {
  try {
    const response = await fetch(
      `${API_BASE}/api/offers/${offerId}/availability/?check_in=${checkin}&check_out=${checkout}`
    );
    if (!response.ok) return true; // W razie błędu pozwól kontynuować
    const data = await response.json();
    return data.available;
  } catch (error) {
    console.error("Błąd sprawdzania dostępności:", error);
    return true;
  }
}

async function goNext() {
  const checkin = document.getElementById("checkin").value;
  const checkout = document.getElementById("checkout").value;
  const guests = document.getElementById("guests").value;
  const rooms = document.getElementById("rooms").value;

  const nights = calculateNights(checkin, checkout);
  const selectedRoom = getSelectedRoom();

  if (!currentOffer) {
    alert("Oferta jeszcze się ładuje. Spróbuj za chwilę.");
    return;
  }

  if (!checkin || !checkout) {
    alert("Wybierz datę zameldowania i wymeldowania.");
    return;
  }

  if (nights <= 0) {
    alert("Data wymeldowania musi być późniejsza niż data zameldowania.");
    return;
  }
  
  // Sprawdź, czy data zameldowania nie jest w przeszłości
  const today = new Date().toISOString().split('T')[0];
  if (checkin < today) {
    alert("Data zameldowania nie może być w przeszłości.");
    return;
  }

  // Sprawdź dostępność w wybranym terminie
  const available = await checkAvailability(checkin, checkout);
  if (!available) {
    alert("Ten obiekt jest już zarezerwowany w wybranym terminie. Proszę wybrać inne daty.");
    return;
  }

  const bookingData = {
    offer_id: Number(offerId),
    offer_title: currentOffer.title,
    offer_type: currentOffer.type,
    offer_location: currentOffer.location,
    offer_image: currentOffer.image_url,
    offer_rating: currentOffer.rating,

    check_in: checkin,
    check_out: checkout,
    nights: nights,
    guests: Number(guests),
    rooms: Number(rooms),

    room_id: selectedRoom.id,
    room_type: selectedRoom.name,
    price_per_night: selectedRoom.price,
    total_price: nights * selectedRoom.price * Number(rooms)
  };

  localStorage.setItem("bookspace_booking", JSON.stringify(bookingData));

  window.location.href = `rezerwacja-dane.html?id=${offerId}`;
}

document.addEventListener("DOMContentLoaded", () => {
  const bookingChoiceForm = document.getElementById("booking-choice-form");
  const backToOfferBtn = document.getElementById("back-to-offer-btn");

  bookingChoiceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    goNext();
  });

  backToOfferBtn.addEventListener("click", goBackToOffer);

  document.getElementById("checkin").addEventListener("change", updateSummary);
  document.getElementById("checkout").addEventListener("change", updateSummary);
  document.getElementById("guests").addEventListener("change", updateSummary);
  document.getElementById("rooms").addEventListener("change", updateSummary);

  document.querySelectorAll('input[name="roomType"]').forEach(input => {
    input.addEventListener("change", () => {
      document.querySelectorAll(".room-option").forEach(option => {
        option.classList.remove("active-option");
      });

      input.closest(".room-option").classList.add("active-option");
      updateSummary();
    });
  });

  loadOffer();
});