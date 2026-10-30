import re
import unicodedata

RARITY_TABS = {"EX Units": "EX", "SS Units": "SS", "S Units": "S", "A Units": "A"}
SKIP_TABS = {"units", "gift"} | {t.lower() for t in RARITY_TABS}
MAX_SIDE = {"portrait": 1000, "art": 800, "icon": 220}
ALIASES = {"martrotho": "matrotho", "yui": "yuimatsumoto"}
COL_B, COL_C, COL_F, COL_G = 2, 3, 6, 7

def norm(name):
    s = unicodedata.normalize("NFKD", str(name)).lower()
    s = re.sub(r"[^a-z0-9]", "", s)
    return ALIASES.get(s, s)


def slug(name):
    s = unicodedata.normalize("NFKD", str(name)).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def txt(v):
    if v is None:
        return None
    s = str(v).strip()
    return s or None

