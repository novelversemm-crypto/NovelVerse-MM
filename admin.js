
// ======================================================
// NOVELVERSE MM - ADMIN DASHBOARD
// Stable GitHub CMS + Cloudinary Integration
// ======================================================


// ======================================================
// 1. CONFIGURATION
// ======================================================

const GITHUB_OWNER = "novelversemm-crypto";
const GITHUB_REPO = "NovelVerse-MM";
const GITHUB_BRANCH = "main";

const GITHUB_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

const NOVELS_DIR = "content/novels";
const CHAPTERS_DIR = "content/chapters";
const NOVELS_JSON = "content/novels.json";

const CLOUDINARY_CLOUD_NAME = "n1rewvpg";
const CLOUDINARY_UPLOAD_PRESET = "novel_covers";

const GITHUB_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28"
};


// ======================================================
// 2. GLOBAL VARIABLES
// ======================================================

let allAdminNovels = [];
let currentChapterManagerSlug = "";
let currentChapterManagerTitle = "";

let isSavingNovel = false;
let isSavingChapter = false;
let isUpdatingNovel = false;
let isUpdatingChapter = false;


// ======================================================
// 3. DOM INITIALIZATION
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    // Register existing global functions
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

    // Modal backdrop closing
    setupModalEvents();

    // Verify saved token before showing dashboard
    const savedToken = getToken();

    if (savedToken) {
        try {
            await verifyGitHubToken(savedToken);
            showDashboard();
        } catch (error) {
            console.error("Saved token verification failed:", error);

            localStorage.removeItem("github_token");
            showLogin();
        }
    } else {
        showLogin();
    }

});


// ======================================================
// 4. GENERAL HELPERS
// ======================================================

function getToken() {
    return localStorage.getItem("github_token") || "";
}


function getAuthHeaders() {

    const token = getToken();

    if (!token) {
        throw new Error("GitHub Token မရှိပါ။ Login ပြန်ဝင်ပါ။");
    }

    return {
        ...GITHUB_HEADERS,
        "Authorization": `Bearer ${token}`
    };
}


function encodeGitHubPath(path) {

    return path
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");
}


function encodeBase64UTF8(text) {

    const bytes = new TextEncoder().encode(text);

    let binary = "";

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}


function decodeBase64UTF8(base64) {

    const binary = atob(base64.replace(/\s/g, ""));

    const bytes = Uint8Array.from(
        binary,
        char => char.charCodeAt(0)
    );

    return new TextDecoder("utf-8").decode(bytes);
}


function parseScalar(value) {

    const text = String(value ?? "").trim();

    if (
        text.startsWith('"') &&
        text.endsWith('"')
    ) {
        try {
            return JSON.parse(text);
        } catch (_) {
            return text.slice(1, -1);
        }
    }

    if (
        text.startsWith("'") &&
        text.endsWith("'")
    ) {
        return text.slice(1, -1).replace(/''/g, "'");
    }

    if (text === "true") return true;
    if (text === "false") return false;
    if (text === "null") return null;

    if (/^-?\d+(\.\d+)?$/.test(text)) {
        return Number(text);
    }

    return text;
}


function parseMarkdown(markdown) {

    const match = markdown.match(
        /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/
    );

    if (!match) {
        return {
            frontmatter: {},
            body: markdown,
            hasFrontmatter: false
        };
    }

    const frontmatter = {};

    match[1].split(/\r?\n/).forEach(line => {

        const separator = line.indexOf(":");

        if (separator === -1) return;

        const key = line.slice(0, separator).trim();

        const value = line.slice(separator + 1).trim();

        if (!key) return;

        frontmatter[key] = parseScalar(value);

    });

    return {
        frontmatter,
        body: markdown.slice(match[0].length),
        hasFrontmatter: true
    };
}


// Update selected frontmatter fields without deleting unknown fields.
function updateMarkdownFrontmatter(markdown, updates, newBody = null) {

    const parsed = parseMarkdown(markdown);

    const lines = parsed.hasFrontmatter
        ? markdown.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/)[1].split(/\r?\n/)
        : [];

    const updatedKeys = new Set();

    const newLines = lines.map(line => {

        const separator = line.indexOf(":");

        if (separator === -1) return line;

        const key = line.slice(0, separator).trim();

        if (!Object.prototype.hasOwnProperty.call(updates, key)) {
            return line;
        }

        updatedKeys.add(key);

        return `${key}: ${JSON.stringify(updates[key])}`;

    });

    Object.entries(updates).forEach(([key, value]) => {

        if (!updatedKeys.has(key)) {
            newLines.push(`${key}: ${JSON.stringify(value)}`);
        }

    });

    const body = newBody !== null
        ? newBody
        : parsed.body;

    return `---
${newLines.join("\n")}
---

${body}`;
}


function escapeHtml(value) {

    return String(value ?? "").replace(/[&<>"']/g, char => {

        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];

    });

}


function setButtonLoading(button, loading, text, originalText) {

    if (!button) return;

    button.disabled = loading;

    button.textContent = loading
        ? text
        : originalText;

}


function getErrorMessage(error) {

    return error?.message || "Unknown error";

}


function validateChapterNumber(number) {

    return Number.isInteger(number) && number >= 1;

}


// ======================================================
// 5. GITHUB API HELPERS
// ======================================================

