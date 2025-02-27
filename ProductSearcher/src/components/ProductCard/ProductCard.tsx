import { useContext } from "react"
import { useProductInCart } from "../../hooks/useProductInCart"
import Product from "../../Models/Product"
import { Prices } from "../Prices/Prices"
import { CartContext } from "../../contexts/Cart.Context"
import "./PorductCard.css"


export const ProductCard = ({ id, name, price, imgProduct, imgSupermarket, urlProduct, offers }: Product) => {
    const { setProductsInTheCart } = useContext(CartContext)
    const { isInTheCart, setInTheCart } = useProductInCart({ id })

    const addOrRemoveOfCart = () => {
        setProductsInTheCart((prevProducts) => {
            if (isInTheCart) return prevProducts.filter((product: Product) => product.id !== id) // Sacar del carrito

            return [...prevProducts, { id, name, price, imgProduct, imgSupermarket, urlProduct, offers, amount: 1 }]// Agregar al carrito
        })
        setInTheCart(!isInTheCart)
    }

    return (
        <article className="product__card">
            <div className="product__card--img">
                <a href={urlProduct} target="_blank" rel="noopener noreferrer">
                    <img src={imgProduct} alt="Imagen ilustrativa del producto" />
                </a>

                <div className="product__card--super-logo">
                    <img src={imgSupermarket} alt="Logo del supermercado" />
                </div>
            </div>

            <div className="product__card--info">
                <div className="product__card--name">
                    <a href={urlProduct} target="_blank" rel="noopener noreferrer" className="name">{name}</a>
                </div>

                <Prices id={id} offers={offers} normalPrice={price} forWhat="card"></Prices>
            </div>
            <div className="product__card--add-cart">
                <button
                    type="button"
                    className={!isInTheCart ? 'btn-toggle-to-cart' : 'btn-toggle-to-cart added'}
                    onClick={addOrRemoveOfCart}
                >
                    {!isInTheCart ? 'Agregar al carrito' : 'Eliminar del carrito'}
                </button>
            </div>
        </article>
    )
}
