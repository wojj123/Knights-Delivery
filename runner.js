(() => {
"use strict";

const KD = window.KD;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = KD.esc;
const money = KD.money;
const fmtT = KD.fmtT;
const initials = KD.initials;
const firstWord = KD.firstWord;

const KEY = "kd.runner.v1";
const H = 3600000;

function me() {
  const u = (KD.state && KD.state.user) || {};
  const name = String(u.fullName || "").trim() || "Runner";
  return { name, first: firstWord(name), initials: initials(name), sid: u.sid || "", email: u.email || "", phone: u.phone || "" };
}
function accountKey() {
  const u = (KD.state && KD.state.user) || {};
  return String(u.email || u.sid || u.fullName || "guest").toLowerCase();
}
function myStats() {
  const done = DB.jobs.filter((j) => j.status === "delivered");
  const cancelled = DB.jobs.filter((j) => j.status === "cancelled");
  const rated = done.filter((j) => typeof j.rating === "number");
  const rating = rated.length ? (rated.reduce((s, j) => s + j.rating, 0) / rated.length).toFixed(1) : null;
  return {
    done: done.length,
    cancelled: cancelled.length,
    tips: done.reduce((s, j) => s + (j.tip || 0), 0),
    rating,
    completion: done.length + cancelled.length ? Math.round((done.length / (done.length + cancelled.length)) * 100) + "%" : "—",
  };
}
const STATUS = {
  available: { label: "Available", pill: "r-st-available", progress: 0, next: null, action: "Accept request" },
  accepted: { label: "Accepted", pill: "r-st-active", progress: 12, next: "picking_up", action: "Start heading to pickup" },
  picking_up: { label: "Heading to pickup", pill: "r-st-active", progress: 26, next: "picked_up", action: "Mark as picked up" },
  picked_up: { label: "Picked up", pill: "r-st-active", progress: 48, next: "on_way", action: "Start delivery" },
  on_way: { label: "On the way", pill: "r-st-active", progress: 68, next: "arriving", action: "Mark arriving soon" },
  arriving: { label: "Arriving soon", pill: "r-st-active", progress: 88, next: "delivered", action: "Confirm delivered" },
  delivered: { label: "Delivered", pill: "r-st-done", progress: 100, next: null, action: null },
  cancelled: { label: "Cancelled", pill: "r-st-cancel", progress: 0, next: null, action: null },
};
const ACTIVE_STATUSES = ["accepted", "picking_up", "picked_up", "on_way", "arriving"];
const CUSTOMER_MAP = {
  accepted: { stage: 1, status: "accepted", text: "accepted your request" },
  picking_up: { stage: 1, status: "accepted", text: "is heading to the pickup point" },
  picked_up: { stage: 2, status: "picked", text: "picked up your order" },
  on_way: { stage: 3, status: "on_way", text: "is on the way to the drop-off point" },
  arriving: { stage: 4, status: "arriving", text: "is arriving at the drop-off point" },
  delivered: { stage: 5, status: "delivered", text: "delivered your order" },
};
const PICKUPS = {
  food: "Bam-Bam's Canteen · Xavier Hall",
  supplies: "ADNU Bookstore · Ground Floor",
  errands: "Registrar's Office · Admin Building",
  printing: "Print Hub · Phelan Building",
};

function minsAgo(m) { return Date.now() - m * 60000; }
function hoursAgo(h) { return Date.now() - h * H; }
function daysAgo(d, hour) {
  const x = new Date();
  x.setDate(x.getDate() - d);
  x.setHours(hour || 0, 0, 0, 0);
  return x.getTime();
}
function startOfDay(days) {
  const x = new Date();
  x.setDate(x.getDate() - (days || 0));
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
function ago(ts) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return "Just now";
  if (s < 3600) return Math.floor(s / 60) + "m ago";
  if (s < 86400) return Math.floor(s / 3600) + "h ago";
  return Math.floor(s / 86400) + "d ago";
}
function dayLabel(ts) {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today, " + fmtT(d);
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday, " + fmtT(d);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + ", " + fmtT(d);
}
function msg(from, text, ts, state) {
  return { from, text, ts, state: state || "sent" };
}
function catTile(cat, size) {
  const c = KD.CATS[cat] || { icon: "i-box", cls: "neutral" };
  const s = size || 46;
  return '<div class="tile t-' + c.cls + '" style="width:' + s + 'px;height:' + s + 'px;border-radius:' + (s > 44 ? 15 : 13) + 'px"><svg width="' + Math.round(s / 2) + '" height="' + Math.round(s / 2) + '"><use href="#' + c.icon + '"/></svg></div>';
}

function seed() {
  return {
    online: true,
    userId: null,
    profile: { vehicle: "", plate: "" },
    settings: { push: true, requestAlerts: true, sound: true },
    nextNotifId: 40,
    notifs: [
      { id: 1, title: "3 sample requests near Phelan", body: "Food, printing and errands sample runs are available now.", time: "2m ago", read: false, jobId: "KD-2431" },
      { id: 2, title: "Tip received on KD-2417", body: "A sample customer added a ₱50 tip. Nice work!", time: "1h ago", read: false, jobId: "KD-2417" },
      { id: 3, title: "Complete your runner profile", body: "Add your vehicle so customers know how their order travels.", time: "3h ago", read: true },
      { id: 4, title: "Completed KD-2416", body: "Sample run delivered to Learning Commons 2nd Floor.", time: "4h ago", read: true, jobId: "KD-2416" }
    ],
    jobs: [
      {
        id: "KD-2426", cat: "food", title: "Lechon manok for dinner", items: "1 whole lechon manok, 2 rice, 1 Coke",
        shop: "Bam-Bam's Canteen", pickup: "Bam-Bam's Canteen · Xavier Hall", dropoff: "Xavier Hall Lobby",
        customer: "Liza Ramos", customerInitials: "LR", customerRating: "4.8", customerPhone: "+63 917 220 8841",
        fee: 40, tip: 20, distance: 1.3, eta: 12, window: "Today, 6:00pm – 6:30pm",
        note: "Please keep the Coke cold if possible. Thank you!", pin: "7302",
        status: "picked_up", createdAt: minsAgo(74), acceptedAt: minsAgo(52), pickedAt: minsAgo(18), unread: 2,
        msgs: [
          msg("them", "Hi! I'll be waiting at the Xavier Hall lobby.", minsAgo(50)),
          msg("them", "Please text me when you're near the guard station.", minsAgo(24))
        ]
      },
      {
        id: "KD-2431", cat: "food", title: "Bam-Bam's group order", items: "2 lechon manok, 4 rice, 2 iced tea",
        shop: "Bam-Bam's Canteen", pickup: "Bam-Bam's Canteen · Xavier Hall", dropoff: "Phelan P217 Lab (2nd Floor)",
        customer: "Andrea Lim", customerInitials: "AL", customerRating: "4.9", customerPhone: "+63 917 884 2011",
        fee: 38, tip: 20, distance: 1.1, eta: 16, window: "Today, 5:30pm – 6:00pm",
        note: "2 extra rice please, and utensils.", pin: "4821", status: "available", createdAt: minsAgo(8), unread: 0, msgs: []
      },
      {
        id: "KD-2432", cat: "printing", title: "Thesis printing (rush)", items: "Chapter 3 printing, colored cover, spiral bind",
        shop: "Print Hub", pickup: "Print Hub · Phelan Building", dropoff: "SHS Building Room 204",
        customer: "Marco Reyes", customerInitials: "MR", customerRating: "4.7", customerPhone: "+63 916 552 7710",
        fee: 30, tip: 50, distance: 0.6, eta: 10, window: "ASAP (30–45 min)",
        note: "Colored cover, spiral binding. Rush please!", pin: "5518", status: "available", createdAt: minsAgo(12), unread: 0, msgs: []
      },
      {
        id: "KD-2433", cat: "supplies", title: "Notebook & pens run", items: "1 notebook, 1 black pen, 1 yellow pad",
        shop: "ADNU Bookstore", pickup: "ADNU Bookstore · Ground Floor", dropoff: "Library 3rd Floor",
        customer: "Bea Cruz", customerInitials: "BC", customerRating: "4.9", customerPhone: "+63 918 441 2208",
        fee: 26, tip: 0, distance: 0.4, eta: 8, window: "Today, 4:00pm – 4:30pm",
        note: "", pin: "9117", status: "available", createdAt: minsAgo(20), unread: 0, msgs: []
      },
      {
        id: "KD-2434", cat: "errands", title: "Claim registrar documents", items: "Claim TOR request stub and 2 certificates",
        shop: "Registrar's Office", pickup: "Registrar's Office · Admin Building", dropoff: "College of Education, Room 12",
        customer: "Paolo Garcia", customerInitials: "PG", customerRating: "4.6", customerPhone: "+63 917 330 9982",
        fee: 42, tip: 30, distance: 1.8, eta: 22, window: "Today, 2:30pm – 3:00pm",
        note: "Bring the claim stub, it's under my name.", pin: "2083", status: "available", createdAt: minsAgo(34), unread: 0, msgs: []
      },
      {
        id: "KD-2435", cat: "food", title: "Iced lattes for study group", items: "4 iced lattes, 2 blueberry muffins",
        shop: "Xavier Cafe", pickup: "Xavier Cafe · Student Center", dropoff: "Learning Commons 2nd Floor",
        customer: "Sam Tan", customerInitials: "ST", customerRating: "4.8", customerPhone: "+63 915 208 1174",
        fee: 35, tip: 25, distance: 0.9, eta: 14, window: "Today, 3:15pm – 3:45pm",
        note: "Please ask for less ice on two lattes.", pin: "3944", status: "available", createdAt: minsAgo(41), unread: 0, msgs: []
      },
      {
        id: "KD-2436", cat: "supplies", title: "Bond paper + blue books", items: "1 ream A4 bond paper, 3 blue books",
        shop: "ADNU Bookstore", pickup: "ADNU Bookstore · Ground Floor", dropoff: "Phelan P205",
        customer: "Kaye Mendoza", customerInitials: "KM", customerRating: "4.9", customerPhone: "+63 917 663 5510",
        fee: 24, tip: 10, distance: 0.3, eta: 7, window: "Today, 5:00pm – 5:30pm",
        note: "", pin: "1189", status: "available", createdAt: minsAgo(58), unread: 0, msgs: []
      },
      {
        id: "KD-2418", cat: "supplies", title: "Blue books delivery", items: "3 blue books, 1 long bond pad",
        shop: "ADNU Bookstore", pickup: "ADNU Bookstore · Ground Floor", dropoff: "Phelan P210",
        customer: "Nina Torres", customerInitials: "NT", customerRating: "4.8", customerPhone: "", fee: 24, tip: 20, distance: 0.4, eta: 8,
        window: "Today, 11:00am – 11:30am", pin: "0000", status: "delivered", createdAt: hoursAgo(3), deliveredAt: hoursAgo(2), unread: 0,
        msgs: [msg("them", "Thank you! Received the blue books.", hoursAgo(2))]
      },
      {
        id: "KD-2417", cat: "printing", title: "Thesis chapter printing", items: "Chapter 2, 10 pages, colored cover",
        shop: "Print Hub", pickup: "Print Hub · Phelan Building", dropoff: "SHS Building Room 108",
        customer: "Marco Reyes", customerInitials: "MR", customerRating: "4.7", customerPhone: "", fee: 30, tip: 50, distance: 0.6, eta: 10,
        window: "Today, 9:30am – 10:00am", pin: "0000", status: "delivered", createdAt: hoursAgo(4), deliveredAt: hoursAgo(3), unread: 0,
        msgs: [msg("me", "On my way with your thesis prints.", hoursAgo(3)), msg("them", "Thanks! Added a tip for the rush.", hoursAgo(3))]
      },
      {
        id: "KD-2416", cat: "food", title: "Bam-Bam's lunch", items: "1 lechon manok, 2 rice, 1 bottled water",
        shop: "Bam-Bam's Canteen", pickup: "Bam-Bam's Canteen · Xavier Hall", dropoff: "Learning Commons 2nd Floor",
        customer: "Jude Ramirez", customerInitials: "JR", customerRating: "4.9", customerPhone: "", fee: 38, tip: 15, distance: 1.1, eta: 15,
        window: "Today, 11:30am – 12:00pm", pin: "0000", status: "delivered", createdAt: hoursAgo(5), deliveredAt: hoursAgo(4), unread: 0, msgs: []
      },
      {
        id: "KD-2415", cat: "errands", title: "Pick up parcel at LBC", items: "Claim 1 small parcel, name under Ramos",
        shop: "LBC Naga", pickup: "LBC Naga · Downtown", dropoff: "Xavier Hall Lobby",
        customer: "Trina Ramos", customerInitials: "TR", customerRating: "4.8", customerPhone: "", fee: 46, tip: 30, distance: 2.4, eta: 28,
        window: "Yesterday, 3:00pm – 3:30pm", pin: "0000", status: "delivered", createdAt: daysAgo(1, 14), deliveredAt: daysAgo(1, 15), unread: 0, msgs: []
      },
      {
        id: "KD-2412", cat: "food", title: "Coffee run", items: "2 hot americano, 1 croissant",
        shop: "Xavier Cafe", pickup: "Xavier Cafe · Student Center", dropoff: "Phelan P217 Lab (2nd Floor)",
        customer: "Ken Aquino", customerInitials: "KA", customerRating: "4.7", customerPhone: "", fee: 32, tip: 0, distance: 0.8, eta: 12,
        window: "Yesterday, 9:00am – 9:30am", pin: "0000", status: "delivered", createdAt: daysAgo(1, 8), deliveredAt: daysAgo(1, 9), unread: 0, msgs: []
      },
      {
        id: "KD-2409", cat: "supplies", title: "Printer ink pickup", items: "1 black ink cartridge for Epson L3110",
        shop: "ADNU Bookstore", pickup: "ADNU Bookstore · Ground Floor", dropoff: "College of Education, Room 5",
        customer: "Denise Uy", customerInitials: "DU", customerRating: "4.9", customerPhone: "", fee: 26, tip: 10, distance: 0.5, eta: 9,
        window: "Sep 27, 1:00pm – 1:30pm", pin: "0000", status: "delivered", createdAt: daysAgo(3, 12), deliveredAt: daysAgo(3, 13), unread: 0, msgs: []
      },
      {
        id: "KD-2405", cat: "food", title: "Snack delivery", items: "2 pork siomai, 1 gulaman",
        shop: "Knights Food Court", pickup: "Knights Food Court · Student Center", dropoff: "SHS Building Room 301",
        customer: "Rica Bautista", customerInitials: "RB", customerRating: "4.8", customerPhone: "", fee: 30, tip: 0, distance: 0.7, eta: 11,
        window: "Sep 26, 3:00pm – 3:30pm", pin: "0000", status: "cancelled", createdAt: daysAgo(4, 14), cancelledAt: daysAgo(4, 15),
        cancelReason: "Customer cancelled — item unavailable", unread: 0, msgs: []
      }
    ]
  };
}

function normalize(d) {
  d.jobs = d.jobs || [];
  d.notifs = d.notifs || [];
  d.settings = Object.assign({ push: true, requestAlerts: true, sound: true }, d.settings || {});
  d.nextNotifId = d.nextNotifId || 100;
  d.userId = d.userId || null;
  d.profile = Object.assign({ vehicle: "", plate: "" }, d.profile || {});
  d.jobs.forEach((j) => {
    j.msgs = j.msgs || [];
    j.unread = j.unread || 0;
    if (!j.pickup) j.pickup = j.shop || PICKUPS[j.cat] || "Campus pickup point";
  });
  return d;
}

let DB;
try {
  const raw = localStorage.getItem(KEY);
  DB = raw ? normalize(JSON.parse(raw)) : seed();
} catch (err) {
  DB = seed();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (err) {}
}
persist();

function ensureAccount() {
  const key = accountKey();
  if (DB.userId && DB.userId !== key) {
    DB.jobs = DB.jobs.filter((j) => !j.linked);
    DB.notifs = [];
    UI.chatJob = null;
    UI.trackJob = null;
    UI.busy = null;
  }
  DB.userId = key;
  persist();
}

const UI = { cat: "all", q: "", sort: "newest", hist: "all", period: "today", trackJob: null, chatJob: null, busy: null, loading: false, error: null, lastAdvance: 0 };
const MAIN_TABS = { "r-dash": 1, "r-available": 1, "r-active": 1, "r-messages": 1, "r-history": 1, "r-profile": 1 };

function jobById(id) { return DB.jobs.find((j) => j.id === id); }
function activeJob() { return DB.jobs.find((j) => ACTIVE_STATUSES.includes(j.status)); }
function availableJobs() { return DB.jobs.filter((j) => j.status === "available"); }
function statusOf(j) { return STATUS[j.status] || STATUS.available; }
function unreadTotal() { return DB.jobs.reduce((s, j) => s + (ACTIVE_STATUSES.includes(j.status) || j.status === "delivered" ? (j.unread || 0) : 0), 0); }
function runnerUnread() { return DB.notifs.filter((n) => !n.read).length; }
function tipsBetween(from, to) {
  return DB.jobs.filter((j) => j.status === "delivered" && j.deliveredAt >= from && j.deliveredAt < to).reduce((s, j) => s + (j.tip || 0), 0);
}
function jobsDeliveredBetween(from, to) {
  return DB.jobs.filter((j) => j.status === "delivered" && j.deliveredAt >= from && j.deliveredAt < to);
}

function addRunnerNotif(title, body, jobId) {
  DB.notifs.unshift({ id: DB.nextNotifId++, title, body, time: "Just now", read: false, jobId: jobId || null });
  DB.notifs = DB.notifs.slice(0, 40);
  persist();
  updateBadges();
}
function updateBadges() {
  const has = runnerUnread() > 0;
  $$("#r-bell, #r-active-bell, #r-prof-bell").forEach((b) => b.classList.toggle("hasnews", has));
  const dot = $("#r-nav-unread");
  if (dot) dot.classList.toggle("show", unreadTotal() > 0);
  const msgQuick = $("#r-q-msg");
  if (msgQuick) msgQuick.textContent = unreadTotal() ? unreadTotal() + " unread" : "No unread";
}

function syncLinkedJobs() {
  const orders = (KD.state && KD.state.orders) || [];
  orders.forEach((o) => {
    if (o.status === "finding" && !o.runnerManaged) {
      let j = DB.jobs.find((x) => x.linkedOrderId === o.id);
      if (!j) {
        j = {
          id: o.id, cat: o.cat, title: o.title, items: o.items, shop: PICKUPS[o.cat] || "Campus pickup point",
          pickup: PICKUPS[o.cat] || "Campus pickup point", dropoff: o.dropoff, customer: KD.state.user.fullName,
          customerInitials: initials(KD.state.user.fullName), customerRating: "", customerPhone: KD.state.user.phone || "",
          fee: o.fee || 25, tip: o.tip || 0, distance: 0, eta: 0, window: o.time, note: o.notes || "",
          pin: o.pin || "0000", status: "available", createdAt: o.createdTs || Date.now(), unread: 0, msgs: [],
          linked: true, linkedOrderId: o.id
        };
        DB.jobs.unshift(j);
      } else if (j.status === "available") {
        j.fee = o.fee || j.fee;
        j.tip = o.tip || j.tip;
        j.dropoff = o.dropoff;
        j.window = o.time;
        j.note = o.notes || "";
        j.pin = o.pin || j.pin;
      }
    }
    const j = DB.jobs.find((x) => x.linkedOrderId === o.id);
    if (j && ACTIVE_STATUSES.includes(j.status) && o.status === "cancelled") {
      j.status = "cancelled";
      j.cancelledAt = Date.now();
      j.cancelReason = "Customer cancelled the request";
      addRunnerNotif("Request cancelled", j.id + " · " + j.customer + " cancelled the request.", j.id);
    }
  });
  persist();
}

function syncCustomerOrder(j) {
  if (!j.linkedOrderId) return;
  const o = KD.orderById(j.linkedOrderId);
  if (!o) return;
  const m = CUSTOMER_MAP[j.status];
  if (!m) {
    if (j.status === "available" || j.status === "cancelled") {
      o.runnerManaged = false;
      o.status = "finding";
      o.stage = 0;
      o.courier = null;
      o.etaMin = 25;
      o.updates = o.updates || [];
      o.updates.push(j.status === "cancelled" ? "Courier cancelled — we are matching you with another runner" : "Runner request released back to the pool");
      if (j.status === "cancelled") KD.addNotif("order", "Courier unavailable — " + o.id, "We are matching your request with another Knights runner.", { screen: "requests" });
    }
    KD.refreshAll();
    return;
  }
  const who = me();
  const prev = o._runnerStatus;
  o.runnerManaged = true;
  o.stage = m.stage;
  o.status = m.status;
  o.courier = who.name;
  o.courierInitials = who.initials;
  o.courierRating = "";
  o.courierDeliveries = "";
  o.courierVehicle = DB.profile.vehicle || "";
  o.times = o.times || [];
  if (!o.times[m.stage]) o.times[m.stage] = fmtT(new Date());
  o.etaMin = j.status === "delivered" ? 0 : null;
  o.updates = o.updates || [];
  if (prev !== j.status) {
    o._runnerStatus = j.status;
    o.updates.push(who.name + " " + m.text);
    if (j.status === "accepted") KD.addNotif("order", "Courier assigned to " + o.id, who.name + " will handle your request. Track it live!", { screen: "tracking", orderId: o.id });
    if (j.status === "picked_up") KD.addNotif("order", "Order picked up — " + o.id, "Your items are on the way to " + o.dropoff + ".", { screen: "tracking", orderId: o.id });
    if (j.status === "arriving") KD.addNotif("order", "Courier arriving soon — " + o.id, who.name + " is near " + o.dropoff + ".", { screen: "tracking", orderId: o.id });
    if (j.status === "delivered") KD.addNotif("ok", "Delivered! " + o.id, "Your order was handed over. Rate " + who.name + " to help other Knights.", { orderId: o.id });
  }
  KD.refreshAll();
  if ($("#scr-tracking").classList.contains("active")) KD.renderTracking();
}

function acceptJob(id, btn) {
  if (!DB.online) { KD.toast("You are offline — go online to accept requests", "i-power"); return; }
  if (UI.busy) return;
  if (activeJob()) { KD.toast("Finish your active delivery before accepting another", "i-run"); return; }
  const j = jobById(id);
  if (!j || j.status !== "available") {
    KD.toast("That request was just taken — refreshing", "i-alert");
    renderAll();
    return;
  }
  UI.busy = id;
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="r-spin"></span>Accepting…'; }
  setTimeout(() => {
    const fresh = jobById(id);
    if (!fresh || fresh.status !== "available" || activeJob()) {
      UI.busy = null;
      KD.toast("Just taken — refreshing available requests", "i-alert");
      renderAll();
      return;
    }
    fresh.status = "accepted";
    fresh.acceptedAt = Date.now();
    fresh.msgs = fresh.msgs || [];
    fresh.msgs.push(msg("system", "You accepted this request. Head to the pickup point.", Date.now()));
    addRunnerNotif("Request accepted", fresh.id + " · " + fresh.customer + " · " + money(fresh.fee) + " fee", fresh.id);
    syncCustomerOrder(fresh);
    persist();
    UI.busy = null;
    KD.closeSheet();
    UI.trackJob = fresh.id;
    KD.toast("Request accepted — head to pickup", "i-check-c");
    renderAll();
    KD.go("r-tracking");
  }, 520);
}

function advanceJob(id) {
  const j = jobById(id);
  if (!j) return;
  const meta = statusOf(j);
  if (!meta.next) return;
  if (meta.next === "delivered") { openDeliverConfirm(j); return; }
  const now = Date.now();
  if (now - UI.lastAdvance < 500) return;
  UI.lastAdvance = now;
  j.status = meta.next;
  if (j.status === "picked_up") j.pickedAt = Date.now();
  addRunnerNotif("Status updated", j.id + " — " + statusOf(j).label, j.id);
  syncCustomerOrder(j);
  persist();
  renderAll();
  KD.toast(statusOf(j).label + " recorded", "i-check-c");
}

function openDeliverConfirm(j) {
  KD.openSheet(
    '<h2>Confirm handoff</h2><p class="sub">' + esc(j.id) + " · " + esc(j.customer) + "</p>" +
    '<div class="r-warnline"><svg width="17" height="17"><use href="#i-shield"/></svg><p>Ask the customer for their 4-digit delivery PIN before handing over the order.</p></div>' +
    '<div class="r-pininput" id="r-pininputs">' +
    [0, 1, 2, 3].map((i) => '<input type="password" inputmode="numeric" maxlength="1" data-pin="' + i + '" aria-label="PIN digit ' + (i + 1) + '">').join("") +
    "</div>" +
    '<div class="hint" id="r-pin-hint">Enter the 4-digit PIN.</div>' +
    '<p class="smallnote" style="text-align:left">Demo build: any 4-digit PIN is accepted because PIN verification has no production server yet.</p>' +
    '<div class="breakdown"><div class="brow"><span>Delivery fee</span><span>' + money(j.fee) + "</span></div>" +
    '<div class="brow"><span>Customer tip</span><span>' + money(j.tip || 0) + "</span></div>" +
    '<div class="brow total"><span>Tip earned by you</span><span>' + money(j.tip || 0) + "</span></div></div>" +
    '<div class="sheetactions"><button class="r-btn-yellow" data-r-act="confirm-deliver" data-id="' + esc(j.id) + '"><svg width="18" height="18"><use href="#i-check-c"/></svg>Confirm delivered</button>' +
    '<button class="r-btn-ghost" data-r-act="close-sheet">Not yet</button></div>'
  );
  setTimeout(() => { const f = $("#r-pininputs input"); if (f) f.focus(); }, 420);
}

function confirmDeliver(id) {
  const j = jobById(id);
  if (!j || j.status === "delivered") return;
  const inputs = $$("#r-pininputs input");
  const pin = inputs.map((i) => i.value).join("");
  const ok = /^\d{4}$/.test(pin);
  inputs.forEach((i) => i.classList.toggle("invalid", !ok));
  const hint = $("#r-pin-hint");
  if (hint) hint.classList.toggle("show", !ok);
  if (!ok) { KD.toast("Enter the 4-digit handoff PIN", "i-alert"); return; }
  j.status = "delivered";
  j.deliveredAt = Date.now();
  j.msgs = j.msgs || [];
  j.msgs.push(msg("system", "Delivery completed and confirmed.", Date.now()));
  syncCustomerOrder(j);
  addRunnerNotif("Delivery completed", j.id + " · tip " + money(j.tip || 0) + " recorded", j.id);
  persist();
  KD.closeSheet();
  UI.trackJob = null;
  renderAll();
  KD.toast("Delivery complete — " + money(j.tip || 0) + " tip recorded", "i-cash");
  setTimeout(() => {
    if (KD.confetti) KD.confetti();
    KD.go("r-history", { root: true });
  }, 250);
}

function cancelJob(id, reason) {
  const j = jobById(id);
  if (!j || !ACTIVE_STATUSES.includes(j.status)) return;
  j.status = "cancelled";
  j.cancelledAt = Date.now();
  j.cancelReason = reason || "Cancelled by runner";
  j.msgs = j.msgs || [];
  j.msgs.push(msg("system", "Run cancelled — " + j.cancelReason, Date.now()));
  syncCustomerOrder(j);
  addRunnerNotif("Run cancelled", j.id + " · " + j.cancelReason, j.id);
  persist();
  KD.closeSheet();
  UI.trackJob = null;
  renderAll();
  KD.toast("Delivery run cancelled", "i-x-c");
}

function openCancelJob(j) {
  UI.cancelReason = null;
  const reasons = ["Vehicle issue", "Cannot reach customer", "Too far from my route", "Other"];
  KD.openSheet('<h2>Cancel this run?</h2><p class="sub">' + esc(j.id) + " · " + esc(j.customer) + " — the customer will be notified.</p>" +
    reasons.map((r) => '<div class="optrow" data-r-cancelreason="' + esc(r) + '"><div class="rmain"><h4>' + esc(r) + '</h4></div><span class="radio"></span></div>').join("") +
    '<div class="hint" id="r-cancel-hint">Pick a reason first.</div>' +
    '<div class="sheetactions"><button class="r-btn-danger" data-r-act="confirm-cancel" data-id="' + esc(j.id) + '">Cancel run</button>' +
    '<button class="r-btn-ghost" data-r-act="close-sheet">Keep this run</button></div>');
}

function routeHTML(j) {
  return '<div class="r-route">' +
    '<div class="r-rrow"><span class="r-rdot pick"></span><span class="r-rline"></span><div class="r-rtext"><small>Pickup</small><b>' + esc(j.pickup || j.shop) + "</b></div></div>" +
    '<div class="r-rrow"><span class="r-rdot drop"></span><div class="r-rtext"><small>Drop-off</small><b>' + esc(j.dropoff) + "</b></div></div></div>";
}

function chipsHTML(j) {
  return '<div class="r-jmeta">' +
    '<span class="r-chip"><svg width="13" height="13"><use href="#i-tag"/></svg>' + esc(j.window) + "</span>" +
    (j.tip ? '<span class="r-chip" style="color:var(--ok)"><svg width="13" height="13" style="color:var(--ok)"><use href="#i-cash"/></svg>' + money(j.tip) + " tip</span>" : "") +
    "</div>";
}

function acceptButtonHTML(j) {
  const busy = UI.busy === j.id;
  const disabled = !DB.online || !!activeJob() || busy;
  return '<button class="r-acceptbtn" data-r-accept="' + esc(j.id) + '"' + (disabled ? " disabled" : "") + ">" + (busy ? '<span class="r-spin"></span>Accepting…' : "Accept") + "</button>";
}

function jobCardHTML(j, compact) {
  const catName = (KD.CATS[j.cat] || {}).name || "Request";
  const pill = j.linked ? '<span class="r-pill r-st-yellow">Your request</span>' : compact ? '<span class="r-pill r-st-available">New</span>' : '<span class="r-pill r-st-available">Available</span>';
  return '<article class="r-jobcard" data-r-job="' + esc(j.id) + '">' +
    '<div class="r-jtop">' + catTile(j.cat) +
    '<div class="r-jmain"><h3>' + esc(j.title) + '</h3><div class="r-jid">' + esc(j.id) + " · " + esc(catName) + " · " + esc(j.window) + "</div></div>" + pill + "</div>" +
    '<div class="r-jdrop"><svg width="15" height="15"><use href="#i-pin"/></svg><span>' + esc(j.dropoff) + "</span></div>" +
    '<div class="r-jfoot"><div class="r-fee"><b>' + money(j.fee) + "</b><small>" + (j.tip ? "fee + " + money(j.tip) + " tip" : "delivery fee") + "</small></div>" + acceptButtonHTML(j) + "</div></article>";
}

function stepHTML(j) {
  const order = ["accepted", "picking_up", "picked_up", "on_way", "arriving", "delivered"];
  const currentIdx = order.indexOf(j.status);
  const labels = { accepted: "Accepted", picking_up: "Heading to pickup", picked_up: "Picked up", on_way: "On the way", arriving: "Arriving soon", delivered: "Delivered" };
  return '<div class="r-timeline">' + order.map((k, i) => {
    const done = currentIdx >= 0 && (i < currentIdx || j.status === "delivered");
    const cur = i === currentIdx && j.status !== "delivered";
    return '<div class="r-tstep ' + (done ? "done" : "") + (cur ? " current" : "") + '">' +
      '<span class="r-tline"></span><span class="r-tdot">' + (done ? '<svg width="13" height="13"><use href="#i-check"/></svg>' : cur ? '<span class="pulse-dot" style="background:#241E6E"></span>' : "") + "</span>" +
      '<div class="r-tinfo"><h4>' + labels[k] + "</h4>" + (k === "delivered" && j.deliveredAt ? "<small>" + dayLabel(j.deliveredAt) + "</small>" : "") + "</div></div>";
  }).join("") + "</div>";
}

function renderDashboard() {
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const who = me();
  const g = $("#r-greet");
  if (g) g.textContent = greet + ", " + who.first;
  const gs = $("#r-greet-sub");
  if (gs) gs.textContent = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + " · Ateneo de Naga University";
  const avatar = $("#r-top-profile");
  if (avatar) avatar.textContent = who.initials;
  const mode = $("#scr-r-dash .r-modechip");
  if (mode) mode.classList.toggle("offline", !DB.online);
  const available = availableJobs().length;
  const doneToday = DB.jobs.filter((j) => j.status === "delivered" && j.deliveredAt >= startOfDay(0)).length;
  const reqQuick = $("#r-q-req");
  if (reqQuick) reqQuick.textContent = available + " near you";
  const msgQuick = $("#r-q-msg");
  if (msgQuick && !unreadTotal()) msgQuick.textContent = "No unread";
  const earnQuick = $("#r-q-earn");
  if (earnQuick) earnQuick.textContent = "Tips & payouts";
  const hero = $("#r-dash-hero");
  if (hero) {
    hero.innerHTML = '<div class="r-online-card ' + (DB.online ? "" : "offline") + '">' +
      '<div class="r-oc-top"><span class="r-statepill"><i></i>' + (DB.online ? "Online" : "Offline") + "</span>" +
      '<span style="font-size:11.5px;font-weight:800;opacity:.7">' + doneToday + " done today</span></div>" +
      "<h2>" + (DB.online ? "You are online" : "You are offline") + "</h2>" +
      '<p class="r-ocsub">' + (DB.online ? "Requests near the ADNU campus are showing up. Accept one when you are ready." : "Go online to receive new delivery requests.") + "</p>" +
      '<div class="r-oc-actions"><button class="r-oc-toggle ' + (DB.online ? "" : "go-online") + '" data-r-online="toggle">' + (DB.online ? "Go offline" : "Go online") + "</button></div></div>";
  }
  const active = activeJob();
  const ah = $("#r-dash-active");
  if (ah) {
    if (!active) {
      ah.innerHTML = '<div class="r-wallet"><div class="r-wtop"><h3>No active delivery</h3><span class="r-pill r-st-muted">Idle</span></div><p>Accept a nearby request to start a run. Your delivery status and customer chat appear here.</p><button class="r-btn-soft" style="width:100%;margin-top:12px" data-r-go="r-available"><svg width="17" height="17"><use href="#i-box"/></svg>Browse requests</button></div>';
    } else {
      const meta = statusOf(active);
      ah.innerHTML = '<div class="r-activecard">' +
        '<div class="r-ac-top"><span class="r-pill ' + meta.pill + '">' + meta.label + '</span><span style="font-size:11.5px;font-weight:800;opacity:.7">' + esc(active.id) + "</span></div>" +
        "<h2>" + esc(active.title) + '</h2><div class="r-acid">' + esc(active.customer) + " · " + esc(active.dropoff) + "</div>" +
        '<div class="r-progress"><div class="r-ptrack"><div class="r-pfill" style="width:' + meta.progress + '%"></div></div><div class="r-plabels"><span>' + meta.label + "</span><span>" + esc(active.window) + "</span></div></div></div>" +
        '<div class="r-act-actions"><button class="r-btn-primary" data-r-resume="' + esc(active.id) + '"><svg width="18" height="18"><use href="#i-run"/></svg>Open active delivery</button>' +
        '<button class="r-btn-soft" style="width:100%;margin-top:8px" data-r-act="chat" data-id="' + esc(active.id) + '"><svg width="17" height="17"><use href="#i-chat"/></svg>Message customer</button></div>';
    }
  }
  const near = $("#r-dash-jobs");
  if (near) {
    const list = availableJobs().sort((a, b) => b.createdAt - a.createdAt).slice(0, 2);
    near.innerHTML = list.length ? list.map((j) => jobCardHTML(j, true)).join("") :
      '<div class="r-empty"><div class="resi"><svg width="34" height="34"><use href="#i-box"/></svg></div><h3>No requests nearby</h3><p>New runs appear here as soon as customers post them.</p></div>';
  }
  const earn = $("#r-dash-earn");
  if (earn) earn.innerHTML = "";
  updateBadges();
}

function sortJobs(list) {
  const l = list.slice();
  if (UI.sort === "fee") l.sort((a, b) => (b.fee + (b.tip || 0)) - (a.fee + (a.tip || 0)));
  else if (UI.sort === "oldest") l.sort((a, b) => a.createdAt - b.createdAt);
  else l.sort((a, b) => b.createdAt - a.createdAt);
  return l;
}
function sortLabel() {
  return { newest: "Newest", oldest: "Oldest", fee: "Highest fee" }[UI.sort] || "Newest";
}
function renderAvailable() {
  const count = $("#r-avail-count");
  if (count) count.textContent = availableJobs().length + " request" + (availableJobs().length === 1 ? "" : "s") + " near you";
  const chip = $("#r-avail-status");
  if (chip) { chip.classList.toggle("offline", !DB.online); chip.innerHTML = '<i></i>' + (DB.online ? "Online" : "Offline"); }
  const refresh = $("#r-avail-refresh");
  if (refresh) refresh.classList.toggle("spinning", !!UI.loading);
  const filters = $("#r-avail-filters");
  if (filters) {
    const cats = [["all", "All"], ...Object.keys(KD.CATS).map((k) => [k, KD.CATS[k].name])];
    filters.innerHTML = cats.map(([k, n]) => '<button class="r-chip-filter' + (UI.cat === k ? " on" : "") + '" data-r-cat="' + k + '">' + n + "</button>").join("");
  }
  const sl = $("#r-avail-sortlabel");
  if (sl) sl.textContent = sortLabel();
  const list = $("#r-avail-list");
  if (!list) return;
  if (UI.loading) {
    list.innerHTML = '<div class="r-skel"></div><div class="r-skel"></div><div class="r-skel"></div>';
    return;
  }
  if (UI.error) {
    list.innerHTML = '<div class="r-alert"><div class="resi err"><svg width="30" height="30"><use href="#i-alert"/></svg></div><h3>Could not load requests</h3><p>' + esc(UI.error) + '</p><button class="r-btn-soft" data-r-retry="1">Try again</button></div>';
    return;
  }
  let items = availableJobs();
  if (UI.cat !== "all") items = items.filter((j) => j.cat === UI.cat);
  if (UI.q) {
    const q = UI.q.toLowerCase();
    items = items.filter((j) => (j.title + " " + j.shop + " " + j.dropoff + " " + j.id).toLowerCase().includes(q));
  }
  items = sortJobs(items);
  if (!items.length) {
    const reset = UI.cat !== "all" || UI.q;
    list.innerHTML = '<div class="r-empty"><div class="resi"><svg width="34" height="34"><use href="#i-box"/></svg></div><h3>No requests match</h3><p>' + (reset ? "Try a different category or clear your search." : "New requests near the ADNU campus will appear here.") + '</p>' + (reset ? '<button class="r-btn-soft" data-r-reset="1">Reset filters</button>' : "") + "</div>";
    return;
  }
  if (activeJob()) {
    list.innerHTML = '<div class="r-note"><svg width="15" height="15"><use href="#i-alert"/></svg>You already have an active delivery. Finish it before accepting another.</div>' + items.map((j) => jobCardHTML(j)).join("");
  } else {
    list.innerHTML = items.map((j) => jobCardHTML(j)).join("");
  }
}

function renderActive() {
  const box = $("#r-active-body");
  if (!box) return;
  const j = activeJob();
  if (!j) {
    box.innerHTML = '<div class="r-empty" style="padding-top:40px"><div class="resi"><svg width="34" height="34"><use href="#i-run"/></svg></div><h3>No active delivery</h3><p>Accept a request from Available to start a run. Active runs show live status controls here.</p><button class="r-btn-yellow" style="margin-top:14px" data-r-go="r-available"><svg width="17" height="17"><use href="#i-box"/></svg>Browse requests</button></div>';
    renderActiveRecent();
    return;
  }
  const meta = statusOf(j);
  const sub = $("#r-active-sub");
  if (sub) sub.textContent = j.id + " · " + esc(j.customer);
  const step = !DB.online && j.status !== "arriving" ? "You are offline — go online to keep updating." : "Next: " + (meta.next === "delivered" ? "Confirm the handoff PIN" : (STATUS[meta.next] ? STATUS[meta.next].label : ""));
  box.innerHTML =
    '<div class="r-activecard"><div class="r-ac-top"><span class="r-pill ' + meta.pill + '">' + meta.label + '</span><span style="font-size:11.5px;font-weight:800;opacity:.7">' + esc(j.id) + "</span></div>" +
    '<h2 style="padding:0 14px">' + esc(j.title) + "</h2>" +
    '<div style="padding:0 14px">' + routeHTML(j) + "</div>" +
    '<div class="r-progress" style="padding:0 14px"><div class="r-ptrack"><div class="r-pfill" style="width:' + meta.progress + '%"></div></div><div class="r-plabels"><span>' + meta.label + "</span><span>" + step + "</span></div></div>" +
    '<div class="r-ac-foot" style="padding:0 14px 10px"><div class="r-ac-cust"><div class="avatar">' + esc(j.customerInitials) + "</div><div><b>" + esc(j.customer) + "</b><small>Customer</small></div></div>" +
    '<div class="r-ac-amount"><b style="font-size:11.5px">' + esc(j.window) + "</b><small>Preferred time</small></div></div>" +
    (j.note ? '<p class="r-note" style="margin:0 14px 12px"><svg width="15" height="15"><use href="#i-note"/></svg>' + esc(j.note) + "</p>" : "") +
    '<div style="padding:0 14px 14px"><div class="r-twocol"><button class="r-btn-soft" data-r-act="chat" data-id="' + esc(j.id) + '"><svg width="17" height="17"><use href="#i-chat"/></svg>Message customer</button>' +
    '<button class="r-btn-soft" data-r-act="call" data-id="' + esc(j.id) + '"><svg width="17" height="17"><use href="#i-phone"/></svg>Call</button></div></div></div>' +
    '<div class="r-fixfoot"><button class="r-btn-primary" data-r-advance="' + esc(j.id) + '"' + (DB.online || meta.next === "delivered" ? "" : " disabled") + ">" + esc(meta.action || "") + (meta.next ? '<svg width="18" height="18"><use href="#' + (meta.next === "delivered" ? "i-check-c" : "i-chev-r") + '"/></svg>' : "") + "</button>" +
    '<button class="r-btn-ghost" style="width:100%;margin-top:8px" data-r-act="cancel" data-id="' + esc(j.id) + '">Cancel this run</button></div>';
  renderActiveRecent();
}

function renderActiveRecent() {
  const box = $("#r-active-recentsection");
  if (!box) return;
  const recent = DB.jobs.filter((j) => j.status === "delivered" && j.deliveredAt >= startOfDay(1)).sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, 2);
  const j = activeJob();
  box.style.display = recent.length ? "" : "none";
  box.innerHTML = recent.length ? "<h3>Completed today</h3>" + recent.filter((r) => !j || r.id !== j.id).map((r) =>
    '<div class="r-thread" data-r-job="' + esc(r.id) + '">' + catTile(r.cat, 42) +
    '<div class="r-tmain"><h4>' + esc(r.title) + '</h4><p>' + esc(r.id) + " · " + esc(r.customer) + '</p></div><span class="r-pill r-st-done">Done</span></div>').join("") : "";
}

function renderTracking() {
  const box = $("#r-track-body");
  if (!box) return;
  const j = jobById(UI.trackJob) || activeJob();
  const title = $("#r-track-title");
  if (!j) {
    if (title) title.textContent = "Delivery tracking";
    $("#r-track-chat").disabled = true;
    box.innerHTML = '<div class="r-empty" style="padding-top:40px"><div class="resi"><svg width="34" height="34"><use href="#i-route"/></svg></div><h3>No delivery selected</h3><p>Tracking appears when you accept a request or open an active run.</p><button class="r-btn-soft" style="margin-top:14px" data-r-go="r-available">Browse requests</button></div>';
    return;
  }
  $("#r-track-chat").disabled = false;
  const meta = statusOf(j);
  if (title) title.textContent = j.status === "delivered" ? "Delivery complete" : "Live tracking";
  if (j.status === "delivered") {
    box.innerHTML = '<div class="r-card" style="text-align:center;padding:26px 16px"><div class="resi" style="background:var(--okBg);color:var(--ok)"><svg width="34" height="34"><use href="#i-check-c"/></svg></div>' +
      "<h2>Delivered</h2><p style='color:var(--muted);margin:6px 0 0'>" + esc(j.title) + " · " + esc(j.id) + "</p>" +
      '<div class="r-wamt" style="margin:12px 0 4px">' + money(j.tip || 0) + '</div><p class="sub" style="margin:0">Tip recorded</p>' +
      '<div class="r-twocol" style="margin-top:16px"><button class="r-btn-soft" data-r-chatjob="' + esc(j.id) + '"><svg width="17" height="17"><use href="#i-chat"/></svg>Chat</button>' +
      '<button class="r-btn-soft" data-r-go="r-history"><svg width="17" height="17"><use href="#i-receipt"/></svg>History</button></div></div>' + stepHTML(j);
    return;
  }
  const top = '<div class="r-card" style="padding:16px"><div class="r-ac-top"><span class="r-pill ' + meta.pill + '">' + meta.label + '</span><span style="font-size:11.5px;font-weight:800;opacity:.7">' + esc(j.id) + '</span></div>' +
    "<h2>" + esc(j.title) + '</h2><p style="color:var(--muted);font-size:12.5px;margin:4px 0 0">' + esc(j.customer) + " · " + esc(j.window) + "</p>" + routeHTML(j) +
    '<div class="r-act-actions" style="padding:0 0 4px"><button class="r-btn-primary" data-r-advance="' + esc(j.id) + '">' + esc(meta.action || "Continue") + (meta.next ? '<svg width="18" height="18"><use href="#' + (meta.next === "delivered" ? "i-check-c" : "i-chev-r") + '"/></svg>' : "") + "</button></div></div>";
  box.innerHTML = top + stepHTML(j) + '<div style="height:16px"></div>';
}

function renderThreads() {
  const sub = $("#r-msg-sub");
  const threads = DB.jobs.filter((j) => (j.msgs && j.msgs.length) || ACTIVE_STATUSES.includes(j.status));
  if (sub) sub.textContent = threads.length ? threads.length + " conversation" + (threads.length === 1 ? "" : "s") + " · " + unreadTotal() + " unread" : "No conversations yet";
  const list = $("#r-thread-list");
  if (!list) return;
  if (!threads.length) {
    list.innerHTML = '<div class="r-empty" style="padding-top:36px"><div class="resi"><svg width="34" height="34"><use href="#i-chat"/></svg></div><h3>No messages yet</h3><p>Customer chats appear here once you accept a request.</p></div>';
    return;
  }
  const items = threads.filter((j) => !UI.q || (j.customer + " " + j.title + " " + j.id).toLowerCase().includes(UI.q.toLowerCase())).sort((a, b) => {
    const at = a.msgs.length ? a.msgs[a.msgs.length - 1].ts : a.createdAt;
    const bt = b.msgs.length ? b.msgs[b.msgs.length - 1].ts : b.createdAt;
    return bt - at;
  });
  list.innerHTML = items.map((j) => {
    const last = j.msgs.length ? j.msgs[j.msgs.length - 1] : null;
    const preview = last ? (last.from === "me" ? "You: " : "") + last.text : "No messages yet — say hello!";
    const stamp = last ? ago(last.ts) : ago(j.createdAt);
    const meta = statusOf(j);
    return '<div class="r-thread' + (UI.chatJob === j.id ? " on" : "") + '" data-r-thread="' + esc(j.id) + '">' + catTile(j.cat, 46) +
      '<div class="r-tmain"><div class="r-trow"><h4>' + esc(j.customer) + "</h4><small>" + esc(stamp) + "</small></div>" +
      '<p class="' + (j.unread ? "unread" : "") + '">' + esc(preview) + '</p><div class="r-tsub"><span class="r-pill ' + meta.pill + '">' + meta.label + "</span><span>" + esc(j.id) + "</span></div></div>" +
      (j.unread ? '<span class="r-unread">' + j.unread + "</span>" : "") + "</div>";
  }).join("");
}

function openChatFor(id) {
  const j = jobById(id);
  if (!j) return;
  j.unread = 0;
  UI.chatJob = id;
  persist();
  updateBadges();
  writeHash("r-chat", id);
  KD.go("r-chat");
}

function dayGroup(ts) {
  const t = startOfDay(0);
  if (ts >= t) return "Today";
  if (ts >= startOfDay(1)) return "Yesterday";
  return "Earlier";
}
function renderChat() {
  const j = jobById(UI.chatJob) || activeJob();
  if (j) UI.chatJob = j.id;
  const a = $("#r-ch-avatar");
  const n = $("#r-ch-name");
  const s = $("#r-ch-status");
  const call = $("#r-ch-call");
  const banner = $("#r-ch-banner");
  const msgs = $("#r-ch-msgs");
  const quick = $("#r-ch-quick");
  const input = $("#r-ch-input");
  const send = $("#r-ch-send");
  if (!j) {
    if (n) n.textContent = "No chat";
    if (s) s.textContent = "";
    if (a) a.textContent = "?";
    if (call) call.disabled = true;
    if (input) input.disabled = true;
    if (send) send.disabled = true;
    if (banner) banner.hidden = true;
    if (quick) quick.innerHTML = "";
    if (msgs) msgs.innerHTML = '<div class="r-empty" style="padding-top:30px"><div class="resi"><svg width="30" height="30"><use href="#i-chat"/></svg></div><h3>No conversation selected</h3><p>Open a thread from Messages.</p></div>';
    return;
  }
  if (a) a.textContent = j.customerInitials;
  if (n) n.textContent = j.customer;
  if (s) s.textContent = statusOf(j).label + " · " + j.id;
  if (call) call.disabled = false;
  if (call) call.dataset.id = j.id;
  if (banner) banner.hidden = false;
  if (input) { input.disabled = false; input.placeholder = "Message " + firstWord(j.customer) + "…"; }
  if (send) send.disabled = false;
  if (quick) quick.innerHTML = ["I'm on my way!", "I'm at the pickup point.", "Please wait a moment.", "I've arrived 🛵"].map((q) => '<button class="r-chip-filter" data-r-quick="' + esc(q) + '">' + esc(q) + "</button>").join("");
  if (msgs) {
    if (!j.msgs.length) {
      msgs.innerHTML = '<div class="r-empty" style="padding-top:26px"><div class="resi"><svg width="30" height="30"><use href="#i-chat"/></svg></div><h3>No messages yet</h3><p>Start the conversation with a quick reply or a custom message.</p></div>';
    } else {
      let lastDay = "";
      msgs.innerHTML = j.msgs.map((m) => {
        const g = dayGroup(m.ts);
        let head = "";
        if (g !== lastDay) { head = '<div class="r-ch-day">' + g + "</div>"; lastDay = g; }
        if (m.from === "system") return head + '<div class="r-ch-sys">' + esc(m.text) + "</div>";
        const out = m.from === "me";
        return head + '<div class="r-b' + (out ? "out" : "in") + '"><div class="r-bub">' + esc(m.text) + '</div><div class="r-bmeta">' + fmtT(new Date(m.ts)) + (out ? ' <svg width="12" height="12" style="vertical-align:-1px"><use href="#i-check"/></svg>' : "") + "</div></div>";
      }).join("");
      requestAnimationFrame(() => { msgs.scrollTop = msgs.scrollHeight; });
    }
  }
}

function sendRunnerMessage(text, fromQuick) {
  const j = jobById(UI.chatJob);
  const input = $("#r-ch-input");
  const t = (text != null ? text : (input ? input.value : "")).trim();
  if (!j || !t) return;
  j.msgs = j.msgs || [];
  const m = msg("me", t, Date.now());
  j.msgs.push(m);
  if (j.linkedOrderId && KD.pushCustomerChat) KD.pushCustomerChat(j.linkedOrderId, t, m.ts);
  if (input && !fromQuick) input.value = "";
  renderChat();
  persist();
  m.state = "sending";
  setTimeout(() => {
    m.state = "sent";
    if (j.id === UI.chatJob && $("#scr-r-chat").classList.contains("active")) renderChat();
  }, 650);
}

function renderHistory() {
  const sub = $("#r-hist-sub");
  const all = DB.jobs.filter((j) => j.status === "delivered" || j.status === "cancelled").sort((a, b) => (b.deliveredAt || b.cancelledAt) - (a.deliveredAt || a.cancelledAt));
  if (sub) sub.textContent = all.length + " completed runs";
  let items = all;
  if (UI.hist !== "all") items = items.filter((j) => UI.hist === "cancelled" ? j.status === "cancelled" : j.cat === UI.hist);
  const filters = $("#r-hist-filters");
  if (filters) {
    const cats = [["all", "All"], ["food", "Food"], ["supplies", "Supplies"], ["printing", "Printing"], ["errands", "Errands"], ["cancelled", "Cancelled"]];
    filters.innerHTML = cats.map(([k, n]) => '<button class="r-chip-filter' + (UI.hist === k ? " on" : "") + '" data-r-hist="' + k + '">' + n + "</button>").join("");
  }
  const delivered = all.filter((j) => j.status === "delivered");
  const stats = myStats();
  const sum = $("#r-hist-summary");
  if (sum) {
    sum.innerHTML = '<div class="r-wallet"><div class="r-wtop"><h3>All-time</h3><span class="r-pill r-st-done">' + delivered.length + " delivered</span></div>" +
      '<div class="r-hrow"><div class="r-ostat"><b>' + money(stats.tips) + "</b><small>Tips recorded</small></div>" +
      '<div class="r-ostat"><b>' + stats.completion + "</b><small>Completion</small></div>" +
      '<div class="r-ostat"><b>' + stats.cancelled + "</b><small>Cancelled</small></div></div></div>";
  }
  const list = $("#r-hist-list");
  if (!list) return;
  if (!items.length) {
    list.innerHTML = '<div class="r-empty" style="padding-top:36px"><div class="resi"><svg width="34" height="34"><use href="#i-receipt"/></svg></div><h3>No runs here</h3><p>Completed and cancelled deliveries are listed in this tab.</p></div>';
    return;
  }
  list.innerHTML = items.map((j) => {
    const done = j.status === "delivered";
    return '<article class="r-histrow" data-r-job="' + esc(j.id) + '">' + catTile(j.cat, 44) +
      '<div class="r-hmain"><div class="r-trow"><h4>' + esc(j.title) + "</h4>" + (done ? '<span class="r-htip">+' + money(j.tip || 0) + " tip</span>" : '<span class="r-pill r-st-cancel">Cancelled</span>') + "</div>" +
      '<p>' + esc(j.id) + " · " + esc(j.customer) + "</p><small>" + dayLabel(j.deliveredAt || j.cancelledAt) + "</small></div></article>";
  }).join("");
}

function periodRange() {
  if (UI.period === "week") return [startOfDay(6), Date.now() + 1, "This week"];
  if (UI.period === "month") return [startOfDay(29), Date.now() + 1, "This month"];
  return [startOfDay(0), Date.now() + 1, "Today"];
}
function renderEarnings() {
  const sub = $("#r-earn-sub");
  const [from, to, label] = periodRange();
  const done = jobsDeliveredBetween(from, to);
  const tips = done.reduce((s, j) => s + (j.tip || 0), 0);
  const avg = done.length ? tips / done.length : 0;
  if (sub) sub.textContent = label + " · tips only";
  const body = $("#r-earn-body");
  if (!body) return;
  const tabs = '<div class="r-tabs">' + ["today", "week", "month"].map((k) => '<button class="r-tab' + (UI.period === k ? " on" : "") + '" data-r-period="' + k + '">' + (k === "today" ? "Today" : k === "week" ? "This week" : "This month") + "</button>").join("") + "</div>";
  const hero = '<div class="r-earnhero"><small>Tips for ' + label.toLowerCase() + "</small><h1>" + money(tips) + "</h1>" +
    '<div class="r-ehrow"><div><b>' + done.length + "</b><small>Deliveries</small></div><div><b>" + money(avg) + "</b><small>Avg tip</small></div></div></div>";
  const note = '<div class="r-note"><svg width="15" height="15"><use href="#i-alert"/></svg>Only customer tips are shown. Base runner pay, commission and payout schedules are not configured in this prototype — connect a backend and payout provider to enable them.</div>';
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(startOfDay(i));
  const dayTips = days.map((d) => tipsBetween(d, Math.min(d + 86400000, Date.now() + 1)));
  const max = Math.max(40, ...dayTips);
  const chart = '<div class="r-card"><h3 style="margin-bottom:10px">Last 7 days</h3><div class="r-barchart">' + dayTips.map((v, i) => {
    const d = new Date(days[i]).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1);
    return '<div class="r-bar"><i style="height:' + Math.max(4, Math.round(v / max * 100)) + '%"></i><small>' + d + "</small></div>";
  }).join("") + "</div><p style='color:var(--muted);font-size:12px;margin:10px 0 0'>Bars show confirmed customer tips for the last 7 days.</p></div>";
  const cards = done.slice().sort((a, b) => b.deliveredAt - a.deliveredAt).slice(0, 6).map((j) =>
    '<div class="r-histrow">' + catTile(j.cat, 42) + '<div class="r-hmain"><div class="r-trow"><h4>' + esc(j.title) + '</h4><span class="r-htip">+' + money(j.tip || 0) + "</span></div><p>" + esc(j.id) + " · " + dayLabel(j.deliveredAt) + "</p></div></div>").join("");
  const listblock = done.length ? '<h3 style="margin:14px 0 4px">Recent tips</h3>' + cards : '<div class="r-empty" style="margin-top:14px"><div class="resi"><svg width="32" height="32"><use href="#i-wallet"/></svg></div><h3>No tips yet</h3><p>Tips from delivered requests in this period will show here.</p></div>';
  body.innerHTML = tabs + hero + note + '<div style="height:8px"></div>' + chart + listblock + '<div style="height:16px"></div>';
}

