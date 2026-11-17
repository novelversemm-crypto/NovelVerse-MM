
/* ==========================================
   NOVELVERSE MM — AUTHENTICATION SYSTEM
   Register / Login / Logout / User Session
   ========================================== */


/* ==========================================
   1. CONFIGURATION
   ========================================== */

// Google Apps Script Web App URL ကို
// Backend တည်ဆောက်ပြီးမှ ထည့်သွင်းပါမည်။
const AUTH_API_URL = '';

const AUTH_CONFIG = {
    sessionKey: 'novelverse_session',

    minimumPinLength: 6,

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
            'Authentication API မချိတ်ဆက်ရသေးပါ။ Backend တည်ဆောက်ရန် လိုအပ်ပါသည်။'
        );
    }

    const response = await fetch(AUTH_API_URL, {
        method: 'POST',

        headers: {
            'Content-Type': 'text/plain;charset=utf-8'
        },

        body: JSON.stringify({
            action: action,
            ...data
        })
    });

    if (!response.ok) {
        throw new Error(
            `Server Error: ${response.status}`
        );
    }

    const result = await response.json();

    if (!result || result.success !== true) {
        throw new Error(
            result?.message || 'လုပ်ဆောင်မှု မအောင်မြင်ပါ။'
        );
    }

    return result;
}


/* ==========================================
   4. SESSION MANAGEMENT
   ========================================== */

// Session ကို localStorage မှ ရယူခြင်း

function getAuthSession() {

    try {

        const session = localStorage.getItem(
            AUTH_CONFIG.sessionKey
        );

        if (!session) {
            return null;
        }

        return JSON.parse(session);

    } catch (error) {

        console.error('Session Read Error:', error);

        return null;
    }
}


// Session သိမ်းဆည်းခြင်း

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

    localStorage.setItem(
        AUTH_CONFIG.sessionKey,
        JSON.stringify(session)
    );

    currentAuthUser = session;

    return session;
}


// Session ဖျက်ခြင်း

function clearAuthSession() {

    localStorage.removeItem(
        AUTH_CONFIG.sessionKey
    );

    currentAuthUser = null;
}


// Login ဝင်ထားခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း

