export default interface Offer {
    id: number
    text: string | null
    price: number
    isRestricted: string | null
    isActive: boolean
}