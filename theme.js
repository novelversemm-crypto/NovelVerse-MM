
/* ==========================================================
   NOVELVERSE MM — COMPLETE THEME SYSTEM
   Version: 1.0
   Includes: Themes + UI + CSS + Popup + LocalStorage
========================================================== */

(() => {
    "use strict";

    // ======================================================
    // 1. CONFIGURATION
    // ======================================================

    const NV_THEME_CONFIG = {
        defaultTheme: "original-dark",

        storagePrefix: "novelverse_theme_",

        themes: [
            {
                id: "original-dark",
                name: "Obsidian Midnight",
                description: "Cinematic midnight with violet & gold",
                icon: "fa-moon",
                colors: ["#12111A", "#8B5CF6", "#D4AF77"]
            },
            {
                id: "lavender-dream",
                name: "Lavender Dream",
                description: "Dreamy lavender, lilac & soft pink",
                icon: "fa-cloud",
                colors: ["#24212B", "#C4A7FF", "#F0B6D5"]
            },
            {
                id: "emerald-forest",
                name: "Emerald Forest",
                description: "Deep forest green & champagne",
                icon: "fa-leaf",
                colors: ["#17231F", "#36B88A", "#D9C49A"]
            },
            {
                id: "midnight-ocean",
                name: "Midnight Ocean",
                description: "Navy, ocean blue & cyan",
                icon: "fa-water",
                colors: ["#172333", "#38BDF8", "#75A9FF"]
            },
            {
                id: "vintage-parchment",
                name: "Vintage Parchment",
                description: "Classic paper & coffee brown",
                icon: "fa-book-open",
                colors: ["#F2EEE5", "#9B7048", "#C5A982"]
            },
            {
                id: "silver-minimal",
                name: "Silver Minimal",
                description: "Minimal silver, gray & white",
                icon: "fa-gem",
                colors: ["#EAE8E2", "#64748B", "#A3A3A3"]
            },
            {
                id: "royal-burgundy",
                name: "Royal Burgundy",
                description: "Elegant burgundy & rose gold",
                icon: "fa-heart",
                colors: ["#24151D", "#C45B78", "#D8AD91"]
            },
            {
                id: "neon-cyberpunk",
                name: "Neon Cyberpunk",
                description: "Dark neon pink & electric cyan",
                icon: "fa-bolt",
                colors: ["#101018", "#FF3D9A", "#00E5FF"]
            }
        ]
    };


    // ======================================================
    // 2. THEME COLOR DEFINITIONS
    // ======================================================

    const NV_THEME_PALETTES = {
        "original-dark": {
            bg: "#12111A",
            surface: "#1B1925",
            surface2: "#242130",
            surface3: "#302B40",
            text: "#F0EDF8",
            muted: "#A7A0B6",
            accent: "#8B5CF6",
            accent2: "#A78BFA",
            border: "#302A40",
            card: "#1B1925",
            input: "#211E2C",
            header: "#15131D",
            success: "#4ADE80",
            danger: "#FB7185",
            shadow: "rgba(0,0,0,.30)"
        },

        "lavender-dream": {
            bg: "#24212B",
            surface: "#302B3B",
            surface2: "#393246",
            surface3: "#494057",
            text: "#F5EDFF",
            muted: "#BEB0D1",
            accent: "#C4A7FF",
            accent2: "#E0C6FF",
            border: "#4A4059",
            card: "#302B3B",
            input: "#393246",
            header: "#292431",
            success: "#86E3B0",
            danger: "#FF91B6",
            shadow: "rgba(0,0,0,.25)"
        },

        "emerald-forest": {
            bg: "#17231F",
            surface: "#202F29",
            surface2: "#2B3C34",
            surface3: "#3B5145",
            text: "#E8F4EC",
            muted: "#A7BDB0",
            accent: "#36B88A",
            accent2: "#63D5AC",
            border: "#354B3E",
            card: "#202F29",
            input: "#2B3C34",
            header: "#1A2721",
            success: "#7CE6A9",
            danger: "#F18C91",
            shadow: "rgba(0,0,0,.28)"
        },

        "midnight-ocean": {
            bg: "#172333",
            surface: "#202F42",
            surface2: "#2B3E55",
            surface3: "#354C66",
            text: "#E9F4FF",
            muted: "#A8BCD0",
            accent: "#38BDF8",
            accent2: "#76D5FF",
            border: "#344B64",
            card: "#202F42",
            input: "#2B3E55",
            header: "#192637",
            success: "#64D8A4",
            danger: "#FF879C",
            shadow: "rgba(0,0,0,.28)"
        },

        "vintage-parchment": {
            bg: "#F2EEE5",
            surface: "#E8E0D2",
            surface2: "#DED3C1",
            surface3: "#D3C3AD",
            text: "#3E3228",
            muted: "#80705D",
            accent: "#9B7048",
            accent2: "#B38A60",
            border: "#D2C3AE",
            card: "#E8E0D2",
            input: "#DED3C1",
            header: "#EDE6DA",
            success: "#527A57",
            danger: "#B94C51",
            shadow: "rgba(79,54,31,.10)"
        },

        "silver-minimal": {
            bg: "#EAE8E2",
            surface: "#F5F4F0",
            surface2: "#DDDBD5",
            surface3: "#D0CEC8",
            text: "#292D33",
            muted: "#747982",
            accent: "#64748B",
            accent2: "#8494AA",
            border: "#D2D1CC",
            card: "#F5F4F0",
            input: "#DDDBD5",
            header: "#EEECE7",
            success: "#41865F",
            danger: "#C35B67",
            shadow: "rgba(30,35,45,.09)"
        },

        "royal-burgundy": {
            bg: "#24151D",
            surface: "#33212B",
            surface2: "#422A36",
            surface3: "#533443",
            text: "#F6EAF0",
            muted: "#C0A7B4",
            accent: "#C45B78",
            accent2: "#DA819B",
            border: "#4C3441",
            card: "#33212B",
            input: "#422A36",
            header: "#291923",
            success: "#73D1A0",
            danger: "#FF8C9B",
            shadow: "rgba(0,0,0,.30)"
        },

        "neon-cyberpunk": {
            bg: "#101018",
            surface: "#1B1822",
            surface2: "#262130",
            surface3: "#342A40",
            text: "#F8F1FF",
            muted: "#B0A3BC",
            accent: "#FF3D9A",
            accent2: "#FF72BC",
            border: "#38283D",
            card: "#1B1822",
            input: "#262130",
            header: "#14121A",
            success: "#00E6A0",
            danger: "#FF526E",
            shadow: "rgba(0,0,0,.35)"
        }
    };


    // ======================================================
    // 3. CSS INJECTION
    // ======================================================

    function injectThemeStyles() {

        if (document.getElementById("nv-theme-system-styles")) return;

        const style = document.createElement("style");
        style.id = "nv-theme-system-styles";

        style.textContent = `
        /* ==============================================
           THEME VARIABLES
        ============================================== */

        html {
            --nv-bg: #12111A;
            --nv-surface: #1B1925;
            --nv-surface-2: #242130;
            --nv-surface-3: #302B40;
            --nv-text: #F0EDF8;
            --nv-muted: #A7A0B6;
            --nv-accent: #8B5CF6;
            --nv-accent-2: #A78BFA;
            --nv-border: #302A40;
            --nv-card: #1B1925;
            --nv-input: #211E2C;
            --nv-header: #15131D;
            --nv-success: #4ADE80;
            --nv-danger: #FB7185;
            --nv-shadow: rgba(0,0,0,.30);

            color-scheme: dark;
        }

        /* ==============================================
           APPLY GLOBAL THEME
        ============================================== */

        html[data-theme="original-dark"],
        html[data-theme="obsidian-midnight"] {
            color-scheme: dark;
        }

        html[data-theme="lavender-dream"],
        html[data-theme="emerald-forest"],
        html[data-theme="midnight-ocean"],
        html[data-theme="royal-burgundy"],
        html[data-theme="neon-cyberpunk"] {
            color-scheme: dark;
        }

        html[data-theme="vintage-parchment"],
        html[data-theme="silver-minimal"] {
            color-scheme: light;
        }

        html,
        body {
            background-color: var(--nv-bg);
            color: var(--nv-text);
            transition:
                background-color .25s ease,
                color .25s ease;
        }

        body {
            background: var(--nv-bg);
            color: var(--nv-text);
        }

        /* ==============================================
           GENERAL THEME SURFACES
        ============================================== */

        .top-header,
        header,
        .bottom-nav,
        .mobile-nav,
        .navbar {
            transition: background .25s ease, border-color .25s ease;
        }

        .top-header {
            background-color: var(--nv-header);
            border-color: var(--nv-border);
        }

        .card,
        .novel-card,
        .profile-card,
        .section-card,
        .modal-content,
        .dropdown-menu {
            transition: background .25s ease, border-color .25s ease;
        }

        input,
        textarea,
        select {
            transition: background .25s ease, color .25s ease;
        }

        /* ==============================================
           THEME SYSTEM UI
        ============================================== */

        .nv-theme-btn {
            width: 42px;
            height: 42px;
            border-radius: 13px;
            border: 1px solid var(--nv-border);
            background: var(--nv-surface);
            color: var(--nv-text);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: .2s ease;
            flex-shrink: 0;
        }

        .nv-theme-btn:hover {
            background: var(--nv-surface-2);
            border-color: var(--nv-accent);
            color: var(--nv-accent);
            transform: translateY(-1px);
        }

        .nv-theme-btn:active {
            transform: scale(.96);
        }

        .nv-theme-btn i {
            font-size: 16px;
        }

        /* ==============================================
           THEME PANEL
        ============================================== */

        .nv-theme-panel {
            width: 100%;
            margin-top: 22px;
            padding: 20px;
            border: 1px solid var(--nv-border);
            border-radius: 18px;
            background: var(--nv-surface);
            color: var(--nv-text);
            box-sizing: border-box;
        }

        .nv-theme-panel-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 18px;
        }

        .nv-theme-panel-title {
            font-size: 18px;
            font-weight: 700;
            margin: 0;
            color: var(--nv-text);
        }

        .nv-theme-panel-subtitle {
            font-size: 13px;
            color: var(--nv-muted);
            margin-top: 5px;
            line-height: 1.6;
        }

        .nv-theme-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        .nv-theme-card {
            position: relative;
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 13px;
            min-width: 0;
            border-radius: 15px;
            border: 1px solid var(--nv-border);
            background: var(--nv-bg);
            color: var(--nv-text);
            cursor: pointer;
            text-align: left;
            transition: .2s ease;
        }

        .nv-theme-card:hover {
            transform: translateY(-2px);
            border-color: var(--nv-accent);
        }

        .nv-theme-card.active {
            border: 2px solid var(--nv-accent);
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--nv-accent) 15%, transparent);
        }

        .nv-theme-preview {
            width: 100%;
            height: 80px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border: 1px solid rgba(127,127,127,.15);
        }

        .nv-theme-preview-top {
            height: 23px;
            padding: 7px 8px;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .nv-theme-preview-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
        }

        .nv-theme-preview-body {
            flex: 1;
            padding: 8px;
            display: flex;
            gap: 7px;
        }

        .nv-theme-preview-block {
            height: 100%;
            flex: 1;
            border-radius: 5px;
        }

        .nv-theme-preview-lines {
            display: flex;
            flex-direction: column;
            gap: 5px;
            flex: 1;
            justify-content: center;
        }

        .nv-theme-preview-line {
            height: 4px;
            border-radius: 5px;
            width: 90%;
        }

        .nv-theme-preview-line.short {
            width: 55%;
        }

        .nv-theme-card-info {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
        }

        .nv-theme-card-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            background: var(--nv-surface-2);
            color: var(--nv-accent);
        }

        .nv-theme-card-text {
            min-width: 0;
            flex: 1;
        }

        .nv-theme-card-name {
            font-size: 13px;
            font-weight: 700;
            line-height: 1.4;
            color: var(--nv-text);
        }

        .nv-theme-card-desc {
            font-size: 11px;
            color: var(--nv-muted);
            margin-top: 3px;
            line-height: 1.4;
        }

        .nv-theme-check {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--nv-accent);
            color: white;
            display: none;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-size: 10px;
        }

        .nv-theme-card.active .nv-theme-check {
            display: flex;
        }

        .nv-theme-status {
            margin-top: 14px;
            font-size: 12px;
            color: var(--nv-muted);
            text-align: center;
        }

        /* ==============================================
           THEME MODAL
        ============================================== */

        .nv-theme-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(0,0,0,.68);
            backdrop-filter: blur(7px);
            -webkit-backdrop-filter: blur(7px);
        }

        .nv-theme-modal-overlay.show {
            display: flex;
        }

        .nv-theme-modal {
            width: 100%;
            max-width: 480px;
            max-height: 85vh;
            overflow-y: auto;
            background: var(--nv-surface);
            color: var(--nv-text);
            border: 1px solid var(--nv-border);
            border-radius: 22px;
            padding: 22px;
            box-shadow: 0 25px 80px rgba(0,0,0,.4);
            animation: nvThemeModalIn .2s ease;
        }

        @keyframes nvThemeModalIn {
            from {
                opacity: 0;
                transform: translateY(12px) scale(.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .nv-theme-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 16px;
        }

        .nv-theme-modal-title {
            font-size: 19px;
            font-weight: 800;
            margin: 0;
            color: var(--nv-text);
        }

        .nv-theme-close {
            width: 36px;
            height: 36px;
            border-radius: 11px;
            border: 1px solid var(--nv-border);
            background: var(--nv-surface-2);
            color: var(--nv-text);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .nv-theme-modal-desc {
            font-size: 13px;
            line-height: 1.7;
            color: var(--nv-muted);
            margin: 0 0 16px;
        }

        .nv-theme-modal .nv-theme-grid {
            gap: 10px;
        }

        /* ==============================================
           LOGIN REQUIRED POPUP
        ============================================== */

        .nv-theme-login-box {
            text-align: center;
            padding: 10px 2px 4px;
        }

        .nv-theme-login-icon {
            width: 62px;
            height: 62px;
            margin: 0 auto 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 20px;
            background: color-mix(in srgb, var(--nv-accent) 15%, var(--nv-surface));
            color: var(--nv-accent);
            font-size: 24px;
        }

        .nv-theme-login-title {
            font-size: 19px;
            font-weight: 800;
            margin: 0 0 10px;
            color: var(--nv-text);
        }

        .nv-theme-login-description {
            font-size: 13px;
            line-height: 1.8;
            color: var(--nv-muted);
            margin: 0 0 20px;
        }

        .nv-theme-login-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .nv-theme-login-link {
            width: 100%;
            min-height: 45px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
            box-sizing: border-box;
            transition: .2s ease;
        }

        .nv-theme-login-link.primary {
            background: var(--nv-accent);
            color: #fff;
        }

        .nv-theme-login-link.primary:hover {
            opacity: .88;
        }

        .nv-theme-login-link.secondary {
            background: var(--nv-surface-2);
            border: 1px solid var(--nv-border);
            color: var(--nv-text);
        }

        .nv-theme-login-link.secondary:hover {
            border-color: var(--nv-accent);
        }

        /* ==============================================
           MOBILE RESPONSIVE
        ============================================== */

        @media (max-width: 480px) {

            .nv-theme-panel {
                padding: 15px;
                border-radius: 15px;
            }

            .nv-theme-grid {
                gap: 9px;
            }

            .nv-theme-card {
                padding: 9px;
                gap: 9px;
                border-radius: 12px;
            }

            .nv-theme-preview {
                height: 66px;
            }

            .nv-theme-card-name {
                font-size: 11px;
            }

            .nv-theme-card-desc {
                font-size: 10px;
            }

            .nv-theme-card-icon {
                width: 27px;
                height: 27px;
                border-radius: 8px;
                font-size: 11px;
            }

            .nv-theme-modal {
                padding: 17px;
                border-radius: 18px;
            }

            .nv-theme-btn {
                width: 38px;
                height: 38px;
                border-radius: 11px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .nv-theme-card,
            .nv-theme-btn,
            .nv-theme-modal {
                animation: none !important;
                transition: none !important;
            }
        }
        `;

        document.head.appendChild(style);
    }


    // ======================================================
    // 4. CURRENT USER
    // ======================================================

    function getThemeUser() {

        try {
            if (typeof window.getCurrentAuthUser === "function") {
                return window.getCurrentAuthUser();
            }
        } catch (error) {
            console.warn("Theme: Unable to read auth user", error);
        }

        return null;
    }


    function getThemeUserId() {

        const user = getThemeUser();

        if (!user) return null;

        return user.userId ||
               user.id ||
               user.email ||
               user.username ||
               null;
    }


    function isThemeLoggedIn() {

        if (typeof window.isUserLoggedIn === "function") {
            return window.isUserLoggedIn();
        }

        return !!getThemeUserId();
    }


    // ======================================================
    // 5. STORAGE
    // ======================================================

    function getThemeStorageKey() {

        const userId = getThemeUserId();

        if (!userId) return null;

        return NV_THEME_CONFIG.storagePrefix + String(userId);
    }


    function getSavedTheme() {

        const key = getThemeStorageKey();

        if (!key) return NV_THEME_CONFIG.defaultTheme;

        try {
            const saved = localStorage.getItem(key);

            if (saved && NV_THEME_PALETTES[saved]) {
                return saved;
            }
        } catch (error) {
            console.warn("Theme: Storage read error", error);
        }

        return NV_THEME_CONFIG.defaultTheme;
    }


    function saveTheme(themeId) {

        if (!isThemeLoggedIn()) return false;

        if (!NV_THEME_PALETTES[themeId]) return false;

        const key = getThemeStorageKey();

        if (!key) return false;

        try {
            localStorage.setItem(key, themeId);
            return true;
        } catch (error) {
            console.warn("Theme: Storage save error", error);
            return false;
        }
    }


    // ======================================================
    // 6. APPLY THEME
    // ======================================================

    function applyTheme(themeId, save = false) {

        if (!NV_THEME_PALETTES[themeId]) {
            themeId = NV_THEME_CONFIG.defaultTheme;
        }

        const palette = NV_THEME_PALETTES[themeId];

        const root = document.documentElement;

        root.dataset.theme = themeId;

        // Apply theme variables
        root.style.setProperty("--nv-bg", palette.bg);
        root.style.setProperty("--nv-surface", palette.surface);
        root.style.setProperty("--nv-surface-2", palette.surface2);
        root.style.setProperty("--nv-surface-3", palette.surface3);
        root.style.setProperty("--nv-text", palette.text);
        root.style.setProperty("--nv-muted", palette.muted);
        root.style.setProperty("--nv-accent", palette.accent);
        root.style.setProperty("--nv-accent-2", palette.accent2);
        root.style.setProperty("--nv-border", palette.border);
        root.style.setProperty("--nv-card", palette.card);
        root.style.setProperty("--nv-input", palette.input);
        root.style.setProperty("--nv-header", palette.header);
        root.style.setProperty("--nv-success", palette.success);
        root.style.setProperty("--nv-danger", palette.danger);
        root.style.setProperty("--nv-shadow", palette.shadow);

        // Update meta theme color
        const themeMeta = document.querySelector('meta[name="theme-color"]');

        if (themeMeta) {
            themeMeta.setAttribute("content", palette.bg);
        }

        if (save && isThemeLoggedIn()) {
            saveTheme(themeId);
        }

        updateThemeCards();
    }


    // ======================================================
    // 7. THEME PREVIEW HTML
    // ======================================================

    function createThemePreview(themeId) {

        const palette = NV_THEME_PALETTES[themeId];

        return `
            <div class="nv-theme-preview"
                 style="background:${palette.bg};">

                <div class="nv-theme-preview-top"
                     style="background:${palette.surface};">

                    <span class="nv-theme-preview-dot"
                          style="background:${palette.accent};"></span>

                    <span class="nv-theme-preview-dot"
                          style="background:${palette.accent2};"></span>

                    <span class="nv-theme-preview-dot"
                          style="background:${palette.muted};"></span>
                </div>

                <div class="nv-theme-preview-body">

                    <div class="nv-theme-preview-block"
                         style="background:${palette.accent};">
                    </div>

                    <div class="nv-theme-preview-lines">

                        <div class="nv-theme-preview-line"
                             style="background:${palette.text};">
                        </div>

                        <div class="nv-theme-preview-line short"
                             style="background:${palette.muted};">
                        </div>

                        <div class="nv-theme-preview-line"
                             style="background:${palette.surface3};">
                        </div>

                    </div>

                </div>
            </div>
        `;
    }


    // ======================================================
    // 8. THEME CARD
    // ======================================================

    function createThemeCard(theme, selectedTheme) {

        const isActive = theme.id === selectedTheme;

        return `
            <button
                type="button"
                class="nv-theme-card ${isActive ? "active" : ""}"
                data-nv-theme-choice="${theme.id}"
                aria-pressed="${isActive}"
            >

                ${createThemePreview(theme.id)}

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
    // 9. THEME GRID
    // ======================================================

    function createThemeGrid() {

        const selectedTheme = document.documentElement.dataset.theme ||
                            NV_THEME_CONFIG.defaultTheme;

        return `
            <div class="nv-theme-grid">

                ${NV_THEME_CONFIG.themes.map(theme =>
                    createThemeCard(theme, selectedTheme)
                ).join("")}

            </div>
        `;
    }


    // ======================================================
    // 10. UPDATE SELECTED CARDS
    // ======================================================

    function updateThemeCards() {

        const currentTheme = document.documentElement.dataset.theme;

        document.querySelectorAll("[data-nv-theme-choice]").forEach(card => {

            const isActive = card.dataset.nvThemeChoice === currentTheme;

            card.classList.toggle("active", isActive);

            card.setAttribute("aria-pressed", String(isActive));
        });
    }


    // ======================================================
    // 11. THEME SELECTION
    // ======================================================

    function selectTheme(themeId) {

        if (!NV_THEME_PALETTES[themeId]) return;

        if (!isThemeLoggedIn()) {
            openLoginModal();
            return;
        }

        applyTheme(themeId, true);

        // Update Theme UI
        document.querySelectorAll("[data-nv-theme-choice]").forEach(card => {

            const active = card.dataset.nvThemeChoice === themeId;

            card.classList.toggle("active", active);
            card.setAttribute("aria-pressed", String(active));
        });

        // Update status text
        document.querySelectorAll(".nv-theme-status").forEach(status => {
            status.textContent = "Theme saved on this device.";
        });

        // Close reader popup after selection
        closeThemeModal();
    }


    // ======================================================
    // 12. THEME MODAL
    // ======================================================

    function createThemeModal() {

        if (document.getElementById("nv-theme-modal-overlay")) return;

        const overlay = document.createElement("div");

        overlay.id = "nv-theme-modal-overlay";
        overlay.className = "nv-theme-modal-overlay";

        overlay.innerHTML = `
            <div class="nv-theme-modal">

                <div class="nv-theme-modal-header">

                    <h2 class="nv-theme-modal-title">
                        <i class="fas fa-palette"></i>
                        Choose Your Theme
                    </h2>

                    <button class="nv-theme-close"
                            type="button"
                            aria-label="Close theme panel">

                        <i class="fas fa-times"></i>

                    </button>

                </div>

                <p class="nv-theme-modal-desc">
                    Choose your favorite reading atmosphere.
                    Your theme will be saved to your account on this device.
                </p>

                <div id="nv-theme-modal-grid">
                    ${createThemeGrid()}
                </div>

                <div class="nv-theme-status">
                    Your theme is saved locally.
                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", event => {

            if (event.target === overlay) {
                closeThemeModal();
            }
        });

        overlay.querySelector(".nv-theme-close").addEventListener("click", closeThemeModal);
    }


    function openThemeModal() {

        if (!isThemeLoggedIn()) {
            openLoginModal();
            return;
        }

        createThemeModal();

        const overlay = document.getElementById("nv-theme-modal-overlay");

        if (overlay) {
            overlay.classList.add("show");
        }
    }


    function closeThemeModal() {

        const overlay = document.getElementById("nv-theme-modal-overlay");

        if (overlay) {
            overlay.classList.remove("show");
        }
    }


    // ======================================================
    // 13. LOGIN / REGISTER MODAL
    // ======================================================

    function createLoginModal() {

        if (document.getElementById("nv-theme-login-overlay")) return;

        const overlay = document.createElement("div");

        overlay.id = "nv-theme-login-overlay";
        overlay.className = "nv-theme-modal-overlay";

        overlay.innerHTML = `
            <div class="nv-theme-modal">

                <div class="nv-theme-modal-header">

                    <h2 class="nv-theme-modal-title">
                        Account Required
                    </h2>

                    <button class="nv-theme-close"
                            type="button"
                            aria-label="Close">

                        <i class="fas fa-times"></i>

                    </button>

                </div>

                <div class="nv-theme-login-box">

                    <div class="nv-theme-login-icon">
                        <i class="fas fa-palette"></i>
                    </div>

                    <h3 class="nv-theme-login-title">
                        Personalize Your Reading
                    </h3>

                    <p class="nv-theme-login-description">
                        Sign in to NovelVerse to unlock all 8 themes
                        and save your preferred reading appearance.
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

        overlay.querySelector(".nv-theme-close").addEventListener("click", closeLoginModal);
    }


    function openLoginModal() {

        createLoginModal();

        const overlay = document.getElementById("nv-theme-login-overlay");

        if (overlay) {
            overlay.classList.add("show");
        }
    }


    function closeLoginModal() {

        const overlay = document.getElementById("nv-theme-login-overlay");

        if (overlay) {
            overlay.classList.remove("show");
        }
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

                <div>

                    <h3 class="nv-theme-panel-title">
                        <i class="fas fa-palette"></i>
                        Theme Settings
                    </h3>

                    <p class="nv-theme-panel-subtitle">
                        Personalize your NovelVerse reading experience.
                    </p>

                </div>

            </div>

            <div id="nv-profile-theme-grid">
                ${createThemeGrid()}
            </div>

            <div class="nv-theme-status">
                Your theme is saved locally.
            </div>
        `;

        // Prefer profile section if available
        const profileSection =
            document.getElementById("profile-section") ||
            document.getElementById("profile-section-content") ||
            document.querySelector(".profile-container") ||
            document.querySelector(".profile-content");

        if (profileSection) {
            profileSection.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }
    }


    // ======================================================
    // 15. READER THEME BUTTON
    // ======================================================

    function createReaderThemeButton() {

        if (document.getElementById("nv-reader-theme-btn")) return;

        const button = document.createElement("button");

        button.type = "button";
        button.id = "nv-reader-theme-btn";
        button.className = "nv-theme-btn";
        button.title = "Change Theme";
        button.setAttribute("aria-label", "Change Theme");

        button.innerHTML = `
            <i class="fas fa-palette"></i>
        `;

        button.addEventListener("click", () => {
            openThemeModal();
        });

        const headerActions =
            document.querySelector(".header-actions") ||
            document.querySelector(".top-header .header-actions");

        if (headerActions) {
            headerActions.appendChild(button);
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

        return window.location.pathname.toLowerCase().includes("profile.html") ||
               document.getElementById("profile-section") !== null ||
               document.getElementById("auth-section") !== null;
    }


    // ======================================================
    // 17. INITIALIZE THEME
    // ======================================================

    let isThemeReady = false;

    function initializeThemeSystem() {

        if (isThemeReady) return;

        injectThemeStyles();

        // Apply default first to prevent theme flash
        applyTheme(NV_THEME_CONFIG.defaultTheme);

        if (isThemeLoggedIn()) {
            applyTheme(getSavedTheme());
        }

        // Reader page
        if (isReaderPage()) {
            createReaderThemeButton();
            createThemeModal();
        }

        // Profile page
        if (isProfilePage()) {
            createProfileThemePanel();
        }

        // Login modal
        createLoginModal();

        isThemeReady = true;

        console.log("NovelVerse Theme System initialized.");
    }


    // ======================================================
    // 18. THEME CLICK EVENTS
    // ======================================================

    document.addEventListener("click", event => {

        const themeCard = event.target.closest("[data-nv-theme-choice]");

        if (themeCard) {

            event.preventDefault();

            const themeId = themeCard.dataset.nvThemeChoice;

            selectTheme(themeId);
        }

    });


    // ======================================================
    // 19. AUTH CHANGE DETECTION
    // ======================================================

    window.addEventListener("storage", event => {

        if (event.key === "novelverse_session") {
            syncThemeAfterAuthChange();
        }

    });


    window.addEventListener("novelverseAuthChanged", () => {
        syncThemeAfterAuthChange();
    });


    function syncThemeAfterAuthChange() {

        if (isThemeLoggedIn()) {
            applyTheme(getSavedTheme());
        } else {
            applyTheme(NV_THEME_CONFIG.defaultTheme);
        }
    }


    // ======================================================
    // 20. EXPORT FUNCTIONS
    // ======================================================

    window.NovelVerseTheme = {
        init: initializeThemeSystem,
        applyTheme,
        selectTheme,
        openThemeModal,
        closeThemeModal,
        openLoginModal,
        closeLoginModal,
        getSavedTheme,
        getThemeUser,
        themes: NV_THEME_CONFIG.themes
    };


    // ======================================================
    // 21. DOM READY
    // ======================================================

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", initializeThemeSystem);

    } else {

        initializeThemeSystem();

    }

})();
