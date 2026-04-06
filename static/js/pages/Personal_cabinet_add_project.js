const STORAGE_KEYS = {
  draft: 'sielom.personalCabinet.addProject.draft',
  projectsSummary: 'sielom.personalCabinet.projects.summary'
};

const DB_CONFIG = {
  name: 'sielom_personal_cabinet_db',
  version: 1,
  storeName: 'projects'
};

const state = {
  mediaFiles: [],
  coverFile: null,
  toastTimer: null
};

const elements = {
  form: document.getElementById('projectForm'),
  title: document.getElementById('projectTitle'),
  titleCounter: document.getElementById('titleCounter'),
  titleError: document.getElementById('titleError'),
  category: document.getElementById('projectCategory'),
  categoryError: document.getElementById('categoryError'),
  mediaInput: document.getElementById('projectMedia'),
  mediaTrigger: document.getElementById('mediaUploadTrigger'),
  mediaGrid: document.getElementById('mediaPreviewGrid'),
  mediaError: document.getElementById('mediaError'),
  coverInput: document.getElementById('projectCover'),
  coverTrigger: document.getElementById('coverUploadTrigger'),
  coverPreview: document.getElementById('coverPreview'),
  coverError: document.getElementById('coverError'),
  saveBtn: document.getElementById('saveProjectBtn'),
  toast: document.getElementById('toast')
};

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  updateTitleCounter();
  restoreDraft();
  renderMediaPreview();
  renderCoverPreview();
  updateSaveButtonState();
});

function bindEvents() {
  elements.title.addEventListener('input', () => {
    updateTitleCounter();
    clearError(elements.titleError);
    persistDraft();
  });

  elements.category.addEventListener('change', () => {
    clearError(elements.categoryError);
    persistDraft();
    updateSaveButtonState();
  });

  elements.mediaTrigger.addEventListener('click', () => elements.mediaInput.click());
  elements.coverTrigger.addEventListener('click', () => elements.coverInput.click());

  elements.mediaInput.addEventListener('change', (event) => handleMediaSelection(event.target.files));
  elements.coverInput.addEventListener('change', (event) => handleCoverSelection(event.target.files));

  setupDropzone(elements.mediaTrigger, handleMediaSelection, true);
  setupDropzone(elements.coverTrigger, handleCoverSelection, false);

  elements.form.addEventListener('submit', handleSubmit);
}

function setupDropzone(zone, onFilesSelected, multiple) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    zone.addEventListener(eventName, (event) => {
      event.preventDefault();
      zone.classList.remove('dragover');
    });
  });

  zone.addEventListener('drop', (event) => {
    const files = event.dataTransfer?.files;
    if (!files || !files.length) return;

    if (multiple) {
      onFilesSelected(files);
    } else {
      onFilesSelected([files[0]]);
    }
  });
}

function updateTitleCounter() {
  const valueLength = elements.title.value.trim().length;
  elements.titleCounter.textContent = `${valueLength} из 40 символов`;
}

function handleMediaSelection(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;

  const validFiles = [];

  for (const file of files) {
    const validationMessage = validateMediaFile(file);
    if (validationMessage) {
      showToast(validationMessage, 'error');
      continue;
    }

    const duplicate = state.mediaFiles.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified);
    if (!duplicate) {
      validFiles.push(file);
    }
  }

  if (!validFiles.length) return;

  state.mediaFiles = [...state.mediaFiles, ...validFiles];
  elements.mediaInput.value = '';
  clearError(elements.mediaError);
  renderMediaPreview();
  persistDraft();
  updateSaveButtonState();
}

function handleCoverSelection(fileList) {
  const file = Array.from(fileList || [])[0];
  if (!file) return;

  const validationMessage = validateCoverFile(file);
  if (validationMessage) {
    showToast(validationMessage, 'error');
    return;
  }

  state.coverFile = file;
  elements.coverInput.value = '';
  clearError(elements.coverError);
  renderCoverPreview();
  persistDraft();
  updateSaveButtonState();
}

function validateMediaFile(file) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  if (!isImage && !isVideo) {
    return `Файл «${file.name}» не поддерживается.`;
  }

  if (isImage && file.size > 10 * 1024 * 1024) {
    return `Изображение «${file.name}» превышает 10 МБ.`;
  }

  if (isVideo && file.size > 50 * 1024 * 1024) {
    return `Видео «${file.name}» превышает 50 МБ.`;
  }

  return '';
}

function validateCoverFile(file) {
  if (!file.type.startsWith('image/')) {
    return 'Для обложки можно загрузить только изображение.';
  }

  if (file.size > 10 * 1024 * 1024) {
    return 'Обложка не должна превышать 10 МБ.';
  }

  return '';
}

function renderMediaPreview() {
  elements.mediaGrid.innerHTML = '';

  state.mediaFiles.forEach((file, index) => {
    const previewItem = createPreviewCard({
      file,
      label: file.type.startsWith('video/') ? 'Видео' : 'Изображение',
      onRemove: () => {
        state.mediaFiles.splice(index, 1);
        renderMediaPreview();
        persistDraft();
        updateSaveButtonState();
      }
    });

    elements.mediaGrid.appendChild(previewItem);
  });
}

function renderCoverPreview() {
  elements.coverPreview.innerHTML = '';

  if (!state.coverFile) return;

  const previewItem = createPreviewCard({
    file: state.coverFile,
    label: 'Обложка',
    onRemove: () => {
      state.coverFile = null;
      renderCoverPreview();
      persistDraft();
      updateSaveButtonState();
    }
  });

  elements.coverPreview.appendChild(previewItem);
}

