(() => {
"use strict";
const CFG = window.TMRD_CONFIG || {};
const DEMO = !CFG.SUPABASE_URL || CFG.SUPABASE_URL.includes("COLE_AQUI") || !window.supabase;
const TABLE = CFG.TABELA || "tmrd_registros";

/* ---------- ícones dos tópicos ---------- */
const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const TOPICS = [
  {k:"quimicos", n:"Produtos Químicos", i:P('<path d="M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 0 0 6 21h12a1.7 1.7 0 0 0 1.5-2.5L14 9V3"/><path d="M7 15h10"/>')},
  {k:"confinado", n:"Espaço Confinado", i:P('<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/><path d="M10 9v9M14 9v9M10 12h4M10 15h4"/>')},
  {k:"quente", n:"Trabalho à Quente", i:P('<path d="M12 21c4 0 7-2.7 7-6.5 0-3.5-2.5-5.5-3.5-8.5-1.5 2-2.5 3-3.5 3 0-2.5-1-5-3-6 0 4-4 6-4 11.5C5 18.3 8 21 12 21Z"/><path d="M12 21c-1.7 0-3-1.2-3-3 0-2 2-3 2-5 1.5 1 4 3 4 5 0 1.8-1.3 3-3 3Z"/>')},
  {k:"icamento", n:"Grandes Içamentos", i:P('<path d="M4 21V5h14M4 5l4 4M18 5v6"/><path d="M18 11a2 2 0 1 1-2 2"/><path d="M2 21h8"/>')},
  {k:"energias", n:"Energias Perigosas", i:P('<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>')},
  {k:"altura", n:"Trabalho em Altura", i:P('<path d="M7 3v18M15 3v18M7 7h8M7 12h8M7 17h8"/><path d="M19 9l2-2-2-2"/>')},
  {k:"telhado", n:"Trabalho em Telhado", i:P('<path d="M2 12 12 4l10 8"/><path d="M5 10v10h14V10"/><path d="M9 20v-5h6v5"/>')},
  {k:"equip", n:"Intervenção em Equipamentos", i:P('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>')},
  {k:"logistica", n:"Logística Interna", i:P('<path d="M3 17V8h7l3 5v4"/><path d="M13 17h4V4"/><path d="M17 14h4"/><circle cx="6.5" cy="18" r="2"/><circle cx="12" cy="18" r="2"/>')},
  {k:"terceiros", n:"Trabalhos Terceirizados", i:P('<path d="M5 14a7 7 0 0 1 14 0"/><path d="M3 14h18v2H3z"/><path d="M12 7V4M9 8l-1-2M15 8l1-2"/>')},
  {k:"outros", n:"Outros", i:P('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>')},
];
const TMAP = Object.fromEntries(TOPICS.map(t => [t.k, t]));
const CONTROLES = ["PT emitida","APR / ART","Bloqueio LOTO","Isolamento de área","Vigia / observador","EPI específico","DDS realizado"];
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = { get(k){ try { return localStorage.getItem(k); } catch(_) { return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch(_){} } };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c === "x" ? r : (r&3|8)).toString(16); }));

/* ---------- identificação do aparelho (para "meus lançamentos") ---------- */
let DEVICE = store.get("tmrd.device"); if (!DEVICE) { DEVICE = uuid(); store.set("tmrd.device", DEVICE); }

/* ---------- datas ---------- */
const pad = (n) => String(n).padStart(2,"0");
const ymd = (d=new Date()) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const hm = (d=new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fmtDate = (s) => { const [y,m,d] = String(s).split("-"); return `${d}/${m}/${y}`; };
const DIAS = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
function guessTurno(){ const h = new Date().getHours(); return h>=6&&h<14 ? "1º" : h>=14&&h<22 ? "2º" : "3º"; }

/* ---------- estado ---------- */
const DIAS3 = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const addDays = (s, n) => { const [y,m,d] = s.split("-").map(Number); return ymd(new Date(y, m-1, d+n)); };
const dowOf = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d).getDay(); };
const ddmm = (s) => { const [,m,d] = s.split("-"); return `${d}/${m}`; };
const state = { today: ymd(), topic:null, turno:guessTurno(), ctrls:new Set(), sb:null, dia:ymd(),
  mine:[], board:[], krows:[], kDays:30, dayOffset:0, confirmDel:null, demo:[] };

/* ---------- camada de dados (Supabase ou demonstração) ---------- */
const fromDb = (r) => ({ id:r.id, data:r.data, criadoEm:r.criado_em, topico:r.topico, topicoOutro:r.topico_outro||"", atividade:r.atividade,
  area:r.area||"", local:r.local||"", turno:r.turno||"", inicio:(r.inicio||"").slice(0,5), fim:(r.fim||"").slice(0,5),
  controles:r.controles||[], responsavel:r.responsavel||"", deviceId:r.device_id||"" });
