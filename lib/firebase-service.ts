import type { Timestamp } from "firebase/firestore"

const isClient = typeof window !== "undefined"

export interface User {
  id: string
  displayName: string
  email: string
  createdAt: Timestamp | string
  lastLoginAt: Timestamp | string
  lastUpdatedAt: Timestamp | string
  latestAnalysisDate: Timestamp | string
  latestAnalysisId: string
  photoURL: string
  provider: string
}

export interface Product {
  id: string
  category: string
  brand: string
  description: string
  productName: string
  productUrl: string
  imageUrl: string
  externalUrl: string
  tags: string[]
  evaluationScore: number
}

export interface SkinAnalysis {
  id: string
  analysisResults: string
  firmness: number
  pimples: number
  pores: number
  redness: number
  sagging: number
  skinAge: number
  skinGrade: number
  imagePath: string
  timestamp: Timestamp | string
}

// REST API fallback functions
async function fetchFromFirestoreREST(collection: string, limit = 20) {
  try {
    const projectId = "reme-57c1b"
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}?pageSize=${limit}`

    console.log(`🌐 Fetching ${collection} via REST API...`)
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`REST API request failed: ${response.status}`)
    }

    const data = await response.json()
    console.log(`✅ REST API: Fetched ${data.documents?.length || 0} documents from ${collection}`)

    return data.documents || []
  } catch (error) {
    console.error(`❌ REST API error for ${collection}:`, error)
    return []
  }
}

function convertFirestoreDocument(doc: any) {
  const data: any = { id: doc.name.split("/").pop() }

  if (doc.fields) {
    Object.keys(doc.fields).forEach((key) => {
      const field = doc.fields[key]
      if (field.stringValue) data[key] = field.stringValue
      else if (field.integerValue) data[key] = Number.parseInt(field.integerValue)
      else if (field.doubleValue) data[key] = Number.parseFloat(field.doubleValue)
      else if (field.booleanValue) data[key] = field.booleanValue
      else if (field.timestampValue) data[key] = field.timestampValue
      else if (field.arrayValue) data[key] = field.arrayValue.values || []
    })
  }

  return data
}

// Enhanced service functions with fallback support
export async function getUsers(): Promise<User[]> {
  if (!isClient) return []

  try {
    console.log("📊 Attempting to fetch users...")

    const { initializeFirebaseWithFallback } = await import("./firebase")
    const { app, db } = await initializeFirebaseWithFallback()

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for users...")
      const documents = await fetchFromFirestoreREST("users", 20)
      console.log(`✅ Successfully fetched ${documents.length} users via REST API`)
      return documents.map(convertFirestoreDocument) as User[]

    }

    // Use normal Firestore SDK
    const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore")
    const usersRef = collection(db, "users")
    const snapshot = await getDocs(query(usersRef, orderBy("createdAt", "desc"), limit(20)))

    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[]

    console.log(`✅ Successfully fetched ${users.length} users`)
    return users
  } catch (error) {
    console.error("❌ Error fetching users:", error)
    return []
  }
}

export async function getProducts(): Promise<Product[]> {
  if (!isClient) return []

  try {
    console.log("📊 Attempting to fetch products...")

    const { initializeFirebaseWithFallback } = await import("./firebase")
    const { app, db } = await initializeFirebaseWithFallback()

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for products...")
      const documents = await fetchFromFirestoreREST("products", 20)
      return documents.map(convertFirestoreDocument) as Product[]
    }

    // Use normal Firestore SDK
    const { collection, getDocs, query, limit } = await import("firebase/firestore")
    const productsRef = collection(db, "products")
    const snapshot = await getDocs(query(productsRef, limit(20)))

    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[]

    console.log(`✅ Successfully fetched ${products.length} products`)
    return products
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return []
  }
}

export async function getSkinAnalyses(): Promise<SkinAnalysis[]> {
  if (!isClient) return []

  try {
    console.log("📊 Attempting to fetch skin analyses...")

    const { initializeFirebaseWithFallback } = await import("./firebase")
    const { app, db } = await initializeFirebaseWithFallback()

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for skinAnalysis...")
      const documents = await fetchFromFirestoreREST("skinAnalysis", 20)
      return documents.map(convertFirestoreDocument) as SkinAnalysis[]
    }

    // Use normal Firestore SDK
    const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore")
    const analysisRef = collection(db, "skinAnalysis")
    const snapshot = await getDocs(query(analysisRef, orderBy("timestamp", "desc"), limit(20)))

    const analyses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SkinAnalysis[]

    console.log(`✅ Successfully fetched ${analyses.length} analyses`)
    return analyses
  } catch (error) {
    console.error("❌ Error fetching skin analyses:", error)
    return []
  }
}

export async function getDashboardStats() {
  if (!isClient) {
    return {
      totalUsers: 0,
      dailyUsers: 0,
      dailyAnalyses: 0,
      monthlyUsers: 0,
      totalAnalyses: 0,
    }
  }

  try {
    console.log("📊 Calculating dashboard stats...")

    const [users, analyses] = await Promise.allSettled([getUsers(), getSkinAnalyses()])

    const userData = users.status === "fulfilled" ? users.value : []
    const analysisData = analyses.status === "fulfilled" ? analyses.value : []

    const today = new Date()
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    const dailyUsers = userData.filter((user) => {
      try {
        const loginDate = typeof user.lastLoginAt === "string" ? new Date(user.lastLoginAt) : user.lastLoginAt?.toDate()
        return loginDate && loginDate >= yesterday
      } catch {
        return false
      }
    }).length

    const dailyAnalyses = analysisData.filter((analysis) => {
      try {
        const analysisDate =
          typeof analysis.timestamp === "string" ? new Date(analysis.timestamp) : analysis.timestamp?.toDate()
        return analysisDate && analysisDate >= yesterday
      } catch {
        return false
      }
    }).length

    const monthlyUsers = userData.filter((user) => {
      try {
        const createdDate = typeof user.createdAt === "string" ? new Date(user.createdAt) : user.createdAt?.toDate()
        return createdDate && createdDate >= lastMonth
      } catch {
        return false
      }
    }).length

    const stats = {
      totalUsers: userData.length,
      dailyUsers,
      dailyAnalyses,
      monthlyUsers,
      totalAnalyses: analysisData.length,
    }

    console.log("✅ Dashboard stats calculated:", stats)
    return stats
  } catch (error) {
    console.error("❌ Error calculating dashboard stats:", error)
    return {
      totalUsers: 0,
      dailyUsers: 0,
      dailyAnalyses: 0,
      monthlyUsers: 0,
      totalAnalyses: 0,
    }
  }
}

export async function getAnalyticsTrends() {
  if (!isClient) return []

  try {
    console.log("📊 Calculating analytics trends...")
    const analyses = await getSkinAnalyses()

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      return date.toISOString().split("T")[0]
    }).reverse()

    const trendData = last7Days.map((date) => {
      const dayAnalyses = analyses.filter((analysis) => {
        try {
          const analysisDate =
            typeof analysis.timestamp === "string"
              ? new Date(analysis.timestamp).toISOString().split("T")[0]
              : analysis.timestamp?.toDate().toISOString().split("T")[0]
          return analysisDate === date
        } catch {
          return false
        }
      })

      const avgScores =
        dayAnalyses.length > 0
          ? {
              skinAge: Math.round(dayAnalyses.reduce((sum, a) => sum + (a.skinAge || 0), 0) / dayAnalyses.length),
              pimples: Math.round(dayAnalyses.reduce((sum, a) => sum + (a.pimples || 0), 0) / dayAnalyses.length),
              pores: Math.round(dayAnalyses.reduce((sum, a) => sum + (a.pores || 0), 0) / dayAnalyses.length),
              firmness: Math.round(dayAnalyses.reduce((sum, a) => sum + (a.firmness || 0), 0) / dayAnalyses.length),
              redness: Math.round(dayAnalyses.reduce((sum, a) => sum + (a.redness || 0), 0) / dayAnalyses.length),
              sagging: Math.round(dayAnalyses.reduce((sum, a) => sum + (a.sagging || 0), 0) / dayAnalyses.length),
            }
          : {
              skinAge: 0,
              pimples: 0,
              pores: 0,
              firmness: 0,
              redness: 0,
              sagging: 0,
            }

      return {
        date,
        diagnostics: dayAnalyses.length,
        ...avgScores,
      }
    })

    console.log("✅ Analytics trends calculated")
    return trendData
  } catch (error) {
    console.error("❌ Error calculating analytics trends:", error)
    return []
  }
}

// Generic collection fetcher
interface MockFirestore {
  _type: string;
  projectId: string;
}

// Type guard to check if we have a mock firestore instance
function isMockFirestore(db: any): db is MockFirestore {
  return db && typeof db === 'object' && db._type === 'mock';
}

export async function getCollection(collectionName: string, limit = 50): Promise<any[]> {
  if (!isClient) return [];

  try {
    console.log(`📊 Attempting to fetch ${collectionName} collection...`);

    const { initializeFirebaseWithFallback } = await import("./firebase");
    const { app, db } = await initializeFirebaseWithFallback();

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log(`🌐 Using REST API fallback for ${collectionName}...`);
      const documents = await fetchFromFirestoreREST(collectionName, limit);
      return documents.map(convertFirestoreDocument);
    }

    // Use normal Firestore SDK
    const { collection, getDocs, query, limit: firestoreLimit } = await import("firebase/firestore");
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(query(collectionRef, firestoreLimit(limit)));

    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Successfully fetched ${documents.length} documents from ${collectionName}`);
    return documents;
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error);
    return [];
  }
}

