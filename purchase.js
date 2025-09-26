// JavaScript for the purchase page (comprar.html)

document.addEventListener('DOMContentLoaded', function () {
    "use strict";

    // -------- STATE --------
    const state = {
        selectedVariant: 'verde',
        selectedSize: '50',
        paymentMethod: 'unica',
        quantity: 1
    };

    // -------- DATA --------
    const sizes = {
        '25': { name: '25 Cápsulas', price: 89.90 },
        '50': { name: '50 Cápsulas', price: 159.90 },
        '100': { name: '100 Cápsulas', price: 289.90 }
    };

    const variants = {
        verde: { name: 'Verde Original', colors: { primary: '#2dd36d', accent: '#5cfec2' } },
        azul: { name: 'Azul Intenso', colors: { primary: '#29aae1', accent: '#00ffff' } },
        eco: { name: 'Eco Plus', colors: { primary: '#2dd36d', accent: '#5cfec2' } }
    };

    // -------- DOM --------
    const variantButtons = document.querySelectorAll('.variant-btn');
    const sizeButtons = document.querySelectorAll('.size-btn');
    const paymentButtons = document.querySelectorAll('.payment-btn');
    const thumbnailButtons = document.querySelectorAll('.thumbnail-btn');
    const mainImage = document.getElementById('main-product-image');
    const quantityDisplay = document.getElementById('quantity');
    const decreaseBtn = document.getElementById('decrease-qty');
    const increaseBtn = document.getElementById('increase-qty');
    const singlePriceEl = document.getElementById('single-price');
    const subscriptionPriceEl = document.getElementById('subscription-price');
    const cartPriceEl = document.getElementById('cart-price');

    const verdeGallery = document.getElementById('verde-gallery');
    const azulGallery = document.getElementById('azul-gallery');

    const fmt = (n) => {
        const v = Number(n || 0);
        return v.toFixed(2).replace('.', ',');
    };

    // -------- THEME --------
    function updateThemeColors(variantId) {
        const root = document.documentElement;
        const colors = variants[variantId]?.colors || variants.verde.colors;
        root.style.setProperty('--primary', colors.primary);
        root.style.setProperty('--accent', colors.accent);
        root.style.setProperty('--ring', colors.primary);
    }

    // -------- GALLERY + MAIN IMAGE --------
    function updateGalleryForVariant(variantId) {
        // Esconde ambas
        verdeGallery.classList.add('hidden');
        azulGallery.classList.add('hidden');

        // Mostra a certa
        const galleryToShow = (variantId === 'azul') ? azulGallery : verdeGallery;
        galleryToShow.classList.remove('hidden');

        // Primeira thumb visível define a imagem principal
        const firstThumb = galleryToShow.querySelector('.thumbnail-btn');
        if (firstThumb) {
            setMainImage(firstThumb.dataset.image);
            // Reset "active" das thumbs
            document.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active'));
            firstThumb.classList.add('active');
        }
    }

    function setMainImage(src) {
        if (!mainImage || !src) return;
        mainImage.src = src;
    }

    // -------- PRICES --------
    function updatePrices() {
        const currentPrice = sizes[state.selectedSize].price;
        const subscriptionPrice = currentPrice * 0.85;

        if (singlePriceEl) {
            singlePriceEl.textContent = (window.sopyUtils?.formatPrice)
                ? window.sopyUtils.formatPrice(currentPrice)
                : fmt(currentPrice);
        }
        if (subscriptionPriceEl) {
            subscriptionPriceEl.textContent = (window.sopyUtils?.formatPrice)
                ? window.sopyUtils.formatPrice(subscriptionPrice)
                : fmt(subscriptionPrice);
        }
        updateCartButton();
    }

    function updateCartButton() {
        if (!cartPriceEl) return;
        const base = sizes[state.selectedSize].price;
        const perUnit = state.paymentMethod === 'assinatura' ? base * 0.85 : base;
        const total = perUnit * state.quantity;

        cartPriceEl.textContent = (window.sopyUtils?.formatPrice)
            ? window.sopyUtils.formatPrice(total)
            : fmt(total);
    }

    // -------- HANDLERS --------
    function handleVariantSelection(variantId) {
        state.selectedVariant = variantId;

        // visual dos botões (usa .variant-circle.active do seu CSS)
        variantButtons.forEach(b => {
            b.classList.toggle('active', b.dataset.variant === variantId);
        });

        // body class para estilos condicionais (ex.: cores dos botões +/-)
        document.body.classList.remove('verde-selected', 'azul-selected', 'eco-selected');
        document.body.classList.add(`${variantId}-selected`);

        updateThemeColors(variantId);
        updateGalleryForVariant(variantId);
    }

    function handleSizeSelection(sizeId) {
        state.selectedSize = sizeId;
        sizeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === sizeId);
        });
        updatePrices();
    }

    function handlePaymentSelection(method) {
        state.paymentMethod = method;
        paymentButtons.forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.payment === method);
        });
        updateCartButton();
    }

    function handleThumbnailClick(btn) {
        // só muda visual e imagem
        document.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        setMainImage(btn.dataset.image);
    }

    function updateQuantity(change) {
        const newQ = state.quantity + change;
        if (newQ < 1) return;
        state.quantity = newQ;
        quantityDisplay.textContent = state.quantity;
        updateCartButton();
    }

    // -------- ACCORDION --------
    function initAccordion() {
        const triggers = document.querySelectorAll('.accordion-trigger');

        // inicia fechados
        triggers.forEach(t => {
            const content = t.nextElementSibling;
            const icon = t.querySelector('svg');
            if (content?.classList.contains('accordion-content')) {
                content.classList.add('hidden');
                if (icon) icon.style.transform = 'rotate(0deg)';
                t.setAttribute('aria-expanded', 'false');
            }
        });

        // toggle
        triggers.forEach(trigger => {
            trigger.addEventListener('click', function () {
                const content = this.nextElementSibling;
                const icon = this.querySelector('svg');

                // fecha os outros
                triggers.forEach(other => {
                    if (other !== trigger) {
                        const oc = other.nextElementSibling;
                        const oi = other.querySelector('svg');
                        oc?.classList.add('hidden');
                        other.setAttribute('aria-expanded', 'false');
                        if (oi) oi.style.transform = 'rotate(0deg)';
                    }
                });

                // abre/fecha atual
                const isOpen = !content.classList.contains('hidden');
                if (isOpen) {
                    content.classList.add('hidden');
                    this.setAttribute('aria-expanded', 'false');
                    if (icon) icon.style.transform = 'rotate(0deg)';
                } else {
                    content.classList.remove('hidden');
                    this.setAttribute('aria-expanded', 'true');
                    if (icon) icon.style.transform = 'rotate(180deg)';
                }
            });
        });
    }

    // -------- LISTENERS --------
    variantButtons.forEach(btn => {
        btn.addEventListener('click', () => handleVariantSelection(btn.dataset.variant));
    });

    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => handleSizeSelection(btn.dataset.size));
    });

    paymentButtons.forEach(btn => {
        btn.addEventListener('click', () => handlePaymentSelection(btn.dataset.payment));
    });

    thumbnailButtons.forEach(btn => {
        btn.addEventListener('click', () => handleThumbnailClick(btn));
    });

    if (decreaseBtn) decreaseBtn.addEventListener('click', () => updateQuantity(-1));
    if (increaseBtn) increaseBtn.addEventListener('click', () => updateQuantity(1));

    // -------- INIT --------
    // estado inicial: cores, galeria e preços
    handleVariantSelection(state.selectedVariant);
    handleSizeSelection(state.selectedSize);
    handlePaymentSelection(state.paymentMethod);
    initAccordion();
    updatePrices();

    // -------- ADD TO CART (placeholder) --------
    const addToCartBtn = document.querySelector('.btn-primary');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => (this.style.transform = 'scale(1)'), 150);

            const base = sizes[state.selectedSize].price;
            const perUnit = state.paymentMethod === 'assinatura' ? base * 0.85 : base;
            const total = perUnit * state.quantity;

            alert(
                `Produto adicionado ao carrinho!\n\n` +
                `Variante: ${state.selectedVariant}\n` +
                `Quantidade: ${sizes[state.selectedSize].name}\n` +
                `Método: ${state.paymentMethod === 'unica' ? 'Compra única' : 'Assinatura'}\n` +
                `Qtd: ${state.quantity}\n` +
                `Total: R$ ${(window.sopyUtils?.formatPrice) ? window.sopyUtils.formatPrice(total) : fmt(total)}`
            );
        });
    }
});
