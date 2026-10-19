(() => {
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const CATS = {
  food: { name: "Food", icon: "i-burger", cls: "food" },
  supplies: { name: "Supplies", icon: "i-backpack", cls: "supplies" },
  errands: { name: "Errands", icon: "i-run", cls: "errands" },
  printing: { name: "Printing", icon: "i-printer", cls: "printing" },
};
const CATALOG = [
  { name: "Lechon Manok (whole)", cat: "food", price: 120, shop: "Bam-Bam's Canteen" },
  { name: "Rice Meal Combo", cat: "food", price: 85, shop: "Bam-Bam's Canteen" },
  { name: "Iced Latte", cat: "food", price: 95, shop: "Xavier Cafe" },
  { name: "Pork Siomai (5 pcs)", cat: "food", price: 60, shop: "Knights Food Court" },
  { name: "Notebook & Pens Set", cat: "supplies", price: 75, shop: "ADNU Bookstore" },
  { name: "Bond Paper (A4, 100s)", cat: "supplies", price: 95, shop: "ADNU Bookstore" },
  { name: "Blue Book", cat: "supplies", price: 35, shop: "ADNU Bookstore" },
  { name: "Photocopy (10 pages)", cat: "printing", price: 20, shop: "Print Hub, Phelan" },
  { name: "Thesis Printing (colored)", cat: "printing", price: 150, shop: "Print Hub, Phelan" },
  { name: "Lamination (A4)", cat: "printing", price: 40, shop: "Print Hub, Phelan" },
  { name: "Claim documents", cat: "errands", price: null, shop: "Registrar's Office" },
  { name: "Buy medicine", cat: "errands", price: null, shop: "University Clinic" },
  { name: "Pick up parcel", cat: "errands", price: null, shop: "LBC Naga" },
];
const STAGES = [
  { label: "Request posted", sub: "We received your request" },
  { label: "Courier accepted", sub: "{courier} will pick up your order" },
  { label: "Picked up", sub: "On the way to the drop-off point" },
  { label: "On the way", sub: "Heading to {dropoff}" },
  { label: "Arriving soon", sub: "Courier is near the drop-off point" },
  { label: "Delivered", sub: "Enjoy! Please rate your courier" },
];
const STAGE_STATUS = ["finding", "accepted", "picked", "on_way", "arriving", "delivered"];
const STATUS_UI = {
  finding: { label: "Finding a courier…", cls: "st-finding", icon: null },
  accepted: { label: "Courier accepted", cls: "st-accepted", icon: "i-run" },
  picked: { label: "Picking up your order", cls: "st-onway", icon: "i-box" },
  on_way: { label: "On the way", cls: "st-onway", icon: "i-run" },
  arriving: { label: "Arriving soon", cls: "st-onway", icon: "i-run" },
  delivered: { label: "Delivered", cls: "st-delivered", icon: "i-check-c" },
  cancelled: { label: "Cancelled", cls: "st-cancelled", icon: "i-x-c" },
};
const TIME_OPTIONS = ["ASAP (30–45 min)", "Today, 6:00pm – 6:30pm", "Tomorrow, 9:00am – 9:30am"];
const COURIER = { name: "Juan Dela Cruz", initials: "JD", rating: "4.9", deliveries: "1,248", vehicle: "Honda Click · MC 4821" };
const FEE_BASE = { food: 25, supplies: 20, errands: 30, printing: 15 };
const FAQS = [
  { q: "How are delivery fees computed?", a: "Base fees depend on category — Printing ₱15, Supplies ₱20, Food ₱25, Errands ₱30. Express delivery adds ₱15. You always see the estimate before posting." },
  { q: "What is the delivery PIN for?", a: "Every request gets a 4-digit PIN. Your courier asks for it at handoff, so only you can confirm the drop-off. Keep it private until the items are in your hands." },
  { q: "Can I cancel a request?", a: "Yes — free of charge while we're finding a courier or before pickup. Once your courier is on the way, contact support and we'll help sort it out." },
  { q: "How do refunds work?", a: "If a request is cancelled or fails, digital payments (GCash / Maya) are refunded within 24 hours. Cash on Delivery orders are never charged until handoff." },
  { q: "Where do couriers pick up from?", a: "Popular campus spots: Bam-Bam's Canteen, Xavier Cafe, ADNU Bookstore, Print Hub at Phelan, the Registrar, University Clinic and LBC Naga." },
];
const PAGES = {
  home: { t: "Home", s: "Get it. Delivered on campus." },
  create: { t: "Create Request", s: "Tell us what you need — a Knight will handle it." },
  requests: { t: "My Requests", s: "Everything you've asked for, in one place." },
  activity: { t: "Activity", s: "Your spending and delivery history." },
  tracking: { t: "Live Tracking", s: "Follow your courier step by step — no map needed." },
  profile: { t: "Profile", s: "Your account, payments and preferences." },
};

let nid = 100;
let uid = 2425;
const now = () => new Date();
const fmtT = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const fmtDT = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + fmtT(d);
const money = (n) => "₱" + Number(n).toLocaleString("en-US");
const firstWord = (n) => (n || "Knight").trim().split(/\s+/)[0];
const initials = (n) => (n || "KK").trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

const DEFAULTS = () => ({
  user: { fullName: "Jude Jude", first: "Jude", email: "jude@adnu.edu.ph", sid: "2023-10482", phone: "+63 917 555 4821" },
  dark: false,
  push: true,
  orderUpdates: true,
  loggedIn: false,
  draft: null,
  reqTab: "ongoing",
  actTab: "all",
  watchOrderId: null,
  pinHidden: true,
  promoDismissed: false,
  chatMode: "courier",
  supportMsgs: [
    { from: "them", text: "Hi! You're chatting with Knight Support. How can we help you today?", time: "9:38 AM" },
  ],
  chat: [
    { from: "them", text: "Hi! This is Juan, your Knights courier. I'll pick up your order shortly.", time: "3:54 PM" },
    { from: "them", text: "I'm near Phelan, going up to the 2nd floor!", time: "4:01 PM" },
  ],
  chatTyping: false,
  searchHistory: ["lechon manok", "notebook", "photocopy"],
  addresses: [
    { t: "Phelan P217 Lab (2nd Floor)", s: "College of Computer Studies", def: true },
    { t: "Library 3rd Floor", s: "Learning Commons" },
    { t: "Xavier Hall Lobby", s: "Ground Floor" },
  ],
  defaultPayment: "GCash",
  notifs: [
    { id: nid++, type: "order", title: "Your Photocopy (PT) is on the way", body: "Juan Dela Cruz is heading to Phelan P217 Lab.", time: "2m ago", read: false, action: { screen: "tracking", orderId: "KD-2419" } },
    { id: nid++, type: "chat", title: "New message from Juan Dela Cruz", body: "I'm near Phelan, going up to the 2nd floor!", time: "5m ago", read: false, action: { chat: true } },
    { id: nid++, type: "promo", title: "20% off printing this week", body: "Use code KNIGHT20 at Print Hub, Phelan.", time: "1h ago", read: true, action: { create: "printing" } },
    { id: nid++, type: "ok", title: "Bam-Bam's Order was delivered", body: "Rate Juan Dela Cruz — how did it go?", time: "Sep 24", read: true, action: { orderId: "KD-2402" } },
    { id: nid++, type: "promo", title: "Free delivery on your first request", body: "Use code KNIGHT1 anytime this month.", time: "Sep 23", read: true, action: { create: null } },
  ],
  orders: [
    {
      id: "KD-2419", title: "Photocopy (PT)", cat: "printing", items: "Photocopy 10 pages (long bond), back-to-back",
      dropoff: "Phelan P217 Lab (2nd Floor)", time: "Today, 3:30pm – 4:00pm", notes: "Please staple per chapter. Thanks!",
      createdTs: Date.now() - 42 * 60000, created: "Sep 24, 3:49 PM", status: "on_way", stage: 3,
      courier: COURIER.name, etaMin: 12, fee: 25, itemCost: 20, tip: 0, payment: "GCash", paid: true,
      rated: false, express: false, pin: "4821",
      times: ["3:52 PM", "3:54 PM", "4:02 PM", "4:05 PM"],
      updates: ["Courier picked up your photocopy at Print Hub", "Passing by Xavier Hall", "Heading to Phelan P217 Lab"],
    },
    {
      id: "KD-2402", title: "Bam-Bam's Order", cat: "food", items: "1 whole lechon manok, 2 rice, 1 Coke",
      dropoff: "Library 3rd Floor", time: "Today, 11:45am – 12:15pm", notes: "",
      createdTs: Date.now() - 26 * 3600000, created: "Sep 24, 11:52 AM", status: "delivered", stage: 5,
      courier: COURIER.name, etaMin: 0, fee: 30, itemCost: 275, tip: 20, payment: "GCash", paid: true,
      rated: true, express: false, pin: "7302",
      times: ["11:52 AM", "11:54 AM", "12:02 PM", "12:06 PM", "12:12 PM", "12:14 PM"],
      updates: ["Delivered to Library 3rd Floor", "Signed by: Jude J."],
    },
    {
      id: "KD-2381", title: "Notebook & Pens", cat: "supplies", items: "1 notebook, 1 black pen, 1 yellow pad",
      dropoff: "Phelan P217 Lab (2nd Floor)", time: "Today, 4:45pm – 5:15pm", notes: "",
      createdTs: Date.now() - 50 * 3600000, created: "Sep 23, 5:11 PM", status: "delivered", stage: 5,
      courier: COURIER.name, etaMin: 0, fee: 20, itemCost: 110, tip: 0, payment: "Cash on Delivery", paid: true,
      rated: true, express: false, pin: "9117",
      times: ["5:11 PM", "5:13 PM", "5:20 PM", "5:24 PM", "5:29 PM", "5:31 PM"],
      updates: ["Delivered to Phelan P217 Lab"],
    },
    {
      id: "KD-2350", title: "Printing (PT)", cat: "printing", items: "Thesis Chapter 2 printing (10 pages, colored cover)",
      dropoff: "Phelan P217 Lab (2nd Floor)", time: "Today, 1:20pm – 1:50pm", notes: "Rush please!",
      createdTs: Date.now() - 74 * 3600000, created: "Sep 20, 1:43 PM", status: "delivered", stage: 5,
      courier: COURIER.name, etaMin: 0, fee: 15, itemCost: 85, tip: 10, payment: "GCash", paid: true,
      rated: true, express: true, pin: "5518",
      times: ["1:43 PM", "1:44 PM", "1:49 PM", "1:52 PM", "1:56 PM", "1:58 PM"],
      updates: ["Delivered to Phelan P217 Lab"],
    },
    {
      id: "KD-2327", title: "Bam-Bam's Order", cat: "food", items: "1 lechon manok, 1 rice",
      dropoff: "Xavier Hall Lobby", time: "Today, 2:00pm – 2:30pm", notes: "",
      createdTs: Date.now() - 98 * 3600000, created: "Sep 19, 2:14 PM", status: "delivered", stage: 5,
      courier: COURIER.name, etaMin: 0, fee: 30, itemCost: 155, tip: 0, payment: "Cash on Delivery", paid: true,
      rated: false, express: false, pin: "2083",
      times: ["2:14 PM", "2:16 PM", "2:24 PM", "2:28 PM", "2:33 PM", "2:35 PM"],
      updates: ["Delivered to Xavier Hall Lobby"],
    },
    {
      id: "KD-2301", title: "Book Return — Library", cat: "errands", items: "Return 2 borrowed books to the library drop box",
      dropoff: "Library Circulation Desk", time: "Today, 10:00am – 10:30am", notes: "",
      createdTs: Date.now() - 122 * 3600000, created: "Sep 18, 10:02 AM", status: "cancelled", stage: 0,
      courier: null, etaMin: 0, fee: 30, itemCost: 0, tip: 0, payment: "GCash", paid: false,
      rated: false, express: false, pin: "0000", cancelReason: "Taking too long",
      times: ["10:02 AM"],
      updates: ["Request cancelled"],
    },
  ],
});

let state = DEFAULTS();
let page = "home";
let toastTimer = null;
let panelOpen = false;
let searchOpen = false;
let callTimerInt = null;
let rateDraft = { stars: 0, tip: 0, tags: [], orderId: null };
let tipPick = 0;
let cancelId = null;
let cancelReason = "";

function orderById(id) { return state.orders.find((o) => o.id === id); }
const ongoing = () => state.orders.filter((o) => o.stage < 5 && o.status !== "cancelled");
const activeOngoing = () => ongoing().sort((a, b) => a.stage - b.stage)[0];
const statusUI = (o) => STATUS_UI[o.status] || STATUS_UI.finding;

function toast(msg, icon = "i-check-c") {
  const t = $("#toast");
  $("#toast-msg").textContent = msg;
  t.querySelector("use").setAttribute("href", "#" + icon);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function confetti() {
  const colors = ["#FFD333", "#4A44A8", "#241E6E", "#2E9E4F", "#F59E0B", "#8B2FC9"];
  const box = document.createElement("div");
  box.className = "confetti";
  for (let i = 0; i < 30; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
    p.style.animationDelay = Math.random() * 0.4 + "s";
    p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 3400);
}

function catTile(cat, size = 52) {
  const c = CATS[cat] || { icon: "i-box", cls: "neutral" };
  return '<div class="tile t-' + (CATS[cat] ? CATS[cat].cls : "neutral") + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + (size > 44 ? 16 : 13) + 'px"><svg width="' + Math.round(size / 2) + '" height="' + Math.round(size / 2) + '"><use href="#' + c.icon + '"/></svg></div>';
}
function statusHTML(o) {
  const ui = statusUI(o);
  const ico = ui.icon ? '<svg width="14" height="14"><use href="#' + ui.icon + '"/></svg>' : '<span class="pulse-dot"></span>';
  return '<div class="status tile-status ' + ui.cls + '">' + ico + esc(ui.label) + "</div>";
}
function drow(icon, label, val) {
  return '<div class="drow"><div class="dic"><svg width="19" height="19"><use href="#' + icon + '"/></svg></div><div class="dl"><small>' + label + "</small><b>" + esc(val) + "</b></div></div>";
}

function syncUser() {
  $("#sideAvatar").textContent = initials(state.user.fullName);
  $("#sideName").textContent = state.user.fullName;
}
function syncTheme() {
  document.body.classList.toggle("dark", state.dark);
  $("#themeToggle").innerHTML = '<svg width="18" height="18"><use href="#i-' + (state.dark ? "sun" : "moon") + '"/></svg><span id="themeLabel">' + (state.dark ? "Light mode" : "Dark mode") + "</span>";
  $$("[data-toggle]").forEach((t) => t.classList.toggle("on", !!state[t.dataset.toggle]));
}
function updateBells() {
  const unread = state.notifs.some((n) => !n.read);
  const b = $("#bellBtn");
  if (b) b.classList.toggle("hasnews", unread);
}
function updateSideCount() {
  const n = ongoing().length;
  const el = $("#sideCount");
  el.style.display = n ? "" : "none";
  el.textContent = n;
}

function renderNotifs() {
  const list = $("#notiflist");
  const map = { order: ["nic-order", "i-box"], promo: ["nic-promo", "i-gift"], chat: ["nic-chat", "i-chat"], ok: ["nic-ok", "i-check-c"] };
  list.innerHTML = state.notifs.map((n) => {
    const [c, i] = map[n.type] || map.order;
    return '<div class="notif ' + (n.read ? "" : "unread") + '" data-notif="' + n.id + '">' +
      '<div class="nic ' + c + '"><svg width="20" height="20"><use href="#' + i + '"/></svg></div>' +
      '<div><h4>' + esc(n.title) + "</h4><p>" + esc(n.body) + "</p><small>" + esc(n.time) + "</small></div>" +
      (n.read ? "" : '<span class="undot"></span>') + "</div>";
  }).join("") || '<div class="emptydesk" style="padding:30px 16px"><p>No notifications yet</p></div>';
  updateBells();
}
function addNotif(type, title, body, action = {}) {
  if (!state.orderUpdates) return;
  state.notifs.unshift({ id: nid++, type, title, body, time: "Just now", read: false, action });
  renderNotifs();
}
function toggleNotifPanel(force) {
  panelOpen = force !== undefined ? force : !panelOpen;
  $("#notifpanel").classList.toggle("open", panelOpen);
  if (panelOpen) renderNotifs();
}

function go(id) {
  if (!state.loggedIn || !PAGES[id]) return;
  page = id;
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + id));
  $$(".side-item").forEach((b) => b.classList.toggle("active", b.dataset.page === id));
  $("#pageTitle").textContent = PAGES[id].t;
  $("#pageSub").textContent = PAGES[id].s;
  $("#openSearch").style.display = id === "home" ? "" : "none";
  toggleNotifPanel(false);
  renderPage(id);
  updateSideCount();
  window.scrollTo({ top: 0 });
  try { history.replaceState(null, "", "#view=" + id); } catch (err) {}
}
function renderPage(id) {
  if (id === "home") renderHome();
  if (id === "create") renderCreate();
  if (id === "requests") renderRequests();
  if (id === "activity") renderActivity();
  if (id === "tracking") renderTracking();
  if (id === "profile") renderProfile();
}
function refreshAll() {
  renderNotifs();
  updateBells();
  updateSideCount();
  if (page !== "create") renderPage(page);
}

function listRowHTML(o) {
  const done = o.status === "delivered";
  const can = o.status === "cancelled";
  const ong = !done && !can;
  let acts = "";
  if (ong) acts = '<button class="minibtn" data-act="track" data-id="' + o.id + '">Track</button><button class="minibtn" data-act="chat">Chat</button>';
  else if (done) acts = '<button class="minibtn" data-act="receipt" data-id="' + o.id + '">Receipt</button><button class="minibtn" data-act="reorder" data-id="' + o.id + '">Re-order</button>';
  else acts = '<button class="minibtn" data-act="reorder" data-id="' + o.id + '">Re-order</button>';
  return '<div class="listrow" data-order="' + o.id + '">' + catTile(o.cat, 44) +
    '<div class="rmain"><h3 style="font-family:var(--font-display);font-size:15.5px;color:var(--ink)">' + esc(o.title) + "</h3>" + statusHTML(o) + "</div>" +
    '<div class="rdate">' + esc(o.created) + "</div>" +
    '<div class="row-actions">' + acts + "</div></div>";
}

function renderHome() {
  $("#homeGreet").innerHTML = "Hey " + esc(firstWord(state.user.first)) + ' <span style="font-size:26px">👋</span>';
  $("#homePromo").style.display = state.promoDismissed ? "none" : "flex";
  const rec = state.orders.slice().sort((a, b) => b.createdTs - a.createdTs).slice(0, 4);
  $("#recentList").innerHTML = rec.length ? rec.map(listRowHTML).join("") :
    '<div class="emptydesk" style="padding:34px 16px"><div class="esi"><svg width="32" height="32"><use href="#i-box"/></svg></div><h3>No orders yet</h3><p>Create your first request and it will show up here.</p></div>';
  renderLiveCard();
  updateBells();
  updateSideCount();
}

function renderLiveCard() {
  const host = $("#liveCard");
  const o = activeOngoing();
  if (!o) {
    host.innerHTML = '<div class="panel" style="text-align:center">' +
      '<div class="emptydesk" style="padding:26px 10px 20px"><div class="esi"><svg width="32" height="32"><use href="#i-run"/></svg></div><h3>No active delivery</h3><p>Create a request and track your courier here — live, no map needed.</p></div>' +
      '<button class="minibtn primary" data-act="goto-create" style="padding:12px 24px">Create Request</button></div>';
    return;
  }
  const pct = Math.round(o.stage / 5 * 100);
  host.innerHTML = '<div class="trackcard">' +
    '<div class="tk-top"><b>Live delivery</b><span class="livechip"><span class="pulse-dot"></span>LIVE</span></div>' +
    '<div class="tk-eta">~' + Math.max(o.etaMin, 1) + " min</div>" +
    '<div class="tk-sub">' + esc(o.title) + " → " + esc(o.dropoff) + "</div>" +
    '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
    '<div class="tk-courier"><div class="avatar">' + COURIER.initials + "</div><div><b>" + esc(COURIER.name) + "</b><small>★ " + COURIER.rating + " · " + esc(COURIER.vehicle) + "</small></div></div>" +
    '<div class="tk-btns"><button class="tk-main" data-act="track" data-id="' + o.id + '"><svg width="16" height="16"><use href="#i-run"/></svg>Track live</button>' +
    '<button class="tk-ghost" data-act="chat"><svg width="16" height="16"><use href="#i-chat"/></svg>Chat</button></div></div>';
}

function feeEstimate() {
  const d = state.draft || {};
  const base = FEE_BASE[d.cat] || 25;
  const lo = base - 5 + (d.express ? 15 : 0);
  const hi = base + 5 + (d.express ? 15 : 0);
  return lo < 10 ? "₱0 – ₱" + hi : "₱" + lo + " – ₱" + hi;
}
function renderCreate() {
  const d = state.draft;
  $$("#createCats .cat").forEach((c) => c.classList.toggle("sel", d.cat === c.dataset.cat));
  if (d.cat) {
    const c = CATS[d.cat];
    $("#cs-cattile").className = "tile t-" + c.cls;
    $("#cs-cattile").innerHTML = '<svg width="21" height="21"><use href="#' + c.icon + '"/></svg>';
    $("#cs-catlabel").textContent = c.name;
    $("#cs-catlabel").classList.remove("ph");
  } else {
    $("#cs-cattile").className = "tile t-neutral";
    $("#cs-cattile").innerHTML = '<svg width="21" height="21"><use href="#i-box"/></svg>';
    $("#cs-catlabel").textContent = "Select a category";
    $("#cs-catlabel").classList.add("ph");
  }
  $("#cs-items").value = d.items || "";
  $("#cs-drop").value = d.dropoff || "";
  $("#cs-notes").value = d.notes || "";
  $("#cs-timelabel").textContent = d.time || TIME_OPTIONS[1];
  $("#cs-express").classList.toggle("on", !!d.express);
  $("#cs-fee").textContent = feeEstimate();
  const pay = d.payment || state.defaultPayment;
  $$("#paySeg button").forEach((b) => b.classList.toggle("sel", b.dataset.pay === pay));
  $("#cs-dropchips").innerHTML = state.addresses.slice(0, 3).map((a) =>
    '<button class="chip-soft" data-addr="' + esc(a.t) + '"><svg width="12" height="12" style="vertical-align:-2px;color:var(--yellow-ink)"><use href="#i-pin"/></svg> ' + esc(a.t.split(" (")[0]) + "</button>").join("");
}
function resetCreate(keep = {}) {
  state.draft = Object.assign({
    cat: null, items: "", dropoff: "", notes: "", time: TIME_OPTIONS[1],
    payment: state.defaultPayment, express: false,
  }, keep);
}
function validateCreate() {
  let ok = true;
  const d = state.draft;
  const req = (cond, input, hint) => {
    const i = $(input), h = $(hint);
    if (i) i.classList.toggle("invalid", !cond);
    if (h) h.classList.toggle("show", !cond);
    if (!cond) ok = false;
  };
  req(!!d.items.trim(), "#cs-items", "#cs-items-hint");
  req(!!d.cat, "#cs-catbtn", "#cs-cat-hint");
  req(!!d.dropoff.trim(), "#cs-drop", "#cs-drop-hint");
  return ok;
}
function postRequest() {
  const d = state.draft;
  d.items = $("#cs-items").value.trim();
  d.dropoff = $("#cs-drop").value.trim();
  d.notes = $("#cs-notes").value.trim();
  if (!validateCreate()) { toast("Please complete the required fields", "i-alert"); return; }
  const id = "KD-" + (uid++);
  const o = {
    id, title: d.items.length > 26 ? d.items.slice(0, 26) + "…" : d.items, cat: d.cat, items: d.items,
    dropoff: d.dropoff, time: d.time, notes: d.notes,
    createdTs: Date.now(), created: fmtDT(now()), status: "finding", stage: 0,
    courier: null, etaMin: 25, fee: (FEE_BASE[d.cat] || 25) + (d.express ? 15 : 0),
    itemCost: { food: 120, supplies: 60, errands: 50, printing: 30 }[d.cat] || 0,
    tip: 0, payment: d.payment, paid: d.payment !== "Cash on Delivery", rated: false, express: !!d.express,
    pin: String(Math.floor(1000 + Math.random() * 9000)),
    times: [fmtT(now())], updates: ["Looking for a nearby Knights courier…"],
  };
  state.orders.unshift(o);
  state.watchOrderId = id;
  state.reqTab = "ongoing";
  resetCreate();
  toast("Request posted! Finding a courier nearby…", "i-spark");
  addNotif("order", "Request " + id + " posted", "We're matching you with a nearby Knights courier.", { screen: "requests" });
  go("requests");
  refreshAll();
}

function renderRequests() {
  const map = {
    ongoing: (o) => o.stage < 5 && o.status !== "cancelled",
    completed: (o) => o.status === "delivered",
    cancelled: (o) => o.status === "cancelled",
  };
  $$("#reqTabs .filterchip").forEach((c) => c.classList.toggle("active", c.dataset.tab === state.reqTab));
  const list = state.orders.filter(map[state.reqTab]).sort((a, b) => b.createdTs - a.createdTs);
  $("#reqList").innerHTML = list.length ? list.map(listRowHTML).join("") :
    '<div class="emptydesk"><div class="esi"><svg width="32" height="32"><use href="#i-box"/></svg></div><h3>Nothing here yet</h3><p>' +
    (state.reqTab === "ongoing" ? "Create a request and it will show up here." : "No " + state.reqTab + " orders.") + "</p>" +
    (state.reqTab === "ongoing" ? '<button class="minibtn primary" data-act="goto-create" style="padding:12px 24px">Create Request</button>' : "") + "</div>";
}

function renderActivity() {
  const delivered = state.orders.filter((o) => o.status === "delivered");
  const spent = delivered.reduce((s, o) => s + (o.itemCost || 0) + o.fee + (o.tip || 0), 0);
  const tips = delivered.reduce((s, o) => s + (o.tip || 0), 0);
  $("#statGrid").innerHTML =
    '<div class="statcard"><span class="sicon" style="background:var(--navy-tint);color:var(--navy-soft)"><svg width="22" height="22"><use href="#i-box"/></svg></span><div><b>' + state.orders.length + '</b><small>Orders</small></div></div>' +
    '<div class="statcard"><span class="sicon" style="background:var(--ok-bg);color:var(--ok)"><svg width="22" height="22"><use href="#i-check-c"/></svg></span><div><b>' + delivered.length + '</b><small>Delivered</small></div></div>' +
    '<div class="statcard"><span class="sicon" style="background:var(--yellow-pale);color:var(--yellow-ink)"><svg width="22" height="22"><use href="#i-wallet"/></svg></span><div><b>' + money(spent) + '</b><small>Spent</small></div></div>' +
    '<div class="statcard"><span class="sicon" style="background:var(--info-bg);color:var(--info)"><svg width="22" height="22"><use href="#i-cash"/></svg></span><div><b>' + money(tips) + '</b><small>Tips given</small></div></div>';
  renderChart(delivered);
  $$("#actTabs .filterchip").forEach((c) => c.classList.toggle("active", c.dataset.tab === state.actTab));
  const map = {
    all: () => true,
    ongoing: (o) => o.stage < 5 && o.status !== "cancelled",
    completed: (o) => o.status === "delivered",
    cancelled: (o) => o.status === "cancelled",
  };
  const list = state.orders.filter(map[state.actTab]).sort((a, b) => b.createdTs - a.createdTs);
  $("#actList").innerHTML = list.length ? list.map((o) => {
    const done = o.status === "delivered";
    const can = o.status === "cancelled";
    const total = (o.itemCost || 0) + o.fee + (o.tip || 0);
    const amt = done ? money(total) : can ? "—" : money(o.fee) + " est.";
    let acts = "";
    if (!done && !can) acts = '<button class="minibtn" data-act="track" data-id="' + o.id + '">Track</button>';
    else if (done) acts = '<button class="minibtn" data-act="receipt" data-id="' + o.id + '">Receipt</button>';
    else acts = '<button class="minibtn" data-act="reorder" data-id="' + o.id + '">Re-order</button>';
    return '<div class="trow" data-order="' + o.id + '">' +
      '<div class="tcell"><b>' + esc(o.title) + "</b><small>" + o.id + "</small></div>" +
      '<div class="tcell"><small>' + CATS[o.cat].name + "</small></div>" +
      '<div class="tcell">' + statusHTML(o) + "</div>" +
      '<div class="tcell"><small>' + esc(o.created) + "</small></div>" +
      '<div class="tcell"><span class="amount">' + amt + "</span></div>" +
      '<div class="row-actions">' + acts + "</div></div>";
  }).join("") : '<div class="emptydesk"><div class="esi"><svg width="32" height="32"><use href="#i-history"/></svg></div><h3>No orders here</h3><p>Your order history will appear in this list.</p></div>';
}
function renderChart(delivered) {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({ date: d, sum: 0 });
  }
  delivered.forEach((o) => {
    const d = new Date(o.createdTs);
    d.setHours(0, 0, 0, 0);
    const hit = days.find((x) => x.date.getTime() === d.getTime());
    if (hit) hit.sum += (o.itemCost || 0) + o.fee + (o.tip || 0);
  });
  const max = Math.max(...days.map((d) => d.sum), 1);
  const weekTotal = days.reduce((s, d) => s + d.sum, 0);
  const wkOrders = delivered.filter((o) => o.createdTs >= days[0].date.getTime()).length;
  const avg = wkOrders ? Math.round(weekTotal / wkOrders) : 0;
  $("#chartPanel").innerHTML = '<div class="barchart">' + days.map((d, i) => {
    const h = d.sum ? Math.max(9, Math.round(d.sum / max * 100)) : 4;
    const label = d.date.toLocaleDateString("en-US", { weekday: "short" });
    return '<div class="bar' + (i === 6 ? " today" : "") + '"><em>' + (d.sum ? "₱" + d.sum : "—") + "</em><i style=\"height:" + h + '%"></i><small>' + label + "</small></div>";
  }).join("") + "</div>" +
    '<div class="chartmeta"><h3>Spending this week</h3><div class="bigline">' + money(weekTotal) + "</div><p>" +
    (wkOrders ? "Across " + wkOrders + " delivered order" + (wkOrders > 1 ? "s" : "") + " — about " + money(avg) + " per order. Tips included." : "No delivered orders this week yet. Your future spending will show up here.") +
    "</p></div>";
}

