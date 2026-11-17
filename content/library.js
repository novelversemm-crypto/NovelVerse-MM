
/* ==========================================
   NOVELVERSE MM — USER LIBRARY SYSTEM
   Saved Novels / Search / Sort / Pagination
   ========================================== */


/* ==========================================
   1. CONFIGURATION
   ========================================== */

const LIBRARY_CONFIG = {

    novelsJsonUrl: 'content/novels.json',

    novelsPerPage: 12,

    apiActions: {
        get: 'getUserLibrary',
        add: 'addToLibrary',
        remove: 'removeFromLibrary'
    },

    elements: {
        userCard: 'library-user-card',
        username: 'library-username',
        novelCount: 'library-novel-count',

        loginRequired: 'library-login-required',
        content: 'library-content',

        search: 'library-search-input',
        sort: 'library-sort-select',

        loading: 'library-loading',
        error: 'library-error',
        errorMessage: 'library-error-message',
        retry: 'library-retry-btn',

        empty: 'library-empty-state',
        noResults: 'library-no-results',
        clearSearch: 'library-clear-search-btn',

        grid: 'library-novels-grid',
        pagination: 'library-pagination'
    }
};


/* ==========================================
   2. LIBRARY STATE
   ========================================== */

let libraryNovels = [];

let allLibraryNovels = [];

let filteredLibraryNovels = [];

let currentLibraryPage = 1;

let currentLibrarySearch = '';

let currentLibrarySort = 'newest';

let isLibraryLoading = false;

let isLibraryInitialized = false;

let libraryRequestVersion = 0;


/* ==========================================
   3. HTML ELEMENT HELPER
   ========================================== */

function getLibraryElement(name) {

    const id = LIBRARY_CONFIG.elements[name];

    if (!id) return null;

    return document.getElementById(id);
}


/* ==========================================
   4. HTML ESCAPE
   ========================================== */

function escapeLibraryHtml(value) {

    return String(value ?? '').replace(
        /[&<>"']/g,
        character => {

            const entities = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            };

            return entities[character];
        }
    );
}


/* ==========================================
   5. FORMAT NUMBER
   ========================================== */

function formatLibraryNumber(number) {

    return Number(number || 0).toLocaleString('en-US');
}


/* ==========================================
   6. AUTHENTICATION CHECK
   ========================================== */

function checkLibraryAuthentication() {

    return (
        typeof window.isUserLoggedIn === 'function' &&
        window.isUserLoggedIn()
    );
}


/* ==========================================
   7. SHOW / HIDE ELEMENTS
   ========================================== */

function showLibraryElement(name) {

    const element = getLibraryElement(name);

    if (element) {
        element.style.display = '';
    }
}


function hideLibraryElement(name) {

    const element = getLibraryElement(name);

    if (element) {
        element.style.display = 'none';
    }
}


/* ==========================================
   8. LIBRARY API REQUEST
   ========================================== */

async function libraryApiRequest(action, data = {}) {

    if (typeof window.authApiRequest !== 'function') {

        throw new Error(
            'Authentication API မတွေ့ပါ။ auth.js ကို စစ်ဆေးပါ။'
        );
    }


    const session = (
        typeof window.getAuthSession === 'function'
    )
        ? window.getAuthSession()
        : null;


    if (!session || !session.token) {

        throw new Error(
            'Login Session မတွေ့ပါ။ Login ပြန်ဝင်ပေးပါ။'
        );
    }


    return await window.authApiRequest(
        action,
        {
            token: session.token,
            ...data
        }
    );
}


/* ==========================================
   9. LOAD ALL NOVEL DATA
   ========================================== */

async function fetchLibraryNovelData() {

    const response = await fetch(
        `${LIBRARY_CONFIG.novelsJsonUrl}?t=${Date.now()}`
    );


    if (!response.ok) {

        throw new Error(
            'Novel Data ရယူ၍ မရပါ။'
        );
    }


    const data = await response.json();


    if (Array.isArray(data)) {

        return data;
    }


    if (data && Array.isArray(data.novels)) {

        return data.novels;
    }


    if (data && typeof data === 'object') {

        return Object.values(data).filter(
            item => item && typeof item === 'object'
        );
    }


    throw new Error(
        'novels.json Data ပုံစံ မမှန်ပါ။'
    );
}


