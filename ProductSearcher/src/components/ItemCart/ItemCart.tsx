import { useContext, useState } from "react"
import Product from "../../Models/Product"
import { CustomSimpleIcon } from "../Icons/CustomSimpleIcon"
import { Prices } from "../Prices/Prices"
import './ItemCart.css'
import Offer from "../../Models/Offer"
import { CartContext } from "../../contexts/Cart.Context"

interface Props{
    id: string
    name: string
    price: number
    offers: Array<Offer> | null
    imgProduct: string
    urlProduct: string
    imgSupermarket: string
    amount?: number
}

export const ItemCart = ({ id, name, price, imgProduct, imgSupermarket, urlProduct, offers, amount }: Props) => {
    const { productsInTheCart, setProductsInTheCart } = useContext(CartContext)
    const [interAmount, newAmount] = useState((amount) ? amount : 1)

    const subtractOneFromAmount = () => {
        if (!productsInTheCart) return
        
        setProductsInTheCart((prevProducts) => {
            if (interAmount > 1) {
                return prevProducts.map((product: Product) => ({
                    ...product,
                    amount: (product.id == id) ? interAmount - 1 : product.amount
                }))
            }

            return productsInTheCart.filter((product: Product) => product.id !== id)
        })
        newAmount(interAmount - 1)
    }

    const addOneToAmount = () => {
        if (!productsInTheCart) return

        setProductsInTheCart((prevProducts) => {
            return prevProducts.map((product: Product) => ({
                ...product,
                amount: (product.id == id) ? interAmount + 1 : product.amount
            }))
        })
        newAmount(interAmount + 1)
    }

    return (
        <article className="product__cart">
            <img src={imgSupermarket} className="product__cart--super-logo" alt="Logo del supermercado" />
            <div className="product__cart--info">
                <a href={urlProduct} target="_blank" rel="noopener noreferrer">
                    <img src={imgProduct} className="img_product" alt="Imagen ilustrativa del producto" />
                </a>
                <div className="product__cart--name-price">
                    <a href={urlProduct} target="_blank" rel="noopener noreferrer" className="product__cart--name">{name}</a>

                    
                    <Prices id={id} offers={offers} normalPrice={price} forWhat="cartOffer"></Prices>
                </div>
            </div>
            <div className="product__cart--amount">
                <button type="button" onClick={subtractOneFromAmount}>
                    <CustomSimpleIcon path="M5 12h14" />
                </button>
                <span>{interAmount}</span>
                <button type="button" onClick={addOneToAmount}>
                    <CustomSimpleIcon path="M12 5v14M5 12h14" />
                </button>
            </div>
        </article>
    )
}