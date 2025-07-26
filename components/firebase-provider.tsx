"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface FirebaseContextType {
  isInitialized: boolean
  error: string | null
  isLoading: boolean
  retryConnection: () => void
}

const FirebaseContext = createContext<FirebaseContextType>({
  isInitialized: false,
  error: null,
  isLoading: true,
  retryConnection: () => {},
})

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const initializeFirebase = async () => {
    // Only run on client side
    if (typeof window === "undefined") {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      console.log(`🔄 Firebase Provider: Initialization attempt ${retryCount + 1}`)

      // Test basic Firebase functionality first
      const { testFirebaseBasic } = await import("@/lib/firebase")
      const basicTest = await testFirebaseBasic()

      if (basicTest) {
        console.log("✅ Firebase Provider: Connection successful!")
        setIsInitialized(true)
        setError(null)
      } else {
        throw new Error("Basic Firebase test failed")
      }
    } catch (err) {
      console.error("❌ Firebase Provider error:", err)

      let errorMessage = "Firebase connection failed"
      if (err instanceof Error) {
        errorMessage = err.message
      }

      // Add retry suggestion for certain errors
      if (errorMessage.includes("not available")) {
        errorMessage +=
          "\n\nThis might be a temporary issue. Try refreshing the page or check your internet connection."
      }

      setError(errorMessage)
      setIsInitialized(false)
    } finally {
      setIsLoading(false)
    }
  }

  const retryConnection = () => {
    setRetryCount((prev) => prev + 1)
    initializeFirebase()
  }

  useEffect(() => {
    // Add a longer delay to ensure everything is properly mounted
    const timer = setTimeout(initializeFirebase, 1000)
    return () => clearTimeout(timer)
  }, [retryCount])

  return (
    <FirebaseContext.Provider value={{ isInitialized, error, isLoading, retryConnection }}>
      {children}
    </FirebaseContext.Provider>
  )
}

export function useFirebase() {
  return useContext(FirebaseContext)
}
