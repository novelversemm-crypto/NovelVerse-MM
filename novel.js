// ==========================================
// NOVELVERSE - NOVEL DETAILS SYSTEM
// Library + Share + Chapter Management
// Premium / Free Chapter UI
// ==========================================


// ==========================================
// 1. GLOBAL STATE
// ==========================================

let currentNovelId = null;
let currentNovelData = null;
let currentNovelSlug = null;

let chaptersData = [];

let isAscending = false;
let currentChapterPage = 1;

let isNovelSaved = false;
let isLibraryButtonLoading = false;

const chaptersPerPage = 30;


// ==========================================
// 2. INITIALIZE ON DOM LOAD
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(
        window.location.search
    );

    currentNovelId = urlParams.get('id');

    // Global Functions
    window.toggleChapterSort = toggleChapterSort;
    window.triggerChapterAd = triggerChapterAd;
    window.changeChapterPage = changeChapterPage;

    // Novel Action Events
    setupNovelActionListeners();

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
// 3. HELPER FUNCTIONS
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


// Novel Genre ပြရန်

function getNovelGenreText(genre) {

    if (Array.isArray(genre)) {
        return genre.join(', ') || 'General';
    }

    return genre || 'General';

}


// Novel ID / Slug ရယူရန်

function getNovelSlug(novel) {

    return String(
        novel?.slug ||
        novel?.id ||
        currentNovelId ||
        ''
    ).trim();

}


// ==========================================
// PREMIUM CHAPTER CHECK
// ==========================================

// is_premium === true  -> Premium
// is_premium === false -> Free
// is_premium မပါ       -> Free

function isPremiumChapter(chapter) {

    return chapter?.is_premium === true;

}


// Chapter Status UI

function getChapterStatusHTML(chapter) {

    if (isPremiumChapter(chapter)) {

        return `
            <span
                class="chapter-status chapter-status-premium"
                style="
                    display:inline-flex;
                    align-items:center;
                    gap:5px;
                    padding:5px 9px;
                    border-radius:7px;
                    background:rgba(168,85,247,0.13);
                    border:1px solid rgba(168,85,247,0.28);
                    color:#c084fc;
                    font-size:11px;
                    font-weight:700;
                    white-space:nowrap;
                "
            >
                <i class="fa-solid fa-lock"></i>
                Premium
            </span>
        `;

    }


    // Free Chapter
    // is_premium false သို့မဟုတ် property မပါလျှင် Free

    return `
        <span
            class="chapter-status chapter-status-free"
            style="
                display:inline-flex;
                align-items:center;
                gap:5px;
                padding:5px 9px;
                border-radius:7px;
                background:rgba(34,197,94,0.10);
                border:1px solid rgba(34,197,94,0.22);
                color:#4ade80;
                font-size:11px;
                font-weight:700;
                white-space:nowrap;
            "
        >
            <i class="fa-solid fa-book-open"></i>
            Free
        </span>
    `;

}


// ==========================================
// 4. NOVEL SEO
// ==========================================

