import hashlib
import io
import sys
from pathlib import Path

from PIL import Image

from .common import MAX_SIDE

class Images:
    """Extracts images from a worksheet, optimizes them, and indexes them by anchor."""

    def __init__(self, out_dir):
        self.dir = Path(out_dir) / "img"
        self.dir.mkdir(parents=True, exist_ok=True)
        self.cache = {}
        self.dims = {}

    def save(self, raw, kind):
        key = (hashlib.sha1(raw).hexdigest()[:16], kind)
        if key in self.cache:
            return self.cache[key]
        name = f"{kind}-{key[0]}.webp"
        path = self.dir / name
        if not path.exists():
            try:
                im = Image.open(io.BytesIO(raw))
                im.load()
                im.thumbnail((MAX_SIDE[kind],) * 2, Image.LANCZOS)
                self.dims[name] = im.size
                has_alpha = im.mode in ("RGBA", "LA", "PA") or "transparency" in im.info
                im = im.convert("RGBA" if has_alpha else "RGB")
                im.save(path, "WEBP", quality=80, method=4)
            except Exception as e:  
                print(f"  ! image skipped ({e})", file=sys.stderr)
                name = None
        self.cache[key] = name
        return name

    def aspect(self, name):
        if name not in self.dims:
            try:
                self.dims[name] = Image.open(self.dir / name).size
            except Exception:
                return 1
        w, h = self.dims[name]
        return round(w / h, 3) if h else 1

    def index(self, ws):
        """-> list of dicts {row, col, raw} for every floating image on the sheet."""
        out = []
        for im in ws._images:
            try:
                a = im.anchor._from
                ext = getattr(im.anchor, "ext", None) 
                dw = round(ext.width / 9525) if ext is not None and getattr(ext, "width", None) else im.width
                dh = round(ext.height / 9525) if ext is not None and getattr(ext, "height", None) else im.height
                out.append({"row": a.row + 1, "col": a.col + 1, "raw": im._data(),
                            "w": im.width, "h": im.height, "dw": dw, "dh": dh})
            except Exception:
                continue
        return out


def pick_image(imgs, rows, cols, store, kind):
    for im in imgs:
        if im["row"] in rows and im["col"] in cols:
            return store.save(im["raw"], kind)
    return None