function renderTracking() {
  let o = orderById(state.watchOrderId) || activeOngoing();
  if (!o) {
    $("#tr-hero").innerHTML = '<div class="emptydesk" style="padding:30px 16px 20px"><div class="esi"><svg width="32" height="32"><use href="#i-run"/></svg></div><h3>No active delivery</h3><p>Create a request and track your courier here — live, no map needed.</p></div>' +
      '<button class="minibtn primary" data-act="goto-create" style="padding:12px 24px">Create Request</button>';
    $("#tr-steps").innerHTML = "";
    $("#tr-courier").innerHTML = "";
    $("#tr-pin").classList.add("hidden");
    $("#tr-summary").innerHTML = "";
    $("#tr-actions").innerHTML = "";
    $("#tr-livechip").classList.add("hidden");
    $("#tr-feedtext").textContent = "Waiting for an active order…";
    return;
  }
  state.watchOrderId = o.id;
  $("#tr-livechip").classList.toggle("hidden", o.stage >= 5 || o.status === "cancelled");
  const done = o.status === "delivered";
  const cancelled = o.status === "cancelled";
  const progress = done ? 1 : cancelled ? 0 : o.stage / 5;
  const off = 251.2 * (1 - progress);
  const arrival = done ? "Delivered" : cancelled ? "Cancelled" : fmtT(new Date(Date.now() + o.etaMin * 60000));
  const sub = done ? '<svg width="14" height="14"><use href="#i-check-c"/></svg>Handed over · PIN verified' :
    cancelled ? '<svg width="14" height="14"><use href="#i-x-c"/></svg>Order cancelled' :
    '<span class="pulse-dot"></span>Arriving in ~' + Math.max(o.etaMin, 0) + " min";
  $("#tr-hero").innerHTML =
    '<div class="etawrap"><div class="col"><div class="eta-label">Estimated arrival</div>' +
    '<div class="eta-time">' + esc(arrival) + '</div><div class="eta-sub" style="' + (done ? "color:var(--ok)" : cancelled ? "color:var(--danger)" : "") + '">' + sub + "</div></div>" +
    '<div class="ring"><svg width="92" height="92" viewBox="0 0 92 92"><circle class="ringbg" cx="46" cy="46" r="40"/><circle class="ringfg" cx="46" cy="46" r="40" stroke-dasharray="251.2" stroke-dashoffset="' + off + '"/></svg>' +
    '<div class="ringtxt"><b>' + (done ? "✓" : cancelled ? "—" : Math.max(o.etaMin, 0)) + "</b><small>" + (done ? "DONE" : cancelled ? "VOID" : "MIN") + "</small></div></div></div>" +
    '<div class="mini-stats">' +
    '<div class="mini-stat"><small>Distance</small><b>' + (done ? "Arrived" : "~" + Math.max(1, Math.round(o.etaMin / 25 * 1000)) + " m") + "</b></div>" +
    '<div class="mini-stat"><small>Progress</small><b>' + Math.round(progress * 100) + "%</b></div>" +
    '<div class="mini-stat"><small>Status</small><b style="font-size:12.5px">' + esc(cancelled ? "Cancelled" : statusUI(o).label.replace("…", "")) + "</b></div></div>" +
    '<div class="sheetactions two" style="margin-top:14px"><button class="btn btn-soft" data-act="details" data-id="' + o.id + '">View details</button>' +
    '<button class="btn btn-soft" data-share>Share ETA</button></div>';

  $("#tr-steps").innerHTML = STAGES.map((s, i) => {
    const cls = i < o.stage ? "done" : i === o.stage && !done ? "current" : i <= o.stage && done ? "done" : "";
    const sub2 = s.sub.replace("{courier}", esc(o.courier || "Courier")).replace("{dropoff}", esc(o.dropoff));
    const mark = i < o.stage || (done && i <= 5) ? '<svg width="14" height="14"><use href="#i-check"/></svg>' : i === o.stage && !done ? '<span class="pulse-dot" style="background:#241E6E"></span>' : "";
    const t = o.times[i] ? "<small>" + o.times[i] + "</small>" : "";
    return '<div class="step ' + cls + '"><div class="line"></div><div class="dot">' + mark + '</div><div class="sinfo"><h4>' + s.label + "</h4><p>" + sub2 + "</p>" + t + "</div></div>";
  }).join("");
  const feed = o.updates && o.updates.length ? o.updates[o.updates.length - 1] : "Waiting for updates…";
  const ft = $("#tr-feedtext");
  if (ft.textContent !== feed) {
    ft.textContent = feed;
    ft.style.animation = "none";
    void ft.offsetWidth;
    ft.style.animation = "";
  }

  if (cancelled) {
    $("#tr-courier").innerHTML = "";
  } else {
    $("#tr-courier").innerHTML = '<div class="courier-card"><div class="crow">' +
      '<div class="avatar">' + COURIER.initials + '<span class="vbadge"><svg width="10" height="10"><use href="#i-check"/></svg></span></div>' +
      '<div class="grow"><h3>' + esc(COURIER.name) + '</h3><div class="starline"><svg width="14" height="14"><use href="#i-star-fill"/></svg>' + COURIER.rating + " · " + COURIER.deliveries + ' deliveries</div>' +
      '<div class="csub">' + esc(COURIER.vehicle) + " · " + (done ? "Completed delivery" : "Knights verified courier") + "</div></div></div>" +
      '<div class="courier-actions">' +
      '<button class="cact call" data-act="call"><svg width="21" height="21"><use href="#i-phone"/></svg>Call</button>' +
      '<button class="cact chat" data-act="chat"><svg width="21" height="21"><use href="#i-chat"/></svg>Chat</button>' +
      (done ? '<button class="cact tip" data-act="rate" data-id="' + o.id + '"><svg width="21" height="21"><use href="#i-star"/></svg>' + (o.rated ? "Rated" : "Rate") + "</button>"
        : '<button class="cact tip" data-act="tip" data-id="' + o.id + '"><svg width="21" height="21"><use href="#i-cash"/></svg>Tip</button>') +
      "</div></div>";
  }

  const pinCard = $("#tr-pin");
  if (done || cancelled) pinCard.classList.add("hidden");
  else {
    pinCard.classList.remove("hidden");
    $("#tr-pindigits").innerHTML = o.pin.split("").map((d) => "<b>" + (state.pinHidden ? "•" : esc(d)) + "</b>").join("");
    $("#tr-pineye").innerHTML = '<svg width="22" height="22"><use href="#' + (state.pinHidden ? "i-eye" : "i-eye-off") + '"/></svg>';
  }

  $("#tr-summary").innerHTML = '<div class="summary"><h2>Order summary</h2><div class="detailrows">' +
    drow("i-box", "Items", o.items) +
    drow("i-pin", "Drop-off", o.dropoff) +
    drow("i-clock", "Preferred time", o.time) +
    (o.notes ? drow("i-edit", "Notes", o.notes) : "") +
    drow("i-wallet", "Payment", o.payment + " · " + money(o.fee + (o.itemCost || 0))) +
    "</div>" + (done ? '<div style="text-align:right;padding:10px 0 6px"><button class="link ok" data-act="receipt" data-id="' + o.id + '">View receipt <svg width="14" height="14" style="vertical-align:-2px"><use href="#i-chev-r"/></svg></button></div>' : "") + "</div>";

  let acts = "";
  if (done) {
    acts = '<button class="btn btn-yellow" data-act="rate" data-id="' + o.id + '"><svg width="18" height="18"><use href="#i-star"/></svg>' + (o.rated ? "You rated this delivery" : "Rate your courier") + "</button>" +
      '<button class="btn btn-primary" data-act="reorder" data-id="' + o.id + '"><svg width="18" height="18"><use href="#i-repeat"/></svg>Re-order</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="help">Need help? Contact support</button>';
  } else if (cancelled) {
    acts = '<button class="btn btn-primary" data-act="reorder" data-id="' + o.id + '"><svg width="18" height="18"><use href="#i-repeat"/></svg>Re-order again</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="help">Need help? Contact support</button>';
  } else {
    acts = '<button class="btn ghost-danger" data-act="cancel" data-id="' + o.id + '">Cancel request</button>' +
      '<button class="btn btn-ghost btn-sm" data-act="help">Need help? Contact support</button>';
  }
  $("#tr-actions").innerHTML = acts;
}

