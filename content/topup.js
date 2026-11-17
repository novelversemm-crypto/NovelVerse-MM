
/* ==========================================
   NOVELVERSE MM — TOP-UP SYSTEM
   Coin Packages / Payment Settings / Promo
   ========================================== */


/* ==========================================
   1. TOP-UP CONFIGURATION
   ========================================== */

const TOPUP_CONFIG = {

    packageSelector: '[data-package-id]',

    copyButtonSelector: '[data-copy-target]',

    balanceIds: [
        'header-coin-balance',
        'topup-current-balance'
    ],

    promoInputId: 'promo-code-input',

    redeemButtonId: 'redeem-promo-btn',

    promoErrorId: 'promo-redeem-error',

    promoSuccessId: 'promo-redeem-success'
};


/* ==========================================
   2. COIN PACKAGE CONFIGURATION
   ========================================== */

const TOPUP_PACKAGES = {

    package_1000: {
        price: 1000,
        coins: 40,
        bonus: 0,
        total: 40
    },

    package_2000: {
        price: 2000,
        coins: 80,
        bonus: 5,
        total: 85
    },

    package_3000: {
        price: 3000,
        coins: 120,
        bonus: 10,
        total: 130
    },

    package_5000: {
        price: 5000,
        coins: 200,
        bonus: 20,
        total: 220
    }
};


let selectedTopupPackage = null;

let isPromoRedeeming = false;


/* ==========================================
   3. API HELPER
   ========================================== */

async function topupApiRequest(action, data = {}) {

    if (typeof window.authApiRequest === 'function') {

        return await window.authApiRequest(
            action,
            data
        );
    }

    throw new Error(
        'Authentication API မတွေ့ပါ။ auth.js ကို စစ်ဆေးပါ။'
    );
}


/* ==========================================
   4. TOP-UP MESSAGE HELPERS
   ========================================== */

function showTopupMessage(elementId, message) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;

    element.style.display = 'block';
}


function hideTopupMessage(elementId) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = '';

    element.style.display = 'none';
}


function showTopupError(message) {

    hideTopupMessage(TOPUP_CONFIG.promoSuccessId);

    showTopupMessage(
        TOPUP_CONFIG.promoErrorId,
        message
    );
}


function showTopupSuccess(message) {

    hideTopupMessage(TOPUP_CONFIG.promoErrorId);

    showTopupMessage(
        TOPUP_CONFIG.promoSuccessId,
        message
    );
}


/* ==========================================
   5. FORMAT NUMBER
   ========================================== */

function formatTopupNumber(number) {

    return Number(number || 0).toLocaleString('en-US');
}


/* ==========================================
   6. PACKAGE SELECTION
   ========================================== */

function selectTopupPackage(packageId, button) {

    const selectedPackage = TOPUP_PACKAGES[packageId];

    if (!selectedPackage) {

        console.error(
            'Unknown Package:',
            packageId
        );

        return;
    }


    selectedTopupPackage = {
        id: packageId,
        ...selectedPackage
    };


    // Previous Selection ကို ဖယ်ရှားခြင်း

    document.querySelectorAll(
        TOPUP_CONFIG.packageSelector
    ).forEach(packageButton => {

        packageButton.classList.remove('selected');

        packageButton.setAttribute(
            'aria-pressed',
            'false'
        );

        const card = packageButton.closest(
            '[data-package-card]'
        );

        if (card) {
            card.classList.remove('selected');
        }
    });


    // Current Selection

    button.classList.add('selected');

    button.setAttribute(
        'aria-pressed',
        'true'
    );

    const currentCard = button.closest(
        '[data-package-card]'
    );

    if (currentCard) {
        currentCard.classList.add('selected');
    }


    // Selected Package ကို Browser State ထဲတွင်သာ သိမ်းမည်

    document.dispatchEvent(
        new CustomEvent('topupPackageSelected', {
            detail: {
                ...selectedTopupPackage
            }
        })
    );


    console.log(
        'Selected Top-up Package:',
        selectedTopupPackage
    );
}


/* ==========================================
   7. SETUP PACKAGE BUTTONS
   ========================================== */

