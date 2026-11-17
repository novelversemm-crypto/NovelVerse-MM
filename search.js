
// ==========================================
// FILTER STATES
// ==========================================
let allNovels = [];
let selectedStatus = 'all';
let selectedGenres = new Set();
let currentPage = 1;
const itemsPerPage = 10;

// ==========================================
// DOM CONTENT LOADED
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    window.toggleGenreFilter = toggleGenreFilter;
    window.clearAllGenres = clearAllGenres;
    window.setStatusFilter = setStatusFilter;
    window.filterNovels = filterNovels;
    window.changePage = changePage;

    fetchAllNovels();
});

// ==========================================
// NEW HELPER FUNCTIONS
// ==========================================

// HTML characters escape လုပ်ရန်
function escapeSearchHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

// Safe image URL စစ်ဆေးရန်
function getSafeSearchImageUrl(url) {
    if (!url) return '';

    try {
        const parsedUrl = new URL(url, window.location.origin);

        if (
            parsedUrl.protocol === 'https:' ||
            parsedUrl.protocol === 'http:'
        ) {
            return escapeSearchHtml(parsedUrl.href);
        }
    } catch (error) {
        console.warn('Invalid novel cover URL:', error);
    }

    return '';
}

// Novel ID / Slug ကို URL အတွက် ပြင်ဆင်ရန်
function getSafeNovelSearchUrl(novel) {
    const novelId = novel.slug || novel.id;

    if (!novelId) return 'novel.html';

    return `novel.html?id=${encodeURIComponent(String(novelId))}`;
}

// Novel Data ထဲက Genres ကို စစ်ဆေးရန်
function getNovelSearchGenres(novel) {
    if (!novel.genre) return [];

    if (Array.isArray(novel.genre)) {
        return novel.genre.map(g => String(g).trim().toLowerCase());
    }

    return String(novel.genre)
        .split(',')
        .map(g => g.trim().toLowerCase())
        .filter(Boolean);
}

// ==========================================
// 1. FETCH NOVELS FROM GITHUB JSON
// ==========================================
async function fetchAllNovels() {
    const grid = document.getElementById('search-results-grid');

    try {
        const response = await fetch(
            'content/novels.json?' + new Date().getTime()
        );

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            allNovels = data;
        } else if (data && typeof data === 'object') {
            allNovels = Object.keys(data).map(key => ({
                ...data[key],
                id: data[key].id || key
            }));
        } else {
            allNovels = [];
        }

        filterNovels();

    } catch (error) {
        console.error('Fetch novels error:', error);

        if (grid) {
            grid.innerHTML = `
                <p style="
                    color:var(--text-muted);
                    font-size:12px;
                    grid-column:1/-1;
                    text-align:center;
                    padding:30px;
                ">
                    Novel များကို ဆွဲယူရာတွင် အမှားအယွင်း ရှိပါသည်။
                </p>
            `;
        }

        const countEl = document.getElementById('result-count');
        if (countEl) countEl.innerText = '0';

        currentPage = 1;
        renderPagination(0);
    }
}

// ==========================================
// 2. MULTIPLE GENRE FILTER TOGGLE FUNCTION
// ==========================================
function toggleGenreFilter(genre, btnElement) {
    if (genre === 'all') {
        selectedGenres.clear();

        document.querySelectorAll('.genre-chip').forEach(button => {
            button.classList.remove('active');
        });

        if (btnElement) {
            btnElement.classList.add('active');
        }

    } else {
        const allBtn = document.querySelector(
            '.genre-chip[data-genre="all"]'
        );

        if (allBtn) {
            allBtn.classList.remove('active');
        }

        if (selectedGenres.has(genre)) {
            selectedGenres.delete(genre);

            if (btnElement) {
                btnElement.classList.remove('active');
            }

        } else {
            selectedGenres.add(genre);

            if (btnElement) {
                btnElement.classList.add('active');
            }
        }

        if (selectedGenres.size === 0 && allBtn) {
            allBtn.classList.add('active');
        }
    }

    filterNovels();
}

// ==========================================
// CLEAR ALL GENRES
// ==========================================
function clearAllGenres() {
    selectedGenres.clear();

    document.querySelectorAll('.genre-chip').forEach(button => {
        button.classList.remove('active');
    });

    const allBtn = document.querySelector(
        '.genre-chip[data-genre="all"]'
    );

    if (allBtn) {
        allBtn.classList.add('active');
    }

    filterNovels();
}

// ==========================================
// 3. STATUS FILTER FUNCTION
// ==========================================
function setStatusFilter(status, btnElement) {
    document.querySelectorAll('.status-btn').forEach(button => {
        button.classList.remove('active');
    });

    if (btnElement) {
        btnElement.classList.add('active');
    }

    selectedStatus = status;
    filterNovels();
}

