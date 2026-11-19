'use strict';
/* =========================================================
   Mis Finanzas · PWA personal (todo se guarda en este equipo)
   ========================================================= */

const KEY = 'finanzas-dv-v1';          // ¡No cambiar! Aquí viven los datos del iPhone.
const APP_VERSION = '2.1.0';
const DATA_VERSION = 3;
const RELEASE_NOTES = 'Novedades: compras planificadas con tarjeta (sin aviso de pasar a Pagos), estimados sin doble conteo, Inicio más simple con 1 solo consejo, categorías Entretenimiento y Deporte, contador de clases y gestión de categorías en Ajustes.';
const MES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const MESL = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIA = ['dom','lun','mar','mié','jue','vie','sáb'];
const METHOD = { efectivo: 'Efectivo', debito: 'Débito', tarjeta: 'Tarjeta de crédito' };

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const r2 = n => Math.round((Number(n) || 0) * 100) / 100;
const sum = arr => r2(arr.reduce((a, b) => a + (Number(b) || 0), 0));
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addMonths = (s, n) => { const d = pd(s); return ymd(new Date(d.getFullYear(), d.getMonth() + n, d.getDate())); };
const addDays = (s, n) => { const d = pd(s); d.setDate(d.getDate() + n); return ymd(d); };
const lastDay = (y, m) => new Date(y, m, 0).getDate();
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };

function money(n, opts = {}) {
  n = r2(n);
  const neg = n < 0; const a = Math.abs(n);
  let [i, f] = a.toFixed(2).split('.');
  i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const s = 'S/' + i + (f === '00' ? '' : '.' + f);
  return (neg ? '−' : (opts.sign && n > 0 ? '+' : '')) + s;
}
function fmtDate(s, long) {
  if (!s) return '';
  const d = pd(s); const y = d.getFullYear();
  let out = `${d.getDate()} ${MES[d.getMonth()]}`;
  if (long) out = `${DIA[d.getDay()]} ${out}`;
  if (y !== new Date().getFullYear()) out += ` ${y}`;
  return out;
}
function relDay(s) {
  const t = today(); if (s === t) return 'Hoy';
  if (s === addDays(t, 1)) return 'Mañana';
  if (s === addDays(t, -1)) return 'Ayer';
  return fmtDate(s, true);
}
const daysBetween = (a, b) => Math.round((pd(b) - pd(a)) / 86400000);

/* ---------- datos iniciales ---------- */
const NEW_CATS_V2 = [
  { id: 'entretenimiento', name: 'Entretenimiento', emoji: '🍿', rule: 'Salidas, cine, juegos, delivery por antojo y suscripciones.' },
  { id: 'deporte', name: 'Deporte', emoji: '⚽', rule: 'Se paga solo con ingresos extra ya cobrados; si un mes no llegan, no se renueva.' },
  { id: 'sin', name: 'Sin categoría', emoji: '❔', hidden: true, system: true },
];
function seed() {
  const incomes = [];
  const inc = o => incomes.push(Object.assign({ received: null }, o));
  inc({ id: 's1', type: 'seguro', name: 'Sueldo fin de mes · Van Llantas', amount: 800, date: '2026-11-30', suggest: { pagos: 800 } });
  inc({ id: 's2', type: 'seguro', name: 'BCP · recibo por honorarios', amount: 800, date: '2026-12-05', suggest: { dia: 300, pagos: 500 } });
  inc({ id: 's3', type: 'seguro', name: 'Quincena + gratificación', amount: 4034, date: '2026-12-15', suggest: { ahorro: 1270, pagos: 2764 } });
  inc({ id: 's4', type: 'seguro', name: 'Sueldo fin de mes · Van Llantas', amount: 800, date: '2026-12-31', suggest: { cusco: 800 } });
  inc({ id: 'p1', type: 'probable', name: 'Grupo IAL (lo que me deben)', amount: 595, date: '2026-11-20' });
  inc({ id: 'p2', type: 'probable', name: 'Grupo IAL', amount: 700, date: '2026-11-30' });
  inc({ id: 'p3', type: 'probable', name: 'Andrés · edición de videos', amount: 400, date: '2026-11-30' });
  inc({ id: 'p4', type: 'probable', name: 'Mi mamá', amount: 500, date: '2026-12-15' });
  for (let m = 1; m <= 5; m++) {
    const L = lastDay(2027, m), mm = pad(m);
    inc({ id: 'q' + m, type: 'seguro', name: 'Quincena', amount: 1200, date: `2027-${mm}-15`,
      suggest: m === 5 ? { pagos: 661.5, dia: 107, ahorro: 431.5 } : { pagos: 1093, dia: 107 } });
    inc({ id: 'f' + m, type: 'seguro', name: 'Sueldo fin de mes · Van Llantas', amount: 800, date: `2027-${mm}-${L}`, suggest: { dia: 553, ahorro: 247 } });
    inc({ id: 'ial' + m, type: 'probable', name: 'Grupo IAL', amount: 700, date: `2027-${mm}-${L}` });
    inc({ id: 'and' + m, type: 'probable', name: 'Andrés · edición de videos', amount: 400, date: `2027-${mm}-${L}` });
  }

  const periods = [
    { id: 'p-2026-11', label: 'Noviembre (15–30)', start: '2026-11-15', end: '2026-11-30',
      budgets: { pasajes: 105, comida: 120, snacks: 50, celular: 61, imprevistos: 40, grabaciones: 180, entretenimiento: 60, deporte: 0 } },
    { id: 'p-2026-12', label: 'Diciembre (1 dic – 5 ene)', start: '2026-12-01', end: '2027-01-05',
      budgets: { vida: 500, gasolina: 100, navidad: 200, alineadores: 300, moto: 1150, cusco: 2100, ropa: 300, zapatillas: 256, entretenimiento: 100, deporte: 0 } },
    { id: 'p-2027-01', label: 'Enero (6–31)', start: '2027-01-06', end: '2027-01-31', budgets: { vida: 560, gasolina: 100, deporte: 300, entretenimiento: 100 } },
  ];
  for (let m = 2; m <= 5; m++) periods.push({ id: `p-2027-${pad(m)}`, label: MESL[m - 1], start: `2027-${pad(m)}-01`, end: `2027-${pad(m)}-${lastDay(2027, m)}`, budgets: { vida: 560, gasolina: 100, deporte: 300, entretenimiento: 100 } });

  const ck = (id, date, when, text, action) => ({ id, date, when, text, action: action || null, done: false, movId: null, custom: false });
  const checklist = [
    ck('c1', '2026-11-15', '15 nov', 'Súper de la semana S/73', { type: 'gasto', amount: 73, cat: 'comida', method: 'debito', note: 'Súper de la semana' }),
    ck('c2', '2026-11-16', '16–18 nov', 'Pagar tarjeta completa S/1,815 + US$2.40', { type: 'pago', due: '2026-12-05', from: 'dia' }),
    ck('c3', '2026-11-16', '16–18 nov', 'Definir cuenta de Pagos y cuenta de Ahorro'),
    ck('c4', '2026-11-16', '16–20 nov', 'Comprar vuelo y alojamiento Cusco (tarjeta)', { type: 'gasto', amount: 1200, cat: 'cusco', method: 'tarjeta', note: 'Vuelo y alojamiento Cusco' }),
    ck('c5', '2026-11-16', '16–20 nov', 'Comprar zapatillas Tommy (tarjeta)', { type: 'gasto', amount: 256, cat: 'zapatillas', method: 'tarjeta', note: 'Zapatillas Tommy' }),
    ck('c6', '2026-11-21', '21 nov', 'Grabación Grupo IAL: taxi S/70 + bebidas S/20', { type: 'gasto', amount: 90, cat: 'grabaciones', method: 'efectivo', note: 'Grabación IAL 21 nov' }),
    ck('c7', '2026-11-24', '24 nov', 'Grabación Grupo IAL: taxi S/70 + bebidas S/20', { type: 'gasto', amount: 90, cat: 'grabaciones', method: 'efectivo', note: 'Grabación IAL 24 nov' }),
    ck('c8', '2026-11-27', '27 nov', 'Ropa Black Friday, tope S/300 (tarjeta)', { type: 'gasto', amount: 300, cat: 'ropa', method: 'tarjeta', note: 'Ropa Black Friday' }),
    ck('c9', '2026-11-30', '~30 nov', 'Entra sueldo S/800 → todo a Pagos', { type: 'ingreso', incomeId: 's1' }),
    ck('c10', '2026-12-05', '~5 dic', 'Entra BCP S/800 → S/300 alineadores, S/500 a Pagos', { type: 'ingreso', incomeId: 's2' }),
    ck('c11', '2026-12-05', 'Dic', 'Pagar alineadores S/300', { type: 'gasto', amount: 300, cat: 'alineadores', method: 'debito', note: 'Alineadores' }),
    ck('c12', '2026-12-11', 'Hasta 11 dic', 'SOAT, casco y guantes S/1,150 (tarjeta) — antes del cierre', { type: 'gasto', amount: 1150, cat: 'moto', method: 'tarjeta', note: 'SOAT, casco y guantes' }),
    ck('c13', '2026-12-12', '12 dic', 'Revisar monto exacto del estado de cuenta', { type: 'nav', to: 'tarjeta' }),
    ck('c14', '2026-12-15', '15 dic', 'Entra quincena + grati S/4,034 → S/1,270 a Ahorro, resto a Pagos', { type: 'ingreso', incomeId: 's3' }),
    ck('c15', '2026-12-28', '28 dic', 'Pagar tarjeta completa (~S/4,000)', { type: 'pago', due: '2027-01-05', from: 'pagos' }),
    ck('c16', '2026-12-31', '~31 dic', 'Entra sueldo S/800 → bolsillo de Cusco', { type: 'ingreso', incomeId: 's4' }),
  ];

  return {
    version: DATA_VERSION,
    clases: { total: 10, log: [], paquetes: [] },
    settings: { fx: 3.8, cierre: 11, vence: 5, cuscoCap: 900, ahorroMin: 1270, ahorroMax: 3460, theme: 'dark', alertFrom: '2026-12-28', alertTo: '2026-12-31' },
    accounts: [
      { id: 'dia', name: 'Día a día', emoji: '🛒', color: 'var(--accent)' },
      { id: 'pagos', name: 'Pagos', emoji: '💳', color: 'var(--blue)' },
      { id: 'ahorro', name: 'Ahorro', emoji: '🔒', color: 'var(--violet)' },
      { id: 'cusco', name: 'Bolsillo Cusco', emoji: '🏔️', color: 'var(--orange)' },
      { id: 'deseos', name: 'Deseos (cuarto)', emoji: '🛋️', color: 'var(--pink)' },
    ],
    openings: { dia: 3380, pagos: 0, ahorro: 0, cusco: 0, deseos: 0 },
    categories: [
      { id: 'pasajes', name: 'Pasajes', emoji: '🚌' },
      { id: 'comida', name: 'Comida / súper', emoji: '🥗' },
      { id: 'snacks', name: 'Snacks saludables', emoji: '🍎' },
      { id: 'celular', name: 'Celular', emoji: '📱' },
      { id: 'imprevistos', name: 'Imprevistos', emoji: '⚠️' },
      { id: 'grabaciones', name: 'Grabaciones IAL', emoji: '🎬' },
      { id: 'vida', name: 'Vida diaria', emoji: '🧺' },
      { id: 'gasolina', name: 'Gasolina', emoji: '⛽' },
      { id: 'navidad', name: 'Navidad', emoji: '🎄' },
      { id: 'alineadores', name: 'Alineadores', emoji: '😁' },
      { id: 'moto', name: 'Moto: SOAT, casco, guantes', emoji: '🏍️' },
      { id: 'cusco', name: 'Viaje Cusco', emoji: '🏔️' },
      { id: 'ropa', name: 'Ropa', emoji: '👕' },
      { id: 'zapatillas', name: 'Zapatillas', emoji: '👟' },
      { id: 'taxi', name: 'Taxis', emoji: '🚕' },
      { id: 'deseos', name: 'Deseos / cuarto', emoji: '🛋️' },
      { id: 'otros', name: 'Otros', emoji: '📦' },
      ...NEW_CATS_V2,
    ],
    periods,
    cuotas: [
      { id: 'ps5', name: 'PS5', emoji: '🎮', total: 2589, n: 6, monthly: 431.5, first: '2026-12-05', note: '' },
      { id: 'moto', name: 'Moto', emoji: '🏍️', total: 3969, n: 6, monthly: 661.5, first: '2027-01-05', note: 'Por confirmar en la app del banco' },
    ],
    subs: [{ id: 'g1', name: 'Google One', usd: 2.27, from: '2026-12-05' }],
    statements: {
      '2026-12-05': { realPEN: 1815, realUSD: 2.40, payBy: '2026-11-18', fixed: true },
      '2027-01-05': { payBy: '2026-12-28' },
    },
    incomes,
    checklist,
    wishes: [
      { id: 'f1', name: 'Fase 1 · Zona de trabajo', items: [
        { id: 'w1', name: 'Escritorio', max: 400, bought: null }, { id: 'w2', name: 'Silla ergonómica', max: 200, bought: null }, { id: 'w3', name: 'Luces LED', max: 50, bought: null }] },
      { id: 'f2', name: 'Fase 2 · Entretenimiento', items: [
        { id: 'w4', name: 'TV 50"', max: 1200, bought: null }, { id: 'w5', name: 'Rack', max: 120, bought: null }] },
      { id: 'f3', name: 'Fase 3 · Confort', items: [
        { id: 'w6', name: 'Frigobar (con envío e impuestos)', max: 550, bought: null }, { id: 'w7', name: 'Velador', max: 120, bought: null }, { id: 'w8', name: 'Cuadros', max: 100, bought: null }] },
      { id: 'f4', name: 'También en lista', items: [{ id: 'w9', name: 'Zapatillas de moto', max: 400, bought: null }] },
    ],
    movs: [],
    lastBackup: null,
  };
}

/* ---------- estado ---------- */
let S;
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { /* almacenamiento bloqueado */ }
  if (!raw) { S = seed(); return; }
  let d;
  try { d = JSON.parse(raw); } catch (e) {
    // Nunca sobrescribir datos que no se pudieron leer: se guardan aparte antes de empezar de cero.
    try { localStorage.setItem(KEY + '-ilegible-' + Date.now(), raw); } catch (e2) {}
    S = seed(); return;
  }
  const from = d.version || 1;
  if (from < DATA_VERSION) {
    // Copia exacta de los datos antes de migrar (por si acaso).
    try { localStorage.setItem(KEY + '-backup-v' + from, raw); } catch (e) {}
  }
  S = migrate(d);
  if (from < DATA_VERSION) save();
}

/* Migraciones: solo AGREGAN cosas; nunca borran movimientos, ingresos ni pasos. */
function migrate(d) {
  const base = seed();
  const from = d.version || 1;
  for (const k in base) if (d[k] == null) d[k] = base[k];
  d.settings = Object.assign({}, base.settings, d.settings);
  if (from < 2) migrateV1toV2(d);
  if (from < 3) migrateV2toV3(d);
  d.version = DATA_VERSION;
  return d;
}
function migrateV2toV3(d) {
  const notes = [];
  const items = d.checklist.filter(c => c.action && c.action.type === 'gasto' && c.action.method === 'tarjeta');
  const c4 = items.find(c => c.id === 'c4');
  // 1) Gastos con tarjeta ya hechos desde un paso del plan → planificados y vinculados a ese paso
  items.forEach(c => { const m = c.movId && d.movs.find(x => x.id === c.movId);
    if (m && m.type === 'gasto' && !m.planId) { m.planId = c.id; if (m.method === 'tarjeta') { m.planned = true; m.backed = 'plan'; } } });
  // 2) Vuelos del viaje (JetSMART, LATAM…) → planificados y vinculados a "Cusco: vuelo y alojamiento"
  const flightRx = /jet\s*smart|latam|sky\s*airline|vuelo|avi[oó]n|a[eé]reo|alojamiento|hotel|airbnb|hostal/i;
  const trip = d.movs.filter(m => m.type === 'gasto' && !m.planId && (flightRx.test(m.note || '') || (m.cat === 'cusco' && m.method === 'tarjeta')));
  trip.forEach(m => { if (c4) m.planId = 'c4'; if (m.method === 'tarjeta') { m.planned = true; m.backed = 'plan'; } });
  const linkedC4 = c4 ? d.movs.filter(m => m.type === 'gasto' && m.planId === 'c4') : [];
  if (linkedC4.length) notes.push(`Marqué como planificados los gastos del viaje: ${linkedC4.map(m => `${m.note || 'Cusco'} ${money(m.amount)}`).join(', ')}. Ya no te pedirán pasarlos a Pagos.`);
  else notes.push('No encontré los vuelos ya registrados. Abre cada uno en Movimientos y en "¿Compra planificada?" elige "Plan: Vuelo y alojamiento Cusco".');
  // 3) Estado de cada paso según lo gastado (lo pendiente sigue sumando al estado de cuenta)
  items.forEach(c => {
    const linked = d.movs.filter(m => m.type === 'gasto' && m.planId === c.id);
    if (!linked.length) return;
    const spent = linked.reduce((a, m) => a + (Number(m.amount) || 0), 0);
    c.done = spent >= Number(c.action.amount) - 0.01; c.movId = linked[linked.length - 1].id; c.closed = false;
    if (c.id === 'c4') notes.push(`Cusco (vuelo y alojamiento): ${money(spent)} gastado + ${money(Math.max(0, c.action.amount - spent))} pendiente = ${money(c.action.amount)}.`);
  });
  // 4) Consejos: los descartados quedan como estaban
  d.tipsHidden = d.tipsHidden || {};
  d.updateNote = { version: APP_VERSION, notes: ((d.updateNote && d.updateNote.notes) || []).concat(notes) };
}
function migrateV1toV2(d) {
  const notes = [];
  NEW_CATS_V2.forEach(c => { if (!d.categories.some(x => x.id === c.id)) d.categories.push(Object.assign({}, c)); });
  const P = id => d.periods.find(p => p.id === id);
  const setIfMissing = (p, k, v) => { if (p && p.budgets[k] == null) p.budgets[k] = v; };
  const nov = P('p-2026-11'), dic = P('p-2026-12');
  setIfMissing(nov, 'entretenimiento', 60); setIfMissing(nov, 'deporte', 0);
  setIfMissing(dic, 'entretenimiento', 100); setIfMissing(dic, 'deporte', 0);
  if (nov && nov.budgets.imprevistos != null) {
    if (nov.budgets.imprevistos === 100) nov.budgets.imprevistos = 40;
    else notes.push(`Imprevistos de noviembre ya lo habías cambiado a ${money(nov.budgets.imprevistos)}: lo dejé así (la idea era bajarlo a S/40 para cubrir Entretenimiento).`);
  }
  if (dic && dic.budgets.vida != null) {
    if (dic.budgets.vida === 600) dic.budgets.vida = 500;
    else notes.push(`Vida diaria de diciembre ya lo habías cambiado a ${money(dic.budgets.vida)}: lo dejé así (la idea era bajarlo a S/500).`);
  }
  d.periods.filter(p => p.start >= '2027-01-01').forEach(p => { setIfMissing(p, 'deporte', 300); setIfMissing(p, 'entretenimiento', 100); });
  if (!d.clases) d.clases = { total: 10, log: [], paquetes: [] };
  d.updateNote = { version: APP_VERSION, notes };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('No se pudo guardar en el equipo', 'bad'); }
}
const ui = { tab: 'inicio', sub: null, periodIdx: null, stmtSel: null, showDone: false,
  f: { month: 'all', cat: 'all', type: 'all', acc: 'all' } };

