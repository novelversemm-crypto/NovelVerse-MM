
let currentChapterId = null;
let currentNovelIdParam = null;
let currentChapterData = null;
let currentNovelData = null;
let currentFontSize = 15;

const CHAPTER_UNLOCK_COST = 1;

let isUnlockingChapter = false;


// ==================================================
// INITIALIZATION
// ==================================================

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);

    currentChapterId = urlParams.get('id');
    currentNovelIdParam = urlParams.get('novel_id') || urlParams.get('novel');

    window.navigateToChapter = navigateToChapter;
    window.changeFontSize = changeFontSize;

    hidePremiumPanel();

    if (currentChapterId) {
        fetchChapterContent(currentChapterId, currentNovelIdParam);
    } else {
        showReaderMessage('စာစဉ် မရှိပါ။');
    }

});


// ==================================================
// HELPER FUNCTIONS
// ==================================================

function getElement(id) {
    return document.getElementById(id);
}


function showReaderMessage(message) {

    const contentBox = getElement('chapter-content');

    if (contentBox) {
        contentBox.style.display = 'block';
        contentBox.textContent = message;
    }

}


function isPremiumChapter(chapter) {

    // is_premium မပါလျှင် Free Chapter ဖြစ်သည်။
    return chapter?.is_premium === true;

}


function getReaderSession() {

    if (typeof window.getAuthSession !== 'function') {
        return null;
    }

    return window.getAuthSession();

}


function getReaderToken() {

    const session = getReaderSession();

    return session?.token || null;

}


async function callReaderApi(action, data = {}) {

    if (typeof window.authApiRequest !== 'function') {
        throw new Error('Authentication API ကို မချိတ်ဆက်ရသေးပါ။');
    }

    return await window.authApiRequest(action, data);

}


function hidePremiumPanel() {

    document.querySelectorAll(
        '.chapter-lock-section, #chapter-lock-section, #premium-lock-panel'
    ).forEach(panel => {
        panel.style.display = 'none';
    });

    const contentBox = getElement('chapter-content');

    if (contentBox) {
        contentBox.style.display = 'block';
    }

}


function showPremiumPanel(chapter, message = '') {

    const contentBox = getElement('chapter-content');

    if (contentBox) {
        contentBox.style.display = 'none';
        contentBox.innerHTML = '';
    }

    let panel = document.querySelector(
        '.chapter-lock-section, #chapter-lock-section, #premium-lock-panel'
    );

    if (!panel) {

        panel = document.createElement('section');

        panel.id = 'premium-lock-panel';
        panel.className = 'chapter-lock-section';

        if (contentBox?.parentNode) {
            contentBox.parentNode.insertBefore(panel, contentBox);
        }

    }

    panel.style.display = 'block';

    panel.innerHTML = `
        <div class="premium-lock-card">

            <div class="premium-lock-icon">
                <i class="fa-solid fa-lock"></i>
            </div>

            <h2>Premium Chapter</h2>

            <p>
                ဒီ Chapter ကို ဖတ်ရှုရန် Unlock လုပ်ပေးပါ။
            </p>

            <div class="premium-lock-price">
                <i class="fa-solid fa-coins"></i>
                <strong>${CHAPTER_UNLOCK_COST} Coin</strong>
            </div>

            <p id="reader-unlock-message" class="reader-unlock-message"></p>

            <button
                type="button"
                id="reader-unlock-btn"
                class="primary-btn"
            >
                <i class="fa-solid fa-unlock"></i>
                Unlock Chapter
            </button>

        </div>
    `;

    const messageBox = getElement('reader-unlock-message');

    if (messageBox) {
        messageBox.textContent = message;
    }

    const unlockButton = getElement('reader-unlock-btn');

    if (unlockButton) {

        unlockButton.addEventListener('click', () => {
            requestChapterUnlock();
        });

    }

}


function setUnlockMessage(message) {

    const messageBox = getElement('reader-unlock-message');

    if (messageBox) {
        messageBox.textContent = message;
    }

}


// ==================================================
// FETCH CHAPTER DATA
// ==================================================

