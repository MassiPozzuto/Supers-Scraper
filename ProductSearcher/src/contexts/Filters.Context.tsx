import { createContext, ReactNode, useEffect, useState } from "react";  
import { useSearchParams } from "react-router-dom";

interface ProviderProps {
    children: ReactNode
}

interface FiltersType {
    query: string
    page: number
    sort: string
    onlyOnSale: boolean
}

// Tipo del contexto
interface FiltersContextType {
    filters: FiltersType;
    setFilters: (filters: FiltersType | ((prevFilters: FiltersType) => FiltersType)) => void;
}

const defaultFiltersValue = {
    query: '',
    page: 1,
    sort: 'OrderByPriceASC',
    onlyOnSale: false
}

// eslint-disable-next-line react-refresh/only-export-components
export const FiltersContext = createContext<FiltersContextType>({
    filters: defaultFiltersValue,
    setFilters: () => {}
})

export const FiltersProvider = ({ children }: ProviderProps) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [filters, setFilters] = useState<FiltersType>(() => {
        const initialQuery = searchParams.get("q") || defaultFiltersValue.query
        const initialPage = Number(searchParams.get("page")) || defaultFiltersValue.page
        const initialSort = validateSortParam(searchParams.get("sort"))
        const initialOnlyOnSale = searchParams.get("onlyOnSale") !== null
        return { query: initialQuery, page: initialPage, sort: initialSort, onlyOnSale: initialOnlyOnSale}
    })

    const handleFilters = (update: FiltersType | ((prevFilters: FiltersType) => FiltersType)) => {
        setFilters((prevFilters) => {
            const newFilters = typeof update === "function" ? update(prevFilters) : update
            return newFilters;
        })
    }

    // Usamos useEffect para actualizar los searchParams después del render
    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams)
        newSearchParams.set("q", filters.query)
        newSearchParams.set("page", filters.page.toString())
        newSearchParams.set("sort", filters.sort)

        if (filters.onlyOnSale) newSearchParams.set("onlyOnSale", filters.onlyOnSale.toString())
        else newSearchParams.delete("onlyOnSale")
        

        // Actualizamos los parámetros de búsqueda (esto ocurre después del render)
        setSearchParams(newSearchParams)
    }, [filters, setSearchParams, searchParams])

    return (
        <FiltersContext.Provider value={{ filters, setFilters: handleFilters }}>
            {children}
        </FiltersContext.Provider>
    )
}

const validateSortParam = (paramSort: string | null) => {
    if (paramSort == 'OrderByNameASC' || paramSort == 'OrderByNameDESC' || paramSort == 'OrderByPriceDESC') return paramSort
    return defaultFiltersValue.sort
}