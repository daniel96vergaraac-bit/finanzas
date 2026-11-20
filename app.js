'use strict';
/* Mis Finanzas v2 — simple, sin alertas, sin consejos.
   Datos en localStorage (clave KEY). La app anterior guardaba en OLD_KEY: NUNCA se borra. */
const APP_VERSION = '2.0';
const KEY = 'finanzas-v2';
const OLD_KEY = 'finanzas-dv-v1';
const DATA_VERSION = 1;

/* ---------- utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const r2 = n => Math.round((+n || 0) * 100) / 100;
const num = v => { const n = parseFloat(String(v).replace(/[^0-9.\-]/g, '')); return isFinite(n) ? n : 0; };
const money = n => Math.abs(r2(n)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = n => (r2(n) < 0 ? '−' : '') + 'S/' + money(n);
const fmtBig = n => { const s = money(n); const i = s.lastIndexOf('.'); return `${r2(n) < 0 ? '−' : ''}<small>S/</small>${s.slice(0, i)}<small>${s.slice(i)}</small>`; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
const lastDay = (y, m) => new Date(y, m, 0).getDate();
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const fdate = s => { const d = parse(s); return d.getDate() + ' ' + MES[d.getMonth()]; };
const mkey = s => s.slice(0, 7);
const monthLabel = k => { const [y, m] = k.split('-').map(Number); return MESL[m - 1] + ' ' + y; };
const OVERRIDE = new URLSearchParams(location.search).get('hoy');
const today = () => (OVERRIDE && /^\d{4}-\d{2}-\d{2}$/.test(OVERRIDE)) ? OVERRIDE : iso(new Date());
const monthsFrom = (start, n) => { let [y, m] = start.split('-').map(Number); const out = []; for (let i = 0; i < n; i++) { out.push(y + '-' + pad(m)); m++; if (m > 12) { m = 1; y++; } } return out; };
const prevMonth = k => { let [y, m] = k.split('-').map(Number); m--; if (m < 1) { m = 12; y--; } return y + '-' + pad(m); };

const ACC = {
  dia: { name: 'Día a día', sub: 'BCP ··· 3020' },
  pagos: { name: 'Pagos', sub: 'BCP ··· 4008' },
  cts: { name: 'CTS', sub: 'Interbank ··· 4030 · Cusco' },
  cusco: { name: 'Apartado Cusco', sub: 'dentro de Día a día' },
  ahorro: { name: 'Ahorro', sub: 'Wardadito BCP' }
};

/* ---------- datos iniciales ---------- */
function seed() {
  const S = {
    app: 'mis-finanzas-v2', dv: DATA_VERSION, start: '2026-11-19',
    init: { dia: 1527.61, pagos: 67.40, cts: 595.88, cusco: 0, ahorro: 0 },
    cuscoTarget: 900, ahorroStart: '2026-12-15',
    movs: [], events: [], incomes: [], fixed: [], card: [], cyclePay: { '2027-01': '2026-12-28' }
  };
  const ev = (date, title, icon) => S.events.push({ id: 'e' + S.events.length, date, title, icon, done: false });
  ev('2026-11-27', 'Black Friday (con tarjeta)', '🛍️');
  ev('2026-12-10', 'Comprar equipo moto (antes del 11)', '🪖');
  ev('2026-12-11', 'Entrega de moto · cierre de tarjeta', '🏍️');
  ev('2026-12-12', 'Revisar estado de cuenta real', '🧾');
  ev('2026-12-20', 'Pasar CTS a BCP (Cusco)', '🔁');
  ev('2026-12-22', 'Despachar maleta por carguero (22–23 dic)', '🧳');
  ev('2026-12-29', 'Vuelo a Cusco 09:40', '✈️');
  ev('2027-01-06', 'Vuelo de regreso 23:15', '✈️');

  const inc = (date, label, amount, split, extra) => S.incomes.push(Object.assign({ id: 'i' + S.incomes.length, date, label, amount, sure: true, split }, extra || {}));
  inc('2026-11-30', 'Sueldo', 800, [{ to: 'pagos', amount: 800 }]);
  inc('2026-12-05', 'Honorarios BCP (~5 dic)', 800, [{ to: 'pagos', amount: 500 }, { to: 'dia', amount: 300 }]);
  inc('2026-12-15', 'Quincena + gratificación', 4034, [{ to: 'pagos', amount: 2764 }, { to: 'ahorro', amount: 1270 }]);
  inc('2026-12-31', 'Sueldo', 800, [{ to: 'dia', amount: 800 }]);
  for (const k of monthsFrom('2027-01', 12)) {
    const [y, m] = k.split('-').map(Number);
    inc(k + '-15', 'Quincena', 1200, [{ to: 'pagos', amount: 1200 }]);
    inc(k + '-' + pad(lastDay(y, m)), 'Sueldo', 800, [{ to: 'dia', amount: 800 }]);
  }
  const prob = (date, label, amount, src) => inc(date, label, amount, null, { sure: false, src });
  for (const k of monthsFrom('2026-11', 14)) {
    const [y, m] = k.split('-').map(Number); const end = k + '-' + pad(lastDay(y, m));
    if (k !== '2026-11') prob(k + '-15', 'Grupo IAL', 750, 'ial');
    prob(end, 'Grupo IAL', 750, 'ial');
    prob(end, 'Andrés', 400, 'andres');
  }
  prob('2026-12-07', 'Mamá', 250, 'mama');
  prob('2026-12-30', 'Mamá', 250, 'mama');
  S.incomes.sort((a, b) => a.date.localeCompare(b.date));

  const fx = (month, label, amount, icon, kind, date) => S.fixed.push({ id: 'f' + S.fixed.length, month, label, amount, icon, kind: kind || 'normal', date: date || null, done: false });
  fx('2026-11', 'Grabación IAL', 90, '🎬', 'normal', '2026-11-21');
  fx('2026-11', 'Grabación IAL', 90, '🎬', 'normal', '2026-11-24');
  fx('2026-11', 'Celular', 61, '📱');
  fx('2026-12', 'Alineadores', 300, '🦷');
  fx('2026-12', 'Gasolina', 100, '⛽');
  fx('2026-12', 'Navidad', 200, '🎄');
  fx('2026-12', 'Celular', 61, '📱');
  for (const k of monthsFrom('2027-01', 12)) {
    fx(k, 'Gasolina + vida diaria', 660, '⛽', 'daily');
    fx(k, 'Fútbol (si llegó IAL)', 300, '⚽', 'ifIal');
    fx(k, 'Entretenimiento', 100, '🎮');
  }

  const it = (cycle, label, est, o) => S.card.push(Object.assign({ id: 'c' + S.card.length, cycle, label, est, real: null, bought: false, trip: false, debt: null }, o || {}));
  it('2027-01', 'Cuota PS5 (2 de 6)', 431.50, { bought: true, debt: 'ps5' });
  it('2027-01', 'Cuota moto (1 de 6)', 661.50, { bought: true, debt: 'moto' });
  it('2027-01', 'Google One', 8);
  it('2027-01', 'SOAT moto', 700);
  it('2027-01', 'Casco', 350);
  it('2027-01', 'Guantes', 100);
  it('2027-01', 'Ropa (Black Friday)', 300);
  it('2027-01', 'Zapatillas Tommy (Black Friday)', 256);
  it('2027-01', 'Vuelo ida JetSMART', 458.63, { bought: true, trip: true });
  it('2027-01', 'Vuelo vuelta LATAM (US$86.05)', 305, { bought: true, trip: true });
  it('2027-01', 'Airbnb Cusco', 400, { trip: true });
  it('2027-01', 'Consumos corridos desde nov', 69);
  monthsFrom('2027-02', 5).forEach((k, i) => {
    if (i < 4) it(k, `Cuota PS5 (${i + 3} de 6)`, 431.50, { bought: true, debt: 'ps5' });
    it(k, `Cuota moto (${i + 2} de 6)`, 661.50, { bought: true, debt: 'moto' });
    it(k, 'Google One', 8);
  });
  return S;
}
const DEBTS = [
  { id: 'ps5', label: 'PS5', icon: '🎮', total: 2589, n: 6, cuota: 431.50, paidBefore: 1 },
  { id: 'moto', label: 'Moto', icon: '🏍️', total: 3969, n: 6, cuota: 661.50, paidBefore: 0 }
];