async function githubRequest(url, options = {}) {

    const response = await fetch(url, {
        ...options,
        headers: {
            ...getAuthHeaders(),
            ...(options.headers || {})
        }
    });

    if (!response.ok) {

        let errorData = {};

        try {
            errorData = await response.json();
        } catch (_) {}

        const message =
            errorData.message ||
            `GitHub API Error: ${response.status}`;

        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();

}


// Read a GitHub file without losing UTF-8 Myanmar text.
async function getGitHubFile(filePath) {

    const url =
        `${GITHUB_API}/contents/${encodeGitHubPath(filePath)}?ref=${GITHUB_BRANCH}`;

    const response = await fetch(url, {
        headers: getAuthHeaders()
    });

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {

        let errorData = {};

        try {
            errorData = await response.json();
        } catch (_) {}

        throw new Error(
            errorData.message || "GitHub ဖိုင်ဖတ်၍မရပါ။"
        );
    }

    const data = await response.json();

    let content = "";

    if (data.encoding === "base64" && data.content) {

        content = decodeBase64UTF8(data.content);

    } else if (data.download_url) {

        const rawResponse = await fetch(data.download_url);

        if (!rawResponse.ok) {
            throw new Error("Raw file download မအောင်မြင်ပါ။");
        }

        content = await rawResponse.text();

    } else {

        throw new Error(
            "ဖိုင် Content ကို ရယူ၍မရပါ။"
        );

    }

    return {
        sha: data.sha,
        content,
        downloadUrl: data.download_url,
        size: data.size
    };

}


// List complete GitHub directory.
async function listGitHubDirectory(directory) {

    let allFiles = [];

    let page = 1;

    while (true) {

        const url =
            `${GITHUB_API}/contents/${encodeGitHubPath(directory)}` +
            `?ref=${GITHUB_BRANCH}&per_page=1000&page=${page}`;

        const data = await githubRequest(url);

        if (!Array.isArray(data)) {
            throw new Error("GitHub Directory Data မှားယွင်းနေပါသည်။");
        }

        allFiles = allFiles.concat(data);

        if (data.length < 1000) {
            break;
        }

        page++;

    }

    return allFiles;

}


// Upload or update GitHub file.
async function uploadToGitHub(
    filePath,
    fileContent,
    commitMessage,
    options = {}
) {

    const token = getToken();

    if (!token) {
        throw new Error("GitHub Login လိုအပ်ပါသည်။");
    }

    const existing = await getGitHubFile(filePath);

    if (options.createOnly && existing) {

        throw new Error(
            `ဖိုင်ရှိပြီးသားဖြစ်နေပါသည်။ (${filePath})`
        );

    }

    const url =
        `${GITHUB_API}/contents/${encodeGitHubPath(filePath)}`;

    const bodyData = {
        message: commitMessage,
        content: encodeBase64UTF8(fileContent),
        branch: GITHUB_BRANCH
    };

    if (existing) {
        bodyData.sha = existing.sha;
    }

    return await githubRequest(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
    });

}


// Delete GitHub file.
async function deleteFromGitHub(filePath, commitMessage) {

    const existing = await getGitHubFile(filePath);

    if (!existing) {
        throw new Error(`ဖိုင်ကို ရှာမတွေ့ပါ။ (${filePath})`);
    }

    const url =
        `${GITHUB_API}/contents/${encodeGitHubPath(filePath)}`;

    return await githubRequest(url, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: commitMessage,
            sha: existing.sha,
            branch: GITHUB_BRANCH
        })
    });

}


// ======================================================
// 6. TOKEN VERIFICATION
// ======================================================

async function verifyGitHubToken(token) {

    const response = await fetch(GITHUB_API, {
        headers: {
            ...GITHUB_HEADERS,
            "Authorization": `Bearer ${token}`
        }
    });

    if (!response.ok) {

        throw new Error(
            "GitHub Token မှားယွင်းနေသည် သို့မဟုတ် Repository Permission မရှိပါ။"
        );

    }

    return true;

}


// ======================================================
// 7. LOGIN / LOGOUT
// ======================================================

