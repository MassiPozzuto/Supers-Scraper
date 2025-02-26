import { useContext, useEffect, useRef, useState } from 'react'
import { useProducts } from '../../hooks/useProducts'
import { useSupermarketsName } from '../../hooks/useSupermarketsName'
import { TypeWritter } from '../TypeWritter/TyperWritter'
import { FormSearcher } from '../FormSearcher/FormSearcher'
import { Products } from '../Products/Products'
import { Cart } from '../Cart/Cart'
import { Filters } from '../Filters/Filters'
import { FiltersContext } from '../../contexts/Filters.Context'
import { CartProvider } from '../../contexts/Cart.Context'
import './App.css'


function App() {
  const { supermarketsNames } = useSupermarketsName()
  const loading = useRef(false)
  const endOfPageRef = useRef(null)
  const { filters, setFilters } = useContext(FiltersContext)
  const [isForPreviousPage, setIsForPreviousPage] = useState(false)
  const [specificPage, setSpecificPage] = useState(() => (filters.page > 1) ? filters.page : 0)
  const { products } = useProducts({ query: filters.query, sort: filters.sort, onlyOnSale: filters.onlyOnSale, page: filters.page, loading, specificPage, isForPreviousPage })
  

  useEffect(() => {
    if (products.products.length === 0) return
    if (filters.page === products.totalPages) return
    if (loading.current) return
    
    const onChange = ([entry]: IntersectionObserverEntry[]) => {
      if (entry.isIntersecting) {
        setIsForPreviousPage(false)
        setFilters(prevFilters => ({
          ...prevFilters,
          page: prevFilters.page + 1
        }))
      }
    }
    const observer = new IntersectionObserver(onChange)
    
    if (endOfPageRef.current) observer.observe(endOfPageRef.current)
    
    return () => observer.disconnect()

    // setFilters() no cambia, no tiene sentido ponerlo como dependencia
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, products.totalPages, products.products.length]) 


  useEffect(() => {
    if (filters.page === 1) setSpecificPage(0) // Cuando page cambia a 1, reseteamos specificPage a 0
  }, [filters.page])

  const loadPreviousProducts = () => {
    if (filters.page === 1) return
    if (specificPage === 1) return
    
    if(!isForPreviousPage) setIsForPreviousPage(true)
    setSpecificPage(specificPage - 1)
  }
  

  return (
    <>
      <div className='titles'>
        <h1 style={{ textAlign: 'start' }}>El mejor buscador y comparador de precios de supermercados</h1>
        <h2>Encontrá productos de los siguientes súpers: <TypeWritter words={supermarketsNames} /></h2>
      </div>

      <FormSearcher/>

      <section className='search__filters'>
        <div>
          {
            products.totalProducts !== null && (
              <p>{products.totalProducts} productos encontrados</p>
            )
          }
        </div>

        <Filters/>
      </section>
      
      {
        specificPage > 1 && (
          <div className="container__btn-previous-products">
            <button type="button" onClick={loadPreviousProducts}>Mostrar anteriores</button>
          </div>
        )
      }

      
      <CartProvider>
        <Products products={(products.totalProducts !== null ? products.products : null)} />
        <Cart />
      </CartProvider> 

      <div ref={endOfPageRef}></div>
    </>
  )
}

export default App
