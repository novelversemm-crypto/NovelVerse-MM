/* ==========================================================
   NOVELVERSE MM — THEME SYSTEM
   Theme Modes: DARK / LIGHT / LIGHT-DARK
   File: theme.css
========================================================== */

/* ==========================================================
   01. DARK THEME (DEFAULT)
========================================================== */

:root,
html[data-theme="dark"],
html[data-theme-mode="dark"] {

    --nv-bg: #12111A;
    --nv-bg-secondary: #181621;

    --nv-surface: #1B1925;
    --nv-surface-2: #242130;
    --nv-surface-3: #302B40;

    --nv-card: #1B1925;
    --nv-card-hover: #242130;

    --nv-header: #15131D;
    --nv-navbar: #181621;

    --nv-text: #F0EDF8;
    --nv-text-primary: #F0EDF8;
    --nv-muted: #A7A0B6;
    --nv-text-secondary: #A7A0B6;

    --nv-accent: #8B5CF6;
    --nv-accent-hover: #A78BFA;
    --nv-accent-soft: rgba(139, 92, 246, 0.15);

    --nv-border: #302A40;
    --nv-border-light: #3A334B;

    --nv-input: #242130;
    --nv-input-bg: #242130;

    --nv-button-bg: #8B5CF6;
    --nv-button-text: #FFFFFF;

    --nv-success: #4ADE80;
    --nv-danger: #FB7185;
    --nv-warning: #FBBF24;

    --nv-overlay: rgba(0, 0, 0, 0.70);

    --nv-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.15);
    --nv-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.25);
    --nv-shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.35);

    --nv-scrollbar: #3A334B;
    --nv-scrollbar-hover: #8B5CF6;

    --nv-radius-sm: 8px;
    --nv-radius-md: 12px;
    --nv-radius-lg: 18px;
    --nv-radius-xl: 24px;

    --nv-transition: 0.25s ease;

    color-scheme: dark;
}


/* ==========================================================
   02. LIGHT THEME
========================================================== */

html[data-theme="light"] {

    --nv-bg: #F5F5F7;
    --nv-bg-secondary: #EEEEF2;

    --nv-surface: #FFFFFF;
    --nv-surface-2: #F0F0F4;
    --nv-surface-3: #E5E5EB;

    --nv-card: #FFFFFF;
    --nv-card-hover: #F8F8FA;

    --nv-header: #FFFFFF;
    --nv-navbar: #FFFFFF;

    --nv-text: #24232C;
    --nv-text-primary: #24232C;
    --nv-muted: #777583;
    --nv-text-secondary: #777583;

    --nv-accent: #7650C9;
    --nv-accent-hover: #8B68DC;
    --nv-accent-soft: rgba(118, 80, 201, 0.10);

    --nv-border: #E2E0E8;
    --nv-border-light: #D4D1DE;

    --nv-input: #F0F0F4;
    --nv-input-bg: #F0F0F4;

    --nv-button-bg: #7650C9;
    --nv-button-text: #FFFFFF;

    --nv-success: #21864B;
    --nv-danger: #D94159;
    --nv-warning: #C58A16;

    --nv-overlay: rgba(25, 20, 35, 0.55);

    --nv-shadow-sm: 0 2px 8px rgba(20, 20, 30, 0.05);
    --nv-shadow-md: 0 8px 24px rgba(20, 20, 30, 0.08);
    --nv-shadow-lg: 0 20px 60px rgba(20, 20, 30, 0.15);

    --nv-scrollbar: #D4D1DE;
    --nv-scrollbar-hover: #7650C9;

    color-scheme: light;
}


/* ==========================================================
   03. LIGHT-DARK THEME
   Light outer background + dark surfaces
========================================================== */

html[data-theme="light-dark"] {

    --nv-bg: #F0EFF4;
    --nv-bg-secondary: #E7E5EC;

    --nv-surface: #1C1A25;
    --nv-surface-2: #262331;
    --nv-surface-3: #322D40;

    --nv-card: #1C1A25;
    --nv-card-hover: #262331;

    --nv-header: #1C1A25;
    --nv-navbar: #1C1A25;

    --nv-text: #F0EDF8;
    --nv-text-primary: #F0EDF8;
    --nv-muted: #AAA3B8;
    --nv-text-secondary: #AAA3B8;

    --nv-accent: #A78BFA;
    --nv-accent-hover: #C4A7FF;
    --nv-accent-soft: rgba(167, 139, 250, 0.15);

    --nv-border: #373143;
    --nv-border-light: #494158;

    --nv-input: #262331;
    --nv-input-bg: #262331;

    --nv-button-bg: #8B5CF6;
    --nv-button-text: #FFFFFF;

    --nv-success: #4ADE80;
    --nv-danger: #FB7185;
    --nv-warning: #FBBF24;

    --nv-overlay: rgba(0, 0, 0, 0.70);

    --nv-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.10);
    --nv-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.15);
    --nv-shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.25);

    --nv-scrollbar: #494158;
    --nv-scrollbar-hover: #A78BFA;

    color-scheme: dark;
}