async function handleLogin(e) {

    if (e) e.preventDefault();

    const input = document.getElementById("github-token-input");
    const button = document.getElementById("login-btn");

    const token = input?.value.trim();

    if (!token) {

        alert("ကျေးဇူးပြု၍ GitHub Token ထည့်ပါ။");

        return;
    }

    const originalText = "Login ဝင်မည်";

    setButtonLoading(
        button,
        true,
        "GitHub ချိတ်ဆက်နေသည်...",
        originalText
    );

    try {

        const response = await fetch(GITHUB_API, {
            headers: {
                ...GITHUB_HEADERS,
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(
                "Token မှားယွင်းနေသည် သို့မဟုတ် Permission မရှိပါ။"
            );
        }

        localStorage.setItem("github_token", token);

        if (input) input.value = "";

        showDashboard();

        alert("Admin Panel သို့ အောင်မြင်စွာ ဝင်ရောက်လိုက်ပါပြီ!");

    } catch (error) {

        alert("Login မအောင်မြင်ပါ: " + getErrorMessage(error));

    } finally {

        if (button) {
            button.disabled = false;
            button.innerHTML =
                '<i class="fa-solid fa-right-to-bracket"></i> Login ဝင်မည်';
        }

    }

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

    if (!confirm("Admin အကောင့်မှ ထွက်ရန် သေချာပါသလား?")) {
        return;
    }

    localStorage.removeItem("github_token");

    allAdminNovels = [];

    showLogin();

}


// ======================================================
// 8. TAB MANAGEMENT
// ======================================================

function switchTab(tabId) {

    document.querySelectorAll(".tab-content").forEach(element => {
        element.style.display = "none";
    });

    document.querySelectorAll(".tab-btn").forEach(button => {
        button.classList.remove("active");
    });

    const targetTab = document.getElementById(`tab-${tabId}`);

    if (targetTab) {
        targetTab.style.display = "block";
    }

    const buttons = document.querySelectorAll(".tab-btn");

    buttons.forEach(button => {

        const handler = button.getAttribute("onclick");

        if (handler && handler.includes(`'${tabId}'`)) {
            button.classList.add("active");
        }

    });

    if (tabId === "add-chapter") {
        loadNovelsDropdown();
    }

    if (tabId === "manage-novels") {
        loadManageNovelsList();
    }

}


// ======================================================
// 9. MARKDOWN FRONTMATTER HELPERS
// ======================================================

function getNovelData(markdown, fileName) {

    const parsed = parseMarkdown(markdown);

    const data = parsed.frontmatter;

    return {
        slug: fileName.replace(/\.md$/i, ""),
        title: data.title || fileName.replace(/\.md$/i, ""),
        coverUrl: data.cover_url || "",
        genre: data.genre || "No Genre",
        status: data.status || "Ongoing",
        synopsis: parsed.body.trim(),
        createdAt: data.created_at || ""
    };

}


function getChapterData(markdown, fileName) {

    const parsed = parseMarkdown(markdown);

    const data = parsed.frontmatter;

    const numberFromFile = fileName.match(/-ch-(\d+)\.md$/i);

    return {
        chapter_number:
            Number(data.chapter_number) ||
            Number(numberFromFile?.[1]) ||
            1,

        title: data.title || "",

        created_at: data.created_at || "",

        file: `${CHAPTERS_DIR}/${fileName}`,

        frontmatter: data,

        content: parsed.body.trim()
    };

}


// ======================================================
// 10. UPDATE novels.json SAFELY
// ======================================================

// IMPORTANT:
// Existing JSON fields are preserved.
// Existing chapter metadata is preserved.
// Unknown future properties are NOT discarded.

async function updateNovelsJsonFile() {

    const token = getToken();

    if (!token) {
        throw new Error("GitHub Login လိုအပ်ပါသည်။");
    }

    const [novelFiles, chapterFiles, existingJsonFile] =
        await Promise.all([

            listGitHubDirectory(NOVELS_DIR),

            listGitHubDirectory(CHAPTERS_DIR),

            getGitHubFile(NOVELS_JSON)

        ]);

    let existingNovels = [];

    if (existingJsonFile) {

        try {

            existingNovels = JSON.parse(existingJsonFile.content);

            if (!Array.isArray(existingNovels)) {
                throw new Error("novels.json သည် Array မဟုတ်ပါ။");
            }

        } catch (error) {

            // Never overwrite a malformed existing database.
            throw new Error(
                "မူရင်း novels.json ကို ဖတ်မရပါ။ " +
                "Data မပျောက်စေရန် Update ကို ရပ်ထားပါသည်။ " +
                error.message
            );

        }

    }


    const existingNovelMap = new Map(
        existingNovels.map(novel => [novel.slug, novel])
    );


    const markdownNovelFiles = novelFiles.filter(file =>
        file.type === "file" &&
        file.name.endsWith(".md")
    );


    const markdownChapterFiles = chapterFiles.filter(file =>
        file.type === "file" &&
        file.name.endsWith(".md")
    );


    const updatedNovels = [];


    for (const novelFile of markdownNovelFiles) {

        const slug = novelFile.name.replace(/\.md$/i, "");

        const oldNovel = existingNovelMap.get(slug) || {};

        const novelFileData = await getGitHubFile(
            `${NOVELS_DIR}/${novelFile.name}`
        );

        if (!novelFileData) {
            throw new Error(`Novel ဖိုင် ပျောက်နေသည်: ${slug}`);
        }

        const novel = getNovelData(
            novelFileData.content,
            novelFile.name
        );


        // Preserve all previous chapter properties.
        const oldChapters = Array.isArray(oldNovel.chapters)
            ? oldNovel.chapters
            : [];


        const oldChapterMap = new Map(
            oldChapters.map(chapter => [chapter.file, chapter])
        );


        const matchingChapterFiles = markdownChapterFiles.filter(file => {

            const match = file.name.match(/^(.+)-ch-(\d+)\.md$/i);

            return match && match[1] === slug;

        });


        const updatedChapters = [];


        for (const chapterFile of matchingChapterFiles) {

            const chapterPath =
                `${CHAPTERS_DIR}/${chapterFile.name}`;

            const chapterFileData = await getGitHubFile(chapterPath);

            if (!chapterFileData) continue;

            const chapter = getChapterData(
                chapterFileData.content,
                chapterFile.name
            );

            const oldChapter = oldChapterMap.get(chapterPath) || {};


            // Preserve unknown metadata.
            const mergedChapter = {
                ...oldChapter,
                chapter_number: chapter.chapter_number,
                title: chapter.title,
                file: chapterPath
            };


            // If lock metadata exists in Markdown, synchronize it.
            // Otherwise preserve the old JSON value.
            if (
                Object.prototype.hasOwnProperty.call(
                    chapter.frontmatter,
                    "is_locked"
                )
            ) {
                mergedChapter.is_locked =
                    chapter.frontmatter.is_locked;
            }

            if (
                Object.prototype.hasOwnProperty.call(
                    chapter.frontmatter,
                    "coin_price"
                )
            ) {
                mergedChapter.coin_price =
                    chapter.frontmatter.coin_price;
            }

            updatedChapters.push(mergedChapter);

        }


        updatedChapters.sort(
            (a, b) => a.chapter_number - b.chapter_number
        );


        const mergedNovel = {

            ...oldNovel,

            slug: novel.slug,
            title: novel.title,
            coverUrl: novel.coverUrl,
            genre: novel.genre,
            status: novel.status,
            synopsis: novel.synopsis,

            createdAt:
                novel.createdAt ||
                oldNovel.createdAt ||
                "",

            chapters: updatedChapters

        };


        updatedNovels.push(mergedNovel);

    }


    // Preserve existing novel order where possible.
    const oldOrder = new Map(
        existingNovels.map((novel, index) => [novel.slug, index])
    );

    updatedNovels.sort((a, b) => {

        const aOrder = oldOrder.has(a.slug)
            ? oldOrder.get(a.slug)
            : Number.MAX_SAFE_INTEGER;

        const bOrder = oldOrder.has(b.slug)
            ? oldOrder.get(b.slug)
            : Number.MAX_SAFE_INTEGER;

        return aOrder - bOrder;

    });


    const jsonContent = JSON.stringify(updatedNovels, null, 2);


    await uploadToGitHub(
        NOVELS_JSON,
        jsonContent,
        "Update novels.json safely"
    );


    return updatedNovels;

}


// ======================================================
// 11. CREATE NOVEL SLUG
// ======================================================

function createNovelSlug(title) {

    let slug = title
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    if (!slug) {
        slug = "novel-" + Date.now();
    }

    return slug;

}


// ======================================================
// 12. ADD NEW NOVEL
// ======================================================

async function handleAddNovel(e) {

    if (e) e.preventDefault();

    if (isSavingNovel) return;

    const btn = document.getElementById("save-novel-btn");

    const originalText = "Novel သိမ်းဆည်းမည်";

    const title =
        document.getElementById("novel-title")?.value.trim();

    const fileInput =
        document.getElementById("novel-cover-file");

    const file = fileInput?.files[0];

    const status =
        document.getElementById("novel-status")?.value;

    const synopsis =
        document.getElementById("novel-synopsis")?.value.trim();


    const selectedGenres = Array.from(
        document.querySelectorAll(
            'input[name="novel-genre-chip"]:checked'
        )
    ).map(input => input.value);


    if (!title) {
        alert("Novel ခေါင်းစဉ် ထည့်ပါ။");
        return;
    }

    if (!file) {
        alert("Cover Image ရွေးချယ်ပါ။");
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Image File သာ ရွေးချယ်နိုင်ပါသည်။");
        return;
    }

    if (selectedGenres.length === 0) {
        alert("အနည်းဆုံး Genre တစ်ခု ရွေးချယ်ပါ။");
        return;
    }


    const slug = createNovelSlug(title);

    const novelFilePath = `${NOVELS_DIR}/${slug}.md`;


    isSavingNovel = true;

    if (btn) btn.disabled = true;


    try {

        // Check duplicate BEFORE uploading the cover.
        const existing = await getGitHubFile(novelFilePath);

        if (existing) {
            throw new Error(
                "အမည်တူ Novel ရှိပြီးသားဖြစ်နေပါသည်။"
            );
        }


        if (btn) {
            btn.textContent = "Cloudinary သို့ Cover တင်နေသည်...";
        }


        const formData = new FormData();

        formData.append("file", file);

        formData.append(
            "upload_preset",
            CLOUDINARY_UPLOAD_PRESET
        );


        const uploadResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData
            }
        );


        const uploadData = await uploadResponse.json();


        if (!uploadResponse.ok) {

            throw new Error(
                uploadData.error?.message ||
                "Cloudinary Upload မအောင်မြင်ပါ။"
            );

        }


        const coverUrl = uploadData.secure_url;


        const markdownContent = `---
title: ${JSON.stringify(title)}
cover_url: ${JSON.stringify(coverUrl)}
genre: ${JSON.stringify(selectedGenres.join(", "))}
status: ${JSON.stringify(status)}
created_at: ${JSON.stringify(new Date().toISOString())}
---

${synopsis}
`;


        if (btn) {
            btn.textContent = "GitHub သို့ သိမ်းဆည်းနေသည်...";
        }


        await uploadToGitHub(
            novelFilePath,
            markdownContent,
            `Add novel: ${title}`,
            { createOnly: true }
        );


        if (btn) {
            btn.textContent = "novels.json အပ်ဒိတ်လုပ်နေသည်...";
        }


        await updateNovelsJsonFile();


        alert("Novel အသစ် အောင်မြင်စွာ တင်ပြီးပါပြီ!");


        document.getElementById("add-novel-form").reset();

        await loadNovelsDropdown();

        await loadManageNovelsList();


    } catch (error) {

        alert(
            "Novel တင်ရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error)
        );

        console.error("Add Novel Error:", error);


    } finally {

        isSavingNovel = false;

        if (btn) {
            btn.disabled = false;
            btn.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> Novel သိမ်းဆည်းမည်';
        }

    }

}