async function fetchChapterContent(chapterId, novelId) {

    try {

        const response = await fetch(
            'content/novels.json?' + Date.now(),
            { cache: 'no-store' }
        );

        if (!response.ok) {
            throw new Error('Novel data could not be loaded.');
        }

        const data = await response.json();

        const novels = Array.isArray(data)
            ? data
            : Object.values(data);

        let foundChapter = null;
        let foundNovel = null;


        // 1. URL ထဲက Novel ID / Slug နဲ့ အရင်ရှာမည်

        if (novelId) {

            foundNovel = novels.find(n =>

                String(n.id) === String(novelId) ||
                String(n.slug) === String(novelId) ||
                (
                    n.title &&
                    n.title.toLowerCase() === String(novelId).toLowerCase()
                )

            );

            if (foundNovel && Array.isArray(foundNovel.chapters)) {

                foundChapter = foundNovel.chapters.find(c =>

                    String(c.chapter_number) === String(chapterId) ||
                    String(c.file) === String(chapterId) ||
                    String(c.id) === String(chapterId)

                );

            }

        }


        // 2. မတွေ့ပါက အခြား Novel များထဲမှာ ရှာမည်

        if (!foundChapter) {

            for (const novel of novels) {

                if (!Array.isArray(novel.chapters)) continue;

                const chapter = novel.chapters.find(c =>

                    String(c.chapter_number) === String(chapterId) ||
                    String(c.file) === String(chapterId) ||
                    String(c.id) === String(chapterId)

                );

                if (chapter) {

                    foundChapter = chapter;
                    foundNovel = novel;

                    break;

                }

            }

        }


        // 3. Chapter မတွေ့ပါက

        if (!foundChapter || !foundNovel) {

            showReaderMessage('စာစဉ် ရှာမတွေ့ပါ။');

            return;

        }


        currentChapterData = foundChapter;
        currentNovelData = foundNovel;


        // 4. Chapter Title

        const headerTitle = getElement('reader-header-title');
        const chapterTitle = getElement('chapter-title');

        if (headerTitle) {
            headerTitle.textContent =
                `Chapter ${foundChapter.chapter_number}`;
        }

        if (chapterTitle) {
            chapterTitle.textContent =
                `Chapter ${foundChapter.chapter_number} - ${foundChapter.title || ''}`;
        }


        // 5. Novel Links

        const detailsBtn = getElement('novel-details-btn');
        const backBtn = getElement('back-to-novel-btn');

        const activeNovelId = foundNovel.slug || foundNovel.id;

        if (detailsBtn) {
            detailsBtn.href =
                `novel.html?id=${encodeURIComponent(activeNovelId)}`;
        }

        if (backBtn) {
            backBtn.href =
                `novel.html?id=${encodeURIComponent(activeNovelId)}`;
        }


        // 6. Previous / Next Navigation

        setupNavigationButtons(
            foundNovel,
            foundChapter.chapter_number
        );


        // 7. Free / Premium စစ်ဆေးခြင်း

        if (isPremiumChapter(foundChapter)) {

            await checkPremiumChapterAccess(foundChapter);

        } else {

            // is_premium မပါလျှင် သို့မဟုတ် false ဖြစ်လျှင် Free

            hidePremiumPanel();

            await loadChapterMarkdown(foundChapter);

        }


    } catch (error) {

        console.error('Fetch chapter content error:', error);

        showReaderMessage(
            'အချက်အလက်များ ရယူရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။'
        );

    }

}


// ==================================================
// CHECK PREMIUM CHAPTER ACCESS
// ==================================================

