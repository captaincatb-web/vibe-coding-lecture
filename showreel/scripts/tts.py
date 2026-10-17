"""Korean TTS via sherpa-onnx (Mimic3 KSS). usage: tts.py MODEL_DIR OUT.wav "text" [speed]"""
import sys, wave
import numpy as np
import sherpa_onnx
d, out, text = sys.argv[1], sys.argv[2], sys.argv[3]
speed = float(sys.argv[4]) if len(sys.argv) > 4 else 1.0
cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(
    model=f"{d}/ko_KO-kss_low.onnx", tokens=f"{d}/tokens.txt", data_dir=f"{d}/espeak-ng-data"), num_threads=2))
a = sherpa_onnx.OfflineTts(cfg).generate(text, sid=0, speed=speed)
s = (np.clip(np.array(a.samples), -1, 1) * 32767).astype(np.int16)
w = wave.open(out, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(a.sample_rate); w.writeframes(s.tobytes()); w.close()
print(out, round(len(s) / a.sample_rate, 2), "s @", a.sample_rate)
