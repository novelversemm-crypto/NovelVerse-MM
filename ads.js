// ===================================================
// ADSTERRA MONETIZATION SYSTEM (OPTIMIZED & STABLE)
// ===================================================

const ADSTERRA_SMARTLINK = 'https://www.effectivecpmnetwork.com/ac1wu50yc2?key=6f15d6cb0e992f4dc81e81f99ddf50af';
const ADSTERRA_BANNER_KEY = 'f3787899025a5938079b7005a821f67a';

let clickCount = 0;

document.addEventListener('DOMContentLoaded', () => {
    // လျှော့ချထားသော Main Ad Slots များ
    const adSlotIds = [
        'ad-slot-header',
        'ad-slot-middle',
        'ad-slot-bottom',
        'ad-slot-hero',
        'ad-slot-status',
        'ad-slot-grid',
        'ad-slot-popular'
    ];

    // Page ပေါ်မှာ အမှန်တကယ်ရှိသော Ad Slots များကိုသာ Load လုပ်မည်
    adSlotIds.forEach(slotId => {
        loadBannerAdsById(slotId, ADSTERRA_BANNER_KEY, 468, 60);
    });

    // Load Popunder Script
    loadPopunderScript();

    // Setup Smartlink Triggers
    setupBalancedAds();
});

// 🎯 AD TRIGGERS (ADSTERRA SMARTLINK)
function setupBalancedAds() {
    document.addEventListener('click', (e) => {
        const targetedClick = e.target.closest(`
            .novel-card, 
            .chapter-item, 
            .chapter-nav-bar a, 
            .chapter-nav-bar button, 
            #hero-link,
            .status-btn,
            .genre-chip,
            .sort-btn,
            .font-btn
        `);

        if (targetedClick) {
            const lastClickTime = sessionStorage.getItem('adsterra_ad_last_click');
            const now = Date.now();

            if (!lastClickTime || (now - parseInt(lastClickTime)) > 30000) { 
                window.open(ADSTERRA_SMARTLINK, '_blank');
                sessionStorage.setItem('adsterra_ad_last_click', now.toString());
            }
        }
    }, true);

    document.addEventListener('click', () => {
        clickCount++;
        const lastGlobalAd = sessionStorage.getItem('global_ad_time');
        const now = Date.now();

        if (clickCount % 6 === 0) { 
            if (!lastGlobalAd || (now - parseInt(lastGlobalAd)) > 60000) {
                window.open(ADSTERRA_SMARTLINK, '_blank');
                sessionStorage.setItem('global_ad_time', now.toString());
            }
        }
    });
}

// 🖼️ DIRECT BANNER ADS LOADER (FIXED)
function loadBannerAdsById(slotId, adKey, width, height) {
    const slots = document.querySelectorAll(`#${slotId}`);
    if (!slots || slots.length === 0) return;

    slots.forEach(slot => {
        slot.innerHTML = ''; 

        const iframe = document.createElement('iframe');
        iframe.width = "100%";
        iframe.height = height + "px";
        iframe.style.border = "none";
        iframe.style.overflow = "hidden";
        iframe.scrolling = "no";
        
        // srcdoc သုံးခြင်းဖြင့် origin null ခေါ်ယူမှု CORS error ကို လျှော့ချပေးနိုင်ပါသည်
        iframe.srcdoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>body { margin: 0; padding: 0; text-align: center; background: transparent; }</style>
            </head>
            <body>
                <script type="text/javascript">
                    atOptions = {
                        'key' : '${adKey}',
                        'format' : 'iframe',
                        'height' : ${height},
                        'width' : ${width},
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="https://www.highperformanceformat.com/${adKey}/invoke.js"></script>
            </body>
            </html>
        `;
        
        slot.appendChild(iframe);
    });
}

// 💣 POPUNDER SCRIPT
function loadPopunderScript() {
    if (document.getElementById('adsterra-popunder')) return;
    const script = document.createElement('script');
    script.id = 'adsterra-popunder';
    script.src = 'https://pl30650646.effectivecpmnetwork.com/ee/58/ff/ee58ff0c7675a1456cecf66566fc0353.js';
    script.type = 'text/javascript';
    script.async = true;
    document.head.appendChild(script);
}