const toDb = (r) => ({ id:r.id, data:r.data, criado_em:r.criadoEm, topico:r.topico, topico_outro:r.topicoOutro||null, atividade:r.atividade,
  area:r.area||null, local:r.local||null, turno:r.turno||null, inicio:r.inicio||null, fim:r.fim||null,
  controles:r.controles, responsavel:r.responsavel||null, device_id:r.deviceId });

const api = {
  async range(from, to){
    if (DEMO) return state.demo.filter(r => r.data >= from && r.data <= to);
    const { data, error } = await state.sb.from(TABLE).select("*").gte("data", from).lte("data", to).order("criado_em");
    if (error) throw error; return data.map(fromDb);
  },
  async mine(from){
    if (DEMO) return state.demo.filter(r => r.deviceId === DEVICE && r.data >= from);
    const { data, error } = await state.sb.from(TABLE).select("*").eq("device_id", DEVICE).gte("data", from).order("data");
    if (error) throw error; return data.map(fromDb);
  },
  async insert(row){
    if (DEMO) { state.demo.push(row); return; }
    const { error } = await state.sb.from(TABLE).upsert(toDb(row), { onConflict:"id", ignoreDuplicates:true });
    if (error) throw error;
  },
  async edit(row, pin){
    if (DEMO) { const r = state.demo.find(x => x.id === row.id); if (r) Object.assign(r, row); return; }
    const args = { p_id: row.id, p_data: row.data, p_topico: row.topico, p_topico_outro: row.topicoOutro || "", p_atividade: row.atividade };
    const { error } = pin ? await state.sb.rpc("tmrd_editar", { p_pin: pin, ...args }) : await state.sb.rpc("tmrd_editar_meu", { p_device: DEVICE, ...args });
    if (error) throw error;
  },
  async removeAdmin(id, pin){
    if (DEMO) { state.demo = state.demo.filter(x => x.id !== id); return; }
    const { error } = await state.sb.rpc("tmrd_excluir", { p_pin: pin, p_id: id }); if (error) throw error;
  },
  async all(){
    if (DEMO) return [...state.demo];
    const out = []; const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await state.sb.from(TABLE).select("*").order("data").order("criado_em").range(from, from + page - 1);
      if (error) throw error; out.push(...data.map(fromDb)); if (data.length < page) break;
    }
    return out;
  },
  async remove(id){
    if (DEMO) { state.demo = state.demo.filter(x => x.id !== id); return; }
    const { error } = await state.sb.from(TABLE).delete().eq("id", id); if (error) throw error;
  },
};

/* ---------- fila offline: lançamentos feitos sem sinal ---------- */
const outbox = { read(){ try { return JSON.parse(store.get("tmrd.outbox") || "[]"); } catch(_) { return []; } }, write(a){ store.set("tmrd.outbox", JSON.stringify(a)); } };
let flushing = false;
async function flushOutbox(){
  if (flushing || DEMO) return; const q = outbox.read(); if (!q.length) return;
  flushing = true; const left = [];
  for (const row of q) { try { await api.insert(row); } catch(_) { left.push(row); } }
  outbox.write(left); flushing = false;
  if (q.length !== left.length) { toast(`${q.length-left.length} lançamento(s) pendente(s) enviado(s)`); refresh(); }
  paintPending();
}
function paintPending(){
  const n = outbox.read().length, el = $("pending");
  el.hidden = !n; el.textContent = n ? `${n} lançamento(s) aguardando sinal para enviar` : "";
}

/* ---------- relógio ---------- */
function tick(){
  const d = new Date();
  $("clk").textContent = hm(d);
  $("dt").textContent = `${DIAS[d.getDay()]} · ${pad(d.getDate())}/${pad(d.getMonth()+1)}`;
  if (state.today !== ymd()) { state.today = ymd(); paintDia(); refresh(); }
}

/* ---------- formulário ---------- */
function paintDia(){
  const opts = [[state.today,"Hoje"],[addDays(state.today,1),"Amanhã"],[addDays(state.today,2),DIAS3[dowOf(addDays(state.today,2))]]];
  const isOther = !opts.some(o => o[0] === state.dia);
  $("dia").innerHTML = opts.map(([d,l]) => `<button type="button" data-d="${d}" aria-pressed="${d === state.dia}">${l}<small>${ddmm(d)}</small></button>`).join("")
    + `<button type="button" data-d="outra" aria-pressed="${isOther}">Outra<small>${isOther ? ddmm(state.dia) : "data"}</small></button>`;
  $("diaOutra").min = state.today; $("diaOutra").hidden = !isOther;
}
$("dia").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.d === "outra") { $("diaOutra").hidden = false; $("diaOutra").value = addDays(state.today,3); state.dia = $("diaOutra").value; paintDia(); $("diaOutra").focus(); }
  else { state.dia = b.dataset.d; paintDia(); }
});
$("diaOutra").addEventListener("change", () => { if ($("diaOutra").value) { state.dia = $("diaOutra").value; paintDia(); } });
paintDia();