/* ---------- guardar / cargar ---------- */
let S;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) {}
  if (raw) { try { S = JSON.parse(raw); } catch (e) { try { localStorage.setItem(KEY + '-ilegible-' + Date.now(), raw); } catch (e2) {} S = null; } }
  if (!S || !Array.isArray(S.movs)) S = seed();
  save();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
function oldData() { try { return localStorage.getItem(OLD_KEY); } catch (e) { return null; } }

/* ---------- cálculos ---------- */
function balances() {
  const b = Object.assign({}, S.init);
  for (const m of S.movs) {
    if (m.type === 'gasto' || m.type === 'pagoTarjeta') b[m.acc] -= m.amount;
    else if (m.type === 'ingreso') for (const p of m.parts) b[p.to] += p.amount;
    else if (m.type === 'mover') { b[m.from] -= m.amount; b[m.to] += m.amount; }
  }
  for (const k in b) b[k] = r2(b[k]);
  return b;
}
const cuscoNow = b => r2(b.cts + b.cusco);
// Ciclo de la tarjeta: cierra el 11, vence el 5 del mes siguiente. La clave es el mes de vencimiento.
function cycleOf(date) {
  let [y, m, d] = date.split('-').map(Number);
  if (d > 11) m++;
  m++;
  while (m > 12) { m -= 12; y++; }
  return y + '-' + pad(m);
}
const payDate = k => S.cyclePay[k] || prevMonth(k) + '-28';
const dueLabel = k => '5 ' + MES[+k.slice(5) - 1];
const linkedSum = id => r2(S.movs.filter(m => m.type === 'tarjeta' && m.cardItem === id).reduce((a, m) => a + m.amount, 0));
function itemInfo(it) {
  const l = linkedSum(it.id);
  if (l > 0) return { amt: l, real: true };
  if (it.real != null) return { amt: it.real, real: true };
  return { amt: it.est, real: !!it.bought };
}
const cyclePaid = k => S.movs.some(m => m.type === 'pagoTarjeta' && m.cycle === k);
const looseCard = k => S.movs.filter(m => m.type === 'tarjeta' && !m.cardItem && cycleOf(m.date) === k);
function cycleTotal(k) {
  return r2(S.card.filter(i => i.cycle === k).reduce((a, i) => a + itemInfo(i).amt, 0) + looseCard(k).reduce((a, m) => a + m.amount, 0));
}
function cycleKeys() {
  const set = new Set(S.card.map(i => i.cycle));
  S.movs.forEach(m => { if (m.type === 'tarjeta' && !m.cardItem) set.add(cycleOf(m.date)); });
  return [...set].sort();
}
const openCycles = () => cycleKeys().filter(k => !cyclePaid(k) && cycleTotal(k) > 0);
const received = i => S.movs.find(m => m.type === 'ingreso' && m.incomeId === i.id);
function cardStatus() {
  const k = openCycles()[0]; if (!k) return null;
  const pd = payDate(k), b = balances();
  const total = cycleTotal(k);
  const coming = r2(S.incomes.filter(i => i.sure && !i.skipped && !received(i) && i.date <= pd)
    .reduce((a, i) => a + i.split.filter(p => p.to === 'pagos').reduce((x, p) => x + p.amount, 0), 0));
  const have = r2(b.pagos + coming);
  return { k, pd, total, pagos: b.pagos, coming, have, gap: r2(total - have) };
}
const ialIn = k => S.movs.some(m => m.type === 'ingreso' && m.incomeId && mkey(m.date) === k && (S.incomes.find(i => i.id === m.incomeId) || {}).src === 'ial');
const fixedLinked = id => r2(S.movs.filter(m => m.type === 'gasto' && m.fixedId === id).reduce((a, m) => a + m.amount, 0));
function fixedPending(f) {
  if (f.done) return 0;
  if (f.kind === 'ifIal' && !ialIn(f.month)) return 0;
  return Math.max(0, r2(f.amount - fixedLinked(f.id)));
}
const dailySpent = k => r2(S.movs.filter(m => m.type === 'gasto' && m.acc === 'dia' && !m.fixedId && mkey(m.date) === k).reduce((a, m) => a + m.amount, 0));
function spendToday() {
  const t = today(), b = balances();
  const fixed = r2(S.fixed.filter(f => f.month === mkey(t) && f.kind !== 'daily').reduce((a, f) => a + fixedPending(f), 0));
  const next = S.incomes.find(i => i.sure && !i.skipped && !received(i) && i.date > t && i.split.some(p => p.to === 'dia'));
  const days = next ? Math.max(1, diffDays(next.date, t)) : Math.max(1, lastDay(+t.slice(0, 4), +t.slice(5, 7)) - +t.slice(8) + 1);
  return { value: r2((b.dia - fixed) / days), free: b.dia, fixed, days, next, apartado: b.cusco };
}
function ruleSplit(amount, excludeMovId) {
  const b = balances();
  let now = cuscoNow(b);
  if (excludeMovId) { const m = S.movs.find(x => x.id === excludeMovId); if (m) now -= (m.parts.find(p => p.to === 'cusco') || { amount: 0 }).amount; }
  const falta = Math.max(0, r2(S.cuscoTarget - now));
  const c = Math.min(amount, falta), rest = r2(amount - c);
  return [c > 0 && { to: 'cusco', amount: r2(c) }, rest > 0 && { to: 'ahorro', amount: rest }].filter(Boolean);
}
function adjustSplit(split, amount) {
  const parts = split.map(p => ({ to: p.to, amount: p.amount }));
  const exp = parts.reduce((a, p) => a + p.amount, 0);
  let diff = r2(amount - exp);
  for (let i = parts.length - 1; i >= 0 && diff !== 0; i--) {
    const n = Math.max(0, r2(parts[i].amount + diff)); diff = r2(diff - (n - parts[i].amount)); parts[i].amount = n;
  }
  return parts.filter(p => p.amount > 0);
}
function timeline() {
  const t = today(), out = [];
  S.events.forEach(e => out.push({ k: 'ev', date: e.date, icon: e.icon, title: e.title, done: e.done || e.date < t, ref: e }));
  S.incomes.forEach(i => { if (!i.skipped) out.push({ k: i.sure ? 'in' : 'prob', date: i.date, icon: '💰', title: i.label, amount: i.amount, done: !!received(i), ref: i }); });
  S.fixed.filter(f => f.date).forEach(f => out.push({ k: 'fix', date: f.date, icon: f.icon, title: f.label, amount: f.amount, done: fixedPending(f) <= 0, ref: f }));
  cycleKeys().forEach(k => { const tot = cycleTotal(k); if (tot > 0) out.push({ k: 'card', date: payDate(k), icon: '💳', title: 'PAGAR TARJETA (vence ' + dueLabel(k) + ')', amount: tot, done: cyclePaid(k), ref: k }); });
  const order = { in: 0, prob: 1, card: 2, fix: 3, ev: 4 };
  return out.sort((a, b) => a.date.localeCompare(b.date) || order[a.k] - order[b.k]);
}

