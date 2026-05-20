const urlParams = new URLSearchParams(window.location.search);
const offerId = urlParams.get("id");

const bookingDataRaw = localStorage.getItem("bookspace_booking");
let bookingData = null;

if (!bookingDataRaw) {
  alert("Brak danych rezerwacji. Wybierz ofertę jeszcze raz.");
  window.location.href = "oferty.html";
} else {
  bookingData = JSON.parse(bookingDataRaw);
}

function formatDate(dateString) {
  if (!dateString) return "---";

  const date = new Date(dateString);

  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
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

function renderSummary() {
  if (!bookingData) return;

  document.getElementById("summary-object").textContent = bookingData.offer_title || "---";
  document.getElementById("summary-location").textContent = bookingData.offer_location || "---";

  document.getElementById("summary-term").textContent =
    `${formatDate(bookingData.check_in)} – ${formatDate(bookingData.check_out)}`;

  document.getElementById("summary-nights").textContent =
    `${bookingData.nights} ${bookingData.nights === 1 ? "noc" : "noce"}`;

  document.getElementById("summary-guests").textContent = formatGuests(bookingData.guests);
  document.getElementById("summary-rooms").textContent = formatRooms(bookingData.rooms);
  document.getElementById("summary-room-type").textContent = bookingData.room_type || "---";
  document.getElementById("summary-price").textContent = `${bookingData.total_price || 0} zł`;
}

function goBackToChoice() {
  const id = offerId || bookingData.offer_id;

  window.location.href = `rezerwacja-wybor.html?id=${id}`;
}

function goNextToPayment() {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const country = document.getElementById("country").value;
  const notes = document.getElementById("notes").value.trim();
  const emailConfirmation = document.getElementById("emailConfirmation").checked;
  const termsAccepted = document.getElementById("termsAccepted").checked;
  const message = document.getElementById("booking-data-message");

  message.textContent = "";
  message.style.color = "red";

  if (!firstName || !lastName || !email || !phone) {
    message.textContent = "Uzupełnij imię, nazwisko, e-mail i telefon.";
    return;
  }

  if (!termsAccepted) {
    message.textContent = "Musisz zaakceptować warunki rezerwacji.";
    return;
  }

  const updatedBookingData = {
    ...bookingData,

    customer_first_name: firstName,
    customer_last_name: lastName,
    customer_email: email,
    customer_phone: phone,
    customer_country: country,
    customer_notes: notes,
    email_confirmation: emailConfirmation,
    terms_accepted: termsAccepted
  };

  localStorage.setItem("bookspace_booking", JSON.stringify(updatedBookingData));

  const id = offerId || bookingData.offer_id;

  window.location.href = `rezerwacja-platnosc.html?id=${id}`;
}

document.addEventListener("DOMContentLoaded", () => {
  renderSummary();

  const backBtn = document.getElementById("back-to-choice-btn");
  const form = document.getElementById("booking-data-form");

  backBtn.addEventListener("click", goBackToChoice);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    goNextToPayment();
  });
});