
// ==========================================
// 🐙 NOVELVERSE GITHUB CONFIGURATION
// ==========================================
const GITHUB_OWNER = "novelversemm-crypto";
const GITHUB_REPO = "NovelVerse-MM";
const GITHUB_BRANCH = "main";

const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

// ==========================================
// ☁️ CLOUDINARY CONFIGURATION
// ==========================================
const CLOUDINARY_CLOUD_NAME = "n1rewvpg";
const CLOUDINARY_UPLOAD_PRESET = "novel_covers";

// ==========================================
// ⚙️ PERFORMANCE CONFIGURATION
// ==========================================
const MAX_CONCURRENT_READS = 8;
const MAX_CONCURRENT_DELETES = 4;
const NOVEL_CACHE_DURATION = 30000;

// ==========================================
// 🧠 SHARED CACHE
// ==========================================
let allAdminNovels = [];

let novelRecordsCache = null;
let novelRecordsCacheTime = 0;
let novelRecordsPromise = null;

// Chapter ဖိုင်နာမည်ပြောင်းသည့်အခါ
// ရှိပြီးသား JSON Metadata ကို ဆက်လက်ထိန်းသိမ်းရန်
let pendingChapterFileRenames = {};

// ==========================================
// 🚀 DOM LOADED
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

    const savedToken = getToken();

    if (savedToken) {
        showDashboard();
    } else {
        showLogin();
    }

    // HTML onclick တွေနဲ့ ချိတ်ဆက်ထားတဲ့ Functions
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
// 🔐 TOKEN HELPER
// ==========================================
function getToken() {
    return localStorage.getItem("github_token") || "";
}

function invalidateNovelCache() {
    novelRecordsCache = null;
    novelRecordsCacheTime = 0;
    novelRecordsPromise = null;
}

// ==========================================
// 🌐 GITHUB API HELPER
// ==========================================

// Path တစ်ခုချင်းစီကို မှန်ကန်စွာ Encode လုပ်ခြင်း
function encodeGitHubPath(path) {
    return path
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");
}

