let currentNovelId = null;
let chaptersData = [];
let isAscending = false; 

document.addEventListener('DOMContentLoaded', () => {
    // URL မှ Novel ID ကို ဆွဲယူမည်
    const urlParams = new URLSearchParams(window.location.search);
    currentNovelId = urlParams.get('id');

    // HTML onclick များ အလုပ်လုပ်နိုင်ရန် Global Window အဖြစ် ချိတ်ဆက်ပေးခြင်း
    window.toggleChapterSort = toggleChapterSort;
    window.triggerChapterAd = triggerChapterAd;

    if (currentNovelId) {
        fetchNovelData(currentNovelId);
    } else {
        const headerContainer = document.getElementById('novel-header-container');
        if (headerContainer) headerContainer.innerHTML = '<p>Novel မရှိပါ။</p>';
    }
});

// 1. GitHub JSON မှ Novel အချက်အလက်များနှင့် Chapter များကို ဆွဲယူခြင်း
async function fetchNovelData(novelId) {
    const headerContainer = document.getElementById('novel-header-container');
    const listContainer = document.getElementById('chapter-list-container');

    try {
        const response = await fetch('content/novels.json?' + new Date().getTime());
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        // Data ကို Array သို့မဟုတ် Object ပုံစံအပေါ်မူတည်၍ ရှာဖွေနိုင်ရန် ပြင်ဆင်ခြင်း
        let novels = Array.isArray(data) ? data : Object.values(data);
        
        // ID သို့မဟုတ် Slug ဖြင့် သက်ဆိုင်ရာ Novel ကို ရှာမည်
        let novel = novels.find(n => (n.id && String(n.id) === String(novelId)) || (n.slug && String(n.slug) === String(novelId)));

        if (!novel) {
            if (headerContainer) headerContainer.innerHTML = '<p>Novel ရှာမတွေ့ပါ။</p>';
            if (listContainer) listContainer.innerHTML = '<p class="empty-msg">စာစဉ်များ မရှိသေးပါ။</p>';
            return;
        }

        // Header HTML တည်ဆောက်ခြင်း (coverUrl သို့ ပြင်ဆင်ပြီး)
        if (headerContainer) {
            headerContainer.innerHTML = `
                <div class="novel-detail-card">
                    <img src="${novel.coverUrl || ''}" class="detail-cover" alt="${novel.title || ''}">
                    <div class="detail-info">
                        <h2 class="detail-title">${novel.title || ''}</h2>
                        <div class="detail-meta"><i class="fa-solid fa-user"></i> ${novel.author || 'Unknown'}</div>
                        <div class="detail-meta"><i class="fa-solid fa-tag"></i> ${novel.genre || 'General'}</div>
                        <div class="detail-badge">${novel.status || 'Ongoing'}</div>
                    </div>
                </div>
            `;
        }

        // Synopsis ထည့်ခြင်း
        const synopsisEl = document.getElementById('novel-synopsis');
        if (synopsisEl) {
            synopsisEl.innerText = novel.synopsis || 'အညွှန်း မရှိသေးပါ။';
        }

        // Chapters များကို ထည့်သွင်းခြင်း
        chaptersData = novel.chapters && Array.isArray(novel.chapters) ? novel.chapters : [];

        // Chapter Number အလိုက် စီပေးမည် (Default: Newest first -> Descending)
        chaptersData.sort((a, b) => {
            return isAscending 
                ? (a.chapter_number - b.chapter_number) 
                : (b.chapter_number - a.chapter_number);
        });

        const countEl = document.getElementById('chapter-count');
        if (countEl) countEl.innerText = chaptersData.length;

        renderChapters();

    } catch (error) {
        console.error("Fetch novel data error:", error);
        if (headerContainer) headerContainer.innerHTML = '<p>အချက်အလက်များ ရယူရာတွင် အမှားအယွင်း ရှိပါသည်ဖတ်ရှု၍ မရပါ။</p>';
        if (listContainer) listContainer.innerHTML = '<p class="empty-msg">စာစဉ်များ ဆွဲယူရာတွင် အမှားအယွင်း ရှိပါသည်။</p>';
    }
}

// 2. Chapter စာရင်းများကို UI ပေါ်တွင် ပြသခြင်း
function renderChapters() {
    const listContainer = document.getElementById('chapter-list-container');
    if (!listContainer) return;

    if (chaptersData.length === 0) {
        listContainer.innerHTML = '<p class="empty-msg">စာစဉ်များ မရှိသေးပါ။</p>';
        return;
    }
    
    listContainer.innerHTML = chaptersData.map(ch => `
        <a href="reader.html?id=${ch.id || ch.chapter_number}" class="chapter-item" onclick="triggerChapterAd(event, 'reader.html?id=${ch.id || ch.chapter_number}')">
            <div class="ch-title">Chapter ${ch.chapter_number} - ${ch.title || ''}</div>
            <div class="ch-date"><i class="fa-solid fa-chevron-right"></i></div>
        </a>
    `).join('');
}

// 3. Chapter စီစဉ်မှု (Newest / Oldest) ပြောင်းလဲရန်
function toggleChapterSort() {
    isAscending = !isAscending;
    const sortBtn = document.getElementById('sort-btn');
    
    if (sortBtn) {
        if (isAscending) {
            sortBtn.innerHTML = '<i class="fa-solid fa-arrow-up-short-wide"></i> Old';
        } else {
            sortBtn.innerHTML = '<i class="fa-solid fa-arrow-down-short-wide"></i> New';
        }
    }
    
    chaptersData.reverse();
    renderChapters();
}

// 4. Chapter နှိပ်လိုက်တိုင်း Adsterra / Smartlink Trigger ပြုလုပ်ခြင်း
function triggerChapterAd(event, targetUrl) {
    if (typeof triggerInterstitialAd === 'function') {
        triggerInterstitialAd(event, targetUrl);
    }
}