
// ==========================================
// 🐙 GITHUB REPOSITORY CONFIGURATION
// ==========================================
const GITHUB_OWNER = "novelversemm-crypto";
const GITHUB_REPO = "NovelVerse-MM";

// ==========================================
// ☁️ CLOUDINARY CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = "n1rewvpg";
const CLOUDINARY_UPLOAD_PRESET = "novel_covers";

const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

// ==========================================
// DOM LOADED
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const savedToken = localStorage.getItem("github_token");

    if (savedToken) showDashboard();
    else showLogin();

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

function getToken() {
    return localStorage.getItem("github_token") || "";
}

// ==========================================
// GITHUB HELPERS
// ==========================================

function githubHeaders() {
    return {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/vnd.github+json"
    };
}

function encodeBase64(text) {
    return btoa(unescape(encodeURIComponent(text)));
}

function decodeBase64(text) {
    return decodeURIComponent(escape(atob(text.replace(/\s/g, ""))));
}

function yamlQuote(value) {
    return JSON.stringify(String(value ?? ""));
}

// Parse simple YAML frontmatter used by this project.
function parseFrontmatter(markdown) {
    const match = markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);

    if (!match) {
        return {
            metadata: {},
            body: markdown
        };
    }

    const metadata = {};

    match[1].split(/\r?\n/).forEach(line => {
        const index = line.indexOf(":");
        if (index === -1) return;

        const key = line.slice(0, index).trim();
        let value = line.slice(index + 1).trim();

        if (!key) return;

        if (
            value.startsWith('"') &&
            value.endsWith('"')
        ) {
            try {
                value = JSON.parse(value);
            } catch {
                value = value.slice(1, -1);
            }
        } else if (
            value.startsWith("'") &&
            value.endsWith("'")
        ) {
            value = value.slice(1, -1);
        } else if (value === "true") {
            value = true;
        } else if (value === "false") {
            value = false;
        } else if (value !== "" && !isNaN(value)) {
            value = Number(value);
        }

        metadata[key] = value;
    });

    return {
        metadata,
        body: markdown.slice(match[0].length).trim()
    };
}

function makeMarkdown(metadata, body) {
    const frontmatter = Object.entries(metadata)
        .map(([key, value]) => {
            if (typeof value === "number" || typeof value === "boolean") {
                return `${key}: ${value}`;
            }

            return `${key}: ${yamlQuote(value)}`;
        })
        .join("\n");

    return `---\n${frontmatter}\n---\n\n${body}\n`;
}

async function getGitHubFile(filePath) {
    const response = await fetch(
        `${GITHUB_API}/contents/${filePath}`,
        { headers: githubHeaders() }
    );

    if (response.status === 404) return null;

    if (!response.ok) {
        throw new Error(`GitHub ဖိုင်ဖတ်မရပါ: ${filePath}`);
    }

    const data = await response.json();

    return {
        ...data,
        text: decodeBase64(data.content)
    };
}

