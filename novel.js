let currentNovelId = null;
let chaptersData = [];
let isAscending = false; 
let currentChapterPage = 1;
const chaptersPerPage = 30; // တစ်မျက်နှာလျှင် ပြမည့် Chapter အရေအတွက်

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentNovelId = urlParams.get('id');

    window.toggleChapterSort = toggleChapterSort;
    window.triggerChapterAd = triggerChapterAd;
    window.changeChapterPage = changeChapterPage; // Page ပြောင်းရန် ဖန်ရှင်ချိတ်ခြင်း

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
        let novels = Array.isArray(data) ? data : Object.values(data);
        let novel = novels.find(n => (n.id && String(n.id) === String(novelId)) || (n.slug && String(n.slug) === String(novelId)));

        if (!novel) {
            if (headerContainer) headerContainer.innerHTML = '<p>Novel ရှာမတွေ့ပါ။</p>';
            if (listContainer) listContainer.innerHTML = '<p class="empty-msg">စာစဉ်များ မရှိသေးပါ။</p>';
            renderChapterPagination(0);
            return;
        }

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

        const synopsisEl = document.getElementById('novel-synopsis');
        if (synopsisEl) {
            synopsisEl.innerText = novel.synopsis || 'အညွှန်း မရှိသေးပါ။';
        }

        chaptersData = novel.chapters && Array.isArray(novel.chapters) ? novel.chapters : [];

        chaptersData.sort((a, b) => {
            return isAscending 
                ? (a.chapter_number - b.chapter_number) 
                : (b.chapter_number - a.chapter_number);
        });

        const countEl = document.getElementById('chapter-count');
        if (countEl) countEl.innerText = chaptersData.length;

        currentChapterPage = 1;
        renderChapters();

    } catch (error) {
        console.error("Fetch novel data error:", error);
        if (headerContainer) headerContainer.innerHTML = '<p>အချက်အလက်များ ရယူရာတွင် အမှားအယွင်း ရှိပါသည်။</p>';
        if (listContainer) listContainer.innerHTML = '<p class="empty-msg">စာစဉ်များ ဆွဲယူရာတွင် အမှားအယွင်း ရှိပါသည်။</p>';
        renderChapterPagination(0);
    }
}

// 2. Chapter စာရင်းများကို UI ပળပေါ်တွင် ပြသခြင်း (Pagination ဖြင့်)
function renderChapters() {
    const listContainer = document.getElementById('chapter-list-container');
    if (!listContainer) return;

    if (chaptersData.length === 0) {
        listContainer.innerHTML = '<p class="empty-msg">စာစဉ်များ မရှိသေးပါ။</p>';
        renderChapterPagination(0);
        return;
    }
    
    const startIndex = (currentChapterPage - 1) * chaptersPerPage;
    const currentChapters = chaptersData.slice(startIndex, startIndex + chaptersPerPage);

    listContainer.innerHTML = currentChapters.map(ch => {
        // file လမ်းကြောင်းမှ content/chapters/ ကို ဖြုတ်ပြီး pure file name သို့မဟုတ် file တစ်ခုလုံးကို ID အဖြစ်သုံးရန်
        const fileParam = ch.file ? ch.file.replace('content/chapters/', '') : ch.chapter_number;
        return `
            <a href="reader.html?id=${fileParam}" class="chapter-item" onclick="triggerChapterAd(event, 'reader.html?id=${fileParam}')">
                <div class="ch-title">Chapter ${ch.chapter_number} - ${ch.title || ''}</div>
                <div class="ch-date"><i class="fa-solid fa-chevron-right"></i></div>
            </a>
        `;
    }).join('');

    renderChapterPagination(chaptersData.length);
}

// 3. Chapter Pagination ခလုတ်များ ဖန်တီးခြင်း (အမြဲပေါ်နေမည်)
function renderChapterPagination(totalItems) {
    const paginationContainer = document.getElementById('chapter-pagination-container');
    if (!paginationContainer) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / chaptersPerPage));
    let paginationHTML = '';
    
    // Previous Button
    paginationHTML += `<button onclick="changeChapterPage(${currentChapterPage - 1})" ${currentChapterPage === 1 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); padding:6px 12px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-chevron-left"></i></button>`;
    
    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `<button onclick="changeChapterPage(${i})" style="background:${i === currentChapterPage ? 'var(--primary-purple)' : 'var(--card-bg)'}; color:#fff; border:1px solid var(--border-color); padding:6px 12px; border-radius:8px; cursor:pointer;">${i}</button>`;
    }
    
    // Next Button
    paginationHTML += `<button onclick="changeChapterPage(${currentChapterPage + 1})" ${currentChapterPage === totalPages ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--border-color); padding:6px 12px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-chevron-right"></i></button>`;
    
    paginationContainer.innerHTML = paginationHTML;
}

// 4. Chapter Page ပြောင်းသည့် Function
function changeChapterPage(page) {
    const totalPages = Math.ceil(chaptersData.length / chaptersPerPage) || 1;
    if (page < 1 || page > totalPages) return;

    currentChapterPage = page;
    renderChapters();
}

// 5. Chapter စီစဉ်မှု (Newest / Oldest) ပြောင်းလဲရန်
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
    currentChapterPage = 1; // Sort ပြောင်းပါက ပထမစာမျက်နှာသို့ ပြန်သွားမည်
    renderChapters();
}

// 6. Chapter နှိပ်လိုက်တိုင်း Adsterra / Smartlink Trigger ပြုလုပ်ခြင်း
function triggerChapterAd(event, targetUrl) {
    if (typeof triggerInterstitialAd === 'function') {
        triggerInterstitialAd(event, targetUrl);
    }
}