const acc = id => S.accounts.find(a => a.id === id) || { id, name: id, emoji: '•', color: 'var(--muted)' };
const cat = id => S.categories.find(c => c.id === id) || { id, name: id || 'Sin categoría', emoji: '📦' };
const income = id => S.incomes.find(i => i.id === id);
const visibleCats = () => S.categories.filter(c => !c.hidden).map(c => c.id);

/* ---------- cálculos ---------- */
function balances() {
  const b = {};
  S.accounts.forEach(a => b[a.id] = num(S.openings[a.id]));
  const add = (k, v) => { b[k] = r2((b[k] || 0) + v); };
  for (const m of S.movs) {
    if (m.type === 'gasto' && m.method !== 'tarjeta') add(m.account, -m.amount);
    else if (m.type === 'ingreso') for (const k in m.alloc) add(k, num(m.alloc[k]));
    else if (m.type === 'transfer') { add(m.from, -m.amount); add(m.to, m.amount); }
    else if (m.type === 'pago') add(m.from, -m.amount);
  }
  return b;
}

function dueFor(dateStr) {
  const d = pd(dateStr);
  const m = d.getMonth() + (d.getDate() <= S.settings.cierre ? 1 : 2);
  return ymd(new Date(d.getFullYear(), m, S.settings.vence));
}

function periodIndexFor(date) {
  const ps = S.periods; if (!ps.length) return -1;
  let i = ps.findIndex(p => date >= p.start && date <= p.end);
  if (i < 0) i = date < ps[0].start ? 0 : (ps.map((p, j) => p.start <= date ? j : -1).filter(j => j >= 0).pop() ?? ps.length - 1);
  return i;
}
function periodFor(date, catId) {
  const ps = S.periods; const i = periodIndexFor(date); if (i < 0) return null;
  if (ps[i].budgets[catId] != null) return ps[i].id;
  for (let j = i + 1; j < ps.length; j++) if (ps[j].budgets[catId] != null) return ps[j].id;
  return ps[i].id;
}
function spent(pid, catId) {
  return sum(S.movs.filter(m => m.type === 'gasto' && m.cat === catId && periodFor(m.date, m.cat) === pid).map(m => m.amount));
}
function catStatus(pid, catId) {
  const p = S.periods.find(x => x.id === pid); const b = p ? num(p.budgets[catId]) : 0;
  const s = spent(pid, catId); const pct = b > 0 ? s / b : (s > 0 ? 2 : 0);
  return { budget: b, spent: s, left: r2(b - s), pct, cls: pct > 1 ? 'over' : pct >= 0.8 ? 'warn' : '' };
}

function allDues() {
  const out = new Set(Object.keys(S.statements));
  S.cuotas.forEach(c => { for (let i = 0; i < c.n; i++) out.add(addMonths(c.first, i)); });
  S.movs.forEach(m => m.due && out.add(m.due));
  out.add(dueFor(today()));
  return [...out].sort();
}
function stmt(due) {
  const items = [];
  S.cuotas.forEach(c => { for (let i = 0; i < c.n; i++) if (addMonths(c.first, i) === due) items.push({ label: `${c.emoji || ''} ${c.name} · cuota ${i + 1}/${c.n}`, amount: num(c.monthly), kind: 'cuota' }); });
  S.subs.forEach(s => { if (due >= s.from && (!s.to || due <= s.to)) items.push({ label: `☁️ ${s.name} (US$${s.usd})`, amount: r2(num(s.usd) * S.settings.fx), kind: 'sub' }); });
  S.movs.filter(m => m.type === 'gasto' && m.method === 'tarjeta' && m.due === due)
    .forEach(m => items.push({ label: `${cat(m.cat).emoji} ${m.note || cat(m.cat).name}${m.planned ? ' ✓' : ''}`, amount: m.amount, kind: 'compra', id: m.id }));
  const t = today();
  // Lo planificado que AÚN no se compra: estimado del ítem menos lo ya gastado y vinculado (sin doble conteo).
  const planned = cardPlanItems().map(c => ({ c, s: planStatus(c) }))
    .filter(x => x.s.pending > 0 && dueFor(x.c.date < t ? t : x.c.date) === due)
    .map(x => ({ label: `🗓️ ${x.c.action.note || x.c.text}${x.s.spent ? ` · pendiente (ya gastaste ${money(x.s.spent)} de ${money(x.s.est)})` : ''}`, amount: x.s.pending, kind: 'plan' }));
  const reg = sum(items.map(i => i.amount)), plan = sum(planned.map(i => i.amount)), est = r2(reg + plan);
  const ov = S.statements[due] || {};
  const hasReal = ov.realPEN != null && ov.realPEN !== '';
  const real = hasReal ? r2(num(ov.realPEN) + num(ov.realUSD) * S.settings.fx) : null;
  const total = real ?? est;
  const paid = sum(S.movs.filter(m => m.type === 'pago' && m.due === due).map(m => m.amount));
  return { due, payBy: ov.payBy || due, fixed: !!ov.fixed, items, planned, reg, plan, est, real, total, paid,
    pending: r2(Math.max(0, total - paid)), isPaid: total > 0 && paid >= total - 0.01 };
}
function nextStatement() {
  return allDues().map(stmt).find(s => !s.isPaid && s.total > 0) || null;
}
function cuotaProgress(c) {
  let paid = 0; const dues = [];
  for (let i = 0; i < c.n; i++) { const d = addMonths(c.first, i); dues.push(d); if (stmt(d).isPaid) paid++; }
  const next = dues.find(d => !stmt(d).isPaid);
  return { paid, left: c.n - paid, leftAmount: r2((c.n - paid) * num(c.monthly)), next, last: dues[dues.length - 1] };
}

/* ---------- Compras planificadas con tarjeta (ítems del plan) ---------- */
const isCardPlan = c => !!(c && c.action && c.action.type === 'gasto' && c.action.method === 'tarjeta');
const cardPlanItems = () => S.checklist.filter(isCardPlan);
function planStatus(c) {
  const est = num(c.action.amount);
  const linked = S.movs.filter(m => m.type === 'gasto' && m.planId === c.id);
  const spentAmt = sum(linked.map(m => m.amount));
  const closed = !!c.closed || (c.done && !linked.length); // marcado a mano como terminado
  return { est, spent: spentAmt, pending: closed ? 0 : r2(Math.max(0, est - spentAmt)), count: linked.length, closed, last: linked[linked.length - 1] };
}
function syncPlanItem(id) {
  const c = S.checklist.find(x => x.id === id); if (!isCardPlan(c)) return;
  const linked = S.movs.filter(m => m.type === 'gasto' && m.planId === c.id);
  if (linked.length) { c.done = !!c.closed || sum(linked.map(m => m.amount)) >= num(c.action.amount) - 0.01; c.movId = linked[linked.length - 1].id; }
  else if (!c.closed) { c.done = false; c.movId = null; }
}

function suggestAlloc(inc, amount, excludeMovId) {
  amount = r2(amount); let a = {}; const notes = [];
  if (inc.type === 'probable') {
    if (inc.date < '2027-01-01') {
      const used = sum(S.movs.filter(m => m.type === 'ingreso' && m.probable && m.id !== excludeMovId).map(m => num(m.alloc.cusco)));
      const c = r2(Math.min(amount, Math.max(0, S.settings.cuscoCap - used)));
      if (c > 0) a.cusco = c;
      if (amount - c > 0) a.ahorro = r2(amount - c);
      notes.push(`Regla: los primeros ${money(S.settings.cuscoCap)} de ingresos probables van al bolsillo de Cusco (ya llevas ${money(used)}); el resto va a Ahorro.`);
    } else {
      a.deseos = amount;
      notes.push('Desde enero, los ingresos extra ya cobrados van a Deseos (remodelar tu cuarto). Puedes cambiarlo.');
    }
    return { a, notes };
  }
  const base = Object.assign({}, inc.suggest || { dia: inc.amount });
  a = Object.assign({}, base);
  const diff = r2(amount - sum(Object.values(base)));
  if (diff !== 0) {
    const key = base.pagos != null ? 'pagos' : Object.keys(base).sort((x, y) => base[y] - base[x])[0];
    a[key] = r2(Math.max(0, num(a[key]) + diff));
    let over = r2(sum(Object.values(a)) - amount);
    for (const k of Object.keys(a)) { if (over <= 0) break; const t = Math.min(a[k], over); a[k] = r2(a[k] - t); over = r2(over - t); }
  }
  // Regla: si el estado de cuenta sale más alto, la diferencia sale de lo que ibas a ahorrar
  if (num(a.ahorro) > 0 && a.pagos != null) {
    const st = allDues().map(stmt).find(s => !s.isPaid && s.total > 0 && s.payBy >= inc.date);
    if (st) {
      const b = balances();
      const future = sum(S.incomes.filter(i => i.id !== inc.id && i.type === 'seguro' && !i.received && i.date <= st.payBy).map(i => num((i.suggest || {}).pagos)));
      const gap = r2(st.pending - num(b.pagos) - num(a.pagos) - future);
      if (gap > 0.5) {
        const shift = r2(Math.min(gap, a.ahorro));
        a.ahorro = r2(a.ahorro - shift); a.pagos = r2(a.pagos + shift);
        notes.push(`El estado de cuenta del ${fmtDate(st.due)} pide ${money(shift)} más: por tu regla se descuenta de Ahorro, no del día a día.`);
      }
    }
  }
  for (const k in a) if (!a[k]) delete a[k];
  return { a, notes };
}

function wishProgress() {
  let avail = Math.max(0, num(balances().deseos));
  return S.wishes.map(ph => {
    const need = sum(ph.items.filter(i => !i.bought).map(i => i.max));
    const got = r2(Math.min(avail, need)); avail = r2(avail - got);
    const boughtTotal = sum(ph.items.filter(i => i.bought).map(i => { const m = S.movs.find(x => x.id === i.bought); return m ? m.amount : i.max; }));
    return { ph, need, got, boughtTotal, done: need === 0 && ph.items.length > 0 };
  });
}

/* ---------- movimientos ---------- */
function upsertMov(m) {
  const i = S.movs.findIndex(x => x.id === m.id);
  if (i >= 0) S.movs[i] = m; else S.movs.push(m);
}
function deleteMov(id) {
  const gone = S.movs.find(m => m.id === id);
  S.movs = S.movs.filter(m => m.id !== id);
  S.checklist.forEach(c => { if (c.movId === id || (gone && gone.planId === c.id)) { if (isCardPlan(c)) syncPlanItem(c.id); else { c.movId = null; c.done = false; } } });
  S.incomes.forEach(i => { if (i.received === id) i.received = null; });
  S.wishes.forEach(ph => ph.items.forEach(w => { if (w.bought === id) w.bought = null; }));
}
function movInfo(m) {
  if (m.type === 'gasto') {
    const c = cat(m.cat);
    const via = m.method === 'tarjeta' ? `💳 vence ${fmtDate(m.due)}` : `${METHOD[m.method]} · ${acc(m.account).name}`;
    return { em: c.emoji, t: m.note || c.name, s: `${m.note ? c.name + ' · ' : ''}${via}`, amt: -m.amount, cls: 'neg' };
  }
  if (m.type === 'ingreso') {
    const parts = Object.entries(m.alloc).filter(([, v]) => v > 0).map(([k, v]) => `${acc(k).name} ${money(v)}`);
    return { em: '💰', t: m.name, s: parts.join(' · '), amt: m.amount, cls: 'pos' };
  }
  if (m.type === 'transfer') return { em: '🔁', t: `${acc(m.from).name} → ${acc(m.to).name}`, s: m.note || 'Transferencia entre cuentas', amt: m.amount, cls: '' };
  if (m.type === 'pago') return { em: '💳', t: 'Pago de tarjeta', s: `Estado del ${fmtDate(m.due)} · desde ${acc(m.from).name}`, amt: -m.amount, cls: '' };
  return { em: '•', t: '?', s: '', amt: 0, cls: '' };
}
function editMov(m) {
  if (m.type === 'gasto') sheetGasto({ mov: m });
  else if (m.type === 'transfer') sheetTransfer({ mov: m });
  else if (m.type === 'pago') sheetPago({ mov: m });
  else if (m.type === 'ingreso') { const i = income(m.incomeId) || { id: null, name: m.name, amount: m.amount, date: m.date, type: m.probable ? 'probable' : 'seguro' }; sheetIngreso(i, m); }
}

/* ---------- toast ---------- */
let toastT;
function toast(msg, kind = '') {
  const el = $('#toast'); el.innerHTML = `<div class="${kind}">${msg}</div>`;
  clearTimeout(toastT); toastT = setTimeout(() => el.innerHTML = '', kind ? 3800 : 2200);
}

/* ---------- navegación ---------- */
const TABS = ['inicio', 'movs', 'plan', 'mas'];
const TITLES = { inicio: 'Hola, Daniel', movs: 'Movimientos', plan: 'Plan', mas: 'Más', ingresos: 'Ingresos', tarjeta: 'Tarjeta BCP', deseos: 'Mi cuarto', mensual: 'Enero – Mayo', ajustes: 'Ajustes', consejos: 'Consejos' };
function go(to) {
  if (TABS.includes(to)) { ui.tab = to; ui.sub = null; } else { ui.tab = 'mas'; ui.sub = to; }
  render(); window.scrollTo(0, 0);
}

function render() {
  document.documentElement.dataset.theme = S.settings.theme;
  const key = ui.sub || ui.tab;
  $('#top').innerHTML = `${ui.sub ? '<button class="back" data-a="back" aria-label="Volver">‹</button>' : ''}<h1>${TITLES[key]}</h1><span class="date">${fmtDate(today(), true)}</span>`;
  document.querySelectorAll('#nav [data-a="tab"]').forEach(b => b.classList.toggle('on', b.dataset.v === ui.tab));
  const views = { inicio: vInicio, movs: vMovs, plan: vPlan, mas: vMas, ingresos: vIngresos, tarjeta: vTarjeta, deseos: vDeseos, mensual: vMensual, ajustes: vAjustes, consejos: vConsejos };
  $('#view').innerHTML = `<div class="view-anim">${views[key]()}</div>`;
}

/* =================== VISTAS =================== */

function bar(pct, cls = '', mark) {
  const w = Math.max(0, Math.min(100, pct * 100));
  return `<div class="bar ${cls}"><i style="width:${w}%"></i>${mark != null ? `<span class="mark" style="left:${Math.min(100, mark * 100)}%"></span>` : ''}</div>`;
}

