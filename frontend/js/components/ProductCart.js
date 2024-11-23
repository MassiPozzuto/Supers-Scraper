const localStorage = window.localStorage
//localStorage.clear()

export class ProductCart extends HTMLElement {
    handleEvent(event) {
        if (event.type === "click" && (event.target === this.name || event.target === this.img))
            this.redirectToProductLink()
        else if (event.type === "click" && event.currentTarget === this.btnPlus)
            this.sumProduct()
        else if (event.type === "click" && event.currentTarget === this.btnMinus)
            this.substractProduct()
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

            const removeToCartByCartEvent = new CustomEvent("product:sum-product-in-cart", {
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
    }

    connectedCallback() {
        // Se ejecuta cuando el elemento es insertado al DOM
        this.shadowRoot.innerHTML = /* html */`
            <style>
                :host {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    width: 480px;
                    max-width: 100%;
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
                    max-height: 50px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 2;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                    font-weight: 400;

                    cursor: pointer;
                }
                .cart__product--name-price:hover > ::slotted(h4) {
                    text-decoration: underline;
                    max-height: 75px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 3;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                }
                .cart__product--name-price ::slotted(p) {
                    font-size: 18px;
                    font-weight: 500;
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
            </style>
            <slot name="img_supermarket" class="product__supermarket--logo"></slot>
            <div class="cart__product--info">
                <slot name="img_product"></slot>
                <div class="cart__product--name-price">
                    <slot name="name"></slot>
                    <slot name="price"></slot>
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
}

customElements.define("product-cart", ProductCart);