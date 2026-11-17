
// ==========================================
// 🐙 GITHUB REPOSITORY CONFIGURATION
// ==========================================
const GITHUB_OWNER = "novelversemm-crypto";
const GITHUB_REPO = "NovelVerse-MM";

// ==========================================
// ☁️ CLOUDINARY CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = 'n1rewvpg';
const CLOUDINARY_UPLOAD_PRESET = 'novel_covers';

// ==========================================
// 📦 NOVELS JSON CACHE
// ==========================================
let novelsJsonCache = null;
let novelsJsonPromise = null;
let allAdminNovels = [];

// ==========================================
// DOM LOADED EVENT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const savedToken = localStorage.getItem('github_token');

    if (savedToken) {
        showDashboard();
    } else {
        showLogin();
    }

    window.handleLogin = handleLogin;
    window.handleLogout = handleLogout;
    window.switchTab = switchTab;
    window.handleAddNovel = handleAddNovel;
    window.handleAddChapter = handleAddChapter;
    window.filterAdminNovels = filterAdminNovels;
    window.openEditModal = openEditModal;
    window.closeEditModal = closeEditModal;
    window.handleUpdateNovel = handleUpdateNovel;
    window.deleteNovel = deleteNovel;
    window.closeChaptersModal = closeChaptersModal;
    window.openChaptersManager = openChaptersManager;
    window.deleteChapter = deleteChapter;
    window.openEditChapterModal = openEditChapterModal;
    window.closeEditChapterModal = closeEditChapterModal;
    window.handleUpdateChapter = handleUpdateChapter;
});

// ==========================================
// BASIC HELPERS
// ==========================================

function getToken() {
    return localStorage.getItem('github_token') || '';
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';

    return String(text).replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function decodeBase64(content) {
    return decodeURIComponent(escape(atob(content.replace(/\s/g, ''))));
}

function encodeBase64(content) {
    return btoa(unescape(encodeURIComponent(content)));
}

function getGitHubContentsUrl(filePath) {
    return `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
}

// ==========================================
// 1. ADMIN LOGIN
// ==========================================

async function handleLogin(e) {
    if (e) e.preventDefault();

    const tokenInput = document.getElementById('github-token-input').value.trim();

    if (!tokenInput) {
        alert('ကျေးဇူးပြု၍ GitHub Token ထည့်ပါ။');
        return;
    }

    try {
        const res = await fetch(
            `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
            {
                headers: {
                    "Authorization": `token ${tokenInput}`
                }
            }
        );

        if (!res.ok) {
            alert('Token မှားယွင်းနေပါသည်။ (သို့မဟုတ် Permission မရှိပါ။)');
            return;
        }

        localStorage.setItem('github_token', tokenInput);

        alert('Admin Panel သို့ အောင်မြင်စွာ ဝင်ရောက်လိုက်ပါပြီ!');

        showDashboard();

    } catch (err) {
        alert('ချိတ်ဆက်မှု အမှားအယွင်းရှိပါသည်: ' + err.message);
    }
}

function showDashboard() {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard-section');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginSec) loginSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';

    // Dashboard ဖွင့်ချိန်တွင် JSON ကို တစ်ကြိမ်သာ ဖတ်မည်
    novelsJsonCache = null;
    novelsJsonPromise = null;

    loadNovelsDropdown();
    loadManageNovelsList();
}

function showLogin() {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard-section');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginSec) loginSec.style.display = 'block';
    if (dashSec) dashSec.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
}

function handleLogout() {
    if (confirm('Admin အကောင့်မှ ထွက်ရန် သေချာပါသလား?')) {
        localStorage.removeItem('github_token');

        novelsJsonCache = null;
        novelsJsonPromise = null;

        showLogin();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => {
        el.style.display = 'none';
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetTab = document.getElementById(`tab-${tabId}`);

    if (targetTab) targetTab.style.display = 'block';

    if (tabId === 'add-chapter') loadNovelsDropdown();
    if (tabId === 'manage-novels') loadManageNovelsList();
}

// ==========================================
// 2. GITHUB UPLOAD / DELETE
// ==========================================

async function uploadToGitHub(filePath, fileContent, commitMessage) {
    const token = getToken();
    const url = getGitHubContentsUrl(filePath);

    let sha = null;

    const existingRes = await fetch(url, {
        headers: {
            "Authorization": `token ${token}`
        }
    });

    if (existingRes.ok) {
        const existingData = await existingRes.json();
        sha = existingData.sha;
    } else if (existingRes.status !== 404) {
        const errorData = await existingRes.json().catch(() => ({}));
        throw new Error(errorData.message || 'GitHub ဖိုင်အချက်အလက် ရယူမရပါ။');
    }

    const bodyData = {
        message: commitMessage,
        content: encodeBase64(fileContent)
    };

    if (sha) bodyData.sha = sha;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'GitHub သို့ တင်၍မရပါ။');
    }

    return await response.json();
}

async function deleteFromGitHub(filePath, commitMessage) {
    const token = getToken();
    const url = getGitHubContentsUrl(filePath);

    const existingRes = await fetch(url, {
        headers: {
            "Authorization": `token ${token}`
        }
    });

    if (!existingRes.ok) {
        if (existingRes.status === 404) return null;

        const errData = await existingRes.json().catch(() => ({}));
        throw new Error(errData.message || 'GitHub ဖိုင်ကို ရယူမရပါ။');
    }

    const existingData = await existingRes.json();

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: commitMessage,
            sha: existingData.sha
        })
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'GitHub မှ ဖျက်၍မရပါ။');
    }

    return await response.json();
}

// ==========================================
// 3. READ novels.json
// ==========================================

async function getNovelsJsonData(forceRefresh = false) {
    if (forceRefresh) {
        novelsJsonCache = null;
        novelsJsonPromise = null;
    }

    if (novelsJsonCache) return novelsJsonCache;

    if (novelsJsonPromise) return novelsJsonPromise;

    novelsJsonPromise = (async () => {
        const res = await fetch(getGitHubContentsUrl('content/novels.json'), {
            headers: {
                "Authorization": `token ${getToken()}`
            }
        });

        if (!res.ok) {
            throw new Error('novels.json ကို ဖတ်မရပါ။');
        }

        const data = await res.json();

        if (!data.content) {
            throw new Error('novels.json ထဲက Data ကို ဖတ်မရပါ။');
        }

        const novels = JSON.parse(decodeBase64(data.content));

        if (!Array.isArray(novels)) {
            throw new Error('novels.json Format မှားယွင်းနေပါသည်။');
        }

        novelsJsonCache = novels;

        return novels;
    })();

    try {
        return await novelsJsonPromise;
    } finally {
        novelsJsonPromise = null;
    }
}

// ==========================================
// 4. UPDATE novels.json
// ==========================================

