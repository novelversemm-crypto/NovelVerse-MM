// ==========================================
// 🐙 NOVELVERSE DATA CONFIGURATION (Cloudflare Optimized)
// ==========================================
// စာဖတ်သူများ VPN မလိုဘဲ ဝင်ရောက်ဖတ်ရှုနိုင်ရန် Cloudflare Pages ရှိ 
// novels.json ဖိုင်မှတဆင့် ဒေတာများကို တိုက်ရိုက်ဆွဲယူပါမည်။

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

// Helper: Cloudflare ရှိ novels.json မှ Novels များကို လှမ်းဆွဲရန်
async function fetchNovelsFromGitHub() {
    try {
        const res = await fetch('./content/novels.json?' + new Date().getTime());
        if (!res.ok) return [];

        const data = await res.json();

        // Data က Object ဖြစ်နေရင် Array သို့ ပြောင်းပေးခြင်း
        let novels = [];
        if (Array.isArray(data)) {
            novels = data;
        } else if (data && typeof data === 'object') {
            novels = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            }));
        }

        // အသစ်ဆုံးတင်ထားတာတွေကို ရှေ့ဆုံးရောက်အောင် စီမည် (created_at ဖြင့်)
        novels.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        return novels;
    } catch (err) {
        console.error("Error fetching novels data:", err);
        return [];
    }
}

// ==========================================
// 3. LOAD FEATURED NOVEL (HERO BANNER)
// ==========================================
async function loadFeaturedHero() {
    try {
        const novels = await fetchNovelsFromGitHub();
        if (novels.length === 0) return;

        const novel = novels[0]; // အသစ်ဆုံး ၁ အုပ်

        const heroImg = document.getElementById('hero-img');
        const heroTitle = document.getElementById('hero-title');
        const heroDesc = document.getElementById('hero-desc');
        const heroLink = document.getElementById('hero-link');

        if (heroImg && novel.coverUrl) heroImg.src = novel.coverUrl;
        if (heroTitle && novel.title) heroTitle.innerText = novel.title;
        if (heroDesc) heroDesc.innerText = novel.synopsis ? (novel.synopsis.substring(0, 90) + '...') : 'အသေးစိတ် ဖတ်ရှုရန်...';
        if (heroLink) heroLink.href = `novel.html?id=${novel.slug}`;

    } catch (err) {
        console.error("Error loading featured novel:", err);
    }
}

// ==========================================
// 4. LOAD LATEST UPDATES (NOVEL GRID)
// ==========================================
async function loadLatestUpdates() {
    const gridContainer = document.getElementById('latest-updates-grid');
    if (!gridContainer) return;

    try {
        const novels = await fetchNovelsFromGitHub();

        if (novels.length === 0) {
            gridContainer.innerHTML = '<p style="color:#888; font-size:0.85rem; grid-column: 1 / -1; text-align:center;">နိုဗယ်များ မရှိသေးပါ။</p>';
            return;
        }

        let htmlContent = '';
        // ပထမဆုံး ၆ အုပ်ကို ပြရန်
        novels.slice(0, 6).forEach(novel => {
            htmlContent += `
                <div class="novel-card" onclick="location.href='novel.html?id=${novel.slug}'" style="cursor:pointer;">
                    <div class="card-cover-wrapper" style="position:relative; overflow:hidden; border-radius:8px;">
                        <img src="${novel.coverUrl || ''}" alt="${novel.title || ''}" style="width:100%; height:160px; object-fit:cover; display:block;" loading="lazy">
                        <span class="badge" style="position:absolute; top:6px; right:6px; background:#2ec1ac; color:#fff; font-size:10px; padding:2px 6px; border-radius:4px;">
                            ${novel.status || 'Ongoing'}
                        </span>
                    </div>
                    <div class="card-info" style="padding: 6px 2px;">
                        <h4 style="font-size:0.85rem; font-weight:600; margin:4px 0 2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${novel.title || 'Untitled'}
                        </h4>
                        <span style="font-size:0.7rem; color:#a8b3cf;">${novel.genre ? novel.genre : 'Novel'}</span>
                    </div>
                </div>
            `;
        });

        gridContainer.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error loading latest updates:", err);
        gridContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #ff6b6b; font-size: 0.85rem;">
                <p style="margin-bottom: 8px;">⚠️ Data ဆွဲယူ၍ မရပါ။ (အင်တာနက် သို့မဟုတ် Connection ကို စစ်ဆေးပေးပါ)</p>
                <button onclick="location.reload()" style="background: #2ec1ac; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                    ပြန်လည် ကြိုးစားမည်
                </button>
            </div>
        `;
    }
}

// ==========================================
// 5. LOAD POPULAR NOVELS
// ==========================================
async function loadPopularNovels() {
    const popularContainer = document.getElementById('popular-list');
    if (!popularContainer) return;

    try {
        const novels = await fetchNovelsFromGitHub();
        if (novels.length === 0) return;

        let htmlContent = '';
        let index = 0;

        novels.slice(0, 5).forEach(novel => {
            index++;
            htmlContent += `
                <div class="popular-item" onclick="location.href='novel.html?id=${novel.slug}'" style="display:flex; align-items:center; gap:12px; margin-bottom:12px; cursor:pointer;">
                    <span style="font-size:1.1rem; font-weight:700; color:#ffb703; min-width:20px;">#${index}</span>
                    <img src="${novel.coverUrl || ''}" alt="${novel.title || ''}" style="width:45px; height:60px; object-fit:cover; border-radius:6px;" loading="lazy">
                    <div style="flex:1; overflow:hidden;">
                        <h4 style="font-size:0.9rem; font-weight:600; margin:0 0 2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                            ${novel.title || 'Untitled'}
                        </h4>
                        <p style="font-size:0.75rem; color:#a8b3cf; margin:0;">
                            ${novel.genre ? novel.genre : 'Fantasy'} • <span style="color:#2ec1ac;">${novel.status || 'Ongoing'}</span>
                        </p>
                    </div>
                    <i class="fa-solid fa-chevron-right" style="font-size:0.8rem; color:#666;"></i>
                </div>
            `;
        });

        popularContainer.innerHTML = htmlContent;

    } catch (err) {
        console.error("Error loading popular novels:", err);
    }
}

// ==========================================
// 6. LOAD CONTINUE READING (LOCALSTORAGE)
// ==========================================
function loadContinueReading() {
    const continueSection = document.getElementById('continue-reading-section');
    const continueCard = document.getElementById('continue-card');
    if (!continueSection || !continueCard) return;

    const lastRead = JSON.parse(localStorage.getItem('novelverse_last_read'));

    if (lastRead && lastRead.novelId) {
        continueSection.style.display = 'block';
        continueCard.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.05); padding:10px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.08);">
                <div style="display:flex; align-items:center; gap:10px;">
                    <i class="fa-solid fa-book-bookmark" style="font-size:1.2rem; color:#2ec1ac;"></i>
                    <div>
                        <h4 style="font-size:0.85rem; margin:0; font-weight:600;">${lastRead.novelTitle}</h4>
                        <span style="font-size:0.75rem; color:#a8b3cf;">Chapter ${lastRead.chapterNumber}</span>
                    </div>
                </div>
                <a href="reader.html?id=${lastRead.chapterId || ''}&novel_id=${lastRead.novelId}&chapter=${lastRead.chapterNumber}" class="btn-primary" style="padding:6px 12px; font-size:0.75rem; border-radius:6px; text-decoration:none;">
                    ဆက်ဖတ်မည်
                </a>
            </div>
        `;
    }
}
