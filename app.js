const defaultProducts = [
  {
    id: 1,
    name: "Beras Ramos 5 kg",
    category: "Sembako",
    price: 68500,
    oldPrice: 72000,
    stock: 24,
    promo: true,
    isNew: false,
    mark: "BR",
  },
  {
    id: 2,
    name: "Minyak Goreng 2 L",
    category: "Sembako",
    price: 34500,
    oldPrice: 0,
    stock: 13,
    promo: false,
    isNew: true,
    mark: "MG",
  },
  {
    id: 3,
    name: "Kopi Susu Botol",
    category: "Minuman",
    price: 9500,
    oldPrice: 12000,
    stock: 32,
    promo: true,
    isNew: true,
    mark: "KP",
  },
  {
    id: 4,
    name: "Teh Melati 350 ml",
    category: "Minuman",
    price: 4500,
    oldPrice: 0,
    stock: 0,
    promo: false,
    isNew: false,
    mark: "TH",
  },
  {
    id: 5,
    name: "Sabun Mandi Fresh",
    category: "Perawatan",
    price: 7000,
    oldPrice: 8500,
    stock: 8,
    promo: true,
    isNew: false,
    mark: "SB",
  },
  {
    id: 6,
    name: "Sampo Herbal 180 ml",
    category: "Perawatan",
    price: 18500,
    oldPrice: 0,
    stock: 16,
    promo: false,
    isNew: true,
    mark: "SH",
  },
  {
    id: 7,
    name: "Keripik Pedas",
    category: "Snack",
    price: 12500,
    oldPrice: 15000,
    stock: 5,
    promo: true,
    isNew: false,
    mark: "KR",
  },
  {
    id: 8,
    name: "Biskuit Cokelat",
    category: "Snack",
    price: 9800,
    oldPrice: 0,
    stock: 21,
    promo: false,
    isNew: false,
    mark: "BK",
  },
];

const storageKeys = {
  products: "kunbsmart.products",
  suggestions: "kunbsmart.suggestions",
  operator: "kunbsmart.operator",
  operatorCode: "kunbsmart.operatorCode",
  hiddenDefaultProducts: "kunbsmart.hiddenDefaultProducts",
};

const operatorEntryEnabled = new URLSearchParams(window.location.search).get("operator") === "1";

let products = [...loadVisibleDefaultProducts(), ...loadStoredProducts()];
let suggestions = loadStoredSuggestions();

const state = {
  activeFilter: "all",
  search: "",
  category: "all",
  cart: [],
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const productGrid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#searchInput");
const categoryFilter = document.querySelector("#categoryFilter");
const resultInfo = document.querySelector("#resultInfo");
const cartButton = document.querySelector("#cartButton");
const cartDrawer = document.querySelector("#cartDrawer");
const closeDrawer = document.querySelector("#closeDrawer");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const cartCount = document.querySelector("#cartCount");
const productForm = document.querySelector("#productForm");
const productStatus = document.querySelector("#productStatus");
const operatorForm = document.querySelector("#operatorForm");
const operatorCode = document.querySelector("#operatorCode");
const operatorStatus = document.querySelector("#operatorStatus");
const operatorLogout = document.querySelector("#operatorLogout");
const operatorTabs = document.querySelectorAll(".operator-tab");
const operatorActiveBadge = document.querySelector("#operatorActiveBadge");
const deleteAllProducts = document.querySelector("#deleteAllProducts");
const excelFile = document.querySelector("#excelFile");
const importExcel = document.querySelector("#importExcel");
const exportExcel = document.querySelector("#exportExcel");
const downloadTemplate = document.querySelector("#downloadTemplate");
const excelStatus = document.querySelector("#excelStatus");
const suggestionForm = document.querySelector("#suggestionForm");
const suggestionStatus = document.querySelector("#suggestionStatus");
const recommendedProducts = document.querySelector("#recommendedProducts");
const customerSuggestions = document.querySelector("#customerSuggestions");
const operatorSuggestions = document.querySelector("#operatorSuggestions");
const deleteAllSuggestions = document.querySelector("#deleteAllSuggestions");

function loadStoredProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKeys.products) || "[]");
    return saved;
  } catch {
    return [];
  }
}

