import { ProductCard } from './components/ProductCard.js'

const url = window.location.search
const urlParams = new URLSearchParams(url)

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

// Parametro 'page'
const paramPage = urlParams.get('page')
let page = (paramPage > 1 && !isNaN(paramPage)) ? parseInt(paramPage) : 1
let total_pages

const containerProducts = document.querySelector('.products')

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

    orderSelect.addEventListener('change', (event) => {
        order = orderSelect.value
        urlParams.set('order', orderSelect.value)
        page = 1
        urlParams.set('page', 1)
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

        
        loadProducts(q, page, order)
    })

    document.querySelector('form').addEventListener("submit", (event) => {
        event.preventDefault()
        

        if (inputQuery.value) {
            q = inputQuery.value
            urlParams.set('q', inputQuery.value)
            page = 1
            urlParams.set('page', 1)
            window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

            /* Hago isLastPage verdadero ya que al buscar nuevos productos, el containerProducts se limpia, por lo que, el usuario se encontrará en el final de la pagina y se 
            ejecutará la paginación. Entonces, al hacer parecer que ya se encuentra en la última página esto no sucede, pero si mantuviesemos dicha varaible en true, la paginación 
            ya no funcionaria, por eso dentro de loadProducts, si page != total_page, isLastPage se vuelve false */
            isLastPage = true
            loadProducts(inputQuery.value, page, order)
        }
    })


    window.addEventListener('scroll', function () {
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        

        // Verificar si estamos cerca del final de la página
        if (scrollPosition >= documentHeight - 10 && !isAtBottom) {
            console.log('User en el final de la pagina')
            isAtBottom = true
            if (!isLastPage) {
                page += 1
                urlParams.set('page', page)
                window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`)

                loadProducts(q, page, order)
            }

        } else if (scrollPosition < documentHeight - 10) {
            // Resetear el flag si no estamos al final
            isAtBottom = false;
        }
    });
});


async function loadProducts(query, page = 1, order = "OrderByPriceASC") {
    
    if (query) {
        if (page == 1) {
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
                    containerProducts.classList.remove('not__found')
                    products.forEach(product => {
                        const productCard = new ProductCard()
                        productCard.innerHTML =  /* html */`
                            <h4 slot="name" title="${product.name}">${product.name}</h4>
                            <p slot="price">$${reformatPrices(product.price)}</p>
                            <img slot="img_product" src="${product.img_src}" alt="Imagen ilustrativa del producto" >
                            <img slot="img_supermarket" src="${product.supermarket_img}" alt="Logo del supermercado ...">`
                        productCard.setAttribute('href', product.link)
    
                        containerProducts.insertAdjacentElement('beforeEnd', productCard)
                    });
                } else {
                    containerProducts.classList.add('not__found')
                    console.log("No products")
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

                if (total_pages == page){
                    isLastPage = true
                } else {
                    isLastPage = false
                }
            })
        
    }
}

isLastPage = true
loadProducts(q, page, order)



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
