import Product from "./Product"

export default interface DataProducts {
    products: Array<Product>
    totalProducts: number | null
    totalPages: number
} 