/* ==========================================
   10. NORMALIZE NOVEL DATA
   ========================================== */

function normalizeLibraryNovel(novel) {

    if (!novel || typeof novel !== 'object') {
        return null;
    }


    const slug = String(
        novel.slug || novel.id || ''
    ).trim();


    if (!slug) return null;


    return {
        ...novel,

        slug: slug,

        title: String(
            novel.title || 'Untitled Novel'
        ),

        author: String(
            novel.author || 'Unknown Author'
        ),

        coverUrl: String(
            novel.coverUrl || novel.cover || ''
        ),

        genre: Array.isArray(novel.genre)
            ? novel.genre
            : novel.genre
                ? [novel.genre]
                : [],

        status: String(
            novel.status || 'Unknown'
        ),

        synopsis: String(
            novel.synopsis || ''
        )
    };
}


/* ==========================================
   11. GET SAVED LIBRARY FROM BACKEND
   ========================================== */

async function fetchUserLibrary() {

    const result = await libraryApiRequest(
        LIBRARY_CONFIG.apiActions.get
    );


    const libraryData =
        result.library ||
        result.novels ||
        result.items ||
        [];


    if (!Array.isArray(libraryData)) {

        throw new Error(
            'Library Data ပုံစံ မမှန်ပါ။'
        );
    }


    return libraryData;
}


/* ==========================================
   12. EXTRACT SAVED NOVEL SLUGS
   ========================================== */

function extractLibrarySlugs(libraryData) {

    const slugSet = new Set();


    libraryData.forEach(item => {

        let slug = '';


        if (typeof item === 'string') {

            slug = item;

        } else if (item && typeof item === 'object') {

            slug =
                item.novelSlug ||
                item.slug ||
                item.novelId ||
                item.id ||
                '';
        }


        slug = String(slug).trim();


        if (slug) {
            slugSet.add(slug);
        }
    });


    return slugSet;
}


/* ==========================================
   13. LOAD USER LIBRARY
   ========================================== */

async function loadUserLibrary() {

    if (isLibraryLoading) return;

    if (!checkLibraryAuthentication()) {

        showLibraryLoginRequired();

        return;
    }


    isLibraryLoading = true;

    const requestVersion = ++libraryRequestVersion;


    showLibraryLoading();

    hideLibraryElement('error');

    hideLibraryElement('empty');

    hideLibraryElement('noResults');


    try {

        // Novel Data နှင့် User Library ကို ရယူခြင်း

        const [novels, savedLibrary] = await Promise.all([

            fetchLibraryNovelData(),

            fetchUserLibrary()
        ]);


        // နောက်ထပ် Request အသစ်တစ်ခု စတင်ထားပါက
        // အဟောင်း Result ကို မပြသတော့ပါ

        if (requestVersion !== libraryRequestVersion) {
            return;
        }


        const savedSlugs = extractLibrarySlugs(
            savedLibrary
        );


        const normalizedNovels = novels
            .map(normalizeLibraryNovel)
            .filter(Boolean);


        libraryNovels = normalizedNovels.filter(
            novel => savedSlugs.has(novel.slug)
        );


        allLibraryNovels = [...libraryNovels];


        // User Information

        updateLibraryUserInfo();


        // Search နှင့် Sort ပြန်အသုံးပြုခြင်း

        applyLibraryFilters();


        hideLibraryLoading();

        showLibraryElement('content');

        showLibraryElement('userCard');


    } catch (error) {

        if (requestVersion !== libraryRequestVersion) {
            return;
        }


        console.error(
            'Library Loading Error:',
            error
        );


        showLibraryError(
            error.message ||
            'Library ကို ရယူ၍ မရပါ။'
        );

    } finally {

        if (requestVersion === libraryRequestVersion) {

            isLibraryLoading = false;
        }
    }
}