$("topics").innerHTML = TOPICS.map(t => `<button type="button" class="tp" role="radio" aria-checked="false" data-k="${t.k}">${t.i}<span>${t.n === "Outros" ? "Outros (especificar)" : t.n}</span></button>`).join("");
$("topics").addEventListener("click", e => {
  const b = e.target.closest(".tp"); if (!b) return;
  state.topic = b.dataset.k;
  $("topics").querySelectorAll(".tp").forEach(x => x.setAttribute("aria-checked", x === b ? "true" : "false"));
  $("outroTxt").hidden = state.topic !== "outros";
  if (state.topic === "outros") $("outroTxt").focus();
});

function toast(msg, bad){ const t = $("toast"); t.textContent = msg; t.classList.toggle("bad", !!bad); t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2800); }

function resetForm(){
  $("atividade").value = ""; $("outroTxt").value = "";
  state.topic = null; state.ctrls.clear();
  $("topics").querySelectorAll(".tp").forEach(x => x.setAttribute("aria-checked","false"));
  $("outroTxt").hidden = true;
}


$("frm").addEventListener("submit", async e => {
  e.preventDefault();
  const err = $("err"); err.textContent = "";
  const atividade = $("atividade").value.trim();
  if (!state.dia || state.dia < state.today) { err.textContent = "Escolha a data da tarefa (hoje ou dias seguintes)."; return; }
  if (!state.topic) { err.textContent = "Escolha o tópico da tarefa."; $("topics").scrollIntoView({behavior:"smooth", block:"center"}); return; }
  if (state.topic === "outros" && !$("outroTxt").value.trim()) { err.textContent = "Especifique o tópico em “Outros”."; $("outroTxt").focus(); return; }
  if (!atividade) { err.textContent = "Descreva a atividade."; $("atividade").focus(); return; }
  const row = {
    id: uuid(), data: state.dia, criadoEm: new Date().toISOString(),
    topico: state.topic, topicoOutro: state.topic === "outros" ? $("outroTxt").value.trim() : "",
    atividade, area: "", local: "",
    turno: "", inicio: "", fim: "",
    controles: [], responsavel: "", deviceId: DEVICE,
  };
  $("send").disabled = true;
  try {
    await api.insert(row);
    resetForm(); toast(DEMO ? "Enviado (modo demonstração)" : `Tarefa enviada ao painel · ${ddmm(row.data)}`);
    refresh();
  } catch (x) {
    const offline = !navigator.onLine || /fetch|network/i.test(String(x?.message||x));
    if (offline) { outbox.write([...outbox.read(), row]); resetForm(); paintPending(); toast("Sem sinal: lançamento guardado e será enviado sozinho", true); }
    else err.textContent = "O servidor recusou o envio: " + (x?.message || "erro desconhecido");
  } finally { $("send").disabled = false; }
});

/* ---------- textos ---------- */
function topicLabel(r){ return r.topico === "outros" && r.topicoOutro ? `Outros · ${r.topicoOutro}` : (TMAP[r.topico]?.n || r.topico || "Outros"); }
function horario(r){ return r.inicio ? (r.fim ? `${r.inicio}–${r.fim}` : `${r.inicio}`) : ""; }
const EMPTY_IC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3 22 20H2Z"/><path d="M12 10v4M12 17v.01"/></svg>';
const sortRows = (a,b) => a.data.localeCompare(b.data) || (a.inicio||"99").localeCompare(b.inicio||"99") || String(a.criadoEm).localeCompare(String(b.criadoEm));
function dayLabel(d){ return d === state.today ? "Hoje" : d === addDays(state.today,1) ? "Amanhã" : `${DIAS3[dowOf(d)]} ${ddmm(d)}`; }

/* ---------- meus lançamentos ---------- */
function renderMine(){
  const rows = [...state.mine].sort(sortRows);
  $("mineCount").textContent = rows.length ? `${rows.length} de hoje em diante` : "";
  $("mineList").innerHTML = rows.length ? rows.map(r => {
    const t = TMAP[r.topico] || TMAP.outros;
    const del = state.confirmDel === r.id
      ? `<span style="display:flex;gap:6px"><button class="mini confirm" data-a="del" data-id="${r.id}">Excluir</button><button class="mini cancel" data-a="nodel">Cancelar</button></span>`
      : `<span style="display:flex;gap:6px"><button class="mini cancel" data-a="edit" data-id="${r.id}">Editar</button><button class="mini" data-a="ask" data-id="${r.id}">Excluir</button></span>`;
    return `<article class="card"><div class="ic">${t.i}</div>
      <div class="body"><div class="tt">${esc(topicLabel(r))}</div><div class="ac">${esc(r.atividade)}</div>
        </div>
      <div class="side"><span class="dpill ${r.data === state.today ? "today" : ""}">${esc(dayLabel(r.data))}</span>${del}</div></article>`;
  }).join("") : `<div class="empty">${EMPTY_IC}<b>Nenhuma tarefa lançada por este celular</b>Escolha a data e o tópico, descreva a atividade e toque em Enviar. Ela aparece no painel da TV na hora.</div>`;
}

