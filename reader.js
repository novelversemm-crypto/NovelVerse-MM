
let currentChapterId = null;
let currentNovelIdParam = null;
let currentChapterData = null;
let currentNovelData = null;
let currentFontSize = 15;

const CHAPTER_UNLOCK_COST = 1;

// ==================================================
// INITIALIZATION
// ==================================================

document.addEventListener('DOMContentLoaded', () => {

    const urlParams = new URLSearchParams(window.location.search);

    currentChapterId = urlParams.get('id');
    currentNovelIdParam = urlParams.get('novel_id') || urlParams.get('novel');

    window.navigateToChapter = navigateToChapter;
    window.changeFontSize = changeFontSize;

    // အရင် Lock Panel ရှိနေလျှင် စစချင်းဖျောက်ထားမည်
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
    // is_premium မပါလျှင် Free
    return chapter.is_premium === true;
}

function hidePremiumPanel() {

    // ယခင် HTML ထဲက Lock Panel ရှိပါက ဖျောက်မည်
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

function showPremiumPanel(chapter) {

    const contentBox = getElement('chapter-content');

    if (contentBox) {
        contentBox.style.display = 'none';
        contentBox.innerHTML = '';
    }

    // HTML ထဲတွင် မူရင်း Lock Panel ရှိပါက အသုံးပြုမည်
    let panel = document.querySelector(
        '.chapter-lock-section, #chapter-lock-section, #premium-lock-panel'
    );

    // မရှိပါက Reader JS ကနေ ဖန်တီးမည်
    if (!panel) {

        panel = document.createElement('section');

        panel.id = 'premium-lock-panel';
        panel.className = 'chapter-lock-section';

        if (contentBox) {
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

    const unlockButton = getElement('reader-unlock-btn');

    if (unlockButton) {

        unlockButton.addEventListener('click', () => {

            requestChapterUnlock();

        });

    }

}


// ==================================================
// FETCH CHAPTER DATA
// ==================================================

async function fetchChapterContent(chapterId, novelId) {

    try {

        const response = await fetch(
            'content/novels.json?' + Date.now()
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


        // 1. သက်ဆိုင်ရာ Novel ထဲမှာ အရင်ရှာမည်

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
            headerTitle.innerText =
                `Chapter ${foundChapter.chapter_number}`;
        }

        if (chapterTitle) {
            chapterTitle.innerText =
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


        // 6. Free / Premium စစ်ဆေးခြင်း

        if (isPremiumChapter(foundChapter)) {

            // Premium Chapter ဖြစ်လျှင် Lock Panel ပြမည်
            // Markdown ဖိုင်ကို ဒီနေရာမှာ မဆွဲယူပါ။

            showPremiumPanel(foundChapter);

        } else {

            // Free Chapter ဖြစ်လျှင် Lock Panel ဖျောက်မည်

            hidePremiumPanel();

            await loadChapterMarkdown(foundChapter);

        }


        // 7. Navigation Buttons

        setupNavigationButtons(
            foundNovel,
            foundChapter.chapter_number
        );


    } catch (error) {

        console.error('Fetch chapter content error:', error);

        showReaderMessage(
            'အချက်အလက်များ ရယူရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။'
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

    if (
        !filePath.startsWith('./') &&
        !filePath.startsWith('content/')
    ) {

        filePath = './content/' + filePath;

    } else if (filePath.startsWith('content/')) {

        filePath = './' + filePath;

    }


    try {

        const mdRes = await fetch(
            filePath + '?' + Date.now()
        );

        if (!mdRes.ok) {

            throw new Error('Markdown file could not be loaded.');

        }

        const mdText = await mdRes.text();

        // Frontmatter ဖယ်ထုတ်ခြင်း

        let cleanText = mdText;

        if (mdText.startsWith('---')) {

            const parts = mdText.split('---');

            if (parts.length >= 3) {
                cleanText = parts.slice(2).join('---');
            }

        }


        // Paragraph များ ပြသခြင်း

        const formattedContent = cleanText
            .split('\n')
            .filter(paragraph => paragraph.trim() !== '')
            .map(paragraph => {

                const p = document.createElement('p');

                p.textContent = paragraph.trim();

                return p.outerHTML;

            })
            .join('');

        contentBox.style.fontSize = `${currentFontSize}px`;

        contentBox.innerHTML =
            formattedContent || '<p>စာသား မရှိပါ။</p>';


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

    const unlockButton = getElement('reader-unlock-btn');

    if (unlockButton) {
        unlockButton.disabled = true;
        unlockButton.textContent = 'စစ်ဆေးနေသည်...';
    }

    try {

        // Backend Unlock Function ရှိမှသာ ဆက်လုပ်မည်
        if (typeof window.unlockChapter !== 'function') {

            alert(
                'Chapter Unlock Backend ကို မချိတ်ဆက်ရသေးပါ။'
            );

            if (unlockButton) {
                unlockButton.disabled = false;
                unlockButton.innerHTML =
                    '<i class="fa-solid fa-unlock"></i> Unlock Chapter';
            }

            return;

        }

        const result = await window.unlockChapter({

            novelId: currentNovelData.id || currentNovelData.slug,

            chapterId:
                currentChapterData.id ||
                currentChapterData.chapter_number,

            chapterNumber: currentChapterData.chapter_number,

            cost: CHAPTER_UNLOCK_COST

        });

        if (!result || result.success !== true) {

            throw new Error(
                result?.message || 'Unlock မအောင်မြင်ပါ။'
            );

        }

        // Backend က အောင်မြင်ကြောင်း ပြန်ပေးပြီးမှ
        // Chapter စာသားကို ဖတ်ခွင့်ပေးမည်

        hidePremiumPanel();

        await loadChapterMarkdown(currentChapterData);

    } catch (error) {

        console.error('Chapter unlock error:', error);

        alert(error.message || 'Unlock လုပ်ရာတွင် အမှားဖြစ်နေပါသည်။');

        if (unlockButton) {

            unlockButton.disabled = false;

            unlockButton.innerHTML =
                '<i class="fa-solid fa-unlock"></i> Unlock Chapter';

        }

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


    // Previous

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


    // Next

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
