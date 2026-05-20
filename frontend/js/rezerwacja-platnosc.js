const urlParams = new URLSearchParams(window.location.search);
const offerId = urlParams.get("id");

const bookingDataRaw = localStorage.getItem("bookspace_booking");
let bookingData = null;

if (!bookingDataRaw) {
  alert("Brak danych rezerwacji. Zacznij rezerwację od wyboru oferty.");
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

function renderPaymentSummary() {
  if (!bookingData) return;

  document.getElementById("payment-offer-image").src =
    bookingData.offer_image || "https://picsum.photos/seed/rezerwacja2/600/400";

  document.getElementById("payment-offer-image").alt =
    bookingData.offer_title || "Wybrana oferta";

  document.getElementById("payment-offer-title").textContent =
    bookingData.offer_title || "---";

  document.getElementById("payment-offer-location").textContent =
    `📍 ${bookingData.offer_location || "---"}`;

  document.getElementById("payment-term").textContent =
    `${formatDate(bookingData.check_in)} – ${formatDate(bookingData.check_out)}`;

  document.getElementById("payment-guests").textContent =
    formatGuests(bookingData.guests);

  document.getElementById("payment-room-type").textContent =
    bookingData.room_type || "---";

  document.getElementById("payment-nights-label").textContent =
    `${bookingData.nights || 0} ${bookingData.nights === 1 ? "noc" : "noce"}`;

  document.getElementById("payment-stay-price").textContent =
    `${bookingData.total_price || 0} zł`;

  document.getElementById("payment-total-price").textContent =
    `${bookingData.total_price || 0} zł`;
}

function getSelectedPaymentMethod() {
  const selected = document.querySelector('input[name="payment"]:checked');
  return selected ? selected.value : "card";
}

function updatePaymentMethodView() {
  const method = getSelectedPaymentMethod();

  document.querySelectorAll(".payment-method").forEach(label => {
    label.classList.remove("selected");
  });

  const selectedInput = document.querySelector(`input[name="payment"][value="${method}"]`);

  if (selectedInput) {
    selectedInput.closest(".payment-method").classList.add("selected");
  }

  document.getElementById("card-payment-fields").style.display =
    method === "card" ? "block" : "none";

  document.getElementById("blik-payment-fields").style.display =
    method === "blik" ? "block" : "none";

  document.getElementById("paypal-payment-info").style.display =
    method === "paypal" ? "block" : "none";

  document.getElementById("transfer-payment-info").style.display =
    method === "transfer" ? "block" : "none";
}

function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

function formatCardNumber(value) {
  const digits = onlyDigits(value).slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function validatePayment() {
  const method = getSelectedPaymentMethod();
  const message = document.getElementById("payment-message");

  message.textContent = "";
  message.style.color = "red";

  if (method === "card") {
    const cardName = document.getElementById("cardName").value.trim();
    const cardNumber = onlyDigits(document.getElementById("cardNumber").value);
    const expiry = document.getElementById("expiry").value.trim();
    const cvv = onlyDigits(document.getElementById("cvv").value);

    if (!cardName || !cardNumber || !expiry || !cvv) {
      message.textContent = "Uzupełnij dane karty.";
      return false;
    }

    if (cardNumber.length !== 16) {
      message.textContent = "Numer karty musi mieć 16 cyfr.";
      return false;
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      message.textContent = "Data ważności musi być w formacie MM/RR.";
      return false;
    }

    if (cvv.length !== 3) {
      message.textContent = "CVV musi mieć 3 cyfry.";
      return false;
    }
  }

  if (method === "blik") {
    const blikCode = document.getElementById("blikCode").value.trim();

    if (!/^[0-9]{6}$/.test(blikCode)) {
      message.textContent = "Kod BLIK musi mieć 6 cyfr.";
      return false;
    }
  }

  return true;
}

function goBackToData() {
  const id = offerId || bookingData.offer_id;
  window.location.href = `rezerwacja-dane.html?id=${id}`;
}

async function finishReservation() {
  if (!bookingData) {
    alert("Brak danych rezerwacji.");
    window.location.href = "oferty.html";
    return;
  }

  if (!validatePayment()) {
    return;
  }

  const token = localStorage.getItem("bookspace_token");
  if (!token) {
    alert("Musisz być zalogowany, aby dokonać rezerwacji. Zaraz zostaniesz przekierowany do logowania.");
    window.location.href = "login.html";
    return;
  }

  const method = getSelectedPaymentMethod();

  try {
    const response = await fetch("http://127.0.0.1:8000/api/bookings/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        offer: Number(bookingData.offer_id),
        check_in: bookingData.check_in,
        check_out: bookingData.check_out,
        total_price: Number(bookingData.total_price)
      })
    });

    if (!response.ok) {
      throw new Error("Błąd zapisu rezerwacji w bazie danych.");
    }

    const savedBooking = await response.json();
    console.log("Rezerwacja zapisana w bazie Supabase:", savedBooking);

    const finalReservation = {
      ...bookingData,
      reservation_id: `BS-${savedBooking.id}`,
      payment_method: method,
      payment_status: "paid",
      reservation_status: "confirmed",
      created_at: savedBooking.created_at
    };

    localStorage.setItem("bookspace_booking", JSON.stringify(finalReservation));

    const reservationsRaw = localStorage.getItem("bookspace_reservations");
    const reservations = reservationsRaw ? JSON.parse(reservationsRaw) : [];

    reservations.push(finalReservation);

    localStorage.setItem("bookspace_reservations", JSON.stringify(reservations));

    const message = document.getElementById("payment-message");
    message.style.color = "green";
    message.textContent = "Rezerwacja została pomyślnie zapisana w bazie danych! Zaraz przejdziesz do konta.";

    setTimeout(() => {
      window.location.href = "konto.html";
    }, 1200);
  } catch (error) {
    console.error("Błąd zapisu rezerwacji:", error);
    alert("Nie udało się potwierdzić rezerwacji w bazie danych. Upewnij się, że jesteś zalogowany.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderPaymentSummary();
  updatePaymentMethodView();

  const backBtn = document.getElementById("back-to-data-btn");
  const paymentForm = document.getElementById("payment-form");
  const cardNumberInput = document.getElementById("cardNumber");
  const expiryInput = document.getElementById("expiry");
  const cvvInput = document.getElementById("cvv");
  const blikInput = document.getElementById("blikCode");

  backBtn.addEventListener("click", goBackToData);

  paymentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    finishReservation();
  });

  document.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener("change", updatePaymentMethodView);
  });

  cardNumberInput.addEventListener("input", () => {
    cardNumberInput.value = formatCardNumber(cardNumberInput.value);
  });

  expiryInput.addEventListener("input", () => {
    expiryInput.value = formatExpiry(expiryInput.value);
  });

  cvvInput.addEventListener("input", () => {
    cvvInput.value = onlyDigits(cvvInput.value).slice(0, 3);
  });

  blikInput.addEventListener("input", () => {
    blikInput.value = onlyDigits(blikInput.value).slice(0, 6);
  });
});