
/* ==========================================
   NOVELVERSE MM — PROFILE PAGE
   User Profile / Coin History / Account UI
   Version: 1.2
========================================== */


// ==========================================
// 1. PROFILE CONFIGURATION
// ==========================================

const PROFILE_CONFIG = {

    usernameId: 'profile-username',

    createdDateId: 'profile-created-date',

    accountStatusId: 'profile-account-status',

    coinBalanceId: 'profile-coin-balance',

    transactionListId: 'coin-transaction-list',

    transactionEmptyId: 'transaction-empty-state',

    loginRequiredRedirect: 'profile.html'

};


// ==========================================
// 2. PROFILE PAGE STATE
// ==========================================

let isProfilePageLoading = false;

let profileTransactionRequest = null;


// ==========================================
// 3. CHECK PROFILE PAGE
// ==========================================

function isProfilePage() {

    return Boolean(
        document.getElementById('profile-section') ||
        document.getElementById('auth-section')
    );

}


// ==========================================
// 4. GET CURRENT USER
// ==========================================

function getProfileUser() {

    if (typeof window.getCurrentAuthUser !== 'function') {
        return null;
    }

    return window.getCurrentAuthUser();

}


// ==========================================
// 5. UPDATE PROFILE INFORMATION
// ==========================================

function refreshProfileInformation() {

    const user = getProfileUser();

    if (!user) return;


    const usernameElement = document.getElementById(
        PROFILE_CONFIG.usernameId
    );

    const createdDateElement = document.getElementById(
        PROFILE_CONFIG.createdDateId
    );

    const accountStatusElement = document.getElementById(
        PROFILE_CONFIG.accountStatusId
    );


    // Username

    if (usernameElement) {

        usernameElement.textContent =
            user.username || 'User';

    }


    // Account Creation Date

    if (createdDateElement) {

        const createdAt = user.createdAt;

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

        accountStatusElement.textContent = status;

        accountStatusElement.classList.toggle(
            'inactive',
            status.toLowerCase() !== 'active'
        );

    }

}


// ==========================================
// 6. LOAD COIN TRANSACTION HISTORY
// ==========================================

async function refreshProfileTransactions() {

    const transactionList = document.getElementById(
        PROFILE_CONFIG.transactionListId
    );

    if (!transactionList) return;


    // Login စစ်ဆေးခြင်း

    if (
        typeof window.isUserLoggedIn !== 'function' ||
        !window.isUserLoggedIn()
    ) {

        transactionList.innerHTML = '';

        const emptyState = document.getElementById(
            PROFILE_CONFIG.transactionEmptyId
        );

        if (emptyState) {

            emptyState.style.display = 'block';

            emptyState.textContent =
                'Transaction History ကြည့်ရန် Login ဝင်ပေးပါ။';

        }

        return;

    }


    // Request တစ်ခု လုပ်နေပြီးသားဆို
    // အဲဒီ Request ကိုပဲ ပြန်အသုံးပြုမယ်။

    if (profileTransactionRequest) {

        return await profileTransactionRequest;

    }


    if (
        typeof window.loadCoinTransactionHistory !== 'function'
    ) {

        console.warn(
            'coin.js: loadCoinTransactionHistory() မတွေ့ပါ။'
        );

        return;

    }


    profileTransactionRequest = (async () => {

        try {

            return await window.loadCoinTransactionHistory();

        } finally {

            profileTransactionRequest = null;

        }

    })();


    return await profileTransactionRequest;

}


// ==========================================
// 7. REFRESH PROFILE DATA
// ==========================================

async function refreshProfilePage() {

    if (isProfilePageLoading) return;

    isProfilePageLoading = true;

    try {

        // Login မရှိပါက

        if (
            typeof window.isUserLoggedIn !== 'function' ||
            !window.isUserLoggedIn()
        ) {

            refreshProfileInformation();

            return;

        }


        // Auth User Information
        // auth.js က Balance နှင့် Transaction History
        // ကိုပါ ရယူပေးထားသောကြောင့် ထပ်မခေါ်တော့ပါ။

        if (
            typeof window.loadCurrentUserProfile === 'function'
        ) {

            await window.loadCurrentUserProfile();

        }


        // Profile Information

        refreshProfileInformation();


    } catch (error) {

        console.error(
            'Profile Refresh Error:',
            error
        );

    } finally {

        isProfilePageLoading = false;

    }

}


// ==========================================
// 8. HANDLE COIN BALANCE UPDATE
// ==========================================

function handleProfileCoinUpdate(event) {

    const balanceElement = document.getElementById(
        PROFILE_CONFIG.coinBalanceId
    );

    if (!balanceElement) return;


    const balance = Number(
        event.detail?.balance ?? 0
    );

    if (!Number.isFinite(balance) || balance < 0) {
        return;
    }


    balanceElement.textContent =
        balance.toLocaleString('en-US');

}


// ==========================================
// 9. PROFILE PAGE EVENT LISTENERS
// ==========================================

function setupProfileEventListeners() {

    // Coin Balance Update Event

    document.addEventListener(
        'coinBalanceUpdated',
        handleProfileCoinUpdate
    );


    // Listen for storage changes from another browser tab

    window.addEventListener('storage', event => {

        if (
            event.key === 'novelverse_session' &&
            !event.newValue
        ) {

            window.location.reload();

        }

    });

}


// ==========================================
// 10. INITIALIZE PROFILE PAGE
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {

    if (!isProfilePage()) return;

    setupProfileEventListeners();


    // Login ရှိပါက Profile Information ပြမယ်

    if (
        typeof window.isUserLoggedIn === 'function' &&
        window.isUserLoggedIn()
    ) {

        refreshProfileInformation();

        // Transaction History ကို တစ်ကြိမ်သာ ရယူမယ်။
        // auth.js ကလည်း ရယူပေးထားပါက coin.js ရဲ့
        // request protection က ထပ်ခါတလဲလဲ မခေါ်စေပါ။

        await refreshProfileTransactions();

    }

});


// ==========================================
// 11. GLOBAL FUNCTIONS
// ==========================================

window.refreshProfileInformation =
    refreshProfileInformation;

window.refreshProfileTransactions =
    refreshProfileTransactions;

window.refreshProfilePage =
    refreshProfilePage;

window.isProfilePage =
    isProfilePage;
