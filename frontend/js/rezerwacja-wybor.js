const urlParams = new URLSearchParams(window.location.search);
const offerId = urlParams.get("id");

let currentOffer = null;

const roomPrices = {
  standard: 0,
  deluxe: 0,
  premium: 0
};

if (!offerId) {
  alert("Brak ID oferty. Wróć do listy ofert i wybierz ofertę ponownie.");
  window.location.href = "oferty.html";
}

async function loadOffer() {
  try {
    const response = await fetch(`http://127.0.0.1:8000/api/offers/${offerId}/`);

    if (!response.ok) {
      throw new Error("Nie udało się pobrać danych oferty.");
    }

    currentOffer = await response.json();

    const basePrice = Number(currentOffer.price) || 0;

    roomPrices.standard = basePrice;
    roomPrices.deluxe = basePrice + 100;
    roomPrices.premium = basePrice + 270;

    document.getElementById("standard-price").textContent = `${roomPrices.standard} zł / noc`;
    document.getElementById("deluxe-price").textContent = `${roomPrices.deluxe} zł / noc`;
    document.getElementById("premium-price").textContent = `${roomPrices.premium} zł / noc`;

    document.getElementById("summary-image").src = currentOffer.image_url;
    document.getElementById("summary-image").alt = currentOffer.title;
    document.getElementById("summary-type").textContent = currentOffer.type;
    document.getElementById("summary-title").textContent = currentOffer.title;
    document.getElementById("summary-location").textContent = `📍 ${currentOffer.location}`;
    document.getElementById("summary-rating").textContent = currentOffer.rating;
    document.getElementById("summary-rating-label").textContent = getRatingLabel(currentOffer.rating);

    updateSummary();
  } catch (error) {
    console.error("Błąd ładowania oferty:", error);
    alert("Nie udało się załadować oferty.");
  }
}

function getRatingLabel(rating) {
  const value = Number(rating);

  if (value >= 9.5) return "Fantastyczny";
  if (value >= 9.0) return "Wspaniały";
  if (value >= 8.0) return "Bardzo dobry";
  if (value >= 7.0) return "Dobry";

  return "Przyzwoity";
}

function calculateNights(checkin, checkout) {
  if (!checkin || !checkout) return 0;

  const start = new Date(checkin);
  const end = new Date(checkout);
  const difference = end - start;

  if (difference <= 0) return 0;

  return difference / (1000 * 60 * 60 * 24);
}

function getSelectedRoom() {
  const selectedInput = document.querySelector('input[name="roomType"]:checked');
  const selectedValue = selectedInput ? selectedInput.value : "standard";

  if (selectedValue === "deluxe") {
    return {
      key: "deluxe",
      name: "Pokój Deluxe",
      price: roomPrices.deluxe
    };
  }

  if (selectedValue === "premium") {
    return {
      key: "premium",
      name: "Apartament Premium",
      price: roomPrices.premium
    };
  }

  return {
    key: "standard",
    name: "Pokój Standard",
    price: roomPrices.standard
  };
}

function formatGuests(value) {
  const number = Number(value);

  if (number === 1) return "1 osoba";
  return `${number} osoby`;
}

function formatRooms(value) {
  const number = Number(value);

  if (number === 1) return "1 pokój";
  return `${number} pokoje`;
}

function updateSummary() {
  const checkin = document.getElementById("checkin").value;
  const checkout = document.getElementById("checkout").value;
  const guests = document.getElementById("guests").value;
  const rooms = document.getElementById("rooms").value;

  const nights = calculateNights(checkin, checkout);
  const selectedRoom = getSelectedRoom();
  const totalPrice = nights * selectedRoom.price;

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

function goNext() {
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

    room_key: selectedRoom.key,
    room_type: selectedRoom.name,
    price_per_night: selectedRoom.price,
    total_price: nights * selectedRoom.price
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