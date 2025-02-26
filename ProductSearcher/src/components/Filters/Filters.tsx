import { ChangeEvent, useContext, useId } from 'react'
import { CustomSimpleIcon } from '../Icons/CustomSimpleIcon'
import { OfferIcon } from '../Icons/OfferIcon'
import { FiltersContext } from '../../contexts/Filters.Context'
import './Filters.css'

export const Filters = () => {
    const { filters, setFilters } = useContext(FiltersContext)
    const onlyOnSaleID = useId()

    const handleSort = (event: ChangeEvent<HTMLSelectElement>) => {
        const newSort = event.target.value
        setFilters(prevFilters => ({
            ...prevFilters,
            sort: newSort,
            page: 1
        }))
    }

    const handleOnlyOnSale = () => {
        setFilters(prevFilters => ({
            ...prevFilters,
            onlyOnSale: !prevFilters.onlyOnSale,
            page: 1
        }))
    }

    return (
        <div className="search__filters--items">
            <div className="search__filters--offers">
                <OfferIcon />
                <label htmlFor={onlyOnSaleID}>Solo en oferta</label>
                <input id={onlyOnSaleID} type="checkbox" onChange={handleOnlyOnSale} defaultChecked={filters.onlyOnSale} />
            </div>

            <div className="search__filters--sort">
                <div className="search__filters--sort-text">
                    <CustomSimpleIcon path="m3 9 4-4 4 4M7 5v14M21 15l-4 4-4-4m4 4V5" />
                    <span>Ordenar por</span>
                </div>
                <select onChange={(event) => handleSort(event)} defaultValue={filters.sort}>
                    <option value="OrderByNameASC">Nombre A-Z</option>
                    <option value="OrderByNameDESC">Nombre Z-A</option>
                    <option value="OrderByPriceASC" >Precio más bajo</option>
                    <option value="OrderByPriceDESC">Precio más alto</option>
                </select>
            </div>
        </div>
    )
}