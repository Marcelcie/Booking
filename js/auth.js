function getMockUser() {
  const user = localStorage.getItem("bookspace_user");
  return user ? JSON.parse(user) : null;
}

function setMockUser(user) {
  localStorage.setItem("bookspace_user", JSON.stringify(user));
}

function getHomePath() {
  return window.location.pathname.includes("/pages/") ? "../index.html" : "index.html";
}

function updateNavbar() {
  const guestLinks = document.getElementById("guest-links");
  const accountLinks = document.getElementById("account-links");
  const user = getMockUser();

  if (!guestLinks || !accountLinks) return;

  if (user) {
    guestLinks.style.display = "none";
    accountLinks.style.display = "flex";
  } else {
    guestLinks.style.display = "flex";
    accountLinks.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  updateNavbar();

  const loginForm = document.getElementById("mock-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!email || !password) {
        alert("Uzupełnij e-mail i hasło.");
        return;
      }

      const mockUser = {
        name: "Jan Kowalski",
        email,
        role: "user"
      };

      setMockUser(mockUser);
      window.location.href = "konto.html";
    });
  }

  const registerForm = document.getElementById("mock-register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
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

      const mockUser = {
        name: fullname,
        email,
        role: "user"
      };

      setMockUser(mockUser);
      window.location.href = "konto.html";
    });
  }

  document.querySelectorAll(".logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("bookspace_user");
      window.location.href = getHomePath();
    });
  });

  const accountPageName = document.getElementById("konto-user-name");
  const accountPageEmail = document.getElementById("konto-user-email");

  if (accountPageName || accountPageEmail) {
    const user = getMockUser();

    if (!user) {
      window.location.href = "login.html";
      return;
    }

    if (accountPageName) accountPageName.textContent = user.name;
    if (accountPageEmail) accountPageEmail.textContent = user.email;
  }
});