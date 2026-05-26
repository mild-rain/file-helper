// 数据存储
const STORAGE_KEYS = {
    NOTES: 'lifehelper_notes',
    TRANSACTIONS: 'lifehelper_transactions',
    HABITS: 'lifehelper_habits',
    LEARNING_PLANS: 'lifehelper_learning_plans',
    ANNIVERSARIES: 'lifehelper_anniversaries',
    CATEGORIES: 'lifehelper_categories'
};

// 图标列表
const ICONS = [
    'fa-book', 'fa-coffee', 'fa-dumbbell', 'fa-code', 'fa-music', 'fa-film',
    'fa-gamepad', 'fa-heart', 'fa-utensils', 'fa-shopping-bag', 'fa-plane', 'fa-home',
    'fa-briefcase', 'fa-graduation-cap', 'fa-paint-brush', 'fa-camera', 'fa-heartbeat',
    'fa-paw', 'fa-tree', 'fa-moon', 'fa-sun', 'fa-star', 'fa-lightbulb'
];

// 颜色列表
const COLORS = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#ffa751',
    '#a8edea', '#fed6e3', '#ff9a9e', '#fecfef', '#ffecd2', '#fcb69f'
];

// 状态管理
let state = {
    notes: [],
    transactions: [],
    habits: [],
    learningPlans: [],
    anniversaries: [],
    categories: {
        expense: ['餐饮', '交通', '购物', '娱乐', '医疗', '其他'],
        income: ['工资', '奖金', '投资', '兼职', '其他']
    },
    currentPage: 'home',
    selectedNoteId: null,
    selectedIcon: 'fa-book',
    selectedColor: '#667eea',
    transactionType: 'expense',
    selectedCategory: '餐饮',
    categoryTab: 'expense',
    editingCategory: null,
    currentMonth: new Date(),
    filterTag: null,
    searchQuery: '',
    currentNoteImages: [],
    currentNoteTags: []
};

// 工具函数
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
    
    return date.toLocaleDateString('zh-CN');
}

// 数据持久化
function saveData() {
    try {
        localStorage.setItem(STORAGE_KEYS.NOTES, JSON.stringify(state.notes));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(state.transactions));
        localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(state.habits));
        localStorage.setItem(STORAGE_KEYS.LEARNING_PLANS, JSON.stringify(state.learningPlans));
        localStorage.setItem(STORAGE_KEYS.ANNIVERSARIES, JSON.stringify(state.anniversaries));
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
    } catch (e) {
        console.error('保存数据失败:', e);
    }
}

function loadData() {
    try {
        const savedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
        if (savedNotes) state.notes = JSON.parse(savedNotes);
        
        const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        if (savedTransactions) state.transactions = JSON.parse(savedTransactions);
        
        const savedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
        if (savedHabits) state.habits = JSON.parse(savedHabits);
        
        const savedLearning = localStorage.getItem(STORAGE_KEYS.LEARNING_PLANS);
        if (savedLearning) state.learningPlans = JSON.parse(savedLearning);
        
        const savedAnniversaries = localStorage.getItem(STORAGE_KEYS.ANNIVERSARIES);
        if (savedAnniversaries) state.anniversaries = JSON.parse(savedAnniversaries);
        
        const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        if (savedCategories) state.categories = JSON.parse(savedCategories);
    } catch (e) {
        console.error('加载数据失败:', e);
    }
}

// 日期显示
function updateDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const el = document.getElementById('dateDisplay');
    if (el) {
        el.textContent = now.toLocaleDateString('zh-CN', options);
    }
}

// 页面导航
function showPage(pageName, addToHistory = true) {
    console.log('切换页面到:', pageName);
    state.currentPage = pageName;
    
    // 添加到历史记录
    if (addToHistory) {
        history.pushState({ page: pageName }, '', '#' + pageName);
    }
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 显示当前页面
    const pageEl = document.getElementById(pageName + 'Page');
    if (pageEl) {
        pageEl.classList.add('active');
    }
    
    // 更新底部导航
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === pageName) {
            item.classList.add('active');
        }
    });
    
    // 渲染页面内容
    switch(pageName) {
        case 'home':
            renderHome();
            break;
        case 'notes':
            renderNotes();
            break;
        case 'finance':
            renderFinance();
            break;
        case 'habits':
            renderHabits();
            break;
        case 'learning':
            renderLearning();
            break;
        case 'anniversaries':
            renderAnniversaries();
            break;
    }
}

// 处理浏览器返回键
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.page) {
        showPage(event.state.page, false);
    } else {
        showPage('home', false);
    }
});

// 首页
function renderHome() {
    // 今日习惯打卡数
    const today = new Date().toISOString().split('T')[0];
    const habitsCompleted = state.habits.filter(habit => 
        habit.completedDates && habit.completedDates.includes(today)
    ).length;
    
    const habitsEl = document.getElementById('habitsCompleted');
    if (habitsEl) habitsEl.textContent = habitsCompleted;
    
    // 笔记数
    const notesCountEl = document.getElementById('notesCount');
    if (notesCountEl) notesCountEl.textContent = state.notes.length;
    
    // 即将到来的纪念日
    const upcoming = getUpcomingAnniversaries();
    const upcomingEl = document.getElementById('upcomingAnniversaries');
    if (upcomingEl) upcomingEl.textContent = upcoming;
}

