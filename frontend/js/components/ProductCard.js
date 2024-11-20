export class ProductCard extends HTMLElement {
    handleEvent(event) {
        if (event.type === "click" && (event.target === this.name || event.target === this.img))
            this.redirectToProductLink();
    }

    redirectToProductLink() {
        window.open(this.link)
    }

    constructor() {
        // Hacer sólo las tareas más prioritarias y ligeras.
        super()
        this.attachShadow({ mode: "open" })
    }

    connectedCallback() {
        // Se ejecuta cuando el elemento es insertado al DOM
        this.shadowRoot.innerHTML = /* html */`
            <style>
                :host {
                    display: flex;
                    flex-direction: column;

                    width: 250px;
                    height: 350px;

                    border: 1px solid #eee;
                    border-radius: 20px;
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
                .product__info--name:hover {
                    text-decoration: underline;
                }
                .product__info--price {
                    font-size: 18px;
                    font-weight: 500;
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
            </div>`
        
        this.link = this.getAttribute('href')
        
        this.name = this.querySelector('h4')
        this.img = this.querySelector('img[slot=img_product]')

        this.name.addEventListener("click", this)
        this.img.addEventListener("click", this)
    }

    disconnectedCallback() {
        this.name.removeEventListener("click", this);
        this.img.removeEventListener("click", this);
    }
}

customElements.define("product-card", ProductCard);