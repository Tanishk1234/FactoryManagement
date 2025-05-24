const addKarigarBtn = document.getElementById("addKarigarBtn");
const karigarFormSection = document.getElementById("karigarFormSection");
const karigarForm = document.getElementById("karigarForm");
const karigarNameInput = document.getElementById("karigarName");
const karigarTypeSelect = document.getElementById("karigarType");
const karigarButtons = document.getElementById("karigarButtons");
const karigarEntrySection = document.getElementById("karigarEntrySection");
const karigarTitle = document.getElementById("karigarTitle");
const karigarDateTime = document.getElementById("karigarDateTime");
const entryTable = document.getElementById("entryTable").querySelector("tbody");
const tableHeaderRow = document.getElementById("tableHeaderRow");
const createEntryBtn = document.getElementById("createEntryBtn");

const entryFormSection = document.getElementById("entryFormSection");
const entryType = document.getElementById("entryType");
const entryDateTime = document.getElementById("entryDateTime");
const entryWeight = document.getElementById("entryWeight");
const saveEntryBtn = document.getElementById("saveEntryBtn");

const entryNameSection = document.getElementById("entryNameSection");
const entryPcsSection = document.getElementById("entryPcsSection");
const entryPerson = document.getElementById("entryPerson");
const entryPcs = document.getElementById("entryPcs");

const entryMatchingDropdown = document.getElementById("entryMatchingDropdown");
const matchingEntries = document.getElementById("matchingEntries");

let currentKarigar = null;
let karigars = JSON.parse(localStorage.getItem("karigars")) || {};

function saveToStorage() {
  localStorage.setItem("karigars", JSON.stringify(karigars));
}

function formatTime(date = new Date()) {
  return date.toLocaleString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function generateID(data) {
  return data.length ? data[data.length - 1].id + 1 : 1;
}

addKarigarBtn.onclick = () => {
  karigarFormSection.classList.remove("hidden");
};

karigarForm.onsubmit = e => {
  e.preventDefault();
  const name = karigarNameInput.value.trim();
  const type = karigarTypeSelect.value;

  if (!name) return;

  const key = `${name}-${type}`;
  if (!karigars[key]) karigars[key] = [];

  createKarigarButton(name, type);
  karigarNameInput.value = "";
  saveToStorage();
};

function createKarigarButton(name, type) {
  const key = `${name}-${type}`;
  const btn = document.createElement("button");
  btn.textContent = key;
  btn.onclick = () => {
    showKarigarEntries(name, type);
  };
  karigarButtons.appendChild(btn);
}

Object.keys(karigars).forEach(key => {
  const [name, type] = key.split("-");
  createKarigarButton(name, type);
});

function showKarigarEntries(name, type) {
  currentKarigar = { name, type };
  karigarTitle.textContent = `${name} - ${type}`;
  karigarDateTime.textContent = formatTime();
  karigarEntrySection.classList.remove("hidden");

  const headers = [
    "ID", "Date & Time"
  ];
  if (type === "Chillay" || type === "Polish") {
    headers.push("Name", "Pcs");
  }
  headers.push("Weight Given", "Date & Time", "Weight Taken", "Loss");

  tableHeaderRow.innerHTML = "";
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    tableHeaderRow.appendChild(th);
  });

  renderTable();
}

function renderTable() {
  const key = `${currentKarigar.name}-${currentKarigar.type}`;
  const data = karigars[key] || [];
  entryTable.innerHTML = "";
  data.forEach(row => {
    const tr = document.createElement("tr");
    const cells = [
      row.id,
      row.givenTime || "-",
    ];

    if (currentKarigar.type === "Chillay" || currentKarigar.type === "Polish") {
      cells.push(row.person || "-", row.pcs || "-");
    }

    cells.push(
      row.weightGiven || "-",
      row.takenTime || "-",
      row.weightTaken || "-",
      row.loss ? `${row.loss.toFixed(3)} gm` : "-"
    );

    cells.forEach(c => {
      const td = document.createElement("td");
      td.textContent = c;
      tr.appendChild(td);
    });

    entryTable.appendChild(tr);
  });
}

createEntryBtn.onclick = () => {
  entryFormSection.classList.remove("hidden");
  const now = new Date();
  entryDateTime.value = formatTime(now);
  entryWeight.value = "";
  entryPcs.value = "";
  entryPcsSection.classList.add("hidden");
  entryNameSection.classList.add("hidden");
  entryMatchingDropdown.classList.add("hidden");
  matchingEntries.innerHTML = "";
};

entryType.onchange = () => {
  if (!currentKarigar) return;

  const key = `${currentKarigar.name}-${currentKarigar.type}`;
  const data = karigars[key] || [];

  const unmatched = data.filter(e => e.weightGiven && !e.weightTaken);

  entryNameSection.classList.toggle("hidden", !["Chillay", "Polish"].includes(currentKarigar.type));
  entryPcsSection.classList.toggle("hidden", !["Chillay", "Polish"].includes(currentKarigar.type));
  entryMatchingDropdown.classList.toggle("hidden", entryType.value === "taken" && unmatched.length > 1);

  if (unmatched.length > 1) {
    matchingEntries.innerHTML = "";
    unmatched.forEach(row => {
      const option = document.createElement("option");
      option.value = row.id;
      option.textContent = `${row.id} - ${row.givenTime}`;
      matchingEntries.appendChild(option);
    });
  }
};

saveEntryBtn.onclick = () => {
  if (!currentKarigar) return;
  const key = `${currentKarigar.name}-${currentKarigar.type}`;
  const data = karigars[key];

  const type = entryType.value;
  const weight = parseFloat(entryWeight.value);
  const time = entryDateTime.value;
  const pcs = parseInt(entryPcs.value);
  const person = entryPerson.value;

  if (isNaN(weight)) return alert("Please enter a valid weight.");

  if (type === "given") {
    const newEntry = {
      id: generateID(data),
      givenTime: time,
      weightGiven: weight,
    };

    if (["Chillay", "Polish"].includes(currentKarigar.type)) {
      newEntry.person = person;
      newEntry.pcs = pcs;
    }

    data.push(newEntry);
  } else if (type === "taken") {
    const unmatched = data.filter(e => e.weightGiven && !e.weightTaken);
    if (!unmatched.length) return alert("No unmatched weight given entries.");

    let matched;
    if (unmatched.length === 1) {
      matched = unmatched[0];
    } else {
      const matchID = parseInt(matchingEntries.value);
      matched = data.find(r => r.id === matchID);
    }

    matched.takenTime = time;
    matched.weightTaken = weight;
    matched.loss = matched.weightGiven - matched.weightTaken;
  }

  saveToStorage();
  renderTable();
  entryFormSection.classList.add("hidden");
};