/* ---------- interfaz ---------- */
const ui = { tab: 'inicio', sheet: null, moreMonths: false, importData: null, swipeOpen: null, undo: null };
const view = $('#view');

function render() {
  const t = parse(today());
  $('#top').innerHTML = `<b>Mis Finanzas</b><span>${DIAS[t.getDay()]} ${fdate(today())}</span>`;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.v === ui.tab));
  $('#fab').hidden = ui.tab === 'plan';
  view.innerHTML = ui.tab === 'inicio' ? vInicio() : ui.tab === 'movs' ? vMovs() : vPlan();
  renderSheet();
}

function statusLine() {
  const c = cardStatus();
  if (c && c.gap > 0.009) return `<div class="status bad">⚠️ Faltan ${fmt(c.gap)} para el pago del ${fdate(c.pd)}</div>`;
  return `<div class="status ok">✅ Todo cubierto</div>`;
}

function bar(pct, cls) { return `<div class="bar"><i class="${cls}" style="width:${Math.max(0, Math.min(100, pct)).toFixed(1)}%"></i></div>`; }

function goalsHTML(b) {
  const c = cuscoNow(b), pc = c / S.cuscoTarget * 100, done = c >= S.cuscoTarget - 0.009;
  const a = b.ahorro, started = today() >= S.ahorroStart || a > 0;
  const hito = Math.max(1000, Math.ceil((a + 0.01) / 1000) * 1000);
  return `<div class="card goals">
    <div class="goal"><div class="row"><b>🏔️ Bolsillo Cusco</b><span class="${done ? 'g' : 'y'}">${fmt(c)} <em>de ${fmt(S.cuscoTarget)}</em></span></div>
      ${bar(pc, done ? 'g' : 'y')}
      <p class="mut">CTS ${fmt(b.cts)}${b.cusco > 0 ? ` + apartado ${fmt(b.cusco)}` : ''}${done ? '' : ` · faltan ${fmt(S.cuscoTarget - c)}`}</p></div>
    <div class="goal"><div class="row"><b>🐷 Ahorro</b><span class="g">${fmt(a)}</span></div>
      ${bar(started ? a / hito * 100 : 0, 'g')}
      <p class="mut">${started ? 'Meta abierta · hito ' + fmt(hito) : 'Empieza el ' + fdate(S.ahorroStart)}</p></div>
  </div>`;
}

function cardBoxHTML() {
  const c = cardStatus();
  if (!c) return `<div class="card"><div class="row"><b>💳 Tarjeta</b><span class="g">Sin pagos pendientes</span></div></div>`;
  const ok = c.gap <= 0.009;
  return `<div class="card cardbox">
    <div class="row"><b>💳 Próximo pago de tarjeta</b><span class="pill">${fdate(c.pd)}</span></div>
    <div class="kv"><span>Monto estimado (vence ${dueLabel(c.k)})</span><b>${fmt(c.total)}</b></div>
    <div class="kv"><span>Hoy en Pagos</span><b>${fmt(c.pagos)}</b></div>
    <div class="kv"><span>Llegará antes del ${fdate(c.pd)}</span><b>+${fmt(c.coming)}</b></div>
    <div class="kv total ${ok ? 'g' : 'r'}"><span>${ok ? '✅ Cubierto' : '⚠️ Faltan'}</span><b>${ok ? 'sobran ' + fmt(-c.gap) : fmt(c.gap)}</b></div>
    <button class="btn ghost sm" data-a="payCard" data-k="${c.k}">Ya pagué la tarjeta</button>
  </div>`;
}

function eventRow(e, compact) {
  const t = today();
  let act = '';
  if (!e.done) {
    if (e.k === 'in' || e.k === 'prob') act = `<button class="mini g" data-a="incomeArrived" data-id="${e.ref.id}">Llegó</button>`;
    else if (e.k === 'fix') act = `<button class="mini" data-a="payFixed" data-id="${e.ref.id}">Pagar</button>`;
    else if (e.k === 'card') act = `<button class="mini" data-a="payCard" data-k="${e.ref}">Pagar</button>`;
    else if (e.k === 'ev' && e.date >= t) act = `<button class="mini" data-a="evDone" data-id="${e.ref.id}">✓</button>`;
  }
  const d = parse(e.date);
  const amtCls = e.k === 'in' ? 'g' : e.k === 'prob' ? 'mut' : e.k === 'card' ? 'y' : '';
  const amt = e.amount ? `<span class="amt ${amtCls}">${e.k === 'in' ? '+' : ''}${e.k === 'prob' ? '~' : ''}${fmt(e.amount)}</span>` : '';
  const dest = (e.k === 'in' && !compact) ? `<small>→ ${e.ref.split.map(p => ACC[p.to].name).join(' + ')}</small>` : e.k === 'prob' ? '<small>probable</small>' : '';
  return `<div class="ev k-${e.k} ${e.done ? 'done' : ''} ${e.date === t ? 'today' : ''}">
    <div class="date"><b>${d.getDate()}</b><span>${MES[d.getMonth()]}</span></div>
    <div class="what"><span>${e.icon} ${esc(e.title)}${e.done && e.k !== 'ev' ? ' ✓' : ''}</span>${dest}</div>
    ${amt}${act}</div>`;
}

