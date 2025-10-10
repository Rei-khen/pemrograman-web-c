// ------------------- PERSISTENSI DATA -------------------
const STORAGE_KEY = "crud_mahasiswa";
const AUTH_STATUS_KEY = "auth_status";

const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
const saveData = (list) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

// ------------------- STATE GLOBAL -------------------
let data = loadData();
let autoId = data.reduce((m, o) => Math.max(m, o.id), 0) + 1;

// STATE UNTUK FILTER DAN PAGINATION
let currentPage = 1;
let rowsPerPage = 10;
let currentSort = { key: "id", direction: "asc" }; // Default sort by ID ascending

// ------------------- ELEMENT HTML -------------------
const form = document.getElementById("form-mahasiswa");
const elId = document.getElementById("id");
const elNama = document.getElementById("nama");
const elNim = document.getElementById("nim");
const elJurusan = document.getElementById("jurusan");
const elAngkatan = document.getElementById("angkatan");
const elEmail = document.getElementById("email");
const elIpk = document.getElementById("ipk");
const elFoto = document.getElementById("foto");
const elCatatan = document.getElementById("catatan");
const statsSummary = document.getElementById("stats-summary");

const tbody = document.getElementById("tbody");
const btnReset = document.getElementById("btn-reset");

// Kontrol Baru
const displayLimit = document.getElementById("display-limit");
const filterJurusan = document.getElementById("filter-jurusan");
const filterAngkatan = document.getElementById("filter-angkatan");
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resetFilterBtn = document.getElementById("reset-filter-btn");

const fileUpload = document.getElementById("file-upload");
const downloadBtn = document.getElementById("download-btn");
const downloadPdfBtn = document.getElementById("download-pdf-btn");
const logoutBtn = document.getElementById("logout-btn");

// Aksi Batch dan Pagination
const selectAllCheckbox = document.getElementById("select-all-checkbox");
const deleteSelectedBtn = document.getElementById("delete-selected-btn");
const selectBatchBtn = document.getElementById("select-batch-btn");
const deleteAllBtn = document.getElementById("delete-all-btn");
const paginationControls = document.getElementById("pagination-controls");
const statsHeader = document.getElementById("stats-header");
const sortIpk = document.getElementById("sort-ipk");

// ------------------- FUNGSI UTILITY -------------------

function getUniqueValues(key) {
  const values = data.map((item) => item[key]);
  return ["all", ...new Set(values)].filter((v) => v); // Filter nilai kosong
}

function initAngkatanDropdown() {
  const startYear = 2000;
  const endYear = 2025;
  if (!elAngkatan) return;
  // Hapus opsi lama sebelum menambahkan yang baru
  elAngkatan.innerHTML =
    '<option value="" disabled selected>--- Pilih Angkatan ---</option>';
  for (let year = endYear; year >= startYear; year--) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    elAngkatan.appendChild(option);
  }
}

function initFilterDropdowns() {
  // Jurusan Filter
  const uniqueJurusans = getUniqueValues("jurusan").filter((v) => v !== "all");
  filterJurusan.innerHTML =
    '<option value="all">Semua Jurusan</option>' +
    uniqueJurusans.map((j) => `<option value="${j}">${j}</option>`).join("");

  // Angkatan Filter
  const uniqueAngkatans = getUniqueValues("angkatan").filter(
    (v) => v !== "all"
  );
  filterAngkatan.innerHTML =
    '<option value="all">Semua Angkatan</option>' +
    uniqueAngkatans.map((a) => `<option value="${a}">${a}</option>`).join("");
}

// ------------------- FUNGSI FILTER & SORTING -------------------

function getFilteredAndSortedData() {
  let filteredData = [...data];
  const searchKeyword = searchInput.value.trim().toLowerCase();
  const selectedJurusan = filterJurusan.value;
  const selectedAngkatan = filterAngkatan.value;

  // 1. Filtering
  filteredData = filteredData.filter((row) => {
    // Filter Jurusan
    if (selectedJurusan !== "all" && row.jurusan !== selectedJurusan)
      return false;
    // Filter Angkatan
    if (selectedAngkatan !== "all" && row.angkatan !== selectedAngkatan)
      return false;
    // Search Filter
    if (searchKeyword) {
      const searchableString =
        `${row.nama} ${row.nim} ${row.jurusan} ${row.angkatan} ${row.email}`.toLowerCase();
      return searchableString.includes(searchKeyword);
    }
    return true;
  });

  // 2. Sorting
  filteredData.sort((a, b) => {
    const key = currentSort.key;
    const dir = currentSort.direction === "asc" ? 1 : -1;

    // Khusus IPK dan Angkatan (Numerik)
    if (key === "ipk" || key === "angkatan") {
      return dir * (Number(a[key]) - Number(b[key]));
    }
    // Sortir String
    const valA = String(a[key]).toLowerCase();
    const valB = String(b[key]).toLowerCase();

    if (valA < valB) return -1 * dir;
    if (valA > valB) return 1 * dir;
    return 0;
  });

  return filteredData;
}

