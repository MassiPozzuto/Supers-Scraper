import { createContext, ReactNode, useState } from "react";
import Product from "../Models/Product"

interface ProviderProps {
    children: ReactNode
}

// Tipo del contexto
interface CartContextType {
    productsInTheCart: Product[];
    setProductsInTheCart: (update: Product[] | ((prevProducts: Product[]) => Product[])) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext<CartContextType>({
    productsInTheCart: [],
    setProductsInTheCart: () => {}
})

export const CartProvider = ({ children }: ProviderProps) => {
    const [productsInTheCart, setProductsInTheCart] = useState(() => {
        const productsLocalStorage = localStorage.getItem('products')
        return (productsLocalStorage) ? JSON.parse(productsLocalStorage) : []
    })

    const handleProductsInTheCart = (update: Product[] | ((prevProducts: Product[]) => Product[])) => {
        setProductsInTheCart((prevProducts: Product[]) => {
            const newProducts = typeof update === "function" ? update(prevProducts) : update

            localStorage.setItem('products', JSON.stringify(newProducts));       
            return newProducts
        })
    }

    return (
        <CartContext.Provider value={{ productsInTheCart, setProductsInTheCart: handleProductsInTheCart }}>
            {children}
        </CartContext.Provider>
    )
}