// GitHub API Request
async function githubRequest(path, options = {}) {

    const token = getToken();

    if (!token) {
        throw new Error("GitHub Token မရှိပါ။ ပြန်လည် Login ဝင်ပါ။");
    }

    let url;

    if (path.startsWith("https://")) {
        url = path;
    } else {
        const [rawPath, queryString] = path.split("?");

        const encodedPath = encodeGitHubPath(rawPath);

        url = `${GITHUB_API}/${encodedPath}`;

        if (queryString) {
            url += `?${queryString}`;
        }
    }

    const response = await fetch(url, {
        ...options,

        headers: {
            Accept: "application/vnd.github+json",

            Authorization: `Bearer ${token}`,

            "X-GitHub-Api-Version": "2022-11-28",

            ...(options.headers || {})
        }
    });

    if (!response.ok) {

        let message = `GitHub API Error (${response.status})`;

        try {
            const data = await response.json();

            if (data.message) {
                message = data.message;
            }
        } catch (_) {}

        const error = new Error(message);

        error.status = response.status;

        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// ==========================================
// 📂 GITHUB FILE OPERATIONS
// ==========================================

// Directory ထဲရှိ ဖိုင်များရယူရန်
async function listGitHubDirectory(directory) {

    const result = await githubRequest(
        `contents/${directory}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );

    if (!Array.isArray(result)) {
        return [];
    }

    return result.filter(file => file.type === "file");
}

// Base64 ကို UTF-8 Text ပြောင်းရန်
function decodeBase64UTF8(base64) {

    const binary = atob(base64.replace(/\s/g, ""));

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new TextDecoder("utf-8").decode(bytes);
}

// UTF-8 Text ကို Base64 ပြောင်းရန်
function encodeBase64UTF8(text) {

    const bytes = new TextEncoder().encode(text);

    let binary = "";

    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {

        binary += String.fromCharCode(
            ...bytes.subarray(i, i + chunkSize)
        );
    }

    return btoa(binary);
}

// GitHub ဖိုင်တစ်ခု ဖတ်ရန်
async function readGitHubTextFile(filePath) {

    const data = await githubRequest(
        `contents/${filePath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );

    if (!data.content) {
        throw new Error(`ဖိုင် Content ကို ဖတ်မရပါ: ${filePath}`);
    }

    return {
        text: decodeBase64UTF8(data.content),
        sha: data.sha,
        data
    };
}

// ဖိုင်ရှိ / မရှိ စစ်ဆေးရန်
async function githubFileExists(filePath) {

    try {

        await githubRequest(
            `contents/${filePath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
        );

        return true;

    } catch (error) {

        if (error.status === 404) {
            return false;
        }

        throw error;
    }
}

// ==========================================
// ⬆️ UPLOAD FILE TO GITHUB
// ==========================================
async function uploadToGitHub(filePath, fileContent, commitMessage) {

    const url = `contents/${filePath}`;

    let sha = null;

    try {

        const existingData = await githubRequest(
            `${url}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
        );

        sha = existingData.sha;

    } catch (error) {

        if (error.status !== 404) {
            throw error;
        }
    }

    const bodyData = {
        message: commitMessage,

        content: encodeBase64UTF8(fileContent),

        branch: GITHUB_BRANCH
    };

    if (sha) {
        bodyData.sha = sha;
    }

    return await githubRequest(url, {
        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(bodyData)
    });
}

// ==========================================
// 🗑️ DELETE FILE FROM GITHUB
// ==========================================
async function deleteFromGitHub(filePath, commitMessage) {

    const fileData = await githubRequest(
        `contents/${filePath}?ref=${encodeURIComponent(GITHUB_BRANCH)}`
    );

    return await githubRequest(`contents/${filePath}`, {

        method: "DELETE",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({
            message: commitMessage,
            sha: fileData.sha,
            branch: GITHUB_BRANCH
        })
    });
}

// ==========================================
// ⚡ CONTROLLED PARALLEL PROCESSING
// ==========================================
async function mapWithConcurrency(items, limit, callback) {

    const results = new Array(items.length);

    let currentIndex = 0;

    async function worker() {

        while (true) {

            const index = currentIndex++;

            if (index >= items.length) {
                return;
            }

            results[index] = await callback(items[index], index);
        }
    }

    const workerCount = Math.min(limit, items.length);

    await Promise.all(
        Array.from({ length: workerCount }, () => worker())
    );

    return results;
}

// ==========================================
// 📝 MARKDOWN PARSER
// ==========================================
function parseMarkdown(markdownText) {

    const text = String(markdownText || "")
        .replace(/^\uFEFF/, "");

    const match = text.match(
        /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/
    );

    const frontmatter = {};

    let body = text;

    if (match) {

        match[1].split(/\r?\n/).forEach(line => {

            const separator = line.indexOf(":");

            if (separator === -1) return;

            const key = line.slice(0, separator).trim();

            const value = line.slice(separator + 1).trim();

            if (!key) return;

            frontmatter[key] = unquoteYamlValue(value);
        });

        body = text.slice(match[0].length);
    }

    return {
        frontmatter,
        body: body.trim()
    };
}

// YAML Value ကို ဖတ်ရန်
function unquoteYamlValue(value) {

    let result = String(value ?? "").trim();

    if (
        result.startsWith('"') &&
        result.endsWith('"')
    ) {
        try {
            return JSON.parse(result);
        } catch (_) {
            return result.slice(1, -1);
        }
    }

    if (
        result.startsWith("'") &&
        result.endsWith("'")
    ) {
        return result.slice(1, -1).replace(/''/g, "'");
    }

    return result;
}

// YAML Value ရေးရန်
function yamlQuote(value) {
    return JSON.stringify(String(value ?? ""));
}

// Frontmatter ထဲက Field တန်ဖိုးပြောင်းရန်
// မသက်ဆိုင်သော အခြား Field များကို ထိန်းသိမ်းထားသည်။
function updateMarkdownFrontmatter(markdownText, updates) {

    const text = String(markdownText || "");

    const match = text.match(
        /^(---\s*\r?\n)([\s\S]*?)(\r?\n---\s*(?:\r?\n|$))/
    );

    if (!match) {
        throw new Error("Markdown Frontmatter ကို ရှာမတွေ့ပါ။");
    }

    const lines = match[2].split(/\r?\n/);

    const updatedKeys = new Set();

    const newLines = lines.map(line => {

        const separator = line.indexOf(":");

        if (separator === -1) return line;

        const key = line.slice(0, separator).trim();

        if (!Object.prototype.hasOwnProperty.call(updates, key)) {
            return line;
        }

        updatedKeys.add(key);

        return `${key}: ${yamlQuote(updates[key])}`;
    });

    Object.keys(updates).forEach(key => {

        if (!updatedKeys.has(key)) {
            newLines.push(`${key}: ${yamlQuote(updates[key])}`);
        }
    });

    return (
        match[1] +
        newLines.join("\n") +
        match[3] +
        text.slice(match[0].length)
    );
}

// ==========================================
// 🔑 ADMIN LOGIN
// ==========================================
async function handleLogin(e) {

    if (e) e.preventDefault();

    const input = document.getElementById("github-token-input");

    if (!input) return;

    const token = input.value.trim();

    if (!token) {
        alert("ကျေးဇူးပြု၍ GitHub Token ထည့်ပါ။");
        return;
    }

    try {

        const response = await fetch(GITHUB_API, {

            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json"
            }
        });

        if (!response.ok) {
            throw new Error("Token မှားယွင်းနေပါသည်။ သို့မဟုတ် Permission မရှိပါ။");
        }

        localStorage.setItem("github_token", token);

        invalidateNovelCache();

        alert("Admin Panel သို့ အောင်မြင်စွာ ဝင်ရောက်လိုက်ပါပြီ!");

        showDashboard();

    } catch (error) {

        alert("Login အမှားအယွင်း: " + error.message);

    }
}

// ==========================================
// 📊 DASHBOARD
// ==========================================
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

    if (!confirm("Admin အကောင့်မှ ထွက်ရန် သေချာပါသလား?")) {
        return;
    }

    localStorage.removeItem("github_token");

    invalidateNovelCache();

    allAdminNovels = [];

    showLogin();
}

// ==========================================
// 📑 TAB SWITCHING
// ==========================================
function switchTab(tabId) {

    document.querySelectorAll(".tab-content").forEach(el => {
        el.style.display = "none";
    });

    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    const targetTab = document.getElementById(`tab-${tabId}`);

    if (targetTab) {
        targetTab.style.display = "block";
    }

    if (tabId === "add-chapter") {
        loadNovelsDropdown();
    }

    if (tabId === "manage-novels") {
        loadManageNovelsList();
    }
}

// ==========================================
// 🧠 LOAD NOVEL RECORDS WITH CACHE
// ==========================================
async function loadNovelRecords(forceRefresh = false) {

    const now = Date.now();

    if (
        !forceRefresh &&
        novelRecordsCache &&
        now - novelRecordsCacheTime < NOVEL_CACHE_DURATION
    ) {
        return novelRecordsCache;
    }

    if (!forceRefresh && novelRecordsPromise) {
        return novelRecordsPromise;
    }

    novelRecordsPromise = (async () => {

        const files = await listGitHubDirectory("content/novels");

        const mdFiles = files.filter(file =>
            file.name.toLowerCase().endsWith(".md")
        );

        const records = await mapWithConcurrency(
            mdFiles,
            MAX_CONCURRENT_READS,
            async file => {

                const { text } = await readGitHubTextFile(
                    `content/novels/${file.name}`
                );

                const parsed = parseMarkdown(text);

                return {

                    slug: file.name.replace(/\.md$/i, ""),

                    title: parsed.frontmatter.title ||
                        file.name.replace(/\.md$/i, ""),

                    coverUrl: parsed.frontmatter.cover_url || "",

                    genre: parsed.frontmatter.genre || "No Genre",

                    status: parsed.frontmatter.status || "Ongoing",

                    synopsis: parsed.body,

                    createdAt: parsed.frontmatter.created_at || "",

                    fileName: file.name
                };
            }
        );

        records.sort((a, b) =>
            a.title.localeCompare(b.title)
        );

        novelRecordsCache = records;
        novelRecordsCacheTime = Date.now();

        return records;

    })();

    try {

        return await novelRecordsPromise;

    } finally {

        novelRecordsPromise = null;

    }
}

// ==========================================
// 🔄 AUTOMATICALLY UPDATE novels.json
// ==========================================
async function updateNovelsJsonFile() {

    console.log("Updating novels.json...");

    // ရှိပြီးသား JSON ကို အရင်ဖတ်ပါ။
    // Coin / Lock စသည့် Custom Metadata များကို ထိန်းသိမ်းရန် ဖြစ်သည်။
    let oldNovelsData = [];

    try {

        const oldFile = await readGitHubTextFile(
            "content/novels.json"
        );

        oldNovelsData = JSON.parse(oldFile.text);

        if (!Array.isArray(oldNovelsData)) {
            throw new Error("novels.json format မမှန်ပါ။");
        }

    } catch (error) {

        if (error.status === 404) {
            oldNovelsData = [];
        } else {
            throw new Error(
                "လက်ရှိ novels.json ကို ဖတ်မရပါ။ JSON ကို မပြောင်းလဲဘဲ ရပ်ထားပါသည်။ " +
                error.message
            );
        }
    }

    const oldNovelMap = new Map(
        oldNovelsData.map(novel => [novel.slug, novel])
    );

    // Novel Files
    const novelFiles = await listGitHubDirectory(
        "content/novels"
    );

    const mdNovelFiles = novelFiles.filter(file =>
        file.name.toLowerCase().endsWith(".md")
    );

    // Chapter Files
    const chapterFiles = await listGitHubDirectory(
        "content/chapters"
    );

    const mdChapterFiles = chapterFiles.filter(file =>
        file.name.toLowerCase().endsWith(".md")
    );

    // Chapter Markdown များကို Parallel ဖတ်ခြင်း
    const chapterRecords = await mapWithConcurrency(
        mdChapterFiles,
        MAX_CONCURRENT_READS,
        async file => {

            const { text } = await readGitHubTextFile(
                `content/chapters/${file.name}`
            );

            const parsed = parseMarkdown(text);

            const slug = String(
                parsed.frontmatter.novel_slug || ""
            );

            const chapterNumber = parseInt(
                parsed.frontmatter.chapter_number,
                10
            );

            return {

                fileName: file.name,

                filePath: `content/chapters/${file.name}`,

                slug,

                chapterNumber: Number.isFinite(chapterNumber)
                    ? chapterNumber
                    : 1,

                title: parsed.frontmatter.title || "",

                createdAt: parsed.frontmatter.created_at || ""
            };
        }
    );

    // Novel Markdown များကို Parallel ဖတ်ခြင်း
    const allNovelsData = await mapWithConcurrency(
        mdNovelFiles,
        MAX_CONCURRENT_READS,
        async file => {

            const slug = file.name.replace(/\.md$/i, "");

            const { text } = await readGitHubTextFile(
                `content/novels/${file.name}`
            );

            const parsed = parseMarkdown(text);

            const oldNovel = oldNovelMap.get(slug) || {};

            // Slug ကိုအခြေခံ၍ Chapter များကို တိကျစွာ ချိတ်ဆက်ခြင်း
            const exactMatchedChapters = chapterRecords.filter(ch => {

                if (ch.slug) {
                    return ch.slug === slug;
                }

                // Legacy chapter ဖိုင်များအတွက် fallback
                return ch.fileName.startsWith(`${slug}-ch-`);
            });

            const oldChapters = Array.isArray(oldNovel.chapters)
                ? oldNovel.chapters
                : [];

            const oldChapterMap = new Map();

            oldChapters.forEach(chapter => {

                if (chapter.file) {
                    oldChapterMap.set(chapter.file, chapter);
                }

                if (chapter.chapter_number !== undefined) {
                    oldChapterMap.set(
                        `number:${chapter.chapter_number}`,
                        chapter
                    );
                }
            });

            const novelChapters = exactMatchedChapters.map(ch => {

                const newFilePath = ch.filePath;

                const oldFilePath =
                    pendingChapterFileRenames[newFilePath];

                const oldChapter =
                    oldChapterMap.get(oldFilePath) ||
                    oldChapterMap.get(newFilePath) ||
                    oldChapterMap.get(`number:${ch.chapterNumber}`) ||
                    {};

                return {

                    // ရှိပြီးသား Coin / Lock Metadata များကို ထိန်းသိမ်းရန်
                    ...oldChapter,

                    chapter_number: ch.chapterNumber,

                    title: ch.title,

                    file: newFilePath
                };
            });

            novelChapters.sort((a, b) =>
                Number(a.chapter_number) - Number(b.chapter_number)
            );

            return {

                // ရှိပြီးသား Novel Custom Fields များကို ထိန်းသိမ်းရန်
                ...oldNovel,

                slug,

                title: parsed.frontmatter.title || slug,

                coverUrl: parsed.frontmatter.cover_url || "",

                genre: parsed.frontmatter.genre || "Fantasy",

                status: parsed.frontmatter.status || "Ongoing",

                synopsis: parsed.body,

                createdAt:
                    parsed.frontmatter.created_at ||
                    oldNovel.createdAt ||
                    "",

                chapters: novelChapters
            };
        }
    );

    const jsonContent = JSON.stringify(
        allNovelsData,
        null,
        2
    );

    // JSON ဖိုင်ကို GitHub သို့ သိမ်းဆည်းရန်
    await uploadToGitHub(
        "content/novels.json",
        jsonContent,
        "Auto-update novels.json"
    );

    // အောင်မြင်မှသာ Rename Map ကို ရှင်းပါ။
    pendingChapterFileRenames = {};

    invalidateNovelCache();

    console.log(
        `novels.json updated successfully: ${allNovelsData.length} novels`
    );

    return allNovelsData;
}

// ==========================================
// ☁️ CLOUDINARY COVER UPLOAD
// ==========================================
async function uploadCoverToCloudinary(file) {

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        CLOUDINARY_UPLOAD_PRESET
    );

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: "POST",
            body: formData
        }
    );

    const data = await response.json();

    if (!response.ok) {

        throw new Error(
            data.error?.message || "Cloudinary Upload မအောင်မြင်ပါ။"
        );
    }

    return data.secure_url;
}

