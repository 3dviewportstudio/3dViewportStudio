#!/usr/bin/env python3
"""Base de trap reguetón (dembow + hats trap + 808), Fa# menor, estructura de canción.

Uso: python3 trap_reggaeton.py salida.wav [duracion_s=173] [bpm=100]
Todo se sintetiza con numpy/scipy (sin samples externos).
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
BPM = float(sys.argv[3]) if len(sys.argv) > 3 else 100.0
STEP = 60.0 / BPM / 4          # 1/16 en segundos
DUR = float(sys.argv[2]) if len(sys.argv) > 2 else 173.0
BARS = max(16, int(round(DUR / (STEP * 16))))
N = int(SR * STEP * 16 * BARS) + SR  # + cola
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)
BL = np.zeros(N)  # bus ducked (808 + pads)
BR = np.zeros(N)
duck = np.ones(N)


def mix(sig, t, gain=1.0, pan=0.0, bus=False):
    i = int(t * SR)
    tl, tr = (BL, BR) if bus else (L, R)
    n = min(len(sig), N - i)
    if n <= 0:
        return
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    tl[i:i + n] += sig[:n] * gain * l * 1.414
    tr[i:i + n] += sig[:n] * gain * r * 1.414


def tt(d):
    return np.arange(int(SR * d)) / SR


def hp(x, f):
    b, a = signal.butter(2, f / (SR / 2), "high")
    return signal.lfilter(b, a, x)


def lp(x, f):
    b, a = signal.butter(2, f / (SR / 2), "low")
    return signal.lfilter(b, a, x)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def kick():
    t = tt(0.28)
    f = 48 + 120 * np.exp(-t * 38)
    ph = 2 * np.pi * np.cumsum(f) / SR
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.25
    return np.tanh(1.6 * np.sin(ph) * np.exp(-t * 9)) + click


def snare():
    t = tt(0.22)
    noise = hp(rng.standard_normal(len(t)), 1800) * np.exp(-t * 20)
    tone = np.sin(2 * np.pi * 190 * t * (1 + 0.3 * np.exp(-t * 30))) * np.exp(-t * 28)
    return 0.55 * noise + 0.6 * tone


def rim():
    t = tt(0.07)
    return (np.sin(2 * np.pi * 1700 * t) + 0.6 * np.sin(2 * np.pi * 820 * t)) * np.exp(-t * 90) * 0.5


def hat(open_=False, vel=1.0):
    d = 0.35 if open_ else 0.05
    t = tt(d)
    n = hp(rng.standard_normal(len(t)), 7000)
    return n * np.exp(-t * (14 if open_ else 110)) * 0.5 * vel


def bass808(note, dur=0.55, glide_from=None):
    t = tt(dur)
    f0 = midi(note)
    f = f0 * (1 + 0.5 * np.exp(-t * 45)) if glide_from is None else \
        midi(glide_from) + (f0 - midi(glide_from)) * (1 - np.exp(-t * 25))
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.minimum(t / 0.004, 1) * np.exp(-t * 4.2)
    return np.tanh(2.2 * np.sin(ph) * env) * 0.9


def pluck(note, dur=0.5):
    t = tt(dur)
    f = midi(note)
    s = sum(np.sin(2 * np.pi * f * k * t) / k ** 1.3 for k in range(1, 7))
    s = s * np.exp(-t * 7) + 0.4 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t * 14)
    return lp(s, 4500) * 0.35


def pad(notes, dur):
    t = tt(dur)
    out = np.zeros(len(t))
    for n in notes:
        for det in (-0.12, 0.0, 0.12):
            f = midi(n + det)
            out += signal.sawtooth(2 * np.pi * f * t) * 0.12
    env = np.minimum(t / 0.4, 1) * np.minimum((dur - t) / 0.5, 1)
    return lp(out * env, 1800)


def reverb(x, tail=1.6, wet=0.3):
    t = tt(tail)
    ir = rng.standard_normal(len(t)) * np.exp(-t * 3.2)
    ir = lp(ir, 5000)
    return x * (1 - wet) + wet * signal.fftconvolve(x, ir)[:len(x)] * 0.03


# --- Armonía oscura: F#m - D - E - C#m (un acorde por compás) ---
ROOTS = [30, 26, 28, 25]  # F#1 D1 E1 C#1 (midi) para el 808
CHORDS = [[54, 57, 61], [50, 54, 57], [52, 56, 59], [56, 61, 64]]
SCALE = [66, 69, 71, 73, 76, 78]  # pentatónica F#m aguda
MEL = [  # (paso, nota idx) por compás de 16 pasos
    [(0, 5), (3, 3), (6, 2), (10, 3), (12, 1)],
    [(0, 4), (3, 2), (6, 1), (10, 2), (14, 0)],
    [(0, 5), (3, 4), (6, 3), (10, 1), (12, 2)],
    [(0, 3), (3, 2), (6, 1), (8, 0), (11, 1), (14, 2)],
]
DEMBOW_SNARE = [3, 6, 11, 14]
KICK_STEPS = [0, 4, 8, 12]
BASS_STEPS = [0, 6, 8, 11, 14]


def section_of(bar):
    f = bar / BARS
    if f < 0.11: return "intro"
    if f < 0.33: return "verse"
    if f < 0.55: return "hook"
    if f < 0.65: return "break"
    if f < 0.89: return "hook"
    return "outro"


def kick_duck(t):
    i0 = int(t * SR); nd = int(0.2 * SR)
    duck[i0:i0 + nd] *= 0.3 + 0.7 * (1 - np.exp(-np.arange(min(nd, N - i0)) / (0.06 * SR)))


k_s, sn_s, rm_s = kick(), snare(), rim()

for bar in range(BARS):
    t0 = bar * 16 * STEP
    ch = bar % 4
    sec = section_of(bar)
    nxt_sec = section_of(bar + 1) if bar + 1 < BARS else "end"
    last_bar = bar == BARS - 1
    hook = sec == "hook"

    # pads
    pg = {"intro": 1.0, "verse": 0.55, "hook": 0.85, "break": 1.0, "outro": 0.8}[sec]
    mix(pad(CHORDS[ch], 16 * STEP + 0.1), t0, pg, -0.2, bus=True)

    # melodía: intro (2º mitad), hook completo, break solo, outro
    if (sec == "intro" and bar >= 2) or hook or sec in ("break", "outro"):
        for st, idx in MEL[ch]:
            mix(pluck(SCALE[idx]), t0 + st * STEP, 1.2 if hook else 0.9, 0.25)
            if hook and st % 6 == 0:
                mix(pluck(SCALE[idx] + 12, 0.3), t0 + st * STEP + STEP * 0.5, 0.45, -0.4)

    # hats: más densos en el hook, escasos en intro/break/outro
    dens = {"intro": 2, "verse": 1, "hook": 1, "break": 2, "outro": 2}[sec]
    for s in range(0, 16, dens):
        vel = 1.0 if s % 4 == 0 else (0.55 if s % 2 == 0 else 0.35)
        vel *= rng.uniform(0.85, 1.0)
        mix(hat(vel=vel), t0 + s * STEP + (0.025 * STEP * 4 if s % 2 else 0), 1.3, 0.35 if s % 2 else 0.2)
    if sec in ("verse", "hook") and bar % 2 == 1:  # roll 32avos
        for r in range(4 if sec == "verse" else 6):
            mix(hat(vel=0.5 + 0.08 * r), t0 + 14 * STEP + r * STEP / (2 if sec == "verse" else 3), 1.1, 0.3)
    if sec in ("verse", "hook") and bar % 4 == 3:  # tresillo de hats
        for r in range(3):
            mix(hat(vel=0.6), t0 + 12 * STEP + r * STEP * 2 / 3, 1.0, 0.3)
    if sec in ("verse", "hook"):
        mix(hat(open_=True), t0 + 10 * STEP, 1.0, 0.4)

    drums = sec in ("verse", "hook") or (sec == "break" and bar % 4 >= 2) or (sec == "intro" and bar >= 8 * 0 + int(BARS * 0.11) - 2)
    if sec == "outro":
        drums = bar < int(BARS * 0.89) + 4
    # dembow: kick + snare/rim
    if drums:
        for s in KICK_STEPS:
            mix(k_s, t0 + s * STEP, 0.6)
            kick_duck(t0 + s * STEP)
        for s in DEMBOW_SNARE:
            mix(sn_s, t0 + s * STEP, 1.1 if hook else 0.8)
            mix(rm_s, t0 + s * STEP, 0.9, 0.1)
    # 808 siguiendo la raíz del acorde (verso más corto, hook con octava)
    if drums and sec != "break" and not (sec == "intro"):
        steps = BASS_STEPS if hook else [0, 6, 11]
        for i, s in enumerate(steps):
            nxt = steps[i + 1] if i + 1 < len(steps) else 16
            note = ROOTS[ch] + (12 if (hook and s == 14) else 0)
            gf = ROOTS[ch] + 7 if s == 11 else None
            mix(bass808(note, min((nxt - s) * STEP + 0.05, 0.55), gf), t0 + s * STEP, 0.55, bus=True)

    # fills de snare crescendo al final de cada bloque de 8 compases
    if bar % 8 == 7 and sec in ("verse", "hook", "break"):
        for r in range(8):
            mix(sn_s, t0 + 12 * STEP + r * STEP / 2, 0.35 + 0.09 * r)
    # riser antes de cada hook
    if sec != "hook" and nxt_sec == "hook":
        tr_ = tt(16 * STEP)
        nz = hp(rng.standard_normal(len(tr_)), 2500) * (tr_ / tr_[-1]) ** 2
        mix(nz, t0, 0.5, 0.0)
    if last_bar:  # cierre
        mix(bass808(ROOTS[0], 1.5), t0 + 16 * STEP - 0.01, 0.55, bus=True)

# master: duck del bus, reverb, loudness -11 LUFS, limitador suave
import pyloudnorm as pyln
L = L + BL * duck
R = R + BR * duck
L, R = reverb(L, wet=0.18), reverb(R, wet=0.18)
x = np.stack([L, R], axis=1)
x = x / np.abs(x).max()
meter = pyln.Meter(SR)
x = pyln.normalize.loudness(x, meter.integrated_loudness(x), -10.5)
x = np.tanh(x * 1.0)  # saturación suave de picos
x = x / np.abs(x).max() * 0.89
out = (x * 32767).astype(np.int16)
path = sys.argv[1] if len(sys.argv) > 1 else "trap_reggaeton.wav"
wavfile.write(path, SR, out)
print("OK", path, f"{len(out)/SR:.1f}s", "LUFS", round(meter.integrated_loudness(x), 1))
