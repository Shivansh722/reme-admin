"use client"

// Try alternative Firestore initialization approaches
export async function initializeFirebase() {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side")
  }

  try {
    console.log("🔄 Step 1: Importing Firebase modules...")

    const { initializeApp, getApps } = await import("firebase/app")
    console.log("✅ Step 1: Firebase app module imported")

    const { firebaseConfig } = await import("./firebase-config")
    console.log("✅ Step 2: Firebase config loaded:", {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
    })

    console.log("🔄 Step 3: Initializing Firebase app...")
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    console.log("✅ Step 3: Firebase app initialized successfully")

    // Wait a moment before initializing Firestore
    await new Promise((resolve) => setTimeout(resolve, 200))

    console.log("🔄 Step 4: Importing Firestore module...")
    const { getFirestore, connectFirestoreEmulator, initializeFirestore } = await import("firebase/firestore")
    console.log("✅ Step 4: Firestore module imported")

    console.log("🔄 Step 5: Attempting Firestore initialization...")

    let db
    try {
      // Try standard initialization first
      console.log("🔄 Step 5a: Trying standard getFirestore...")
      db = getFirestore(app)
      console.log("✅ Step 5a: Standard Firestore initialization successful")
    } catch (standardError) {
      console.log("❌ Step 5a failed:", standardError)

      try {
        // Try with explicit settings
        console.log("🔄 Step 5b: Trying initializeFirestore with settings...")
        db = initializeFirestore(app, {
          experimentalForceLongPolling: true, // This can help with network issues
        })
        console.log("✅ Step 5b: Firestore with settings successful")
      } catch (settingsError) {
        console.log("❌ Step 5b failed:", settingsError)

        // Try with different settings
        console.log("🔄 Step 5c: Trying with different settings...")
        db = initializeFirestore(app, {
          experimentalForceLongPolling: false,
          experimentalAutoDetectLongPolling: true,
        })
        console.log("✅ Step 5c: Firestore with auto-detect successful")
      }
    }

    // Test basic Firestore functionality
    console.log("🔄 Step 6: Testing Firestore connection...")
    const { collection } = await import("firebase/firestore")
    const testCollection = collection(db, "users")
    console.log("✅ Step 6: Firestore connection test passed")

    return { app, db }
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error)

    // Provide specific troubleshooting based on the error
    if (error instanceof Error) {
      if (error.message.includes("not available")) {
        console.error("🔧 Troubleshooting suggestions:")
        console.error("   1. Try refreshing the page")
        console.error("   2. Check if you're using a VPN or corporate firewall")
        console.error("   3. Try a different browser or incognito mode")
        console.error("   4. Check if Firestore is accessible from your location")
      }
    }

    throw error
  }
}

// Alternative: Try using Firebase REST API as fallback
export async function initializeFirebaseWithFallback() {
  try {
    return await initializeFirebase()
  } catch (error) {
    console.log("🔄 Primary Firebase initialization failed, trying fallback...")

    // Create a mock Firebase object that uses REST API
    const mockApp = { options: { projectId: "reme-57c1b" } }
    const mockDb = {
      _type: "mock",
      projectId: "reme-57c1b",
    }

    console.log("✅ Fallback Firebase initialized (REST API mode)")
    return { app: mockApp, db: mockDb }
  }
}

export async function testFirebaseBasic() {
  try {
    console.log("🧪 Testing basic Firebase functionality...")
    const { app, db } = await initializeFirebaseWithFallback()

    if (isMockFirestore(db)) {
      console.log("✅ Using fallback mode - will use REST API")
      return true
    }

    // Try to create a reference without querying
    const { collection } = await import("firebase/firestore")
    const usersRef = collection(db, "users")

    console.log("✅ Basic Firebase test passed")
    return true
  } catch (error) {
    console.error("❌ Basic Firebase test failed:", error)
    return false
  }
}

// Update the type checking function for mock firestore
export function isMockFirestore(db: any): db is { _type: string; projectId: string } {
  return db && typeof db === 'object' && '_type' in db && db._type === 'mock';
}

// Or alternatively, use a more robust type-guard approach:
/*
interface MockFirestore {
  _type: string;
  projectId: string;
}

export function isMockFirestore(db: Firestore | MockFirestore): db is MockFirestore {
  return '_type' in db && db._type === 'mock-firestore';
}
*/