function vInicio() {
  const b = balances(), sp = spendToday();
  const total = r2(b.dia + b.cusco + b.pagos + b.cts);
  const spCls = sp.value < 0 ? 'r' : sp.value < 15 ? 'y' : 'g';
  const up = timeline().filter(e => !e.done && e.k !== 'prob' && (e.date >= today() || (e.k !== 'ev' && diffDays(today(), e.date) <= 10))).slice(0, 3);
  return `${statusLine()}
  <div class="card spend">
    <p class="lbl">Puedes gastar hoy</p>
    <div class="big ${spCls}">${fmtBig(sp.value)}</div>
    <p class="mut">(${fmt(sp.free)} − ${fmt(sp.fixed)} fijos${sp.apartado > 0 ? ' − apartado Cusco' : ''}) ÷ ${sp.days} día${sp.days === 1 ? '' : 's'}${sp.next ? ' hasta el ' + fdate(sp.next.date) : ''}</p>
  </div>
  <div class="accs">
    <div class="acc main ${b.dia + b.cusco < 0 ? 'neg' : ''}"><p>${ACC.dia.name}<small>${ACC.dia.sub}</small></p><div class="big">${fmtBig(b.dia + b.cusco)}</div>
      ${b.cusco > 0 ? `<p class="mut">Disponible ${fmt(b.dia)} · apartado Cusco ${fmt(b.cusco)}</p>` : ''}</div>
    <div class="acc ${b.pagos < 0 ? 'neg' : ''}"><p>${ACC.pagos.name}<small>${ACC.pagos.sub}</small></p><div class="mid">${fmtBig(b.pagos)}</div></div>
    <div class="acc ${b.cts < 0 ? 'neg' : ''}"><p>${ACC.cts.name}<small>${ACC.cts.sub}</small></p><div class="mid">${fmtBig(b.cts)}</div></div>
  </div>
  <div class="totalrow"><span>Total en cuentas</span><b>${fmt(total)}</b></div>
  <div class="actions"><button class="btn ghost" data-a="newMover">🔁 Mover</button><button class="btn ghost" data-a="newIngreso">💰 Llegó un ingreso</button></div>
  ${cardBoxHTML()}
  ${goalsHTML(b)}
  <div class="card"><div class="row"><b>🗓️ Próximo</b><button class="link" data-a="tab" data-v="plan">Ver plan</button></div>
    ${up.length ? up.map(e => eventRow(e, true)).join('') : '<p class="mut">Nada pendiente.</p>'}</div>
  <div class="spacer"></div>`;
}

function movInfo(m) {
  if (m.type === 'gasto') { const f = m.fixedId && S.fixed.find(x => x.id === m.fixedId); return { icon: m.icon || '💸', title: m.note || (f ? f.label : 'Gasto'), sub: ACC[m.acc].name + (f ? ' · gasto fijo' : ''), amt: '−' + fmt(m.amount), cls: '' }; }
  if (m.type === 'tarjeta') { const it = m.cardItem && S.card.find(x => x.id === m.cardItem); const k = it ? it.cycle : cycleOf(m.date); return { icon: m.icon || '💳', title: m.note || (it ? it.label : 'Con tarjeta'), sub: '💳 Tarjeta · pago del ' + fdate(payDate(k)), amt: fmt(m.amount), cls: 'y' }; }
  if (m.type === 'ingreso') { const i = m.incomeId && S.incomes.find(x => x.id === m.incomeId); return { icon: '💰', title: m.note || (i ? i.label : 'Ingreso'), sub: '→ ' + m.parts.map(p => ACC[p.to].name + (m.parts.length > 1 ? ' ' + fmt(p.amount) : '')).join(' · '), amt: '+' + fmt(m.amount), cls: 'g' }; }
  if (m.type === 'mover') return { icon: '🔁', title: m.note || 'Mover', sub: ACC[m.from].name + ' → ' + ACC[m.to].name, amt: fmt(m.amount), cls: 'mut' };
  if (m.type === 'pagoTarjeta') return { icon: '💳', title: 'Pago de tarjeta (vence ' + dueLabel(m.cycle) + ')', sub: 'desde ' + ACC[m.acc].name, amt: '−' + fmt(m.amount), cls: '' };
  return { icon: '•', title: '?', sub: '', amt: fmt(m.amount), cls: '' };
}

function vMovs() {
  if (!S.movs.length) return `<div class="empty"><p>Aún no hay movimientos.</p><p class="mut">Toca <b>+</b> para registrar un gasto.</p></div>`;
  const t = today(), groups = {};
  [...S.movs].sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0)).forEach(m => (groups[m.date] = groups[m.date] || []).push(m));
  return `<p class="hint">Desliza a la izquierda para editar o borrar.</p>` + Object.keys(groups).map(d => {
    const dd = parse(d), spent = groups[d].filter(m => m.type === 'gasto').reduce((a, m) => a + m.amount, 0);
    const name = d === t ? 'Hoy' : d === addDays(t, -1) ? 'Ayer' : DIAS[dd.getDay()] + ' ' + fdate(d);
    return `<div class="day"><div class="dayh"><span>${name}</span>${spent ? `<span>−${fmt(spent)}</span>` : ''}</div>
      ${groups[d].map(m => { const x = movInfo(m); return `<div class="swipe" data-id="${m.id}">
        <div class="acts"><button data-a="editMov" data-id="${m.id}">Editar</button><button class="del" data-a="delMov" data-id="${m.id}">Borrar</button></div>
        <div class="front" data-a="tapMov" data-id="${m.id}"><span class="ic">${x.icon}</span><div class="what"><span>${esc(x.title)}</span><small>${esc(x.sub)}</small></div><b class="${x.cls}">${x.amt}</b></div>
      </div>`; }).join('')}</div>`;
  }).join('') + '<div class="spacer"></div>';
}

