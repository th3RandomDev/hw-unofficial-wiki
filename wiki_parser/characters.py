import re

from .common import COL_B, COL_C, COL_F, COL_G, slug, txt
from .images import pick_image

def find_blocks(ws):
    """Character headers are 2-row merged cells spanning F:L holding the name."""
    heads = []
    for m in ws.merged_cells.ranges:
        if m.min_col == COL_F and m.max_col == 12 and m.max_row - m.min_row == 1:
            name = txt(ws.cell(m.min_row, COL_F).value)
            if name:
                heads.append((m.min_row, name))
    heads.sort()
    blocks = []
    for i, (r, name) in enumerate(heads):
        end = heads[i + 1][0] - 1 if i + 1 < len(heads) else ws.max_row
        blocks.append((name, r, end))
    return blocks


def parse_block(ws, name, r0, r1, rarity, imgs, store):
    cells = {}
    for row in ws.iter_rows(min_row=r0, max_row=r1):
        for c in row:
            t = txt(c.value)
            if t is not None:
                cells[(c.row, c.column)] = t
    used = set()

    def take(key):
        used.add(key)
        return cells[key]

    def first_row(col, pred):
        rows = sorted(r for (r, c), t in cells.items() if c == col and pred(t))
        return rows[0] if rows else None

    stigma_row = first_row(COL_F, lambda t: t.lower() == "stigma")
    trait_row = first_row(COL_F, lambda t: t.lower().startswith("trait to get"))
    skill_row = first_row(COL_F, lambda t: t.lower().startswith("skill (priority"))
    for r, k in ((stigma_row, "stigma"), (trait_row, "trait"), (skill_row, "skill")):
        if r is not None:
            used.add((r, COL_F))
    used.add((r0, COL_F)) 

    block_imgs = [im for im in imgs if r0 <= im["row"] <= r1]
    rec = {"id": slug(name), "name": name, "rarity": rarity, "hasGuide": True,
           "title": None, "profile": {}, "story": None, "weapon": None,
           "stigmas": [], "traits": [], "skills": [], "gifts": [], "extra": []}
    rec["traitsWip"] = bool(trait_row and "wip" in cells[(trait_row, COL_F)].lower())

    rec["portrait"] = pick_image(block_imgs, range(r0, r0 + 9), {COL_B}, store, "portrait")

    grade_row = None
    for (r, c), t in sorted(cells.items()):
        if c == COL_B and re.match(r"^[A-Za-z ]+\s*:$", t):
            key = t.rstrip(":").strip()
            used.add((r, c))
            if (r, COL_C) in cells:
                rec["profile"][key] = take((r, COL_C))
            if key == "Grade":
                grade_row = r
    if grade_row:
        above = [k for k in cells if k[1] == COL_B and r0 <= k[0] < grade_row and k not in used]
        if above:
            rec["title"] = take(max(above)) 
    story_row = first_row(COL_B, lambda t: t.lower().startswith("background story"))
    over_row = first_row(COL_B, lambda t: t.lower() == "overview")
    rec["overview"] = None
    for label_row, field, stop in ((story_row, "story", over_row), (over_row, "overview", None)):
        if not label_row:
            continue
        used.add((label_row, COL_B))
        limit = stop if stop and stop > label_row else r1 + 1
        parts = [take(k) for k in sorted(cells)
                 if k[1] == COL_B and label_row < k[0] < limit and k not in used]
        rec[field] = "\n".join(parts) or None

    w_end = (stigma_row or r0 + 12) - 1
    w_keys = sorted(k for k in cells if r0 < k[0] <= w_end and k[1] >= COL_F and k not in used)
    wname = [take(k) for k in w_keys if k[1] == COL_F]
    wtext = [take(k) for k in w_keys if k[1] > COL_F]
    wimg = pick_image(block_imgs, range(r0, w_end + 1), {COL_F}, store, "art")
    if wname or wtext or wimg:
        rec["weapon"] = {"name": " / ".join(wname) or None, "text": "\n\n".join(wtext) or None, "image": wimg}

    dg_row = None
    for k in sorted(cells):
        if k[1] >= 8 and cells[k].lower() == "demigod":
            dg_row = k[0]
            used.add(k)
            break
    rec["demigod"] = []
    if dg_row:
        stop = skill_row or r1 + 1
        for im in sorted((i for i in block_imgs if i["col"] >= 8 and dg_row < i["row"] < stop),
                         key=lambda i: i["col"]):
            col_txt = sorted(k for k in cells if k[1] == im["col"] and im["row"] < k[0] < stop and k not in used)
            name = re.sub(r"\s+", " ", take(col_txt[0])) if col_txt else None
            note = re.sub(r"\s+", " ", take(col_txt[1])) if len(col_txt) > 1 else None
            rec["demigod"].append({"name": name, "note": note, "icon": store.save(im["raw"], "icon")})

    if stigma_row:
        s_end = min([r for r in (trait_row, skill_row) if r and r > stigma_row] + [r1 + 1]) - 1
        keys = sorted(k for k in cells if stigma_row <= k[0] <= s_end and k[1] >= COL_F and k not in used)
        titles = [k for k in keys if k[1] == COL_G and not re.match(r"^(Set\s*\d|Substat)", cells[k], re.I)
                  and not re.search(r"\bSet\s*\d", cells[k])]
        entries = []
        for i, tk in enumerate(titles):
            span_end = titles[i + 1][0] - 1 if i + 1 < len(titles) else s_end
            entry = {"phase": None, "name": None, "sets": [], "substats": None, "image": None}
            t = take(tk)
            m = re.match(r"^([^:]+):\s*(.+)$", t)
            entry["phase"], entry["name"] = (m.group(1).strip(), m.group(2).strip()) if m else (None, t)
            for k in keys:
                if k not in used and tk[0] <= k[0] <= span_end and re.search(r"\bSet\s*\d", cells[k]):
                    entry["sets"].append(take(k))
            entry["image"] = pick_image(block_imgs, range(tk[0], tk[0] + 2), {COL_F}, store, "art")
            entries.append(entry)
        for k in keys:
            if k in used or k[1] < 8 or not re.match(r"^Substat", cells[k], re.I) or not entries:
                continue
            text = take(k)
            below = (k[0] + 1, k[1])
            if below in cells and below not in used and re.match(r"^\d", cells[below]):
                text += "\n" + take(below)
            idx = max([i for i, t in enumerate(titles) if t[0] <= k[0]] or [0])
            entries[idx]["substats"] = (entries[idx]["substats"] + "\n" + text) if entries[idx]["substats"] else text
        rec["stigmas"] = entries
        for k in keys:  
            if k not in used and not re.match(r"^\d", cells[k]):
                rec["extra"].append({"where": "stigma", "text": take(k)})

    if trait_row:
        t_end = (skill_row if skill_row and skill_row > trait_row else r1 + 1) - 1
        for r in range(trait_row + 1, t_end + 1):
            if (r, COL_F) in cells:
                tr = {"name": take((r, COL_F)), "effect": None}
                if (r, COL_G) in cells:
                    tr["effect"] = take((r, COL_G))
                rec["traits"].append(tr)
            for c in range(COL_G + 1, 13):
                if (r, c) in cells and (r, c) not in used:
                    rec["extra"].append({"where": "trait", "text": take((r, c))})

    if skill_row:
        for c in range(COL_F, 13):
            col_keys = sorted(k for k in cells if k[1] == c and k[0] > skill_row and k not in used)
            if not col_keys and not any(im["col"] == c and im["row"] > skill_row for im in block_imgs):
                continue
            title, prio, desc = None, None, []
            for k in col_keys:
                t = cells[k]
                if re.match(r"^\d+(\.\d+)?$", t):
                    prio = take(k)
                elif title is None:
                    title = take(k)
                else:
                    desc.append(take(k))
            icon = pick_image([im for im in block_imgs if im["row"] > skill_row], range(skill_row, r1 + 1), {c}, store, "icon")
            if title or icon:
                rec["skills"].append({"title": title, "priority": prio, "description": "\n".join(desc) or None, "icon": icon})

    for k in sorted(cells):
        if k not in used:
            rec["extra"].append({"where": f"R{k[0]}C{k[1]}", "text": cells[k]})
    return rec


def parse_block_forms(ws, name, r0, r1, rarity, imgs, store):
    """A block can hold several forms of one unit (e.g. Griselda + Headless Knight): the second
    form starts right after the first form's skill-priority row and has its own Stigma label."""
    f_lbl = lambda r: (txt(ws.cell(r, COL_F).value) or "").lower()
    stigmas = [r for r in range(r0, r1 + 1) if f_lbl(r) == "stigma"]
    if len(stigmas) < 2:
        return [parse_block(ws, name, r0, r1, rarity, imgs, store)]
    num = re.compile(r"^\d+(\.\d+)?$")
    nums = [r for r in range(stigmas[0], stigmas[1])
            if any(num.match(txt(ws.cell(r, c).value) or "") for c in range(COL_F, 13))]
    split = (max(nums) + 1) if nums else stigmas[1] - 8
    first = parse_block(ws, name, r0, split - 1, rarity, imgs, store)
    second = parse_block(ws, name, split, r1, rarity, imgs, store)
    title = second["title"] or ""
    form_name = title.split(" - ")[-1].strip() if " - " in title else f"{name} (form 2)"
    second["name"], second["id"], second["formOf"] = form_name, slug(form_name), first["id"]
    return [first, second]