// ==========================================
// ➕ ADD NEW NOVEL
// ==========================================
async function handleAddNovel(e) {

    if (e) e.preventDefault();

    const btn = document.getElementById("save-novel-btn");

    if (btn) btn.disabled = true;

    try {

        const title = document.getElementById("novel-title").value.trim();

        const fileInput = document.getElementById("novel-cover-file");

        const file = fileInput?.files?.[0];

        const status = document.getElementById("novel-status").value;

        const synopsis = document.getElementById("novel-synopsis").value.trim();

        if (!title) {
            throw new Error("Novel Title ထည့်ပေးပါ။");
        }

        if (!file) {
            throw new Error("Cover Image ရွေးချယ်ပေးပါ။");
        }

        if (btn) {
            btn.innerText = "Cloudinary သို့ Cover တင်နေသည်...";
        }

        const coverUrl = await uploadCoverToCloudinary(file);

        const selectedGenres = Array.from(
            document.querySelectorAll(
                'input[name="novel-genre-chip"]:checked'
            )
        ).map(cb => cb.value);

        // English / Number Slug
        let slug = title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");

        // မြန်မာစာသီးသန့် Novel များအတွက် ID
        if (!slug) {
            slug = `novel-${Date.now()}`;
        }

        const novelFilePath = `content/novels/${slug}.md`;

        // Slug ထပ်နေခြင်း ရှိ / မရှိ စစ်ဆေးရန်
        if (await githubFileExists(novelFilePath)) {
            throw new Error(
                `Novel Slug "${slug}" ရှိပြီးသားဖြစ်နေပါသည်။`
            );
        }

        const markdownContent = `---
title: ${yamlQuote(title)}
cover_url: ${yamlQuote(coverUrl)}
genre: ${yamlQuote(selectedGenres.join(", "))}
status: ${yamlQuote(status)}
created_at: ${yamlQuote(new Date().toISOString())}
---

${synopsis}
`;

        if (btn) {
            btn.innerText = "GitHub သို့ Novel သိမ်းဆည်းနေသည်...";
        }

        await uploadToGitHub(
            novelFilePath,
            markdownContent,
            `Add novel: ${title}`
        );

        if (btn) {
            btn.innerText = "novels.json Update လုပ်နေသည်...";
        }

        await updateNovelsJsonFile();

        alert("Novel အသစ် အောင်မြင်စွာ တင်ပြီးပါပြီ!");

        document.getElementById("add-novel-form")?.reset();

        loadNovelsDropdown();
        loadManageNovelsList();

    } catch (error) {

        console.error(error);

        alert("Novel တင်ရာတွင် အမှားရှိပါသည်: " + error.message);

    } finally {

        if (btn) {
            btn.disabled = false;
            btn.innerText = "Novel သိမ်းဆည်းမည်";
        }
    }
}