function getUpcomingAnniversaries() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let count = 0;
    
    state.anniversaries.forEach(anniversary => {
        const annivDate = new Date(anniversary.date);
        let thisYearDate = new Date(today.getFullYear(), annivDate.getMonth(), annivDate.getDate());
        
        if (thisYearDate < today) {
            thisYearDate.setFullYear(today.getFullYear() + 1);
        }
        
        const diffDays = Math.ceil((thisYearDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 7 && diffDays >= 0) {
            count++;
        }
    });
    
    return count;
}

// 笔记功能
function renderNotes() {
    const container = document.getElementById('notesList');
    const emptyState = document.getElementById('notesEmpty');
    
    if (!container) return;
    
    let filteredNotes = state.notes;
    
    // 搜索过滤
    if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        filteredNotes = filteredNotes.filter(note => 
            note.title.toLowerCase().includes(query) || 
            note.content.toLowerCase().includes(query) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query)))
        );
    }
    
    // 标签过滤
    if (state.filterTag) {
        filteredNotes = filteredNotes.filter(note => note.tags && note.tags.includes(state.filterTag));
    }
    
    // 按更新时间排序
    filteredNotes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    
    if (filteredNotes.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
    } else {
        if (emptyState) emptyState.style.display = 'none';
        container.innerHTML = filteredNotes.map(note => `
            <div class="note-card" onclick="openNoteDetail('${note.id}')">
                <div class="note-header">
                    <div class="note-title">${escapeHtml(note.title)}</div>
                    <div class="note-actions" onclick="event.stopPropagation()">
                        <button class="note-action-btn" onclick="editNote('${note.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="note-action-btn delete" onclick="deleteNote('${note.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${note.images && note.images.length > 0 ? `
                    <div style="display: flex; gap: 8px; margin-bottom: 12px; overflow-x: auto;">
                        ${note.images.slice(0, 3).map(img => `
                            <img src="${img}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                        `).join('')}
                    </div>
                ` : ''}
                <div class="note-content">${escapeHtml(note.content.substring(0, 150))}${note.content.length > 150 ? '...' : ''}</div>
                ${note.tags && note.tags.length > 0 ? `
                    <div class="note-tags">
                        ${note.tags.map(tag => `<span class="note-tag">${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="note-date">${formatDate(note.updatedAt)}</div>
            </div>
        `).join('');
    }
    
    renderTagsFilter();
}

function renderTagsFilter() {
    const container = document.getElementById('tagsFilter');
    if (!container) return;
    
    const allTags = [...new Set(state.notes.flatMap(note => note.tags || []))];
    
    container.innerHTML = `
        <button class="tag-btn ${!state.filterTag ? 'active' : ''}" onclick="filterByTag(null)">
            全部
        </button>
        ${allTags.map(tag => `
            <button class="tag-btn ${state.filterTag === tag ? 'active' : ''}" onclick="filterByTag('${escapeHtml(tag)}')">
                ${escapeHtml(tag)}
            </button>
        `).join('')}
    `;
}

function filterByTag(tag) {
    state.filterTag = tag;
    renderNotes();
}

function searchNotes() {
    const searchEl = document.getElementById('noteSearch');
    state.searchQuery = searchEl ? searchEl.value : '';
    renderNotes();
}

function openNoteDetail(noteId) {
    console.log('打开笔记详情:', noteId);
    if (noteId) {
        const note = state.notes.find(n => n.id === noteId);
        if (note) {
            state.selectedNoteId = noteId;
            const titleEl = document.getElementById('noteDetailTitle');
            const contentEl = document.getElementById('noteDetailContent');
            if (titleEl) titleEl.value = note.title;
            if (contentEl) contentEl.value = note.content;
            state.currentNoteImages = note.images ? [...note.images] : [];
            state.currentNoteTags = note.tags ? [...note.tags] : [];
        }
    } else {
        state.selectedNoteId = null;
        const titleEl = document.getElementById('noteDetailTitle');
        const contentEl = document.getElementById('noteDetailContent');
        if (titleEl) titleEl.value = '';
        if (contentEl) contentEl.value = '';
        state.currentNoteImages = [];
        state.currentNoteTags = [];
    }
    
    renderNoteImages();
    renderNoteTagsEditor();
    showPage('noteDetail');
}

function closeNoteDetail() {
    showPage('notes');
}

function saveNoteDetail() {
    const titleEl = document.getElementById('noteDetailTitle');
    const contentEl = document.getElementById('noteDetailContent');
    const title = titleEl ? titleEl.value.trim() : '';
    const content = contentEl ? contentEl.value.trim() : '';
    
    if (!title) {
        alert('请输入笔记标题');
        return;
    }
    
    const now = new Date().toISOString();
    
    if (state.selectedNoteId) {
        const noteIndex = state.notes.findIndex(n => n.id === state.selectedNoteId);
        if (noteIndex !== -1) {
            state.notes[noteIndex] = {
                ...state.notes[noteIndex],
                title,
                content,
                tags: state.currentNoteTags,
                images: state.currentNoteImages,
                updatedAt: now
            };
        }
    } else {
        state.notes.push({
            id: generateId(),
            title,
            content,
            tags: state.currentNoteTags,
            images: state.currentNoteImages,
            createdAt: now,
            updatedAt: now
        });
    }
    
    saveData();
    closeNoteDetail();
}

function renderNoteImages() {
    const container = document.getElementById('noteImages');
    if (!container) return;
    
    container.innerHTML = state.currentNoteImages.map((img, index) => `
        <div class="note-image-item">
            <img src="${img}">
            <button class="note-image-remove" onclick="removeNoteImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function insertImage() {
    const inputEl = document.getElementById('imageInput');
    if (inputEl) inputEl.click();
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            state.currentNoteImages.push(e.target.result);
            renderNoteImages();
        };
        reader.readAsDataURL(file);
    }
    event.target.value = '';
}

function removeNoteImage(index) {
    state.currentNoteImages.splice(index, 1);
    renderNoteImages();
}

function addTagToNote() {
    const tag = prompt('请输入标签：');
    if (tag && tag.trim()) {
        const trimmedTag = tag.trim();
        if (!state.currentNoteTags.includes(trimmedTag)) {
            state.currentNoteTags.push(trimmedTag);
            renderNoteTagsEditor();
        }
    }
}

function renderNoteTagsEditor() {
    const container = document.getElementById('noteTagsEditor');
    if (!container) return;
    
    container.innerHTML = state.currentNoteTags.map((tag, index) => `
        <span class="note-tag-item">
            ${escapeHtml(tag)}
            <button class="note-tag-remove" onclick="removeNoteTag(${index})">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

function removeNoteTag(index) {
    state.currentNoteTags.splice(index, 1);
    renderNoteTagsEditor();
}

function formatText(format) {
    const textarea = document.getElementById('noteDetailContent');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let newText = '';
    if (format === 'bold') {
        newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end);
    } else if (format === 'italic') {
        newText = text.substring(0, start) + '*' + selectedText + '*' + text.substring(end);
    }
    
    textarea.value = newText;
    textarea.focus();
}

function editNote(noteId) {
    openNoteDetail(noteId);
}

function deleteNote(noteId) {
    if (confirm('确定要删除这条笔记吗？')) {
        state.notes = state.notes.filter(n => n.id !== noteId);
        saveData();
        renderNotes();
        renderHome();
    }
}

// 财务管理
function renderFinance() {
    const container = document.getElementById('transactionsList');
    const emptyState = document.getElementById('transactionsEmpty');
    
    // 计算收支
    let totalIncome = 0;
    let totalExpense = 0;
    
    state.transactions.forEach(t => {
        if (t.type === 'income') {
            totalIncome += t.amount;
        } else {
            totalExpense += t.amount;
        }
    });
    
    const incomeEl = document.getElementById('totalIncome');
    const expenseEl = document.getElementById('totalExpense');
    const balanceEl = document.getElementById('totalBalance');
    
    if (incomeEl) incomeEl.textContent = `¥${totalIncome.toFixed(2)}`;
    if (expenseEl) expenseEl.textContent = `¥${totalExpense.toFixed(2)}`;
    if (balanceEl) balanceEl.textContent = `¥${(totalIncome - totalExpense).toFixed(2)}`;
    
    // 渲染交易记录
    const sortedTransactions = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (container) {
        if (sortedTransactions.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            container.innerHTML = sortedTransactions.map(t => `
                <div class="transaction-item">
                    <div class="transaction-icon ${t.type}">
                        <i class="fas ${t.type === 'income' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div class="transaction-info">
                        <div class="transaction-category">${escapeHtml(t.category)}</div>
                        <div class="transaction-description">${escapeHtml(t.description || '')}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}¥${t.amount.toFixed(2)}
                    </div>
                    <div class="transaction-actions">
                        <button class="transaction-edit" onclick="editTransaction('${t.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="transaction-delete" onclick="deleteTransaction('${t.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

function initCategorySelector() {
    updateCategorySelector();
}

function updateCategorySelector() {
    const container = document.getElementById('categorySelector');
    if (!container) return;
    
    const categories = state.categories[state.transactionType] || [];
    
    container.innerHTML = categories.map(cat => `
        <div class="category-option ${state.selectedCategory === cat ? 'selected' : ''}" onclick="selectCategory('${escapeHtml(cat)}')">
            <i class="fas fa-tag"></i>
            <span>${escapeHtml(cat)}</span>
        </div>
    `).join('');
}

function selectCategory(category) {
    state.selectedCategory = category;
    updateCategorySelector();
}

function openTransactionModal(transactionId = null) {
    const modal = document.getElementById('transactionModal');
    if (!modal) return;
    
    state.editingTransactionId = transactionId;
    
    const amountEl = document.getElementById('transactionAmount');
    const dateEl = document.getElementById('transactionDate');
    const descEl = document.getElementById('transactionDescription');
    const titleEl = document.getElementById('transactionModalTitle');
    
    if (transactionId) {
        // 编辑模式
        const transaction = state.transactions.find(t => t.id === transactionId);
        if (transaction) {
            if (amountEl) amountEl.value = transaction.amount;
            if (dateEl) dateEl.value = transaction.date;
            if (descEl) descEl.value = transaction.description || '';
            if (titleEl) titleEl.textContent = '编辑记录';
            state.transactionType = transaction.type;
            state.selectedCategory = transaction.category;
        }
    } else {
        // 新建模式
        if (amountEl) amountEl.value = '';
        if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
        if (descEl) descEl.value = '';
        if (titleEl) titleEl.textContent = '记一笔';
        state.transactionType = 'expense';
        state.selectedCategory = (state.categories.expense && state.categories.expense[0]) || '其他';
    }
    
    updateTypeToggle();
    updateCategorySelector();
    
    modal.classList.add('active');
}

function editTransaction(id) {
    openTransactionModal(id);
}

function closeTransactionModal() {
    const modal = document.getElementById('transactionModal');
    if (modal) modal.classList.remove('active');
    state.editingTransactionId = null;
}

function setTransactionType(type) {
    state.transactionType = type;
    state.selectedCategory = (state.categories[type] && state.categories[type][0]) || '其他';
    updateTypeToggle();
    updateCategorySelector();
}

function updateTypeToggle() {
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === state.transactionType) {
            btn.classList.add('active');
        }
    });
}

function saveTransaction() {
    const amountEl = document.getElementById('transactionAmount');
    const dateEl = document.getElementById('transactionDate');
    const descEl = document.getElementById('transactionDescription');
    
    const amount = amountEl ? parseFloat(amountEl.value) : 0;
    const date = dateEl ? dateEl.value : '';
    const description = descEl ? descEl.value.trim() : '';
    
    if (!amount || amount <= 0) {
        alert('请输入有效金额');
        return;
    }
    
    if (!date) {
        alert('请选择日期');
        return;
    }
    
    if (state.editingTransactionId) {
        // 编辑模式
        const index = state.transactions.findIndex(t => t.id === state.editingTransactionId);
        if (index !== -1) {
            state.transactions[index] = {
                ...state.transactions[index],
                type: state.transactionType,
                amount,
                category: state.selectedCategory,
                description,
                date
            };
        }
    } else {
        // 新建模式
        state.transactions.push({
            id: generateId(),
            type: state.transactionType,
            amount,
            category: state.selectedCategory,
            description,
            date
        });
    }
    
    saveData();
    closeTransactionModal();
    renderFinance();
}

function deleteTransaction(id) {
    if (confirm('确定要删除这条记录吗？')) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveData();
        renderFinance();
    }
}

// 分类管理
function openCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (!modal) return;
    
    state.categoryTab = 'expense';
    updateCategoryTab();
    renderCategoryList();
    modal.classList.add('active');
}

function closeCategoryModal() {
    const modal = document.getElementById('categoryModal');
    if (modal) modal.classList.remove('active');
}

function switchCategoryTab(type) {
    state.categoryTab = type;
    updateCategoryTab();
    renderCategoryList();
}

function updateCategoryTab() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.type === state.categoryTab) {
            btn.classList.add('active');
        }
    });
}

function renderCategoryList() {
    const container = document.getElementById('categoryList');
    if (!container) return;
    
    const categories = state.categories[state.categoryTab] || [];
    
    container.innerHTML = categories.map((cat, index) => `
        <div class="category-item">
            <div class="category-item-left">
                <div class="category-item-icon" style="background: #667eea;">
                    <i class="fas fa-tag"></i>
                </div>
                <div class="category-item-name">${escapeHtml(cat)}</div>
            </div>
            <div class="category-item-actions">
                <button class="category-item-edit" onclick="editCategory(${index})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="category-item-delete" onclick="deleteCategory(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('categoryModalTitle');
    const nameEl = document.getElementById('categoryName');
    
    if (titleEl) titleEl.textContent = '添加分类';
    if (nameEl) nameEl.value = '';
    
    state.editingCategory = null;
    modal.classList.add('active');
}

function closeAddCategoryModal() {
    const modal = document.getElementById('addCategoryModal');
    if (modal) modal.classList.remove('active');
}

function editCategory(index) {
    const modal = document.getElementById('addCategoryModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('categoryModalTitle');
    const nameEl = document.getElementById('categoryName');
    
    if (titleEl) titleEl.textContent = '编辑分类';
    if (nameEl) nameEl.value = state.categories[state.categoryTab][index];
    
    state.editingCategory = index;
    modal.classList.add('active');
}

function saveCategory() {
    const nameEl = document.getElementById('categoryName');
    const name = nameEl ? nameEl.value.trim() : '';
    
    if (!name) {
        alert('请输入分类名称');
        return;
    }
    
    if (state.editingCategory !== null) {
        state.categories[state.categoryTab][state.editingCategory] = name;
    } else {
        if (!state.categories[state.categoryTab]) {
            state.categories[state.categoryTab] = [];
        }
        state.categories[state.categoryTab].push(name);
    }
    
    saveData();
    closeAddCategoryModal();
    renderCategoryList();
    updateCategorySelector();
}

function deleteCategory(index) {
    if (confirm('确定要删除这个分类吗？')) {
        state.categories[state.categoryTab].splice(index, 1);
        saveData();
        renderCategoryList();
        updateCategorySelector();
    }
}

// 习惯追踪
function renderHabits() {
    const container = document.getElementById('habitsList');
    const emptyState = document.getElementById('habitsEmpty');
    
    renderCalendar();
    
    if (container) {
        if (state.habits.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            container.innerHTML = state.habits.map(habit => {
                const today = getLocalDateString(new Date());
                const isCompleted = habit.completedDates && habit.completedDates.includes(today);
                const streak = calculateStreak(habit);
                
                return `
                    <div class="habit-card">
                        <div class="habit-header">
                            <div class="habit-info">
                                <div class="habit-icon" style="background: ${habit.color || '#667eea'};">
                                    <i class="fas ${habit.icon || 'fa-book'}"></i>
                                </div>
                                <div>
                                    <div class="habit-name">${escapeHtml(habit.name)}</div>
                                    <div class="habit-streak">
                                        <i class="fas fa-fire"></i>
                                        <span>连续 ${streak} 天</span>
                                    </div>
                                </div>
                            </div>
                            <div class="habit-actions">
                                <button class="habit-action-btn" onclick="editHabit('${habit.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="habit-action-btn delete" onclick="deleteHabit('${habit.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <button class="habit-check-btn ${isCompleted ? 'completed' : ''}" onclick="toggleHabit('${habit.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                `;
            }).join('');
        }
    }
}

function renderCalendar() {
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    
    const year = state.currentMonth.getFullYear();
    const month = state.currentMonth.getMonth();
    
    const monthEl = document.getElementById('calendarMonth');
    if (monthEl) monthEl.textContent = `${year}年 ${monthNames[month]}`;
    
    // 计算月初是星期几（确保使用本地时间）
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // 计算当月的最后一天
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // 获取今天的日期字符串
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    // 生成星期标题
    let html = dayNames.map(day => `<div class="calendar-day header">${day}</div>`).join('');
    
    // 填充月初的空白天数
    for (let i = 0; i < firstDayOfWeek; i++) {
        html += '<div class="calendar-day empty"></div>';
    }
    
    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const date = getLocalDateString(dateObj);
        const isToday = date === todayStr;
        
        // 检查该日期是否有习惯完成
        const hasCompleted = state.habits.some(habit => 
            habit.completedDates && habit.completedDates.includes(date)
        );
        
        let classes = 'calendar-day';
        if (isToday) classes += ' today';
        if (hasCompleted) classes += ' completed';
        
        html += `<div class="${classes}">${day}</div>`;
    }
    
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) calendarEl.innerHTML = html;
}

function changeMonth(delta) {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + delta);
    renderHabits();
}

function calculateStreak(habit) {
    if (!habit.completedDates || habit.completedDates.length === 0) return 0;
    
    const sortedDates = [...habit.completedDates].sort().reverse();
    let streak = 0;
    let checkDate = new Date();
    
    for (let i = 0; i < sortedDates.length; i++) {
        const dateStr = getLocalDateString(checkDate);
        if (sortedDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
            checkDate.setDate(checkDate.getDate() - 1);
            i--;
        } else {
            break;
        }
    }
    
    return streak;
}

function initIconSelectors() {
    // 初始化所有图标选择器
    document.querySelectorAll('.icon-selector').forEach(container => {
        container.innerHTML = ICONS.map(icon => `
            <div class="icon-option" data-icon="${icon}" onclick="selectIcon('${icon}')">
                <i class="fas ${icon}"></i>
            </div>
        `).join('');
    });
}

function initColorSelectors() {
    // 初始化所有颜色选择器
    document.querySelectorAll('.color-selector').forEach(container => {
        container.innerHTML = COLORS.map(color => `
            <div class="color-option" data-color="${color}" style="background: ${color};" onclick="selectColor('${color}')"></div>
        `).join('');
    });
}

function openHabitModal() {
    const modal = document.getElementById('habitModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('habitModalTitle');
    const nameEl = document.getElementById('habitName');
    const idEl = document.getElementById('habitId');
    
    if (titleEl) titleEl.textContent = '新建习惯';
    if (nameEl) nameEl.value = '';
    if (idEl) idEl.value = '';
    
    state.selectedIcon = 'fa-book';
    state.selectedColor = '#667eea';
    
    updateIconSelector();
    updateColorSelector();
    modal.classList.add('active');
}

function editHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const modal = document.getElementById('habitModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('habitModalTitle');
    const nameEl = document.getElementById('habitName');
    const idEl = document.getElementById('habitId');
    
    if (titleEl) titleEl.textContent = '编辑习惯';
    if (nameEl) nameEl.value = habit.name;
    if (idEl) idEl.value = habitId;
    
    state.selectedIcon = habit.icon || 'fa-book';
    state.selectedColor = habit.color || '#667eea';
    
    updateIconSelector();
    updateColorSelector();
    modal.classList.add('active');
}

function closeHabitModal() {
    const modal = document.getElementById('habitModal');
    if (modal) modal.classList.remove('active');
}

function selectIcon(icon) {
    state.selectedIcon = icon;
    updateIconSelector();
}

function selectColor(color) {
    state.selectedColor = color;
    updateColorSelector();
}

function updateIconSelector() {
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.icon === state.selectedIcon) {
            btn.classList.add('selected');
        }
    });
}

function updateColorSelector() {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.color === state.selectedColor) {
            btn.classList.add('selected');
        }
    });
}