/* ==========================================
   14. UPDATE USER INFORMATION
   ========================================== */

function updateLibraryUserInfo() {

    const user = (
        typeof window.getCurrentAuthUser === 'function'
    )
        ? window.getCurrentAuthUser()
        : null;


    const usernameElement = getLibraryElement(
        'username'
    );

    const countElement = getLibraryElement(
        'novelCount'
    );


    if (usernameElement) {

        usernameElement.textContent =
            user?.username || 'Reader';
    }


    if (countElement) {

        countElement.textContent =
            formatLibraryNumber(libraryNovels.length);
    }
}


/* ==========================================
   15. SHOW LOGIN REQUIRED
   ========================================== */

function showLibraryLoginRequired() {

    hideLibraryElement('content');

    hideLibraryElement('loading');

    hideLibraryElement('error');

    hideLibraryElement('userCard');

    showLibraryElement('loginRequired');
}


/* ==========================================
   16. SHOW LOADING
   ========================================== */

function showLibraryLoading() {

    hideLibraryElement('loginRequired');

    hideLibraryElement('error');

    hideLibraryElement('empty');

    hideLibraryElement('noResults');

    showLibraryElement('loading');
}


function hideLibraryLoading() {

    hideLibraryElement('loading');
}


/* ==========================================
   17. SHOW ERROR
   ========================================== */

function showLibraryError(message) {

    hideLibraryLoading();

    hideLibraryElement('content');

    hideLibraryElement('loginRequired');

    showLibraryElement('error');


    const messageElement = getLibraryElement(
        'errorMessage'
    );


    if (messageElement) {

        messageElement.textContent = message;
    }
}


/* ==========================================
   18. SEARCH LIBRARY
   ========================================== */

function searchLibraryNovels() {

    const searchInput = getLibraryElement(
        'search'
    );


    currentLibrarySearch = searchInput
        ? searchInput.value.trim().toLowerCase()
        : '';


    currentLibraryPage = 1;

    applyLibraryFilters();
}


/* ==========================================
   19. SORT LIBRARY
   ========================================== */

function sortLibraryNovels() {

    const sortSelect = getLibraryElement(
        'sort'
    );


    currentLibrarySort = sortSelect
        ? sortSelect.value
        : 'newest';


    currentLibraryPage = 1;

    applyLibraryFilters();
}


/* ==========================================
   20. APPLY SEARCH AND SORT
   ========================================== */

function applyLibraryFilters() {

    let filtered = [...libraryNovels];


    // Search

    if (currentLibrarySearch) {

        filtered = filtered.filter(novel => {

            const title = novel.title.toLowerCase();

            const author = novel.author.toLowerCase();

            const genres = novel.genre.join(' ').toLowerCase();


            return (
                title.includes(currentLibrarySearch) ||
                author.includes(currentLibrarySearch) ||
                genres.includes(currentLibrarySearch)
            );
        });
    }


    // Sort

    switch (currentLibrarySort) {

        case 'oldest':

            filtered.sort((a, b) => {

                return getLibraryDate(a) - getLibraryDate(b);
            });

            break;


        case 'title-asc':

            filtered.sort((a, b) => {

                return a.title.localeCompare(b.title);
            });

            break;


        case 'title-desc':

            filtered.sort((a, b) => {

                return b.title.localeCompare(a.title);
            });

            break;


        case 'newest':

        default:

            filtered.sort((a, b) => {

                return getLibraryDate(b) - getLibraryDate(a);
            });

            break;
    }


    filteredLibraryNovels = filtered;


    renderLibraryNovels();

}


/* ==========================================
   21. GET NOVEL DATE
   ========================================== */

function getLibraryDate(novel) {

    const date = new Date(
        novel.savedAt ||
        novel.createdAt ||
        0
    );


    const timestamp = date.getTime();


    return Number.isNaN(timestamp)
        ? 0
        : timestamp;
}


