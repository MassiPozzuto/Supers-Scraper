import Product from "../../Models/Product"
import { ProductCard } from "../ProductCard/ProductCard"
import { ProductsNotFound } from "../ProductsNotFound/ProductsNotFound"
import "./Products.css"

export const Products = ({ products }: { products: Array<Product> | null }) => {
    if (products === null) return 

    const notFounded = products.length === 0

    return (
        
        <main className={notFounded ? 'products not__found' : 'products'}>
            {
                notFounded
                    ?
                    (
                        <ProductsNotFound />
                    )
                    :
                        products.map((product: Product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                price={product.price}
                                offers={product.offers}
                                imgProduct={product.imgProduct}
                                urlProduct={product.urlProduct}
                                imgSupermarket={product.imgSupermarket}
                            />
                        ))
            }
        </main>
    )
}