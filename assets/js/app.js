const HIDE = ["BWH"];
const ORDER = [
    "demigod",
    "trait",
    "tier-list",
    "misc",
    "cost-18",
    "mc",
    "main",
  ],
  LABEL = {
    main: "Resources",
    mc: "MC",
    trait: "Trait 1",
    "cost-18": "Cost 18",
  };
const RAR = ["All", "EX", "SS", "S", "A"],
  RH = 24,
  $ = (s) => document.querySelector(s);
const themeButton = $(".theme-toggle");
const syncThemeButton = () => {
  const dark = document.documentElement.dataset.theme === "dark";
  themeButton.setAttribute("aria-pressed", String(dark));
  themeButton.setAttribute(
    "aria-label",
    `Switch to ${dark ? "light" : "dark"} theme`,
  );
  themeButton.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
  themeButton.querySelector(".theme-label").textContent = dark
    ? "Light"
    : "Dark";
};
themeButton.onclick = () => {
  const theme =
    document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("hw-wiki-theme", theme);
  } catch {}
  syncThemeButton();
};
syncThemeButton();
const h = (t, a = {}, ...k) => {
  const e = document.createElement(t);
  for (const [x, v] of Object.entries(a)) {
    if (v == null || v === false) continue;
    if (x === "text") e.textContent = v;
    else if (x === "class") e.className = v;
    else e.setAttribute(x, v);
  }
  for (const c of k.flat())
    if (c != null && c !== false)
      e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const img = (s, c, alt = "") =>
  s ? h("img", { src: "img/" + s, alt, loading: "lazy", class: c }) : null;
const safe = (u) => (/^https?:\/\//i.test(u || "") ? u : null);
const ext = (u, t) =>
  h("a", { href: u, target: "_blank", rel: "noopener", text: t });
const box = (t, cls, ...k) =>
  h("section", { class: "box " + cls }, h("h2", { text: t }), ...k);
let CH = [],
  PG = {},
  TR = null,
  SG = null,
  st = { q: "", r: "All" };

function home() {
  const m = $("main");
  m.replaceChildren();
  document.title = "Horizon Walker Wiki (unofficial)";
  const q = h("input", {
    type: "search",
    placeholder: "Search characters",
    value: st.q,
    "aria-label": "Search characters",
  });
  const chips = RAR.map((r) => h("button", { class: "chip", text: r }));
  const grid = h("div", { class: "grid" });
  const count = h("p", { class: "result-count mute" });
  const draw = () => {
    const list = CH.filter(
      (c) =>
        (st.r === "All" || c.rarity === st.r) &&
        c.name.toLowerCase().includes(st.q.trim().toLowerCase()),
    );
    count.textContent = `${list.length} ${list.length === 1 ? "character" : "characters"}`;
    grid.replaceChildren(
      ...list.map((c) =>
        h(
          "a",
          {
            class: "card",
            href: "#/c/" + encodeURIComponent(c.id),
            "data-r": c.rarity,
          },
          img(c.icon, "", c.name),
          h("span", { text: c.name }),
        ),
      ),
    );
    if (!list.length)
      grid.append(
        h("p", {
          class: "mute",
          text: "No character matches. Clear the search or pick another rarity.",
        }),
      );
    chips.forEach((b, i) => b.classList.toggle("on", RAR[i] === st.r));
  };
  q.oninput = () => {
    st.q = q.value;
    draw();
  };
  chips.forEach(
    (b, i) =>
      (b.onclick = () => {
        st.r = RAR[i];
        draw();
      }),
  );
  m.append(
    h(
      "div",
      { class: "page-head" },
      h("h1", { text: "Characters" }),
      h("p", {
        text: "Browse the roster and find character guides, builds and resources.",
      }),
      count,
    ),
    h("div", { class: "bar" }, q, chips),
    grid,
  );
  draw();
}

function character(id) {
  const m = $("main"),
    c = CH.find((x) => x.id === id);
  m.replaceChildren();
  if (!c) {
    m.append(
      h("p", { text: "That character doesn't exist." }),
      h("a", { href: "#/", text: "Back to all characters" }),
    );
    return;
  }
  document.title = c.name + " | Horizon Walker Wiki";
  const prof = Object.entries(c.profile).filter(
    ([k, v]) => v && !HIDE.includes(k),
  );
  const w = c.weapon,
    S = [];
  if (w && (w.name || w.text || w.image))
    S.push(
      box(
        "Weapon",
        "wide",
        h(
          "div",
          { class: "row cx" },
          img(w.image, "lg", w.name || ""),
          h(
            "div",
            {},
            w.name && h("b", { text: w.name }),
            w.text && h("div", { class: "pre", text: w.text }),
          ),
        ),
      ),
    );
  if (c.stigmas.length)
    S.push(
      box(
        "Stigmas",
        "wide",
        h(
          "div",
          { class: "g2 st" },
          c.stigmas.map((s) =>
            h(
              "div",
              { class: "row" },
              img(s.image, "lg"),
              h(
                "div",
                {},
                h("b", {
                  text: [s.phase, s.name].filter(Boolean).join(": "),
                }),
                s.sets.map((t) => h("div", { class: "pre", text: t })),
                s.substats && h("div", { class: "pre mute", text: s.substats }),
              ),
            ),
          ),
        ),
      ),
    );
  if (c.traits.length)
    S.push(
      box(
        "Traits to get" + (c.traitsWip ? " (work in progress)" : ""),
        "",
        h(
          "div",
          {},
          c.traits.map((t) =>
            h(
              "div",
              { class: "tr" },
              h("b", { text: t.name }),
              h("span", { text: t.effect || "" }),
            ),
          ),
        ),
      ),
    );
  if (c.skills.length)
    S.push(
      box(
        "Skills, in upgrade order",
        "",
        h(
          "div",
          {},
          c.skills.map((s, i) =>
            h(
              "div",
              { class: "row" },
              img(s.icon),
              h(
                "div",
                {},
                h("b", { text: i + 1 + ". " + (s.title || "") }),
                s.description &&
                  h("div", { class: "pre", text: s.description }),
              ),
            ),
          ),
        ),
      ),
    );
  if (c.demigod.length)
    S.push(
      box(
        "Demigod: recommended Mights",
        "",
        h(
          "div",
          { class: "icons" },
          c.demigod.map((d) =>
            h(
              "div",
              { class: "ic" },
              img(d.icon, "", d.name || ""),
              h("div", { text: d.name || "" }),
              d.note && h("div", { text: d.note }),
            ),
          ),
        ),
      ),
    );
  if (c.gifts.length)
    S.push(
      box(
        "Gifts",
        "",
        h(
          "div",
          { class: "icons" },
          c.gifts.map((g) =>
            h(
              "div",
              { class: "ic" },
              img(g.icon, "", g.name),
              h("div", {
                text: g.name + (g.value ? " (" + g.value + ")" : ""),
              }),
            ),
          ),
        ),
      ),
    );
  if (c.overview)
    S.push(
      box("Overview", "wide cx", h("div", { class: "pre", text: c.overview })),
    );
  if (c.story)
    S.push(
      box(
        "Background story",
        "wide cx",
        h("div", { class: "pre", text: c.story }),
      ),
    );
  m.append(
    h("a", { href: "#/", text: "All characters" }),
    h(
      "div",
      { class: "hero", "data-r": c.rarity },
      img(c.portrait, "", c.name),
      h(
        "div",
        {},
        h("h1", { text: c.name }),
        c.rarity && h("span", { class: "badge", text: c.rarity }),
        c.title && h("p", { class: "mute", text: c.title }),
        h(
          "dl",
          {},
          prof.flatMap(([k, v]) => [
            h("dt", { text: k }),
            h("dd", { text: v }),
          ]),
        ),
      ),
    ),
    h("div", { class: "cols" }, S),
  );
}

// Tabs are drawn as a grid that follows the sheet's own rows, columns and merged cells.
function sheetPage(p, label, k) {
  const cs = p.cells,
    min = Math.min(...cs.map((x) => x.r));
  const ban = cs.find((x) => x.r === min && (x.cs || 1) >= 8),
    body = cs.filter((x) => x !== ban);
  const used = [
    ...new Set([...body.map((x) => x.c), ...p.images.map((i) => i.c)]),
  ].sort((a, b) => a - b);
  const dc = (c) => used.indexOf(c) + 1,
    de = (c) => used.filter((u) => u <= c).length;
  const cov = new Set();
  let maxR = min;
  const cover = (r, n) => {
    for (let k = 0; k < n; k++) cov.add(r + k);
    maxR = Math.max(maxR, r + n - 1);
  };
  body.forEach((x) => cover(x.r, x.rs || 1));
  const byRow = {};
  p.images.forEach((i) => (byRow[i.r] ??= []).push(i));
  const occ = {};
  [...body.map((x) => [x.r, x.c]), ...p.images.map((i) => [i.r, i.c])].forEach(
    ([r, c]) => (occ[r] ??= []).push(c),
  );
  const reach = (x) => {
    const n = x.cs || 1;
    if (n > 1 || (x.rs || 1) > 1 || (x.t || "").length < 22)
      return Math.max(de(x.c + n - 1), dc(x.c)) + 1;
    const nx = (occ[x.r] || []).filter((c) => c > x.c).sort((u, v) => u - v)[0];
    return nx ? dc(nx) : used.length + 1;
  };
  const items = body.map((x) => {
    const n = x.cs || 1,
      t = x.t || "",
      u = safe(x.href);
    const k =
      n >= 8
        ? "band"
        : n >= 2 && t.length < 40 && !t.includes("\n")
          ? "hd"
          : "";
    return h(
      "div",
      {
        class: "gc " + k,
        style: `grid-column:${dc(x.c)}/${reach(x)};grid-row:${x.r - min + 1}/span ${x.rs || 1}`,
      },
      u ? ext(u, t || u) : t,
    );
  });
  p.images.forEach((i) => {
    const a = i.a || (i.w && i.h ? i.w / i.h : 1),
      fix = k === "misc",
      wide = a >= 1.8 && !fix;
    const w = fix ? 120 : wide ? 340 : Math.min(Math.max(i.w || 64, 44), 150),
      n = 1;
    cover(i.r, 1);
    const nx = byRow[i.r].filter((o) => o.c > i.c).sort((x, y) => x.c - y.c)[0];
    const end = wide ? (nx ? dc(nx.c) : used.length + 1) : dc(i.c) + 1;
    items.push(
      h("img", {
        src: "img/" + i.src,
        alt: "",
        loading: "lazy",
        style: `grid-column:${dc(i.c)}/${end};grid-row:${i.r - min + 1}/span ${n};width:${wide ? "100%" : w + "px"};max-width:${w}px;height:${fix ? "120px" : "auto"};object-fit:${fix ? "cover" : "contain"};object-position:top;align-self:start`,
      }),
    );
  });
  const rows = [];
  for (let r = min; r <= maxR; r++)
    rows.push(cov.has(r) ? "minmax(" + RH + "px,auto)" : "8px");
  return [
    h("h1", { text: ban ? ban.t : label }),
    h(
      "div",
      { class: "sc" },
      h(
        "div",
        {
          class: "sg",
          style: `grid-template-columns:repeat(${used.length},minmax(0,auto));grid-template-rows:${rows.join(" ")}`,
        },
        items,
      ),
    ),
  ];
}

function resources(p) {
  const links = p.cells.filter((x) => safe(x.href)),
    top = links.filter((x) => x.r < 12),
    rest = links.filter((x) => x.r >= 12);
  const lab = (x) => {
    const t = (x.t || "").trim(),
      i = t.search(/:\s*https?:/);
    return i > 0 ? t.slice(0, i) : /^https?:/.test(t) ? new URL(t).hostname : t;
  };
  const li = (x) => h("li", {}, ext(x.href, lab(x)));
  const side = (f, fb) => {
    const g = rest.filter(f);
    if (!g.length) return null;
    const r0 = Math.min(...g.map((x) => x.r)) - 1,
      hd = p.cells.find((x) => x.r === r0 && !x.href && f(x));
    return box(
      hd ? hd.t.replace(/:\s*$/, "") : fb,
      "",
      h("ul", {}, g.sort((a, b) => a.r - b.r).map(li)),
    );
  };
  const ver = p.cells.find((x) => /^game ver/i.test(x.t || "")),
    log = p.cells.find((x) => /changelog/i.test(x.t || ""));
  return [
    h(
      "div",
      { class: "mast" },
      p.images
        .filter((i) => i.r < 5)
        .sort((a, b) => a.c - b.c)
        .map((i) => img(i.src)),
    ),
    h("h1", { text: "Resources" }),
    ver && h("p", { class: "mute", text: ver.t }),
    h(
      "div",
      { class: "cols" },
      box("Spreadsheets", "", h("ul", {}, top.map(li))),
      side((x) => x.c < 10, "More resources"),
      side((x) => x.c >= 10, "Content creators"),
      log &&
        box(
          "Wiki changelog",
          "wide cx",
          h("div", {
            class: "pre",
            text: log.t.replace(/^wiki changelog:?\s*/i, ""),
          }),
        ),
    ),
  ];
}

function page(k) {
  const m = $("main"),
    p = PG[k];
  m.replaceChildren();
  if (!p) {
    m.append(h("p", { text: "That page doesn't exist." }));
    return;
  }
  const label = LABEL[k] || p.title;
  document.title = label + " | Horizon Walker Wiki";
  m.append(
    ...(k === "main" ? resources(p) : sheetPage(p, label, k)).filter(Boolean),
  );
}

function traits2() {
  const m = $("main");
  m.replaceChildren();
  document.title = "Trait 2 | Horizon Walker Wiki";
  const T = TR.tabs,
    S = st.t2 || (st.t2 = { tab: T[0].id, q: "", stat: "" });
  const tabs = h("div", { class: "bar" }),
    q = h("input", {
      type: "search",
      placeholder: "Search traits",
      value: S.q,
      "aria-label": "Search traits",
    }),
    sel = h("select", { "aria-label": "Filter by stat" }),
    info = h("p", { class: "mute" }),
    list = h("div", { class: "tg" });
  const fmt = (v, p) => (v > 0 ? "+" : "") + +v.toFixed(2) + (p ? "%" : "");
  const draw = () => {
    const t = T.find((x) => x.id === S.tab),
      qq = S.q.trim().toLowerCase();
    tabs.replaceChildren(
      ...T.map((x) => {
        const b = h("button", {
          class: "chip" + (x.id === S.tab ? " on" : ""),
          text: x.title,
        });
        b.onclick = () => {
          S.tab = x.id;
          S.stat = "";
          draw();
        };
        return b;
      }),
    );
    sel.style.display = t.kind === "stats" ? "" : "none";
    if (t.kind === "stats") {
      sel.replaceChildren(
        h("option", { value: "", text: "All stats" }),
        ...t.stats.map((s) => h("option", { value: s.n, text: s.n })),
      );
      sel.value = S.stat;
    }
    const si =
        t.kind === "stats" ? t.stats.findIndex((s) => s.n === S.stat) : -1,
      val = (r) => r.s.find((v) => v[0] === si)[1];
    let rows = t.rows.filter(
      (r) =>
        r.n.toLowerCase().includes(qq) &&
        (si < 0 || r.s.some((v) => v[0] === si)),
    );
    if (si >= 0) rows = rows.sort((x, y) => val(y) - val(x));
    info.textContent =
      rows.length +
      " trait" +
      (rows.length === 1 ? "" : "s") +
      (rows.length > 200
        ? ", showing the first 200: search or pick a stat to narrow it down"
        : "");
    list.replaceChildren(
      ...rows.slice(0, 200).map((r) =>
        h(
          "div",
          { class: "tc" },
          h("b", { text: r.n }),
          t.kind === "text"
            ? h("div", { class: "pre mute", text: r.t })
            : h(
                "div",
                {},
                r.s.map(([i, v]) =>
                  h("span", {
                    class:
                      "sp" + (v < 0 ? " neg" : "") + (i === si ? " hit" : ""),
                    text: t.stats[i].n + " " + fmt(v, t.stats[i].p),
                  }),
                ),
              ),
        ),
      ),
    );
  };
  q.oninput = () => {
    S.q = q.value;
    draw();
  };
  sel.onchange = () => {
    S.stat = sel.value;
    draw();
  };
  m.append(
    h("h1", { text: "Trait 2" }),
    tabs,
    h("div", { class: "bar" }, q, sel),
    info,
    list,
  );
  draw();
}

function stigmas() {
  const m = $("main");
  m.replaceChildren();
  document.title = "Stigma | Horizon Walker Wiki";
  const S = st.sg || (st.sg = { c: "All", q: "" }),
    cols = ["All", ...new Set(SG.map((x) => x.color))];
  const chips = h("div", { class: "bar" }),
    q = h("input", {
      type: "search",
      placeholder: "Search stigmas",
      value: S.q,
      "aria-label": "Search stigmas",
    }),
    grid = h("div", { class: "sgc" });
  const draw = () => {
    chips.replaceChildren(
      ...cols.map((c) => {
        const b = h("button", {
          class: "chip" + (c === S.c ? " on" : ""),
          text: c,
        });
        b.onclick = () => {
          S.c = c;
          draw();
        };
        return b;
      }),
    );
    const list = SG.filter(
      (x) =>
        (S.c === "All" || x.color === S.c) &&
        x.name.toLowerCase().includes(S.q.trim().toLowerCase()),
    );
    grid.replaceChildren(
      ...list.map((x) =>
        h(
          "div",
          { class: "box row", "data-c": x.color },
          img(x.image, "lg", x.name),
          h(
            "div",
            {},
            h("h2", { text: x.name }),
            x.set2 && h("p", {}, h("b", { text: "2 set: " }), x.set2),
            x.set4 && h("p", {}, h("b", { text: "4 set: " }), x.set4),
            x.main.length > 0 &&
              h(
                "div",
                { class: "ms" },
                x.main.map((s) =>
                  h(
                    "div",
                    {},
                    h("b", { text: s.pos ? s.pos + ": " : "" }),
                    s.text,
                  ),
                ),
              ),
          ),
        ),
      ),
    );
    if (!list.length)
      grid.append(
        h("p", {
          class: "mute",
          text: "No stigma matches. Clear the search or pick another colour.",
        }),
      );
  };
  q.oninput = () => {
    S.q = q.value;
    draw();
  };
  m.append(
    h("h1", { text: "Stigma" }),
    h("div", { class: "bar" }, q),
    chips,
    grid,
  );
  draw();
}

function route() {
  const [, k, id] = (location.hash || "#/").split("/");
  if (k === "c") character(decodeURIComponent(id || ""));
  else if (k === "p") page(decodeURIComponent(id || ""));
  else if (k === "t2" && TR) traits2();
  else if (k === "stigma" && SG) stigmas();
  else home();
  document
    .querySelectorAll("nav a")
    .forEach((a) =>
      a.classList.toggle(
        "on",
        a.getAttribute("href") === (location.hash || "#/"),
      ),
    );
  scrollTo(0, 0);
}

const get = (u, opt) =>
  fetch(u)
    .then((r) => {
      if (!r.ok) throw new Error(u);
      return r.json();
    })
    .catch((e) => {
      if (opt) return null;
      throw e;
    });
Promise.all([
  get("data/characters.json"),
  get("data/pages.json"),
  get("data/traits2.json", 1),
  get("data/stigmas.json", 1),
])
  .then(([c, p, t, g]) => {
    CH = c;
    PG = p;
    TR = t;
    SG = g;
    const keys = Object.keys(PG).sort(
      (a, b) => ((ORDER.indexOf(a) + 99) % 99) - ((ORDER.indexOf(b) + 99) % 99),
    );
    $("nav").append(
      ...[
        h("a", { href: "#/", text: "Characters" }),
        ...keys.flatMap((k) => [
          k === "main" && g && h("a", { href: "#/stigma", text: "Stigma" }),
          h("a", { href: "#/p/" + k, text: LABEL[k] || PG[k].title }),
          k === "trait" && t && h("a", { href: "#/t2", text: "Trait 2" }),
        ]),
      ].filter(Boolean),
    );
    addEventListener("hashchange", route);
    route();
  })
  .catch(() => {
    $("main").replaceChildren(
      h("p", { text: "The data could not be loaded." }),
      h("p", {
        class: "mute",
        text: "Open this page through a local server (python -m http.server) instead of double-clicking the file, and check that the data folder is next to index.html.",
      }),
    );
  });
