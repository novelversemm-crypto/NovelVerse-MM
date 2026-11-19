
/* ==========================================
   🐙 NOVELVERSE DATA CONFIGURATION
   Cloudflare Pages Optimized
   ========================================== */


/* ==========================================
   1. NOVEL DATA CACHE
========================================== */

let novelsDataCache = null;
let novelsDataPromise = null;


/* ==========================================
   2. INITIALIZE ON DOM LOAD
========================================== */

document.addEventListener('DOMContentLoaded', async () => {

    await Promise.allSettled([
        loadFeaturedHero(),
        loadLatestUpdates(),
        loadPopularNovels(),
        loadContinueReading()
    ]);

});


/* ==========================================
   3. HELPER FUNCTIONS
========================================== */

// HTML Injection ကာကွယ်ရန်
function escapeHtml(text) {

    return String(text ?? '').replace(/[&<>"']/g, char => {

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


// Novel Image URL ကို စစ်ဆေးရန်
function getSafeNovelImageUrl(url) {

    if (!url) return '';

    try {

        const parsedUrl = new URL(url, window.location.origin);

        if (
            parsedUrl.protocol !== 'https:' &&
            parsedUrl.protocol !== 'http:'
        ) {
            return '';
        }

        return parsedUrl.href;

    } catch (err) {

        return '';

    }

}


// Novel Detail Link တည်ဆောက်ရန်
function getNovelDetailUrl(novel) {

    const novelId = novel.slug || novel.id;

    if (!novelId) return 'search.html';

    return `novel.html?id=${encodeURIComponent(novelId)}`;

}


// Date Sorting Helper
function getNovelTimestamp(novel) {

    const timestamp = new Date(novel.createdAt || 0).getTime();

    return Number.isFinite(timestamp) ? timestamp : 0;

}


// View Count Format
function formatNovelViews(views) {

    const count = Number(views) || 0;

    return count.toLocaleString('en-US');

}


// Novel Slug ရယူရန်
function getNovelSlug(novel) {

    return String(
        novel.slug ||
        novel.id ||
        ''
    ).trim();

}


/* ==========================================
   4. FETCH NOVEL DATA
========================================== */

async function fetchNovelsFromGitHub() {

    // Cache ရှိပြီးသားဆို ပြန်အသုံးပြုမည်
    if (novelsDataCache !== null) {
        return novelsDataCache;
    }

    // Fetch လုပ်နေဆဲဆို ထပ်မံ Fetch မလုပ်ပါ
    if (novelsDataPromise) {
        return novelsDataPromise;
    }

    novelsDataPromise = (async () => {

        try {

            const res = await fetch(
                './content/novels.json?' + Date.now()
            );

            if (!res.ok) {

                throw new Error(
                    `Novel Data Request Failed: ${res.status}`
                );

            }

            const data = await res.json();

            let novels = [];

            // Data Array ဖြစ်ပါက
            if (Array.isArray(data)) {

                novels = data;

            }

            // Data Object ဖြစ်ပါက
            else if (data && typeof data === 'object') {

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

            // Invalid Data များ ဖယ်ရှားမည်
            novels = novels.filter(novel =>
                novel &&
                typeof novel === 'object'
            );

            // Novel အသစ်များကို ရှေ့ဆုံးထားမည်
            novels.sort((a, b) =>
                getNovelTimestamp(b) - getNovelTimestamp(a)
            );

            novelsDataCache = novels;

            return novels;

        } catch (err) {

            console.error(
                'Error fetching novels data:',
                err
            );

            novelsDataPromise = null;

            return [];

        }

    })();

    return novelsDataPromise;

}


/* ==========================================
   5. LOAD FEATURED NOVEL
   HERO BANNER
========================================== */

async function loadFeaturedHero() {

    try {

        const novels = await fetchNovelsFromGitHub();

        if (!novels.length) return;

        const novel = novels[0];

        const heroImg = document.getElementById('hero-img');
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');
        const heroLink = document.getElementById('hero-link');

        const safeImageUrl = getSafeNovelImageUrl(
            novel.coverUrl
        );

        if (heroImg && safeImageUrl) {

            heroImg.src = safeImageUrl;
            heroImg.alt = novel.title || 'Featured Novel';

        }

        if (heroTitle && novel.title) {

            heroTitle.textContent = novel.title;

        }

        if (heroDesc) {

            const synopsis = novel.synopsis || '';

            heroDesc.textContent = synopsis
                ? synopsis.substring(0, 90) +
                    (synopsis.length > 90 ? '...' : '')
                : 'အသေးစိတ် ဖတ်ရှုရန်...';

        }

        if (heroLink) {

            heroLink.href = getNovelDetailUrl(novel);

        }

    } catch (err) {

        console.error(
            'Error loading featured novel:',
            err
        );

    }

}


/* ==========================================
   6. LOAD LATEST UPDATES
   NOVEL GRID
========================================== */

async function loadLatestUpdates() {

    const gridContainer = document.getElementById(
        'latest-updates-grid'
    );

    if (!gridContainer) return;

    try {

        const novels = await fetchNovelsFromGitHub();

        if (!novels.length) {

            gridContainer.innerHTML = `
                <p style="
                    color:#888;
                    font-size:0.85rem;
                    grid-column:1 / -1;
                    text-align:center;
                ">
                    နိုဗယ်များ မရှိသေးပါ။
                </p>
            `;

            return;

        }

        let htmlContent = '';

        // နောက်ဆုံးထွက် Novel ၆ အုပ်
        novels.slice(0, 6).forEach(novel => {

            const title = escapeHtml(
                novel.title || 'Untitled'
            );

            const genre = escapeHtml(
                novel.genre || 'Novel'
            );

            const status = escapeHtml(
                novel.status || 'Ongoing'
            );

            const imageUrl = escapeHtml(
                getSafeNovelImageUrl(novel.coverUrl)
            );

            const novelUrl = escapeHtml(
                getNovelDetailUrl(novel)
            );

            htmlContent += `

                <div
                    class="novel-card"
                    data-novel-url="${novelUrl}"
                    role="link"
                    tabindex="0"
                    aria-label="Read ${title}"
                    style="cursor:pointer;"
                >

                    <div
                        class="card-cover-wrapper"
                        style="
                            position:relative;
                            overflow:hidden;
                            border-radius:8px;
                        "
                    >

                        <img
                            src="${imageUrl}"
                            alt="${title}"
                            style="
                                width:100%;
                                height:160px;
                                object-fit:cover;
                                display:block;
                            "
                            loading="lazy"
                            decoding="async"
                        >

                        <span
                            class="badge"
                            style="
                                position:absolute;
                                top:6px;
                                right:6px;
                                background:#2ec1ac;
                                color:#fff;
                                font-size:10px;
                                padding:2px 6px;
                                border-radius:4px;
                            "
                        >
                            ${status}
                        </span>

                    </div>

                    <div
                        class="card-info"
                        style="padding:6px 2px;"
                    >

                        <h4
                            style="
                                font-size:0.85rem;
                                font-weight:600;
                                margin:4px 0 2px 0;
                                white-space:nowrap;
                                overflow:hidden;
                                text-overflow:ellipsis;
                            "
                        >
                            ${title}
                        </h4>

                        <span
                            style="
                                font-size:0.7rem;
                                color:#a8b3cf;
                            "
                        >
                            ${genre}
                        </span>

                    </div>

                </div>

            `;

        });

        gridContainer.innerHTML = htmlContent;

    } catch (err) {

        console.error(
            'Error loading latest updates:',
            err
        );

        gridContainer.innerHTML = `

            <div style="
                grid-column:1 / -1;
                text-align:center;
                padding:20px;
                color:#ff6b6b;
                font-size:0.85rem;
            ">

                <p style="margin-bottom:8px;">
                    ⚠️ Data ဆွဲယူ၍ မရပါ။
                    (အင်တာနက် သို့မဟုတ် Connection ကို စစ်ဆေးပေးပါ)
                </p>

                <button
                    onclick="location.reload()"
                    style="
                        background:#2ec1ac;
                        color:white;
                        border:none;
                        padding:6px 12px;
                        border-radius:4px;
                        cursor:pointer;
                        font-size:0.75rem;
                    "
                >
                    ပြန်လည် ကြိုးစားမည်
                </button>

            </div>

        `;

    }

}


/* ==========================================
   7. LOAD POPULAR NOVELS
   TOP 6 BY VIEWS
========================================== */

// Backend မှ Views အများဆုံး Novel ၆ အုပ်ရယူရန်
async function fetchPopularNovelsFromBackend() {

    // auth.js API function ရှိမရှိ စစ်မည်
    if (typeof window.authApiRequest !== 'function') {

        throw new Error(
            'authApiRequest() not found. Check auth.js.'
        );

    }

    // Apps Script Backend သို့ Request ပို့မည်
    const result = await window.authApiRequest(
        'getPopularNovels',
        {}
    );

    if (!result || result.success !== true) {

        throw new Error(
            result?.message ||
            result?.error ||
            'Popular Novels API failed.'
        );

    }

    if (!Array.isArray(result.novels)) {

        throw new Error(
            'Invalid Popular Novels response.'
        );

    }

    return result.novels;

}


// Backend Views Data နှင့် novels.json Data တွဲရန်
function matchPopularNovels(popularData, allNovels) {

    // Slug အလိုက် Novel ရှာရန် Map
    const novelMap = new Map();

    allNovels.forEach(novel => {

        const slug = getNovelSlug(novel);

        if (slug) {

            novelMap.set(slug, novel);

        }

    });

    // Backend မှ Rank အလိုက် Novel ပြန်တည်ဆောက်မည်
    return popularData

        .sort((a, b) =>
            Number(a.rank || 999) -
            Number(b.rank || 999)
        )

        .map(item => {

            const slug = String(
                item.slug || ''
            ).trim();

            const novel = novelMap.get(slug);

            if (!novel) return null;

            return {
                ...novel,
                popularRank: Number(item.rank) || 0,
                viewCount: Number(item.views) || 0
            };

        })

        .filter(Boolean)

        .slice(0, 6);

}


// Popular Novels UI
function renderPopularNovels(novels) {

    const popularContainer = document.getElementById(
        'popular-list'
    );

    if (!popularContainer) return;

    if (!novels || novels.length === 0) {

        popularContainer.innerHTML = `
            <div style="
                text-align:center;
                padding:20px;
                color:#888;
                font-size:0.85rem;
            ">
                လက်ရှိ လူကြိုက်များသော Novel မရှိသေးပါ။
            </div>
        `;

        return;

    }

    let htmlContent = '';

    novels.forEach(novel => {

        const rank = Number(
            novel.popularRank || 0
        );

        const title = escapeHtml(
            novel.title || 'Untitled'
        );

        const genre = escapeHtml(
            novel.genre || 'Novel'
        );

        const status = escapeHtml(
            novel.status || 'Ongoing'
        );

        const views = formatNovelViews(
            novel.viewCount
        );

        const imageUrl = escapeHtml(
            getSafeNovelImageUrl(novel.coverUrl)
        );

        const novelUrl = escapeHtml(
            getNovelDetailUrl(novel)
        );

        htmlContent += `

            <div
                class="popular-item"
                data-novel-url="${novelUrl}"
                role="link"
                tabindex="0"
                aria-label="Read ${title}"
                style="
                    display:flex;
                    align-items:center;
                    gap:12px;
                    margin-bottom:12px;
                    cursor:pointer;
                "
            >

                <!-- Rank -->
                <span style="
                    font-size:1.1rem;
                    font-weight:700;
                    color:#ffb703;
                    min-width:24px;
                    text-align:center;
                ">
                    #${rank}
                </span>

                <!-- Cover -->
                <img
                    src="${imageUrl}"
                    alt="${title}"
                    style="
                        width:45px;
                        height:60px;
                        object-fit:cover;
                        border-radius:6px;
                        flex-shrink:0;
                    "
                    loading="lazy"
                    decoding="async"
                >

                <!-- Novel Information -->
                <div style="
                    flex:1;
                    overflow:hidden;
                    min-width:0;
                ">

                    <h4 style="
                        font-size:0.9rem;
                        font-weight:600;
                        margin:0 0 3px 0;
                        white-space:nowrap;
                        overflow:hidden;
                        text-overflow:ellipsis;
                    ">
                        ${title}
                    </h4>

                    <p style="
                        font-size:0.75rem;
                        color:#a8b3cf;
                        margin:0 0 4px 0;
                        white-space:nowrap;
                        overflow:hidden;
                        text-overflow:ellipsis;
                    ">
                        ${genre}
                        •
                        <span style="color:#2ec1ac;">
                            ${status}
                        </span>
                    </p>

                    <!-- View Count -->
                    <span style="
                        font-size:0.72rem;
                        color:#999;
                        display:inline-flex;
                        align-items:center;
                        gap:5px;
                    ">
                        <i class="fa-solid fa-eye"></i>
                        ${views} Views
                    </span>

                </div>

                <!-- Arrow -->
                <i
                    class="fa-solid fa-chevron-right"
                    style="
                        font-size:0.8rem;
                        color:#666;
                        flex-shrink:0;
                    "
                ></i>

            </div>

        `;

    });

    popularContainer.innerHTML = htmlContent;

}


// Popular Novels အားလုံး Load လုပ်ရန်
async function loadPopularNovels() {

    const popularContainer = document.getElementById(
        'popular-list'
    );

    if (!popularContainer) return;

    try {

        // novels.json နှင့် Backend Views ကို တစ်ပြိုင်နက် ရယူမည်
        const [allNovels, popularData] = await Promise.all([
            fetchNovelsFromGitHub(),
            fetchPopularNovelsFromBackend()
        ]);

        if (!allNovels.length) {

            renderPopularNovels([]);

            return;

        }

        // Slug ဖြင့် Novel နှင့် View Count တွဲမည်
        const popularNovels = matchPopularNovels(
            popularData,
            allNovels
        );

        // Top 6 UI ပြမည်
        renderPopularNovels(popularNovels);

    } catch (err) {

        console.error(
            'Error loading popular novels:',
            err
        );

        // Backend မရပါက Latest Novels အစားမပြပါ
        // Popular data မရသောအခါ မှားယွင်းသည့် Rank မပြရန်
        popularContainer.innerHTML = `
            <div style="
                text-align:center;
                padding:20px;
                color:#888;
                font-size:0.85rem;
            ">
                <i class="fa-solid fa-circle-exclamation"
                   style="display:block;font-size:1.3rem;margin-bottom:8px;color:#e0a34c;">
                </i>
                လူကြိုက်များသော Novel များကို
                ယခုအချိန်တွင် ရယူ၍မရပါ။
            </div>
        `;

    }

}


/* ==========================================
   8. LOAD CONTINUE READING
   LOCAL STORAGE
========================================== */

function loadContinueReading() {

    const continueSection = document.getElementById(
        'continue-reading-section'
    );

    const continueCard = document.getElementById(
        'continue-card'
    );

    if (!continueSection || !continueCard) return;

    try {

        const savedData = localStorage.getItem(
            'novelverse_last_read'
        );

        if (!savedData) {

            continueSection.style.display = 'none';

            return;

        }

        const lastRead = JSON.parse(savedData);

        if (
            !lastRead ||
            !lastRead.novelId
        ) {

            continueSection.style.display = 'none';

            return;

        }

        const novelTitle = escapeHtml(
            lastRead.novelTitle || 'Untitled'
        );

        const chapterNumber = escapeHtml(
            lastRead.chapterNumber || ''
        );

        const novelId = encodeURIComponent(
            String(lastRead.novelId)
        );

        const chapterId = encodeURIComponent(
            String(lastRead.chapterId || '')
        );

        const readerUrl =
            `reader.html?id=${chapterId}` +
            `&novel_id=${novelId}` +
            `&chapter=${encodeURIComponent(
                String(lastRead.chapterNumber || '')
            )}`;

        continueSection.style.display = 'block';

        continueCard.innerHTML = `

            <div style="
                display:flex;
                align-items:center;
                justify-content:space-between;
                background:rgba(255,255,255,0.05);
                padding:10px 14px;
                border-radius:10px;
                border:1px solid rgba(255,255,255,0.08);
            ">

                <div style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                ">

                    <i
                        class="fa-solid fa-book-bookmark"
                        style="
                            font-size:1.2rem;
                            color:#2ec1ac;
                        "
                    ></i>

                    <div>

                        <h4 style="
                            font-size:0.85rem;
                            margin:0;
                            font-weight:600;
                        ">
                            ${novelTitle}
                        </h4>

                        <span style="
                            font-size:0.75rem;
                            color:#a8b3cf;
                        ">
                            Chapter ${chapterNumber}
                        </span>

                    </div>

                </div>

                <a
                    href="${escapeHtml(readerUrl)}"
                    class="btn-primary"
                    style="
                        padding:6px 12px;
                        font-size:0.75rem;
                        border-radius:6px;
                        text-decoration:none;
                    "
                >
                    ဆက်ဖတ်မည်
                </a>

            </div>

        `;

    } catch (err) {

        console.error(
            'Error loading continue reading:',
            err
        );

        continueSection.style.display = 'none';

        continueCard.innerHTML = '';

    }

}


/* ==========================================
   9. NOVEL CARD NAVIGATION
   CLICK / KEYBOARD
========================================== */

// Click ဖြင့် Novel Card ဝင်ရန်
document.addEventListener('click', event => {

    const card = event.target.closest(
        '[data-novel-url]'
    );

    if (!card) return;

    // Button သို့မဟုတ် Link အတွင်း Click ဖြစ်ပါက
    if (
        event.target.closest('a,button')
    ) {
        return;
    }

    const url = card.dataset.novelUrl;

    if (url) {

        window.location.href = url;

    }

});


// Keyboard ဖြင့် Novel Card ဝင်ရန်
document.addEventListener('keydown', event => {

    if (
        event.key !== 'Enter' &&
        event.key !== ' '
    ) {
        return;
    }

    const card = event.target.closest(
        '[data-novel-url]'
    );

    if (!card) return;

    // Link သို့မဟုတ် Button ကို မနှောင့်ယှက်ရန်
    if (
        event.target.closest('a,button')
    ) {
        return;
    }

    event.preventDefault();

    const url = card.dataset.novelUrl;

    if (url) {

        window.location.href = url;

    }

});
