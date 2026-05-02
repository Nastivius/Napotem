const STORAGE_KEY = "na-potem-items-v1";

const form = document.querySelector("#item-form");
const itemsList = document.querySelector("#items");
const emptyState = document.querySelector("#empty-state");
const filterSelect = document.querySelector("#filter");
const clearDoneButton = document.querySelector("#clear-done");

const state = {
  items: loadItems(),
  filter: "all",
};

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function typeLabel(type) {
  const map = {
    video: "video",
    article: "artykul",
    podcast: "podcast",
    other: "inne",
  };
  return map[type] || "inne";
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function addItem(data) {
  const item = {
    id: crypto.randomUUID(),
    title: data.title.trim(),
    url: normalizeUrl(data.url),
    type: data.type,
    note: data.note.trim(),
    done: false,
    createdAt: new Date().toISOString(),
  };

  state.items.unshift(item);
  saveItems();
  render();
}

function deleteItem(id) {
  state.items = state.items.filter((item) => item.id !== id);
  saveItems();
  render();
}

function toggleDone(id) {
  state.items = state.items.map((item) =>
    item.id === id ? { ...item, done: !item.done } : item
  );
  saveItems();
  render();
}

function clearDone() {
  state.items = state.items.filter((item) => !item.done);
  saveItems();
  render();
}

function getFilteredItems() {
  if (state.filter === "all") return state.items;
  if (state.filter === "done") return state.items.filter((item) => item.done);
  return state.items.filter((item) => item.type === state.filter);
}

function render() {
  const visibleItems = getFilteredItems();

  itemsList.innerHTML = "";

  if (visibleItems.length === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;
  }

  visibleItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = `item ${item.done ? "done" : ""}`;
    li.innerHTML = `
      <div class="item-head">
        <p class="item-title"><a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a></p>
        <span class="chip">${typeLabel(item.type)}</span>
      </div>
      ${item.note ? `<p class="item-note">${escapeHtml(item.note)}</p>` : ""}
      <div class="item-meta">
        <label class="checkbox">
          <input type="checkbox" ${item.done ? "checked" : ""} data-action="toggle" data-id="${item.id}">
          <span>oznacz jako przerobione</span>
        </label>
        <button class="danger" type="button" data-action="delete" data-id="${item.id}">usun</button>
      </div>
    `;
    itemsList.appendChild(li);
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);

  const title = String(data.get("title") || "");
  const url = String(data.get("url") || "");
  const type = String(data.get("type") || "other");
  const note = String(data.get("note") || "");

  if (!title.trim() || !url.trim()) return;

  addItem({ title, url, type, note });
  form.reset();
});

filterSelect.addEventListener("change", (event) => {
  state.filter = event.target.value;
  render();
});

itemsList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  if (action === "delete") {
    deleteItem(id);
  }
});

itemsList.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.dataset.action;
  const id = target.dataset.id;
  if (!action || !id) return;

  if (action === "toggle") {
    toggleDone(id);
  }
});

clearDoneButton.addEventListener("click", clearDone);

render();