/* ==========================================================
   04. BASE HTML
========================================================== */

html {
    min-height: 100%;
    background: var(--nv-bg);
    color: var(--nv-text);
    scroll-behavior: smooth;

    transition:
        background-color var(--nv-transition),
        color var(--nv-transition);
}

body {
    min-height: 100vh;
    margin: 0;

    background: var(--nv-bg);
    color: var(--nv-text);

    transition:
        background-color var(--nv-transition),
        color var(--nv-transition);
}

* {
    box-sizing: border-box;
}

body,
button,
input,
textarea,
select {
    font-family: inherit;
}

button {
    color: var(--nv-text);
}

img {
    max-width: 100%;
}

a {
    color: var(--nv-accent);
    text-decoration: none;
    transition: color var(--nv-transition);
}

a:hover {
    color: var(--nv-accent-hover);
}

::selection {
    background: var(--nv-accent);
    color: #FFFFFF;
}


/* ==========================================================
   05. TEXT
========================================================== */

h1,
h2,
h3,
h4,
h5,
h6 {
    color: var(--nv-text);
}

p {
    color: var(--nv-text);
}

small,
.small-text,
.muted,
.text-muted {
    color: var(--nv-muted);
}

.text-primary {
    color: var(--nv-text-primary);
}

.text-accent {
    color: var(--nv-accent);
}

.text-success {
    color: var(--nv-success);
}

.text-danger {
    color: var(--nv-danger);
}

.text-warning {
    color: var(--nv-warning);
}


/* ==========================================================
   06. MAIN CONTAINERS
========================================================== */

main,
.main-content,
.page-content,
.content-wrapper {
    color: var(--nv-text);
}

.section,
.content-section {
    color: var(--nv-text);
}

.page-container {
    background: transparent;
}


/* ==========================================================
   07. HEADER
========================================================== */

header,
.top-header,
.site-header,
.header,
.navbar {
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.top-header,
.site-header {
    background: var(--nv-header);
}

.header-inner,
.header-content {
    color: var(--nv-text);
}

.header-title,
.logo-text {
    color: var(--nv-text);
}

.header-actions {
    color: var(--nv-text);
}


/* ==========================================================
   08. NAVIGATION
========================================================== */

nav,
.main-nav,
.bottom-nav,
.mobile-nav {
    color: var(--nv-text);
    border-color: var(--nv-border);
}

nav a,
.main-nav a,
.bottom-nav a,
.mobile-nav a {
    color: var(--nv-muted);
    transition: color var(--nv-transition);
}

nav a:hover,
.main-nav a:hover,
.bottom-nav a:hover,
.mobile-nav a:hover {
    color: var(--nv-accent);
}

.nav-link.active,
.nav-item.active,
.active-nav {
    color: var(--nv-accent);
}


/* ==========================================================
   09. CARDS / SURFACES
========================================================== */

.card,
.novel-card,
.book-card,
.profile-card,
.section-card,
.content-card,
.panel,
.surface {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);

    transition:
        background-color var(--nv-transition),
        border-color var(--nv-transition),
        color var(--nv-transition);
}

.card:hover,
.novel-card:hover,
.book-card:hover {
    background: var(--nv-card-hover);
}

.card-title,
.novel-title,
.book-title {
    color: var(--nv-text);
}

.card-description,
.novel-description,
.book-description {
    color: var(--nv-muted);
}


/* ==========================================================
   10. BUTTONS
========================================================== */

button,
.btn {
    transition:
        background-color var(--nv-transition),
        color var(--nv-transition),
        border-color var(--nv-transition);
}

.btn-primary,
.primary-btn,
button.primary {
    background: var(--nv-button-bg);
    color: var(--nv-button-text);
    border-color: var(--nv-button-bg);
}

