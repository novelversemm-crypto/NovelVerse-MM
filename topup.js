
/* ==========================================
   NOVELVERSE MM — TOP-UP SYSTEM
   Payment Settings / Copy / Promo Redemption
   Package Cards: DISPLAY ONLY
   ========================================== */


/* ==========================================
   1. TOP-UP CONFIGURATION
   ========================================== */

const TOPUP_CONFIG = {

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


let isPromoRedeeming = false;


/* ==========================================
   2. API HELPER
   ========================================== */

async function topupApiRequest(action, data = {}) {

    if (typeof window.authApiRequest !== 'function') {

        throw new Error(
            'Authentication API မတွေ့ပါ။ auth.js ကို စစ်ဆေးပါ။'
        );
    }

    return await window.authApiRequest(action, data);
}


/* ==========================================
   3. MESSAGE HELPERS
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
   4. NUMBER FORMAT
   ========================================== */

function formatTopupNumber(number) {

    const value = Number(number || 0);

    return value.toLocaleString('en-US');
}


/* ==========================================
   5. UPDATE TEXT ELEMENT
   ========================================== */

function updateTopupText(elementId, value) {

    const element = document.getElementById(elementId);

    if (!element) return;

    if (value === undefined || value === null) {
        return;
    }

    element.textContent = String(value);
}


/* ==========================================
   6. LOAD PAYMENT SETTINGS
   ========================================== */

async function loadTopupSettings() {

    try {

        const result = await topupApiRequest(
            'getTopupSettings'
        );

        if (!result || result.success === false) {

            throw new Error(
                result?.message ||
                'Payment Settings ရယူ၍ မရပါ။'
            );
        }

        const settings = result.settings || {};


        // KBZPay Information

        updateTopupText(
            'kbzpay-account-name',
            settings.kbzpayAccountName
        );

        updateTopupText(
            'kbzpay-phone',
            settings.kbzpayPhone
        );


        // WavePay Information

        updateTopupText(
            'wavepay-account-name',
            settings.wavepayAccountName
        );

        updateTopupText(
            'wavepay-phone',
            settings.wavepayPhone
        );


        // Admin Telegram Link

        const telegramLink = document.getElementById(
            'admin-telegram-link'
        );

        if (telegramLink) {

            const telegramUrl = String(
                settings.telegramUrl || ''
            ).trim();

            if (
                /^https:\/\/(t\.me|telegram\.me)\//i.test(telegramUrl)
            ) {

                telegramLink.href = telegramUrl;

                telegramLink.target = '_blank';

                telegramLink.rel = 'noopener noreferrer';

                telegramLink.style.display = '';

            } else {

                telegramLink.removeAttribute('href');

                telegramLink.style.display = 'none';
            }
        }

        return settings;

    } catch (error) {

        console.error(
            'Top-up Settings Error:',
            error
        );

        showTopupError(
            'ငွေလွှဲအကောင့်အချက်အလက်များ ရယူ၍မရပါ။ ခဏနေမှ ပြန်လည်ကြိုးစားပေးပါ။'
        );

        return null;
    }
}


/* ==========================================
   7. COPY PAYMENT INFORMATION
   ========================================== */

async function copyTopupText(text, button) {

    if (!text) {

        showTopupError(
            'Copy ကူးရန် အချက်အလက် မရှိသေးပါ။'
        );

        return;
    }

    try {

        if (
            !navigator.clipboard ||
            typeof navigator.clipboard.writeText !== 'function'
        ) {

            throw new Error(
                'CLIPBOARD_NOT_AVAILABLE'
            );
        }

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
   8. COPY BUTTON SUCCESS
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
   9. SETUP COPY BUTTONS
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
   10. REDEEM PROMO CODE
   ========================================== */

async function redeemTopupPromoCode() {

    if (isPromoRedeeming) return;


    hideTopupMessage(
        TOPUP_CONFIG.promoErrorId
    );

    hideTopupMessage(
        TOPUP_CONFIG.promoSuccessId
    );


    // Check Login Status

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

        input.focus();

        return;
    }


    isPromoRedeeming = true;

    const originalButtonText = button.textContent;

    button.disabled = true;

    button.textContent = 'Verifying...';


    try {

        // Get Current Session

        if (typeof window.getAuthSession !== 'function') {

            throw new Error(
                'Login Session စစ်ဆေးမှု မရရှိပါ။'
            );
        }

        const session = window.getAuthSession();

        if (!session || !session.token) {

            throw new Error(
                'Login Session မတွေ့ပါ။ Login ပြန်ဝင်ပေးပါ။'
            );
        }


        // Send Promo Code to Backend

        const result = await topupApiRequest(
            'redeemPromoCode',
            {
                token: session.token,
                code: promoCode
            }
        );


        if (!result || result.success === false) {

            throw new Error(
                result?.message ||
                'Promo Code အသုံးပြုခြင်း မအောင်မြင်ပါ။'
            );
        }


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
            result.message ||
            'Promo Code အသုံးပြုခြင်း အောင်မြင်ပါသည်။';


        if (
            Number.isSafeInteger(receivedCoins) &&
            receivedCoins > 0
        ) {

            successMessage +=
                ` ရရှိသော Coins: ${formatTopupNumber(receivedCoins)}`;
        }


        showTopupSuccess(successMessage);


        // Refresh Coin Balance

        if (
            typeof window.refreshCoinBalance === 'function'
        ) {

            await window.refreshCoinBalance();

        } else if (
            Number.isSafeInteger(newBalance) &&
            newBalance >= 0 &&
            typeof window.updateCoinBalanceUI === 'function'
        ) {

            window.updateCoinBalanceUI(newBalance);
        }


        // Refresh Transaction History

        if (
            typeof window.loadCoinTransactionHistory === 'function'
        ) {

            await window.loadCoinTransactionHistory();

        } else if (
            typeof window.loadTransactionHistory === 'function'
        ) {

            await window.loadTransactionHistory();
        }

    } catch (error) {

        showTopupError(
            error.message ||
            'Promo Code အသုံးပြုခြင်း မအောင်မြင်ပါ။'
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
   11. SETUP PROMO REDEMPTION
   ========================================== */

function setupPromoRedemption() {

    const button = document.getElementById(
        TOPUP_CONFIG.redeemButtonId
    );

    const input = document.getElementById(
        TOPUP_CONFIG.promoInputId
    );


    // Redeem Button

    if (
        button &&
        button.dataset.promoReady !== 'true'
    ) {

        button.dataset.promoReady = 'true';

        button.addEventListener(
            'click',
            redeemTopupPromoCode
        );
    }


    // Enter Key Support

    if (
        input &&
        input.dataset.promoReady !== 'true'
    ) {

        input.dataset.promoReady = 'true';

        input.addEventListener('keydown', event => {

            if (event.key === 'Enter') {

                event.preventDefault();

                redeemTopupPromoCode();
            }
        });


        // Hide Previous Messages When Typing

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
   12. LOAD CURRENT COIN BALANCE
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


    if (
        typeof window.refreshCoinBalance === 'function'
    ) {

        await window.refreshCoinBalance();
    }
}


/* ==========================================
   13. INITIALIZE TOP-UP PAGE
   ========================================== */

document.addEventListener('DOMContentLoaded', async () => {

    // Run Only on Top-up Page

    if (
        !document.getElementById(
            TOPUP_CONFIG.promoInputId
        )
    ) {
        return;
    }


    // Setup Page Functions

    setupTopupCopyButtons();

    setupPromoRedemption();


    // Load Payment Settings and Coin Balance

    await Promise.allSettled([

        loadTopupSettings(),

        loadTopupCoinBalance()

    ]);
});


/* ==========================================
   14. GLOBAL FUNCTIONS
   ========================================== */

window.loadTopupSettings =
    loadTopupSettings;

window.loadTopupCoinBalance =
    loadTopupCoinBalance;

window.redeemTopupPromoCode =
    redeemTopupPromoCode;


window.refreshTopupPage = async function () {

    await Promise.allSettled([

        loadTopupSettings(),

        loadTopupCoinBalance()

    ]);
};
