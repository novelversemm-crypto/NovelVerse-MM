// ==========================================
// 🐙 GITHUB REPOSITORY CONFIGURATION
// ==========================================
const GITHUB_OWNER = "novelversemm-crypto"; // ကိုယ့်ရဲ့ GitHub Username
const GITHUB_REPO = "NovelVerse-MM";       // Repository နာမည်

// ==========================================
// ☁️ CLOUDINARY CONFIGURATION (ပုံများအတွက် ဆက်သုံးမည်)
// ==========================================
const CLOUDINARY_CLOUD_NAME = 'n1rewvpg'; 
const CLOUDINARY_UPLOAD_PRESET = 'novel_covers'; 

// DOM Loaded Event
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
});

function getToken() {
    return localStorage.getItem('github_token') || '';
}

// 1. Admin Login (GitHub Token ဖြင့် Login ဝင်ခြင်း)
function handleLogin(e) {
    if (e) e.preventDefault();
    const tokenInput = document.getElementById('github-token-input').value.trim();
    
    if (!tokenInput) {
        alert('ကျေးဇူးပြု၍ GitHub Token ထည့်ပါ။');
        return;
    }

    fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`, {
        headers: { "Authorization": `token ${tokenInput}` }
    })
    .then(res => {
        if (res.ok) {
            localStorage.setItem('github_token', tokenInput);
            alert('Admin Panel သို့ အောင်မြင်စွာ ဝင်ရောက်လိုက်ပါပြီ!');
            showDashboard();
        } else {
            alert('Token မှားယွင်းနေပါသည်။ (သို့မဟုတ် Permission မရှိပါ။)');
        }
    })
    .catch(err => {
        alert('ချိတ်ဆက်မှု အမှားအယွင်းရှိပါသည်: ' + err.message);
    });
}

function showDashboard() {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard-section');
    const logoutBtn = document.getElementById('logout-btn');

    if (loginSec) loginSec.style.display = 'none';
    if (dashSec) dashSec.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'block';

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
        showLogin();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) targetTab.style.display = 'block';

    if (tabId === 'add-chapter') loadNovelsDropdown();
    if (tabId === 'manage-novels') loadManageNovelsList();
}

// Helper: Upload File to GitHub via API
async function uploadToGitHub(filePath, fileContent, commitMessage) {
    const token = getToken();
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    let sha = null;
    const existingRes = await fetch(url, {
        headers: { "Authorization": `token ${token}` }
    });
    if (existingRes.ok) {
        const existingData = await existingRes.json();
        sha = existingData.sha;
    }

    const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

    const bodyData = {
        message: commitMessage,
        content: encodedContent
    };
    if (sha) bodyData.sha = sha;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'GitHub သို့ တင်၍မရပါ။');
    }
    return await response.json();
}

// Helper: Delete from GitHub
async function deleteFromGitHub(filePath, commitMessage) {
    const token = getToken();
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

    const existingRes = await fetch(url, {
        headers: { "Authorization": `token ${token}` }
    });
    if (!existingRes.ok) throw new Error('ဖိုင်ကို ရှာမတွေ့ပါ။');
    const existingData = await existingRes.json();

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            message: commitMessage,
            sha: existingData.sha
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'GitHub မှ ဖျက်၍မရပါ။');
    }
    return await response.json();
}

// ==========================================
// 🔄 HELPER: AUTOMATICALLY UPDATE novels.json
// ==========================================
async function updateNovelsJsonFile() {
    const token = getToken();
    const novelsDirUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/novels`;
    const chaptersDirUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/chapters`;
    
    try {
        const res = await fetch(novelsDirUrl, {
            headers: { "Authorization": `token ${token}` }
        });
        if (!res.ok) return;

        const files = await res.json();
        const mdFiles = files.filter(file => file.name.endsWith('.md'));

        let allChapterFiles = [];
        const chRes = await fetch(chaptersDirUrl, {
            headers: { "Authorization": `token ${token}` }
        });
        if (chRes.ok) {
            const chData = await chRes.json();
            allChapterFiles = chData.filter(file => file.name.endsWith('.md'));
        }

        let allNovelsData = [];

        for (const file of mdFiles) {
            const fileRes = await fetch(file.download_url);
            const markdownText = await fileRes.text();

            const parts = markdownText.split('---');
            let title = file.name.replace('.md', '');
            let coverUrl = '';
            let genre = 'Fantasy';
            let status = 'Ongoing';
            let synopsis = '';
            let createdAt = new Date().toISOString();
            let slug = file.name.replace('.md', '');

            if (parts.length >= 3) {
                const frontmatter = parts[1];
                frontmatter.split('\n').forEach(line => {
                    if (line.startsWith('title:')) title = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('cover_url:')) coverUrl = line.replace('cover_url:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('genre:')) genre = line.replace('genre:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('status:')) status = line.replace('status:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('created_at:')) createdAt = line.replace('created_at:', '').trim().replace(/^["']|["']$/g, '');
                });
                synopsis = parts.slice(2).join('---').trim();
            }

            // 🛠️ FIX: Novel တစ်ခုချင်းစီ၏ slug နှင့် တိကျမှန်ကန်သော Chapter ဖိုင်များကိုသာ ခွဲထုတ်ခြင်း
            let novelChapters = [];
            const exactMatchedChapters = allChapterFiles.filter(ch => {
                // ဥပမာ - slug က 'abc' ဆိုရင် 'abc-ch-1.md' ကိုပဲ ယူမည် (အခြား 'abcd-ch-1.md' တွေပါ မပါသွားစေရန် -ch- ပုံစံကို တိကျအောင်စစ်သည်)
                return ch.name.startsWith(`${slug}-ch-`) && ch.name.endsWith('.md');
            });
            
            for (const chFile of exactMatchedChapters) {
                const chRes = await fetch(chFile.download_url);
                const chText = await chRes.text();
                const chParts = chText.split('---');
                
                let chTitle = '';
                let chNum = 1;

                if (chParts.length >= 3) {
                    chParts[1].split('\n').forEach(line => {
                        if (line.startsWith('title:')) chTitle = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
                        if (line.startsWith('chapter_number:')) chNum = parseInt(line.replace('chapter_number:', '').trim()) || 1;
                    });
                }

                novelChapters.push({
                    chapter_number: chNum,
                    title: chTitle,
                    file: `content/chapters/${chFile.name}`
                });
            }

            // Chapter နံပါတ်အလိုက် ကြီးစဉ်ငယ်လိုက် စီခြင်း
            novelChapters.sort((a, b) => a.chapter_number - b.chapter_number);

            allNovelsData.push({ 
                slug, 
                title, 
                coverUrl, 
                genre, 
                status, 
                synopsis, 
                createdAt,
                chapters: novelChapters 
            });
        }

        const jsonContent = JSON.stringify(allNovelsData, null, 2);
        await uploadToGitHub('content/novels.json', jsonContent, 'Auto-update novels.json with chapters');

    } catch (err) {
        console.error("Error updating novels.json:", err);
    }
}

// 3. Novel အသစ် တင်ရန်
async function handleAddNovel(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('save-novel-btn');
    if (btn) btn.disabled = true;

    const title = document.getElementById('novel-title').value.trim();
    const fileInput = document.getElementById('novel-cover-file');
    const file = fileInput ? fileInput.files[0] : null;
    const status = document.getElementById('novel-status').value;
    const synopsis = document.getElementById('novel-synopsis').value.trim();

    if (!file) {
        alert('ကျေးဇူးပြု၍ Cover Image File ရွေးချယ်ပေးပါ!');
        if (btn) btn.disabled = false;
        return;
    }

    try {
        if (btn) btn.innerText = 'Cloudinary သို့ Cover Image တင်နေသည်...';
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
            throw new Error(uploadData.error ? uploadData.error.message : 'Cloudinary Upload မှားယွင်းနေပါသည်');
        }

        const coverUrl = uploadData.secure_url;

        let selectedGenres = [];
        document.querySelectorAll('input[name="novel-genre-chip"]:checked').forEach(cb => {
            selectedGenres.push(cb.value);
        });

        // မြန်မာစာနဲ့ Space များကို အဆင်ပြေအောင် ပြောင်းလဲပေးခြင်း
let slug = title.trim().replace(/\s+/g, '-').replace(/[\/\\?%*:|"<>]/g, '');
if (!slug || slug === '-') {
    slug = 'novel-' + Date.now(); // အကယ်၍ ပြောင်းလို့မရရင် Timestamp အသုံးပြုမည်
}

        const markdownContent = `---
title: "${title}"
cover_url: "${coverUrl}"
genre: "${selectedGenres.join(', ')}"
status: "${status}"
created_at: "${new Date().toISOString()}"
---

${synopsis}
`;

        if (btn) btn.innerText = 'GitHub သို့ Novel ဖိုင် သိမ်းဆည်းနေသည်...';
        const novelFilePath = `content/novels/${slug}.md`;
        await uploadToGitHub(novelFilePath, markdownContent, `Add novel: ${title}`);

        if (btn) btn.innerText = 'novels.json ကို အပ်ဒိတ်လုပ်နေသည်...';
        await updateNovelsJsonFile();

        alert('Novel အသစ် အောင်မြင်စွာ တင်ပြီးပါပြီ!');
        document.getElementById('add-novel-form').reset();
        loadNovelsDropdown();
        loadManageNovelsList();

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

async function handleAddChapter(e) {
    if (e) e.preventDefault();
    const btn = document.getElementById('save-chapter-btn');
    if (btn) btn.disabled = true;

    const novelSlug = document.getElementById('select-novel-dropdown').value;
    const chNum = parseInt(document.getElementById('chapter-number').value);
    const chTitle = document.getElementById('chapter-title-input').value.trim();
    const chContent = document.getElementById('chapter-content-input').value.trim();

    try {
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

        await uploadToGitHub(chapterFilePath, markdownContent, `Add ${novelSlug} Chapter ${chNum}`);
        
        if (btn) btn.innerText = 'novels.json ကို အပ်ဒိတ်လုပ်နေသည်...';
        
        // 🛠️ GitHub server ဖိုင်အသစ်ကို သိမ်းဆည်းချိန်ရအောင် ၁.၅ စက္ကန့် စောင့်ခိုင်းခြင်း
        await new Promise(resolve => setTimeout(resolve, 1500));

        await updateNovelsJsonFile();

        alert(`Chapter ${chNum} တင်ပြီးပါပြီ!`);
        document.getElementById('chapter-number').value = chNum + 1;
        document.getElementById('chapter-title-input').value = '';
        document.getElementById('chapter-content-input').value = '';
    } catch (error) {
        alert('Chapter တင်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = 'Chapter သိမ်းဆည်းမည်';
        }
    }
}

async function loadNovelsDropdown() {
    const dropdown = document.getElementById('select-novel-dropdown');
    if (!dropdown) return;

    try {
        const token = getToken();
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/novels`;
        
        const res = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (!res.ok) {
            dropdown.innerHTML = '<option value="">-- Novel များ မရှိသေးပါ --</option>';
            return;
        }

        const files = await res.json();
        let options = '<option value="">-- Novel ရွေးပါ --</option>';

        for (const file of files) {
            if (file.name.endsWith('.md')) {
                // ဖိုင်ရဲ့ content ကို အရင်ဖတ်မယ်
                const fileRes = await fetch(file.download_url);
                const markdownText = await fileRes.text();
                
                // Frontmatter ထဲက title ကို ရှာမယ်
                let title = file.name.replace('.md', ''); // default
                const parts = markdownText.split('---');
                if (parts.length >= 3) {
                    parts[1].split('\n').forEach(line => {
                        if (line.startsWith('title:')) {
                            title = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
                        }
                    });
                }
                
                const slug = file.name.replace('.md', '');
                // Dropdown မှာ title (မြန်မာစာ) ကို ပြပေးမယ်၊ value ကတော့ slug အတိုင်းထားမယ်
                options += `<option value="${slug}">${title}</option>`;
            }
        }
        dropdown.innerHTML = options;
    } catch (error) {
        console.error("Dropdown load error:", error);
    }
}