async function checkPremiumChapterAccess(chapter) {

    const token = getReaderToken();

    // Login မဝင်ရသေးလျှင် Unlock Panel ပြမည်။

    if (!token) {

        showPremiumPanel(
            chapter,
            'Unlock လုပ်ရန် အကောင့်ဝင်ထားရန် လိုအပ်ပါသည်။'
        );

        return;

    }


    showPremiumPanel(
        chapter,
        'Chapter ဖတ်ခွင့် ရှိမရှိ စစ်ဆေးနေသည်...'
    );

    const unlockButton = getElement('reader-unlock-btn');

    if (unlockButton) {
        unlockButton.disabled = true;
    }


    try {

        const result = await callReaderApi(
            'checkChapterAccess',
            {
                token: token,
                novelSlug: currentNovelData.slug,
                chapterNumber: Number(chapter.chapter_number)
            }
        );


        if (!result || result.success !== true) {

            throw new Error(
                result?.message || 'Chapter Access စစ်ဆေး၍ မရပါ။'
            );

        }


        // Backend က Free ဖြစ်ကြောင်း ပြန်ပေးလျှင် ဖတ်ခွင့်ပေးမည်။

        if (result.isPremium === false || result.hasAccess === true) {

            hidePremiumPanel();

            await loadChapterMarkdown(chapter);

            return;

        }


        // Premium ဖြစ်ပြီး Unlock မလုပ်ရသေးပါက Lock Panel ပြမည်။

        showPremiumPanel(
            chapter,
            'ဒီ Chapter ကို ဖတ်ရန် Unlock လုပ်ပေးပါ။'
        );

    } catch (error) {

        console.error('Chapter access check error:', error);

        showPremiumPanel(
            chapter,
            error.message || 'Chapter Access စစ်ဆေးရာတွင် အမှားဖြစ်နေပါသည်။'
        );

    }

}


// ==================================================
// LOAD MARKDOWN CONTENT
// ==================================================

async function loadChapterMarkdown(chapter) {

    const contentBox = getElement('chapter-content');

    if (!contentBox) return;

    if (!chapter.file) {

        showReaderMessage('စာသား မရှိပါ။');

        return;

    }

    contentBox.style.display = 'block';
    contentBox.textContent = 'စာစဉ်ကို ရယူနေသည်...';

    let filePath = chapter.file;


    // Markdown File Path ပြင်ဆင်ခြင်း

    if (!/^https?:\/\//i.test(filePath)) {

        if (
            !filePath.startsWith('./') &&
            !filePath.startsWith('content/')
        ) {

            filePath = './content/' + filePath;

        } else if (filePath.startsWith('content/')) {

            filePath = './' + filePath;

        }

    }


    try {

        const separator = filePath.includes('?') ? '&' : '?';

        const mdRes = await fetch(
            filePath + separator + 't=' + Date.now(),
            { cache: 'no-store' }
        );

        if (!mdRes.ok) {
            throw new Error('Markdown file could not be loaded.');
        }

        const mdText = await mdRes.text();


        // Frontmatter ကို အစပိုင်းမှာရှိမှသာ ဖယ်ရှားမည်။

        let cleanText = mdText.replace(
            /^---\s*\r?\n[\s\S]*?\r?\n---\s*(?:\r?\n|$)/,
            ''
        );


        // Paragraph များကို DOM နဲ့ ပြသမည်။

        contentBox.innerHTML = '';

        const paragraphs = cleanText
            .split(/\r?\n/)
            .filter(paragraph => paragraph.trim() !== '');

        if (paragraphs.length === 0) {

            contentBox.textContent = 'စာသား မရှိပါ။';

        } else {

            paragraphs.forEach(paragraph => {

                const p = document.createElement('p');

                p.textContent = paragraph.trim();

                contentBox.appendChild(p);

            });

        }

        contentBox.style.fontSize = `${currentFontSize}px`;

        hidePremiumPanel();

    } catch (error) {

        console.error('Markdown loading error:', error);

        showReaderMessage(
            'စာသားဖိုင် (Markdown File) ကို ဖတ်၍ မရပါ။ လမ်းကြောင်း မှန်မမှန် စစ်ဆေးပါ။'
        );

    }

}


// ==================================================
// PREMIUM CHAPTER UNLOCK
// ==================================================

