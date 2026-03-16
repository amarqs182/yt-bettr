/**
 * src/features/enhancer.js
 * Premium Visual and Audio Enhancements for High Mode.
 * - Grain: High-performance Animated Canvas Overlay with Live Intensity Slider.
 * - Visuals: Distinct SVG Sharpening and Natural HDR.
 * - Audio: Crossfading Pro-Equalizer (Instant Toggle).
 */

(function() {
    'use strict';

    if (window.self !== window.top || window.location.href === 'about:blank') return;

    const getS = (k) => document.documentElement.getAttribute('data-ytl-' + k);
    const getB = (k) => getS(k) === 'true';

    // --- 1. SVG SHARPEN FILTER ---
    const injectSVG = () => {
        const id = 'ytl-svg-defs';
        if (document.getElementById(id)) return;
        const ns = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(ns, "svg");
        svg.id = id;
        svg.setAttribute('style', 'display:none');
        const defs = document.createElementNS(ns, "defs");
        const filter = document.createElementNS(ns, "filter");
        filter.id = "ytl-sharpen";
        const matrix = document.createElementNS(ns, "feConvolveMatrix");
        matrix.setAttribute("order", "3");
        matrix.setAttribute("preserveAlpha", "true");
        matrix.setAttribute("kernelMatrix", "0 -1 0 -1 5 -1 0 -1 0");
        filter.appendChild(matrix);
        defs.appendChild(filter);
        svg.appendChild(defs);
        (document.body || document.documentElement).appendChild(svg);
    };

    // --- 2. PRO CANVAS GRAIN ENGINE ---
    let grainCanvas = null;
    let grainCtx = null;
    let grainFrames = [];
    let currentFrame = 0;
    let grainInterval = null;

    const initGrainPatterns = () => {
        if (grainFrames.length > 0) return;
        for (let f = 0; f < 12; f++) {
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = 128; // Smaller for speed
            const ctx = canvas.getContext('2d');
            const imgData = ctx.createImageData(128, 128);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const val = Math.random() * 255;
                data[i] = data[i+1] = data[i+2] = val;
                data[i+3] = 255;
            }
            ctx.putImageData(imgData, 0, 0);
            grainFrames.push(canvas);
        }
    };

    const updateGrain = () => {
        const useGrain = getB('enhance_grain');
        const rawIntensity = parseInt(getS('grain_intensity') || '15', 10);
        const intensity = rawIntensity / 100;
        
        // We target the video container specifically for best alignment
        const container = document.querySelector('.html5-video-container');
        if (!useGrain || !container) {
            if (grainCanvas) grainCanvas.style.display = 'none';
            if (grainInterval) { clearInterval(grainInterval); grainInterval = null; }
            return;
        }

        initGrainPatterns();

        if (!grainCanvas) {
            grainCanvas = document.createElement('canvas');
            grainCanvas.id = 'ytl-grain-canvas';
            // High z-index but pointer-events: none so it doesn't block player clicks
            grainCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:5;mix-blend-mode:overlay;';
            container.appendChild(grainCanvas);
            grainCtx = grainCanvas.getContext('2d');
        }

        grainCanvas.style.display = 'block';
        grainCanvas.style.opacity = intensity.toString();
        
        if (!grainInterval) {
            grainInterval = setInterval(() => {
                if (!getB('enhance_grain')) return;
                
                // Adjust canvas resolution to parent container
                if (grainCanvas.width !== container.offsetWidth || grainCanvas.height !== container.offsetHeight) {
                    grainCanvas.width = container.offsetWidth;
                    grainCanvas.height = container.offsetHeight;
                }
                
                if (grainCanvas.width === 0) return;

                currentFrame = (currentFrame + 1) % grainFrames.length;
                const pattern = grainCtx.createPattern(grainFrames[currentFrame], 'repeat');
                grainCtx.fillStyle = pattern;
                grainCtx.fillRect(0, 0, grainCanvas.width, grainCanvas.height);
            }, 45); // ~22fps cinematic noise
        }
    };

    // --- 3. VISUAL ENGINE ---
    const updateVisuals = () => {
        injectSVG();
        const styleId = 'ytl-premium-styles';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }

        const useHDR = getB('enhance_hdr');
        const useSharp = getB('enhance_sharpness');

        let filters = [];
        // True HDR: ONLY deep contrast and saturation (no artificial sharpening)
        if (useHDR) filters.push('contrast(1.05) saturate(1.10)');
        // True Sharpness: Using the convolution matrix
        if (useSharp) filters.push('url(#ytl-sharpen)');

        style.textContent = `
            video.html5-main-video {
                filter: ${filters.length ? filters.join(' ') : 'none'} !important;
                will-change: filter;
            }
        `;
        updateGrain();
    };

    // --- 4. AUDIO ENGINE (Crossfade Logic) ---
    let audioCtx, source, bassNode, trebleNode, compressorNode, dryNode, wetNode;

    const setupAudio = (video) => {
        if (video.ytlAudioHooked) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            source = audioCtx.createMediaElementSource(video);
            
            // Nodes
            bassNode = audioCtx.createBiquadFilter(); 
            bassNode.type = "lowshelf"; bassNode.frequency.value = 150;
            
            trebleNode = audioCtx.createBiquadFilter(); 
            trebleNode.type = "highshelf"; trebleNode.frequency.value = 4500;
            
            compressorNode = audioCtx.createDynamicsCompressor();
            compressorNode.threshold.value = -22;
            compressorNode.ratio.value = 3;

            // Fader System
            dryNode = audioCtx.createGain();
            wetNode = audioCtx.createGain();

            // Chain: Source -> Dry -> Destination
            source.connect(dryNode);
            dryNode.connect(audioCtx.destination);

            // Chain: Source -> FX -> Wet -> Destination
            source.connect(bassNode);
            bassNode.connect(trebleNode);
            trebleNode.connect(compressorNode);
            compressorNode.connect(wetNode);
            wetNode.connect(audioCtx.destination);

            video.ytlAudioHooked = true;
            console.log("YT Lite: Audio Engine Initialized");
        } catch(e) {
            console.warn("YT Lite: Audio Hook blocked (CORS)");
        }
    };

    const updateAudioLive = () => {
        const active = getB('enhance_audio');
        const video = document.querySelector('video');
        if (!video) return;

        if (!video.ytlAudioHooked) setupAudio(video);
        if (!video.ytlAudioHooked) return;

        const ramp = 0.1;
        // CROSSFADE: Swap between Dry and Wet signals instantly
        if (dryNode) dryNode.gain.setTargetAtTime(active ? 0 : 1, 0, ramp);
        if (wetNode) wetNode.gain.setTargetAtTime(active ? 1 : 0, 0, ramp);
        
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    };

    const run = () => { updateVisuals(); updateAudioLive(); };
    window.addEventListener('yt-lite-sync', run);
    window.addEventListener('yt-navigate-finish', () => {
        setTimeout(run, 1500);
    });
    document.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });
    
    setInterval(run, 4000);
    run();
})();
