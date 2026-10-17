"""Dialogue JSON -> voice track + timing JSON (with per-frame loudness for lip-sync bars).
usage: build_voice.py EPISODE [TARGET_SEC=50]
Voice: sherpa-onnx + Supertonic 3 (Korean, two voice styles)."""
import json, subprocess, sys, wave, os, math
import numpy as np
import sherpa_onnx
sys.path.insert(0, os.path.dirname(__file__))
from ko_text import to_reading

ep = sys.argv[1]; target = float(sys.argv[2]) if len(sys.argv) > 2 else 50.0
MODEL = os.environ.get("TTS_MODEL", "/tmp/claude-0/-home-user-vibe-coding-lecture/4359b5d2-d091-5ba6-bf7e-1637de926295/scratchpad/tts/sherpa-onnx-supertonic-3-tts-int8-2026-05-11")
FPS = 30
LEAD, TAIL, GAP_SAME, GAP_SWITCH, GAP_SCENE = 0.45, 1.4, 0.16, 0.24, 0.38
SID = {"A": 0, "B": 6}   # Supertonic 3 voice styles: 0 = higher (female-range), 6 = lower (male-range); 7 skips words at slow speed
# measured syllables/sec at speed 1.0 per voice; we aim for the same slow, steady pace (A a bit slower)
RATE = {"A": 4.5, "B": 4.6}   # measured for sid 0 / sid 6
TARGET = {"A": 4.1, "B": 4.4}
root = os.path.dirname(os.path.dirname(__file__))
spec = json.load(open(f"{root}/scripts/dialogue/{ep}.json"))
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
    duration_predictor=f"{MODEL}/duration_predictor.int8.onnx", text_encoder=f"{MODEL}/text_encoder.int8.onnx", vector_estimator=f"{MODEL}/vector_estimator.int8.onnx",
    vocoder=f"{MODEL}/vocoder.int8.onnx", tts_json=f"{MODEL}/tts.json", unicode_indexer=f"{MODEL}/unicode_indexer.bin", voice_style=f"{MODEL}/voice.bin"), num_threads=4)))
SR = tts.sample_rate
ASR = os.environ.get("ASR_MODEL", "/tmp/claude-0/-home-user-vibe-coding-lecture/4359b5d2-d091-5ba6-bf7e-1637de926295/scratchpad/tts/sherpa-onnx-streaming-zipformer-korean-2024-06-16")
rec = None
if os.path.isdir(ASR):
    rec = sherpa_onnx.OnlineRecognizer.from_transducer(tokens=f"{ASR}/tokens.txt", encoder=f"{ASR}/encoder-epoch-99-avg-1.int8.onnx", decoder=f"{ASR}/decoder-epoch-99-avg-1.onnx", joiner=f"{ASR}/joiner-epoch-99-avg-1.int8.onnx", num_threads=2, sample_rate=16000, feature_dim=80, decoding_method="greedy_search")

def _norm(t):
    t = to_reading(t)
    return "".join(c for c in t if "가" <= c <= "힣")
def _cer(a, b):
    d = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        prev, d[0] = d[0], i
        for j, cb in enumerate(b, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (ca != cb))
    return d[len(b)] / max(1, len(a))
def _asr(x):
    t16 = np.interp(np.linspace(0, len(x) - 1, int(len(x) * 16000 / SR)), np.arange(len(x)), x).astype(np.float32)
    st = rec.create_stream(); st.accept_waveform(16000, t16); st.accept_waveform(16000, np.zeros(8000, np.float32)); st.input_finished()
    while rec.is_ready(st): rec.decode_stream(st)
    return rec.get_result(st)

