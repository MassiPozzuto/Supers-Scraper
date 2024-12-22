import { reformatPrices } from '../main.js'

export class ProductCard extends HTMLElement {
    handleEvent(event) {
        if (event.type === "click" && (event.target === this.name || event.target === this.img))
            this.redirectToProductLink()
        else if (event.type === "click" && event.target === this.btnAddToCart)
            this.addToCart()
        else if (event.type === "click" && event.target === this.btnRemoveToCart)
            this.removeToCart()
        else if (event.type === "click" && event.currentTarget.classList.contains('btn__offer-restricted'))
            this.toggleOffer(event.currentTarget)
    }

    toggleOffer(btnOffer) {
        const index = parseInt(btnOffer.dataset.index)
        const isActive = this.activeRestrictedOffers.get(index) || false

        this.activeRestrictedOffers.set(index, !isActive)
        btnOffer.classList.toggle('deactivated')
        this.updatePrice()
    }

    updatePrice() {
        let finalPrice = this.priceRegular
        let isCU = false

        this.offers.forEach((offer, index) => {
            if (this.activeRestrictedOffers.get(index) !== false) {
                const offerPrice = offer.price
                if (offerPrice < finalPrice) {
                    finalPrice = offerPrice // Precio más bajo
                    
                    if (offer.text) isCU = true
                }

            }
        });

        if (finalPrice == this.priceRegular) this.price.style.display = 'none'
        else this.price.style.display = 'flex'
        
        if (isCU) this.offerSimbolCU.classList.add('active')
        else this.offerSimbolCU.classList.remove('active')
        
        this.offerPrice.innerHTML = `$${reformatPrices(finalPrice)}`
        this.offerPrice.setAttribute('aria-value', finalPrice.toString())
    }

    redirectToProductLink() {
        window.open(this.link)
    }

    addToCart() {
        let price = this.price.getAttribute('aria-value')
        if (!isNaN(price)) {
            this.btnAddToCart.classList.add('deactive')
            this.btnRemoveToCart.classList.add('active')

            const addToCartEvent = new CustomEvent("product:add-to-cart", {
                detail: {
                    id: this.#id,
                    name: this.name.title,
                    price: parseFloat(price),
                    imgProduct: this.img.getAttribute('src'),
                    imgSupermarket: this.querySelector('img[slot=img_supermarket]').getAttribute('src'),
                    offers: this.offers,
                    link: this.link,
                    amount: 1
                },
                bubbles: true,
                composed: true
            })
            this.dispatchEvent(addToCartEvent)
        }
    }

    removeToCart() {
        // Agregar al carrito y al local storage
        this.btnAddToCart.classList.remove('deactive')
        this.btnRemoveToCart.classList.remove('active')

        const removeToCartEvent = new CustomEvent("product:remove-to-cart-by-main", {
            detail: {
                id: this.#id
            },
            bubbles: true,
            composed: true
        })
        this.dispatchEvent(removeToCartEvent)
    }

    #id
    getId() {
        return this.#id
    }

    constructor(id) {
        // Hacer sólo las tareas más prioritarias y ligeras.
        super()
        this.attachShadow({ mode: "open" })
        this.#id = id

        this.activeRestrictedOffers = new Map();
    }

