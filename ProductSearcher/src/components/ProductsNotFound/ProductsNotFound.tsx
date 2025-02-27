import { CustomSimpleIcon } from '../Icons/CustomSimpleIcon'
import './ProductsNotFound.css'

export const ProductsNotFound = () => (
    <div className="products__not-found">
        <div className="container__not-found-svg">
            <CustomSimpleIcon size={60} strokeWidth={1.5} path="M3 10a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-6-6M10 13v.01M10 7v3"/>
        </div>
        <div className="container__not-found-info">
            <h3>No hemos encontrado productos para su búsqueda</h3>
            <h4>Te ayudamos con la búsqueda:</h4>
            <p>Revisa que lo hayas escrito bien.</p>
            <p>Prueba buscando otra palabra parecida o más general.</p>
            <p>Observa el número de página en que te encuentras.</p>
        </div>
    </div>
)