function renderProfile() {
  $("#pfAvatar").textContent = initials(state.user.fullName);
  $("#pfName").textContent = state.user.fullName;
  $("#pfSid").textContent = state.user.sid;
  $("#pfEmail").textContent = state.user.email;
  $("#pfPhone").textContent = state.user.phone;
  const done = state.orders.filter((o) => o.status === "delivered").length;
  $("#pfOrdersMeta").textContent = state.orders.length + " orders · " + done + " delivered";
  const methods = [
    { n: "GCash", i: "i-wallet", s: "•••• 4821 · Linked" },
    { n: "Cash on Delivery", i: "i-cash", s: "Pay when it arrives" },
    { n: "Maya", i: "i-card", s: "•••• 7390 · Linked" },
  ];
  $("#payList").innerHTML = methods.map((m) =>
    '<div class="optrow ' + (state.defaultPayment === m.n ? "sel" : "") + '" data-defpay="' + m.n + '">' +
    '<div class="dic" style="width:40px;height:40px;border-radius:13px;background:var(--navy-tint);color:var(--navy-soft);display:grid;place-items:center"><svg width="19" height="19"><use href="#' + m.i + '"/></svg></div>' +
    '<div class="rmain"><h4>' + m.n + "</h4><p>" + m.s + "</p></div>" +
    (state.defaultPayment === m.n ? '<span class="badge bg-ok">DEFAULT</span>' : '<span class="radio"></span>') + "</div>").join("");
  $("#addrList").innerHTML = state.addresses.map((a, i) =>
    '<div class="addrq"><div class="dic"><svg width="19" height="19"><use href="#i-pin"/></svg></div>' +
    '<div style="flex:1"><b>' + esc(a.t) + "</b><small>" + esc(a.s) + "</small></div>" +
    (a.def ? '<span class="def">DEFAULT</span>' : '<button class="link" data-defaddr="' + i + '">Set default</button>') +
    '<button class="trash" data-deladdr="' + i + '"><svg width="17" height="17"><use href="#i-trash"/></svg></button></div>').join("") ||
    '<p style="font-size:13px;font-weight:700;color:var(--muted)">No saved addresses yet.</p>';
  $$("[data-toggle]").forEach((t) => t.classList.toggle("on", !!state[t.dataset.toggle]));
}
function renderFAQ() {
  $("#faqList").innerHTML = FAQS.map((f, i) =>
    '<div class="faq-item" data-faq="' + i + '"><button class="faq-q">' + esc(f.q) + '<svg width="18" height="18"><use href="#i-chev-d"/></svg></button>' +
    '<div class="faq-a"><p>' + esc(f.a) + "</p></div></div>").join("");
}

