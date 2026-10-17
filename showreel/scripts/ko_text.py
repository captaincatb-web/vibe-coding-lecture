"""Convert display text to a Hangul reading for TTS (numbers, units, English terms)."""
import re
D = "영일이삼사오육칠팔구"
def _group(n):
    s = ""
    for v, u in ((1000, "천"), (100, "백"), (10, "십")):
        q, n = divmod(n, v)
        if q: s += ("" if q == 1 else D[q]) + u
    if n: s += D[n]
    return s
def sino(n):
    if n == 0: return "영"
    parts = []
    for v, u in ((10**12, "조"), (10**8, "억"), (10**4, "만")):
        q, n = divmod(n, v)
        if q:
            g = _group(q)
            if q == 1 and u == "만": g = ""
            parts.append(g + u)
    if n: parts.append(_group(n))
    return " ".join(parts)
TERMS = [("SK하이닉스", "에스케이하이닉스"), ("TSMC", "티에스엠씨"), ("CXMT", "씨엑스엠티"), ("CPI", "씨피아이"),
         ("RTX", "알티엑스"), ("챗GPT", "챗지피티"), ("GPT", "지피티"), ("PDF", "피디에프"), ("AI", "에이아이"),
         ("PC", "피씨"), ("HBM", "에이치비엠")]
def to_reading(t):
    for a, b in TERMS: t = t.replace(a, b)
    t = t.replace("%", " 퍼센트")
    def num(m):
        s = m.group(0).replace(",", "")
        if "." in s:
            i, f = s.split(".")
            return sino(int(i)) + " 점 " + " ".join(D[int(c)] for c in f)
        return sino(int(s))
    t = re.sub(r"\d[\d,]*(?:\.\d+)?", num, t)
    return t
if __name__ == "__main__":
    for s in ["7.57% 폭락", "107조 4천억 원", "467억 달러로 41.2%", "8거래일", "9월 물가가 3.7%", "128기가바이트", "1페타플롭스"]:
        print(s, "->", to_reading(s))
