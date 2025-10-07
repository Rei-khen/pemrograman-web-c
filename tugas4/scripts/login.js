const USER_STORAGE_KEY = "user_akun";
const AUTH_STORAGE_KEY = "auth_status";

// --- FUNGSI DUMMY DATA USER ---
function ensureDummyUser() {
  const existingUsers = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));
  if (!existingUsers || existingUsers.length === 0) {
    //akun dummy
    const dummyUser = [{ email: "tes@gmail.com", password: "123456" }];
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(dummyUser));
  }
}

// cek apakah user sudah login, jika sudah arahkan ke dashboard
if (localStorage.getItem(AUTH_STORAGE_KEY) === "loggedIn") {
  window.location.href = "dashboard.html";
}

// panggi fungsi untuk memastikan data dummy ada
ensureDummyUser();

// --- LOGIKA FORM LOGIN ---
document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const emailInput = document.getElementById("login-email").value;
  const passwordInput = document.getElementById("login-password").value;

  const users = JSON.parse(localStorage.getItem(USER_STORAGE_KEY));

  // Cari pengguna yang cocok dengan email dan sandi
  const foundUser = users.find(
    (user) => user.email === emailInput && user.password === passwordInput
  );

  if (foundUser) {
    // Login Berhasil
    localStorage.setItem(AUTH_STORAGE_KEY, "loggedIn"); // Set status login
    alert("Login berhasil! Mengarahkan ke Dashboard.");
    window.location.href = "dashboard.html"; // Arahkan ke dashboard
  } else {
    // Login Gagal
    alert("Username atau sandi Anda salah.");
  }
});
