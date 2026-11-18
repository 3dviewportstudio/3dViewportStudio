#!/usr/bin/env python3
"""Base de trap reguetón (dembow + hats trap + 808). 95 BPM, Fa# menor.

Uso: python3 trap_reggaeton.py salida.wav
Todo se sintetiza con numpy/scipy (sin samples externos).
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
BPM = 95
STEP = 60.0 / BPM / 4          # 1/16 en segundos
BARS = 16
N = int(SR * STEP * 16 * BARS) + SR  # + cola
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def mix(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    n = min(len(sig), N - i)
    if n <= 0:
        return
    l = np.cos((pan + 1) * np.pi / 4)
    r = np.sin((pan + 1) * np.pi / 4)
    L[i:i + n] += sig[:n] * gain * l * 1.414
    R[i:i + n] += sig[:n] * gain * r * 1.414


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


# --- Armonía: F#m - D - A - E (2 compases c/u... 1 compás por acorde, ciclo de 4) ---
ROOTS = [30, 26, 33, 28]  # F#1 D1 A1 E1 (midi) para el 808
CHORDS = [[54, 57, 61], [50, 54, 57], [57, 61, 64], [52, 56, 59]]  # F#m D A E
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

k_s, sn_s, rm_s = kick(), snare(), rim()
pads_drawn = {}

for bar in range(BARS):
    t0 = bar * 16 * STEP
    ch = bar % 4
    section = "intro" if bar < 4 else ("break" if bar == 11 else "main")
    last_bar = bar == BARS - 1

    # pads durante todo el tema
    mix(pad(CHORDS[ch], 16 * STEP + 0.1), t0, 0.8 if section != "intro" else 1.0, -0.2)

    # melodía (entra desde el compás 2)
    if bar >= 2:
        for st, idx in MEL[ch]:
            mix(pluck(SCALE[idx]), t0 + st * STEP, 1.2, 0.25)
            if bar >= 8 and st % 6 == 0:
                mix(pluck(SCALE[idx] + 12, 0.3), t0 + st * STEP + STEP * 0.5, 0.45, -0.4)

    # hats (siempre) con velocidad variable + rolls trap
    for s in range(16):
        vel = 1.0 if s % 4 == 0 else (0.55 if s % 2 == 0 else 0.35)
        vel *= rng.uniform(0.85, 1.0)
        if section == "break" and s >= 8:
            vel *= 0.5
        mix(hat(vel=vel), t0 + s * STEP, 1.3, 0.35 if s % 2 else 0.2)
    if bar % 2 == 1:  # roll de 32avos en los dos últimos pasos
        for r in range(4):
            mix(hat(vel=0.5 + 0.12 * r), t0 + 14 * STEP + r * STEP / 2, 1.1, 0.3)
    if bar % 4 == 3:  # tresillo de hats
        for r in range(3):
            mix(hat(vel=0.6), t0 + 12 * STEP + r * STEP * 2 / 3, 1.0, 0.3)
    mix(hat(open_=True), t0 + 10 * STEP, 1.0, 0.4)

    if section == "intro":
        continue

    # dembow: kick + snare/rim
    if section != "break":
        for s in KICK_STEPS:
            mix(k_s, t0 + s * STEP, 0.6)
    for s in DEMBOW_SNARE:
        mix(sn_s, t0 + s * STEP, 1.1)
        mix(rm_s, t0 + s * STEP, 0.9, 0.1)

    # 808 siguiendo la raíz del acorde
    if section != "break":
        for i, s in enumerate(BASS_STEPS):
            nxt = BASS_STEPS[i + 1] if i + 1 < len(BASS_STEPS) else 16
            dur = (nxt - s) * STEP + 0.05
            note = ROOTS[ch] + (12 if (bar >= 8 and s == 14) else 0)
            gf = ROOTS[ch] + 7 if s == 11 else None
            mix(bass808(note, min(dur, 0.55), gf), t0 + s * STEP, 0.55)

    if last_bar:  # cierre
        mix(bass808(ROOTS[0], 1.5), t0 + 16 * STEP - 0.01, 0.55)

# reverb a la melodía/pad ya mezclados (suave) + master
L, R = reverb(L, wet=0.18), reverb(R, wet=0.18)
peak = max(np.abs(L).max(), np.abs(R).max())
master = 0.89 / peak
L, R = np.tanh(L * master * 2.4), np.tanh(R * master * 2.4)
out = np.stack([L, R], axis=1)
out = (out / np.abs(out).max() * 0.89 * 32767).astype(np.int16)

path = sys.argv[1] if len(sys.argv) > 1 else "trap_reggaeton.wav"
wavfile.write(path, SR, out)
print("OK", path, f"{len(out)/SR:.1f}s")
