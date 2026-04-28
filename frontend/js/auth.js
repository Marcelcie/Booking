function getAuthToken() {
  return localStorage.getItem("bookspace_token");
}

function setAuthToken(token) {
  localStorage.setItem("bookspace_token", token);
}

function removeAuthToken() {
  localStorage.removeItem("bookspace_token");
}

function getHomePath() {
  return window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
}

async function fetchUserProfile() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/me/", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Token wygasł lub jest nieprawidłowy
      removeAuthToken();
      return null;
    }

    if (!response.ok) throw new Error("Błąd pobierania profilu");
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function updateNavbar() {
  const guestLinks = document.getElementById("guest-links");
  const accountLinks = document.getElementById("account-links");
  
  if (!guestLinks || !accountLinks) return;

  const user = await fetchUserProfile();

  if (user) {
    guestLinks.style.display = "none";
    accountLinks.style.display = "flex";
  } else {
    guestLinks.style.display = "flex";
    accountLinks.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  updateNavbar();

  // ----- LOGOWANIE -----
  const loginForm = document.getElementById("mock-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Uzupełnij e-mail i hasło.");
        return;
      }

      try {
        // Wysyłamy prośbę o token z backendu
        // Używamy emaila jako username, bo tak ustawiliśmy to w backendzie
        const response = await fetch("http://127.0.0.1:8000/api/token/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password: password })
        });

        if (!response.ok) {
          alert("Nieprawidłowy e-mail lub hasło.");
          return;
        }

        const data = await response.json();
        
        // Zapisujemy token dostępu (JWT) w localStorage
        setAuthToken(data.access);
        
        // Przekierowujemy do konta
        window.location.href = "konto.html";
      } catch (error) {
        console.error(error);
        alert("Błąd połączenia z serwerem.");
      }
    });
  }

  // ----- REJESTRACJA -----
  const registerForm = document.getElementById("mock-register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fullname = document.getElementById("fullname").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirm-password").value.trim();

      if (!fullname || !email || !password || !confirmPassword) {
        alert("Uzupełnij wszystkie pola.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Hasła nie są takie same.");
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/register/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, fullname })
        });

        if (!response.ok) {
          const errData = await response.json();
          alert(errData.error || "Błąd podczas rejestracji.");
          return;
        }

        alert("Konto zostało pomyślnie utworzone! Możesz się teraz zalogować.");
        window.location.href = "login.html";
      } catch (error) {
        console.error(error);
        alert("Błąd połączenia z serwerem.");
      }
    });
  }

  // ----- WYLOGOWYWANIE -----
  document.querySelectorAll(".logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      removeAuthToken(); // Usuwamy token zabezpieczający
      window.location.href = getHomePath();
    });
  });

  // ----- ZAKŁADKA "MOJE KONTO" -----
  const accountPageName = document.getElementById("konto-user-name");
  const accountPageEmail = document.getElementById("konto-user-email");

  if (accountPageName || accountPageEmail) {
    const user = await fetchUserProfile();

    if (!user) {
      // Jeśli użytkownik nie jest zalogowany (brak tokena/zły token), wyrzuć go na stronę logowania
      window.location.href = "login.html";
      return;
    }

    if (accountPageName) accountPageName.textContent = user.name;
    if (accountPageEmail) accountPageEmail.textContent = user.email;
  }
});