/* ---------- painel: grade Tópico × Dias (hoje e os próximos 2 dias) ---------- */
const BOARD_DAYS = 3;
function boardDays(){ const s = addDays(state.today, state.dayOffset*BOARD_DAYS); return Array.from({length:BOARD_DAYS}, (_,i) => addDays(s,i)); }
function renderBoard(){
  const days = boardDays(), rows = state.board, last = days[days.length-1];
  $("pTitle").innerHTML = `${state.dayOffset === 0 ? "Hoje e próximos 2 dias" : "Dias"} <span>${ddmm(days[0])} a ${ddmm(last)}</span>`;
  const today = rows.filter(r => r.data === state.today);
  $("kAll").textContent = today.length;
  const byTopic = {}; today.forEach(r => byTopic[r.topico] = (byTopic[r.topico]||0)+1);
  $("kArea").textContent = Object.keys(byTopic).length;
  const present = TOPICS.filter(t => byTopic[t.k]);   // só os riscos lançados hoje: economiza espaço na TV
  $("heat").innerHTML = present.length ? present.map(t => `<span class="ht on">${t.i}${t.n} <b>${byTopic[t.k]}</b></span>`).join("") : `<span class="none">Nenhum risco lançado para hoje.</span>`;

  const grid = {}; rows.forEach(r => { const k = (TMAP[r.topico] ? r.topico : "outros") + "|" + r.data; (grid[k] ||= []).push(r); });
  const head = `<colgroup><col class="c-area">${days.map(() => "<col>").join("")}</colgroup>
    <thead><tr><th class="area">Tópicos</th>${days.map(d => `<th class="${d === state.today ? "today" : ""}"><span class="d">${d === state.today ? "Hoje" : DIAS3[dowOf(d)]}</span><span class="s">${ddmm(d)}</span></th>`).join("")}</tr></thead>`;
  const body = TOPICS.map(t => `<tr><th class="area" scope="row"><span class="tlab">${t.i}<span>${t.n}</span></span></th>${days.map(d => {
      const items = (grid[t.k+"|"+d] || []).sort(sortRows);
      const cls = `cell${d === state.today ? " today" : ""}${d < state.today ? " past" : ""}`;
      return `<td class="${cls}">${items.map(r => `<div class="task ed" data-id="${r.id}" title="Toque para editar"><span class="x">${esc(r.atividade)}</span>${r.topico === "outros" && r.topicoOutro ? `<span class="m">${esc(r.topicoOutro)}</span>` : ""}</div>`).join("")}</td>`;
    }).join("")}</tr>`).join("");
  $("mx").innerHTML = head + `<tbody>${body}</tbody>`;
}

let refreshing = null;
async function refresh(){
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const days = boardDays();
      const kFrom = addDays(state.today, -(state.kDays-1));
      const [board, mine, krows] = await Promise.all([api.range(days[0], days[days.length-1]), api.mine(state.today), api.range(kFrom, state.today)]);
      state.board = board; state.mine = mine; state.krows = krows;
      setLive(true, DEMO ? "Demonstração" : "Ao vivo");
    } catch(_) { setLive(false, "Sem conexão"); }
    renderMine(); renderBoard(); renderKpi();
  })();
  try { await refreshing; } finally { refreshing = null; }
}

