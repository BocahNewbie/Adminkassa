// DATABASE LOKAL PERSISTEN (LocalStorage)
let products = JSON.parse(localStorage.getItem('pos_products')) || [
  { id: 1, name: 'Kopi Susu Aren', price: 18000, discount: 0, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300', desc: 'Espresso + Gula Aren Premium' },
  { id: 2, name: 'Croissant Butter', price: 25000, discount: 10, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300', desc: 'Roti renyah rasa mentega' },
  { id: 3, name: 'Matcha Latte', price: 22000, discount: 0, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300', desc: 'Matcha Uji Jepang asli' }
];

let users = JSON.parse(localStorage.getItem('pos_users')) || [
  { id: 1, name: 'Super Admin', username: 'admin', password: '123', position: 'Manager Store', role: 'Admin', tabs: ['kasir', 'produk', 'admin', 'akunting', 'karyawan'] },
  { id: 2, name: 'Siti Kasir', username: 'kasir', password: '123', position: 'Staff Kasir', role: 'Kasir', tabs: ['kasir', 'karyawan'] }
];

let transactions = JSON.parse(localStorage.getItem('pos_transactions')) || [];

// APPLICATION STATE
let currentUser = JSON.parse(localStorage.getItem('pos_session')) || null;
let cart = [];

// MENU CONFIGURATION
const ALL_MENUS = [
  { id: 'kasir', name: 'Kasir', icon: 'fa-cash-register' },
  { id: 'produk', name: 'Produk', icon: 'fa-box' },
  { id: 'admin', name: 'Admin', icon: 'fa-user-shield' },
  { id: 'akunting', name: 'Akunting', icon: 'fa-chart-pie' },
  { id: 'karyawan', name: 'Karyawan', icon: 'fa-users' }
];

// INIT APPLICATION
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric'
  });

  if (currentUser) {
    showDashboard();
  } else {
    showLogin();
  }
});

// AUTHENTICATION LOGIC
function handleLogin(e) {
  e.preventDefault();
  const uInput = document.getElementById('loginUsername').value.trim();
  const pInput = document.getElementById('loginPassword').value.trim();

  const found = users.find(u => u.username === uInput && u.password === pInput);
  if (found) {
    currentUser = found;
    localStorage.setItem('pos_session', JSON.stringify(currentUser));
    showDashboard();
  } else {
    alert('Username atau Password salah!');
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('pos_session');
  showLogin();
}

function showLogin() {
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('appContainer').classList.add('hidden');
}

function showDashboard() {
  document.getElementById('loginPage').classList.add('hidden');
  document.getElementById('appContainer').classList.remove('hidden');
  document.getElementById('activeUser').textContent = currentUser.name;
  document.getElementById('activeRole').textContent = currentUser.position;

  renderSidebarMenu();
  
  // Pindah ke tab pertama yang diizinkan user
  const firstTab = currentUser.tabs[0] || 'kasir';
  switchTab(firstTab);
}

// NAVIGATION & ACCESS CONTROL
function renderSidebarMenu() {
  const navContainer = document.getElementById('sidebarMenu');
  navContainer.innerHTML = '';

  ALL_MENUS.forEach(menu => {
    // Admin bisa akses semua, role lain sesuai array tab-nya
    const hasAccess = currentUser.role === 'Admin' || currentUser.tabs.includes(menu.id);
    if (hasAccess) {
      const a = document.createElement('a');
      a.href = '#';
      a.className = `nav-item nav-${menu.id}`;
      a.onclick = (e) => { e.preventDefault(); switchTab(menu.id); };
      a.innerHTML = `<i class="fa-solid ${menu.icon}"></i> <span>${menu.name}</span>`;
      navContainer.appendChild(a);
    }
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${tabId}`);
  const activeNav = document.querySelector(`.nav-${tabId}`);

  if (activeTab) activeTab.classList.remove('hidden');
  if (activeNav) activeNav.classList.add('active');

  document.getElementById('pageTitle').textContent = tabId.toUpperCase();

  // Load Data Sesuai Tab
  if (tabId === 'kasir') renderPosProducts();
  if (tabId === 'produk') renderProductTable();
  if (tabId === 'admin') renderUserTable();
  if (tabId === 'akunting') renderAccountingData();
  if (tabId === 'karyawan') renderKaryawanList();
}

// ---------------- TAB 1: KASIR LOGIC ----------------
function renderPosProducts() {
  const query = document.getElementById('posSearch').value.toLowerCase();
  const grid = document.getElementById('posProductGrid');
  grid.innerHTML = '';

  const filtered = products.filter(p => p.name.toLowerCase().includes(query));
  filtered.forEach(p => {
    const finalPrice = p.price - (p.price * (p.discount / 100));
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => addToCart(p.id);
    card.innerHTML = `
      <img src="${p.image || 'https://via.placeholder.com/150'}" class="product-img" alt="${p.name}">
      <div class="product-info">
        <div class="product-title">${p.name}</div>
        <div class="product-price">
          Rp ${finalPrice.toLocaleString('id-ID')}
          ${p.discount > 0 ? `<span class="discount-tag">-${p.discount}%</span>` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function addToCart(prodId) {
  const prod = products.find(p => p.id === prodId);
  const existing = cart.find(item => item.id === prodId);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...prod, qty: 1 });
  }
  renderCart();
}

function updateCartQty(prodId, delta) {
  const item = cart.find(i => i.id === prodId);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== prodId);
    }
  }
  renderCart();
}

