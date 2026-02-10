/**
 * Ambient Audio System
 * Generates calm ambient music procedurally using Web Audio API
 * iOS Safari compatible — all unlock steps are synchronous inside user gesture
 */

// iOS Safari fallback
const AudioCtx = typeof window !== 'undefined'
    ? (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)
    : null

class AmbientAudio {
    private ctx: AudioContext | null = null
    private masterGain: GainNode | null = null
    private isPlaying = false
    private oscillators: OscillatorNode[] = []
    private intervals: number[] = []

    // Chord progressions (frequencies) for ambient feel
    private readonly chords = [
        [130.81, 196.00, 261.63, 329.63], // C major
        [110.00, 164.81, 220.00, 277.18], // A minor
        [146.83, 220.00, 293.66, 369.99], // D minor
        [174.61, 261.63, 349.23, 440.00], // F major
        [196.00, 293.66, 392.00, 493.88], // G major
        [164.81, 246.94, 329.63, 415.30], // E minor
    ]

    private currentChordIndex = 0

    /**
     * Call this DIRECTLY from a click/touch handler — no async, no await, no setTimeout
     * iOS Safari requires everything in the same synchronous call stack as the user gesture
     */
    start() {
        if (this.isPlaying) return
        if (!AudioCtx) return

        // Step 1: Create context synchronously in user gesture
        if (!this.ctx) {
            this.ctx = new AudioCtx()
            this.masterGain = this.ctx.createGain()
            this.masterGain.gain.value = 0
            this.masterGain.connect(this.ctx.destination)
        }

        if (!this.masterGain) return

        // Step 2: Resume synchronously — don't await!
        // On iOS, .resume() returns a promise but the unlock happens synchronously
        if (this.ctx.state === 'suspended') {
            this.ctx.resume()
        }

        // Step 3: Play a silent buffer to fully unlock iOS audio
        // This is the iOS "unlock" trick — must happen in user gesture call stack
        const silentBuffer = this.ctx.createBuffer(1, 1, 22050)
        const silentSource = this.ctx.createBufferSource()
        silentSource.buffer = silentBuffer
        silentSource.connect(this.ctx.destination)
        silentSource.start(0)

        // Step 4: Also create and start a real oscillator immediately
        // iOS needs an actual audio node started in the gesture, not just later
        const kickOsc = this.ctx.createOscillator()
        const kickGain = this.ctx.createGain()
        kickOsc.frequency.value = 1 // inaudible
        kickGain.gain.value = 0.001 // nearly silent
        kickOsc.connect(kickGain)
        kickGain.connect(this.masterGain)
        kickOsc.start(0)
        kickOsc.stop(this.ctx.currentTime + 0.1)

        this.isPlaying = true

        // Step 5: Now fade in and start layers (these can be async since context is unlocked)
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime)
        this.masterGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3)

        this.playDrone()
        this.playPad()
        this.startChimeLoop()
    }

    stop() {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return

        // Fade out
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
        this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime)
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2)

        setTimeout(() => {
            this.oscillators.forEach(osc => {
                try { osc.stop() } catch (_e) { /* already stopped */ }
            })
            this.oscillators = []
            this.intervals.forEach(id => clearTimeout(id))
            this.intervals = []
            this.isPlaying = false
        }, 2500)
    }

    private playDrone() {
        if (!this.ctx || !this.masterGain) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const filter = this.ctx.createBiquadFilter()

        osc.type = 'sine'
        osc.frequency.value = 65.41 // C2
        filter.type = 'lowpass'
        filter.frequency.value = 200
        gain.gain.value = 0.3

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain)

        osc.start()
        this.oscillators.push(osc)

        // Slowly modulate frequency
        const lfo = this.ctx.createOscillator()
        const lfoGain = this.ctx.createGain()
        lfo.frequency.value = 0.05
        lfoGain.gain.value = 2
        lfo.connect(lfoGain)
        lfoGain.connect(osc.frequency)
        lfo.start()
        this.oscillators.push(lfo)
    }

    private playPad() {
        if (!this.ctx || !this.masterGain) return

        const playChord = () => {
            if (!this.ctx || !this.masterGain || !this.isPlaying) return

            const chord = this.chords[this.currentChordIndex % this.chords.length]
            this.currentChordIndex++
            if (!chord) return

            chord.forEach((freq, i) => {
                const osc = this.ctx!.createOscillator()
                const gain = this.ctx!.createGain()
                const filter = this.ctx!.createBiquadFilter()

                osc.type = 'sine'
                osc.frequency.value = freq * (i < 2 ? 0.5 : 1)

                filter.type = 'lowpass'
                filter.frequency.value = 800
                filter.Q.value = 1

                const now = this.ctx!.currentTime
                gain.gain.setValueAtTime(0, now)
                gain.gain.linearRampToValueAtTime(0.06, now + 3)
                gain.gain.linearRampToValueAtTime(0.04, now + 6)
                gain.gain.linearRampToValueAtTime(0, now + 10)

                osc.connect(filter)
                filter.connect(gain)
                gain.connect(this.masterGain!)

                osc.start(now)
                osc.stop(now + 10)
            })
        }

        playChord()
        const id = window.setInterval(playChord, 8000)
        this.intervals.push(id)
    }

    private startChimeLoop() {
        if (!this.ctx || !this.masterGain) return

        const chimeNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]

        const playChime = () => {
            if (!this.ctx || !this.masterGain || !this.isPlaying) return

            const freq = chimeNotes[Math.floor(Math.random() * chimeNotes.length)] ?? 523.25
            const osc = this.ctx.createOscillator()
            const gain = this.ctx.createGain()
            const filter = this.ctx.createBiquadFilter()

            osc.type = 'sine'
            osc.frequency.value = freq

            filter.type = 'lowpass'
            filter.frequency.value = 2000

            const now = this.ctx.currentTime
            gain.gain.setValueAtTime(0, now)
            gain.gain.linearRampToValueAtTime(0.08, now + 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 4)

            osc.connect(filter)
            filter.connect(gain)
            gain.connect(this.masterGain!)

            osc.start(now)
            osc.stop(now + 4)
        }

        const scheduleNext = () => {
            if (!this.isPlaying) return
            const delay = 3000 + Math.random() * 5000
            const id = window.setTimeout(() => {
                playChime()
                scheduleNext()
            }, delay)
            this.intervals.push(id)
        }

        setTimeout(() => {
            playChime()
            scheduleNext()
        }, 2000)
    }

    // Interaction sounds — only play if already unlocked
    playTick() {
        if (!this.ctx || !this.masterGain || !this.isPlaying) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = 'sine'
        osc.frequency.value = 880

        const now = this.ctx.currentTime
        gain.gain.setValueAtTime(0.05, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

        osc.connect(gain)
        gain.connect(this.masterGain)

        osc.start(now)
        osc.stop(now + 0.15)
    }

    playTransition() {
        if (!this.ctx || !this.masterGain || !this.isPlaying) return

        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        const filter = this.ctx.createBiquadFilter()

        osc.type = 'sawtooth'
        filter.type = 'lowpass'
        filter.frequency.value = 300

        const now = this.ctx.currentTime
        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.03, now + 0.2)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)

        osc.frequency.setValueAtTime(200, now)
        osc.frequency.linearRampToValueAtTime(100, now + 1.5)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.masterGain)

        osc.start(now)
        osc.stop(now + 1.5)
    }

    playReveal() {
        if (!this.ctx || !this.masterGain || !this.isPlaying) return

        const notes = [261.63, 329.63, 392.00]

        notes.forEach((freq, i) => {
            const osc = this.ctx!.createOscillator()
            const gain = this.ctx!.createGain()

            osc.type = 'sine'
            osc.frequency.value = freq

            const now = this.ctx!.currentTime + i * 0.3
            gain.gain.setValueAtTime(0, now)
            gain.gain.linearRampToValueAtTime(0.06, now + 0.1)
            gain.gain.exponentialRampToValueAtTime(0.001, now + 2)

            osc.connect(gain)
            gain.connect(this.masterGain!)

            osc.start(now)
            osc.stop(now + 2)
        })
    }

    get playing() {
        return this.isPlaying
    }
}

// Singleton
export const ambientAudio = new AmbientAudio()
