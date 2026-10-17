"""Transcribe each dialogue line from the voice track and print it next to the intended reading. usage: asr_check.py EP ASR_DIR"""
import json, sys, wave, os
import numpy as np, sherpa_onnx
ep, d = sys.argv[1], sys.argv[2]
root = os.path.dirname(os.path.dirname(__file__))
data = json.load(open(f"{root}/src/shorts/data/{ep}.json"))
r = wave.open(sys.argv[3] if len(sys.argv) > 3 else f"{root}/out/{ep}_voice.wav"); sr = r.getframerate(); x = np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16).astype(np.float32) / 32768; r.close()
rec = sherpa_onnx.OnlineRecognizer.from_transducer(tokens=f"{d}/tokens.txt", encoder=f"{d}/encoder-epoch-99-avg-1.int8.onnx", decoder=f"{d}/decoder-epoch-99-avg-1.onnx", joiner=f"{d}/joiner-epoch-99-avg-1.int8.onnx", num_threads=2, sample_rate=16000, feature_dim=80, decoding_method="greedy_search")
for l in data["lines"]:
    seg = x[int(l["start"] * sr): int(l["end"] * sr)]
    t16 = np.interp(np.linspace(0, len(seg) - 1, int(len(seg) * 16000 / sr)), np.arange(len(seg)), seg).astype(np.float32)
    s = rec.create_stream(); s.accept_waveform(16000, t16); s.accept_waveform(16000, np.zeros(8000, dtype=np.float32)); s.input_finished()
    while rec.is_ready(s): rec.decode_stream(s)
    print(f'[{l["spk"]}] 원문: {l["text"]}\n    인식: {rec.get_result(s)}')
