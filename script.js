// === DOM Elements ===
const karigarTitle = document.getElementById("karigarTitle");
const karigarDateTime = document.getElementById("karigarDateTime");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const tableHeaderRow = document.getElementById("tableHeaderRow");

const createEntryBtn = document.getElementById("createEntryBtn");
const entryFormSection = document.getElementById("entryFormSection");
const entryType = document.getElementById("entryType");
const entryDateTimeInput = document.getElementById("entryDateTime");
const entryWeight = document.getElementById("entryWeight");
const entryPcs = document.getElementById("entryPcs");
const entryPerson = document.getElementById("entryPerson");
const entryTunch = document.getElementById("entryTunch");
const entryMatchingDropdown = document.getElementById("entryMatchingDropdown");
const matchingEntries = document.getElementById("matchingEntries");

const entryNameSection = document.getElementById("entryNameSection");
const entryPcsSection = document.getElementById("entryPcsSection");
const tunchSection = document.getElementById("tunchSection");

const saveEntryBtn = document.getElementById("saveEntryBtn");
const modifyEntryBtn = document.getElementById("modifyEntryBtn");
const deleteEntryBtn = document.getElementById("deleteEntryBtn");

let currentKarigar = null;
let currentEditId = null;

// === Utilities ===
function formatTime(date = new Date()) {
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getKarigarKey() {
  const url = window.location.pathname.split("/").pop().replace(".html", "");
  return url;
}

function getKarigarType() {
  return getKarigarKey().includes("Chilay") ? "Chillay" :
         getKarigarKey().includes("Polish") ? "Polish" : "HandMade";
}

function getKarigarData() {
  const stored = JSON.parse(localStorage.getItem("karigars")) || {};
  const key = getKarigarKey();
  if (!stored[key]) stored[key] = [];
  return stored;
}

function saveKarigarData(data) {
  localStorage.setItem("karigars", JSON.stringify(data));
}

// === Init ===
const karigarKey = getKarigarKey();
const karigarType = getKarigarType();
let karigarData = getKarigarData();

karigarTitle.textContent = karigarKey;
karigarDateTime.textContent = "Today: " + formatTime();

// === Table Rendering ===
function renderTable() {
  const rows = karigarData[karigarKey] || [];
  tableHeaderRow.innerHTML = "";

  const headers = ["ID", "Date & Time"];
  if (karigarType === "Chillay" || karigarType === "Polish") {
    headers.push("Name", "Tunch", "Pcs");
  }
  headers.push("Weight Given", "Date & Time", "Weight Taken", "Loss", "Actions");

  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    tableHeaderRow.appendChild(th);
  });

  entryTable.innerHTML = "";
  rows.forEach(row => {
    const tr = document.createElement("tr");

    const cells = [
      row.id,
      row.givenTime || "-",
    ];

    if (karigarType === "Chillay" || karigarType === "Polish") {
      cells.push(row.person || "-", row.tunch || "-", row.pcs || "-");
    }

    cells.push(
      row.weightGiven || "-",
      row.takenTime || "-",
      row.weightTaken || "-",
      row.loss ? `${row.loss.toFixed(2)} gm` : "-"
    );

    cells.forEach(c => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });

    const actionTD = document.createElement("td");
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.onclick = () => editEntry(row.id);

    const delBtn = document.createElement("button");
    delBtn.textContent = "Delete";
    delBtn.onclick = () => deleteEntry(row.id);

    actionTD.append(editBtn, delBtn);
    tr.appendChild(actionTD);
    entryTable.appendChild(tr);
  });
}

function editEntry(id) {
  const row = karigarData[karigarKey].find(e => e.id === id);
  if (!row) return;
  currentEditId = id;

  entryType.value = row.weightTaken ? "taken" : "given";
  entryDateTimeInput.value = row.weightTaken ? row.takenTime : row.givenTime;
  entryWeight.value = row.weightTaken || row.weightGiven;
  entryPerson.value = row.person || "";
  entryTunch.value = row.tunch || "";
  entryPcs.value = row.pcs || "";

  entryFormSection.classList.remove("hidden");
  saveEntryBtn.classList.add("hidden");
  modifyEntryBtn.classList.remove("hidden");
  deleteEntryBtn.classList.remove("hidden");
}

