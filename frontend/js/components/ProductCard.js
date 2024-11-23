export class ProductCard extends HTMLElement {
    handleEvent(event) {
        if (event.type === "click" && (event.target === this.name || event.target === this.img))
            this.redirectToProductLink()
        else if (event.type === "click" && event.target === this.btnAddToCart)
            this.addToCart()
        else if (event.type === "click" && event.target === this.btnRemoveToCart)
            this.removeToCart()
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
                    height: 380px;

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
                    height: 175px;
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
                    max-height: 50px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 2;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                    font-weight: 400;

                    cursor: pointer;
                }
                .product__info--name:hover > ::slotted(h4) {
                    text-decoration: underline;
                    max-height: 75px;
                    display: -webkit-box;        /* Requerido para usar el truncado multilineal */
                    -webkit-line-clamp: 3;       /* Número de líneas visibles */
                    -webkit-box-orient: vertical; /* Orientación en bloque */
                    overflow: hidden;
                }
                .product__info--price {
                    font-size: 18px;
                    font-weight: 500;
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
                    <slot name="price"></slot>
                </div>
            </div>
            <div class="product__cart">
                <button type="button" class="" id="btn-add-to-cart">Agregar al carrito</button>
                <button type="button" class="" id="btn-delete-to-cart">Eliminar del carrito</button>
            </div>
            
        `
        
        this.link = this.getAttribute('href')
        
        this.name = this.querySelector('h4')
        this.price = this.querySelector('p')
        this.img = this.querySelector('img[slot=img_product]')
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
    }
}

customElements.define("product-card", ProductCard);