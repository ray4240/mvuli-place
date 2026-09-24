import { generateUnitList, TYPOLOGIES } from "./unit-data.js";
import {
  auth, db, isFirebaseConfigured, collection, doc, getDoc, getDocs,
  updateDoc, query, orderBy, serverTimestamp, writeBatch,
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
} from "./firebase-init.js";

const setupScreen = document.getElementById("setup-screen");
const loginScreen = document.getElementById("login-screen");
const adminScreen = document.getElementById("admin-screen");
const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const adminMessage = document.getElementById("admin-message");
const signOutButton = document.getElementById("sign-out");
const inquiriesBody = document.getElementById("inquiries-body");
const unitsBody = document.getElementById("units-body");

let inquiries = [];
let units = [];
let unitsLoaded = false;

const formatPrice = value => "Ksh " + Number(value || 0).toLocaleString("en-KE");
const text = value => value == null || value === "" ? "—" : String(value);

function showScreen(screen) {
  setupScreen.hidden = screen !== "setup";
  loginScreen.hidden = screen !== "login";
  adminScreen.hidden = screen !== "admin";
  signOutButton.hidden = screen !== "admin";
}

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
}

function messageRow(body, columns, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = columns;
  cell.className = "admin-empty-cell";
  cell.textContent = message;
  row.append(cell);
  body.replaceChildren(row);
}

function addCell(row, label, value) {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  cell.textContent = text(value);
  row.append(cell);
  return cell;
}