function openDrawer(title, html) {
  $("#drawerTitle").textContent = title;
  $("#drawerBody").innerHTML = html;
  $("#drawerBackdrop").classList.add("open");
  $("#drawer").classList.add("open");
}
function closeDrawer() {
  $("#drawerBackdrop").classList.remove("open");
  $("#drawer").classList.remove("open");
}
function openDialog(html) {
  $("#dialogBody").innerHTML = html;
  $("#dialogWrap").classList.add("open");
}
function closeDialog() {
  $("#dialogWrap").classList.remove("open");
}
function closeTopLayer() {
  if ($("#callOverlay").classList.contains("open")) { endCall(); return; }
  if ($("#dialogWrap").classList.contains("open")) { closeDialog(); return; }
  if ($("#chatDrawer").classList.contains("open")) { closeChat(); return; }
  if ($("#drawer").classList.contains("open")) { closeDrawer(); return; }
  if (searchOpen) { closeSearchModal(); return; }
  if (panelOpen) toggleNotifPanel(false);
}

function openOrderDrawer(id) {
  const o = orderById(id);
  if (!o) return;
  const done = o.status === "delivered";
  const cancelled = o.status === "cancelled";
  const ui = statusUI(o);
  const badgeCls = done ? "bg-ok" : cancelled ? "bg-danger" : "bg-info";
  let steps = "";
  for (let i = 0; i <= Math.min(o.stage, 5); i++) {
    const cls = i < o.stage || (done && i === o.stage) ? "done" : "cur";
    steps += '<div class="tm ' + cls + '"><span class="tmd"><svg width="10" height="10"><use href="#i-check"/></svg></span>' + STAGES[i].label + (o.times[i] ? "<small>" + o.times[i] + "</small>" : "") + "</div>";
  }
  const breakdown = done ?
    '<div class="breakdown"><div class="brow"><span>Item cost (est.)</span><span>' + money(o.itemCost || 0) + "</span></div>" +
    '<div class="brow"><span>Delivery fee</span><span>' + money(o.fee) + "</span></div>" +
    (o.tip ? '<div class="brow"><span>Courier tip</span><span>' + money(o.tip) + "</span></div>" : "") +
    '<div class="brow total"><span>Total</span><span>' + money((o.itemCost || 0) + o.fee + (o.tip || 0)) + "</span></div></div>"
    : '<div class="breakdown"><div class="brow"><span>Estimated delivery fee</span><span>' + money(o.fee) + '</span></div><div class="brow"><span>Payment method</span><span>' + esc(o.payment) + "</span></div></div>";
  let acts = "";
  if (!done && !cancelled) {
    acts = '<button class="btn btn-primary" data-act="track" data-id="' + o.id + '"><svg width="18" height="18"><use href="#i-run"/></svg>Track delivery</button>' +
      '<div class="sheetactions two"><button class="btn btn-soft" data-act="chat"><svg width="17" height="17"><use href="#i-chat"/></svg>Chat</button>' +
      '<button class="btn btn-soft" data-act="cancel" data-id="' + o.id + '">Cancel</button></div>';
  } else if (done) {
    acts = '<button class="btn btn-primary" data-act="reorder" data-id="' + o.id + '"><svg width="18" height="18"><use href="#i-repeat"/></svg>Re-order</button>' +
      '<div class="sheetactions two"><button class="btn btn-soft" data-act="receipt" data-id="' + o.id + '"><svg width="17" height="17"><use href="#i-receipt"/></svg>Receipt</button>' +
      (o.rated ? '<button class="btn btn-soft" data-act="chat"><svg width="17" height="17"><use href="#i-chat"/></svg>Chat</button>'
        : '<button class="btn btn-soft" data-act="rate" data-id="' + o.id + '"><svg width="17" height="17"><use href="#i-star"/></svg>Rate</button>') + "</div>";
  } else {
    acts = '<button class="btn btn-primary" data-act="reorder" data-id="' + o.id + '"><svg width="18" height="18"><use href="#i-repeat"/></svg>Re-order</button>';
  }
  openDrawer("Order details",
    '<div style="display:flex;gap:14px;align-items:center">' + catTile(o.cat, 52) +
    '<div style="flex:1"><h2 style="margin:0;font-family:var(--font-display);font-size:19px;color:var(--ink)">' + esc(o.title) + '</h2><div style="margin-top:6px"><span class="badge ' + badgeCls + '">' + esc(ui.label) + '</span> <span class="badge bg-navy">' + o.id + "</span></div></div></div>" +
    '<div class="timeline-mini">' + steps + "</div>" +
    '<div class="detailrows">' +
    drow("i-box", "Items", o.items) +
    drow("i-pin", "Drop-off", o.dropoff) +
    drow("i-clock", "Preferred time", o.time) +
    (o.notes ? drow("i-edit", "Notes", o.notes) : "") +
    drow("i-wallet", "Payment", o.payment) +
    (o.courier && !cancelled ? drow("i-moto", "Courier", o.courier + " · ★ " + COURIER.rating) : "") +
    (cancelled ? drow("i-x-c", "Cancel reason", o.cancelReason || "—") : "") +
    "</div>" + breakdown +
    '<p class="smallnote">Created ' + esc(o.created) + "</p>" +
    '<div class="sheetactions">' + acts + "</div>");
}