function saveHabit() {
    const nameEl = document.getElementById('habitName');
    const idEl = document.getElementById('habitId');
    
    const name = nameEl ? nameEl.value.trim() : '';
    const habitId = idEl ? idEl.value : '';
    
    if (!name) {
        alert('请输入习惯名称');
        return;
    }
    
    if (habitId) {
        const habitIndex = state.habits.findIndex(h => h.id === habitId);
        if (habitIndex !== -1) {
            state.habits[habitIndex] = {
                ...state.habits[habitIndex],
                name,
                icon: state.selectedIcon,
                color: state.selectedColor
            };
        }
    } else {
        state.habits.push({
            id: generateId(),
            name,
            icon: state.selectedIcon,
            color: state.selectedColor,
            completedDates: [],
            createdAt: new Date().toISOString()
        });
    }
    
    saveData();
    closeHabitModal();
    renderHabits();
    renderHome();
}

function toggleHabit(habitId) {
    const habit = state.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const today = getLocalDateString(new Date());
    if (!habit.completedDates) habit.completedDates = [];
    
    const index = habit.completedDates.indexOf(today);
    if (index === -1) {
        habit.completedDates.push(today);
    } else {
        habit.completedDates.splice(index, 1);
    }
    
    saveData();
    renderHabits();
    renderHome();
}