function createPreviewCard({ file, label, onRemove }) {
  const wrapper = document.createElement('article');
  wrapper.className = 'preview-item';

  const objectUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/');
  const mediaElement = document.createElement(isVideo ? 'video' : 'img');

  if (isVideo) {
    mediaElement.src = objectUrl;
    mediaElement.controls = true;
    mediaElement.preload = 'metadata';
  } else {
    mediaElement.src = objectUrl;
    mediaElement.alt = file.name;
    mediaElement.loading = 'lazy';
  }

  mediaElement.addEventListener('load', () => URL.revokeObjectURL(objectUrl), { once: true });
  if (isVideo) {
    mediaElement.addEventListener('loadeddata', () => URL.revokeObjectURL(objectUrl), { once: true });
  }

  const badge = document.createElement('span');
  badge.className = 'preview-badge';
  badge.textContent = label;

  const removeButton = document.createElement('button');
  removeButton.className = 'preview-remove';
  removeButton.type = 'button';
  removeButton.setAttribute('aria-label', `Удалить ${file.name}`);
  removeButton.textContent = '×';
  removeButton.addEventListener('click', onRemove);

  const caption = document.createElement('div');
  caption.className = 'preview-caption';
  caption.textContent = file.name;

  wrapper.appendChild(mediaElement);
  wrapper.appendChild(badge);
  wrapper.appendChild(removeButton);
  wrapper.appendChild(caption);

  return wrapper;
}

function validateForm() {
  let isValid = true;

  clearError(elements.categoryError);
  clearError(elements.mediaError);
  clearError(elements.coverError);

  if (!elements.category.value) {
    elements.categoryError.textContent = 'Выберите рубрику.';
    isValid = false;
  }

  if (!state.mediaFiles.length) {
    elements.mediaError.textContent = 'Нужно загрузить минимум один файл.';
    isValid = false;
  }

  if (!state.coverFile) {
    elements.coverError.textContent = 'Добавьте обложку проекта.';
    isValid = false;
  }

  return isValid;
}

async function handleSubmit(event) {
  event.preventDefault();

  if (!validateForm()) {
    showToast('Заполните обязательные поля.', 'error');
    return;
  }

  elements.saveBtn.disabled = true;
  elements.saveBtn.textContent = 'Сохраняем...';

  try {
    const project = buildProjectPayload();
    await saveProjectToIndexedDB(project);
    await saveProjectSummary(project);
    clearDraft();
    resetForm();
    showToast('Проект сохранён. Он доступен в локальном хранилище браузера.', 'success');
  } catch (error) {
    console.error(error);
    showToast('Не удалось сохранить проект. Проверьте размер файлов и попробуйте снова.', 'error');
  } finally {
    updateSaveButtonState();
    elements.saveBtn.textContent = 'Сохранить';
  }
}

function buildProjectPayload() {
  return {
    id: crypto.randomUUID(),
    title: elements.title.value.trim() || `Работа ${new Date().toLocaleDateString('ru-RU')}`,
    category: elements.category.value,
    categoryLabel: elements.category.options[elements.category.selectedIndex].text,
    mediaFiles: [...state.mediaFiles],
    coverFile: state.coverFile,
    createdAt: new Date().toISOString()
  };
}

function openProjectDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_CONFIG.storeName)) {
        db.createObjectStore(DB_CONFIG.storeName, { keyPath: 'id' });
      }
    };
  });
}

async function saveProjectToIndexedDB(project) {
  const db = await openProjectDb();

  await new Promise((resolve, reject) => {
    const transaction = db.transaction(DB_CONFIG.storeName, 'readwrite');
    const store = transaction.objectStore(DB_CONFIG.storeName);
    store.put(project);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });

  db.close();
}

async function saveProjectSummary(project) {
  const summary = JSON.parse(localStorage.getItem(STORAGE_KEYS.projectsSummary) || '[]');
  const coverDataUrl = await fileToDataURL(project.coverFile);

  summary.unshift({
    id: project.id,
    title: project.title,
    category: project.category,
    categoryLabel: project.categoryLabel,
    coverDataUrl,
    mediaCount: project.mediaFiles.length,
    createdAt: project.createdAt
  });

  localStorage.setItem(STORAGE_KEYS.projectsSummary, JSON.stringify(summary.slice(0, 50)));
}

function updateSaveButtonState() {
  const hasMinimumData = Boolean(elements.category.value && state.mediaFiles.length && state.coverFile);
  elements.saveBtn.disabled = !hasMinimumData;
}

function persistDraft() {
  const draft = {
    title: elements.title.value,
    category: elements.category.value
  };

  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(draft));
}

function restoreDraft() {
  const rawDraft = localStorage.getItem(STORAGE_KEYS.draft);
  if (!rawDraft) return;

  try {
    const draft = JSON.parse(rawDraft);
    elements.title.value = draft.title || '';
    elements.category.value = draft.category || '';
  } catch (error) {
    console.warn('Не удалось восстановить черновик.', error);
  }
}

function clearDraft() {
  localStorage.removeItem(STORAGE_KEYS.draft);
}

function resetForm() {
  elements.form.reset();
  state.mediaFiles = [];
  state.coverFile = null;
  renderMediaPreview();
  renderCoverPreview();
  updateTitleCounter();
  clearError(elements.titleError);
  clearError(elements.categoryError);
  clearError(elements.mediaError);
  clearError(elements.coverError);
}

function clearError(element) {
  element.textContent = '';
}

function showToast(message, type = 'success') {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.className = `toast is-visible ${type}`;

  state.toastTimer = setTimeout(() => {
    elements.toast.className = 'toast';
  }, 3200);
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
