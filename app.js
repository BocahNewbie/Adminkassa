// DATABASE LOKAL PERSISTEN (LocalStorage)
let products = JSON.parse(localStorage.getItem('pos_products')) || [
    { id: 1, name: 'Kopi Susu Aren', price: 18000, discount: 0, image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=300', desc: 'Espresso + Gula Aren Premium' },
    { id: 2, name: 'Croissant Butter', price: 25000, discount: 10, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300', desc: 'Roti renyah rasa mentega' },
    { id: 3, name: 'Matcha Latte', price: 22000, discount: 0, image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=300', desc: 'Matcha Uji Jepang asli' }
];

let users = JSON.parse(localStorage.getItem('pos_users')) || [
    { id: 1, name: 'Super Admin', username: 'admin', password: '123', position: 'Manager Store', role: 'Admin', shift: 'Pagi', status: 'On Duty', tabs: ['kasir', 'produk', 'admin', 'akunting', 'karyawan'] },
    { id: 2, name: 'Siti Kasir', username: 'kasir', password: '123', position: 'Staff Kasir', role: 'Kasir', shift: 'Siang', status: 'On Duty', tabs: ['kasir', 'karyawan'] }
];

let transactions = JSON.parse(localStorage.getItem('pos_transactions')) || [];
let currentUser = JSON.parse(localStorage.getItem('pos_session')) || null;
let cart = [];

const ALL_MENUS = [
    { id: 'kasir', name: 'Kasir', icon: 'fa-cash-register' },
    { id: 'produk', name: 'Produk', icon: 'fa-box' },
    { id: 'admin', name: 'Admin', icon: 'fa-user-shield' },
    { id: 'akunting', name: 'Akunting', icon: 'fa-chart-pie' },
    { id: 'karyawan', name: 'Karyawan', icon: 'fa-users' }
];

// INIT APPLICATION
document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('currentDate');
    if(dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (currentUser) {
        showDashboard();
    } else {
        showLogin();
    }
});

// AUTHENTICATION
function handleLogin(e) {
    e.preventDefault();
    const uInput = document.getElementById('loginUsername').value.trim();
    const pInput = document.getElementById('loginPassword').value.trim();
    const found = users.find(u => u.username === uInput && u.password === pInput);
    if (found) {
        currentUser = found;
        currentUser.status = 'On Duty';
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
    document.getElementById('loginPage')?.classList.remove('hidden');
    document.getElementById('appContainer')?.classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginPage')?.classList.add('hidden');
    document.getElementById('appContainer')?.classList.remove('hidden');
    const activeUserEl = document.getElementById('activeUser');
    const activeRoleEl = document.getElementById('activeRole');
    if(activeUserEl) activeUserEl.textContent = currentUser.name;
    if(activeRoleEl) activeRoleEl.textContent = `${currentUser.position} (${currentUser.shift || 'Pagi'})`;
    
    renderSidebarMenu();
    const firstTab = currentUser.tabs[0] || 'kasir';
    switchTab(firstTab);
}

// NAVIGATION
function renderSidebarMenu() {
    const navContainer = document.getElementById('sidebarMenu');
    if(!navContainer) return;
    navContainer.innerHTML = '';
    ALL_MENUS.forEach(menu => {
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
    
    const pageTitle = document.getElementById('pageTitle');
    if(pageTitle) pageTitle.textContent = tabId.toUpperCase();

    if (tabId === 'kasir') renderPosProducts();
    if (tabId === 'produk') renderProductTable();
    if (tabId === 'admin') renderUserTable();
    if (tabId === 'akunting') renderAccountingData();
    if (tabId === 'karyawan') renderKaryawanList();
}

// ---------------- TAB 1: KASIR & MODERN POPUP PAYMENT ----------------
function renderPosProducts() {
    const query = document.getElementById('posSearch')?.value.toLowerCase() || '';
    const grid = document.getElementById('posProductGrid');
    if(!grid) return;
    grid.innerHTML = '';
    
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    filtered.forEach(p => {
        const finalPrice = p.price - (p.price * (p.discount / 100));
        const card = document.createElement('div');
        card.className = 'product-card modern-card';
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
    if(!container) return;
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
}

// Trigger Checkout Popup Modal
function openPaymentModal() {
    if (cart.length === 0) return alert('Keranjang belanja masih kosong!');
    const finalTotalText = document.getElementById('cartTotal').textContent;
    
    // Create modern popup modal dynamically if not present
    let modal = document.getElementById('paymentModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-card">
            <h3><i class="fa-solid fa-cash-register"></i> Pembayaran Kasir</h3>
            <div class="modal-body">
                <p>Total Belanja: <strong id="modalTotal" class="text-primary">${finalTotalText}</strong></p>
                <label>Nominal Tunai (Rp):</label>
                <input type="number" id="modalPayAmount" class="form-control" placeholder="Masukkan jumlah uang..." oninput="calculateModalChange()">
                <p class="mt-2">Kembalian: <strong id="modalChange" class="text-success">Rp 0</strong></p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closePaymentModal()">Batal</button>
                <button class="btn btn-success" onclick="processPayment()">Bayar & Cetak Struk</button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

function calculateModalChange() {
    const totalText = document.getElementById('cartTotal').textContent.replace(/[^0-9]/g, '');
    const total = parseFloat(totalText) || 0;
    const pay = parseFloat(document.getElementById('modalPayAmount').value) || 0;
    const change = pay - total;
    document.getElementById('modalChange').textContent = `Rp ${change >= 0 ? change.toLocaleString('id-ID') : 0}`;
}

function processPayment() {
    const totalText = document.getElementById('cartTotal').textContent.replace(/[^0-9]/g, '');
    const total = parseFloat(totalText) || 0;
    const pay = parseFloat(document.getElementById('modalPayAmount').value) || 0;

    if (pay < total) return alert('Nominal uang pembayaran kurang!');

    const txId = 'TRX-' + Date.now().toString().slice(-6);
    const now = new Date();
    const newTransaction = {
        id: txId,
        date: now.toISOString().split('T')[0],
        day: now.toLocaleDateString('id-ID', { weekday: 'long' }),
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        hour: now.getHours(),
        cashier: currentUser ? currentUser.name : 'Admin',
        items: [...cart],
        totalAmount: total,
        paidAmount: pay,
        changeAmount: pay - total
    };

    transactions.push(newTransaction);
    localStorage.setItem('pos_transactions', JSON.stringify(transactions));
    
    closePaymentModal();
    printReceipt(newTransaction);

    cart = [];
    renderCart();
}

// Receipt Generator & Printer with Cashier Name
function printReceipt(trx) {
    const receiptWindow = window.open('', '_blank', 'width=400,height=600');
    receiptWindow.document.write(`
        <html>
        <head>
            <title>Struk Pembayaran - ${trx.id}</title>
            <style>
                body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; color: #000; }
                .center { text-align: center; }
                .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 3px 0; }
                .right { text-align: right; }
            </style>
        </head>
        <body>
            <div class="center">
                <h3>SMART POS STORE</h3>
                <p>Ciamis, West Java</p>
                <p>${trx.date} | ${trx.time}</p>
            </div>
            <div class="line"></div>
            <p>ID Transaksi: ${trx.id}</p>
            <p>Kasir: <strong>${trx.cashier}</strong></p>
            <div class="line"></div>
            <table>
                ${trx.items.map(i => `
                    <tr>
                        <td colspan="2"><strong>${i.name}</strong></td>
                    </tr>
                    <tr>
                        <td>${i.qty}x @ Rp ${(i.price - (i.price * i.discount/100)).toLocaleString('id-ID')}</td>
                        <td class="right">Rp ${((i.price - (i.price * i.discount/100)) * i.qty).toLocaleString('id-ID')}</td>
                    </tr>
                `).join('')}
            </table>
            <div class="line"></div>
            <table>
                <tr><td><strong>TOTAL:</strong></td><td class="right"><strong>Rp ${trx.totalAmount.toLocaleString('id-ID')}</strong></td></tr>
                <tr><td>Tunai:</td><td class="right">Rp ${trx.paidAmount.toLocaleString('id-ID')}</td></tr>
                <tr><td>Kembalian:</td><td class="right">Rp ${trx.changeAmount.toLocaleString('id-ID')}</td></tr>
            </table>
            <div class="line"></div>
            <div class="center">
                <p>Terima Kasih Atas Kunjungan Anda!</p>
                <p>*** LAYANAN SIAP MELAYANI ***</p>
            </div>
            <script>
                window.onload = function() { window.print(); window.close(); }
            </script>
        </body>
        </html>
    `);
    receiptWindow.document.close();
}


// ---------------- TAB 2: PRODUK LOGIC ----------------
function renderProductTable() {
    const tbody = document.getElementById('productTableBody');
    if(!tbody) return;
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


// ---------------- TAB 3: ADMIN & KARYAWAN SHIFT MANAGEMENT ----------------
function renderUserTable() {
    const tbody = document.getElementById('userTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${u.name}</strong></td>
            <td>${u.username}</td>
            <td>${u.position}</td>
            <td><span class="badge badge-${u.role.toLowerCase()}">${u.role}</span></td>
            <td><span class="badge bg-info">${u.shift || 'Pagi'}</span></td>
            <td><span class="badge ${u.status === 'On Duty' ? 'bg-success' : 'bg-secondary'}">${u.status || 'Off'}</span></td>
            <td>
                <button class="btn-icon" onclick="editUser(${u.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-icon text-danger" onclick="deleteUser(${u.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function saveUser(e) {
    e.preventDefault();
    const id = document.getElementById('userId').value;
    const name = document.getElementById('userName').value;
    const username = document.getElementById('userUsername').value;
    const password = document.getElementById('userPassword').value;
    const position = document.getElementById('userPosition').value;
    const role = document.getElementById('userRole').value;
    const shift = document.getElementById('userShift')?.value || 'Pagi';
    const status = document.getElementById('userStatus')?.value || 'On Duty';

    if (id) {
        const idx = users.findIndex(u => u.id == id);
        users[idx] = { ...users[idx], id: parseInt(id), name, username, password, position, role, shift, status };
    } else {
        users.push({ id: Date.now(), name, username, password, position, role, shift, status, tabs: ['kasir', 'karyawan'] });
    }

    localStorage.setItem('pos_users', JSON.stringify(users));
    resetUserForm();
    renderUserTable();
    renderKaryawanList();
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
    if(document.getElementById('userShift')) document.getElementById('userShift').value = u.shift || 'Pagi';
    if(document.getElementById('userStatus')) document.getElementById('userStatus').value = u.status || 'On Duty';
}

function resetUserForm() {
    document.getElementById('userForm')?.reset();
    if(document.getElementById('userId')) document.getElementById('userId').value = '';
}


// ---------------- TAB 4: AKUNTING (SEARCH, TRX ID, & DOWNLOAD) ----------------
function renderAccountingData() {
    const searchDate = document.getElementById('accSearchDate')?.value || '';
    let totalSales = 0;
    let totalQty = 0;
    const accountingTableBody = document.getElementById('accountingTableBody');
    if(!accountingTableBody) return;
    accountingTableBody.innerHTML = '';

    const filteredTransactions = transactions.filter(t => {
        if (!searchDate) return true;
        return t.date === searchDate;
    });

    filteredTransactions.forEach(t => {
        totalSales += t.totalAmount;
        t.items.forEach(i => totalQty += i.qty);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><code>${t.id}</code></td>
            <td>${t.date} (${t.day || '-'})</td>
            <td>${t.time || (t.hour + ':00')}</td>
            <td><strong>${t.cashier}</strong></td>
            <td>${t.items.length} Jenis Produk (${t.items.reduce((acc, curr)=>acc+curr.qty, 0)} Pcs)</td>
            <td class="text-primary"><strong>Rp ${t.totalAmount.toLocaleString('id-ID')}</strong></td>
            <td>
                <button class="btn btn-sm btn-info" onclick="viewTransactionDetail('${t.id}')">Detail</button>
            </td>
        `;
        accountingTableBody.appendChild(tr);
    });

    const totalTxCount = filteredTransactions.length;
    const basketSize = totalTxCount > 0 ? Math.round(totalSales / totalTxCount) : 0;

    if(document.getElementById('accTotalSales')) document.getElementById('accTotalSales').textContent = `Rp ${totalSales.toLocaleString('id-ID')}`;
    if(document.getElementById('accTotalQty')) document.getElementById('accTotalQty').textContent = `${totalQty} Pcs`;
    if(document.getElementById('accBasketSize')) document.getElementById('accBasketSize').textContent = `Rp ${basketSize.toLocaleString('id-ID')}`;
    if(document.getElementById('accTotalTx')) document.getElementById('accTotalTx').textContent = `${totalTxCount} Transaksi`;
}

function viewTransactionDetail(txId) {
    const trx = transactions.find(t => t.id === txId);
    if (!trx) return;
    alert(`Rincian Transaksi [${trx.id}]:\nTanggal: ${trx.date} - ${trx.time}\nKasir: ${trx.cashier}\n\nItem Belanja:\n` + 
          trx.items.map(i => `- ${i.name} (${i.qty}x @ Rp ${i.price})`).join('\n') + 
          `\n\nTotal: Rp ${trx.totalAmount.toLocaleString('id-ID')}`);
}

function downloadAccountingCSV() {
    if (transactions.length === 0) return alert('Belum ada data transaksi untuk diunduh.');
    let csvContent = "data:text/csv;charset=utf-8,ID Transaksi,Tanggal,Hari,Jam,Kasir,Total Belanja\n";
    transactions.forEach(t => {
        csvContent += `"${t.id}","${t.date}","${t.day || ''}","${t.time || ''}","${t.cashier}",${t.totalAmount}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Akunting_SmartPOS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// ---------------- TAB 5: KARYAWAN ONDUTY / SHIFT STATUS ----------------
function renderKaryawanList() {
    const container = document.getElementById('karyawanTableBody');
    if(!container) return;
    container.innerHTML = '';

    users.forEach(u => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${u.name}</strong></td>
            <td>${u.position}</td>
            <td><span class="badge bg-info">${u.shift || 'Pagi'}</span></td>
            <td>
                <select class="form-control form-control-sm" onchange="updateUserStatus(${u.id}, this.value)">
                    <option value="On Duty" ${u.status === 'On Duty' ? 'selected' : ''}>On Duty (Masuk)</option>
                    <option value="Off" ${u.status === 'Off' ? 'selected' : ''}>Off (Libur)</option>
                </select>
            </td>
        `;
        container.appendChild(tr);
    });
}

function updateUserStatus(userId, newStatus) {
    const usr = users.find(u => u.id === userId);
    if (usr) {
        usr.status = newStatus;
        localStorage.setItem('pos_users', JSON.stringify(users));
        renderUserTable();
    }
}
