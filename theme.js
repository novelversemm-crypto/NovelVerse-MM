
/* =========================================================
   NOVELVERSE MM — THEME CONTROLLER
   File: theme.js
   Version: 1.0

   Guest:
   - Obsidian Midnight only
   - Theme selection requires login

   Logged-in User:
   - Select 8 themes
   - Save preference locally
   - Shared theme across pages
========================================================= */

(() => {

    'use strict';


    // =====================================================
    // 1. CONFIGURATION
    // =====================================================

    const THEME_CONFIG = {

        defaultTheme: 'original-dark',

        storagePrefix: 'novelverse_theme_',

        themes: [

            {
                id: 'original-dark',
                name: 'Obsidian Midnight',
                description: 'Cinematic luxury dark',
                color: '#8B5CF6',
                icon: 'fa-moon'
            },

            {
                id: 'lavender-dream',
                name: 'Lavender Dream',
                description: 'Soft dreamy lavender',
                color: '#C4A7FF',
                icon: 'fa-cloud'
            },

            {
                id: 'emerald-forest',
                name: 'Emerald Forest',
                description: 'Elegant natural green',
                color: '#36B88A',
                icon: 'fa-leaf'
            },

            {
                id: 'midnight-ocean',
                name: 'Midnight Ocean',
                description: 'Cool ocean blue',
                color: '#38BDF8',
                icon: 'fa-water'
            },

            {
                id: 'vintage-parchment',
                name: 'Vintage Parchment',
                description: 'Classic old-book style',
                color: '#9B7048',
                icon: 'fa-book'
            },

            {
                id: 'silver-minimal',
                name: 'Silver Minimal',
                description: 'Clean silver and gray',
                color: '#64748B',
                icon: 'fa-gem'
            },

            {
                id: 'royal-burgundy',
                name: 'Royal Burgundy',
                description: 'Romantic royal elegance',
                color: '#C45B78',
                icon: 'fa-heart'
            },

            {
                id: 'neon-cyberpunk',
                name: 'Neon Cyberpunk',
                description: 'Futuristic neon colors',
                color: '#FF3D9A',
                icon: 'fa-bolt'
            }

        ]

    };


    // =====================================================
    // 2. STATE
    // =====================================================

    let activeTheme = THEME_CONFIG.defaultTheme;

    let themeModal = null;

    let isThemeReady = false;


    // =====================================================
    // 3. AUTH HELPERS
    // =====================================================

    function isLoggedIn() {

        return (
            typeof window.isUserLoggedIn === 'function' &&
            window.isUserLoggedIn()
            );

    }


    function getCurrentUser() {

        if (
            typeof window.getCurrentAuthUser !== 'function'
            ) {
            return null;
            }

        return window.getCurrentAuthUser();

    }


    function getUserStorageKey() {

        const user = getCurrentUser();

        const session =
            typeof window.getAuthSession === 'function'
                ? window.getAuthSession()
                : null;

        const userId =
            user?.userId ||
            session?.userId ||
            user?.username ||
            session?.username;

        if (!userId) {
            return null;
        }

        return (
            THEME_CONFIG.storagePrefix +
            String(userId).toLowerCase()
        );

    }


    // =====================================================
    // 4. THEME VALIDATION
    // =====================================================

    function isValidTheme(themeId) {

        return THEME_CONFIG.themes.some(
            theme => theme.id === themeId
        );

    }


    function getThemeData(themeId) {

        return THEME_CONFIG.themes.find(
            theme => theme.id === themeId
        ) || THEME_CONFIG.themes[0];

    }


    // =====================================================
    // 5. APPLY THEME
    // =====================================================

    function applyTheme(themeId) {

        // Guest User ကို Default Theme သာ ခွင့်ပြုမည်။

        if (!isLoggedIn()) {

            themeId = THEME_CONFIG.defaultTheme;

        }


        // Theme မှားနေပါက Default ပြန်သတ်မှတ်မည်။

        if (!isValidTheme(themeId)) {

            themeId = THEME_CONFIG.defaultTheme;

        }


        activeTheme = themeId;


        // Website တစ်ခုလုံး Theme ပြောင်းမည်။

        document.documentElement.setAttribute(
            'data-theme',
            themeId
        );


        // Theme Color ပြောင်းမည်။

        const themeColorMeta = document.querySelector(
            'meta[name="theme-color"]'
        );

        if (themeColorMeta) {

            themeColorMeta.setAttribute(
                'content',
                getThemeData(themeId).color
            );

        }


        // Theme Selector UI Update

        updateThemeUI();


        return activeTheme;

    }


    // =====================================================
    // 6. GET CURRENT THEME
    // =====================================================

    function getCurrentTheme() {

        return activeTheme;

    }


    // =====================================================
    // 7. LOAD SAVED THEME
    // =====================================================

    function loadSavedTheme() {

        // Guest User

        if (!isLoggedIn()) {

            applyTheme(THEME_CONFIG.defaultTheme);

            return;

        }


        const storageKey = getUserStorageKey();


        // User ID မရှိသေးလျှင် Default သုံးမည်။

        if (!storageKey) {

            applyTheme(THEME_CONFIG.defaultTheme);

            return;

        }


        try {

            const savedTheme = localStorage.getItem(
                storageKey
            );

            if (savedTheme && isValidTheme(savedTheme)) {

                applyTheme(savedTheme);

            } else {

                applyTheme(THEME_CONFIG.defaultTheme);

            }

        } catch (error) {

            console.warn(
                'Theme Storage Read Error:',
                error
            );

            applyTheme(THEME_CONFIG.defaultTheme);

        }

    }


    // =====================================================
    // 8. SAVE THEME
    // =====================================================

    function saveTheme(themeId) {

        // Guest User Theme ပြောင်းခွင့်မရှိ။

        if (!isLoggedIn()) {

            applyTheme(THEME_CONFIG.defaultTheme);

            showLoginRequiredModal();

            return false;

        }


        if (!isValidTheme(themeId)) {

            return false;

        }


        const storageKey = getUserStorageKey();


        // User Key မရပါက Theme ကို မသိမ်းပါ။

        if (!storageKey) {

            applyTheme(THEME_CONFIG.defaultTheme);

            return false;

        }


        // Theme ကို ချက်ချင်းပြောင်းမည်။

        applyTheme(themeId);


        // Logged-in User အတွက်သာ သိမ်းမည်။

        try {

            localStorage.setItem(
                storageKey,
                themeId
            );

        } catch (error) {

            console.error(
                'Theme Storage Save Error:',
                error
            );

        }


        // Selector ပိတ်မည်။

        closeThemeModal();


        return true;

    }


    // =====================================================
    // 9. THEME BUTTON — READER
    // =====================================================

    function createReaderThemeButton() {

        const headerActions = document.querySelector(
            '.reader-page .header-actions'
        );

        if (!headerActions) return;


        // Button ရှိပြီးသားဆို ထပ်မထည့်ပါ။

        if (document.getElementById('reader-theme-btn')) {
            return;
        }


        const button = document.createElement('button');

        button.type = 'button';

        button.className = 'icon-btn reader-theme-btn';

        button.id = 'reader-theme-btn';

        button.setAttribute(
            'aria-label',
            'Change website theme'
        );

        button.setAttribute(
            'title',
            'Theme'
        );

        button.innerHTML = `
            <i class="fa-solid fa-palette"></i>
        `;


        // Wallet နှင့် Account ကြား ထည့်မည်။

        const accountButton = document.getElementById(
            'reader-account-link'
        );

        if (accountButton) {

            headerActions.insertBefore(
                button,
                accountButton
            );

        } else {

            headerActions.appendChild(button);

        }


        button.addEventListener('click', () => {

            if (!isLoggedIn()) {

                showLoginRequiredModal();

                return;

            }

            openThemeModal();

        });

    }


    // =====================================================
    // 10. PROFILE THEME SETTINGS
    // =====================================================

    function createProfileThemeSettings() {

        const profileSection = document.getElementById(
            'profile-section'
        );

        if (!profileSection) return;


        // Already created?

        if (document.getElementById('profile-theme-settings')) {
            return;
        }


        const section = document.createElement('section');

        section.className = 'profile-theme-settings';

        section.id = 'profile-theme-settings';


        section.innerHTML = `
            <div class="profile-theme-heading">

                <div class="profile-theme-icon">
                    <i class="fa-solid fa-palette"></i>
                </div>

                <div>
                    <h3>Appearance & Theme</h3>
                    <p>NovelVerse ရဲ့ Theme ကို စိတ်ကြိုက်ရွေးချယ်ပါ။</p>
                </div>

            </div>

            <button
                type="button"
                class="profile-theme-open-btn primary-btn"
                id="profile-theme-open-btn"
            >
                <i class="fa-solid fa-palette"></i>
                Change Theme
            </button>
        `;


        // Account Menu မတိုင်ခင် ထည့်မည်။

        const accountMenu = profileSection.querySelector(
            '.profile-menu-section'
        );

        if (accountMenu) {

            profileSection.insertBefore(
                section,
                accountMenu
            );

        } else {

            profileSection.appendChild(section);

        }


        const openButton = document.getElementById(
            'profile-theme-open-btn'
        );

        if (openButton) {

            openButton.addEventListener('click', () => {

                if (!isLoggedIn()) {

                    showLoginRequiredModal();

                    return;

                }

                openThemeModal();

            });

        }

    }


    // =====================================================
    // 11. THEME MODAL
    // =====================================================

    function createThemeModal() {

        if (themeModal) return themeModal;


        themeModal = document.createElement('div');

        themeModal.className = 'nv-theme-modal-overlay';

        themeModal.id = 'nv-theme-modal';

        themeModal.setAttribute(
            'role',
            'dialog'
        );

        themeModal.setAttribute(
            'aria-modal',
            'true'
        );

        themeModal.setAttribute(
            'aria-labelledby',
            'nv-theme-modal-title'
        );


        themeModal.innerHTML = `
            <div class="nv-theme-modal">

                <div class="nv-theme-modal-header">

                    <div>
                        <span class="nv-theme-eyebrow">
                            PERSONALIZE YOUR EXPERIENCE
                        </span>

                        <h2 id="nv-theme-modal-title">
                            Choose Your Theme
                        </h2>

                        <p>
                            NovelVerse ကို သင့်စိတ်ကြိုက် အရောင်အသွေးနဲ့ ဖတ်ရှုလိုက်ပါ။
                        </p>
                    </div>

                    <button
                        type="button"
                        class="nv-theme-close-btn"
                        id="nv-theme-close-btn"
                        aria-label="Close theme selector"
                    >
                        <i class="fa-solid fa-xmark"></i>
                    </button>

                </div>


                <div
                    class="nv-theme-grid"
                    id="nv-theme-grid"
                ></div>


                <div class="nv-theme-modal-footer">

                    <span class="nv-theme-save-note">
                        <i class="fa-solid fa-cloud"></i>
                        Theme ကို သင့် Account အတွက် သိမ်းဆည်းထားမည်။
                    </span>

                </div>

            </div>
        `;


        document.body.appendChild(themeModal);


        // Close Button

        const closeButton = document.getElementById(
            'nv-theme-close-btn'
        );

        closeButton?.addEventListener(
            'click',
            closeThemeModal
        );


        // Overlay click

        themeModal.addEventListener('click', event => {

            if (event.target === themeModal) {

                closeThemeModal();

            }

        });


        // ESC key

        document.addEventListener('keydown', event => {

            if (
                event.key === 'Escape' &&
                themeModal?.classList.contains('show')
            ) {

                closeThemeModal();

            }

        });


        renderThemeOptions();


        return themeModal;

    }


    // =====================================================
    // 12. RENDER THEME OPTIONS
    // =====================================================

    function renderThemeOptions() {

        const grid = document.getElementById(
            'nv-theme-grid'
        );

        if (!grid) return;


        grid.innerHTML = '';


        THEME_CONFIG.themes.forEach(theme => {

            const button = document.createElement('button');

            button.type = 'button';

            button.className = 'nv-theme-option';

            button.dataset.themeOption = theme.id;


            button.innerHTML = `
                <span
                    class="nv-theme-preview"
                    style="--theme-preview-color:${theme.color}"
                >
                    <span class="nv-preview-top"></span>
                    <span class="nv-preview-line"></span>
                    <span class="nv-preview-line short"></span>
                </span>

                <span class="nv-theme-option-info">

                    <strong>${theme.name}</strong>

                    <small>${theme.description}</small>

                </span>

                <span class="nv-theme-selected-icon">
                    <i class="fa-solid fa-check"></i>
                </span>
            `;


            button.addEventListener('click', () => {

                saveTheme(theme.id);

            });


            grid.appendChild(button);

        });


        updateThemeUI();

    }


    // =====================================================
    // 13. UPDATE THEME UI
    // =====================================================

    function updateThemeUI() {

        if (!isThemeReady) return;


        // Theme Option Active State

        document.querySelectorAll(
            '[data-theme-option]'
        ).forEach(button => {

            const selected =
                button.dataset.themeOption === activeTheme;

            button.classList.toggle(
                'selected',
                selected
            );

            button.setAttribute(
                'aria-pressed',
                selected ? 'true' : 'false'
            );

        });


        // Profile Theme Button

        const profileButton = document.getElementById(
            'profile-theme-open-btn'
        );

        if (profileButton) {

            const themeData = getThemeData(activeTheme);

            profileButton.innerHTML = `
                <i class="fa-solid fa-palette"></i>
                ${themeData.name}
            `;

        }

    }


    // =====================================================
    // 14. OPEN THEME MODAL
    // =====================================================

    function openThemeModal() {

        if (!isLoggedIn()) {

            showLoginRequiredModal();

            return;

        }


        createThemeModal();


        // Current Theme UI Update

        updateThemeUI();


        requestAnimationFrame(() => {

            themeModal.classList.add('show');

        });


        document.body.classList.add(
            'nv-theme-modal-open'
        );

    }


    // =====================================================
    // 15. CLOSE THEME MODAL
    // =====================================================

    function closeThemeModal() {

        if (!themeModal) return;


        themeModal.classList.remove('show');

        document.body.classList.remove(
            'nv-theme-modal-open'
        );

    }


    // =====================================================
    // 16. LOGIN / REGISTER REQUIRED MODAL
    // =====================================================

    function showLoginRequiredModal() {

        const existing = document.getElementById(
            'nv-login-required-modal'
        );

        if (existing) {
            existing.remove();
        }


        const modal = document.createElement('div');

        modal.className = 'nv-theme-modal-overlay show';

        modal.id = 'nv-login-required-modal';

        modal.setAttribute(
            'role',
            'dialog'
        );

        modal.setAttribute(
            'aria-modal',
            'true'
        );


        modal.innerHTML = `
            <div class="nv-theme-auth-modal">

                <div class="nv-theme-auth-icon">
                    <i class="fa-solid fa-palette"></i>
                </div>

                <h2>Theme ပြောင်းရန် Login ဝင်ပါ</h2>

                <p>
                    Theme အသစ်များ အသုံးပြုရန် NovelVerse Account ဝင်ထားဖို့ လိုအပ်ပါတယ်။
                </p>

                <div class="nv-theme-auth-actions">

                    <a
                        href="profile.html?auth=login"
                        class="nv-theme-auth-login"
                    >
                        <i class="fa-solid fa-right-to-bracket"></i>
                        Login ဝင်ရန်
                    </a>

                    <a
                        href="profile.html?auth=register"
                        class="nv-theme-auth-register"
                    >
                        <i class="fa-solid fa-user-plus"></i>
                        Register လုပ်ရန်
                    </a>

                </div>

                <button
                    type="button"
                    class="nv-theme-auth-cancel"
                    id="nv-theme-auth-cancel"
                >
                    နောက်မှလုပ်မည်
                </button>

            </div>
        `;


        document.body.appendChild(modal);


        // Cancel

        document.getElementById(
            'nv-theme-auth-cancel'
        )?.addEventListener('click', () => {

            modal.remove();

        });


        // Overlay click to close

        modal.addEventListener('click', event => {

            if (event.target === modal) {

                modal.remove();

            }

        });


        // Register tab ကို အလိုအလျောက် ဖွင့်ပေးမည်။

        modal.querySelectorAll(
            '[href="profile.html?auth=login"], [href="profile.html?auth=register"]'
        ).forEach(link => {

            link.addEventListener('click', () => {

                try {

                    sessionStorage.setItem(
                        'novelverse_auth_tab',
                        link.href.includes('register')
                            ? 'register'
                            : 'login'
                    );

                } catch (error) {

                    // Storage unavailable

                }

            });

        });

    }


    // =====================================================
    // 17. PROFILE PAGE AUTH TAB HANDOFF
    // =====================================================

    function handleAuthTabHandoff() {

        if (!document.getElementById('auth-section')) {
            return;
        }


        let requestedTab = null;


        try {

            requestedTab = sessionStorage.getItem(
                'novelverse_auth_tab'
            );

            sessionStorage.removeItem(
                'novelverse_auth_tab'
            );

        } catch (error) {

            requestedTab = null;

        }


        const urlParams = new URLSearchParams(
            window.location.search
        );

        const urlTab = urlParams.get('auth');


        if (urlTab === 'register' || urlTab === 'login') {

            requestedTab = urlTab;

        }


        if (
            requestedTab &&
            typeof window.switchAuthTab === 'function'
        ) {

            window.switchAuthTab(requestedTab);

        }

    }


    // =====================================================
    // 18. INITIALIZE
    // =====================================================

    function initializeThemeSystem() {

        if (isThemeReady) return;


        // Guest တွေကို အရင်ဆုံး Default Theme သတ်မှတ်မည်။

        applyTheme(THEME_CONFIG.defaultTheme);


        // User Theme Load

        loadSavedTheme();


        // Reader Button

        createReaderThemeButton();


        // Profile Theme Settings

        createProfileThemeSettings();


        // Theme Modal

        createThemeModal();


        // Auth Tab handoff

        handleAuthTabHandoff();


        isThemeReady = true;


        updateThemeUI();


        console.log(
            'NovelVerse Theme System initialized:',
            activeTheme
        );

    }


    // =====================================================
    // 19. PUBLIC API
    // =====================================================

    window.NovelVerseTheme = {

        apply: applyTheme,

        save: saveTheme,

        load: loadSavedTheme,

        get: getCurrentTheme,

        open: openThemeModal,

        close: closeThemeModal,

        isLoggedIn: isLoggedIn,

        themes: THEME_CONFIG.themes,

        defaultTheme: THEME_CONFIG.defaultTheme

    };


    // =====================================================
    // 20. START
    // =====================================================

    if (document.readyState === 'loading') {

        document.addEventListener(
            'DOMContentLoaded',
            initializeThemeSystem,
            { once: true }
        );

    } else {

        initializeThemeSystem();

    }


})();
