
/* ==========================================
   NOVELVERSE MM — AUTHENTICATION SYSTEM
   Register / Login / Logout / User Session
   ========================================== */


/* ==========================================
   1. CONFIGURATION
========================================== */

// Google Apps Script Backend တည်ဆောက်ပြီးမှ URL ထည့်ပါမည်။
const AUTH_API_URL = '';

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
            'Authentication Backend မချိတ်ဆက်ရသေးပါ။ Backend တည်ဆောက်ပြီးမှ အသုံးပြုနိုင်ပါမည်။'
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

        apiError.code = result?.code || '';

        throw apiError;
    }

    return result;
}


/* ==========================================
   4. SESSION MANAGEMENT
========================================== */

// Session ရယူခြင်း

function getAuthSession() {

    try {

        const session = localStorage.getItem(
            AUTH_CONFIG.sessionKey
        );

        if (!session) {
            return null;
        }

        const parsedSession = JSON.parse(session);

        if (
            !parsedSession ||
            typeof parsedSession !== 'object' ||
            !parsedSession.token
        ) {
            return null;
        }

        return parsedSession;

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

    try {

        localStorage.setItem(
            AUTH_CONFIG.sessionKey,
            JSON.stringify(session)
        );

    } catch (error) {

        throw new Error(
            'Session သိမ်းဆည်း၍ မရပါ။ Browser Storage ကို စစ်ဆေးပါ။'
        );
    }

    currentAuthUser = session;

    return session;
}


// Session ဖျက်ခြင်း

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


// Login ဝင်ထားခြင်း ရှိ/မရှိ စစ်ဆေးခြင်း

function isUserLoggedIn() {

    const session = getAuthSession();

    if (!session || !session.token) {
        return false;
    }

    // Backend မှ Expiry Date ပေးထားပါက စစ်ဆေးမည်။

    if (session.expiresAt) {

        const expiryTime = new Date(
            session.expiresAt
        ).getTime();

        if (
            !isNaN(expiryTime) &&
            Date.now() >= expiryTime
        ) {
            return false;
        }
    }

    return true;
}


/* ==========================================
   5. AUTH MESSAGE HELPERS
========================================== */

function showAuthMessage(elementId, message) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;

    element.hidden = false;

    element.style.display = 'block';
}


function showAuthError(elementId, message) {

    showAuthMessage(elementId, message);
}


function hideAuthMessage(elementId) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = '';

    element.hidden = true;

    element.style.display = 'none';
}


/* ==========================================
   6. AUTH BUTTON LOADING
========================================== */

function setAuthButtonLoading(
    buttonId,
    loading,
    normalText
) {

    const button = document.getElementById(buttonId);

    if (!button) return;

    if (loading) {

        // မူလ Button HTML နှင့် Icon ကို သိမ်းထားမည်။

        if (!button.dataset.originalHTML) {

            button.dataset.originalHTML =
                button.innerHTML;
        }

        button.disabled = true;

        button.innerHTML = 'ခဏစောင့်ပါ...';

    } else {

        button.disabled = false;

        if (button.dataset.originalHTML) {

            button.innerHTML =
                button.dataset.originalHTML;

            delete button.dataset.originalHTML;

        } else if (normalText) {

            button.textContent = normalText;
        }
    }
}


/* ==========================================
   7. AUTH / PROFILE SECTION
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
    }

    if (profileSection) {
        profileSection.hidden = true;
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
    }

    if (profileSection) {
        profileSection.hidden = false;
    }
}


/* ==========================================
   8. AUTH TAB SWITCHING
========================================== */

