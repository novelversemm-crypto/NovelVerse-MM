
// ==========================================
// 🐙 NOVELVERSE DATA CONFIGURATION
// Cloudflare Pages Optimized
// ==========================================

// ==========================================
// 1. NOVEL DATA CACHE
// ==========================================

// novels.json ကို တစ်ကြိမ်သာ Fetch လုပ်ရန်
let novelsDataCache = null;
let novelsDataPromise = null;


// ==========================================
// 2. INITIALIZE ON DOM LOAD
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {

    // Data များကို တစ်ပြိုင်နက်တည်း Load လုပ်မည်
    await Promise.all([
        loadFeaturedHero(),
        loadLatestUpdates(),
        loadPopularNovels(),
        loadContinueReading()
    ]);

});


// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

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


// ==========================================
// 4. FETCH NOVEL DATA
// ==========================================

// Cloudflare Pages ရှိ novels.json မှ Data ဆွဲယူရန်
async function fetchNovelsFromGitHub() {

    // Cache ရှိပြီးသားဆိုရင် ပြန်အသုံးပြုမည်
    if (novelsDataCache !== null) {
        return novelsDataCache;
    }

    // Fetch လုပ်နေဆဲဖြစ်ပါက ထပ်မံ Fetch မလုပ်ပါ
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

            // Data ကို Array ပြောင်းမည်
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

            // Invalid Data များကို ဖယ်ရှားမည်
            novels = novels.filter(novel =>
                novel &&
                typeof novel === 'object'
            );

            // အသစ်ဆုံး Novel များကို ရှေ့ဆုံးထားမည်
            novels.sort((a, b) =>
                getNovelTimestamp(b) - getNovelTimestamp(a)
            );

            // Cache သိမ်းမည်
            novelsDataCache = novels;

            return novels;

        } catch (err) {

            console.error(
                'Error fetching novels data:',
                err
            );

            // နောက်တစ်ကြိမ် ပြန် Fetch လုပ်နိုင်ရန်
            novelsDataPromise = null;

            return [];

        }

    })();

    return novelsDataPromise;

}


// ==========================================
// 5. LOAD FEATURED NOVEL
// HERO BANNER
// ==========================================

async function loadFeaturedHero() {

    try {

        const novels = await fetchNovelsFromGitHub();

        if (novels.length === 0) return;

        const novel = novels[0];

        const heroImg = document.getElementById('hero-img');
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');
        const heroLink = document.getElementById('hero-link');

        const safeImageUrl = getSafeNovelImageUrl(novel.coverUrl);

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


// ==========================================
// 6. LOAD LATEST UPDATES
// NOVEL GRID
// ==========================================

async function loadLatestUpdates() {

    const gridContainer = document.getElementById(
        'latest-updates-grid'
    );

    if (!gridContainer) return;

    try {

        const novels = await fetchNovelsFromGitHub();

        if (novels.length === 0) {

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

        // ပထမဆုံး ၆ အုပ်ကို ပြမည်
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


// ==========================================
// 7. LOAD POPULAR NOVELS
// ==========================================

async function loadPopularNovels() {

    const popularContainer = document.getElementById(
        'popular-list'
    );

    if (!popularContainer) return;

    try {

        const novels = await fetchNovelsFromGitHub();

        if (novels.length === 0) return;

        let htmlContent = '';

        let index = 0;

        // လက်ရှိမူရင်းအတိုင်း ပထမဆုံး ၅ အုပ်ကို ပြမည်
        novels.slice(0, 5).forEach(novel => {

            index++;

            const title = escapeHtml(
                novel.title || 'Untitled'
            );

            const genre = escapeHtml(
                novel.genre || 'Fantasy'
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

                    <span style="
                        font-size:1.1rem;
                        font-weight:700;
                        color:#ffb703;
                        min-width:20px;
                    ">
                        #${index}
                    </span>

                    <img
                        src="${imageUrl}"
                        alt="${title}"
                        style="
                            width:45px;
                            height:60px;
                            object-fit:cover;
                            border-radius:6px;
                        "
                        loading="lazy"
                        decoding="async"
                    >

                    <div style="
                        flex:1;
                        overflow:hidden;
                    ">

                        <h4 style="
                            font-size:0.9rem;
                            font-weight:600;
                            margin:0 0 2px 0;
                            white-space:nowrap;
                            overflow:hidden;
                            text-overflow:ellipsis;
                        ">
                            ${title}
                        </h4>

                        <p style="
                            font-size:0.75rem;
                            color:#a8b3cf;
                            margin:0;
                        ">
                            ${genre}
                            •
                            <span style="color:#2ec1ac;">
                                ${status}
                            </span>
                        </p>

                    </div>

                    <i
                        class="fa-solid fa-chevron-right"
                        style="
                            font-size:0.8rem;
                            color:#666;
                        "
                    ></i>

                </div>

            `;

        });

        popularContainer.innerHTML = htmlContent;

    } catch (err) {

        console.error(
            'Error loading popular novels:',
            err
        );

    }

}


// ==========================================
// 8. LOAD CONTINUE READING
// LOCAL STORAGE
// ==========================================

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


// ==========================================
// 9. NOVEL CARD NAVIGATION
// ==========================================

// Latest နှင့် Popular Novel Card များကို
// Click / Keyboard ဖြင့် ဝင်ရောက်နိုင်ရန်

document.addEventListener('click', event => {

    const card = event.target.closest(
        '[data-novel-url]'
    );

    if (!card) return;

    const url = card.dataset.novelUrl;

    if (url) {

        window.location.href = url;

    }

});


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

    event.preventDefault();

    const url = card.dataset.novelUrl;

    if (url) {

        window.location.href = url;

    }

});
