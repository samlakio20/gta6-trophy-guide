// Leonida Trophy Guide — tracker logic: load the 55 trophies, render the checklist,
// save earned ticks in localStorage, filter by kind/grade/search, hide spoilers,
// and export/import progress as a file. No network requests at run time: the only
// fetch is the guide's own data file, app/data/trophies.json.

const STORAGE_KEY = 'gta6-trophy-guide-progress-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoiler-v1';
const DATA_URL = 'data/trophies.json';

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

const STAGE_LABELS = {
  story: 'Roadmap: story',
  checklist: 'Roadmap: 100% checklist',
  cleanup: 'Roadmap: cleanup',
  platinum: 'Roadmap: platinum',
};

const GRADE_LETTERS = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

const listEl = document.getElementById('trophyList');
const progressTextEl = document.getElementById('progressText');
const progressPctEl = document.getElementById('progressPct');
const progressFillEl = document.getElementById('progressFill');
const progressDetailEl = document.getElementById('progressDetail');
const filterNoteEl = document.getElementById('filterNote');
const emptyNoteEl = document.getElementById('emptyNote');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const spoilerEl = document.getElementById('spoilerToggle');
const earnedOnlyEl = document.getElementById('earnedOnly');

let trophies = [];
let earned = new Set(loadStoredEarned());
let kindFilter = 'all';
let openGuides = new Set();

spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';

function loadStoredEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
}

async function loadTrophies() {
  const response = await fetch(DATA_URL);
  const doc = await response.json();
  trophies = doc.trophies;
}

function gradeCounts(list) {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of list) counts[t.grade] += 1;
  return counts;
}

function updateProgress() {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.name)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressTextEl.textContent = `${done} of ${total} earned`;
  progressPctEl.textContent = `${pct}% to platinum`;
  progressFillEl.style.width = `${pct}%`;
  const earnedCounts = gradeCounts(trophies.filter((t) => earned.has(t.name)));
  const allCounts = gradeCounts(trophies);
  progressDetailEl.textContent =
    `Platinum ${earnedCounts.platinum}/${allCounts.platinum} · ` +
    `Gold ${earnedCounts.gold}/${allCounts.gold} · ` +
    `Silver ${earnedCounts.silver}/${allCounts.silver} · ` +
    `Bronze ${earnedCounts.bronze}/${allCounts.bronze}`;
}

function renderRoadmapCounts() {
  const byStage = (stage) => trophies.filter((t) => t.stage === stage).length;
  document.getElementById('stepStoryCount').textContent =
    `${byStage('story')} trophies belong to this stage (chapters, missions and character questlines).`;
  document.getElementById('stepChecklistCount').textContent =
    `${byStage('checklist')} trophies belong to this stage, including A Long Road (100% completion).`;
  document.getElementById('stepCleanupCount').textContent =
    `${byStage('cleanup')} trophies belong to this stage — one-offs, money and the two unconfirmed triggers.`;
}

function spoilerHides(trophy) {
  return spoilerEl.checked && trophy.hidden && !earned.has(trophy.name);
}