function loadHiddenDefaultIds() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.hiddenDefaultProducts) || "[]").map(String);
  } catch {
    return [];
  }
}

function loadVisibleDefaultProducts() {
  const hiddenIds = new Set(loadHiddenDefaultIds());
  return defaultProducts.filter((product) => !hiddenIds.has(String(product.id)));
}

function hideDefaultProduct(productId) {
  const hiddenIds = new Set(loadHiddenDefaultIds());
  hiddenIds.add(String(productId));
  localStorage.setItem(storageKeys.hiddenDefaultProducts, JSON.stringify([...hiddenIds]));
}

function loadStoredSuggestions() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.suggestions) || "[]");
  } catch {
    return [];
  }
}

function saveCustomProducts() {
  const customProducts = products.filter((product) => product.custom);
  localStorage.setItem(storageKeys.products, JSON.stringify(customProducts));
}

function saveSuggestions() {
  localStorage.setItem(storageKeys.suggestions, JSON.stringify(suggestions));
}

async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function getOperatorCode() {
  return sessionStorage.getItem(storageKeys.operatorCode) || "";
}

async function loadDatabaseData() {
  const [productData, suggestionData] = await Promise.all([
    apiRequest("/api/products"),
    apiRequest("/api/suggestions"),
  ]);

  if (productData?.products) {
    products = productData.products.map((product) => ({ ...product, custom: true }));
  }

  if (suggestionData?.suggestions) {
    suggestions = suggestionData.suggestions;
  }
}

async function createDatabaseProduct(product) {
  return apiRequest("/api/products", {
    method: "POST",
    headers: {
      "x-operator-code": getOperatorCode(),
    },
    body: JSON.stringify(product),
  });
}

async function deleteDatabaseProduct(productId) {
  return apiRequest(`/api/products?id=${encodeURIComponent(productId)}`, {
    method: "DELETE",
    headers: {
      "x-operator-code": getOperatorCode(),
    },
  });
}

async function deleteAllDatabaseProducts() {
  return apiRequest("/api/products?all=true", {
    method: "DELETE",
    headers: {
      "x-operator-code": getOperatorCode(),
    },
  });
}

async function createDatabaseSuggestion(suggestion) {
  return apiRequest("/api/suggestions", {
    method: "POST",
    body: JSON.stringify(suggestion),
  });
}

async function deleteDatabaseSuggestion(suggestionId) {
  return apiRequest(`/api/suggestions?id=${encodeURIComponent(suggestionId)}`, {
    method: "DELETE",
    headers: {
      "x-operator-code": getOperatorCode(),
    },
  });
}

async function deleteAllDatabaseSuggestions() {
  return apiRequest("/api/suggestions?all=true", {
    method: "DELETE",
    headers: {
      "x-operator-code": getOperatorCode(),
    },
  });
}

async function verifyOperatorCode(code) {
  return apiRequest("/api/operator", {
    method: "POST",
    headers: {
      "x-operator-code": code,
    },
    body: JSON.stringify({}),
  });
}

function isOperatorActive() {
  return sessionStorage.getItem(storageKeys.operator) === "active" && Boolean(getOperatorCode());
}

function canShowOperatorArea() {
  return operatorEntryEnabled || isOperatorActive();
}

function updateOperatorVisibility() {
  const showOperatorArea = canShowOperatorArea();
  operatorTabs.forEach((tab) => {
    tab.hidden = !showOperatorArea;
  });

  if (!showOperatorArea) {
    switchView("catalogView");
  }
}