    connectedCallback() {
        // Se ejecuta cuando el elemento es insertado al DOM
        this.shadowRoot.innerHTML = /* html */`
            <style>
                * {
                    font-family: "Host Grotesk", sans-serif;
                }
                :host {
                    display: flex;
                    flex-direction: column;

                    width: 250px;
                    height: 388px;

                    border: 1px solid #eee;
                    border-radius: 20px;
                    overflow: hidden;
                }
                .product__img {
                    padding: 16px;
                    border-bottom: 1px solid #eee;
                    position: relative;
                }
                .product__img > ::slotted(img) {
                    width: 100%;
                    height: 150px;
                    object-fit: contain;

                    cursor: pointer;
                }
                .product__supermarket--logo > ::slotted(img) {
                    max-width: 50px;
                    max-height: 50px;
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    object-fit: contain;
                }
                .product__info {
                    padding: 16px;
                    height: 100%;

                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .product__info--name ::slotted(h4) {
                    font-size: 14px;
                    max-height: 36px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 2;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                    font-weight: 400;

                    cursor: pointer;
                }
                .product__info--name:hover > ::slotted(h4) {
                    text-decoration: underline;
                    max-height: 54px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 3;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                }
                .product__info--price {
                    font-size: 18px;
                    font-weight: 500;
                }
                    .product__info--price .prices {
                        display: flex;
                        flex-direction: column;
                        height: 42px;
                    }
                    .product__info--price.on-sale {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }
                    .container__offers > *{
                        width: fit-content;
                        font-weight: 400;
                        font-size: 13px;
                        padding: 3px 10px !important;
                        border: 1px solid transparent;
                        border-radius: 1rem;
                        background: red;
                        color: white;
                    }
                    .container__offers {
                        display: flex;
                        align-items: center;
                        gap: 10px;

                        overflow-x: scroll;
                        white-space: nowrap;
                        scrollbar-width: none;
                        user-select:none;
                    }
                    .container__offers > button {
                        display: flex;
                        align-items: center;
                        gap: 3px;

                        cursor: pointer;
                        outline: none;
                    }
                    .container__offers button.deactivated {
                        border-color: red;
                        background: white;
                        color: red;
                    }
                    .container__offers button > svg {
                        width: 17px;
                        height: 17px;
                    }
                    .product__info--price.on-sale ::slotted(span.span-old-price) {
                        color: gray;
                        font-size: 14px;
                        text-decoration: line-through;
                    }

                    .prices div {
                        display: flex;
                        gap: 3px;
                    }
                    .prices-c-u {
                        display: inline-block;
                        font-size: 12px;
                    }
                #btn-add-to-cart, #btn-delete-to-cart {
                    display: inline-block;
                    width: 100%;
                    outline: none;
                    border: none;
                    padding: 8px;
                    font-size: 14px;
                    background: #f7a235;
                    color: white;
                    font-weight: 500;
                    cursor: pointer;
                }
                #btn-delete-to-cart {
                    display: none;
                    background: #d81111;
                }
                #btn-delete-to-cart.active {
                    display: inline-block;
                }
                #btn-add-to-cart.deactive{
                    display: none;
                }
            </style>
            <div class="product__img">
                <slot name="img_product"></slot>

                <div class="product__supermarket--logo">
                    <slot name="img_supermarket"></slot>
                </div>
            </div>

            <div class="product__info">
                <div class="product__info--name">
                    <slot name="name"></slot>
                </div>
                <div class="product__info--price">
                    <div class="prices">
                        <slot name="price"></slot>
                    </div>
                </div>
            </div>
            <div class="product__cart">
                <button type="button" class="" id="btn-add-to-cart">Agregar al carrito</button>
                <button type="button" class="" id="btn-delete-to-cart">Eliminar del carrito</button>
            </div>
        `
        
        this.link = this.getAttribute('href')
        this.name = this.querySelector('h4')
        this.img = this.querySelector('img[slot=img_product]')
        this.price = this.querySelector('span[slot=price]')
        this.priceRegular = parseFloat(this.price.getAttribute('aria-value'))

        if (this.offers) {
            const containerPrice = this.shadowRoot.querySelector('.product__info--price')
            containerPrice.classList.add('on-sale')
            let offerHTML = /* html*/`
                <div class="container__offers">
            `

            let rareOffer = false
            this.offers.forEach((offer, index) => {
                rareOffer = offer.text != null
                const offerText = (rareOffer) ? offer.text : `-${Math.round(100 - (offer.price * 100 / this.priceRegular))}%`


                if (offer.is_restricted) {
                    this.activeRestrictedOffers.set(index, true)
                    offerHTML += /* html */ `
                        <button type="button" data-value="${offer.price}" data-index="${index}" title="Solo para: ${offer.is_restricted}" class="btn__offer-restricted">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-alert-circle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>

                            <span>${offerText}</span>
                        </button>
                    `
                } else {
                    offerHTML += /* html */ `<span aria-value="${offer.price}" >${offerText}</span>`
                }
            });
            
            offerHTML += /* html */`
                </div>
                <div class="prices">
                    <div>
                        <span id="default-offer-price" aria-value="" ></span>
                        <span class="prices-c-u">c/u</span>
                    </div>
                    <slot name="price" class="span-old-price"></slot>
                </div>
            `
            containerPrice.innerHTML = offerHTML

            this.btnsOfferRestricted = this.shadowRoot.querySelectorAll('.btn__offer-restricted')
            this.btnsOfferRestricted.forEach((btnOfferRestricted) => {
                btnOfferRestricted.addEventListener("click", this)
            })

            this.offerPrice = this.shadowRoot.querySelector('#default-offer-price')
            this.offerSimbolCU = this.shadowRoot.querySelector('.prices-c-u')

            this.offersContainer = this.shadowRoot.querySelector(".container__offers")
            this.checkOverflow = this.offersContainer.scrollWidth > this.offersContainer.clientWidth;
            this.enableDragScroll()

            this.updatePrice()
        }
        
        this.btnRemoveToCart = this.shadowRoot.querySelector('#btn-delete-to-cart')
        this.btnAddToCart = this.shadowRoot.querySelector('#btn-add-to-cart')

        this.name.addEventListener("click", this)
        this.img.addEventListener("click", this)
        this.btnAddToCart.addEventListener("click", this)
        this.btnRemoveToCart.addEventListener("click", this)
    }

    disconnectedCallback() {
        this.name.removeEventListener("click", this);
        this.img.removeEventListener("click", this);
        this.btnAddToCart.removeEventListener("click", this)
        this.btnRemoveToCart.removeEventListener("click", this)

        if (this.btnsOfferRestricted) {
            this.btnsOfferRestricted.forEach((btnOfferRestricted) => {
                btnOfferRestricted.removeEventListener("click", this)
            })
        }
    }


    // Scroll con clic y arrastre
    enableDragScroll() {
        let isDragging = false
        let startX, scrollLeft

        this.offersContainer.addEventListener("mousedown", (e) => {
            if (!this.checkOverflow) return
            isDragging = true
            startX = e.pageX - this.offersContainer.offsetLeft
            scrollLeft = this.offersContainer.scrollLeft
            this.offersContainer.style.cursor = "grabbing"
        })

        window.addEventListener("mousemove", (e) => {
            if (!isDragging) return
            e.preventDefault()
            const x = e.pageX - this.offersContainer.offsetLeft
            const walk = x - startX // Distancia arrastrada
            this.offersContainer.scrollLeft = scrollLeft - walk
        })

        window.addEventListener("mouseup", () => {
            if (!isDragging) return
            isDragging = false
            this.offersContainer.style.cursor = "grab"
        })
    }
}

customElements.define("product-card", ProductCard)