async function updateNovelsJsonFile(action) {
    if (!action || !action.type) {
        throw new Error('JSON Update အမျိုးအစား မသတ်မှတ်ထားပါ။');
    }

    // လက်ရှိ GitHub JSON ကို အမြဲပြန်ဖတ်ပြီး အဲဒီ Data ကိုပဲ ပြင်မည်
    const currentData = await getNovelsJsonData(true);

    // မူရင်း Cache ကို တိုက်ရိုက်မပြင်ရန် Copy ယူမည်
    const novels = JSON.parse(JSON.stringify(currentData));

    // --------------------------------------
    // ADD NOVEL
    // --------------------------------------
    if (action.type === 'addNovel') {
        if (novels.some(n => n.slug === action.novel.slug)) {
            throw new Error('ဒီ Novel Slug က ရှိပြီးသားပါ။');
        }

        // Novel အစဉ်မပြောင်းဘဲ နောက်ဆုံးမှာ ထည့်မည်
        novels.push(action.novel);
    }

    // --------------------------------------
    // UPDATE NOVEL
    // --------------------------------------
    else if (action.type === 'updateNovel') {
        const novel = novels.find(n => n.slug === action.slug);

        if (!novel) {
            throw new Error('ပြင်ဆင်မည့် Novel ကို novels.json ထဲတွင် ရှာမတွေ့ပါ။');
        }

        // လိုအပ်သော Field များကိုသာ ပြောင်းမည်
        Object.assign(novel, action.data);
    }

    // --------------------------------------
    // DELETE NOVEL
    // --------------------------------------
    else if (action.type === 'deleteNovel') {
        const index = novels.findIndex(n => n.slug === action.slug);

        if (index !== -1) {
            novels.splice(index, 1);
        }
    }

    // --------------------------------------
    // ADD CHAPTER
    // --------------------------------------
    else if (action.type === 'addChapter') {
        const novel = novels.find(n => n.slug === action.slug);

        if (!novel) {
            throw new Error('သက်ဆိုင်ရာ Novel ကို ရှာမတွေ့ပါ။');
        }

        if (!Array.isArray(novel.chapters)) {
            novel.chapters = [];
        }

        if (novel.chapters.some(ch => ch.file === action.chapter.file)) {
            throw new Error('ဒီ Chapter ဖိုင်က ရှိပြီးသားပါ။');
        }

        if (novel.chapters.some(ch =>
            Number(ch.chapter_number) === Number(action.chapter.chapter_number)
        )) {
            throw new Error('ဒီ Chapter နံပါတ်က ရှိပြီးသားပါ။');
        }

        // Chapter အစဉ်မပြောင်းဘဲ နောက်ဆုံးမှာ ထည့်မည်
        novel.chapters.push(action.chapter);
    }

    // --------------------------------------
    // UPDATE CHAPTER
    // --------------------------------------
    else if (action.type === 'updateChapter') {
        const novel = novels.find(n => n.slug === action.slug);

        if (!novel || !Array.isArray(novel.chapters)) {
            throw new Error('သက်ဆိုင်ရာ Chapter စာရင်းကို ရှာမတွေ့ပါ။');
        }

        const chapter = novel.chapters.find(ch => ch.file === action.oldFile);

        if (!chapter) {
            throw new Error('ပြင်ဆင်မည့် Chapter ကို JSON ထဲတွင် ရှာမတွေ့ပါ။');
        }

        const duplicate = novel.chapters.some(ch =>
            ch !== chapter &&
            (
                ch.file === action.chapter.file ||
                Number(ch.chapter_number) === Number(action.chapter.chapter_number)
            )
        );

        if (duplicate) {
            throw new Error('ဒီ Chapter နံပါတ် သို့မဟုတ် ဖိုင်က ရှိပြီးသားပါ။');
        }

        // မူရင်း Chapter နေရာကို မရွှေ့ဘဲ Data ကိုသာ ပြင်မည်
        Object.assign(chapter, action.chapter);
    }

    // --------------------------------------
    // DELETE CHAPTER
    // --------------------------------------
    else if (action.type === 'deleteChapter') {
        const novel = novels.find(n => n.slug === action.slug);

        if (novel && Array.isArray(novel.chapters)) {
            novel.chapters = novel.chapters.filter(ch => ch.file !== action.file);
        }
    }

    else {
        throw new Error('မသိသော JSON Update အမျိုးအစား ဖြစ်နေပါသည်။');
    }

    // GitHub သို့ JSON တစ်ဖိုင်တည်း Update လုပ်မည်
    const jsonContent = JSON.stringify(novels, null, 2);

    await uploadToGitHub(
        'content/novels.json',
        jsonContent,
        `Update novels.json: ${action.type}`
    );

    // Upload အောင်မြင်မှ Cache ပြောင်းမည်
    novelsJsonCache = novels;

    return novels;
}

// ==========================================
// 5. ADD NOVEL
// ==========================================

async function handleAddNovel(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('save-novel-btn');

    if (btn) btn.disabled = true;

    const title = document.getElementById('novel-title').value.trim();
    const fileInput = document.getElementById('novel-cover-file');
    const file = fileInput ? fileInput.files[0] : null;
    const status = document.getElementById('novel-status').value;
    const synopsis = document.getElementById('novel-synopsis').value.trim();

    if (!title) {
        alert('Novel ခေါင်းစဉ် ထည့်ပေးပါ။');
        if (btn) btn.disabled = false;
        return;
    }

    if (!file) {
        alert('ကျေးဇူးပြု၍ Cover Image File ရွေးချယ်ပေးပါ!');
        if (btn) btn.disabled = false;
        return;
    }

    try {
        // Slug ဖန်တီးမည်
        let slug = title.trim()
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');

        if (!slug) {
            slug = 'novel-' + Date.now();
        }

        // ရှိပြီးသား Slug ဟုတ်မဟုတ် စစ်မည်
        const currentNovels = await getNovelsJsonData();

        if (currentNovels.some(n => n.slug === slug)) {
            throw new Error('ဒီ Novel Slug က ရှိပြီးသားပါ။');
        }

        if (btn) btn.innerText = 'Cloudinary သို့ Cover Image တင်နေသည်...';

        const formData = new FormData();

        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
            throw new Error(
                uploadData.error
                    ? uploadData.error.message
                    : 'Cloudinary Upload မှားယွင်းနေပါသည်။'
            );
        }

        const coverUrl = uploadData.secure_url;

        let selectedGenres = [];

        document.querySelectorAll('input[name="novel-genre-chip"]:checked').forEach(cb => {
            selectedGenres.push(cb.value);
        });

        const createdAt = new Date().toISOString();
        const genre = selectedGenres.join(', ');

        const markdownContent = `---
title: "${title}"
cover_url: "${coverUrl}"
genre: "${genre}"
status: "${status}"
created_at: "${createdAt}"
---

${synopsis}
`;

        if (btn) btn.innerText = 'GitHub သို့ Novel ဖိုင် သိမ်းဆည်းနေသည်...';

        await uploadToGitHub(
            `content/novels/${slug}.md`,
            markdownContent,
            `Add novel: ${title}`
        );

        if (btn) btn.innerText = 'novels.json ကို အပ်ဒိတ်လုပ်နေသည်...';

        await updateNovelsJsonFile({
            type: 'addNovel',
            novel: {
                slug,
                title,
                coverUrl,
                genre,
                status,
                synopsis,
                createdAt,
                chapters: []
            }
        });

        alert('Novel အသစ် အောင်မြင်စွာ တင်ပြီးပါပြီ!');

        document.getElementById('add-novel-form').reset();

        await loadNovelsDropdown();
        await loadManageNovelsList();

    } catch (err) {
        alert('အမှားအယွင်း ရှိပါသည်: ' + err.message);
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Novel သိမ်းဆည်းမည်';
        }
    }
}