function setOperatorAccess(active, code = "") {
  if (active && code) {
    sessionStorage.setItem(storageKeys.operator, "active");
    sessionStorage.setItem(storageKeys.operatorCode, code);
  } else if (!active) {
    sessionStorage.removeItem(storageKeys.operator);
    sessionStorage.removeItem(storageKeys.operatorCode);
  }

  operatorForm.hidden = active;
  productForm.hidden = !active;
  operatorSuggestions.hidden = !active;
  operatorActiveBadge.hidden = !active;
  updateOperatorVisibility();
  if (active) {
    operatorStatus.textContent = "Login operator berhasil. Anda masuk sebagai operator KUNBsmart.";
    operatorCode.value = "";
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeMark(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  const text = String(value || "").trim().toLowerCase();
  return ["true", "ya", "y", "1", "promo", "baru"].includes(text);
}

function normalizeImportedProduct(row) {
  const name = String(row.name || row.nama || row["Nama Produk"] || "").trim();
  const category = String(row.category || row.kategori || row.Kategori || "Sembako").trim();
  const price = Number(row.price ?? row.harga ?? row.Harga ?? 0);
  const oldPrice = Number(row.oldPrice ?? row.hargaLama ?? row["Harga Lama"] ?? 0);
  const stock = Number(row.stock ?? row.stok ?? row.Stok ?? 0);
  const mark = String(row.mark || row.kode || row.Kode || makeMark(name)).trim().toUpperCase().slice(0, 3);

  if (!name || Number.isNaN(price) || Number.isNaN(stock)) return null;

  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    name,
    category,
    price,
    oldPrice: Number.isNaN(oldPrice) ? 0 : oldPrice,
    stock,
    promo: toBoolean(row.promo ?? row.diskon ?? row.Diskon),
    isNew: toBoolean(row.isNew ?? row.baru ?? row.Baru),
    mark: mark || makeMark(name),
    custom: true,
  };
}

function productsForExcel() {
  return products.map((product) => ({
    name: product.name,
    category: product.category,
    price: product.price,
    oldPrice: product.oldPrice,
    stock: product.stock,
    promo: product.promo ? "ya" : "tidak",
    isNew: product.isNew ? "ya" : "tidak",
    mark: product.mark,
  }));
}

function downloadWorkbook(rows, filename) {
  if (!window.XLSX) {
    excelStatus.textContent = "Library Excel belum termuat. Coba refresh halaman.";
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Produk");
  XLSX.writeFile(workbook, filename);
}

async function readExcelRows(file) {
  if (!window.XLSX) {
    throw new Error("Library Excel belum termuat. Coba refresh halaman.");
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function getStockClass(stock) {
  if (stock === 0) return "empty";
  if (stock <= 8) return "low";
  return "ok";
}

function getStockLabel(stock) {
  if (stock === 0) return "Stok habis";
  if (stock <= 8) return `Sisa ${stock}`;
  return `Stok ${stock}`;
}

function filterProducts() {
  return products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(state.search.toLowerCase());
    const matchesCategory = state.category === "all" || product.category === state.category;
    const matchesQuickFilter =
      state.activeFilter === "all" ||
      (state.activeFilter === "promo" && product.promo) ||
      (state.activeFilter === "new" && product.isNew) ||
      (state.activeFilter === "stock" && product.stock > 0);

    return matchesSearch && matchesCategory && matchesQuickFilter;
  });
}

function renderProducts() {
  const visibleProducts = filterProducts();
  productGrid.innerHTML = "";

  if (visibleProducts.length === 0) {
    productGrid.innerHTML = '<p class="empty-state">Produk tidak ditemukan.</p>';
  } else {
    visibleProducts.forEach((product) => {
      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div class="product-image" aria-hidden="true"><span class="product-mark">${escapeHtml(product.mark)}</span></div>
        <div class="product-top">
          <h3>${escapeHtml(product.name)}</h3>
        </div>
        <div class="badge-row">
          <span class="badge">${escapeHtml(product.category)}</span>
          ${product.promo ? '<span class="badge promo">Diskon</span>' : ""}
          ${product.isNew ? '<span class="badge new">Baru</span>' : ""}
        </div>
        <p class="price">
          ${rupiah.format(product.price)}
          ${product.oldPrice ? `<span class="old-price">${rupiah.format(product.oldPrice)}</span>` : ""}
        </p>
        <div class="meta">
          <span>Harga satuan</span>
          <span class="stock ${getStockClass(product.stock)}">${getStockLabel(product.stock)}</span>
        </div>
        <button class="add-button" data-id="${escapeHtml(product.id)}" ${product.stock === 0 ? "disabled" : ""}>
          ${product.stock === 0 ? "Tidak tersedia" : "Tambah"}
        </button>
        ${
          isOperatorActive()
            ? `<button class="delete-button" data-delete-id="${escapeHtml(product.id)}">Hapus Produk</button>`
            : ""
        }
      `;
      productGrid.appendChild(card);
    });
  }

  resultInfo.textContent = `Menampilkan ${visibleProducts.length} dari ${products.length} produk`;
}

function renderSummary() {
  document.querySelector("#availableCount").textContent = products.filter((item) => item.stock > 0).length;
  document.querySelector("#promoCount").textContent = products.filter((item) => item.promo).length;
  document.querySelector("#newCount").textContent = products.filter((item) => item.isNew).length;
  const heroPromoCount = document.querySelector("#heroPromoCount");
  if (heroPromoCount) heroPromoCount.textContent = products.filter((item) => item.promo).length;
}

function renderRecommendations() {
  if (!recommendedProducts) return;

  const picks = [...products]
    .filter((product) => product.stock > 0)
    .sort((first, second) => Number(second.promo) - Number(first.promo) || Number(second.isNew) - Number(first.isNew))
    .slice(0, 4);

  recommendedProducts.innerHTML = picks
    .map(
      (product) => `
        <article class="suggestion-item">
          <strong>${escapeHtml(product.name)}</strong>
          <span>${escapeHtml(product.category)} - ${rupiah.format(product.price)} - ${getStockLabel(product.stock)}</span>
        </article>
      `,
    )
    .join("");
}

function renderSuggestions() {
  if (!customerSuggestions) return;
  operatorSuggestions.hidden = !isOperatorActive();

  if (!isOperatorActive()) {
    customerSuggestions.innerHTML = "";
    return;
  }

  if (suggestions.length === 0) {
    customerSuggestions.innerHTML = '<p class="empty-state">Belum ada saran pelanggan.</p>';
    return;
  }

  customerSuggestions.innerHTML = suggestions
    .slice()
    .reverse()
    .map(
      (suggestion) => `
        <article class="suggestion-item">
          <div>
            <strong>${escapeHtml(suggestion.name || "Pelanggan")}</strong>
            <span>${escapeHtml(suggestion.text)}</span>
          </div>
          <button class="delete-suggestion-button" data-suggestion-id="${escapeHtml(suggestion.id || suggestion.createdAt)}">
            Hapus
          </button>
        </article>
      `,
    )
    .join("");
}

function renderAll() {
  renderSummary();
  renderProducts();
  renderCart();
  renderRecommendations();
  renderSuggestions();
  setOperatorAccess(isOperatorActive());
}

function renderCart() {
  cartCount.textContent = state.cart.length;
  cartItems.innerHTML = "";

  if (state.cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-state">Belum ada produk dipilih.</p>';
  } else {
    state.cart.forEach((product) => {
      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <span class="thumb" aria-hidden="true">${escapeHtml(product.mark)}</span>
        <div>
          <p>${escapeHtml(product.name)}</p>
          <small>${escapeHtml(product.category)}</small>
        </div>
        <strong>${rupiah.format(product.price)}</strong>
      `;
      cartItems.appendChild(item);
    });
  }

  const total = state.cart.reduce((sum, product) => sum + product.price, 0);
  cartTotal.textContent = rupiah.format(total);
}

function setDrawer(open) {
  cartDrawer.classList.toggle("open", open);
  cartDrawer.setAttribute("aria-hidden", String(!open));
}

function switchView(viewId) {
  if (viewId === "addProductView" && !canShowOperatorArea()) {
    viewId = "catalogView";
  }

  document.querySelectorAll(".app-view").forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewId);
  });
}

