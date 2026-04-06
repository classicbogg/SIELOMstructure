const state = {
  items: [],
  activeId: null,
};

const titleInput = document.getElementById('projectTitle');
const titleCounter = document.getElementById('titleCounter');
const openUploadButton = document.getElementById('openUploadButton');
const galleryInput = document.getElementById('galleryInput');
const galleryGrid = document.getElementById('galleryGrid');
const galleryHint = document.getElementById('galleryHint');
const cardPreview = document.getElementById('cardPreview');
const cardPreviewPlaceholder = document.getElementById('cardPreviewPlaceholder');
const mainPreview = document.getElementById('mainPreview');
const mainPreviewPlaceholder = document.getElementById('mainPreviewPlaceholder');
const cardTitle = document.getElementById('cardTitle');
const cardMeta = document.getElementById('cardMeta');
const coverStatus = document.getElementById('coverStatus');
const categorySelect = document.getElementById('categorySelect');
const subcategorySelect = document.getElementById('subcategorySelect');
const projectTypeInputs = Array.from(document.querySelectorAll('input[name="project-type"]'));
const saveButton = document.getElementById('saveButton');
const toast = document.getElementById('toast');

let toastTimeout = null;

function updateTitleCounter() {
  titleCounter.textContent = titleInput.value.length;
  cardTitle.textContent = titleInput.value.trim() || 'Без названия';
  updateCardMeta();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

function getActiveItem() {
  return state.items.find((item) => item.id === state.activeId) || null;
}

function getSelectedProjectType() {
  const activeType = projectTypeInputs.find((input) => input.checked);
  return activeType?.nextElementSibling?.textContent?.trim() || '';
}

function updateCardMeta() {
  const parts = [subcategorySelect?.value?.trim(), getSelectedProjectType()].filter(Boolean);
  cardMeta.textContent = parts.join(' • ') || 'Категория не выбрана';
}

function refreshPreview() {
  const activeItem = getActiveItem();

  if (!activeItem) {
    cardPreview.removeAttribute('src');
    mainPreview.removeAttribute('src');
    cardPreview.hidden = true;
    mainPreview.hidden = true;
    cardPreviewPlaceholder.hidden = false;
    mainPreviewPlaceholder.hidden = false;
    coverStatus.textContent = 'Обложка появится после загрузки первого изображения';
    return;
  }

  cardPreview.src = activeItem.url;
  mainPreview.src = activeItem.url;
  cardPreview.alt = `Превью проекта: ${activeItem.name}`;
  mainPreview.alt = `Главное превью: ${activeItem.name}`;
  cardPreview.hidden = false;
  mainPreview.hidden = false;
  cardPreviewPlaceholder.hidden = true;
  mainPreviewPlaceholder.hidden = true;

  const activeIndex = state.items.findIndex((item) => item.id === activeItem.id) + 1;
  coverStatus.textContent = `Текущая обложка: ${activeItem.name} · фото ${activeIndex} из ${state.items.length}`;
}

function updateSaveButtonState() {
  saveButton.disabled = state.items.length === 0;
}

function updateHint() {
  if (state.items.length === 0) {
    galleryHint.textContent = 'Пока ничего не загружено.';
    return;
  }

  galleryHint.textContent = `Загружено изображений: ${state.items.length}. Нажмите на карточку, чтобы сделать её текущей обложкой.`;
}

function renderGallery() {
  galleryGrid.innerHTML = '';

  state.items.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'gallery-card';
    if (item.id === state.activeId) {
      card.classList.add('is-active');
    }

    const image = document.createElement('img');
    image.src = item.url;
    image.alt = item.name;

    const actions = document.createElement('div');
    actions.className = 'gallery-card__actions';

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'icon-button select';
    selectButton.title = 'Сделать основной';
    selectButton.textContent = '★';
    selectButton.addEventListener('click', (event) => {
      event.stopPropagation();
      state.activeId = item.id;
      renderGallery();
      refreshPreview();
      updateHint();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-button delete';
    deleteButton.title = 'Удалить';
    deleteButton.textContent = '✕';
    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();
      removeItem(item.id);
    });

    actions.append(selectButton, deleteButton);
    card.append(image, actions);

    card.addEventListener('click', () => {
      state.activeId = item.id;
      renderGallery();
      refreshPreview();
      updateHint();
    });

    galleryGrid.append(card);
  });

  updateSaveButtonState();
  updateHint();
}

function removeItem(id) {
  const index = state.items.findIndex((item) => item.id === id);
  if (index === -1) {
    return;
  }

  const [removedItem] = state.items.splice(index, 1);
  URL.revokeObjectURL(removedItem.url);

  if (state.activeId === id) {
    state.activeId = state.items[0]?.id || null;
  }

  renderGallery();
  refreshPreview();
  showToast('Изображение удалено.');
}

function addFiles(files) {
  const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));

  if (imageFiles.length === 0) {
    showToast('Нужно выбрать хотя бы одно изображение.');
    return;
  }

  imageFiles.forEach((file) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    state.items.push({
      id,
      name: file.name,
      file,
      url: URL.createObjectURL(file),
    });
  });

  if (!state.activeId && state.items.length > 0) {
    state.activeId = state.items[0].id;
  }

  renderGallery();
  refreshPreview();
  showToast(`Добавлено изображений: ${imageFiles.length}.`);
}

openUploadButton.addEventListener('click', () => {
  galleryInput.click();
});

galleryInput.addEventListener('change', (event) => {
  if (!event.target.files?.length) {
    return;
  }

  addFiles(event.target.files);
  galleryInput.value = '';
});

titleInput.addEventListener('input', updateTitleCounter);


subcategorySelect.addEventListener('change', updateCardMeta);
categorySelect.addEventListener('change', updateCardMeta);
projectTypeInputs.forEach((input) => {
  input.addEventListener('change', () => {
    document.querySelectorAll('.radio-item').forEach((item) => item.classList.remove('active'));
    input.closest('.radio-item')?.classList.add('active');
    updateCardMeta();
  });
});

saveButton.addEventListener('click', () => {
  if (state.items.length === 0) {
    showToast('Сначала добавь хотя бы одну фотографию.');
    return;
  }

  const projectSummary = {
    title: titleInput.value.trim() || 'Без названия',
    imagesCount: state.items.length,
    activeImageName: getActiveItem()?.name || null,
    savedAt: new Date().toLocaleString('ru-RU'),
  };

  localStorage.setItem('personalCabinetEditProjectSummary', JSON.stringify(projectSummary));
  showToast('Локальная сводка проекта сохранена. Фото остаются в текущей сессии браузера.');
});

updateTitleCounter();
renderGallery();
refreshPreview();
updateSaveButtonState();
