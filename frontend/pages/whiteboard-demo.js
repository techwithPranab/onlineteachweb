import { useState, useEffect } from 'react'
import Head from 'next/head'
import WhiteboardDemo from '../src/components/demo/WhiteboardDemo'

export default function WhiteboardDemoPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading whiteboard...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Interactive Whiteboard with Math Templates - Online Teaching Platform</title>
        <meta name="description" content="Interactive whiteboard with comprehensive mathematical templates for online teaching and tutoring sessions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* KaTeX CSS for math rendering */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.13.11/dist/katex.min.css"
          integrity="sha384-Um5gpz1odJg5Z4HAmzPtgZKdTBHZdw8S29IecapCSB31ligYPhHQZMIlWLYQGVoc"
          crossOrigin="anonymous"
        />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <WhiteboardDemo />
      </div>
    </>
  )
}