function openReceiptDialog(id) {
  const o = orderById(id);
  if (!o) return;
  openDialog(
    '<h2 style="text-align:center">Receipt</h2>' +
    '<div class="receipt" style="margin-top:10px"><div class="rhead"><b>Knights Delivery</b><small>Ateneo de Naga University</small><small style="display:block;margin-top:6px">' + o.id + " · " + esc(o.created) + "</small></div>" +
    '<div class="rbody"><div class="brow"><span>' + esc(o.items) + "</span><span>" + money(o.itemCost || 0) + "</span></div>" +
    '<div class="brow"><span>Delivery fee</span><span>' + money(o.fee) + "</span></div>" +
    (o.tip ? '<div class="brow"><span>Courier tip</span><span>' + money(o.tip) + "</span></div>" : "") +
    '<div class="brow total"><span>Total</span><span>' + money((o.itemCost || 0) + o.fee + (o.tip || 0)) + "</span></div>" +
    '<div class="brow"><span>Payment</span><span>' + esc(o.payment) + " · Paid</span></div>" +
    '<div class="brow"><span>Delivered by</span><span>' + esc(o.courier || "—") + " ★ " + COURIER.rating + "</span></div></div></div>" +
    '<div class="sheetactions two" style="margin-top:16px"><button class="btn btn-soft" data-act="dl-receipt"><svg width="17" height="17"><use href="#i-download"/></svg>Download</button>' +
    '<button class="btn btn-soft" data-act="share-eta"><svg width="17" height="17"><use href="#i-share"/></svg>Share</button></div>');
}
function openRateDialog(id, celebrate) {
  const o = orderById(id);
  if (!o) return;
  rateDraft = { stars: o.rated ? 5 : 0, tip: 0, tags: [], orderId: id };
  const tags = ["On time", "Friendly", "Careful with items", "Great communication"];
  openDialog(
    (celebrate ? '<div style="text-align:center;font-size:42px">🎉</div>' : "") +
    '<h2 style="text-align:center">' + (o.rated ? "Your rating" : "How was your delivery?") + "</h2>" +
    '<p class="sub" style="text-align:center">' + esc(o.title) + " · " + esc(o.courier || COURIER.name) + "</p>" +
    '<div class="stars">' + [1, 2, 3, 4, 5].map((i) => '<button class="star-btn ' + (i <= rateDraft.stars ? "on" : "") + '" data-star="' + i + '"><svg width="38" height="38"><use href="#i-star' + (i <= rateDraft.stars ? "-fill" : "") + '"/></svg></button>').join("") + "</div>" +
    '<p class="sub" style="text-align:center" id="rate-word">' + (rateDraft.stars ? ["", "Poor", "Fair", "Good", "Great", "Excellent!"][rateDraft.stars] : "Tap to rate") + "</p>" +
    '<h2 style="font-size:15px;margin-top:14px;text-align:center">Add a tip for ' + esc(firstWord(o.courier || COURIER.name)) + "</h2>" +
    '<div class="tipchips">' + [0, 10, 20, 50].map((t) => '<button class="tipchip" data-tip="' + t + '">' + (t === 0 ? "No tip" : money(t)) + "</button>").join("") + "</div>" +
    '<div class="tagchips">' + tags.map((t) => '<button class="tagchip" data-tag="' + t + '">' + t + "</button>").join("") + "</div>" +
    '<div class="sheetactions"><button class="btn btn-primary" id="rate-submit">' + (o.rated ? "Update rating" : "Submit rating") + "</button></div>");
}
function openTipDialog(id) {
  tipPick = 0;
  openDialog('<h2 style="text-align:center">Tip your courier</h2><p class="sub" style="text-align:center">100% of the tip goes to ' + esc(firstWord(COURIER.name)) + "</p>" +
    '<div class="tipchips">' + [10, 20, 50].map((t) => '<button class="tipchip" data-tipsel="' + t + '">' + money(t) + "</button>").join("") + "</div>" +
    '<div class="sheetactions"><button class="btn btn-primary" id="tip-send">Send tip</button></div>');
}
function openCancelDialog(id) {
  const o = orderById(id);
  if (!o) return;
  cancelId = id;
  cancelReason = "";
  const reasons = ["Changed my mind", "Ordered by mistake", "Taking too long", "Other"];
  openDialog('<h2>Cancel this request?</h2><p class="sub">' + esc(o.title) + " · " + o.id + " — this can't be undone.</p>" +
    reasons.map((r) => '<div class="optrow" data-cancelreason="' + r + '"><div class="rmain"><h4>' + r + '</h4></div><span class="radio"></span></div>').join("") +
    '<div class="sheetactions"><button class="btn ghost-danger" id="cancel-confirm">Confirm cancellation</button>' +
    '<button class="btn btn-ghost btn-sm" id="cancel-keep">Keep my request</button></div>');
}
function confirmCancel() {
  const o = orderById(cancelId);
  if (!o) return;
  o.status = "cancelled";
  o.cancelReason = cancelReason || "Other";
  o.updates.push("Request cancelled — " + o.cancelReason);
  closeDialog();
  toast("Request cancelled", "i-x-c");
  addNotif("order", "Request cancelled — " + o.id, "Reason: " + o.cancelReason + ". You were not charged.", { orderId: o.id });
  refreshAll();
}
function reorder(id) {
  const o = orderById(id);
  if (!o) return;
  closeDrawer();
  closeDialog();
  resetCreate({ cat: o.cat, items: o.items, dropoff: o.dropoff, notes: o.notes, express: false });
  go("create");
  toast("Draft copied from " + o.id + " — review and post", "i-repeat");
}

function openCategoryDialog() {
  openDialog("<h2>Choose a category</h2>" + Object.entries(CATS).map(([k, c]) =>
    '<div class="optrow ' + (state.draft.cat === k ? "sel" : "") + '" data-pickcat="' + k + '">' +
    catTile(k, 44) + '<div class="rmain"><h4>' + c.name + "</h4><p>" + ({ food: "Meals, snacks & drinks", supplies: "School & personal items", errands: "Pickups & quick tasks", printing: "Print, copy & thesis" }[k]) + '</p></div><span class="radio"></span></div>').join(""));
}
function openTimeDialog() {
  openDialog('<h2>Preferred time</h2><p class="sub">When should your courier deliver?</p>' + TIME_OPTIONS.map((t) =>
    '<div class="optrow ' + ((state.draft.time || TIME_OPTIONS[1]) === t ? "sel" : "") + '" data-picktime="' + esc(t) + '">' +
    '<div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--navy-tint);color:var(--navy-soft);display:grid;place-items:center"><svg width="19" height="19"><use href="#i-clock"/></svg></div>' +
    '<div class="rmain"><h4>' + t + '</h4></div><span class="radio"></span></div>').join(""));
}