function vPlan() {
  const t = today(), tl = timeline();
  const months = [...new Set(tl.map(e => mkey(e.date)))].filter(k => k >= mkey(t));
  const shown = ui.moreMonths ? months : months.slice(0, 3);
  const cal = shown.map(k => `<h3>${monthLabel(k)}</h3>` + tl.filter(e => mkey(e.date) === k).map(e => eventRow(e, false)).join('')).join('');

  const open = openCycles();
  const cardHTML = open.map((k, idx) => {
    const items = S.card.filter(i => i.cycle === k), loose = looseCard(k);
    if (idx > 0) return `<div class="kv clickable" data-a="toggleCycle" data-k="${k}"><span>Pago del ${fdate(payDate(k))} · vence ${dueLabel(k)}</span><b>${fmt(cycleTotal(k))}</b></div>` + (ui.cycleOpen === k ? cycleList(items, loose, k) : '');
    return `<div class="row"><b>Pago del ${fdate(payDate(k))}</b><span class="pill">vence ${dueLabel(k)}</span></div>${cycleList(items, loose, k)}
      <div class="kv total"><span>Total</span><b>${fmt(cycleTotal(k))}</b></div>
      <div class="actions"><button class="btn ghost sm" data-a="newItem" data-k="${k}">+ Agregar</button><button class="btn ghost sm" data-a="payCard" data-k="${k}">Ya pagué</button></div>`;
  }).join('<div class="sep"></div>');

  const debts = DEBTS.map(d => {
    const ks = [...new Set(S.card.filter(i => i.debt === d.id).map(i => i.cycle))].sort();
    const paid = d.paidBefore + ks.filter(cyclePaid).length;
    const last = ks[ks.length - 1];
    return `<div class="goal"><div class="row"><b>${d.icon} ${d.label}</b><span>${paid} de ${d.n} cuotas</span></div>${bar(paid / d.n * 100, 'g')}
      <p class="mut">${fmt(d.cuota)}/mes · faltan ${fmt((d.n - paid) * d.cuota)} · termina ${last ? MES[+last.slice(5) - 1] + ' ' + last.slice(0, 4) : '—'}</p></div>`;
  }).join('');

  const trip = S.card.filter(i => i.trip);
  const tPaid = trip.filter(i => itemInfo(i).real), tPend = trip.filter(i => !itemInfo(i).real);
  const sum = a => a.reduce((x, i) => x + itemInfo(i).amt, 0);
  const b = balances(), c = cuscoNow(b);

  const fxMonths = [mkey(t), monthsFrom(mkey(t), 2)[1]];
  const fixedHTML = fxMonths.map(k => {
    const list = S.fixed.filter(f => f.month === k); if (!list.length) return '';
    return `<h3>${monthLabel(k)}</h3>` + list.map(f => {
      if (f.kind === 'daily') { const s = dailySpent(k); return `<div class="kv"><span>${f.icon} ${esc(f.label)}</span><b>${fmt(s)} <em>de ${fmt(f.amount)}</em></b></div>`; }
      const p = fixedPending(f), off = f.kind === 'ifIal' && !ialIn(k);
      return `<div class="kv ${p <= 0 && !off ? 'done' : ''}"><span>${f.icon} ${esc(f.label)}${f.date ? ' · ' + fdate(f.date) : ''}</span>
        <b>${off ? '<em>sin IAL aún</em>' : p <= 0 ? '✓ ' + fmt(f.amount) : fmt(p)}</b>
        ${p > 0 && k === mkey(t) ? `<button class="mini" data-a="payFixed" data-id="${f.id}">Pagar</button>` : ''}</div>`;
    }).join('');
  }).join('');

  const old = oldData();
  const imp = ui.importData;
  return `<div class="card"><div class="row"><b>🗓️ Calendario</b></div>${cal}
      ${months.length > 3 ? `<button class="link block" data-a="moreMonths">${ui.moreMonths ? 'Ver menos' : 'Ver más meses'}</button>` : ''}</div>
    <div class="card"><div class="row"><b>💳 Tarjeta BCP Visa</b><span class="mut">cierra 11 · vence 5</span></div>${cardHTML || '<p class="mut">Sin pagos pendientes.</p>'}
      <p class="mut small">~ = estimado. Toca una línea para poner el monto real.</p></div>
    <div class="card"><div class="row"><b>📉 Deudas en cuotas</b></div>${debts}
      <p class="mut">Cuota fija: ${fmt(1093)}/mes ene–may · ${fmt(661.5)} en jun · libre desde jul 2027.</p></div>
    <div class="card"><div class="row"><b>🏔️ Viaje a Cusco</b><span class="mut">29 dic – 6 ene</span></div>
      <div class="kv"><span>Pagado</span><b class="g">${fmt(sum(tPaid))}</b></div>
      ${tPaid.map(i => `<div class="kv sub"><span>✓ ${esc(i.label)}</span><span>${fmt(itemInfo(i).amt)}</span></div>`).join('')}
      <div class="kv"><span>Pendiente</span><b class="y">${fmt(sum(tPend))}</b></div>
      ${tPend.map(i => `<div class="kv sub clickable" data-a="editItem" data-id="${i.id}"><span>○ ${esc(i.label)}</span><span>~${fmt(i.est)}</span></div>`).join('')}
      <div class="kv"><span>Bolsillo Cusco</span><b class="${c >= S.cuscoTarget ? 'g' : 'y'}">${fmt(c)} de ${fmt(S.cuscoTarget)}</b></div></div>
    <div class="card"><div class="row"><b>📌 Gastos fijos</b></div>${fixedHTML || '<p class="mut">Nada este mes.</p>'}</div>
    <div class="card settings"><div class="row"><b>⚙️ Ajustes y respaldo</b><span class="pill">v${APP_VERSION}</span></div>
      <button class="btn" data-a="export">⬇️ Exportar respaldo</button>
      <button class="btn ghost" data-a="import">⬆️ Importar respaldo</button>
      ${imp ? `<div class="confirm">${imp.error ? `<p class="r">${esc(imp.error)}</p><button class="btn ghost sm" data-a="importCancel">Cerrar</button>` :
        `<p>Respaldo del ${esc(imp.data.exported || '?')} con ${imp.data.movs.length} movimientos. Reemplazará tus datos actuales.</p>
        <div class="actions"><button class="btn danger sm" data-a="importOk">Reemplazar</button><button class="btn ghost sm" data-a="importCancel">Cancelar</button></div>`}</div>` : ''}
      ${old ? `<button class="btn ghost" data-a="exportOld">📦 Descargar datos de la app anterior</button>` : ''}
      <h3>Saldos iniciales (19 nov 2026)</h3>
      ${['dia', 'pagos', 'cts'].map(a => `<label class="field"><span>${ACC[a].name}</span><input inputmode="decimal" data-init="${a}" value="${S.init[a].toFixed(2)}"></label>`).join('')}
      <label class="field"><span>Meta Bolsillo Cusco</span><input inputmode="decimal" data-goal="cusco" value="${S.cuscoTarget}"></label>
      <p class="mut small">Versión ${APP_VERSION} · tus datos viven solo en este teléfono.</p>
    </div><div class="spacer"></div>`;
}
function cycleList(items, loose, k) {
  return items.map(i => { const x = itemInfo(i); return `<div class="kv clickable item" data-a="editItem" data-id="${i.id}"><span>${x.real ? '✓' : '~'} ${esc(i.label)}</span><b class="${x.real ? '' : 'mut'}">${fmt(x.amt)}</b></div>`; }).join('')
    + loose.map(m => `<div class="kv clickable item" data-a="editMov" data-id="${m.id}"><span>✓ ${esc(m.note || 'Consumo')} · ${fdate(m.date)}</span><b>${fmt(m.amount)}</b></div>`).join('');
}

/* ---------- hojas (registrar / editar) ---------- */
function openSheet(s) { ui.sheet = s; renderSheet(); }
function closeSheet() { ui.sheet = null; renderSheet(); }
const keypad = () => `<div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => `<button data-a="key" data-k="${k}">${k}</button>`).join('')}</div>`;
const amtDisplay = s => `<div class="amtdisp" id="amtdisp"><small>S/</small>${esc(s.amt || '0')}</div>`;
const chips = (list, sel, act) => `<div class="chips">${list.map(([v, l]) => `<button class="chip ${sel === v ? 'on' : ''}" data-a="${act}" data-v="${v}">${l}</button>`).join('')}</div>`;

