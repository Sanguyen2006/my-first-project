'use strict';

const ADMIN_API = '../../backend/api/';
const A$ = selector => document.querySelector(selector);
let dbProducts = [];

const fmtAdmin = value => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
}).format(Number(value) || 0);

function escAdmin(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function mapProduct(row) {
    return {
        id: String(row.ma_san_pham || ''),
        name: String(row.ten_san_pham || ''),
        category: String(row.danh_muc || 'Khác'),
        price: Number(row.gia_ban || 0),
        sale: row.gia_khuyen_mai == null || row.gia_khuyen_mai === ''
            ? null : Number(row.gia_khuyen_mai),
        stock: Number(row.so_luong_ton || 0),
        image: String(row.hinh_anh || ''),
        description: String(row.mo_ta || '')
    };
}

async function apiRequest(file, options = {}) {
    const response = await fetch(ADMIN_API + file, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(options.headers || {})
        }
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error('Server không trả JSON hợp lệ. Hãy kiểm tra lỗi PHP.');
    }

    if (!response.ok || data.thanh_cong !== true) {
        throw new Error(data.thong_bao || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return data;
}

async function fetchProducts() {
    const data = await apiRequest('get_products.php');
    return data.san_pham.map(mapProduct);
}

async function migrateLegacyProducts() {
    // Nhập các sản phẩm mới còn sót trong localStorage vào MySQL một lần.
    // Những mã đã có trong MySQL sẽ được bỏ qua.
    const legacyText = localStorage.getItem('may_store_admin_products');
    if (!legacyText) return false;

    let legacy;
    try {
        legacy = JSON.parse(legacyText);
    } catch {
        return false;
    }
    if (!Array.isArray(legacy)) return false;

    const knownSkus = new Set(dbProducts.map(p => p.id.toUpperCase()));
    const missing = legacy.filter(product => {
        const sku = String(product.id || product.ma_san_pham || '').trim().toUpperCase();
        return sku && !knownSkus.has(sku);
    });

    if (!missing.length) return false;

    let imported = 0;
    const failures = [];

    for (const product of missing) {
        const sku = String(product.id || product.ma_san_pham || '').trim().toUpperCase();
        try {
            await apiRequest('add_product.php', {
                method: 'POST',
                body: JSON.stringify({
                    ma_san_pham: sku,
                    ten_san_pham: product.name || product.ten_san_pham || '',
                    danh_muc: product.category || product.danh_muc || 'Khác',
                    gia_ban: Number(product.price ?? product.gia_ban ?? 0),
                    so_luong_ton: Number(product.stock ?? product.so_luong_ton ?? 0),
                    hinh_anh: product.image || product.hinh_anh || '',
                    mo_ta: product.description || product.mo_ta || ''
                })
            });
            knownSkus.add(sku);
            imported++;
        } catch (error) {
            failures.push(`${sku}: ${error.message}`);
        }
    }

    if (imported) {
        alert(`Đã chuyển ${imported} sản phẩm cũ từ trình duyệt vào MySQL.`);
        return true;
    }

    if (failures.length) {
        console.warn('Không thể chuyển dữ liệu cũ:', failures);
        const message = A$('#product-form-message');
        if (message) {
            message.textContent =
                'Không chuyển được sản phẩm cũ từ trình duyệt. Hãy đăng nhập lại tài khoản quản trị rồi thử thêm sản phẩm. ' +
                failures[0];
        }
    }
    return false;
}

function populateCategoryFilter() {
    const select = A$('#admin-category-filter');
    if (!select) return;

    const previous = select.value;
    select.querySelectorAll('option:not(:first-child)').forEach(option => option.remove());

    [...new Set(dbProducts.map(product => product.category))].sort().forEach(value => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
    });

    select.value = [...select.options].some(option => option.value === previous)
        ? previous : '';
}

function renderProductRows() {
    const rows = A$('#admin-product-rows');
    if (!rows) return;

    const query = (A$('#admin-product-search')?.value || '').toLocaleLowerCase('vi').trim();
    const category = A$('#admin-category-filter')?.value || '';

    const products = dbProducts.filter(product => {
        const searchable = `${product.id} ${product.name}`.toLocaleLowerCase('vi');
        return (!query || searchable.includes(query)) &&
            (!category || product.category === category);
    });

    rows.innerHTML = products.map(product => `
        <tr>
            <td class="sku">${escAdmin(product.id)}</td>
            <td class="table-product">${escAdmin(product.name)}</td>
            <td>${escAdmin(product.category)}</td>
            <td>${fmtAdmin(product.sale ?? product.price)}</td>
            <td>${product.stock}</td>
            <td>
                <span class="status-pill ${product.stock < 10 ? 'low' : ''}">
                    ${product.stock === 0 ? 'Hết hàng' :
                      product.stock < 10 ? 'Sắp hết hàng' : 'Còn hàng'}
                </span>
            </td>
            <td>
                <button type="button" class="admin-secondary" data-edit="${escAdmin(product.id)}">Sửa</button>
                <button type="button" class="admin-secondary" data-delete="${escAdmin(product.id)}">Xóa</button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7">Không tìm thấy sản phẩm.</td></tr>';

    const count = A$('#product-count');
    if (count) count.textContent = `${products.length} sản phẩm`;

    rows.querySelectorAll('[data-edit]').forEach(button => {
        button.addEventListener('click', () => openEditForm(button.dataset.edit));
    });

    rows.querySelectorAll('[data-delete]').forEach(button => {
        button.addEventListener('click', () => deleteProduct(button.dataset.delete));
    });
}

function updateDashboardProductCount() {
    const total = String(dbProducts.length);

    // Ưu tiên ID rõ ràng nếu giao diện dashboard có khai báo.
    const explicitCounter = A$('#dashboard-product-count') ||
        A$('#total-products-count') || A$('#total-products');
    if (explicitCounter) {
        explicitCounter.textContent = total;
        return;
    }

    // Dashboard cũ đang ghi cứng số 20. Tìm thẻ ghi "TỔNG SẢN PHẨM",
    // sau đó cập nhật số duy nhất trong cùng thẻ thống kê mà không cần sửa HTML.
    const normalize = value => String(value || '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleUpperCase('vi');

    const allElements = [...document.querySelectorAll('body *')];
    const label = allElements.find(element =>
        normalize(element.textContent).replace(/[：:]/g, '') === 'TỔNG SẢN PHẨM'
    );
    if (!label) return;

    let container = label.parentElement;
    for (let depth = 0; container && depth < 7; depth += 1, container = container.parentElement) {
        const numberNodes = [...container.querySelectorAll('*')].filter(element =>
            element.children.length === 0 && /^\d+$/.test(element.textContent.trim())
        );
        if (numberNodes.length === 1) {
            numberNodes[0].textContent = total;
            return;
        }
    }
}

function renderDashboardProducts() {
    const table = A$('#dashboard-products');
    if (!table) return;

    table.innerHTML = dbProducts.slice(0, 6).map(product => `
        <tr>
            <td class="sku">${escAdmin(product.id)}</td>
            <td class="table-product">${escAdmin(product.name)}</td>
            <td>${fmtAdmin(product.sale ?? product.price)}</td>
            <td>${product.stock}</td>
            <td><span class="status-pill ${product.stock < 10 ? 'low' : ''}">
                ${product.stock < 10 ? 'Sắp hết hàng' : 'Còn hàng'}
            </span></td>
        </tr>
    `).join('');
}

function renderInventory() {
    const container = A$('#admin-generic-content');
    if (!container || location.pathname.split('/').pop() !== 'inventory.html') return;

    container.innerHTML = `
        <div class="table-wrap">
            <table>
                <thead><tr><th>MÃ SP</th><th>SẢN PHẨM</th><th>TỒN KHO</th><th>CẢNH BÁO</th></tr></thead>
                <tbody>${dbProducts.map(product => `
                    <tr>
                        <td>${escAdmin(product.id)}</td>
                        <td class="table-product">${escAdmin(product.name)}</td>
                        <td>${product.stock}</td>
                        <td><span class="status-pill ${product.stock < 10 ? 'low' : ''}">
                            ${product.stock === 0 ? 'Hết hàng' :
                              product.stock < 10 ? 'Sắp hết hàng' : 'Đủ hàng'}
                        </span></td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

async function loadAdminProducts() {
    try {
        dbProducts = await fetchProducts();

        // Chuyển sản phẩm SP021 cũ đang chỉ lưu ở trình duyệt vào database.
        if (location.pathname.endsWith('/products.html')) {
            const imported = await migrateLegacyProducts();
            if (imported) dbProducts = await fetchProducts();
        }

        populateCategoryFilter();
        updateDashboardProductCount();
        renderProductRows();
        renderDashboardProducts();
        renderInventory();
    } catch (error) {
        console.error(error);

        const rows = A$('#admin-product-rows');
        if (rows) {
            rows.innerHTML = `<tr><td colspan="7">${escAdmin(error.message)}</td></tr>`;
        }

        const generic = A$('#admin-generic-content');
        if (generic && location.pathname.endsWith('/inventory.html')) {
            generic.innerHTML = `<p class="generic-empty">${escAdmin(error.message)}</p>`;
        }
    }
}

function openNewForm() {
    const form = A$('#product-form');
    if (!form) return;

    form.reset();
    delete form.dataset.editId;
    form.classList.remove('hidden');
    form.querySelector('[name="ma_san_pham"]').readOnly = false;

    const title = A$('#product-form-title');
    if (title) title.textContent = 'Thêm sản phẩm mới';

    const message = A$('#product-form-message');
    if (message) message.textContent = '';
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openEditForm(sku) {
    const product = dbProducts.find(item => item.id === sku);
    const form = A$('#product-form');
    if (!product || !form) return;

    form.classList.remove('hidden');
    form.dataset.editId = product.id;

    const skuInput = form.querySelector('[name="ma_san_pham"]');
    skuInput.value = product.id;
    skuInput.readOnly = true;

    form.querySelector('[name="ten_san_pham"]').value = product.name;
    const categoryInput = form.querySelector('[name="danh_muc"]');

    if (![...categoryInput.options].some(option => option.value === product.category)) {
        const option = document.createElement('option');
        option.value = product.category;
        option.textContent = product.category;
        categoryInput.appendChild(option);
    }
    categoryInput.value = product.category;

    form.querySelector('[name="gia_ban"]').value = product.price;
    form.querySelector('[name="so_luong_ton"]').value = product.stock;
    form.querySelector('[name="hinh_anh"]').value = product.image || '';
    form.querySelector('[name="mo_ta"]').value = product.description || '';

    const title = A$('#product-form-title');
    if (title) title.textContent = 'Cập nhật sản phẩm';

    const message = A$('#product-form-message');
    if (message) message.textContent = '';

    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteProduct(sku) {
    if (!confirm(`Bạn chắc chắn muốn xóa sản phẩm ${sku} khỏi database?`)) return;

    try {
        const data = await apiRequest('delete_product.php', {
            method: 'POST',
            body: JSON.stringify({ ma_san_pham: sku })
        });

        await loadAdminProducts();
        alert(data.thong_bao || 'Đã xóa sản phẩm.');
    } catch (error) {
        alert('Không xóa được sản phẩm: ' + error.message);
    }
}

function setupProductForm() {
    const form = A$('#product-form');
    if (!form) return;

    A$('#open-product-form')?.addEventListener('click', openNewForm);

    A$('#cancel-product-form')?.addEventListener('click', () => {
        form.classList.add('hidden');
        form.reset();
        delete form.dataset.editId;
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const fields = Object.fromEntries(new FormData(form));
        const payload = {
            ma_san_pham: String(fields.ma_san_pham || '').trim().toUpperCase(),
            ten_san_pham: String(fields.ten_san_pham || '').trim(),
            danh_muc: String(fields.danh_muc || 'Khác').trim(),
            gia_ban: Number(fields.gia_ban),
            so_luong_ton: Number(fields.so_luong_ton),
            hinh_anh: String(fields.hinh_anh || '').trim(),
            mo_ta: String(fields.mo_ta || '').trim()
        };

        const message = A$('#product-form-message');
        const submitButton = form.querySelector('.admin-primary');

        if (!payload.ma_san_pham || !payload.ten_san_pham ||
            !Number.isFinite(payload.gia_ban) || payload.gia_ban < 0 ||
            !Number.isInteger(payload.so_luong_ton) || payload.so_luong_ton < 0) {
            if (message) message.textContent = 'Vui lòng kiểm tra tên, mã, giá bán và số lượng tồn.';
            return;
        }

        const editing = Boolean(form.dataset.editId);
        const endpoint = editing ? 'update_product.php' : 'add_product.php';

        if (!editing && dbProducts.some(product => product.id.toUpperCase() === payload.ma_san_pham)) {
            if (message) message.textContent = 'Mã sản phẩm đã tồn tại.';
            return;
        }

        if (submitButton) submitButton.disabled = true;
        if (message) message.textContent = 'Đang lưu vào MySQL...';

        try {
            const data = await apiRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            form.classList.add('hidden');
            form.reset();
            delete form.dataset.editId;

            await loadAdminProducts();
            if (message) message.textContent = data.thong_bao || 'Đã lưu sản phẩm.';
            alert(data.thong_bao || 'Đã lưu sản phẩm vào MySQL.');
        } catch (error) {
            console.error(error);
            if (message) message.textContent = error.message;

            if (error.message.includes('đăng nhập') || error.message.includes('403')) {
                alert('Backend chưa nhận phiên đăng nhập quản trị. Đăng nhập lại; nếu vẫn lỗi thì cần nối trang login với API PHP.');
            } else {
                alert('Không lưu được sản phẩm: ' + error.message);
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}

function renderGenericDemoPages() {
    const generic = A$('#admin-generic-content');
    if (!generic) return;

    const path = location.pathname.split('/').pop();
    let html = '';

    if (path === 'customers.html') {
        const customers = [
            ['Nguyễn Minh Anh', 'minhanh01@example.com', '0901000001'],
            ['Trần Gia Bảo', 'giabao02@example.com', '0901000002'],
            ['Lê Hoàng Yến', 'hoangyen03@example.com', '0901000003'],
            ['Phạm Quốc Huy', 'quochuy04@example.com', '0901000004'],
            ['Võ Ngọc Linh', 'ngoclinh05@example.com', '0901000005'],
            ['Đặng Tuấn Kiệt', 'tuankiet06@example.com', '0901000006'],
            ['Bùi Khánh Vy', 'khanhvy07@example.com', '0901000007'],
            ['Đỗ Đức Thành', 'ducthanh08@example.com', '0901000008'],
            ['Hoàng Mai Chi', 'maichi09@example.com', '0901000009'],
            ['Phan Nhật Nam', 'nhatnam10@example.com', '0901000010']
        ];
        html = `<div class="table-wrap"><table><thead><tr><th>MÃ KH</th><th>HỌ TÊN</th><th>EMAIL</th><th>SỐ ĐIỆN THOẠI</th><th>TRẠNG THÁI</th></tr></thead><tbody>${
            customers.map((customer, index) => `<tr><td>KH${String(index + 1).padStart(3, '0')}</td><td class="table-product">${escAdmin(customer[0])}</td><td>${escAdmin(customer[1])}</td><td>${escAdmin(customer[2])}</td><td><span class="status-pill">Hoạt động</span></td></tr>`).join('')
        }</tbody></table></div>`;
    } else if (path === 'orders.html') {
        html = '<div class="generic-empty">Chưa có đơn hàng trong dữ liệu mẫu. Đơn hàng chỉ xuất hiện khi chức năng đơn hàng được kết nối database.</div>';
    } else if (path === 'promotions.html') {
        html = '<div class="generic-cards"><article class="generic-card"><b>WELCOME10</b><p>Giảm 10% cho đơn hàng đầu tiên.</p><span>Demo</span></article><article class="generic-card"><b>MAY50000</b><p>Giảm 50.000 ₫ cho đơn từ 500.000 ₫.</p><span>Demo</span></article><article class="generic-card"><b>TECHWEEK</b><p>Ưu đãi phụ kiện theo mùa.</p><span>Demo</span></article></div>';
    } else if (path === 'categories.html') {
        html = '<div class="generic-cards"><article class="generic-card"><b>Điện thoại</b><p>Thiết bị di động và điện thoại thông minh.</p></article><article class="generic-card"><b>Phụ kiện</b><p>Phụ kiện sử dụng hằng ngày.</p></article><article class="generic-card"><b>Âm thanh</b><p>Tai nghe, loa và thiết bị thu âm.</p></article><article class="generic-card"><b>Phụ kiện máy tính</b><p>Thiết bị cho máy tính và góc làm việc.</p></article></div>';
    }

    generic.innerHTML = html;

    A$('#generic-search-btn')?.addEventListener('click', () => {
        const query = (A$('#admin-generic-search')?.value || '').toLocaleLowerCase('vi');
        generic.querySelectorAll('tr, .generic-card').forEach(element => {
            element.style.display = !query ||
                element.textContent.toLocaleLowerCase('vi').includes(query) ? '' : 'none';
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    A$('#admin-logout')?.addEventListener('click', async () => {
        try {
            await fetch(ADMIN_API + 'logout.php', {
                method: 'POST',
                credentials: 'same-origin'
            });
        } catch (error) {
            console.warn('Không thể kết thúc phiên PHP:', error);
        }
        localStorage.removeItem('may_store_user');
        location.href = '../login.html';
    });

    A$('#admin-product-search')?.addEventListener('input', renderProductRows);
    A$('#admin-category-filter')?.addEventListener('change', renderProductRows);

    setupProductForm();
    renderGenericDemoPages();
    loadAdminProducts();
});