function setupTopupPackages() {

    const packageButtons = document.querySelectorAll(
        TOPUP_CONFIG.packageSelector
    );

    packageButtons.forEach(button => {

        if (button.dataset.topupReady === 'true') {
            return;
        }

        button.dataset.topupReady = 'true';

        button.setAttribute(
            'aria-pressed',
            'false'
        );

        button.addEventListener('click', () => {

            const packageId = button.dataset.packageId;

            const packagePrice = Number(
                button.dataset.price
            );

            const packageData = TOPUP_PACKAGES[packageId];


            if (!packageData) {

                console.error(
                    'Package Configuration မတွေ့ပါ။',
                    packageId
                );

                return;
            }


            // HTML မှာ သတ်မှတ်ထားသော ဈေးနှုန်းကိုလည်း စစ်ဆေးမည်

            if (packagePrice !== packageData.price) {

                console.error(
                    'Package Price မကိုက်ညီပါ။',
                    packageId
                );

                return;
            }


            selectTopupPackage(
                packageId,
                button
            );
        });
    });
}


/* ==========================================
   8. LOAD PAYMENT SETTINGS
   ========================================== */

async function loadTopupSettings() {

    try {

        const result = await topupApiRequest(
            'getTopupSettings'
        );

        const settings = result.settings || {};


        // KBZPay Information

        updateTopupText(
            'kbzpay-account-name',
            settings.kbzpayName
        );

        updateTopupText(
            'kbzpay-phone',
            settings.kbzpayPhone
        );


        // WavePay Information

        updateTopupText(
            'wavepay-account-name',
            settings.wavepayName
        );

        updateTopupText(
            'wavepay-phone',
            settings.wavepayPhone
        );


        // Admin Telegram Link

        const telegramLink = document.getElementById(
            'admin-telegram-link'
        );

        if (telegramLink && settings.telegramLink) {

            telegramLink.href = settings.telegramLink;

            telegramLink.target = '_blank';

            telegramLink.rel = 'noopener noreferrer';

            telegramLink.style.display = '';
        }

        return settings;

    } catch (error) {

        console.error(
            'Top-up Settings Error:',
            error
        );

        return null;
    }
}


/* ==========================================
   9. UPDATE TEXT ELEMENT
   ========================================== */

function updateTopupText(elementId, value) {

    const element = document.getElementById(elementId);

    if (!element || value === undefined || value === null) {
        return;
    }

    element.textContent = value;
}


/* ==========================================
   10. COPY PAYMENT INFORMATION
   ========================================== */

async function copyTopupText(text, button) {

    if (!text) return;

    try {

        await navigator.clipboard.writeText(text);

        showCopySuccess(button);

    } catch (error) {

        console.error(
            'Clipboard Error:',
            error
        );

        showTopupError(
            'Copy လုပ်၍ မရပါ။ အချက်အလက်ကို ကိုယ်တိုင် Copy ကူးပေးပါ။'
        );
    }
}


/* ==========================================
   11. COPY BUTTON SUCCESS UI
   ========================================== */

function showCopySuccess(button) {

    if (!button) return;

    const originalText = button.textContent;

    button.textContent = 'Copied!';

    button.classList.add('copied');

    button.disabled = true;

    setTimeout(() => {

        button.textContent = originalText;

        button.classList.remove('copied');

        button.disabled = false;

    }, 1500);
}


/* ==========================================
   12. SETUP COPY BUTTONS
   ========================================== */

function setupTopupCopyButtons() {

    const buttons = document.querySelectorAll(
        TOPUP_CONFIG.copyButtonSelector
    );

    buttons.forEach(button => {

        if (button.dataset.copyReady === 'true') {
            return;
        }

        button.dataset.copyReady = 'true';

        button.addEventListener('click', async () => {

            const targetId = button.dataset.copyTarget;

            const targetElement = document.getElementById(
                targetId
            );

            if (!targetElement) return;

            const text = targetElement.textContent.trim();

            await copyTopupText(
                text,
                button
            );
        });
    });
}


/* ==========================================
   13. REDEEM PROMO CODE
   ========================================== */