document.querySelectorAll(".view-tab").forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    state.activeFilter = button.dataset.filter;
    renderProducts();
  });
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim();
  renderProducts();
});

categoryFilter.addEventListener("change", (event) => {
  state.category = event.target.value;
  renderProducts();
});

productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-button");
  if (!button) return;

  const product = products.find((item) => String(item.id) === button.dataset.id);
  if (!product || product.stock === 0) return;

  state.cart.push(product);
  renderCart();
});

productGrid.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-button");
  if (!button || !isOperatorActive()) return;

  const product = products.find((item) => String(item.id) === button.dataset.deleteId);
  if (!product) return;

  const confirmed = confirm(`Hapus produk "${product.name}" dari katalog?`);
  if (!confirmed) return;

  const databaseResult = String(product.id).startsWith("db-") ? await deleteDatabaseProduct(product.id) : null;
  if (!product.custom) hideDefaultProduct(product.id);
  products = products.filter((item) => String(item.id) !== String(product.id));
  state.cart = state.cart.filter((item) => String(item.id) !== String(product.id));
  saveCustomProducts();
  productStatus.textContent = databaseResult?.ok
    ? `${product.name} berhasil dihapus dari database.`
    : `${product.name} dihapus dari tampilan.`;
  renderAll();
});

deleteAllProducts.addEventListener("click", async () => {
  if (!isOperatorActive()) return;

  const confirmed = confirm("Hapus semua produk dari katalog? Tindakan ini tidak bisa dibatalkan.");
  if (!confirmed) return;

  const databaseResult = await deleteAllDatabaseProducts();
  products.forEach((product) => {
    if (!product.custom) hideDefaultProduct(product.id);
  });
  products = [];
  state.cart = [];
  localStorage.setItem(storageKeys.products, JSON.stringify([]));
  localStorage.setItem(
    storageKeys.hiddenDefaultProducts,
    JSON.stringify(defaultProducts.map((product) => String(product.id))),
  );
  productStatus.textContent = databaseResult?.ok
    ? "Semua produk berhasil dihapus dari database."
    : "Semua produk dihapus dari tampilan browser ini.";
  renderAll();
});

