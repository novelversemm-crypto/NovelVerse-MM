
/* ==========================================
   NOVELVERSE MM — AUTHENTICATION SYSTEM
   Register / Login / Logout / User Session
========================================== */


/* ==========================================
   1. CONFIGURATION
========================================== */

// Google Apps Script Web App URL

const AUTH_API_URL = 'https://script.google.com/macros/s/AKfycbznSFyzuaP9JZDOSe2RC3yIfVlUemLeAq15Oi3ibgn_cbN0FhLQhdorOw-i18CcNrfFZg/exec';

const AUTH_CONFIG = {
    sessionKey: 'novelverse_session',

    minimumPinLength: 6,
    maximumPinLength: 12,

    loginPage: 'profile.html',
    homePage: 'index.html'
};


/* ==========================================
   2. AUTHENTICATION STATE
========================================== */

let currentAuthUser = null;
let isAuthLoading = false;


/* ==========================================
   3. API REQUEST
========================================== */

async function authApiRequest(action, data = {}) {

    if (!AUTH_API_URL) {
        throw new Error(
            'Authentication API မချိတ်ဆက်ရသေးပါ။'
        );
    }

    let response;

    try {

        response = await fetch(AUTH_API_URL, {
            method: 'POST',

            headers: {
                'Content-Type': 'text/plain;charset=utf-8'
            },

            body: JSON.stringify({
                action,
                ...data
            })
        });

    } catch (error) {

        const networkError = new Error(
            'Server သို့ ချိတ်ဆက်၍ မရပါ။ Internet Connection ကို စစ်ဆေးပါ။'
        );

        networkError.code = 'NETWORK_ERROR';

        throw networkError;
    }

    if (!response.ok) {

        const serverError = new Error(
            `Server Error: ${response.status}`
        );

        serverError.code = 'HTTP_ERROR';
        serverError.status = response.status;

        throw serverError;
    }

    let result;

    try {

        result = await response.json();

    } catch (error) {

        throw new Error(
            'Server မှ မှန်ကန်သော Response မရရှိပါ။'
        );
    }

    if (!result || result.success !== true) {

        const apiError = new Error(
            result?.message || 'လုပ်ဆောင်မှု မအောင်မြင်ပါ။'
        );

        apiError.code = result?.code || 'API_ERROR';

        throw apiError;
    }

    return result;
}


/* ==========================================
   4. SESSION MANAGEMENT
========================================== */

function getAuthSession() {

    try {

        const savedSession = localStorage.getItem(
            AUTH_CONFIG.sessionKey
        );

        if (!savedSession) {
            return null;
        }

        const session = JSON.parse(savedSession);

        if (
            !session ||
            typeof session !== 'object' ||
            !session.token
        ) {
            return null;
        }

        return session;

    } catch (error) {

        console.error('Session Read Error:', error);

        return null;
    }
}


function saveAuthSession(sessionData) {

    if (!sessionData || !sessionData.token) {

        throw new Error(
            'Server မှ Session Token မရရှိပါ။'
        );
    }

    const session = {
        token: sessionData.token,

        userId: sessionData.userId || '',

        username: sessionData.username || '',

        createdAt: sessionData.createdAt || '',

        expiresAt: sessionData.expiresAt || ''
    };

    try {

        localStorage.setItem(
            AUTH_CONFIG.sessionKey,
            JSON.stringify(session)
        );

    } catch (error) {

        throw new Error(
            'Session ကို သိမ်းဆည်း၍ မရပါ။ Browser Storage ကို စစ်ဆေးပါ။'
        );
    }

    currentAuthUser = session;

    return session;
}


function clearAuthSession() {

    try {

        localStorage.removeItem(
            AUTH_CONFIG.sessionKey
        );

    } catch (error) {

        console.error('Session Clear Error:', error);
    }

    currentAuthUser = null;
}