async function redeemTopupPromoCode() {

    if (isPromoRedeeming) return;


    hideTopupMessage(TOPUP_CONFIG.promoErrorId);

    hideTopupMessage(TOPUP_CONFIG.promoSuccessId);


    // Login စစ်ဆေးခြင်း

    if (
        typeof window.isUserLoggedIn !== 'function' ||
        !window.isUserLoggedIn()
    ) {

        showTopupError(
            'Promo Code အသုံးပြုရန် အရင် Login ဝင်ပေးပါ။'
        );

        return;
    }


    const input = document.getElementById(
        TOPUP_CONFIG.promoInputId
    );

    const button = document.getElementById(
        TOPUP_CONFIG.redeemButtonId
    );

    if (!input || !button) return;


    const promoCode = input.value.trim().toUpperCase();


    // Empty Validation

    if (!promoCode) {

        showTopupError(
            'Promo Code ဖြည့်သွင်းပေးပါ။'
        );

        input.focus();

        return;
    }


    // Basic Input Validation

    if (!/^[A-Z0-9-]{4,50}$/.test(promoCode)) {

        showTopupError(
            'Promo Code ပုံစံ မမှန်ပါ။ ပြန်စစ်ဆေးပေးပါ။'
        );

        return;
    }


    isPromoRedeeming = true;

    const originalButtonText = button.textContent;

    button.disabled = true;

    button.textContent = 'Verifying...';


    try {

        const session = window.getAuthSession();

        if (!session || !session.token) {

            throw new Error(
                'Login Session မတွေ့ပါ။ Login ပြန်ဝင်ပေးပါ။'
            );
        }


        // Backend ကသာ Code Validity နှင့် Coin Credit ကို ဆုံးဖြတ်မည်

        const result = await topupApiRequest(
            'redeemPromoCode',
            {
                token: session.token,
                code: promoCode
            }
        );


        // Successful Redemption

        input.value = '';


        const receivedCoins = Number(
            result.totalCoins ??
            result.coins ??
            0
        );


        const newBalance = Number(
            result.balance
        );


        let successMessage =
            result.message || 'Promo Code အသုံးပြုခြင်း အောင်မြင်ပါသည်။';


        if (receivedCoins > 0) {

            successMessage +=
                ` ရရှိသော Coins: ${formatTopupNumber(receivedCoins)}`;
        }


        showTopupSuccess(successMessage);


        // Coin Balance ကို Backend Response ဖြင့် Update လုပ်မည်

        if (
            Number.isFinite(newBalance) &&
            typeof window.updateCoinBalanceUI === 'function'
        ) {

            window.updateCoinBalanceUI(newBalance);

        } else if (
            typeof window.refreshCoinBalance === 'function'
        ) {

            await window.refreshCoinBalance();
        }


        // Transaction History ကို Refresh လုပ်မည်

        if (
            typeof window.loadCoinTransactionHistory === 'function'
        ) {

            await window.loadCoinTransactionHistory();
        }


    } catch (error) {

        showTopupError(
            error.message || 'Promo Code အသုံးပြုခြင်း မအောင်မြင်ပါ။'
        );

        console.error(
            'Promo Redemption Error:',
            error
        );

    } finally {

        isPromoRedeeming = false;

        button.disabled = false;

        button.textContent = originalButtonText;
    }
}


/* ==========================================
   14. SETUP PROMO REDEMPTION
   ========================================== */

function setupPromoRedemption() {

    const button = document.getElementById(
        TOPUP_CONFIG.redeemButtonId
    );

    const input = document.getElementById(
        TOPUP_CONFIG.promoInputId
    );


    if (button && button.dataset.promoReady !== 'true') {

        button.dataset.promoReady = 'true';

        button.addEventListener(
            'click',
            redeemTopupPromoCode
        );
    }


    if (input && input.dataset.promoReady !== 'true') {

        input.dataset.promoReady = 'true';

        input.addEventListener('keydown', event => {

            if (event.key === 'Enter') {

                event.preventDefault();

                redeemTopupPromoCode();
            }
        });


        input.addEventListener('input', () => {

            hideTopupMessage(
                TOPUP_CONFIG.promoErrorId
            );

            hideTopupMessage(
                TOPUP_CONFIG.promoSuccessId
            );
        });
    }
}


/* ==========================================
   15. LOAD CURRENT COIN BALANCE
   ========================================== */

async function loadTopupCoinBalance() {

    if (
        typeof window.isUserLoggedIn !== 'function' ||
        !window.isUserLoggedIn()
    ) {

        TOPUP_CONFIG.balanceIds.forEach(id => {

            const element = document.getElementById(id);

            if (element) {
                element.textContent = '0';
            }
        });

        return;
    }


    if (typeof window.refreshCoinBalance === 'function') {

        await window.refreshCoinBalance();
    }
}


/* ==========================================
   16. INITIALIZE TOP-UP PAGE
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

    if (!document.getElementById('promo-code-input')) {
        return;
    }


    setupTopupPackages();

    setupTopupCopyButtons();

    setupPromoRedemption();


    // Settings နှင့် Balance ကို Load လုပ်ခြင်း

    loadTopupSettings();

    loadTopupCoinBalance();
});


/* ==========================================
   17. GLOBAL FUNCTIONS
   ========================================== */

window.selectTopupPackage =
    selectTopupPackage;

window.loadTopupSettings =
    loadTopupSettings;

window.loadTopupCoinBalance =
    loadTopupCoinBalance;

window.redeemTopupPromoCode =
    redeemTopupPromoCode;

window.refreshTopupPage = async function () {

    await loadTopupSettings();

    await loadTopupCoinBalance();
};