function renderProfile() {
  const who = me();
  const stats = myStats();
  const top = $("#r-profile-top");
  if (top) {
    top.innerHTML = '<div class="r-profiletop"><div class="r-avatar">' + esc(who.initials) + "</div>" +
      "<div class='r-pinfo'><h2>" + esc(who.name) + "</h2><p>" + (who.sid ? "Student ID " + esc(who.sid) + " · " : "") + "Runner account</p>" +
      '<div class="r-pstats"><div class="r-pstat"><b>' + (stats.rating ? "★ " + stats.rating : "—") + "</b><small>" + (stats.rating ? "Rating" : "No ratings yet") + "</small></div><div class='r-pstat'><b>" + stats.done + "</b><small>Deliveries</small></div><div class='r-pstat'><b>" + stats.completion + "</b><small>Completion</small></div></div></div></div>";
  }
  const statsHTML = '<div class="r-menugroup"><div class="r-kv"><span>Email</span><b>' + esc(who.email || "Not set") + '</b></div><div class="r-kv"><span>Student ID</span><b>' + esc(who.sid || "Not set") + '</b></div><div class="r-kv"><span>Phone</span><b>' + esc(who.phone || "Not set") + "</b></div></div>";
  const menu = $("#r-profile-menu");
  if (menu) {
    const groups = [
      [["vehicle", "Vehicle & plate", "i-bike", DB.profile.vehicle ? DB.profile.vehicle : "Not set"], ["docs", "Documents & clearance", "i-note", "Not available"], ["payout", "Payout settings", "i-wallet", "Not configured"], ["notifs", "Notification settings", "i-bell", DB.settings.push ? "On" : "Off"]],
      [["safety", "Safety & SOS", "i-shield", "Campus safety"], ["help", "Help center", "i-info", ""], ["terms", "Terms & privacy", "i-note", ""], ["rate", "Rate Knights Delivery", "i-star", ""]],
      [["switch", "Switch to customer mode", "i-user", ""], ["signout", "Sign out", "i-power", ""]]
    ];
    menu.innerHTML = statsHTML + groups.map((g) => '<div class="r-menugroup">' + g.map(([act, label, icon, badge]) =>
      '<button class="menurow" data-r-profile="' + act + '"><span class="mic"><svg width="20" height="20"><use href="#' + icon + '"/></svg></span><b>' + label + (badge ? '<small class="r-msub">' + esc(badge) + "</small>" : "") + '</b><svg class="chev" width="18" height="18"><use href="#i-chev-r"/></svg></button>').join("") + "</div>").join("");
  }
}

