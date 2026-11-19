
/* ==========================================================
   NOVELVERSE MM — COMPLETE THEME SYSTEM
   Version: 2.0
   Themes + CSS + UI + Popup + LocalStorage

   8 DISTINCT THEMES
   1. Obsidian Midnight
   2. Lavender Dream
   3. Emerald Forest
   4. Midnight Ocean
   5. Vintage Parchment
   6. Silver Minimal
   7. Royal Burgundy
   8. Neon Cyberpunk
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
                description: "Midnight black, violet & antique gold",
                icon: "fa-moon",
                colors: ["#100E18", "#9B6DFF", "#D6B56D"]
            },
            {
                id: "lavender-dream",
                name: "Lavender Dream",
                description: "Dreamy lavender, lilac & rose pink",
                icon: "fa-cloud",
                colors: ["#30243D", "#D1A9FF", "#FFB7D5"]
            },
            {
                id: "emerald-forest",
                name: "Emerald Forest",
                description: "Forest green, emerald & champagne",
                icon: "fa-leaf",
                colors: ["#10271C", "#29C78B", "#D8C28A"]
            },
            {
                id: "midnight-ocean",
                name: "Midnight Ocean",
                description: "Deep navy, sapphire & electric cyan",
                icon: "fa-water",
                colors: ["#0B192D", "#397BFF", "#27D9F2"]
            },
            {
                id: "vintage-parchment",
                name: "Vintage Parchment",
                description: "Warm ivory, antique paper & ink",
                icon: "fa-book-open",
                colors: ["#F5E9D2", "#94633D", "#C4A16C"]
            },
            {
                id: "silver-minimal",
                name: "Silver Minimal",
                description: "Clean white, cool silver & slate",
                icon: "fa-gem",
                colors: ["#F4F6F9", "#718096", "#B8C5D6"]
            },
            {
                id: "royal-burgundy",
                name: "Royal Burgundy",
                description: "Deep wine, crimson & rose gold",
                icon: "fa-heart",
                colors: ["#2B101C", "#D14D76", "#D9AF91"]
            },
            {
                id: "neon-cyberpunk",
                name: "Neon Cyberpunk",
                description: "Pitch black, hot pink & electric cyan",
                icon: "fa-bolt",
                colors: ["#090910", "#FF1493", "#00F5FF"]
            }
        ]
    };


    // ======================================================
    // 2. DISTINCT COLOR PALETTES
    // ======================================================

    const NV_THEME_PALETTES = {

        // --------------------------------------------------
        // 1. OBSIDIAN MIDNIGHT
        // Black / Violet / Gold
        // --------------------------------------------------

        "original-dark": {
            bg: "#100E18",
            surface: "#191522",
            surface2: "#241D32",
            surface3: "#332747",
            text: "#F5F0FF",
            muted: "#A99CBF",
            accent: "#9B6DFF",
            accent2: "#C0A1FF",
            border: "#342746,
            card: "#191522",
            input: "#211A2D",
            header: "#13101B",
            success: "#58D6A0",
            danger: "#FF708A",
            shadow: "rgba(0,0,0,.42)"
        },

        // --------------------------------------------------
        // 2. LAVENDER DREAM
        // Purple / Lilac / Pink
        // --------------------------------------------------

        "lavender-dream": {
            bg: "#30243D",
            surface: "#3B2D4D",
            surface2: "#49365D",
            surface3: "#594575",
            text: "#FFF1FF",
            muted: "#D0B9DE",
            accent: "#D1A9FF",
            accent2: "#FFB7D5",
            border: "#59446E",
            card: "#3B2D4D",
            input: "#49365D",
            header: "#342741",
            success: "#7FE2B2",
            danger: "#FF8CB9",
            shadow: "rgba(12,4,22,.30)"
        },

        // --------------------------------------------------
        // 3. EMERALD FOREST
        // Deep green / Emerald / Champagne
        // --------------------------------------------------

        "emerald-forest": {
            bg: "#10271C",
            surface: "#193629",
            surface2: "#224632",
            surface3: "#2C5940",
            text: "#E9F8EE",
            muted: "#A0C4AD",
            accent: "#29C78B",
            accent2: "#D8C28A",
            border: "#315C43",
            card: "#193629",
            input: "#224632",
            header: "#142F21",
            success: "#7CE8AC",
            danger: "#EF8490",
            shadow: "rgba(0,8,3,.38)"
        },

        // --------------------------------------------------
        // 4. MIDNIGHT OCEAN
        // Navy / Sapphire / Electric Cyan
        // --------------------------------------------------

        "midnight-ocean": {
            bg: "#0B192D",
            surface: "#122640",
            surface2: "#19365A",
            surface3: "#214774",
            text: "#EAF5FF",
            muted: "#9FB9D8",
            accent: "#397BFF",
            accent2: "#27D9F2",
            border: "#28517B",
            card: "#122640",
            input: "#19365A",
            header: "#0E2038",
            success: "#53DBAC",
            danger: "#FF799D",
            shadow: "rgba(0,5,20,.40)"
        },

        // --------------------------------------------------
        // 5. VINTAGE PARCHMENT
        // Ivory / Paper / Coffee Brown
        // --------------------------------------------------

        "vintage-parchment": {
            bg: "#F5E9D2",
            surface: "#EDE0C5",
            surface2: "#E2D0AE",
            surface3: "#D4BD95",
            text: "#3D2B1D",
            muted: "#80664A",
            accent: "#94633D",
            accent2: "#C4A16C",
            border: "#CDB58E",
            card: "#EDE0C5",
            input: "#E2D0AE",
            header: "#F0E3CA",
            success: "#557A48",
            danger: "#B84D45",
            shadow: "rgba(67,40,15,.12)"
        },

        // --------------------------------------------------
        // 6. SILVER MINIMAL
        // White / Silver / Slate Gray
        // --------------------------------------------------

        "silver-minimal": {
            bg: "#F4F6F9",
            surface: "#FFFFFF",
            surface2: "#E8ECF2",
            surface3: "#D6DEE8",
            text: "#263241",
            muted: "#748296",
            accent: "#718096",
            accent2: "#B8C5D6",
            border: "#D5DDE7",
            card: "#FFFFFF",
            input: "#E8ECF2",
            header: "#F9FAFC",
            success: "#36865C",
            danger: "#D25268",
            shadow: "rgba(39,55,75,.09)"
        },

        // --------------------------------------------------
        // 7. ROYAL BURGUNDY
        // Wine / Crimson / Rose Gold
        // --------------------------------------------------

        "royal-burgundy": {
            bg: "#2B101C",
            surface: "#391725",
            surface2: "#4A1D31",
            surface3: "#632640",
            text: "#FCEEF3",
            muted: "#C5A0B0",
            accent: "#D14D76",
            accent2: "#D9AF91",
            border: "#63344B",
            card: "#391725",
            input: "#4A1D31",
            header: "#321421",
            success: "#6ED3A0",
            danger: "#FF7D8F",
            shadow: "rgba(12,0,6,.42)"
        },

        // --------------------------------------------------
        // 8. NEON CYBERPUNK
        // Pitch Black / Hot Pink / Electric Cyan
        // --------------------------------------------------

        "neon-cyberpunk": {
            bg: "#090910",
            surface: "#13121D",
            surface2: "#21182B",
            surface3: "#30203F,
            text: "#F9F4FF",
            muted: "#A99BBE",
            accent: "#FF1493",
            accent2: "#00F5FF",
            border: "#4A2054",
            card: "#13121D",
            input: "#21182B",
            header: "#0D0C15",
            success: "#00F5A0",
            danger: "#FF426D",
            shadow: "rgba(0,0,0,.48)"
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

        /* ==========================================
           THEME VARIABLES
        ========================================== */

        html {
            --nv-bg: #100E18;
            --nv-surface: #191522;
            --nv-surface-2: #241D32;
            --nv-surface-3: #332747;
            --nv-text: #F5F0FF;
            --nv-muted: #A99CBF;
            --nv-accent: #9B6DFF;
            --nv-accent-2: #C0A1FF;
            --nv-border: #342746;
            --nv-card: #191522;
            --nv-input: #211A2D;
            --nv-header: #13101B;
            --nv-success: #58D6A0;
            --nv-danger: #FF708A;
            --nv-shadow: rgba(0,0,0,.42);

            color-scheme: dark;
        }

        /* ==========================================
           LIGHT THEMES
        ========================================== */

        html[data-theme="vintage-parchment"],
        html[data-theme="silver-minimal"] {
            color-scheme: light;
        }

        /* ==========================================
           GLOBAL COLORS
        ========================================== */

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

        /* ==========================================
           COMMON HEADER
        ========================================== */

        .top-header {
            background: var(--nv-header);
            border-color: var(--nv-border);
            transition: background .25s ease;
        }

        /* ==========================================
           THEME BUTTON
        ========================================== */

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

        /* ==========================================
           THEME PANEL
        ========================================== */

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

        /* ==========================================
           THEME GRID
        ========================================== */

        .nv-theme-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
        }

        /* ==========================================
           THEME CARD
        ========================================== */

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
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--nv-accent) 18%, transparent);
        }

        .nv-theme-card:focus-visible,
        .nv-theme-btn:focus-visible,
        .nv-theme-close:focus-visible {
            outline: 2px solid var(--nv-accent);
            outline-offset: 3px;
        }

        /* ==========================================
           THEME PREVIEW
        ========================================== */

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

        /* ==========================================
           THEME CARD INFORMATION
        ========================================== */

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
            color: #FFFFFF;
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

        /* ==========================================
           MODAL OVERLAY
        ========================================== */

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

        /* ==========================================
           MODAL
        ========================================== */

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
            box-shadow: 0 25px 80px var(--nv-shadow);
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

        /* ==========================================
           LOGIN REQUIRED POPUP
        ========================================== */

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
            color: #FFFFFF;
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

        /* ==========================================
           MOBILE RESPONSIVE
        ========================================== */

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

        /* ==========================================
           REDUCED MOTION
        ========================================== */

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
    // 4. AUTHENTICATION
    // ======================================================

    function getThemeUser() {
        try {
            if (typeof window.getCurrentAuthUser === "function") {
                return window.getCurrentAuthUser();
            }
        } catch (error) {
            console.warn("Theme: Unable to read current user.", error);
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
        try {
            if (typeof window.isUserLoggedIn === "function") {
                return window.isUserLoggedIn();
            }
        } catch (error) {
            console.warn("Theme: Auth check failed.", error);
        }

        return !!getThemeUserId();
    }


    // ======================================================
    // 5. LOCAL STORAGE
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
            const savedTheme = localStorage.getItem(key);

            if (savedTheme && NV_THEME_PALETTES[savedTheme]) {
                return savedTheme;
            }
        } catch (error) {
            console.warn("Theme: Storage read error.", error);
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
            console.warn("Theme: Storage save error.", error);
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

        const meta = document.querySelector('meta[name="theme-color"]');

        if (meta) {
            meta.setAttribute("content", palette.bg);
        }

        if (save && isThemeLoggedIn()) {
            saveTheme(themeId);
        }

        updateThemeCards();
    }


    // ======================================================
    // 7. PREVIEW
    // ======================================================

    function createThemePreview(themeId) {
        const p = NV_THEME_PALETTES[themeId];

        return `
            <div class="nv-theme-preview" style="background:${p.bg}">
                <div class="nv-theme-preview-top" style="background:${p.surface}">
                    <span class="nv-theme-preview-dot" style="background:${p.accent}"></span>
                    <span class="nv-theme-preview-dot" style="background:${p.accent2}"></span>
                    <span class="nv-theme-preview-dot" style="background:${p.muted}"></span>
                </div>

                <div class="nv-theme-preview-body">
                    <div class="nv-theme-preview-block" style="background:${p.accent}"></div>

                    <div class="nv-theme-preview-lines">
                        <div class="nv-theme-preview-line" style="background:${p.text}"></div>
                        <div class="nv-theme-preview-line short" style="background:${p.muted}"></div>
                        <div class="nv-theme-preview-line" style="background:${p.surface3}"></div>
                    </div>
                </div>
            </div>
        `;
    }


    // ======================================================
    // 8. THEME CARDS
    // ======================================================

    function createThemeCard(theme, selectedTheme) {
        const active = theme.id === selectedTheme;

        return `
            <button
                type="button"
                class="nv-theme-card ${active ? "active" : ""}"
                data-nv-theme-choice="${theme.id}"
                aria-pressed="${active}">

                ${createThemePreview(theme.id)}

                <div class="nv-theme-card-info">

                    <div class="nv-theme-card-icon">
                        <i class="fas ${theme.icon}"></i>
                    </div>

                    <div class="nv-theme-card-text">
                        <div class="nv-theme-card-name">${theme.name}</div>
                        <div class="nv-theme-card-desc">${theme.description}</div>
                    </div>

                    <div class="nv-theme-check">
                        <i class="fas fa-check"></i>
                    </div>

                </div>
            </button>
        `;
    }


    function createThemeGrid() {
        const selected = document.documentElement.dataset.theme ||
                        NV_THEME_CONFIG.defaultTheme;

        return `
            <div class="nv-theme-grid">
                ${NV_THEME_CONFIG.themes.map(theme =>
                    createThemeCard(theme, selected)
                ).join("")}
            </div>
        `;
    }


    function updateThemeCards() {
        const current = document.documentElement.dataset.theme;

        document.querySelectorAll("[data-nv-theme-choice]").forEach(card => {
            const active = card.dataset.nvThemeChoice === current;

            card.classList.toggle("active", active);
            card.setAttribute("aria-pressed", String(active));
        });
    }


    // ======================================================
    // 9. SELECT THEME
    // ======================================================

    function selectTheme(themeId) {
        if (!NV_THEME_PALETTES[themeId]) return;

        if (!isThemeLoggedIn()) {
            openLoginModal();
            return;
        }

        applyTheme(themeId, true);

        document.querySelectorAll(".nv-theme-status").forEach(status => {
            status.textContent = "Theme saved on this device.";
        });

        closeThemeModal();
    }


    // ======================================================
    // 10. THEME MODAL
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

                    <button class="nv-theme-close" type="button" aria-label="Close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <p class="nv-theme-modal-desc">
                    Choose your favorite reading atmosphere.
                    Your selected theme will be saved on this device.
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
            if (event.target === overlay) closeThemeModal();
        });

        overlay.querySelector(".nv-theme-close")
            .addEventListener("click", closeThemeModal);
    }


    function openThemeModal() {
        if (!isThemeLoggedIn()) {
            openLoginModal();
            return;
        }

        createThemeModal();

        const overlay = document.getElementById("nv-theme-modal-overlay");

        if (overlay) overlay.classList.add("show");
    }


    function closeThemeModal() {
        const overlay = document.getElementById("nv-theme-modal-overlay");

        if (overlay) overlay.classList.remove("show");
    }


    // ======================================================
    // 11. LOGIN / REGISTER POPUP
    // ======================================================

    function createLoginModal() {
        if (document.getElementById("nv-theme-login-overlay")) return;

        const overlay = document.createElement("div");

        overlay.id = "nv-theme-login-overlay";
        overlay.className = "nv-theme-modal-overlay";

        overlay.innerHTML = `
            <div class="nv-theme-modal">

                <div class="nv-theme-modal-header">
                    <h2 class="nv-theme-modal-title">Account Required</h2>

                    <button class="nv-theme-close" type="button" aria-label="Close">
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
                            <i class="fas fa-sign-in-alt"></i>&nbsp; Login
                        </a>

                        <a href="profile.html?tab=register"
                           class="nv-theme-login-link secondary">
                            <i class="fas fa-user-plus"></i>&nbsp; Create Account
                        </a>
                    </div>

                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener("click", event => {
            if (event.target === overlay) closeLoginModal();
        });

        overlay.querySelector(".nv-theme-close")
            .addEventListener("click", closeLoginModal);
    }


    function openLoginModal() {
        createLoginModal();

        const overlay = document.getElementById("nv-theme-login-overlay");

        if (overlay) overlay.classList.add("show");
    }


    function closeLoginModal() {
        const overlay = document.getElementById("nv-theme-login-overlay");

        if (overlay) overlay.classList.remove("show");
    }


    // ======================================================
    // 12. PROFILE THEME PANEL
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

        const target =
            document.getElementById("profile-section") ||
            document.getElementById("profile-section-content") ||
            document.querySelector(".profile-container") ||
            document.querySelector(".profile-content");

        if (target) {
            target.appendChild(panel);
        } else {
            document.body.appendChild(panel);
        }
    }


    // ======================================================
    // 13. READER THEME BUTTON
    // ======================================================

    function createReaderThemeButton() {
        if (document.getElementById("nv-reader-theme-btn")) return;

        const button = document.createElement("button");

        button.type = "button";
        button.id = "nv-reader-theme-btn";
        button.className = "nv-theme-btn";
        button.title = "Change Theme";
        button.setAttribute("aria-label", "Change Theme");

        button.innerHTML = `<i class="fas fa-palette"></i>`;

        button.addEventListener("click", openThemeModal);

        const actions = document.querySelector(".header-actions");

        if (actions) {
            actions.appendChild(button);
        } else {
            const header = document.querySelector(".top-header");

            if (header) header.appendChild(button);
        }
    }


    // ======================================================
    // 14. PAGE DETECTION
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
    // 15. INITIALIZATION
    // ======================================================

    let isThemeReady = false;

    function initializeThemeSystem() {
        if (isThemeReady) return;

        injectThemeStyles();

        applyTheme(NV_THEME_CONFIG.defaultTheme);

        if (isThemeLoggedIn()) {
            applyTheme(getSavedTheme());
        }

        if (isReaderPage()) {
            createReaderThemeButton();
            createThemeModal();
        }

        if (isProfilePage()) {
            createProfileThemePanel();
        }

        createLoginModal();

        isThemeReady = true;

        console.log("NovelVerse Theme System v2.0 initialized.");
    }


    // ======================================================
    // 16. THEME CLICK HANDLER
    // ======================================================

    document.addEventListener("click", event => {
        const card = event.target.closest("[data-nv-theme-choice]");

        if (!card) return;

        event.preventDefault();

        selectTheme(card.dataset.nvThemeChoice);
    });


    // ======================================================
    // 17. AUTH CHANGE HANDLING
    // ======================================================

    window.addEventListener("storage", event => {
        if (event.key === "novelverse_session") {
            syncThemeAfterAuthChange();
        }
    });

    window.addEventListener("novelverseAuthChanged", syncThemeAfterAuthChange);


    function syncThemeAfterAuthChange() {
        if (isThemeLoggedIn()) {
            applyTheme(getSavedTheme());
        } else {
            applyTheme(NV_THEME_CONFIG.defaultTheme);
        }
    }


    // ======================================================
    // 18. PUBLIC API
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
    // 19. DOM READY
    // ======================================================

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeThemeSystem);
    } else {
        initializeThemeSystem();
    }

})();
