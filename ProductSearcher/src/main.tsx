import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './components/App/App.tsx'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { FiltersProvider } from './contexts/Filters.Context.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      
      <FiltersProvider>
          <Routes>
            <Route path="/" element={<App />} />
          </Routes>
      </FiltersProvider>

    </BrowserRouter>
  </StrictMode>,
)