// ======================================================
// 13. ADD NEW CHAPTER
// ======================================================

async function handleAddChapter(e) {

    if (e) e.preventDefault();

    if (isSavingChapter) return;

    const btn = document.getElementById("save-chapter-btn");

    const novelSlug =
        document.getElementById("select-novel-dropdown")?.value;

    const chNum = Number(
        document.getElementById("chapter-number")?.value
    );

    const chTitle =
        document.getElementById("chapter-title-input")?.value.trim();

    const chContent =
        document.getElementById("chapter-content-input")?.value.trim();


    if (!novelSlug) {
        alert("Novel ရွေးချယ်ပါ။");
        return;
    }

    if (!validateChapterNumber(chNum)) {
        alert("Chapter နံပါတ် မှန်ကန်စွာ ထည့်ပါ။");
        return;
    }

    if (!chContent) {
        alert("Chapter Content ထည့်ပါ။");
        return;
    }


    const chapterFileName = `${novelSlug}-ch-${chNum}.md`;

    const chapterFilePath =
        `${CHAPTERS_DIR}/${chapterFileName}`;


    isSavingChapter = true;

    if (btn) btn.disabled = true;


    try {

        // Verify selected novel exists.
        const novelFile = await getGitHubFile(
            `${NOVELS_DIR}/${novelSlug}.md`
        );

        if (!novelFile) {
            throw new Error("ရွေးချယ်ထားသော Novel မရှိတော့ပါ။");
        }


        // Prevent duplicate chapter overwrite.
        const existing = await getGitHubFile(chapterFilePath);

        if (existing) {
            throw new Error(
                `Chapter ${chNum} ရှိပြီးသားဖြစ်နေပါသည်။`
            );
        }


        const markdownContent = `---
novel_slug: ${JSON.stringify(novelSlug)}
chapter_number: ${chNum}
title: ${JSON.stringify(chTitle)}
created_at: ${JSON.stringify(new Date().toISOString())}
---

${chContent}
`;


        await uploadToGitHub(
            chapterFilePath,
            markdownContent,
            `Add ${novelSlug} Chapter ${chNum}`,
            { createOnly: true }
        );


        if (btn) {
            btn.textContent = "novels.json အပ်ဒိတ်လုပ်နေသည်...";
        }


        await updateNovelsJsonFile();


        alert(`Chapter ${chNum} အောင်မြင်စွာ တင်ပြီးပါပြီ!`);


        document.getElementById("chapter-number").value =
            chNum + 1;

        document.getElementById("chapter-title-input").value = "";

        document.getElementById("chapter-content-input").value = "";


    } catch (error) {

        alert(
            "Chapter တင်ရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error)
        );

        console.error("Add Chapter Error:", error);


    } finally {

        isSavingChapter = false;

        if (btn) {
            btn.disabled = false;
            btn.innerHTML =
                '<i class="fa-solid fa-cloud-arrow-up"></i> Chapter တင်မည်';
        }

    }

}