// ==========================================
// 6. ADD CHAPTER
// ==========================================

async function handleAddChapter(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('save-chapter-btn');

    if (btn) btn.disabled = true;

    const novelSlug = document.getElementById('select-novel-dropdown').value;
    const chNum = parseInt(document.getElementById('chapter-number').value);
    const chTitle = document.getElementById('chapter-title-input').value.trim();
    const chContent = document.getElementById('chapter-content-input').value.trim();

    try {
        if (!novelSlug) {
            throw new Error('Novel ရွေးချယ်ပေးပါ။');
        }

        if (!Number.isInteger(chNum) || chNum < 1) {
            throw new Error('Chapter နံပါတ် မှန်ကန်စွာ ထည့်ပေးပါ။');
        }

        const novels = await getNovelsJsonData();
        const novel = novels.find(n => n.slug === novelSlug);

        if (!novel) {
            throw new Error('သက်ဆိုင်ရာ Novel ကို ရှာမတွေ့ပါ။');
        }

        if (Array.isArray(novel.chapters) && novel.chapters.some(ch =>
            Number(ch.chapter_number) === chNum
        )) {
            throw new Error(`Chapter ${chNum} က ရှိပြီးသားပါ။`);
        }

        const chapterFileName = `${novelSlug}-ch-${chNum}.md`;
        const chapterFilePath = `content/chapters/${chapterFileName}`;

        const markdownContent = `---
novel_slug: "${novelSlug}"
chapter_number: ${chNum}
title: "${chTitle}"
created_at: "${new Date().toISOString()}"
---

${chContent}
`;

        await uploadToGitHub(
            chapterFilePath,
            markdownContent,
            `Add ${novelSlug} Chapter ${chNum}`
        );

        if (btn) btn.innerText = 'novels.json ကို အပ်ဒိတ်လုပ်နေသည်...';

        await updateNovelsJsonFile({
            type: 'addChapter',
            slug: novelSlug,
            chapter: {
                chapter_number: chNum,
                title: chTitle,
                file: chapterFilePath
            }
        });

        alert(`Chapter ${chNum} တင်ပြီးပါပြီ!`);

        document.getElementById('chapter-number').value = chNum + 1;
        document.getElementById('chapter-title-input').value = '';
        document.getElementById('chapter-content-input').value = '';

    } catch (error) {
        alert('Chapter တင်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + error.message);
        console.error(error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Chapter သိမ်းဆည်းမည်';
        }
    }
}

// ==========================================
// 7. LOAD NOVEL DROPDOWN FROM JSON
// ==========================================

async function loadNovelsDropdown() {
    const dropdown = document.getElementById('select-novel-dropdown');

    if (!dropdown) return;

    try {
        const novels = await getNovelsJsonData();

        let options = '<option value="">-- Novel ရွေးပါ --</option>';

        novels.forEach(novel => {
            options += `
                <option value="${escapeHtml(novel.slug)}">
                    ${escapeHtml(novel.title)}
                </option>
            `;
        });

        dropdown.innerHTML = options;

    } catch (error) {
        console.error("Dropdown load error:", error);
        dropdown.innerHTML = '<option value="">-- Novel များ မရှိသေးပါ --</option>';
    }
}

// ==========================================
// 8. LOAD MANAGE NOVELS LIST FROM JSON
// ==========================================

async function loadManageNovelsList() {
    const container = document.getElementById('admin-novel-list');

    if (!container) return;

    container.innerHTML = '<p style="color:#aaa; text-align:center;">Novel များကို ရယူနေသည်...</p>';

    try {
        const novels = await getNovelsJsonData();

        allAdminNovels = novels.map(novel => ({
            slug: novel.slug,
            title: novel.title,
            coverUrl: novel.coverUrl || '',
            genre: novel.genre || 'No Genre',
            status: novel.status || 'Ongoing',
            synopsis: novel.synopsis || ''
        }));

        renderAdminNovelsList(allAdminNovels);

    } catch (error) {
        console.error("Manage list load error:", error);

        container.innerHTML = `
            <p style="color:#ef4444; text-align:center;">
                ဒေတာရယူရာတွင် အမှားအယွင်းရှိပါသည်
            </p>
        `;
    }
}

// ==========================================
// 9. RENDER ADMIN NOVELS LIST
// ==========================================

function renderAdminNovelsList(novels) {
    const container = document.getElementById('admin-novel-list');

    if (!container) return;

    if (novels.length === 0) {
        container.innerHTML = '<p style="color:#aaa; text-align:center;">ရှာမတွေ့ပါ</p>';
        return;
    }

    container.innerHTML = '';

    novels.forEach(novel => {
        const itemDiv = document.createElement('div');

        itemDiv.className = 'admin-novel-item';

        itemDiv.style.cssText = `
            display:flex;
            align-items:center;
            justify-content:space-between;
            background:rgba(255,255,255,0.05);
            padding:12px;
            margin-bottom:10px;
            border-radius:8px;
            gap:10px;
            flex-wrap:wrap;
        `;

        itemDiv.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:200px;">
                <img
                    src="${escapeHtml(novel.coverUrl)}"
                    class="admin-cover"
                    style="width:50px; height:70px; object-fit:cover; border-radius:4px;"
                    onerror="this.src='https://via.placeholder.com/50x70?text=No+Image'"
                >

                <div>
                    <div class="admin-novel-title" style="font-weight:600; color:#fff;">
                        ${escapeHtml(novel.title)}
                    </div>

                    <div class="admin-novel-meta" style="font-size:0.8rem; color:#a8b3cf;">
                        ${escapeHtml(novel.genre)} • ${escapeHtml(novel.status)}
                    </div>
                </div>
            </div>

            <div style="display:flex; gap:6px;" class="admin-action-btns">
                <button class="submit-btn btn-chapters" style="padding:6px 10px; font-size:0.8rem; background:#3b82f6;">
                    <i class="fa-solid fa-book-open"></i> Chapters
                </button>

                <button class="submit-btn btn-edit" style="padding:6px 10px; font-size:0.8rem; background:#eab308;">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>

                <button class="submit-btn btn-delete" style="padding:6px 10px; font-size:0.8rem; background:#ef4444;">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `;

        itemDiv.querySelector('.btn-chapters').addEventListener('click', () => {
            openChaptersManager(novel.slug, novel.title);
        });

        itemDiv.querySelector('.btn-edit').addEventListener('click', () => {
            openEditModal(novel.slug, novel.title, novel.status, novel.synopsis);
        });

        itemDiv.querySelector('.btn-delete').addEventListener('click', () => {
            deleteNovel(novel.slug, novel.title);
        });

        container.appendChild(itemDiv);
    });
}

// ==========================================
// 10. SEARCH NOVELS
// ==========================================

function filterAdminNovels() {
    const searchInput = document.getElementById('admin-search-novel');

    if (!searchInput) return;

    const query = searchInput.value.toLowerCase();

    const filtered = allAdminNovels.filter(n =>
        String(n.title || '').toLowerCase().includes(query)
    );

    renderAdminNovelsList(filtered);
}

// ==========================================
// 11. EDIT NOVEL MODAL
// ==========================================

function openEditModal(slug, title, status, synopsis) {
    document.getElementById('edit-novel-id').value = slug;
    document.getElementById('edit-novel-title').value = title;
    document.getElementById('edit-novel-status').value = status;
    document.getElementById('edit-novel-synopsis').value = synopsis;

    document.getElementById('edit-novel-modal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('edit-novel-modal').style.display = 'none';
}

// ==========================================
// 12. UPDATE NOVEL
// ==========================================

async function handleUpdateNovel(e) {
    if (e) e.preventDefault();

    const slug = document.getElementById('edit-novel-id').value;
    const title = document.getElementById('edit-novel-title').value.trim();
    const status = document.getElementById('edit-novel-status').value;
    const synopsis = document.getElementById('edit-novel-synopsis').value.trim();

    try {
        if (!title) {
            throw new Error('Novel ခေါင်းစဉ် ထည့်ပေးပါ။');
        }

        const novelFilePath = `content/novels/${slug}.md`;

        const res = await fetch(getGitHubContentsUrl(novelFilePath), {
            headers: {
                "Authorization": `token ${getToken()}`
            }
        });

        if (!res.ok) {
            throw new Error('Novel Markdown ဖိုင်ကို ဖတ်မရပါ။');
        }

        const data = await res.json();
        const oldText = decodeBase64(data.content);
        const parts = oldText.split('---');

        if (parts.length < 3) {
            throw new Error('Novel Markdown Format မှားယွင်းနေပါသည်။');
        }

        let coverUrl = '';
        let genre = 'Action';
        let createdAt = new Date().toISOString();

        parts[1].split('\n').forEach(line => {
            if (line.startsWith('cover_url:')) {
                coverUrl = line.replace('cover_url:', '').trim().replace(/^["']|["']$/g, '');
            }

            if (line.startsWith('genre:')) {
                genre = line.replace('genre:', '').trim().replace(/^["']|["']$/g, '');
            }

            if (line.startsWith('created_at:')) {
                createdAt = line.replace('created_at:', '').trim().replace(/^["']|["']$/g, '');
            }
        });

        const markdownContent = `---
title: "${title}"
cover_url: "${coverUrl}"
genre: "${genre}"
status: "${status}"
created_at: "${createdAt}"
---

${synopsis}
`;

        await uploadToGitHub(
            novelFilePath,
            markdownContent,
            `Update novel: ${title}`
        );

        await updateNovelsJsonFile({
            type: 'updateNovel',
            slug,
            data: {
                title,
                status,
                synopsis
            }
        });

        alert('Novel အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!');

        closeEditModal();

        await loadManageNovelsList();
        await loadNovelsDropdown();

    } catch (err) {
        alert('ပြင်ဆင်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + err.message);
        console.error(err);
    }
}

// ==========================================
// 13. DELETE NOVEL
// ==========================================

async function deleteNovel(slug, title) {
    if (!confirm(`"${title}" နိုဗယ်နှင့် ဆက်စပ်နေသော Chapter များ အပါအဝင် အချက်အလက်အားလုံးကို ဖျက်ရန် သေချာပါသလား?`)) {
        return;
    }

    try {
        const novels = await getNovelsJsonData();
        const novel = novels.find(n => n.slug === slug);

        if (!novel) {
            throw new Error('Novel ကို novels.json ထဲတွင် ရှာမတွေ့ပါ။');
        }

        const chapterFiles = Array.isArray(novel.chapters)
            ? novel.chapters.map(ch => ch.file).filter(Boolean)
            : [];

        // JSON မှ Novel ကို အရင်ဖယ်မည်
        await updateNovelsJsonFile({
            type: 'deleteNovel',
            slug
        });

        // JSON Update အောင်မြင်ပြီးမှ Markdown ဖိုင်များကို ဖျက်မည်
        const deleteErrors = [];

        for (const filePath of chapterFiles) {
            try {
                await deleteFromGitHub(
                    filePath,
                    `Delete chapter for novel ${slug}`
                );
            } catch (err) {
                deleteErrors.push(filePath);
                console.error(err);
            }
        }

        try {
            await deleteFromGitHub(
                `content/novels/${slug}.md`,
                `Delete novel: ${title}`
            );
        } catch (err) {
            deleteErrors.push(`content/novels/${slug}.md`);
            console.error(err);
        }

        alert(
            deleteErrors.length
                ? 'Novel ကို novels.json မှ ဖယ်ရှားပြီးပါပြီ။ သို့သော် GitHub မှ ဖိုင်အချို့ ဖျက်မရသေးပါ။'
                : 'Novel နှင့် ဆက်စပ် Chapter အားလုံး အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!'
        );

        await loadManageNovelsList();
        await loadNovelsDropdown();

    } catch (err) {
        alert('ဖျက်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + err.message);
        console.error(err);
    }
}

// ==========================================
// 14. OPEN CHAPTERS MANAGER FROM JSON
// ==========================================

async function openChaptersManager(slug, title) {
    const modal = document.getElementById('manage-chapters-modal');
    const listContainer = document.getElementById('admin-chapter-list');

    listContainer.innerHTML = `
        <p style="color:#aaa; text-align:center;">
            "${escapeHtml(title)}" ၏ Chapter များကို ရယူနေသည်...
        </p>
    `;

    modal.style.display = 'flex';

    try {
        const novels = await getNovelsJsonData();
        const novel = novels.find(n => n.slug === slug);

        if (!novel || !Array.isArray(novel.chapters) || novel.chapters.length === 0) {
            listContainer.innerHTML = `
                <p style="color:#aaa; text-align:center;">
                    ဤ Novel တွင် Chapter များ မရှိသေးပါ။
                </p>
            `;
            return;
        }

        // JSON ထဲက မူရင်း Chapter အစဉ်အတိုင်း ပြမည်
        let html = '';

        novel.chapters.forEach(ch => {
            const fileName = String(ch.file || '').split('/').pop();

            html += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.05); padding:10px; border-radius:6px; gap:10px; flex-wrap:wrap;">
                    <div>
                        <span style="font-weight:600; color:#fff;">
                            Chapter ${escapeHtml(String(ch.chapter_number))}
                        </span>

                        <span style="color:#a8b3cf; font-size:0.9rem;">
                            ${ch.title ? '- ' + escapeHtml(ch.title) : ''}
                        </span>
                    </div>

                    <div style="display:flex; gap:6px;">
                        <button
                            data-edit-chapter="${escapeHtml(fileName)}"
                            class="submit-btn"
                            style="padding:4px 8px; font-size:0.75rem; background:#eab308;"
                        >
                            <i class="fa-solid fa-pen"></i> ပြင်မည်
                        </button>

                        <button
                            data-delete-chapter="${escapeHtml(fileName)}"
                            class="submit-btn"
                            style="padding:4px 8px; font-size:0.75rem; background:#ef4444;"
                        >
                            <i class="fa-solid fa-trash"></i> ဖျက်မည်
                        </button>
                    </div>
                </div>
            `;
        });

        listContainer.innerHTML = html;

        listContainer.querySelectorAll('[data-edit-chapter]').forEach(btn => {
            btn.addEventListener('click', () => {
                openEditChapterModal(btn.dataset.editChapter, slug);
            });
        });

        listContainer.querySelectorAll('[data-delete-chapter]').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteChapter(btn.dataset.deleteChapter, slug);
            });
        });

    } catch (err) {
        console.error(err);

        listContainer.innerHTML = `
            <p style="color:#ef4444; text-align:center;">
                Chapter စာရင်းရယူရာတွင် အမှားရှိပါသည်
            </p>
        `;
    }
}

