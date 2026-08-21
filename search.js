// Filter States
let allNovels = [];
let selectedStatus = 'all';
let selectedGenres = new Set(); 
let currentPage = 1; 
const itemsPerPage = 10; // တစ်မျက်နှာလျှင် ပြမည့် Novel အရေအတွက်

document.addEventListener('DOMContentLoaded', () => {
    window.toggleGenreFilter = toggleGenreFilter;
    window.clearAllGenres = clearAllGenres;
    window.setStatusFilter = setStatusFilter;
    window.filterNovels = filterNovels;
    window.changePage = changePage; // Window ထဲသို့ changePage ဖန်ရှင် ချိတ်ပေးခြင်း

    fetchAllNovels();
});

// ==========================================
// 1. FETCH NOVELS FROM GITHUB JSON
// ==========================================
async function fetchAllNovels() {
    const grid = document.getElementById('search-results-grid');

    try {
        const response = await fetch('content/novels.json?' + new Date().getTime());
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allNovels = data;
        } else if (data && typeof data === 'object') {
            allNovels = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        } else {
            allNovels = [];
        }

        filterNovels();
    } catch (error) {
        console.error("Fetch novels error:", error);
        if (grid) {
            grid.innerHTML = '<p style="color:var(--text-muted); font-size:12px; grid-column: 1 / -1; text-align: center; padding: 30px;">Novel များကို ဆွဲယူရာတွင် အမှားအယွင်း ရှိပါသည်။</p>';
        }
        renderPagination(0); // Error တက်ရင်တောင် Pagination ကို အနည်းဆုံး Page 1 နဲ့ ပြရန်
    }
}

// ==========================================
// 2. MULTIPLE GENRE FILTER TOGGLE FUNCTION
// ==========================================
function toggleGenreFilter(genre, btnElement) {
    if (genre === 'all') {
        selectedGenres.clear();
        document.querySelectorAll('.genre-chip').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
        const allBtn = document.querySelector('.genre-chip[data-genre="all"]');
        if (allBtn) allBtn.classList.remove('active');

        if (selectedGenres.has(genre)) {
            selectedGenres.delete(genre);
            btnElement.classList.remove('active');
        } else {
            selectedGenres.add(genre);
            btnElement.classList.add('active');
        }

        if (selectedGenres.size === 0 && allBtn) {
            allBtn.classList.add('active');
        }
    }

    filterNovels();
}

function clearAllGenres() {
    selectedGenres.clear();
    document.querySelectorAll('.genre-chip').forEach(b => b.classList.remove('active'));
    const allBtn = document.querySelector('.genre-chip[data-genre="all"]');
    if (allBtn) allBtn.classList.add('active');
    filterNovels();
}

// ==========================================
// 3. STATUS FILTER FUNCTION
// ==========================================
function setStatusFilter(status, btnElement) {
    document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
    btnElement.classList.add('active');
    selectedStatus = status;
    filterNovels();
}

// ==========================================
// 4. FILTERING LOGIC
// ==========================================
function filterNovels() {
    const searchInput = document.getElementById('search-input');
    const searchKeyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = allNovels.filter(novel => {
        const matchesKeyword = (novel.title && novel.title.toLowerCase().includes(searchKeyword)) || 
                               (novel.author && novel.author.toLowerCase().includes(searchKeyword));

        const matchesStatus = (selectedStatus === 'all') || 
                              (novel.status && novel.status.toLowerCase() === selectedStatus.toLowerCase());

        let matchesGenre = true;
        if (selectedGenres.size > 0) {
            const novelGenres = novel.genre ? novel.genre.toLowerCase().split(',').map(g => g.trim()) : [];
            matchesGenre = Array.from(selectedGenres).every(selectedG => 
                novelGenres.includes(selectedG.toLowerCase())
            );
        }

        return matchesKeyword && matchesStatus && matchesGenre;
    });

    currentPage = 1; 
    renderResults(filtered);
}

// ==========================================
// 5. RENDER RESULTS UI & PAGINATION (Always Visible)
// ==========================================
function renderResults(novels) {
    const grid = document.getElementById('search-results-grid');
    const countEl = document.getElementById('result-count');
    
    if (countEl) countEl.innerText = novels.length;
    if (!grid) return;

    if (novels.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); font-size:13px; grid-column: 1 / -1; text-align: center; padding: 30px;">ရှာဖွေမှုနှင့် ကိုက်ညီသော နိုဗယ် မရှိပါ။</p>';
        renderPagination(0); // နိုဗယ် မရှိလည်း Pagination ပုံစံပြရန်
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentNovels = novels.slice(startIndex, startIndex + itemsPerPage);

    grid.innerHTML = currentNovels.map(novel => `
        <a href="novel.html?id=${novel.slug || novel.id}" class="novel-card">
            <div class="novel-cover-wrap">
                <img src="${novel.coverUrl || ''}" class="novel-cover" alt="${novel.title || ''}" loading="lazy">
                <span class="chapter-badge">${novel.status || 'Ongoing'}</span>
            </div>
            <div class="novel-info">
                <div class="novel-name">${novel.title || ''}</div>
                <div class="novel-meta">${novel.genre || 'General'}</div>
            </div>
        </a>
    `).join('');

    renderPagination(novels.length);
}

// Pagination ဖန်တီးသည့် သီးသန့် Function (နိုဗယ်မရှိလည်း အမြဲပေါ်နေစေရန်)
function renderPagination(totalItems) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    let paginationHTML = '';
    
    // Previous Button
    paginationHTML += `<button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); padding:6px 12px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-chevron-left"></i></button>`;
    
    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button onclick="changePage(${i})" style="background:${i === currentPage ? 'var(--primary-purple)' : 'var(--card-bg)'}; color:#fff; border:1px solid var(--border-color); padding:6px 12px; border-radius:8px; cursor:pointer;">${i}</button>`;
    }
    
    // Next Button
    paginationHTML += `<button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); padding:6px 12px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-chevron-right"></i></button>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// Page ပြောင်းသည့် Function
function changePage(page) {
    const searchInput = document.getElementById('search-input');
    const searchKeyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const filtered = allNovels.filter(novel => {
        const matchesKeyword = (novel.title && novel.title.toLowerCase().includes(searchKeyword)) || 
                               (novel.author && novel.author.toLowerCase().includes(searchKeyword));
        const matchesStatus = (selectedStatus === 'all') || 
                              (novel.status && novel.status.toLowerCase() === selectedStatus.toLowerCase());
        let matchesGenre = true;
        if (selectedGenres.size > 0) {
            const novelGenres = novel.genre ? novel.genre.toLowerCase().split(',').map(g => g.trim()) : [];
            matchesGenre = Array.from(selectedGenres).every(selectedG => 
                novelGenres.includes(selectedG.toLowerCase())
            );
        }
        return matchesKeyword && matchesStatus && matchesGenre;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderResults(filtered);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