// ======================================================
// 14. LOAD NOVEL DROPDOWN
// ======================================================

async function loadNovelsDropdown() {

    const dropdown =
        document.getElementById("select-novel-dropdown");

    if (!dropdown) return;

    dropdown.innerHTML =
        '<option value="">Novel များကို ရယူနေသည်...</option>';


    try {

        const files = await listGitHubDirectory(NOVELS_DIR);

        const markdownFiles = files.filter(file =>
            file.type === "file" &&
            file.name.endsWith(".md")
        );


        const options = [];

        for (const file of markdownFiles) {

            const fileData = await getGitHubFile(
                `${NOVELS_DIR}/${file.name}`
            );

            if (!fileData) continue;

            const novel = getNovelData(
                fileData.content,
                file.name
            );

            options.push({
                slug: novel.slug,
                title: novel.title
            });

        }


        dropdown.innerHTML = "";

        const defaultOption = document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent = "-- Novel ရွေးပါ --";

        dropdown.appendChild(defaultOption);


        options.sort((a, b) =>
            a.title.localeCompare(b.title)
        );


        options.forEach(novel => {

            const option = document.createElement("option");

            option.value = novel.slug;
            option.textContent = novel.title;

            dropdown.appendChild(option);

        });


        if (options.length === 0) {

            defaultOption.textContent = "-- Novel များ မရှိသေးပါ --";

        }


    } catch (error) {

        console.error("Dropdown Error:", error);

        dropdown.innerHTML =
            '<option value="">ဒေတာရယူရာတွင် အမှားရှိပါသည်</option>';

    }

}


// ======================================================
// 15. LOAD MANAGE NOVELS
// ======================================================

async function loadManageNovelsList() {

    const container =
        document.getElementById("admin-novel-list");

    if (!container) return;

    container.textContent = "Novel များကို ရယူနေသည်...";


    try {

        const files = await listGitHubDirectory(NOVELS_DIR);

        const markdownFiles = files.filter(file =>
            file.type === "file" &&
            file.name.endsWith(".md")
        );


        allAdminNovels = [];


        for (const file of markdownFiles) {

            const fileData = await getGitHubFile(
                `${NOVELS_DIR}/${file.name}`
            );

            if (!fileData) continue;

            const novel = getNovelData(
                fileData.content,
                file.name
            );

            allAdminNovels.push(novel);

        }


        allAdminNovels.sort((a, b) =>
            a.title.localeCompare(b.title)
        );


        filterAdminNovels();


    } catch (error) {

        console.error("Manage Novel Error:", error);

        container.textContent =
            "Novel စာရင်းရယူရာတွင် အမှားရှိပါသည်။";

    }

}


// ======================================================
// 16. RENDER NOVELS LIST
// ======================================================

