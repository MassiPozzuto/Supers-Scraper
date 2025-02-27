import DataProducts from "../Models/DataProduct"

interface ProductDatabase {
    id: number
    sku: number | null
    name: string
    price: number
    offers: Array<OfferDatabase> | null
    img_src: string
    link: string
    supermarket_img: string
}
interface OfferDatabase {
    id: number
    text: string | null
    price: number
    is_restricted: string | null
}


interface fetchProductsProps {
    query: string
    sort: string
    onlyOnSale: boolean
    page: number
}
export const fetchProducts = async ({ query, sort, onlyOnSale, page }: fetchProductsProps): Promise<DataProducts> => {
    try {
        const res = await fetch(`http://127.0.0.1:8000/search?q=${query}&page=${page}&order=${sort}&onlyWithOffers=${onlyOnSale}`)
        const data = await res.json()
        
        const products = data[0].map((product: ProductDatabase) => {
            const reformatOffers = product.offers?.map((offer) => ({
                id: offer.id,
                text: offer.text,
                price: offer.price.toFixed(2),
                isRestricted: offer.is_restricted,
                isActive: true
            }))

            return {
                id: product.id.toString(),
                name: product.name,
                price: product.price,
                offers: reformatOffers || null,
                imgSupermarket: product.supermarket_img,
                imgProduct: product.img_src,
                urlProduct: product.link
            }
        })

        return {
            products,
            totalProducts: data[1],
            totalPages: data[2]
        }

    } catch {
        throw new Error('Error searching products')
    }
}