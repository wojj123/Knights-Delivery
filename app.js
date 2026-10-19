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

let nid = 100;
let uid = 2425;
const now = () => new Date();
const fmtT = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(" ", " ");
const fmtDT = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + fmtT(d);
const money = (n) => "₱" + Number(n).toLocaleString("en-US");

const DEFAULTS = () => ({
  user: { fullName: "Jude Jude", first: "Jude", email: "jude@adnu.edu.ph", sid: "2023-10482", phone: "+63 917 555 4821" },
  dark: false,
  push: true,
  orderUpdates: true,
  loggedIn: false,
  role: "customer",
  cart: null,
  draft: null,
  reqTab: "ongoing",
  actTab: "all",
  watchOrderId: null,
  pinHidden: true,
  promoDismissed: false,
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
let navStack = [{ id: "login" }];
let navLock = false;
let toastTimer = null;
let sheetOpen = false;
let panelOpen = false;
let callTimerInt = null;
let rateDraft = { stars: 0, tip: 0, tags: [], orderId: null };

const NAV_SCREENS = { home: 1, requests: 1, activity: 1, profile: 1, tracking: 1 };
const NAV_ACTIVE = { home: "home", requests: "requests", activity: "activity", profile: "profile", tracking: "requests" };

function orderById(id) { return state.orders.find((o) => o.id === id); }
const ongoing = () => state.orders.filter((o) => o.stage < 5 && o.status !== "cancelled");
const activeOngoing = () => ongoing().sort((a, b) => a.stage - b.stage)[0];
const recentDelivered = () => state.orders.filter((o) => o.status === "delivered").slice(0, 3);
const firstWord = (n) => (n || "Knight").trim().split(/\s+/)[0];
const initials = (n) => (n || "KK").trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
const statusUI = (o) => STATUS_UI[o.status] || STATUS_UI.finding;
function courierFor(o) {
  const managed = !!(o && o.runnerManaged);
  const nm = (o && o.courier) || (managed ? "" : COURIER.name);
  return {
    name: nm,
    initials: (o && o.courierInitials) || initials(nm) || (managed ? "R" : COURIER.initials),
    rating: (o && o.courierRating) || (managed ? "" : COURIER.rating),
    deliveries: (o && o.courierDeliveries) || (managed ? "" : COURIER.deliveries),
    vehicle: (o && o.courierVehicle) || (managed ? "" : COURIER.vehicle),
    first: firstWord(nm || "Runner"),
  };
}

function toast(msg, icon = "i-check-c") {
  const t = $("#toast");
  $("#toast-msg").textContent = msg;
  t.querySelector("use").setAttribute("href", "#" + icon);
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2800);
}

function confetti() {
  const host = $("#app");
  const colors = ["#FFD333", "#4A44A8", "#241E6E", "#2E9E4F", "#F59E0B", "#8B2FC9"];
  const box = document.createElement("div");
  box.className = "confetti";
  for (let i = 0; i < 26; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = 1.5 + Math.random() * 1.6 + "s";
    p.style.animationDelay = Math.random() * 0.4 + "s";
    p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
    box.appendChild(p);
  }
  host.appendChild(box);
  setTimeout(() => box.remove(), 3200);
}

function setScreen(id, dir) {
  const all = $$(".screen");
  const next = $("#scr-" + id);
  const cur = $("#scr-" + navStack[navStack.length - 1].id);
  all.forEach((s) => { s.classList.remove("active", "leaving-left", "leaving-right"); });
  if (cur && cur !== next && dir === "back") {
    cur.classList.add("leaving-right");
    next.classList.add("active");
  } else {
    next.classList.add("active");
  }
  next.scrollTop = 0;
}

function go(id, opts = {}) {
  if (navLock) return;
  navLock = true;
  const dir = opts.dir || "fwd";
  const prev = navStack[navStack.length - 1];
  if (opts.root) {
    navStack = [{ id }];
  } else if (opts.replace) {
    navStack[navStack.length - 1] = { id };
  } else {
    navStack.push({ id });
  }
  setScreen(id, dir);
  afterNav(prev.id, id);
  setTimeout(() => { navLock = false; }, 340);
}

function back() {
  if (navLock) return;
  if (navStack.length < 2) {
    if (state.role === "runner" && navStack[0].id !== "r-dash") { go("r-dash", { root: true }); return; }
    if (state.loggedIn && navStack[0].id !== "home") go("home", { root: true });
    return;
  }
  navLock = true;
  navStack.pop();
  const id = navStack[navStack.length - 1].id;
  setScreen(id, "back");
  afterNav(null, id);
  setTimeout(() => { navLock = false; }, 340);
}

function afterNav(fromId, id) {
  if (id !== "search" && panelOpen) toggleNotifPanel(false);
  const nav = $("#navpill");
  if (NAV_SCREENS[id]) {
    nav.style.display = "flex";
    $$(".navitem").forEach((b) => b.classList.toggle("active", b.dataset.nav === NAV_ACTIVE[id]));
  } else {
    nav.style.display = "none";
  }
  if (id === "home") renderHome();
  if (id === "requests") renderRequests();
  if (id === "activity") renderActivity();
  if (id === "profile") renderProfile();
  if (id === "tracking") renderTracking();
  if (id === "create") renderCreate();
  if (id === "search") { renderSearchIdle(); $("#search-input").value = ""; setTimeout(() => $("#search-input").focus(), 380); }
  if (id === "chat") renderChat();
  if (window.KDRunner && window.KDRunner.onNav) window.KDRunner.onNav(id);
}

function openSheet(html) {
  $("#sheetBody").innerHTML = html;
  sheetOpen = true;
  $("#sheetBackdrop").classList.add("open");
  $("#sheet").classList.add("open");
}
function closeSheet() {
  sheetOpen = false;
  $("#sheetBackdrop").classList.remove("open");
  $("#sheet").classList.remove("open");
  setTimeout(() => { if (!sheetOpen) $("#sheetBody").innerHTML = ""; }, 400);
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
  }).join("") || '<div class="emptystate" style="padding:30px 20px"><p>No notifications yet</p></div>';
  updateBells();
}
function updateBells() {
  const unread = state.notifs.some((n) => !n.read);
  $$('[data-bell], #home-bell').forEach((b) => b.classList.toggle("hasnews", unread));
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

function catTile(cat, size = 52) {
  const c = CATS[cat] || { icon: "i-box", cls: "neutral" };
  return '<div class="tile t-' + (CATS[cat] ? CATS[cat].cls : "neutral") + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:' + (size > 44 ? 16 : 13) + 'px"><svg width="' + Math.round(size / 2) + '" height="' + Math.round(size / 2) + '"><use href="#' + c.icon + '"/></svg></div>';
}
function statusHTML(o) {
  const ui = statusUI(o);
  const ico = ui.icon ? '<svg width="14" height="14"><use href="#' + ui.icon + '"/></svg>' : '<span class="pulse-dot"></span>';
  return '<div class="status tile-status ' + ui.cls + '">' + ico + esc(ui.label) + "</div>";
}
function rowHTML(o) {
  return '<div class="row" data-order="' + o.id + '">' + catTile(o.cat) +
    '<div class="rmain"><h3>' + esc(o.title) + "</h3>" + statusHTML(o) + "</div>" +
    '<div class="rtime">' + esc(o.created) + "</div></div>";
}

function renderHome() {
  $("#home-greet").innerHTML = "Hey " + esc(firstWord(state.user.first)) + ' <span style="font-size:24px">👋</span>';
  $("#home-promo").style.display = state.promoDismissed ? "none" : "flex";
  const rec = recentDelivered();
  $("#home-recent").innerHTML = rec.map(rowHTML).join("");
  $("#home-empty").style.display = rec.length ? "none" : "block";
  updateBells();
}

function renderRequests() {
  const tab = state.reqTab;
  const map = {
    ongoing: (o) => o.stage < 5 && o.status !== "cancelled",
    completed: (o) => o.status === "delivered",
    cancelled: (o) => o.status === "cancelled",
  };
  $$("#req-tabs .filterchip").forEach((c) => c.classList.toggle("active", c.dataset.tab === tab));
  const list = state.orders.filter(map[tab]).sort((a, b) => b.createdTs - a.createdTs);
  $("#req-list").innerHTML = list.length ? list.map(rowHTML).join("") :
    '<div class="emptystate"><div class="esi"><svg width="34" height="34"><use href="#i-box"/></svg></div><h3>Nothing here yet</h3><p>' +
    (tab === "ongoing" ? "Create a request and it will show up here." : "No " + tab + " orders.") + "</p></div>";
  const hasOngoing = ongoing().length > 0;
  $("#req-fab").style.display = (tab === "ongoing" && hasOngoing) ? "flex" : "none";
}

function renderActivity() {
  const spent = state.orders.filter((o) => o.status === "delivered").reduce((s, o) => s + (o.itemCost || 0) + o.fee + (o.tip || 0), 0);
  const delivered = state.orders.filter((o) => o.status === "delivered").length;
  $("#act-stats").innerHTML = '<div class="statscard"><div class="stat"><b>' + state.orders.length + "</b><small>Orders</small></div>" +
    '<div class="stat"><b>' + delivered + "</b><small>Delivered</small></div>" +
    '<div class="stat"><b>' + money(spent) + "</b><small>Spent</small></div></div>";
  $$("#act-tabs .filterchip").forEach((c) => c.classList.toggle("active", c.dataset.tab === state.actTab));
  const map = {
    all: () => true,
    ongoing: (o) => o.stage < 5 && o.status !== "cancelled",
    completed: (o) => o.status === "delivered",
    cancelled: (o) => o.status === "cancelled",
  };
  const list = state.orders.filter(map[state.actTab]).sort((a, b) => b.createdTs - a.createdTs);
  $("#act-list").innerHTML = list.length ? list.map(rowHTML).join("") :
    '<div class="emptystate"><div class="esi"><svg width="34" height="34"><use href="#i-history"/></svg></div><h3>No orders here</h3><p>Your order history will appear in this list.</p></div>';
}

function renderProfile() {
  $("#pf-avatar").textContent = initials(state.user.fullName);
  $("#pf-name").textContent = state.user.fullName;
}

function renderTracking() {
  let o = orderById(state.watchOrderId) || activeOngoing();
  if (!o) {
    $("#tr-hero").innerHTML = '<div class="emptystate" style="padding:26px 10px"><div class="esi"><svg width="34" height="34"><use href="#i-run"/></svg></div><h3>No active delivery</h3><p>Create a request and track your courier here — live, no map needed.</p></div>' +
      '<button class="btn btn-primary" id="tr-create" style="margin-top:6px">Create Request</button>';
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
  const circ = 251.2;
  const off = circ * (1 - progress);
  const hasEta = typeof o.etaMin === "number" && isFinite(o.etaMin);
  const arrival = done ? "Delivered" : cancelled ? "Cancelled" : hasEta ? fmtT(new Date(Date.now() + o.etaMin * 60000)) : "Not available";
  const sub = done ? '<svg width="14" height="14"><use href="#i-check-c"/></svg>Handed over · PIN verified' :
    cancelled ? '<svg width="14" height="14"><use href="#i-x-c"/></svg>Order cancelled' :
    hasEta ? '<span class="pulse-dot"></span>Arriving in ~' + Math.max(o.etaMin, 0) + " min" : '<span class="pulse-dot"></span>Waiting for runner updates';
  $("#tr-hero").innerHTML =
    '<div class="etawrap"><div class="col"><div class="eta-label">Estimated arrival</div>' +
    '<div class="eta-time">' + esc(arrival) + '</div><div class="eta-sub" style="' + (done ? "color:var(--ok)" : cancelled ? "color:var(--danger)" : "") + '">' + sub + "</div></div>" +
    '<div class="ring"><svg width="92" height="92" viewBox="0 0 92 92"><circle class="ringbg" cx="46" cy="46" r="40"/><circle class="ringfg" cx="46" cy="46" r="40" stroke-dasharray="251.2" stroke-dashoffset="' + off + '"/></svg>' +
    '<div class="ringtxt"><b>' + (done ? "✓" : cancelled ? "—" : hasEta ? Math.max(o.etaMin, 0) : "—") + "</b><small>" + (done ? "DONE" : cancelled ? "VOID" : hasEta ? "MIN" : "ETA") + "</small></div></div></div>" +
    '<div class="mini-stats">' +
    '<div class="mini-stat"><small>Distance</small><b>' + (done ? "Arrived" : hasEta ? "~" + Math.max(1, Math.round(o.etaMin / 25 * 1000)) + " m" : "—") + "</b></div>" +
    '<div class="mini-stat"><small>Progress</small><b>' + Math.round(progress * 100) + "%</b></div>" +
    '<div class="mini-stat"><small>Status</small><b style="font-size:12.5px">' + esc(cancelled ? "Cancelled" : statusUI(o).label.replace("…", "")) + "</b></div></div>" +
    '<div class="sheetactions two" style="margin-top:14px"><button class="btn btn-soft" data-act="details">View details</button>' +
    '<button class="btn btn-soft" data-share>Share ETA</button></div>';

  $("#tr-steps").innerHTML = STAGES.map((s, i) => {
    const cls = i < o.stage ? "done" : i === o.stage && !done ? "current" : i <= o.stage && done ? "done" : "";
    const sub2 = s.sub.replace("{courier}", esc(o.courier || "Courier")).replace("{dropoff}", esc(o.dropoff));
    const mark = i < o.stage || (done && i <= 5) ? (done && i === 5 ? '<svg width="14" height="14"><use href="#i-check"/></svg>' : '<svg width="14" height="14"><use href="#i-check"/></svg>') : i === o.stage && !done ? '<span class="pulse-dot" style="background:#241E6E"></span>' : "";
    const t = o.times[i] ? "<small>" + o.times[i] + "</small>" : "";
    return '<div class="step ' + cls + '"><div class="line"></div><div class="dot">' + mark + "</div><div class=\"sinfo\"><h4>" + s.label + "</h4><p>" + sub2 + "</p>" + t + "</div></div>";
  }).join("");
  const feed = o.updates && o.updates.length ? o.updates[o.updates.length - 1] : "Waiting for updates…";
  const ft = $("#tr-feedtext");
  ft.textContent = feed;
  ft.style.animation = "none";
  void ft.offsetWidth;
  ft.style.animation = "";

  if (cancelled) {
    $("#tr-courier").innerHTML = "";
  } else {
    const c = courierFor(o);
    const statline = c.rating
      ? '<div class="starline"><svg width="14" height="14"><use href="#i-star-fill"/></svg>' + esc(c.rating) + (c.deliveries ? " · " + esc(c.deliveries) + " deliveries" : "") + "</div>"
      : c.deliveries ? '<div class="starline">' + esc(c.deliveries) + " deliveries</div>" : "";
    const csub = [c.vehicle ? esc(c.vehicle) : "", done ? "Completed delivery" : o.runnerManaged ? "Knights student runner" : "Knights verified courier"].filter(Boolean).join(" · ");
    $("#tr-courier").innerHTML = '<div class="courier-card"><div class="crow">' +
      '<div class="avatar">' + c.initials + '<span class="vbadge"><svg width="10" height="10"><use href="#i-check"/></svg></span></div>' +
      '<div class="grow"><h3>' + esc(c.name || "Runner") + "</h3>" + statline +
      '<div class="csub">' + csub + "</div></div></div>" +
      '<div class="courier-actions">' +
      '<button class="cact call" data-act="call"><svg width="21" height="21"><use href="#i-phone"/></svg>Call</button>' +
      '<button class="cact chat" data-act="chat"><svg width="21" height="21"><use href="#i-chat"/></svg>Chat</button>' +
      (done ? '<button class="cact tip" data-act="rate" data-id="' + o.id + '"><svg width="21" height="21"><use href="#i-star"/></svg>' + (o.rated ? "Rated" : "Rate") + "</button>"
        : '<button class="cact tip" data-act="tip" data-id="' + o.id + '"><svg width="21" height="21"><use href="#i-cash"/></svg>Tip</button>') +
      "</div></div>";
  }

  const pinCard = $("#tr-pin");
  if (done || cancelled) { pinCard.classList.add("hidden"); }
  else {
    pinCard.classList.remove("hidden");
    const digits = state.pinHidden ? "•" : null;
    $("#tr-pindigits").innerHTML = o.pin.split("").map((d) => "<b>" + (state.pinHidden ? "•" : d) + "</b>").join("");
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

function drow(icon, label, val) {
  return '<div class="drow"><div class="dic"><svg width="19" height="19"><use href="#' + icon + '"/></svg></div><div class="dl"><small>' + label + "</small><b>" + esc(val) + "</b></div></div>";
}

function openOrderSheet(id) {
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
    '<div class="breakdown">' +
    '<div class="brow"><span>Item cost (est.)</span><span>' + money(o.itemCost || 0) + "</span></div>" +
    '<div class="brow"><span>Delivery fee</span><span>' + money(o.fee) + "</span></div>" +
    (o.tip ? '<div class="brow"><span>Courier tip</span><span>' + money(o.tip) + "</span></div>" : "") +
    '<div class="brow total"><span>Total</span><span>' + money((o.itemCost || 0) + o.fee + (o.tip || 0)) + "</span></div></div>"
    : '<div class="breakdown"><div class="brow"><span>Estimated delivery fee</span><span>' + money(o.fee) + "</span></div><div class=\"brow\"><span>Payment method</span><span>" + esc(o.payment) + "</span></div></div>";
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
  openSheet(
    '<div style="display:flex;gap:14px;align-items:center">' + catTile(o.cat, 52) +
    '<div style="flex:1"><h2 style="margin:0">' + esc(o.title) + '</h2><div style="margin-top:4px"><span class="badge ' + badgeCls + '">' + esc(ui.label) + "</span> <span class=\"badge bg-navy\">" + o.id + "</span></div></div></div>" +
    '<div class="timeline-mini">' + steps + "</div>" +
    '<div class="detailrows">' +
    drow("i-box", "Items", o.items) +
    drow("i-pin", "Drop-off", o.dropoff) +
    drow("i-clock", "Preferred time", o.time) +
    (o.notes ? drow("i-edit", "Notes", o.notes) : "") +
    drow("i-wallet", "Payment", o.payment) +
    (o.courier && !cancelled ? drow("i-moto", "Courier", o.courier + (courierFor(o).rating ? " · ★ " + courierFor(o).rating : "")) : "") +
    (cancelled ? drow("i-x-c", "Cancel reason", o.cancelReason || "—") : "") +
    "</div>" + breakdown +
    '<p class="smallnote">Created ' + esc(o.created) + "</p>" +
    '<div class="sheetactions">' + acts + "</div>"
  );
}

function openReceipt(id) {
  const o = orderById(id);
  if (!o) return;
  openSheet(
    '<h2 style="text-align:center">Receipt</h2>' +
    '<div class="receipt" style="margin-top:10px"><div class="rhead"><b>Knights Delivery</b><small>Ateneo de Naga University</small><small style="display:block;margin-top:6px">' + o.id + " · " + esc(o.created) + "</small></div>" +
    '<div class="rbody"><div class="brow"><span>' + esc(o.items) + "</span><span>" + money(o.itemCost || 0) + "</span></div>" +
    '<div class="brow"><span>Delivery fee</span><span>' + money(o.fee) + "</span></div>" +
    (o.tip ? '<div class="brow"><span>Courier tip</span><span>' + money(o.tip) + "</span></div>" : "") +
    '<div class="brow total"><span>Total</span><span>' + money((o.itemCost || 0) + o.fee + (o.tip || 0)) + "</span></div>" +
    '<div class="brow"><span>Payment</span><span>' + esc(o.payment) + " · Paid</span></div>" +
    '<div class="brow"><span>Delivered by</span><span>' + esc(o.courier || "—") + (courierFor(o).rating ? " ★ " + esc(courierFor(o).rating) : "") + "</span></div></div></div>" +
    '<div class="sheetactions two"><button class="btn btn-soft" data-act="dl-receipt"><svg width="17" height="17"><use href="#i-download"/></svg>Download</button>' +
    '<button class="btn btn-soft" data-act="share-eta"><svg width="17" height="17"><use href="#i-share"/></svg>Share</button></div>'
  );
}

function openRate(id, celebrate) {
  const o = orderById(id);
  if (!o) return;
  const c = courierFor(o);
  rateDraft = { stars: o.rated ? 5 : 0, tip: 0, tags: [], orderId: id };
  const tips = [0, 10, 20, 50];
  const tags = ["On time", "Friendly", "Careful with items", "Great communication"];
  openSheet(
    (celebrate ? '<div style="text-align:center;font-size:40px">🎉</div>' : "") +
    '<h2 style="text-align:center">' + (o.rated ? "Your rating" : "How was your delivery?") + "</h2>" +
    '<p class="sub" style="text-align:center">' + esc(o.title) + " · " + esc(c.name) + "</p>" +
    '<div class="stars">' + [1, 2, 3, 4, 5].map((i) => '<button class="star-btn ' + (i <= rateDraft.stars ? "on" : "") + '" data-star="' + i + '"><svg width="38" height="38"><use href="#i-star' + (i <= rateDraft.stars ? "-fill" : "") + '"/></svg></button>').join("") + "</div>" +
    '<p class="sub" style="text-align:center" id="rate-word">' + (rateDraft.stars ? ["", "Poor", "Fair", "Good", "Great", "Excellent!"][rateDraft.stars] : "Tap to rate") + "</p>" +
    '<h2 style="font-size:15px;margin-top:14px">Add a tip for ' + esc(c.first) + "</h2>" +
    '<div class="tipchips">' + tips.map((t) => '<button class="tipchip" data-tip="' + t + '">' + (t === 0 ? "No tip" : money(t)) + "</button>").join("") + "</div>" +
    '<div class="tagchips">' + tags.map((t) => '<button class="tagchip" data-tag="' + t + '">' + t + "</button>").join("") + "</div>" +
    '<div class="sheetactions"><button class="btn btn-primary" id="rate-submit">' + (o.rated ? "Update rating" : "Submit rating") + "</button></div>"
  );
}

function openTip(id) {
  const o = orderById(id);
  const c = courierFor(o);
  openSheet('<h2>Tip your courier</h2><p class="sub">100% of the tip goes to ' + esc(c.first) + "</p>" +
    '<div class="tipchips">' + [10, 20, 50].map((t) => '<button class="tipchip" data-tip="' + t + '">' + money(t) + "</button>").join("") + "</div>" +
    '<div class="sheetactions"><button class="btn btn-primary" id="tip-send">Send tip</button></div>');
}

let callCourier = COURIER;
function openCall() {
  const o = orderById(state.watchOrderId) || activeOngoing();
  callCourier = courierFor(o);
  $("#call-name").textContent = callCourier.name;
  $("#call-avatar").textContent = callCourier.initials;
  $("#call-sub").textContent = "Knights Courier · " + (statusUI(o || { status: "on_way" }).label);
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
  toast("Call ended — " + callCourier.name + " was notified", "i-phone");
}

function pushChat(msg, mode = "courier") {
  const arr = mode === "support" ? state.supportMsgs : state.chat;
  arr.push(msg);
  if (navStack[navStack.length - 1].id === "chat" && state.chatMode === mode) renderChat();
  return arr;
}

function renderChat() {
  const mode = state.chatMode || "courier";
  const arr = mode === "support" ? state.supportMsgs : state.chat;
  const cc = courierFor(orderById(state.watchOrderId) || activeOngoing());
  $("#ch-name").textContent = mode === "support" ? "Knight Support" : cc.name;
  $("#ch-avatar").textContent = mode === "support" ? "KS" : cc.initials;
  $("#ch-status").textContent = mode === "support" ? "Typically replies in 2 min" : (activeOngoing() ? "Online · On the way to you" : "Online");
  const qr = mode === "support" ? ["Report an issue", "Where is my order?", "Refund my fee"] : ["I'm at the drop-off point", "Please call me", "Handle with care", "Thanks!"];
  $("#ch-quick").innerHTML = qr.map((q) => '<button class="qr" data-qr="' + esc(q) + '">' + esc(q) + "</button>").join("");
  const area = $("#ch-msgs");
  area.innerHTML = arr.map((m) => '<div class="msg ' + (m.from === "me" ? "me" : "them") + '">' + esc(m.text) + "<small>" + esc(m.time) + "</small></div>").join("");
  if (state.chatTyping && state.chatMode === mode) area.innerHTML += '<div class="typing"><i></i><i></i><i></i></div>';
  area.scrollTop = area.scrollHeight;
}

function openChat(mode = "courier") {
  state.chatMode = mode;
  go("chat");
}

function sendChat(text) {
  text = text.trim();
  if (!text) return;
  const mode = state.chatMode || "courier";
  pushChat({ from: "me", text, time: fmtT(now()) }, mode);
  renderChat();
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
    if (mode === "courier") addNotif("chat", "New message from " + courierFor(orderById(state.watchOrderId) || activeOngoing()).name, reply, { chat: true });
  }, 1400);
}

function addStageUpdate(o, text) {
  o.updates = o.updates || [];
  o.updates.push(text);
  if (state.watchOrderId === o.id && navStack[navStack.length - 1].id === "tracking") {
    const ft = $("#tr-feedtext");
    if (ft) { ft.textContent = text; ft.style.animation = "none"; void ft.offsetWidth; ft.style.animation = ""; }
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
    if (state.watchOrderId === o.id && navStack[navStack.length - 1].id === "tracking") {
      confetti();
      setTimeout(() => openRate(o.id, true), 700);
    }
  }
  refreshAll();
}

function tick() {
  if (!state.loggedIn || state.role === "runner") return;
  const t = now();
  state.orders.forEach((o) => {
    if (o.status === "delivered" || o.status === "cancelled" || o.runnerManaged) return;
    o._t = (o._t || 0) + 1;
    if (o.stage < 3) {
      o._left = o._left === undefined ? 4 + o.stage * 2 : o._left - 1;
      if (o._left <= 0) { o._left = undefined; advanceStage(o); }
    } else {
      if (o._t % 2 === 0 && o.etaMin > 0) o.etaMin--;
      if (o.stage === 3 && o.etaMin <= 3) advanceStage(o);
      else if (o.stage >= 4 && o.etaMin <= 0) advanceStage(o);
      else if (navStack[navStack.length - 1].id === "tracking" && state.watchOrderId === o.id) renderTracking();
    }
  });
}

function refreshAll() {
  const cur = navStack[navStack.length - 1].id;
  renderNotifs();
  updateBells();
  if (cur === "home") renderHome();
  if (cur === "requests") renderRequests();
  if (cur === "activity") renderActivity();
  if (cur === "tracking") renderTracking();
}

function feeEstimate() {
  const d = state.draft || {};
  const base = FEE_BASE[d.cat] || 25;
  const lo = base - 5 + (d.express ? 15 : 0);
  const hi = base + 5 + (d.express ? 15 : 0);
  return (lo < 10 ? "₱0 – ₱" + hi : "₱" + lo + " – ₱" + hi);
}

function renderCreate() {
  const d = state.draft;
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
  $("#cs-paylabel").textContent = d.payment || state.defaultPayment;
  $("#cs-express").classList.toggle("on", !!d.express);
  $("#cs-fee").textContent = feeEstimate();
  $("#cs-dropchips").innerHTML = state.addresses.slice(0, 3).map((a) => '<button class="chip-soft" data-addr="' + esc(a.t) + '"><svg width="12" height="12" style="vertical-align:-2px;color:var(--yellow-ink)"><use href="#i-pin"/></svg> ' + esc(a.t.split(" (")[0]) + "</button>").join("");
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

function openCancel(id) {
  const o = orderById(id);
  if (!o) return;
  const reasons = ["Changed my mind", "Ordered by mistake", "Taking too long", "Other"];
  openSheet('<h2>Cancel this request?</h2><p class="sub">' + esc(o.title) + " · " + o.id + " — this can't be undone.</p>" +
    reasons.map((r, i) => '<div class="optrow" data-cancelreason="' + r + '"><div class="rmain"><h4>' + r + "</h4></div><span class=\"radio\"></span></div>").join("") +
    '<div class="sheetactions"><button class="btn ghost-danger" id="cancel-confirm">Confirm cancellation</button>' +
    '<button class="btn btn-ghost btn-sm" id="cancel-keep">Keep my request</button></div>');
  $("body").dataset.cancelId = id;
}

function confirmCancel(id, reason) {
  const o = orderById(id);
  if (!o) return;
  o.status = "cancelled";
  o.cancelReason = reason || "Other";
  o.updates.push("Request cancelled — " + o.cancelReason);
  closeSheet();
  toast("Request cancelled", "i-x-c");
  addNotif("order", "Request cancelled — " + o.id, "Reason: " + o.cancelReason + ". You were not charged.", { orderId: o.id });
  refreshAll();
  if ($("#scr-tracking").classList.contains("active")) renderTracking();
}

function reorder(id) {
  const o = orderById(id);
  if (!o) return;
  closeSheet();
  resetCreate({ cat: o.cat, items: o.items, dropoff: o.dropoff, notes: o.notes, express: false });
  go("create");
  toast("Draft copied from " + o.id + " — review and post", "i-repeat");
}

function openCategoryPicker() {
  openSheet('<h2>Choose a category</h2>' + Object.entries(CATS).map(([k, c]) =>
    '<div class="optrow ' + (state.draft.cat === k ? "sel" : "") + '" data-pickcat="' + k + '">' +
    catTile(k, 44) + '<div class="rmain"><h4>' + c.name + "</h4><p>" + ({ food: "Meals, snacks & drinks", supplies: "School & personal items", errands: "Pickups & quick tasks", printing: "Print, copy & thesis" }[k]) + "</p></div><span class=\"radio\"></span></div>").join(""));
}

function openTimePicker() {
  openSheet('<h2>Preferred time</h2><p class="sub">When should your courier deliver?</p>' + TIME_OPTIONS.map((t) =>
    '<div class="optrow ' + ((state.draft.time || TIME_OPTIONS[1]) === t ? "sel" : "") + '" data-picktime="' + esc(t) + '">' +
    '<div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--navy-tint);color:var(--navy-soft);display:grid;place-items:center"><svg width="19" height="19"><use href="#i-clock"/></svg></div>' +
    '<div class="rmain"><h4>' + t + "</h4></div><span class=\"radio\"></span></div>").join(""));
}

function openPaymentPicker() {
  const methods = [{ n: "GCash", i: "i-wallet", s: "E-wallet · linked" }, { n: "Cash on Delivery", i: "i-cash", s: "Pay the courier directly" }, { n: "Maya", i: "i-card", s: "E-wallet · linked" }];
  openSheet('<h2>Payment method</h2>' + methods.map((m) =>
    '<div class="optrow ' + ((state.draft.payment || state.defaultPayment) === m.n ? "sel" : "") + '" data-pickpay="' + m.n + '">' +
    '<div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--navy-tint);color:var(--navy-soft);display:grid;place-items:center"><svg width="19" height="19"><use href="#' + m.i + '"/></svg></div>' +
    '<div class="rmain"><h4>' + m.n + "</h4><p>" + m.s + "</p></div><span class=\"radio\"></span></div>").join(""));
}

function openMyInfo() {
  openSheet('<h2>My information</h2><p class="sub">Keep your details up to date</p>' +
    '<div class="field"><label>Full name</label><input class="input" id="mi-name" value="' + esc(state.user.fullName) + '"></div>' +
    '<div class="field"><label>Student ID</label><input class="input" id="mi-sid" value="' + esc(state.user.sid) + '"></div>' +
    '<div class="field"><label>Email</label><input class="input" id="mi-email" value="' + esc(state.user.email) + '"></div>' +
    '<div class="field"><label>Phone</label><input class="input" id="mi-phone" value="' + esc(state.user.phone) + '"></div>' +
    '<div class="sheetactions"><button class="btn btn-primary" id="mi-save">Save changes</button></div>');
}

function openAddresses() {
  openSheet('<h2>Addresses</h2><p class="sub">Saved drop-off points on campus</p>' +
    state.addresses.map((a, i) => '<div class="addrq"><div class="dic"><svg width="19" height="19"><use href="#i-pin"/></svg></div>' +
      "<div style=\"flex:1\"><b>" + esc(a.t) + "</b><small>" + esc(a.s) + "</small></div>" +
      (a.def ? '<span class="def">DEFAULT</span>' : '<button class="link" data-defaddr="' + i + '">Set default</button>') +
      '<button class="trash" data-deladdr="' + i + '"><svg width="17" height="17"><use href="#i-trash"/></svg></button></div>').join("") +
    '<div class="field" style="margin-top:18px"><label>Add new address</label>' +
    '<div style="display:flex;gap:10px"><input class="input" id="addr-new" placeholder="e.g. SHS Building Room 204" style="flex:1">' +
    '<button class="btn btn-primary" id="addr-add" style="width:auto;padding:0 22px;font-size:20px">+</button></div></div>');
}

function openPayments() {
  const methods = [{ n: "GCash", i: "i-wallet", s: "•••• 4821 · Linked" }, { n: "Cash on Delivery", i: "i-cash", s: "Pay when it arrives" }, { n: "Maya", i: "i-card", s: "•••• 7390 · Linked" }];
  openSheet('<h2>Payment methods</h2><p class="sub">Choose your default payment</p>' + methods.map((m) =>
    '<div class="optrow ' + (state.defaultPayment === m.n ? "sel" : "") + '" data-defpay="' + m.n + '">' +
    '<div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--navy-tint);color:var(--navy-soft);display:grid;place-items:center"><svg width="19" height="19"><use href="#' + m.i + '"/></svg></div>' +
    '<div class="rmain"><h4>' + m.n + "</h4><p>" + m.s + "</p></div><span class=\"radio\"></span></div>").join(""));
}

function openSettings() {
  openSheet('<h2>Settings</h2>' +
    '<div class="switchrow"><div class="sic"><svg width="20" height="20"><use href="#i-bell"/></svg></div><div style="flex:1"><b>Push notifications</b><p>Alerts for promos and news</p></div><button class="toggle ' + (state.push ? "on" : "") + '" data-toggle="push"></button></div>' +
    '<div class="switchrow"><div class="sic"><svg width="20" height="20"><use href="#i-box"/></svg></div><div style="flex:1"><b>Order updates</b><p>Live status of your deliveries</p></div><button class="toggle ' + (state.orderUpdates ? "on" : "") + '" data-toggle="orderUpdates"></button></div>' +
    '<div class="switchrow"><div class="sic"><svg width="20" height="20"><use href="#i-moon"/></svg></div><div style="flex:1"><b>Dark mode</b><p>Easier on the eyes at night</p></div><button class="toggle ' + (state.dark ? "on" : "") + '" data-toggle="dark"></button></div>' +
    '<div class="sheetactions"><button class="btn ghost-danger" id="set-reset">Clear demo data & restart</button></div>' +
    '<p class="smallnote">Knights Delivery v1.0 · Made for the Ateneo de Naga campus</p>');
}

function openHelp() {
  openSheet('<h2>Help & Support</h2><p class="sub">We usually reply within 2 minutes</p>' +
    '<div class="optrow" data-help="chat"><div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--info-bg);color:var(--info);display:grid;place-items:center"><svg width="19" height="19"><use href="#i-chat"/></svg></div><div class="rmain"><h4>Chat with support</h4><p>Live agent for order concerns</p></div><svg class="chev" width="19" height="19"><use href="#i-chev-r"/></svg></div>' +
    '<div class="optrow" data-help="call"><div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--ok-bg);color:var(--ok);display:grid;place-items:center"><svg width="19" height="19"><use href="#i-phone"/></svg></div><div class="rmain"><h4>Call hotline</h4><p>+63 54 123 4567 · 8am–8pm</p></div><svg class="chev" width="19" height="19"><use href="#i-chev-r"/></svg></div>' +
    '<div class="optrow" data-help="report"><div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--danger-bg);color:var(--danger);display:grid;place-items:center"><svg width="19" height="19"><use href="#i-alert"/></svg></div><div class="rmain"><h4>Report an issue</h4><p>Missing item, late delivery & more</p></div><svg class="chev" width="19" height="19"><use href="#i-chev-r"/></svg></div>' +
    '<div class="optrow" data-help="faq"><div class="dic" style="width:38px;height:38px;border-radius:12px;background:var(--yellow-pale);color:var(--yellow-ink);display:grid;place-items:center"><svg width="19" height="19"><use href="#i-help"/></svg></div><div class="rmain"><h4>FAQs</h4><p>Delivery fees, PIN handoff, refunds</p></div><svg class="chev" width="19" height="19"><use href="#i-chev-r"/></svg></div>');
}

function signOutConfirm() {
  openSheet('<h2>Sign out?</h2><p class="sub">You will return to the login screen. Demo data resets.</p>' +
    '<div class="sheetactions"><button class="btn ghost-danger" id="so-yes">Sign out</button>' +
    '<button class="btn btn-ghost btn-sm" id="so-no">Cancel</button></div>');
}

function doSignOut() {
  const dark = state.dark;
  if (window.KDRunner && window.KDRunner.leave) window.KDRunner.leave(true);
  state = DEFAULTS();
  state.dark = dark;
  document.body.classList.toggle("dark", dark);
  navStack = [{ id: "login" }];
  closeSheet();
  setScreen("login", "back");
  afterNav(null, "login");
  refreshAll();
}

function doLogin() {
  const email = $("#lg-email").value.trim();
  const pass = $("#lg-pass").value;
  let ok = true;
  $("#lg-email").classList.toggle("invalid", !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
  $("#lg-email-hint").classList.toggle("show", !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email));
  if (!$("#lg-email").matches(":not(.invalid)")) ok = false;
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
    state.role = "customer";
    state.loggedIn = true;
    state.user.email = email;
    navStack = [{ id: "home" }];
    setScreen("home", "fwd");
    afterNav(null, "home");
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
    state.role = "customer";
    state.loggedIn = true;
    navStack = [{ id: "home" }];
    setScreen("home", "fwd");
    afterNav(null, "home");
    toast("Account created — welcome to Knights Delivery!", "i-spark");
  }, 1000);
}

function renderSearchIdle() {
  $("#search-idle").style.display = "block";
  $("#search-results").style.display = "none";
  $("#search-history").innerHTML = state.searchHistory.map((s) => '<button class="chip-soft" data-hist="' + esc(s) + '"><svg width="13" height="13" style="vertical-align:-2px"><use href="#i-history"/></svg> ' + esc(s) + "</button>").join("");
  $("#search-popular").innerHTML = CATALOG.slice(0, 6).map((it, i) =>
    '<div class="row" data-catalog="' + i + '">' + catTile(it.cat) + '<div class="rmain"><h3>' + esc(it.name) + "</h3><div style=\"font-size:12px;color:var(--muted);font-weight:700\">" + esc(it.shop) + "</div></div>" +
    '<div class="result-price">' + (it.price ? "₱" + it.price : "Varies") + "</div>" +
    '<button class="addbtn"><svg width="17" height="17"><use href="#i-plus"/></svg></button></div>').join("");
}

function renderSearch(q) {
  q = q.trim().toLowerCase();
  if (!q) { renderSearchIdle(); return; }
  $("#search-idle").style.display = "none";
  $("#search-results").style.display = "block";
  const hits = CATALOG.filter((it) => (it.name + " " + it.shop + " " + CATS[it.cat].name).toLowerCase().includes(q));
  $("#search-results").innerHTML = hits.length ? hits.map((it) =>
    '<div class="row" data-catalog="' + CATALOG.indexOf(it) + '">' + catTile(it.cat) + '<div class="rmain"><h3>' + esc(it.name) + "</h3><div style=\"font-size:12px;color:var(--muted);font-weight:700\">" + esc(it.shop) + " · " + CATS[it.cat].name + "</div></div>" +
    '<div class="result-price">' + (it.price ? "₱" + it.price : "Varies") + "</div>" +
    '<button class="addbtn"><svg width="17" height="17"><use href="#i-plus"/></svg></button></div>').join("")
    : '<div class="emptystate"><div class="esi"><svg width="34" height="34"><use href="#i-search"/></svg></div><h3>No results for "' + esc(q) + '"</h3><p>Try “food”, “printing” or “notebook”.</p></div>';
}

function pickCatalog(i) {
  const it = CATALOG[i];
  if (!it) return;
  if (!state.searchHistory.includes(it.name.toLowerCase().split(" ")[0])) state.searchHistory.unshift(it.name.toLowerCase().split(" ")[0]);
  state.searchHistory = state.searchHistory.slice(0, 5);
  resetCreate({ cat: it.cat, items: it.name + (it.price ? " (₱" + it.price + ")" : "") + " from " + it.shop, dropoff: "", notes: "", express: false });
  go("create");
  toast("Added to your new request", "i-check-c");
}

function bindCore() {
  document.addEventListener("click", (e) => {
    const backBtn = e.target.closest("[data-back]");
    if (backBtn) { back(); return; }
    const bell = e.target.closest("[data-bell], #home-bell");
    if (bell) { toggleNotifPanel(); return; }
    if (panelOpen && !e.target.closest("#notifpanel")) toggleNotifPanel(false);
  });
  $("#sheetBackdrop").addEventListener("click", closeSheet);
  $("#n-readall").addEventListener("click", () => { state.notifs.forEach((n) => n.read = true); renderNotifs(); toast("All notifications marked as read"); });
  $("#notiflist").addEventListener("click", (e) => {
    const el = e.target.closest("[data-notif]");
    if (!el) return;
    const n = state.notifs.find((x) => x.id === +el.dataset.notif);
    n.read = true;
    renderNotifs();
    toggleNotifPanel(false);
    const a = n.action || {};
    if (a.chat) { openChat("courier"); }
    else if (a.screen === "tracking") { if (a.orderId) state.watchOrderId = a.orderId; go("tracking"); }
    else if (a.screen === "requests") { state.reqTab = "ongoing"; goRootInternal("requests"); }
    else if (a.orderId) { openOrderSheet(a.orderId); }
    else if (a.create !== undefined) { resetCreate({ cat: a.create || null }); go("create"); }
  });
  $$(".navitem").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.nav;
    if (navStack[navStack.length - 1].id === id) return;
    go(id, { root: true });
  }));
  document.addEventListener("click", (e) => {
    const row = e.target.closest("[data-order]");
    if (row && !e.target.closest("#sheetBackdrop")) openOrderSheet(row.dataset.order);
  });
}