function trophyMatchesFilters(trophy) {
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && trophy.kind !== kindFilter) return false;
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (earnedOnlyEl.checked && !earned.has(trophy.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.target}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function buildTrophyCard(trophy) {
  const card = document.createElement('article');
  card.className = 'trophy-card';
  card.id = `trophy-${trophy.id}`;
  if (earned.has(trophy.name)) card.classList.add('earned');

  const head = document.createElement('div');
  head.className = 'trophy-head';

  const earnBox = document.createElement('label');
  earnBox.className = 'earn-box';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveProgress();
    updateProgress();
    renderTrophies();
  });
  earnBox.append(box);

  const main = document.createElement('div');
  main.className = 'trophy-main';

  const nameEl = document.createElement('h3');
  nameEl.className = 'trophy-name';
  if (spoilerHides(trophy)) {
    nameEl.textContent = 'Hidden trophy — earn it to reveal';
    nameEl.classList.add('spoiler-hidden');
  } else {
    nameEl.textContent = trophy.name;
    if (earned.has(trophy.name)) {
      const mark = document.createElement('span');
      mark.className = 'earned-mark';
      mark.textContent = '✓ earned';
      nameEl.append(mark);
    }
  }

  const descEl = document.createElement('p');
  descEl.className = 'trophy-desc';
  descEl.textContent = spoilerHides(trophy)
    ? 'Hidden on PlayStation until earned. Spoiler-free mode is on.'
    : trophy.description;

  const tags = document.createElement('div');
  tags.className = 'tags';
  const tagTexts = [
    { text: KIND_LABELS[trophy.kind] ?? trophy.kind, cls: '' },
    { text: trophy.target, cls: '' },
    { text: STAGE_LABELS[trophy.stage] ?? trophy.stage, cls: 'tag-stage' },
  ];
  if (trophy.hidden) tagTexts.push({ text: 'Hidden', cls: 'tag-hidden' });
  if (trophy.missable) tagTexts.push({ text: '⚠ Missable', cls: 'tag-missable' });
  for (const tag of tagTexts) {
    const span = document.createElement('span');
    span.className = `tag ${tag.cls}`.trim();
    span.textContent = tag.text;
    tags.append(span);
  }

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'guide-toggle';
  const isOpen = openGuides.has(trophy.id);
  toggle.textContent = isOpen ? '▾ Hide guide' : '▸ Read the guide';
  toggle.setAttribute('aria-expanded', String(isOpen));
  toggle.addEventListener('click', () => {
    if (openGuides.has(trophy.id)) openGuides.delete(trophy.id);
    else openGuides.add(trophy.id);
    renderTrophies();
  });

  main.append(nameEl, descEl, tags, toggle);

  if (isOpen) {
    const guideBox = document.createElement('div');
    guideBox.className = 'trophy-guide';
    if (spoilerHides(trophy)) {
      const note = document.createElement('p');
      note.className = 'spoiler-hidden';
      note.textContent = 'The guide is hidden until this trophy is earned — turn spoiler-free mode off, or tick it earned, to read it.';
      guideBox.append(note);
    } else {
      const target = document.createElement('p');
      target.className = 'guide-target';
      target.textContent = `Goal: ${trophy.target}`;
      const guide = document.createElement('p');
      guide.textContent = trophy.guide;
      const sources = document.createElement('p');
      sources.className = 'guide-sources';
      sources.textContent = 'Sources: ';
      trophy.sources.forEach((source, i) => {
        if (i > 0) sources.append(document.createTextNode(' · '));
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = source.name;
        sources.append(link);
      });
      guideBox.append(target, guide, sources);
    }
    main.append(guideBox);
  }

  const gradeCell = document.createElement('div');
  gradeCell.className = 'grade-cell';
  const badge = document.createElement('div');
  badge.className = `grade-badge grade-${trophy.grade}`;
  badge.textContent = GRADE_LETTERS[trophy.grade];
  badge.title = trophy.grade;
  const gradeText = document.createElement('div');
  gradeText.className = 'grade-label-text';
  gradeText.textContent = trophy.grade;
  gradeCell.append(badge, gradeText);

  head.append(earnBox, main, gradeCell);
  card.append(head);
  return card;
}

function renderTrophies() {
  const shown = trophies.filter(trophyMatchesFilters);
  listEl.replaceChildren(...shown.map(buildTrophyCard));
  emptyNoteEl.hidden = shown.length > 0;
  if (kindFilter === 'online') {
    filterNoteEl.textContent =
      'No online trophies: all 55 are single-player, and none needs GTA Online. (PowerPyx, GTABase.)';
  } else if (shown.length === 0) {
    filterNoteEl.textContent = 'No trophies match these filters — clear the search or pick another kind.';
  } else {
    filterNoteEl.textContent =
      `Showing ${shown.length} of ${trophies.length} trophies` +
      (spoilerEl.checked ? ' · spoiler-free mode on: hidden trophies stay masked until earned.' : '.');
  }
}

function expandAllGuides() {
  openGuides = new Set(trophies.filter(trophyMatchesFilters).map((t) => t.id));
  renderTrophies();
}

function collapseAllGuides() {
  openGuides = new Set();
  renderTrophies();
}

function exportProgress() {
  const payload = {
    guide: 'Leonida Trophy Guide — GTA VI',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    saveProgress();
    updateProgress();
    renderTrophies();
    filterNoteEl.textContent = `Imported ${earned.size} earned trophies.`;
  } catch {
    filterNoteEl.textContent = 'That file is not a progress export from this guide — nothing was changed.';
  }
}

function resetProgress() {
  if (!window.confirm('Clear all earned trophies? This cannot be undone.')) return;
  earned = new Set();
  saveProgress();
  updateProgress();
  renderTrophies();
}

function openFromHash() {
  const match = window.location.hash.match(/^#trophy-(\d+)$/);
  if (!match) return;
  const id = Number(match[1]);
  if (trophies.some((t) => t.id === id)) {
    openGuides.add(id);
    renderTrophies();
    document.getElementById(`trophy-${id}`)?.scrollIntoView({ block: 'start' });
  }
}

document.getElementById('kindFilters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-kind]');
  if (!button) return;
  kindFilter = button.dataset.kind;
  document.querySelectorAll('#kindFilters .kind-btn').forEach((b) =>
    b.classList.toggle('active', b === button));
  renderTrophies();
});
searchEl.addEventListener('input', renderTrophies);
gradeEl.addEventListener('change', renderTrophies);
earnedOnlyEl.addEventListener('change', renderTrophies);
spoilerEl.addEventListener('change', () => {
  localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
  renderTrophies();
});
document.getElementById('expandAll').addEventListener('click', expandAllGuides);
document.getElementById('collapseAll').addEventListener('click', collapseAllGuides);
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', resetProgress);
window.addEventListener('hashchange', openFromHash);

await loadTrophies();
renderRoadmapCounts();
updateProgress();
renderTrophies();
openFromHash();