function updateNovelSEO(novel) {

    const title = novel.title || 'Novel Details';

    const synopsis = novel.synopsis || 'NovelVerse MM';

    const cover = getSafeNovelCover(
        novel.coverUrl || novel.cover
    );

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
// 5. FETCH NOVEL DATA
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


        // Array နှင့် Object Data နှစ်မျိုးလုံး Support

        let novels = [];

        if (Array.isArray(data)) {

            novels = data;

        } else if (
            data &&
            typeof data === 'object' &&
            Array.isArray(data.novels)
        ) {

            novels = data.novels;

        } else if (
            data &&
            typeof data === 'object'
        ) {

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

        const novel = novels.find(n => (

            (
                n.id &&
                String(n.id) === String(novelId)
            ) ||

            (
                n.slug &&
                String(n.slug) === String(novelId)
            )

        ));


        if (!novel) {

            if (headerContainer) {

                headerContainer.innerHTML =
                    '<p>Novel ရှာမတွေ့ပါ။</p>';

            }

            if (listContainer) {

                listContainer.innerHTML =
                    '<p class="empty-msg">စာစဉ်များ မရှိသေးပါ။</p>';

            }

            const countEl = document.getElementById(
                'chapter-count'
            );

            if (countEl) {
                countEl.textContent = '0';
            }

            chaptersData = [];

            renderChapterPagination(0);

            return;

        }


        // Current Novel Data

        currentNovelData = novel;

        currentNovelSlug = getNovelSlug(novel);


        // SEO Update

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
                getNovelGenreText(novel.genre)
            );

            const status = escapeNovelHtml(
                novel.status || 'Ongoing'
            );

            const coverUrl = escapeNovelHtml(
                getSafeNovelCover(
                    novel.coverUrl || novel.cover
                )
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


        // Reset Page

        currentChapterPage = 1;

        renderChapters();


        // Library Button State

        updateNovelLibraryButton();

        checkNovelLibraryStatus();

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

        const countEl = document.getElementById(
            'chapter-count'
        );

        if (countEl) {
            countEl.textContent = '0';
        }

        renderChapterPagination(0);

    }

}


// ==========================================
// 6. NOVEL ACTION EVENT LISTENERS
// ==========================================

function setupNovelActionListeners() {

    const libraryButton = document.getElementById(
        'novel-library-btn'
    );

    const shareButton = document.getElementById(
        'novel-share-btn'
    );


    // Add / Remove Library

    if (
        libraryButton &&
        libraryButton.dataset.ready !== 'true'
    ) {

        libraryButton.dataset.ready = 'true';

        libraryButton.addEventListener(
            'click',
            handleNovelLibraryClick
        );

    }


    // Share Novel

    if (
        shareButton &&
        shareButton.dataset.ready !== 'true'
    ) {

        shareButton.dataset.ready = 'true';

        shareButton.addEventListener(
            'click',
            shareCurrentNovel
        );

    }

}


// ==========================================
// 7. CHECK NOVEL LIBRARY STATUS
// ==========================================

async function checkNovelLibraryStatus() {

    if (!currentNovelSlug) return;

    // Login မဝင်ထားပါက Saved State မစစ်ပါ

    if (
        typeof window.isUserLoggedIn !== 'function' ||
        !window.isUserLoggedIn()
    ) {

        isNovelSaved = false;

        updateNovelLibraryButton();

        return;

    }


    try {

        if (
            typeof window.authApiRequest !== 'function' ||
            typeof window.getAuthSession !== 'function'
        ) {
            return;
        }


        const session = window.getAuthSession();

        if (!session || !session.token) {
            return;
        }


        const result = await window.authApiRequest(
            'getUserLibrary',
            {
                token: session.token
            }
        );


        const libraryData = (

            result.library ||
            result.novels ||
            result.items ||
            []

        );


        if (!Array.isArray(libraryData)) {

            throw new Error(
                'Library Data ပုံစံ မမှန်ပါ။'
            );

        }


        // Saved Novel ID / Slug စစ်ဆေးခြင်း

        isNovelSaved = libraryData.some(item => {

            let savedSlug = '';


            if (typeof item === 'string') {

                savedSlug = item;

            } else if (
                item &&
                typeof item === 'object'
            ) {

                savedSlug = (

                    item.novelSlug ||
                    item.slug ||
                    item.novelId ||
                    item.id ||
                    ''

                );

            }


            return (
                String(savedSlug).trim() ===
                String(currentNovelSlug).trim()
            );

        });


        updateNovelLibraryButton();


    } catch (error) {

        console.error(
            'Check Library Status Error:',
            error
        );

    }

}


// ==========================================
// 8. UPDATE LIBRARY BUTTON UI
// ==========================================