// Get document by ID
export async function getDocument(collectionName: string, documentId: string): Promise<any | null> {
  if (!isClient) return null;

  try {
    console.log(`📊 Attempting to fetch document ${documentId} from ${collectionName}...`);

    const { initializeFirebaseWithFallback } = await import("./firebase");
    const { app, db } = await initializeFirebaseWithFallback();

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log(`🌐 Using REST API fallback for document fetch...`);
      const url = `https://firestore.googleapis.com/v1/projects/reme-57c1b/databases/(default)/documents/${collectionName}/${documentId}`;
      const response = await fetch(url);
      if (!response.ok) return null;
      const data = await response.json();
      return convertFirestoreDocument(data);
    }

    // Use normal Firestore SDK
    const { doc, getDoc } = await import("firebase/firestore");
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const document = {
        id: docSnap.id,
        ...docSnap.data(),
      };
      console.log(`✅ Successfully fetched document ${documentId}`);
      return document;
    } else {
      console.log(`❌ Document ${documentId} not found`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching document ${documentId}:`, error);
    return null;
  }
}

// Get all collections
export async function getAllCollections(): Promise<string[]> {
  if (!isClient) return [];

  try {
    console.log("📊 Attempting to fetch all collections...");

    const { initializeFirebaseWithFallback } = await import("./firebase");
    const { app, db } = await initializeFirebaseWithFallback();

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      // For mock mode, return hardcoded collections that we know exist
      return ["users", "products", "skinAnalysis", "debug", "test"];
    }

    // For actual Firebase, this is trickier as there's no direct API for listing collections
    // We'll implement a workaround by fetching known collections
    return ["users", "products", "skinAnalysis", "debug", "test"];
    
    // Note: Firebase admin SDK has a listCollections method, but it's not available in client SDK
    // If you need a complete dynamic list, you'd need a backend endpoint that uses admin SDK
  } catch (error) {
    console.error("❌ Error fetching collections:", error);
    return [];
  }
}

export async function getUserSkinAnalyses(userId: string): Promise<SkinAnalysis[]> {
  if (!isClient) return []

  try {
    console.log(`📊 Attempting to fetch skin analyses for user ${userId}...`)

    const { initializeFirebaseWithFallback } = await import("./firebase")
    const { app, db } = await initializeFirebaseWithFallback()

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for user's skinAnalysis...")
      // For REST API, we need to query documents with a filter
      const projectId = "reme-57c1b"
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/skinAnalysis`
      
      console.log(`🌐 Fetching user's skinAnalysis via REST API...`)
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`REST API request failed: ${response.status}`)
      }

      const data = await response.json()
      console.log(`✅ REST API: Fetched ${data.documents?.length || 0} analyses for user ${userId}`)

      return (data.documents || []).map(convertFirestoreDocument) as SkinAnalysis[]
    }

    // Use normal Firestore SDK
    const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore")
    
    // Access the nested collection
    const analysisRef = collection(db, `users/${userId}/skinAnalysis`)
    const snapshot = await getDocs(query(analysisRef, orderBy("timestamp", "desc"), limit(20)))

    const analyses = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as SkinAnalysis[]

    console.log(`✅ Successfully fetched ${analyses.length} skin analyses for user ${userId}`)
    return analyses
  } catch (error) {
    console.error(`❌ Error fetching skin analyses for user ${userId}:`, error)
    return []
  }
}