function openChat(mode = "courier") {
  state.chatMode = mode;
  closeDrawer();
  renderChat();
  $("#chatBackdrop").classList.add("open");
  $("#chatDrawer").classList.add("open");
  setTimeout(() => $("#ch-input").focus(), 200);
}
function closeChat() {
  $("#chatBackdrop").classList.remove("open");
  $("#chatDrawer").classList.remove("open");
}
function pushChat(msg, mode = "courier") {
  const arr = mode === "support" ? state.supportMsgs : state.chat;
  arr.push(msg);
  if ($("#chatDrawer").classList.contains("open") && state.chatMode === mode) renderChat();
  return arr;
}
function renderChat() {
  const mode = state.chatMode || "courier";
  const arr = mode === "support" ? state.supportMsgs : state.chat;
  $("#ch-name").textContent = mode === "support" ? "Knight Support" : COURIER.name;
  $("#ch-avatar").textContent = mode === "support" ? "KS" : COURIER.initials;
  $("#ch-status").textContent = mode === "support" ? "Typically replies in 2 min" : (activeOngoing() ? "Online · On the way to you" : "Online");
  const qr = mode === "support" ? ["Report an issue", "Where is my order?", "Refund my fee"] : ["I'm at the drop-off point", "Please call me", "Handle with care", "Thanks!"];
  $("#ch-quick").innerHTML = qr.map((q) => '<button class="qr" data-qr="' + esc(q) + '">' + esc(q) + "</button>").join("");
  const area = $("#ch-msgs");
  area.innerHTML = arr.map((m) => '<div class="msg ' + (m.from === "me" ? "me" : "them") + '">' + esc(m.text) + "<small>" + esc(m.time) + "</small></div>").join("");
  if (state.chatTyping && state.chatMode === mode) area.innerHTML += '<div class="typing"><i></i><i></i><i></i></div>';
  area.scrollTop = area.scrollHeight;
}
function sendChat(text) {
  text = text.trim();
  if (!text) return;
  const mode = state.chatMode || "courier";
  pushChat({ from: "me", text, time: fmtT(now()) }, mode);
  state.chatTyping = true;
  renderChat();
  setTimeout(() => {
    state.chatTyping = false;
    let reply;
    const t = text.toLowerCase();
    if (mode === "support") {
      reply = t.includes("refund") ? "I've started a refund request for your delivery fee. You'll get an email within 24 hours." :
        t.includes("where") ? "Your courier is on the way — ETA updates are live on the Tracking screen." :
        "Thanks for reaching out! A support agent has been assigned to your ticket.";
    } else if (t.includes("where") || t.includes("eta")) reply = "I'm about 5 minutes away — check the live journey for updates!";
    else if (t.includes("call")) reply = "Okay, I'll call you when I reach the lobby!";
    else if (t.includes("thank")) reply = "You're welcome! Enjoy your order.";
    else if (t.includes("drop-off") || t.includes("dropoff") || t.includes("location")) reply = "Got it! I'll meet you exactly at the drop-off point.";
    else if (t.includes("careful") || t.includes("care")) reply = "Noted! I'll handle your items with care.";
    else reply = ["Got it!", "Noted po!", "Okay, see you at the drop-off point!", "Almost there — 5 mins!"][Math.floor(Math.random() * 4)];
    pushChat({ from: "them", text: reply, time: fmtT(now()) }, mode);
    renderChat();
    if (mode === "courier") addNotif("chat", "New message from " + COURIER.name, reply, { chat: true });
  }, 1400);
}

function openCall() {
  $("#call-name").textContent = COURIER.name;
  $("#call-avatar").textContent = COURIER.initials;
  $("#call-sub").textContent = "Knights Courier · " + statusUI(activeOngoing() || { status: "on_way" }).label;
  $("#callOverlay").classList.add("open");
  let s = 0;
  $("#call-timer").textContent = "00:00";
  clearInterval(callTimerInt);
  callTimerInt = setInterval(() => {
    s++;
    $("#call-timer").textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }, 1000);
}
function endCall() {
  clearInterval(callTimerInt);
  $("#callOverlay").classList.remove("open");
  toast("Call ended — " + COURIER.name + " was notified", "i-phone");
}
function shareEta() {
  const o = orderById(state.watchOrderId) || activeOngoing();
  const link = "knights.delivery/eta/" + (o ? o.id : "demo");
  try { navigator.clipboard.writeText("https://" + link).catch(() => {}); } catch (err) {}
  toast("ETA link copied — share with friends", "i-share");
}

function openSearchModal() {
  if (!state.loggedIn) return;
  searchOpen = true;
  $("#searchModal").classList.add("open");
  $("#searchInput").value = "";
  renderSearchIdle();
  setTimeout(() => $("#searchInput").focus(), 150);
}
function closeSearchModal() {
  searchOpen = false;
  $("#searchModal").classList.remove("open");
}
function smRow(it) {
  const i = CATALOG.indexOf(it);
  return '<div class="sm-row" data-catalog="' + i + '">' + catTile(it.cat, 46) +
    '<div class="grow"><h4>' + esc(it.name) + "</h4><p>" + esc(it.shop) + " · " + CATS[it.cat].name + "</p></div>" +
    '<div class="result-price">' + (it.price ? "₱" + it.price : "Varies") + "</div>" +
    '<button class="addbtn"><svg width="17" height="17"><use href="#i-plus"/></svg></button></div>';
}
function renderSearchIdle() {
  $("#searchBody").innerHTML =
    '<div class="sm-title">Recent searches</div>' +
    '<div class="chips" style="margin-top:0">' + state.searchHistory.map((s) => '<button class="chip-soft" data-hist="' + esc(s) + '"><svg width="13" height="13" style="vertical-align:-2px"><use href="#i-history"/></svg> ' + esc(s) + "</button>").join("") + "</div>" +
    '<div class="sm-title">Popular on campus</div>' + CATALOG.slice(0, 6).map(smRow).join("");
}
function renderSearch(q) {
  q = q.trim().toLowerCase();
  if (!q) { renderSearchIdle(); return; }
  const hits = CATALOG.filter((it) => (it.name + " " + it.shop + " " + CATS[it.cat].name).toLowerCase().includes(q));
  $("#searchBody").innerHTML = hits.length ? '<div class="sm-title">Results for “' + esc(q) + '”</div>' + hits.map(smRow).join("") :
    '<div class="emptydesk" style="padding:36px 16px"><div class="esi"><svg width="32" height="32"><use href="#i-search"/></svg></div><h3>No results for "' + esc(q) + '"</h3><p>Try “food”, “printing” or “notebook”.</p></div>';
}
function pickCatalog(i) {
  const it = CATALOG[i];
  if (!it) return;
  if (!state.searchHistory.includes(it.name.toLowerCase().split(" ")[0])) state.searchHistory.unshift(it.name.toLowerCase().split(" ")[0]);
  state.searchHistory = state.searchHistory.slice(0, 5);
  closeSearchModal();
  resetCreate({ cat: it.cat, items: it.name + (it.price ? " (₱" + it.price + ")" : "") + " from " + it.shop, dropoff: "", notes: "", express: false });
  go("create");
  toast("Added to your new request", "i-check-c");
}

function doSignOut() {
  const dark = state.dark;
  state = DEFAULTS();
  state.dark = dark;
  syncTheme();
  syncUser();
  renderNotifs();
  closeDialog();
  closeDrawer();
  closeChat();
  closeSearchModal();
  toggleNotifPanel(false);
  $("#gate").classList.remove("hide");
  $("#formLogin").classList.remove("hidden");
  $("#formSignup").classList.add("hidden");
  toast("Signed out — see you soon!", "i-logout");
}
function signOutConfirm() {
  openDialog('<h2>Sign out?</h2><p class="sub">You will return to the welcome screen. Demo data resets.</p>' +
    '<div class="sheetactions"><button class="btn ghost-danger" id="so-yes">Sign out</button>' +
    '<button class="btn btn-ghost btn-sm" id="so-no">Cancel</button></div>');
}
function doLogin() {
  const email = $("#lg-email").value.trim();
  const pass = $("#lg-pass").value;
  let ok = true;
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  $("#lg-email").classList.toggle("invalid", !emailOk);
  $("#lg-email-hint").classList.toggle("show", !emailOk);
  if (!emailOk) ok = false;
  $("#lg-pass").classList.toggle("invalid", pass.length < 6);
  $("#lg-pass-hint").classList.toggle("show", pass.length < 6);
  if (pass.length < 6) ok = false;
  if (!ok) { toast("Please check your login details", "i-alert"); return; }
  const btn = $("#lg-btn");
  btn.innerHTML = '<span class="spin"></span>Logging in…';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = "Log In";
    btn.disabled = false;
    state.loggedIn = true;
    state.user.email = email;
    syncUser();
    $("#gate").classList.add("hide");
    renderNotifs();
    go("home");
    toast("Welcome back, " + firstWord(state.user.first) + "!", "i-spark");
  }, 900);
}
function doSignup() {
  const name = $("#su-name").value.trim();
  const sid = $("#su-id").value.trim();
  const email = $("#su-email").value.trim();
  const pass = $("#su-pass").value;
  const terms = $("#su-terms").classList.contains("on");
  let ok = true;
  const set = (cond, input, hint) => {
    $(input).classList.toggle("invalid", !cond);
    $(hint).classList.toggle("show", !cond);
    if (!cond) ok = false;
  };
  set(!!name, "#su-name", "#su-name-hint");
  set(!!sid, "#su-id", "#su-id-hint");
  set(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email), "#su-email", "#su-email-hint");
  set(pass.length >= 6, "#su-pass", "#su-pass-hint");
  set(terms, "#su-terms", "#su-terms-hint");
  if (!ok) { toast("Please complete all fields to continue", "i-alert"); return; }
  const btn = $("#su-btn");
  btn.innerHTML = '<span class="spin"></span>Creating account…';
  btn.disabled = true;
  setTimeout(() => {
    btn.innerHTML = "Create Account";
    btn.disabled = false;
    state.user.fullName = name;
    state.user.first = firstWord(name);
    state.user.email = email;
    state.user.sid = sid;
    state.loggedIn = true;
    syncUser();
    $("#gate").classList.add("hide");
    renderNotifs();
    go("home");
    toast("Account created — welcome to Knights Delivery!", "i-spark");
  }, 1000);
}

