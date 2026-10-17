"""Make short audition clips: same sentences for each Supertonic voice style at a common pace.
usage: voice_samples.py OUT_DIR"""
import sys, os, subprocess, wave, numpy as np, sherpa_onnx
sys.path.insert(0, os.path.dirname(__file__))
from ko_text import to_reading
out = sys.argv[1]
M = os.environ.get("TTS_MODEL", "/tmp/claude-0/-home-user-vibe-coding-lecture/4359b5d2-d091-5ba6-bf7e-1637de926295/scratchpad/tts/sherpa-onnx-supertonic-3-tts-int8-2026-05-11")
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
    duration_predictor=f"{M}/duration_predictor.int8.onnx", text_encoder=f"{M}/text_encoder.int8.onnx", vector_estimator=f"{M}/vector_estimator.int8.onnx",
    vocoder=f"{M}/vocoder.int8.onnx", tts_json=f"{M}/tts.json", unicode_indexer=f"{M}/unicode_indexer.bin", voice_style=f"{M}/voice.bin"), num_threads=2)))
TEXT = "목요일 코스피가 7.57% 폭락했습니다. 하지만 TSMC 3분기 매출은 41.2% 늘었습니다. 다음 주엔 외국인 매도가 잦아들지가 관건입니다."
RATE = {0: 4.5, 5: 4.5, 6: 4.6, 7: 5.5, 8: 4.8, 9: 4.5}      # measured syllables/sec at speed 1.0
TARGET = {0: 4.1}; DEFAULT = 4.4                                # female a bit slower, males 4.4 syl/s
for sid, name in [(0, "여성_0번(진행자, 느리게)"), (5, "남성_5번"), (6, "남성_6번(이전 영상)"), (7, "남성_7번"), (8, "남성_8번"), (9, "남성_9번(가장 낮은 톤)")]:
    g = sherpa_onnx.GenerationConfig(); g.sid = sid; g.num_steps = 8; g.extra = {"lang": "ko"}
    g.speed = TARGET.get(sid, DEFAULT) / RATE[sid]
    a = tts.generate(to_reading(TEXT), g); x = np.array(a.samples, np.float32)
    idx = np.where(np.abs(x) > 0.012)[0]; x = x[max(0, idx[0] - 1500): idx[-1] + 3000]; x = x / np.abs(x).max() * 0.85
    wav = f"/tmp/_vs_{sid}.wav"; w = wave.open(wav, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate); w.writeframes((x * 32767).astype(np.int16).tobytes()); w.close()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", wav, "-b:a", "128k", f"{out}/{name}.mp3"], check=True)
    print(name, round(len(x) / a.sample_rate, 1), "s")