function updateNovelLibraryButton() {

    const button = document.getElementById(
        'novel-library-btn'
    );

    const icon = document.getElementById(
        'novel-library-icon'
    );

    const text = document.getElementById(
        'novel-library-text'
    );


    if (!button) return;


    if (isLibraryButtonLoading) {

        button.disabled = true;

        if (text) {
            text.textContent = 'ခဏစောင့်ပါ...';
        }

        return;

    }


    button.disabled = false;


    if (isNovelSaved) {

        button.setAttribute(
            'aria-pressed',
            'true'
        );

        button.setAttribute(
            'aria-label',
            'Remove from My Library'
        );

        button.setAttribute(
            'title',
            'Remove from My Library'
        );


        if (icon) {

            icon.className =
                'fa-solid fa-bookmark';

        }


        if (text) {

            text.textContent =
                'Library ထဲမှ ဖယ်ရှားရန်';

        }


    } else {

        button.setAttribute(
            'aria-pressed',
            'false'
        );

        button.setAttribute(
            'aria-label',
            'Add to My Library'
        );

        button.setAttribute(
            'title',
            'Add to My Library'
        );


        if (icon) {

            icon.className =
                'fa-regular fa-bookmark';

        }


        if (text) {

            text.textContent =
                'My Library ထဲသိမ်းရန်';

        }

    }

}


// ==========================================
// 9. LIBRARY BUTTON CLICK
// ==========================================

async function handleNovelLibraryClick() {

    if (!currentNovelSlug) {

        alert('Novel ID မတွေ့ပါ။');

        return;

    }


    // Login မဝင်ထားပါက Profile Page သို့ပို့မည်

    if (
        typeof window.isUserLoggedIn !== 'function' ||
        !window.isUserLoggedIn()
    ) {

        window.location.href = 'profile.html';

        return;

    }


    if (isLibraryButtonLoading) return;


    isLibraryButtonLoading = true;

    updateNovelLibraryButton();


    try {

        if (isNovelSaved) {

            // Remove from Library

            const confirmed = confirm(
                'ဒီ Novel ကို Library ထဲမှ ဖယ်ရှားမှာ သေချာပါသလား။'
            );


            if (!confirmed) {

                isLibraryButtonLoading = false;

                updateNovelLibraryButton();

                return;

            }


            const session = window.getAuthSession();

            if (!session || !session.token) {

                throw new Error(
                    'Login Session မတွေ့ပါ။ Login ပြန်ဝင်ပေးပါ။'
                );

            }


            await window.authApiRequest(
                'removeFromLibrary',
                {
                    token: session.token,
                    novelSlug: currentNovelSlug
                }
            );


            isNovelSaved = false;


            alert(
                'Library ထဲမှ ဖယ်ရှားပြီးပါပြီ။'
            );


        } else {

            // Add to Library

            if (
                typeof window.addNovelToLibrary !== 'function'
            ) {

                throw new Error(
                    'Library System မတွေ့ပါ။ library.js ကို စစ်ဆေးပါ။'
                );

            }


            const result = await window.addNovelToLibrary(
                currentNovelSlug
            );


            if (!result || result.success !== true) {

                throw new Error(
                    result?.message ||
                    'Library ထဲသို့ ထည့်၍ မရပါ။'
                );

            }


            isNovelSaved = true;


            alert(
                result.message ||
                'Library ထဲသို့ ထည့်ပြီးပါပြီ။'
            );

        }


    } catch (error) {

        console.error(
            'Novel Library Action Error:',
            error
        );


        alert(
            error.message ||
            'Library ပြောင်းလဲရာတွင် အမှားအယွင်း ရှိပါသည်။'
        );


    } finally {

        isLibraryButtonLoading = false;

        updateNovelLibraryButton();

    }

}


// ==========================================
// 10. SHARE CURRENT NOVEL
// ==========================================

