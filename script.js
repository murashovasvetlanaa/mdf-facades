// script.js

document.addEventListener('DOMContentLoaded', function() {
    // Текущий год в футере
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Модальное окно каталога ---
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const orderForm = document.getElementById('orderForm');
    const productNameInput = document.getElementById('productNameInput');
    const modalMessage = document.getElementById('modalMessage');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const commentInput = document.getElementById('comment');
    const consentCheckbox = document.getElementById('consent');

    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');
    const consentError = document.getElementById('consentError');

    // --- Модальное окно индивидуального заказа ---
    const customModalOverlay = document.getElementById('customModalOverlay');
    const customModalClose = document.getElementById('customModalClose');
    const customOrderForm = document.getElementById('customOrderForm');
    const customModalMessage = document.getElementById('customModalMessage');
    const customSubmitBtn = document.getElementById('customSubmitBtn');
    const customBtnText = customSubmitBtn.querySelector('.btn-text');
    const customSpinner = customSubmitBtn.querySelector('.spinner');

    const customNameInput = document.getElementById('customName');
    const customPhoneInput = document.getElementById('customPhone');
    const customCommentInput = document.getElementById('customComment');
    const customConsentCheckbox = document.getElementById('customConsent');

    const customNameError = document.getElementById('customNameError');
    const customPhoneError = document.getElementById('customPhoneError');
    const customConsentError = document.getElementById('customConsentError');

    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjgaplgz';

    // --- Общая функция маски телефона ---
    function formatPhoneNumber(value) {
        let digits = value.replace(/\D/g, '');
        if (digits.length > 0 && digits[0] !== '7') digits = '7' + digits;
        if (digits.length > 11) digits = digits.slice(0, 11);
        let formatted = '';
        if (digits.length > 0) {
            formatted = '+7';
            if (digits.length > 1) formatted += ' (' + digits.slice(1, 4);
            if (digits.length >= 5) formatted += ') ' + digits.slice(4, 7);
            if (digits.length >= 8) formatted += '-' + digits.slice(7, 9);
            if (digits.length >= 10) formatted += '-' + digits.slice(9, 11);
        }
        return formatted;
    }

    function applyPhoneMask(inputElement) {
        inputElement.addEventListener('input', function(e) {
            const cursorPos = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = formatPhoneNumber(oldValue);
            if (oldValue !== newValue) {
                e.target.value = newValue;
                const digitsBefore = oldValue.slice(0, cursorPos).replace(/\D/g, '').length;
                let newPos = 0, digitCount = 0;
                for (let i = 0; i < newValue.length; i++) {
                    if (/\d/.test(newValue[i])) {
                        digitCount++;
                        if (digitCount === digitsBefore) {
                            newPos = i + 1;
                            break;
                        }
                    }
                }
                e.target.setSelectionRange(newPos, newPos);
            }
        });
        inputElement.addEventListener('blur', function() {
            const digits = inputElement.value.replace(/\D/g, '');
            if (digits.length === 11 && digits[0] === '7') {
                inputElement.value = formatPhoneNumber(inputElement.value);
            }
        });
    }

    applyPhoneMask(phoneInput);
    applyPhoneMask(customPhoneInput);

    // --- Открытие модальных окон ---
    // Кнопки "Заказать" в каталоге
    document.querySelectorAll('.product-card__btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.product-card');
            const productTitle = card.querySelector('.product-card__title').textContent.trim();
            productNameInput.value = productTitle;
            resetForm();
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Кнопки "Индивидуальный заказ" (на главном и после каталога)
    const customOrderHero = document.getElementById('customOrderBtnHero');
    const customOrderAfter = document.getElementById('customOrderBtnAfterCatalog');
    const openCustomModal = () => {
        resetCustomForm();
        customModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    if (customOrderHero) customOrderHero.addEventListener('click', openCustomModal);
    if (customOrderAfter) customOrderAfter.addEventListener('click', openCustomModal);

    // --- Закрытие модалок ---
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        resetForm();
        enableSubmitButton();
    }
    function closeCustomModal() {
        customModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        resetCustomForm();
        enableCustomSubmitButton();
    }
    modalClose.addEventListener('click', closeModal);
    customModalClose.addEventListener('click', closeCustomModal);
    modalOverlay.addEventListener('click', function(e) { if (e.target === modalOverlay) closeModal(); });
    customModalOverlay.addEventListener('click', function(e) { if (e.target === customModalOverlay) closeCustomModal(); });

    // --- Сброс форм ---
    function resetForm() {
        orderForm.reset();
        nameError.textContent = '';
        phoneError.textContent = '';
        consentError.textContent = '';
        modalMessage.textContent = '';
    }
    function resetCustomForm() {
        customOrderForm.reset();
        customNameError.textContent = '';
        customPhoneError.textContent = '';
        customConsentError.textContent = '';
        customModalMessage.textContent = '';
    }

    // --- Валидация и отправка ---
    function validateForm() {
        let isValid = true;
        if (!nameInput.value.trim()) { nameError.textContent = 'Введите имя'; isValid = false; }
        else nameError.textContent = '';
        const phoneDigits = phoneInput.value.replace(/\D/g, '');
        if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') { phoneError.textContent = 'Введите корректный номер (11 цифр, начиная с 7)'; isValid = false; }
        else phoneError.textContent = '';
        if (!consentCheckbox.checked) { consentError.textContent = 'Необходимо согласие'; isValid = false; }
        else consentError.textContent = '';
        return isValid;
    }
    function validateCustomForm() {
        let isValid = true;
        if (!customNameInput.value.trim()) { customNameError.textContent = 'Введите имя'; isValid = false; }
        else customNameError.textContent = '';
        const phoneDigits = customPhoneInput.value.replace(/\D/g, '');
        if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') { customPhoneError.textContent = 'Введите корректный номер (11 цифр, начиная с 7)'; isValid = false; }
        else customPhoneError.textContent = '';
        if (!customConsentCheckbox.checked) { customConsentError.textContent = 'Необходимо согласие'; isValid = false; }
        else customConsentError.textContent = '';
        return isValid;
    }

    async function submitForm(data, formElement) {
        const formData = new FormData();
        for (let [key, value] of Object.entries(data)) {
            formData.append(key, value);
        }
        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Ошибка отправки');
        }
        return response.json();
    }

    function enableSubmitButton() {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
    function disableSubmitButton() {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
    }
    function enableCustomSubmitButton() {
        customSubmitBtn.disabled = false;
        customBtnText.style.display = 'inline';
        customSpinner.style.display = 'none';
    }
    function disableCustomSubmitButton() {
        customSubmitBtn.disabled = true;
        customBtnText.style.display = 'none';
        customSpinner.style.display = 'inline-block';
    }

    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateForm()) return;
        const formData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            comment: commentInput.value.trim(),
            product: productNameInput.value,
            consent: consentCheckbox.checked ? 'on' : 'off',
            form_type: 'catalog'
        };
        disableSubmitButton();
        modalMessage.textContent = '';
        try {
            await submitForm(formData, orderForm);
            orderForm.style.display = 'none';
            modalMessage.textContent = 'Спасибо, заявка отправлена!';
            setTimeout(() => { closeModal(); orderForm.style.display = 'block'; }, 2000);
        } catch (error) {
            modalMessage.textContent = 'Ошибка: ' + error.message;
            enableSubmitButton();
        }
    });

    customOrderForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!validateCustomForm()) return;
        const formData = {
            name: customNameInput.value.trim(),
            phone: customPhoneInput.value.trim(),
            comment: customCommentInput.value.trim(),
            consent: customConsentCheckbox.checked ? 'on' : 'off',
            form_type: 'custom'
        };
        disableCustomSubmitButton();
        customModalMessage.textContent = '';
        try {
            await submitForm(formData, customOrderForm);
            customOrderForm.style.display = 'none';
            customModalMessage.textContent = 'Спасибо, заявка отправлена!';
            setTimeout(() => { closeCustomModal(); customOrderForm.style.display = 'block'; }, 2000);
        } catch (error) {
            customModalMessage.textContent = 'Ошибка: ' + error.message;
            enableCustomSubmitButton();
        }
    });

    modalOverlay.addEventListener('transitionend', function() {
        if (!modalOverlay.classList.contains('active')) {
            orderForm.style.display = 'block';
            enableSubmitButton();
        }
    });
    customModalOverlay.addEventListener('transitionend', function() {
        if (!customModalOverlay.classList.contains('active')) {
            customOrderForm.style.display = 'block';
            enableCustomSubmitButton();
        }
    });

    // ========== НОВЫЙ КОД: МОДАЛЬНОЕ ОКНО ДЛЯ УВЕЛИЧЕНИЯ ИЗОБРАЖЕНИЯ ==========
    const imageModalOverlay = document.getElementById('imageModalOverlay');
    const imageModalClose = document.getElementById('imageModalClose');
    const fullImage = document.getElementById('fullImage');

    function openImageModal(imageSrc) {
        fullImage.src = imageSrc;
        imageModalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeImageModal() {
        imageModalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        fullImage.src = '';
    }

    if (imageModalClose) {
        imageModalClose.addEventListener('click', closeImageModal);
    }
    if (imageModalOverlay) {
        imageModalOverlay.addEventListener('click', function(e) {
            if (e.target === imageModalOverlay) closeImageModal();
        });
    }

    // Обработчик клика на изображения в карточках
    document.querySelectorAll('.product-card__image img').forEach(img => {
        img.addEventListener('click', function(e) {
            e.stopPropagation();
            const src = this.getAttribute('src');
            if (src) openImageModal(src);
        });
    });
});