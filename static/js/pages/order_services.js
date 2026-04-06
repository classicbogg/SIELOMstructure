const form = document.getElementById('serviceCalculator');
const totalPriceElement = document.getElementById('totalPrice');
const copyButton = document.getElementById('copyEstimate');
const toast = document.getElementById('toast');
const selects = [...document.querySelectorAll('select')];

const fields = {
  pages: document.getElementById('pages'),
  deadline: document.getElementById('deadline'),
  projectType: document.getElementById('projectType'),
  designAdaptive: document.getElementById('designAdaptive'),
  seo: document.getElementById('seo'),
  integrations: document.getElementById('integrations'),
  support: document.getElementById('support'),
  clientName: document.getElementById('clientName'),
  clientEmail: document.getElementById('clientEmail'),
  clientPhone: document.getElementById('clientPhone')
};

const typeConfig = {
  landing: { base: 12000, perPage: 3000 },
  multipage: { base: 18000, perPage: 3800 },
  shop: { base: 26000, perPage: 5200 },
  corporate: { base: 22000, perPage: 4300 }
};

const deadlineMultiplier = {
  relaxed: 0.95,
  standard: 1,
  urgent: 1.25,
  rush: 1.45
};

const extrasConfig = {
  designAdaptive: 15000,
  seo: 6000,
  integrations: 12000,
  support: 7000
};

const STORAGE_KEY = 'sielom_service_calculator';
const REQUESTS_KEY = 'sielom_service_requests';

function formatPrice(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

function normalizePages(rawValue) {
  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric) || numeric < 1) return 1;
  return Math.min(999, Math.round(numeric));
}

function getCalculation() {
  const pages = normalizePages(fields.pages.value);
  const type = typeConfig[fields.projectType.value] || typeConfig.landing;
  const deadlineRate = deadlineMultiplier[fields.deadline.value] || 1;

  let total = type.base + pages * type.perPage;

  if (fields.designAdaptive.checked) total += extrasConfig.designAdaptive;
  if (fields.seo.checked) total += extrasConfig.seo;
  if (fields.integrations.checked) total += extrasConfig.integrations;
  if (fields.support.checked) total += extrasConfig.support;

  total *= deadlineRate;

  return {
    pages,
    total: Math.round(total),
    typeLabel: fields.projectType.options[fields.projectType.selectedIndex].text,
    deadlineLabel: fields.deadline.options[fields.deadline.selectedIndex].text,
    extras: [
      fields.designAdaptive.checked && 'Дизайн + адаптив',
      fields.seo.checked && 'SEO-основа',
      fields.integrations.checked && 'Интеграции (CRM/бот/оплата)',
      fields.support.checked && 'Поддержка 1 месяц'
    ].filter(Boolean)
  };
}

function updateSelectStyles() {
  selects.forEach((select) => {
    const placeholderLike = ['Сроки', 'Тип'].includes(select.options[select.selectedIndex]?.text);
    select.classList.toggle('has-value', !placeholderLike);
  });
}

function saveState() {
  const state = {
    pages: fields.pages.value,
    deadline: fields.deadline.value,
    projectType: fields.projectType.value,
    designAdaptive: fields.designAdaptive.checked,
    seo: fields.seo.checked,
    integrations: fields.integrations.checked,
    support: fields.support.checked,
    clientName: fields.clientName.value,
    clientEmail: fields.clientEmail.value,
    clientPhone: fields.clientPhone.value
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const state = JSON.parse(raw);

    fields.pages.value = state.pages ?? 5;
    fields.deadline.value = state.deadline ?? 'standard';
    fields.projectType.value = state.projectType ?? 'landing';
    fields.designAdaptive.checked = Boolean(state.designAdaptive);
    fields.seo.checked = Boolean(state.seo);
    fields.integrations.checked = Boolean(state.integrations);
    fields.support.checked = Boolean(state.support);
    fields.clientName.value = state.clientName ?? '';
    fields.clientEmail.value = state.clientEmail ?? '';
    fields.clientPhone.value = state.clientPhone ?? '';
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function renderTotal() {
  const { total } = getCalculation();
  totalPriceElement.textContent = formatPrice(total);
  updateSelectStyles();
  saveState();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

function buildEstimateText() {
  const calculation = getCalculation();

  return [
    'Расчет стоимости SIELOM.WEB',
    `Тип проекта: ${calculation.typeLabel}`,
    `Количество страниц: ${calculation.pages}`,
    `Сроки: ${calculation.deadlineLabel}`,
    `Дополнительные опции: ${calculation.extras.length ? calculation.extras.join(', ') : 'Нет'}`,
    `Имя: ${fields.clientName.value.trim() || 'Не указано'}`,
    `Почта: ${fields.clientEmail.value.trim() || 'Не указано'}`,
    `Телефон: ${fields.clientPhone.value.trim() || 'Не указано'}`,
    `Итого: ${formatPrice(calculation.total)} руб.`
  ].join('\n');
}

async function copyEstimate() {
  const text = buildEstimateText();

  try {
    await navigator.clipboard.writeText(text);
    showToast('Расчет скопирован');
  } catch {
    const temp = document.createElement('textarea');
    temp.value = text;
    document.body.appendChild(temp);
    temp.select();
    document.execCommand('copy');
    temp.remove();
    showToast('Расчет скопирован');
  }
}

function validateForm() {
  const email = fields.clientEmail.value.trim();
  const phone = fields.clientPhone.value.trim();
  const name = fields.clientName.value.trim();

  if (!name) {
    showToast('Укажи имя');
    fields.clientName.focus();
    return false;
  }

  if (!email) {
    showToast('Укажи почту');
    fields.clientEmail.focus();
    return false;
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailValid) {
    showToast('Проверь формат почты');
    fields.clientEmail.focus();
    return false;
  }

  if (!phone) {
    showToast('Укажи телефон');
    fields.clientPhone.focus();
    return false;
  }

  return true;
}

function saveRequest() {
  const requests = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
  const calculation = getCalculation();

  requests.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    createdAt: new Date().toISOString(),
    clientName: fields.clientName.value.trim(),
    clientEmail: fields.clientEmail.value.trim(),
    clientPhone: fields.clientPhone.value.trim(),
    pages: calculation.pages,
    type: calculation.typeLabel,
    deadline: calculation.deadlineLabel,
    extras: calculation.extras,
    total: calculation.total
  });

  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests.slice(0, 20)));
}

function clearContactFields() {
  fields.clientName.value = '';
  fields.clientEmail.value = '';
  fields.clientPhone.value = '';
}

form.addEventListener('input', (event) => {
  if (event.target === fields.pages) {
    fields.pages.value = normalizePages(fields.pages.value);
  }
  renderTotal();
});

form.addEventListener('change', renderTotal);
copyButton.addEventListener('click', copyEstimate);

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validateForm()) return;

  saveRequest();
  const calculation = getCalculation();

  const mailtoBody = encodeURIComponent(buildEstimateText());
  const mailtoLink = `mailto:${fields.clientEmail.value.trim()}?subject=${encodeURIComponent('Ваш расчет SIELOM.WEB')}&body=${mailtoBody}`;

  showToast(`Заявка сохранена. Итог: ${formatPrice(calculation.total)} руб.`);
  clearContactFields();
  saveState();
  renderTotal();

  setTimeout(() => {
    window.location.href = mailtoLink;
  }, 450);
});

restoreState();
renderTotal();
