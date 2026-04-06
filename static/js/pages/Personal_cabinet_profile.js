const STORAGE_KEYS = {
  profile: 'personal_cabinet_profile__profile',
  works: 'personal_cabinet_profile__works',
  favorite: 'personal_cabinet_profile__favorite',
};

const defaultProfile = {
  name: 'ДИАНА',
  role: 'Графический дизайнер',
  about: 'Умею создавать качественные и привлекательные визуальные концепции для различных проектов. Я знакома с принципами цвета, композиции и типографикой.',
  skills: [
    'Рисунок от руки, хорошее владение графическими пакетами.',
    'Дизайн рекламно-полиграфической продукции.',
    'Разработка дизайна упаковки.',
    'Разработка логотипов, фирменного стиля.',
    'Верстка, цветокоррекция, допечатная подготовка (офсет, цифра).',
    'Имеется графический планшет для отрисовки векторных и растровых иллюстраций.',
    'Работа с заказчиками.'
  ],
  programs: 'Работаю в программах: Adobe Photoshop, Adobe Illustrator, Adobe Indesign, Adobe XD, Figma, FireAlpaca, CorelDRAW.'
};

const defaultWorks = [
  {
    id: crypto.randomUUID(),
    title: 'Фирменный стиль кофейни',
    description: 'Логотип, меню, паттерны и упаковка для локального бренда.',
    image: '',
    color: '#8f63ff'
  },
  {
    id: crypto.randomUUID(),
    title: 'Оформление маркетплейса',
    description: 'Карточки товара, баннеры и набор промо-материалов.',
    image: '',
    color: '#5d77ff'
  }
];

const reviews = [
  {
    name: 'Юрченко Бодя',
    role: 'ГРУША',
    text: 'Было приятно работать с Дианой, все класс. Дизайн получился аккуратный, чистый и очень цепляющий.'
  },
  {
    name: 'Паша Техник',
    role: 'ПАПАЯ',
    text: 'Заказ выполнила быстро. Особенно понравилось, что сразу предложила несколько сильных визуальных решений.'
  },
  {
    name: 'Анна Морозова',
    role: 'менеджер проекта',
    text: 'Суперкомфортная коммуникация и хороший вкус. Удалось собрать целый визуальный стиль под запуск продукта.'
  }
];

const state = {
  profile: loadFromStorage(STORAGE_KEYS.profile, defaultProfile),
  works: loadFromStorage(STORAGE_KEYS.works, defaultWorks),
  favorite: loadFromStorage(STORAGE_KEYS.favorite, false),
  currentReviewIndex: 0,
  currentWorkId: null,
};

const els = {
  profileName: document.getElementById('profileName'),
  roleBadge: document.getElementById('roleBadge'),
  aboutText: document.getElementById('aboutText'),
  skillsList: document.getElementById('skillsList'),
  programsText: document.getElementById('programsText'),
  portfolioGrid: document.getElementById('portfolioGrid'),
  favoriteBtn: document.getElementById('favoriteBtn'),
  openSettingsBtn: document.getElementById('openSettingsBtn'),
  reviewsTrack: document.getElementById('reviewsTrack'),
  reviewsPrev: document.getElementById('reviewsPrev'),
  reviewsNext: document.getElementById('reviewsNext'),
  workModal: document.getElementById('workModal'),
  workForm: document.getElementById('workForm'),
  workTitle: document.getElementById('workTitle'),
  workDescription: document.getElementById('workDescription'),
  workImage: document.getElementById('workImage'),
  workColor: document.getElementById('workColor'),
  settingsModal: document.getElementById('settingsModal'),
  settingsForm: document.getElementById('settingsForm'),
  settingsName: document.getElementById('settingsName'),
  settingsRole: document.getElementById('settingsRole'),
  settingsAbout: document.getElementById('settingsAbout'),
  settingsSkills: document.getElementById('settingsSkills'),
  settingsPrograms: document.getElementById('settingsPrograms'),
  resetProfileBtn: document.getElementById('resetProfileBtn'),
  previewModal: document.getElementById('previewModal'),
  previewImage: document.getElementById('previewImage'),
  previewTitle: document.getElementById('previewTitle'),
  previewDescription: document.getElementById('previewDescription'),
  deleteWorkBtn: document.getElementById('deleteWorkBtn'),
};