// ==========================================
// ➕ ADD NEW CHAPTER
// ==========================================
async function handleAddChapter(e) {

    if (e) e.preventDefault();

    const btn = document.getElementById("save-chapter-btn");

    if (btn) btn.disabled = true;

    try {

        const novelSlug = document.getElementById(
            "select-novel-dropdown"
        ).value;

        const chNum = parseInt(
            document.getElementById("chapter-number").value,
            10
        );

        const chTitle = document.getElementById(
            "chapter-title-input"
        ).value.trim();

        const chContent = document.getElementById(
            "chapter-content-input"
        ).value.trim();

        if (!novelSlug) {
            throw new Error("Novel ရွေးချယ်ပေးပါ။");
        }

        if (!Number.isInteger(chNum) || chNum < 1) {
            throw new Error("Chapter Number မှန်ကန်စွာ ထည့်ပေးပါ။");
        }

        if (!chContent) {
            throw new Error("Chapter Content ထည့်ပေးပါ။");
        }

        const chapterFileName = `${novelSlug}-ch-${chNum}.md`;

        const chapterFilePath = `content/chapters/${chapterFileName}`;

        // ရှိပြီးသား Chapter ကို မတော်တဆ Overwrite မဖြစ်စေရန်
        if (await githubFileExists(chapterFilePath)) {
            throw new Error(
                `Chapter ${chNum} ရှိပြီးသားဖြစ်နေပါသည်။`
            );
        }

        const markdownContent = `---
novel_slug: ${yamlQuote(novelSlug)}
chapter_number: ${chNum}
title: ${yamlQuote(chTitle)}
created_at: ${yamlQuote(new Date().toISOString())}
---

${chContent}
`;

        if (btn) {
            btn.innerText = "GitHub သို့ Chapter သိမ်းဆည်းနေသည်...";
        }

        await uploadToGitHub(
            chapterFilePath,
            markdownContent,
            `Add ${novelSlug} Chapter ${chNum}`
        );

        if (btn) {
            btn.innerText = "novels.json Update လုပ်နေသည်...";
        }

        await updateNovelsJsonFile();

        alert(`Chapter ${chNum} အောင်မြင်စွာ တင်ပြီးပါပြီ!`);

        document.getElementById("chapter-number").value = chNum + 1;

        document.getElementById("chapter-title-input").value = "";

        document.getElementById("chapter-content-input").value = "";

    } catch (error) {

        console.error(error);

        alert("Chapter တင်ရာတွင် အမှားရှိပါသည်: " + error.message);

    } finally {

        if (btn) {
            btn.disabled = false;
            btn.innerText = "Chapter သိမ်းဆည်းမည်";
        }
    }
}

