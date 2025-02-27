import { FormEvent, useContext } from "react"
import { CustomSimpleIcon } from "../Icons/CustomSimpleIcon"
import { FiltersContext } from "../../contexts/Filters.Context"
import "./FormSearcher.css"

export const FormSearcher = () => {
    const { setFilters } = useContext(FiltersContext)

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault()
        const form = event.target as HTMLFormElement
        const { query } = Object.fromEntries(new FormData(form)) 
        if (!query) return
        
        setFilters(prevFilters => {
            if (prevFilters.query == query) return prevFilters // Evitar que se vuelva a renderizar si busca lo mismo
            return {
                ...prevFilters,
                query: query as string,
                page: 1
            }
        })
    }

    return (
        <header className='searcher'>
            <form action="" onSubmit={(event) => handleSubmit(event)}>
                <input name="query" type="search" placeholder="Buscar..." className="navbar__input" />
                <button type="submit" className="navbar__submit" >
                    <CustomSimpleIcon path="M3 10a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-6-6" />
                </button>
            </form>
        </header>
    )
}