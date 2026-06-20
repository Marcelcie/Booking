document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("bookspace_token");
  
  if (!token) {
    // If not logged in, redirect to login page (auth.js handles this, but we reinforce it)
    return;
  }

  const bookingsGrid = document.querySelector(".bookings-grid");
  const reservationsCount = document.getElementById("reservations-count");

  if (!bookingsGrid) return;

  function formatDate(dateString) {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  }
  
  function getStatusBadge(status) {
    if (status === 'cancelled') {
      return '<span class="booking-status cancelled" style="background: #fef2f2; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Anulowana</span>';
    }
    return '<span class="booking-status active" style="background: #f0fdf4; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">Aktywna</span>';
  }

  try {
    const response = await fetch(`${API_BASE}/api/bookings/`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem("bookspace_token");
      window.location.href = "login.html";
      return;
    }

    if (!response.ok) {
      throw new Error("Błąd podczas pobierania rezerwacji.");
    }

    const bookings = await response.json();
    console.log("Pobrane rezerwacje użytkownika:", bookings);

    // Update the counter (only count confirmed)
    const activeCount = bookings.filter(b => b.status !== 'cancelled').length;
    if (reservationsCount) {
      reservationsCount.textContent = activeCount;
    }

    if (bookings.length === 0) {
      bookingsGrid.innerHTML = `
        <div class="no-bookings" style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; background: #f8fbff; border: 1px dashed #c3dafb; border-radius: 16px;">
          <p style="color: #4b5563; font-size: 18px; margin-bottom: 15px;">Nie masz jeszcze żadnych aktywnych rezerwacji.</p>
          <a href="oferty.html" class="settings-btn" style="display: inline-block; text-decoration: none;">Przeglądaj oferty noclegów</a>
        </div>
      `;
      return;
    }

    // Render bookings
    bookingsGrid.innerHTML = bookings.map(booking => {
      const offer = booking.offer_details || {};
      const title = offer.title || "Oferta noclegowa";
      const location = offer.location || "Polska";
      const price = booking.total_price || "0.00";
      const checkInFormatted = formatDate(booking.check_in);
      const checkOutFormatted = formatDate(booking.check_out);
      const offerId = offer.id || booking.offer;
      const bookingStatus = booking.status || 'confirmed';
      const isCancelled = bookingStatus === 'cancelled';

      return `
        <div class="booking-card" style="${isCancelled ? 'opacity: 0.6;' : ''}">
          <div class="booking-top" style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 20px; font-weight: 700; color: #1d3557;">${title}</h4>
            ${getStatusBadge(bookingStatus)}
          </div>
          <p style="margin: 6px 0; color: #4b5563;"><strong>Termin:</strong> ${checkInFormatted} – ${checkOutFormatted}</p>
          <p style="margin: 6px 0; color: #4b5563;"><strong>Lokalizacja:</strong> 📍 ${location}</p>
          <p style="margin: 6px 0; color: #4b5563;"><strong>Pokój:</strong> ${booking.room_type || 'standard'}</p>
          <p style="margin: 6px 0; color: #4b5563;"><strong>Koszt całkowity:</strong> <span style="color: #1e88e5; font-weight: bold;">${price} zł</span></p>
          <div style="margin-top: 14px; display: flex; gap: 10px;">
            <a href="oferta-szczegoly.html?id=${offerId}" class="offer-btn" style="display: inline-block; font-size: 13px; text-decoration: none; padding: 8px 14px; background: #eef6ff; color: #1e88e5; border-radius: 8px; font-weight: bold; border: 1px solid #d9e8fb; transition: 0.2s;">Zobacz szczegóły</a>
            ${!isCancelled ? `<button type="button" class="cancel-booking-btn" data-booking-id="${booking.id}" style="font-size: 13px; padding: 8px 14px; background: #fef2f2; color: #dc2626; border-radius: 8px; font-weight: bold; border: 1px solid #fecaca; cursor: pointer; transition: 0.2s;">Anuluj rezerwację</button>` : ''}
          </div>
        </div>
      `;
    }).join("");

    // Bind cancel buttons
    document.querySelectorAll(".cancel-booking-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const bookingId = btn.dataset.bookingId;
        if (!confirm("Czy na pewno chcesz anulować tę rezerwację?")) return;
        
        try {
          const cancelResponse = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          });
          
          if (cancelResponse.ok) {
            alert("Rezerwacja została anulowana.");
            window.location.reload();
          } else {
            const errData = await cancelResponse.json();
            alert(errData.error || "Nie udało się anulować rezerwacji.");
          }
        } catch (error) {
          console.error("Błąd anulowania:", error);
          alert("Wystąpił błąd przy anulowaniu rezerwacji.");
        }
      });
    });

  } catch (error) {
    console.error("Błąd podczas ładowania rezerwacji:", error);
    bookingsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; color: red; text-align: center; padding: 20px;">
        Wystąpił błąd podczas ładowania Twoich rezerwacji. Spróbuj zalogować się ponownie.
      </div>
    `;
  }
});