function renderAdminNovelsList(novels) {

    const container =
        document.getElementById("admin-novel-list");

    if (!container) return;

    container.innerHTML = "";


    if (novels.length === 0) {

        const empty = document.createElement("p");

        empty.className = "admin-empty-state";

        empty.textContent = "Novel ရှာမတွေ့ပါ။";

        container.appendChild(empty);

        return;

    }


    novels.forEach(novel => {

        const item = document.createElement("div");

        item.className = "admin-novel-item";


        const info = document.createElement("div");

        info.className = "admin-novel-info";


        const image = document.createElement("img");

        image.className = "admin-cover";

        image.src = novel.coverUrl || "./favicon.png";

        image.alt = novel.title;

        image.loading = "lazy";

        image.onerror = function () {
            this.onerror = null;
            this.src = "./favicon.png";
        };


        const details = document.createElement("div");

        details.className = "admin-novel-details";


        const title = document.createElement("div");

        title.className = "admin-novel-title";

        title.textContent = novel.title;


        const meta = document.createElement("div");

        meta.className = "admin-novel-meta";

        meta.textContent =
            `${novel.genre} • ${novel.status}`;


        details.appendChild(title);
        details.appendChild(meta);

        info.appendChild(image);
        info.appendChild(details);


        const actions = document.createElement("div");

        actions.className = "admin-action-btns";


        const chaptersBtn = document.createElement("button");

        chaptersBtn.type = "button";

        chaptersBtn.className = "submit-btn btn-chapters";

        chaptersBtn.innerHTML =
            '<i class="fa-solid fa-book-open"></i> Chapters';

        chaptersBtn.addEventListener("click", () => {

            openChaptersManager(
                novel.slug,
                novel.title
            );

        });


        const editBtn = document.createElement("button");

        editBtn.type = "button";

        editBtn.className = "submit-btn btn-edit";

        editBtn.innerHTML =
            '<i class="fa-solid fa-pen"></i> Edit';

        editBtn.addEventListener("click", () => {

            openEditModal(
                novel.slug,
                novel.title,
                novel.status,
                novel.synopsis
            );

        });


        const deleteBtn = document.createElement("button");

        deleteBtn.type = "button";

        deleteBtn.className = "submit-btn btn-delete";

        deleteBtn.innerHTML =
            '<i class="fa-solid fa-trash"></i> Delete';

        deleteBtn.addEventListener("click", () => {

            deleteNovel(
                novel.slug,
                novel.title
            );

        });


        actions.appendChild(chaptersBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);


        item.appendChild(info);
        item.appendChild(actions);

        container.appendChild(item);

    });

}


// ======================================================
// 17. SEARCH NOVELS
// ======================================================

function filterAdminNovels() {

    const input =
        document.getElementById("admin-search-novel");

    const query = (input?.value || "")
        .trim()
        .toLowerCase();


    const filtered = allAdminNovels.filter(novel => {

        return (
            novel.title.toLowerCase().includes(query) ||
            novel.slug.toLowerCase().includes(query) ||
            novel.genre.toLowerCase().includes(query)
        );

    });


    renderAdminNovelsList(filtered);

}


// ======================================================
// 18. EDIT NOVEL MODAL
// ======================================================

function openEditModal(slug, title, status, synopsis) {

    document.getElementById("edit-novel-id").value = slug;

    document.getElementById("edit-novel-title").value = title;

    document.getElementById("edit-novel-status").value = status;

    document.getElementById("edit-novel-synopsis").value = synopsis;


    document.getElementById("edit-novel-modal").style.display =
        "flex";

}


function closeEditModal() {

    const modal =
        document.getElementById("edit-novel-modal");

    if (modal) modal.style.display = "none";

}


// ======================================================
// 19. UPDATE NOVEL
// ======================================================

async function handleUpdateNovel(e) {

    if (e) e.preventDefault();

    if (isUpdatingNovel) return;

    const slug =
        document.getElementById("edit-novel-id").value;

    const title =
        document.getElementById("edit-novel-title").value.trim();

    const status =
        document.getElementById("edit-novel-status").value;

    const synopsis =
        document.getElementById("edit-novel-synopsis").value.trim();


    if (!title) {
        alert("Novel ခေါင်းစဉ် ထည့်ပါ။");
        return;
    }


    const btn =
        document.querySelector("#edit-novel-form button[type='submit']");

    const originalText = "ပြင်ဆင်မည်";


    isUpdatingNovel = true;

    if (btn) btn.disabled = true;


    try {

        const filePath = `${NOVELS_DIR}/${slug}.md`;

        const existing = await getGitHubFile(filePath);

        if (!existing) {
            throw new Error("Novel ဖိုင်ကို ရှာမတွေ့ပါ။");
        }


        // Update only the requested fields.
        // Keep cover_url, genre, created_at and unknown metadata.

        const markdownContent = updateMarkdownFrontmatter(
            existing.content,
            {
                title,
                status
            },
            synopsis
        );


        await uploadToGitHub(
            filePath,
            markdownContent,
            `Update novel: ${title}`
        );


        await updateNovelsJsonFile();


        alert("Novel အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!");

        closeEditModal();

        await loadManageNovelsList();

        await loadNovelsDropdown();


    } catch (error) {

        alert(
            "Novel ပြင်ဆင်ရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error)
        );

        console.error("Update Novel Error:", error);


    } finally {

        isUpdatingNovel = false;

        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText;
        }

    }

}


// ======================================================
// 20. DELETE NOVEL
// ======================================================

async function deleteNovel(slug, title) {

    if (!confirm(
        `"${title}" နှင့် သက်ဆိုင်သော Chapter များပါ ဖျက်မည်ဖြစ်သည်။\n\n` +
        "ဤလုပ်ဆောင်ချက်ကို ပြန်လည်ပြင်ဆင်၍မရပါ။\n\n" +
        "သေချာပါသလား?"
    )) {
        return;
    }


    try {

        const chapterFiles =
            await listGitHubDirectory(CHAPTERS_DIR);


        const relatedChapters = chapterFiles.filter(file => {

            if (
                file.type !== "file" ||
                !file.name.endsWith(".md")
            ) {
                return false;
            }

            const match =
                file.name.match(/^(.+)-ch-(\d+)\.md$/i);

            return match && match[1] === slug;

        });


        // Delete related chapters first.
        for (const file of relatedChapters) {

            await deleteFromGitHub(
                `${CHAPTERS_DIR}/${file.name}`,
                `Delete chapter ${file.name}`
            );

        }


        // Delete novel only after chapter deletions.
        await deleteFromGitHub(
            `${NOVELS_DIR}/${slug}.md`,
            `Delete novel: ${title}`
        );


        await updateNovelsJsonFile();


        alert("Novel နှင့် Chapter များ အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!");


        await loadManageNovelsList();

        await loadNovelsDropdown();


    } catch (error) {

        console.error("Delete Novel Error:", error);

        alert(
            "Novel ဖျက်ရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error) +
            "\n\nအချို့ဖိုင်များ ဖျက်ပြီးဖြစ်နိုင်သောကြောင့် GitHub ကို စစ်ဆေးပါ။"
        );

    }

}