async function requestChapterUnlock() {

    if (!currentChapterData || !currentNovelData) {
        return;
    }

    if (isUnlockingChapter) {
        return;
    }

    const token = getReaderToken();

    // Login မဝင်ထားလျှင် Unlock မလုပ်နိုင်ပါ။

    if (!token) {

        alert('Chapter Unlock လုပ်ရန် အကောင့်ဝင်ထားပါ။');

        return;

    }

    const unlockButton = getElement('reader-unlock-btn');

    isUnlockingChapter = true;

    if (unlockButton) {
        unlockButton.disabled = true;
        unlockButton.textContent = 'Unlock လုပ်နေသည်...';
    }

    setUnlockMessage('Coin Balance နှင့် Chapter ကို စစ်ဆေးနေသည်...');


    try {

        const result = await callReaderApi(
            'unlockChapter',
            {
                token: token,
                novelSlug: currentNovelData.slug,
                chapterNumber: Number(currentChapterData.chapter_number)
            }
        );


        if (!result || result.success !== true) {

            throw new Error(
                result?.message || 'Unlock မအောင်မြင်ပါ။'
            );

        }


        // Unlock အောင်မြင်ပြီးမှ Coin Balance ပြန် Update လုပ်မည်။

        try {

            if (typeof window.loadCurrentUserProfile === 'function') {

                await window.loadCurrentUserProfile();

            } else if (typeof window.loadCoinBalance === 'function') {

                await window.loadCoinBalance();

            }

        } catch (balanceError) {

            console.error(
                'Coin balance refresh error:',
                balanceError
            );

        }


        // Backend က အောင်မြင်ကြောင်း ပြန်ပေးပြီးမှ စာသားဖတ်ခွင့်ပေးမည်။

        hidePremiumPanel();

        await loadChapterMarkdown(currentChapterData);


    } catch (error) {

        console.error('Chapter unlock error:', error);

        setUnlockMessage(
            error.message || 'Unlock လုပ်ရာတွင် အမှားဖြစ်နေပါသည်။'
        );

        if (unlockButton) {

            unlockButton.disabled = false;

            unlockButton.innerHTML =
                '<i class="fa-solid fa-unlock"></i> Unlock Chapter';

        }

    } finally {

        isUnlockingChapter = false;

    }

}


// ==================================================
// FONT SIZE CONTROL
// ==================================================

function changeFontSize(delta) {

    currentFontSize += delta;

    if (currentFontSize < 12) {
        currentFontSize = 12;
    }

    if (currentFontSize > 28) {
        currentFontSize = 28;
    }

    const contentBox = getElement('chapter-content');

    if (contentBox) {
        contentBox.style.fontSize = `${currentFontSize}px`;
    }

}


// ==================================================
// PREVIOUS / NEXT CHAPTER
// ==================================================

function setupNavigationButtons(novel, currentChapterNum) {

    const prevBtn = getElement('prev-ch-btn');
    const nextBtn = getElement('next-ch-btn');

    if (!Array.isArray(novel.chapters)) return;

    const chapters = novel.chapters;

    const currentIndex = chapters.findIndex(c =>
        String(c.chapter_number) === String(currentChapterNum)
    );


    // Previous Chapter

    if (prevBtn) {

        if (currentIndex > 0) {

            const prevCh = chapters[currentIndex - 1];

            prevBtn.disabled = false;
            prevBtn.dataset.targetId = prevCh.chapter_number;
            prevBtn.style.opacity = '1';

        } else {

            prevBtn.disabled = true;
            prevBtn.style.opacity = '0.4';

            prevBtn.removeAttribute('data-target-id');

        }

    }


    // Next Chapter

    if (nextBtn) {

        if (
            currentIndex !== -1 &&
            currentIndex < chapters.length - 1
        ) {

            const nextCh = chapters[currentIndex + 1];

            nextBtn.disabled = false;
            nextBtn.dataset.targetId = nextCh.chapter_number;
            nextBtn.style.opacity = '1';

        } else {

            nextBtn.disabled = true;
            nextBtn.style.opacity = '0.4';

            nextBtn.removeAttribute('data-target-id');

        }

    }

}


// ==================================================
// NAVIGATION
// ==================================================

function navigateToChapter(type, event) {

    const btn = type === 'prev'
        ? getElement('prev-ch-btn')
        : getElement('next-ch-btn');

    const targetId = btn ? btn.dataset.targetId : null;

    if (!targetId) return;

    const novelId =
        currentNovelData?.slug ||
        currentNovelData?.id ||
        currentNovelIdParam;

    let targetUrl =
        `reader.html?id=${encodeURIComponent(targetId)}`;

    if (novelId) {

        targetUrl +=
            `&novel_id=${encodeURIComponent(novelId)}`;

    }

    if (typeof triggerInterstitialAd === 'function') {

        triggerInterstitialAd(event, targetUrl);

    } else {

        window.location.href = targetUrl;

    }

}