.btn-primary:hover,
.primary-btn:hover,
button.primary:hover {
    background: var(--nv-accent-hover);
    border-color: var(--nv-accent-hover);
}

.btn-secondary,
.secondary-btn,
button.secondary {
    background: var(--nv-surface-2);
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.btn-secondary:hover,
.secondary-btn:hover,
button.secondary:hover {
    background: var(--nv-surface-3);
}

.btn-outline,
.outline-btn {
    background: transparent;
    color: var(--nv-accent);
    border: 1px solid var(--nv-accent);
}

.btn-outline:hover,
.outline-btn:hover {
    background: var(--nv-accent-soft);
}

button:disabled,
.btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}


/* ==========================================================
   11. INPUT / SEARCH / FORM
========================================================== */

input,
textarea,
select {
    background: var(--nv-input-bg);
    color: var(--nv-text);
    border-color: var(--nv-border);
    outline-color: var(--nv-accent);
    transition:
        background-color var(--nv-transition),
        color var(--nv-transition),
        border-color var(--nv-transition);
}

input:focus,
textarea:focus,
select:focus {
    border-color: var(--nv-accent);
    outline: none;
    box-shadow: 0 0 0 3px var(--nv-accent-soft);
}

input::placeholder,
textarea::placeholder {
    color: var(--nv-muted);
    opacity: 0.8;
}

.search-box,
.search-container,
.search-input {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
}


/* ==========================================================
   12. BADGES / TAGS
========================================================== */

.badge,
.tag,
.status-badge {
    background: var(--nv-surface-2);
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.badge-accent,
.tag-accent {
    background: var(--nv-accent-soft);
    color: var(--nv-accent);
}

.badge-success {
    background: rgba(74, 222, 128, 0.12);
    color: var(--nv-success);
}

.badge-danger {
    background: rgba(251, 113, 133, 0.12);
    color: var(--nv-danger);
}


/* ==========================================================
   13. DIVIDERS
========================================================== */

hr,
.divider,
.border-line {
    border-color: var(--nv-border);
}

/* ==========================================================
   14. MODALS / POPUPS
========================================================== */

.modal,
.modal-content,
.popup,
.popup-content,
.dialog {
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.modal-content,
.popup-content,
.dialog-content {
    background: var(--nv-surface);
}

.modal-overlay,
.popup-overlay,
.overlay {
    background: var(--nv-overlay);
}


/* ==========================================================
   15. DROPDOWN
========================================================== */

.dropdown,
.dropdown-menu,
.menu-dropdown {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
    box-shadow: var(--nv-shadow-md);
}

.dropdown-item,
.menu-item {
    color: var(--nv-text);
}

.dropdown-item:hover,
.menu-item:hover {
    background: var(--nv-surface-2);
}


/* ==========================================================
   16. PROFILE
========================================================== */

.profile-container,
.profile-content,
.profile-section {
    color: var(--nv-text);
}

.profile-card {
    background: var(--nv-surface);
    border: 1px solid var(--nv-border);
}

.profile-name,
.username,
.user-name {
    color: var(--nv-text);
}

.profile-info,
.user-info {
    color: var(--nv-muted);
}

.profile-tabs {
    border-color: var(--nv-border);
}

.profile-tab {
    color: var(--nv-muted);
}

.profile-tab.active {
    color: var(--nv-accent);
    border-color: var(--nv-accent);
}


/* ==========================================================
   17. READER PAGE
========================================================== */

.reader-page,
.reader-container,
.reader-wrapper {
    color: var(--nv-text);
}

.reader-header,
.reader-toolbar,
.reader-controls {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.reader-content,
.chapter-content,
#chapter-content {
    color: var(--nv-text);
}

.chapter-content p,
#chapter-content p {
    color: var(--nv-text);
}

.chapter-content h1,
.chapter-content h2,
.chapter-content h3,
#chapter-content h1,
#chapter-content h2,
#chapter-content h3 {
    color: var(--nv-text);
}

.chapter-content blockquote,
#chapter-content blockquote {
    background: var(--nv-surface-2);
    border-left-color: var(--nv-accent);
    color: var(--nv-muted);
}

.chapter-content a,
#chapter-content a {
    color: var(--nv-accent);
}


/* ==========================================================
   18. READER SETTINGS
========================================================== */

