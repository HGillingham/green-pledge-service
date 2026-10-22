import "./style.css";
import {
  getAllPledges,
  createPledge,
  updatePledge,
  deletePledge,
} from "./api.js";

// Grab the elements we need once
const form = document.querySelector("#pledge-form");
const list = document.querySelector("#pledge-list");
const statusEl = document.querySelector("#status");
const statsEl = document.querySelector("#stats");
const formError = document.querySelector("#form-error");
const formTitle = document.querySelector("#form-title");
const submitBtn = document.querySelector("#submit-btn");
const cancelBtn = document.querySelector("#cancel-btn");

const fields = {
  id: document.querySelector("#pledge-id"),
  pledge: document.querySelector("#pledge-text"),
  owner: document.querySelector("#pledge-owner"),
  team: document.querySelector("#pledge-team"),
  date: document.querySelector("#pledge-date"),
  completed: document.querySelector("#pledge-completed"),
};

// single source of truth for what's on the screen
let pledges = [];

// Only send keys the joi schema allows
function toApiBody(item) {
  return {
    owner: item.owner,
    pledge: item.pledge,
    completion_date: item.completion_date,
    team: item.team,
    completed: item.completed,
  };
}

function readForm() {
  return toApiBody({
    owner: fields.owner.value.trim(),
    pledge: fields.pledge.value.trim(),
    completion_date: fields.date.value,
    team: fields.team.value.trim(),
    completed: fields.completed.Checked,
  });
}

// API validating
function validate(item) {
  if (item.pledge.length < 3) return "Pledge must be at least 3 characters.";
  if (!item.owner) return "Please enter the name of the person making the pledge.";
  if (!item.team) return "Please enter the name of the team.";
  if (!item.completion_date) return "Please select a target date.";
  return null;
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function resetForm() {
  form.reset();
  fields.id.value = "";
  formError.textContent = "";
  formTitle.textContent = "Make a pledge";
  submitBtn.textContent = "Add pledge";
  cancelBtn.hidden = true;
}

function startEdit(item) {
  fields.id.value = item.id;
  fields.pledge.value = item.pledge;
  fields.owner.value = item.owner;
  fields.team.value = item.team;
  fields.date.value = item.completion_date.slice(0, 10); // date inputs need YYYY-MM-DD
  fields.completed.checked = item.completed;
  formTitle.textContent = "Edit pledge";
  submitBtn.textContent = "Save changes";
  cancelBtn.hidden = false;
  form.scrollIntoView({ behavior: "smooth"});
}

// Rendering
function renderStats() {
  const done = pledges.filter((item) => item.completed);
  // A set keeps one copy of each value, so its size = no. of diff owners
  const people = new Set(pledges.map((item) => item.owner)).size;
  const stats = [
    ["Pledges", pledges.length],
    ["Completed", done.length],
    ["People taking part", people],
  ];

  statsEl.innerHTML = "";
  for (const [label, value] of stats) {
    const div = document.createElement("div");
    div.className = "stat";
    div.innerHTML = `<span class="stat-value">${value}</span><span class="stat-label">${label}</span>`;
    statsEl.append(div);
  }
}

function renderList() {
  list.innerHTML = "";

  if (pledges.length === 0) {
    statusEl.textContent = "No pledges yet - be the first!";
    return;
  }
  statusEl.textContent = "";

  for (const item of pledges) {
    const li = document.createElement("li");
    li.className = item.completed ? "pledge done" : "pledge";

    // textContent (not innerHTML) for user-typed text,
    // so nobody can inject HTML or scripts through a pledge
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.pledge;
    const meta = document.createElement("span");
    meta.className = "meta";
    meta.textContent = `${item.owner} · ${item.team} · by ${formatDate(item.completion_date)}`;
    info.append(title, meta);

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = item.completed ? "Undo" : "Mark done";
    toggleBtn.addEventListener("click", () => handleToggle(item));

    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.className = "secondary";
    editBtn.addEventListener("click", () => startEdit(item));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "danger";
    deleteBtn.addEventListener("click", () => handleDelete(item));

    const actions = document.createElement("div");
    actions.className = "actions";
    actions.append(toggleBtn, editBtn, deleteBtn);

    li.append(info, actions);
    list.append(li);
  }
}

function render() {
  renderStats();
  renderList();
}

async function loadPledges() {
  statusEl.textContent = "Loading...";
  try {
    pledges = await getAllPledges();
    // DynamoDB Scan returns items in no particular order: soonest target date first
    pledges.sort((a, b) =>
    (a.completion_date || "").localeCompare(b.completion_date || "")
  );
  render();
  } catch (err) {
    statusEl.textContent = `Couldn't load pledges: ${err.message}`
  }
}

async function handleToggle(item) {
  try {
  await updatePledge(item.id, toApiBody({ ...item, completed: !item.completed }));
  await loadPledges();
  } catch (err) {
    statsEl.textContent = `Couldn't update: ${err.message}`;
  }
}

async function handleDelete(item) {
  if (!confirm(`Delete "${item.pledge}"?`)) return;
  try {
    await deletePledge(item.id);
    await loadPledges();
  } catch (err) {
    statusEl.textContent = `Couldn't delete: ${err.message}`;
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // stop browser reloading page
  formError.textContent = "";

  const item = readForm();
  const problem = validate(item);
  if (problem) {
    formError.textContent = problem;
    return;
  }

  submitBtn.disabled = true; // prevent multiple submits
  try {
    const id = fields.id.value;
    if (id) {
      await updatePledge(id, item);
    } else {
      await createPledge(item);
    }
    resetForm();
    await loadPledges();
  } catch (err) {
    formError.textContent = err.message; // e.g. a joi message from API
  } finally {
    submitBtn.disabled = false;
  }
});

cancelBtn.addEventListener("click", resetForm);

// Load data when page opens
loadPledges;