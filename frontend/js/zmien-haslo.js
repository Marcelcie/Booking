document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('bookspace_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const currentPasswordInput = document.getElementById('current-password');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const saveBtn = document.querySelector('.save-btn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const current_password = currentPasswordInput.value;
      const new_password = newPasswordInput.value;
      const confirm_password = confirmPasswordInput.value;

      if (!current_password || !new_password || !confirm_password) {
        alert('Wypełnij wszystkie pola.');
        return;
      }

      if (new_password !== confirm_password) {
        alert('Nowe hasła nie są identyczne.');
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/change-password/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            current_password,
            new_password,
            confirm_password
          })
        });

        if (response.ok) {
          alert('Hasło zostało zmienione pomyślnie!');
          window.location.href = 'konto.html';
        } else {
          const errData = await response.json();
          // The backend might return {'error': '...'} or standard validation errors
          if (errData.error) {
            alert(errData.error);
          } else {
            const messages = errData.non_field_errors || Object.values(errData).flat();
            alert(messages.join('\n') || 'Wystąpił błąd podczas zmiany hasła.');
          }
        }
      } catch (error) {
        console.error('Błąd zmiany hasła:', error);
        alert('Błąd połączenia z serwerem.');
      }
    });
  }
});
