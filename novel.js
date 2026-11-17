
// ==========================================
// NOVELVERSE - NOVEL DETAILS SYSTEM
// ==========================================

let currentNovelId = null;
let chaptersData = [];
let isAscending = false;
let currentChapterPage = 1;

const chaptersPerPage = 30;


// ==========================================
// 1. INITIALIZE ON DOM LOAD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(
        window.location.search
    );

    currentNovelId = urlParams.get('id');

    window.toggleChapterSort = toggleChapterSort;
    window.triggerChapterAd = triggerChapterAd;
    window.changeChapterPage = changeChapterPage;

    if (currentNovelId) {

        fetchNovelData(currentNovelId);

    } else {

        const headerContainer = document.getElementById(
            'novel-header-container'
        );

        if (headerContainer) {
            headerContainer.innerHTML = '<p>Novel မရှိပါ။</p>';
        }

    }

});


// ==========================================
// 2. HELPER FUNCTIONS
// ==========================================

// HTML Injection ကာကွယ်ရန်
function escapeNovelHtml(value) {

    return String(value ?? '').replace(/[&<>"']/g, char => {

        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };

        return entities[char];

    });

}


// Image URL စစ်ဆေးရန်
function getSafeNovelCover(url) {

    if (!url) return '';

    try {

        const parsed = new URL(
            url,
            window.location.origin
        );

        if (
            parsed.protocol !== 'https:' &&
            parsed.protocol !== 'http:'
        ) {
            return '';
        }

        return parsed.href;

    } catch (error) {

        return '';

    }

}


// Novel Date Metadata ပြောင်းရန်
function updateNovelSEO(novel) {

    const title = novel.title || 'Novel Details';
    const synopsis = novel.synopsis || 'NovelVerse MM';
    const cover = getSafeNovelCover(novel.coverUrl);

    document.title = `${title} | NovelVerse MM`;

    const description = synopsis.substring(0, 160);

    const metaUpdates = {
        'page-description': description,
        'og-title': `${title} | NovelVerse MM`,
        'og-description': description,
        'og-image': cover,
        'og-url': window.location.href,
        'twitter-title': `${title} | NovelVerse MM`,
        'twitter-description': description,
        'twitter-image': cover
    };

    Object.entries(metaUpdates).forEach(([id, value]) => {

        const element = document.getElementById(id);

        if (element && value) {
            element.setAttribute('content', value);
        }

    });

}


// ==========================================
// 3. FETCH NOVEL DATA
// ==========================================