function deleteHabit(id) {
    if (confirm('确定要删除这个习惯吗？')) {
        state.habits = state.habits.filter(h => h.id !== id);
        saveData();
        renderHabits();
        renderHome();
    }
}

// 学习助手
function renderLearning() {
    const container = document.getElementById('learningList');
    const emptyState = document.getElementById('learningEmpty');
    
    if (container) {
        if (state.learningPlans.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            container.innerHTML = state.learningPlans.map(plan => {
                const progress = plan.targetHours > 0 ? (plan.completedHours / plan.targetHours) * 100 : 0;
                
                return `
                    <div class="learning-card">
                        <div class="learning-header">
                            <div>
                                <div class="learning-title">${escapeHtml(plan.title)}</div>
                                <div class="learning-description">${escapeHtml(plan.description || '')}</div>
                            </div>
                            <div class="learning-actions">
                                <button class="learning-action-btn delete" onclick="deleteLearning('${plan.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="learning-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <div class="progress-text">
                                <span>已完成 ${plan.completedHours} 小时</span>
                                <span>目标 ${plan.targetHours} 小时</span>
                            </div>
                        </div>
                        <button class="learning-add-btn" onclick="openSessionModal('${plan.id}')">
                            <i class="fas fa-plus"></i>
                            <span>记录学习</span>
                        </button>
                        ${plan.sessions && plan.sessions.length > 0 ? `
                            <div class="learning-sessions">
                                ${plan.sessions.slice(-5).reverse().map(session => `
                                    <div class="session-item">
                                        <div class="session-date">${formatDate(session.date)}</div>
                                        <div class="session-duration">学习了 ${session.duration} 分钟</div>
                                        ${session.notes ? `<div class="session-notes">${escapeHtml(session.notes)}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
    }
}

function openLearningModal() {
    const modal = document.getElementById('learningModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('learningTitle');
    const descEl = document.getElementById('learningDescription');
    const targetEl = document.getElementById('learningTargetHours');
    const startEl = document.getElementById('learningStartDate');
    const endEl = document.getElementById('learningEndDate');
    
    if (titleEl) titleEl.value = '';
    if (descEl) descEl.value = '';
    if (targetEl) targetEl.value = '';
    if (startEl) startEl.value = new Date().toISOString().split('T')[0];
    if (endEl) endEl.value = '';
    
    modal.classList.add('active');
}

function closeLearningModal() {
    const modal = document.getElementById('learningModal');
    if (modal) modal.classList.remove('active');
}

function saveLearning() {
    const titleEl = document.getElementById('learningTitle');
    const descEl = document.getElementById('learningDescription');
    const targetEl = document.getElementById('learningTargetHours');
    const startEl = document.getElementById('learningStartDate');
    const endEl = document.getElementById('learningEndDate');
    
    const title = titleEl ? titleEl.value.trim() : '';
    const description = descEl ? descEl.value.trim() : '';
    const targetHours = targetEl ? parseFloat(targetEl.value) : 0;
    const startDate = startEl ? startEl.value : '';
    const endDate = endEl ? endEl.value : '';
    
    if (!title) {
        alert('请输入学习计划标题');
        return;
    }
    
    if (!targetHours || targetHours <= 0) {
        alert('请输入有效目标时长');
        return;
    }
    
    state.learningPlans.push({
        id: generateId(),
        title,
        description,
        targetHours,
        completedHours: 0,
        startDate,
        endDate,
        sessions: []
    });
    
    saveData();
    closeLearningModal();
    renderLearning();
}

function openSessionModal(planId) {
    state.selectedLearningId = planId;
    const modal = document.getElementById('sessionModal');
    if (!modal) return;
    
    const durationEl = document.getElementById('sessionDuration');
    const notesEl = document.getElementById('sessionNotes');
    
    if (durationEl) durationEl.value = '';
    if (notesEl) notesEl.value = '';
    
    modal.classList.add('active');
}

function closeSessionModal() {
    const modal = document.getElementById('sessionModal');
    if (modal) modal.classList.remove('active');
}

function saveSession() {
    const durationEl = document.getElementById('sessionDuration');
    const notesEl = document.getElementById('sessionNotes');
    
    const duration = durationEl ? parseInt(durationEl.value) : 0;
    const notes = notesEl ? notesEl.value.trim() : '';
    
    if (!duration || duration <= 0) {
        alert('请输入有效学习时长');
        return;
    }
    
    const plan = state.learningPlans.find(p => p.id === state.selectedLearningId);
    if (plan) {
        const session = {
            id: generateId(),
            date: new Date().toISOString(),
            duration,
            notes
        };
        
        if (!plan.sessions) plan.sessions = [];
        plan.sessions.push(session);
        plan.completedHours += duration / 60;
        
        saveData();
        closeSessionModal();
        renderLearning();
    }
}

function deleteLearning(id) {
    if (confirm('确定要删除这个学习计划吗？')) {
        state.learningPlans = state.learningPlans.filter(p => p.id !== id);
        saveData();
        renderLearning();
    }
}

// 纪念日
function renderAnniversaries() {
    const container = document.getElementById('anniversariesList');
    const emptyState = document.getElementById('anniversariesEmpty');
    
    if (container) {
        if (state.anniversaries.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            
            const sorted = [...state.anniversaries].sort((a, b) => {
                return getDaysUntil(a) - getDaysUntil(b);
            });
            
            container.innerHTML = sorted.map(anniversary => {
                const daysUntil = getDaysUntil(anniversary);
                const annivDate = new Date(anniversary.date);
                const thisYear = new Date().getFullYear();
                const age = thisYear - annivDate.getFullYear();
                
                let countdownText = '';
                if (daysUntil === 0) {
                    countdownText = '就是今天！🎉';
                } else if (daysUntil > 0) {
                    countdownText = `还有 ${daysUntil} 天`;
                } else {
                    countdownText = `已过去 ${Math.abs(daysUntil)} 天`;
                }
                
                return `
                    <div class="anniversary-card">
                        <div class="anniversary-header">
                            <div>
                                <span class="anniversary-type ${anniversary.type}">${getTypeName(anniversary.type)}</span>
                                <div class="anniversary-title">${escapeHtml(anniversary.title)}</div>
                            </div>
                            <div class="anniversary-actions">
                                <button class="anniversary-action-btn" onclick="editAnniversary('${anniversary.id}')">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="anniversary-action-btn delete" onclick="deleteAnniversary('${anniversary.id}')">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        <div class="anniversary-countdown">
                            <div class="countdown-number">${daysUntil === 0 ? '🎂' : Math.abs(daysUntil)}</div>
                            <div class="countdown-text">${countdownText}</div>
                        </div>
                        <div class="anniversary-date">
                            ${annivDate.getFullYear()}年${annivDate.getMonth() + 1}月${annivDate.getDate()}日
                            ${age > 0 ? ` · ${age}周年` : ''}
                        </div>
                        ${anniversary.note ? `<div class="anniversary-note">${escapeHtml(anniversary.note)}</div>` : ''}
                    </div>
                `;
            }).join('');
        }
    }
}

function getDaysUntil(anniversary) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const annivDate = new Date(anniversary.date);
    let thisYearDate = new Date(today.getFullYear(), annivDate.getMonth(), annivDate.getDate());
    
    if (thisYearDate < today) {
        thisYearDate.setFullYear(today.getFullYear() + 1);
    }
    
    return Math.ceil((thisYearDate - today) / (1000 * 60 * 60 * 24));
}

function getTypeName(type) {
    const types = {
        'birthday': '生日',
        'anniversary': '纪念日',
        'other': '其他'
    };
    return types[type] || '其他';
}

function openAnniversaryModal() {
    const modal = document.getElementById('anniversaryModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('anniversaryModalTitle');
    const nameEl = document.getElementById('anniversaryTitle');
    const dateEl = document.getElementById('anniversaryDate');
    const typeEl = document.getElementById('anniversaryType');
    const remindEl = document.getElementById('anniversaryRemindDays');
    const noteEl = document.getElementById('anniversaryNote');
    const idEl = document.getElementById('anniversaryId');
    
    if (titleEl) titleEl.textContent = '新建纪念日';
    if (nameEl) nameEl.value = '';
    if (dateEl) dateEl.value = '';
    if (typeEl) typeEl.value = 'birthday';
    if (remindEl) remindEl.value = '3';
    if (noteEl) noteEl.value = '';
    if (idEl) idEl.value = '';
    
    modal.classList.add('active');
}

function editAnniversary(anniversaryId) {
    const anniversary = state.anniversaries.find(a => a.id === anniversaryId);
    if (!anniversary) return;
    
    const modal = document.getElementById('anniversaryModal');
    if (!modal) return;
    
    const titleEl = document.getElementById('anniversaryModalTitle');
    const nameEl = document.getElementById('anniversaryTitle');
    const dateEl = document.getElementById('anniversaryDate');
    const typeEl = document.getElementById('anniversaryType');
    const remindEl = document.getElementById('anniversaryRemindDays');
    const noteEl = document.getElementById('anniversaryNote');
    const idEl = document.getElementById('anniversaryId');
    
    if (titleEl) titleEl.textContent = '编辑纪念日';
    if (nameEl) nameEl.value = anniversary.title;
    if (dateEl) dateEl.value = anniversary.date;
    if (typeEl) typeEl.value = anniversary.type;
    if (remindEl) remindEl.value = anniversary.remindDays;
    if (noteEl) noteEl.value = anniversary.note;
    if (idEl) idEl.value = anniversaryId;
    
    modal.classList.add('active');
}

function closeAnniversaryModal() {
    const modal = document.getElementById('anniversaryModal');
    if (modal) modal.classList.remove('active');
}

function saveAnniversary() {
    const titleEl = document.getElementById('anniversaryTitle');
    const dateEl = document.getElementById('anniversaryDate');
    const typeEl = document.getElementById('anniversaryType');
    const remindEl = document.getElementById('anniversaryRemindDays');
    const noteEl = document.getElementById('anniversaryNote');
    const idEl = document.getElementById('anniversaryId');
    
    const title = titleEl ? titleEl.value.trim() : '';
    const date = dateEl ? dateEl.value : '';
    const type = typeEl ? typeEl.value : 'birthday';
    const remindDays = remindEl ? parseInt(remindEl.value) || 3 : 3;
    const note = noteEl ? noteEl.value.trim() : '';
    const anniversaryId = idEl ? idEl.value : '';
    
    if (!title) {
        alert('请输入纪念日名称');
        return;
    }
    
    if (!date) {
        alert('请选择日期');
        return;
    }
    
    if (anniversaryId) {
        const anniversaryIndex = state.anniversaries.findIndex(a => a.id === anniversaryId);
        if (anniversaryIndex !== -1) {
            state.anniversaries[anniversaryIndex] = {
                ...state.anniversaries[anniversaryIndex],
                title,
                date,
                type,
                remindDays,
                note
            };
        }
    } else {
        state.anniversaries.push({
            id: generateId(),
            title,
            date,
            type,
            remindDays,
            note
        });
    }
    
    saveData();
    closeAnniversaryModal();
    renderAnniversaries();
    renderHome();
}

function deleteAnniversary(id) {
    if (confirm('确定要删除这个纪念日吗？')) {
        state.anniversaries = state.anniversaries.filter(a => a.id !== id);
        saveData();
        renderAnniversaries();
        renderHome();
    }
}

// 初始化应用
function init() {
    console.log('应用初始化...');
    loadData();
    updateDateDisplay();
    
    // 初始化历史记录
    history.replaceState({ page: 'home' }, '', '#home');
    
    // 延迟初始化选择器，确保DOM已加载
    setTimeout(() => {
        initIconSelectors();
        initColorSelectors();
        initCategorySelector();
        renderHome();
    }, 100);
    
    setInterval(updateDateDisplay, 60000);
    
    console.log('应用初始化完成');
}

// 确保DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// 让所有函数在全局可用，以便HTML中的onclick可以调用
window.showPage = showPage;
window.renderNotes = renderNotes;
window.searchNotes = searchNotes;
window.filterByTag = filterByTag;
window.openNoteDetail = openNoteDetail;
window.closeNoteDetail = closeNoteDetail;
window.saveNoteDetail = saveNoteDetail;
window.insertImage = insertImage;
window.handleImageUpload = handleImageUpload;
window.removeNoteImage = removeNoteImage;
window.addTagToNote = addTagToNote;
window.removeNoteTag = removeNoteTag;
window.formatText = formatText;
window.editNote = editNote;
window.deleteNote = deleteNote;

window.renderFinance = renderFinance;
window.openTransactionModal = openTransactionModal;
window.closeTransactionModal = closeTransactionModal;
window.setTransactionType = setTransactionType;
window.selectCategory = selectCategory;
window.saveTransaction = saveTransaction;
window.deleteTransaction = deleteTransaction;
window.editTransaction = editTransaction;

window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.switchCategoryTab = switchCategoryTab;
window.openAddCategoryModal = openAddCategoryModal;
window.closeAddCategoryModal = closeAddCategoryModal;
window.editCategory = editCategory;
window.saveCategory = saveCategory;
window.deleteCategory = deleteCategory;

window.renderHabits = renderHabits;
window.changeMonth = changeMonth;
window.openHabitModal = openHabitModal;
window.editHabit = editHabit;
window.closeHabitModal = closeHabitModal;
window.selectIcon = selectIcon;
window.selectColor = selectColor;
window.saveHabit = saveHabit;
window.toggleHabit = toggleHabit;
window.deleteHabit = deleteHabit;

window.renderLearning = renderLearning;
window.openLearningModal = openLearningModal;
window.closeLearningModal = closeLearningModal;
window.saveLearning = saveLearning;
window.openSessionModal = openSessionModal;
window.closeSessionModal = closeSessionModal;
window.saveSession = saveSession;
window.deleteLearning = deleteLearning;

window.renderAnniversaries = renderAnniversaries;
window.openAnniversaryModal = openAnniversaryModal;
window.editAnniversary = editAnniversary;
window.closeAnniversaryModal = closeAnniversaryModal;
window.saveAnniversary = saveAnniversary;
window.deleteAnniversary = deleteAnniversary;

console.log('app.js 加载完成');