init();

function init() {
  renderProfile();
  renderFavorite();
  renderPortfolio();
  renderReviews();
  fillSettingsForm();
  bindEvents();
}

function bindEvents() {
  els.favoriteBtn.addEventListener('click', toggleFavorite);
  els.openSettingsBtn.addEventListener('click', () => openModal('settingsModal'));

  els.workForm.addEventListener('submit', handleWorkSubmit);
  els.settingsForm.addEventListener('submit', handleSettingsSubmit);
  els.resetProfileBtn.addEventListener('click', resetProfile);
  els.deleteWorkBtn.addEventListener('click', deleteCurrentWork);

  els.reviewsPrev.addEventListener('click', () => slideReviews(-1));
  els.reviewsNext.addEventListener('click', () => slideReviews(1));

  document.querySelectorAll('[data-close-modal]').forEach((button) => {
    button.addEventListener('click', () => closeModal(button.dataset.closeModal));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeModal('workModal');
      closeModal('settingsModal');
      closeModal('previewModal');
    }
  });
}

function renderProfile() {
  els.profileName.textContent = state.profile.name.toUpperCase();
  els.roleBadge.textContent = state.profile.role;
  els.aboutText.textContent = state.profile.about;
  els.programsText.textContent = state.profile.programs;
  els.skillsList.innerHTML = '';

  state.profile.skills.forEach((skill, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}) ${skill}`;
    els.skillsList.appendChild(li);
  });
}

function renderFavorite() {
  els.favoriteBtn.classList.toggle('is-active', Boolean(state.favorite));
}

function renderPortfolio() {
  els.portfolioGrid.innerHTML = '';

  const addCard = document.createElement('button');
  addCard.type = 'button';
  addCard.className = 'portfolio-add-card';
  addCard.innerHTML = `
    <span class="portfolio-add-card__plus"></span>
    <span>Добавить работу</span>
  `;
  addCard.addEventListener('click', () => openModal('workModal'));
  els.portfolioGrid.appendChild(addCard);

  state.works.forEach((work, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'portfolio-card';
    const imageBackground = work.image
      ? `background-image: linear-gradient(135deg, rgba(17,18,20,0.3), rgba(17,18,20,0.45)), url('${sanitizeUrl(work.image)}');`
      : `background-image: linear-gradient(135deg, ${work.color}, ${darkenHex(work.color, 0.32)});`;

    card.innerHTML = `
      <div class="portfolio-card__image" style="${imageBackground}"></div>
      <div class="portfolio-card__title">${escapeHtml(work.title)}</div>
      <div class="portfolio-card__desc">${escapeHtml(work.description || 'Без описания')}</div>
      <span class="portfolio-card__tag">Работа ${index + 1}</span>
    `;
    card.addEventListener('click', () => openPreview(work.id));
    els.portfolioGrid.appendChild(card);
  });

  const emptyCount = Math.max(0, 11 - state.works.length);
  Array.from({ length: emptyCount }).forEach(() => {
    const placeholder = document.createElement('div');
    placeholder.className = 'portfolio-empty-card';
    els.portfolioGrid.appendChild(placeholder);
  });
}

function renderReviews() {
  els.reviewsTrack.innerHTML = '';

  reviews.forEach((review) => {
    const card = document.createElement('article');
    card.className = 'review-card';
    card.innerHTML = `
      <div class="review-card__avatar">${getInitials(review.name)}</div>
      <div class="review-card__text">${escapeHtml(review.text)}</div>
      <div class="review-card__name">${escapeHtml(review.name)}</div>
      <div class="review-card__role">${escapeHtml(review.role)}</div>
    `;
    els.reviewsTrack.appendChild(card);
  });

  updateReviewsTransform();
}

function updateReviewsTransform() {
  const gap = 18;
  const card = els.reviewsTrack.querySelector('.review-card');
  if (!card) return;
  const width = card.getBoundingClientRect().width + gap;
  els.reviewsTrack.style.transform = `translateX(-${state.currentReviewIndex * width}px)`;
}

function slideReviews(direction) {
  const lastIndex = Math.max(0, reviews.length - 1);
  state.currentReviewIndex += direction;

  if (state.currentReviewIndex < 0) state.currentReviewIndex = 0;
  if (state.currentReviewIndex > lastIndex) state.currentReviewIndex = lastIndex;

  updateReviewsTransform();
}

function handleWorkSubmit(event) {
  event.preventDefault();

  const title = els.workTitle.value.trim();
  const description = els.workDescription.value.trim();
  const image = els.workImage.value.trim();
  const color = els.workColor.value;

  if (!title) return;

  state.works.unshift({
    id: crypto.randomUUID(),
    title,
    description,
    image,
    color,
  });

  saveToStorage(STORAGE_KEYS.works, state.works);
  renderPortfolio();
  els.workForm.reset();
  els.workColor.value = '#8e63ff';
  closeModal('workModal');
}

function handleSettingsSubmit(event) {
  event.preventDefault();

  state.profile = {
    name: els.settingsName.value.trim() || defaultProfile.name,
    role: els.settingsRole.value.trim() || defaultProfile.role,
    about: els.settingsAbout.value.trim() || defaultProfile.about,
    skills: els.settingsSkills.value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    programs: els.settingsPrograms.value.trim() || defaultProfile.programs,
  };

  if (!state.profile.skills.length) {
    state.profile.skills = [...defaultProfile.skills];
  }

  saveToStorage(STORAGE_KEYS.profile, state.profile);
  renderProfile();
  fillSettingsForm();
  closeModal('settingsModal');
}

function fillSettingsForm() {
  els.settingsName.value = state.profile.name;
  els.settingsRole.value = state.profile.role;
  els.settingsAbout.value = state.profile.about;
  els.settingsSkills.value = state.profile.skills.join('\n');
  els.settingsPrograms.value = state.profile.programs;
}

function resetProfile() {
  state.profile = structuredClone(defaultProfile);
  saveToStorage(STORAGE_KEYS.profile, state.profile);
  renderProfile();
  fillSettingsForm();
}

function openPreview(id) {
  const work = state.works.find((item) => item.id === id);
  if (!work) return;

  state.currentWorkId = id;
  els.previewTitle.textContent = work.title;
  els.previewDescription.textContent = work.description || 'Описание не добавлено.';

  if (work.image) {
    els.previewImage.style.backgroundImage = `linear-gradient(135deg, rgba(17,18,20,0.3), rgba(17,18,20,0.45)), url('${sanitizeUrl(work.image)}')`;
  } else {
    els.previewImage.style.backgroundImage = `linear-gradient(135deg, ${work.color}, ${darkenHex(work.color, 0.32)})`;
  }

  openModal('previewModal');
}

function deleteCurrentWork() {
  if (!state.currentWorkId) return;

  state.works = state.works.filter((item) => item.id !== state.currentWorkId);
  saveToStorage(STORAGE_KEYS.works, state.works);
  renderPortfolio();
  closeModal('previewModal');
  state.currentWorkId = null;
}

function toggleFavorite() {
  state.favorite = !state.favorite;
  saveToStorage(STORAGE_KEYS.favorite, state.favorite);
  renderFavorite();
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function darkenHex(hex, amount = 0.25) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  const r = Math.max(0, Math.floor(((bigint >> 16) & 255) * (1 - amount)));
  const g = Math.max(0, Math.floor(((bigint >> 8) & 255) * (1 - amount)));
  const b = Math.max(0, Math.floor((bigint & 255) * (1 - amount)));
  return `rgb(${r}, ${g}, ${b})`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.href;
  } catch {
    return '';
  }
}

window.addEventListener('resize', updateReviewsTransform);
