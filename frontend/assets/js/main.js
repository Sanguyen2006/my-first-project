'use strict';

let PRODUCTS = [];
let category = 'Tất cả';
let showAll = false;

const money = n => new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
}).format(Number(n) || 0);

const $ = selector => document.querySelector(selector);

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function cartRead() {
    try {
        return JSON.parse(localStorage.getItem('may_store_cart') || '{}') || {};
    } catch {
        return {};
    }
}

function cartCount() {
    const element = $('#cart-count');
    if (element) {
        element.textContent = Object.values(cartRead())
            .reduce((total, quantity) => total + Number(quantity || 0), 0);
    }
}

function notify(message) {
    const element = $('#toast');
    if (!element) return;

    element.textContent = message;
    element.classList.add('show');
    clearTimeout(window.toastTimer);
    window.toastTimer = setTimeout(() => element.classList.remove('show'), 2500);
}

function safeImageUrl(value) {
    const url = String(value || '').trim();
    if (/^(https?:\/\/|\/|\.{0,2}\/|assets\/)/i.test(url)) return url;
    return '';
}

function syncCategoryTabs() {
    const tabs = $('#category-tabs');
    if (!tabs) return;

    const oldCategories = [...tabs.querySelectorAll('[data-category]')]
        .map(button => button.dataset.category)
        .filter(value => value && value !== 'Tất cả');

    const dbCategories = PRODUCTS.map(product => product.category)
        .filter(Boolean);

    const categories = [...new Set([...oldCategories, ...dbCategories])];
    if (!categories.includes(category)) category = 'Tất cả';

    tabs.innerHTML = [
        `<button type="button" data-category="Tất cả" class="${category === 'Tất cả' ? 'active' : ''}">Tất cả sản phẩm <small>${PRODUCTS.length}</small></button>`,
        ...categories.map(value =>
            `<button type="button" data-category="${escapeHtml(value)}" class="${category === value ? 'active' : ''}">${escapeHtml(value)}</button>`
        )
    ].join('');
}

function updateProductCounts() {
    const allTab = $('#category-tabs [data-category="Tất cả"] small');
    if (allTab) allTab.textContent = String(PRODUCTS.length);

    const stats = document.querySelector('.stats > div:first-child b');
    if (stats) stats.textContent = `${PRODUCTS.length}+`;
}

function render() {
    const grid = $('#product-grid');
    if (!grid) return;

    const query = (
        new URLSearchParams(location.search).get('q') ||
        $('#search-input')?.value ||
        ''
    ).toLocaleLowerCase('vi').trim();

    const list = PRODUCTS.filter(product => {
        const matchesCategory =
            category === 'Tất cả' || product.category === category;
        const searchable = `${product.name} ${product.id} ${product.category}`
            .toLocaleLowerCase('vi');

        return matchesCategory && (!query || searchable.includes(query));
    });

    const shown = showAll ? list : list.slice(0, 8);

    if (!shown.length) {
        grid.innerHTML =
            '<div class="empty-state">Không tìm thấy sản phẩm phù hợp. Hãy thử từ khóa khác.</div>';
        return;
    }

    grid.innerHTML = shown.map(product => {
        const imageUrl = safeImageUrl(product.image);
        const visual = imageUrl
            ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" style="width:100%;height:100%;object-fit:contain">`
            : `<div class="product-symbol ${escapeHtml(product.type)}">${escapeHtml(product.symbol || '▣')}</div>`;

        return `
            <article class="product-card">
                <div class="product-image">
                    <span class="product-badge ${product.stock === 0 ? 'out' : ''}">
                        ${product.stock === 0 ? 'HẾT HÀNG' : product.sale != null ? 'GIÁ TỐT' : 'MAY CHOICE'}
                    </span>
                    ${visual}
                </div>
                <div class="product-info">
                    <p class="product-category">${escapeHtml(product.category)}</p>
                    <h3 class="product-name">${escapeHtml(product.name)}</h3>
                    <div class="price-row">
                        <span class="price">${money(product.sale ?? product.price)}</span>
                        ${product.sale != null
                            ? `<span class="old-price">${money(product.price)}</span>`
                            : ''}
                    </div>
                    <div class="product-bottom">
                        <span class="stock ${product.stock < 10 ? 'low' : ''}">
                            ${product.stock === 0
                                ? 'Tạm hết hàng'
                                : product.stock < 10
                                    ? 'Sắp hết hàng'
                                    : `Còn ${product.stock} sản phẩm`}
                        </span>
                        <button class="add" type="button" data-add="${escapeHtml(product.id)}"
                            aria-label="Thêm vào giỏ" ${product.stock === 0 ? 'disabled' : ''}>+</button>
                    </div>
                </div>
            </article>`;
    }).join('');

    grid.querySelectorAll('[data-add]').forEach(button => {
        button.addEventListener('click', () => {
            const product = PRODUCTS.find(item => item.id === button.dataset.add);
            if (!product) return;

            const cart = cartRead();
            const current = Number(cart[product.id] || 0);
            if (current >= product.stock) {
                notify('Số lượng trong giỏ đã đạt tồn kho.');
                return;
            }

            cart[product.id] = current + 1;
            localStorage.setItem('may_store_cart', JSON.stringify(cart));
            cartCount();
            notify(`Đã thêm “${product.name}” vào giỏ hàng.`);
        });
    });
}