cartButton.addEventListener("click", () => setDrawer(true));
closeDrawer.addEventListener("click", () => setDrawer(false));
cartDrawer.addEventListener("click", (event) => {
  if (event.target === cartDrawer) setDrawer(false);
});

productForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector("#productName").value.trim();
  const category = document.querySelector("#productCategory").value;
  const price = Number(document.querySelector("#productPrice").value);
  const oldPrice = Number(document.querySelector("#productOldPrice").value || 0);
  const stock = Number(document.querySelector("#productStock").value);
  const markInput = document.querySelector("#productMark").value.trim().toUpperCase();
  const promo = document.querySelector("#productPromo").checked;
  const isNew = document.querySelector("#productNew").checked;

  if (!name || price < 0 || stock < 0) {
    productStatus.textContent = "Mohon isi data produk dengan benar.";
    return;
  }

  const product = {
    id: Date.now(),
    name,
    category,
    price,
    oldPrice,
    stock,
    promo,
    isNew,
    mark: markInput || makeMark(name),
    custom: true,
  };

  const databaseResult = await createDatabaseProduct(product);
  if (!databaseResult?.product) {
    productStatus.textContent = getOperatorCode()
      ? "Produk gagal disimpan ke database. Pastikan deploy Vercel terbaru sudah selesai."
      : "Sesi operator habis. Klik Keluar Operator, lalu login ulang.";
    return;
  }

  products.push({ ...databaseResult.product, custom: true });

  productForm.reset();
  document.querySelector("#productNew").checked = true;
  productStatus.textContent = `${name} berhasil ditambahkan ke database.`;
  renderAll();
  switchView("catalogView");
});

operatorForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const code = operatorCode.value.trim();
  const result = await verifyOperatorCode(code);

  if (!result?.ok) {
    operatorStatus.textContent = "Kode operator salah.";
    return;
  }

  setOperatorAccess(true, code);
  renderProducts();
  renderSuggestions();
});

operatorLogout.addEventListener("click", () => {
  sessionStorage.removeItem(storageKeys.operator);
  sessionStorage.removeItem(storageKeys.operatorCode);
  setOperatorAccess(false);
  switchView("catalogView");
  renderProducts();
  renderSuggestions();
});