/* ---------- editar / excluir ---------- */
const findRow = (id) => [...state.board, ...state.mine, ...state.krows].find(r => r.id === id);
$("edTopico").innerHTML = TOPICS.map(t => `<option value="${t.k}">${t.n}</option>`).join("");
$("edTopico").addEventListener("change", () => { $("edOutroBox").hidden = $("edTopico").value !== "outros"; });
let edRow = null, edMine = false, delArmed = false;
const PIN_KEY = "tmrd.pin";
const getPin = () => { try { return sessionStorage.getItem(PIN_KEY) || ""; } catch(_) { return ""; } };
const setPin = (p) => { try { p ? sessionStorage.setItem(PIN_KEY, p) : sessionStorage.removeItem(PIN_KEY); } catch(_){} };
function openEdit(id){
  const r = findRow(id); if (!r) return;
  edRow = r; delArmed = false;
  edMine = r.deviceId === DEVICE && r.data >= addDays(state.today, -1);
  $("edData").value = r.data; $("edTopico").value = TMAP[r.topico] ? r.topico : "outros";
  $("edOutro").value = r.topicoOutro || ""; $("edOutroBox").hidden = $("edTopico").value !== "outros";
  $("edAtiv").value = r.atividade; $("edPin").value = getPin(); $("edErr").textContent = "";
  $("edPinBox").hidden = edMine;
  $("edDel").textContent = "Excluir"; $("edDel").classList.remove("confirm");
  $("edModal").hidden = false; $("edAtiv").focus();
}
const closeEdit = () => { $("edModal").hidden = true; edRow = null; };
$("edClose").addEventListener("click", closeEdit);
$("edModal").addEventListener("click", e => { if (e.target === $("edModal")) closeEdit(); });
const edError = (x) => { const m = String(x?.message || x || ""); return /PIN/i.test(m) ? "PIN incorreto." : m || "Não foi possível salvar. Tente de novo."; };
$("edForm").addEventListener("submit", async e => {
  e.preventDefault(); if (!edRow) return;
  const atividade = $("edAtiv").value.trim(), topico = $("edTopico").value, pin = edMine ? "" : $("edPin").value.trim();
  if (!$("edData").value) { $("edErr").textContent = "Informe a data."; return; }
  if (!atividade) { $("edErr").textContent = "Descreva a atividade."; return; }
  if (!edMine && !pin) { $("edErr").textContent = "Digite o PIN do administrador."; $("edPin").focus(); return; }
  $("edSave").disabled = true;
  try {
    await api.edit({ ...edRow, data: $("edData").value, topico, topicoOutro: topico === "outros" ? $("edOutro").value.trim() : "", atividade }, pin);
    if (pin) setPin(pin);
    closeEdit(); toast("Tarefa atualizada"); refresh();
  } catch (x) { $("edErr").textContent = edError(x); if (/PIN/i.test(String(x?.message))) setPin(""); }
  finally { $("edSave").disabled = false; }
});
$("edDel").addEventListener("click", async () => {
  if (!edRow) return;
  const pin = edMine ? "" : $("edPin").value.trim();
  if (!edMine && !pin) { $("edErr").textContent = "Digite o PIN do administrador."; $("edPin").focus(); return; }
  if (!delArmed) { delArmed = true; $("edDel").textContent = "Confirmar exclusão"; $("edDel").classList.add("confirm"); return; }
  $("edDel").disabled = true;
  try {
    edMine ? await api.remove(edRow.id) : await api.removeAdmin(edRow.id, pin);
    if (pin) setPin(pin);
    closeEdit(); toast("Tarefa excluída"); refresh();
  } catch (x) { $("edErr").textContent = edError(x); }
  finally { $("edDel").disabled = false; }
});
document.addEventListener("click", e => {
  const t = e.target.closest(".task.ed"); if (!t || document.body.classList.contains("tv")) return;
  openEdit(t.dataset.id);
});

document.addEventListener("click", async e => {
  const b = e.target.closest(".mini"); if (!b) return;
  const a = b.dataset.a, id = b.dataset.id;
  if (a === "edit") { openEdit(id); return; }
  if (a === "ask") { state.confirmDel = id; renderMine(); return; }
  if (a === "nodel") { state.confirmDel = null; renderMine(); return; }
  if (a === "del") {
    state.confirmDel = null;
    try { await api.remove(id); toast("Tarefa excluída"); refresh(); }
    catch (x) { toast("Não foi possível excluir: " + (x?.message || "tente de novo"), true); renderMine(); }
  }
});

/* ---------- navegação ---------- */
function show(v){
  const tv = v === "tv"; const view = tv ? "painel" : v;
  document.body.classList.toggle("tv", tv);
  if (tv && state.dayOffset !== 0) { state.dayOffset = 0; refresh(); }
  $("v-lancar").hidden = view !== "lancar"; $("v-painel").hidden = view !== "painel"; $("v-indicadores").hidden = view !== "indicadores";
  document.querySelectorAll(".tab").forEach(t => t.setAttribute("aria-selected", t.dataset.v === view));
  if (tv) keepAwake();
}
function route(){ const h = location.hash.slice(1); show(["lancar","painel","tv","indicadores"].includes(h) ? h : (innerWidth >= 1000 ? "painel" : "lancar")); }
document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => { location.hash = t.dataset.v; }));
$("tvOn").addEventListener("click", () => { location.hash = "tv"; document.documentElement.requestFullscreen?.().catch(()=>{}); });
$("tvOff").addEventListener("click", () => { location.hash = "painel"; if (document.fullscreenElement) document.exitFullscreen().catch(()=>{}); });
$("wPrev").addEventListener("click", () => { state.dayOffset--; refresh(); });
$("wNext").addEventListener("click", () => { state.dayOffset++; refresh(); });
$("wToday").addEventListener("click", () => { state.dayOffset = 0; refresh(); });
addEventListener("hashchange", route);
let lock = null;
async function keepAwake(){ try { if (!lock && navigator.wakeLock) { lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => lock = null); } } catch(_){} }
document.addEventListener("visibilitychange", () => { if (!document.hidden) { refresh(); if (document.body.classList.contains("tv")) keepAwake(); } });

