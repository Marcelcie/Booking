document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('bookspace_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const firstNameInput = document.getElementById('first-name');
  const lastNameInput = document.getElementById('last-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const saveBtn = document.querySelector('.save-btn');

  // Load current user data
  try {
    const response = await fetch(`${API_BASE}/api/me/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const user = await response.json();
      if (firstNameInput) firstNameInput.value = user.first_name || '';
      if (lastNameInput) lastNameInput.value = user.last_name || '';
      if (emailInput) emailInput.value = user.email || '';
      if (phoneInput) phoneInput.value = user.phone || '';
    } else if (response.status === 401) {
      // Unauthenticated, might need refresh (handled in auth.js, but let's be safe)
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Błąd pobierania profilu:', error);
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const payload = {
        first_name: firstNameInput.value.trim(),
        last_name: lastNameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim()
      };

      try {
        const response = await fetch(`${API_BASE}/api/me/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          alert('Profil zaktualizowany pomyślnie!');
          // update user in localstorage maybe? No need, auth.js fetches fresh data.
          window.location.href = 'konto.html';
        } else {
          const errData = await response.json();
          const messages = errData.non_field_errors || Object.values(errData).flat();
          alert(messages.join('\n') || 'Wystąpił błąd podczas aktualizacji profilu.');
        }
      } catch (error) {
        console.error('Błąd aktualizacji:', error);
        alert('Błąd połączenia z serwerem.');
      }
    });
  }
});
