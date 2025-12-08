// 使用相对路径 - Workers 同时提供前端和 API
const API_BASE = '';  // 空字符串表示相对路径

// ==================== 主要功能 ====================

// 加载分类
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/api/categories`);
        const data = await response.json();

        if (data.success) {
            renderCategories(data.data);
        }
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

// 加载站点
async function loadSites(categoryId = 'all', searchTerm = '') {
    try {
        let url = `${API_BASE}/api/sites`;
        const params = new URLSearchParams();

        if (categoryId && categoryId !== 'all') {
            params.append('category', categoryId);
        }

        if (searchTerm) {
            params.append('search', searchTerm);
        }

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            renderSites(data.data);
        }
    } catch (error) {
        console.error('加载站点失败:', error);
    }
}

// 渲染分类
function renderCategories(categories) {
    const container = document.getElementById('categoryTabs');
    container.innerHTML = '';

    // 添加"全部"标签
    const allTab = createCategoryTab('all', '全部', '#ff9a56', true);
    container.appendChild(allTab);

    // 添加其他分类
    categories.forEach(category => {
        const tab = createCategoryTab(category.id, category.name, category.color, false, category.icon);
        container.appendChild(tab);
    });
}

// 创建分类标签
function createCategoryTab(id, name, color, active = false, icon = '') {
    const tab = document.createElement('button');
    tab.className = 'category-tab' + (active ? ' active' : '');
    tab.dataset.category = id;
    tab.style.setProperty('--category-color', color);

    if (icon) {
        tab.innerHTML = `<span class="category-icon">${icon}</span>${name}`;
    } else {
        tab.textContent = name;
    }

    tab.addEventListener('click', () => {
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadSites(id, document.getElementById('searchInput').value);
    });

    return tab;
}

// 渲染站点
function renderSites(sites) {
    const container = document.getElementById('sitesGrid');
    container.innerHTML = '';

    if (sites.length === 0) {
        container.innerHTML = '<div class="no-results">暂无站点</div>';
        return;
    }

    sites.forEach(site => {
        const card = createSiteCard(site);

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const categoryId = document.querySelector('.category-tab.active')?.dataset.category || 'all';
                loadSites(categoryId, e.target.value);
            }, 300);
        });
    }

// 初始化
document.addEventListener('DOMContentLoaded', () => {
        loadCategories();
        loadSites();
        setupSearch();
    });
