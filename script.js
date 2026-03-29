// script.js

document.addEventListener('DOMContentLoaded', function() {
    // Текущий год в футере
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Элементы модального окна
    const modalOverlay = document.getElementById('modalOverlay');
    const modalClose = document.getElementById('modalClose');
    const orderForm = document.getElementById('orderForm');
    const productNameInput = document.getElementById('productNameInput');
    const modalMessage = document.getElementById('modalMessage');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const spinner = submitBtn.querySelector('.spinner');

    // Поля формы
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const commentInput = document.getElementById('comment');
    const consentCheckbox = document.getElementById('consent');

    // Ошибки
    const nameError = document.getElementById('nameError');
    const phoneError = document.getElementById('phoneError');
    const consentError = document.getElementById('consentError');

    // Formspree endpoint
    const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjgaplgz';

    // --- Строгая маска ввода телефона ---
    function setPhoneMask(value) {
        // Удаляем все нецифровые символы
        let digits = value.replace(/\D/g, '');
        
        // Если первая цифра не 7 или 8, добавляем 7 (для российского формата)
        if (digits.length > 0) {
            if (digits[0] === '8') digits = '7' + digits.slice(1);
            else if (digits[0] !== '7') digits = '7' + digits;
        }
        
        // Ограничиваем до 11 цифр (7 + 10)
        if (digits.length > 11) digits = digits.slice(0, 11);
        
        // Форматируем: +7 (XXX) XXX-XX-XX
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

    // Обработчик ввода с поддержкой позиции курсора
    phoneInput.addEventListener('input', function(e) {
        const cursorPos = e.target.selectionStart;
        const oldValue = e.target.value;
        const newValue = setPhoneMask(oldValue);
        
        if (oldValue !== newValue) {
            e.target.value = newValue;
            
            // Корректировка позиции курсора после форматирования
            // (упрощённо: стараемся сохранить позицию относительно цифр)
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

    // При потере фокуса можно проверить полное соответствие маски
    phoneInput.addEventListener('blur', function() {
        const digits = phoneInput.value.replace(/\D/g, '');
        if (digits.length === 11 && digits[0] === '7') {
            // Дополнительно форматируем на случай, если ввели недостаточно символов
            phoneInput.value = setPhoneMask(phoneInput.value);
        }
    });

    // Открытие модального окна при клике на кнопку "Заказать"
    document.querySelectorAll('.product-card__btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.product-card');
            const titleElem = card.querySelector('.product-card__title');
            const productTitle = titleElem ? titleElem.textContent.trim() : 'Товар';
            
            productNameInput.value = productTitle;
            
            resetForm();
            
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Закрытие модального окна
    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        resetForm();
        enableSubmitButton();
    }

    function resetForm() {
        orderForm.reset();
        nameError.textContent = '';
        phoneError.textContent = '';
        consentError.textContent = '';
        modalMessage.textContent = '';
        // Специально не очищаем телефон, т.к. reset справляется
    }

    function disableSubmitButton() {
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
    }

    function enableSubmitButton() {
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }

    modalClose.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Валидация формы (строгая)
    function validateForm() {
        let isValid = true;

        // Имя
        if (!nameInput.value.trim()) {
            nameError.textContent = 'Введите имя';
            isValid = false;
        } else {
            nameError.textContent = '';
        }

        // Телефон: проверка, что после +7 ровно 10 цифр и маска соблюдена
        const phoneDigits = phoneInput.value.replace(/\D/g, '');
        if (phoneDigits.length !== 11 || phoneDigits[0] !== '7') {
            phoneError.textContent = 'Введите корректный номер: +7 (XXX) XXX-XX-XX';
            isValid = false;
        } else {
            phoneError.textContent = '';
        }

        // Чекбокс
        if (!consentCheckbox.checked) {
            consentError.textContent = 'Необходимо согласие на обработку данных';
            isValid = false;
        } else {
            consentError.textContent = '';
        }

        return isValid;
    }

    // Отправка на Formspree
    async function submitForm(data) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('phone', data.phone);
        formData.append('comment', data.comment);
        formData.append('product', data.product);
        formData.append('consent', data.consent ? 'on' : 'off');

        const response = await fetch(FORMSPREE_ENDPOINT, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Ошибка отправки');
        }

        return response.json();
    }

    // Обработка отправки
    orderForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const formData = {
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            comment: commentInput.value.trim(),
            product: productNameInput.value,
            consent: consentCheckbox.checked
        };

        disableSubmitButton();
        modalMessage.textContent = '';

        try {
            await submitForm(formData);

            orderForm.style.display = 'none';
            modalMessage.textContent = 'Спасибо, заявка отправлена!';

            setTimeout(() => {
                closeModal();
                orderForm.style.display = 'block';
            }, 2000);

        } catch (error) {
            modalMessage.textContent = 'Ошибка: ' + error.message;
            enableSubmitButton();
        }
    });

    // При закрытии модалки возвращаем форму
    modalOverlay.addEventListener('transitionend', function() {
        if (!modalOverlay.classList.contains('active')) {
            orderForm.style.display = 'block';
            enableSubmitButton();
        }
    });
// Переключение фотографий в карточках товаров (с двумя кнопками)
document.querySelectorAll('.product-card__slider').forEach(slider => {
    const container = slider.querySelector('.slider-container');
    const images = container.querySelectorAll('.slider-img');
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
    prevBtn.addEventListener('click', () => {
        current = (current - 1 + images.length) % images.length;
        showImage(current);
    });
    nextBtn.addEventListener('click', () => {
        current = (current + 1) % images.length;
        showImage(current);
    });
});
});