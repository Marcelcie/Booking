window.addEventListener("load", () => {
  const preloader = document.getElementById("global-preloader");
  if (preloader) {
    setTimeout(() => { preloader.classList.add("hidden"); }, 400);
  }
});

// ===== AUTH HELPERS =====
function getAuthToken()    { return localStorage.getItem("bookspace_token"); }
function setAuthToken(t)   { localStorage.setItem("bookspace_token", t); }
function setRefreshToken(t){ localStorage.setItem("bookspace_refresh_token", t); }
function getRefreshToken() { return localStorage.getItem("bookspace_refresh_token"); }
function removeAuthToken() { localStorage.removeItem("bookspace_token"); localStorage.removeItem("bookspace_refresh_token"); }
function getHomePath()     { return window.location.pathname.includes("/pages/") ? "../index.html" : "index.html"; }
function getLoginPath()    { return window.location.pathname.includes("/pages/") ? "login.html" : "pages/login.html"; }

// ===== SECURITY: HTML escape =====
function escapeHTML(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ===== TOAST =====
function showToast(message, type = 'success', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('visible'));
  });
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 350);
  }, duration);
}

// ===== TOKEN REFRESH =====
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_BASE}/api/token/refresh/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken })
    });
    if (!response.ok) { removeAuthToken(); return false; }
    const data = await response.json();
    setAuthToken(data.access);
    return true;
  } catch { return false; }
}

// ===== FETCH WITH AUTO TOKEN REFRESH =====
async function fetchWithAuth(url, options = {}) {
  const token = getAuthToken();
  if (!token) { window.location.href = getLoginPath(); return null; }
  const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}`, ...(options.headers || {}) };
  let response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${getAuthToken()}`;
      response = await fetch(url, { ...options, headers });
    } else {
      removeAuthToken();
      window.location.href = getLoginPath();
      return null;
    }
  }
  return response;
}

