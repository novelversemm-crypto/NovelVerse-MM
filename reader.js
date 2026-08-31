let currentChapterId = null;
let currentNovelIdParam = null;
let currentChapterData = null;
let currentFontSize = 15;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentChapterId = urlParams.get('id');
    currentNovelIdParam = urlParams.get('novel_id') || urlParams.get('novel');

    // Global Window တွင် ချိတ်ဆက်ပေးခြင်း
    window.navigateToChapter = navigateToChapter;
    window.changeFontSize = changeFontSize;

    if (currentChapterId) {
        fetchChapterContent(currentChapterId, currentNovelIdParam);
    } else {
        const contentBox = document.getElementById('chapter-content');
        if (contentBox) contentBox.innerHTML = '<p style="text-align:center;">စာစဉ် မရှိပါ။</p>';
    }
});

async function fetchChapterContent(chapterId, novelId) {
    try {
        const response = await fetch('content/novels.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        let novels = Array.isArray(data) ? data : Object.values(data);
        
        let foundChapter = null;
        let foundNovel = null;

        // ၁။ novel_id ပါလာပါက သက်ဆိုင်ရာ ဇာတ်လမ်းကို ဦးစားပေးရှာမည်
        if (novelId) {
            foundNovel = novels.find(n => 
                String(n.id) === String(novelId) || 
                String(n.slug) === String(novelId) || 
                (n.title && n.title.toLowerCase() === String(novelId).toLowerCase())
            );
            if (foundNovel && foundNovel.chapters && Array.isArray(foundNovel.chapters)) {
                foundChapter = foundNovel.chapters.find(c => 
                    String(c.chapter_number) === String(chapterId) || 
                    String(c.file) === String(chapterId) || 
                    String(c.id) === String(chapterId)
                );
            }
        }

        // ၂။ novel_id မပါ (သို့) ရှာမတွေ့ပါက အခြား Novel များထဲမှ လိုက်လံရှာဖွေမည်
        if (!foundChapter) {
            for (let novel of novels) {
                if (novel.chapters && Array.isArray(novel.chapters)) {
                    const ch = novel.chapters.find(c => 
                        String(c.chapter_number) === String(chapterId) || 
                        String(c.file) === String(chapterId) || 
                        String(c.id) === String(chapterId)
                    );
                    if (ch) {
                        foundChapter = ch;
                        foundNovel = novel;
                        break;
                    }
                }
            }
        }

        if (!foundChapter || !foundNovel) {
            document.getElementById('chapter-content').innerHTML = '<p style="text-align:center;">စာစဉ် ရှာမတွေ့ပါ။</p>';
            return;
        }

        currentChapterData = foundChapter;

        const headerTitle = document.getElementById('reader-header-title');
        const chapterTitle = document.getElementById('chapter-title');
        
        if (headerTitle) headerTitle.innerText = `Chapter ${foundChapter.chapter_number}`;
        if (chapterTitle) chapterTitle.innerText = `Chapter ${foundChapter.chapter_number} - ${foundChapter.title || ''}`;
        
        const detailsBtn = document.getElementById('novel-details-btn');
        const backBtn = document.getElementById('back-to-novel-btn');
        
        const activeNovelId = foundNovel.slug || foundNovel.id;
        if (detailsBtn) detailsBtn.href = `novel.html?id=${activeNovelId}`;
        if (backBtn) backBtn.href = `novel.html?id=${activeNovelId}`;

        // .md ဖိုင် (သို့မဟုတ်) ဖိုင်လမ်းကြောင်းမှ စာသားများကို ဆွဲယူခြင်း
        if (foundChapter.file) {
            let filePath = foundChapter.file;
            if (!filePath.startsWith('./') && !filePath.startsWith('content/')) {
                filePath = './content/' + filePath;
            } else if (filePath.startsWith('content/')) {
                filePath = './' + filePath;
            }

            const mdRes = await fetch(filePath + '?' + new Date().getTime());
            if (mdRes.ok) {
                const mdText = await mdRes.text();
                
                // Frontmatter ကို ဖယ်ထုတ်ခြင်း
                let cleanText = mdText;
                if (mdText.startsWith('---')) {
                    const parts = mdText.split('---');
                    if (parts.length >= 3) {
                        cleanText = parts.slice(2).join('---');
                    }
                }

                const formattedContent = cleanText
                    .split('\n')
                    .filter(paragraph => paragraph.trim() !== '')
                    .map(paragraph => `<p>${paragraph}</p>`)
                    .join('');

                const contentBox = document.getElementById('chapter-content');
                if (contentBox) {
                    contentBox.style.fontSize = `${currentFontSize}px`;
                    contentBox.innerHTML = formattedContent;
                }
            } else {
                document.getElementById('chapter-content').innerHTML = '<p style="text-align:center;">စာသားဖိုင် (Markdown File) ကို ဖတ်၍ မရပါ။ လမ်းကြောင်း မှန်မမှန် စစ်ဆေးပါ။</p>';
            }
        } else {
            document.getElementById('chapter-content').innerHTML = '<p style="text-align:center;">စာသား မရှိပါ။</p>';
        }

        setupNavigationButtons(foundNovel, foundChapter.chapter_number);

    } catch (error) {
        console.error("Fetch chapter content error:", error);
        document.getElementById('chapter-content').innerHTML = '<p style="text-align:center;">အချက်အလက်များ ရယူရာတွင် အမှားအယွင်း ဖြစ်ပေါ်ခဲ့ပါသည်။</p>';
    }
}

// Font Size ပြောင်းလဲရန် Function
function changeFontSize(delta) {
    currentFontSize += delta;
    if (currentFontSize < 12) currentFontSize = 12;
    if (currentFontSize > 28) currentFontSize = 28;

    const contentBox = document.getElementById('chapter-content');
    if (contentBox) {
        contentBox.style.fontSize = `${currentFontSize}px`;
    }
}

// ရှေ့အပိုင်း/နောက်အပိုင်း ခလုတ်များ စစ်ဆေးပေးခြင်း
function setupNavigationButtons(novel, currentChapterNum) {
    const prevBtn = document.getElementById('prev-ch-btn');
    const nextBtn = document.getElementById('next-ch-btn');

    if (!novel.chapters || !Array.isArray(novel.chapters)) return;

    const chapters = novel.chapters;
    const currentIndex = chapters.findIndex(c => String(c.chapter_number) === String(currentChapterNum));

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

    if (nextBtn) {
        if (currentIndex !== -1 && currentIndex < chapters.length - 1) {
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

// Next/Prev ခလုတ် နှိပ်လိုက်သည့်အခါ novel_id ပါ ဆက်ပါသွားစေရန်
function navigateToChapter(type, event) {
    const btn = type === 'prev' ? document.getElementById('prev-ch-btn') : document.getElementById('next-ch-btn');
    const targetId = btn ? btn.dataset.targetId : null;

    if (targetId) {
        const urlParams = new URLSearchParams(window.location.search);
        const novelId = urlParams.get('novel_id') || urlParams.get('novel') || currentChapterData?.novel_id;
        
        let targetUrl = `reader.html?id=${targetId}`;
        if (novelId) {
            targetUrl = `reader.html?novel_id=${novelId}&id=${targetId}`;
        }
        
        if (typeof triggerInterstitialAd === 'function') {
            triggerInterstitialAd(event, targetUrl);
        } else {
            window.location.href = targetUrl;
        }
    }
}