async function shareCurrentNovel() {

    const button = document.getElementById(
        'novel-share-btn'
    );

    if (!currentNovelData) {

        alert('Novel အချက်အလက် မရရှိသေးပါ။');

        return;

    }


    const title = String(
        currentNovelData.title || 'NovelVerse MM'
    );

    const shareUrl = window.location.href;

    const shareText =
        `${title} ကို NovelVerse MM မှာ ဖတ်ရှုလိုက်ပါ။`;


    if (button) {
        button.disabled = true;
    }


    try {

        // Native Share API

        if (navigator.share) {

            try {

                await navigator.share({

                    title: `${title} | NovelVerse MM`,

                    text: shareText,

                    url: shareUrl

                });

                return;

            } catch (error) {

                // User က Share Window ပိတ်လိုက်လျှင်
                // အခြားနည်းလမ်းသို့ မပြောင်းပါ

                if (error.name === 'AbortError') {
                    return;
                }

                throw error;

            }

        }


        // Clipboard API

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                shareUrl
            );

            alert(
                'Novel Link ကို Copy လုပ်ပြီးပါပြီ။'
            );

            return;

        }


        // Clipboard Fallback

        const textArea = document.createElement(
            'textarea'
        );

        textArea.value = shareUrl;

        textArea.style.position = 'fixed';

        textArea.style.left = '-9999px';

        textArea.setAttribute(
            'readonly',
            ''
        );

        document.body.appendChild(textArea);

        textArea.select();

        const copied = document.execCommand('copy');

        textArea.remove();


        if (copied) {

            alert(
                'Novel Link ကို Copy လုပ်ပြီးပါပြီ။'
            );

        } else {

            prompt(
                'ဒီ Link ကို Copy လုပ်ပါ။',
                shareUrl
            );

        }


    } catch (error) {

        console.error(
            'Share Novel Error:',
            error
        );


        prompt(
            'Novel Link ကို Copy လုပ်ပါ။',
            shareUrl
        );


    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


// ==========================================
// 11. RENDER CHAPTERS
// PREMIUM / FREE UI
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


        // Premium / Free Status

        const isPremium = isPremiumChapter(ch);

        const statusHTML = getChapterStatusHTML(ch);


        // Chapter label

        const chapterLabel = escapeNovelHtml(
            chapterNumber
        );


        // Screen reader status

        const statusLabel = isPremium
            ? 'Premium Chapter'
            : 'Free Chapter';


        return `

            <a
                href="${readerUrl}"
                class="chapter-item ${isPremium ? 'premium-chapter-item' : 'free-chapter-item'}"
                aria-label="Chapter ${chapterLabel} - ${statusLabel}"
                onclick="triggerChapterAd(event, this.href)"
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:10px;
                "
            >

                <div
                    class="ch-title"
                    style="
                        flex:1;
                        min-width:0;
                    "
                >

                    <span>
                        Chapter ${chapterLabel}
                        - ${chapterTitle}
                    </span>

                </div>


                <div
                    class="ch-date chapter-status-wrapper"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:flex-end;
                        gap:8px;
                        flex-shrink:0;
                    "
                >

                    ${statusHTML}

                    <i
                        class="fa-solid ${isPremium ? 'fa-lock' : 'fa-chevron-right'}"
                        style="
                            color:${isPremium ? '#c084fc' : 'var(--text-secondary, #aaa)'};
                            font-size:13px;
                        "
                    ></i>

                </div>

            </a>

        `;

    }).join('');


    renderChapterPagination(chaptersData.length);

}


// ==========================================
// 12. CHAPTER PAGINATION
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
// 13. CHANGE CHAPTER PAGE
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
// 14. TOGGLE CHAPTER SORTING
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
// 15. CHAPTER AD TRIGGER
// ==========================================

function triggerChapterAd(event, targetUrl) {

    if (
        typeof triggerInterstitialAd === 'function'
    ) {

        triggerInterstitialAd(
            event,
            targetUrl
        );

    }

}