// ==========================================
// 📚 LOAD NOVELS DROPDOWN
// ==========================================
async function loadNovelsDropdown() {

    const dropdown = document.getElementById(
        "select-novel-dropdown"
    );

    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Novel များကို ရယူနေသည်...</option>';

    try {

        const novels = await loadNovelRecords();

        dropdown.replaceChildren();

        const defaultOption = document.createElement("option");

        defaultOption.value = "";

        defaultOption.textContent = "-- Novel ရွေးပါ --";

        dropdown.appendChild(defaultOption);

        novels.forEach(novel => {

            const option = document.createElement("option");

            option.value = novel.slug;

            option.textContent = novel.title;

            dropdown.appendChild(option);
        });

        if (novels.length === 0) {

            defaultOption.textContent = "-- Novel များ မရှိသေးပါ --";
        }

    } catch (error) {

        console.error("Dropdown load error:", error);

        dropdown.innerHTML = '<option value="">Novel ရယူရာတွင် အမှားရှိပါသည်</option>';
    }
}

// ==========================================
// 📖 LOAD MANAGE NOVELS LIST
// ==========================================
async function loadManageNovelsList() {

    const container = document.getElementById("admin-novel-list");

    if (!container) return;

    container.innerHTML = `
        <p style="color:#aaa;text-align:center;">
            Novel များကို ရယူနေသည်...
        </p>
    `;

    try {

        allAdminNovels = await loadNovelRecords();

        renderAdminNovelsList(allAdminNovels);

    } catch (error) {

        console.error("Manage list load error:", error);

        container.innerHTML = `
            <p style="color:#ef4444;text-align:center;">
                Novel ဒေတာရယူရာတွင် အမှားရှိပါသည်။
                ${escapeHtml(error.message)}
            </p>
        `;
    }
}

