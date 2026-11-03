import re

paths = [
    r"D:\aravindan\project\appointza\appointza\appointza\appsettings.json",
    r"D:\aravindan\build\appointza\appsettings.json",
]
for p in paths:
    text = open(p, encoding="utf-8").read()
    t = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    t = re.sub(r"//.*?$", "", t, flags=re.M)
    m = re.search(r'"whatsapp"\s*:\s*\{', t)
    print("FILE", p)
    if not m:
        print("  no whatsapp block")
        continue
    start = m.end() - 1
    depth = 0
    end = start
    for i, ch in enumerate(t[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    block = t[start:end]
    keys = re.findall(r'"([^"]+)"\s*:', block)
    print("  keys:", keys)
    for k in ["verify_token", "app_secret"]:
        mm = re.search(rf'"{k}"\s*:\s*"([^"]*)"', block)
        if mm:
            v = mm.group(1)
            print(
                f"  {k}: set={bool(v.strip())} len={len(v)} placeholder={'REPLACE' in v}"
            )
        else:
            print(f"  {k}: MISSING")
