/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Reads settings from DOM attributes to bypass isolated world storage gap.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    // Helper to get settings from the HTML element's dataset
    const getSetting = (key) => {
        return document.documentElement.getAttribute('data-ytl-' + key) === 'true';
    };

    // --- 1. VISUAL FILTERS (CSS Injected) ---
    const updateVisualFX = () => {
        const useSharpness = getSetting('enhance_sharpness');
        const useHDR       = getSetting('enhance_hdr');
        
        const id = 'yt-lite-premium-fx';
        let style = document.getElementById(id);
        
        if (!useSharpness && !useHDR) {
            if (style) style.remove();
            return;
        }

        if (!style) {
            style = document.createElement('style');
            style.id = id;
            (document.head || document.documentElement).appendChild(style);
        }

        let filters = [];
        // Aggressive filters for visible impact
        if (useHDR) filters.push('contrast(1.15) saturate(1.35) brightness(1.04)');
        if (useSharpness) filters.push('contrast(1.03)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.join(' ')} !important;
                ${useSharpness ? 'image-rendering: -webkit-optimize-contrast !important; image-rendering: crisp-edges !important;' : ''}
            }
        `;
    };

    // --- 2. AUDIO ENHANCEMENTS (Dynamic Hook) ---
    let audioCtx = null;
    let compressor = null;

    const applyAudioFX = () => {
        if (!getSetting('enhance_audio')) {
            if (compressor) compressor.threshold.value = 0; // Bypass
            return;
        }

        const video = document.querySelector('video');
        if (!video) return;

        if (video.ytLiteAudioHooked) {
            if (compressor) compressor.threshold.value = -20;
            return;
        }

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioCtx.createMediaElementSource(video);
            
            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -20;
            compressor.knee.value = 30;
            compressor.ratio.value = 3;
            compressor.attack.value = 0.01;
            compressor.release.value = 0.25;

            source.connect(compressor);
            compressor.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
            console.log("YT Lite: Premium Audio Hooked");
        } catch (e) {
            // CORS limitation
        }
    };

    // Listen for sync event from isolated world
    window.addEventListener('yt-lite-sync', () => {
        updateVisualFX();
        applyAudioFX();
    });

    // Run on startup and navigation
    const run = () => {
        updateVisualFX();
        applyAudioFX();
    };

    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1500));
    
    // Initial run might need a delay to ensure Isolated world set the attributes
    setTimeout(run, 100);
    
    // Re-apply styles frequently to fight YT resets
    setInterval(updateVisualFX, 3000);

})();