// ======================================================
// 21. OPEN CHAPTER MANAGER
// ======================================================

async function openChaptersManager(slug, title) {

    const modal =
        document.getElementById("manage-chapters-modal");

    const listContainer =
        document.getElementById("admin-chapter-list");


    if (!modal || !listContainer) return;


    currentChapterManagerSlug = slug;

    currentChapterManagerTitle = title;


    listContainer.textContent =
        `"${title}" ၏ Chapter များကို ရယူနေသည်...`;

    modal.style.display = "flex";


    try {

        const files =
            await listGitHubDirectory(CHAPTERS_DIR);


        const chapterFiles = files.filter(file => {

            if (
                file.type !== "file" ||
                !file.name.endsWith(".md")
            ) {
                return false;
            }

            const match =
                file.name.match(/^(.+)-ch-(\d+)\.md$/i);

            return match && match[1] === slug;

        });


        const chapters = [];


        for (const file of chapterFiles) {

            const fileData = await getGitHubFile(
                `${CHAPTERS_DIR}/${file.name}`
            );

            if (!fileData) continue;


            const chapter = getChapterData(
                fileData.content,
                file.name
            );


            chapters.push({
                fileName: file.name,
                slug,
                ...chapter
            });

        }


        chapters.sort(
            (a, b) => a.chapter_number - b.chapter_number
        );


        listContainer.innerHTML = "";


        if (chapters.length === 0) {

            listContainer.textContent =
                "ဤ Novel တွင် Chapter များ မရှိသေးပါ။";

            return;

        }


        chapters.forEach(chapter => {

            const row = document.createElement("div");

            row.className = "admin-chapter-item";


            const info = document.createElement("div");

            info.className = "admin-chapter-info";


            const number = document.createElement("strong");

            number.textContent =
                `Chapter ${chapter.chapter_number}`;


            const chapterTitle = document.createElement("span");

            chapterTitle.textContent =
                chapter.title ? ` - ${chapter.title}` : "";


            info.appendChild(number);
            info.appendChild(chapterTitle);


            const actions = document.createElement("div");

            actions.className = "admin-action-btns";


            const editBtn = document.createElement("button");

            editBtn.type = "button";

            editBtn.className = "submit-btn btn-edit";

            editBtn.innerHTML =
                '<i class="fa-solid fa-pen"></i> ပြင်မည်';

            editBtn.addEventListener("click", () => {

                openEditChapterModal(
                    chapter.fileName,
                    slug
                );

            });


            const deleteBtn = document.createElement("button");

            deleteBtn.type = "button";

            deleteBtn.className = "submit-btn btn-delete";

            deleteBtn.innerHTML =
                '<i class="fa-solid fa-trash"></i> ဖျက်မည်';

            deleteBtn.addEventListener("click", () => {

                deleteChapter(
                    chapter.fileName,
                    slug
                );

            });


            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);


            row.appendChild(info);
            row.appendChild(actions);


            listContainer.appendChild(row);

        });


    } catch (error) {

        console.error("Chapter Manager Error:", error);

        listContainer.textContent =
            "Chapter စာရင်းရယူရာတွင် အမှားရှိပါသည်။";

    }

}


// ======================================================
// 22. CLOSE CHAPTER MANAGER
// ======================================================

function closeChaptersModal() {

    const modal =
        document.getElementById("manage-chapters-modal");

    if (modal) modal.style.display = "none";

}


// ======================================================
// 23. DELETE CHAPTER
// ======================================================

async function deleteChapter(fileName, slug) {

    if (!confirm(
        `Chapter ဖိုင် "${fileName}" ကို ဖျက်ရန် သေချာပါသလား?`
    )) {
        return;
    }


    try {

        await deleteFromGitHub(
            `${CHAPTERS_DIR}/${fileName}`,
            `Delete chapter ${fileName}`
        );


        await updateNovelsJsonFile();


        alert("Chapter အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!");


        await openChaptersManager(
            slug,
            currentChapterManagerTitle || slug
        );


        await loadManageNovelsList();


    } catch (error) {

        console.error("Delete Chapter Error:", error);

        alert(
            "Chapter ဖျက်ရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error)
        );

    }

}


// ======================================================
// 24. OPEN EDIT CHAPTER MODAL
// ======================================================

async function openEditChapterModal(fileName, slug) {

    try {

        const filePath =
            `${CHAPTERS_DIR}/${fileName}`;


        const existing = await getGitHubFile(filePath);

        if (!existing) {
            throw new Error("Chapter ဖိုင်ကို ရှာမတွေ့ပါ။");
        }


        const chapter = getChapterData(
            existing.content,
            fileName
        );


        document.getElementById("edit-chapter-filename").value =
            fileName;

        document.getElementById("edit-chapter-slug").value =
            slug;

        document.getElementById("edit-chapter-number").value =
            chapter.chapter_number;

        document.getElementById("edit-chapter-title").value =
            chapter.title;

        document.getElementById("edit-chapter-content").value =
            chapter.content;


        document.getElementById("edit-chapter-modal").style.display =
            "flex";


    } catch (error) {

        alert(
            "Chapter အချက်အလက်ရယူရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error)
        );

    }

}


// ======================================================
// 25. CLOSE EDIT CHAPTER MODAL
// ======================================================