// ==========================================
// 🖼️ RENDER NOVEL LIST SAFELY
// ==========================================
function renderAdminNovelsList(novels) {

    const container = document.getElementById("admin-novel-list");

    if (!container) return;

    container.replaceChildren();

    if (!novels.length) {

        const empty = document.createElement("p");

        empty.style.cssText = "color:#aaa;text-align:center;";

        empty.textContent = "ရှာမတွေ့ပါ။";

        container.appendChild(empty);

        return;
    }

    novels.forEach(novel => {

        const itemDiv = document.createElement("div");

        itemDiv.className = "admin-novel-item";

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

        const infoDiv = document.createElement("div");

        infoDiv.style.cssText = `
            display:flex;
            align-items:center;
            gap:12px;
            flex:1;
            min-width:200px;
        `;

        const img = document.createElement("img");

        img.className = "admin-cover";

        img.style.cssText = `
            width:50px;
            height:70px;
            object-fit:cover;
            border-radius:4px;
        `;

        img.src = novel.coverUrl || "";

        img.alt = novel.title;

        img.onerror = function () {
            this.onerror = null;
            this.src = "https://via.placeholder.com/50x70?text=No+Image";
        };

        const textDiv = document.createElement("div");

        const titleDiv = document.createElement("div");

        titleDiv.className = "admin-novel-title";

        titleDiv.style.cssText = "font-weight:600;color:#fff;";

        titleDiv.textContent = novel.title;

        const metaDiv = document.createElement("div");

        metaDiv.className = "admin-novel-meta";

        metaDiv.style.cssText = "font-size:0.8rem;color:#a8b3cf;";

        metaDiv.textContent = `${novel.genre} • ${novel.status}`;

        textDiv.append(titleDiv, metaDiv);

        infoDiv.append(img, textDiv);

        const actionsDiv = document.createElement("div");

        actionsDiv.style.cssText = "display:flex;gap:6px;";

        actionsDiv.className = "admin-action-btns";

        function createButton(text, className, background, iconClass) {

            const button = document.createElement("button");

            button.type = "button";

            button.className = `submit-btn ${className}`;

            button.style.cssText = `
                padding:6px 10px;
                font-size:0.8rem;
                background:${background};
            `;

            const icon = document.createElement("i");

            icon.className = iconClass;

            const label = document.createTextNode(` ${text}`);

            button.append(icon, label);

            return button;
        }

        const chaptersBtn = createButton(
            "Chapters",
            "btn-chapters",
            "#3b82f6",
            "fa-solid fa-book-open"
        );

        const editBtn = createButton(
            "Edit",
            "btn-edit",
            "#eab308",
            "fa-solid fa-pen"
        );

        const deleteBtn = createButton(
            "Delete",
            "btn-delete",
            "#ef4444",
            "fa-solid fa-trash"
        );

        chaptersBtn.addEventListener("click", () => {
            openChaptersManager(novel.slug, novel.title);
        });

        editBtn.addEventListener("click", () => {
            openEditModal(
                novel.slug,
                novel.title,
                novel.status,
                novel.synopsis
            );
        });

        deleteBtn.addEventListener("click", () => {
            deleteNovel(novel.slug, novel.title);
        });

        actionsDiv.append(
            chaptersBtn,
            editBtn,
            deleteBtn
        );

        itemDiv.append(
            infoDiv,
            actionsDiv
        );

        container.appendChild(itemDiv);
    });
}

// ==========================================
// 🔎 FILTER NOVELS
// ==========================================
function filterAdminNovels() {

    const input = document.getElementById("admin-search-novel");

    if (!input) return;

    const query = input.value.toLowerCase().trim();

    const filtered = allAdminNovels.filter(novel =>
        String(novel.title).toLowerCase().includes(query)
    );

    renderAdminNovelsList(filtered);
}

// ==========================================
// 🛡️ HTML ESCAPE
// ==========================================
function escapeHtml(text) {

    return String(text ?? "").replace(/[&<>"']/g, char => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[char];
    });
}

// ==========================================
// ✏️ OPEN EDIT NOVEL MODAL
// ==========================================
function openEditModal(slug, title, status, synopsis) {

    const id = document.getElementById("edit-novel-id");
    const titleInput = document.getElementById("edit-novel-title");
    const statusInput = document.getElementById("edit-novel-status");
    const synopsisInput = document.getElementById("edit-novel-synopsis");
    const modal = document.getElementById("edit-novel-modal");

    if (!modal) return;

    id.value = slug;

    titleInput.value = title;

    statusInput.value = status;

    synopsisInput.value = synopsis;

    modal.style.display = "flex";
}

function closeEditModal() {

    const modal = document.getElementById("edit-novel-modal");

    if (modal) {
        modal.style.display = "none";
    }
}

// ==========================================
// 💾 UPDATE NOVEL
// ==========================================
async function handleUpdateNovel(e) {

    if (e) e.preventDefault();

    const slug = document.getElementById("edit-novel-id").value;

    const title = document.getElementById("edit-novel-title").value.trim();

    const status = document.getElementById("edit-novel-status").value;

    const synopsis = document.getElementById("edit-novel-synopsis").value.trim();

    if (!title) {
        alert("Novel Title ထည့်ပေးပါ။");
        return;
    }

    try {

        const novelFilePath = `content/novels/${slug}.md`;

        const existing = await readGitHubTextFile(novelFilePath);

        // Cover, Genre, Created At အပါအဝင်
        // အခြား Frontmatter Field များကို မပျက်စေရန်
        const updatedMarkdown = updateMarkdownFrontmatter(
            existing.text,
            {
                title,
                status
            }
        );

        // Synopsis ကို ပြောင်းရန်
        const parsed = parseMarkdown(updatedMarkdown);

        const finalMarkdown = updatedMarkdown.replace(
            parsed.body,
            synopsis
        );

        await uploadToGitHub(
            novelFilePath,
            finalMarkdown,
            `Update novel: ${title}`
        );

        await updateNovelsJsonFile();

        alert("Novel အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!");

        closeEditModal();

        loadManageNovelsList();

        loadNovelsDropdown();

    } catch (error) {

        console.error(error);

        alert("Novel ပြင်ဆင်ရာတွင် အမှားရှိပါသည်: " + error.message);
    }
}