function handleAct(el) {
  const a = el.dataset.act;
  const id = el.dataset.id || state.watchOrderId;
  if (a === "details") { openOrderDrawer(id); return; }
  if (a === "track") { state.watchOrderId = id; closeDrawer(); closeSearchModal(); go("tracking"); return; }
  if (a === "chat") { openChat("courier"); return; }
  if (a === "call") { openCall(); return; }
  if (a === "cancel") {
    const o = orderById(id);
    if (o && o.stage >= 3) toast("Courier already on the way — contact support to cancel", "i-alert");
    else openCancelDialog(id);
    return;
  }
  if (a === "receipt") { closeDrawer(); openReceiptDialog(id); return; }
  if (a === "rate") { closeDrawer(); openRateDialog(id); return; }
  if (a === "tip") { closeDrawer(); openTipDialog(id); return; }
  if (a === "reorder") { reorder(id); return; }
  if (a === "dl-receipt") { toast("Receipt saved to Downloads (demo)", "i-download"); return; }
  if (a === "share-eta") { shareEta(); return; }
  if (a === "goto-create") { resetCreate(); go("create"); return; }
  if (a === "goto-activity") { go("activity"); return; }
  if (a === "support" || a === "help") { openChat("support"); return; }
  if (a === "help-call") { toast("Calling Knights hotline… (demo)", "i-phone"); return; }
  if (a === "help-report") { toast("Issue reported — support will contact you", "i-alert"); return; }
  if (a === "faq" || a === "help-faq") {
    go("profile");
    setTimeout(() => {
      const first = $("#faqList .faq-item");
      if (first && !first.classList.contains("open")) first.querySelector(".faq-q").click();
      const faq = $("#faqList");
      if (faq) faq.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
    return;
  }
}

function handleToggle(el) {
  const k = el.dataset.toggle;
  state[k] = !state[k];
  if (k === "dark") syncTheme();
  else {
    el.classList.toggle("on", !!state[k]);
    if (k === "orderUpdates") toast(state.orderUpdates ? "Order updates on" : "Order updates off", "i-box");
    if (k === "push") toast(state.push ? "Push notifications on" : "Push notifications off", "i-bell");
  }
}

function addStageUpdate(o, text) {
  o.updates = o.updates || [];
  o.updates.push(text);
  if (state.watchOrderId === o.id && page === "tracking") {
    const ft = $("#tr-feedtext");
    if (ft) {
      ft.textContent = text;
      ft.style.animation = "none";
      void ft.offsetWidth;
      ft.style.animation = "";
    }
  }
}
function advanceStage(o) {
  o.stage++;
  o.status = STAGE_STATUS[o.stage];
  o.times[o.stage] = fmtT(now());
  if (o.stage === 1) {
    o.courier = COURIER.name;
    addNotif("order", "Courier assigned to " + o.id, COURIER.name + " will handle your request. Track it live!", { screen: "tracking", orderId: o.id });
    addStageUpdate(o, COURIER.name + " accepted your request");
    pushChat({ from: "them", text: "Hi! This is Juan. I'm on my way to pick up your order now.", time: fmtT(now()) });
    addNotif("chat", "New message from " + COURIER.name, "I'm on my way to pick up your order now.", { chat: true });
  }
  if (o.stage === 2) {
    addNotif("order", "Order picked up — " + o.id, "Your items are on the way to " + o.dropoff + ".", { screen: "tracking", orderId: o.id });
    addStageUpdate(o, "Picked up your order");
  }
  if (o.stage === 3) {
    o.etaMin = 12;
    addStageUpdate(o, "On the way to " + o.dropoff);
  }
  if (o.stage === 4) {
    o.etaMin = Math.max(o.etaMin, 3);
    addNotif("order", "Courier arriving soon — " + o.id, COURIER.name + " is near " + o.dropoff + ".", { screen: "tracking", orderId: o.id });
    addStageUpdate(o, COURIER.name + " is near " + o.dropoff);
    pushChat({ from: "them", text: "I'm arriving now — see you at the drop-off point!", time: fmtT(now()) });
    addNotif("chat", "New message from " + COURIER.name, "I'm arriving now — see you at the drop-off point!", { chat: true });
  }
  if (o.stage === 5) {
    o.etaMin = 0;
    addStageUpdate(o, "Delivered — PIN verified. Enjoy!");
    addNotif("ok", "Delivered! " + o.id, "Your order was handed over. Rate " + COURIER.name + " to help other Knights.", { orderId: o.id });
    toast("Order " + o.id + " delivered!", "i-check-c");
    if (state.watchOrderId === o.id && page === "tracking") {
      confetti();
      setTimeout(() => openRateDialog(o.id, true), 700);
    }
  }
  refreshAll();
}
function tick() {
  if (!state.loggedIn) return;
  state.orders.forEach((o) => {
    if (o.status === "delivered" || o.status === "cancelled") return;
    o._t = (o._t || 0) + 1;
    if (o.stage < 3) {
      o._left = o._left === undefined ? 4 + o.stage * 2 : o._left - 1;
      if (o._left <= 0) { o._left = undefined; advanceStage(o); }
    } else {
      if (o._t % 2 === 0 && o.etaMin > 0) o.etaMin--;
      if (o.stage === 3 && o.etaMin <= 3) advanceStage(o);
      else if (o.stage >= 4 && o.etaMin <= 0) advanceStage(o);
      else {
        if (page === "tracking" && state.watchOrderId === o.id) renderTracking();
        if (page === "home") renderLiveCard();
      }
    }
  });
  updateSideCount();
}

function bind() {
  document.addEventListener("click", (e) => {
    const closeAll = e.target.closest("[data-closeall]");
    if (closeAll) { closeTopLayer(); return; }

    const nav = e.target.closest("[data-page]");
    if (nav) { go(nav.dataset.page); return; }

    const bell = e.target.closest("#bellBtn");
    if (bell) { toggleNotifPanel(); return; }
    if (panelOpen && !e.target.closest("#notifpanel")) toggleNotifPanel(false);

    if (searchOpen && e.target === $("#searchModal")) { closeSearchModal(); return; }
    if (e.target === $("#drawerBackdrop")) { closeDrawer(); return; }
    if (e.target === $("#chatBackdrop")) { closeChat(); return; }
    if (e.target === $("#dialogWrap")) { closeDialog(); return; }
    if (e.target === $("#callOverlay")) { endCall(); return; }

    const act = e.target.closest("[data-act]");
    if (act) { e.stopPropagation(); handleAct(act); return; }

    const tog = e.target.closest("[data-toggle]");
    if (tog) { handleToggle(tog); return; }

    const star = e.target.closest("[data-star]");
    if (star) {
      rateDraft.stars = +star.dataset.star;
      $$(".star-btn").forEach((b) => {
        const on = +b.dataset.star <= rateDraft.stars;
        b.classList.toggle("on", on);
        const u = b.querySelector("use");
        if (u) u.setAttribute("href", on ? "#i-star-fill" : "#i-star");
      });
      const word = $("#rate-word");
      if (word) word.textContent = ["", "Poor", "Fair", "Good", "Great", "Excellent!"][rateDraft.stars];
      return;
    }
    const tip = e.target.closest("[data-tip]");
    if (tip) {
      rateDraft.tip = +tip.dataset.tip;
      $$("[data-tip]").forEach((b) => b.classList.toggle("sel", +b.dataset.tip === rateDraft.tip && b.dataset.tip !== "0"));
      return;
    }
    const tipsel = e.target.closest("[data-tipsel]");
    if (tipsel) {
      tipPick = +tipsel.dataset.tipsel;
      $$("[data-tipsel]").forEach((b) => b.classList.toggle("sel", +b.dataset.tipsel === tipPick));
      return;
    }
    const tag = e.target.closest("[data-tag]");
    if (tag) {
      const t = tag.dataset.tag;
      tag.classList.toggle("sel");
      if (rateDraft.tags.includes(t)) rateDraft.tags = rateDraft.tags.filter((x) => x !== t);
      else rateDraft.tags.push(t);
      return;
    }
    const cat = e.target.closest("[data-pickcat]");
    if (cat) { state.draft.cat = cat.dataset.pickcat; closeDialog(); $("#cs-catbtn").classList.remove("invalid"); $("#cs-cat-hint").classList.remove("show"); renderCreate(); return; }
    const time = e.target.closest("[data-picktime]");
    if (time) { state.draft.time = time.dataset.picktime; closeDialog(); renderCreate(); return; }
    const pay = e.target.closest("[data-pay]");
    if (pay) { state.draft.payment = pay.dataset.pay; renderCreate(); return; }
    const defpay = e.target.closest("[data-defpay]");
    if (defpay) { state.defaultPayment = defpay.dataset.defpay; closeDialog(); renderProfile(); toast("Default payment updated", "i-wallet"); return; }
    const defaddr = e.target.closest("[data-defaddr]");
    if (defaddr) { state.addresses.forEach((a, i) => a.def = i === +defaddr.dataset.defaddr); renderProfile(); toast("Default address updated", "i-pin"); return; }
    const deladdr = e.target.closest("[data-deladdr]");
    if (deladdr) { state.addresses.splice(+deladdr.dataset.deladdr, 1); renderProfile(); toast("Address removed", "i-trash"); return; }
    const cr = e.target.closest("[data-cancelreason]");
    if (cr) {
      $$("[data-cancelreason]").forEach((x) => x.classList.remove("sel"));
      cr.classList.add("sel");
      cancelReason = cr.dataset.cancelreason;
      return;
    }
    const addr = e.target.closest("[data-addr]");
    if (addr) {
      $("#cs-drop").value = addr.dataset.addr;
      state.draft.dropoff = addr.dataset.addr;
      $("#cs-drop").classList.remove("invalid");
      $("#cs-drop-hint").classList.remove("show");
      toast("Drop-off set to " + addr.dataset.addr.split(" (")[0], "i-pin");
      return;
    }
    const hist = e.target.closest("[data-hist]");
    if (hist) { $("#searchInput").value = hist.dataset.hist; renderSearch(hist.dataset.hist); return; }
    const catRow = e.target.closest("[data-catalog]");
    if (catRow) { pickCatalog(+catRow.dataset.catalog); return; }
    const catPick = e.target.closest(".catcard[data-cat], .cat[data-cat]");
    if (catPick) {
      const c = catPick.dataset.cat;
      if (catPick.classList.contains("cat")) {
        state.draft.cat = state.draft.cat === c ? null : c;
        $("#cs-catbtn").classList.remove("invalid");
        $("#cs-cat-hint").classList.remove("show");
        renderCreate();
      } else {
        resetCreate({ cat: c });
        go("create");
      }
      return;
    }
    const qr = e.target.closest("[data-qr]");
    if (qr) { sendChat(qr.dataset.qr); return; }
    const faq = e.target.closest("[data-faq]");
    if (faq && e.target.closest(".faq-q")) { faq.classList.toggle("open"); return; }
    const notif = e.target.closest("[data-notif]");
    if (notif) {
      const n = state.notifs.find((x) => x.id === +notif.dataset.notif);
      if (!n) return;
      n.read = true;
      renderNotifs();
      toggleNotifPanel(false);
      const a = n.action || {};
      if (a.chat) openChat("courier");
      else if (a.screen === "tracking") { if (a.orderId) state.watchOrderId = a.orderId; go("tracking"); }
      else if (a.screen === "requests") { state.reqTab = "ongoing"; go("requests"); }
      else if (a.orderId) openOrderDrawer(a.orderId);
      else if (a.create !== undefined) { resetCreate({ cat: a.create || null }); go("create"); }
      return;
    }
    if (e.target.closest("#rate-submit")) {
      const o = orderById(rateDraft.orderId);
      if (!o) { closeDialog(); return; }
      if (!rateDraft.stars) { toast("Tap the stars to rate first", "i-alert"); return; }
      o.rated = true;
      if (rateDraft.tip > 0) o.tip = rateDraft.tip;
      closeDialog();
      toast("Thanks for rating! Your feedback helps Knights", "i-star");
      refreshAll();
      return;
    }
    if (e.target.closest("#tip-send")) {
      const o = orderById(state.watchOrderId);
      if (o) { o.tip = tipPick || 20; toast("Tip sent to " + COURIER.name + " — thank you!", "i-cash"); }
      closeDialog();
      refreshAll();
      return;
    }
    if (e.target.closest("#cancel-confirm")) { confirmCancel(); return; }
    if (e.target.closest("#cancel-keep")) { closeDialog(); return; }
    if (e.target.closest("#so-yes")) { doSignOut(); return; }
    if (e.target.closest("#so-no")) { closeDialog(); return; }
    if (e.target.closest("#addr-add-btn")) {
      const v = $("#addrNew").value.trim();
      if (!v) { toast("Enter an address first", "i-alert"); return; }
      state.addresses.push({ t: v, s: "Custom drop-off" });
      $("#addrNew").value = "";
      renderProfile();
      toast("Address added", "i-pin");
      return;
    }
    const row = e.target.closest("[data-order]");
    if (row) { openOrderDrawer(row.dataset.order); return; }
  });

  $("#n-readall").addEventListener("click", () => {
    state.notifs.forEach((n) => n.read = true);
    renderNotifs();
    toast("All notifications marked as read");
  });
  $("#notiflist").addEventListener("click", (e) => {
    if (e.target.closest("[data-notif]")) return;
  });

  $("#openSearch").addEventListener("click", openSearchModal);
  $("#homeSearch").addEventListener("click", openSearchModal);
  $("#topCreate").addEventListener("click", () => go("create"));
  $("#homeSeeAll").addEventListener("click", () => { state.reqTab = "ongoing"; go("requests"); });
  $("#themeToggle").addEventListener("click", () => {
    state.dark = !state.dark;
    syncTheme();
    toast(state.dark ? "Dark mode on" : "Light mode on", state.dark ? "i-moon" : "i-sun");
  });
  $("#searchInput").addEventListener("input", (e) => renderSearch(e.target.value));
  $("#promoClose").addEventListener("click", (e) => { e.stopPropagation(); state.promoDismissed = true; $("#homePromo").style.display = "none"; });
  $("#promoClaim").addEventListener("click", (e) => { e.stopPropagation(); resetCreate(); go("create"); toast("Code KNIGHT1 will auto-apply at checkout", "i-gift"); });

  $("#cs-catbtn").addEventListener("click", openCategoryDialog);
  $("#cs-timebtn").addEventListener("click", openTimeDialog);
  $("#cs-express").addEventListener("click", () => { state.draft.express = !state.draft.express; renderCreate(); });
  $("#cs-post").addEventListener("click", postRequest);
  $("#cs-items").addEventListener("input", (e) => { state.draft.items = e.target.value; e.target.classList.remove("invalid"); $("#cs-items-hint").classList.remove("show"); });
  $("#cs-drop").addEventListener("input", (e) => { state.draft.dropoff = e.target.value; e.target.classList.remove("invalid"); $("#cs-drop-hint").classList.remove("show"); });
  $("#cs-notes").addEventListener("input", (e) => { state.draft.notes = e.target.value; });
  $("#tr-pineye").addEventListener("click", () => { state.pinHidden = !state.pinHidden; renderTracking(); });
  $("#ch-send").addEventListener("click", () => { sendChat($("#ch-input").value); $("#ch-input").value = ""; });
  $("#ch-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { sendChat($("#ch-input").value); $("#ch-input").value = ""; } });
  $("#ch-call").addEventListener("click", openCall);
  $("#call-end").addEventListener("click", endCall);
  $("#call-mute").addEventListener("click", () => {
    $("#call-mute").classList.toggle("muted");
    toast($("#call-mute").classList.contains("muted") ? "Muted" : "Unmuted", "i-mic");
  });
  $("#call-vol").addEventListener("click", () => toast("Speaker on (demo)", "i-vol"));

  $("#reqTabs").addEventListener("click", (e) => {
    const c = e.target.closest(".filterchip");
    if (!c) return;
    state.reqTab = c.dataset.tab;
    renderRequests();
  });
  $("#actTabs").addEventListener("click", (e) => {
    const c = e.target.closest(".filterchip");
    if (!c) return;
    state.actTab = c.dataset.tab;
    renderActivity();
  });

  $("#pfEditBtn").addEventListener("click", () => {
    const p = $("#pfEditPanel");
    const open = p.classList.contains("hidden");
    if (open) {
      $("#mi-name").value = state.user.fullName;
      $("#mi-sid").value = state.user.sid;
      $("#mi-email").value = state.user.email;
      $("#mi-phone").value = state.user.phone;
      p.classList.remove("hidden");
      p.scrollIntoView({ behavior: "smooth", block: "center" });
    } else p.classList.add("hidden");
  });
  $("#pfSave").addEventListener("click", () => {
    state.user.fullName = $("#mi-name").value.trim() || state.user.fullName;
    state.user.first = firstWord(state.user.fullName);
    state.user.sid = $("#mi-sid").value.trim();
    state.user.email = $("#mi-email").value.trim();
    state.user.phone = $("#mi-phone").value.trim();
    $("#pfEditPanel").classList.add("hidden");
    syncUser();
    renderProfile();
    renderHome();
    toast("Profile updated", "i-check-c");
  });
  $("#pfCancel").addEventListener("click", () => $("#pfEditPanel").classList.add("hidden"));
  $("#payAdd").addEventListener("click", () => {
    const methods = [{ n: "GCash", i: "i-wallet", s: "E-wallet · instant linking" }, { n: "Maya", i: "i-card", s: "E-wallet · instant linking" }, { n: "Cash on Delivery", i: "i-cash", s: "No linking needed" }];
    openDialog("<h2>Add payment method</h2><p class=\"sub\">Pick a method to link to your account</p>" + methods.map((m) =>
      '<div class="optrow" data-defpay="' + m.n + '">' +
      '<div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--navy-tint);color:var(--navy-soft);display:grid;place-items:center"><svg width="19" height="19"><use href="#' + m.i + '"/></svg></div>' +
      '<div class="rmain"><h4>' + m.n + "</h4><p>" + m.s + '</p></div><span class="radio"></span></div>').join(""));
  });
  $("#addrAddBtn").addEventListener("click", () => {
    const v = $("#addrNew").value.trim();
    if (!v) { toast("Enter an address first", "i-alert"); return; }
    state.addresses.push({ t: v, s: "Custom drop-off" });
    $("#addrNew").value = "";
    renderProfile();
    toast("Address added", "i-pin");
  });
  $("#addrNew").addEventListener("keydown", (e) => { if (e.key === "Enter") $("#addrAddBtn").click(); });
  $("#resetBtn").addEventListener("click", () => {
    toast("Resetting demo…", "i-repeat");
    setTimeout(() => location.reload(), 700);
  });
  $("#signOutBtn").addEventListener("click", signOutConfirm);

  $("#toSignup").addEventListener("click", () => { $("#formLogin").classList.add("hidden"); $("#formSignup").classList.remove("hidden"); });
  $("#toLogin").addEventListener("click", () => { $("#formSignup").classList.add("hidden"); $("#formLogin").classList.remove("hidden"); });
  $("#lg-btn").addEventListener("click", doLogin);
  $("#su-btn").addEventListener("click", doSignup);
  $("#lg-forgot").addEventListener("click", () => toast("Password reset link sent to your email (demo)", "i-mail"));
  $("#lg-eye").addEventListener("click", () => {
    const inp = $("#lg-pass");
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    $("#lg-eye").innerHTML = '<svg width="20" height="20"><use href="#' + (show ? "i-eye-off" : "i-eye") + '"/></svg>';
  });
  $("#su-eye").addEventListener("click", () => {
    const inp = $("#su-pass");
    const show = inp.type === "password";
    inp.type = show ? "text" : "password";
    $("#su-eye").innerHTML = '<svg width="20" height="20"><use href="#' + (show ? "i-eye-off" : "i-eye") + '"/></svg>';
  });
  $$(".socbtn").forEach((b) => b.addEventListener("click", () => toast("Continue with " + b.dataset.social + " (demo only)", "i-spark")));
  $("#su-terms").addEventListener("click", () => {
    $("#su-terms").classList.toggle("on");
    $("#su-terms-hint").classList.remove("show");
  });
  $("#lg-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") doLogin(); });
  $("#su-pass").addEventListener("keydown", (e) => { if (e.key === "Enter") doSignup(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeTopLayer(); return; }
    if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (searchOpen) closeSearchModal();
      else if (state.loggedIn) openSearchModal();
    }
  });
}

