import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {MinisContainer, MinisRouter} from '@shopify/shop-minis-react'

import {App} from './App.jsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MinisRouter>

    <MinisContainer>
      <App />
      </MinisContainer>
          </MinisRouter>

  </StrictMode>
)