// ===== FETCH USER PROFILE =====
async function fetchUserProfile() {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE}/api/me/`, { headers: { "Authorization": `Bearer ${token}` } });
    if (response.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        const retry = await fetch(`${API_BASE}/api/me/`, { headers: { "Authorization": `Bearer ${getAuthToken()}` } });
        if (retry.ok) return await retry.json();
      }
      removeAuthToken(); return null;
    }
    if (!response.ok) throw new Error();
    return await response.json();
  } catch { return null; }
}

// ===== NOTIFICATION BELL =====
let _notifOpen = false;
let _notifData = [];

async function loadNotifications() {
  const res = await fetchWithAuth(`${API_BASE}/api/notifications/`);
  if (!res || !res.ok) return;
  const data = await res.json();
  _notifData = data.notifications || [];
  const unread = data.unread_count || 0;

  const badge = document.getElementById("notification-badge");
  if (badge) {
    badge.textContent = unread > 9 ? '9+' : unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
  }
  renderNotificationDropdown();
}

function renderNotificationDropdown() {
  const list = document.getElementById("notification-list");
  if (!list) return;
  if (_notifData.length === 0) {
    list.innerHTML = `<div class="notification-empty">Brak powiadomień 🔕</div>`;
    return;
  }
  list.innerHTML = _notifData.map(n => `
    <div class="notification-item ${n.is_read ? '' : 'unread'}" data-id="${n.id}" onclick="markNotifRead(${n.id}, this)">
      ${!n.is_read ? '<div class="notification-dot"></div>' : '<div style="width:8px;flex-shrink:0"></div>'}
      <div class="notification-text">
        <p>${escapeHTML(n.message)}</p>
        <div class="notification-meta">${new Date(n.created_at).toLocaleString('pl-PL')}</div>
      </div>
    </div>
  `).join('');
}

async function markNotifRead(id, el) {
  if (el && el.classList.contains('unread')) {
    el.classList.remove('unread');
    el.querySelector('.notification-dot') && el.querySelector('.notification-dot').remove();
    const badge = document.getElementById("notification-badge");
    if (badge) {
      const current = parseInt(badge.textContent) || 0;
      const next = Math.max(0, current - 1);
      badge.textContent = next > 9 ? '9+' : next;
      badge.style.display = next > 0 ? 'flex' : 'none';
    }
    // Update local data
    const n = _notifData.find(x => x.id === id);
    if (n) n.is_read = true;
    // API call (fire and forget)
    fetchWithAuth(`${API_BASE}/api/notifications/${id}/read/`, { method: 'POST' });
  }
}

async function markAllNotifsRead() {
  await fetchWithAuth(`${API_BASE}/api/notifications/mark-read/`, { method: 'POST' });
  _notifData.forEach(n => n.is_read = true);
  const badge = document.getElementById("notification-badge");
  if (badge) badge.style.display = 'none';
  renderNotificationDropdown();
}

function injectNotificationBell(accountLinks) {
  if (document.getElementById("notification-bell-wrapper")) return; // Race condition guard
  const wrapper = document.createElement('div');
  wrapper.className = 'notification-bell-wrapper';
  wrapper.id = 'notification-bell-wrapper';
  wrapper.innerHTML = `
    🔔<span class="notification-badge" id="notification-badge" style="display:none">0</span>
    <div class="notification-dropdown" id="notification-dropdown">
      <div class="notification-dropdown-header">
        Powiadomienia
        <button onclick="markAllNotifsRead(); event.stopPropagation();">Odczytaj wszystkie</button>
      </div>
      <div class="notification-list" id="notification-list">
        <div class="notification-empty">Ładowanie...</div>
      </div>
    </div>
  `;
  wrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    _notifOpen = !_notifOpen;
    wrapper.classList.toggle('open', _notifOpen);
    if (_notifOpen) loadNotifications();
  });
  document.addEventListener('click', () => {
    _notifOpen = false;
    wrapper.classList.remove('open');
  }, { once: false });
  accountLinks.insertBefore(wrapper, accountLinks.firstChild);
  loadNotifications(); // Load count on page load
}

// ===== UPDATE NAVBAR =====
async function updateNavbar() {
  const guestLinks   = document.getElementById("guest-links");
  const accountLinks = document.getElementById("account-links");
  if (!guestLinks || !accountLinks) return;

  const user = await fetchUserProfile();
  if (user) {
    guestLinks.style.display = "none";
    accountLinks.style.display = "flex";

    // Notification bell (injected once)
    injectNotificationBell(accountLinks);

    // Owner nav link (injected once)
    if (user.role === 'owner' && !document.getElementById("owner-nav-link")) {
      const ownerLink = document.createElement("a");
      ownerLink.id   = "owner-nav-link";
      ownerLink.href = window.location.pathname.includes("/pages/") ? "moj-hotel.html" : "pages/moj-hotel.html";
      ownerLink.textContent = "Mój hotel";
      ownerLink.className   = "account-link";
      const logoutBtn = accountLinks.querySelector(".logout-btn-link");
      logoutBtn ? accountLinks.insertBefore(ownerLink, logoutBtn) : accountLinks.appendChild(ownerLink);
    }
  } else {
    guestLinks.style.display  = "flex";
    accountLinks.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  updateNavbar();

  // ----- POKAZYWANIE/UKRYWANIE HASŁA -----
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput  = document.getElementById("password");
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
      const email    = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();
      if (!email || !password) { showToast("Uzupełnij e-mail i hasło.", "error"); return; }
      try {
        const response = await fetch(`${API_BASE}/api/token/`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: email, password })
        });
        if (!response.ok) { showToast("Nieprawidłowy e-mail lub hasło.", "error"); return; }
        const data = await response.json();
        setAuthToken(data.access);
        setRefreshToken(data.refresh);
        window.location.href = "konto.html";
      } catch { showToast("Błąd połączenia z serwerem.", "error"); }
    });
  }

  // ----- REJESTRACJA -----
  const registerForm = document.getElementById("mock-register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullname        = document.getElementById("fullname").value.trim();
      const email           = document.getElementById("username").value.trim();
      const password        = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirm-password").value.trim();
      const isOwnerEl       = document.getElementById("is-owner");
      const isOwner         = isOwnerEl ? isOwnerEl.checked : false;
      const termsEl         = document.getElementById("accept-terms");

      if (!fullname || !email || !password || !confirmPassword) { showToast("Uzupełnij wszystkie pola.", "error"); return; }
      if (password !== confirmPassword) { showToast("Hasła nie są takie same.", "error"); return; }
      if (password.length < 8) { showToast("Hasło musi mieć co najmniej 8 znaków.", "error"); return; }
      if (termsEl && !termsEl.checked) { showToast("Musisz zaakceptować regulamin.", "error"); return; }

      try {
        const response = await fetch(`${API_BASE}/api/register/`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, confirm_password: confirmPassword, fullname, is_owner: isOwner })
        });
        if (!response.ok) {
          const errData = await response.json();
          const messages = errData.non_field_errors || Object.values(errData).flat();
          showToast(messages.join('\n') || "Błąd podczas rejestracji.", "error"); return;
        }
        showToast("Konto utworzone pomyślnie! Możesz się teraz zalogować.", "success");
        setTimeout(() => { window.location.href = "login.html"; }, 2000);
      } catch { showToast("Błąd połączenia z serwerem.", "error"); }
    });
  }

  // ----- WYLOGOWYWANIE -----
  document.querySelectorAll(".logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => { e.preventDefault(); removeAuthToken(); window.location.href = getHomePath(); });
  });

  // ----- ZAKŁADKA "MOJE KONTO" -----
  const accountPageName  = document.getElementById("konto-user-name");
  const accountPageName2 = document.getElementById("konto-user-name-2");
  const accountPageEmail = document.getElementById("konto-user-email");
  const accountPageEmail2= document.getElementById("konto-user-email-2");

  if (accountPageName || accountPageEmail || accountPageName2 || accountPageEmail2) {
    const user = await fetchUserProfile();
    if (!user) { window.location.href = "login.html"; return; }
    if (accountPageName)  accountPageName.textContent  = user.name;
    if (accountPageName2) accountPageName2.textContent = user.name;
    if (accountPageEmail) accountPageEmail.textContent  = user.email;
    if (accountPageEmail2)accountPageEmail2.textContent = user.email;
  }
});