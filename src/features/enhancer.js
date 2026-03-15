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

    // --- 2. AUDIO ENHANCEMENTS (Aggressive Web Audio Hook) ---
    let audioCtx = null;
    let source = null;
    let compressor = null;
    let gainNode = null;
    let shelfFilter = null;

    const applyAudioFX = () => {
        if (!getSetting('enhance_audio')) {
            if (gainNode) gainNode.gain.value = 1.0;
            return;
        }

        const video = document.querySelector('video');
        if (!video) return;

        // If already hooked, just ensure settings are active
        if (video.ytLiteAudioHooked) {
            if (gainNode) gainNode.gain.value = 1.2; // 20% Boost
            if (shelfFilter) shelfFilter.gain.value = 4; // Agudos
            return;
        }

        try {
            // Check for CORS - YouTube often blocks MediaElementSource on official music videos
            // We set crossOrigin to anonymous to try and bypass, but YT usually blocks it server-side
            if (!video.getAttribute('crossorigin')) {
                video.setAttribute('crossorigin', 'anonymous');
            }

            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            
            // A. Voice & Clarity Filter (High Shelf)
            shelfFilter = audioCtx.createBiquadFilter();
            shelfFilter.type = "highshelf";
            shelfFilter.frequency.value = 3500;
            shelfFilter.gain.value = 4; // +4dB boost on highs for clarity

            // B. Volume Leveler (Compressor)
            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -24;
            compressor.knee.value = 30;
            compressor.ratio.value = 4;
            compressor.attack.value = 0.003;
            compressor.release.value = 0.25;

            // C. Pre-amp Gain
            gainNode = audioCtx.createGain();
            gainNode.gain.value = 1.2; // Slight boost to compensate compression

            // D. Stereo Widener (Haas Effect)
            const splitter = audioCtx.createChannelSplitter(2);
            const merger = audioCtx.createChannelMerger(2);
            const delay = audioCtx.createDelay();
            delay.delayTime.value = 0.025; // Increased to 25ms for noticeable "Surround" effect

            // Routing: Source -> Shelf -> Gain -> Compressor -> Splitter -> Merger (with delay)
            source.connect(shelfFilter);
            shelfFilter.connect(gainNode);
            gainNode.connect(compressor);
            compressor.connect(splitter);
            
            splitter.connect(merger, 0, 0); // L -> L (Normal)
            splitter.connect(delay, 1, 0);  // R -> Delay
            delay.connect(merger, 0, 1);    // Delay -> R (Delayed)
            
            merger.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
            console.log("YT Lite: Premium Audio Hooked (Clarity + Surround + Gain)");
        } catch (e) {
            console.warn("YT Lite: Audio Enhancement failed. Reason:", e.message);
            console.warn("Note: YouTube blocks audio processing on most Music Videos due to CORS security.");
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

    window.addEventListener('yt-navigate-finish', () => {
        setTimeout(run, 1500);
    });
    
    // Initial run
    setTimeout(run, 500);
    
    // Re-apply styles frequently to fight YT resets
    setInterval(updateVisualFX, 3000);

})();