/* ---------- exportar no formato da planilha: Tópicos na coluna A, um dia por coluna ---------- */
$("csv").addEventListener("click", () => {
  const days = boardDays(), q = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const grid = {}; state.board.forEach(r => { const k = (TMAP[r.topico] ? r.topico : "outros")+"|"+r.data; (grid[k] ||= []).push(r); });
  const lines = [["Tópicos", ...days.map(d => `${DIAS3[dowOf(d)]} ${fmtDate(d)}`)].map(q).join(";")];
  TOPICS.forEach(t => lines.push([t.n, ...days.map(d => (grid[t.k+"|"+d] || []).sort(sortRows).map(r => r.atividade).join("\n"))].map(q).join(";")));
  const blob = new Blob(["﻿" + lines.join("\r\n")], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `TMRD_${days[0]}_a_${days[days.length-1]}.csv`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
});

/* ---------- instalar como app ---------- */
let deferredPrompt = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; $("install").hidden = false; });
$("installBtn").addEventListener("click", async () => {
  if (deferredPrompt) { deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $("install").hidden = true; }
});
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (isIOS && !standalone && !store.get("tmrd.iosHint")) { $("iosHint").hidden = false; }
$("iosClose").addEventListener("click", () => { $("iosHint").hidden = true; store.set("tmrd.iosHint","1"); });
/* ---------- atualização automática: TV, notebook e celular pegam a versão nova sozinhos ---------- */
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  let ctrl = navigator.serviceWorker.controller, reloaded = false;   // na 1ª instalação não recarrega; nas trocas de versão, sim
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (ctrl && !reloaded) { reloaded = true; location.reload(); }
    ctrl = navigator.serviceWorker.controller;
  });
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(reg => {
    const check = () => reg.update().catch(()=>{});
    setInterval(check, 5*60*1000);   // a TV fica aberta o dia todo: procura versão nova a cada 5 min
    document.addEventListener("visibilitychange", () => { if (!document.hidden) check(); });
  }).catch(()=>{});
}