async function getGitHubDirectory(path) {
    const response = await fetch(
        `${GITHUB_API}/contents/${path}`,
        { headers: githubHeaders() }
    );

    if (response.status === 404) return [];

    if (!response.ok) {
        throw new Error(`GitHub Folder ဖတ်မရပါ: ${path}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
        throw new Error(`${path} သည် Folder မဟုတ်ပါ။`);
    }

    return data.filter(file => file.type === "file" && file.name.endsWith(".md"));
}

// ==========================================
// ADMIN LOGIN
// ==========================================

function handleLogin(e) {
    if (e) e.preventDefault();

    const tokenInput = document.getElementById("github-token-input").value.trim();

    if (!tokenInput) {
        alert("ကျေးဇူးပြု၍ GitHub Token ထည့်ပါ။");
        return;
    }

    fetch(`${GITHUB_API}`, {
        headers: {
            Authorization: `Bearer ${tokenInput}`,
            Accept: "application/vnd.github+json"
        }
    })
    .then(res => {
        if (!res.ok) {
            throw new Error("Token မှားယွင်းနေပါသည်။ သို့မဟုတ် Permission မရှိပါ။");
        }

        localStorage.setItem("github_token", tokenInput);
        alert("Admin Panel သို့ အောင်မြင်စွာ ဝင်ရောက်လိုက်ပါပြီ!");
        showDashboard();
    })
    .catch(err => alert(err.message));
}

function showDashboard() {
    const loginSec = document.getElementById("login-section");
    const dashSec = document.getElementById("dashboard-section");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginSec) loginSec.style.display = "none";
    if (dashSec) dashSec.style.display = "block";
    if (logoutBtn) logoutBtn.style.display = "block";

    loadNovelsDropdown();
    loadManageNovelsList();
}

function showLogin() {
    const loginSec = document.getElementById("login-section");
    const dashSec = document.getElementById("dashboard-section");
    const logoutBtn = document.getElementById("logout-btn");

    if (loginSec) loginSec.style.display = "block";
    if (dashSec) dashSec.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "none";
}

function handleLogout() {
    if (confirm("Admin အကောင့်မှ ထွက်ရန် သေချာပါသလား?")) {
        localStorage.removeItem("github_token");
        showLogin();
    }
}

function switchTab(tabId) {
    document.querySelectorAll(".tab-content").forEach(el => {
        el.style.display = "none";
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const targetTab = document.getElementById(`tab-${tabId}`);

    if (targetTab) targetTab.style.display = "block";

    if (tabId === "add-chapter") loadNovelsDropdown();
    if (tabId === "manage-novels") loadManageNovelsList();
}

// ==========================================
// GITHUB UPLOAD
// ==========================================

async function uploadToGitHub(filePath, fileContent, commitMessage) {
    const url = `${GITHUB_API}/contents/${filePath}`;

    const existingRes = await fetch(url, {
        headers: githubHeaders()
    });

    let sha = null;

    if (existingRes.ok) {
        const existingData = await existingRes.json();
        sha = existingData.sha;
    } else if (existingRes.status !== 404) {
        throw new Error("GitHub ရှိ ဖိုင်အဟောင်းကို စစ်ဆေးမရပါ။");
    }

    const bodyData = {
        message: commitMessage,
        content: encodeBase64(fileContent)
    };

    if (sha) bodyData.sha = sha;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            ...githubHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "GitHub သို့ သိမ်း၍မရပါ။");
    }

    return response.json();
}

async function deleteFromGitHub(filePath, commitMessage) {
    const url = `${GITHUB_API}/contents/${filePath}`;

    const existingRes = await fetch(url, {
        headers: githubHeaders()
    });

    if (!existingRes.ok) {
        throw new Error(`ဖိုင်ကို ရှာမတွေ့ပါ: ${filePath}`);
    }

    const existingData = await existingRes.json();

    const response = await fetch(url, {
        method: "DELETE",
        headers: {
            ...githubHeaders(),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: commitMessage,
            sha: existingData.sha
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "GitHub မှ ဖျက်၍မရပါ။");
    }

    return response.json();
}

// ==========================================
// 🔒 SAFE novels.json UPDATE
// မူရင်း Novel / Chapter Field များကို ထိန်းသိမ်းမည်
// ==========================================

async function updateNovelsJsonFile() {
    try {
        // 1. မူရင်း JSON ကို အရင်ဖတ်မည်
        const existingFile = await getGitHubFile("content/novels.json");

        let existingNovels = [];

        if (existingFile) {
            try {
                existingNovels = JSON.parse(existingFile.text);

                if (!Array.isArray(existingNovels)) {
                    throw new Error("novels.json သည် Array ပုံစံမဟုတ်ပါ။");
                }
            } catch (error) {
                throw new Error(
                    "မူရင်း novels.json ကို ဖတ်မရပါ။ Data မပျောက်စေရန် Update ကို ရပ်လိုက်ပါသည်။ " +
                    error.message
                );
            }
        }

        const oldNovelMap = new Map(
            existingNovels.map(novel => [novel.slug, novel])
        );

        // 2. Novel / Chapter Markdown ဖိုင်များ ရယူမည်
        const novelFiles = await getGitHubDirectory("content/novels");
        const chapterFiles = await getGitHubDirectory("content/chapters");

        const allNovelsData = [];

        for (const file of novelFiles) {
            const novelFile = await getGitHubFile(`content/novels/${file.name}`);

            if (!novelFile) continue;

            const parsedNovel = parseFrontmatter(novelFile.text);
            const meta = parsedNovel.metadata;

            const slug = file.name.replace(/\.md$/, "");
            const oldNovel = oldNovelMap.get(slug) || {};

            // မူရင်း Novel Field အားလုံးကို ထိန်းသိမ်းပြီး
            // Markdown ထဲက လက်ရှိအချက်အလက်များကိုသာ Update လုပ်မည်
            const novelData = {
                ...oldNovel,
                slug,
                title: meta.title ?? oldNovel.title ?? slug,
                coverUrl: meta.cover_url ?? oldNovel.coverUrl ?? "",
                genre: meta.genre ?? oldNovel.genre ?? "Fantasy",
                status: meta.status ?? oldNovel.status ?? "Ongoing",
                synopsis: parsedNovel.body ?? oldNovel.synopsis ?? "",
                createdAt: meta.created_at ?? oldNovel.createdAt ?? new Date().toISOString()
            };

            const oldChapters = Array.isArray(oldNovel.chapters)
                ? oldNovel.chapters
                : [];

            const oldChapterMap = new Map(
                oldChapters.map(ch => [
                    ch.file || `${slug}-ch-${ch.chapter_number}.md`,
                    ch
                ])
            );

            const matchedChapterFiles = chapterFiles.filter(chFile => {
                return chFile.name.startsWith(`${slug}-ch-`);
            });

            const novelChapters = [];

            for (const chFile of matchedChapterFiles) {
                const chapterPath = `content/chapters/${chFile.name}`;
                const chapterFile = await getGitHubFile(chapterPath);

                if (!chapterFile) continue;

                const parsedChapter = parseFrontmatter(chapterFile.text);
                const chMeta = parsedChapter.metadata;

                const chNum = Number(chMeta.chapter_number) || 1;
                const oldChapter = oldChapterMap.get(chapterPath) || {};

                const isLocked = chMeta.is_locked === true ||
                    chMeta.is_locked === "true";

                const coinPrice = isLocked
                    ? Math.max(1, Number(chMeta.coin_price) || 1)
                    : 0;

                novelChapters.push({
                    ...oldChapter,
                    chapter_number: chNum,
                    title: chMeta.title ?? oldChapter.title ?? "",
                    file: chapterPath,
                    is_locked: isLocked,
                    coin_price: coinPrice
                });
            }

            novelChapters.sort((a, b) => a.chapter_number - b.chapter_number);

            novelData.chapters = novelChapters;
            allNovelsData.push(novelData);
        }

        // 3. မူရင်း JSON ကို Field မပျောက်စေဘဲ Update လုပ်မည်
        const jsonContent = JSON.stringify(allNovelsData, null, 2);

        await uploadToGitHub(
            "content/novels.json",
            jsonContent,
            "Safely update novels.json"
        );

        console.log("novels.json safely updated.");

        return true;

    } catch (err) {
        console.error("novels.json update error:", err);
        throw err;
    }
}

// ==========================================
// 3. ADD NOVEL
// ==========================================

async function handleAddNovel(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById("save-novel-btn");
    if (btn) btn.disabled = true;

    const title = document.getElementById("novel-title").value.trim();
    const fileInput = document.getElementById("novel-cover-file");
    const file = fileInput ? fileInput.files[0] : null;
    const status = document.getElementById("novel-status").value;
    const synopsis = document.getElementById("novel-synopsis").value.trim();

    if (!title || !file) {
        alert("Novel Title နှင့် Cover Image ရွေးချယ်ပေးပါ။");
        if (btn) btn.disabled = false;
        return;
    }

    try {
        if (btn) btn.innerText = "Cloudinary သို့ Cover Image တင်နေသည်...";

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
            throw new Error(uploadData.error?.message || "Cloudinary Upload မှားယွင်းနေပါသည်။");
        }

        const coverUrl = uploadData.secure_url;

        const selectedGenres = [];

        document.querySelectorAll('input[name="novel-genre-chip"]:checked')
            .forEach(cb => selectedGenres.push(cb.value));

        let slug = title.toLowerCase()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-");

        if (!slug || slug === "-") {
            slug = "novel-" + Date.now();
        }

        const markdownContent = makeMarkdown({
            title,
            cover_url: coverUrl,
            genre: selectedGenres.join(", "),
            status,
            created_at: new Date().toISOString()
        }, synopsis);

        if (btn) btn.innerText = "GitHub သို့ Novel သိမ်းဆည်းနေသည်...";

        await uploadToGitHub(
            `content/novels/${slug}.md`,
            markdownContent,
            `Add novel: ${title}`
        );

        if (btn) btn.innerText = "novels.json Update လုပ်နေသည်...";

        await updateNovelsJsonFile();

        alert("Novel အသစ် အောင်မြင်စွာ တင်ပြီးပါပြီ!");

        document.getElementById("add-novel-form").reset();

        loadNovelsDropdown();
        loadManageNovelsList();

    } catch (err) {
        alert("အမှားအယွင်းရှိပါသည်: " + err.message);
        console.error(err);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Novel သိမ်းဆည်းမည်";
        }
    }
}

// ==========================================
// 4. ADD CHAPTER + LOCK / COIN
// ==========================================

async function handleAddChapter(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById("save-chapter-btn");
    if (btn) btn.disabled = true;

    const novelSlug = document.getElementById("select-novel-dropdown").value;
    const chNum = parseInt(document.getElementById("chapter-number").value);
    const chTitle = document.getElementById("chapter-title-input").value.trim();
    const chContent = document.getElementById("chapter-content-input").value.trim();

    const lockInput = document.getElementById("chapter-is-locked");
    const priceInput = document.getElementById("chapter-coin-price");

    const isLocked = lockInput ? lockInput.checked : false;
    const coinPrice = isLocked ? parseInt(priceInput?.value) || 0 : 0;

    if (!novelSlug || !Number.isInteger(chNum) || chNum < 1 || !chTitle || !chContent) {
        alert("Novel, Chapter Number, Title နှင့် Content အားလုံး ဖြည့်ပါ။");
        if (btn) btn.disabled = false;
        return;
    }

    if (isLocked && coinPrice < 1) {
        alert("Locked Chapter အတွက် Coin Price ကို 1 နှင့်အထက် ထည့်ပါ။");
        if (btn) btn.disabled = false;
        return;
    }

    try {
        const chapterFileName = `${novelSlug}-ch-${chNum}.md`;
        const chapterFilePath = `content/chapters/${chapterFileName}`;

        // ရှိပြီးသား Chapter ကို မတော်တဆ overwrite မဖြစ်စေရန်
        const existing = await getGitHubFile(chapterFilePath);

        if (existing) {
            throw new Error(`Chapter ${chNum} ရှိပြီးသားဖြစ်နေပါသည်။`);
        }

        const markdownContent = makeMarkdown({
            novel_slug: novelSlug,
            chapter_number: chNum,
            title: chTitle,
            is_locked: isLocked,
            coin_price: coinPrice,
            created_at: new Date().toISOString()
        }, chContent);

        await uploadToGitHub(
            chapterFilePath,
            markdownContent,
            `Add ${novelSlug} Chapter ${chNum}`
        );

        if (btn) btn.innerText = "novels.json Update လုပ်နေသည်...";

        await updateNovelsJsonFile();

        alert(`Chapter ${chNum} တင်ပြီးပါပြီ!`);

        document.getElementById("chapter-number").value = chNum + 1;
        document.getElementById("chapter-title-input").value = "";
        document.getElementById("chapter-content-input").value = "";

        if (lockInput) lockInput.checked = false;
        if (priceInput) priceInput.value = 0;

    } catch (error) {
        alert("Chapter တင်ရာတွင် အမှားအယွင်းရှိပါသည်: " + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "Chapter သိမ်းဆည်းမည်";
        }
    }
}

// ==========================================
// 5. NOVEL DROPDOWN
// ==========================================

async function loadNovelsDropdown() {
    const dropdown = document.getElementById("select-novel-dropdown");
    if (!dropdown) return;

    try {
        const files = await getGitHubDirectory("content/novels");

        let options = '<option value="">-- Novel ရွေးပါ --</option>';

        for (const file of files) {
            const novelFile = await getGitHubFile(`content/novels/${file.name}`);
            if (!novelFile) continue;

            const { metadata } = parseFrontmatter(novelFile.text);
            const title = metadata.title || file.name.replace(".md", "");
            const slug = file.name.replace(".md", "");

            options += `<option value="${slug}">${escapeHtml(title)}</option>`;
        }

        dropdown.innerHTML = options;

    } catch (error) {
        console.error("Dropdown load error:", error);
        dropdown.innerHTML = '<option value="">Novel များ ရယူမရပါ</option>';
    }
}

// ==========================================
// 6. MANAGE NOVELS
// ==========================================

let allAdminNovels = [];

async function loadManageNovelsList() {
    const container = document.getElementById("admin-novel-list");
    if (!container) return;

    container.innerHTML = '<p style="color:#aaa;text-align:center;">Novel များကို ရယူနေသည်...</p>';

    try {
        const files = await getGitHubDirectory("content/novels");

        if (files.length === 0) {
            container.innerHTML = '<p style="color:#aaa;text-align:center;">Novel များ မရှိသေးပါ။</p>';
            return;
        }

        allAdminNovels = [];

        for (const file of files) {
            const novelFile = await getGitHubFile(`content/novels/${file.name}`);
            if (!novelFile) continue;

            const parsed = parseFrontmatter(novelFile.text);
            const meta = parsed.metadata;

            allAdminNovels.push({
                slug: file.name.replace(".md", ""),
                title: meta.title || file.name.replace(".md", ""),
                coverUrl: meta.cover_url || "",
                genre: meta.genre || "No Genre",
                status: meta.status || "Ongoing",
                synopsis: parsed.body || ""
            });
        }

        renderAdminNovelsList(allAdminNovels);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<p style="color:#ef4444;text-align:center;">ဒေတာရယူရာတွင် အမှားရှိပါသည်။</p>';
    }
}

function renderAdminNovelsList(novels) {
    const container = document.getElementById("admin-novel-list");
    if (!container) return;

    if (!novels.length) {
        container.innerHTML = '<p style="color:#aaa;text-align:center;">ရှာမတွေ့ပါ။</p>';
        return;
    }

    container.innerHTML = "";

    novels.forEach(novel => {
        const itemDiv = document.createElement("div");

        itemDiv.className = "admin-novel-item";
        itemDiv.style.cssText =
            "display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.05);padding:12px;margin-bottom:10px;border-radius:8px;gap:10px;flex-wrap:wrap;";

        itemDiv.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:200px;">
                <img src="${escapeHtml(novel.coverUrl)}"
                    class="admin-cover"
                    style="width:50px;height:70px;object-fit:cover;border-radius:4px;"
                    onerror="this.src='https://via.placeholder.com/50x70?text=No+Image'">
                <div>
                    <div style="font-weight:600;color:#fff;">${escapeHtml(novel.title)}</div>
                    <div style="font-size:0.8rem;color:#a8b3cf;">
                        ${escapeHtml(novel.genre)} • ${escapeHtml(novel.status)}
                    </div>
                </div>
            </div>

            <div style="display:flex;gap:6px;" class="admin-action-btns">
                <button class="submit-btn btn-chapters" style="padding:6px 10px;font-size:0.8rem;background:#3b82f6;">
                    <i class="fa-solid fa-book-open"></i> Chapters
                </button>
                <button class="submit-btn btn-edit" style="padding:6px 10px;font-size:0.8rem;background:#eab308;">
                    <i class="fa-solid fa-pen"></i> Edit
                </button>
                <button class="submit-btn btn-delete" style="padding:6px 10px;font-size:0.8rem;background:#ef4444;">
                    <i class="fa-solid fa-trash"></i> Delete
                </button>
            </div>
        `;

        itemDiv.querySelector(".btn-chapters").addEventListener("click", () => {
            openChaptersManager(novel.slug, novel.title);
        });

        itemDiv.querySelector(".btn-edit").addEventListener("click", () => {
            openEditModal(novel.slug, novel.title, novel.status, novel.synopsis);
        });

        itemDiv.querySelector(".btn-delete").addEventListener("click", () => {
            deleteNovel(novel.slug, novel.title);
        });

        container.appendChild(itemDiv);
    });
}