async function loadProducts() {
    const grid = $('#product-grid');
    if (grid) {
        grid.innerHTML = '<div class="empty-state">Đang tải sản phẩm...</div>';
    }

    try {
        const response = await fetch('../backend/api/get_products.php', {
            cache: 'no-store',
            credentials: 'same-origin'
        });

        const data = await response.json();

        if (!response.ok || data.thanh_cong !== true ||
            !Array.isArray(data.san_pham)) {
            throw new Error(data.thong_bao || 'Không tải được danh sách sản phẩm.');
        }

        PRODUCTS = data.san_pham.map(row => {
            const categoryName = String(row.danh_muc || 'Khác');
            return {
                id: String(row.ma_san_pham),
                name: String(row.ten_san_pham || ''),
                category: categoryName,
                price: Number(row.gia_ban || 0),
                sale: row.gia_khuyen_mai == null || row.gia_khuyen_mai === ''
                    ? null
                    : Number(row.gia_khuyen_mai),
                stock: Number(row.so_luong_ton || 0),
                description: String(row.mo_ta || ''),
                image: String(row.hinh_anh || ''),
                symbol: '▣',
                type: categoryName === 'Điện thoại' ? 'phone'
                    : categoryName === 'Âm thanh' ? 'audio'
                    : categoryName === 'Phụ kiện máy tính' ? 'keyboard'
                    : ''
            };
        });

        syncCategoryTabs();
        updateProductCounts();
        render();
    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        if (grid) {
            grid.innerHTML =
                '<div class="empty-state">Không tải được sản phẩm. Hãy kiểm tra Apache, MySQL và backend.</div>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cartCount();
    loadProducts();

    $('#category-tabs')?.addEventListener('click', event => {
        const button = event.target.closest('[data-category]');
        if (!button) return;

        category = button.dataset.category;
        showAll = false;

        $('#category-tabs').querySelectorAll('[data-category]').forEach(item => {
            item.classList.toggle('active', item === button);
        });

        const showAllButton = $('#show-all');
        if (showAllButton) {
            showAllButton.textContent = 'HIỂN THỊ TẤT CẢ SẢN PHẨM　↓';
        }

        render();
    });

    $('#show-all')?.addEventListener('click', () => {
        showAll = !showAll;
        $('#show-all').textContent = showAll
            ? 'THU GỌN DANH SÁCH　↑'
            : 'HIỂN THỊ TẤT CẢ SẢN PHẨM　↓';
        render();
    });

    $('#search-form')?.addEventListener('submit', event => {
        event.preventDefault();

        const query = $('#search-input').value.trim();
        const url = new URL(location.href);

        if (query) url.searchParams.set('q', query);
        else url.searchParams.delete('q');

        history.replaceState({}, '', url);
        category = 'Tất cả';
        showAll = true;

        $('#category-tabs')?.querySelectorAll('[data-category]').forEach(button => {
            button.classList.toggle('active', button.dataset.category === 'Tất cả');
        });

        const showAllButton = $('#show-all');
        if (showAllButton) {
            showAllButton.textContent = 'THU GỌN DANH SÁCH　↑';
        }

        render();
        $('#products')?.scrollIntoView({ behavior: 'smooth' });
    });

    $('#newsletter')?.addEventListener('submit', event => {
        event.preventDefault();
        notify('Cảm ơn bạn đã đăng ký nhận tin từ May Store.');
        event.target.reset();
    });
});
