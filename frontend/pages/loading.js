import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoadingPage() {
  const router = useRouter()

  useEffect(() => {
    // If session ID is provided in query params, redirect immediately
    const { sessionId } = router.query
    if (sessionId) {
      router.replace(`/tutor/session/${sessionId}`)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Starting Live Session...</h2>
        <p className="text-gray-600">Please wait while we prepare your classroom</p>
      </div>
    </div>
  )
}