async function fetchNovelData(novelId) {

    const headerContainer = document.getElementById(
        'novel-header-container'
    );

    const listContainer = document.getElementById(
        'chapter-list-container'
    );

    try {

        const response = await fetch(
            './content/novels.json?' + Date.now()
        );

        if (!response.ok) {
            throw new Error(
                `Network response was not ok: ${response.status}`
            );
        }

        const data = await response.json();

        // Array နှင့် Object Data နှစ်မျိုးလုံး Support လုပ်မည်
        let novels = [];

        if (Array.isArray(data)) {

            novels = data;

        } else if (data && typeof data === 'object') {

            novels = Object.keys(data).map(key => {

                const novel = data[key];

                if (!novel || typeof novel !== 'object') {
                    return null;
                }

                return {
                    ...novel,
                    id: novel.id || key
                };

            }).filter(Boolean);

        }

        // Novel ID သို့မဟုတ် Slug ဖြင့် ရှာမည်
        const novel = novels.find(n =>
            (
                n.id &&
                String(n.id) === String(novelId)
            ) ||
            (
                n.slug &&
                String(n.slug) === String(novelId)
            )
        );

        if (!novel) {

            if (headerContainer) {
                headerContainer.innerHTML = '<p>Novel ရှာမတွေ့ပါ။</p>';
            }

            if (listContainer) {
                listContainer.innerHTML =
                    '<p class="empty-msg">စာစဉ်များ မရှိသေးပါ။</p>';
            }

            const countEl = document.getElementById('chapter-count');

            if (countEl) countEl.textContent = '0';

            chaptersData = [];

            renderChapterPagination(0);

            return;

        }


        // Novel SEO Update
        updateNovelSEO(novel);


        // Novel Information
        if (headerContainer) {

            const title = escapeNovelHtml(
                novel.title || 'Untitled'
            );

            const author = escapeNovelHtml(
                novel.author || 'Unknown'
            );

            const genre = escapeNovelHtml(
                novel.genre || 'General'
            );

            const status = escapeNovelHtml(
                novel.status || 'Ongoing'
            );

            const coverUrl = escapeNovelHtml(
                getSafeNovelCover(novel.coverUrl)
            );

            headerContainer.innerHTML = `

                <div class="novel-detail-card">

                    <img
                        src="${coverUrl}"
                        class="detail-cover"
                        alt="${title}"
                        loading="eager"
                        decoding="async"
                    >

                    <div class="detail-info">

                        <h2 class="detail-title">
                            ${title}
                        </h2>

                        <div class="detail-meta">

                            <i class="fa-solid fa-user"></i>

                            ${author}

                        </div>

                        <div class="detail-meta">

                            <i class="fa-solid fa-tag"></i>

                            ${genre}

                        </div>

                        <div class="detail-badge">
                            ${status}
                        </div>

                    </div>

                </div>

            `;

        }


        // Novel Synopsis
        const synopsisEl = document.getElementById(
            'novel-synopsis'
        );

        if (synopsisEl) {

            synopsisEl.textContent =
                novel.synopsis || 'အညွှန်း မရှိသေးပါ။';

        }


        // Chapter Data
        chaptersData = (
            novel.chapters &&
            Array.isArray(novel.chapters)
        )
            ? novel.chapters.filter(ch =>
                ch && typeof ch === 'object'
            )
            : [];


        // Chapter Sorting
        chaptersData.sort((a, b) => {

            const numA = Number(a.chapter_number) || 0;
            const numB = Number(b.chapter_number) || 0;

            return isAscending
                ? numA - numB
                : numB - numA;

        });


        // Chapter Count
        const countEl = document.getElementById(
            'chapter-count'
        );

        if (countEl) {
            countEl.textContent = chaptersData.length;
        }


        // First Page
        currentChapterPage = 1;

        renderChapters();


    } catch (error) {

        console.error(
            'Fetch novel data error:',
            error
        );

        if (headerContainer) {

            headerContainer.innerHTML = `
                <p>အချက်အလက်များ ရယူရာတွင် အမှားအယွင်း ရှိပါသည်။</p>
            `;

        }

        if (listContainer) {

            listContainer.innerHTML = `
                <p class="empty-msg">
                    စာစဉ်များ ဆွဲယူရာတွင် အမှားအယွင်း ရှိပါသည်။
                </p>
            `;

        }

        chaptersData = [];

        const countEl = document.getElementById('chapter-count');

        if (countEl) countEl.textContent = '0';

        renderChapterPagination(0);

    }

}


// ==========================================
// 4. RENDER CHAPTERS
// PAGINATION
// ==========================================

function renderChapters() {

    const listContainer = document.getElementById(
        'chapter-list-container'
    );

    if (!listContainer) return;


    if (chaptersData.length === 0) {

        listContainer.innerHTML = `
            <p class="empty-msg">
                စာစဉ်များ မရှိသေးပါ။
            </p>
        `;

        renderChapterPagination(0);

        return;

    }


    const startIndex =
        (currentChapterPage - 1) * chaptersPerPage;

    const currentChapters = chaptersData.slice(
        startIndex,
        startIndex + chaptersPerPage
    );


    listContainer.innerHTML = currentChapters.map(ch => {

        const chapterNumber = String(
            ch.chapter_number ?? ''
        );

        const chapterTitle = escapeNovelHtml(
            ch.title || ''
        );

        const novelId = encodeURIComponent(
            String(currentNovelId)
        );

        const chapterId = encodeURIComponent(
            chapterNumber
        );

        const readerUrl =
            `reader.html?novel_id=${novelId}` +
            `&id=${chapterId}`;

        return `

            <a
                href="${readerUrl}"
                class="chapter-item"
                onclick="triggerChapterAd(event, this.href)"
            >

                <div class="ch-title">

                    Chapter ${escapeNovelHtml(chapterNumber)}

                    - ${chapterTitle}

                </div>

                <div class="ch-date">

                    <i class="fa-solid fa-chevron-right"></i>

                </div>

            </a>

        `;

    }).join('');


    renderChapterPagination(chaptersData.length);

}


