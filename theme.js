/* ==========================================================
   NOVELVERSE MM — THEME SYSTEM
   Theme: DARK / LIGHT / LIGHT-DARK
   File: theme.js
========================================================== */

(() => {
    "use strict";

    // ======================================================
    // 01. CONFIGURATION
    // ======================================================

    const NV_THEME = {
        defaultTheme: "dark",
        storageKey: "novelverse_theme",
        themes: [
            {
                id: "dark",
                name: "Dark",
                description: "Dark cinematic appearance",
                icon: "fa-moon",
                colors: {
                    bg: "#12111A",
                    surface: "#1B1925",
                    surface2: "#242130",
                    accent: "#8B5CF6",
                    text: "#F0EDF8"
                }
            },
            {
                id: "light",
                name: "Light",
                description: "Clean light appearance",
                icon: "fa-sun",
                colors: {
                    bg: "#F5F5F7",
                    surface: "#FFFFFF",
                    surface2: "#F0F0F4",
                    accent: "#7650C9",
                    text: "#24232C"
                }
            },
            {
                id: "light-dark",
                name: "Light-Dark",
                description: "Light background with dark surfaces",
                icon: "fa-circle-half-stroke",
                colors: {
                    bg: "#F0EFF4",
                    surface: "#1C1A25",
                    surface2: "#262331",
                    accent: "#A78BFA",
                    text: "#F0EDF8"
                }
            }
        ]
    };

    const NV_THEME_MAP = Object.fromEntries(
        NV_THEME.themes.map(theme => [theme.id, theme])
    );

    // ======================================================
    // 02. THEME UI CSS
    // ======================================================

    function injectThemeUIStyles() {
        if (document.getElementById("nv-theme-ui-styles")) return;

        const style = document.createElement("style");
        style.id = "nv-theme-ui-styles";

        style.textContent = `
        /* THEME PANEL */

        .nv-theme-panel {
            width: 100%;
            padding: 20px;
            margin-top: 20px;
            background: var(--nv-surface);
            color: var(--nv-text);
            border: 1px solid var(--nv-border);
            border-radius: 18px;
        }

        .nv-theme-panel-header {
            margin-bottom: 18px;
        }

        .nv-theme-panel-title {
            font-size: 18px;
            font-weight: 700;
            color: var(--nv-text);
            margin: 0;
        }

        .nv-theme-panel-description {
            font-size: 13px;
            color: var(--nv-muted);
            line-height: 1.7;
            margin-top: 7px;
        }

        /* THEME GRID */

        .nv-theme-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
        }

        /* THEME CARD */

        .nv-theme-card {
            position: relative;
            padding: 12px;
            border: 2px solid var(--nv-border);
            border-radius: 15px;
            background: var(--nv-bg);
            color: var(--nv-text);
            cursor: pointer;
            text-align: left;
            min-width: 0;
            transition: 0.2s ease;
        }

        .nv-theme-card:hover {
            border-color: var(--nv-accent);
            transform: translateY(-2px);
        }

        .nv-theme-card.active {
            border-color: var(--nv-accent);
            box-shadow: 0 0 0 2px var(--nv-accent-soft);
        }

        /* PREVIEW */

        .nv-theme-preview {
            width: 100%;
            height: 100px;
            overflow: hidden;
            border-radius: 10px;
            margin-bottom: 12px;
            border: 1px solid rgba(128,128,128,0.15);
        }

        .nv-theme-preview-header {
            height: 25px;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 0 9px;
        }

        .nv-theme-preview-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
        }

        .nv-theme-preview-content {
            display: flex;
            height: 75px;
            padding: 9px;
            gap: 7px;
        }

        .nv-theme-preview-sidebar {
            width: 28%;
            border-radius: 5px;
        }

        .nv-theme-preview-main {
            flex: 1;
            border-radius: 5px;
            padding: 7px;
        }

        .nv-theme-preview-line {
            width: 85%;
            height: 4px;
            border-radius: 5px;
            margin-bottom: 6px;
        }

        .nv-theme-preview-line.short {
            width: 55%;
        }

        /* CARD INFO */

        .nv-theme-card-info {
            display: flex;
            align-items: center;
            gap: 9px;
        }

        .nv-theme-card-icon {
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            border-radius: 10px;
            background: var(--nv-surface-2);
            color: var(--nv-accent);
        }

        .nv-theme-card-text {
            flex: 1;
            min-width: 0;
        }

        .nv-theme-card-name {
            font-size: 13px;
            font-weight: 700;
            color: var(--nv-text);
        }

        .nv-theme-card-desc {
            font-size: 11px;
            line-height: 1.5;
            margin-top: 4px;
            color: var(--nv-muted);
        }

        .nv-theme-check {
            width: 22px;
            height: 22px;
            display: none;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: var(--nv-accent);
            color: #fff;
            flex-shrink: 0;
            font-size: 10px;
        }

        .nv-theme-card.active .nv-theme-check {
            display: flex;
        }

        /* STATUS */

        .nv-theme-status {
            font-size: 12px;
            color: var(--nv-muted);
            text-align: center;
            margin-top: 15px;
        }

        /* THEME BUTTON */

        .nv-theme-button {
            width: 40px;
            height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--nv-border);
            border-radius: 11px;
            background: var(--nv-surface);
            color: var(--nv-text);
            cursor: pointer;
            flex-shrink: 0;
            transition: 0.2s ease;
        }

        .nv-theme-button:hover {
            background: var(--nv-surface-2);
            color: var(--nv-accent);
            border-color: var(--nv-accent);
        }

        /* MODAL */

        .nv-theme-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 16px;
            background: rgba(0,0,0,0.68);
            backdrop-filter: blur(5px);
        }

        .nv-theme-overlay.show {
            display: flex;
        }

        .nv-theme-modal {
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            padding: 22px;
            border-radius: 20px;
            background: var(--nv-surface);
            color: var(--nv-text);
            border: 1px solid var(--nv-border);
            box-shadow: 0 25px 70px rgba(0,0,0,0.35);
            animation: nvThemeModalIn 0.2s ease;
        }

        @keyframes nvThemeModalIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .nv-theme-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            margin-bottom: 12px;
        }

        .nv-theme-modal-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--nv-text);
            margin: 0;
        }

        .nv-theme-close {
            width: 36px;
            height: 36px;
            border: 1px solid var(--nv-border);
            border-radius: 10px;
            background: var(--nv-surface-2);
            color: var(--nv-text);
            cursor: pointer;
        }

        .nv-theme-modal-description {
            font-size: 13px;
            line-height: 1.7;
            color: var(--nv-muted);
            margin-bottom: 16px;
        }

        /* LOGIN MODAL */

        .nv-theme-login-content {
            text-align: center;
            padding: 12px 0;
        }

        .nv-theme-login-icon {
            width: 62px;
            height: 62px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 15px;
            border-radius: 18px;
            background: var(--nv-surface-2);
            color: var(--nv-accent);
            font-size: 24px;
        }

        .nv-theme-login-title {
            font-size: 18px;
            font-weight: 800;
            color: var(--nv-text);
        }

        .nv-theme-login-description {
            font-size: 13px;
            line-height: 1.8;
            color: var(--nv-muted);
            margin: 10px 0 20px;
        }

        .nv-theme-login-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .nv-theme-login-link {
            min-height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 11px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
        }

        .nv-theme-login-link.primary {
            background: var(--nv-accent);
            color: #fff;
        }

        .nv-theme-login-link.secondary {
            background: var(--nv-surface-2);
            border: 1px solid var(--nv-border);
            color: var(--nv-text);
        }

        /* MOBILE */

        @media (max-width: 600px) {
            .nv-theme-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }

            .nv-theme-card {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px;
            }

            .nv-theme-preview {
                width: 110px;
                height: 75px;
                flex-shrink: 0;
                margin: 0;
            }

            .nv-theme-preview-content {
                height: 50px;
            }

            .nv-theme-card-info {
                flex: 1;
            }

            .nv-theme-modal {
                padding: 17px;
                border-radius: 17px;
            }

            .nv-theme-button {
                width: 38px;
                height: 38px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .nv-theme-card,
            .nv-theme-button,
            .nv-theme-modal {
                animation: none !important;
                transition: none !important;
            }
        }
        `;

        document.head.appendChild(style);
    }

     // ======================================================
    // 03. USER / LOGIN
    // ======================================================

    function getCurrentUser() {
        try {
            if (typeof window.getCurrentAuthUser === "function") {
                return window.getCurrentAuthUser();
            }
        } catch (error) {
            console.warn("Theme: Unable to get current user.", error);
        }

        return null;
    }

    function getUserId() {
        const user = getCurrentUser();

        if (!user) return null;

        return user.userId ||
               user.id ||
               user.email ||
               user.username ||
               null;
    }

    function isLoggedIn() {
        try {
            if (typeof window.isUserLoggedIn === "function") {
                return !!window.isUserLoggedIn();
            }
        } catch (error) {}

        return !!getUserId();
    }

    // ======================================================
    // 04. STORAGE
    // ======================================================

    function getStorageKey() {
        const userId = getUserId();

        return userId
            ? NV_THEME.storageKey + "_" + userId
            : null;
    }

    function getSavedTheme() {
        const key = getStorageKey();

        if (!key) {
            return NV_THEME.defaultTheme;
        }

        try {
            const saved = localStorage.getItem(key);

            return NV_THEME_MAP[saved]
                ? saved
                : NV_THEME.defaultTheme;

        } catch (error) {
            console.warn("Theme: Unable to read saved theme.", error);
            return NV_THEME.defaultTheme;
        }
    }

    function saveTheme(themeId) {
        if (!isLoggedIn()) return false;
        if (!NV_THEME_MAP[themeId]) return false;

        const key = getStorageKey();

        if (!key) return false;

        try {
            localStorage.setItem(key, themeId);
            return true;
        } catch (error) {
            console.warn("Theme: Unable to save theme.", error);
            return false;
        }
    }

    // ======================================================
    // 05. CURRENT THEME
    // ======================================================

    let currentTheme = NV_THEME.defaultTheme;
    let initialized = false;

    // ======================================================
    // 06. APPLY THEME
    // ======================================================

    function applyTheme(themeId, save = false) {
        if (!NV_THEME_MAP[themeId]) {
            themeId = NV_THEME.defaultTheme;
        }

        currentTheme = themeId;

        const root = document.documentElement;

        // Set theme for theme.css
        root.setAttribute("data-theme", themeId);

        // Set CSS variables directly from theme.css palette
        root.style.setProperty(
            "--nv-theme-current",
            themeId
        );

        // Update browser theme color
        const themeColor = document.querySelector(
            'meta[name="theme-color"]'
        );

        if (themeColor) {
            const theme = NV_THEME_MAP[themeId];

            themeColor.content = theme.colors.bg;
        }

        // Update theme cards
        updateThemeCards();

        // Optional save
        if (save && isLoggedIn()) {
            saveTheme(themeId);
        }

        // Dispatch theme change event for other scripts
        window.dispatchEvent(
            new CustomEvent("novelverseThemeChanged", {
                detail: {
                    theme: themeId
                }
            })
        );
    }

    // ======================================================
    // 07. SELECT THEME
    // ======================================================

    function selectTheme(themeId) {
        if (!NV_THEME_MAP[themeId]) return;

        // Guest users must login
        if (!isLoggedIn()) {
            openLoginModal();
            return;
        }

        applyTheme(themeId, true);

        document.querySelectorAll(".nv-theme-status").forEach(el => {
            el.textContent = "Theme saved successfully.";
        });

        closeThemeModal();
    }

    // ======================================================
    // 08. THEME PREVIEW
    // ======================================================

    function createThemePreview(theme) {
        const c = theme.colors;

        return `
            <div class="nv-theme-preview"
                 style="background:${c.bg}">

                <div class="nv-theme-preview-header"
                     style="background:${c.surface}">

                    <span class="nv-theme-preview-dot"
                          style="background:${c.accent}"></span>

                    <span class="nv-theme-preview-dot"
                          style="background:${c.text}"></span>

                    <span class="nv-theme-preview-dot"
                          style="background:${c.surface2}"></span>
                </div>

                <div class="nv-theme-preview-content">

                    <div class="nv-theme-preview-sidebar"
                         style="background:${c.accent}">
                    </div>

                    <div class="nv-theme-preview-main"
                         style="background:${c.surface}">

                        <div class="nv-theme-preview-line"
                             style="background:${c.text}">
                        </div>

                        <div class="nv-theme-preview-line short"
                             style="background:${c.accent}">
                        </div>

                        <div class="nv-theme-preview-line"
                             style="background:${c.surface2}">
                        </div>

                    </div>
                </div>
            </div>
        `;
    }

    // ======================================================
    // 09. THEME CARD
    // ======================================================

    function createThemeCard(theme) {
        const active = currentTheme === theme.id;

        return `
            <button type="button"
                    class="nv-theme-card ${active ? "active" : ""}"
                    data-nv-theme-choice="${theme.id}"
                    aria-pressed="${active}">

                ${createThemePreview(theme)}

                <div class="nv-theme-card-info">

                    <div class="nv-theme-card-icon">
                        <i class="fas ${theme.icon}"></i>
                    </div>

                    <div class="nv-theme-card-text">

                        <div class="nv-theme-card-name">
                            ${theme.name}
                        </div>

                        <div class="nv-theme-card-desc">
                            ${theme.description}
                        </div>

                    </div>

                    <div class="nv-theme-check">
                        <i class="fas fa-check"></i>
                    </div>

                </div>

            </button>
        `;
    }

    // ======================================================
    // 10. THEME GRID
    // ======================================================

    function createThemeGrid() {
        return `
            <div class="nv-theme-grid">
                ${NV_THEME.themes.map(createThemeCard).join("")}
            </div>
        `;
    }

    // ======================================================
    // 11. UPDATE THEME CARD STATES
    // ======================================================

    function updateThemeCards() {
        document.querySelectorAll("[data-nv-theme-choice]").forEach(card => {
            const active =
                card.dataset.nvThemeChoice === currentTheme;

            card.classList.toggle("active", active);

            card.setAttribute(
                "aria-pressed",
                String(active)
            );
        });
    }

     // ======================================================
    // 12. THEME MODAL
    // ======================================================

    function createThemeModal() {
        if (document.getElementById("nv-theme-overlay")) return;

        const overlay = document.createElement("div");

        overlay.id = "nv-theme-overlay";
        overlay.className = "nv-theme-overlay";

        overlay.innerHTML = `
            <div class="nv-theme-modal">

                <div class="nv-theme-modal-header">

                    <h2 class="nv-theme-modal-title">
                        <i class="fas fa-palette"></i>
                        Choose Your Theme
                    </h2>

                    <button type="button"
                            class="nv-theme-close"
                            aria-label="Close Theme">
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <p class="nv-theme-modal-description">
                    Select your preferred NovelVerse appearance.
                </p>

                <div id="nv-theme-modal-grid">
                    ${createThemeGrid()}
                </div>

                <div class="nv-theme-status">
                    Choose a theme to personalize your experience.
                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeThemeModal();
            }
        });

        overlay.querySelector(".nv-theme-close")
            .addEventListener("click", closeThemeModal);
    }

    function openThemeModal() {
        if (!isLoggedIn()) {
            openLoginModal();
            return;
        }

        createThemeModal();

        const overlay = document.getElementById("nv-theme-overlay");

        if (overlay) {
            overlay.classList.add("show");
        }

        updateThemeCards();
    }

    function closeThemeModal() {
        document.getElementById("nv-theme-overlay")
            ?.classList.remove("show");
    }

    // ======================================================
    // 13. LOGIN MODAL
    // ======================================================

    function createLoginModal() {
        if (document.getElementById("nv-theme-login-overlay")) return;

        const overlay = document.createElement("div");

        overlay.id = "nv-theme-login-overlay";
        overlay.className = "nv-theme-overlay";

        overlay.innerHTML = `
            <div class="nv-theme-modal">

                <div class="nv-theme-modal-header">

                    <h2 class="nv-theme-modal-title">
                        Login Required
                    </h2>

                    <button type="button"
                            class="nv-theme-close"
                            aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>

                </div>

                <div class="nv-theme-login-content">

                    <div class="nv-theme-login-icon">
                        <i class="fas fa-palette"></i>
                    </div>

                    <h3 class="nv-theme-login-title">
                        Personalize Your Reading
                    </h3>

                    <p class="nv-theme-login-description">
                        Login to your NovelVerse account to choose
                        and save your preferred theme.
                    </p>

                    <div class="nv-theme-login-actions">

                        <a href="profile.html?tab=login"
                           class="nv-theme-login-link primary">
                            <i class="fas fa-sign-in-alt"></i>
                            &nbsp; Login
                        </a>

                        <a href="profile.html?tab=register"
                           class="nv-theme-login-link secondary">
                            <i class="fas fa-user-plus"></i>
                            &nbsp; Create Account
                        </a>

                    </div>

                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeLoginModal();
            }
        });

        overlay.querySelector(".nv-theme-close")
            .addEventListener("click", closeLoginModal);
    }

    function openLoginModal() {
        createLoginModal();

        document.getElementById("nv-theme-login-overlay")
            ?.classList.add("show");
    }

    function closeLoginModal() {
        document.getElementById("nv-theme-login-overlay")
            ?.classList.remove("show");
    }

    // ======================================================
    // 14. PROFILE THEME PANEL
    // ======================================================

    function createProfileThemePanel() {
        if (document.getElementById("nv-profile-theme-panel")) return;

        const panel = document.createElement("section");

        panel.id = "nv-profile-theme-panel";
        panel.className = "nv-theme-panel";

        panel.innerHTML = `
            <div class="nv-theme-panel-header">

                <h3 class="nv-theme-panel-title">
                    <i class="fas fa-palette"></i>
                    Theme Settings
                </h3>

                <p class="nv-theme-panel-description">
                    Customize your NovelVerse appearance.
                    Choose Dark, Light or Light-Dark.
                </p>

            </div>

            <div id="nv-profile-theme-grid">
                ${createThemeGrid()}
            </div>

            <div class="nv-theme-status">
                Your theme preference is saved on this device.
            </div>
        `;

        const target =
            document.getElementById("profile-section") ||
            document.getElementById("profile-section-content") ||
            document.querySelector(".profile-container") ||
            document.querySelector(".profile-content");

        if (target) {
            target.appendChild(panel);
        }
    }

    // ======================================================
    // 15. READER THEME BUTTON
    // ======================================================

    function createReaderThemeButton() {
        if (document.getElementById("nv-reader-theme-button")) return;

        const button = document.createElement("button");

        button.id = "nv-reader-theme-button";
        button.type = "button";
        button.className = "nv-theme-button";
        button.title = "Change Theme";
        button.setAttribute("aria-label", "Change Theme");

        button.innerHTML = `
            <i class="fas fa-palette"></i>
        `;

        button.addEventListener("click", openThemeModal);

        const target =
            document.querySelector(".header-actions") ||
            document.querySelector(".top-header .header-actions");

        if (target) {
            target.appendChild(button);
        } else {
            const header = document.querySelector(".top-header");

            if (header) {
                header.appendChild(button);
            }
        }
    }

    // ======================================================
    // 16. PAGE DETECTION
    // ======================================================

    function isReaderPage() {
        return document.body.classList.contains("reader-page") ||
               document.getElementById("chapter-content") !== null;
    }

    function isProfilePage() {
        return location.pathname.toLowerCase().includes("profile.html") ||
               document.getElementById("profile-section") !== null ||
               document.getElementById("auth-section") !== null;
    }

    // ======================================================
    // 17. INITIALIZATION
    // ======================================================

    function init() {
        if (initialized) return;

        injectThemeUIStyles();

        // Guests always start with default Dark theme
        applyTheme(NV_THEME.defaultTheme);

        // Logged-in users restore their saved theme
        if (isLoggedIn()) {
            applyTheme(getSavedTheme());
        }

        // Reader
        if (isReaderPage()) {
            createReaderThemeButton();
            createThemeModal();
        }

        // Profile
        if (isProfilePage()) {
            createProfileThemePanel();
        }

        // Login popup
        createLoginModal();

        initialized = true;

        console.log("NovelVerse Theme System initialized.");
    }

    // ======================================================
    // 18. GLOBAL CLICK HANDLER
    // ======================================================

    document.addEventListener("click", event => {

        // Theme card
        const themeCard = event.target.closest(
            "[data-nv-theme-choice]"
        );

        if (themeCard) {
            event.preventDefault();

            selectTheme(
                themeCard.dataset.nvThemeChoice
            );

            return;
        }

    });

    // ======================================================
    // 19. LOGIN / LOGOUT SYNC
    // ======================================================

    function syncThemeAfterAuth() {
        if (isLoggedIn()) {
            applyTheme(getSavedTheme());
        } else {
            applyTheme(NV_THEME.defaultTheme);
        }
    }

    window.addEventListener(
        "novelverseAuthChanged",
        syncThemeAfterAuth
    );

    window.addEventListener("storage", event => {
        if (
            event.key === "novelverse_session" ||
            event.key?.startsWith(NV_THEME.storageKey)
        ) {
            syncThemeAfterAuth();
        }
    });

    // ======================================================
    // 20. ESCAPE TO CLOSE MODALS
    // ======================================================

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeThemeModal();
            closeLoginModal();
        }
    });

    // ======================================================
    // 21. PUBLIC API
    // ======================================================

    window.NovelVerseTheme = {
        init,
        applyTheme,
        selectTheme,
        openThemeModal,
        closeThemeModal,
        openLoginModal,
        closeLoginModal,
        getSavedTheme,
        getCurrentTheme: () => currentTheme,
        getCurrentUser,
        isLoggedIn,
        themes: NV_THEME.themes
    };

    // ======================================================
    // 22. AUTO INITIALIZATION
    // ======================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

})();
