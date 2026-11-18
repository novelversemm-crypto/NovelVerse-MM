
/* ===================================================
   NOVELVERSE MM - COIN MANAGEMENT SYSTEM
   File: js/coin.js
   Version: 1.1
=================================================== */


// ==========================================
// 1. CONFIGURATION
// ==========================================

const COIN_CONFIG = {

    balanceIds: [
        'header-coin-balance',
        'profile-coin-balance',
        'topup-current-balance'
    ],

    defaultBalance: 0,

    currencyName: 'Coins'

};


// ==========================================
// 2. COIN STATE
// ==========================================

let currentCoinBalance = 0;
let isCoinLoading = false;


// ==========================================
// 3. API REQUEST HELPER
// ==========================================

async function coinApiRequest(action, data = {}) {

    if (typeof window.authApiRequest !== 'function') {
        throw new Error('Authentication API ကို မချိတ်ဆက်ရသေးပါ။');
    }

    return await window.authApiRequest(action, data);

}


// ==========================================
// 4. GET CURRENT USER SESSION
// ==========================================

function getCoinUserSession() {

    if (typeof window.getAuthSession === 'function') {

        const session = window.getAuthSession();

        return session?.token || null;

    }

    try {

        const storedSession = localStorage.getItem(
            'novelverse_session'
        );

        if (!storedSession) return null;

        const session = JSON.parse(storedSession);

        return session?.token || null;

    } catch (error) {

        console.error('Coin Session Read Error:', error);

        return null;

    }

}


// ==========================================
// 5. FORMAT COIN NUMBER
// ==========================================

function formatCoinNumber(amount) {

    const number = Number(amount);

    if (!Number.isFinite(number) || number < 0) {
        return '0';
    }

    return number.toLocaleString('en-US');

}


// ==========================================
// 6. UPDATE COIN BALANCE UI
// ==========================================

function updateCoinBalanceUI(balance) {

    const amount = Number(balance);

    if (!Number.isFinite(amount) || amount < 0) {
        return;
    }

    currentCoinBalance = amount;

    COIN_CONFIG.balanceIds.forEach(id => {

        const element = document.getElementById(id);

        if (!element) return;

        element.textContent = formatCoinNumber(amount);

    });


    // အခြား JS ဖိုင်များက အသုံးပြုနိုင်ရန်

    window.currentCoinBalance = currentCoinBalance;

    window.dispatchEvent(
        new CustomEvent('coinBalanceUpdated', {
            detail: {
                balance: currentCoinBalance
            }
        })
    );

}


// ==========================================
// 7. LOAD COIN BALANCE
// ==========================================

async function loadCoinBalance() {

    if (isCoinLoading) {
        return currentCoinBalance;
    }

    const session = getCoinUserSession();

    if (!session) {

        updateCoinBalanceUI(0);

        return 0;

    }

    isCoinLoading = true;

    try {

        const result = await coinApiRequest(
            'getCoinBalance',
            {
                session
            }
        );


        if (
            typeof result.balance !== 'number' &&
            typeof result.balance !== 'string'
        ) {

            throw new Error(
                'Coin Balance Data မှားယွင်းနေပါသည်။'
            );

        }

        const balance = Number(result.balance);

        if (!Number.isFinite(balance) || balance < 0) {

            throw new Error(
                'Coin Balance တန်ဖိုး မမှန်ပါ။'
            );

        }

        updateCoinBalanceUI(balance);

        return balance;

    } catch (error) {

        console.error('Coin Balance Error:', error);

        return null;

    } finally {

        isCoinLoading = false;

    }

}


// ==========================================
// 8. REFRESH COIN BALANCE
// ==========================================

async function refreshCoinBalance() {

    return await loadCoinBalance();

}


// ==========================================
// 9. GET TRANSACTION HISTORY
// ==========================================

async function getCoinTransactionHistory() {

    const session = getCoinUserSession();

    if (!session) {

        throw new Error(
            'Transaction ကြည့်ရန် Login ဝင်ပါ။'
        );

    }

    const result = await coinApiRequest(
        'getCoinTransactions',
        {
            session
        }
    );

    return Array.isArray(result.transactions)
        ? result.transactions
        : [];

}


// ==========================================
// 10. RENDER TRANSACTION HISTORY
// ==========================================

function renderCoinTransactionHistory(transactions) {

    const container = document.getElementById(
        'coin-transaction-list'
    );

    const emptyState = document.getElementById(
        'transaction-empty-state'
    );

    if (!container) return;

    if (!Array.isArray(transactions) || transactions.length === 0) {

        container.innerHTML = '';

        if (emptyState) {
            emptyState.style.display = 'block';
        }

        return;

    }

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    container.innerHTML = '';

    transactions.forEach(transaction => {

        const amount = Number(transaction.amount) || 0;

        const isIncome =
            transaction.type === 'credit' ||
            transaction.type === 'income';

        const item = document.createElement('div');

        item.className = 'coin-transaction-item';

        const date = transaction.createdAt
            ? new Date(transaction.createdAt).toLocaleString()
            : '-';

        const title = String(
            transaction.description ||
            transaction.type ||
            'Transaction'
        );

        item.innerHTML = `
            <div class="transaction-info">

                <div class="transaction-title">
                    ${escapeCoinHtml(title)}
                </div>

                <div class="transaction-date">
                    ${escapeCoinHtml(date)}
                </div>

            </div>

            <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                ${isIncome ? '+' : '-'}${formatCoinNumber(amount)}
            </div>
        `;

        container.appendChild(item);

    });

}


// ==========================================
// 11. LOAD TRANSACTION HISTORY
// ==========================================

async function loadCoinTransactionHistory() {

    const container = document.getElementById(
        'coin-transaction-list'
    );

    if (!container) return;

    try {

        container.innerHTML = `
            <p class="coin-loading">
                Transaction များ ရယူနေသည်...
            </p>
        `;

        const transactions = await getCoinTransactionHistory();

        renderCoinTransactionHistory(transactions);

    } catch (error) {

        console.error('Transaction Error:', error);

        container.innerHTML = `
            <p class="coin-error">
                Transaction များ ရယူ၍မရပါ။
            </p>
        `;

    }

}


// ==========================================
// 12. SAFE HTML ESCAPE
// ==========================================

function escapeCoinHtml(value) {

    return String(value ?? '').replace(/[&<>"']/g, char => ({

        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'

    })[char]);

}


// ==========================================
// 13. INITIALIZE COIN SYSTEM
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    updateCoinBalanceUI(COIN_CONFIG.defaultBalance);

    if (getCoinUserSession()) {
        loadCoinBalance();
    }

});


// ==========================================
// 14. GLOBAL FUNCTIONS
// ==========================================

window.loadCoinBalance = loadCoinBalance;

window.refreshCoinBalance = refreshCoinBalance;

window.updateCoinBalanceUI = updateCoinBalanceUI;

window.getCoinTransactionHistory = getCoinTransactionHistory;

window.loadCoinTransactionHistory = loadCoinTransactionHistory;

// auth.js က ဒီနာမည်ကို ခေါ်ထားတဲ့အတွက် Alias ထည့်ပေးထားသည်။
window.loadTransactionHistory = loadCoinTransactionHistory;

window.renderCoinTransactionHistory = renderCoinTransactionHistory;
