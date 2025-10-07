// KODE JAVASCRIPT DI SINI
// ------------------- PERSISTENSI DATA -------------------
const STORAGE_KEY = "crud_mahasiswa"; // Key localStorage

// Load data dari localStorage, jika kosong kembalikan array kosong
const loadData = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// Simpan array data ke localStorage
const saveData = (list) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

// ------------------- STATE -------------------
let data = loadData(); // Array data mahasiswa utama
let autoId = data.reduce((m, o) => Math.max(m, o.id), 0) + 1; // Auto-increment ID

// ------------------- ELEMENT HTML -------------------
const form = document.getElementById("form-mahasiswa");
const elId = document.getElementById("id");
const elNama = document.getElementById("nama");
const jurusan = document.getElementById("jurusan");
const elNim = document.getElementById("nim");
const tbody = document.getElementById("tbody");
const btnReset = document.getElementById("btn-reset");

// Element untuk pencarian dan penyortiran
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const resetFilterBtn = document.getElementById("reset-filter-btn");
const sortSelect = document.getElementById("sort-select");

// Element untuk impor dan ekspor
const fileUpload = document.getElementById("file-upload");
const downloadBtn = document.getElementById("download-btn");
const downloadPdfBtn = document.getElementById("download-pdf-btn");

//element untuk logout
const logoutBtn = document.getElementById("logout-btn");

