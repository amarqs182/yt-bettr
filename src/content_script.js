/**
 * src/content_script.js
 *
 * Runs in ISOLATED world.
 * 1. Loads settings from chrome.storage.local.
 * 2. Mirrors them to document.documentElement.dataset for the MAIN world to see.
 * 3. Does NOT use inline scripts (to bypass YouTube CSP).
 */

const DEFAULTS = {
    block_av1:      true,
    block_vp9:      true,
    block_h264:     false,
    block_opus:     false,
    max_res:        'auto',
    max_fps:        'auto',
    ambient_off:    true,
    thumb_static:   true,
    thumb_lowres:   false,
    pause_loops:    true,
    hidden_pause:   false,
    disable_ln:     false,
    disable_ai_dub: true,
    eco_ui:         false,
    no_transparency: false,
    ab_experiments: false,
    theme:          'dark',
    enhance_sharpness: false,
    enhance_hdr:       false,
    enhance_audio:     false,
    enhance_grain:     false,
    run_mode:          'lite'
};

const syncToDataset = (settings) => {
    // We prefix each key with ytl- to avoid conflicts
    for (const [k, v] of Object.entries(settings)) {
        document.documentElement.setAttribute('data-ytl-' + k, String(v));
    }
    // Also dispatch a custom event that the MAIN world can hear
    window.dispatchEvent(new CustomEvent('yt-lite-sync'));
};

// Initial Fetch and Sync
chrome.storage.local.get(null, (stored) => {
    const opts = { ...DEFAULTS, ...stored };
    syncToDataset(opts);
});

// Live Sync on change (popup clicks)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const updates = {};
    for (const [key, { newValue }] of Object.entries(changes)) {
        updates[key] = newValue;
    }
    syncToDataset(updates);
});
