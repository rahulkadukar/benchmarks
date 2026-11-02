import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider } from '@mantine/core'

import '@mantine/core/styles.css'
import './index.css'

import Main from './Main.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider forceColorScheme="dark">
      <Main />
    </MantineProvider>
  </React.StrictMode>,
)