let allAdminNovels = [];

async function loadManageNovelsList() {
    const container = document.getElementById('admin-novel-list');
    if (!container) return;

    container.innerHTML = '<p style="color:#aaa; text-align:center;">Novel များကို ရယူနေသည်...</p>';

    try {
        const token = getToken();
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/novels`;
        
        const res = await fetch(url, {
            headers: { "Authorization": `token ${token}` }
        });

        if (!res.ok) {
            container.innerHTML = '<p style="color:#aaa; text-align:center;">Novel များ မရှိသေးပါ။</p>';
            return;
        }

        const files = await res.json();
        const mdFiles = files.filter(file => file.name.endsWith('.md'));

        if (mdFiles.length === 0) {
            container.innerHTML = '<p style="color:#aaa; text-align:center;">Novel များ မရှိသေးပါ။</p>';
            return;
        }

        allAdminNovels = [];
        for (const file of mdFiles) {
            const fileRes = await fetch(file.download_url);
            const markdownText = await fileRes.text();

            const parts = markdownText.split('---');
            let title = file.name.replace('.md', '');
            let coverUrl = '';
            let genre = 'No Genre';
            let status = 'Ongoing';
            let synopsis = '';
            let slug = file.name.replace('.md', '');

            if (parts.length >= 3) {
                const frontmatter = parts[1];
                frontmatter.split('\n').forEach(line => {
                    if (line.startsWith('title:')) title = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('cover_url:')) coverUrl = line.replace('cover_url:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('genre:')) genre = line.replace('genre:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('status:')) status = line.replace('status:', '').trim().replace(/^["']|["']$/g, '');
                });
                synopsis = parts.slice(2).join('---').trim();
            }

            allAdminNovels.push({ slug, title, coverUrl, genre, status, synopsis });
        }

        renderAdminNovelsList(allAdminNovels);

    } catch (error) {
        console.error("Manage list load error:", error);
        container.innerHTML = '<p style="color:#ef4444; text-align:center;">ဒေတာရယူရာတွင် အမှားအယွင်းရှိပါသည်</p>';
    }
}

function renderAdminNovelsList(novels) {
    const container = document.getElementById('admin-novel-list');
    if (!container) return;

    if (novels.length === 0) {
        container.innerHTML = '<p style="color:#aaa; text-align:center;">ရှာမတွေ့ပါ</p>';
        return;
    }

    // Clear container first
    container.innerHTML = '';

    novels.forEach(novel => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'admin-novel-item';
        itemDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 12px; margin-bottom: 10px; border-radius: 8px; gap: 10px; flex-wrap: wrap;';

        itemDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 200px;">
                <img src="${novel.coverUrl}" class="admin-cover" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;" onerror="this.src='https://via.placeholder.com/50x70?text=No+Image'">
                <div>
                    <div class="admin-novel-title" style="font-weight: 600; color: #fff;">${novel.title}</div>
                    <div class="admin-novel-meta" style="font-size: 0.8rem; color: #a8b3cf;">${novel.genre} • ${novel.status}</div>
                </div>
            </div>
            <div style="display: flex; gap: 6px;" class="admin-action-btns">
                <button class="submit-btn btn-chapters" style="padding: 6px 10px; font-size: 0.8rem; background: #3b82f6;"><i class="fa-solid fa-book-open"></i> Chapters</button>
                <button class="submit-btn btn-edit" style="padding: 6px 10px; font-size: 0.8rem; background: #eab308;"><i class="fa-solid fa-pen"></i> Edit</button>
                <button class="submit-btn btn-delete" style="padding: 6px 10px; font-size: 0.8rem; background: #ef4444;"><i class="fa-solid fa-trash"></i> Delete</button>
            </div>
        `;

        // Event Listener များ သုံးခြင်းဖြင့် Quote (Single/Double quotes) ကြောင့် Syntax Error တက်ခြင်းကို ၁၀၀% ကာကွယ်ပေးသည်
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

function filterAdminNovels() {
    const query = document.getElementById('admin-search-novel').value.toLowerCase();
    const filtered = allAdminNovels.filter(n => n.title.toLowerCase().includes(query));
    renderAdminNovelsList(filtered);
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

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

async function handleUpdateNovel(e) {
    if (e) e.preventDefault();
    const slug = document.getElementById('edit-novel-id').value;
    const title = document.getElementById('edit-novel-title').value.trim();
    const status = document.getElementById('edit-novel-status').value;
    const synopsis = document.getElementById('edit-novel-synopsis').value.trim();

    try {
        const novelFilePath = `content/novels/${slug}.md`;
        const token = getToken();
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${novelFilePath}`, {
            headers: { "Authorization": `token ${token}` }
        });
        
        let coverUrl = '';
        let genre = 'Action';
        let createdAt = new Date().toISOString();

        if (res.ok) {
            const data = await res.json();
            const text = decodeURIComponent(escape(atob(data.content)));
            const parts = text.split('---');
            if (parts.length >= 3) {
                parts[1].split('\n').forEach(line => {
                    if (line.startsWith('cover_url:')) coverUrl = line.replace('cover_url:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('genre:')) genre = line.replace('genre:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('created_at:')) createdAt = line.replace('created_at:', '').trim().replace(/^["']|["']$/g, '');
                });
            }
        }

        const markdownContent = `---
title: "${title}"
cover_url: "${coverUrl}"
genre: "${genre}"
status: "${status}"
created_at: "${createdAt}"
---

${synopsis}
`;

        await uploadToGitHub(novelFilePath, markdownContent, `Update novel: ${title}`);
        await updateNovelsJsonFile();

        alert('Novel အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!');
        closeEditModal();
        loadManageNovelsList();
    } catch (err) {
        alert('ပြင်ဆင်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + err.message);
    }
}

async function deleteNovel(slug, title) {
    if (!confirm(`"${title}" နိုဗယ်နှင့် ဆက်စပ်နေသော Chapter များ အပါအဝင် အချက်အလက်အားလုံးကို ဖျက်ရန် သေချာပါသလား?`)) return;

    try {
        const token = getToken();
        
        // ၁။ chapters ဖိုင်တွဲထဲက ဒီ Novel နဲ့ သက်ဆိုင်တဲ့ Chapter ဖိုင်အားလုံးကို ရှာပြီး အရင်ဖျက်ရန်
        const chRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/chapters`, {
            headers: { "Authorization": `token ${token}` }
        });

        if (chRes.ok) {
            const files = await chRes.json();
            const relatedChapters = files.filter(f => f.name.startsWith(`${slug}-ch-`) && f.name.endsWith('.md'));
            
            for (const chFile of relatedChapters) {
                await deleteFromGitHub(`content/chapters/${chFile.name}`, `Delete chapter ${chFile.name} for novel ${slug}`);
            }
        }

        // ၂။ Novel ရဲ့ .md ဖိုင်ကို ဖျက်ရန်
        await deleteFromGitHub(`content/novels/${slug}.md`, `Delete novel: ${title}`);
        
        // ၃။ novels.json ကို အပ်ဒိတ်လုပ်ရန်
        await updateNovelsJsonFile();

        alert('Novel နှင့် ဆက်စပ် Chapter အားလုံး အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!');
        loadManageNovelsList();
        loadNovelsDropdown();
    } catch (err) {
        alert('ဖျက်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + err.message);
    }
}

async function openChaptersManager(slug, title) {
    const modal = document.getElementById('manage-chapters-modal');
    const listContainer = document.getElementById('admin-chapter-list');
    listContainer.innerHTML = `<p style="color:#aaa; text-align:center;">"${title}" ၏ Chapter များကို ရှာနေသည်...</p>`;
    modal.style.display = 'flex';

    try {
        const token = getToken();
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/content/chapters`, {
            headers: { "Authorization": `token ${token}` }
        });

        if (!res.ok) {
            listContainer.innerHTML = '<p style="color:#aaa; text-align:center;">Chapter များ မရှိသေးပါ။</p>';
            return;
        }

        const files = await res.json();
        const chapterFiles = files.filter(f => f.name.startsWith(slug + '-ch-') && f.name.endsWith('.md'));

        if (chapterFiles.length === 0) {
            listContainer.innerHTML = '<p style="color:#aaa; text-align:center;">ဤ Novel တွင် Chapter များ မရှိသေးပါ။</p>';
            return;
        }

        let html = '';
        for (const file of chapterFiles) {
            const fileRes = await fetch(file.download_url);
            const markdownText = await fileRes.text();
            let chTitle = '';
            let chNum = '';
            
            const parts = markdownText.split('---');
            if (parts.length >= 3) {
                parts[1].split('\n').forEach(line => {
                    if (line.startsWith('title:')) chTitle = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
                    if (line.startsWith('chapter_number:')) chNum = line.replace('chapter_number:', '').trim();
                });
            }

            html += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px;">
                    <div>
                        <span style="font-weight: 600; color: #fff;">Chapter ${chNum}</span> 
                        <span style="color: #a8b3cf; font-size: 0.9rem;">${chTitle ? '- ' + chTitle : ''}</span>
                    </div>
                    <button onclick="deleteChapter('${file.name}', '${slug}')" class="submit-btn" style="padding: 4px 8px; font-size: 0.75rem; background: #ef4444;"><i class="fa-solid fa-trash"></i> ဖျက်မည်</button>
                </div>
            `;
        }
        listContainer.innerHTML = html;
    } catch (err) {
        listContainer.innerHTML = '<p style="color:#ef4444; text-align:center;">Chapter စာရင်းရယူရာတွင် အမှားရှိပါသည်</p>';
    }
}

function closeChaptersModal() {
    document.getElementById('manage-chapters-modal').style.display = 'none';
}

async function deleteChapter(fileName, slug) {
    if (!confirm('ဤ Chapter ကို ဖျက်ရန် သေချာပါသလား?')) return;
    try {
        await deleteFromGitHub(`content/chapters/${fileName}`, `Delete chapter ${fileName}`);
        await updateNovelsJsonFile(); 
        alert('Chapter အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!');
        openChaptersManager(slug, slug);
    } catch (err) {
        alert('Chapter ဖျက်ရာတွင် အမှားအယွင်းရှိပါသည်: ' + err.message);
    }
}
