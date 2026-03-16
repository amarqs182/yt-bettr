/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * - Destaque <>: Better HDR (Contrast + Saturation)
 * - Nitidez /|\: Real SVG Convolution Sharpening
 * - Granulação (*): Modern Film Grain via SVG Turbulence
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. SVG FILTER DEFINITIONS ---
    const injectSVGFilters = () => {
        const id = 'yt-lite-svg-filters';
        if (document.getElementById(id)) return;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = id;
        svg.style.display = 'none';
        svg.innerHTML = `
            <defs>
                <!-- Real Sharpening Filter (Convolution Matrix) -->
                <filter id="ytl-filter-sharpen">
                    <feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" />
                </filter>

                <!-- Modern Film Grain Filter -->
                <filter id="ytl-filter-grain">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                    <feColorMatrix type="saturate" values="0" />
                    <feComponentTransfer>
                        <feFuncR type="linear" slope="0.15" />
                        <feFuncG type="linear" slope="0.15" />
                        <feFuncB type="linear" slope="0.15" />
                        <feFuncA type="linear" slope="0.05" />
                    </feComponentTransfer>
                    <feComposite operator="in" in2="SourceGraphic" />
                </filter>
            </defs>
        `;
        (document.head || document.documentElement).appendChild(svg);
    };

    // --- 2. LIVE VISUAL FILTERS ---
    const updateVisualFX = () => {
        const useDestaque = getS('enhance_hdr');
        const useNitidez  = getS('enhance_sharpness');
        const useGrain    = getS('enhance_grain');
        
        const styleId = 'yt-lite-premium-fx';
        let style = document.getElementById(styleId);
        
        if (!useDestaque && !useNitidez && !useGrain) {
            if (style) style.remove();
            return;
        }

        injectSVGFilters();

        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            (document.head || document.documentElement).appendChild(style);
        }

        let cssFilters = [];
        // Destaque <> (Combined HDR + Depth)
        if (useDestaque) {
            cssFilters.push('contrast(1.08) saturate(1.15) brightness(1.02)');
        }
        
        // Nitidez /|\ (Real SVG Sharpening)
        if (useNitidez) {
            cssFilters.push('url(#ytl-filter-sharpen)');
        }

        // Apply filters to video element
        style.textContent = `
            video.html5-main-video {
                filter: ${cssFilters.join(' ')} !important;
                will-change: filter;
            }
            
            /* Grain Overlay (Applied via pseudo-element on the container to avoid blocking video interactions) */
            .html5-video-container::after {
                content: "";
                position: absolute;
                top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none;
                z-index: 1;
                ${useGrain ? 'filter: url(#ytl-filter-grain); opacity: 1;' : 'display: none;'}
            }
        `;
    };

    // --- 3. AUDIO ENHANCEMENTS (V-Shape Signature) ---
    let audioCtx = null;
    let source = null;
    let bassBoost = null;
    let trebleBoost = null;
    let compressor = null;
    let gainNode = null;

    const applyAudioFX = () => {
        const active = getS('enhance_audio');
        const video = document.querySelector('video');
        if (!video) return;

        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

        if (video.ytLiteAudioHooked) {
            const ramp = 0.05;
            if (bassBoost)   bassBoost.gain.setTargetAtTime(active ? 3.5 : 0, 0, ramp);
            if (trebleBoost) trebleBoost.gain.setTargetAtTime(active ? 4.5 : 0, 0, ramp);
            if (gainNode)    gainNode.gain.setTargetAtTime(active ? 1.15 : 1.0, 0, ramp);
            if (compressor) {
                compressor.threshold.setTargetAtTime(active ? -22 : 0, 0, ramp);
                compressor.ratio.setTargetAtTime(active ? 3 : 1, 0, ramp);
            }
            return;
        }

        if (!active) return;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            
            bassBoost = audioCtx.createBiquadFilter();
            bassBoost.type = "lowshelf";
            bassBoost.frequency.value = 150;
            bassBoost.gain.value = 3.5;

            trebleBoost = audioCtx.createBiquadFilter();
            trebleBoost.type = "highshelf";
            trebleBoost.frequency.value = 4500;
            trebleBoost.gain.value = 4.5;

            compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -22;
            compressor.ratio.value = 3;

            gainNode = audioCtx.createGain();
            gainNode.gain.value = 1.15;

            source.connect(bassBoost);
            bassBoost.connect(trebleBoost);
            trebleBoost.connect(compressor);
            compressor.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            video.ytLiteAudioHooked = true;
        } catch (e) {
            console.warn("YT Lite: Audio CORS restricted.");
        }
    };

    document.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });

    window.addEventListener('yt-lite-sync', () => {
        updateVisualFX();
        applyAudioFX();
    });

    const run = () => {
        updateVisualFX();
        applyAudioFX();
    };

    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1500));
    setTimeout(run, 500);
    setInterval(updateVisualFX, 4000);

})();
