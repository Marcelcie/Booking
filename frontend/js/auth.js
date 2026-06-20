window.addEventListener("load", () => {
  const preloader = document.getElementById("global-preloader");
  if (preloader) {
    // Krótkie opóźnienie dla ładnego efektu
    setTimeout(() => {
      preloader.classList.add("hidden");
    }, 400);
  }
});

function getAuthToken() {
  return localStorage.getItem("bookspace_token");
}

function setAuthToken(token) {
  localStorage.setItem("bookspace_token", token);
}

function setRefreshToken(token) {
  localStorage.setItem("bookspace_refresh_token", token);
}

function getRefreshToken() {
  return localStorage.getItem("bookspace_refresh_token");
}

function removeAuthToken() {
  localStorage.removeItem("bookspace_token");
  localStorage.removeItem("bookspace_refresh_token");
}

function getHomePath() {
  return window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken })
    });

    if (!response.ok) {
      removeAuthToken();
      return false;
    }

    const data = await response.json();
    setAuthToken(data.access);
    return true;
  } catch (error) {
    console.error("Błąd odświeżania tokena:", error);
    return false;
  }
}

async function fetchUserProfile() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/api/me/`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      // Spróbuj odświeżyć token
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Powtórz request z nowym tokenem
        const retryResponse = await fetch(`${API_BASE}/api/me/`, {
          headers: {
            "Authorization": `Bearer ${getAuthToken()}`
          }
        });
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
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
    
    if (user.role === 'owner') {
      if (!document.getElementById("owner-nav-link")) {
        const ownerLink = document.createElement("a");
        ownerLink.id = "owner-nav-link";
        ownerLink.href = window.location.pathname.includes("/pages/") ? "moj-hotel.html" : "pages/moj-hotel.html";
        ownerLink.textContent = "Mój hotel";
        ownerLink.className = "account-link";
        
        const logoutBtn = document.querySelector(".logout-btn-link");
        if (logoutBtn) {
          accountLinks.insertBefore(ownerLink, logoutBtn);
        } else {
          accountLinks.appendChild(ownerLink);
        }
      }
    }
  } else {
    guestLinks.style.display = "flex";
    accountLinks.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  updateNavbar();

  // ----- POKAZYWANIE/UKRYWANIE HASŁA -----
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      togglePassword.textContent = type === "password" ? "👁️" : "🙈";
    });
  }

  // ----- LOGOWANIE -----
  const loginForm = document.getElementById("mock-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Uzupełnij e-mail i hasło.");
        return;
      }

      try {
        // Wysyłamy prośbę o token z backendu
        // Używamy emaila jako username, bo tak ustawiliśmy to w backendzie
        const response = await fetch(`${API_BASE}/api/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password: password })
        });

        if (!response.ok) {
          alert("Nieprawidłowy e-mail lub hasło.");
          return;
        }

        const data = await response.json();
        
        // Zapisujemy oba tokeny JWT w localStorage
        setAuthToken(data.access);
        setRefreshToken(data.refresh);
        
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
      const email = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirm-password").value.trim();
      const isOwnerCheckbox = document.getElementById("is-owner");
      const isOwner = isOwnerCheckbox ? isOwnerCheckbox.checked : false;

      if (!fullname || !email || !password || !confirmPassword) {
        alert("Uzupełnij wszystkie pola.");
        return;
      }

      if (password !== confirmPassword) {
        alert("Hasła nie są takie same.");
        return;
      }

      if (password.length < 8) {
        alert("Hasło musi mieć co najmniej 8 znaków.");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            email, 
            password, 
            confirm_password: confirmPassword,
            fullname,
            is_owner: isOwner
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          // Django REST zwraca błędy w formacie {non_field_errors: [...]} lub {field: [...]}
          const messages = errData.non_field_errors || Object.values(errData).flat();
          alert(messages.join('\n') || "Błąd podczas rejestracji.");
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
  const accountPageName2 = document.getElementById("konto-user-name-2");
  const accountPageEmail = document.getElementById("konto-user-email");
  const accountPageEmail2 = document.getElementById("konto-user-email-2");

  if (accountPageName || accountPageEmail || accountPageName2 || accountPageEmail2) {
    const user = await fetchUserProfile();

    if (!user) {
      // Jeśli użytkownik nie jest zalogowany (brak tokena/zły token), wyrzuć go na stronę logowania
      window.location.href = "login.html";
      return;
    }

    if (accountPageName) accountPageName.textContent = user.name;
    if (accountPageName2) accountPageName2.textContent = user.name;
    if (accountPageEmail) accountPageEmail.textContent = user.email;
    if (accountPageEmail2) accountPageEmail2.textContent = user.email;
  }
});