function filterAdminNovels() {
    const input = document.getElementById("admin-search-novel");
    const query = input.value.toLowerCase();

    const filtered = allAdminNovels.filter(novel =>
        novel.title.toLowerCase().includes(query)
    );

    renderAdminNovelsList(filtered);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

// ==========================================
// 7. EDIT NOVEL
// ==========================================

function openEditModal(slug, title, status, synopsis) {
    document.getElementById("edit-novel-id").value = slug;
    document.getElementById("edit-novel-title").value = title;
    document.getElementById("edit-novel-status").value = status;
    document.getElementById("edit-novel-synopsis").value = synopsis;
    document.getElementById("edit-novel-modal").style.display = "flex";
}

function closeEditModal() {
    document.getElementById("edit-novel-modal").style.display = "none";
}

async function handleUpdateNovel(e) {
    if (e) e.preventDefault();

    const slug = document.getElementById("edit-novel-id").value;
    const title = document.getElementById("edit-novel-title").value.trim();
    const status = document.getElementById("edit-novel-status").value;
    const synopsis = document.getElementById("edit-novel-synopsis").value.trim();

    try {
        const path = `content/novels/${slug}.md`;
        const existing = await getGitHubFile(path);

        if (!existing) throw new Error("Novel ဖိုင်ကို ရှာမတွေ့ပါ။");

        const { metadata } = parseFrontmatter(existing.text);

        const markdownContent = makeMarkdown({
            ...metadata,
            title,
            cover_url: metadata.cover_url || "",
            genre: metadata.genre || "Action",
            status,
            created_at: metadata.created_at || new Date().toISOString()
        }, synopsis);

        await uploadToGitHub(path, markdownContent, `Update novel: ${title}`);

        await updateNovelsJsonFile();

        alert("Novel အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!");

        closeEditModal();
        loadManageNovelsList();

    } catch (err) {
        alert("ပြင်ဆင်ရာတွင် အမှားအယွင်းရှိပါသည်: " + err.message);
    }
}

// ==========================================
// 8. DELETE NOVEL
// ==========================================

async function deleteNovel(slug, title) {
    if (!confirm(`"${title}" နှင့် ဆက်စပ်သော Chapter များအားလုံးကို ဖျက်ရန် သေချာပါသလား?`)) {
        return;
    }

    try {
        const files = await getGitHubDirectory("content/chapters");

        const relatedChapters = files.filter(file =>
            file.name.startsWith(`${slug}-ch-`)
        );

        for (const file of relatedChapters) {
            await deleteFromGitHub(
                `content/chapters/${file.name}`,
                `Delete chapter ${file.name}`
            );
        }

        await deleteFromGitHub(
            `content/novels/${slug}.md`,
            `Delete novel: ${title}`
        );

        await updateNovelsJsonFile();

        alert("Novel နှင့် ဆက်စပ် Chapter အားလုံး ဖျက်ပြီးပါပြီ!");

        loadManageNovelsList();
        loadNovelsDropdown();

    } catch (err) {
        alert("ဖျက်ရာတွင် အမှားရှိပါသည်: " + err.message);
    }
}

// ==========================================
// 9. CHAPTER MANAGER
// ==========================================

async function openChaptersManager(slug, title) {
    const modal = document.getElementById("manage-chapters-modal");
    const listContainer = document.getElementById("admin-chapter-list");

    listContainer.innerHTML =
        `<p style="color:#aaa;text-align:center;">"${escapeHtml(title)}" ၏ Chapter များကို ရှာနေသည်...</p>`;

    modal.style.display = "flex";

    try {
        const files = await getGitHubDirectory("content/chapters");

        const chapterFiles = files.filter(file =>
            file.name.startsWith(`${slug}-ch-`)
        );

        if (!chapterFiles.length) {
            listContainer.innerHTML =
                '<p style="color:#aaa;text-align:center;">Chapter များ မရှိသေးပါ။</p>';
            return;
        }

        const chapters = [];

        for (const file of chapterFiles) {
            const chapterFile = await getGitHubFile(`content/chapters/${file.name}`);
            if (!chapterFile) continue;

            const { metadata } = parseFrontmatter(chapterFile.text);

            chapters.push({
                fileName: file.name,
                number: Number(metadata.chapter_number) || 1,
                title: metadata.title || "",
                isLocked: metadata.is_locked === true || metadata.is_locked === "true",
                coinPrice: Number(metadata.coin_price) || 0
            });
        }

        chapters.sort((a, b) => a.number - b.number);

        listContainer.innerHTML = "";

        chapters.forEach(chapter => {
            const item = document.createElement("div");

            item.style.cssText =
                "display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.05);padding:10px;border-radius:6px;gap:10px;flex-wrap:wrap;";

            const statusText = chapter.isLocked
                ? `<span style="color:#f87171;font-weight:600;">🔒 LOCKED · ${chapter.coinPrice} Coins</span>`
                : `<span style="color:#4ade80;font-weight:600;">🔓 FREE</span>`;

            item.innerHTML = `
                <div style="min-width:180px;flex:1;">
                    <div style="font-weight:600;color:#fff;">
                        Chapter ${chapter.number}
                    </div>
                    <div style="color:#a8b3cf;font-size:0.9rem;">
                        ${escapeHtml(chapter.title)}
                    </div>
                    <div style="font-size:0.8rem;margin-top:5px;">
                        ${statusText}
                    </div>
                </div>
                <div style="display:flex;gap:6px;">
                    <button class="submit-btn btn-edit-chapter"
                        style="padding:4px 8px;font-size:0.75rem;background:#eab308;">
                        <i class="fa-solid fa-pen"></i> ပြင်မည်
                    </button>
                    <button class="submit-btn btn-delete-chapter"
                        style="padding:4px 8px;font-size:0.75rem;background:#ef4444;">
                        <i class="fa-solid fa-trash"></i> ဖျက်မည်
                    </button>
                </div>
            `;

            item.querySelector(".btn-edit-chapter").addEventListener("click", () => {
                openEditChapterModal(chapter.fileName, slug);
            });

            item.querySelector(".btn-delete-chapter").addEventListener("click", () => {
                deleteChapter(chapter.fileName, slug);
            });

            listContainer.appendChild(item);
        });

    } catch (err) {
        console.error(err);
        listContainer.innerHTML =
            '<p style="color:#ef4444;text-align:center;">Chapter စာရင်းရယူရာတွင် အမှားရှိပါသည်။</p>';
    }
}

function closeChaptersModal() {
    document.getElementById("manage-chapters-modal").style.display = "none";
}

// ==========================================
// 10. DELETE CHAPTER
// ==========================================

async function deleteChapter(fileName, slug) {
    if (!confirm("ဤ Chapter ကို ဖျက်ရန် သေချာပါသလား?")) return;

    try {
        await deleteFromGitHub(
            `content/chapters/${fileName}`,
            `Delete chapter ${fileName}`
        );

        await updateNovelsJsonFile();

        alert("Chapter အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!");

        const novel = allAdminNovels.find(n => n.slug === slug);
        openChaptersManager(slug, novel?.title || slug);

    } catch (err) {
        alert("Chapter ဖျက်ရာတွင် အမှားရှိပါသည်: " + err.message);
    }
}

// ==========================================
// 11. OPEN EDIT CHAPTER MODAL
// ==========================================

async function openEditChapterModal(fileName, slug) {
    try {
        const chapterFile = await getGitHubFile(`content/chapters/${fileName}`);

        if (!chapterFile) throw new Error("Chapter ဖိုင်ကို ရှာမတွေ့ပါ။");

        const parsed = parseFrontmatter(chapterFile.text);
        const meta = parsed.metadata;

        const chTitle = meta.title || "";
        const chNum = Number(meta.chapter_number) || 1;
        const chContent = parsed.body || "";

        document.getElementById("edit-chapter-filename").value = fileName;
        document.getElementById("edit-chapter-slug").value = slug;
        document.getElementById("edit-chapter-number").value = chNum;
        document.getElementById("edit-chapter-title").value = chTitle;
        document.getElementById("edit-chapter-content").value = chContent;

        // Lock / Coin fields
        const lockInput = document.getElementById("edit-chapter-is-locked");
        const priceInput = document.getElementById("edit-chapter-coin-price");

        if (lockInput) {
            lockInput.checked =
                meta.is_locked === true || meta.is_locked === "true";
        }

        if (priceInput) {
            priceInput.value = Number(meta.coin_price) || 0;
        }

        document.getElementById("edit-chapter-modal").style.display = "flex";

    } catch (err) {
        alert("Chapter အချက်အလက်ယူရာတွင် အမှားရှိပါသည်: " + err.message);
    }
}

function closeEditChapterModal() {
    document.getElementById("edit-chapter-modal").style.display = "none";
}

// ==========================================
// 12. UPDATE CHAPTER + LOCK / COIN
// ==========================================

async function handleUpdateChapter(e) {
    if (e) e.preventDefault();

    const btn = document.getElementById("save-edit-chapter-btn");
    if (btn) btn.disabled = true;

    const fileName = document.getElementById("edit-chapter-filename").value;
    const slug = document.getElementById("edit-chapter-slug").value;
    const chNum = parseInt(document.getElementById("edit-chapter-number").value);
    const chTitle = document.getElementById("edit-chapter-title").value.trim();
    const chContent = document.getElementById("edit-chapter-content").value.trim();

    const lockInput = document.getElementById("edit-chapter-is-locked");
    const priceInput = document.getElementById("edit-chapter-coin-price");

    const isLocked = lockInput ? lockInput.checked : false;
    const coinPrice = isLocked ? parseInt(priceInput?.value) || 0 : 0;

    try {
        if (!Number.isInteger(chNum) || chNum < 1 || !chTitle || !chContent) {
            throw new Error("Chapter Number, Title နှင့် Content ကို မှန်ကန်စွာ ဖြည့်ပါ။");
        }

        if (isLocked && coinPrice < 1) {
            throw new Error("Locked Chapter အတွက် Coin Price ကို 1 နှင့်အထက် ထည့်ပါ။");
        }

        const oldPath = `content/chapters/${fileName}`;
        const oldFile = await getGitHubFile(oldPath);

        if (!oldFile) throw new Error("မူရင်း Chapter ဖိုင်ကို ရှာမတွေ့ပါ။");

        const parsedOld = parseFrontmatter(oldFile.text);

        const newFileName = `${slug}-ch-${chNum}.md`;
        const newPath = `content/chapters/${newFileName}`;

        // မူရင်း Chapter Metadata အခြား Field များကို ထိန်းသိမ်းမည်
        const metadata = {
            ...parsedOld.metadata,
            novel_slug: slug,
            chapter_number: chNum,
            title: chTitle,
            is_locked: isLocked,
            coin_price: coinPrice,
            created_at: parsedOld.metadata.created_at || new Date().toISOString()
        };

        const markdownContent = makeMarkdown(metadata, chContent);

        // နံပါတ်ပြောင်းပါက ဖိုင်အသစ် ရှိပြီးသားလား စစ်မည်
        if (fileName !== newFileName) {
            const existingNewFile = await getGitHubFile(newPath);

            if (existingNewFile) {
                throw new Error(`Chapter ${chNum} ရှိပြီးသားဖြစ်နေပါသည်။`);
            }
        }

        // အရေးကြီး: ဖိုင်အသစ်ကို အရင်သိမ်းမည်
        await uploadToGitHub(
            newPath,
            markdownContent,
            `Update ${slug} Chapter ${chNum}`
        );

        // အသစ်အောင်မြင်မှသာ ဖိုင်အဟောင်းကို ဖျက်မည်
        if (fileName !== newFileName) {
            await deleteFromGitHub(
                oldPath,
                `Remove old chapter file ${fileName}`
            );
        }

        if (btn) btn.innerText = "novels.json Update လုပ်နေသည်...";

        await updateNovelsJsonFile();

        alert("Chapter အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!");

        closeEditChapterModal();

        const novel = allAdminNovels.find(n => n.slug === slug);
        openChaptersManager(slug, novel?.title || slug);

    } catch (error) {
        alert("Chapter ပြင်ဆင်ရာတွင် အမှားအယွင်းရှိပါသည်: " + error.message);
        console.error(error);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerText = "ပြင်ဆင်မည်";
        }
    }
}
