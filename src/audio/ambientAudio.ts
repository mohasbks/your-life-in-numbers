/**
 * Ambient Audio System
 * Generates calm ambient music procedurally using Web Audio API
 * No external files needed — everything is synthesized
 */

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

    init() {
        if (this.ctx) return
        this.ctx = new AudioContext()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = 0
        this.masterGain.connect(this.ctx.destination)
    }

    async start() {
        if (this.isPlaying) return

        this.init()
        if (!this.ctx || !this.masterGain) return

        if (this.ctx.state === 'suspended') {
            await this.ctx.resume()
        }

        this.isPlaying = true

        // Fade in master volume
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime)
        this.masterGain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3)

        // Start ambient layers
        this.playDrone()
        this.playPad()
        this.startChimeLoop()
    }

    stop() {
        if (!this.isPlaying || !this.ctx || !this.masterGain) return

        // Fade out
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime)
        this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2)

        setTimeout(() => {
            this.oscillators.forEach(osc => {
                try { osc.stop() } catch { }
            })
            this.oscillators = []
            this.intervals.forEach(id => clearInterval(id))
            this.intervals = []
            this.isPlaying = false
        }, 2500)
    }

    private playDrone() {
        if (!this.ctx || !this.masterGain) return

        // Deep low drone
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

        // Evolving pad sound
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
                osc.frequency.value = freq * (i < 2 ? 0.5 : 1) // Lower octave for bass notes

                filter.type = 'lowpass'
                filter.frequency.value = 800
                filter.Q.value = 1

                // Envelope: slow fade in and out
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

        // Occasional gentle chime notes
        const chimeNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5, E5, G5, C6, E6

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

        // Random chimes every 3-8 seconds
        const scheduleNext = () => {
            if (!this.isPlaying) return
            const delay = 3000 + Math.random() * 5000
            const id = window.setTimeout(() => {
                playChime()
                scheduleNext()
            }, delay)
            this.intervals.push(id)
        }

        // Start after 2 seconds
        setTimeout(() => {
            playChime()
            scheduleNext()
        }, 2000)
    }

    // Play a single soft tick sound (for interactions)
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

    // Play a soft transition whoosh
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

    // Play reveal sound (for result numbers)
    playReveal() {
        if (!this.ctx || !this.masterGain || !this.isPlaying) return

        const notes = [261.63, 329.63, 392.00] // C E G ascending

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