function goRootInternal(id) {
  go(id, { root: true });
}

function bindHome() {
  $("#home-search").addEventListener("click", () => go("search"));
  $("#home-create").addEventListener("click", () => { resetCreate(); go("create"); });
  $("#home-seeall").addEventListener("click", () => goRootInternal("requests"));
  $("#promo-close").addEventListener("click", (e) => { e.stopPropagation(); state.promoDismissed = true; $("#home-promo").style.display = "none"; });
  $("#promo-claim").addEventListener("click", (e) => { e.stopPropagation(); resetCreate(); go("create"); toast("Code KNIGHT1 will auto-apply at checkout", "i-gift"); });
  $$("#home-cats .cat").forEach((c) => c.addEventListener("click", () => { resetCreate({ cat: c.dataset.cat }); go("create"); }));
}

function bindSearch() {
  $("#search-back").addEventListener("click", () => back());
  $("#search-input").addEventListener("input", (e) => renderSearch(e.target.value));
  $("#search-history").addEventListener("click", (e) => {
    const h = e.target.closest("[data-hist]");
    if (!h) return;
    $("#search-input").value = h.dataset.hist;
    renderSearch(h.dataset.hist);
  });
  $("#search-idle").addEventListener("click", (e) => {
    const row = e.target.closest("[data-catalog]");
    if (row) pickCatalog(+row.dataset.catalog);
  });
  $("#search-results").addEventListener("click", (e) => {
    const row = e.target.closest("[data-catalog]");
    if (row) pickCatalog(+row.dataset.catalog);
  });
}