function vInicio() {
  const b = balances(); const t = today(); let h = '';

  // Aviso de actualización (una sola vez)
  if (S.updateNote) {
    h += `<div class="alert info"><span class="ic">✨</span><div><b>App actualizada a la versión ${esc(APP_VERSION)}</b>
      ${esc(RELEASE_NOTES)} Tus ${S.movs.length} movimientos siguen aquí.
      ${(S.updateNote.notes || []).map(n => `<div class="small" style="margin-top:6px">• ${esc(n)}</div>`).join('')}
      <button class="btn sm" data-a="noteOk" style="margin-top:10px">Entendido</button></div></div>`;
  }

  // 1) Los 4 saldos
  h += `<div class="accounts">` + ['dia', 'pagos', 'cusco', 'ahorro'].map(id => { const a = acc(id);
    return `<button class="acc tap" style="--c:${a.color}" data-a="accFilter" data-v="${a.id}">
      <div class="n">${a.emoji} ${esc(a.name)}</div><div class="v num ${b[a.id] < 0 ? 'neg' : ''}">${money(b[a.id] || 0)}</div></button>`; }).join('') + `</div>`;

  // 2) Próximo pago de tarjeta: monto y fecha
  const st = nextStatement();
  if (st) {
    const dl = daysBetween(t, st.payBy);
    h += `<button class="card tap home-line" data-a="go" data-v="tarjeta">
      <div class="hl-lbl">💳 Próximo pago de tarjeta</div>
      <div class="row"><span class="big-num num">${money(st.pending)}</span>
      <span class="hl-date"><b>${fmtDate(st.payBy, true)}</b><br><span class="badge ${dl < 0 ? 'over' : dl <= 3 ? 'warn' : 'blue'}">${dl < 0 ? 'atrasado' : dl === 0 ? 'hoy' : 'en ' + dl + ' día' + (dl > 1 ? 's' : '')}</span></span></div></button>`;
  }

  // 3) ¿Alcanza?
  const al = alcanza();
  h += `<button class="card tap home-line" data-a="go" data-v="consejos">
    <div class="hl-lbl">🧮 ¿Alcanza?</div>
    <div class="big-num ${al.falta > 0 ? 'neg' : 'pos'}">${al.falta > 0 ? 'Faltan ' + money(al.falta) : 'Sí ✅'}</div>
    ${al.lines.map(l => `<div class="small muted">${esc(l)}</div>`).join('')}</button>`;

  // 4) Un solo consejo (el más importante)
  const tl = tips();
  if (tl.length) h += `<div class="card"><h3>💡 Consejo</h3>${tipCard(tl[0])}
    ${tl.length > 1 ? `<button class="btn sm" data-a="go" data-v="consejos" style="margin-top:10px;width:100%">Ver más (${tl.length - 1})</button>` : ''}</div>`;

  // Detalle plegable: todo lo demás
  h += `<button class="btn" data-a="homeDetail" style="margin-bottom:14px">${ui.homeDetail ? '▲ Ocultar detalle' : '▼ Ver detalle: categorías, clases, plan y ahorro'}</button>`;
  if (!ui.homeDetail) return h;
  h += `<div class="btns" style="margin:0 0 14px"><button class="btn sm" data-a="newTransfer">🔁 Mover dinero</button><button class="btn sm" data-a="go" data-v="ingresos">💰 Ingresos</button></div>`;

  // Ahorro
  const ah = num(b.ahorro), min = S.settings.ahorroMin, max = S.settings.ahorroMax;
  const pmin = Math.min(1, ah / min); const C = 2 * Math.PI * 40;
  h += `<div class="card"><h3>Meta de ahorro <span class="badge ${ah >= min ? 'ok' : ''}">${ah >= min ? 'mínimo logrado' : 'no se toca'}</span></h3>
    <div class="ring-wrap"><svg class="ring" viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="40"/>
    <circle class="fg" cx="50" cy="50" r="40" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pmin)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="57" text-anchor="middle">${Math.round(pmin * 100)}%</text></svg>
    <div style="flex:1"><div class="big-num num" style="font-size:28px">${money(ah)}</div>
    <div class="muted small">Mínimo ${money(min)} el 15 dic · posible ${money(max)}</div>
    <div style="margin-top:8px">${bar(ah / max, '', min / max)}</div></div></div></div>`;

  // Categorías del periodo
  if (ui.periodIdx == null) ui.periodIdx = Math.max(0, periodIndexFor(t));
  const p = S.periods[ui.periodIdx];
  if (p) {
    const cats = Object.keys(p.budgets);
    const extra = [...new Set(S.movs.filter(m => m.type === 'gasto' && m.cat !== 'deseos' && periodFor(m.date, m.cat) === p.id && p.budgets[m.cat] == null).map(m => m.cat))];
    const totB = sum(cats.map(c => p.budgets[c])), totS = sum(cats.map(c => spent(p.id, c)));
    h += `<div class="card"><h3>Disponible por categoría</h3>
      <div class="period-nav"><button data-a="period" data-v="-1" ${ui.periodIdx === 0 ? 'disabled style="opacity:.3"' : ''}>‹</button>
      <div class="lbl">${esc(p.label)}<div class="muted tiny">${fmtDate(p.start)} – ${fmtDate(p.end)}</div></div>
      <button data-a="period" data-v="1" ${ui.periodIdx === S.periods.length - 1 ? 'disabled style="opacity:.3"' : ''}>›</button></div>
      <div class="row small" style="margin:8px 0 4px"><span class="muted">Gastado ${money(totS)} de ${money(totB)}</span><b class="${totS > totB ? 'neg' : 'pos'}">Quedan ${money(totB - totS)}</b></div>`;
    h += cats.map(c => catRow(p.id, c)).join('');
    h += extra.map(c => { const s = spent(p.id, c); return `<div class="cat-row"><div class="top"><span class="name">${cat(c).emoji} ${esc(cat(c).name)}</span><span class="left muted">${money(s)} · sin presupuesto</span></div></div>`; }).join('');
    h += `</div>`;
  }

  // Clases de fútbol
  h += clasesCard();

  // Próximos pasos
  const next = S.checklist.filter(c => !c.done && c.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  if (next.length) h += `<div class="card"><h3>Próximos pasos <button class="link" data-a="tab" data-v="plan">Ver plan</button></h3>${next.map(checkRow).join('')}</div>`;

  // Probables
  const prob = S.incomes.filter(i => i.type === 'probable' && !i.received && i.date <= '2027-01-05');
  if (prob.length) h += `<div class="card tap" data-a="go" data-v="ingresos"><h3>Ingresos probables (no contados)</h3>
    <div class="row"><span>${prob.length} pendientes hasta el 5 ene</span><b class="num">${money(sum(prob.map(i => i.amount)))}</b></div>
    <div class="muted small" style="margin-top:4px">Márcalos como recibidos cuando lleguen y la app te dice cómo repartirlos.</div></div>`;
  return h;
}

function catRow(pid, c) {
  const s = catStatus(pid, c); const k = cat(c);
  const badge = s.cls === 'over' ? `<span class="badge over">Excedido ${money(-s.left)}</span>` : s.cls === 'warn' ? `<span class="badge warn">${Math.round(s.pct * 100)}%</span>` : '';
  return `<div class="cat-row tap" data-a="catFilter" data-v="${c}" data-p="${pid}">
    <div class="top"><span class="name">${k.emoji} ${esc(k.name)} ${badge}</span>
    <span class="left num ${s.cls === 'over' ? 'neg' : ''}">${s.cls === 'over' ? '' : '<b>' + money(s.left) + '</b> <span class="muted">de ' + money(s.budget) + '</span>'}</span></div>
    ${bar(s.pct, s.cls)}
    ${c === 'deporte' ? `<div class="small muted" style="margin-top:6px">⚽ Clases del paquete: <b>${clasesUsadas()} de ${S.clases.total}</b></div>` : ''}
    ${k.rule ? `<div class="tiny ${c === 'deporte' ? 'warn-t' : 'muted'}" style="margin-top:4px">📌 ${esc(k.rule)}</div>` : ''}</div>`;
}

/* ---------- Clases de fútbol (paquete) ---------- */
const clasesUsadas = () => (S.clases && S.clases.log ? S.clases.log.length : 0);
const clasesQuedan = () => Math.max(0, S.clases.total - clasesUsadas());
function clasesCard() {
  const u = clasesUsadas(), tot = S.clases.total, q = clasesQuedan();
  const last = S.clases.log[S.clases.log.length - 1];
  const yaHoy = S.clases.log.includes(today());
  const badge = q === 0 ? '<span class="badge over">paquete terminado</span>' : q <= 2 ? `<span class="badge warn">quedan ${q}</span>` : `<span class="badge ok">quedan ${q}</span>`;
  const dots = Array.from({ length: tot }, (_, i) => `<span class="dot ${i < u ? 'on' : ''}"></span>`).join('');
  return `<div class="card"><h3>⚽ Clases de fútbol ${badge}</h3>
    <div class="row"><div><div class="big-num num">${u} <span class="muted" style="font-size:20px">de ${tot}</span></div>
    <div class="muted small">${last ? 'Última clase: ' + fmtDate(last, true) : 'Aún no marcas clases de este paquete'}</div></div></div>
    <div class="dots">${dots}</div>
    ${q <= 2 && q > 0 ? '<div class="small warn-t" style="margin-top:8px">Te quedan 2 o menos: el próximo paquete se paga solo con ingresos extra ya cobrados.</div>' : ''}
    <div class="btns">${q > 0 ? `<button class="btn primary" data-a="claseMas">${yaHoy ? '＋ Otra clase hoy' : '✓ Fui hoy'}</button>` : ''}
    ${u > 0 ? '<button class="btn sm" data-a="claseMenos" style="flex:0 0 auto">↶ Deshacer</button>' : ''}</div>
    <button class="btn sm" data-a="clasesReset" style="margin-top:10px;width:100%">🔄 Compré un paquete nuevo</button></div>`;
}

function checkRow(c) {
  const t = today(); const cls = c.done ? 'done' : c.date < t ? 'late' : c.date === t ? 'today' : '';
  let act = '', prog = '';
  const ps = isCardPlan(c) ? planStatus(c) : null;
  if (ps && ps.count) prog = `<div class="small ${ps.pending > 0 ? 'muted' : 'pos'}" style="margin-top:4px">💳 Gastado ${money(ps.spent)} de ${money(ps.est)}${ps.pending > 0 ? ` · pendiente ${money(ps.pending)}` : ps.spent < ps.est ? ' · cerrado' : ''}</div>`;
  if (!c.done && c.action) {
    const lbl = { gasto: c.action.method === 'tarjeta' ? (ps && ps.count ? '💳 Registrar otra compra' : '💳 Registrar compra') : '➕ Registrar gasto', pago: '💳 Registrar pago', ingreso: '💰 Marcar recibido', nav: '👀 Ver tarjeta' }[c.action.type];
    act = `<div class="act"><button class="btn sm" data-a="checkAct" data-v="${c.id}">${lbl}</button></div>`;
  }
  return `<div class="check ${cls}"><button class="box" data-a="checkToggle" data-v="${c.id}" aria-label="Marcar">${c.done ? '✓' : ''}</button>
    <div class="body"><div class="when">${esc(c.when || fmtDate(c.date))}${cls === 'late' ? ' · pendiente' : cls === 'today' ? ' · hoy' : ''}</div>
    <div class="txt tap" data-a="checkEdit" data-v="${c.id}">${esc(c.text)}</div>${prog}${act}</div></div>`;
}

function vMovs() {
  const f = ui.f;
  const months = [...new Set(S.movs.map(m => m.date.slice(0, 7)))].sort().reverse();
  let list = S.movs.slice();
  if (f.month !== 'all') list = list.filter(m => m.date.startsWith(f.month));
  if (f.type !== 'all') list = list.filter(m => m.type === f.type);
  if (f.cat !== 'all') list = list.filter(m => m.type === 'gasto' && m.cat === f.cat && (!f.pid || periodFor(m.date, m.cat) === f.pid));
  if (f.acc !== 'all') list = list.filter(m => (m.type === 'gasto' && m.account === f.acc) || (m.type === 'ingreso' && m.alloc[f.acc]) || (m.type === 'transfer' && (m.from === f.acc || m.to === f.acc)) || (m.type === 'pago' && m.from === f.acc));
  list.sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));

  let h = `<div class="hscroll"><button class="chip ${f.month === 'all' ? 'on' : ''}" data-a="fMonth" data-v="all">Todo</button>` +
    months.map(m => { const [y, mm] = m.split('-'); return `<button class="chip ${f.month === m ? 'on' : ''}" data-a="fMonth" data-v="${m}">${MESL[+mm - 1]} ${y}</button>`; }).join('') + `</div>`;
  h += `<div class="grid2" style="margin-bottom:12px">
    <select data-a="fSel" data-k="cat"><option value="all">Todas las categorías</option>${S.categories.map(c => `<option value="${c.id}" ${f.cat === c.id ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select>
    <select data-a="fSel" data-k="type"><option value="all">Todos los tipos</option>${[['gasto', 'Gastos'], ['ingreso', 'Ingresos'], ['transfer', 'Transferencias'], ['pago', 'Pagos de tarjeta']].map(([v, l]) => `<option value="${v}" ${f.type === v ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`;
  if (f.acc !== 'all' || f.pid) h += `<div class="chips" style="margin-bottom:10px">${f.acc !== 'all' ? `<button class="chip on" data-a="fClear" data-v="acc">${acc(f.acc).emoji} ${esc(acc(f.acc).name)} ✕</button>` : ''}${f.pid ? `<button class="chip on" data-a="fClear" data-v="pid">${esc((S.periods.find(p => p.id === f.pid) || {}).label || '')} ✕</button>` : ''}</div>`;

  const gastos = sum(list.filter(m => m.type === 'gasto').map(m => m.amount));
  h += `<div class="row small muted" style="margin:0 4px 4px"><span>${list.length} movimiento${list.length !== 1 ? 's' : ''}</span><span>Gastos: <b class="neg">${money(gastos)}</b></span></div>`;
  if (!list.length) return h + `<div class="empty">No hay movimientos aquí.<br>Toca <b>＋</b> para registrar un gasto.</div>`;
  let lastDay = '';
  h += `<div class="card" style="padding-top:4px">`;
  for (const m of list) {
    if (m.date !== lastDay) { if (lastDay) h += `</div><div class="card" style="padding-top:4px">`; h += `<div class="day-h">${relDay(m.date)}</div>`; lastDay = m.date; }
    const i = movInfo(m);
    h += `<button class="list-item tap" data-a="editMov" data-v="${m.id}"><span class="em">${i.em}</span><span class="mid"><div class="t">${esc(i.t)}</div><div class="s">${esc(i.s)}</div></span><span class="amt num ${i.cls}">${money(i.amt, { sign: true })}</span></button>`;
  }
  return h + `</div>`;
}

function vPlan() {
  const items = S.checklist.slice().sort((a, b) => a.date.localeCompare(b.date));
  const done = items.filter(c => c.done).length;
  let h = `<div class="card"><div class="row"><div><div class="big-num num">${done}/${items.length}</div><div class="muted small">pasos completados</div></div>
    <button class="btn sm" data-a="newCheck">＋ Agregar paso</button></div><div style="margin-top:12px">${bar(items.length ? done / items.length : 0)}</div></div>`;
  h += `<div class="seg" style="margin-bottom:14px"><button class="${!ui.showDone ? 'on' : ''}" data-a="showDone" data-v="0">Pendientes</button><button class="${ui.showDone ? 'on' : ''}" data-a="showDone" data-v="1">Todos</button></div>`;
  const vis = ui.showDone ? items : items.filter(c => !c.done);
  if (!vis.length) return h + `<div class="empty">🎉 ¡Todo listo! No hay pasos pendientes.</div>`;
  const groups = {};
  vis.forEach(c => { const k = c.date.slice(0, 7); (groups[k] = groups[k] || []).push(c); });
  for (const k of Object.keys(groups).sort()) {
    const [y, m] = k.split('-');
    h += `<div class="card"><h3>${MESL[+m - 1]} ${y}</h3>${groups[k].map(checkRow).join('')}</div>`;
  }
  return h;
}

function vMas() {
  const b = balances(); const st = nextStatement(); const pend = S.incomes.filter(i => !i.received && i.date <= addDays(today(), 31));
  const tiles = [
    ['consejos', '💡', 'Consejos', '¿Me alcanza? y avisos'],
    ['ingresos', '💰', 'Ingresos', `${pend.length} por llegar este mes`],
    ['tarjeta', '💳', 'Tarjeta', st ? `${money(st.pending)} · ${fmtDate(st.payBy)}` : 'Al día'],
    ['deseos', '🛋️', 'Mi cuarto', `Juntado ${money(Math.max(0, b.deseos || 0))}`],
    ['mensual', '📆', 'Ene – May', 'Vista mensual'],
    ['ajustes', '⚙️', 'Ajustes', 'Presupuestos, respaldo'],
  ];
  return `<div class="tiles">${tiles.map(([v, e, t, s]) => `<button class="tile tap" data-a="go" data-v="${v}"><span class="e">${e}</span><span><div class="t">${t}</div><div class="s">${esc(s)}</div></span></button>`).join('')}</div>
  <p class="muted small" style="text-align:center;margin-top:24px">Tus datos se guardan solo en este iPhone. Exporta un respaldo de vez en cuando.</p>`;
}

function vIngresos() {
  const t = today();
  const pend = S.incomes.filter(i => !i.received).sort((a, b) => a.date.localeCompare(b.date));
  const rec = S.incomes.filter(i => i.received).sort((a, b) => b.date.localeCompare(a.date));
  const row = i => {
    const late = i.date < t;
    return `<div class="list-item"><span class="em">${i.type === 'seguro' ? '✅' : '🤞'}</span>
      <span class="mid tap" data-a="editIncome" data-v="${i.id}"><div class="t">${esc(i.name)}</div><div class="s">${late ? '⏰ ' : ''}${fmtDate(i.date)} · ${money(i.amount)}</div></span>
      <button class="btn sm ${i.type === 'seguro' ? 'primary' : ''}" data-a="receive" data-v="${i.id}">Recibido</button></div>`;
  };
  const used = sum(S.movs.filter(m => m.type === 'ingreso' && m.probable).map(m => num(m.alloc.cusco)));
  const seg = pend.filter(i => i.type === 'seguro'), prob = pend.filter(i => i.type === 'probable');
  const soon = d => d <= '2027-01-05';
  let h = `<div class="card"><h3>Bolsillo de Cusco (desde probables)</h3><div class="row"><span>${money(used)} de ${money(S.settings.cuscoCap)}</span><span class="muted small">luego → Ahorro</span></div><div style="margin-top:8px">${bar(used / S.settings.cuscoCap)}</div></div>`;
  h += `<div class="card"><h3>Seguros por llegar <span class="badge">${money(sum(seg.filter(i => soon(i.date)).map(i => i.amount)))} hasta 5 ene</span></h3>${seg.map(row).join('') || '<div class="muted">Nada pendiente</div>'}</div>`;
  h += `<div class="card"><h3>Probables <span class="badge warn">no contar hasta que lleguen</span></h3>${prob.map(row).join('') || '<div class="muted">Nada pendiente</div>'}</div>`;
  h += `<button class="btn" data-a="newIncome" style="margin-bottom:14px">＋ Agregar ingreso</button>`;
  if (rec.length) h += `<div class="card"><h3>Recibidos</h3>${rec.map(i => { const m = S.movs.find(x => x.id === i.received); const inf = m ? movInfo(m) : { s: '' };
    return `<button class="list-item tap" data-a="editMov" data-v="${i.received}"><span class="em">💰</span><span class="mid"><div class="t">${esc(i.name)}</div><div class="s">${m ? fmtDate(m.date) + ' · ' : ''}${esc(inf.s)}</div></span><span class="amt pos num">${money(m ? m.amount : i.amount)}</span></button>`; }).join('')}</div>`;
  return h;
}

function vTarjeta() {
  const b = balances(); const dues = allDues(); const all = dues.map(stmt).filter(s => s.total > 0 || s.paid > 0);
  const nx = nextStatement();
  const sel = (ui.stmtSel && all.find(s => s.due === ui.stmtSel)) || nx || all[all.length - 1];
  let h = '';
  if (sel) {
    const diff = sel.real != null && !sel.fixed ? r2(sel.real - sel.est) : 0;
    h += `<div class="card"><h3>Estado que vence el ${fmtDate(sel.due)} ${sel.isPaid ? '<span class="badge ok">pagado</span>' : `<span class="badge blue">pagar ${fmtDate(sel.payBy)}</span>`}</h3>
      <div class="big-num num">${money(sel.total)}</div><div class="muted small">${sel.real != null ? 'Monto real del estado de cuenta' : 'Estimado: cuotas + suscripción + compras registradas + planificadas'}</div>
      <div class="sep"></div><table class="mini">
      ${sel.items.map(i => `<tr><td>${esc(i.label)}</td><td>${money(i.amount)}</td></tr>`).join('')}
      ${sel.planned.map(i => `<tr class="muted"><td>${esc(i.label)} <span class="badge">planificado</span></td><td>${money(i.amount)}</td></tr>`).join('')}
      <tr class="tot"><td>Estimado</td><td>${money(sel.est)}</td></tr>
      ${sel.real != null ? `<tr class="tot"><td>Real</td><td>${money(sel.real)}</td></tr>` : ''}
      ${sel.paid ? `<tr><td>Pagado</td><td class="pos">−${money(sel.paid)}</td></tr><tr class="tot"><td>Falta pagar</td><td>${money(sel.pending)}</td></tr>` : ''}
      </table>
      ${sel.fixed ? `<div class="muted small" style="margin-top:8px">Monto conocido: S/${sel.real != null ? num(S.statements[sel.due].realPEN).toLocaleString('en-US') : ''} + US$${num((S.statements[sel.due] || {}).realUSD)} (T.C. ${S.settings.fx}).</div>` : ''}
      ${diff > 0.5 ? `<div class="alert warn" style="margin:12px 0 0"><span class="ic">⚠️</span><div><b>Salió ${money(diff)} más alto de lo estimado</b>Por tu regla, la diferencia sale de lo que ibas a ahorrar, no del día a día. La sugerencia del próximo ingreso ya lo ajusta.</div></div>` : ''}
      <div class="btns"><button class="btn" data-a="editStmt" data-v="${sel.due}">✏️ Monto real</button>${!sel.isPaid ? `<button class="btn primary" data-a="payStmt" data-v="${sel.due}">Registrar pago</button>` : ''}</div></div>`;
  }
  const cov = nx ? Math.min(1, num(b.pagos) / (nx.pending || 1)) : 1;
  h += `<div class="card"><h3>Cuenta Pagos</h3><div class="row"><div class="big-num num">${money(b.pagos || 0)}</div>${nx ? `<span class="${cov >= 1 ? 'pos' : 'warn-t'} small">${cov >= 1 ? '✅ cubre el próximo pago' : 'faltan ' + money(nx.pending - (b.pagos || 0))}</span>` : ''}</div>
    ${nx ? `<div style="margin-top:10px">${bar(cov, cov < 1 ? 'warn' : '')}</div>` : ''}
    <button class="btn" style="margin-top:12px" data-a="newTransfer" data-to="pagos">🔁 Pasar dinero a Pagos</button></div>`;
  const cps = cardPlanItems().map(c => ({ c, s: planStatus(c) }));
  if (cps.length) h += `<div class="card"><h3>Compras planificadas con tarjeta</h3>
    <div class="muted small" style="margin-bottom:6px">Lo gastado se descuenta del estimado: nunca se suma dos veces.</div>
    ${cps.map(({ c, s }) => `<div class="cat-row"><div class="top"><span class="name">${cat(c.action.cat).emoji} ${esc(c.action.note || c.text)}</span><span class="left num">${money(s.est)}</span></div>
      ${bar(s.est ? s.spent / s.est : 0, s.spent > s.est ? 'over' : '')}
      <div class="row small" style="margin-top:6px"><span>Gastado <b>${money(s.spent)}</b></span><span class="${s.pending ? 'warn-t' : 'pos'}">${s.pending ? 'Pendiente ' + money(s.pending) : s.closed && s.spent < s.est ? 'Cerrado' : '✓ Completo'}</span></div></div>`).join('')}</div>`;
  h += `<div class="card"><h3>Cuotas sin intereses</h3>${S.cuotas.map(c => { const p = cuotaProgress(c);
    return `<div class="cat-row"><div class="top"><span class="name">${c.emoji} ${esc(c.name)} <span class="muted small">${money(c.monthly)}/mes</span></span><span class="left"><b>${p.left}</b> <span class="muted">de ${c.n} restantes</span></span></div>
      ${bar(p.paid / c.n)}<div class="row small muted" style="margin-top:6px"><span>Falta ${money(p.leftAmount)}</span><span>${p.next ? 'Próxima: ' + fmtDate(p.next) : '¡Terminada!'} · última ${fmtDate(p.last)}</span></div>
      ${c.note ? `<div class="small warn-t" style="margin-top:4px">${esc(c.note)}</div>` : ''}</div>`; }).join('')}</div>`;
  h += `<div class="card"><h3>Estados de cuenta</h3>${all.map(s => `<button class="list-item tap" data-a="selStmt" data-v="${s.due}"><span class="em">${s.isPaid ? '✅' : s.due === (nx && nx.due) ? '👉' : '🗓️'}</span><span class="mid"><div class="t">Vence ${fmtDate(s.due)}</div><div class="s">${s.isPaid ? 'Pagado' : s.real != null ? 'Monto real' : 'Estimado'} · pagar ${fmtDate(s.payBy)}</div></span><span class="amt num">${money(s.total)}</span></button>`).join('')}</div>`;
  h += `<div class="card"><h3>Reglas</h3><div class="small stack">
    <div>💳 Cierra el <b>${S.settings.cierre}</b> de cada mes y vence el <b>${S.settings.vence}</b> del mes siguiente. Compra hasta el ${S.settings.cierre} → se paga el ${S.settings.vence} del mes siguiente; desde el ${S.settings.cierre + 1} → el del mes subsiguiente.</div>
    <div>🎯 Solo compras planificadas y en 1 cuota. Nada de cuotas nuevas antes de mayo 2027.</div>
    <div>🔁 Cada vez que uses la tarjeta, pasa ese mismo monto a Pagos ese día.</div></div></div>`;
  return h;
}

function vDeseos() {
  const b = balances(); const prog = wishProgress();
  let h = `<div class="card"><h3>Juntado para el cuarto</h3><div class="row"><div class="big-num num">${money(Math.max(0, b.deseos || 0))}</div>
    <button class="btn sm primary" data-a="newTransfer" data-to="deseos">＋ Apartar</button></div>
    <div class="muted small" style="margin-top:6px">Solo con ingresos extra ya cobrados. Se reparte primero a la Fase 1, luego a la 2 y la 3.</div></div>`;
  for (const p of prog) {
    const pct = p.need ? p.got / p.need : 1;
    h += `<div class="card"><h3>${esc(p.ph.name)} ${p.done ? '<span class="badge ok">completa</span>' : `<span class="badge ${pct >= 1 ? 'ok' : ''}">${Math.round(pct * 100)}%</span>`}</h3>
      ${p.need ? `<div class="row small"><span>${money(p.got)} de ${money(p.need)}</span><span class="muted">faltan ${money(p.need - p.got)}</span></div><div style="margin:8px 0 4px">${bar(pct, '')}</div>` : ''}
      ${p.ph.items.map(w => `<div class="list-item"><span class="em">${w.bought ? '✅' : '🛍️'}</span><span class="mid tap" data-a="editWish" data-v="${w.id}"><div class="t" style="${w.bought ? 'text-decoration:line-through;color:var(--muted)' : ''}">${esc(w.name)}</div><div class="s">${w.bought ? 'Comprado' : 'máx. ' + money(w.max)}</div></span>
        ${w.bought ? '' : `<button class="btn sm" data-a="buyWish" data-v="${w.id}">Comprar</button>`}</div>`).join('')}
      <button class="btn sm" style="margin-top:8px" data-a="newWish" data-v="${p.ph.id}">＋ Agregar a esta fase</button></div>`;
  }
  return h;
}

function vMensual() {
  let h = `<div class="muted small" style="margin:0 4px 12px">Ingresos seguros − cuotas de tarjeta − topes del mes (vida diaria, gasolina, fútbol, entretenimiento…) = lo libre. Abajo, con IAL y Andrés si llegan. Cambia los topes en Ajustes y esto se recalcula.</div>`;
  for (let m = 1; m <= 6; m++) {
    const k = `2027-${pad(m)}`;
    const seg = S.incomes.filter(i => i.type === 'seguro' && i.date.startsWith(k));
    const prob = S.incomes.filter(i => i.type === 'probable' && i.date.startsWith(k));
    const segT = sum(seg.map(i => i.amount)), probT = sum(prob.map(i => i.amount));
    const cuotas = sum(S.cuotas.map(c => { let s = 0; for (let i = 0; i < c.n; i++) if (addMonths(c.first, i).startsWith(k)) s += num(c.monthly); return s; }));
    const per = S.periods.filter(p => p.start.startsWith(k));
    const vida = sum(per.map(p => sum(Object.values(p.budgets))));
    if (!segT && !cuotas) continue;
    const libre = r2(segT - cuotas - vida);
    h += `<div class="card"><h3>${MESL[m - 1]} 2027 ${libre >= 0 ? `<span class="badge ok">libre ${money(libre)}</span>` : `<span class="badge over">${money(libre)}</span>`}</h3>
      <table class="mini"><tr><td>Ingresos seguros</td><td class="pos">${money(segT)}</td></tr><tr><td>Cuotas tarjeta (vencen este mes)</td><td class="neg">−${money(cuotas)}</td></tr>
      ${(() => { const bc = {}; per.forEach(p => Object.entries(p.budgets).forEach(([c, v]) => { bc[c] = r2((bc[c] || 0) + num(v)); }));
        const vg = r2(num(bc.vida) + num(bc.gasolina)); delete bc.vida; delete bc.gasolina;
        return `<tr><td>Vida diaria y gasolina</td><td class="neg">−${money(vg)}</td></tr>` +
          Object.entries(bc).filter(([, v]) => v).map(([c, v]) => `<tr><td>${cat(c).emoji} ${esc(c === 'deporte' ? 'Fútbol (paquete 10 clases)' : cat(c).name)}</td><td class="neg">−${money(v)}</td></tr>`).join(''); })()}
      <tr class="tot"><td>Libre solo con sueldo</td><td class="${libre < 0 ? 'neg' : ''}">${money(libre)}</td></tr>
      <tr><td class="muted">Con IAL y Andrés (${money(probT)})</td><td class="muted">${money(libre + probT)}</td></tr></table></div>`;
  }
  return h;
}

function vAjustes() {
  const s = S.settings;
  const n = (path, val, step = '0.01') => `<input type="number" inputmode="decimal" step="${step}" data-bind="${path}" value="${val}">`;
  let h = `<div class="card"><h3>Apariencia</h3><div class="seg"><button class="${s.theme === 'dark' ? 'on' : ''}" data-a="theme" data-v="dark">🌙 Oscuro</button><button class="${s.theme === 'light' ? 'on' : ''}" data-a="theme" data-v="light">☀️ Claro</button></div></div>`;
  h += `<div class="card"><h3>Respaldo</h3><div class="muted small">Último: ${S.lastBackup ? fmtDate(S.lastBackup) : 'nunca'}. Guárdalo en Archivos / iCloud Drive.</div>
    <div class="btns"><button class="btn primary" data-a="export">⬆️ Exportar JSON</button><button class="btn" data-a="import">⬇️ Importar</button></div></div>`;
  h += `<div class="card"><h3>Tarjeta y reglas</h3><div class="grid2">
    <label class="field"><span>Tipo de cambio (S/ por US$)</span>${n('settings.fx', s.fx, '0.001')}</label>
    <label class="field"><span>Bolsillo Cusco desde probables</span>${n('settings.cuscoCap', s.cuscoCap)}</label>
    <label class="field"><span>Día de cierre</span>${n('settings.cierre', s.cierre, '1')}</label>
    <label class="field"><span>Día de vencimiento</span>${n('settings.vence', s.vence, '1')}</label>
    <label class="field"><span>Ahorro mínimo</span>${n('settings.ahorroMin', s.ahorroMin)}</label>
    <label class="field"><span>Ahorro posible</span>${n('settings.ahorroMax', s.ahorroMax)}</label></div></div>`;
  h += `<div class="card"><h3>Saldo inicial de cada cuenta (15 nov)</h3><div class="grid2">${S.accounts.map(a => `<label class="field"><span>${a.emoji} ${esc(a.name)}</span>${n('openings.' + a.id, S.openings[a.id] || 0)}</label>`).join('')}</div></div>`;
  h += `<div class="card"><h3>Cuotas</h3>${S.cuotas.map((c, i) => `<div class="label">${c.emoji} ${esc(c.name)}</div><div class="grid2">
    <label class="field"><span>Monto mensual</span>${n(`cuotas.${i}.monthly`, c.monthly)}</label>
    <label class="field"><span>N.º de cuotas</span>${n(`cuotas.${i}.n`, c.n, '1')}</label>
    <label class="field"><span>Primer pago</span><input type="date" data-bind="cuotas.${i}.first" data-t="text" value="${c.first}"></label>
    <label class="field"><span>Nota</span><input data-bind="cuotas.${i}.note" data-t="text" value="${esc(c.note)}"></label></div>`).join('')}
    ${S.subs.map((x, i) => `<div class="label">☁️ ${esc(x.name)}</div><label class="field"><span>US$ por mes</span>${n(`subs.${i}.usd`, x.usd)}</label>`).join('')}</div>`;
  h += `<div class="card"><h3>Presupuestos por periodo</h3>${S.periods.map((p, i) => `<div class="label">${esc(p.label)} · ${fmtDate(p.start)}–${fmtDate(p.end)}</div>
    <div class="grid2">${Object.keys(p.budgets).map(c => `<label class="field"><span>${cat(c).emoji} ${esc(cat(c).name)} <button data-a="rmBudget" data-p="${i}" data-v="${c}" class="neg">✕</button></span>${n(`periods.${i}.budgets.${c}`, p.budgets[c])}</label>`).join('')}</div>
    <select data-a="addBudget" data-p="${i}" style="margin-top:10px"><option value="">＋ Agregar categoría a este periodo…</option>${S.categories.filter(c => !c.hidden && p.budgets[c.id] == null).map(c => `<option value="${c.id}">${c.emoji} ${esc(c.name)}</option>`).join('')}</select>`).join('<div class="sep"></div>')}</div>`;
  const cp = S.periods[Math.max(0, periodIndexFor(today()))];
  h += `<div class="card"><h3>Categorías <span class="badge">${S.categories.filter(c => !c.system).length}</span></h3>
    <div class="muted small" style="margin-bottom:6px">Toca una para renombrarla, cambiar su tope mensual o eliminarla. Tope mostrado: ${esc(cp ? cp.label : '')}.</div>
    ${S.categories.filter(c => !c.system).map(c => { const g = S.movs.filter(m => m.type === 'gasto' && m.cat === c.id).length;
      return `<button class="list-item tap" data-a="editCat" data-v="${c.id}"><span class="em">${c.emoji}</span><span class="mid"><div class="t">${esc(c.name)}</div><div class="s">${g} gasto${g !== 1 ? 's' : ''}${c.rule ? ' · ' + esc(c.rule) : ''}</div></span>
        <span class="amt num">${cp && cp.budgets[c.id] != null ? money(cp.budgets[c.id]) : '<span class="muted small">sin tope</span>'}</span></button>`; }).join('')}
    <button class="btn" style="margin-top:12px" data-a="newCat">＋ Nueva categoría</button></div>`;
  h += `<div class="card"><h3>Zona de peligro</h3><button class="btn danger" data-a="reset">Borrar todo y volver a los datos iniciales</button></div>`;
  h += `<div class="card" style="text-align:center"><div class="muted small">Mis Finanzas</div><div class="big-num">Versión ${APP_VERSION}</div>
    <div class="muted tiny">Datos: formato ${S.version} · ${S.movs.length} movimientos guardados en este equipo</div>
    <button class="btn sm" data-a="checkUpdate" style="margin:12px auto 0">🔄 Buscar actualización</button></div>`;
  return h;
}

/* =================== CONSEJOS (gratis, sin internet) =================== */
const OFFICE_DAYS = [1, 3, 5]; // lunes, miércoles, viernes
const DAILY_TIPS = [
  'Antes de una compra que no está en el plan, espera 48 horas. Si aún la quieres, búscale espacio en el presupuesto.',
  'Lleva comida a la oficina: la compra semanal de S/48 rinde mucho más que comer fuera.',
  'Anota cada gasto al momento: son 3 toques y evitan sorpresas a fin de mes.',
  'Las cuotas "sin intereses" igual comprometen tu sueldo de los próximos meses. Nada nuevo antes de mayo 2027.',
  'Si un ingreso probable no llega, no pasa nada: tu plan solo cuenta con los seguros.',
  'Paga siempre el total del estado de cuenta, nunca el mínimo: así la tarjeta te sale gratis.',
  'Lo que sobra en una categoría al cerrar el periodo, pásalo a Ahorro antes de que se diluya.',
  'Compra con tarjeta solo hasta el 11 si quieres más tiempo para pagarla: desde el 12 se va al mes subsiguiente.',
  'El ahorro no se toca: si algo se descuadra, ajusta primero imprevistos y gustos.',
  'Revisa tus suscripciones cada mes: Google One está bien, pero que no se sumen otras sin darte cuenta.',
];
let lastTips = [];

function fromDiaCats() { // categorías que NO salen de Día a día (tarjeta planificada o cuentas propias)
  const s = new Set(['cusco', 'deseos']);
  S.checklist.forEach(c => { if (c.action && c.action.type === 'gasto' && c.action.method === 'tarjeta') s.add(c.action.cat); });
  return s;
}
/* ¿Alcanza? — ¿cubre lo que tienes todo lo que ya está comprometido? (sin tocar el ahorro) */
function alcanza() {
  const t = today(), b = balances(); const lines = [];
  const st = nextStatement(); let gap = 0, future = 0;
  if (st) {
    const src = st.due === '2026-12-05' && num(b.pagos) < st.pending ? 'dia' : 'pagos';
    if (src === 'pagos') {
      future = sum(S.incomes.filter(i => i.type === 'seguro' && !i.received && i.date <= st.payBy).map(i => num((i.suggest || {}).pagos)));
      gap = Math.max(0, r2(st.pending - num(b.pagos) - future));
    }
  }
  const pi = periodIndexFor(t); const p = pi >= 0 ? S.periods[pi] : null;
  const libre = r2(num(b.dia) - committedDia(p && t >= p.start && t <= p.end ? p : null));
  // Lo que sobra en Día a día cubre primero lo que le falte a Pagos (el ahorro no se toca)
  const cubre = Math.min(gap, Math.max(0, libre));
  const falta = r2(Math.max(0, gap - cubre) + Math.max(0, -libre));
  if (st && gap > 0.5) lines.push(cubre >= gap - 0.01
    ? `Tarjeta (${fmtDate(st.payBy)}): pasa ${money(gap)} de Día a día a Pagos y queda cubierta`
    : `Tarjeta (${fmtDate(st.payBy)}): faltan ${money(gap - cubre)} en Pagos`);
  else if (st) lines.push(`Tarjeta (${fmtDate(st.payBy)}): cubierta${future > 0 ? ' con los sueldos que vienen' : ''}`);
  const sobra = r2(libre - cubre);
  lines.push(libre < -0.5 ? `Día a día: faltan ${money(-libre)} para lo presupuestado${st && st.due === '2026-12-05' ? ' + el pago de tarjeta' : ''}`
    : `Día a día: te sobran ${money(sobra)} después de lo presupuestado`);
  return { falta, lines };
}

function committedDia(p) {
  const ex = fromDiaCats();
  const budgets = p ? sum(Object.keys(p.budgets).filter(c => !ex.has(c)).map(c => Math.max(0, catStatus(p.id, c).left))) : 0;
  // Si el próximo pago de tarjeta sale de Día a día (porque Pagos aún no alcanza), también está comprometido
  const st = nextStatement(); const b = balances();
  const card = st && st.due === '2026-12-05' && num(b.pagos) < st.pending ? st.pending : 0;
  return r2(budgets + card);
}

function tips() {
  const t = today(), b = balances(), out = [];
  const hidden = S.tipsHidden || {};
  const add = o => { if (!hidden[o.id]) out.push(o); };
  const pi = periodIndexFor(t); const p = pi >= 0 ? S.periods[pi] : null;
  const inP = p && t >= p.start && t <= p.end;
  const ex = fromDiaCats();

  // Ritmo por categoría
  if (inP) {
    const daysLeft = daysBetween(t, p.end) + 1, total = daysBetween(p.start, p.end) + 1, elapsed = (total - daysLeft + 1) / total;
    const cats = Object.keys(p.budgets).map(c => Object.assign({ c }, catStatus(p.id, c)));
    const spare = cats.filter(x => !ex.has(x.c) && x.left > 0).sort((a, b2) => b2.left - a.left);
    cats.forEach(x => {
      const n = cat(x.c).name;
      if (x.budget > 0 && x.pct > 1) {
        const donor = spare.find(s => s.c !== x.c && s.left >= -x.left);
        add({ id: `over-${p.id}-${x.c}-${Math.round(x.spent)}`, prio: 1, kind: 'bad', ic: '🔴', title: `Te pasaste en ${n} por ${money(-x.left)}`,
          text: donor ? `Compénsalo usando ${money(-x.left)} de ${cat(donor.c).name} (ahí te quedan ${money(donor.left)}). Así no tocas el ahorro.` : 'No toques el ahorro: recorta en otras categorías lo que queda del periodo.' });
      } else if (x.budget > 0 && !ex.has(x.c) && x.pct >= 0.8 && daysLeft > 1) {
        add({ id: `p80-${p.id}-${x.c}-${r2(x.spent)}`, prio: 2, kind: 'warn', ic: '🟡', title: `${n}: ya usaste ${Math.round(x.pct * 100)}%`,
          text: `Te quedan ${money(x.left)} para ${daysLeft} días: unos ${money(x.left / daysLeft)} por día.` });
      } else if (x.budget > 0 && !ex.has(x.c) && x.spent > 0 && x.pct > elapsed + 0.25) {
        add({ id: `fast-${p.id}-${x.c}-${r2(x.spent)}`, prio: 3, kind: 'warn', ic: '🏃', title: `Vas rápido en ${n}`,
          text: `Gastaste ${Math.round(x.pct * 100)}% y solo pasó ${Math.round(elapsed * 100)}% del periodo. Para llegar bien: máx. ${money(x.left / daysLeft)} por día.` });
      }
    });
    if (p.budgets.pasajes != null && OFFICE_DAYS.includes(pd(t).getDay()) && !S.movs.some(m => m.type === 'gasto' && m.cat === 'pasajes' && m.date === t))
      add({ id: `pasaje-${t}`, prio: 4, kind: 'info', ic: '🚌', title: 'Hoy es día de oficina', text: '¿Registras tu pasaje de S/15 de una vez?', btn: 'Registrar S/15',
        run: () => sheetGasto({ preset: { amount: 15, cat: 'pasajes', method: 'efectivo', note: 'Pasaje oficina' } }) });
  }

  // Lo que sobró del periodo anterior
  if (pi > 0 && inP) {
    const prev = S.periods[pi - 1];
    if (daysBetween(prev.end, t) <= 10) {
      const left = sum(Object.keys(prev.budgets).filter(c => !ex.has(c)).map(c => Math.max(0, catStatus(prev.id, c).left)));
      if (left >= 20) add({ id: `spare-${prev.id}`, prio: 3, kind: 'ok', ic: '🎉', title: `Te sobraron ${money(left)} en ${prev.label}`,
        text: 'Buen trabajo. Pásalos a Ahorro antes de que se pierdan en el día a día.', btn: 'Pasar a Ahorro', run: () => sheetTransfer({ amount: left, from: 'dia', to: 'ahorro' }) });
    }
  }

  // Cierre de la tarjeta
  const cierre = S.settings.cierre; const d = pd(t);
  const close = ymd(new Date(d.getFullYear(), d.getMonth() + (d.getDate() > cierre ? 1 : 0), cierre));
  const dc = daysBetween(t, close);
  if (dc <= 4) {
    const before = S.checklist.filter(c => !c.done && c.action && c.action.type === 'gasto' && c.action.method === 'tarjeta' && c.date <= close);
    add({ id: `cierre-${close}`, prio: before.length ? 1 : 4, kind: before.length ? 'warn' : 'info', ic: '📅',
      title: dc === 0 ? 'Hoy cierra tu tarjeta' : `Faltan ${dc} día${dc > 1 ? 's' : ''} para el cierre (${fmtDate(close)})`,
      text: `Compras con tarjeta hasta el ${fmtDate(close)} se pagan el ${fmtDate(dueFor(close))}; desde el ${fmtDate(addDays(close, 1))}, el ${fmtDate(dueFor(addDays(close, 1)))}.` +
        (before.length ? ` Pendiente antes del cierre: ${before.map(c => c.action.note || c.text).join(', ')}.` : '') });
  }

  // Pago de la tarjeta y cobertura de Pagos
  const st = nextStatement();
  if (st) {
    const dl = daysBetween(t, st.payBy);
    const src = st.due === '2026-12-05' && num(b.pagos) < st.pending ? 'dia' : 'pagos';
    const future = src === 'pagos' ? sum(S.incomes.filter(i => i.type === 'seguro' && !i.received && i.date <= st.payBy).map(i => num((i.suggest || {}).pagos))) : 0;
    const gap = r2(st.pending - num(b[src]) - future);
    if (dl <= 3) add({ id: `pay-${st.due}-${st.pending}-${dl < 0 ? 'late' : dl === 0 ? 'today' : 'soon'}`, prio: 0, kind: dl < 0 ? 'bad' : 'warn', ic: '💳',
      title: dl < 0 ? 'Pago de tarjeta atrasado' : dl === 0 ? 'Hoy toca pagar la tarjeta' : `Paga la tarjeta en ${dl} día${dl > 1 ? 's' : ''}`,
      text: `${money(st.pending)} del estado que vence el ${fmtDate(st.due)}. Págalo completo para no pagar intereses.`, btn: 'Registrar pago', run: () => sheetPago({ due: st.due, from: src }) });
    if (gap > 1) add({ id: `gap-${st.due}-${Math.round(gap)}`, prio: 1, kind: 'bad', ic: '⚠️', title: `A ${acc(src).name} le faltarán ${money(gap)}`,
      text: `Aun contando los ingresos seguros que vienen, no alcanza para el pago del ${fmtDate(st.payBy)}. Por tu regla, la diferencia sale de lo que ibas a ahorrar, no del día a día.` });
  }

  // Compras con tarjeta sin pasar a Pagos
  const unb = S.movs.filter(m => m.type === 'gasto' && m.method === 'tarjeta' && m.backed === false);
  if (unb.length) {
    const tot = sum(unb.map(m => m.amount));
    add({ id: `unb-${unb.map(m => m.id).join('')}`, prio: 1, kind: 'warn', ic: '🔁', title: `Pasa ${money(tot)} a Pagos`,
      text: `Usaste la tarjeta (${unb.map(m => m.note || cat(m.cat).name).join(', ')}) y aún no pasaste ese monto a Pagos. Tu regla: el mismo día.`,
      btn: 'Pasar ahora', run: () => sheetTransfer({ amount: tot, from: 'dia', to: 'pagos', note: 'Respaldo de compras con tarjeta', onSaved: () => unb.forEach(m => m.backed = true) }) });
  }

  // Ingresos
  S.incomes.filter(i => i.type === 'seguro' && !i.received && i.date <= t && daysBetween(i.date, t) <= 5).forEach(i =>
    add({ id: `seg-${i.id}`, prio: 2, kind: 'ok', ic: '💰', title: `Debería haber llegado: ${i.name}`,
      text: `${money(i.amount)}. Cuando lo veas en tu cuenta, márcalo y la app te dice cómo repartirlo.`, btn: 'Marcar recibido', run: () => sheetIngreso(i, null) }));
  S.incomes.filter(i => i.type === 'probable' && !i.received && daysBetween(i.date, t) >= 3 && daysBetween(i.date, t) <= 60).forEach(i =>
    add({ id: `late-${i.id}`, prio: 4, kind: 'info', ic: '📲', title: `¿Llegó lo de ${i.name}?`,
      text: `Lo esperabas el ${fmtDate(i.date)} (${money(i.amount)}). Si ya llegó, márcalo; si no, recuérdale con amabilidad. Mientras tanto, no cuentes con ese dinero.`, btn: 'Ya llegó', run: () => sheetIngreso(i, null) }));

  // Ahorro mínimo
  if (t >= '2026-12-15' && t <= '2027-01-31' && num(b.ahorro) < S.settings.ahorroMin)
    add({ id: `ahorro-${num(b.ahorro)}`, prio: 1, kind: 'warn', ic: '🔒', title: 'Aún falta separar el ahorro mínimo',
      text: `Llevas ${money(b.ahorro)} de ${money(S.settings.ahorroMin)}. Sepáralo apenas llegue la grati, antes de gastar.` });

  // Preparar la semana sin efectivo
  const toAlert = daysBetween(t, S.settings.alertFrom);
  if (toAlert >= 1 && toAlert <= 8)
    add({ id: `prep-${num(b.cusco)}`, prio: 2, kind: 'warn', ic: '🎒', title: `En ${toAlert} días empieza la semana sin efectivo`,
      text: `Deja comprado lo del viaje y separado el bolsillo de Cusco (llevas ${money(b.cusco || 0)} de S/900). Del 28 al 31 dic solo lo indispensable.` });

  // Deseos
  wishProgress().forEach(w => { if (!w.done && w.need > 0 && w.got >= w.need)
    add({ id: `wish-${w.ph.id}`, prio: 3, kind: 'ok', ic: '🛋️', title: `¡Ya juntaste para ${w.ph.name}!`,
      text: 'Puedes comprar sin tocar el ahorro. Compara precios y no pases el tope.', btn: 'Ver mi cuarto', run: () => go('deseos') }); });

  // Constancia
  const lastG = S.movs.filter(m => m.type === 'gasto').map(m => m.date).sort().pop();
  if (!lastG || daysBetween(lastG, t) >= 2)
    add({ id: `reg-${lastG || 'none'}`, prio: 5, kind: 'info', ic: '✍️', title: '¿Registraste tus gastos?',
      text: lastG ? `Tu último gasto registrado fue el ${fmtDate(lastG)}. Anotar al momento toma 3 toques.` : 'Empieza registrando tu primer gasto con el botón ＋.', btn: 'Registrar gasto', run: () => sheetGasto() });

  // Antes eran alertas fijas en Inicio; ahora son consejos descartables
  if (t >= S.settings.alertFrom && t <= S.settings.alertTo)
    add({ id: 'nocash', prio: 0, kind: 'bad', ic: '🚨', title: 'Semana sin efectivo',
      text: 'Del 28 al 31 dic casi no hay efectivo: pagas la tarjeta el 28, viajas el 29 y el sueldo llega ~31. Gasta solo lo indispensable.' });
  const lateSteps = S.checklist.filter(c => !c.done && c.date < t);
  if (lateSteps.length) add({ id: `late-steps-${lateSteps.map(c => c.id).join('.')}`, prio: 2, kind: 'warn', ic: '📌',
    title: `${lateSteps.length} paso${lateSteps.length > 1 ? 's' : ''} pendiente${lateSteps.length > 1 ? 's' : ''} del plan`,
    text: lateSteps.slice(0, 3).map(c => c.text).join(' · ') + (lateSteps.length > 3 ? ' y más…' : ''), btn: 'Ver plan', run: () => go('plan') });
  if (S.movs.length >= 5 && (!S.lastBackup || daysBetween(S.lastBackup, t) >= 7))
    add({ id: `backup-${S.lastBackup || 'never'}`, prio: 6, kind: 'info', ic: '💾', title: 'Haz un respaldo',
      text: `${S.lastBackup ? 'Tu último respaldo fue el ' + fmtDate(S.lastBackup) : 'Aún no tienes respaldo'}. Guárdalo en Archivos / iCloud Drive.`, btn: 'Exportar ahora', run: () => exportJSON() });

  // Clases de fútbol
  if (S.clases && S.clases.log.length) {
    const q = clasesQuedan();
    if (q <= 2) add({ id: `clases-${S.clases.log.length}-${q}`, prio: 2, kind: 'warn', ic: '⚽',
      title: q === 0 ? 'Terminaste tu paquete de fútbol' : `Te quedan ${q} clase${q > 1 ? 's' : ''} de fútbol`,
      text: 'Renueva el paquete solo si ya cobraste ingresos extra este mes (IAL, Andrés…). Si no llegan, ese mes no se renueva.',
      btn: 'Ver ingresos', run: () => go('ingresos') });
  }

  // Consejo del día
  add({ id: `day-${t}`, prio: 9, kind: 'info', ic: '💡', title: 'Consejo del día', text: DAILY_TIPS[daysBetween('2026-01-01', t) % DAILY_TIPS.length] });

  out.sort((a, b2) => a.prio - b2.prio);
  lastTips = out;
  return out;
}

function tipCard(x) {
  return `<div class="tip ${x.kind}"><span class="ic">${x.ic}</span><div class="body"><b>${esc(x.title)}</b><div class="small">${esc(x.text)}</div>
    ${x.run ? `<button class="btn sm" data-a="tipRun" data-v="${esc(x.id)}" style="margin-top:10px">${esc(x.btn)}</button>` : ''}</div>
    <button class="x" data-a="tipHide" data-v="${esc(x.id)}" aria-label="Ocultar consejo">✕</button></div>`;
}

/* ¿Me alcanza? */
function canSpend(amount, catId, method) {
  const t = today(), b = balances(); const lines = []; let v = 0; // 0 ok, 1 cuidado, 2 mejor no
  const worse = n => { v = Math.max(v, n); };
  const pid = periodFor(t, catId); const p = S.periods.find(x => x.id === pid);
  const st = catStatus(pid, catId); const name = cat(catId).name;
  const fromAcc = catId === 'cusco' && t >= '2026-12-29' ? 'cusco' : catId === 'deseos' ? 'deseos' : 'dia';
  let needsCash = true;

  if (method === 'tarjeta') {
    const planned = S.checklist.some(c => !c.done && c.action && c.action.type === 'gasto' && c.action.method === 'tarjeta' && c.action.cat === catId);
    lines.push(`💳 Caería en el pago del ${fmtDate(dueFor(t))}${(S.statements[dueFor(t)] || {}).payBy ? ` (lo pagas el ${fmtDate(S.statements[dueFor(t)].payBy)})` : ''}.`);
    if (planned) { needsCash = false; lines.push('Está en tu plan y ya está cubierta por lo que entra a Pagos.'); }
    else { worse(2); lines.push('Tu regla: la tarjeta es solo para compras planificadas, en 1 cuota. Si igual la usas, pasa hoy el mismo monto de Día a día a Pagos.'); }
  }

  if (st.budget > 0) {
    const after = r2(st.left - amount);
    if (after >= 0) lines.push(`En ${name} te quedarían ${money(after)} de ${money(st.budget)}.`);
    else {
      const ex = fromDiaCats();
      const donor = Object.keys(p.budgets).filter(c => c !== catId && !ex.has(c)).map(c => Object.assign({ c }, catStatus(pid, c))).filter(x => x.left >= -after).sort((a, b2) => b2.left - a.left)[0];
      if (donor) { worse(1); lines.push(`Te pasas por ${money(-after)} en ${name}. Podrías cubrirlo con ${cat(donor.c).name} (ahí quedan ${money(donor.left)}).`); }
      else { worse(2); lines.push(`Te pasas por ${money(-after)} en ${name} y ninguna otra categoría tiene espacio.`); }
    }
  } else if (catId !== 'deseos') { worse(1); lines.push(`${name} no tiene presupuesto en este periodo: sería un gasto fuera del plan.`); }

  if (needsCash) {
    const bal = num(b[fromAcc]);
    if (amount > bal) { worse(2); lines.push(`No te alcanza: en ${acc(fromAcc).name} tienes ${money(bal)}.`); }
    else if (fromAcc === 'dia') {
      const libreNow = r2(bal - committedDia(p));
      const excess = Math.max(0, amount - Math.max(0, st.left));
      const libreAfter = r2(libreNow - (fromDiaCats().has(catId) ? amount : excess));
      if (libreAfter < 0) { worse(libreAfter < -50 ? 2 : 1); lines.push(`Después te faltarían ${money(-libreAfter)} para cubrir lo que ya tienes presupuestado este periodo.`); }
      else lines.push(`Libre real en Día a día después de esto: ${money(libreAfter)} (saldo menos lo ya presupuestado y pagos pendientes).`);
    } else if (fromAcc === 'deseos') lines.push(`Sale de Deseos: tienes ${money(bal)} juntados.`);
  }

  if (t >= addDays(S.settings.alertFrom, -7) && t <= S.settings.alertTo) { worse(1); lines.push('Ojo: se acerca (o estás en) la semana sin efectivo del 28 al 31 dic.'); }
  lines.push('🔒 Tu ahorro no se toca para esto.');
  return { v, title: ['✅ Sí, puedes', '🟡 Sí, pero con cuidado', '🔴 Mejor no por ahora'][v], lines };
}

function vConsejos() {
  const t = today(); const pi = periodIndexFor(t); const pc = pi >= 0 ? Object.keys(S.periods[pi].budgets) : [];
  const order = [...pc.filter(id => !cat(id).hidden), ...visibleCats().filter(id => !pc.includes(id))];
  const q = ui.ask || { amount: '', cat: pc[0] || 'otros', method: 'debito' };
  let h = `<div class="card"><h3>¿Me alcanza?</h3>
    <div class="muted small" style="margin-bottom:10px">Escribe cuánto quieres gastar y en qué. La app lo revisa contra tu presupuesto, tus cuentas y tus reglas.</div>
    <div class="grid2"><input id="ask-amt" inputmode="decimal" placeholder="S/ monto" value="${esc(q.amount)}" style="font-size:22px;font-weight:700">
    <select id="ask-cat">${order.map(id => `<option value="${id}" ${q.cat === id ? 'selected' : ''}>${cat(id).emoji} ${esc(cat(id).name)}</option>`).join('')}</select></div>
    <div class="seg" style="margin-top:10px">${[['efectivo', '💵 Efectivo'], ['debito', '🏦 Débito'], ['tarjeta', '💳 Tarjeta']].map(([k, l]) => `<button class="${q.method === k ? 'on' : ''}" data-a="askMethod" data-v="${k}">${l}</button>`).join('')}</div>
    <button class="btn primary big" data-a="ask" style="margin-top:12px">Consultar</button>`;
  if (q.res) {
    h += `<div class="tip ${['ok', 'warn', 'bad'][q.res.v]}" style="margin-top:14px"><div class="body"><b style="font-size:18px">${q.res.title}</b>
      ${q.res.lines.map(l => `<div class="small" style="margin-top:6px">${esc(l)}</div>`).join('')}
      <button class="btn sm" data-a="askRegister" style="margin-top:12px">Registrar este gasto</button></div></div>`;
  }
  h += `</div>`;
  const list = tips();
  h += `<div class="card"><h3>Consejos para ti <span class="badge">${list.length}</span></h3>${list.map(tipCard).join('') || '<div class="muted">Todo en orden por ahora. 👌</div>'}
    ${Object.keys(S.tipsHidden || {}).length ? `<button class="btn sm" data-a="tipsReset" style="margin-top:10px">Mostrar consejos ocultos</button>` : ''}</div>`;
  return h;
}

/* =================== HOJAS (formularios) =================== */
function openSheet(html, mount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="backdrop" data-a="closeSheet"></div><div class="sheet" role="dialog"><div class="grab"></div>${html}</div>`;
  root.classList.add('open');
  const sh = root.querySelector('.sheet');
  requestAnimationFrame(() => requestAnimationFrame(() => sh.classList.add('in')));
  if (mount) mount(sh);
}
function closeSheet() {
  const root = $('#sheet-root'); const sh = root.querySelector('.sheet');
  if (!sh) return;
  sh.classList.remove('in'); root.classList.remove('open');
  setTimeout(() => { if (!root.classList.contains('open')) root.innerHTML = ''; }, 300);
}
const head = t => `<div class="sh-head"><h2>${t}</h2><button class="icon-btn" data-a="closeSheet" aria-label="Cerrar">✕</button></div>`;
const accChips = (sel, key, only) => `<div class="chips">${S.accounts.filter(a => !only || only.includes(a.id)).map(a => `<button class="chip ${sel === a.id ? 'on' : ''}" data-s="${key}" data-v="${a.id}">${a.emoji} ${esc(a.name)}</button>`).join('')}</div>`;

function sheetGasto(o = {}) {
  const m = o.mov; const pr = o.preset || {};
  const g = m ? Object.assign({}, m, { amount: String(m.amount) }) :
    { amount: pr.amount != null ? String(pr.amount) : '', cat: pr.cat || null, method: pr.method || 'debito', account: pr.account || 'dia', date: pr.date || today(), note: pr.note || '' };
  if (!g.account) g.account = 'dia';
  // Compra planificada: '' = no planificada, '__plan' = planificada sin vincular, o el id del ítem del plan
  g.plan = m ? (m.planId || (m.planned ? '__plan' : '')) : (pr.planId || (pr.planned ? '__plan' : ''));
  g.planTouched = !!(m || pr.planId || pr.planned);
  openSheet(`${head(m ? 'Editar gasto' : 'Nuevo gasto')}
    <div class="amount-display num" id="g-amt"></div>
    <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(k => `<button data-s="key" data-k="${k}">${k}</button>`).join('')}</div>
    <div class="label">Categoría</div><div class="chips" id="g-cats"></div>
    <div class="label">Medio de pago</div><div class="seg" id="g-method">${Object.entries({ efectivo: '💵 Efectivo', debito: '🏦 Débito', tarjeta: '💳 Tarjeta' }).map(([k, v]) => `<button data-s="method" data-v="${k}">${v}</button>`).join('')}</div>
    <div id="g-accw"><div class="label">Sale de</div><div id="g-acc"></div></div>
    <div id="g-card"></div>
    <div id="g-warn"></div>
    <div class="grid2"><label class="field"><span>Fecha</span><input type="date" id="g-date" value="${g.date}"></label>
    <label class="field"><span>Nota (opcional)</span><input id="g-note" value="${esc(g.note)}" placeholder="Ej. menú"></label></div>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar gasto</button>
    ${m ? '<button class="btn danger" data-s="del" style="margin-top:8px">Borrar gasto</button>' : ''}`, sh => {
    const upd = () => {
      const a = sh.querySelector('#g-amt');
      a.innerHTML = `<span class="cur">S/</span>${g.amount || '0'}`; a.classList.toggle('empty-amt', !g.amount);
      const pi = periodIndexFor(g.date); const pc = pi >= 0 ? Object.keys(S.periods[pi].budgets) : [];
      const order = [...pc.filter(id => !cat(id).hidden), ...visibleCats().filter(id => !pc.includes(id))];
      const vis = g.allCats ? order : order.filter(id => pc.includes(id) || id === g.cat);
      sh.querySelector('#g-cats').innerHTML = vis.map(id => { const c = cat(id); return `<button class="chip ${g.cat === id ? 'on' : ''} ${pc.includes(id) ? '' : 'dim'}" data-s="cat" data-v="${id}">${c.emoji} ${esc(c.name)}</button>`; }).join('') +
        (g.allCats ? '' : `<button class="chip dim" data-s="moreCats">＋ Más</button>`);
      sh.querySelectorAll('#g-method button').forEach(b => b.classList.toggle('on', b.dataset.v === g.method));
      sh.querySelector('#g-accw').style.display = g.method === 'tarjeta' ? 'none' : '';
      sh.querySelector('#g-acc').innerHTML = accChips(g.account, 'acc');
      const cd = sh.querySelector('#g-card');
      if (g.method === 'tarjeta') {
        const due = dueFor(g.date); const st = S.statements[due] || {};
        const items = cardPlanItems().map(c => ({ c, s: planStatus(c) })).filter(x => x.s.pending > 0 || x.c.id === g.plan);
        if (!g.planTouched && g.cat) { const hit = items.find(x => x.c.action.cat === g.cat && x.s.pending > 0); g.plan = hit ? hit.c.id : ''; }
        const sel = items.find(x => x.c.id === g.plan);
        cd.innerHTML = `<div class="info-card card-due">💳 Cae en el estado que vence el <b>${fmtDate(due)}</b>${st.payBy ? ` (lo pagas el ${fmtDate(st.payBy)})` : ''}.<br><span class="muted small">Cierre el ${S.settings.cierre}: compra hasta el ${S.settings.cierre} → vence el ${S.settings.vence} del mes siguiente.</span></div>
          <label class="field"><span>¿Compra planificada?</span><select id="g-plan">
            <option value="" ${g.plan === '' ? 'selected' : ''}>No, no estaba planificada</option>
            <option value="__plan" ${g.plan === '__plan' ? 'selected' : ''}>Sí, planificada (sin ítem del plan)</option>
            ${items.map(x => `<option value="${x.c.id}" ${g.plan === x.c.id ? 'selected' : ''}>Plan: ${esc(x.c.action.note || x.c.text)} — quedan ${money(x.s.pending)}</option>`).join('')}
          </select></label>
          <div class="info-card small" style="border-left:4px solid ${g.plan ? 'var(--accent)' : 'var(--warn)'}">${g.plan
            ? `✅ Planificada: no te pediremos pasar el monto a Pagos.${sel ? ` Se descuenta del estimado de "${esc(sel.c.action.note || sel.c.text)}" (${money(sel.s.est)}), no se suma aparte.` : ''}`
            : '⚠️ No planificada: tu regla es pasar hoy este mismo monto a Pagos. La tarjeta es solo para compras planificadas, en 1 cuota.'}</div>`;
      } else cd.innerHTML = '';
      const w = sh.querySelector('#g-warn');
      if (g.cat && num(g.amount) > 0) {
        const pid = periodFor(g.date, g.cat); const s = catStatus(pid, g.cat);
        const extra = m && m.cat === g.cat && periodFor(m.date, m.cat) === pid ? m.amount : 0;
        if (s.budget > 0) {
          const after = r2(s.spent - extra + num(g.amount)); const pct = after / s.budget;
          w.innerHTML = pct > 1 ? `<div class="info-card" style="border-left:4px solid var(--bad)">🔴 Con este gasto te pasas por <b>${money(after - s.budget)}</b> en ${esc(cat(g.cat).name)}.</div>` :
            pct >= .8 ? `<div class="info-card" style="border-left:4px solid var(--warn)">🟡 Llegarás al <b>${Math.round(pct * 100)}%</b> de ${esc(cat(g.cat).name)}. Te quedarían ${money(s.budget - after)}.</div>` :
            `<div class="info-card muted small">Te quedarán ${money(s.budget - after)} en ${esc(cat(g.cat).name)}.</div>`;
        } else w.innerHTML = '';
      } else w.innerHTML = '';
    };
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      const s = b.dataset.s;
      if (s === 'key') {
        const k = b.dataset.k; let v = g.amount;
        if (k === '⌫') v = v.slice(0, -1);
        else if (k === '.') { if (!v.includes('.')) v = (v || '0') + '.'; }
        else { if (v.includes('.') && v.split('.')[1].length >= 2) return; if (v === '0') v = ''; if (v.replace('.', '').length >= 7) return; v += k; }
        g.amount = v;
      } else if (s === 'cat') { g.cat = b.dataset.v; if (g.cat === 'cusco' && g.date >= '2026-12-29' && g.method !== 'tarjeta') g.account = 'cusco'; if (g.cat === 'deseos' && g.method !== 'tarjeta') g.account = 'deseos'; }
      else if (s === 'moreCats') g.allCats = true;
      else if (s === 'method') g.method = b.dataset.v;
      else if (s === 'acc') g.account = b.dataset.v;
      else if (s === 'del') { if (confirm('¿Borrar este gasto?')) { deleteMov(m.id); save(); closeSheet(); render(); toast('Gasto borrado'); } return; }
      else if (s === 'save') {
        const amt = r2(num(g.amount));
        if (!(amt > 0)) return toast('Escribe el monto', 'warn');
        if (!g.cat) return toast('Elige una categoría', 'warn');
        g.date = sh.querySelector('#g-date').value || today();
        const card = g.method === 'tarjeta';
        const mov = { id: m ? m.id : uid(), ts: m ? m.ts : Date.now(), type: 'gasto', date: g.date, amount: amt, cat: g.cat, method: g.method,
          account: card ? null : g.account, note: sh.querySelector('#g-note').value.trim(), due: card ? dueFor(g.date) : null };
        if (card) {
          mov.planned = !!g.plan;
          if (g.plan && g.plan !== '__plan') mov.planId = g.plan;
          mov.backed = mov.planned ? 'plan' : (m && m.backed === true ? true : false);
        }
        upsertMov(mov);
        [m && m.planId, mov.planId].filter(Boolean).forEach(syncPlanItem);
        if (o.onSaved) o.onSaved(mov); save(); closeSheet(); render();
        const pid = periodFor(mov.date, mov.cat); const st = catStatus(pid, mov.cat);
        if (!m && card && !mov.planned) setTimeout(() => sheetCardReminder(mov, false), 320);
        else if (!m && card) toast(`💳 Planificada · cae en el pago del ${fmtDate(mov.due)}`);
        else if (st.budget > 0 && st.pct > 1) toast(`🔴 Te pasaste en ${cat(mov.cat).name} por ${money(-st.left)}`, 'bad');
        else if (st.budget > 0 && st.pct >= .8) toast(`🟡 Ya usaste ${Math.round(st.pct * 100)}% de ${cat(mov.cat).name}`, 'warn');
        else toast('✓ Gasto guardado');
        return;
      }
      upd();
    });
    sh.querySelector('#g-date').addEventListener('change', e => { g.date = e.target.value || today(); upd(); });
    sh.addEventListener('change', e => { if (e.target.id === 'g-plan') { g.plan = e.target.value; g.planTouched = true; upd(); } });
    upd();
  });
}

function sheetCardReminder(mov, planned) {
  const st = S.statements[mov.due] || {};
  mov.backed = planned ? 'plan' : false; save();
  openSheet(`${head('💳 Compra con tarjeta')}
    <div class="info-card card-due" style="margin-top:0">Cae en el estado de cuenta que vence el <b>${fmtDate(mov.due)}</b>${st.payBy ? `, que pagas el <b>${fmtDate(st.payBy)}</b>` : ''}.</div>
    <p>Tu regla: <b>pasa hoy ${money(mov.amount)} a la cuenta Pagos</b>.</p>
    ${planned ? '<p class="muted small">Esta compra estaba en tu plan: ya está cubierta por los ingresos que van a Pagos (S/800 + S/500 + S/2,764).</p>' : '<p class="muted small">Recuerda: la tarjeta es solo para compras planificadas, en 1 cuota.</p>'}
    <div class="label">Pasar desde</div>${accChips('dia', 'from', ['dia', 'ahorro', 'cusco', 'deseos'])}
    <div class="stack" style="margin-top:16px">
    <button class="btn ${planned ? '' : 'primary'} big" data-s="move">🔁 Pasar ${money(mov.amount)} a Pagos</button>
    <button class="btn ${planned ? 'primary' : ''}" data-s="skip">${planned ? 'Ya está cubierto en el plan' : 'Ahora no'}</button></div>`, sh => {
    let from = 'dia';
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'from') { from = b.dataset.v; sh.querySelectorAll('[data-s="from"]').forEach(x => x.classList.toggle('on', x.dataset.v === from)); }
      if (b.dataset.s === 'move') { mov.backed = true; upsertMov({ id: uid(), ts: Date.now(), type: 'transfer', date: mov.date, amount: mov.amount, from, to: 'pagos', note: `Respaldo de compra con tarjeta: ${mov.note || cat(mov.cat).name}` }); save(); closeSheet(); render(); toast('✓ Pasado a Pagos'); }
      if (b.dataset.s === 'skip') closeSheet();
    });
  });
}

function sheetTransfer(o = {}) {
  const m = o.mov; const t = m ? Object.assign({}, m) : { amount: o.amount || '', from: o.from || 'dia', to: o.to || 'pagos', date: today(), note: o.note || '' };
  if (t.from === t.to) t.from = t.to === 'dia' ? 'ahorro' : 'dia';
  openSheet(`${head(m ? 'Editar transferencia' : 'Mover dinero')}
    <label class="field"><span>Monto</span><input id="t-amt" inputmode="decimal" placeholder="0.00" value="${t.amount}" style="font-size:28px;font-weight:700"></label>
    <div class="label">Desde</div><div id="t-from"></div><div class="label">Hacia</div><div id="t-to"></div>
    <div class="grid2"><label class="field"><span>Fecha</span><input type="date" id="t-date" value="${t.date}"></label><label class="field"><span>Nota</span><input id="t-note" value="${esc(t.note)}"></label></div>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar</button>
    ${m ? '<button class="btn danger" data-s="del" style="margin-top:8px">Borrar</button>' : ''}`, sh => {
    const upd = () => { sh.querySelector('#t-from').innerHTML = accChips(t.from, 'from'); sh.querySelector('#t-to').innerHTML = accChips(t.to, 'to'); };
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'from') t.from = b.dataset.v;
      if (b.dataset.s === 'to') t.to = b.dataset.v;
      if (b.dataset.s === 'del') { if (confirm('¿Borrar esta transferencia?')) { deleteMov(m.id); save(); closeSheet(); render(); } return; }
      if (b.dataset.s === 'save') {
        const amt = r2(num(sh.querySelector('#t-amt').value));
        if (!(amt > 0)) return toast('Escribe el monto', 'warn');
        if (t.from === t.to) return toast('Elige cuentas distintas', 'warn');
        const mov = { id: m ? m.id : uid(), ts: m ? m.ts : Date.now(), type: 'transfer', date: sh.querySelector('#t-date').value || today(), amount: amt, from: t.from, to: t.to, note: sh.querySelector('#t-note').value.trim() };
        upsertMov(mov); if (o.onSaved) o.onSaved(mov);
        save(); closeSheet(); render(); toast('✓ Transferencia guardada'); return;
      }
      upd();
    });
    upd();
    if (!m && !t.amount) setTimeout(() => sh.querySelector('#t-amt').focus(), 50);
  });
}

function sheetPago(o = {}) {
  const m = o.mov;
  const dues = allDues().map(stmt).filter(s => (!s.isPaid && s.total > 0) || (m && s.due === m.due) || s.due === o.due);
  const p = m ? { due: m.due, amount: m.amount, from: m.from, date: m.date } : { due: o.due || (dues[0] && dues[0].due), from: o.from || 'pagos', date: today() };
  if (!m) { const st = stmt(p.due); p.amount = st.pending; }
  openSheet(`${head(m ? 'Editar pago de tarjeta' : 'Pagar tarjeta')}
    <label class="field"><span>Estado de cuenta</span><select id="p-due">${dues.map(s => `<option value="${s.due}" ${s.due === p.due ? 'selected' : ''}>Vence ${fmtDate(s.due)} · ${money(s.pending)} pendiente</option>`).join('')}</select></label>
    <label class="field"><span>Monto pagado</span><input id="p-amt" inputmode="decimal" value="${p.amount}" style="font-size:28px;font-weight:700"></label>
    <div class="label">Desde la cuenta</div><div id="p-from"></div>
    <label class="field"><span>Fecha</span><input type="date" id="p-date" value="${p.date}"></label>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar pago</button>
    ${m ? '<button class="btn danger" data-s="del" style="margin-top:8px">Borrar</button>' : ''}`, sh => {
    const upd = () => sh.querySelector('#p-from').innerHTML = accChips(p.from, 'from');
    sh.querySelector('#p-due').addEventListener('change', e => { p.due = e.target.value; if (!m) sh.querySelector('#p-amt').value = stmt(p.due).pending; });
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'from') p.from = b.dataset.v;
      if (b.dataset.s === 'del') { if (confirm('¿Borrar este pago?')) { deleteMov(m.id); save(); closeSheet(); render(); } return; }
      if (b.dataset.s === 'save') {
        const amt = r2(num(sh.querySelector('#p-amt').value)); if (!(amt > 0)) return toast('Escribe el monto', 'warn');
        const mov = { id: m ? m.id : uid(), ts: m ? m.ts : Date.now(), type: 'pago', date: sh.querySelector('#p-date').value || today(), amount: amt, from: p.from, due: p.due };
        upsertMov(mov);
        S.checklist.forEach(c => { if (!c.done && c.action && c.action.type === 'pago' && c.action.due === p.due && stmt(p.due).isPaid) { c.done = true; c.movId = mov.id; } });
        if (o.onSaved) o.onSaved(mov);
        save(); closeSheet(); render(); toast(stmt(p.due).isPaid ? '✅ ¡Tarjeta pagada!' : '✓ Pago parcial guardado'); return;
      }
      upd();
    });
    upd();
  });
}

function sheetIngreso(inc, m) {
  const ex = m ? m.id : null;
  let amount = m ? m.amount : inc.amount;
  let { a: alloc, notes } = m ? { a: Object.assign({}, m.alloc), notes: [] } : suggestAlloc(inc, amount, ex);
  openSheet(`${head(m ? 'Editar ingreso' : '💰 Ingreso recibido')}
    <div class="muted">${esc(inc.name)} · esperado ${money(inc.amount)} el ${fmtDate(inc.date)}</div>
    <div class="grid2"><label class="field"><span>Monto que llegó</span><input id="i-amt" inputmode="decimal" value="${amount}" style="font-size:24px;font-weight:700"></label>
    <label class="field"><span>Fecha</span><input type="date" id="i-date" value="${m ? m.date : today()}"></label></div>
    <div class="label">Repartir entre cuentas</div><div id="i-alloc"></div>
    <div id="i-rest" class="row" style="margin-top:10px"></div>
    <div id="i-notes"></div>
    <button class="btn" data-s="suggest" style="margin-top:12px">✨ Usar sugerencia de mis reglas</button>
    <button class="btn primary big" data-s="save" style="margin-top:10px">${m ? 'Guardar' : 'Confirmar ingreso'}</button>
    ${m ? '<button class="btn danger" data-s="del" style="margin-top:8px">Desmarcar como recibido</button>' : ''}`, sh => {
    const drawAlloc = () => {
      sh.querySelector('#i-alloc').innerHTML = S.accounts.map(a => `<div class="alloc-row"><span>${a.emoji} ${esc(a.name)}</span><input inputmode="decimal" data-acc="${a.id}" value="${alloc[a.id] || ''}" placeholder="0"></div>`).join('');
      sh.querySelector('#i-notes').innerHTML = notes.map(n => `<div class="info-card small">💡 ${esc(n)}</div>`).join('');
      rest();
    };
    const rest = () => {
      const tot = sum(Object.values(alloc)); const r = r2(amount - tot);
      sh.querySelector('#i-rest').innerHTML = `<span class="muted">Sin asignar</span><b class="${Math.abs(r) < 0.01 ? 'pos' : 'warn-t'} num">${Math.abs(r) < 0.01 ? '✓ todo repartido' : money(r)}</b>`;
    };
    sh.querySelector('#i-alloc').addEventListener('input', e => { const k = e.target.dataset.acc; if (k) { alloc[k] = r2(num(e.target.value)); rest(); } });
    sh.querySelector('#i-amt').addEventListener('input', e => { amount = r2(num(e.target.value)); ({ a: alloc, notes } = suggestAlloc(inc, amount, ex)); drawAlloc(); });
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'suggest') { ({ a: alloc, notes } = suggestAlloc(inc, amount, ex)); drawAlloc(); }
      if (b.dataset.s === 'del') { if (confirm('¿Desmarcar y borrar este ingreso registrado?')) { deleteMov(m.id); save(); closeSheet(); render(); } }
      if (b.dataset.s === 'save') {
        if (!(amount > 0)) return toast('Escribe el monto', 'warn');
        const tot = sum(Object.values(alloc));
        if (Math.abs(tot - amount) > 0.01) return toast(`Reparte todo el monto (faltan ${money(amount - tot)})`, 'warn');
        const clean = {}; for (const k in alloc) if (alloc[k] > 0) clean[k] = alloc[k];
        const mov = { id: m ? m.id : uid(), ts: m ? m.ts : Date.now(), type: 'ingreso', date: sh.querySelector('#i-date').value || today(), amount, name: inc.name, incomeId: inc.id, probable: inc.type === 'probable', alloc: clean };
        upsertMov(mov);
        if (inc.id) { const real = income(inc.id); if (real) real.received = mov.id; }
        S.checklist.forEach(c => { if (c.action && c.action.type === 'ingreso' && c.action.incomeId === inc.id) { c.done = true; c.movId = mov.id; } });
        save(); closeSheet(); render(); toast('💰 Ingreso registrado');
      }
    });
    drawAlloc();
  });
}

function sheetIncomeEdit(inc) {
  const isNew = !inc;
  const i = inc ? Object.assign({}, inc) : { id: uid(), type: 'probable', name: '', amount: '', date: today(), received: null };
  openSheet(`${head(isNew ? 'Nuevo ingreso esperado' : 'Editar ingreso esperado')}
    <label class="field"><span>Nombre</span><input id="ie-name" value="${esc(i.name)}" placeholder="Ej. Edición de video"></label>
    <div class="grid2"><label class="field"><span>Monto</span><input id="ie-amt" inputmode="decimal" value="${i.amount}"></label>
    <label class="field"><span>Fecha esperada</span><input type="date" id="ie-date" value="${i.date}"></label></div>
    <div class="label">Tipo</div><div class="seg"><button data-s="type" data-v="seguro">✅ Seguro</button><button data-s="type" data-v="probable">🤞 Probable</button></div>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar</button>
    ${isNew ? '' : '<button class="btn danger" data-s="del" style="margin-top:8px">Eliminar</button>'}`, sh => {
    const upd = () => sh.querySelectorAll('[data-s="type"]').forEach(b => b.classList.toggle('on', b.dataset.v === i.type));
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'type') { i.type = b.dataset.v; upd(); }
      if (b.dataset.s === 'del') { if (i.received) return toast('Primero desmarca el ingreso recibido', 'warn'); if (confirm('¿Eliminar este ingreso esperado?')) { S.incomes = S.incomes.filter(x => x.id !== i.id); save(); closeSheet(); render(); } }
      if (b.dataset.s === 'save') {
        i.name = sh.querySelector('#ie-name').value.trim(); i.amount = r2(num(sh.querySelector('#ie-amt').value)); i.date = sh.querySelector('#ie-date').value || today();
        if (!i.name || !(i.amount > 0)) return toast('Completa nombre y monto', 'warn');
        if (i.suggest && inc && i.amount !== inc.amount) { /* la sugerencia se ajusta sola al monto */ }
        if (isNew) S.incomes.push(i); else Object.assign(inc, i);
        save(); closeSheet(); render(); toast('✓ Guardado');
      }
    });
    upd();
  });
}

function sheetCheck(item) {
  const isNew = !item; const c = item ? Object.assign({}, item) : { text: '', date: today() };
  openSheet(`${head(isNew ? 'Nuevo paso' : 'Editar paso')}
    <label class="field"><span>¿Qué hay que hacer?</span><input id="c-text" value="${esc(c.text)}" placeholder="Ej. Pagar el internet"></label>
    <label class="field"><span>Fecha</span><input type="date" id="c-date" value="${c.date}"></label>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar</button>
    ${isNew ? '' : '<button class="btn danger" data-s="del" style="margin-top:8px">Eliminar paso</button>'}`, sh => {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'del') { if (confirm('¿Eliminar este paso?')) { S.checklist = S.checklist.filter(x => x.id !== item.id); save(); closeSheet(); render(); } }
      if (b.dataset.s === 'save') {
        const text = sh.querySelector('#c-text').value.trim(); const date = sh.querySelector('#c-date').value || today();
        if (!text) return toast('Escribe el paso', 'warn');
        if (isNew) S.checklist.push({ id: uid(), date, when: fmtDate(date), text, action: null, done: false, movId: null, custom: true });
        else { const changed = date !== item.date; item.text = text; item.date = date; if (changed) item.when = fmtDate(date); }
        save(); closeSheet(); render(); toast('✓ Paso guardado');
      }
    });
    if (isNew) setTimeout(() => sh.querySelector('#c-text').focus(), 50);
  });
}

function sheetStmt(due) {
  const ov = S.statements[due] || {}; const st = stmt(due);
  openSheet(`${head('Estado que vence el ' + fmtDate(due))}
    <div class="muted small">Estimado de la app: ${money(st.est)}. Pon aquí el monto exacto cuando salga tu estado de cuenta (después del cierre del ${S.settings.cierre}).</div>
    <div class="grid2"><label class="field"><span>Monto en soles</span><input id="s-pen" inputmode="decimal" value="${ov.realPEN ?? ''}" placeholder="${st.est}"></label>
    <label class="field"><span>Monto en US$</span><input id="s-usd" inputmode="decimal" value="${ov.realUSD ?? ''}" placeholder="0"></label></div>
    <label class="field"><span>Fecha en que lo pagarás</span><input type="date" id="s-payby" value="${ov.payBy || due}"></label>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar</button>
    <button class="btn danger" data-s="clear" style="margin-top:8px">Quitar monto real (usar estimado)</button>`, sh => {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      const o = S.statements[due] = S.statements[due] || {};
      o.payBy = sh.querySelector('#s-payby').value || due;
      if (b.dataset.s === 'save') { const v = sh.querySelector('#s-pen').value.trim(); o.realPEN = v === '' ? null : r2(num(v)); o.realUSD = r2(num(sh.querySelector('#s-usd').value)); o.fixed = false; }
      if (b.dataset.s === 'clear') { o.realPEN = null; o.realUSD = null; o.fixed = false; }
      save(); closeSheet(); render(); toast('✓ Estado de cuenta actualizado');
    });
  });
}

function sheetWish(phaseId, w) {
  const isNew = !w;
  openSheet(`${head(isNew ? 'Nuevo deseo' : 'Editar deseo')}
    <label class="field"><span>Nombre</span><input id="w-name" value="${esc(w ? w.name : '')}"></label>
    <label class="field"><span>Precio máximo</span><input id="w-max" inputmode="decimal" value="${w ? w.max : ''}"></label>
    ${!isNew && w.bought ? '<div class="info-card small">Ya comprado. Para deshacerlo, borra el gasto en Movimientos.</div>' : ''}
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar</button>
    ${isNew ? '' : '<button class="btn danger" data-s="del" style="margin-top:8px">Eliminar</button>'}`, sh => {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      const ph = S.wishes.find(p => p.id === phaseId);
      if (b.dataset.s === 'del') { if (confirm('¿Eliminar este deseo?')) { ph.items = ph.items.filter(x => x.id !== w.id); save(); closeSheet(); render(); } }
      if (b.dataset.s === 'save') {
        const name = sh.querySelector('#w-name').value.trim(); const max = r2(num(sh.querySelector('#w-max').value));
        if (!name) return toast('Escribe el nombre', 'warn');
        if (isNew) ph.items.push({ id: uid(), name, max, bought: null }); else { w.name = name; w.max = max; }
        save(); closeSheet(); render();
      }
    });
  });
}
function findWish(id) { for (const ph of S.wishes) { const w = ph.items.find(x => x.id === id); if (w) return { ph, w }; } return {}; }

/* =================== EVENTOS =================== */
const actions = {
  tab: el => go(el.dataset.v),
  go: el => go(el.dataset.v),
  back: () => { ui.sub = null; render(); window.scrollTo(0, 0); },
  closeSheet: () => closeSheet(),
  newGasto: () => sheetGasto(),
  newTransfer: el => sheetTransfer({ to: el.dataset.to }),
  period: el => { ui.periodIdx = Math.max(0, Math.min(S.periods.length - 1, ui.periodIdx + Number(el.dataset.v))); render(); },
  accFilter: el => { ui.f = { month: 'all', cat: 'all', type: 'all', acc: el.dataset.v }; go('movs'); },
  catFilter: el => { ui.f = { month: 'all', cat: el.dataset.v, type: 'all', acc: 'all', pid: el.dataset.p }; go('movs'); },
  fMonth: el => { ui.f.month = el.dataset.v; render(); },
  fClear: el => { if (el.dataset.v === 'acc') ui.f.acc = 'all'; else delete ui.f.pid; render(); },
  editMov: el => { const m = S.movs.find(x => x.id === el.dataset.v); if (m) editMov(m); },
  checkToggle: el => {
    const c = S.checklist.find(x => x.id === el.dataset.v); if (!c) return;
    if (isCardPlan(c)) {
      // Compras planificadas: los gastos vinculados nunca se borran desde aquí.
      const s = planStatus(c);
      if (c.done) { c.closed = false; syncPlanItem(c.id); if (!s.count) c.done = false; }
      else if (s.count) {
        if (!confirm(`¿Ya compraste todo lo de "${c.action.note || c.text}"? Lo pendiente (${money(s.pending)}) dejará de sumarse al estado de cuenta.`)) return;
        c.closed = true; c.done = true; toast('✓ Paso cerrado');
      } else return runCheckAction(c);
      save(); render(); return;
    }
    if (c.done) {
      if (c.movId && S.movs.find(m => m.id === c.movId)) {
        if (!confirm('Este paso tiene un movimiento registrado. ¿Desmarcarlo y borrar ese movimiento?')) return;
        deleteMov(c.movId);
      }
      c.done = false; c.movId = null;
    } else if (c.action && ['gasto', 'pago', 'ingreso'].includes(c.action.type)) {
      return runCheckAction(c);
    } else { c.done = true; toast('✓ ¡Hecho!'); }
    save(); render();
  },
  checkAct: el => { const c = S.checklist.find(x => x.id === el.dataset.v); if (c) runCheckAction(c); },
  checkEdit: el => sheetCheck(S.checklist.find(x => x.id === el.dataset.v)),
  newCheck: () => sheetCheck(null),
  showDone: el => { ui.showDone = el.dataset.v === '1'; render(); },
  receive: el => { const i = income(el.dataset.v); if (i) sheetIngreso(i, null); },
  editIncome: el => sheetIncomeEdit(income(el.dataset.v)),
  newIncome: () => sheetIncomeEdit(null),
  selStmt: el => { ui.stmtSel = el.dataset.v; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); },
  editStmt: el => sheetStmt(el.dataset.v),
  payStmt: el => sheetPago({ due: el.dataset.v, from: el.dataset.v === '2026-12-05' && num(balances().pagos) < stmt(el.dataset.v).pending ? 'dia' : 'pagos' }),
  newWish: el => sheetWish(el.dataset.v, null),
  editWish: el => { const { ph, w } = findWish(el.dataset.v); if (w) sheetWish(ph.id, w); },
  buyWish: el => {
    const { w } = findWish(el.dataset.v); if (!w) return;
    sheetGasto({ preset: { amount: w.max, cat: 'deseos', method: 'debito', account: 'deseos', note: w.name }, onSaved: mov => { w.bought = mov.id; } });
  },
  tipRun: el => { const x = lastTips.find(t => t.id === el.dataset.v); if (x && x.run) x.run(); },
  tipHide: el => { S.tipsHidden = S.tipsHidden || {}; S.tipsHidden[el.dataset.v] = today(); save(); render(); toast('Consejo oculto'); },
  tipsReset: () => { S.tipsHidden = {}; save(); render(); },
  askMethod: el => { readAsk(); ui.ask.method = el.dataset.v; ui.ask.res = null; render(); },
  ask: () => {
    readAsk(); const a = r2(num(ui.ask.amount));
    if (!(a > 0)) return toast('Escribe un monto', 'warn');
    ui.ask.res = canSpend(a, ui.ask.cat, ui.ask.method); render();
  },
  askRegister: () => { const q = ui.ask; sheetGasto({ preset: { amount: r2(num(q.amount)), cat: q.cat, method: q.method } }); },
  theme: el => { S.settings.theme = el.dataset.v; save(); render(); },
  export: () => exportJSON(),
  import: () => $('#import-file').click(),
  reset: () => { if (confirm('¿Borrar TODOS tus datos y volver a empezar? Esto no se puede deshacer. Exporta un respaldo antes.') && confirm('¿Seguro? Última confirmación.')) { S = seed(); save(); ui.periodIdx = null; go('inicio'); toast('Datos reiniciados'); } },
  rmBudget: el => { const p = S.periods[+el.dataset.p]; if (confirm(`¿Quitar ${cat(el.dataset.v).name} de ${p.label}?`)) { delete p.budgets[el.dataset.v]; save(); render(); } },
  newCat: () => sheetCategory(null),
  editCat: el => sheetCategory(cat(el.dataset.v)),
  homeDetail: () => { ui.homeDetail = !ui.homeDetail; render(); },
  noteOk: () => { delete S.updateNote; save(); render(); },
  checkUpdate: () => checkForUpdate(true),
  doUpdate: () => applyUpdate(),
  claseMas: () => {
    if (clasesQuedan() <= 0) return toast('El paquete ya está completo', 'warn');
    S.clases.log.push(today()); save(); render();
    const q = clasesQuedan();
    if (q === 2) toast('⚠️ Te quedan 2 clases. El próximo paquete solo con ingresos extra ya cobrados.', 'warn');
    else if (q === 0) toast('🏁 Paquete terminado. Renueva solo si ya cobraste ingresos extra.', 'warn');
    else toast(`⚽ ¡Bien! Clase ${clasesUsadas()} de ${S.clases.total}`);
  },
  claseMenos: () => { if (!clasesUsadas()) return; if (confirm('¿Quitar la última clase marcada?')) { S.clases.log.pop(); save(); render(); } },
  clasesReset: () => sheetClasesReset(),
};

function sheetClasesReset() {
  const extras = S.movs.filter(m => m.type === 'ingreso' && m.probable && m.date.slice(0, 7) === today().slice(0, 7));
  openSheet(`${head('🔄 Paquete nuevo')}
    <div class="info-card" style="margin-top:0">📌 ${esc(cat('deporte').rule || '')}</div>
    <div class="info-card small">${extras.length ? `Este mes ya cobraste ingresos extra: ${extras.map(m => esc(m.name) + ' ' + money(m.amount)).join(', ')}. ✅` : 'Este mes aún <b>no</b> registras ingresos extra cobrados. Según tu regla, mejor espera.'}</div>
    <div class="grid2"><label class="field"><span>Clases del paquete</span><input id="cr-total" inputmode="numeric" value="${S.clases.total}"></label>
    <label class="field"><span>Precio pagado</span><input id="cr-price" inputmode="decimal" value="300"></label></div>
    <label class="list-item" style="cursor:pointer"><input type="checkbox" id="cr-gasto" checked style="width:24px;height:24px;flex:none"><span class="mid">Registrar también el pago como gasto en ⚽ Deporte</span></label>
    <button class="btn primary big" data-s="ok" style="margin-top:12px">Empezar paquete nuevo (0 de ${S.clases.total})</button>`, sh => {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      const total = Math.max(1, Math.round(num(sh.querySelector('#cr-total').value)) || 10);
      const price = r2(num(sh.querySelector('#cr-price').value));
      const reg = sh.querySelector('#cr-gasto').checked;
      S.clases.paquetes = S.clases.paquetes || [];
      if (S.clases.log.length) S.clases.paquetes.push({ fin: today(), usadas: S.clases.log.length, total: S.clases.total, log: S.clases.log.slice() });
      S.clases.total = total; S.clases.log = []; save(); closeSheet(); render();
      if (reg && price > 0) setTimeout(() => sheetGasto({ preset: { amount: price, cat: 'deporte', method: 'debito', note: `Paquete ${total} clases fútbol` } }), 320);
      else toast('✓ Paquete nuevo: 0 de ' + total);
    });
  });
}

function sheetCategory(c) {
  const isNew = !c;
  const t = today(); const cp = S.periods[Math.max(0, periodIndexFor(t))];
  const g = c ? S.movs.filter(m => m.type === 'gasto' && m.cat === c.id).length : 0;
  const curTope = c && cp && cp.budgets[c.id] != null ? cp.budgets[c.id] : '';
  openSheet(`${head(isNew ? 'Nueva categoría' : 'Editar categoría')}
    <div class="grid2" style="grid-template-columns:90px 1fr"><label class="field"><span>Ícono</span><input id="k-emoji" value="${esc(c ? c.emoji : '🏷️')}" style="text-align:center;font-size:24px"></label>
    <label class="field"><span>Nombre</span><input id="k-name" value="${esc(c ? c.name : '')}" placeholder="Ej. Mascota"></label></div>
    <label class="field"><span>Tope mensual (desde ${esc(cp ? cp.label : 'hoy')} en adelante)</span><input id="k-tope" inputmode="decimal" value="${curTope}" placeholder="Vacío = sin tope"></label>
    <div class="muted tiny" style="margin:6px 2px 0">Para un tope distinto en un solo mes, usa "Presupuestos por periodo" más abajo en Ajustes.</div>
    <label class="field"><span>Regla o nota (opcional)</span><input id="k-rule" value="${esc(c && c.rule ? c.rule : '')}"></label>
    <button class="btn primary big" data-s="save" style="margin-top:16px">Guardar</button>
    ${isNew ? '' : `<button class="btn danger" data-s="del" style="margin-top:8px">Eliminar categoría</button>
    <div class="muted tiny" style="text-align:center">${g ? `Sus ${g} gasto${g > 1 ? 's' : ''} no se borran: pasan a "Sin categoría".` : 'No tiene gastos registrados.'}</div>`}`, sh => {
    sh.addEventListener('click', e => {
      const b = e.target.closest('[data-s]'); if (!b) return;
      if (b.dataset.s === 'del') {
        if (!confirm(`¿Eliminar "${c.name}"?${g ? ` Sus ${g} gastos pasarán a "Sin categoría" (no se borran).` : ''}`)) return;
        S.movs.forEach(m => { if (m.type === 'gasto' && m.cat === c.id) m.cat = 'sin'; });
        S.checklist.forEach(k => { if (k.action && k.action.cat === c.id) k.action.cat = 'sin'; });
        S.periods.forEach(p => { delete p.budgets[c.id]; });
        S.categories = S.categories.filter(x => x.id !== c.id);
        if (!S.categories.some(x => x.id === 'sin')) S.categories.push(Object.assign({}, NEW_CATS_V2[2]));
        if (ui.f.cat === c.id) ui.f.cat = 'all';
        save(); closeSheet(); render(); toast('Categoría eliminada'); return;
      }
      if (b.dataset.s === 'save') {
        const name = sh.querySelector('#k-name').value.trim(); if (!name) return toast('Escribe un nombre', 'warn');
        const emoji = (sh.querySelector('#k-emoji').value.trim() || '🏷️').slice(0, 4);
        const rule = sh.querySelector('#k-rule').value.trim();
        const topeRaw = sh.querySelector('#k-tope').value.trim();
        let k = c;
        if (isNew) { k = { id: 'c' + uid(), name, emoji }; S.categories.push(k); }
        k.name = name; k.emoji = emoji; if (rule) k.rule = rule; else delete k.rule;
        if (topeRaw !== '' && String(topeRaw) !== String(curTope)) {
          const v = r2(num(topeRaw));
          S.periods.forEach(p => { if (p.end >= t) p.budgets[k.id] = v; });
        }
        save(); closeSheet(); render(); toast(isNew ? '✓ Categoría creada' : '✓ Categoría guardada');
      }
    });
    if (isNew) setTimeout(() => sh.querySelector('#k-name').focus(), 50);
  });
}

/* ---------- Actualizaciones ---------- */
let swReg = null;
async function checkForUpdate(manual) {
  try {
    if (swReg) swReg.update().catch(() => {});
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error();
    const v = (await r.json()).version;
    if (v && v !== APP_VERSION) showUpdateBar(v);
    else if (manual) toast('✓ Ya tienes la última versión (' + APP_VERSION + ')');
  } catch (e) { if (manual) toast('Sin conexión: no se pudo revisar', 'warn'); }
}
function showUpdateBar(v) {
  let el = document.getElementById('update-bar');
  if (!el) { el = document.createElement('button'); el.id = 'update-bar'; el.dataset.a = 'doUpdate'; document.body.appendChild(el); }
  el.innerHTML = `✨ Hay una versión nueva (${esc(v)}). <b>Toca para actualizar</b>`;
}
async function applyUpdate() {
  // Los datos NO se tocan: solo se renuevan los archivos de la app.
  // El service worker trae primero de internet, así que basta con recargar.
  try { if (swReg) await swReg.update(); } catch (e) {}
  location.reload();
}

function readAsk() {
  ui.ask = ui.ask || { amount: '', cat: 'otros', method: 'debito' };
  const a = $('#ask-amt'), c = $('#ask-cat');
  if (a) ui.ask.amount = a.value; if (c) ui.ask.cat = c.value;
}

function runCheckAction(c) {
  const a = c.action; const done = mov => { c.done = true; c.movId = mov.id; };
  if (a.type === 'gasto' && a.method === 'tarjeta') {
    const s = planStatus(c); // ofrece solo lo que falta del estimado; el vínculo marca el paso como hecho al completarse
    sheetGasto({ preset: { amount: s.pending || a.amount, cat: a.cat, method: 'tarjeta', note: a.note, planId: c.id } });
  }
  else if (a.type === 'gasto') sheetGasto({ preset: { amount: a.amount, cat: a.cat, method: a.method, note: a.note }, onSaved: done });
  else if (a.type === 'pago') sheetPago({ due: a.due, from: a.from, onSaved: done });
  else if (a.type === 'ingreso') { const i = income(a.incomeId); if (!i) return; if (i.received) { c.done = true; c.movId = i.received; save(); render(); } else sheetIngreso(i, null); }
  else if (a.type === 'nav') { c.done = true; save(); go(a.to); }
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  if (el.tagName === 'SELECT') return;
  const fn = actions[el.dataset.a]; if (fn) { e.preventDefault(); fn(el, e); }
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.a === 'fSel') { ui.f[el.dataset.k] = el.value; if (el.dataset.k === 'cat') delete ui.f.pid; render(); return; }
  if (el.dataset.a === 'addBudget' && el.value) { S.periods[+el.dataset.p].budgets[el.value] = 0; save(); render(); return; }
  if (el.dataset.bind) {
    const path = el.dataset.bind.split('.'); let o = S;
    for (let i = 0; i < path.length - 1; i++) o = o[path[i]];
    const v = el.dataset.t === 'text' ? el.value : r2(num(el.value));
    o[path[path.length - 1]] = v; save(); toast('✓ Guardado');
  }
});
$('#import-file').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d || !Array.isArray(d.movs) || !d.settings) throw new Error('formato');
      if (!confirm(`¿Reemplazar tus datos actuales con este respaldo (${d.movs.length} movimientos)?`)) return;
      S = migrate(d); save(); ui.periodIdx = null; go('inicio'); toast('✓ Respaldo importado');
    } catch (err) { toast('Ese archivo no es un respaldo válido', 'bad'); }
    e.target.value = '';
  };
  r.readAsText(f);
});

async function exportJSON() {
  S.lastBackup = today(); save();
  const name = `finanzas-respaldo-${today()}.json`;
  const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Respaldo Mis Finanzas' }); render(); return; }
  } catch (err) { if (err && err.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  render(); toast('✓ Respaldo exportado');
}

/* =================== ARRANQUE =================== */
load(); render();
document.addEventListener('visibilitychange', () => { if (!document.hidden) { render(); checkForUpdate(false); } });
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').then(r => { swReg = r; }).catch(() => {});
  setTimeout(() => checkForUpdate(false), 1500);
}
