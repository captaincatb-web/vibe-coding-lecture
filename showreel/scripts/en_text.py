"""Expand numbers/percent/ordinals in English text so TTS and ASR agree on the reading."""
import re
from num2words import num2words
def _n(x, **k): return num2words(x, **k).replace(" and ", " ").replace(",", "")
def expand(t):
    t = re.sub(r"(\d+)(?:st|nd|rd|th)\b", lambda m: _n(int(m.group(1)), to="ordinal"), t)
    t = t.replace("%", " percent")
    t = re.sub(r"\d[\d,]*(?:\.\d+)?", lambda m: _n(float(m.group(0).replace(",", "")) if "." in m.group(0) else int(m.group(0).replace(",", ""))), t)
    return re.sub(r"\s+", " ", t).strip()
if __name__ == "__main__":
    for s in ["KOSPI plunged 7.57% on Thursday!", "rose 41.2% to 46.7 billion dollars", "topped 107 trillion won", "opening on the 16th", "fell 1.88%"]:
        print(expand(s))