function clearCart() {
  cart = [];
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  container.innerHTML = '';

  let subtotal = 0;
  let totalDiscount = 0;

  cart.forEach(item => {
    const itemSub = item.price * item.qty;
    const itemDisc = (item.price * (item.discount / 100)) * item.qty;
    subtotal += itemSub;
    totalDiscount += itemDisc;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        <small class="text-muted">Rp ${item.price.toLocaleString('id-ID')} x ${item.qty}</small>
      </div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)">-</button>
        <span>${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)">+</button>
      </div>
    `;
    container.appendChild(div);
  });

  const finalTotal = subtotal - totalDiscount;

  document.getElementById('cartSubtotal').textContent = `Rp ${subtotal.toLocaleString('id-ID')}`;
  document.getElementById('cartDiscount').textContent = `- Rp ${totalDiscount.toLocaleString('id-ID')}`;
  document.getElementById('cartTotal').textContent = `Rp ${finalTotal.toLocaleString('id-ID')}`;
  calculateChange();
}

function calculateChange() {
  const totalText = document.getElementById('cartTotal').textContent.replace(/[^0-9]/g, '');
  const total = parseFloat(totalText) || 0;
  const pay = parseFloat(document.getElementById('payAmount').value) || 0;
  const change = pay - total;

  document.getElementById('payChange').textContent = `Rp ${change >= 0 ? change.toLocaleString('id-ID') : 0}`;
}

function processPayment() {
  if (cart.length === 0) return alert('Keranjang belanja masih kosong!');
  const totalText = document.getElementById('cartTotal').textContent.replace(/[^0-9]/g, '');
  const total = parseFloat(totalText) || 0;
  const pay = parseFloat(document.getElementById('payAmount').value) || 0;

  if (pay < total) return alert('Nominal uang pembayaran kurang!');

  const newTransaction = {
    id: Date.now(),
    date: new Date().toISOString(),
    hour: new Date().getHours(),
    cashier: currentUser.name,
    items: [...cart],
    totalAmount: total
  };

  transactions.push(newTransaction);
  localStorage.setItem('pos_transactions', JSON.stringify(transactions));

  alert(`Transaksi Berhasil!\nKembalian: Rp ${(pay - total).toLocaleString('id-ID')}`);
  cart = [];
  document.getElementById('payAmount').value = '';
  renderCart();
}

// ---------------- TAB 2: PRODUK LOGIC ----------------
function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodId').value;
  const name = document.getElementById('prodName').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const discount = parseFloat(document.getElementById('prodDiscount').value) || 0;
  const image = document.getElementById('prodImage').value;
  const desc = document.getElementById('prodDesc').value;

  if (id) {
    const idx = products.findIndex(p => p.id == id);
    products[idx] = { id: parseInt(id), name, price, discount, image, desc };
  } else {
    products.push({ id: Date.now(), name, price, discount, image, desc });
  }

  localStorage.setItem('pos_products', JSON.stringify(products));
  resetProductForm();
  renderProductTable();
}

function editProduct(id) {
  const p = products.find(prod => prod.id === id);
  if (!p) return;
  document.getElementById('prodId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodPrice').value = p.price;
  document.getElementById('prodDiscount').value = p.discount;
  document.getElementById('prodImage').value = p.image;
  document.getElementById('prodDesc').value = p.desc;

  document.getElementById('productFormTitle').textContent = 'Edit Produk';
  document.getElementById('btnCancelProd').classList.remove('hidden');
}

function deleteProduct(id) {
  if (confirm('Hapus produk ini?')) {
    products = products.filter(p => p.id !== id);
    localStorage.setItem('pos_products', JSON.stringify(products));
    renderProductTable();
  }
}

function resetProductForm() {
  document.getElementById('productForm').reset();
  document.getElementById('prodId').value = '';
  document.getElementById('productFormTitle').textContent = 'Tambah Produk';
  document.getElementById('btnCancelProd').classList.add('hidden');
}

function renderProductTable() {
  const tbody = document.getElementById('productTableBody');
  tbody.innerHTML = '';
  products.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${p.image || 'https://via.placeholder.com/40'}" style="width:35px;height:35px;border-radius:6px;object-fit:cover;"></td>
      <td><strong>${p.name}</strong></td>
      <td>Rp ${p.price.toLocaleString('id-ID')}</td>
      <td>${p.discount}%</td>
      <td>
        <button class="btn-icon" onclick="editProduct(${p.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon text-danger" onclick="deleteProduct(${p.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- TAB 3: ADMIN LOGIC ----------------
function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const name = document.getElementById('userName').value;
  const username = document.getElementById('userUsername').value;
  const password = document.getElementById('userPassword').value;
  const position = document.getElementById('userPosition').value;
  const role = document.getElementById('userRole').value;

  // Get selected tab access
  const tabCheckboxes = document.querySelectorAll('.tab-access:checked');
  let selectedTabs = Array.from(tabCheckboxes).map(cb => cb.value);

  // Jika Role Admin, paksa beri akses ke semua tab
  if (role === 'Admin') {
    selectedTabs = ['kasir', 'produk', 'admin', 'akunting', 'karyawan'];
  }

  if (id) {
    const idx = users.findIndex(u => u.id == id);
    users[idx] = { id: parseInt(id), name, username, password, position, role, tabs: selectedTabs };
  } else {
    users.push({ id: Date.now(), name, username, password, position, role, tabs: selectedTabs });
  }

  localStorage.setItem('pos_users', JSON.stringify(users));
  resetUserForm();
  renderUserTable();
}

function editUser(id) {
  const u = users.find(usr => usr.id === id);
  if (!u) return;
  document.getElementById('userId').value = u.id;
  document.getElementById('userName').value = u.name;
  document.getElementById('userUsername').value = u.username;
  document.getElementById('userPassword').value = u.password;
  document.getElementById('userPosition').value = u.position;
  document.getElementById('userRole').value = u.role;

  document.querySelectorAll('.tab-access').forEach(cb => {
    cb.checked = u.tabs.includes(cb.value);
  });

  document.getElementById('userFormTitle').textContent = 'Edit Karyawan / User';
  document.getElementById('btnCancelUser').classList.remove('hidden');
}

function deleteUser(id) {
  if (confirm('Hapus karyawan ini?')) {
    users = users.filter(u => u.id !== id);
    localStorage.setItem('pos_users', JSON.stringify(users));
    renderUserTable();
  }
}

function resetUserForm() {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userFormTitle').textContent = 'Tambah Karyawan / User';
  document.getElementById('btnCancelUser').classList.add('hidden');
}

function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${u.name}</strong></td>
      <td>${u.username}</td>
      <td>${u.position}</td>
      <td><span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></td>
      <td><small>${u.tabs.join(', ')}</small></td>
      <td>
        <button class="btn-icon" onclick="editUser(${u.id})"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icon text-danger" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- TAB 4: AKUNTING LOGIC ----------------
function renderAccountingData() {
  let totalSales = 0;
  let totalQty = 0;
  const productStats = {};
  const hourStats = {};

  transactions.forEach(t => {
    totalSales += t.totalAmount;
    
    // Track Peak Hours
    if (t.hour !== undefined) {
      hourStats[t.hour] = (hourStats[t.hour] || 0) + 1;
    }

    t.items.forEach(i => {
      totalQty += i.qty;
      if (!productStats[i.name]) {
        productStats[i.name] = { qty: 0, price: i.price, revenue: 0 };
      }
      productStats[i.name].qty += i.qty;
      productStats[i.name].revenue += (i.price - (i.price * (i.discount/100))) * i.qty;
    });
  });

  const totalTxCount = transactions.length;
  const basketSize = totalTxCount > 0 ? Math.round(totalSales / totalTxCount) : 0;

  // Find Peak Hour
  let peakHour = '-';
  let maxTx = 0;
  Object.keys(hourStats).forEach(h => {
    if (hourStats[h] > maxTx) {
      maxTx = hourStats[h];
      peakHour = `${h}:00 - ${parseInt(h) + 1}:00 (${maxTx} Tx)`;
    }
  });

  document.getElementById('accTotalSales').textContent = `Rp ${totalSales.toLocaleString('id-ID')}`;
  document.getElementById('accTotalQty').textContent = `${totalQty} Pcs`;
  document.getElementById('accBasketSize').textContent = `Rp ${basketSize.toLocaleString('id-ID')}`;
  document.getElementById('accPeakHour').textContent = peakHour;

  // Render Table
  const tbody = document.getElementById('accountingTableBody');
  tbody.innerHTML = '';
  Object.keys(productStats).forEach(pName => {
    const item = productStats[pName];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${pName}</strong></td>
      <td>${item.qty} Pcs</td>
      <td>Rp ${item.price.toLocaleString('id-ID')}</td>
      <td class="text-primary"><strong>Rp ${item.revenue.toLocaleString('id-ID')}</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// ---------------- TAB 5: KARYAWAN LOGIC ----------------
function renderKaryawanList() {
  const tbody = document.getElementById('karyawanTableBody');
  tbody.innerHTML = '';

  users.forEach(u => {
    const isOnDuty = currentUser && currentUser.id === u.id;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <span class="badge ${isOnDuty ? 'bg-success-light' : 'badge-kasir'}">
          ${isOnDuty ? '● On Duty (Aktif)' : 'Off Duty'}
        </span>
      </td>
      <td><strong>${u.name}</strong></td>
      <td>${u.position}</td>
      <td><span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></td>
    `;
    tbody.appendChild(tr);
  });
}