/* ---------- indicadores ---------- */
$("kRange").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  state.kDays = +b.dataset.r;
  $("kRange").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
  refresh();
});
const pct = (n) => `${Math.round(n*100)}%`;
const tone = (p) => p >= .9 ? "good" : p >= .7 ? "warn" : "bad";
function renderKpi(){
  const N = state.kDays, from = addDays(state.today, -(N-1));
  const rows = state.krows.filter(r => r.data >= from && r.data <= state.today);
  const days = Array.from({length:N}, (_,i) => addDays(from, i));
  $("kPeriod").textContent = `${ddmm(from)} a ${ddmm(state.today)}`;
  const isUtil = (d) => { const w = dowOf(d); return w >= 1 && w <= 5; };

  // hoje
  const hoje = rows.filter(r => r.data === state.today);
  $("iAdHoje").textContent = hoje.length;
  $("iAdHoje").className = "v " + (hoje.length ? "good" : "bad");
  $("iAdHojeH").textContent = hoje.length ? `${new Set(hoje.map(r => r.topico)).size} tópico(s) de risco` : "nenhuma TMRD registrada ainda";
  $("iPend").innerHTML = hoje.length
    ? hoje.sort(sortRows).map(r => `<span class="ok">${esc((TMAP[r.topico]?.n || "Outros"))}: ${esc(r.atividade)}</span>`).join("")
    : `<span>Nenhuma TMRD registrada hoje</span>`;

  // dias úteis com registro (adesão), contados a partir do primeiro registro
  const first = rows.reduce((m,r) => r.data < m ? r.data : m, state.today);
  const uteis = days.filter(d => d >= first && isUtil(d));
  const comReg = new Set(rows.map(r => r.data));
  const feitos = uteis.filter(d => comReg.has(d)).length;
  const pAd = uteis.length ? feitos/uteis.length : 0;
  $("iAdPer").textContent = uteis.length ? pct(pAd) : "—"; $("iAdPer").className = "v " + tone(pAd);
  $("iAdPerH").textContent = `${feitos} de ${uteis.length} dias úteis com TMRD`;

  // volume
  const NA = Math.max(1, days.filter(d => d >= first).length);
  $("iTot").textContent = rows.length;
  $("iMedia").textContent = `média de ${(rows.length/Math.max(1,uteis.length)).toFixed(1).replace(".",",")} por dia útil`;

  // dias úteis sem registro
  const sem = uteis.filter(d => !comReg.has(d) && d < state.today).reverse();
  $("iAreas").innerHTML = sem.length
    ? `<div class="pend">${sem.slice(0,40).map(d => `<span>${DIAS3[dowOf(d)]} ${ddmm(d)}</span>`).join("")}</div>`
    : `<div class="pend"><span class="ok">Todos os dias úteis do período tiveram TMRD</span></div>`;

  // tópicos
  const byT = {}; rows.forEach(r => byT[r.topico] = (byT[r.topico]||0) + 1);
  const tops = Object.entries(byT).sort((a,b) => b[1]-a[1]); const mx = Math.max(1, ...tops.map(t => t[1]));
  $("iTop").innerHTML = tops.length ? tops.map(([k,n]) => `<div class="hb"><span class="nm">${esc(TMAP[k]?.n || k)}</span><span class="tr"><i style="width:${n/mx*100}%"></i></span><span class="ct">${n}</span></div>`).join("") : `<div class="kempty">Sem tarefas no período.</div>`;

  // tendência diária (colunas)
  const perDay = days.map(d => rows.filter(r => r.data === d).length);
  const top = Math.max(4, ...perDay), W = 1000, H = 180, padL = 28, padB = 22, padT = 10;
  const cw = (W - padL - 6) / N, sy = (v) => H - padB - (v/top)*(H - padB - padT);
  const ticks = [0, Math.round(top/2), top];
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tarefas por dia">`;
  ticks.forEach(t => { svg += `<line x1="${padL}" x2="${W}" y1="${sy(t)}" y2="${sy(t)}" stroke="var(--line)" stroke-width="1"/><text x="${padL-6}" y="${sy(t)+3}" text-anchor="end">${t}</text>`; });
  const step = N <= 7 ? 1 : N <= 30 ? 5 : 15;
  perDay.forEach((v,i) => {
    const x = padL + i*cw + cw*.15, w = cw*.7, isT = days[i] === state.today;
    if (v) svg += `<rect x="${x.toFixed(1)}" y="${sy(v).toFixed(1)}" width="${w.toFixed(1)}" height="${(H-padB-sy(v)).toFixed(1)}" rx="2" fill="${isT ? "var(--blue-txt)" : "var(--blue)"}"><title>${ddmm(days[i])}: ${v}</title></rect>`;
    if (i % step === 0 || isT) svg += `<text x="${(x+w/2).toFixed(1)}" y="${H-6}" text-anchor="middle">${ddmm(days[i])}</text>`;
  });
  $("iTrend").innerHTML = svg + "</svg>";
}

/* ---------- backup: histórico completo em CSV (abre no Excel) ---------- */
const BKP_KEY = "tmrd.lastBackup";
function paintBkp(){
  let last = null; try { last = localStorage.getItem(BKP_KEY); } catch(_){}
  const el = $("bkpInfo");
  if (!last) { el.textContent = "Nenhum download do histórico feito neste aparelho. Recomendado: baixar uma vez por mês."; el.className = "bkpinfo warn"; return; }
  const dias = Math.floor((Date.now() - new Date(last).getTime()) / 864e5);
  el.textContent = `Último download do histórico neste aparelho: ${new Date(last).toLocaleDateString("pt-BR")} (${dias === 0 ? "hoje" : dias + " dia(s) atrás"}).`;
  el.className = "bkpinfo" + (dias > 30 ? " warn" : "");
}
$("bkp").addEventListener("click", async () => {
  const b = $("bkp"); b.disabled = true; const old = b.lastChild.textContent; b.lastChild.textContent = "Preparando…";
  try {
    const rows = await api.all();
    const q = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const head = ["Data","Dia da semana","Tópico","Atividade","Registrado em","Origem","ID"];
    const lines = [head.map(q).join(";"), ...rows.map(r => [fmtDate(r.data), DIAS[dowOf(r.data)], topicLabel(r), r.atividade, r.criadoEm ? new Date(r.criadoEm).toLocaleString("pt-BR") : "", r.deviceId ? "app" : "importação", r.id].map(q).join(";"))];
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], {type:"text/csv;charset=utf-8"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `TMRD_historico_completo_${state.today}.csv`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    try { localStorage.setItem(BKP_KEY, new Date().toISOString()); } catch(_){}
    paintBkp(); toast(`${rows.length} tarefas baixadas`);
  } catch (x) { toast("Não foi possível baixar: " + (x?.message || "sem conexão"), true); }
  finally { b.disabled = false; b.lastChild.textContent = old; }
});
paintBkp();

