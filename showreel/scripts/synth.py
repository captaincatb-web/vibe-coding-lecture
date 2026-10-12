"""Synthesize a simple beat track: kick on each scene start, whoosh before transitions, hats, drone.
usage: python3 synth.py out.wav DURATION_SEC START_FRAME,START_FRAME,... [fps] [bpm]"""
import sys, wave, struct, math, random
out, dur, starts = sys.argv[1], float(sys.argv[2]), [int(x) for x in sys.argv[3].split(',')]
fps = float(sys.argv[4]) if len(sys.argv) > 4 else 30
bpm = float(sys.argv[5]) if len(sys.argv) > 5 else 120
sr = 44100; n = int(sr * dur); buf = [0.0] * n
random.seed(7)
def tone(t0, f0, f1, length, gain, noise=False):
    i0 = int(t0 * sr); ph = 0.0
    for k in range(int(length * sr)):
        i = i0 + k
        if i < 0 or i >= n: continue
        t = k / sr; env = math.exp(-t * 7 / length)
        ph += 2 * math.pi * (f0 + (f1 - f0) * min(1, t / length)) / sr
        buf[i] += gain * env * ((random.random() * 2 - 1) if noise else math.sin(ph))
def whoosh(t0, length, gain):
    i0 = int(t0 * sr); lp = 0.0
    for k in range(int(length * sr)):
        i = i0 + k
        if i < 0 or i >= n: continue
        x = k / (length * sr); lp += (0.02 + 0.4 * x) * ((random.random() * 2 - 1) - lp)
        buf[i] += gain * math.sin(math.pi * x) ** 2 * lp
beat = 60 / bpm
for s in starts:
    t = s / fps; tone(t, 150, 45, 0.5, 0.9); tone(t, 0, 0, 0.12, 0.25, True)
for s in starts[1:]: whoosh(s / fps - 0.4, 0.55, 0.8)
k = 0
while k * beat < dur:
    t = k * beat
    tone(t, 110, 50, 0.25, 0.25)                    # soft pulse on beat
    tone(t + beat / 2, 0, 0, 0.04, 0.08, True)      # off-beat hat
    k += 1
chord = [55, 65.4, 82.4]                            # A minor-ish drone
for i in range(n):
    t = i / sr
    buf[i] += 0.05 * sum(math.sin(2 * math.pi * f * t) for f in chord) * min(1, t / 2) * (0.75 + 0.25 * math.sin(t * 0.8))
m = max(abs(x) for x in buf) or 1
w = wave.open(out, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x / m * 0.9 * min(1, (dur - i / sr) / 1.2))) * 32767)) for i, x in enumerate(buf)))
w.close()