function bindCreate() {
  $("#cs-catbtn").addEventListener("click", openCategoryPicker);
  $("#cs-timebtn").addEventListener("click", openTimePicker);
  $("#cs-paybtn").addEventListener("click", openPaymentPicker);
  $("#cs-express").addEventListener("click", () => { state.draft.express = !state.draft.express; renderCreate(); });
  $("#cs-dropchips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-addr]");
    if (!chip) return;
    $("#cs-drop").value = chip.dataset.addr;
    state.draft.dropoff = chip.dataset.addr;
    $("#cs-drop").classList.remove("invalid");
    $("#cs-drop-hint").classList.remove("show");
    toast("Drop-off set to " + chip.dataset.addr.split(" (")[0], "i-pin");
  });
  $("#cs-post").addEventListener("click", postRequest);
  ["cs-items", "cs-drop"].forEach((id) => $("#" + id).addEventListener("input", () => {
    $("#" + id).classList.remove("invalid");
    $("#" + id + "-hint").classList.remove("show");
  }));
}

function bindRequests() {
  $$("#req-tabs .filterchip").forEach((c) => c.addEventListener("click", () => { state.reqTab = c.dataset.tab; renderRequests(); }));
  $("#req-track").addEventListener("click", () => {
    const o = activeOngoing();
    if (!o) return;
    state.watchOrderId = o.id;
    go("tracking");
  });
}

