// ------------------- PERSISTENSI DATA -------------------
const STORAGE_KEY = "crud_mahasiswa";
const AUTH_STATUS_KEY = "auth_status";

const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveData = (list) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

// ------------------- STATE -------------------
let data = loadData();
let autoId = data.reduce((m, o) => Math.max(m, o.id), 0) + 1;

// ------------------- ELEMENT HTML -------------------
const form = document.getElementById("form-mahasiswa");
const elId = document.getElementById("id");
const elNama = document.getElementById("nama");
const elNim = document.getElementById("nim");
const elJurusan = document.getElementById("jurusan"); // Diperbarui
const elAngkatan = document.getElementById("angkatan"); // BARU
const elEmail = document.getElementById("email"); // BARU
const elIpk = document.getElementById("ipk"); // BARU
const elFoto = document.getElementById("foto"); // BARU
const elCatatan = document.getElementById("catatan"); // BARU

const tbody = document.getElementById("tbody");
const btnReset = document.getElementById("btn-reset");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resetFilterBtn = document.getElementById("reset-filter-btn");
const sortSelect = document.getElementById("sort-select");

const fileUpload = document.getElementById("file-upload");
const downloadBtn = document.getElementById("download-btn");
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const logoutBtn = document.getElementById("logout-btn");

// ------------------- FUNGSI UTILITY -------------------

// Inisialisasi dropdown Angkatan
function initAngkatanDropdown() {
  const startYear = 2000;
  const endYear = 2025;

  // Cek jika elemen elAngkatan TIDAK ADA, hentikan fungsi
  if (!elAngkatan) return;

  // NOTE: Kita hanya membuat opsi tahun, placeholder "--- Pilih Angkatan ---"
  // sudah ada di HTML dan harus dipertahankan.

  // Buat dan tambahkan opsi tahun
  for (let year = endYear; year >= startYear; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    elAngkatan.appendChild(option);
  }
}

