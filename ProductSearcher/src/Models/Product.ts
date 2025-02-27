import Offer from "./Offer"

export default interface Product {
    id: string
    name: string
    price: number
    offers: Array<Offer> | null
    imgProduct: string
    urlProduct: string
    imgSupermarket: string
    amount?: number
}