function switchAuthTab(tabName, preserveSuccess = false) {

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

    // မမှန်သော Tab Name ဖြစ်ပါက Login ကို Default ထားမည်။

    const selectedTab =
        tabName === 'register' ? 'register' : 'login';

    hideAuthMessage('login-error');
    hideAuthMessage('register-error');

    if (!preserveSuccess) {
        hideAuthMessage('register-success');
    }

    if (selectedTab === 'register') {

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
   9. PASSWORD / PIN VISIBILITY
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

            const targetId =
                button.dataset.passwordToggle;

            const input = document.getElementById(
                targetId
            );

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
   10. USER REGISTRATION
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

    if (
        !usernameInput ||
        !pinInput ||
        !confirmPinInput
    ) {
        showAuthError(
            'register-error',
            'Register Form ကို ရှာမတွေ့ပါ။'
        );

        return;
    }

    const username = usernameInput.value.trim();

    const pin = pinInput.value;

    const confirmPin = confirmPinInput.value;


    // Username Validation

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


    // PIN Validation

    if (
        !/^\d+$/.test(pin) ||
        pin.length < AUTH_CONFIG.minimumPinLength ||
        pin.length > AUTH_CONFIG.maximumPinLength
    ) {

        showAuthError(
            'register-error',
            'PIN ကို ဂဏန်း ၆ လုံးမှ ၁၂ လုံးအထိ အသုံးပြုပါ။'
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
        'Account ဖန်တီးမည်'
    );


    try {

        const result = await authApiRequest(
            'register',
            {
                username: username,
                pin: pin
            }
        );


        // Login Form တွင် Username ဖြည့်ပေးမည်။

        const loginUsername = document.getElementById(
            'login-username'
        );

        if (loginUsername) {
            loginUsername.value = username;
        }


        // Register Form ရှင်းလင်းခြင်း

        document.getElementById(
            'register-form'
        )?.reset();


        // Login Tab သို့ ပြောင်းခြင်း

        switchAuthTab('login', true);


        // Success Message ပြသခြင်း

        showAuthMessage(
            'register-success',
            result.message ||
            'Account ဖွင့်ခြင်း အောင်မြင်ပါသည်။ Login ဝင်နိုင်ပါပြီ။'
        );

    } catch (error) {

        showAuthError(
            'register-error',
            error.message ||
            'Account ဖွင့်ခြင်း မအောင်မြင်ပါ။'
        );

        console.error(
            'Registration Error:',
            error
        );

    } finally {

        isAuthLoading = false;

        setAuthButtonLoading(
            'register-submit-btn',
            false,
            'Account ဖန်တီးမည်'
        );
    }
}


/* ==========================================
   11. USER LOGIN
========================================== */

async function handleUserLogin(event) {

    event.preventDefault();

    if (isAuthLoading) return;

    hideAuthMessage('login-error');
    hideAuthMessage('register-success');

    const usernameInput = document.getElementById(
        'login-username'
    );

    const pinInput = document.getElementById(
        'login-pin'
    );

    if (!usernameInput || !pinInput) {

        showAuthError(
            'login-error',
            'Login Form ကို ရှာမတွေ့ပါ။'
        );

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

    if (!/^\d+$/.test(pin)) {

        showAuthError(
            'login-error',
            'PIN ကို ဂဏန်းများဖြင့်သာ ဖြည့်သွင်းပါ။'
        );

        return;
    }


    isAuthLoading = true;

    setAuthButtonLoading(
        'login-submit-btn',
        true,
        'Login ဝင်မည်'
    );


    try {

        const result = await authApiRequest(
            'login',
            {
                username: username,
                pin: pin
            }
        );


        // Backend မှ Session Data ရယူခြင်း

        const sessionData = result.session || {
            token: result.token,
            userId: result.userId,
            username: result.username || username,
            createdAt: result.createdAt,
            expiresAt: result.expiresAt
        };


        // Session သိမ်းဆည်းခြင်း

        saveAuthSession(sessionData);


        // Login Form ရှင်းလင်းခြင်း

        document.getElementById(
            'login-form'
        )?.reset();


        // Profile Data ရယူခြင်း

        const profileLoaded =
            await loadCurrentUserProfile();


        if (!profileLoaded) {

            showAuthError(
                'login-error',
                'Login Session ရရှိပါပြီ။ Profile Data ကို ရယူ၍ မရသေးပါ။ ထပ်မံကြိုးစားပါ။'
            );
        }

    } catch (error) {

        showAuthError(
            'login-error',
            error.message ||
            'Login ဝင်ခြင်း မအောင်မြင်ပါ။'
        );

        console.error(
            'Login Error:',
            error
        );

    } finally {

        isAuthLoading = false;

        setAuthButtonLoading(
            'login-submit-btn',
            false,
            'Login ဝင်မည်'
        );
    }
}


/* ==========================================
   12. LOAD CURRENT USER PROFILE
========================================== */

async function loadCurrentUserProfile() {

    const session = getAuthSession();

    if (!session || !session.token) {

        currentAuthUser = null;

        showAuthSection();

        return false;
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


        // Session နှင့် User Data ပေါင်းစပ်ခြင်း

        currentAuthUser = {
            ...session,
            ...user,
            token: session.token
        };


        // Profile UI Update

        updateProfileUI(currentAuthUser);

        showProfileSection();


        // Coin Balance ကို coin.js မှ ရယူမည်။

        if (
            typeof window.loadCoinBalance === 'function'
        ) {

            await window.loadCoinBalance();
        }

        return true;

    } catch (error) {

        console.error(
            'Profile Loading Error:',
            error
        );


        // Token သက်တမ်းကုန်ခြင်း သို့မဟုတ် မမှန်ခြင်း
        // Backend မှ သတ်မှတ်ထားသော Code ဖြစ်ပါက Session ဖျက်မည်။

        const invalidSessionCodes = [
            'INVALID_TOKEN',
            'SESSION_EXPIRED',
            'UNAUTHORIZED'
        ];

        if (
            invalidSessionCodes.includes(error.code)
        ) {

            clearAuthSession();

            showAuthSection();

            switchAuthTab('login');

            showAuthError(
                'login-error',
                'Session သက်တမ်းကုန်သွားပါပြီ။ Login ပြန်ဝင်ပေးပါ။'
            );

        } else {

            // Network Error ဖြစ်ရုံဖြင့် Session မဖျက်ပါ။

            currentAuthUser = {
                ...session
            };

            showAuthSection();
        }

        return false;
    }
}


/* ==========================================
   13. UPDATE PROFILE UI
========================================== */

function updateProfileUI(user) {

    if (!user) return;

    const usernameElement = document.getElementById(
        'profile-username'
    );

    const createdDateElement = document.getElementById(
        'profile-created-date'
    );

    const accountStatusElement = document.getElementById(
        'profile-account-status'
    );


    // Username

    if (usernameElement) {

        usernameElement.textContent =
            user.username ||
            currentAuthUser?.username ||
            'User';
    }


    // Account Creation Date

    if (createdDateElement) {

        const createdAt = user.createdAt || '';

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


    // Account Status

    if (accountStatusElement) {

        const status = user.status || 'Active';

        const icon = accountStatusElement.querySelector('i');

        accountStatusElement.replaceChildren();

        if (icon) {
            accountStatusElement.appendChild(
                icon.cloneNode(true)
            );
        }

        accountStatusElement.appendChild(
            document.createTextNode(' ' + status)
        );

        accountStatusElement.classList.toggle(
            'inactive',
            status.toLowerCase() !== 'active'
        );
    }
}


/* ==========================================
   14. USER LOGOUT
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

        // Local Session ကို အမြဲဖျက်မည်။

        clearAuthSession();

        showAuthSection();

        switchAuthTab('login');

        window.location.href =
            AUTH_CONFIG.loginPage;
    }
}


/* ==========================================
   15. AUTH EVENT LISTENERS
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


    // Login Form

    if (
        loginForm &&
        loginForm.dataset.authReady !== 'true'
    ) {

        loginForm.dataset.authReady = 'true';

        loginForm.addEventListener(
            'submit',
            handleUserLogin
        );
    }


    // Register Form

    if (
        registerForm &&
        registerForm.dataset.authReady !== 'true'
    ) {

        registerForm.dataset.authReady = 'true';

        registerForm.addEventListener(
            'submit',
            handleUserRegister
        );
    }


    // Logout

    if (
        logoutButton &&
        logoutButton.dataset.authReady !== 'true'
    ) {

        logoutButton.dataset.authReady = 'true';

        logoutButton.addEventListener(
            'click',
            handleUserLogout
        );
    }


    // Login Tab

    if (
        loginTab &&
        loginTab.dataset.authReady !== 'true'
    ) {

        loginTab.dataset.authReady = 'true';

        loginTab.addEventListener('click', () => {
            switchAuthTab('login');
        });
    }


    // Register Tab

    if (
        registerTab &&
        registerTab.dataset.authReady !== 'true'
    ) {

        registerTab.dataset.authReady = 'true';

        registerTab.addEventListener('click', () => {
            switchAuthTab('register');
        });
    }


    // Show Register Button

    if (
        showRegisterButton &&
        showRegisterButton.dataset.authReady !== 'true'
    ) {

        showRegisterButton.dataset.authReady = 'true';

        showRegisterButton.addEventListener('click', () => {
            switchAuthTab('register');
        });
    }


    // Show Login Button

    if (
        showLoginButton &&
        showLoginButton.dataset.authReady !== 'true'
    ) {

        showLoginButton.dataset.authReady = 'true';

        showLoginButton.addEventListener('click', () => {
            switchAuthTab('login');
        });
    }


    setupPasswordToggles();
}


/* ==========================================
   16. INITIALIZE AUTH SYSTEM
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
   17. GLOBAL FUNCTIONS
========================================== */

window.getAuthSession = getAuthSession;

window.saveAuthSession = saveAuthSession;

window.clearAuthSession = clearAuthSession;

window.isUserLoggedIn = isUserLoggedIn;

window.getCurrentAuthUser = () => currentAuthUser;

window.loadCurrentUserProfile = loadCurrentUserProfile;

window.updateProfileUI = updateProfileUI;

window.handleUserLogin = handleUserLogin;

window.handleUserRegister = handleUserRegister;

window.handleUserLogout = handleUserLogout;

window.switchAuthTab = switchAuthTab;

window.authApiRequest = authApiRequest;
