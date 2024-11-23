import { ProductCard } from './components/ProductCard.js'
import { ProductCart } from './components/ProductCart.js'

const url = window.location.search
const urlParams = new URLSearchParams(url)
const localStorage = window.localStorage

// Parametro 'q'
const inputQuery = document.querySelector('input[name=q]')
let q = urlParams.get('q')
inputQuery.value = q

// Parametro 'order'
const orderSelect = document.querySelector('select[name=select-sort]')
const paramOrder = urlParams.get('order')
let order
if (paramOrder == "OrderByPriceDESC" || paramOrder == "OrderByNameASC" || paramOrder == "OrderByNameDESC") {
    order = paramOrder
    orderSelect.value = paramOrder
} else {
    order = "OrderByPriceASC"
    urlParams.set('order', order)
    window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)
}

// Parametro 'page'y saber si hay páginas previas
const paramPage = urlParams.get('page')
let page = (paramPage > 1 && !isNaN(paramPage)) ? parseInt(paramPage) : 1
let total_pages
const btnPreviousPages = document.querySelector('#btn-previous-products')
let hasPreviousPages = page > 1

// Container de productos de la búsqueda
const containerProducts = document.querySelector('.products')

// Carrito
const containerCartProducts = document.querySelector('.cart__products')
const cart = document.querySelector('.cart')
const btnOpenCart = document.querySelector('#btn-cart')
const btnCloseCart = document.querySelector('#btn-cart-close')
const spanCartTotalPrice = document.querySelector('#cart-total-price')