function closeChaptersModal() {
    document.getElementById('manage-chapters-modal').style.display = 'none';
}

// ==========================================
// 15. DELETE CHAPTER
// ==========================================

async function deleteChapter(fileName, slug) {
    if (!confirm('ဤ Chapter ကို ဖျက်ရန် သေချာပါသလား?')) {
        return;
    }

    try {
        const filePath = `content/chapters/${fileName}`;

        // JSON ထဲမှ သက်ဆိုင်ရာ Chapter ကို ဖယ်မည်
        await updateNovelsJsonFile({
            type: 'deleteChapter',
            slug,
            file: filePath
        });

        // JSON Update အောင်မြင်ပြီးမှ GitHub ဖိုင်ကို ဖျက်မည်
        await deleteFromGitHub(
            filePath,
            `Delete chapter ${fileName}`
        );

        alert('Chapter အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!');

        await openChaptersManager(slug, slug);

    } catch (err) {
        alert('Chapter ဖျက်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + err.message);
        console.error(err);
    }
}

// ==========================================
// 16. OPEN EDIT CHAPTER MODAL
// ==========================================

async function openEditChapterModal(fileName, slug) {
    try {
        const filePath = `content/chapters/${fileName}`;

        const res = await fetch(getGitHubContentsUrl(filePath), {
            headers: {
                "Authorization": `token ${getToken()}`
            }
        });

        if (!res.ok) {
            throw new Error('Chapter ဖိုင်ကို ဖတ်မရပါ။');
        }

        const data = await res.json();
        const text = decodeBase64(data.content);
        const parts = text.split('---');

        let chTitle = '';
        let chNum = 1;
        let chContent = '';

        if (parts.length >= 3) {
            parts[1].split('\n').forEach(line => {
                if (line.startsWith('title:')) {
                    chTitle = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
                }

                if (line.startsWith('chapter_number:')) {
                    chNum = parseInt(line.replace('chapter_number:', '').trim()) || 1;
                }
            });

            chContent = parts.slice(2).join('---').trim();
        }

        document.getElementById('edit-chapter-filename').value = fileName;
        document.getElementById('edit-chapter-slug').value = slug;
        document.getElementById('edit-chapter-number').value = chNum;
        document.getElementById('edit-chapter-title').value = chTitle;
        document.getElementById('edit-chapter-content').value = chContent;

        document.getElementById('edit-chapter-modal').style.display = 'flex';

    } catch (err) {
        alert('Chapter အချက်အလက်ယူရာတွင် အမှားရှိပါသည်: ' + err.message);
        console.error(err);
    }
}

function closeEditChapterModal() {
    document.getElementById('edit-chapter-modal').style.display = 'none';
}

// ==========================================
// 17. UPDATE CHAPTER
// ==========================================

async function handleUpdateChapter(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById('save-edit-chapter-btn');

    if (btn) btn.disabled = true;

    const fileName = document.getElementById('edit-chapter-filename').value;
    const slug = document.getElementById('edit-chapter-slug').value;
    const chNum = parseInt(document.getElementById('edit-chapter-number').value);
    const chTitle = document.getElementById('edit-chapter-title').value.trim();
    const chContent = document.getElementById('edit-chapter-content').value.trim();

    try {
        if (!Number.isInteger(chNum) || chNum < 1) {
            throw new Error('Chapter နံပါတ် မှန်ကန်စွာ ထည့်ပေးပါ။');
        }

        const oldFilePath = `content/chapters/${fileName}`;
        const newFileName = `${slug}-ch-${chNum}.md`;
        const newFilePath = `content/chapters/${newFileName}`;

        const novels = await getNovelsJsonData();
        const novel = novels.find(n => n.slug === slug);

        if (!novel || !Array.isArray(novel.chapters)) {
            throw new Error('သက်ဆိုင်ရာ Novel သို့မဟုတ် Chapter စာရင်းကို ရှာမတွေ့ပါ။');
        }

        const oldChapter = novel.chapters.find(ch => ch.file === oldFilePath);

        if (!oldChapter) {
            throw new Error('ပြင်ဆင်မည့် Chapter ကို novels.json ထဲတွင် ရှာမတွေ့ပါ။');
        }

        const duplicate = novel.chapters.some(ch =>
            ch.file !== oldFilePath &&
            (
                ch.file === newFilePath ||
                Number(ch.chapter_number) === chNum
            )
        );

        if (duplicate) {
            throw new Error('ဒီ Chapter နံပါတ်က ရှိပြီးသားပါ။');
        }

        // မူရင်း Markdown ထဲက created_at ကို ထိန်းထားမည်
        const oldRes = await fetch(getGitHubContentsUrl(oldFilePath), {
            headers: {
                "Authorization": `token ${getToken()}`
            }
        });

        if (!oldRes.ok) {
            throw new Error('မူရင်း Chapter ဖိုင်ကို ဖတ်မရပါ။');
        }

        const oldData = await oldRes.json();
        const oldText = decodeBase64(oldData.content);
        const oldParts = oldText.split('---');

        let createdAt = new Date().toISOString();

        if (oldParts.length >= 3) {
            oldParts[1].split('\n').forEach(line => {
                if (line.startsWith('created_at:')) {
                    createdAt = line.replace('created_at:', '').trim().replace(/^["']|["']$/g, '');
                }
            });
        }

        const markdownContent = `---
novel_slug: "${slug}"
chapter_number: ${chNum}
title: "${chTitle}"
created_at: "${createdAt}"
---

${chContent}
`;

        // ၁။ ဖိုင်အသစ်ကို အရင် Upload လုပ်မည်
        await uploadToGitHub(
            newFilePath,
            markdownContent,
            `Update ${slug} Chapter ${chNum}`
        );

        if (btn) btn.innerText = 'novels.json ကို အပ်ဒိတ်လုပ်နေသည်...';

        // ၂။ JSON ထဲမှာ မူရင်းနေရာကိုပဲ Update လုပ်မည်
        // အခြား Chapter Metadata များကို မဖျက်ပါ
        await updateNovelsJsonFile({
            type: 'updateChapter',
            slug,
            oldFile: oldFilePath,
            chapter: {
                chapter_number: chNum,
                title: chTitle,
                file: newFilePath
            }
        });

        // ၃။ JSON Update အောင်မြင်ပြီးမှ ဖိုင်အဟောင်းကို ဖျက်မည်
        if (fileName !== newFileName) {
            await deleteFromGitHub(
                oldFilePath,
                `Remove old chapter file ${fileName}`
            );
        }

        alert('Chapter အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!');

        closeEditChapterModal();

        await openChaptersManager(slug, slug);

    } catch (error) {
        alert('Chapter ပြင်ဆင်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + error.message);
        console.error(error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'ပြင်ဆင်မည်';
        }
    }
}


// ===================================================
// 18. ADMIN BACKEND API CONFIGURATION
// ===================================================

// Backend တည်ဆောက်ပြီးမှ Web App URL ထည့်ရန်
// ဥပမာ: https://script.google.com/macros/s/XXXXX/exec
const ADMIN_API_URL = '';

let adminDashboardData = null;
let adminUsersData = [];
let adminPromoCodesData = [];
let adminGeneratedPromoCodes = [];

// ---------------------------------------------------
// ADMIN API REQUEST
// ---------------------------------------------------

async function adminApiRequest(action, payload = {}) {
    if (!ADMIN_API_URL) {
        throw new Error(
            'Admin Backend API မချိတ်ဆက်ရသေးပါ။ Backend တည်ဆောက်ပြီးမှ အသုံးပြုနိုင်ပါမည်။'
        );
    }

    const response = await fetch(ADMIN_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
            action,
            ...payload
        })
    });

    const result = await response.json();

    if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Backend Request မအောင်မြင်ပါ။');
    }

    return result;
}