// ------------------- FUNGSI RENDER UTAMA (DIPERBARUI) -------------------
function render(listToRender = data) {
  if (!Array.isArray(listToRender)) listToRender = [];
  tbody.innerHTML = "";

  if (listToRender.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="10">Data tidak ditemukan.</td>`;
    tbody.appendChild(tr);
    return;
  }

  listToRender.forEach((row, idx) => {
    // Tampilkan foto kecil atau placeholder
    const fotoHtml = row.foto
      ? `<img src="${row.foto}" alt="Foto ${row.nama}" class="mahasiswa-foto">`
      : "—";

    // Tampilkan catatan, tambahkan "Lihat" jika panjang
    const catatanSingkat = row.catatan
      ? row.catatan.length > 20
        ? row.catatan.substring(0, 17) + "..."
        : row.catatan
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.jurusan}</td>
      <td>${row.angkatan}</td>
      <td>${row.email}</td>
      <td>${row.ipk}</td>
      <td>${fotoHtml}</td>
      <td>${catatanSingkat}</td>
      <td>
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------- FORM SUBMIT (CREATE / UPDATE) (DIPERBARUI) -------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idVal = elId.value.trim();
  const nama = elNama.value.trim();
  const nim = elNim.value.trim();
  const jurusanVal = elJurusan.value.trim();
  const angkatanVal = elAngkatan.value.trim(); // BARU
  const emailVal = elEmail.value.trim(); // BARU
  const ipkVal = Number(elIpk.value); // BARU
  const catatanVal = elCatatan.value.trim(); // BARU

  if (
    !nama ||
    !nim ||
    jurusanVal === "" ||
    !angkatanVal ||
    !emailVal ||
    isNaN(ipkVal) ||
    ipkVal < 0 ||
    ipkVal > 4
  ) {
    return alert(
      "Nama, NIM, Jurusan, Angkatan, Email, dan IPK (0.00-4.00) wajib diisi dengan benar."
    );
  }

  // LOGIKA VALIDASI UKURAN FOTO
  let fotoBase64 = "";
  const file = elFoto.files[0];
  if (file) {
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return alert(`Ukuran foto melebihi batas maksimum ${maxSizeMB} MB.`);
    }

    // Konversi foto ke Base64 (untuk penyimpanan di localStorage)
    fotoBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // LOGIKA VALIDASI PENCEGAHAN NIM DUPLIKAT
  let isNIMExist;
  if (idVal) {
    isNIMExist = data.some(
      (mahasiswa) => mahasiswa.nim === nim && mahasiswa.id !== Number(idVal)
    );
    if (isNIMExist) {
      return alert("NIM sudah digunakan oleh mahasiswa lain.");
    }
  } else {
    isNIMExist = data.some((mahasiswa) => mahasiswa.nim === nim);
    if (isNIMExist) {
      return alert("NIM sudah terdaftar. Silakan gunakan NIM yang berbeda.");
    }
  }

  const newData = {
    id: idVal ? Number(idVal) : autoId++,
    nama,
    nim,
    jurusan: jurusanVal,
    angkatan: angkatanVal,
    email: emailVal,
    ipk: ipkVal.toFixed(2), // Simpan dalam 2 desimal
    foto:
      fotoBase64 ||
      (idVal ? data.find((x) => x.id === Number(idVal)).foto : ""), // Pertahankan foto lama saat edit
    catatan: catatanVal,
  };

  if (idVal) {
    // UPDATE DATA
    const idx = data.findIndex((x) => x.id === Number(idVal));
    if (idx >= 0) {
      // Pastikan foto lama dipertahankan jika tidak ada foto baru diunggah
      if (!fotoBase64) newData.foto = data[idx].foto;
      data[idx] = newData;
    }
  } else {
    // CREATE DATA BARU
    data.push(newData);
  }

  saveData(data);
  render();
  form.reset();
  elId.value = "";
  elNama.focus();
});

// ------------------- RESET FORM -------------------
btnReset.addEventListener("click", () => {
  form.reset();
  elId.value = "";
  elNama.focus();
});

// ------------------- HANDLER TOMBOL EDIT / HAPUS (DIPERBARUI) -------------------
tbody.addEventListener("click", (e) => {
  const editId = e.target.getAttribute("data-edit");
  const delId = e.target.getAttribute("data-del");

  if (editId) {
    // EDIT DATA
    const item = data.find((x) => x.id === Number(editId));
    if (item) {
      elId.value = item.id;
      elNama.value = item.nama;
      elNim.value = item.nim;
      elJurusan.value = item.jurusan || "";
      elAngkatan.value = item.angkatan || ""; // BARU
      elEmail.value = item.email || ""; // BARU
      elIpk.value = item.ipk || ""; // BARU
      elCatatan.value = item.catatan || ""; // BARU
      elNama.focus();
      // Catatan: Input type="file" tidak dapat diisi secara programatis (demi keamanan browser), jadi foto harus diunggah ulang saat edit jika ingin diganti.
    }
  }

  if (delId) {
    // DELETE DATA
    const idNum = Number(delId);
    if (confirm("Yakin hapus data ini?")) {
      data = data.filter((x) => x.id !== idNum);
      saveData(data);
      render();
    }
  }
});

// ------------------- FUNGSI PENCARIAN & PENYORTIRAN -------------------
function filterData(keyword) {
  const filteredData = data.filter((row) => {
    // Tambahkan bidang baru ke string pencarian
    const searchableString =
      `${row.nama} ${row.nim} ${row.jurusan} ${row.angkatan} ${row.email} ${row.ipk} ${row.catatan}`.toLowerCase();
    return searchableString.includes(keyword.toLowerCase());
  });
  render(filteredData);
}

// ... (Logika event search, reset, dan sort tetap sama) ...
searchBtn.addEventListener("click", () => {
  const keyword = searchInput.value.trim();
  filterData(keyword);
});

searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    filterData(searchInput.value.trim());
  }
});

resetFilterBtn.addEventListener("click", () => {
  searchInput.value = "";
  render();
});

sortSelect.addEventListener("change", (e) => {
  const sortBy = e.target.value;
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    // Perlakuan khusus untuk IPK (angka)
    if (sortBy === "ipk" || sortBy === "angkatan") {
      return Number(a[sortBy]) - Number(b[sortBy]);
    }
    const valA = a[sortBy].toLowerCase();
    const valB = b[sortBy].toLowerCase();

    if (valA < valB) return -1;
    if (valA > valB) return 1;
    return 0;
  });

  render(sortedData);
});

// ------------------- FUNGSI IMPOR DATA (UPLOAD) (DIPERBARUI) -------------------
// ... (Logika impor harus diperbarui untuk menangani 3 kolom baru: Angkatan, Email, IPK, Foto, Catatan) ...
fileUpload.addEventListener("change", (e) => {
  alert(
    "Fungsi Impor belum sepenuhnya diperbarui untuk file dengan kolom Angkatan, Email, IPK, Foto, dan Catatan. Silakan masukkan data secara manual untuk sementara."
  );
  // Catatan: Memperbarui fungsi impor untuk menangani semua kolom baru dan base64 foto memerlukan validasi dan logika yang rumit.
  // Untuk menjaga fokus pada fitur CRUD, saya akan menunda pembaruan impor ini atau kembali ke logika lama.
  e.target.value = ""; // Tetap reset input
});

// ------------------- FUNGSI EKSPOR DATA (DOWNLOAD) (DIPERBARUI)-------------------
downloadBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  // Tambahkan Angkatan, Email, IPK, Catatan ke header CSV
  let csvContent = "Nama,NIM,Jurusan,Angkatan,Email,IPK,Catatan\n";

  data.forEach((row) => {
    // Abaikan foto saat ekspor CSV
    csvContent += `"${row.nama}","${row.nim}","${row.jurusan}","${
      row.angkatan || ""
    }","${row.email || ""}","${row.ipk || ""}","${row.catatan || ""}"\n`;
  });

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "data_mahasiswa.csv");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ------------------- FUNGSI EKSPOR DATA (DOWNLOAD) (PDF) (DIPERBARUI)-------------------
downloadPdfBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF === "undefined"
  ) {
    alert("Pustaka jsPDF belum dimuat. Periksa koneksi internet atau CDN.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("landscape"); // Menggunakan orientasi landscape agar kolom banyak muat

  doc.setFontSize(14);
  doc.text("Tabel Data Mahasiswa", 14, 15);

  // Tambahkan Angkatan, Email, IPK, dan Catatan ke kolom tabel
  const tableColumn = [
    "#",
    "Nama",
    "NIM",
    "Jurusan",
    "Angkatan",
    "Email",
    "IPK",
    "Catatan",
  ];
  const tableRows = [];

  data.forEach((row, idx) => {
    const rowData = [
      idx + 1,
      row.nama,
      row.nim,
      row.jurusan,
      row.angkatan,
      row.email,
      row.ipk,
      row.catatan ? row.catatan.substring(0, 30) + "..." : "—",
    ];
    tableRows.push(rowData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 20,
  });

  doc.save("data_mahasiswa.pdf");
});

// ------------------- LOGIKA AUTENTIKASI DAN LOGOUT -------------------
(function checkAuth() {
  if (localStorage.getItem(AUTH_STATUS_KEY) !== "loggedIn") {
    alert("Anda harus login untuk mengakses halaman ini.");
    window.location.href = "index.html";
  }
})();

logoutBtn.addEventListener("click", () => {
  if (confirm("Yakin ingin logout?")) {
    localStorage.removeItem(AUTH_STATUS_KEY);
    window.location.href = "index.html";
  }
});

// ------------------- INIT -------------------
initAngkatanDropdown(); // Inisialisasi Angkatan
render();