function renderSheet() {
  const root = $('#sheet-root'), s = ui.sheet;
  if (!s) { root.innerHTML = ''; document.body.classList.remove('locked'); return; }
  document.body.classList.add('locked');
  let body = '';
  if (s.type === 'gasto') body = sheetGasto(s);
  else if (s.type === 'ingreso') body = sheetIngreso(s);
  else if (s.type === 'mover') body = sheetMover(s);
  else if (s.type === 'pago') body = sheetPago(s);
  else if (s.type === 'item') body = sheetItem(s);
  root.innerHTML = `<div class="backdrop" data-a="closeSheet"></div><div class="sheet">${body}</div>`;
  updateAmt();
}
function updateAmt() {
  const s = ui.sheet; if (!s) return;
  const d = $('#amtdisp'); if (d) d.innerHTML = `<small>S/</small>${esc(s.amt || '0')}`;
  const sv = $('#save'); if (sv) sv.disabled = !(num(s.amt) > 0) || (s.type === 'mover' && s.from === s.to);
  if (s.type === 'ingreso') { const p = $('#splitprev'); if (p) p.innerHTML = splitPreview(s); }
}
function head(title) { return `<div class="shead"><b>${title}</b><button class="x" data-a="closeSheet" aria-label="Cerrar">✕</button></div>`; }
function metaRow(s) {
  return `<div class="meta"><input class="note" placeholder="Nota (opcional)" data-f="note" value="${esc(s.note || '')}"><input type="date" data-f="date" value="${s.date}"></div>`;
}

function sheetGasto(s) {
  const b = balances(), t = today();
  const accs = [['dia', 'Día a día'], ['pagos', 'Pagos'], ['cts', 'CTS']];
  if (b.cusco > 0 || s.acc === 'cusco') accs.push(['cusco', 'Apartado Cusco']);
  const items = S.card.filter(i => !cyclePaid(i.cycle) && !i.bought && i.real == null && (linkedSum(i.id) === 0 || i.id === s.item));
  const fixed = S.fixed.filter(f => f.kind !== 'daily' && f.month <= mkey(t) && (fixedPending(f) > 0 || f.id === s.fixed) && !(f.kind === 'ifIal' && !ialIn(f.month)));
  return head(s.editId ? 'Editar gasto' : 'Nuevo gasto') + amtDisplay(s)
    + chips([['pasaje', '🚌 Pasaje'], ['comida', '🍽️ Comida'], ['otro', '➕ Otro']], s.quick, 'quick')
    + `<button class="toggle ${s.card ? 'on' : ''}" data-a="toggleCard"><span>💳 Fue con tarjeta (planificado)</span><i></i></button>`
    + (s.card
      ? (items.length ? `<p class="lbl">¿Reemplaza un estimado? (opcional)</p><div class="chips scroll">${items.map(i => `<button class="chip ${s.item === i.id ? 'on' : ''}" data-a="pickItem" data-v="${i.id}">${esc(i.label)} ~${fmt(i.est)}</button>`).join('')}</div>` : '')
      : chips(accs, s.acc, 'pickAcc') + (fixed.length ? `<p class="lbl">¿Es un gasto fijo? (opcional)</p><div class="chips scroll">${fixed.map(f => `<button class="chip ${s.fixed === f.id ? 'on' : ''}" data-a="pickFixed" data-v="${f.id}">${f.icon} ${esc(f.label)} ${fmt(fixedPending(f) || f.amount)}</button>`).join('')}</div>` : ''))
    + metaRow(s) + keypad()
    + `<button class="btn big" id="save" data-a="saveGasto">Guardar</button>`;
}

function pendingIncomes(s) {
  const t = today(), lim = addDays(t, 20);
  return S.incomes.filter(i => !i.skipped && (!received(i) || i.id === s.incomeId) && i.date <= lim && diffDays(t, i.date) <= 25);
}
function splitFor(s) {
  const amount = r2(num(s.amt)); if (!(amount > 0)) return [];
  const i = s.incomeId && S.incomes.find(x => x.id === s.incomeId);
  if (i && i.sure) return adjustSplit(i.split, amount);
  if (i && !i.sure) return ruleSplit(amount, s.editId);
  return [{ to: s.acc, amount }];
}
function splitPreview(s) {
  const p = splitFor(s); if (!p.length) return '';
  return '→ ' + p.map(x => `${ACC[x.to].name} <b>${fmt(x.amount)}</b>`).join(' · ');
}
function sheetIngreso(s) {
  const list = pendingIncomes(s);
  const sel = s.incomeId && S.incomes.find(x => x.id === s.incomeId);
  return head(s.editId ? 'Editar ingreso' : 'Llegó un ingreso')
    + (list.length ? `<div class="chips scroll">${list.map(i => `<button class="chip ${i.sure ? '' : 'prob'} ${s.incomeId === i.id ? 'on' : ''}" data-a="pickIncome" data-v="${i.id}">${fdate(i.date)} · ${esc(i.label)} ${i.sure ? '' : '~'}${fmt(i.amount)}</button>`).join('')}<button class="chip ${!s.incomeId ? 'on' : ''}" data-a="pickIncome" data-v="">Otro</button></div>` : '')
    + amtDisplay(s)
    + (!sel ? chips([['dia', 'Día a día'], ['pagos', 'Pagos'], ['ahorro', 'Ahorro']], s.acc, 'pickAcc') : '')
    + `<p class="split" id="splitprev"></p>`
    + (sel && !sel.sure ? `<p class="mut small">Probable: primero completa Bolsillo Cusco (S/${S.cuscoTarget}), luego va a Ahorro. ${s.editId ? '' : '<button class="link" data-a="skipIncome">No llegó</button>'}</p>` : '')
    + metaRow(s) + keypad()
    + `<button class="btn big" id="save" data-a="saveIngreso">Guardar</button>`;
}

function sheetMover(s) {
  const opts = [['dia', 'Día a día'], ['pagos', 'Pagos'], ['cts', 'CTS'], ['cusco', 'Apartado Cusco'], ['ahorro', 'Ahorro']];
  return head(s.editId ? 'Editar movimiento' : 'Mover dinero') + amtDisplay(s)
    + `<p class="lbl">Desde</p>` + chips(opts, s.from, 'pickFrom')
    + `<p class="lbl">Hacia</p>` + chips(opts.filter(o => o[0] !== s.from), s.to, 'pickTo')
    + (s.from === 'cts' && s.to === 'dia' ? '<p class="mut small">Queda en Día a día como apartado Cusco.</p>' : '')
    + metaRow(s) + keypad()
    + `<button class="btn big" id="save" data-a="saveMover">Guardar</button>`;
}

function sheetPago(s) {
  return head('Pago de tarjeta') + `<p class="mut">Vence ${dueLabel(s.cycle)} · estimado ${fmt(cycleTotal(s.cycle))}</p>` + amtDisplay(s)
    + chips([['pagos', 'Pagos'], ['dia', 'Día a día']], s.acc, 'pickAcc')
    + metaRow(s) + keypad()
    + `<button class="btn big" id="save" data-a="savePago">Guardar</button>`;
}

function sheetItem(s) {
  const it = s.id && S.card.find(x => x.id === s.id);
  const l = it ? linkedSum(it.id) : 0;
  return head(it ? 'Línea de tarjeta' : 'Agregar a la tarjeta')
    + `<p class="mut">Pago del ${fdate(payDate(s.cycle))} · vence ${dueLabel(s.cycle)}</p>`
    + `<label class="field"><span>Descripción</span><input data-i="label" value="${esc(s.label)}"></label>`
    + `<label class="field"><span>Estimado (S/)</span><input inputmode="decimal" data-i="est" value="${esc(s.est)}"></label>`
    + (l > 0 ? `<p class="mut">Monto real: ${fmt(l)} (de gastos con tarjeta registrados)</p>`
      : `<label class="field"><span>Monto real (S/) · vacío si aún no sabes</span><input inputmode="decimal" data-i="real" value="${esc(s.real)}"></label>`)
    + `<button class="btn big" data-a="saveItem">Guardar</button>`
    + (it ? `<button class="btn ghost danger-t" data-a="delItem">${s.confirmDel ? 'Toca otra vez para borrar' : 'Borrar línea'}</button>` : '');
}