// ---------------------------------------------------
// COMMON ADMIN HELPERS
// ---------------------------------------------------

function adminGetElement(id) {
    return document.getElementById(id);
}

function adminSetText(id, value) {
    const element = adminGetElement(id);
    if (element) element.textContent = value ?? '';
}

function adminShowMessage(container, message, type = 'error') {
    if (!container) return;

    const color = type === 'success' ? '#22c55e' : '#ef4444';

    container.innerHTML = '';

    const messageElement = document.createElement('p');
    messageElement.style.color = color;
    messageElement.textContent = message;

    container.appendChild(messageElement);
}

function adminFormatNumber(value) {
    return Number(value || 0).toLocaleString('en-US');
}

// ===================================================
// 19. DASHBOARD STATISTICS
// ===================================================

async function loadAdminDashboard() {
    try {
        const result = await adminApiRequest('getAdminDashboard');

        const stats = result.stats || result.data || {};

        adminDashboardData = stats;

        adminSetText(
            'stat-total-users',
            adminFormatNumber(stats.totalUsers)
        );

        adminSetText(
            'stat-total-coins',
            adminFormatNumber(stats.totalCoins)
        );

        adminSetText(
            'stat-available-codes',
            adminFormatNumber(stats.availableCodes)
        );

        adminSetText(
            'stat-used-codes',
            adminFormatNumber(stats.usedCodes)
        );

        const container = adminGetElement('admin-dashboard-content');

        if (container) {
            container.textContent = 'Dashboard အချက်အလက်များ အောင်မြင်စွာ ရယူပြီးပါပြီ။';
        }

    } catch (error) {
        console.error('Dashboard Error:', error);

        const container = adminGetElement('admin-dashboard-content');

        if (container) {
            adminShowMessage(container, error.message);
        }
    }
}

