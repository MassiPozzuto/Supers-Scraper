import { useContext, useEffect, useState } from "react"
import { CartContext } from "../contexts/Cart.Context"
import Product from "../Models/Product"

export const useProductInCart = ({ id }: {id: string}) => {
    const { productsInTheCart } = useContext(CartContext)
    const [isInTheCart, setInTheCart] = useState(() => {
        return (productsInTheCart.some((product: Product) => product.id == id)) ? true : false
    })

    
    useEffect(() => {
        const verifyInTheCart = () => { 
            setInTheCart(productsInTheCart.some((product: Product) => product.id == id))
        }
        verifyInTheCart()
    }, [id, productsInTheCart])


    return { isInTheCart, setInTheCart }
}