function isUserLoggedIn() {

    const session = getAuthSession();

    return Boolean(
        session &&
        session.token
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


function hideAuthMessage(elementId) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = '';

    element.style.display = 'none';
}


function setAuthButtonLoading(buttonId, loading, normalText) {

    const button = document.getElementById(buttonId);

    if (!button) return;

    button.disabled = loading;

    button.textContent = loading
        ? 'ခဏစောင့်ပါ...'
        : normalText;
}


function showAuthSection() {

    const authSection = document.getElementById(
        'auth-section'
    );

    const profileSection = document.getElementById(
        'profile-section'
    );

    if (authSection) {
        authSection.style.display = 'block';
    }

    if (profileSection) {
        profileSection.style.display = 'none';
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
        authSection.style.display = 'none';
    }

    if (profileSection) {
        profileSection.style.display = 'block';
    }
}


/* ==========================================
   6. AUTH TAB SWITCHING
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

    // Tab ကို ကိုယ်တိုင်ပြောင်းတဲ့အခါ Success Message ကို ဖျောက်မည်
    hideAuthMessage('register-success');

    if (tabName === 'register') {

        if (loginPanel) {
            loginPanel.style.display = 'none';
        }

        if (registerPanel) {
            registerPanel.style.display = 'block';
        }

        if (loginTab) {
            loginTab.classList.remove('active');
        }

        if (registerTab) {
            registerTab.classList.add('active');
        }

    } else {

        if (loginPanel) {
            loginPanel.style.display = 'block';
        }

        if (registerPanel) {
            registerPanel.style.display = 'none';
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
   7. PASSWORD / PIN VISIBILITY
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

            if (input.type === 'password') {

                input.type = 'text';

                button.setAttribute(
                    'aria-label',
                    'Hide PIN'
                );

            } else {

                input.type = 'password';

                button.setAttribute(
                    'aria-label',
                    'Show PIN'
                );
            }
        });
    });
}


/* ==========================================
   8. USER REGISTRATION
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


    // Username validation

    if (username.length < 3 || username.length > 30) {

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


    // PIN validation

    if (pin.length < AUTH_CONFIG.minimumPinLength) {

        showAuthError(
            'register-error',
            'PIN သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။'
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
        true,
        'Create Account'
    );


    try {

        const result = await authApiRequest(
            'register',
            {
                username: username,
                pin: pin
            }
        );


        // Login Form တွင် Username အလိုအလျောက် ဖြည့်မည်

        const loginUsername = document.getElementById(
            'login-username'
        );

        if (loginUsername) {
            loginUsername.value = username;
        }


        // Register Form ကို ရှင်းလင်းမည်

        document.getElementById(
            'register-form'
        )?.reset();


        // Login Tab သို့ ပြောင်းမည်

        switchAuthTab('login');


        // Register Success Message ကို Login Tab အောက်တွင် ပြမည်

        showAuthMessage(
            'register-success',
            result.message || 'Account ဖွင့်ခြင်း အောင်မြင်ပါသည်။ Login ဝင်နိုင်ပါပြီ။'
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
            false,
            'Create Account'
        );
    }
}


/* ==========================================
   9. LOGIN MESSAGE HELPER
   ========================================== */

function showAuthMessage(elementId, message) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;

    element.style.display = 'block';
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


    isAuthLoading = true;

    setAuthButtonLoading(
        'login-submit-btn',
        true,
        'Login'
    );


    try {

        const result = await authApiRequest(
            'login',
            {
                username: username,
                pin: pin
            }
        );


        // Backend မှ Session Token ရရှိရမည်

        const sessionData = result.session || {
            token: result.token,
            userId: result.userId,
            username: result.username,
            createdAt: result.createdAt,
            expiresAt: result.expiresAt
        };


        saveAuthSession(sessionData);


        // Login Form ကို ရှင်းလင်းခြင်း

        document.getElementById(
            'login-form'
        )?.reset();


        // Profile UI ပြသခြင်း

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
            false,
            'Login'
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


        // Coin Balance ကို သီးခြား coin.js မှ ရယူမည်

        if (typeof window.loadCoinBalance === 'function') {

            window.loadCoinBalance();
        }


    } catch (error) {

        console.error('Profile Loading Error:', error);

        // Session မမှန်တော့ပါက Login ပြန်ဝင်စေမည်

        clearAuthSession();

        showAuthSection();

        showAuthError(
            'login-error',
            'Session သက်တမ်းကုန်သွားပါပြီ။ Login ပြန်ဝင်ပေးပါ။'
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
            user.username || currentAuthUser?.username || 'User';
    }


    if (createdDateElement) {

        const createdAt =
            user.createdAt ||
            currentAuthUser?.createdAt;

        if (createdAt) {

            const date = new Date(createdAt);

            createdDateElement.textContent =
                isNaN(date.getTime())
                    ? createdAt
                    : date.toLocaleDateString('en-GB');
        } else {

            createdDateElement.textContent = '-';
        }
    }


    if (accountStatusElement) {

        const status = user.status || 'Active';

        accountStatusElement.textContent = status;

        accountStatusElement.classList.toggle(
            'inactive',
            status.toLowerCase() !== 'active'
        );
    }
}


/* ==========================================
   13. USER LOGOUT
   ========================================== */

async function handleUserLogout() {

    if (!confirm('Account မှ Logout ထွက်မှာ သေချာပါသလား။')) {
        return;
    }

    const session = getAuthSession();


    try {

        if (session && session.token && AUTH_API_URL) {

            await authApiRequest(
                'logout',
                {
                    token: session.token
                }
            );
        }

    } catch (error) {

        console.error('Logout API Error:', error);

    } finally {

        clearAuthSession();

        showAuthSection();

        switchAuthTab('login');

        window.location.href = AUTH_CONFIG.loginPage;
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

document.addEventListener('DOMContentLoaded', async () => {

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
});


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