def synth(text, speed, spk):
    g = sherpa_onnx.GenerationConfig(); g.sid = SID[spk]; g.speed = float(np.clip(speed * TARGET[spk] / RATE[spk], 0.6, 1.4)); g.num_steps = 8; g.extra = {"lang": "ko"}
    x = np.array(tts.generate(to_reading(text), g).samples, dtype=np.float32)
    idx = np.where(np.abs(x) > 0.012)[0]   # trim silence (keep a little room so onsets are not clipped)
    if len(idx): x = x[max(0, idx[0] - int(0.08 * SR)): idx[-1] + int(0.15 * SR)]
    return x / max(1e-6, np.abs(x).max()) * 0.9

CER = {}
def synth_best(text, speed, spk, n=6):
    best, bc = None, 9
    for _ in range(n if rec else 1):
        x = synth(text, speed, spk)
        c = _cer(_norm(text), _norm(_asr(x))) if rec else 0.0
        if c < bc: best, bc = x, c
        if bc == 0: break
    CER[text] = round(bc, 3)
    return best

def layout(speed, best=False):
    clips = [(synth_best(l["text"], speed, l["spk"]) if best else synth(l["text"], speed, l["spk"])) for l in spec["lines"]]
    t = LEAD; starts = []
    for i, (l, c) in enumerate(zip(spec["lines"], clips)):
        if i:
            p = spec["lines"][i - 1]
            t += GAP_SCENE if p["scene"] != l["scene"] else (GAP_SWITCH if p["spk"] != l["spk"] else GAP_SAME)
        starts.append(t); t += len(c) / SR
    return clips, starts, t + TAIL

speed = 1.0
clips, starts, total = layout(speed)
for _ in range(2):  # re-fit speed so total ~= target
    speech = sum(len(c) for c in clips) / SR
    fixed = total - speech
    speed = float(np.clip(speed * speech / max(1.0, target - fixed), 0.9, 1.1))
    clips, starts, total = layout(speed)
clips, starts, total = layout(speed, best=True)
print(f"speed={speed:.3f} total={total:.2f}s lines={len(clips)}")
print("CER per line (ASR vs intended):", list(CER.values()))
N = int(math.ceil(total * FPS)); n = int(N / FPS * SR)
voice = np.zeros(n, dtype=np.float32); env = {"A": np.zeros(N), "B": np.zeros(N)}
lines = []
for l, c, s in zip(spec["lines"], clips, starts):
    i0 = int(s * SR); voice[i0:i0 + len(c)] += c[: n - i0]
    e = i0 + len(c)
    for f in range(int(s * FPS), min(N, int(e / SR * FPS) + 1)):
        seg = c[max(0, int(f / FPS * SR) - i0): max(0, int((f + 1) / FPS * SR) - i0)]
        if len(seg): env[l["spk"]][f] = float(np.sqrt(np.mean(seg ** 2)))
    lines.append({**l, "start": round(s, 3), "end": round(e / SR, 3), "startF": int(s * FPS), "endF": int(math.ceil(e / SR * FPS))})
for k in env: env[k] = np.round(env[k] / max(1e-6, env[k].max()), 3).tolist()
scenes = {}
for l in lines:
    sc = scenes.setdefault(l["scene"], {"startF": l["startF"], "endF": l["endF"]}); sc["endF"] = max(sc["endF"], l["endF"])
sc_list = [scenes[k] for k in sorted(scenes)]
# scene boundaries: each scene starts when its first line starts (scene 0 from frame 0), ends where next begins
for i, sc in enumerate(sc_list):
    sc["from"] = 0 if i == 0 else sc["startF"] - 6
    sc["to"] = N if i == len(sc_list) - 1 else sc_list[i + 1]["startF"] - 6
out = {"id": ep, "fps": FPS, "total": N, "speed": round(speed, 3), "lines": lines, "scenes": [{"from": s["from"], "to": s["to"]} for s in sc_list], "env": env}
json.dump(out, open(f"{root}/src/shorts/data/{ep}.json", "w"), ensure_ascii=False)
w = wave.open(f"{root}/out/{ep}_voice.wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(voice, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
print("frames", N, "scenes", [(s["from"], s["to"]) for s in sc_list])