/* ==========================================
   22. RENDER LIBRARY NOVELS
   ========================================== */

function renderLibraryNovels() {

    const grid = getLibraryElement('grid');

    if (!grid) return;


    hideLibraryElement('loading');

    hideLibraryElement('empty');

    hideLibraryElement('noResults');


    // No Saved Novels

    if (libraryNovels.length === 0) {

        grid.innerHTML = '';

        hideLibraryElement('pagination');

        if (currentLibrarySearch) {

            showLibraryElement('noResults');

        } else {

            showLibraryElement('empty');
        }

        return;
    }


    // Search Result မရှိခြင်း

    if (filteredLibraryNovels.length === 0) {

        grid.innerHTML = '';

        hideLibraryElement('pagination');

        showLibraryElement('noResults');

        return;
    }


    // Pagination

    const startIndex =
        (currentLibraryPage - 1) *
        LIBRARY_CONFIG.novelsPerPage;


    const endIndex =
        startIndex +
        LIBRARY_CONFIG.novelsPerPage;


    const pageNovels = filteredLibraryNovels.slice(
        startIndex,
        endIndex
    );


    grid.innerHTML = pageNovels
        .map(renderLibraryNovelCard)
        .join('');


    renderLibraryPagination(
        filteredLibraryNovels.length
    );
}


/* ==========================================
   23. RENDER NOVEL CARD
   ========================================== */

function renderLibraryNovelCard(novel) {

    const slug = encodeURIComponent(novel.slug);

    const title = escapeLibraryHtml(novel.title);

    const author = escapeLibraryHtml(novel.author);

    const cover = escapeLibraryHtml(novel.coverUrl);

    const status = escapeLibraryHtml(novel.status);


    const genres = novel.genre
        .map(genre => {

            return `<span class="library-genre">${escapeLibraryHtml(genre)}</span>`;

        })
        .join('');


    const coverContent = cover

        ? `<img
                src="${cover}"
                alt="${title}"
                class="library-novel-cover"
                loading="lazy"
                onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
            >
            <div class="library-cover-placeholder" style="display:none;">
                <span>NovelVerse</span>
            </div>`

        : `<div class="library-cover-placeholder">
                <span>NovelVerse</span>
            </div>`;


    return `
        <article class="library-novel-card">

            <a
                href="novel.html?id=${slug}"
                class="library-cover-link"
                aria-label="${title}"
            >
                ${coverContent}
            </a>


            <div class="library-novel-info">

                <a
                    href="novel.html?id=${slug}"
                    class="library-novel-title"
                >
                    ${title}
                </a>


                <p class="library-novel-author">
                    ${author}
                </p>


                <div class="library-novel-genres">
                    ${genres}
                </div>


                <span class="library-novel-status">
                    ${status}
                </span>


                <button
                    type="button"
                    class="library-remove-btn"
                    data-remove-novel="${escapeLibraryHtml(novel.slug)}"
                >
                    <i class="fas fa-trash-alt"></i>
                    Remove
                </button>

            </div>

        </article>
    `;
}


/* ==========================================
   24. LIBRARY CARD EVENTS
   ========================================== */

function setupLibraryCardEvents() {

    const grid = getLibraryElement('grid');

    if (!grid || grid.dataset.eventsReady === 'true') {
        return;
    }


    grid.dataset.eventsReady = 'true';


    grid.addEventListener('click', event => {

        const removeButton = event.target.closest(
            '[data-remove-novel]'
        );


        if (!removeButton) return;


        const slug = removeButton.dataset.removeNovel;


        removeNovelFromLibrary(
            slug,
            removeButton
        );
    });
}


/* ==========================================
   25. ADD NOVEL TO LIBRARY
   ========================================== */