customerSuggestions.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-suggestion-button");
  if (!button || !isOperatorActive()) return;

  const suggestion = suggestions.find((item) => String(item.id || item.createdAt) === button.dataset.suggestionId);
  if (!suggestion) return;

  const confirmed = confirm(`Hapus saran dari "${suggestion.name || "Pelanggan"}"?`);
  if (!confirmed) return;

  const databaseResult = String(suggestion.id || "").startsWith("db-")
    ? await deleteDatabaseSuggestion(suggestion.id)
    : null;
  suggestions = suggestions.filter((item) => String(item.id || item.createdAt) !== button.dataset.suggestionId);
  saveSuggestions();
  suggestionStatus.textContent = databaseResult?.ok
    ? "Saran berhasil dihapus dari database."
    : "Saran berhasil dihapus dari tampilan browser ini.";
  renderSuggestions();
});

deleteAllSuggestions.addEventListener("click", async () => {
  if (!isOperatorActive()) return;

  const confirmed = confirm("Hapus semua saran pelanggan? Tindakan ini tidak bisa dibatalkan.");
  if (!confirmed) return;

  const databaseResult = await deleteAllDatabaseSuggestions();
  suggestions = [];
  saveSuggestions();
  suggestionStatus.textContent = databaseResult?.ok
    ? "Semua saran berhasil dihapus dari database."
    : "Semua saran berhasil dihapus dari browser ini.";
  renderSuggestions();
});

downloadTemplate.addEventListener("click", () => {
  downloadWorkbook(
    [
      {
        name: "Gula Pasir 1 kg",
        category: "Sembako",
        price: 16500,
        oldPrice: 18000,
        stock: 20,
        promo: "ya",
        isNew: "ya",
        mark: "GL",
      },
    ],
    "template-produk-kunbsmart.xlsx",
  );
});

exportExcel.addEventListener("click", () => {
  downloadWorkbook(productsForExcel(), "produk-kunbsmart.xlsx");
});

importExcel.addEventListener("click", async () => {
  const file = excelFile.files?.[0];
  if (!file) {
    excelStatus.textContent = "Pilih file Excel terlebih dahulu.";
    return;
  }

  excelStatus.textContent = "Membaca file Excel...";

  try {
    const rows = await readExcelRows(file);
    const importedProducts = rows.map(normalizeImportedProduct).filter(Boolean);

    if (importedProducts.length === 0) {
      excelStatus.textContent = "Tidak ada produk valid di file Excel.";
      return;
    }

    let databaseCount = 0;
    let failedCount = 0;

    for (const product of importedProducts) {
      const databaseResult = await createDatabaseProduct(product);
      if (databaseResult?.product) {
        products.push({ ...databaseResult.product, custom: true });
        databaseCount += 1;
      } else {
        failedCount += 1;
      }
    }

    excelFile.value = "";
    excelStatus.textContent = `${databaseCount} produk berhasil diimport ke database.${failedCount ? ` ${failedCount} produk gagal disimpan.` : ""}`;
    renderAll();
    switchView("catalogView");
  } catch (error) {
    excelStatus.textContent = error.message || "Gagal membaca file Excel.";
  }
});

suggestionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = document.querySelector("#suggestionName").value.trim();
  const text = document.querySelector("#suggestionText").value.trim();
  if (!text) {
    suggestionStatus.textContent = "Mohon tulis saran terlebih dahulu.";
    return;
  }

  const suggestion = { name, text, createdAt: new Date().toISOString() };
  const databaseResult = await createDatabaseSuggestion(suggestion);
  suggestions.push(databaseResult?.suggestion || suggestion);
  if (!databaseResult?.suggestion) saveSuggestions();

  suggestionForm.reset();
  suggestionStatus.textContent = databaseResult?.suggestion
    ? "Terima kasih, saran sudah tersimpan di database."
    : "Terima kasih, saran tersimpan di browser ini. Database belum tersambung.";
  renderSuggestions();
});

async function init() {
  if (sessionStorage.getItem(storageKeys.operator) === "active" && !getOperatorCode()) {
    setOperatorAccess(false);
  }

  await loadDatabaseData();
  renderAll();
}

init();