// Optional: Get a specific skin analysis for a user
export async function getUserSkinAnalysis(userId: string, analysisId: string): Promise<SkinAnalysis | null> {
  if (!isClient) return null

  try {
    console.log(`📊 Attempting to fetch skin analysis ${analysisId} for user ${userId}...`)

    const { initializeFirebaseWithFallback } = await import("./firebase")
    const { app, db } = await initializeFirebaseWithFallback()

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for specific user's skin analysis...")
      const projectId = "reme-57c1b"
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/skinAnalysis/${analysisId}`
      
      const response = await fetch(url)
      if (!response.ok) return null
      
      const data = await response.json()
      return convertFirestoreDocument(data) as SkinAnalysis
    }

    // Use normal Firestore SDK
    const { doc, getDoc } = await import("firebase/firestore")
    const docRef = doc(db, `users/${userId}/skinAnalysis/${analysisId}`)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const analysis = {
        id: docSnap.id,
        ...docSnap.data(),
      } as SkinAnalysis
      
      console.log(`✅ Successfully fetched skin analysis ${analysisId} for user ${userId}`)
      return analysis
    } else {
      console.log(`❌ Skin analysis ${analysisId} not found for user ${userId}`)
      return null
    }
  } catch (error) {
    console.error(`❌ Error fetching skin analysis ${analysisId} for user ${userId}:`, error)
    return null
  }
}