function renderAll() {
  syncLinkedJobs();
  if (KD.state && KD.state.role === "runner") {
    renderDashboard();
    renderAvailable();
    renderActive();
    renderTracking();
    renderThreads();
    renderChat();
    renderHistory();
    renderEarnings();
    renderProfile();
    updateBadges();
  }
}

function openJobSheet(id) {
  const j = jobById(id);
  if (!j) return;
  const meta = statusOf(j);
  const isActive = ACTIVE_STATUSES.includes(j.status);
  const actions = j.status === "available"
    ? acceptButtonHTML(j).replace('class="r-acceptbtn"', 'class="r-btn-yellow" style="width:100%"')
    : isActive
      ? '<button class="r-btn-primary" style="width:100%" data-r-resume="' + esc(j.id) + '">' + esc(meta.action || "Open delivery") + "</button>"
      : '<button class="r-btn-soft" style="width:100%" data-r-chatjob="' + esc(j.id) + '"><svg width="17" height="17"><use href="#i-chat"/></svg>Open chat</button>';
  KD.openSheet(
    '<div class="r-sheettop">' + catTile(j.cat, 52) + "<div><h2>" + esc(j.title) + '</h2><p class="sub" style="margin:2px 0 0">' + esc(j.id) + " · " + esc(j.customer) + "</p></div></div>" +
    '<div class="r-jmeta"><span class="r-pill ' + meta.pill + '">' + meta.label + "</span>" + chipsHTML(j) + "</div>" + routeHTML(j) +
    (j.items ? '<div class="r-note" style="margin:0 0 10px"><svg width="15" height="15"><use href="#i-box"/></svg><span>' + esc(j.items) + "</span></div>" : "") +
    (j.note ? '<div class="r-note" style="margin:0 0 10px"><svg width="15" height="15"><use href="#i-note"/></svg><span>' + esc(j.note) + "</span></div>" : "") +
    '<div class="breakdown"><div class="brow"><span>Delivery fee</span><span>' + money(j.fee) + "</span></div>" +
    '<div class="brow"><span>Customer tip</span><span>' + money(j.tip || 0) + "</span></div>" +
    '<div class="brow total"><span>Tips recorded by you</span><span>' + money(j.tip || 0) + "</span></div></div>" +
    '<p class="smallnote" style="text-align:left">Base runner pay is not configured in this prototype. Only customer tips are recorded as earnings.</p>' +
    '<div class="sheetactions">' + actions +
    (j.status !== "available" ? "" : '<button class="r-btn-ghost" data-r-act="close-sheet">Not now</button>') + "</div>"
  );
}