/* ---------- QR Code: abre direto a tela de lançar ---------- */
const LAUNCH_URL = location.pathname === "/" ? location.origin : location.origin + location.pathname;   // curto = QR com quadrados maiores; no celular o app já abre na tela de lançar
function qrSvg(text){
  if (!window.qrcode) return '<div style="color:#000;font-size:11px;display:grid;place-items:center;height:100%;text-align:center">QR indisponível sem internet</div>';
  const q = qrcode(0, "M"); q.addData(text); q.make();
  const n = q.getModuleCount(); let p = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {   // um retângulo por sequência escura: sem frestas entre os quadrados na TV
    if (!q.isDark(r, c)) continue;
    let w = 1; while (c + w < n && q.isDark(r, c + w)) w++;
    p += `M${c},${r}h${w}v1h-${w}z`; c += w - 1;
  }
  const z = 4; // margem branca obrigatória para leitura
  return `<svg viewBox="${-z} ${-z} ${n+2*z} ${n+2*z}" shape-rendering="crispEdges" role="img" aria-label="QR Code do TMRD"><rect x="${-z}" y="${-z}" width="${n+2*z}" height="${n+2*z}" fill="#fff"/><path d="${p}" fill="#000"/></svg>`;
}
$("qrSmall").innerHTML = qrSvg(LAUNCH_URL);
$("qrBig").innerHTML = qrSvg(LAUNCH_URL);
$("qrUrl").textContent = LAUNCH_URL; $("qrHost").textContent = location.host;
$("qrOpen").addEventListener("click", () => { $("qrModal").hidden = false; $("qrClose").focus(); });
$("qrClose").addEventListener("click", () => { $("qrModal").hidden = true; });
$("qrModal").addEventListener("click", e => { if (e.target === $("qrModal")) $("qrModal").hidden = true; });
addEventListener("keydown", e => { if (e.key === "Escape") { $("qrModal").hidden = true; closeEdit(); } });
$("qrPrint").addEventListener("click", () => window.print());
$("qrCopy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(LAUNCH_URL); toast("Link copiado"); }
  catch(_) { const r = document.createRange(); r.selectNodeContents($("qrUrl")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Selecione e copie o link", true); }
});

function setLive(on, txt){ $("live").classList.toggle("on", on); $("liveTxt").textContent = txt; }

/* ---------- dados de exemplo (só no modo demonstração) ---------- */
function seedDemo(){
  const t = state.today, iso = new Date().toISOString();
  const mk = (o) => ({ id: uuid(), criadoEm: iso, topicoOutro:"", local:"", inicio:"", fim:"", turno:"", controles:[], deviceId:"exemplo", responsavel:"", ...o });
  state.demo = [
    mk({ data:t, topico:"logistica", atividade:"Armazém operando acima de 95% de ocupação", turno:"2º" }),
    mk({ data:t, topico:"quente", atividade:"Solda em suporte da esteira de paletes", local:"Linha 2", inicio:"16:30", fim:"18:00" }),
    mk({ data:t, topico:"energias", atividade:"Intervenção no painel elétrico do compressor", inicio:"19:00" }),
    mk({ data:addDays(t,1), topico:"altura", atividade:"Troca de luminária no mezanino", local:"Mezanino doca 4" }),
    mk({ data:addDays(t,1), topico:"icamento", atividade:"Içamento de bobina com ponte rolante" }),
    mk({ data:addDays(t,2), topico:"confinado", atividade:"Limpeza interna do tanque de lavagem" }),
    mk({ data:addDays(t,4), topico:"terceiros", atividade:"Pintura do piso da expedição por empresa contratada" }),
  ];
}

/* ---------- banner fixo: reserva a altura certa abaixo dele ---------- */
const topEl = document.querySelector(".top");
const fitTop = () => document.documentElement.style.setProperty("--hh", topEl.offsetHeight + "px");
fitTop(); addEventListener("resize", fitTop); new ResizeObserver(fitTop).observe(topEl);

/* ---------- início ---------- */
async function boot(){
  tick(); setInterval(tick, 15000); route(); paintPending();
  if (DEMO) {
    $("dbNotice").hidden = false;
    $("dbNotice").innerHTML = "<strong>Modo demonstração.</strong> As tarefas abaixo são exemplos e nada é gravado. Preencha <code>config.js</code> com a URL e a chave do Supabase para ligar o banco.";
    seedDemo(); await refresh(); return;
  }
  state.sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession:false } });
  await refresh();
  state.sb.channel("tmrd-live")
    .on("postgres_changes", { event:"*", schema:"public", table:TABLE }, () => refresh())
    .subscribe(s => { if (s === "SUBSCRIBED") setLive(true, "Ao vivo"); else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT") setLive(false, "Reconectando"); });
  setInterval(refresh, 60000);          // rede de segurança caso o tempo real caia
  addEventListener("online", flushOutbox); flushOutbox();
}
boot();
})();