// ==========================================
// 🗑️ DELETE NOVEL
// ==========================================
async function deleteNovel(slug, title) {

    if (!confirm(
        `"${title}" နှင့် သက်ဆိုင်သော Chapter များပါ ဖျက်ရန် သေချာပါသလား?`
    )) {
        return;
    }

    try {

        const chapterFiles = await listGitHubDirectory(
            "content/chapters"
        );

        const relatedChapters = chapterFiles.filter(file =>
            file.name.startsWith(`${slug}-ch-`) &&
            file.name.endsWith(".md")
        );

        // Chapter များကို အကန့်အသတ်ဖြင့် Parallel ဖျက်ရန်
        await mapWithConcurrency(
            relatedChapters,
            MAX_CONCURRENT_DELETES,
            async file => {

                await deleteFromGitHub(
                    `content/chapters/${file.name}`,
                    `Delete chapter ${file.name} for ${slug}`
                );
            }
        );

        // Novel ဖိုင်ကို ဖျက်ရန်
        await deleteFromGitHub(
            `content/novels/${slug}.md`,
            `Delete novel: ${title}`
        );

        await updateNovelsJsonFile();

        alert("Novel နှင့် သက်ဆိုင်သော Chapter အားလုံး ဖျက်ပြီးပါပြီ!");

        loadManageNovelsList();

        loadNovelsDropdown();

    } catch (error) {

        console.error(error);

        alert("Novel ဖျက်ရာတွင် အမှားရှိပါသည်: " + error.message);
    }
}

// ==========================================
// 📚 OPEN CHAPTERS MANAGER
// ==========================================
async function openChaptersManager(slug, title) {

    const modal = document.getElementById("manage-chapters-modal");

    const listContainer = document.getElementById("admin-chapter-list");

    if (!modal || !listContainer) return;

    listContainer.innerHTML = `
        <p style="color:#aaa;text-align:center;">
            Chapter များကို ရှာနေသည်...
        </p>
    `;

    modal.style.display = "flex";

    try {

        const files = await listGitHubDirectory(
            "content/chapters"
        );

        const chapterFiles = files.filter(file =>
            file.name.startsWith(`${slug}-ch-`) &&
            file.name.endsWith(".md")
        );

        if (!chapterFiles.length) {

            listContainer.innerHTML = `
                <p style="color:#aaa;text-align:center;">
                    ဤ Novel တွင် Chapter များ မရှိသေးပါ။
                </p>
            `;

            return;
        }

        // Chapter Markdown များကို Parallel ဖတ်ရန်
        const chapters = await mapWithConcurrency(
            chapterFiles,
            MAX_CONCURRENT_READS,
            async file => {

                const { text } = await readGitHubTextFile(
                    `content/chapters/${file.name}`
                );

                const parsed = parseMarkdown(text);

                return {

                    fileName: file.name,

                    title: parsed.frontmatter.title || "",

                    number: parseInt(
                        parsed.frontmatter.chapter_number,
                        10
                    ) || 1
                };
            }
        );

        chapters.sort((a, b) => a.number - b.number);

        listContainer.replaceChildren();

        chapters.forEach(chapter => {

            const row = document.createElement("div");

            row.style.cssText = `
                display:flex;
                justify-content:space-between;
                align-items:center;
                background:rgba(255,255,255,0.05);
                padding:10px;
                border-radius:6px;
                gap:10px;
                flex-wrap:wrap;
            `;

            const info = document.createElement("div");

            const number = document.createElement("span");

            number.style.cssText = "font-weight:600;color:#fff;";

            number.textContent = `Chapter ${chapter.number}`;

            const chapterTitle = document.createElement("span");

            chapterTitle.style.cssText = "color:#a8b3cf;font-size:0.9rem;";

            chapterTitle.textContent = chapter.title
                ? ` - ${chapter.title}`
                : "";

            info.append(number, chapterTitle);

            const actions = document.createElement("div");

            actions.style.cssText = "display:flex;gap:6px;";

            const editBtn = document.createElement("button");

            editBtn.type = "button";

            editBtn.className = "submit-btn";

            editBtn.style.cssText = `
                padding:4px 8px;
                font-size:0.75rem;
                background:#eab308;
            `;

            editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> ပြင်မည်';

            editBtn.addEventListener("click", () => {
                openEditChapterModal(chapter.fileName, slug);
            });

            const deleteBtn = document.createElement("button");

            deleteBtn.type = "button";

            deleteBtn.className = "submit-btn";

            deleteBtn.style.cssText = `
                padding:4px 8px;
                font-size:0.75rem;
                background:#ef4444;
            `;

            deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> ဖျက်မည်';

            deleteBtn.addEventListener("click", () => {
                deleteChapter(chapter.fileName, slug);
            });

            actions.append(editBtn, deleteBtn);

            row.append(info, actions);

            listContainer.appendChild(row);
        });

    } catch (error) {

        console.error(error);

        listContainer.innerHTML = `
            <p style="color:#ef4444;text-align:center;">
                Chapter စာရင်းရယူရာတွင် အမှားရှိပါသည်။
            </p>
        `;
    }
}

// ==========================================
// ❌ CLOSE CHAPTERS MODAL
// ==========================================
function closeChaptersModal() {

    const modal = document.getElementById("manage-chapters-modal");

    if (modal) {
        modal.style.display = "none";
    }
}

// ==========================================
// 🗑️ DELETE CHAPTER
// ==========================================
async function deleteChapter(fileName, slug) {

    if (!confirm("ဤ Chapter ကို ဖျက်ရန် သေချာပါသလား?")) {
        return;
    }

    try {

        await deleteFromGitHub(
            `content/chapters/${fileName}`,
            `Delete chapter ${fileName}`
        );

        await updateNovelsJsonFile();

        alert("Chapter အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!");

        const novel = allAdminNovels.find(item => item.slug === slug);

        openChaptersManager(
            slug,
            novel?.title || slug
        );

    } catch (error) {

        console.error(error);

        alert("Chapter ဖျက်ရာတွင် အမှားရှိပါသည်: " + error.message);
    }
}