async function addNovelToLibrary(novelSlug) {

    if (!checkLibraryAuthentication()) {

        window.location.href =
            LIBRARY_CONFIG.elements.loginRequired
                ? 'profile.html'
                : 'profile.html';

        return {
            success: false,
            message: 'Login ဝင်ပေးပါ။'
        };
    }


    const slug = String(novelSlug || '').trim();

    if (!slug) {

        return {
            success: false,
            message: 'Novel ID မမှန်ပါ။'
        };
    }


    try {

        const result = await libraryApiRequest(
            LIBRARY_CONFIG.apiActions.add,
            {
                novelSlug: slug
            }
        );


        // Current Page က Library Page ဖြစ်ပါက Refresh လုပ်မည်

        if (isLibraryInitialized) {

            await loadUserLibrary();
        }


        return {
            success: true,
            message: result.message || 'Library ထဲသို့ ထည့်ပြီးပါပြီ။'
        };


    } catch (error) {

        console.error(
            'Add Library Error:',
            error
        );


        return {
            success: false,
            message: error.message || 'Library ထဲထည့်၍ မရပါ။'
        };
    }
}


/* ==========================================
   26. REMOVE NOVEL FROM LIBRARY
   ========================================== */

async function removeNovelFromLibrary(
    novelSlug,
    button = null
) {

    const slug = String(novelSlug || '').trim();

    if (!slug) return;


    if (!checkLibraryAuthentication()) {

        window.location.href = 'profile.html';

        return;
    }


    const novel = libraryNovels.find(
        item => item.slug === slug
    );


    const confirmed = confirm(
        `"${novel?.title || slug}" ကို Library ထဲမှ ဖယ်ရှားမှာ သေချာပါသလား။`
    );


    if (!confirmed) return;


    if (button) {

        button.disabled = true;

        button.textContent = 'Removing...';
    }


    try {

        await libraryApiRequest(
            LIBRARY_CONFIG.apiActions.remove,
            {
                novelSlug: slug
            }
        );


        // UI State Update

        libraryNovels = libraryNovels.filter(
            item => item.slug !== slug
        );


        allLibraryNovels = [...libraryNovels];


        const currentTotalPages = Math.max(
            1,
            Math.ceil(
                filteredLibraryNovels.length /
                LIBRARY_CONFIG.novelsPerPage
            )
        );


        if (currentLibraryPage > currentTotalPages) {

            currentLibraryPage = currentTotalPages;
        }


        updateLibraryUserInfo();

        applyLibraryFilters();


    } catch (error) {

        console.error(
            'Remove Library Error:',
            error
        );


        alert(
            error.message || 'Novel ဖယ်ရှား၍ မရပါ။'
        );


        if (button) {

            button.disabled = false;

            button.innerHTML =
                '<i class="fas fa-trash-alt"></i> Remove';
        }
    }
}


/* ==========================================
   27. PAGINATION
   ========================================== */

function renderLibraryPagination(totalItems) {

    const pagination = getLibraryElement(
        'pagination'
    );

    if (!pagination) return;


    const totalPages = Math.ceil(
        totalItems /
        LIBRARY_CONFIG.novelsPerPage
    );


    if (totalPages <= 1) {

        pagination.innerHTML = '';

        hideLibraryElement('pagination');

        return;
    }


    showLibraryElement('pagination');


    let html = '';


    // Previous Button

    html += `
        <button
            type="button"
            class="library-page-btn"
            data-page="${currentLibraryPage - 1}"
            ${currentLibraryPage === 1 ? 'disabled' : ''}
        >
            <i class="fas fa-chevron-left"></i>
        </button>
    `;


    // Page Numbers

    for (let page = 1; page <= totalPages; page++) {

        if (
            page === 1 ||
            page === totalPages ||
            Math.abs(page - currentLibraryPage) <= 2
        ) {

            html += `
                <button
                    type="button"
                    class="library-page-btn ${page === currentLibraryPage ? 'active' : ''}"
                    data-page="${page}"
                    ${page === currentLibraryPage ? 'aria-current="page"' : ''}
                >
                    ${page}
                </button>
            `;

        } else if (
            Math.abs(page - currentLibraryPage) === 3
        ) {

            html += `
                <span class="library-page-dots">...</span>
            `;
        }
    }


    // Next Button

    html += `
        <button
            type="button"
            class="library-page-btn"
            data-page="${currentLibraryPage + 1}"
            ${currentLibraryPage === totalPages ? 'disabled' : ''}
        >
            <i class="fas fa-chevron-right"></i>
        </button>
    `;


    pagination.innerHTML = html;
}