let isAtBottom = false
let isLastPage = false
document.addEventListener("DOMContentLoaded", async (event) => {
    
    const btnToTop = document.querySelector('#btn-to-top')
    btnToTop.addEventListener('click', (event) => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    supermarketsNames = await fetch('http://127.0.0.1:8000/supermarkets')
        .then(res => res.json())
        .then(data => data.map(supermarket => supermarket.name))
    typeEffect()


    if (hasPreviousPages) {
        let previousPage = page
        btnPreviousPages.parentNode.classList.add('active')
        btnPreviousPages.addEventListener('click', (event) => {
            if (previousPage > 0) {
                previousPage = previousPage - 1
                loadProducts(q, previousPage, order, true)
            }

            if (previousPage === 1) {
                hasPreviousPages = false
                btnPreviousPages.parentNode.classList.remove('active')
            }
        })
    }

    // Cambia el order de la busqueda
    orderSelect.addEventListener('change', (event) => {
        order = orderSelect.value
        urlParams.set('order', orderSelect.value)
        page = 1
        urlParams.set('page', 1)
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

        hasPreviousPages = false
        btnPreviousPages.parentNode.classList.remove('active')

        loadProducts(q, page, order)
    })

    // Realiza una busqueda nueva
    document.querySelector('form').addEventListener("submit", (event) => {
        event.preventDefault()

        if (inputQuery.value) {
            q = inputQuery.value
            urlParams.set('q', inputQuery.value)
            page = 1
            urlParams.set('page', 1)
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

            hasPreviousPages = false
            btnPreviousPages.parentNode.classList.remove('active')

            /* Hago isLastPage verdadero ya que al buscar nuevos productos, el containerProducts se limpia, por lo que, el usuario se encontrará en el final de la pagina y se 
            ejecutará la paginación. Entonces, al hacer parecer que ya se encuentra en la última página esto no sucede, pero si mantuviesemos dicha varaible en true, la paginación 
            ya no funcionaria, por eso dentro de loadProducts, si page != total_page, isLastPage se vuelve false */
            isLastPage = true
            loadProducts(inputQuery.value, page, order)
        }
    })


    // Paginacion "automatica" al llegar al final de la página
    window.addEventListener('scroll', function () {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;

        // Verificar si estamos cerca del final de la página
        if (scrollPosition >= documentHeight - 10 && !isAtBottom) {
            console.log('User en el final de la pagina')
            isAtBottom = true
            if (!isLastPage) {
                console.log("no deberia entrar")
                page += 1
                urlParams.set('page', page)
                window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

                loadProducts(q, page, order)
            }

        } else if (scrollPosition < documentHeight - 10) {
            // Resetear el flag si no estamos al final
            isAtBottom = false;
        }
    })

    
    btnOpenCart.addEventListener('click', (event) => {
        if (localStorage.length > 0) {
            btnOpenCart.style.display = "none" 
            cart.style.display = "flex" 
        } else {
            const htmlAlert = /*html*/ `
                <div class="container__alert">
                    <p class="msj">El carrito de compras esta vacio</p>
                </div>
            `
            document.body.insertAdjacentHTML('beforeEnd', htmlAlert)
            // Eliminarlo después de 2,5 segundos
            setTimeout(() => {
                const alertElement = document.querySelector('.container__alert');
                if (alertElement) {
                    alertElement.remove()
                }
            }, 2500);
        }
        calculateTheTotalPrice()
    })
    btnCloseCart.addEventListener('click', (event) => {
        btnOpenCart.style.display = "flex"
        cart.style.display = "none" 
    })
})

// Cargo los productos correspondientes
isLastPage = true
loadProducts(q, page, order)
loadPreviousCartProducts()


// Custom events para el carrito de compras
document.addEventListener('product:add-to-cart', (event) => {
    const product = event.detail
    addProductToCart(product)
})
document.addEventListener('product:remove-to-cart-by-main', (event) => {
    const product = event.detail
    
    const productsInTheCart = document.querySelectorAll('product-cart')
    productsInTheCart.forEach(productInTheCart => {
        if (productInTheCart.getId() == product.id) {
            localStorage.removeItem(product.id)
            productInTheCart.remove()
            calculateTheTotalPrice()

            if (localStorage.length == 0) {
                btnCloseCart.click()
            }
        }
    })
})
document.addEventListener('product:sum-product-in-cart', (event) => {
    calculateTheTotalPrice()
})
document.addEventListener('product:substract-product-in-cart', (event) => {
    const productInTheCart = event.detail

    if (productInTheCart.id) {
        const productsMain = [...document.querySelectorAll('product-card')]
        const productMatched = productsMain.find(product => product.getId() == productInTheCart.id)
        if (productMatched) {
            productMatched.btnAddToCart.classList.remove('deactive')
            productMatched.btnRemoveToCart.classList.remove('active')
        }
    }

    calculateTheTotalPrice(productInTheCart.id)
    
    if (localStorage.length == 0) {
        btnCloseCart.click()
    }
})

function calculateTheTotalPrice(ignoreId = null) {
    const productsInTheCart = document.querySelectorAll('product-cart')
    let totalPrice = 0
    productsInTheCart.forEach(product => {
        const productPrice = product.querySelector('p[slot="price"]').getAttribute('aria-value')

        if (!isNaN(productPrice) && ignoreId != product.getId()) {
            totalPrice += (parseFloat(productPrice) * product.amount)
        }
    })
    spanCartTotalPrice.innerText = `$${reformatPrices(totalPrice)}`
}


function loadPreviousCartProducts() {
    for (let i = 0; i < localStorage.length; i++){
        const productId = localStorage.key(i)
        const product = JSON.parse(localStorage.getItem(productId))
        product.id = productId
        addProductToCart(product)
    }
}


function addProductToCart(product) {
    if (!localStorage.getItem(product.id)) {
        localStorage.setItem(product.id, JSON.stringify({
            name: product.name,
            price: product.price,
            imgProduct: product.imgProduct,
            imgSupermarket: product.imgSupermarket,
            link: product.link,
            amount: product.amount
        }))
    }

    const productCart = new ProductCart(product.id, product.amount)
    productCart.innerHTML =  /* html */`
        <h4 slot="name" title="${product.name}">${product.name}</h4>
        <p slot="price" aria-value="${product.price}">$${reformatPrices(product.price)}</p>
        <img slot="img_product" src="${product.imgProduct}" alt="Imagen ilustrativa del producto" >
        <img slot="img_supermarket" src="${product.imgSupermarket}" alt="Logo del supermercado" >
    `
    productCart.setAttribute('href', product.link)

    containerCartProducts.insertAdjacentElement('beforeEnd', productCart)

    calculateTheTotalPrice()
}


async function loadProducts(query, page = 1, order = "OrderByPriceASC", isForAPreviousPage = false) {
    
    if (query) {
        if (page == 1 && !isForAPreviousPage) {
            containerProducts.innerHTML = ''
        }

        await fetch(`http://127.0.0.1:8000/search?q=${query}&page=${page}&order=${order}`)
            .then(res => res.json())
            .then(data => {
                console.log(data)
                const products = data[0]
                total_pages = data[2]

                document.querySelector('#amt-products-found').innerText = data[1]
                document.querySelector('.search__filters p').style.scale = 1
                document.querySelector('.search__filters p').style.width = 'auto'

                if (products.length > 0) {
                    if (isForAPreviousPage) products.reverse()
                    containerProducts.classList.remove('not__found')
                    
                    products.forEach(product => {
                        const productCard = new ProductCard(product.id)
                        productCard.innerHTML =  /* html */`
                            <h4 slot="name" title="${product.name}">${product.name}</h4>
                            <p slot="price" aria-value="${product.price}" >$${reformatPrices(product.price)}</p>
                            <img slot="img_product" src="${product.img_src}" alt="Imagen ilustrativa del producto" >
                            <img slot="img_supermarket" src="${product.supermarket_img}" alt="Logo del supermercado ...">`
                        productCard.setAttribute('href', product.link)

                        if (!isForAPreviousPage) containerProducts.insertAdjacentElement('beforeEnd', productCard)
                        else containerProducts.insertAdjacentElement('afterBegin', productCard)
                        

                        if (localStorage.getItem(product.id)) {
                            const productsInTheCart = [ ...document.querySelectorAll('product-cart') ]
                            const isProductInTheCart = productsInTheCart.some(productInTheCart => productInTheCart.getId() == product.id)
                            
                            if (isProductInTheCart) {
                                productCard.btnAddToCart.classList.add('deactive')
                                productCard.btnRemoveToCart.classList.add('active')
                            } else {
                                productCard.btnAddToCart.click()
                            }
                        }
                    });
                } else {
                    console.log("No products")
                    containerProducts.classList.add('not__found')
                    containerProducts.innerHTML = /* html */ `
                        <div class="products__not-found">
                            <div class="container__not-found-svg">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
                                    class="icon icon-tabler icons-tabler-outline icon-tabler-zoom-exclamation">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                                    <path d="M21 21l-6 -6" />
                                    <path d="M10 13v.01" />
                                    <path d="M10 7v3" />
                                </svg>
                            </div>
                            <div class="container__not-found-info">
                                <h3>No hemos encontrado productos para su búsqueda</h3>
                                <h4>Te ayudamos con la búsqueda:</h4>
                                <p>Revisa que lo hayas escrito bien.</p>
                                <p>Prueba buscando otra palabra parecida o más general.</p>
                                <p>Observa el número de página en que te encuentras.</p>
                            </div>
                        </div>`
                }

                if (isForAPreviousPage) {
                    return
                }

                if (total_pages == page) {
                    isLastPage = true
                } else {
                    isLastPage = false
                }
            })
        
    }
}


function reformatPrices(price) {
    const priceString = price.toString()
    const separatedPrice = priceString.split('.')

    if (separatedPrice.length == 1) {
        separatedPrice[1] = '00'
    } else if (separatedPrice[1].length < 2) {
        separatedPrice[1] += '0'
    }

    let indexPricePoints = []
    if (separatedPrice[0].length > 3) {
        for (let i = (separatedPrice[0].length - 3); i > 0; i = i - 3) {
            indexPricePoints.push(i)
        }
    } else {
        if (separatedPrice[1].length > 2) {
            separatedPrice[1] = separatedPrice[1].substring(0, 2)
        }
        return separatedPrice.join(',')
    }

    let subSeparatedPrice = []
    let partToDivide = separatedPrice[0]
    const separatedNewPrice = []
    for (let i = 0; i < indexPricePoints.length; i++){
        subSeparatedPrice[0] = partToDivide.substring(0, indexPricePoints[i])
        subSeparatedPrice[1] = partToDivide.substring(indexPricePoints[i], partToDivide.length)

        partToDivide = subSeparatedPrice[0]

        separatedNewPrice.unshift(subSeparatedPrice[1])
        if (i == indexPricePoints.length - 1) {
            separatedNewPrice.unshift(subSeparatedPrice[0])
        }
    }

    if (separatedPrice[1].length > 2) {
        separatedPrice[1] = separatedPrice[1].substring(0, 2)
    }
    return `${separatedNewPrice.join('.')},${separatedPrice[1]}`
}




/* EFECTO DE TIPEO */
let supermarketsNames
const speed = 150
const delayBetweenSupermarkets = 2000
const spanElement = document.querySelector(".titles__supermarkets")

let supermarketIndex = 0
let charIndex = 0
let isDeleting = false

function typeEffect() {
    if (!isDeleting) {
        // Tipear texto
        spanElement.textContent += supermarketsNames[supermarketIndex].charAt(charIndex)
        charIndex++;

        if (charIndex === supermarketsNames[supermarketIndex].length) {
            isDeleting = true;
            setTimeout(typeEffect, delayBetweenSupermarkets) // Esperar antes de borrar
        } else {
            setTimeout(typeEffect, speed)
        }
    } else {
        // Borrar texto
        spanElement.textContent = supermarketsNames[supermarketIndex].substring(0, charIndex - 1)
        charIndex--;

        if (charIndex === 0) {
            isDeleting = false
            supermarketIndex = (supermarketIndex === supermarketsNames.length - 1) ? 0 : supermarketIndex + 1
            setTimeout(typeEffect, speed)
        } else {
            setTimeout(typeEffect, speed)
        }
    }
}
