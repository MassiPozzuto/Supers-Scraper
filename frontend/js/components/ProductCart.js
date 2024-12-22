import { reformatPrices } from '../main.js'

const localStorage = window.localStorage

export class ProductCart extends HTMLElement {
    handleEvent(event) {
        if (event.type === "click" && (event.target === this.name || event.target === this.img))
            this.redirectToProductLink()
        else if (event.type === "click" && event.currentTarget === this.btnPlus)
            this.sumProduct()
        else if (event.type === "click" && event.currentTarget === this.btnMinus)
            this.substractProduct()
        else if (event.type === "click" && event.currentTarget.classList.contains('btn__offer-restricted'))
            this.toggleOffer(event.currentTarget)
    }

    redirectToProductLink() {
        window.open(this.link)
    }

    sumProduct() {
        if (this.amount < 99) {
            this.amount = this.amount + 1
            this.spanAmount.innerText = this.amount

            const productStoraged = JSON.parse(localStorage.getItem(this.#id))
            productStoraged.amount = this.amount
            localStorage.setItem(this.#id, JSON.stringify(productStoraged))

            const removeToCartByCartEvent = new CustomEvent("product:update-total-price-cart", {
                detail: {},
                bubbles: true,
                composed: true
            })
            this.dispatchEvent(removeToCartByCartEvent)
        } else {
            console.log("Límite de 99 productos")
        }
    }

    substractProduct() {
        if (this.amount > 1) {
            this.amount = this.amount - 1
            this.spanAmount.innerText = this.amount

            const productStoraged = JSON.parse(localStorage.getItem(this.#id))
            productStoraged.amount = this.amount
            localStorage.setItem(this.#id, JSON.stringify(productStoraged))
            const substractToCartByCartEvent = new CustomEvent("product:substract-product-in-cart", {
                detail: {},
                bubbles: true,
                composed: true
            })
            this.dispatchEvent(substractToCartByCartEvent)
        } else {

            localStorage.removeItem(this.#id)
            const removeToCartByCartEvent = new CustomEvent("product:substract-product-in-cart", {
                detail: {
                    id: this.#id
                },
                bubbles: true,
                composed: true
            })
            this.dispatchEvent(removeToCartByCartEvent)
            this.remove()
        }
    }

    toggleOffer(btnOffer) {
        const id = parseInt(btnOffer.dataset.id)
        const isActive = this.activeRestrictedOffers.get(id) || false

        this.activeRestrictedOffers.set(id, !isActive)
        btnOffer.classList.toggle('deactivated')
        this.updatePrice()

        const updateTotalPriceCart = new CustomEvent("product:update-total-price-cart", {
            detail: {},
            bubbles: true,
            composed: true
        })
        this.dispatchEvent(updateTotalPriceCart)
    }

    updatePrice() {
        let finalPrice = this.priceRegular
        let isCU = false

        this.offers.forEach(offer => {
            if (this.activeRestrictedOffers.get(offer.id) !== false) {
                if (offer.price < finalPrice) {
                    finalPrice = offer.price // Precio más bajo

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


    infoOfferPrices() {
        if (!this.offers) return []
        this.offers.sort((a, b) => a.price - b.price)

        let lastAmountOffer = 0
        const dataOffers = this.offers.map(offer => {
            const restictedIsActive = this.activeRestrictedOffers.get(offer.id) || false
            
            if (!restictedIsActive && offer.is_restricted) return false

            const regexImportantNumberOffer = /(\d+)((?!\d+)(?!%))/
            if (offer.text && offer.text.match(regexImportantNumberOffer)) {
                const matchText = offer.text.match(regexImportantNumberOffer)
                const number = parseInt(matchText[0])

                const amountNormalPrice = this.amount % number
                const amountOfferPrice = this.amount - amountNormalPrice

                if (amountOfferPrice > lastAmountOffer) {
                    lastAmountOffer = amountOfferPrice

                    return {
                        amount: amountOfferPrice,
                        price: offer.price
                    }
                } else {
                    return false
                }
            }

            if (this.amount > lastAmountOffer) {
                lastAmountOffer = this.amount
                return {
                    amount: this.amount,
                    price: offer.price
                }
            } else {
                return false
            }
        })

        return dataOffers.filter(offer => offer)
    }
    
    #id
    getId() {
        return this.#id
    }

    constructor(id, amount = 1) {
        // Hacer sólo las tareas más prioritarias y ligeras.
        if (amount < 1) {
            throw new Error('La cantidad debe ser mayor o igual a uno')
        }
        super()
        this.attachShadow({ mode: "open" })

        this.#id = id
        this.amount = amount
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
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    min-height: 148px;
                    width: 480px;
                    max-width: 100vw;
                    padding: 16px !important;
                    border-bottom: 1px solid #ddd;

                    position: relative;
                }
                .cart__product--info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    position: relative;
                }
                .cart__product--info ::slotted(img) {
                    width: 80px;
                    cursor: pointer;
                }
                .cart__product--name-price {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    /*justify-content: space-around;*/
                    gap: 8px;
                }
                .cart__product--name-price ::slotted(h4) {
                    font-size: 14px;
                    max-height: 54px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 3;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                    font-weight: 400;

                    cursor: pointer;
                }
                    .cart__product--name-price > ::slotted(h4:hover) {
                        text-decoration: underline;
                    }
                .prices span, .prices ::slotted(span) {
                    font-size: 18px;
                    font-weight: 500;
                }
                .prices .span-old-price::slotted(span) {
                    color: gray;
                    font-size: 14px;
                    text-decoration: line-through;
                }
                .cart__product--amount {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 5px;
                }
                .cart__product--amount button {
                    display: flex;
                    align-items: center;
                    outline: none;
                    border: none;
                    width: 18px;
                    height: 18px;
                    padding: 0 3px;
                    border-radius: 50%;

                    cursor: pointer;
                }

                .product__supermarket--logo::slotted(img) {
                    max-width: 50px;
                    max-height: 30px;
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    z-index: 30;
                    object-fit: contain;
                }



                .prices {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .prices .offer-price {
                    display: flex;
                    gap: 3px;
                }
                span.prices-c-u {
                    display: inline-block;
                    font-size: 12px;
                }

                .container__offers {
                    width: calc(100vw - 160px);
                    width: 280px;

                    display: flex;
                    align-items: center;
                    gap: 5px;

                    overflow-x: scroll;
                    white-space: nowrap;
                    scrollbar-width: none;
                    user-select:none;
                }
                .container__offers > .container__offers--item {
                    width: fit-content;
                    font-weight: 400;
                    font-size: 12px;
                    padding: 1px 8px !important;
                    border: 1px solid transparent;
                    border-radius: 1rem;
                    background: red;
                    color: white;
                }
                .container__offers > button.container__offers--item {
                    display: flex;
                    align-items: center;
                    gap: 3px;

                    cursor: pointer;
                    outline: none;
                }
                .container__offers button.container__offers--item.deactivated {
                    border-color: red;
                    background: white;
                    color: red;
                }
                .container__offers button.container__offers--item > svg {
                    width: 17px;
                    height: 17px;
                }

                @media (width < 435px) {
                    :host {
                        gap: 5px;
                    }
                    .cart__product--info ::slotted(img) {
                        width: 50px;
                    }
                    .cart__product--name-price ::slotted(h4) {
                        font-size: 12px;
                    }
                    .prices span, .prices ::slotted(span) {
                        font-size: 16px;
                    }
                    span.prices-c-u {
                        font-size: 10px;
                    }
                    .prices .span-old-price::slotted(span) {
                        font-size: 12px;
                    }
                    .cart__product--amount {
                        font-size: 12px;
                    }
                }
            </style>
            <slot name="img_supermarket" class="product__supermarket--logo"></slot>
            <div class="cart__product--info">
                <slot name="img_product"></slot>
                <div class="cart__product--name-price">
                    <slot name="name"></slot>

                    <div class="container__offers">
                    </div>

                    <div class="prices">
                        <slot name="price"></slot>
                    </div>
                </div>
            </div>
            <div class="cart__product--amount">
                <button type="button" id="cart__product--minus">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="icon icon-tabler icons-tabler-outline icon-tabler-minus">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M5 12l14 0" />
                    </svg>
                </button>
                <span>${this.amount}</span>
                <button type="button" id="cart__product--plus">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="icon icon-tabler icons-tabler-outline icon-tabler-plus">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M12 5l0 14" />
                        <path d="M5 12l14 0" />
                    </svg>
                </button>
            </div>`

        this.link = this.getAttribute('href')

        this.name = this.querySelector('h4')
        this.img = this.querySelector('img[slot=img_product]')
        this.price = this.querySelector('span[slot=price]')
        this.priceRegular = parseFloat(this.price.getAttribute('aria-value'))

        if (this.offers) {
            const containerPrices = this.shadowRoot.querySelector('.prices')
            const containerOfferItems = this.shadowRoot.querySelector('.container__offers')
            
            let offerItemsHTML = ''

            let rareOffer = false
            this.offers.forEach(offer => {
                rareOffer = offer.text != null
                const offerText = (rareOffer) ? offer.text : `-${Math.round(100 - (offer.price * 100 / this.priceRegular))}%`


                if (offer.is_restricted) {
                    this.activeRestrictedOffers.set(offer.id, true)
                    offerItemsHTML += /* html */ `
                        <button type="button" data-value="${offer.price}" data-id="${offer.id}" title="Solo para: ${offer.is_restricted}" class="container__offers--item btn__offer-restricted">
                            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-alert-circle"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>

                            <span>${offerText}</span>
                        </button>
                    `
                } else {
                    offerItemsHTML += /* html */ `<span class="container__offers--item" aria-value="${offer.price}" >${offerText}</span>`
                }
            });

            let offerPriceHTML = /* html */`
                <div class="prices">
                    <div class="offer-price">
                        <span id="default-offer-price" aria-value="" ></span>
                        <span class="prices-c-u">c/u</span>
                    </div>
                    <slot name="price" class="span-old-price"></slot>
                </div>
            `
            containerOfferItems.innerHTML = offerItemsHTML
            containerPrices.innerHTML = offerPriceHTML

            this.btnsOfferRestricted = this.shadowRoot.querySelectorAll('.btn__offer-restricted')
            this.btnsOfferRestricted.forEach((btnOfferRestricted) => {
                btnOfferRestricted.addEventListener("click", this)
            })

            this.offerPrice = this.shadowRoot.querySelector('#default-offer-price')
            this.offerSimbolCU = this.shadowRoot.querySelector('.prices-c-u')

            this.offersContainer = this.shadowRoot.querySelector(".container__offers")
            this.enableDragScroll()

            this.updatePrice()
        }
            

        this.btnMinus = this.shadowRoot.querySelector('#cart__product--minus')
        this.btnPlus = this.shadowRoot.querySelector('#cart__product--plus')
        this.spanAmount = this.shadowRoot.querySelector('.cart__product--amount span')

        this.name.addEventListener("click", this)
        this.img.addEventListener("click", this)
        this.btnMinus.addEventListener("click", this)
        this.btnPlus.addEventListener("click", this)
    }

    disconnectedCallback() {
        this.name.removeEventListener("click", this)
        this.img.removeEventListener("click", this)
        this.btnMinus.removeEventListener("click", this);
        this.btnPlus.removeEventListener("click", this);
    }


    // Scroll con clic y arrastre
    enableDragScroll() {
        let isDragging = false
        let startX, scrollLeft

        this.offersContainer.addEventListener("mousedown", (e) => {
            if (!this.offersContainer.scrollWidth > this.offersContainer.clientWidth) return
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

customElements.define("product-cart", ProductCart);