// ------------------- FUNGSI RENDER UTAMA -------------------
// ... (Fungsi render tetap sama)
function render(listToRender = data) {
  if (!Array.isArray(listToRender)) listToRender = [];
  tbody.innerHTML = ""; // Kosongkan tabel sebelum render ulang

  if (listToRender.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="5">Data tidak ditemukan.</td>`;
    tbody.appendChild(tr);
    return;
  }

  listToRender.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${row.nama}</td>
      <td>${row.nim}</td>
      <td>${row.jurusan}</td>
      <td>
        <button type="button" data-edit="${row.id}">Edit</button>
        <button type="button" data-del="${row.id}">Hapus</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------- FORM SUBMIT (CREATE / UPDATE) -------------------
form.addEventListener("submit", (e) => {
  e.preventDefault(); // mencegah reload halaman

  const idVal = elId.value.trim();
  const nama = elNama.value.trim();
  const jurusanVal = jurusan.value.trim();
  const nim = elNim.value.trim();

  if (!nama || !nim || jurusanVal === "" || jurusanVal === null) {
    return alert("Nama, NIM, dan Jurusan wajib diisi.");
  }

  // LOGIKA VALIDASI PENCEGAHAN NIM DUPLIKAT
  let isNIMExist;
  if (idVal) {
    // Mode UPDATE: Cek apakah NIM sudah ada di data lain (kecuali data yang sedang diedit)
    isNIMExist = data.some(
      (mahasiswa) => mahasiswa.nim === nim && mahasiswa.id !== Number(idVal)
    );
    if (isNIMExist) {
      return alert("NIM sudah digunakan oleh mahasiswa lain.");
    }
  } else {
    // Mode CREATE: Cek apakah NIM sudah ada di seluruh data
    isNIMExist = data.some((mahasiswa) => mahasiswa.nim === nim);
    if (isNIMExist) {
      return alert("NIM sudah terdaftar. Silakan gunakan NIM yang berbeda.");
    }
  }

  if (idVal) {
    // UPDATE DATA
    const idNum = Number(idVal);
    const idx = data.findIndex((x) => x.id === idNum);
    if (idx >= 0) {
      data[idx].nama = nama;
      data[idx].nim = nim;
      data[idx].jurusan = jurusanVal;
    }
  } else {
    // CREATE DATA BARU
    data.push({ id: autoId++, nama, nim, jurusan: jurusanVal });
  }

  saveData(data); // Simpan data
  render(); // Render ulang tabel dengan semua data
  form.reset(); // Reset form
  elId.value = "";
  elNama.focus(); // Fokus ke input nama
});

// ------------------- RESET FORM -------------------
btnReset.addEventListener("click", () => {
  form.reset();
  elId.value = "";
  elNama.focus();
});

// ------------------- HANDLER TOMBOL EDIT / HAPUS -------------------
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
      jurusan.value = item.jurusan || "";
      elNama.focus();
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

// ------------------- FUNGSI & EVENT PENCARIAN & PENYORTIRAN -------------------
function filterData(keyword) {
  const filteredData = data.filter((row) => {
    const searchableString =
      `${row.nama} ${row.nim} ${row.jurusan}`.toLowerCase();
    return searchableString.includes(keyword.toLowerCase());
  });
  render(filteredData);
}

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
    const valA = a[sortBy].toLowerCase();
    const valB = b[sortBy].toLowerCase();

    if (valA < valB) {
      return -1;
    }
    if (valA > valB) {
      return 1;
    }
    return 0;
  });

  render(sortedData);
});

// ------------------- FUNGSI IMPOR DATA (UPLOAD) (PENCEGAHAN DUPLIKAT) -------------------
fileUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

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
        newMahasiswa = XLSX.utils.sheet_to_json(sheet);
      } else {
        const dataArray = new Uint8Array(event.target.result);
        const workbook = XLSX.read(dataArray, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        newMahasiswa = XLSX.utils.sheet_to_json(sheet);
      }

      let addedCount = 0;
      let duplicateCount = 0;

      const currentNIMs = new Set(data.map((m) => m.nim)); // Set untuk cek NIM yang sudah ada

      // Proses Validasi dan Pemetaan Data
      newMahasiswa.forEach((item) => {
        // Normalisasi dan Ambil data
        const itemNIM = (item.NIM || item.nim || "").trim();
        const itemNama = (item.Nama || item.nama || "").trim();
        const itemJurusan = (item.Jurusan || item.jurusan || "").trim();

        // lewati jika data dasar tidak ada
        if (!itemNama || !itemNIM || !itemJurusan) return;

        //logika untuk pencegahan nim yang sama
        if (currentNIMs.has(itemNIM)) {
          duplicateCount++;
          // Abaikan jika NIM sudah ada
          return;
        }

        // jika data unik tambahkan ke data utama dan ke Set untuk mencegah duplikasi di dalam file yang sama
        data.push({
          id: autoId++,
          nama: itemNama,
          nim: itemNIM,
          jurusan: itemJurusan,
        });
        currentNIMs.add(itemNIM);
        addedCount++;
      });

      // Simpan dan Render
      saveData(data);
      render();

      // beri notifikasi hasil impor
      let alertMessage = `Selesai mengimpor data.\n`;
      alertMessage += `${addedCount} data baru berhasil ditambahkan.\n`;
      if (duplicateCount > 0) {
        alertMessage += `${duplicateCount} data dilewati karena NIM sudah terdaftar.`;
      }
      alert(alertMessage);
    } catch (error) {
      alert(
        "Gagal mengimpor file. Pastikan format dan nama kolom ('Nama', 'NIM', 'Jurusan') file benar."
      );
      console.error(error);
    }
  };

  // Baca file
  if (isCSV) {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
});

// ------------------- FUNGSI EKSPOR DATA (DOWNLOAD) (CSV)-------------------
downloadBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  let csvContent = "Nama,NIM,Jurusan\n";

  data.forEach((row) => {
    csvContent += `"${row.nama}","${row.nim}","${row.jurusan}"\n`;
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

// ------------------- FUNGSI EKSPOR DATA (DOWNLOAD) (PDF)-------------------
downloadPdfBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("Tidak ada data untuk diunduh.");
    return;
  }

  // pastikan jsPDF ada
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF === "undefined"
  ) {
    alert("Pustaka jsPDF belum dimuat. Periksa koneksi internet atau CDN.");
    return;
  }

  // inisialisasi objek jsPDF
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // tambahkan judul ke PDF
  doc.setFontSize(18);
  doc.text("Tabel Data Mahasiswa", 14, 22);

  // siapkan data untuk tabel
  const tableColumn = ["#", "Nama", "NIM", "Jurusan"];
  const tableRows = [];

  data.forEach((row, idx) => {
    const rowData = [idx + 1, row.nama, row.nim, row.jurusan];
    tableRows.push(rowData);
  });

  // buat tabel menggunakan autoTable
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 30, // Posisi awal tabel (setelah judul)
  });

  // Simpan file PDF
  doc.save("data_mahasiswa.pdf");
});

// ------------------- LOGIKA AUTENTIKASI DAN LOGOUT -------------------
// Cek status login saat memuat dashboard
(function checkAuth() {
  if (localStorage.getItem("auth_status") !== "loggedIn") {
    alert("Anda harus login untuk mengakses halaman ini.");
    window.location.href = "index.html"; // Arahkan kembali ke halaman login
  }
})();

// Event Listener untuk tombol Logout
logoutBtn.addEventListener("click", () => {
  if (confirm("Yakin ingin logout?")) {
    localStorage.removeItem("auth_status"); // Hapus status login
    window.location.href = "index.html"; // Arahkan ke halaman login
  }
});

// ------------------- INIT -------------------
render(); // Render tabel saat halaman pertama kali dibuka