function formatDate(value) {
  if (!value || typeof value.toDate !== "function") return "—";
  const date = value.toDate();
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function renderInquiries() {
  const term = document.getElementById("inquiry-search").value.trim().toLowerCase();
  const visible = inquiries.filter(item => [item.name, item.phone, item.email, item.unitTypology, item.message]
    .some(value => String(value || "").toLowerCase().includes(term)));

  document.getElementById("metric-inquiries").textContent = String(inquiries.length);
  if (!visible.length) {
    messageRow(inquiriesBody, 6, term ? "No enquiries match your search." : "No enquiries have been received yet.");
    return;
  }

  const fragment = document.createDocumentFragment();
  visible.forEach(item => {
    const row = document.createElement("tr");
    addCell(row, "Date", formatDate(item.createdAt));
    addCell(row, "Name", item.name);
    addCell(row, "Phone", item.phone);
    addCell(row, "Email", item.email);
    addCell(row, "Unit", TYPOLOGIES[item.unitTypology]?.label || item.unitTypology);
    addCell(row, "Message", item.message);
    fragment.append(row);
  });
  inquiriesBody.replaceChildren(fragment);
}

async function loadInquiries() {
  messageRow(inquiriesBody, 6, "Loading enquiries…");
  try {
    const snapshot = await getDocs(query(collection(db, "inquiries"), orderBy("createdAt", "desc")));
    inquiries = snapshot.docs.map(record => ({ id: record.id, ...record.data() }));
    renderInquiries();
    showMessage(adminMessage, "Enquiries are up to date.");
  } catch (error) {
    console.error(error);
    messageRow(inquiriesBody, 6, "Enquiries could not be loaded. Check staff access and Firestore rules.");
    showMessage(adminMessage, "Enquiries could not be loaded.", true);
  }
}

async function updateStatus(select, unit) {
  const previous = unit.status;
  const next = select.value;
  if (next === previous) return;
  select.disabled = true;
  showMessage(adminMessage, `Saving ${unit.unitNo}…`);
  try {
    await updateDoc(doc(db, "units", unit.id), { status: next, updatedAt: serverTimestamp() });
    unit.status = next;
    showMessage(adminMessage, `${unit.unitNo} is now marked ${next}.`);
    renderUnits();
  } catch (error) {
    console.error(error);
    select.value = previous;
    select.disabled = false;
    showMessage(adminMessage, `The status of ${unit.unitNo} could not be saved.`, true);
  }
}

function renderUnits() {
  const term = document.getElementById("unit-search").value.trim().toLowerCase();
  const filter = document.getElementById("unit-filter").value;
  const counts = { available: 0, reserved: 0, sold: 0 };
  units.forEach(unit => { if (unit.status in counts) counts[unit.status] += 1; });
  document.getElementById("metric-units").textContent = String(units.length);
  document.getElementById("metric-available").textContent = String(counts.available);
  document.getElementById("units-summary").textContent = `${units.length} units · ${counts.available} available · ${counts.reserved} reserved · ${counts.sold} sold`;

  const visible = units.filter(unit => {
    const matchesText = [unit.unitNo, TYPOLOGIES[unit.typology]?.label || unit.typology]
      .some(value => String(value || "").toLowerCase().includes(term));
    return matchesText && (filter === "all" || unit.status === filter);
  });
  if (!visible.length) {
    messageRow(unitsBody, 5, units.length ? "No units match these filters." : "No unit records yet. Confirm the official register before creating sample records.");
    return;
  }

  const fragment = document.createDocumentFragment();
  visible.forEach(unit => {
    const row = document.createElement("tr");
    addCell(row, "Unit number", unit.unitNo);
    addCell(row, "Floor", unit.floor);
    addCell(row, "Layout", TYPOLOGIES[unit.typology]?.label || unit.typology);
    addCell(row, "Indicative price", formatPrice(unit.price));
    const statusCell = addCell(row, "Status", "");
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute("aria-label", `Status for unit ${unit.unitNo}`);
    for (const value of ["available", "reserved", "sold"]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value[0].toUpperCase() + value.slice(1);
      select.append(option);
    }
    select.value = unit.status;
    select.addEventListener("change", () => updateStatus(select, unit));
    statusCell.replaceChildren(select);
    fragment.append(row);
  });
  unitsBody.replaceChildren(fragment);
}

async function loadUnits() {
  unitsLoaded = false;
  document.getElementById("seed-btn").disabled = true;
  messageRow(unitsBody, 5, "Loading units…");
  try {
    const snapshot = await getDocs(collection(db, "units"));
    units = snapshot.docs.map(record => ({ id: record.id, ...record.data() }));
    units.sort((a, b) => String(a.unitNo || a.id).localeCompare(String(b.unitNo || b.id)));
    unitsLoaded = true;
    document.getElementById("seed-btn").disabled = false;
    renderUnits();
    showMessage(adminMessage, "Unit register is up to date.");
  } catch (error) {
    console.error(error);
    messageRow(unitsBody, 5, "Units could not be loaded. Check staff access and Firestore rules.");
    showMessage(adminMessage, "Unit register could not be loaded.", true);
  }
}

async function createMissingUnits() {
  const button = document.getElementById("seed-btn");
  if (!unitsLoaded) {
    showMessage(adminMessage, "The unit register must load successfully before creating records.", true);
    return;
  }
  const existing = new Set(units.map(unit => unit.id));
  const missing = generateUnitList().filter(unit => !existing.has(unit.unitNo));
  if (!missing.length) {
    showMessage(adminMessage, "All 120 sample unit numbers already exist.");
    return;
  }
  if (!window.confirm(`Create ${missing.length} missing sample unit records? The numbering is an assumption and should match an approved register before use. Existing records will be preserved.`)) return;
  button.disabled = true;
  button.textContent = "Creating units…";
  try {
    for (let start = 0; start < missing.length; start += 10) {
      const batch = writeBatch(db);
      missing.slice(start, start + 10).forEach(unit => {
        batch.set(doc(db, "units", unit.unitNo), { ...unit, updatedAt: serverTimestamp() });
      });
      await batch.commit();
    }
    await loadUnits();
    showMessage(adminMessage, `${missing.length} unit records created. Existing records were preserved.`);
  } catch (error) {
    console.error(error);
    await loadUnits();
    showMessage(adminMessage, "Unit creation stopped before all records were saved. Review the register and retry only after checking it.", true);
  } finally {
    button.disabled = !unitsLoaded;
    button.textContent = "Create missing units";
  }
}

document.querySelectorAll(".admin-tabbar button").forEach(button => {
  button.addEventListener("click", () => {
    const isInquiries = button.dataset.tab === "inquiries";
    document.getElementById("tab-inquiries").hidden = !isInquiries;
    document.getElementById("tab-units").hidden = isInquiries;
    document.querySelectorAll(".admin-tabbar button").forEach(tab => {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
  });
});

document.getElementById("inquiry-search").addEventListener("input", renderInquiries);
document.getElementById("unit-search").addEventListener("input", renderUnits);
document.getElementById("unit-filter").addEventListener("change", renderUnits);
document.getElementById("refresh-inquiries").addEventListener("click", loadInquiries);
document.getElementById("refresh-units").addEventListener("click", loadUnits);
document.getElementById("seed-btn").addEventListener("click", createMissingUnits);
signOutButton.addEventListener("click", async () => {
  await signOut(auth);
  inquiries = [];
  units = [];
  unitsLoaded = false;
  document.getElementById("seed-btn").disabled = true;
  showMessage(adminMessage, "");
});

loginForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (!isFirebaseConfigured || !loginForm.reportValidity()) return;
  const button = document.getElementById("login-submit");
  button.disabled = true;
  button.textContent = "Signing in…";
  showMessage(loginMessage, "Checking your account…");
  try {
    await signInWithEmailAndPassword(auth, document.getElementById("staff-email").value.trim(), document.getElementById("staff-password").value);
    document.getElementById("staff-password").value = "";
  } catch (error) {
    console.error(error);
    showMessage(loginMessage, "Sign-in failed. Check your details and try again.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Sign in";
  }
});

if (isFirebaseConfigured) {
  showScreen("login");
  onAuthStateChanged(auth, async user => {
    if (!user) {
      showScreen("login");
      return;
    }
    showMessage(loginMessage, "Checking staff access…");
    try {
      const staffRecord = await getDoc(doc(db, "staff", user.uid));
      if (!staffRecord.exists() || staffRecord.data().active !== true) {
        await signOut(auth);
        showMessage(loginMessage, "This account has no active staff access.", true);
        return;
      }
      document.getElementById("staff-identity").textContent = user.email || "Staff member";
      showMessage(loginMessage, "");
      showScreen("admin");
      await Promise.all([loadInquiries(), loadUnits()]);
    } catch (error) {
      console.error(error);
      await signOut(auth);
      showMessage(loginMessage, "Staff access could not be verified. Check the project setup.", true);
    }
  });
} else {
  showScreen("setup");
}