function bindActivity() {
  $$("#act-tabs .filterchip").forEach((c) => c.addEventListener("click", () => { state.actTab = c.dataset.tab; renderActivity(); }));
}

function bindTracking() {
  $("#scr-tracking").addEventListener("click", (e) => {
    if (e.target.closest("#tr-create")) { resetCreate(); go("create"); return; }
    const act = e.target.closest("[data-act]");
    if (!act) return;
    const id = act.dataset.id || state.watchOrderId;
    const a = act.dataset.act;
    if (a === "call") openCall();
    if (a === "chat") openChat("courier");
    if (a === "details") openOrderSheet(id);
    if (a === "tip") openTip(id);
    if (a === "rate") openRate(id);
    if (a === "reorder") reorder(id);
    if (a === "receipt") openReceipt(id);
    if (a === "help") openHelp();
    if (a === "cancel") {
      const o = orderById(id);
      if (o && o.stage >= 3) toast("Courier already on the way — contact support to cancel", "i-alert");
      else openCancel(id);
    }
    if (a === "track") { state.watchOrderId = id; renderTracking(); closeSheet(); }
  });
  $("#tr-pineye").addEventListener("click", () => {
    state.pinHidden = !state.pinHidden;
    $("#tr-pineye").innerHTML = '<svg width="22" height="22"><use href="#' + (state.pinHidden ? "i-eye" : "i-eye-off") + '"/></svg>';
    renderTracking();
  });
}

