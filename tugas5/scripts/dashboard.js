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
const elAngkatanError = document.getElementById("angkatan-error");

const tbody = document.getElementById("tbody");
const btnReset = document.getElementById("btn-reset");
const btnSimpan = document.getElementById("btn-simpan");

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
const downloadJsonBtn = document.getElementById("download-json-btn");
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
  const dataList = document.getElementById("angkatan-list");
  if (!dataList) return;

  dataList.innerHTML = ""; // bersihkan dulu
  for (let year = endYear; year >= startYear; year--) {
    const option = document.createElement("option");
    option.value = year;
    dataList.appendChild(option);
  }
}

// GANTI seluruh fungsi initFilterDropdowns() di dashboard.js:

function initFilterDropdowns() {
  // --- Jurusan Filter ---
  const selectedJurusanValue = filterJurusan.value; // Ambil nilai yang sedang dipilih
  const uniqueJurusans = getUniqueValues("jurusan").filter((v) => v !== "all");

  // Isi ulang opsi Jurusan
  filterJurusan.innerHTML =
    '<option value="all">Semua Jurusan</option>' +
    uniqueJurusans.map((j) => `<option value="${j}">${j}</option>`).join("");

  // FIX: Kembalikan nilai yang dipilih. Prioritaskan "all" jika itu yang disetel terakhir.
  if (selectedJurusanValue === "all") {
    filterJurusan.value = "all"; // Jika disetel ke 'all' (oleh tombol reset), pertahankan 'all'
  } else if (uniqueJurusans.includes(selectedJurusanValue)) {
    filterJurusan.value = selectedJurusanValue; // Jika nilai yang dipilih valid, pertahankan nilai
  } else {
    filterJurusan.value = "all"; // Jika nilai filter lama tidak valid lagi, kembalikan ke 'all'
  }

  // --- Angkatan Filter ---
  const selectedAngkatanValue = filterAngkatan.value;
  const uniqueAngkatans = getUniqueValues("angkatan").filter(
    (v) => v !== "all"
  );

  // Isi ulang opsi Angkatan
  filterAngkatan.innerHTML =
    '<option value="all">Semua Angkatan</option>' +
    uniqueAngkatans.map((a) => `<option value="${a}">${a}</option>`).join("");

  // Kembalikan nilai yang dipilih.
  if (selectedAngkatanValue === "all") {
    filterAngkatan.value = "all";
  } else if (uniqueAngkatans.includes(selectedAngkatanValue)) {
    filterAngkatan.value = selectedAngkatanValue;
  } else {
    filterAngkatan.value = "all";
  }
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

// ------------------- EVENT LISTENERS LAIN (FINAL) -------------------

// 1. Perubahan pada Dropdown Limit saja
[displayLimit].forEach((el) => {
  el.addEventListener("change", () => {
    currentPage = 1;
    renderData();
  });
});

// Tambahkan ini di bagian Event Listeners Lain
filterJurusan.addEventListener("change", () => {
  // Di sini kita tidak perlu initFilterDropdowns, kita hanya set value dan render
  currentPage = 1;
  renderData();
});

filterAngkatan.addEventListener("change", () => {
  currentPage = 1;
  renderData();
});

// 2. Tombol Reset Filter: Mereset semua input filter secara eksplisit (YANG HILANG)
resetFilterBtn.addEventListener("click", () => {
  searchInput.value = "";

  // PENTING: Set nilai filter ke "all" (sesuai value option filter)
  filterJurusan.value = "all";
  filterAngkatan.value = "all";

  currentPage = 1;
  renderData();
});

// 3. Tombol Cari (searchBtn) dan Event Enter pada Search Input
searchBtn.addEventListener("click", () => {
  currentPage = 1;
  renderData();
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
  btnSimpan.textContent = "Simpan";
});

// Validasi agar input Angkatan hanya angka antara 1900–2100
elAngkatan.addEventListener("input", () => {
  const val = elAngkatan.value.trim();
  elAngkatan.classList.remove("input-error");
  elAngkatanError.textContent = "";

  if (val === "") return;

  if (!/^\d+$/.test(val)) {
    elAngkatanError.textContent = "Angkatan hanya boleh berupa angka.";
    elAngkatan.classList.add("input-error");
    return;
  }

  const year = Number(val);
  if (year < 1900 || year > 2100) {
    elAngkatanError.textContent = "Masukkan tahun antara 1900 hingga 2100.";
    elAngkatan.classList.add("input-error");
  }
});

btnReset.addEventListener("click", () => {
  form.reset();
  elId.value = "";
  btnSimpan.textContent = "Simpan";
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

// ------------------- HANDLER TOMBOL EDIT / HAPUS (FIXED) -------------------
tbody.addEventListener("click", (e) => {
  // Gunakan 'closest' untuk mencari tombol Edit atau Hapus yang diklik
  const editButton = e.target.closest("[data-edit]");
  const deleteButton = e.target.closest("[data-del]");

  // --- Logika Edit ---
  if (editButton) {
    const editId = editButton.getAttribute("data-edit");
    const idNum = Number(editId);

    const item = data.find((x) => x.id === idNum);
    if (item) {
      // Mengisi kembali Form untuk diedit
      elId.value = item.id;
      elNama.value = item.nama;
      elNim.value = item.nim;
      elJurusan.value = item.jurusan || "";
      elAngkatan.value = item.angkatan || "";
      elEmail.value = item.email || "";
      elIpk.value = item.ipk || "";
      elCatatan.value = item.catatan || "";

      elNama.focus();

      btnSimpan.textContent = "Update";

      // Catatan: Input type="file" (foto) tidak dapat diisi secara programatis.
      return; // Penting untuk menghentikan proses
    }
  }

  // --- Logika Hapus ---
  if (deleteButton) {
    const delId = deleteButton.getAttribute("data-del");
    const idNum = Number(delId);

    if (confirm("Yakin hapus data ini?")) {
      data = data.filter((x) => x.id !== idNum);
      saveData(data);

      // PENTING: Panggil renderData() untuk refresh tampilan
      renderData();
      alert("Data berhasil dihapus.");
      return; // Penting untuk menghentikan proses
    }
  }
});

// ------------------- FUNGSI EKSPOR DATA (DOWNLOAD) (CSV) FIXED -------------------
downloadBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  // UPDATE HEADER untuk SEMUA KOLOM BARU
  let csvContent = "Nama,NIM,Jurusan,Angkatan,Email,IPK,Catatan\n";

  // UPDATE DATA
  data.forEach((row) => {
    // Pastikan semua nilai dienkapsulasi dalam tanda kutip untuk menangani koma di Catatan
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

// ------------------- FUNGSI IMPOR DATA (UPLOAD) (PENCEGAHAN DUPLIKAT) FIXED -------------------
fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) {
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  const fileName = file.name;
  const isCSV = fileName.endsWith(".csv");

  reader.onload = (event) => {
    try {
      let newMahasiswa;

      if (isCSV) {
        const csvText = event.target.result;
        const workbook = XLSX.read(csvText, { type: "string" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Array yang berisi nama header yang diekspektasikan (HARUS SAMA PERSIS urutannya)
        const expectedHeaders = [
          "Nama",
          "NIM",
          "Jurusan",
          "Angkatan",
          "Email",
          "IPK",
          "Catatan",
        ];

        // Menggunakan opsi header: 1 untuk mendapatkan array of arrays (bukan array of objects)
        // Ini menghindari masalah parsing header otomatis.
        const dataAsArray = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          raw: false, // Raw: false agar format tanggal/angka otomatis diolah
        });

        if (dataAsArray.length < 2) {
          // minimal 1 baris header + 1 baris data
          // return; // handle error
        }

        // Baris header pertama (indeks 0) akan kita abaikan karena kita menggunakan expectedHeaders.
        const dataRows = dataAsArray.slice(1);

        // Mapping manual data baris ke objek menggunakan expectedHeaders
        newMahasiswa = dataRows.map((row) => {
          let obj = {};
          expectedHeaders.forEach((header, index) => {
            // Asumsi urutan data di CSV sama dengan urutan di expectedHeaders
            obj[header] = row[index];
          });
          return obj;
        });
      } else {
        const dataArray = new Uint8Array(event.target.result);
        const workbook = XLSX.read(dataArray, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        newMahasiswa = XLSX.utils.sheet_to_json(sheet);
      }

      if (newMahasiswa.length === 0) {
        alert(
          "Gagal membaca data dari file. Pastikan baris pertama berisi header kolom."
        );
        e.target.value = "";
        return;
      }

      let addedCount = 0;
      let duplicateCount = 0;

      const currentNIMs = new Set(data.map((m) => m.nim));

      // Proses Validasi dan Pemetaan Data BARU
      newMahasiswa.forEach((item) => {
        // Normalisasi dan Ambil data dari header yang mungkin berkapital (NIM) atau tidak (nim)
        const itemNIM = (item.NIM || item.nim || "").trim();
        const itemNama = (item.Nama || item.nama || "").trim();
        const itemJurusan = (item.Jurusan || item.jurusan || "").trim();
        const itemAngkatan = (item.Angkatan || item.angkatan || "").trim();
        const itemEmail = (item.Email || item.email || "").trim();
        const itemIpk = (item.IPK || item.ipk || "").trim();
        const itemCatatan = (item.Catatan || item.catatan || "").trim();

        // Validasi dasar
        if (!itemNama || !itemNIM || !itemJurusan) return;

        // Pencegahan NIM Duplikat
        if (currentNIMs.has(itemNIM)) {
          duplicateCount++;
          return;
        }

        // Data unik, tambahkan
        data.push({
          id: autoId++,
          nama: itemNama,
          nim: itemNIM,
          jurusan: itemJurusan,
          angkatan: itemAngkatan,
          email: itemEmail,
          ipk: Number(itemIpk).toFixed(2), // Simpan IPK sebagai 2 desimal
          foto: "", // Foto tidak didukung dari impor CSV/Excel
          catatan: itemCatatan,
        });
        currentNIMs.add(itemNIM);
        addedCount++;
      });

      // Simpan dan Render
      saveData(data);
      renderData();

      let alertMessage = `Selesai mengimpor data.\n`;
      alertMessage += `${addedCount} data baru berhasil ditambahkan.\n`;
      if (duplicateCount > 0) {
        alertMessage += `${duplicateCount} data dilewati karena NIM sudah terdaftar.`;
      }
      alert(alertMessage);
    } catch (error) {
      alert(
        "Gagal mengimpor file. Pastikan format file benar (.xlsx atau .csv) dan semua kolom utama (Nama, NIM, Jurusan) terisi."
      );
      console.error(error);
    } finally {
      e.target.value = ""; // Reset input file
    }
  };

  // Baca file
  if (isCSV) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
});

// ------------------- FUNGSI PRINT DATA (MENGGANTIKAN EKSPOR PDF) -------------------
downloadPdfBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk dicetak.");
    return;
  }

  // Memanggil dialog Print browser
  window.print();
});

// ------------------- FUNGSI EKSPOR DATA (DOWNLOAD) (JSON) FIXED -------------------
downloadJsonBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diekspor.");
    return;
  }

  // 1. Memetakan data untuk membersihkan properti 'foto'
  const exportData = data.map((row) => {
    // Buat salinan objek untuk menghindari modifikasi data asli
    const newRow = { ...row };

    // LOGIKA BARU: Menyimpan format nama file dummy jika foto ada
    if (newRow.foto) {
      // Menggunakan NIM + ekstensi .jpg sebagai nama file dummy
      newRow.foto = `${newRow.nim}.jpg`;
    } else {
      newRow.foto = "Tidak Ada";
    }

    // Menghapus properti yang tidak perlu (seperti ID internal)
    delete newRow.id;

    return newRow;
  });

  // 2. Konversi ke string JSON
  const jsonString = JSON.stringify(exportData, null, 2); // null, 2 untuk format yang indah (indentasi 2 spasi)

  // 3. Membuat objek Blob dan memicu unduhan
  const blob = new Blob([jsonString], {
    type: "application/json;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "data_mahasiswa.json");

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

// ------------------- INIT -------------------
initAngkatanDropdown();
// PENTING: Panggil renderData() di INIT
renderData();