// ===================================================
// 20. USER MANAGEMENT
// ===================================================

async function loadAdminUsers() {
    const container = adminGetElement('admin-user-list');

    if (container) {
        container.textContent = 'User စာရင်း ရယူနေသည်...';
    }

    try {
        const result = await adminApiRequest('getAdminUsers');

        adminUsersData = Array.isArray(result.users)
            ? result.users
            : [];

        renderAdminUsers(adminUsersData);

        adminSetText(
            'admin-user-summary',
            `စုစုပေါင်း User ${adminFormatNumber(adminUsersData.length)} ယောက်`
        );

    } catch (error) {
        console.error('User Loading Error:', error);

        if (container) {
            adminShowMessage(container, error.message);
        }
    }
}

function renderAdminUsers(users) {
    const container = adminGetElement('admin-user-list');

    if (!container) return;

    container.innerHTML = '';

    if (!users.length) {
        container.textContent = 'User မရှိသေးပါ။';
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'admin-user-item';

        const info = document.createElement('div');

        const username = document.createElement('strong');
        username.textContent = user.username || 'Unknown User';

        const details = document.createElement('p');
        details.textContent =
            `Coins: ${adminFormatNumber(user.coins)} | Status: ${user.status || 'Active'}`;

        info.append(username, details);

        const actions = document.createElement('div');

        const statusButton = document.createElement('button');
        statusButton.type = 'button';
        statusButton.textContent =
            user.status === 'Suspended' ? 'Activate' : 'Suspend';

        statusButton.addEventListener('click', () => {
            updateAdminUserStatus(
                user.userId,
                user.status === 'Suspended' ? 'Active' : 'Suspended'
            );
        });

        const coinButton = document.createElement('button');
        coinButton.type = 'button';
        coinButton.textContent = 'Adjust Coins';

        coinButton.addEventListener('click', () => {
            adjustAdminUserCoins(user.userId, user.username);
        });

        actions.append(statusButton, coinButton);
        card.append(info, actions);

        container.appendChild(card);
    });
}

async function updateAdminUserStatus(userId, status) {
    if (!userId) {
        alert('User ID မရှိပါ။');
        return;
    }

    if (!confirm(`ဒီ User ကို ${status} လုပ်မှာ သေချာပါသလား?`)) {
        return;
    }

    try {
        await adminApiRequest('updateUserStatus', {
            userId,
            status
        });

        alert('User Status ပြောင်းလဲပြီးပါပြီ။');

        await loadAdminUsers();

    } catch (error) {
        alert(error.message);
    }
}

async function adjustAdminUserCoins(userId, username) {
    if (!userId) {
        alert('User ID မရှိပါ။');
        return;
    }

    const amountInput = prompt(
        `${username || 'User'} အတွက် Coin အရေအတွက် ထည့်ပါ။\nအပေါင်း = ထည့်မည်၊ အနုတ် = လျှော့မည်`
    );

    if (amountInput === null) return;

    const amount = Number(amountInput);

    if (!Number.isSafeInteger(amount) || amount === 0) {
        alert('မှန်ကန်သော Coin အရေအတွက် ထည့်ပါ။');
        return;
    }

    const reason = prompt('Coin ပြောင်းလဲရသည့် အကြောင်းပြချက် ထည့်ပါ။');

    if (!reason || !reason.trim()) {
        alert('အကြောင်းပြချက် ထည့်ပေးပါ။');
        return;
    }

    try {
        await adminApiRequest('adjustUserCoins', {
            userId,
            amount,
            reason: reason.trim()
        });

        alert('Coin ပြောင်းလဲပြီးပါပြီ။');

        await loadAdminUsers();
        await loadAdminDashboard();

    } catch (error) {
        alert(error.message);
    }
}

