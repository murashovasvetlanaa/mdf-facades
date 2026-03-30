document.addEventListener('DOMContentLoaded', function () {
  // Текущий год в футере
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // ---------- Общие вещи для форм ----------
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjgaplgz';

  // Маска телефона (формат +7 (XXX) XXX-XX-XX)
  function setPhoneMask(value) {
    let digits = value.replace(/\D/g, '');

    if (digits.length > 0) {
      if (digits[0] === '8') digits = '7' + digits.slice(1);
      else if (digits[0] !== '7') digits = '7' + digits;
    }

    if (digits.length > 11) digits = digits.slice(0, 11);

    let formatted = '';
    if (digits.length > 0) {
      formatted = '+7';
      if (digits.length > 1) {
        formatted += ' (' + digits.slice(1, 4);
      }
      if (digits.length >= 5) {
        formatted += ') ' + digits.slice(4, 7);
      }
      if (digits.length >= 8) {
        formatted += '-' + digits.slice(7, 9);
      }
      if (digits.length >= 10) {
        formatted += '-' + digits.slice(9, 11);
      }
    }
    return formatted;
  }

  function attachPhoneMask(input) {
    if (!input) return;

    input.addEventListener('input', function (e) {
      const cursorPos = e.target.selectionStart;
      const oldValue = e.target.value;
      const newValue = setPhoneMask(oldValue);

      if (oldValue !== newValue) {
        e.target.value = newValue;

        const digitsBefore = oldValue.slice(0, cursorPos).replace(/\D/g, '').length;
        let newPos = 0;
        let digitCount = 0;
        for (let i = 0; i < newValue.length; i++) {
          if (/\d/.test(newValue[i])) {
            digitCount++;
            if (digitCount === digitsBefore) {
              newPos = i + 1;
              break;
            }
          }
        }
        if (newPos === 0 && digitsBefore > 0) newPos = newValue.length;
        e.target.setSelectionRange(newPos, newPos);
      }
    });

    input.addEventListener('blur', function () {
      const digits = input.value.replace(/\D/g, '');
      if (digits.length === 11 && digits[0] === '7') {
        input.value = setPhoneMask(input.value);
      }
    });
  }

  async function sendToFormspree(data) {
    const formData = new FormData();
    Object.keys(data).forEach((key) => formData.append(key, data[key]));

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Ошибка отправки');
    }

    return response.json();
  }

  // ---------- Модалка заказа из каталога ----------
  const modalOverlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modal');
  const modalClose = document.getElementById('modalClose');
  const orderForm = document.getElementById('orderForm');
  const productNameInput = document.getElementById('productNameInput');
  const modalMessage = document.getElementById('modalMessage');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const spinner = submitBtn ? submitBtn.querySelector('.spinner') : null;

  const nameInput = document.getElementById('name');
  const phoneInput = document.getElementById('phone');
  const commentInput = document.getElementById('comment');
  const consentCheckbox = document.getElementById('consent');

  const nameError = document.getElementById('nameError');
  const phoneError = document.getElementById('phoneError');
  const consentError = document.getElementById('consentError');

  attachPhoneMask(phoneInput);

  function openCatalogModal(productTitle) {
    if (!modalOverlay) return;
    if (productNameInput) productNameInput.value = productTitle || 'Товар';

    resetCatalogForm();
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCatalogModal() {
    if (!modalOverlay) return;
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    resetCatalogForm();
    enableCatalogSubmit();
  }

  function resetCatalogForm() {
    if (!orderForm) return;
    orderForm.reset();
    if (nameError) nameError.textContent = '';
    if (phoneError) phoneError.textContent = '';
    if (consentError) consentError.textContent = '';
    if (modalMessage) modalMessage.textContent = '';
  }

  function disableCatalogSubmit() {
    if (!submitBtn) return;
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (spinner) spinner.style.display = 'inline-block';
  }

  function enableCatalogSubmit() {
    if (!submitBtn) return;
    submitBtn.disabled = false;
    if (btnText) btnText.style.display = 'inline';
    if (spinner) spinner.style.display = 'none';
  }

  function validateCatalogForm() {
    let isValid = true;

    if (!nameInput.value.trim()) {
      nameError.textContent = 'Введите имя';
      isValid = false;
    } else {
      nameError.textContent = '';
    }

    const phoneDigits = phoneInput.value.replace(/\D/g, '');
    if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') {
      phoneError.textContent = 'Введите корректный номер: +7 (XXX) XXX-XX-XX';
      isValid = false;
    } else {
      phoneError.textContent = '';
    }

    if (!consentCheckbox.checked) {
      consentError.textContent = 'Необходимо согласие на обработку данных';
      isValid = false;
    } else {
      consentError.textContent = '';
    }

    return isValid;
  }

  if (orderForm) {
    orderForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateCatalogForm()) return;

      const data = {
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        comment: commentInput.value.trim(),
        product: productNameInput.value,
        consent: consentCheckbox.checked ? 'on' : 'off',
        form_type: 'catalog',
      };

      disableCatalogSubmit();
      modalMessage.textContent = '';

      try {
        await sendToFormspree(data);
        orderForm.style.display = 'none';
        modalMessage.textContent = 'Спасибо, заявка отправлена!';

        setTimeout(() => {
          closeCatalogModal();
          orderForm.style.display = 'block';
        }, 2000);
      } catch (error) {
        modalMessage.textContent = 'Ошибка: ' + error.message;
        enableCatalogSubmit();
      }
    });
  }

  if (modalClose) {
    modalClose.addEventListener('click', closeCatalogModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeCatalogModal();
    });
  }

  // Открытие модалки по кнопке "Заказать" в карточках
  document.querySelectorAll('.product-card__btn').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const card = this.closest('.product-card');
      const titleElem = card ? card.querySelector('.product-card__title') : null;
      const productTitle = titleElem ? titleElem.textContent.trim() : 'Товар';
      openCatalogModal(productTitle);
    });
  });

  // Закрытие по Esc
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modalOverlay && modalOverlay.classList.contains('active')) {
        closeCatalogModal();
      }
      if (customModalOverlay && customModalOverlay.classList.contains('active')) {
        closeCustomModal();
      }
      if (imageModalOverlay && imageModalOverlay.classList.contains('active')) {
        closeImageModal();
      }
    }
  });

  // ---------- Модалка ИНДИВИДУАЛЬНОГО заказа ----------
  const customModalOverlay = document.getElementById('customModalOverlay');
  const customModal = document.getElementById('customModal');
  const customModalClose = document.getElementById('customModalClose');
  const customOrderForm = document.getElementById('customOrderForm');

  const customNameInput = document.getElementById('customName');
  const customPhoneInput = document.getElementById('customPhone');
  const customCommentInput = document.getElementById('customComment');
  const customConsentCheckbox = document.getElementById('customConsent');

  const customNameError = document.getElementById('customNameError');
  const customPhoneError = document.getElementById('customPhoneError');
  const customConsentError = document.getElementById('customConsentError');

  const customSubmitBtn = document.getElementById('customSubmitBtn');
  const customBtnText = customSubmitBtn ? customSubmitBtn.querySelector('.btn-text') : null;
  const customSpinner = customSubmitBtn ? customSubmitBtn.querySelector('.spinner') : null;

  const customOrderBtnHero = document.getElementById('customOrderBtnHero');
  const customOrderBtnAfterCatalog = document.getElementById('customOrderBtnAfterCatalog');
  const offerCustomBtn = document.getElementById('offerCustomBtn');

  attachPhoneMask(customPhoneInput);

  function openCustomModal() {
    if (!customModalOverlay) return;
    resetCustomForm();
    customModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCustomModal() {
    if (!customModalOverlay) return;
    customModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
    resetCustomForm();
    enableCustomSubmit();
  }

  function resetCustomForm() {
    if (!customOrderForm) return;
    customOrderForm.reset();
    if (customNameError) customNameError.textContent = '';
    if (customPhoneError) customPhoneError.textContent = '';
    if (customConsentError) customConsentError.textContent = '';
    const msg = document.getElementById('customModalMessage');
    if (msg) msg.textContent = '';
  }

  function disableCustomSubmit() {
    if (!customSubmitBtn) return;
    customSubmitBtn.disabled = true;
    if (customBtnText) customBtnText.style.display = 'none';
    if (customSpinner) customSpinner.style.display = 'inline-block';
  }

  function enableCustomSubmit() {
    if (!customSubmitBtn) return;
    customSubmitBtn.disabled = false;
    if (customBtnText) customBtnText.style.display = 'inline';
    if (customSpinner) customSpinner.style.display = 'none';
  }

  function validateCustomForm() {
    let isValid = true;

    if (!customNameInput.value.trim()) {
      customNameError.textContent = 'Введите имя';
      isValid = false;
    } else {
      customNameError.textContent = '';
    }

    const phoneDigits = customPhoneInput.value.replace(/\D/g, '');
    if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') {
      customPhoneError.textContent = 'Введите корректный номер: +7 (XXX) XXX-XX-XX';
      isValid = false;
    } else {
      customPhoneError.textContent = '';
    }

    if (!customConsentCheckbox.checked) {
      customConsentError.textContent = 'Необходимо согласие на обработку данных';
      isValid = false;
    } else {
      customConsentError.textContent = '';
    }

    return isValid;
  }

  if (customOrderForm) {
    customOrderForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validateCustomForm()) return;

      const msg = document.getElementById('customModalMessage');

      const data = {
        name: customNameInput.value.trim(),
        phone: customPhoneInput.value.trim(),
        comment: customCommentInput.value.trim(),
        consent: customConsentCheckbox.checked ? 'on' : 'off',
        form_type: 'custom',
      };

      disableCustomSubmit();
      if (msg) msg.textContent = '';

      try {
        await sendToFormspree(data);
        customOrderForm.style.display = 'none';
        if (msg) msg.textContent = 'Спасибо, заявка отправлена!';

        setTimeout(() => {
          closeCustomModal();
          customOrderForm.style.display = 'block';
        }, 2000);
      } catch (error) {
        if (msg) msg.textContent = 'Ошибка: ' + error.message;
        enableCustomSubmit();
      }
    });
  }

  if (customModalClose) {
    customModalClose.addEventListener('click', closeCustomModal);
  }

  if (customModalOverlay) {
    customModalOverlay.addEventListener('click', function (e) {
      if (e.target === customModalOverlay) closeCustomModal();
    });
  }

  if (customOrderBtnHero) {
    customOrderBtnHero.addEventListener('click', openCustomModal);
  }
  if (customOrderBtnAfterCatalog) {
    customOrderBtnAfterCatalog.addEventListener('click', openCustomModal);
  }
  if (offerCustomBtn) {
    offerCustomBtn.addEventListener('click', openCustomModal);
  }

  // ---------- Слайдер в карточках ----------
  document.querySelectorAll('.product-card__slider').forEach((slider) => {
    const container = slider.querySelector('.slider-container');
    const images = container ? container.querySelectorAll('.slider-img') : [];
    const prevBtn = slider.querySelector('.prev-btn');
    const nextBtn = slider.querySelector('.next-btn');

    if (!images.length || images.length <= 1) {
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      return;
    }

    let current = 0;

    function showImage(index) {
      images.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        current = (current - 1 + images.length) % images.length;
        showImage(current);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        current = (current + 1) % images.length;
        showImage(current);
      });
    }
  });

  // ---------- Модалка увеличения картинки (если нужна) ----------
  const imageModalOverlay = document.getElementById('imageModalOverlay');
  const imageModalClose = document.getElementById('imageModalClose');
  const fullImage = document.getElementById('fullImage');

  function openImageModal(src, alt) {
    if (!imageModalOverlay || !fullImage) return;
    fullImage.src = src;
    fullImage.alt = alt || 'Фасад';
    imageModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeImageModal() {
    if (!imageModalOverlay) return;
    imageModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (imageModalOverlay) {
    imageModalOverlay.addEventListener('click', function (e) {
      if (e.target === imageModalOverlay) closeImageModal();
    });
  }
  if (imageModalClose) {
    imageModalClose.addEventListener('click', closeImageModal);
  }

  document.querySelectorAll('.slider-img').forEach((img) => {
    img.addEventListener('click', () => {
      openImageModal(img.src, img.alt);
    });
  });
// Форма контактов
const contactsForm = document.getElementById('contactsForm');
if (contactsForm) {
  attachPhoneMask(document.getElementById('contactsPhone'));

  contactsForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    let valid = true;

    const name = document.getElementById('contactsName');
    const phone = document.getElementById('contactsPhone');
    const consent = document.getElementById('contactsConsent');

    document.getElementById('contactsNameError').textContent = '';
    document.getElementById('contactsPhoneError').textContent = '';
    document.getElementById('contactsConsentError').textContent = '';

    if (!name.value.trim()) {
      document.getElementById('contactsNameError').textContent = 'Введите имя';
      valid = false;
    }
    const digits = phone.value.replace(/\D/g, '');
    if (digits.length < 11) {
      document.getElementById('contactsPhoneError').textContent = 'Введите полный номер телефона';
      valid = false;
    }
    if (!consent.checked) {
      document.getElementById('contactsConsentError').textContent = 'Необходимо согласие';
      valid = false;
    }
    if (!valid) return;

    const btn = document.getElementById('contactsSubmitBtn');
    const spinner = document.getElementById('contactsSpinner');
    btn.disabled = true;
    spinner.style.display = 'inline-block';

    try {
      const data = new FormData(contactsForm);
      await fetch('https://formspree.io/f/mjgaplgz', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });
      contactsForm.reset();
      document.getElementById('contactsSuccess').style.display = 'block';
    } catch (err) {
      alert('Ошибка отправки. Попробуйте ещё раз.');
    } finally {
      btn.disabled = false;
      spinner.style.display = 'none';
      }
  });
});