/**
 * VuMeter - Visualizador de audio tipo VU Meter profesional
 *
 * Analiza el stream de audio en tiempo real usando Web Audio API
 * (AnalyserNode + getByteFrequencyData) y grafica el espectro en
 * barras con VU ballistics profesionales.
 *
 * Pipeline:
 *   1. Promedio por banda (FFT log-espaciado, 30Hz-16kHz)
 *   2. Propagación de energía entre barras vecinas (10/5/2.5%)
 *   3. Auto-sensibilidad por energía promedio (target 50% del alto)
 *   4. Suavizado horizontal + soft-knee compression (asymptote 0.85)
 *   5. VU ballistics (ataque rápido 0.5, decay lento 0.08)
 *
 * HTML esperado en el template:
 *   <div id="vumeter" class="vumeter">
 *     <div id="vumeter-bars" class="vumeter-bars"></div>
 *   </div>
 *
 * El <audio> debe tener crossorigin="anonymous" para que el
 * AnalyserNode funcione sin CORS-taint (ipstream.cl envía
 * Access-Control-Allow-Origin: *).
 */
export default class VuMeter {
  constructor(options = {}) {
    this.opts = {
      audioId: options.audioId || 'radio-audio',
      containerId: options.containerId || 'vumeter',
      barsId: options.barsId || 'vumeter-bars',
      titleId: options.titleId || 'track-title-main',
      bitrateId: options.bitrateId || 'bitrate',
      // Personalización
      sensitivity: options.sensitivity ?? 1.0,
      minLevel: options.minLevel ?? 0.04,
      height: options.height || null, // null = auto desde CSS
    };
    this.s = null; // estado del visualizador
  }

