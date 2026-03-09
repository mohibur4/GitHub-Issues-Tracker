const togglePwd     = document.getElementById('togglePwd');
const passwordInput = document.getElementById('password');
const eyeIcon       = document.getElementById('eyeIcon');

if (togglePwd) {
  togglePwd.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';

    
    passwordInput.type = isPassword ? 'text' : 'password';

    eyeIcon.className = isPassword
      ? 'fa-solid fa-eye-slash text-sm'
      : 'fa-solid fa-eye text-sm';
  });
}

function handleLogin() {
  const username   = document.getElementById('username').value.trim();
  const password   = document.getElementById('password').value.trim();
  const errorAlert = document.getElementById('errorAlert');
  const errorMsg   = document.getElementById('errorMsg');
  const btn        = document.getElementById('loginBtn');

  if (!username || !password) {
    errorMsg.textContent = 'Please fill in all fields.';
    errorAlert.classList.remove('hidden');
    errorAlert.classList.add('flex');
    return;
  }

  if (username === 'admin' && password === 'admin123') {

    
    btn.innerHTML = `
      <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
      Signing in…`;
    btn.disabled = true;

    
    localStorage.setItem('isLoggedIn', 'true');

   
    setTimeout(() => {
  window.location.href = 'index.html';
}, 800);

  } else {

 
    errorMsg.textContent = 'Invalid username or password';
    errorAlert.classList.remove('hidden');
    errorAlert.classList.add('flex');

 
    document.getElementById('password').value = '';
    document.getElementById('password').focus();
  }
}


document.getElementById('loginBtn').addEventListener('click', handleLogin);



document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});



['username', 'password'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => {
    const alert = document.getElementById('errorAlert');
    alert.classList.add('hidden');
    alert.classList.remove('flex');
  });
});