const API_BASE = '/api/wisma';

const tableBody = document.getElementById('table-body');
const searchInput = document.getElementById('search');
const formDialog = document.getElementById('form-dialog');
const wismaForm = document.getElementById('wisma-form');
const formTitle = document.getElementById('form-title');
const formError = document.getElementById('form-error');
const toast = document.getElementById('toast');

const statTotal = document.getElementById('stat-total');
const statProvinsi = document.getElementById('stat-provinsi');
const statKoordinat = document.getElementById('stat-koordinat');

let wismaList = [];
let editingId = null;

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('error', isError);
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 3000);
}

function formatAddress(item) {
  const parts = [
    item.dusun_kampung,
    item.rt ? `RT ${item.rt}` : null,
    item.rw ? `RW ${item.rw}` : null,
  ].filter(Boolean);

  return parts.join(', ') || '-';
}

function formatLocation(item) {
  if (item.latitude == null || item.longitude == null) {
    return '-';
  }
  return `${item.latitude}, ${item.longitude}`;
}

function updateStats(data) {
  const provinces = new Set(data.map((item) => item.provinsi));
  const withCoords = data.filter(
    (item) => item.latitude != null && item.longitude != null
  );

  statTotal.textContent = data.length;
  statProvinsi.textContent = provinces.size;
  statKoordinat.textContent = withCoords.length;
}

function getFilteredData() {
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword) {
    return wismaList;
  }

  return wismaList.filter((item) => {
    const haystack = [
      item.provinsi,
      item.kabupaten_kota,
      item.kecamatan,
      item.kelurahan,
      item.dusun_kampung,
      item.nomor_wisma,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

function renderTable() {
  const data = getFilteredData();

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty">Belum ada data wisma.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = data
    .map(
      (item) => `
        <tr>
          <td>${item.id_wisma}</td>
          <td>
            <p class="address-line">${item.kelurahan}, ${item.kecamatan}</p>
            <p class="address-sub">
              ${item.kabupaten_kota}, ${item.provinsi}<br>
              ${formatAddress(item)}
            </p>
          </td>
          <td>${item.nomor_wisma || '-'}</td>
          <td>${formatLocation(item)}</td>
          <td>
            <div class="actions">
              <button type="button" class="btn btn-secondary btn-small" data-edit="${item.id_wisma}">
                Edit
              </button>
              <button type="button" class="btn btn-danger btn-small" data-delete="${item.id_wisma}">
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `
    )
    .join('');
}

async function fetchWisma() {
  const response = await fetch(API_BASE);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Gagal memuat data wisma');
  }

  wismaList = result.data;
  updateStats(wismaList);
  renderTable();
}

function openForm(item = null) {
  editingId = item ? item.id_wisma : null;
  formTitle.textContent = item ? 'Edit Wisma' : 'Tambah Wisma';
  formError.hidden = true;
  formError.textContent = '';
  wismaForm.reset();

  if (item) {
    for (const field of wismaForm.elements) {
      if (field.name && item[field.name] != null) {
        field.value = item[field.name];
      }
    }
  }

  formDialog.showModal();
}

function closeForm() {
  editingId = null;
  formDialog.close();
}

function getFormPayload() {
  const formData = new FormData(wismaForm);
  const payload = Object.fromEntries(formData.entries());

  for (const key of Object.keys(payload)) {
    if (payload[key] === '') {
      payload[key] = null;
    }
  }

  return payload;
}

async function saveWisma(event) {
  event.preventDefault();
  formError.hidden = true;

  const payload = getFormPayload();
  const url = editingId ? `${API_BASE}/${editingId}` : API_BASE;
  const method = editingId ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    const message = result.errors
      ? result.errors.join(', ')
      : result.message || 'Gagal menyimpan data';
    formError.textContent = message;
    formError.hidden = false;
    return;
  }

  closeForm();
  showToast(result.message || 'Data berhasil disimpan');
  await fetchWisma();
}

async function deleteWisma(id) {
  const confirmed = window.confirm('Yakin ingin menghapus data wisma ini?');
  if (!confirmed) {
    return;
  }

  const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
  const result = await response.json();

  if (!response.ok) {
    showToast(result.message || 'Gagal menghapus data', true);
    return;
  }

  showToast(result.message || 'Data berhasil dihapus');
  await fetchWisma();
}

document.getElementById('btn-tambah').addEventListener('click', () => openForm());
document.getElementById('btn-close').addEventListener('click', closeForm);
document.getElementById('btn-batal').addEventListener('click', closeForm);
wismaForm.addEventListener('submit', saveWisma);
searchInput.addEventListener('input', renderTable);

tableBody.addEventListener('click', (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    const item = wismaList.find((row) => String(row.id_wisma) === editId);
    if (item) {
      openForm(item);
    }
  }

  if (deleteId) {
    deleteWisma(deleteId);
  }
});

fetchWisma().catch((error) => {
  tableBody.innerHTML = `
    <tr>
      <td colspan="5" class="empty">${error.message}</td>
    </tr>
  `;
  showToast(error.message, true);
});
