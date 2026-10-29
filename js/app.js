(() => {
  "use strict";

  /* ---------- Utilitas ---------- */
  const $ = (sel, el = document) => el.querySelector(sel);
  const rupiah = (n) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
  const num = (n) => n.toLocaleString("id-ID");
  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const byId = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const GRINDS = [
    "Biji utuh",
    "Giling kasar (french press, cold brew)",
    "Giling sedang (V60, drip, rice cooker)",
    "Giling halus (espresso, moka pot)",
  ];
  const grindShort = (g) => GRINDS[g].split(" (")[0].toLowerCase();
  const TYPES = { semua: "Semua", biji: "Biji kopi", drip: "Drip bag", alat: "Alat seduh" };
  const CART_KEY = "kopilereng-cart-v1";
  const waLink = (text) => `https://wa.me/${STORE.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

  /* ---------- Ilustrasi kemasan (SVG) ---------- */
  let uid = 0;
  const DISPLAY = "'Bricolage Grotesque', system-ui, sans-serif";
  const BODY = "Figtree, system-ui, sans-serif";

  function rng(seedStr) {
    let a = 0;
    for (const ch of seedStr) a = (Math.imul(a, 31) + ch.charCodeAt(0)) | 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function smooth(p) {
    const n = p.length;
    const f = (v) => v.toFixed(1);
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d + "Z";
  }

  // Garis kontur seperti peta topografi, unik per produk.
  function contours(seed, cx, cy, rings, step) {
    const r = rng(seed);
    const n = 10;
    const base = Array.from({ length: n }, () => 0.78 + r() * 0.42);
    const ph = r() * Math.PI * 2;
    const ox = (r() - 0.5) * 40, oy = (r() - 0.5) * 26;
    let out = "";
    for (let k = 1; k <= rings; k++) {
      const rad = k * step;
      const pts = base.map((b, i) => {
        const a = ph + (i * 2 * Math.PI) / n;
        const j = b * (1 + (r() - 0.5) * 0.1);
        return [cx + ox + Math.cos(a) * rad * j * 1.2, cy + oy + Math.sin(a) * rad * j * 0.9];
      });
      out += `<path d="${smooth(pts)}"/>`;
    }
    return out;
  }

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const f = (v) => Math.round(v * (1 - amt));
    return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
  }

  const mountain = (x, y, color) =>
    `<path d="M${x} ${y} l7 -9 l4.5 5 l4 -4.5 l7.5 8.5" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>`;

  function bagSVG(p) {
    const id = `kl-clip-${++uid}`;
    const body = "M30 44 H170 L178 236 Q179 250 165 250 H35 Q21 250 22 236 Z";
    const size = p.short.length > 8 ? 14 : 16;
    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kemasan ${esc(p.name)}">
      <defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs>
      <path d="${body}" fill="${p.color}"/>
      <g clip-path="url(#${id})">
        <g fill="none" stroke="${p.accent}" stroke-width="1.3" opacity=".55">${contours(p.id, 112, 96, 10, 12)}</g>
        <rect x="20" y="44" width="18" height="210" fill="#fff" opacity=".07"/>
      </g>
      <rect x="26" y="26" width="148" height="21" rx="3" fill="${shade(p.color, 0.32)}"/>
      <path d="M34 36.5 H166" stroke="${p.accent}" stroke-width="1" stroke-dasharray="3 4" opacity=".7"/>
      <rect x="46" y="150" width="108" height="78" rx="5" fill="#F8F8F2"/>
      <text x="100" y="176" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="${size}" fill="#1B2620">${esc(p.short)}</text>
      <text x="100" y="192" text-anchor="middle" font-family="${BODY}" font-size="8.5" fill="#58645A">${esc(p.origin.split(",")[1] ? p.origin.split(",")[1].trim() : p.origin)}</text>
      ${mountain(63, 215, p.color)}
      <text x="92" y="215" font-family="${BODY}" font-weight="700" font-size="10.5" fill="${p.color}">${num(p.altitude)} mdpl</text>
    </svg>`;
  }

  function boxSVG(p) {
    const id = `kl-clip-${++uid}`;
    const body = "M32 74 H168 V240 Q168 248 160 248 H40 Q32 248 32 240 Z";
    const stripeColors = PRODUCTS.filter((x) => x.type === "biji").map((x) => x.color);
    const stripes = p.stripes
      ? stripeColors.map((c, i) => `<rect x="${50 + i * 16.67}" y="212" width="16.67" height="6" fill="${c}"/>`).join("")
      : `<rect x="50" y="212" width="100" height="6" fill="${p.color}"/>`;
    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kemasan ${esc(p.name)}">
      <defs><clipPath id="${id}"><path d="${body}"/></clipPath></defs>
      <path d="M40 52 H160 L168 74 H32 Z" fill="${shade(p.color, 0.3)}"/>
      <path d="${body}" fill="${p.color}"/>
      <g clip-path="url(#${id})" fill="none" stroke="${p.accent}" stroke-width="1.3" opacity=".5">${contours(p.id, 100, 110, 9, 12)}</g>
      <rect x="44" y="140" width="112" height="86" rx="5" fill="#F8F8F2"/>
      <text x="100" y="166" text-anchor="middle" font-family="${DISPLAY}" font-weight="700" font-size="15" fill="#1B2620">Drip bag</text>
      <text x="100" y="185" text-anchor="middle" font-family="${BODY}" font-weight="600" font-size="11" fill="${p.color}">${esc(p.short)}</text>
      <text x="100" y="201" text-anchor="middle" font-family="${BODY}" font-size="8.5" fill="#58645A">12 g per sachet</text>
      ${stripes}
    </svg>`;
  }

  function dripperSVG(p, variant = 0) {
    const c = p.variants[variant].color || p.color;
    const light = parseInt(c.slice(1, 3), 16) > 180;
    const line = light ? "#B9B29C" : shade(c, 0.35);
    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)} warna ${esc(p.variants[variant].label)}">
      <ellipse cx="100" cy="222" rx="62" ry="9" fill="#000" opacity=".08"/>
      <path d="M152 104 q34 4 24 42 q-6 18 -30 16" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round"/>
      <path d="M152 104 q34 4 24 42 q-6 18 -30 16" fill="none" stroke="${line}" stroke-width="1.2" opacity=".5"/>
      <path d="M40 86 H160 L122 196 H78 Z" fill="${c}"/>
      <path d="M40 86 H160 L122 196 H78 Z" fill="none" stroke="${line}" stroke-width="1.2"/>
      <g stroke="${line}" stroke-width="1.4" opacity=".7">
        <path d="M70 96 L88 186"/><path d="M90 96 L96 186"/><path d="M110 96 L104 186"/><path d="M130 96 L112 186"/>
      </g>
      <rect x="34" y="78" width="132" height="12" rx="6" fill="${c}" stroke="${line}" stroke-width="1.2"/>
      <rect x="62" y="196" width="76" height="16" rx="4" fill="${c}" stroke="${line}" stroke-width="1.2"/>
    </svg>`;
  }

  function filterSVG(p) {
    const sheet = (dx, dy, rot) =>
      `<g transform="translate(${dx} ${dy}) rotate(${rot} 100 150)">
        <path d="M46 96 H154 L128 206 H72 Z" fill="#F7F3E6" stroke="#C9C0A6" stroke-width="1.2"/>
        <path d="M128 206 H72 L74 198 H126 Z" fill="#E9E1C9"/>
        <path d="M150 104 L126 200" stroke="#D8CFB3" stroke-width="1" stroke-dasharray="2 3"/>
      </g>`;
    return `<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(p.name)}">
      <ellipse cx="100" cy="226" rx="66" ry="9" fill="#000" opacity=".08"/>
      ${sheet(-14, 10, -9)}${sheet(10, 4, 7)}${sheet(0, 14, 0)}
    </svg>`;
  }

  function art(p, variant) {
    if (p.art === "box") return boxSVG(p);
    if (p.art === "dripper") return dripperSVG(p, variant);
    if (p.art === "filter") return filterSVG(p);
    return bagSVG(p);
  }

  const metaOf = (p) =>
    p.type === "biji"
      ? `${p.origin}, ${num(p.altitude)} mdpl, proses ${p.process.toLowerCase()}`
      : p.meta;

  /* ---------- Hero dan grafik ketinggian ---------- */
  function renderHero() {
    $("#heroArt").innerHTML = ["kintamani", "gayo", "toraja"]
      .map((id, i) => `<div class="fan-item fan-${i}">${bagSVG(byId[id])}</div>`)
      .join("");
  }

  function renderAltitude() {
    const beans = PRODUCTS.filter((p) => p.type === "biji").sort((a, b) => a.altitude - b.altitude);
    const min = 1000, max = 1750;
    $("#altChart").innerHTML = beans
      .map((p) => {
        const h = (((p.altitude - min) / (max - min)) * 100).toFixed(1);
        return `<li>
          <button class="alt-col" type="button" data-open="${p.id}" style="--c:${p.color};--h:${h}%" aria-label="${esc(p.name)}, ${num(p.altitude)} meter di atas permukaan laut">
            <span class="alt-val">${num(p.altitude)}<small> mdpl</small></span>
            <span class="alt-bar"><span class="alt-name">${esc(p.short)}</span></span>
          </button>
        </li>`;
      })
      .join("");
  }

  /* ---------- Katalog ---------- */
  const state = { cat: "semua", q: "", sort: "rekomendasi" };

  function renderChips() {
    $("#chips").innerHTML = Object.entries(TYPES)
      .map(([key, label]) => {
        const count = key === "semua" ? PRODUCTS.length : PRODUCTS.filter((p) => p.type === key).length;
        return `<button type="button" class="chip" data-cat="${key}" aria-pressed="${state.cat === key}">${label} <span class="chip-n">${count}</span></button>`;
      })
      .join("");
  }

  function matches(p, q) {
    if (!q) return true;
    const hay = [p.name, p.origin, p.process, p.meta, (p.notes || []).join(" "), TYPES[p.type]]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return q
      .toLowerCase()
      .split(/\s+/)
      .every((w) => hay.includes(w));
  }

  function card(p) {
    const notes = (p.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
    return `<li class="card" style="--c:${p.color}">
      <button class="card-art" type="button" data-open="${p.id}" aria-label="Lihat detail ${esc(p.name)}">
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
        ${art(p, 0)}
      </button>
      <div class="card-body">
        <h3 class="card-title"><button type="button" class="title-btn" data-open="${p.id}">${esc(p.name)}</button></h3>
        <p class="card-meta">${esc(metaOf(p))}</p>
        ${notes ? `<ul class="notes" aria-label="Catatan rasa">${notes}</ul>` : ""}
        <div class="card-foot">
          <p class="price">${p.variants.length > 1 && p.variants[0].price !== p.variants[1].price ? '<span class="from">mulai</span>' : ""}${rupiah(p.variants[0].price)}</p>
          <button class="btn btn-small" type="button" data-add="${p.id}" aria-label="Tambah ${esc(p.name)} ${esc(p.variants[0].label)} ke keranjang">Tambah</button>
        </div>
      </div>
    </li>`;
  }

  function renderGrid() {
    let list = PRODUCTS.filter((p) => (state.cat === "semua" || p.type === state.cat) && matches(p, state.q));
    const sorters = {
      rekomendasi: (a, b) => a.rank - b.rank,
      murah: (a, b) => a.variants[0].price - b.variants[0].price,
      mahal: (a, b) => b.variants[0].price - a.variants[0].price,
      tinggi: (a, b) => (b.altitude || 0) - (a.altitude || 0) || a.rank - b.rank,
    };
    list = list.slice().sort(sorters[state.sort]);
    const grid = $("#grid");
    if (!list.length) {
      grid.innerHTML = `<li class="empty">
        <p>Tidak ada produk yang cocok dengan “${esc(state.q)}”.</p>
        <button class="btn btn-ghost btn-small" type="button" id="resetFilter">Tampilkan semua produk</button>
      </li>`;
    } else {
      grid.innerHTML = list.map(card).join("");
    }
    $("#resultInfo").textContent =
      `${list.length} produk` + (state.q ? ` untuk “${state.q}”` : "") + (state.cat !== "semua" ? ` di ${TYPES[state.cat]}` : "");
  }

  /* ---------- Keranjang ---------- */
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch (_) {
    cart = [];
  }
  cart = Array.isArray(cart)
    ? cart.filter((l) => l && byId[l.id] && byId[l.id].variants[l.v] && l.qty > 0)
    : [];

  function save() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (_) {
      /* penyimpanan tidak tersedia, keranjang tetap jalan di sesi ini */
    }
  }

  function lineInfo(l) {
    const p = byId[l.id];
    const variant = p.variants[l.v];
    const parts = [variant.label];
    if (p.type === "biji") parts.push(grindShort(l.g));
    return { p, variant, label: parts.join(", "), total: variant.price * l.qty };
  }

  const subtotal = () => cart.reduce((s, l) => s + lineInfo(l).total, 0);
  const itemCount = () => cart.reduce((s, l) => s + l.qty, 0);

  function addToCart(id, v = 0, g = 0, qty = 1) {
    const p = byId[id];
    const gg = p.type === "biji" ? g : 0;
    const key = `${id}|${v}|${gg}`;
    const line = cart.find((l) => l.key === key);
    if (line) line.qty = Math.min(line.qty + qty, 99);
    else cart.push({ key, id, v, g: gg, qty });
    save();
    renderCart();
    const info = lineInfo({ id, v, g: gg, qty });
    toast(`${p.name}, ${info.label} masuk keranjang`);
    const btn = $("#cartOpen");
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  function renderCart() {
    $("#cartCount").textContent = itemCount();
    const empty = cart.length === 0;
    $("#cartEmpty").hidden = !empty;
    $("#cartFoot").hidden = empty;
    $("#subtotal").textContent = rupiah(subtotal());
    $("#subtotal2").textContent = rupiah(subtotal());
    $("#cartLines").innerHTML = cart
      .map((l) => {
        const { p, label, total } = lineInfo(l);
        return `<li class="line" style="--c:${p.color}">
          <div class="line-thumb">${art(p, l.v)}</div>
          <div class="line-main">
            <p class="line-name">${esc(p.name)}</p>
            <p class="line-sub">${esc(label)}</p>
            <div class="line-actions">
              <div class="qty qty-small" role="group" aria-label="Jumlah ${esc(p.name)}">
                <button type="button" data-dec="${l.key}" aria-label="Kurangi">−</button>
                <span>${l.qty}</span>
                <button type="button" data-inc="${l.key}" aria-label="Tambah">+</button>
              </div>
              <button type="button" class="link-btn" data-remove="${l.key}">Hapus</button>
            </div>
          </div>
          <p class="line-price">${rupiah(total)}</p>
        </li>`;
      })
      .join("");
  }

  function changeQty(key, delta) {
    const line = cart.find((l) => l.key === key);
    if (!line) return;
    line.qty += delta;
    if (line.qty <= 0) cart = cart.filter((l) => l !== line);
    if (line.qty > 99) line.qty = 99;
    save();
    renderCart();
  }

  /* ---------- Dialog ---------- */
  const productDialog = $("#productDialog");
  const cartDialog = $("#cartDialog");

  function openDialog(d) {
    if (typeof d.showModal === "function") d.showModal();
    else d.setAttribute("open", "");
    document.body.classList.add("locked");
  }
  function closeDialog(d) {
    if (typeof d.close === "function") d.close();
    else d.removeAttribute("open");
  }
  [productDialog, cartDialog].forEach((d) => {
    d.addEventListener("close", () => {
      if (!productDialog.open && !cartDialog.open) document.body.classList.remove("locked");
    });
    d.addEventListener("click", (e) => {
      if (e.target === d) closeDialog(d);
    });
  });

  function openProduct(id) {
    const p = byId[id];
    if (!p) return;
    const sel = { v: 0, g: 0, qty: 1 };
    const notes = (p.notes || []).map((n) => `<li>${esc(n)}</li>`).join("");
    $("#productBody").innerHTML = `
      <div class="pd" style="--c:${p.color}">
        <div class="pd-art" id="pdArt">${art(p, 0)}</div>
        <div class="pd-info">
          <h2 id="pdTitle">${esc(p.name)}</h2>
          <p class="pd-meta">${esc(metaOf(p))}</p>
          <p class="pd-desc">${esc(p.desc)}</p>
          ${notes ? `<p class="pd-label">Catatan rasa</p><ul class="notes">${notes}</ul>` : ""}
          <fieldset class="seg">
            <legend class="pd-label">${esc(p.variantLabel || "Pilihan")}</legend>
            <div class="seg-options">
              ${p.variants
                .map(
                  (v, i) => `<label><input type="radio" name="pdVariant" value="${i}" ${i === 0 ? "checked" : ""}>
                    <span>${esc(v.label)}${p.variants.some((x) => x.price !== v.price) ? `<small>${rupiah(v.price)}</small>` : ""}</span></label>`
                )
                .join("")}
            </div>
          </fieldset>
          ${
            p.type === "biji"
              ? `<div class="field"><label class="pd-label" for="pdGrind">Gilingan</label>
                 <select id="pdGrind">${GRINDS.map((g, i) => `<option value="${i}">${esc(g)}</option>`).join("")}</select></div>`
              : ""
          }
          <div class="pd-buy">
            <div class="qty" role="group" aria-label="Jumlah">
              <button type="button" id="pdDec" aria-label="Kurangi jumlah">−</button>
              <span id="pdQty">1</span>
              <button type="button" id="pdInc" aria-label="Tambah jumlah">+</button>
            </div>
            <button class="btn btn-primary pd-add" type="button" id="pdAdd">Masukkan keranjang <span class="pd-total" id="pdTotal"></span></button>
          </div>
        </div>
      </div>`;

    const update = () => {
      $("#pdQty").textContent = sel.qty;
      $("#pdTotal").textContent = rupiah(p.variants[sel.v].price * sel.qty);
      $("#pdDec").disabled = sel.qty <= 1;
    };
    $("#productBody").querySelectorAll('input[name="pdVariant"]').forEach((r) =>
      r.addEventListener("change", () => {
        sel.v = Number(r.value);
        if (p.art === "dripper") $("#pdArt").innerHTML = art(p, sel.v);
        update();
      })
    );
    const grind = $("#pdGrind");
    if (grind) grind.addEventListener("change", () => (sel.g = Number(grind.value)));
    $("#pdDec").addEventListener("click", () => { sel.qty = Math.max(1, sel.qty - 1); update(); });
    $("#pdInc").addEventListener("click", () => { sel.qty = Math.min(99, sel.qty + 1); update(); });
    $("#pdAdd").addEventListener("click", () => {
      addToCart(p.id, sel.v, sel.g, sel.qty);
      closeDialog(productDialog);
    });
    update();
    openDialog(productDialog);
  }

  function showView(name) {
    ["viewCart", "viewCheckout", "viewDone"].forEach((v) => ($("#" + v).hidden = v !== name));
    $("#cartTitle").textContent = { viewCart: "Keranjang", viewCheckout: "Alamat pengiriman", viewDone: "Pesanan dibuat" }[name];
  }

  function openCart() {
    showView("viewCart");
    renderCart();
    openDialog(cartDialog);
  }

  /* ---------- Checkout ---------- */
  const form = $("#viewCheckout");
  try {
    const saved = JSON.parse(localStorage.getItem("kopilereng-customer") || "null");
    if (saved) ["name", "phone", "address", "city", "courier"].forEach((k) => saved[k] && (form.elements[k].value = saved[k]));
  } catch (_) { /* abaikan */ }

  function setErr(id, msg) {
    const input = $("#" + id);
    $(`#${id}-err`).textContent = msg || "";
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    input.setAttribute("aria-describedby", `${id}-err`);
    return !msg;
  }

  function validate() {
    const v = Object.fromEntries(new FormData(form));
    const phone = (v.phone || "").replace(/[\s-]/g, "");
    const checks = [
      setErr("fName", v.name.trim().length < 2 ? "Isi nama penerima." : ""),
      setErr("fPhone", !/^(\+62|62|0)8\d{7,12}$/.test(phone) ? "Isi nomor WhatsApp yang diawali 08, contoh 081234567890." : ""),
      setErr("fAddress", v.address.trim().length < 10 ? "Isi alamat lengkap supaya kurir tidak salah kirim." : ""),
      setErr("fCity", v.city.trim().length < 3 ? "Isi kota atau kabupaten tujuan." : ""),
      setErr("fCourier", !v.courier ? "Pilih kurir pengiriman." : ""),
    ];
    if (checks.includes(false)) {
      const first = form.querySelector('[aria-invalid="true"]');
      if (first) first.focus();
      return null;
    }
    return { ...v, phone };
  }

  function orderNumber() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `KL-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function buildMessage(c, no) {
    const lines = cart.map((l, i) => {
      const { p, label, total } = lineInfo(l);
      return `${i + 1}. ${p.name}, ${label} x${l.qty} = ${rupiah(total)}`;
    });
    return [
      `Halo ${STORE.name}, saya mau pesan:`,
      "",
      ...lines,
      "",
      `Subtotal: ${rupiah(subtotal())}`,
      "Ongkir: mohon dihitungkan",
      "",
      `Nama: ${c.name.trim()}`,
      `No. WhatsApp: ${c.phone}`,
      `Alamat: ${c.address.trim()}, ${c.city.trim()}`,
      `Kurir: ${c.courier}`,
      c.note && c.note.trim() ? `Catatan: ${c.note.trim()}` : null,
      "",
      `No. pesanan: ${no}`,
    ]
      .filter((x) => x !== null)
      .join("\n");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cart.length) return showView("viewCart");
    const c = validate();
    if (!c) return;
    const no = orderNumber();
    const url = waLink(buildMessage(c, no));
    try {
      localStorage.setItem("kopilereng-customer", JSON.stringify({ name: c.name, phone: c.phone, address: c.address, city: c.city, courier: c.courier }));
    } catch (_) { /* abaikan */ }
    $("#orderNo").textContent = no;
    $("#waAgain").href = url;
    window.open(url, "_blank", "noopener");
    cart = [];
    save();
    renderCart();
    form.elements.note.value = "";
    showView("viewDone");
  });

  form.addEventListener("input", (e) => {
    if (e.target.getAttribute("aria-invalid") === "true") setErr(e.target.id, "");
  });

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.dataset.show = "true";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.dataset.show = "false"), 2400);
  }

  /* ---------- Event ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.dataset.open) return openProduct(t.dataset.open);
    if (t.dataset.add) return addToCart(t.dataset.add);
    if (t.dataset.cat) {
      state.cat = t.dataset.cat;
      renderChips();
      renderGrid();
      return;
    }
    if (t.dataset.inc) return changeQty(t.dataset.inc, 1);
    if (t.dataset.dec) return changeQty(t.dataset.dec, -1);
    if (t.dataset.remove) {
      const name = lineInfo(cart.find((l) => l.key === t.dataset.remove)).p.name;
      cart = cart.filter((l) => l.key !== t.dataset.remove);
      save();
      renderCart();
      toast(`${name} dihapus dari keranjang`);
      return;
    }
    if (t.hasAttribute("data-close")) {
      const d = t.closest("dialog");
      if (d) closeDialog(d);
      return;
    }
    if (t.id === "resetFilter") {
      state.q = "";
      state.cat = "semua";
      $("#search").value = "";
      renderChips();
      renderGrid();
    }
  });

  $("#cartOpen").addEventListener("click", openCart);
  $("#toCheckout").addEventListener("click", () => {
    showView("viewCheckout");
    form.elements.name.focus();
  });
  $("#backToCart").addEventListener("click", () => showView("viewCart"));

  let searchTimer;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.q = e.target.value.trim();
      renderGrid();
    }, 120);
  });
  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  $("#footerWa").href = waLink("Halo Kopi Lereng, saya mau tanya.");

  /* ---------- Mulai ---------- */
  renderHero();
  renderAltitude();
  renderChips();
  renderGrid();
  renderCart();
})();
