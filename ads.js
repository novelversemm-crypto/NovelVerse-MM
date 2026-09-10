// ===================================================
// ADSTERRA MONETIZATION SYSTEM (CLEAN BANNER ONLY)
// ===================================================

const ADSTERRA_BANNER_KEY = 'f3787899025a5938079b7005a821f67a';

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
});

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