function init() {
  resetCreate();
  renderFAQ();
  renderNotifs();
  renderHome();
  renderProfile();
  syncTheme();
  syncUser();
  bind();
  const params = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const view = params.get("view");
  const sheet = params.get("sheet");
  if (params.get("theme") === "dark") { state.dark = true; syncTheme(); }
  const ALLOWED = ["home", "create", "requests", "tracking", "activity", "profile"];
  if (view === "signup") {
    $("#formLogin").classList.add("hidden");
    $("#formSignup").classList.remove("hidden");
  } else if (view && ALLOWED.includes(view)) {
    state.loggedIn = true;
    $("#gate").classList.add("hide");
    go(view);
  }
  if (sheet) {
    state.loggedIn = true;
    $("#gate").classList.add("hide");
    const map = {
      order: () => openOrderDrawer("KD-2419"),
      notifs: () => toggleNotifPanel(true),
      rate: () => openRateDialog("KD-2327"),
      call: openCall,
      receipt: () => openReceiptDialog("KD-2402"),
      cancel: () => openCancelDialog("KD-2419"),
      tip: () => openTipDialog("KD-2419"),
      search: openSearchModal,
      help: () => openChat("support"),
      cats: () => { go("create"); setTimeout(openCategoryDialog, 350); },
      time: () => { go("create"); setTimeout(openTimeDialog, 350); },
      trackempty: null,
    };
    setTimeout(() => { if (map[sheet]) map[sheet](); }, 450);
  }
  setInterval(tick, 1000);
}

document.addEventListener("DOMContentLoaded", init);
})();