  // ===============================================================
  // INIT: construye las barras, configura observers, intenta
  // análisis real de audio.
  // ===============================================================
  init() {
    if (this.s) return;
    const container = document.getElementById(this.opts.containerId);
    const barsEl = document.getElementById(this.opts.barsId);
    const audio = document.getElementById(this.opts.audioId);
    if (!container || !barsEl) return;

    const containerH = container.clientHeight || 96;
    const cs = window.getComputedStyle(container);
    const padBottom = parseFloat(cs.paddingBottom) || 0;
    const maxBarH = Math.max(40, containerH - padBottom - 4);

    this.s = {
      bars: [],
      smoothed: [],
      bands: [],
      container,
      barsEl,
      audio,
      running: false,
      rafId: null,
      maxBarH,
      // Burst on song change
      burstUntil: 0,
      burstStrength: 0,
      bitrateScale: 0.7,
      lastTitle: '',
      // Real analysis
      mode: 'fake',
      ctx: null,
      analyser: null,
      data: null,
      stream: null,
      source: null,
      // Config
      sensitivity: this.opts.sensitivity,
      minLevel: this.opts.minLevel,
      sampleRate: 44100
    };

    this._buildBars();
    if (audio) this._tryRealAudio();

    // Resize: recalcular barras y altura
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => {
        if (!this.s) return;
        this._buildBars();
        const cH = this.s.container.clientHeight || 96;
        const cs2 = window.getComputedStyle(this.s.container);
        const pB = parseFloat(cs2.paddingBottom) || 0;
        this.s.maxBarH = Math.max(40, cH - pB - 4);
      });
      ro.observe(container);
      this.s.ro = ro;
    }

    // Detectar cambio de canción → burst de energía
    const titleEl = document.getElementById(this.opts.titleId);
    if (titleEl && window.MutationObserver) {
      this.s.titleEl = titleEl;
      this.s.titleObserver = new MutationObserver(() => {
        const t = (titleEl.textContent || '').trim();
        if (t && t !== this.s.lastTitle) {
          this.s.lastTitle = t;
          this.s.burstUntil = performance.now() + 3500;
          this.s.burstStrength = 1;
        }
      });
      this.s.titleObserver.observe(titleEl, {
        childList: true, characterData: true, subtree: true
      });
      this.s.lastTitle = (titleEl.textContent || '').trim();
    }

    // Polling de bitrate (cada 4s) — escala la intensidad según
    // la calidad del stream (128kbps más "lleno" que 64kbps)
    this.s.bitrateTimer = setInterval(() => {
      const el = document.getElementById(this.opts.bitrateId);
      if (!el) return;
      const kbps = parseInt(el.textContent, 10);
      if (!isNaN(kbps) && kbps > 0) {
        this.s.bitrateScale = Math.min(1, 0.4 + kbps / 400);
      }
    }, 4000);
  }

  // ===============================================================
  // PUBLIC GETTERS: para que el AudioEnhancer pueda re-cablear
  // el grafo sin necesidad de un segundo createMediaElementSource.
  // ===============================================================
  getAudioContext() {
    return this.s ? this.s.ctx : null;
  }

  getSourceNode() {
    return this.s ? this.s.source : null;
  }

  getAnalyserNode() {
    return this.s ? this.s.analyser : null;
  }

  isRealAnalysisActive() {
    return !!(this.s && this.s.mode === 'real' && this.s.source);
  }

  // ===============================================================
  // ANÁLISIS REAL: Web Audio API
  // ===============================================================
  _tryRealAudio() {
    const v = this.s;
    if (!v || !v.audio) return;
    if (v.mode === 'real' || v.source) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;

      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(v.audio);
      const analyser = ctx.createAnalyser();
      // fftSize 2048 = 1024 bins. Resolución 44100/2048 ≈ 21.5Hz/bin
      analyser.fftSize = 2048;
      // Smoothing alto: datos estables. La "bola" del VU se hace
      // con lerp en el loop de animación, no acá.
      analyser.smoothingTimeConstant = 0.8;

      source.connect(analyser);
      analyser.connect(ctx.destination);

      v.ctx = ctx;
      v.source = source;
      v.analyser = analyser;
      v.data = new Uint8Array(analyser.frequencyBinCount);
      v.mode = 'real';
      if (v.bars.length) {
        const sr = ctx.sampleRate || v.sampleRate;
        v.sampleRate = sr;
        v.bands = this._computeBands(v.bars.length, analyser.frequencyBinCount, sr);
      }
      console.info('VuMeter: análisis real habilitado');
      window.dispatchEvent(new CustomEvent('vumeter:realanalysis', { detail: { vuMeter: this } }));
    } catch (e) {
      console.warn('VuMeter: createMediaElementSource falló, probando captureStream', e);
      v.source = null;
      this._tryCaptureStream();
    }
  }

  // Fallback con captureStream (no redirige el audio)
  _tryCaptureStream() {
    const v = this.s;
    if (!v || !v.audio) return;
    if (v.mode === 'real') return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const capture = v.audio.captureStream || v.audio.mozCaptureStream;
      if (typeof capture !== 'function') {
        console.info('VuMeter: captureStream no soportado, fallback');
        v.mode = 'fake';
        return;
      }
      const stream = capture.call(v.audio);
      if (!stream) {
        v.mode = 'fake';
        return;
      }
      const ctx = new Ctx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      // NO conectar a destination — el audio sale por el <audio>

      v.ctx = ctx;
      v.analyser = analyser;
      v.data = new Uint8Array(analyser.frequencyBinCount);
      v.stream = stream;
      v.mode = 'real';
      if (v.bars.length) {
        const sr = ctx.sampleRate || v.sampleRate;
        v.sampleRate = sr;
        v.bands = this._computeBands(v.bars.length, analyser.frequencyBinCount, sr);
      }
      console.info('VuMeter: análisis real habilitado (captureStream)');
      window.dispatchEvent(new CustomEvent('vumeter:realaudiofallback', { detail: { vuMeter: this, mode: 'captureStream' } }));
    } catch (e) {
      console.warn('VuMeter: captureStream falló, fallback', e);
      v.mode = 'fake';
    }
  }

  // ===============================================================
  // BARRAS: crea los elementos <span> según el ancho disponible
  // ===============================================================
  _buildBars() {
    const v = this.s;
    if (!v) return;
    const containerW = v.container.clientWidth;
    if (!containerW) return;

    const cs = window.getComputedStyle(v.barsEl);
    const gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || 3;
    const minBarW = 6;
    const slot = minBarW + gap;
    const count = Math.max(8, Math.floor(containerW / slot));

    if (v.bars.length === count) {
      for (const bar of v.bars) bar.style.height = '14px';
      return;
    }

    v.barsEl.innerHTML = '';
    v.bars = [];
    v.smoothed = new Array(count).fill(0);
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.style.height = '14px';
      frag.appendChild(s);
      v.bars.push(s);
    }
    v.barsEl.appendChild(frag);

    v.bands = this._computeBands(count, 1024, v.sampleRate);
  }

  // Divide el espectro en N bandas log-espaciadas (30Hz - 16kHz)
  _computeBands(numBars, numBins, sampleRate) {
    const bands = [];
    const minFreq = 30;
    const maxFreq = 16000;
    const binWidth = sampleRate / (numBins * 2);
    const ratio = Math.pow(maxFreq / minFreq, 1 / numBars);

    for (let i = 0; i < numBars; i++) {
      const f1 = minFreq * Math.pow(ratio, i);
      const f2 = minFreq * Math.pow(ratio, i + 1);
      const b1 = Math.max(0, Math.floor(f1 / binWidth));
      const b2 = Math.min(numBins - 1, Math.ceil(f2 / binWidth));
      const maxBin = b2 > b1 ? b2 : b1 + 1;
      bands.push({ minBin: b1, maxBin });
    }
    return bands;
  }

  // ===============================================================
  // START: arranca el loop de animación con requestAnimationFrame
  // ===============================================================
  start() {
    if (!this.s || this.s.running) return;
    this.s.running = true;
    this.s.container.classList.add('playing');

    // Asegurar buffers alineados
    if (this.s.smoothed.length !== this.s.bars.length) {
      this.s.smoothed = new Array(this.s.bars.length).fill(0);
    }

    // El AudioContext se crea en init() sin gesto del usuario, por lo
    // que los navegadores lo dejan en 'suspended'. Si el <audio> ya está
    // conectado al grafo vía MediaElementSource, el sonido no se oye
    // hasta que el contexto pase a 'running'. Lo reanudamos acá, que
    // sí se ejecuta en respuesta al click del usuario (cumple la
    // autoplay policy de los navegadores).
    if (this.s.ctx && this.s.ctx.state === 'suspended') {
      this.s.ctx.resume().catch((err) => {
        console.warn('VuMeter: no se pudo reanudar el AudioContext', err);
      });
    }

    // Crear el AudioContext en respuesta al click del usuario
    // (así arranca en "running" state y el audio sigue sonando)
    if (this.s.mode === 'fake') {
      this._tryRealAudio();
    }

    const tick = () => {
      if (!this.s || !this.s.running) return;
      const now = performance.now();

      // ====== BURST (canción nueva) ======
      let burst = 0;
      if (this.s.burstUntil > now) {
        const remaining = (this.s.burstUntil - now) / 3500;
        if (remaining > 0.95) burst = 1.2;
        else burst = this.s.burstStrength * remaining;
        this.s.burstStrength *= 0.992;
      }

      // ====== Obtener datos reales del FFT ======
      let realLevels = null;
      if (this.s.mode === 'real' && this.s.analyser) {
        this.s.analyser.getByteFrequencyData(this.s.data);
        realLevels = this.s.data;
      }

      const barsLen = this.s.bars.length;
      const smoothed = this.s.smoothed;
      const max = this.s.maxBarH;
      const dataLen = realLevels ? realLevels.length : 0;

      // =========================================================
      // PIPELINE PROFESIONAL: 4 pasadas + auto-sens + soft-knee
      // =========================================================
      if (realLevels && this.s.bands && this.s.bands.length === barsLen) {
        if (!this.s._raw || this.s._raw.length !== barsLen) {
          this.s._raw = new Array(barsLen);
          this.s._prop = new Array(barsLen);
        }

        // 1. Promedio por banda
        for (let i = 0; i < barsLen; i++) {
          const band = this.s.bands[i];
          let sum = 0, count = 0;
          const bmax = Math.min(band.maxBin + 1, dataLen);
          for (let j = band.minBin; j < bmax; j++) {
            sum += realLevels[j];
            count++;
          }
          this.s._raw[i] = (count > 0 ? sum / count : 0) / 255;
        }

        // 2. Propagación de energía (10/5/2.5% a 3 vecinos c/lado)
        for (let i = 0; i < barsLen; i++) this.s._prop[i] = 0;
        for (let i = 0; i < barsLen; i++) {
          const energy = this.s._raw[i];
          if (energy > 0.05) {
            const f1 = energy * 0.10;
            const f2 = energy * 0.05;
            const f3 = energy * 0.025;
            if (i + 1 < barsLen) this.s._prop[i + 1] += f1;
            if (i + 2 < barsLen) this.s._prop[i + 2] += f2;
            if (i + 3 < barsLen) this.s._prop[i + 3] += f3;
            if (i - 1 >= 0) this.s._prop[i - 1] += f1;
            if (i - 2 >= 0) this.s._prop[i - 2] += f2;
            if (i - 3 >= 0) this.s._prop[i - 3] += f3;
          }
        }

        // 3. Auto-sensibilidad por energía promedio (target 50%)
        let rawSum = 0;
        for (let i = 0; i < barsLen; i++) rawSum += this.s._raw[i];
        const rawAvg = rawSum / barsLen;

        if (this.s.longEnergy === undefined) this.s.longEnergy = 0.2;
        this.s.longEnergy = this.s.longEnergy * 0.995 + rawAvg * 0.005;

        const TARGET = 0.5;
        const autoSens = Math.max(0.4, Math.min(2.5,
          TARGET / Math.max(this.s.longEnergy, 0.05)
        ));
        const finalSens = autoSens * this.s.sensitivity;

        // 4. Soft-knee compression (sin límite duro)
        // Por debajo de knee=0.5 es lineal. Por encima se comprime
        // con curva exponencial con asymptote en 0.85 (15% margin).
        const knee = 0.5;
        const maxGain = 0.35;
        const softKnee = (x) => {
          if (x <= knee) return x;
          return knee + maxGain * (1 - Math.exp(-(x - knee) * 2.5));
        };

        // 5. Suavizado horizontal + VU ballistics
        for (let i = 0; i < barsLen; i++) {
          const combined = this.s._raw[i] + this.s._prop[i];
          const left = i > 0 ? this.s._raw[i - 1] + this.s._prop[i - 1] : combined;
          const right = i < barsLen - 1
            ? this.s._raw[i + 1] + this.s._prop[i + 1]
            : combined;
          const hSmooth = combined * 0.5 + left * 0.25 + right * 0.25;

          let level = hSmooth * finalSens;
          level = softKnee(level);
          level = Math.max(this.s.minLevel, level);

          // VU BALLISTICS — lerp con ataque rápido, decay lento
          const prev = smoothed[i];
          const lerpFactor = level > prev ? 0.50 : 0.08;
          const next = prev + (level - prev) * lerpFactor;
          smoothed[i] = next < 0 ? 0 : next;

          const visualLevel = smoothed[i] > 1 ? 1 : smoothed[i];
          this.s.bars[i].style.height = (6 + visualLevel * (max - 6)) + 'px';
        }

        this.s.rafId = requestAnimationFrame(tick);
        return;
      }

      // Fallback sintético (sin análisis real)
      this._renderSyntheticFrame(now, burst, barsLen, smoothed, max);
      this.s.rafId = requestAnimationFrame(tick);
    };

    tick();
  }

  // Fallback cuando no hay análisis real — animación sintética
  _renderSyntheticFrame(now, burst, barsLen, smoothed, max) {
    const t = now * 0.001;
    const v = this.s;

    for (let i = 0; i < barsLen; i++) {
      const norm = i / barsLen;
      const dx = (norm - 0.35) * 1.8;
      const spectrum = Math.max(0.15, 1 - dx * dx);
      const bass = 0.5 + 0.5 * Math.sin(t * 1.4 + norm * 2.5);
      const mid = 0.5 + 0.5 * Math.sin(t * 3.5 + norm * 5.5);
      const treble = 0.5 + 0.5 * Math.sin(t * 7.5 + norm * 10);
      let h = (bass * 0.22 + mid * 0.18 + treble * 0.10) * spectrum;
      if (burst > 0) h += burst * 0.6;

      const final = Math.max(0, h) * v.intensity * v.bitrateScale;
      const prev = smoothed[i];
      const next = prev + (final - prev) * 0.5;
      smoothed[i] = next < 0 ? 0 : (next > 1 ? 1 : next);
      v.bars[i].style.height = (6 + smoothed[i] * (max - 6)) + 'px';
    }
  }

  // ===============================================================
  // STOP: detiene el loop con transición suave
  // ===============================================================
  stop() {
    if (!this.s) return;
    this.s.running = false;
    if (this.s.rafId) cancelAnimationFrame(this.s.rafId);
    this.s.container.classList.remove('playing');

    // Altura idle: barras escalonadas para que no queden todas iguales
    for (let i = 0; i < this.s.bars.length; i++) {
      this.s.bars[i].style.height = (8 + (i % 5) * 3) + 'px';
    }
  }

  // ===============================================================
  // DESTROY: limpia todos los recursos
  // ===============================================================
  destroy() {
    if (!this.s) return;
    if (this.s.running && this.s.rafId) {
      cancelAnimationFrame(this.s.rafId);
    }
    try {
      if (this.s.source) this.s.source.disconnect();
      if (this.s.analyser) this.s.analyser.disconnect();
      if (this.s.ctx && this.s.ctx.state !== 'closed') {
        this.s.ctx.close();
      }
    } catch (e) { /* ignore */ }
    if (this.s.ro) this.s.ro.disconnect();
    if (this.s.titleObserver) this.s.titleObserver.disconnect();
    if (this.s.bitrateTimer) clearInterval(this.s.bitrateTimer);
    this.s = null;
  }
}
