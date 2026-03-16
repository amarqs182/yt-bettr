/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * Trusted Types Compliant: No innerHTML used.
 * Cinematic Refinement: High-Fidelity Animated Film Grain & Professional Tone Mapping.
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k) === 'true';

    // --- 1. SVG FILTERS (Safe DOM Construction) ---
    const injectSVG = () => {
        const id = 'ytl-svg-defs';
        if (document.getElementById(id)) return;

        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.id = id;
        svg.setAttribute('style', 'display:none');

        const defs = document.createElementNS(ns, "defs");

        // A. Sharpen Filter (Convolution Matrix)
        const sharpen = document.createElementNS(ns, "filter");
        sharpen.id = "ytl-sharpen";
        const convolve = document.createElementNS(ns, "feConvolveMatrix");
        convolve.setAttribute("order", "3");
        convolve.setAttribute("preserveAlpha", "true");
        convolve.setAttribute("kernelMatrix", "0 -1 0 -1 5 -1 0 -1 0");
        sharpen.appendChild(convolve);
        defs.appendChild(sharpen);

        // B. Professional Animated Grain Filter
        const grain = document.createElementNS(ns, "filter");
        grain.id = "ytl-grain";
        
        const turb = document.createElementNS(ns, "feTurbulence");
        turb.id = "ytl-grain-turb";
        turb.setAttribute("type", "fractalNoise");
        // baseFrequency 0.6 - 0.9 for fine 35mm grain
        turb.setAttribute("baseFrequency", "0.75");
        turb.setAttribute("numOctaves", "3");
        turb.setAttribute("stitchTiles", "stitch");
        grain.appendChild(turb);

        const sat = document.createElementNS(ns, "feColorMatrix");
        sat.setAttribute("type", "saturate");
        sat.setAttribute("values", "0");
        grain.appendChild(sat);

        // Professional Tone Mapping: Grain is more visible in midtones/shadows
        const trans = document.createElementNS(ns, "feComponentTransfer");
        const funcA = document.createElementNS(ns, "feFuncA");
        funcA.setAttribute("type", "table");
        // Values: Grain intensity mapped across brightness. 
        // We reduce it at 0.0 (deep blacks) and 1.0 (highlights) for realism.
        funcA.setAttribute("tableValues", "0 0.15 0.20 0.15 0.05"); 
        trans.appendChild(funcA);
        grain.appendChild(trans);

        const comp = document.createElementNS(ns, "feComposite");
        comp.setAttribute("operator", "in");
        comp.setAttribute("in2", "SourceGraphic");
        grain.appendChild(comp);

        defs.appendChild(grain);
        svg.appendChild(defs);

        const target = document.body || document.documentElement;
        target.appendChild(svg);
    };

    // --- 2. VISUAL ENGINE ---
    let grainSeed = 0;
    let grainInterval = null;

    const updateUI = () => {
        injectSVG();
        const styleId = 'ytl-premium-styles';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        const useHDR = getS('enhance_hdr');
        const useSharp = getS('enhance_sharpness');
        const useGrain = getS('enhance_grain');

        let filters = [];
        if (useHDR) filters.push('contrast(1.06) saturate(1.10) brightness(1.01)');
        if (useSharp) filters.push('url(#ytl-sharpen)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.length ? filters.join(' ') : 'none'} !important;
                will-change: filter;
            }
            .ytl-grain-overlay {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                pointer-events: none; z-index: 10;
                filter: url(#ytl-grain);
                display: ${useGrain ? 'block' : 'none'};
                mix-blend-mode: overlay;
                opacity: 0.6; /* Balanced for professional look */
            }
        `;

        // Ensure grain div exists
        const container = document.querySelector('.html5-video-container');
        if (container && !document.querySelector('.ytl-grain-overlay')) {
            const grain = document.createElement('div');
            grain.className = 'ytl-grain-overlay';
            container.appendChild(grain);
        }

        // Animation Loop for Real Grain (only when enabled)
        if (useGrain) {
            if (!grainInterval) {
                grainInterval = setInterval(() => {
                    const turb = document.getElementById('ytl-grain-turb');
                    if (turb) {
                        grainSeed = (grainSeed + 1) % 1000;
                        turb.setAttribute('seed', grainSeed.toString());
                    }
                }, 41); // ~24fps for cinematic noise feel
            }
        } else if (grainInterval) {
            clearInterval(grainInterval);
            grainInterval = null;
        }
    };

    // --- 3. AUDIO ENGINE ---
    let audioCtx, source, bass, treble, comp, gain;

    const updateAudio = () => {
        const active = getS('enhance_audio');
        const video = document.querySelector('video');
        if (!video) return;

        if (video.ytlAudioHooked) {
            const r = 0.1;
            if (bass) bass.gain.setTargetAtTime(active ? 3 : 0, 0, r);
            if (treble) treble.gain.setTargetAtTime(active ? 4.5 : 0, 0, r);
            if (gain) gain.gain.setTargetAtTime(active ? 1.1 : 1, 0, r);
            if (comp) comp.threshold.setTargetAtTime(active ? -22 : 0, 0, r);
            return;
        }

        if (!active) return;

        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            bass = audioCtx.createBiquadFilter(); bass.type = "lowshelf"; bass.frequency.value = 150;
            treble = audioCtx.createBiquadFilter(); treble.type = "highshelf"; treble.frequency.value = 4500;
            comp = audioCtx.createDynamicsCompressor();
            gain = audioCtx.createGain();

            source.connect(bass);
            bass.connect(treble);
            treble.connect(comp);
            comp.connect(gain);
            gain.connect(audioCtx.destination);

            video.ytlAudioHooked = true;
            updateAudio();
        } catch(e) {}
    };

    const run = () => { updateUI(); updateAudio(); };
    window.addEventListener('yt-lite-sync', run);
    window.addEventListener('yt-navigate-finish', () => setTimeout(run, 1000));
    document.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });
    
    setInterval(run, 3000);
    run();
})();
