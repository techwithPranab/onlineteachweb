import '../src/index.css'
import { HelmetProvider } from 'react-helmet-async'

function MyApp({ Component, pageProps }) {
  return (
    <HelmetProvider>
      <Component {...pageProps} />
    </HelmetProvider>
  )
}

export default MyApp