function isUserLoggedIn() {

    const session = getAuthSession();

    return Boolean(
        session && session.token
    );
}


/* ==========================================
   5. AUTH UI HELPERS
========================================== */

function showAuthError(elementId, message) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;

    element.style.display = 'block';
}


function showAuthMessage(elementId, message) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;

    element.style.display = 'block';
}


function hideAuthMessage(elementId) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = '';

    element.style.display = 'none';
}


function setAuthButtonLoading(buttonId, loading) {

    const button = document.getElementById(buttonId);

    if (!button) return;

    if (loading) {

        if (!button.dataset.originalHTML) {

            button.dataset.originalHTML = button.innerHTML;
        }

        button.disabled = true;

        button.innerHTML = 'ခဏစောင့်ပါ...';

    } else {

        button.disabled = false;

        if (button.dataset.originalHTML) {

            button.innerHTML = button.dataset.originalHTML;

            delete button.dataset.originalHTML;
        }
    }
}


/* ==========================================
   6. AUTH / PROFILE SECTION
========================================== */

function showAuthSection() {

    const authSection = document.getElementById(
        'auth-section'
    );

    const profileSection = document.getElementById(
        'profile-section'
    );

    if (authSection) {

        authSection.hidden = false;

        authSection.style.display = '';
    }

    if (profileSection) {

        profileSection.hidden = true;

        profileSection.style.display = '';
    }
}


function showProfileSection() {

    const authSection = document.getElementById(
        'auth-section'
    );

    const profileSection = document.getElementById(
        'profile-section'
    );

    if (authSection) {

        authSection.hidden = true;

        authSection.style.display = '';
    }

    if (profileSection) {

        profileSection.hidden = false;

        profileSection.style.display = '';
    }
}


/* ==========================================
   7. AUTH TAB SWITCHING
========================================== */

function switchAuthTab(tabName) {

    const loginPanel = document.getElementById(
        'login-panel'
    );

    const registerPanel = document.getElementById(
        'register-panel'
    );

    const loginTab = document.getElementById(
        'login-tab-btn'
    );

    const registerTab = document.getElementById(
        'register-tab-btn'
    );

    hideAuthMessage('login-error');

    hideAuthMessage('register-error');

    if (tabName !== 'register') {

        hideAuthMessage('register-success');
    }

    if (tabName === 'register') {

        if (loginPanel) {
            loginPanel.hidden = true;
        }

        if (registerPanel) {
            registerPanel.hidden = false;
        }

        if (loginTab) {
            loginTab.classList.remove('active');
        }

        if (registerTab) {
            registerTab.classList.add('active');
        }

    } else {

        if (loginPanel) {
            loginPanel.hidden = false;
        }

        if (registerPanel) {
            registerPanel.hidden = true;
        }

        if (loginTab) {
            loginTab.classList.add('active');
        }

        if (registerTab) {
            registerTab.classList.remove('active');
        }
    }
}


/* ==========================================
   8. PASSWORD / PIN VISIBILITY
========================================== */