function newGasto(preset) { openSheet(Object.assign({ type: 'gasto', amt: '', acc: 'dia', card: false, item: null, fixed: null, quick: null, icon: null, note: '', date: today() }, preset || {})); }
function amtStr(n) { return n ? String(r2(n)) : ''; }

/* ---------- acciones ---------- */
const QUICK = { pasaje: ['🚌', 'Pasaje'], comida: ['🍽️', 'Comida'], otro: ['💸', ''] };
const actions = {
  tab: el => { ui.tab = el.dataset.v; ui.swipeOpen = null; render(); window.scrollTo(0, 0); },
  newGasto: () => newGasto(),
  newMover: () => openSheet({ type: 'mover', amt: '', from: 'dia', to: 'pagos', note: '', date: today() }),
  newIngreso: () => openSheet({ type: 'ingreso', amt: '', acc: 'dia', incomeId: null, note: '', date: today() }),
  incomeArrived: el => { const i = S.incomes.find(x => x.id === el.dataset.id); openSheet({ type: 'ingreso', amt: amtStr(i.amount), acc: 'dia', incomeId: i.id, note: '', date: today() }); },
  payFixed: el => { const f = S.fixed.find(x => x.id === el.dataset.id); newGasto({ amt: amtStr(fixedPending(f) || f.amount), fixed: f.id, icon: f.icon, note: f.label }); },
  payCard: el => { const k = el.dataset.k; openSheet({ type: 'pago', cycle: k, amt: amtStr(cycleTotal(k)), acc: 'pagos', note: '', date: today() }); },
  evDone: el => { const e = S.events.find(x => x.id === el.dataset.id); e.done = true; save(); render(); },
  moreMonths: () => { ui.moreMonths = !ui.moreMonths; render(); },
  toggleCycle: el => { ui.cycleOpen = ui.cycleOpen === el.dataset.k ? null : el.dataset.k; render(); },
  closeSheet: () => closeSheet(),
  key: el => {
    const s = ui.sheet, k = el.dataset.k; let a = s.amt || '';
    if (k === '⌫') a = a.slice(0, -1);
    else if (k === '.') { if (!a.includes('.')) a = (a || '0') + '.'; }
    else { if (a.includes('.') && a.split('.')[1].length >= 2) return; if (a === '0') a = ''; if (a.replace('.', '').length >= 8) return; a += k; }
    s.amt = a; updateAmt();
  },
  quick: el => { const s = ui.sheet, v = el.dataset.v; readMeta(); if (s.quick === v) { s.quick = null; s.icon = null; if (QUICK[v][1] && s.note === QUICK[v][1]) s.note = ''; } else { const prev = s.quick && QUICK[s.quick][1]; s.quick = v; s.icon = QUICK[v][0]; if (!s.note || s.note === prev) s.note = QUICK[v][1]; } renderSheet(); },
  toggleCard: () => { readMeta(); const s = ui.sheet; s.card = !s.card; if (!s.card) s.item = null; else s.fixed = null; renderSheet(); },
  pickAcc: el => { readMeta(); ui.sheet.acc = el.dataset.v; renderSheet(); },
  pickFrom: el => { readMeta(); const s = ui.sheet; s.from = el.dataset.v; if (s.to === s.from) s.to = ['dia', 'pagos', 'cts', 'cusco', 'ahorro'].find(x => x !== s.from); renderSheet(); },
  pickTo: el => { readMeta(); ui.sheet.to = el.dataset.v; renderSheet(); },
  pickItem: el => { readMeta(); const s = ui.sheet, it = S.card.find(x => x.id === el.dataset.v); if (s.item === it.id) { s.item = null; } else { s.item = it.id; if (!s.amt) s.amt = amtStr(it.est); if (!s.note) s.note = it.label; } renderSheet(); },
  pickFixed: el => { readMeta(); const s = ui.sheet, f = S.fixed.find(x => x.id === el.dataset.v); if (s.fixed === f.id) s.fixed = null; else { s.fixed = f.id; if (!s.amt) s.amt = amtStr(fixedPending(f) || f.amount); if (!s.note) s.note = f.label; s.icon = s.icon || f.icon; } renderSheet(); },
  pickIncome: el => { readMeta(); const s = ui.sheet, v = el.dataset.v; s.incomeId = v || null; const i = v && S.incomes.find(x => x.id === v); if (i) s.amt = amtStr(i.amount); renderSheet(); },
  skipIncome: () => { const i = S.incomes.find(x => x.id === ui.sheet.incomeId); if (i) { i.skipped = true; save(); } closeSheet(); render(); },
  saveGasto: () => {
    readMeta(); const s = ui.sheet, amount = r2(num(s.amt)); if (!(amount > 0)) return;
    const m = { id: s.editId || uid(), ts: s.ts || Date.now(), date: s.date || today(), amount, note: (s.note || '').trim(), icon: s.icon || null };
    if (s.card) Object.assign(m, { type: 'tarjeta', cardItem: s.item || null });
    else Object.assign(m, { type: 'gasto', acc: s.acc, fixedId: s.fixed || null });
    upsert(m);
  },
  saveIngreso: () => {
    readMeta(); const s = ui.sheet, amount = r2(num(s.amt)); if (!(amount > 0)) return;
    upsert({ id: s.editId || uid(), ts: s.ts || Date.now(), type: 'ingreso', date: s.date || today(), amount, parts: splitFor(s), incomeId: s.incomeId || null, note: (s.note || '').trim() });
  },
  saveMover: () => {
    readMeta(); const s = ui.sheet, amount = r2(num(s.amt)); if (!(amount > 0) || s.from === s.to) return;
    const to = (s.from === 'cts' && s.to === 'dia') ? 'cusco' : s.to;
    upsert({ id: s.editId || uid(), ts: s.ts || Date.now(), type: 'mover', date: s.date || today(), amount, from: s.from, to, note: (s.note || '').trim() });
  },
  savePago: () => {
    readMeta(); const s = ui.sheet, amount = r2(num(s.amt)); if (!(amount > 0)) return;
    upsert({ id: s.editId || uid(), ts: s.ts || Date.now(), type: 'pagoTarjeta', date: s.date || today(), amount, acc: s.acc, cycle: s.cycle, note: (s.note || '').trim() });
  },
  tapMov: el => { const row = el.closest('.swipe'); if (ui.swipeOpen) { closeSwipes(); return; } editMov(row.dataset.id); },
  editMov: el => { closeSwipes(); editMov(el.dataset.id); },
  delMov: el => {
    const i = S.movs.findIndex(m => m.id === el.dataset.id); if (i < 0) return;
    const [m] = S.movs.splice(i, 1); save(); ui.swipeOpen = null; render(); showUndo(m);
  },
  undo: () => { if (ui.undo) { S.movs.push(ui.undo.m); save(); clearTimeout(ui.undo.t); ui.undo = null; $('#undo').innerHTML = ''; render(); } },
  newItem: el => openSheet({ type: 'item', cycle: el.dataset.k, label: '', est: '', real: '' }),
  editItem: el => { const it = S.card.find(x => x.id === el.dataset.id); openSheet({ type: 'item', id: it.id, cycle: it.cycle, label: it.label, est: String(it.est), real: it.real == null ? '' : String(it.real) }); },
  saveItem: () => {
    const s = ui.sheet; readItem();
    const label = s.label.trim() || 'Consumo', est = r2(num(s.est)), real = String(s.real).trim() === '' ? null : r2(num(s.real));
    if (s.id) { const it = S.card.find(x => x.id === s.id); Object.assign(it, { label, est, real }); }
    else S.card.push({ id: uid(), cycle: s.cycle, label, est, real, bought: false, trip: false, debt: null });
    save(); closeSheet(); render();
  },
  delItem: () => {
    const s = ui.sheet; readItem();
    if (!s.confirmDel) { s.confirmDel = true; renderSheet(); return; }
    S.card = S.card.filter(x => x.id !== s.id); S.movs.forEach(m => { if (m.cardItem === s.id) m.cardItem = null; });
    save(); closeSheet(); render();
  },
  export: () => exportJSON(),
  exportOld: () => { const raw = oldData(); if (raw) shareFile(raw, `finanzas-app-anterior-${today()}.json`); },
  import: () => $('#import-file').click(),
  importOk: () => { if (ui.importData && ui.importData.data) { S = ui.importData.data; save(); } ui.importData = null; ui.tab = 'inicio'; render(); window.scrollTo(0, 0); },
  importCancel: () => { ui.importData = null; render(); }
};
function readMeta() { const s = ui.sheet; if (!s) return; const n = $('[data-f="note"]'), d = $('[data-f="date"]'); if (n) s.note = n.value; if (d && d.value) s.date = d.value; }
function readItem() { const s = ui.sheet; ['label', 'est', 'real'].forEach(k => { const el = $(`[data-i="${k}"]`); if (el) s[k] = el.value; }); }
function upsert(m) {
  const i = S.movs.findIndex(x => x.id === m.id);
  if (i >= 0) S.movs[i] = m; else S.movs.push(m);
  save(); closeSheet(); render();
}
function editMov(id) {
  const m = S.movs.find(x => x.id === id); if (!m) return;
  const base = { editId: m.id, ts: m.ts, amt: amtStr(m.amount), note: m.note || '', date: m.date };
  if (m.type === 'gasto') newGasto(Object.assign(base, { acc: m.acc, fixed: m.fixedId, icon: m.icon }));
  else if (m.type === 'tarjeta') newGasto(Object.assign(base, { card: true, item: m.cardItem, icon: m.icon }));
  else if (m.type === 'ingreso') openSheet(Object.assign(base, { type: 'ingreso', incomeId: m.incomeId, acc: m.parts[0] ? (m.parts[0].to === 'cusco' ? 'dia' : m.parts[0].to) : 'dia' }));
  else if (m.type === 'mover') openSheet(Object.assign(base, { type: 'mover', from: m.from, to: m.to === 'cusco' && m.from === 'cts' ? 'dia' : m.to }));
  else if (m.type === 'pagoTarjeta') openSheet(Object.assign(base, { type: 'pago', cycle: m.cycle, acc: m.acc }));
}
function showUndo(m) {
  if (ui.undo) clearTimeout(ui.undo.t);
  const x = movInfo(m);
  ui.undo = { m, t: setTimeout(() => { ui.undo = null; $('#undo').innerHTML = ''; }, 5000) };
  $('#undo').innerHTML = `<div class="undobar"><span>Borrado: ${esc(x.title)} ${x.amt}</span><button data-a="undo">Deshacer</button></div>`;
}