function bindChat() {
  $("#ch-send").addEventListener("click", () => { sendChat($("#ch-input").value); $("#ch-input").value = ""; });
  $("#ch-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { sendChat($("#ch-input").value); $("#ch-input").value = ""; } });
  $("#ch-quick").addEventListener("click", (e) => {
    const q = e.target.closest("[data-qr]");
    if (q) sendChat(q.dataset.qr);
  });
  $("#ch-call").addEventListener("click", openCall);
}

function bindAuth() {
  $("#lg-tosignup").addEventListener("click", () => go("signup"));
  $("#su-tologin").addEventListener("click", () => go("login", { replace: true }));
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
}

function bindSheets() {
  $("#sheetBody").addEventListener("click", (e) => {
    const t = e.target;
    const opt = (attr) => t.closest("[data-" + attr + "]");
    const cat = opt("pickcat");
    if (cat) {
      state.draft.cat = cat.dataset.pickcat;
      $("#cs-catbtn").classList.remove("invalid");
      $("#cs-cat-hint").classList.remove("show");
      closeSheet();
      renderCreate();
      return;
    }
    const time = opt("picktime");
    if (time) { state.draft.time = time.dataset.picktime; closeSheet(); renderCreate(); return; }
    const pay = opt("pickpay");
    if (pay) { state.draft.payment = pay.dataset.pickpay; closeSheet(); renderCreate(); return; }
    const defpay = opt("defpay");
    if (defpay) { state.defaultPayment = defpay.dataset.defpay; openPayments(); toast("Default payment updated", "i-wallet"); return; }
    const defaddr = opt("defaddr");
    if (defaddr) { state.addresses.forEach((a, i) => a.def = i === +defaddr.dataset.defaddr); openAddresses(); return; }
    const deladdr = opt("deladdr");
    if (deladdr) { state.addresses.splice(+deladdr.dataset.deladdr, 1); openAddresses(); return; }
    const cr = opt("cancelreason");
    if (cr) {
      $$('#sheetBody .optrow[data-cancelreason]').forEach((x) => x.classList.remove("sel"));
      cr.classList.add("sel");
      $("body").dataset.cancelReason = cr.dataset.cancelreason;
      return;
    }
    const star = t.closest("[data-star]");
    if (star) {
      rateDraft.stars = +star.dataset.star;
      $$("#sheetBody .star-btn").forEach((b) => {
        const on = +b.dataset.star <= rateDraft.stars;
        b.classList.toggle("on", on);
        const u = b.querySelector("use");
        if (u) u.setAttribute("href", on ? "#i-star-fill" : "#i-star");
      });
      const word = $("#rate-word");
      if (word) word.textContent = ["", "Poor", "Fair", "Good", "Great", "Excellent!"][rateDraft.stars];
      return;
    }
    const tip = t.closest("[data-tip]");
    if (tip) {
      rateDraft.tip = +tip.dataset.tip;
      $$("#sheetBody .tipchip").forEach((b) => b.classList.toggle("sel", +b.dataset.tip === rateDraft.tip && b.dataset.tip !== "0"));
      return;
    }
    const tag = t.closest("[data-tag]");
    if (tag) { tag.classList.toggle("sel"); return; }
    const help = opt("help");
    if (help) {
      const k = help.dataset.help;
      if (k === "chat") { closeSheet(); openChat("support"); }
      if (k === "call") toast("Calling Knights hotline… (demo)", "i-phone");
      if (k === "report") toast("Issue reported — support will contact you", "i-alert");
      if (k === "faq") toast("Opening FAQs (demo)", "i-help");
      return;
    }
    if (t.closest("#addr-add")) {
      const v = $("#addr-new").value.trim();
      if (!v) return;
      state.addresses.push({ t: v, s: "Custom drop-off" });
      openAddresses();
      toast("Address added", "i-pin");
      return;
    }
    if (t.closest("#mi-save")) {
      state.user.fullName = $("#mi-name").value.trim() || state.user.fullName;
      state.user.first = firstWord(state.user.fullName);
      state.user.sid = $("#mi-sid").value.trim();
      state.user.email = $("#mi-email").value.trim();
      state.user.phone = $("#mi-phone").value.trim();
      closeSheet();
      renderProfile();
      renderHome();
      toast("Profile updated", "i-check-c");
      return;
    }
    if (t.closest("#tip-send")) {
      const o = orderById(state.watchOrderId);
      if (o) { o.tip = rateDraft.tip || 20; toast("Tip sent to " + COURIER.name + " — thank you!", "i-cash"); }
      closeSheet();
      renderTracking();
      return;
    }
    if (t.closest("#rate-submit")) {
      const o = orderById(rateDraft.orderId);
      if (!o) { closeSheet(); return; }
      if (!rateDraft.stars) { toast("Tap the stars to rate first", "i-alert"); return; }
      o.rated = true;
      if (rateDraft.tip > 0) o.tip = rateDraft.tip;
      closeSheet();
      toast("Thanks for rating! Your feedback helps Knights", "i-star");
      renderTracking();
      refreshAll();
      return;
    }
    if (t.closest("#cancel-confirm")) {
      confirmCancel($("body").dataset.cancelId, $("body").dataset.cancelReason);
      return;
    }
    if (t.closest("#cancel-keep")) { closeSheet(); return; }
    if (t.closest("#so-yes")) { doSignOut(); return; }
    if (t.closest("#so-no")) { closeSheet(); return; }
    if (t.closest("#set-reset")) { closeSheet(); toast("Resetting demo…", "i-repeat"); setTimeout(() => location.reload(), 700); return; }
    const act = t.closest("[data-act]");
    if (act) {
      const a = act.dataset.act;
      const id = act.dataset.id || state.watchOrderId;
      if (a === "track") { state.watchOrderId = id; closeSheet(); go("tracking"); }
      if (a === "chat") { closeSheet(); openChat("courier"); }
      if (a === "receipt") { openReceipt(id); }
      if (a === "rate") { openRate(id); }
      if (a === "reorder") reorder(id);
      if (a === "cancel") { closeSheet(); setTimeout(() => { const o = orderById(id); if (o && o.stage >= 3) toast("Courier already on the way — contact support", "i-alert"); else openCancel(id); }, 350); }
      if (a === "dl-receipt") { toast("Receipt saved to Downloads (demo)", "i-download"); }
      if (a === "share-eta") { shareEta(); }
      if (a === "help") { closeSheet(); setTimeout(openHelp, 350); }
      return;
    }
    const tog = t.closest("[data-toggle]");
    if (tog) {
      const k = tog.dataset.toggle;
      state[k] = !state[k];
      if (k === "dark") document.body.classList.toggle("dark", state.dark);
      openSettings();
      if (k === "orderUpdates") toast(state.orderUpdates ? "Order updates on" : "Order updates off", "i-box");
      if (k === "push") toast(state.push ? "Push notifications on" : "Push notifications off", "i-bell");
      return;
    }
  });
}

function shareEta() {
  const o = orderById(state.watchOrderId) || activeOngoing();
  const link = "knights.delivery/eta/" + (o ? o.id : "demo");
  try {
    navigator.clipboard.writeText("https://" + link).catch(() => {});
  } catch (err) {}
  toast("ETA link copied — share with friends", "i-share");
}

function bindTrackingShare() {
  $("#scr-tracking").addEventListener("click", (e) => {
    if (e.target.closest("[data-share]")) shareEta();
  });
}

function bindProfile() {
  const mnRunner = $("#mn-runner");
  if (mnRunner) mnRunner.addEventListener("click", () => { if (window.KDRunner) window.KDRunner.enter(); });
  $("#mn-info").addEventListener("click", openMyInfo);
  $("#mn-pay").addEventListener("click", openPayments);
  $("#mn-addr").addEventListener("click", openAddresses);
  $("#mn-set").addEventListener("click", openSettings);
  $("#mn-help").addEventListener("click", openHelp);
  $("#mn-out").addEventListener("click", signOutConfirm);
}

function bindCall() {
  $("#call-end").addEventListener("click", endCall);
  $("#call-mute").addEventListener("click", () => {
    $("#call-mute").classList.toggle("muted");
    toast($("#call-mute").classList.contains("muted") ? "Muted" : "Unmuted", "i-mic");
  });
  $("#call-vol").addEventListener("click", () => toast("Speaker on (demo)", "i-vol"));
  $("#callOverlay").addEventListener("click", (e) => { if (e.target === $("#callOverlay")) endCall(); });
}

function bindAll() {
  bindCore(); bindHome(); bindSearch(); bindCreate(); bindRequests(); bindActivity();
  bindTracking(); bindChat(); bindAuth(); bindSheets(); bindProfile(); bindCall(); bindTrackingShare();
}

function init() {
  resetCreate();
  renderNotifs();
  renderHome();
  renderProfile();
  setScreen("login", "none");
  bindAll();
  const params = new URLSearchParams((location.hash || "").replace(/^#/, ""));
  const view = params.get("view");
  const sheet = params.get("sheet");
  if (params.get("dark") === "1" || params.get("theme") === "dark") { state.dark = true; document.body.classList.toggle("dark", true); }
  const ALLOWED = ["home", "create", "requests", "tracking", "activity", "profile", "chat", "search", "login", "signup",
    "r-dash", "r-available", "r-active", "r-tracking", "r-messages", "r-chat", "r-history", "r-earnings", "r-profile"];
  if (view && ALLOWED.includes(view)) {
    state.loggedIn = true;
    if (view.startsWith("r-")) state.role = "runner";
    navStack = [{ id: view }];
    setScreen(view, "none");
    afterNav(null, view);
  }
  if (sheet) {
    state.loggedIn = true;
    setTimeout(() => {
      const map = {
        order: () => openOrderSheet("KD-2419"), notifs: () => toggleNotifPanel(true), rate: () => openRate("KD-2327"),
        call: openCall, cats: () => { go("create", { root: true }); setTimeout(openCategoryPicker, 400); },
        help: openHelp, settings: openSettings, addresses: openAddresses, myinfo: openMyInfo,
        payments: openPayments, receipt: () => openReceipt("KD-2402"), cancel: () => openCancel("KD-2419"),
        time: () => { go("create", { root: true }); setTimeout(openTimePicker, 400); }, tip: () => openTip("KD-2419"),
        pay: () => { go("create", { root: true }); setTimeout(openPaymentPicker, 400); }, trackempty: null,
      };
      if (map[sheet]) map[sheet]();
    }, 500);
  }
  setInterval(tick, 1000);
}

window.KD = {
  get state() { return state; },
  get navStack() { return navStack; },
  orderById, courierFor, go, back, toast, openSheet, closeSheet, addNotif, refreshAll,
  renderHome, renderRequests, renderTracking, renderProfile, confetti, doSignOut, activeOngoing,
  CATS, COURIER, STAGE_STATUS, esc, money, fmtT, fmtDT, initials, firstWord,
};

document.addEventListener("DOMContentLoaded", init);
})();