// ------------------- FUNGSI PAGINATION & RENDER UTAMA -------------------

function renderTable(list) {
  // 1. Tentukan data untuk halaman saat ini
  rowsPerPage =
    displayLimit.value === "all" ? list.length : Number(displayLimit.value);
  const start = (currentPage - 1) * rowsPerPage;
  const end = rowsPerPage === list.length ? list.length : start + rowsPerPage;
  const paginatedItems = list.slice(start, end);

  // 2. Render Statistik
  const totalData = data.length;
  const totalFiltered = list.length;
  statsHeader.textContent = `Daftar Mahasiswa [Total: ${totalData}, Hasil Filter: ${totalFiltered}]`;

  // 3. Render Tabel Body
  tbody.innerHTML = "";
  if (paginatedItems.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="11">Data tidak ditemukan.</td>`;
    tbody.appendChild(tr);
    return;
  }

  paginatedItems.forEach((row, idx) => {
    const fotoHtml = row.foto
      ? `<img src="${row.foto}" alt="Foto ${row.nama}" class="mahasiswa-foto">`
      : "—";
    const catatanSingkat = row.catatan
      ? row.catatan.length > 20
        ? row.catatan.substring(0, 17) + "..."
        : row.catatan
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="checkbox" class="row-checkbox" data-id="${row.id}"></td>
      <td>${start + idx + 1}</td>
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

  // 4. Update status checkbox Pilih Semua
  selectAllCheckbox.checked =
    tbody.querySelectorAll(".row-checkbox").length > 0 &&
    tbody.querySelectorAll(".row-checkbox:checked").length ===
      paginatedItems.length;

  // 5. Render Pagination Controls
  renderPagination(list.length);
}

function renderPagination(totalItems) {
  paginationControls.innerHTML = "";
  if (rowsPerPage === totalItems || totalItems === 0 || rowsPerPage === "all")
    return;

  const totalPages = Math.ceil(totalItems / rowsPerPage);

  // Tombol Previous
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "<<";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    currentPage--;
    renderData();
  });
  paginationControls.appendChild(prevBtn);

  // Tombol Halaman (Maksimal 5)
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, currentPage + 2);

  if (endPage - startPage < 4) {
    if (startPage > 1) startPage = Math.max(1, endPage - 4);
    if (endPage < totalPages) endPage = Math.min(totalPages, startPage + 4);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement("button");
    pageBtn.textContent = i;
    if (i === currentPage) pageBtn.classList.add("active");
    pageBtn.addEventListener("click", () => {
      currentPage = i;
      renderData();
    });
    paginationControls.appendChild(pageBtn);
  }

  // Tombol Next
  const nextBtn = document.createElement("button");
  nextBtn.textContent = ">>";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    currentPage++;
    renderData();
  });
  paginationControls.appendChild(nextBtn);
}

function renderData() {
  const list = getFilteredAndSortedData();

  // Reset ke halaman 1 jika filter/sort berubah
  if (currentPage > Math.ceil(list.length / rowsPerPage)) {
    currentPage = 1;
  }
  renderTable(list);
  initFilterDropdowns();

  // PENTING: Panggil fungsi statistik di sini
  updateStatsSummary();
}

// ------------------- LOGIKA CHECKBOX DAN BATCH ACTION -------------------

function getSelectedIds() {
  const checked = tbody.querySelectorAll(".row-checkbox:checked");
  return Array.from(checked).map((cb) => Number(cb.dataset.id));
}

selectAllCheckbox.addEventListener("change", (e) => {
  const checkboxes = tbody.querySelectorAll(".row-checkbox");
  checkboxes.forEach((cb) => (cb.checked = e.target.checked));
});

tbody.addEventListener("change", (e) => {
  if (e.target.classList.contains("row-checkbox")) {
    const totalRows = tbody.querySelectorAll(".row-checkbox").length;
    const checkedRows = tbody.querySelectorAll(".row-checkbox:checked").length;
    selectAllCheckbox.checked = totalRows > 0 && totalRows === checkedRows;
  }
});

selectBatchBtn.addEventListener("click", () => {
  // Logika untuk memilih semua di halaman ini
  const checkboxes = tbody.querySelectorAll(".row-checkbox");
  const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
  checkboxes.forEach((cb) => (cb.checked = !allChecked)); // Toggle
  selectAllCheckbox.checked = !allChecked;
});

deleteSelectedBtn.addEventListener("click", () => {
  const idsToDelete = getSelectedIds();
  if (idsToDelete.length === 0) {
    alert("Pilih setidaknya satu data untuk dihapus.");
    return;
  }

  if (confirm(`Yakin ingin menghapus ${idsToDelete.length} data terpilih?`)) {
    data = data.filter((row) => !idsToDelete.includes(row.id));
    saveData(data);
    renderData();
    alert(`${idsToDelete.length} data berhasil dihapus.`);
  }
});

deleteAllBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk dihapus.");
    return;
  }
  if (
    confirm(
      `PERINGATAN! Anda akan menghapus SEMUA ${data.length} data mahasiswa. Lanjutkan?`
    )
  ) {
    data = []; // Kosongkan array data
    saveData(data);
    renderData();
    alert("Semua data mahasiswa berhasil dihapus.");
  }
});

// ------------------- EVENT LISTENERS LAIN -------------------

// Events yang memicu pembaruan data dan mereset halaman
[displayLimit, filterJurusan, filterAngkatan].forEach((el) => {
  el.addEventListener("change", () => {
    currentPage = 1;
    renderData();
  });
});

[searchBtn, resetFilterBtn].forEach((el) => {
  el.addEventListener("click", () => {
    currentPage = 1;
    renderData();
  });
});
searchInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") {
    currentPage = 1;
    renderData();
  }
});

// Event Sorting (IPK)
sortIpk.addEventListener("click", () => {
  currentSort.key = "ipk";
  currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  renderData();
});

// ------------------- FORM SUBMIT (CRUD Logic - Pastikan memanggil renderData()) -------------------
// ... (Logika form submit CRUD tetap sama, tetapi di akhir harus memanggil renderData() )
// NOTE: Saya menggunakan async/await di fungsi ini, pastikan Anda menggunakan versi terbaru.

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idVal = elId.value.trim();
  const nama = elNama.value.trim();
  const nim = elNim.value.trim();
  const jurusanVal = elJurusan.value.trim();
  const angkatanVal = elAngkatan.value.trim();
  const emailVal = elEmail.value.trim();
  const ipkVal = Number(elIpk.value);
  const catatanVal = elCatatan.value.trim();

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
    ipk: ipkVal.toFixed(2),
    foto:
      fotoBase64 ||
      (idVal ? data.find((x) => x.id === Number(idVal)).foto : ""),
    catatan: catatanVal,
  };

  if (idVal) {
    const idx = data.findIndex((x) => x.id === Number(idVal));
    if (idx >= 0) {
      if (!fotoBase64) newData.foto = data[idx].foto;
      data[idx] = newData;
    }
  } else {
    data.push(newData);
  }

  saveData(data);
  // PENTING: Panggil renderData() yang baru
  renderData();
  form.reset();
  elId.value = "";
  elNama.focus();
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

// ------------------- FUNGSI PENGHITUNGAN STATISTIK FINAL FIX -------------------

function updateStatsSummary() {
  if (data.length === 0) {
    statsSummary.innerHTML = "<div>Total: 0</div>";
    return;
  }

  // 1. Total Data
  const totalMahasiswa = data.length;

  // 2. Rata-rata IPK
  const validIpkData = data.filter((row) => !isNaN(Number(row.ipk)));
  const totalIpk = validIpkData.reduce((sum, row) => sum + Number(row.ipk), 0);
  const rataIpk =
    validIpkData.length > 0
      ? (totalIpk / validIpkData.length).toFixed(2)
      : "0.00";

  // 3. Jumlah Mahasiswa per Jurusan
  const prodiCounts = data.reduce((acc, row) => {
    const prodi = row.jurusan || "Tidak Diketahui";
    acc[prodi] = (acc[prodi] || 0) + 1;
    return acc;
  }, {});

  // Buat HTML untuk setiap Jurusan, dipisahkan oleh |
  const prodiSummaryHtml = Object.entries(prodiCounts)
    .map(
      ([prodi, count]) => `<span class="prodi-item">${prodi}: ${count}</span>`
    )
    .join(" | ");

  // Render HTML: Gunakan struktur terpisah untuk mengatur posisi
  statsSummary.innerHTML = `
    <div class="stat-rata-ipk">Rata IPK: ${rataIpk}</div>
    
    <div class="stat-total">Total: ${totalMahasiswa}</div>
    
    <div class="stat-jurusan">Jurusan: ${prodiSummaryHtml}</div>
  `;
}

// ------------------- INIT -------------------
initAngkatanDropdown();
// PENTING: Panggil renderData() di INIT
renderData();