.reader-settings,
.reader-settings-panel,
.reading-settings {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.reader-setting-item {
    border-color: var(--nv-border);
}

.reader-setting-label {
    color: var(--nv-text);
}

.reader-setting-description {
    color: var(--nv-muted);
}


/* ==========================================================
   19. LOCKED CHAPTER / PREMIUM
========================================================== */

.locked-chapter,
.chapter-locked,
.premium-lock {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
}

.lock-icon {
    color: var(--nv-accent);
}

.locked-description {
    color: var(--nv-muted);
}


/* ==========================================================
   20. TOAST / NOTIFICATION
========================================================== */

.toast,
.notification,
.alert {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
    box-shadow: var(--nv-shadow-md);
}

.toast-success,
.alert-success {
    border-left: 4px solid var(--nv-success);
}

.toast-error,
.alert-error {
    border-left: 4px solid var(--nv-danger);
}

.toast-warning,
.alert-warning {
    border-left: 4px solid var(--nv-warning);
}


/* ==========================================================
   21. TABLE
========================================================== */

table {
    color: var(--nv-text);
}

thead,
th {
    background: var(--nv-surface-2);
    color: var(--nv-text);
}

td {
    color: var(--nv-text);
    border-color: var(--nv-border);
}

tr {
    border-color: var(--nv-border);
}

tbody tr:hover {
    background: var(--nv-surface-2);
}


/* ==========================================================
   22. ICONS
========================================================== */

.icon,
i,
svg {
    transition: color var(--nv-transition);
}

.accent-icon {
    color: var(--nv-accent);
}


/* ==========================================================
   23. SCROLLBAR
========================================================== */

* {
    scrollbar-width: thin;
    scrollbar-color: var(--nv-scrollbar) var(--nv-bg);
}

::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--nv-bg);
}

::-webkit-scrollbar-thumb {
    background: var(--nv-scrollbar);
    border-radius: 20px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--nv-scrollbar-hover);
}


/* ==========================================================
   24. SELECTION
========================================================== */

.nv-selected,
.selected,
.active-item {
    background: var(--nv-accent-soft);
    color: var(--nv-accent);
}


/* ==========================================================
   25. THEME TRANSITIONS
========================================================== */

body,
header,
.top-header,
.card,
.novel-card,
.profile-card,
.section-card,
.modal-content,
.reader-header,
.reader-settings,
button,
input,
textarea,
select {
    transition:
        background-color 0.2s ease,
        color 0.2s ease,
        border-color 0.2s ease;
}


/* ==========================================================
   26. LIGHT THEME EXTRA FIXES
========================================================== */

html[data-theme="light"] .card,
html[data-theme="light"] .novel-card,
html[data-theme="light"] .book-card,
html[data-theme="light"] .profile-card {
    box-shadow: var(--nv-shadow-sm);
}

html[data-theme="light"] .modal-content {
    box-shadow: var(--nv-shadow-lg);
}


/* ==========================================================
   27. LIGHT-DARK THEME EXTRA FIXES
========================================================== */

/* Outer page stays light */
html[data-theme="light-dark"] body {
    background: var(--nv-bg);
}

/* Main content surfaces stay dark */
html[data-theme="light-dark"] .card,
html[data-theme="light-dark"] .novel-card,
html[data-theme="light-dark"] .book-card,
html[data-theme="light-dark"] .profile-card,
html[data-theme="light-dark"] .section-card,
html[data-theme="light-dark"] .modal-content {
    background: var(--nv-surface);
    color: var(--nv-text);
    border-color: var(--nv-border);
}


/* ==========================================================
   28. MOBILE RESPONSIVE
========================================================== */

@media (max-width: 768px) {

    body {
        font-size: 14px;
    }

    .card,
    .novel-card,
    .book-card {
        border-radius: var(--nv-radius-md);
    }

    .modal-content,
    .popup-content {
        border-radius: var(--nv-radius-lg);
    }

}

@media (max-width: 480px) {

    :root {
        --nv-radius-lg: 15px;
        --nv-radius-xl: 20px;
    }

    .card,
    .novel-card,
    .book-card {
        border-radius: 12px;
    }

}


/* ==========================================================
   29. REDUCED MOTION
========================================================== */

@media (prefers-reduced-motion: reduce) {

    *,
    *::before,
    *::after {
        scroll-behavior: auto !important;
        transition: none !important;
        animation: none !important;
    }

}


/* ==========================================================
   30. END OF NOVELVERSE THEME CSS
========================================================== */
