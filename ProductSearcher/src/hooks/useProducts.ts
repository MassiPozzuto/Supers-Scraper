import { useEffect, useState } from "react"
import { fetchProducts } from "../services/fetchProducts"
import DataProducts from "../Models/DataProduct"

interface Props {
    query: string
    sort: string
    onlyOnSale: boolean
    page: number
    loading: { current: boolean }
    specificPage: number
    isForPreviousPage: boolean
}

export const useProducts = ({ query, sort, onlyOnSale, page, loading, specificPage, isForPreviousPage }: Props) => {
    const [products, setProducts] = useState<DataProducts>({ products: [], totalPages: 0, totalProducts: null})

    useEffect(() => {
        if (!query || loading.current) return
        
        const getProducts = async () => {
            loading.current = true
            const pageToFetch = isForPreviousPage ? specificPage : page
            const newProducts = await fetchProducts({ query, sort, onlyOnSale, page: pageToFetch })

            setProducts((prevProducts) => {
                if (page !== 1) {
                    return {
                        ...newProducts,
                        products: isForPreviousPage
                            ? [...newProducts.products, ...prevProducts.products]
                            : [...prevProducts.products, ...newProducts.products]
                    }
                }
                return newProducts
            })

            loading.current = false
        }
        getProducts()


        // No tiene sentido volver a ejecutar este useEffect cada vez que loading cambie
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, page, sort, onlyOnSale,  specificPage, isForPreviousPage])

    return { products }
}