/* ---------- deslizar en Movimientos ---------- */
const OPEN_X = -170;
function closeSwipes() { document.querySelectorAll('.swipe .front').forEach(f => { f.style.transform = ''; }); ui.swipeOpen = null; }
let sw = null;
view.addEventListener('touchstart', e => {
  const front = e.target.closest('.swipe .front'); if (!front) return;
  const t = e.touches[0];
  const base = ui.swipeOpen === front.parentNode.dataset.id ? OPEN_X : 0;
  if (ui.swipeOpen && ui.swipeOpen !== front.parentNode.dataset.id) closeSwipes();
  sw = { front, x0: t.clientX, y0: t.clientY, base, dx: 0, dir: null };
}, { passive: true });
view.addEventListener('touchmove', e => {
  if (!sw) return;
  const t = e.touches[0], dx = t.clientX - sw.x0, dy = t.clientY - sw.y0;
  if (!sw.dir) { if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; sw.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'; }
  if (sw.dir !== 'h') return;
  e.preventDefault();
  sw.dx = dx; const x = Math.max(OPEN_X - 30, Math.min(0, sw.base + dx));
  sw.front.style.transition = 'none'; sw.front.style.transform = `translateX(${x}px)`;
}, { passive: false });
view.addEventListener('touchend', () => {
  if (!sw) return;
  const { front, base, dx, dir } = sw; sw = null;
  front.style.transition = '';
  if (dir !== 'h') return;
  const open = base + dx < OPEN_X / 2;
  front.style.transform = open ? `translateX(${OPEN_X}px)` : '';
  ui.swipeOpen = open ? front.parentNode.dataset.id : null;
  front.dataset.justSwiped = '1'; setTimeout(() => { delete front.dataset.justSwiped; }, 350);
});

/* ---------- respaldo ---------- */
async function shareFile(text, name) {
  const blob = new Blob([text], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function exportJSON() {
  const data = Object.assign({}, S, { app: 'mis-finanzas-v2', version: APP_VERSION, exported: today() });
  shareFile(JSON.stringify(data, null, 2), `finanzas-respaldo-${today()}.json`);
}
$('#import-file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (d && d.app === 'mis-finanzas-v2' && Array.isArray(d.movs) && d.init) ui.importData = { data: d };
      else if (d && d.settings && Array.isArray(d.movs)) ui.importData = { error: 'Ese es un respaldo de la app anterior (v1). Esta versión empieza de cero; ese archivo queda guardado como recuerdo.' };
      else ui.importData = { error: 'Ese archivo no es un respaldo de Mis Finanzas.' };
    } catch (err) { ui.importData = { error: 'No se pudo leer el archivo.' }; }
    e.target.value = ''; render();
  };
  r.readAsText(f);
});

/* ---------- eventos globales ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (el.dataset.justSwiped) return;
  const fn = actions[el.dataset.a]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.init) { S.init[el.dataset.init] = r2(num(el.value)); save(); render(); }
  else if (el.dataset.goal) { const v = r2(num(el.value)); if (v > 0) S.cuscoTarget = v; save(); render(); }
});

/* ---------- arranque ---------- */
load(); render();
document.addEventListener('visibilitychange', () => { if (!document.hidden && !ui.sheet) render(); });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