// ==========================================
// ✏️ OPEN EDIT CHAPTER MODAL
// ==========================================
async function openEditChapterModal(fileName, slug) {

    try {

        const result = await readGitHubTextFile(
            `content/chapters/${fileName}`
        );

        const parsed = parseMarkdown(result.text);

        const chTitle = parsed.frontmatter.title || "";

        const chNum = parseInt(
            parsed.frontmatter.chapter_number,
            10
        ) || 1;

        document.getElementById(
            "edit-chapter-filename"
        ).value = fileName;

        document.getElementById(
            "edit-chapter-slug"
        ).value = slug;

        document.getElementById(
            "edit-chapter-number"
        ).value = chNum;

        document.getElementById(
            "edit-chapter-title"
        ).value = chTitle;

        document.getElementById(
            "edit-chapter-content"
        ).value = parsed.body;

        document.getElementById(
            "edit-chapter-modal"
        ).style.display = "flex";

    } catch (error) {

        console.error(error);

        alert("Chapter ဖတ်ရာတွင် အမှားရှိပါသည်: " + error.message);
    }
}

// ==========================================
// ❌ CLOSE EDIT CHAPTER MODAL
// ==========================================
function closeEditChapterModal() {

    const modal = document.getElementById("edit-chapter-modal");

    if (modal) {
        modal.style.display = "none";
    }
}

// ==========================================
// 💾 UPDATE CHAPTER
// ==========================================
async function handleUpdateChapter(e) {

    if (e) e.preventDefault();

    const btn = document.getElementById("save-edit-chapter-btn");

    if (btn) btn.disabled = true;

    try {

        const fileName = document.getElementById(
            "edit-chapter-filename"
        ).value;

        const slug = document.getElementById(
            "edit-chapter-slug"
        ).value;

        const chNum = parseInt(
            document.getElementById("edit-chapter-number").value,
            10
        );

        const chTitle = document.getElementById(
            "edit-chapter-title"
        ).value.trim();

        const chContent = document.getElementById(
            "edit-chapter-content"
        ).value.trim();

        if (!Number.isInteger(chNum) || chNum < 1) {
            throw new Error("Chapter Number မှန်ကန်စွာ ထည့်ပေးပါ။");
        }

        if (!chContent) {
            throw new Error("Chapter Content ထည့်ပေးပါ။");
        }

        // မူရင်းဖိုင်ကို အရင်ဖတ်ပါ။
        const oldFilePath = `content/chapters/${fileName}`;

        const oldFile = await readGitHubTextFile(oldFilePath);

        const newFileName = `${slug}-ch-${chNum}.md`;

        const newFilePath = `content/chapters/${newFileName}`;

        // Chapter Number ပြောင်းပြီးသားလား စစ်ဆေးရန်
        if (fileName !== newFileName) {

            if (await githubFileExists(newFilePath)) {

                throw new Error(
                    `Chapter ${chNum} ရှိပြီးသားဖြစ်နေပါသည်။`
                );
            }
        }

        // မူရင်း Created At နှင့် အခြား Frontmatter Fields များ ထိန်းသိမ်းရန်
        let updatedMarkdown = updateMarkdownFrontmatter(
            oldFile.text,
            {
                novel_slug: slug,
                chapter_number: chNum,
                title: chTitle
            }
        );

        // Content ကို အသစ်ပြောင်းရန်
        const parsed = parseMarkdown(updatedMarkdown);

        updatedMarkdown = updatedMarkdown.replace(
            parsed.body,
            chContent
        );

        if (btn) {
            btn.innerText = "Chapter သိမ်းဆည်းနေသည်...";
        }

        // အရေးကြီးသည်။
        // ဖိုင်အသစ်ကို အရင် Upload လုပ်မည်။
        // Upload မအောင်မြင်လျှင် မူရင်းဖိုင်ကို မဖျက်ပါ။
        await uploadToGitHub(
            newFilePath,
            updatedMarkdown,
            `Update ${slug} Chapter ${chNum}`
        );

        // Filename ပြောင်းသွားလျှင် JSON Metadata mapping ထည့်ရန်
        if (fileName !== newFileName) {

            pendingChapterFileRenames[newFilePath] = oldFilePath;

            // အသစ်သိမ်းပြီးမှ အဟောင်းကို ဖျက်မည်။
            await deleteFromGitHub(
                oldFilePath,
                `Remove old chapter file ${fileName}`
            );
        }

        if (btn) {
            btn.innerText = "novels.json Update လုပ်နေသည်...";
        }

        await updateNovelsJsonFile();

        alert("Chapter အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!");

        closeEditChapterModal();

        const novel = allAdminNovels.find(item => item.slug === slug);

        openChaptersManager(
            slug,
            novel?.title || slug
        );

    } catch (error) {

        console.error(error);

        alert("Chapter ပြင်ဆင်ရာတွင် အမှားရှိပါသည်: " + error.message);

    } finally {

        if (btn) {
            btn.disabled = false;
            btn.innerText = "ပြင်ဆင်မည်";
        }
    }
}

// ==========================================
// ✅ END OF NOVELVERSE ADMIN JS
// ==========================================
