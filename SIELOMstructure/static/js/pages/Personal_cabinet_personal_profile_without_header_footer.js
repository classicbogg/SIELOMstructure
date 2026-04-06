const STORAGE_KEY = 'personal_cabinet_personal_profile_data';
const PHOTO_KEY = 'personal_cabinet_personal_profile_photo';

const form = document.getElementById('profileForm');
const photoInput = document.getElementById('photoInput');
const fileName = document.getElementById('fileName');
const photoPreviewWrapper = document.getElementById('photoPreviewWrapper');
const photoPreview = document.getElementById('photoPreview');
const removePhotoBtn = document.getElementById('removePhotoBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');
const toast = document.getElementById('toast');

let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function setPhotoPreview(dataUrl, fileLabel = 'Файл выбран') {
  if (!dataUrl) {
    photoPreview.removeAttribute('src');
    photoPreviewWrapper.classList.add('hidden');
    fileName.textContent = 'Файл не выбран';
    return;
  }

  photoPreview.src = dataUrl;
  photoPreviewWrapper.classList.remove('hidden');
  fileName.textContent = fileLabel;
}

function collectFormData() {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  data.showPublicPage = form.elements.showPublicPage.checked;
  data.showEmail = form.elements.showEmail.checked;
  data.showPhone = form.elements.showPhone.checked;
  data.showTelegram = form.elements.showTelegram.checked;

  return data;
}

function applyFormData(data) {
  Object.entries(data).forEach(([key, value]) => {
    const field = form.elements[key];
    if (!field) return;

    if (field.type === 'checkbox') {
      field.checked = Boolean(value);
    } else {
      field.value = value ?? '';
    }
  });
}

function validateForm(data) {
  if (!data.firstName?.trim()) {
    showToast('Укажите имя');
    form.elements.firstName.focus();
    return false;
  }

  if (!data.lastName?.trim()) {
    showToast('Укажите фамилию');
    form.elements.lastName.focus();
    return false;
  }

  if (!data.email?.trim()) {
    showToast('Укажите email');
    form.elements.email.focus();
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    showToast('Введите корректный email');
    form.elements.email.focus();
    return false;
  }

  if (!data.role?.trim()) {
    showToast('Укажите роль или должность');
    form.elements.role.focus();
    return false;
  }

  return true;
}

function saveFormData() {
  const data = collectFormData();

  if (!validateForm(data)) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  showToast('Профиль сохранён');
}

function loadFormData() {
  const savedData = localStorage.getItem(STORAGE_KEY);
  if (savedData) {
    try {
      applyFormData(JSON.parse(savedData));
    } catch (error) {
      console.error('Не удалось прочитать сохранённый профиль:', error);
    }
  }

  const savedPhoto = localStorage.getItem(PHOTO_KEY);
  if (savedPhoto) {
    setPhotoPreview(savedPhoto, 'Сохранённое фото');
  }
}

photoInput.addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    showToast('Можно загружать только изображения');
    photoInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    localStorage.setItem(PHOTO_KEY, result);
    setPhotoPreview(result, file.name);
    showToast('Фото загружено');
  };
  reader.readAsDataURL(file);
});

removePhotoBtn.addEventListener('click', () => {
  localStorage.removeItem(PHOTO_KEY);
  photoInput.value = '';
  setPhotoPreview('');
  showToast('Фото удалено');
});

changePasswordBtn.addEventListener('click', () => {
  showToast('Кнопка готова. Подключите переход на страницу смены пароля.');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  saveFormData();
});

loadFormData();