function deleteEntry(id) {
  karigarData[karigarKey] = karigarData[karigarKey].filter(e => e.id !== id);
  saveKarigarData(karigarData);
  renderTable();
  entryFormSection.classList.add("hidden");
}

// === Entry Form Logic ===
createEntryBtn.onclick = () => {
  entryFormSection.classList.remove("hidden");
  entryType.value = "given";
  entryDateTimeInput.value = formatTime();
  entryWeight.value = "";
  entryPcs.value = "";
  entryPerson.value = "";
  entryTunch.value = "";
  currentEditId = null;

  saveEntryBtn.classList.remove("hidden");
  modifyEntryBtn.classList.add("hidden");
  deleteEntryBtn.classList.add("hidden");
};

entryType.onchange = updateFormView;
function updateFormView() {
  const type = entryType.value;
  const rows = karigarData[karigarKey];

  const unmatched = rows.filter(e => e.weightGiven && !e.weightTaken);
  matchingEntries.innerHTML = "";

  if (unmatched.length > 0 && type === "taken") {
    entryMatchingDropdown.classList.remove("hidden");
    unmatched.forEach(row => {
      const option = document.createElement("option");
      option.value = row.id;
      option.textContent = `${row.id} - ${row.givenTime}`;
      matchingEntries.appendChild(option);
    });
  } else {
    entryMatchingDropdown.classList.add("hidden");
  }

  const isSpecial = karigarType === "Chillay" || karigarType === "Polish";
  entryNameSection.classList.toggle("hidden", !isSpecial);
  entryPcsSection.classList.toggle("hidden", !isSpecial);
  tunchSection.classList.toggle("hidden", !isSpecial);
}

// === Entry Save ===
saveEntryBtn.onclick = () => {
  const type = entryType.value;
  const weight = parseFloat(entryWeight.value);
  const time = entryDateTimeInput.value;
  const person = entryPerson.value;
  const pcs = parseInt(entryPcs.value);
  const tunch = entryTunch.value;

  if (isNaN(weight)) return alert("Please enter a valid weight");

  const data = karigarData[karigarKey];
  const id = data.length ? data[data.length - 1].id + 1 : 1;

  if (type === "given") {
    const entry = {
      id,
      givenTime: time,
      weightGiven: weight,
    };
    if (karigarType === "Chillay" || karigarType === "Polish") {
      entry.person = person;
      entry.pcs = pcs;
      entry.tunch = tunch;
    }
    data.push(entry);
  } else if (type === "taken") {
    const matchID = parseInt(matchingEntries.value);
    const row = data.find(e => e.id === matchID);
    if (!row) return alert("No matching entry selected");
    row.takenTime = time;
    row.weightTaken = weight;
    row.loss = row.weightGiven - weight;
  }

  saveKarigarData(karigarData);
  renderTable();
  entryFormSection.classList.add("hidden");
};

// === Modify Entry ===
modifyEntryBtn.onclick = () => {
  const row = karigarData[karigarKey].find(e => e.id === currentEditId);
  if (!row) return;

  const type = entryType.value;
  const weight = parseFloat(entryWeight.value);
  const time = entryDateTimeInput.value;
  const person = entryPerson.value;
  const pcs = parseInt(entryPcs.value);
  const tunch = entryTunch.value;

  if (type === "given") {
    row.givenTime = time;
    row.weightGiven = weight;
  } else {
    row.takenTime = time;
    row.weightTaken = weight;
    row.loss = row.weightGiven - weight;
  }

  if (karigarType === "Chillay" || karigarType === "Polish") {
    row.person = person;
    row.pcs = pcs;
    row.tunch = tunch;
  }

  saveKarigarData(karigarData);
  renderTable();
  entryFormSection.classList.add("hidden");
};

// === Init View ===
updateFormView();
renderTable();