// ==========================================
// 5. CHAPTER PAGINATION
// ==========================================

function renderChapterPagination(totalItems) {

    const paginationContainer = document.getElementById(
        'chapter-pagination-container'
    );

    if (!paginationContainer) return;


    const totalPages = Math.max(
        1,
        Math.ceil(totalItems / chaptersPerPage)
    );

    let paginationHTML = '';


    // Previous Button
    paginationHTML += `

        <button
            type="button"
            onclick="changeChapterPage(${currentChapterPage - 1})"
            ${currentChapterPage === 1
                ? 'disabled style="opacity:0.5; cursor:not-allowed;"'
                : ''
            }
            aria-label="Previous Page"
            style="
                background:var(--card-bg);
                color:var(--text-main);
                border:1px solid var(--border-color);
                padding:6px 12px;
                border-radius:8px;
                cursor:pointer;
            "
        >

            <i class="fa-solid fa-chevron-left"></i>

        </button>

    `;


    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {

        paginationHTML += `

            <button
                type="button"
                onclick="changeChapterPage(${i})"
                ${i === currentChapterPage
                    ? 'aria-current="page"'
                    : ''
                }
                style="
                    background:${i === currentChapterPage
                        ? 'var(--primary-purple)'
                        : 'var(--card-bg)'
                    };
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
            type="button"
            onclick="changeChapterPage(${currentChapterPage + 1})"
            ${currentChapterPage === totalPages
                ? 'disabled style="opacity:0.5; cursor:not-allowed;"'
                : ''
            }
            aria-label="Next Page"
            style="
                background:var(--card-bg);
                color:var(--text-main);
                border:1px solid var(--border-color);
                padding:6px 12px;
                border-radius:8px;
                cursor:pointer;
            "
        >

            <i class="fa-solid fa-chevron-right"></i>

        </button>

    `;


    paginationContainer.innerHTML = paginationHTML;

}


// ==========================================
// 6. CHANGE CHAPTER PAGE
// ==========================================

function changeChapterPage(page) {

    const totalPages = Math.ceil(
        chaptersData.length / chaptersPerPage
    ) || 1;

    if (
        page < 1 ||
        page > totalPages
    ) {
        return;
    }

    currentChapterPage = page;

    renderChapters();

}


// ==========================================
// 7. TOGGLE CHAPTER SORTING
// NEWEST / OLDEST
// ==========================================

function toggleChapterSort() {

    isAscending = !isAscending;

    const sortBtn = document.getElementById(
        'sort-btn'
    );

    if (sortBtn) {

        if (isAscending) {

            sortBtn.innerHTML = `
                <i class="fa-solid fa-arrow-up-short-wide"></i>
                Old
            `;

        } else {

            sortBtn.innerHTML = `
                <i class="fa-solid fa-arrow-down-short-wide"></i>
                New
            `;

        }

    }


    chaptersData.reverse();

    currentChapterPage = 1;

    renderChapters();

}


// ==========================================
// 8. CHAPTER AD TRIGGER
// ==========================================

function triggerChapterAd(event, targetUrl) {

    if (typeof triggerInterstitialAd === 'function') {

        triggerInterstitialAd(event, targetUrl);

    }

}
