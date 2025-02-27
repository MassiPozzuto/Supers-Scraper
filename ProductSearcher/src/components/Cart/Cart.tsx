import { useContext, useEffect, useState } from "react"
import { CustomSimpleIcon } from "../Icons/CustomSimpleIcon"
import { CartIcon } from "../Icons/CartIcon"
import { ItemCart } from "../ItemCart/ItemCart"
import { CartContext } from "../../contexts/Cart.Context"
import { reformatPrice } from "../../utils/reformatPrice"
import Product from "../../Models/Product"
import Offer from "../../Models/Offer"
import './Cart.css'


interface Props {
    amount: number | undefined
    offers: Offer[] | null
}
const getOfferPrices = ({ amount, offers }: Props) => {
    if (!offers || amount === undefined) return []

    //offers.sort((a, b) => a.price - b.price)
    let lastAmountOffer = 0
    return offers.flatMap(offer => {
        if (offer.isRestricted && !offer.isActive) return []

        const regexImportantNumberOffer = /(\d+)((?!\d+)(?!%))/
        const matchText = offer.text?.match(regexImportantNumberOffer)
        if (matchText) {
            const definingNumber = Number(matchText[0])
            
            const amountNormalPrice = amount % definingNumber // Cantidad de productos con precio normal
            const amountOfferPrice = amount - amountNormalPrice // Cantidad de productos con el precio de la oferta
            
            if (amountOfferPrice <= lastAmountOffer) return []

            lastAmountOffer = amountOfferPrice
            return { amount: amountOfferPrice, price: offer.price }
        }
        
        if (amount <= lastAmountOffer) return []

        lastAmountOffer = amount
        return { amount, price: offer.price }
    })
}


export const Cart = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [totalPrice, setTotalPrice] = useState(0)
    const { productsInTheCart } = useContext(CartContext)
    

    useEffect(() => {
        let newTotalPrice = 0
        productsInTheCart.forEach(product => {
            let totalAmount = product.amount || 1

            const dataOffers = getOfferPrices({ amount: totalAmount, offers: product.offers })
            dataOffers.forEach((dataOffer) => {
                newTotalPrice = newTotalPrice + (dataOffer.price * dataOffer.amount)
                totalAmount = totalAmount - dataOffer.amount
            })

            newTotalPrice = newTotalPrice + (product.price * totalAmount)
        })
        setTotalPrice(newTotalPrice)
    }, [productsInTheCart])

    
    return (
        <>
            <div className="container__btn-cart">
                <button type="button" title="Carrito de compras" onClick={() => { setIsOpen(true) } }>
                    <CartIcon />
                </button>
            </div>

            <aside className={isOpen ? 'cart show-cart' : 'cart closed-cart'}>
                <header className="cart__header">
                    <h3>Carrito de compras</h3>
                    <button type="button" title="Cerrar el carrito de compras" onClick={() => {setIsOpen(false)}}>
                        <CustomSimpleIcon path="M18 6 6 18M6 6l12 12" />
                    </button>
                </header>

                <section className="cart__products">
                    {
                        (productsInTheCart.length === 0)
                            ?
                            (
                                <div className="cart__products--message-empty">
                                    <p>El carrito está vacio</p>
                                </div>
                            )
                            :
                            productsInTheCart.map((product: Product) => (
                                <ItemCart
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={product.price}
                                    offers={product.offers}
                                    imgProduct={product.imgProduct}
                                    urlProduct={product.urlProduct}
                                    imgSupermarket={product.imgSupermarket}
                                    amount={product.amount} />
                            ))
                    }
                </section>

                <footer className="cart__resume">
                    <div className="cart__resume--total">
                        <span>Total: </span>
                        <span>${reformatPrice(totalPrice)}</span>
                    </div>
                </footer>
            </aside>
        </>
    )
}