function filterAdminUsers() {
    const input = adminGetElement('admin-user-search');

    if (!input) return;

    const query = input.value.trim().toLowerCase();

    const filtered = adminUsersData.filter(user =>
        String(user.username || '').toLowerCase().includes(query)
    );

    renderAdminUsers(filtered);
}

// ===================================================
// 21. CHAPTER PRICING
// ===================================================

async function loadChapterPricingNovelDropdown() {
    const dropdown = adminGetElement('pricing-novel-select');

    if (!dropdown) return;

    try {
        const novels = await getNovelsJsonData();

        dropdown.innerHTML = '<option value="">-- Novel ရွေးပါ --</option>';

        novels.forEach(novel => {
            const option = document.createElement('option');

            option.value = novel.slug;
            option.textContent = novel.title || novel.slug;

            dropdown.appendChild(option);
        });

    } catch (error) {
        console.error('Pricing Novel Dropdown Error:', error);
    }
}

async function loadChapterPricing() {
    const dropdown = adminGetElement('pricing-novel-select');
    const container = adminGetElement('chapter-pricing-list');

    if (!dropdown || !container) return;

    const novelSlug = dropdown.value;

    if (!novelSlug) {
        container.textContent = 'Novel တစ်ခု ရွေးချယ်ပါ။';
        return;
    }

    container.textContent = 'Chapter Pricing ရယူနေသည်...';

    try {
        const result = await adminApiRequest('getChapterPricing', {
            novelSlug
        });

        const chapters = Array.isArray(result.chapters)
            ? result.chapters
            : [];

        renderChapterPricing(novelSlug, chapters);

    } catch (error) {
        console.error('Chapter Pricing Error:', error);
        adminShowMessage(container, error.message);
    }
}

function renderChapterPricing(novelSlug, chapters) {
    const container = adminGetElement('chapter-pricing-list');

    if (!container) return;

    container.innerHTML = '';

    if (!chapters.length) {
        container.textContent = 'Chapter Pricing Data မရှိသေးပါ။';
        return;
    }

    chapters.forEach(chapter => {
        const row = document.createElement('div');
        row.className = 'admin-pricing-item';

        const title = document.createElement('span');

        title.textContent =
            `Chapter ${chapter.chapterNumber}: ${chapter.title || ''}`;

        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.min = '0';
        priceInput.step = '1';
        priceInput.value = Number(chapter.price || 0);
        priceInput.setAttribute('aria-label', 'Chapter Price');

        const freeLabel = document.createElement('label');

        const freeCheckbox = document.createElement('input');
        freeCheckbox.type = 'checkbox';
        freeCheckbox.checked = Number(chapter.price || 0) === 0;

        freeCheckbox.addEventListener('change', () => {
            if (freeCheckbox.checked) {
                priceInput.value = '0';
            }
        });

        freeLabel.append(freeCheckbox, document.createTextNode(' Free'));

        freeCheckbox.addEventListener('change', () => {
            priceInput.disabled = freeCheckbox.checked;
        });

        priceInput.disabled = freeCheckbox.checked;

        const saveButton = document.createElement('button');
        saveButton.type = 'button';
        saveButton.textContent = 'Save';

        saveButton.addEventListener('click', async () => {
            const price = Number(priceInput.value);

            if (!Number.isSafeInteger(price) || price < 0) {
                alert('မှန်ကန်သော Coin Price ထည့်ပါ။');
                return;
            }

            try {
                saveButton.disabled = true;

                await adminApiRequest('setChapterPrice', {
                    novelSlug,
                    chapterNumber: Number(chapter.chapterNumber),
                    price
                });

                alert('Chapter Price သိမ်းဆည်းပြီးပါပြီ။');

            } catch (error) {
                alert(error.message);

            } finally {
                saveButton.disabled = false;
            }
        });

        row.append(title, priceInput, freeLabel, saveButton);
        container.appendChild(row);
    });
}

// ===================================================
// 22. PROMO CODE GENERATOR
// ===================================================

function getSelectedPromoPackage() {
    const select = adminGetElement('promo-package');

    if (!select) return null;

    const packages = {
        '1000': {
            packageId: 'package_1000',
            price: 1000,
            baseCoins: 40,
            bonusCoins: 0,
            totalCoins: 40
        },
        '2000': {
            packageId: 'package_2000',
            price: 2000,
            baseCoins: 80,
            bonusCoins: 5,
            totalCoins: 85
        },
        '3000': {
            packageId: 'package_3000',
            price: 3000,
            baseCoins: 120,
            bonusCoins: 10,
            totalCoins: 130
        },
        '5000': {
            packageId: 'package_5000',
            price: 5000,
            baseCoins: 200,
            bonusCoins: 20,
            totalCoins: 220
        }
    };

    return packages[select.value] || null;
}

async function generateAdminPromoCodes() {
    const packageData = getSelectedPromoPackage();
    const quantityInput = adminGetElement('promo-quantity');
    const resultContainer = adminGetElement('promo-generation-result');
    const button = adminGetElement('generate-promo-btn');

    if (!packageData) {
        alert('Coin Package ရွေးချယ်ပါ။');
        return;
    }

    const quantity = Number(quantityInput?.value);

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
        alert('Promo Code အရေအတွက်ကို 1 မှ 500 အတွင်း ထည့်ပါ။');
        return;
    }

    if (!confirm(
        `${quantity} ခု Promo Code ထုတ်မှာ သေချာပါသလား?\n` +
        `${adminFormatNumber(packageData.totalCoins)} Coins / Code`
    )) {
        return;
    }

    try {
        if (button) button.disabled = true;

        const result = await adminApiRequest('generatePromoCodes', {
            package: packageData,
            quantity
        });

        adminGeneratedPromoCodes = Array.isArray(result.codes)
            ? result.codes
            : [];

        renderGeneratedPromoCodes();

        if (resultContainer && !adminGeneratedPromoCodes.length) {
            resultContainer.textContent =
                'Backend က Promo Code များကို သိမ်းဆည်းပြီးပါပြီ။';
        }

        await loadAdminPromoCodeLists();
        await loadAdminDashboard();

        alert('Promo Code များ ဖန်တီးပြီးပါပြီ။');

    } catch (error) {
        console.error('Promo Generation Error:', error);
        alert(error.message);

    } finally {
        if (button) button.disabled = false;
    }
}

function renderGeneratedPromoCodes() {
    const container = adminGetElement('promo-generation-result');

    if (!container) return;

    container.innerHTML = '';

    if (!adminGeneratedPromoCodes.length) {
        container.textContent = 'ထုတ်ပေးထားသော Code မရှိသေးပါ။';
        return;
    }

    adminGeneratedPromoCodes.forEach(item => {
        const code = typeof item === 'string' ? item : item.code;

        const line = document.createElement('p');
        line.textContent = code || '';

        container.appendChild(line);
    });
}

async function loadAdminPromoCodeLists() {
    try {
        const result = await adminApiRequest('getAdminPromoCodes');

        adminPromoCodesData = Array.isArray(result.codes)
            ? result.codes
            : [];

        renderAdminPromoCodeLists();

    } catch (error) {
        console.error('Promo Code List Error:', error);

        adminShowMessage(
            adminGetElement('available-promo-list'),
            error.message
        );
    }
}