// ==========================================
// NEW HELPER: GET FILTERED NOVELS
// ==========================================
function getFilteredNovels() {
    const searchInput = document.getElementById('search-input');

    const searchKeyword = searchInput
        ? searchInput.value.toLowerCase().trim()
        : '';

    return allNovels.filter(novel => {
        const title = String(novel.title || '').toLowerCase();
        const author = String(novel.author || '').toLowerCase();

        const matchesKeyword =
            title.includes(searchKeyword) ||
            author.includes(searchKeyword);

        const matchesStatus =
            selectedStatus === 'all' ||
            String(novel.status || '').toLowerCase() ===
            selectedStatus.toLowerCase();

        let matchesGenre = true;

        if (selectedGenres.size > 0) {
            const novelGenres = getNovelSearchGenres(novel);

            // မူရင်း AND Filtering ကို ထိန်းသိမ်းထားသည်
            matchesGenre = Array.from(selectedGenres).every(
                selectedGenre =>
                    novelGenres.includes(selectedGenre.toLowerCase())
            );
        }

        return matchesKeyword && matchesStatus && matchesGenre;
    });
}

// ==========================================
// 4. FILTERING LOGIC
// ==========================================
function filterNovels() {
    const filtered = getFilteredNovels();

    currentPage = 1;

    renderResults(filtered);
}

// ==========================================
// 5. RENDER RESULTS UI & PAGINATION
// ==========================================
function renderResults(novels) {
    const grid = document.getElementById('search-results-grid');
    const countEl = document.getElementById('result-count');

    if (countEl) {
        countEl.innerText = novels.length;
    }

    if (!grid) return;

    if (novels.length === 0) {
        grid.innerHTML = `
            <p style="
                color:var(--text-muted);
                font-size:13px;
                grid-column:1/-1;
                text-align:center;
                padding:30px;
            ">
                ရှာဖွေမှုနှင့် ကိုက်ညီသော နိုဗယ် မရှိပါ။
            </p>
        `;

        renderPagination(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;

    const currentNovels = novels.slice(
        startIndex,
        startIndex + itemsPerPage
    );

    grid.innerHTML = currentNovels.map(novel => {
        const title = escapeSearchHtml(novel.title || '');
        const genre = escapeSearchHtml(novel.genre || 'General');
        const status = escapeSearchHtml(novel.status || 'Ongoing');

        const imageUrl = getSafeSearchImageUrl(novel.coverUrl);
        const novelUrl = escapeSearchHtml(getSafeNovelSearchUrl(novel));

        return `
            <a href="${novelUrl}" class="novel-card">
                <div class="novel-cover-wrap">

                    <img
                        src="${imageUrl}"
                        class="novel-cover"
                        alt="${title}"
                        loading="lazy"
                    >

                    <span class="chapter-badge">
                        ${status}
                    </span>

                </div>

                <div class="novel-info">

                    <div class="novel-name">
                        ${title}
                    </div>

                    <div class="novel-meta">
                        ${genre}
                    </div>

                </div>
            </a>
        `;
    }).join('');

    renderPagination(novels.length);
}

// ==========================================
// PAGINATION FUNCTION
// ==========================================
function renderPagination(totalItems) {
    const paginationContainer = document.getElementById(
        'pagination-container'
    );

    if (!paginationContainer) return;

    const totalPages = Math.max(
        1,
        Math.ceil(totalItems / itemsPerPage)
    );

    // လက်ရှိ Page ကို သတ်မှတ်ချက်အတွင်း ထိန်းထားရန်
    currentPage = Math.min(
        Math.max(1, currentPage),
        totalPages
    );

    let paginationHTML = '';

    // Previous Button
    paginationHTML += `
        <button
            onclick="changePage(${currentPage - 1})"
            ${currentPage === 1 || totalItems === 0 ? 'disabled' : ''}
            style="
                background:var(--card-bg);
                color:var(--text-main);
                border:1px solid var(--border-color);
                padding:6px 12px;
                border-radius:8px;
                cursor:pointer;
                ${currentPage === 1 || totalItems === 0
                    ? 'opacity:0.5;cursor:not-allowed;'
                    : ''}
            "
        >
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <button
                onclick="changePage(${i})"
                ${totalItems === 0 ? 'disabled' : ''}
                aria-current="${i === currentPage ? 'page' : 'false'}"
                style="
                    background:${i === currentPage
                        ? 'var(--primary-purple)'
                        : 'var(--card-bg)'};
                    color:#fff;
                    border:1px solid var(--border-color);
                    padding:6px 12px;
                    border-radius:8px;
                    cursor:pointer;
                "
            >
                ${i}
            </button>
        `;
    }

    // Next Button
    paginationHTML += `
        <button
            onclick="changePage(${currentPage + 1})"
            ${currentPage === totalPages || totalItems === 0
                ? 'disabled'
                : ''}
            style="
                background:var(--card-bg);
                color:var(--text-main);
                border:1px solid var(--border-color);
                padding:6px 12px;
                border-radius:8px;
                cursor:pointer;
                ${currentPage === totalPages || totalItems === 0
                    ? 'opacity:0.5;cursor:not-allowed;'
                    : ''}
            "
        >
            <i class="fa-solid fa-chevron-right"></i>
        </button>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// ==========================================
// PAGE CHANGE FUNCTION
// ==========================================
function changePage(page) {
    const filtered = getFilteredNovels();

    const totalPages = Math.max(
        1,
        Math.ceil(filtered.length / itemsPerPage)
    );

    if (
        !Number.isInteger(Number(page)) ||
        page < 1 ||
        page > totalPages ||
        filtered.length === 0
    ) {
        return;
    }

    currentPage = Number(page);

    renderResults(filtered);

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
