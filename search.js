// Filter States
let allNovels = [];
let selectedStatus = 'all';
let selectedGenres = new Set(); // Genres များကို Multiple ရွေးနိုင်ရန် Set အဖြစ် အသုံးပြုထားသည်

document.addEventListener('DOMContentLoaded', () => {
    // HTML inline events များ Module ထဲမှ ခေါ်နိုင်ရန် Window ထဲ ထည့်ခြင်း
    window.toggleGenreFilter = toggleGenreFilter;
    window.clearAllGenres = clearAllGenres;
    window.setStatusFilter = setStatusFilter;
    window.filterNovels = filterNovels;

    // Firebase အစား content/novels.json ကို တိုက်ရိုက် Fetch လုပ်မည်
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
        
        // JSON Object ဖြစ်စေ၊ Array ဖြစ်စေ အဆင်ပြေအောင် ချိန်ညှိခြင်း
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

        filterNovels(); // Data ရလျှင် Filter စတင်ပြုလုပ်မည်
    } catch (error) {
        console.error("Fetch novels error:", error);
        if (grid) {
            grid.innerHTML = '<p style="color:var(--text-muted); font-size:12px; grid-column: 1 / -1; text-align: center; padding: 30px;">Novel များကို ဆွဲယူရာတွင် အမှားအယွင်း ရှိပါသည်။</p>';
        }
    }
}

// ==========================================
// 2. MULTIPLE GENRE FILTER TOGGLE FUNCTION
// ==========================================
function toggleGenreFilter(genre, btnElement) {
    if (genre === 'all') {
        // "All" ကို နှိပ်ပါက ရွေးထားသမျှ Genre များကို ရှင်းထုတ်မည်
        selectedGenres.clear();
        document.querySelectorAll('.genre-chip').forEach(b => b.classList.remove('active'));
        btnElement.classList.add('active');
    } else {
        // "All" Button ၏ Active ကို ဖြုတ်မည်
        const allBtn = document.querySelector('.genre-chip[data-genre="all"]');
        if (allBtn) allBtn.classList.remove('active');

        // Toggle Selection Logics
        if (selectedGenres.has(genre)) {
            selectedGenres.delete(genre);
            btnElement.classList.remove('active');
        } else {
            selectedGenres.add(genre);
            btnElement.classList.add('active');
        }

        // တစ်ခုမျှ မရွေးထားတော့ပါက "All" ကို ပြန် Active လုပ်မည်
        if (selectedGenres.size === 0 && allBtn) {
            allBtn.classList.add('active');
        }
    }

    filterNovels();
}

// Genre များအားလုံးကို ပြန်လည် Reset လုပ်သည့် Function
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
        // 1. Search Keyword Filter (Title သို့မဟုတ် Author)
        const matchesKeyword = (novel.title && novel.title.toLowerCase().includes(searchKeyword)) || 
                               (novel.author && novel.author.toLowerCase().includes(searchKeyword));

        // 2. Status Filter (Ongoing / Completed)
        const matchesStatus = (selectedStatus === 'all') || 
                              (novel.status && novel.status.toLowerCase() === selectedStatus.toLowerCase());

        // 3. Multiple Genres Filter (ရွေးချယ်ထားသော Genre များကို Novel ၏ Genre ထဲတွင် ရှာဖွေခြင်း)
        let matchesGenre = true;
        if (selectedGenres.size > 0) {
            const novelGenres = novel.genre ? novel.genre.toLowerCase().split(',').map(g => g.trim()) : [];
            // ရွေးထားသည့် Selected Genres အားလုံး Novel ထဲမှာ ပါ၊ မပါ စစ်ဆေးခြင်း
            matchesGenre = Array.from(selectedGenres).every(selectedG => 
                novelGenres.includes(selectedG.toLowerCase())
            );
        }

        return matchesKeyword && matchesStatus && matchesGenre;
    });

    renderResults(filtered);
}

// ==========================================
// 5. RENDER RESULTS UI
// ==========================================
function renderResults(novels) {
    const grid = document.getElementById('search-results-grid');
    const countEl = document.getElementById('result-count');
    
    if (countEl) countEl.innerText = novels.length;

    if (!grid) return;

    if (novels.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted); font-size:13px; grid-column: 1 / -1; text-align: center; padding: 30px;">ရှာဖွေမှုနှင့် ကိုက်ညီသော နိုဗယ် မရှိပါ။</p>';
        return;
    }

    grid.innerHTML = novels.map(novel => `
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
}