/* ==========================================
   28. CHANGE LIBRARY PAGE
   ========================================== */

function changeLibraryPage(page) {

    const totalPages = Math.ceil(
        filteredLibraryNovels.length /
        LIBRARY_CONFIG.novelsPerPage
    );


    if (
        page < 1 ||
        page > totalPages ||
        page === currentLibraryPage
    ) {
        return;
    }


    currentLibraryPage = page;

    renderLibraryNovels();


    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


/* ==========================================
   29. PAGINATION EVENTS
   ========================================== */

function setupLibraryPaginationEvents() {

    const pagination = getLibraryElement(
        'pagination'
    );

    if (!pagination || pagination.dataset.eventsReady === 'true') {
        return;
    }


    pagination.dataset.eventsReady = 'true';


    pagination.addEventListener('click', event => {

        const button = event.target.closest(
            '[data-page]'
        );


        if (!button || button.disabled) return;


        changeLibraryPage(
            Number(button.dataset.page)
        );
    });
}


/* ==========================================
   30. CLEAR SEARCH
   ========================================== */

function clearLibrarySearch() {

    const searchInput = getLibraryElement(
        'search'
    );


    if (searchInput) {
        searchInput.value = '';
    }


    currentLibrarySearch = '';

    currentLibraryPage = 1;

    applyLibraryFilters();
}


/* ==========================================
   31. SETUP LIBRARY EVENTS
   ========================================== */

function setupLibraryEventListeners() {

    const searchInput = getLibraryElement(
        'search'
    );

    const sortSelect = getLibraryElement(
        'sort'
    );

    const retryButton = getLibraryElement(
        'retry'
    );

    const clearButton = getLibraryElement(
        'clearSearch'
    );


    if (searchInput && searchInput.dataset.ready !== 'true') {

        searchInput.dataset.ready = 'true';

        searchInput.addEventListener(
            'input',
            searchLibraryNovels
        );
    }


    if (sortSelect && sortSelect.dataset.ready !== 'true') {

        sortSelect.dataset.ready = 'true';

        sortSelect.addEventListener(
            'change',
            sortLibraryNovels
        );
    }


    if (retryButton && retryButton.dataset.ready !== 'true') {

        retryButton.dataset.ready = 'true';

        retryButton.addEventListener(
            'click',
            loadUserLibrary
        );
    }


    if (clearButton && clearButton.dataset.ready !== 'true') {

        clearButton.dataset.ready = 'true';

        clearButton.addEventListener(
            'click',
            clearLibrarySearch
        );
    }


    setupLibraryCardEvents();

    setupLibraryPaginationEvents();
}


/* ==========================================
   32. INITIALIZE LIBRARY PAGE
   ========================================== */

async function initializeLibraryPage() {

    if (isLibraryInitialized) return;


    const grid = getLibraryElement('grid');

    if (!grid) return;


    isLibraryInitialized = true;


    setupLibraryEventListeners();


    if (!checkLibraryAuthentication()) {

        showLibraryLoginRequired();

        return;
    }


    await loadUserLibrary();
}


/* ==========================================
   33. GLOBAL FUNCTIONS
   ========================================== */

window.loadUserLibrary =
    loadUserLibrary;

window.addNovelToLibrary =
    addNovelToLibrary;

window.removeNovelFromLibrary =
    removeNovelFromLibrary;

window.searchLibraryNovels =
    searchLibraryNovels;

window.sortLibraryNovels =
    sortLibraryNovels;

window.changeLibraryPage =
    changeLibraryPage;

window.clearLibrarySearch =
    clearLibrarySearch;

window.refreshLibraryPage =
    loadUserLibrary;


/* ==========================================
   34. DOM INITIALIZATION
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    initializeLibraryPage();
});