function renderAdminPromoCodeLists() {
    const availableContainer = adminGetElement('available-promo-list');
    const usedContainer = adminGetElement('used-promo-list');

    if (availableContainer) availableContainer.innerHTML = '';
    if (usedContainer) usedContainer.innerHTML = '';

    const available = adminPromoCodesData.filter(code =>
        String(code.status).toLowerCase() === 'available'
    );

    const used = adminPromoCodesData.filter(code =>
        String(code.status).toLowerCase() === 'used'
    );

    function appendPromoRows(container, codes) {
        if (!container) return;

        if (!codes.length) {
            container.textContent = 'Code မရှိသေးပါ။';
            return;
        }

        codes.forEach(item => {
            const row = document.createElement('p');

            row.textContent =
                `${item.code} | ${adminFormatNumber(item.totalCoins)} Coins`;

            container.appendChild(row);
        });
    }

    appendPromoRows(availableContainer, available);
    appendPromoRows(usedContainer, used);
}

async function copyAdminPromoCodes() {
    const codes = adminGeneratedPromoCodes.map(item =>
        typeof item === 'string' ? item : item.code
    ).filter(Boolean);

    if (!codes.length) {
        alert('Copy လုပ်ရန် Code မရှိသေးပါ။');
        return;
    }

    try {
        await navigator.clipboard.writeText(codes.join('\n'));
        alert('Promo Code များ Copy ကူးပြီးပါပြီ။');

    } catch (error) {
        alert('Clipboard Copy မအောင်မြင်ပါ။');
    }
}

function exportAdminPromoCodesCSV() {
    const codes = adminGeneratedPromoCodes.map(item =>
        typeof item === 'string' ? item : item.code
    ).filter(Boolean);

    if (!codes.length) {
        alert('Export လုပ်ရန် Code မရှိသေးပါ။');
        return;
    }

    const csv = [
        'Promo Code',
        ...codes.map(code => `"${String(code).replace(/"/g, '""')}"`)
    ].join('\r\n');

    const blob = new Blob(
        ['\uFEFF' + csv],
        { type: 'text/csv;charset=utf-8;' }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `NovelVerse-Promo-Codes-${Date.now()}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

// ===================================================
// 23. TOP-UP SETTINGS
// ===================================================

async function loadAdminTopupSettings() {
    try {
        const result = await adminApiRequest('getTopupSettings');
        const settings = result.settings || {};

        const fields = {
            'settings-kbzpay-name': settings.kbzpayAccountName,
            'settings-kbzpay-phone': settings.kbzpayPhone,
            'settings-wavepay-name': settings.wavepayAccountName,
            'settings-wavepay-phone': settings.wavepayPhone,
            'settings-telegram-link': settings.telegramUrl
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = adminGetElement(id);

            if (element && value !== undefined) {
                element.value = value;
            }
        });

    } catch (error) {
        console.error('Top-up Settings Error:', error);

        alert(error.message);
    }
}

async function saveAdminTopupSettings() {
    const settings = {
        kbzpayAccountName:
            adminGetElement('settings-kbzpay-name')?.value.trim() || '',

        kbzpayPhone:
            adminGetElement('settings-kbzpay-phone')?.value.trim() || '',

        wavepayAccountName:
            adminGetElement('settings-wavepay-name')?.value.trim() || '',

        wavepayPhone:
            adminGetElement('settings-wavepay-phone')?.value.trim() || '',

        telegramUrl:
            adminGetElement('settings-telegram-link')?.value.trim() || ''
    };

    if (!settings.kbzpayPhone || !settings.wavepayPhone) {
        alert('KBZPay နှင့် WavePay ဖုန်းနံပါတ်များ ထည့်ပေးပါ။');
        return;
    }

    try {
        await adminApiRequest('saveTopupSettings', {
            settings
        });

        alert('Top-up Settings သိမ်းဆည်းပြီးပါပြီ။');

    } catch (error) {
        alert(error.message);
    }
}

// ===================================================
// 24. NEW ADMIN FEATURE EVENT LISTENERS
// ===================================================

function setupNewAdminFeatureListeners() {
    const userSearch = adminGetElement('admin-user-search');

    if (userSearch) {
        userSearch.addEventListener('input', filterAdminUsers);
    }

    const pricingDropdown = adminGetElement('pricing-novel-select');

    if (pricingDropdown) {
        pricingDropdown.addEventListener('change', loadChapterPricing);
    }

    const generateButton = adminGetElement('generate-promo-btn');

    if (generateButton) {
        generateButton.addEventListener('click', generateAdminPromoCodes);
    }

    const copyButton = adminGetElement('copy-promo-codes-btn');

    if (copyButton) {
        copyButton.addEventListener('click', copyAdminPromoCodes);
    }

    const exportButton = adminGetElement('export-promo-csv-btn');

    if (exportButton) {
        exportButton.addEventListener('click', exportAdminPromoCodesCSV);
    }

    const saveSettingsButton = adminGetElement('save-topup-settings-btn');

    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', saveAdminTopupSettings);
    }

    // မူရင်း inline switchTab() ကို မပြင်ဘဲ Tab ပြောင်းပြီးနောက်
    // သက်ဆိုင်ရာ Feature ကို Load လုပ်မည်။
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            const handler = button.getAttribute('onclick') || '';
            const match = handler.match(/switchTab\(['"]([^'"]+)['"]\)/);

            if (!match) return;

            const tabId = match[1];

            if (tabId === 'dashboard') loadAdminDashboard();

            if (tabId === 'users') loadAdminUsers();

            if (tabId === 'chapter-pricing') {
                loadChapterPricingNovelDropdown();
            }

            if (tabId === 'promo-generator') {
                loadAdminPromoCodeLists();
            }

            if (tabId === 'topup-settings') {
                loadAdminTopupSettings();
            }
        });
    });
}

// ===================================================
// 25. REGISTER NEW ADMIN FUNCTIONS
// ===================================================

document.addEventListener('DOMContentLoaded', () => {
    window.loadAdminDashboard = loadAdminDashboard;
    window.loadAdminUsers = loadAdminUsers;
    window.filterAdminUsers = filterAdminUsers;
    window.updateAdminUserStatus = updateAdminUserStatus;
    window.adjustAdminUserCoins = adjustAdminUserCoins;

    window.loadChapterPricing = loadChapterPricing;
    window.loadChapterPricingNovelDropdown = loadChapterPricingNovelDropdown;

    window.generateAdminPromoCodes = generateAdminPromoCodes;
    window.copyAdminPromoCodes = copyAdminPromoCodes;
    window.exportAdminPromoCodesCSV = exportAdminPromoCodesCSV;

    window.loadAdminTopupSettings = loadAdminTopupSettings;
    window.saveAdminTopupSettings = saveAdminTopupSettings;

    setupNewAdminFeatureListeners();

    // Login ပြီးသားဖြစ်လျှင် Dashboard Statistics ကို စတင်ဖတ်မည်။
    if (getToken()) {
        loadAdminDashboard();
    }
});