function openProfileSheet(kind) {
  const who = me();
  if (kind === "vehicle") {
    KD.openSheet("<h2>Vehicle & plate</h2><p class='sub'>Vehicle registered to this runner account.</p>" +
      '<div class="r-kv"><span>Vehicle</span><b>' + esc(DB.profile.vehicle || "Not set") + "</b></div><div class='r-kv'><span>Plate</span><b>" + esc(DB.profile.plate || "Not set") + "</b></div>" +
      '<div class="r-note" style="margin-top:10px"><svg width="15" height="15"><use href="#i-info"/></svg><span>Vehicle details are stored on this device only. Add a backend profile API to save and verify them across devices.</span></div>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "docs") {
    KD.openSheet("<h2>Documents & clearance</h2><p class='sub'>Runner onboarding checklist.</p>" +
      ['<div class="switchrow"><div class="rmain"><h4>School ID</h4><p>' + esc(who.sid || "Not set") + '</p></div><span class="r-pill r-st-muted">' + (who.sid ? "On file" : "Not set") + "</span></div>",
       '<div class="switchrow"><div class="rmain"><h4>Vehicle registration (OR/CR)</h4><p>Not available</p></div><span class="r-pill r-st-muted">N/A</span></div>',
       '<div class="switchrow"><div class="rmain"><h4>Driver\u2019s license</h4><p>Not available</p></div><span class="r-pill r-st-muted">N/A</span></div>',
       '<div class="switchrow"><div class="rmain"><h4>NBI clearance</h4><p>Not available</p></div><span class="r-pill r-st-muted">N/A</span></div>'].join("") +
      '<div class="r-note" style="margin-top:10px"><svg width="15" height="15"><use href="#i-alert"/></svg><span>Document verification needs a backend review flow. Nothing is marked verified in this prototype.</span></div>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "payout") {
    KD.openSheet("<h2>Payout settings</h2><p class='sub'>Tips and runner pay configuration.</p>" +
      '<div class="r-kv"><span>Payout method</span><b>Not configured</b></div><div class="r-kv"><span>Payout schedule</span><b>Not configured</b></div>' +
      '<div class="r-note" style="margin-top:10px"><svg width="15" height="15"><use href="#i-alert"/></svg><span>This prototype records customer tips only. Base runner pay, commissions and automatic payouts need a payment backend and provider integration.</span></div>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "notifs") {
    KD.openSheet("<h2>Notification settings</h2><p class='sub'>Demo toggles stored on this device.</p>" +
      '<div class="switchrow"><div class="rmain"><h4>Push notifications</h4><p>New requests and updates</p></div><button class="switch' + (DB.settings.push ? " on" : "") + '" data-r-setting="push" aria-label="Toggle push"><span></span></button></div>' +
      '<div class="switchrow"><div class="rmain"><h4>Request alerts</h4><p>Sound when a request is nearby</p></div><button class="switch' + (DB.settings.requestAlerts ? " on" : "") + '" data-r-setting="requestAlerts" aria-label="Toggle alerts"><span></span></button></div>' +
      '<div class="switchrow"><div class="rmain"><h4>Sound</h4><p>In-app sounds and chimes</p></div><button class="switch' + (DB.settings.sound ? " on" : "") + '" data-r-setting="sound" aria-label="Toggle sound"><span></span></button></div>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "safety") {
    KD.openSheet("<h2>Safety & SOS</h2><p class='sub'>Campus runner safety tools.</p>" +
      '<div class="r-note" style="margin:0 0 10px"><svg width="15" height="15"><use href="#i-shield"/></svg><span>For emergencies, contact ADNU Campus Safety at (054) 881 4196 or dial 911. In-app SOS dispatch is not connected in this demo.</span></div>' +
      '<div class="r-kv"><span>Campus safety hotline</span><b>(054) 881 4196</b></div><div class="r-kv"><span>Emergency</span><b>911</b></div>' +
      '<div class="r-kv"><span>Share live run</span><b>Not available offline</b></div>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "help") {
    KD.openSheet("<h2>Help center</h2><p class='sub'>Answers for student runners (demo content).</p>" +
      ["How do I get verified as a runner?", "What if the customer is unreachable?", "How are tips recorded?", "What happens when I cancel a run?"].map((q) =>
        '<div class="optrow"><div class="rmain"><h4>' + q + '</h4><p>Demo answer available in the full build.</p></div><svg width="16" height="16" style="color:#B9B6DE"><use href="#i-chev-r"/></svg></div>').join("") +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "terms") {
    KD.openSheet("<h2>Terms & privacy</h2><p class='sub'>Ateneo de Naga student runner pilot.</p>" +
      '<p style="color:var(--muted);font-size:13px;line-height:1.6">This prototype stores demo data locally on your device (localStorage). No accounts, payments or location data leave the browser. A production build requires authentication, payment processing, location services and a privacy policy aligned with the Data Privacy Act.</p>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "rate") {
    KD.openSheet("<h2>Rate Knights Delivery</h2><p class='sub'>Your feedback helps the pilot team.</p>" +
      '<div class="r-poinline">' + [1, 2, 3, 4, 5].map((n) => '<button class="r-poin" data-r-rate="' + n + '"><svg width="24" height="24"><use href="#i-star"/></svg></button>').join("") + "</div>" +
      '<div class="hint" id="r-rate-hint">Tap a star to rate.</div>' +
      '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
  } else if (kind === "switch") {
    leave(false);
  } else if (kind === "signout") {
    KD.openSheet("<h2>Sign out?</h2><p class='sub'>Your runner session ends on this device. Demo data stays saved locally.</p>" +
      '<div class="sheetactions"><button class="r-btn-danger" data-r-act="confirm-signout">Sign out</button>' +
      '<button class="r-btn-ghost" data-r-act="close-sheet">Cancel</button></div>');
  }
}

function handleProfileAction(kind) { openProfileSheet(kind); }

function toggleOnline() {
  DB.online = !DB.online;
  persist();
  if (!DB.online) KD.toast("You are offline — no new requests", "i-power");
  else KD.toast("You are online — requests unlocked", "i-power");
  renderAll();
}

function openSortSheet() {
  const opts = [["newest", "Newest first"], ["oldest", "Oldest first"], ["fee", "Highest fee"]];
  KD.openSheet("<h2>Sort requests</h2><p class='sub'>Choose how available runs are ordered.</p>" +
    opts.map(([k, n]) => '<div class="optrow' + (UI.sort === k ? " on" : "") + '" data-r-sort="' + k + '"><div class="rmain"><h4>' + n + '</h4></div><span class="radio"></span></div>').join("") +
    '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
}

function renderNotifsSheet() {
  const has = DB.notifs.length;
  KD.openSheet("<h2>Notifications</h2><p class='sub'>" + (has ? runnerUnread() + " unread of " + has : "No notifications yet") + "</p>" +
    (has ? DB.notifs.map((n) => '<div class="r-notifrow' + (n.read ? "" : " on") + '"' + (n.jobId ? ' data-r-notifjob="' + esc(n.jobId) + '"' : "") + '><div class="r-ndot"></div><div class="r-nmain"><h4>' + esc(n.title) + '</h4><p>' + esc(n.body) + "</p><small>" + esc(n.time) + "</small></div></div>").join("") : '<div class="r-empty" style="padding:18px 0"><h3>All clear</h3><p>Request alerts and delivery updates will show up here.</p></div>') +
    '<div class="sheetactions">' + (has ? '<button class="r-btn-soft" data-r-act="clear-notifs">Mark all as read</button>' : "") +
    '<button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
}

function callCustomer(id) {
  const j = jobById(id);
  if (!j) return;
  KD.openSheet('<h2>Call ' + esc(j.customer) + "?</h2><p class='sub'>" + esc(j.customerPhone || "Number unavailable") + "</p>" +
    '<div class="r-warnline"><svg width="17" height="17"><use href="#i-phone"/></svg><p>Demo build: calling and SMS are not connected. Real calls need a telephony or VoIP provider.</p></div>' +
    '<div class="sheetactions"><button class="r-btn-ghost" data-r-act="close-sheet">Close</button></div>');
}

function handleAct(act, id, el) {
  const j = id ? jobById(id) : null;
  if (act === "close-sheet") { KD.closeSheet(); return; }
  if (act === "confirm-deliver") { confirmDeliver(id); return; }
  if (act === "confirm-cancel") { cancelJob(id, UI.cancelReason); return; }
  if (act === "cancel") { if (j) openCancelJob(j); return; }
  if (act === "chat") { if (j) openChatFor(j.id); return; }
  if (act === "call") { if (j) callCustomer(j.id); return; }
  if (act === "clear-notifs") { DB.notifs.forEach((n) => { n.read = true; }); persist(); updateBadges(); renderNotifsSheet(); return; }
  if (act === "confirm-signout") { KD.closeSheet(); KD.doSignOut(); return; }
}

function hashParams() {
  const p = {};
  (location.hash || "").replace(/^#/, "").split("&").forEach((seg) => {
    const i = seg.indexOf("=");
    if (i < 0) { if (seg) p[seg] = ""; return; }
    p[seg.slice(0, i)] = decodeURIComponent(seg.slice(i + 1));
  });
  return p;
}
function writeHash(id, jobId) {
  try {
    const h = "#view=" + id + (jobId ? "&job=" + encodeURIComponent(jobId) : "");
    if (location.hash !== h) history.replaceState(null, "", h);
  } catch (err) {}
}
function currentView() {
  const st = KD.navStack;
  return st && st.length ? st[st.length - 1].id : null;
}
function showNav(id) {
  const runner = KD.state && KD.state.role === "runner";
  const bar = $("#runnernav");
  const show = runner && !!MAIN_TABS[id];
  document.body.classList.toggle("runner-mode", runner && (show || id === "r-chat" || id === "r-tracking"));
  if (bar) {
    bar.classList.toggle("show", show);
    const active = id === "r-chat" ? "r-messages" : id === "r-tracking" ? "r-active" : id;
    $$(".rnavitem", bar).forEach((b) => b.classList.toggle("on", b.dataset.rnav === active));
  }
}

function enter() {
  if (!KD.state) return;
  ensureAccount();
  KD.state.role = "runner";
  KD.state.loggedIn = true;
  syncLinkedJobs();
  writeHash("r-dash", null);
  UI.chatJob = null;
  UI.trackJob = (activeJob() || {}).id || null;
  KD.go("r-dash", { root: true });
}

function leave(quiet) {
  if (!KD.state) return;
  KD.state.role = "customer";
  document.body.classList.remove("runner-mode");
  const bar = $("#runnernav");
  if (bar) bar.classList.remove("show");
  UI.chatJob = null;
  UI.trackJob = null;
  try { history.replaceState(null, "", location.pathname + location.search); } catch (err) {}
  if (!quiet) KD.go("profile", { root: true });
}

function onNav(id) {
  if (!KD.state || KD.state.role !== "runner") {
    document.body.classList.remove("runner-mode");
    const bar = $("#runnernav");
    if (bar) bar.classList.remove("show");
    return;
  }
  const p = hashParams();
  let jobId = p.job || null;
  if (id === "r-chat") {
    UI.chatJob = jobById(jobId) ? jobId : (jobById(UI.chatJob) ? UI.chatJob : (activeJob() || {}).id || null);
    jobId = UI.chatJob;
  } else if (id === "r-tracking") {
    UI.trackJob = jobById(jobId) ? jobId : (jobById(UI.trackJob) ? UI.trackJob : (activeJob() || {}).id || null);
    jobId = UI.trackJob;
  } else {
    jobId = null;
  }
  showNav(id);
  syncLinkedJobs();
  renderAll();
  if (id === "r-tracking") {
    const t = $("#r-track-title");
    if (t) t.textContent = jobId && statusOf(jobById(jobId)).label === "Delivered" ? "Delivery complete" : "Live tracking";
  }
  writeHash(id, jobId);
}

function refreshAvailable() {
  UI.loading = true;
  UI.error = null;
  renderAvailable();
  setTimeout(() => {
    UI.loading = false;
    syncLinkedJobs();
    renderAvailable();
    KD.toast("Available requests refreshed", "i-refresh");
  }, 650);
}

function bind() {
  document.addEventListener("click", (e) => {
    const el = e.target && e.target.closest ? e.target.closest("[data-r-go],[data-rnav],[data-r-online],[data-r-accept],[data-r-advance],[data-r-resume],[data-r-recenter],[data-r-act],[data-r-cat],[data-r-hist],[data-r-period],[data-r-sort],[data-r-cancelreason],[data-r-setting],[data-r-rate],[data-r-profile],[data-r-thread],[data-r-quick],[data-r-retry],[data-r-reset],[data-r-job],[data-r-chatjob],[data-r-notifjob]") : null;
    if (!el) return;
    if (KD.state && KD.state.role !== "runner" && !el.hasAttribute("data-r-go")) return;
    const d = el.dataset;
    if (el.hasAttribute("data-r-go")) { KD.go(d.rGo); return; }
    if (el.hasAttribute("data-rnav")) { KD.go(d.rnav); return; }
    if (el.hasAttribute("data-r-online")) { toggleOnline(); return; }
    if (el.hasAttribute("data-r-accept")) { acceptJob(d.rAccept, el); return; }
    if (el.hasAttribute("data-r-advance")) { const id = d.rAdvance === "act" ? (activeJob() || {}).id : d.rAdvance; if (id) advanceJob(id); return; }
    if (el.hasAttribute("data-r-resume")) { UI.trackJob = d.rResume; KD.closeSheet(); KD.go("r-tracking"); return; }
    if (el.hasAttribute("data-r-recenter")) { KD.toast("Route estimate refreshed (demo)", "i-route"); return; }
    if (el.hasAttribute("data-r-act")) { handleAct(d.rAct, d.id, el); return; }
    if (el.hasAttribute("data-r-cat")) { UI.cat = d.rCat; renderAvailable(); return; }
    if (el.hasAttribute("data-r-hist")) { UI.hist = d.rHist; renderHistory(); return; }
    if (el.hasAttribute("data-r-period")) { UI.period = d.rPeriod; renderEarnings(); return; }
    if (el.hasAttribute("data-r-sort")) { UI.sort = d.rSort; KD.closeSheet(); renderAvailable(); KD.toast("Sorted by " + sortLabel().toLowerCase(), "i-sort"); return; }
    if (el.hasAttribute("data-r-cancelreason")) {
      UI.cancelReason = d.rCancelreason;
      if (el.parentNode) $$(".optrow", el.parentNode).forEach((r) => r.classList.toggle("on", r === el));
      const hint = $("#r-cancel-hint");
      if (hint) hint.classList.remove("show");
      return;
    }
    if (el.hasAttribute("data-r-setting")) {
      const k = d.rSetting;
      DB.settings[k] = !DB.settings[k];
      persist();
      openProfileSheet("notifs");
      return;
    }
    if (el.hasAttribute("data-r-rate")) {
      const n = Number(d.rRate);
      if (el.parentNode) $$(".r-poin", el.parentNode).forEach((b, i) => b.classList.toggle("on", i < n));
      const hint = $("#r-rate-hint");
      if (hint) { hint.textContent = "Thanks! You rated " + n + " star" + (n === 1 ? "" : "s") + " (demo)."; hint.classList.add("show"); }
      return;
    }
    if (el.hasAttribute("data-r-profile")) { handleProfileAction(d.rProfile); return; }
    if (el.hasAttribute("data-r-thread")) { openChatFor(d.rThread); return; }
    if (el.hasAttribute("data-r-quick")) { sendRunnerMessage(d.rQuick, true); return; }
    if (el.hasAttribute("data-r-retry")) { UI.error = null; refreshAvailable(); return; }
    if (el.hasAttribute("data-r-reset")) {
      UI.cat = "all"; UI.q = "";
      const s = $("#r-avail-search"); if (s) s.value = "";
      renderAvailable();
      return;
    }
    if (el.hasAttribute("data-r-job") && !e.target.closest("[data-r-accept]")) { openJobSheet(d.rJob); return; }
    if (el.hasAttribute("data-r-chatjob")) { KD.closeSheet(); openChatFor(d.rChatjob); return; }
    if (el.hasAttribute("data-r-notifjob")) { KD.closeSheet(); openJobSheet(d.rNotifjob); return; }
  });

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (!t) return;
    if (t.id === "r-ch-input" && e.key === "Enter") { e.preventDefault(); sendRunnerMessage(); }
    if (t.closest && t.closest("#r-pininputs") && /^\d$/.test(e.key)) {
      t.value = e.key;
      const nxt = t.nextElementSibling;
      if (nxt && nxt.tagName === "INPUT") nxt.focus();
      e.preventDefault();
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (!t) return;
    if (t.id === "r-avail-search") { UI.q = t.value; renderAvailable(); }
    if (t.id === "r-msg-search") { UI.q = t.value; renderThreads(); }
    if (t.closest && t.closest("#r-pininputs")) t.value = (t.value || "").replace(/\D/g, "").slice(-1);
  });

  const wire = (sel, fn) => { const n = $(sel); if (n) n.addEventListener("click", fn); };
  wire("#r-hist-earn", () => KD.go("r-earnings"));
  wire("#r-track-chat", () => { const id = UI.trackJob || (activeJob() || {}).id; if (id) openChatFor(id); });
  wire("#r-ch-call", () => { if (UI.chatJob) callCustomer(UI.chatJob); });
  wire("#r-ch-send", () => sendRunnerMessage());
  wire("#r-top-profile", () => KD.go("r-profile"));
  wire("#r-active-bell", renderNotifsSheet);
  wire("#r-prof-bell", renderNotifsSheet);
  wire("#r-bell", renderNotifsSheet);
  wire("#r-avail-refresh", refreshAvailable);
  wire("#r-msg-refresh", () => { syncLinkedJobs(); renderThreads(); KD.toast("Inbox refreshed", "i-refresh"); });
  wire("#r-avail-sort", openSortSheet);
  wire("#r-avail-status", () => { if (!DB.online) toggleOnline(); else KD.toast("You are online and receiving requests", "i-check-c"); });
  wire("#r-hist-summary", () => {});
}

function boot() {
  bind();
  if (KD.state && KD.state.role === "runner") {
    ensureAccount();
    syncLinkedJobs();
    const v = currentView();
    if (v) onNav(v);
    else renderAll();
  }
}

if (window.KD) {
  window.KD.customerMessage = function (orderId, text, ts) {
    const j = DB.jobs.find((x) => x.linkedOrderId === orderId);
    if (!j || !text) return;
    j.msgs = j.msgs || [];
    j.msgs.push(msg("them", text, ts || Date.now()));
    j.unread = (j.unread || 0) + 1;
    persist();
    addRunnerNotif("Message from customer", j.id + " · " + j.customer + ": " + text, j.id);
    if (UI.chatJob === j.id && $("#scr-r-chat").classList.contains("active")) {
      j.unread = 0;
      persist();
      renderChat();
    }
    renderThreads();
  };
}

window.KDRunner = { enter: enter, leave: leave, onNav: onNav };

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();
})();