function setupPasswordToggles() {

    const toggleButtons = document.querySelectorAll(
        '[data-password-toggle]'
    );

    toggleButtons.forEach(button => {

        if (button.dataset.authToggleReady === 'true') {
            return;
        }

        button.dataset.authToggleReady = 'true';

        button.addEventListener('click', () => {

            const targetId = button.dataset.passwordToggle;

            const input = document.getElementById(targetId);

            if (!input) return;

            const icon = button.querySelector('i');

            if (input.type === 'password') {

                input.type = 'text';

                button.setAttribute(
                    'aria-label',
                    'Hide PIN'
                );

                if (icon) {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }

            } else {

                input.type = 'password';

                button.setAttribute(
                    'aria-label',
                    'Show PIN'
                );

                if (icon) {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            }
        });
    });
}


/* ==========================================
   9. USER REGISTRATION
========================================== */

async function handleUserRegister(event) {

    event.preventDefault();

    if (isAuthLoading) return;

    hideAuthMessage('register-error');

    hideAuthMessage('register-success');

    const usernameInput = document.getElementById(
        'register-username'
    );

    const pinInput = document.getElementById(
        'register-pin'
    );

    const confirmPinInput = document.getElementById(
        'register-confirm-pin'
    );

    if (!usernameInput || !pinInput || !confirmPinInput) {
        return;
    }

    const username = usernameInput.value.trim();

    const pin = pinInput.value;

    const confirmPin = confirmPinInput.value;


    if (
        username.length < 3 ||
        username.length > 30
    ) {

        showAuthError(
            'register-error',
            'Username သည် အနည်းဆုံး ၃ လုံးနှင့် အများဆုံး ၃၀ လုံး ရှိရပါမည်။'
        );

        return;
    }


    if (!/^[a-zA-Z0-9_]+$/.test(username)) {

        showAuthError(
            'register-error',
            'Username တွင် English စာလုံး၊ နံပါတ်နှင့် _ သင်္ကေတသာ အသုံးပြုနိုင်ပါသည်။'
        );

        return;
    }


    if (!/^\d{6,12}$/.test(pin)) {

        showAuthError(
            'register-error',
            'PIN ကို ဂဏန်းသီးသန့် ၆ လုံးမှ ၁၂ လုံးအထိ ထည့်ပေးပါ။'
        );

        return;
    }


    if (pin !== confirmPin) {

        showAuthError(
            'register-error',
            'PIN နှစ်ခု မတူညီပါ။ ပြန်စစ်ဆေးပါ။'
        );

        return;
    }


    isAuthLoading = true;

    setAuthButtonLoading(
        'register-submit-btn',
        true
    );


    try {

        const result = await authApiRequest(
            'register',
            {
                username,
                pin
            }
        );


        const loginUsername = document.getElementById(
            'login-username'
        );

        if (loginUsername) {

            loginUsername.value = username;
        }


        document.getElementById(
            'register-form'
        )?.reset();


        document.querySelectorAll(
            '[data-password-toggle]'
        ).forEach(button => {

            const input = document.getElementById(
                button.dataset.passwordToggle
            );

            const icon = button.querySelector('i');

            if (input) {
                input.type = 'password';
            }

            if (icon) {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });


        showAuthMessage(
            'register-success',
            result.message ||
            'Account ဖွင့်ခြင်း အောင်မြင်ပါသည်။ Login ဝင်နိုင်ပါပြီ။'
        );


    } catch (error) {

        showAuthError(
            'register-error',
            error.message || 'Account ဖွင့်ခြင်း မအောင်မြင်ပါ။'
        );

        console.error('Registration Error:', error);

    } finally {

        isAuthLoading = false;

        setAuthButtonLoading(
            'register-submit-btn',
            false
        );
    }
}


/* ==========================================
   10. USER LOGIN
========================================== */

async function handleUserLogin(event) {

    event.preventDefault();

    if (isAuthLoading) return;

    hideAuthMessage('login-error');

    const usernameInput = document.getElementById(
        'login-username'
    );

    const pinInput = document.getElementById(
        'login-pin'
    );

    if (!usernameInput || !pinInput) {
        return;
    }

    const username = usernameInput.value.trim();

    const pin = pinInput.value;


    if (!username || !pin) {

        showAuthError(
            'login-error',
            'Username နှင့် PIN ဖြည့်သွင်းပေးပါ။'
        );

        return;
    }


    if (!/^\d{6,12}$/.test(pin)) {

        showAuthError(
            'login-error',
            'PIN ကို ဂဏန်း ၆ လုံးမှ ၁၂ လုံးအထိ ထည့်ပေးပါ။'
        );

        return;
    }


    isAuthLoading = true;

    setAuthButtonLoading(
        'login-submit-btn',
        true
    );


    try {

        const result = await authApiRequest(
            'login',
            {
                username,
                pin
            }
        );


        const sessionData = result.session || {

            token: result.token,

            userId: result.userId,

            username: result.username,

            createdAt: result.createdAt,

            expiresAt: result.expiresAt
        };


        saveAuthSession(sessionData);


        document.getElementById(
            'login-form'
        )?.reset();


        await loadCurrentUserProfile();


    } catch (error) {

        showAuthError(
            'login-error',
            error.message || 'Login ဝင်ခြင်း မအောင်မြင်ပါ။'
        );

        console.error('Login Error:', error);

    } finally {

        isAuthLoading = false;

        setAuthButtonLoading(
            'login-submit-btn',
            false
        );
    }
}


/* ==========================================
   11. LOAD CURRENT USER PROFILE
========================================== */

async function loadCurrentUserProfile() {

    const session = getAuthSession();

    if (!session || !session.token) {

        clearAuthSession();

        showAuthSection();

        return;
    }


    try {

        const result = await authApiRequest(
            'getProfile',
            {
                token: session.token
            }
        );


        const user = result.user || result.profile;

        if (!user) {

            throw new Error(
                'User Profile ကို ရယူ၍ မရပါ။'
            );
        }


        currentAuthUser = {
            ...session,
            ...user
        };


        updateProfileUI(user);

        showProfileSection();


        if (
            typeof window.loadCoinBalance === 'function'
        ) {

            await window.loadCoinBalance();
        }


        if (
            typeof window.loadTransactionHistory === 'function'
        ) {

            await window.loadTransactionHistory();
        }


    } catch (error) {

        console.error(
            'Profile Loading Error:',
            error
        );


        const invalidSessionCodes = [
            'INVALID_TOKEN',
            'TOKEN_EXPIRED',
            'SESSION_EXPIRED',
            'UNAUTHORIZED'
        ];

        if (
            invalidSessionCodes.includes(error.code)
        ) {

            clearAuthSession();

            showAuthSection();

            showAuthError(
                'login-error',
                'Session သက်တမ်းကုန်သွားပါပြီ။ Login ပြန်ဝင်ပေးပါ။'
            );

            return;
        }


        showAuthSection();

        showAuthError(
            'login-error',
            error.message ||
            'Profile ကို ရယူ၍ မရပါ။ ခဏအကြာတွင် ပြန်လည်ကြိုးစားပါ။'
        );
    }
}


/* ==========================================
   12. UPDATE PROFILE UI
========================================== */

function updateProfileUI(user) {

    const usernameElement = document.getElementById(
        'profile-username'
    );

    const createdDateElement = document.getElementById(
        'profile-created-date'
    );

    const accountStatusElement = document.getElementById(
        'profile-account-status'
    );


    if (usernameElement) {

        usernameElement.textContent =
            user.username ||
            currentAuthUser?.username ||
            'User';
    }


    if (createdDateElement) {

        const createdAt =
            user.createdAt ||
            currentAuthUser?.createdAt;

        if (createdAt) {

            const date = new Date(createdAt);

            const formattedDate = isNaN(date.getTime())
                ? createdAt
                : date.toLocaleDateString('en-GB');

            createdDateElement.textContent =
                `Member Since: ${formattedDate}`;

        } else {

            createdDateElement.textContent =
                'Member Since: --';
        }
    }


    if (accountStatusElement) {

        const status = user.status || 'Active';

        const normalizedStatus = String(status).toLowerCase();

        const icon = document.createElement('i');

        if (normalizedStatus === 'active') {

            icon.className = 'fa-solid fa-circle-check';

        } else {

            icon.className = 'fa-solid fa-circle-exclamation';
        }

        accountStatusElement.replaceChildren(
            icon,
            document.createTextNode(` ${status}`)
        );

        accountStatusElement.classList.toggle(
            'inactive',
            normalizedStatus !== 'active'
        );
    }
}


/* ==========================================
   13. USER LOGOUT
========================================== */

async function handleUserLogout() {

    if (
        !confirm(
            'Account မှ Logout ထွက်မှာ သေချာပါသလား။'
        )
    ) {
        return;
    }


    const session = getAuthSession();


    try {

        if (
            session &&
            session.token &&
            AUTH_API_URL
        ) {

            await authApiRequest(
                'logout',
                {
                    token: session.token
                }
            );
        }

    } catch (error) {

        console.error(
            'Logout API Error:',
            error
        );

    } finally {

        clearAuthSession();

        showAuthSection();

        switchAuthTab('login');


        const profileCoinBalance = document.getElementById(
            'profile-coin-balance'
        );

        const headerCoinBalance = document.getElementById(
            'header-coin-balance'
        );

        if (profileCoinBalance) {
            profileCoinBalance.textContent = '0';
        }

        if (headerCoinBalance) {
            headerCoinBalance.textContent = '0';
        }


        const transactionList = document.getElementById(
            'coin-transaction-list'
        );

        if (transactionList) {

            transactionList.replaceChildren();

            const emptyState = document.createElement('div');

            emptyState.className = 'empty-state';

            emptyState.id = 'transaction-empty-state';

            const icon = document.createElement('i');

            icon.className = 'fa-solid fa-receipt';

            const message = document.createElement('p');

            message.textContent =
                'Transaction History မရှိသေးပါ။';

            emptyState.append(icon, message);

            transactionList.appendChild(emptyState);
        }


        currentAuthUser = null;
    }
}


/* ==========================================
   14. AUTH EVENT LISTENERS
========================================== */

function setupAuthEventListeners() {

    const loginForm = document.getElementById(
        'login-form'
    );

    const registerForm = document.getElementById(
        'register-form'
    );

    const logoutButton = document.getElementById(
        'profile-logout-btn'
    );

    const loginTab = document.getElementById(
        'login-tab-btn'
    );

    const registerTab = document.getElementById(
        'register-tab-btn'
    );

    const showRegisterButton = document.getElementById(
        'show-register-btn'
    );

    const showLoginButton = document.getElementById(
        'show-login-btn'
    );


    if (loginForm) {

        loginForm.addEventListener(
            'submit',
            handleUserLogin
        );
    }


    if (registerForm) {

        registerForm.addEventListener(
            'submit',
            handleUserRegister
        );
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            'click',
            handleUserLogout
        );
    }


    if (loginTab) {

        loginTab.addEventListener('click', () => {

            switchAuthTab('login');
        });
    }


    if (registerTab) {

        registerTab.addEventListener('click', () => {

            switchAuthTab('register');
        });
    }


    if (showRegisterButton) {

        showRegisterButton.addEventListener('click', () => {

            switchAuthTab('register');
        });
    }


    if (showLoginButton) {

        showLoginButton.addEventListener('click', () => {

            switchAuthTab('login');
        });
    }


    setupPasswordToggles();
}


/* ==========================================
   15. INITIALIZE AUTH SYSTEM
========================================== */

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        setupAuthEventListeners();

        const session = getAuthSession();

        if (session && session.token) {

            currentAuthUser = session;

            await loadCurrentUserProfile();

        } else {

            clearAuthSession();

            showAuthSection();

            switchAuthTab('login');
        }
    }
);


/* ==========================================
   16. GLOBAL FUNCTIONS
========================================== */

window.getAuthSession = getAuthSession;

window.isUserLoggedIn = isUserLoggedIn;

window.getCurrentAuthUser = () => currentAuthUser;

window.loadCurrentUserProfile = loadCurrentUserProfile;

window.handleUserLogin = handleUserLogin;

window.handleUserRegister = handleUserRegister;

window.handleUserLogout = handleUserLogout;

window.switchAuthTab = switchAuthTab;

window.authApiRequest = authApiRequest;

window.clearAuthSession = clearAuthSession;