function closeEditChapterModal() {

    const modal =
        document.getElementById("edit-chapter-modal");

    if (modal) modal.style.display = "none";

}


// ======================================================
// 26. UPDATE CHAPTER
// ======================================================

async function handleUpdateChapter(e) {

    if (e) e.preventDefault();

    if (isUpdatingChapter) return;


    const btn =
        document.getElementById("save-edit-chapter-btn");


    const fileName =
        document.getElementById("edit-chapter-filename").value;

    const slug =
        document.getElementById("edit-chapter-slug").value;

    const chNum = Number(
        document.getElementById("edit-chapter-number").value
    );

    const chTitle =
        document.getElementById("edit-chapter-title").value.trim();

    const chContent =
        document.getElementById("edit-chapter-content").value.trim();


    if (!validateChapterNumber(chNum)) {
        alert("Chapter နံပါတ် မှန်ကန်စွာ ထည့်ပါ။");
        return;
    }

    if (!chContent) {
        alert("Chapter Content ထည့်ပါ။");
        return;
    }


    const oldFilePath =
        `${CHAPTERS_DIR}/${fileName}`;

    const newFileName =
        `${slug}-ch-${chNum}.md`;

    const newFilePath =
        `${CHAPTERS_DIR}/${newFileName}`;


    isUpdatingChapter = true;

    if (btn) btn.disabled = true;


    try {

        const oldFile = await getGitHubFile(oldFilePath);

        if (!oldFile) {
            throw new Error("မူရင်း Chapter ဖိုင် မရှိတော့ပါ။");
        }


        // If filename changes, check destination first.
        if (fileName !== newFileName) {

            const destination =
                await getGitHubFile(newFilePath);

            if (destination) {

                throw new Error(
                    "ဤ Chapter နံပါတ်ဖြင့် ဖိုင်ရှိပြီးသားဖြစ်နေပါသည်။"
                );

            }

        }


        // Preserve created_at and all unknown frontmatter.
        const updatedMarkdown = updateMarkdownFrontmatter(
            oldFile.content,
            {
                novel_slug: slug,
                chapter_number: chNum,
                title: chTitle
            },
            chContent
        );


        if (fileName !== newFileName) {

            if (btn) {
                btn.textContent = "Chapter ဖိုင်အသစ် သိမ်းဆည်းနေသည်...";
            }


            // Save the new file FIRST.
            await uploadToGitHub(
                newFilePath,
                updatedMarkdown,
                `Update ${slug} Chapter ${chNum}`,
                { createOnly: true }
            );


            if (btn) {
                btn.textContent = "မူရင်း Chapter ဖိုင် ဖျက်နေသည်...";
            }


            // Delete old file only after successful new upload.
            try {

                await deleteFromGitHub(
                    oldFilePath,
                    `Remove old chapter file ${fileName}`
                );

            } catch (deleteError) {

                console.error(
                    "Old chapter cleanup failed:",
                    deleteError
                );

                alert(
                    "Chapter အသစ်ကို သိမ်းဆည်းပြီးပါပြီ။ " +
                    "သို့သော် မူရင်းဖိုင်ကို ဖျက်မရသေးပါ။ " +
                    "GitHub တွင် ဖိုင်နှစ်ခုကို စစ်ဆေးပါ။"
                );

                return;

            }

        } else {

            if (btn) {
                btn.textContent = "Chapter ပြင်ဆင်နေသည်...";
            }

            await uploadToGitHub(
                oldFilePath,
                updatedMarkdown,
                `Update ${slug} Chapter ${chNum}`
            );

        }


        if (btn) {
            btn.textContent = "novels.json အပ်ဒိတ်လုပ်နေသည်...";
        }


        await updateNovelsJsonFile();


        alert("Chapter အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ!");


        closeEditChapterModal();


        await openChaptersManager(
            slug,
            currentChapterManagerTitle || slug
        );


        await loadManageNovelsList();


    } catch (error) {

        console.error("Update Chapter Error:", error);

        alert(
            "Chapter ပြင်ဆင်ရာတွင် အမှားရှိပါသည်:\n" +
            getErrorMessage(error)
        );

    } finally {

        isUpdatingChapter = false;

        if (btn) {
            btn.disabled = false;
            btn.innerHTML =
                '<i class="fa-solid fa-floppy-disk"></i> ပြင်ဆင်မည်';
        }

    }

}


// ======================================================
// 27. MODAL EVENTS
// ======================================================

function setupModalEvents() {

    const modalIds = [
        "edit-novel-modal",
        "edit-chapter-modal",
        "manage-chapters-modal"
    ];


    modalIds.forEach(id => {

        const modal = document.getElementById(id);

        if (!modal) return;


        modal.addEventListener("click", event => {

            if (event.target !== modal) return;

            if (id === "edit-novel-modal") {
                closeEditModal();
            }

            if (id === "edit-chapter-modal") {
                closeEditChapterModal();
            }

            if (id === "manage-chapters-modal") {
                closeChaptersModal();
            }

        });

    });


    document.addEventListener("keydown", event => {

        if (event.key !== "Escape") return;

        const editNovel =
            document.getElementById("edit-novel-modal");

        const editChapter =
            document.getElementById("edit-chapter-modal");

        const manageChapters =
            document.getElementById("manage-chapters-modal");


        if (editChapter?.style.display === "flex") {
            closeEditChapterModal();
            return;
        }

        if (editNovel?.style.display === "flex") {
            closeEditModal();
            return;
        }

        if (manageChapters?.style.display === "flex") {
            closeChaptersModal();
        }

    });

}


// ======================================================
// END OF NOVELVERSE ADMIN.JS
// ======================================================
