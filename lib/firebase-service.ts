import type { Timestamp } from "firebase/firestore"
import { collection, getDocs, query, limit, orderBy, startAfter, getCountFromServer, addDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { getApp } from "firebase/app"

const isClient = typeof window !== "undefined"

// Add this import statement to get the db object

// Or modify the getProducts function to use the Firebase initialization

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

export type Product = {
  id: string;
  productName: string;
  brand: string;
  category: string;
  description: string;
  imageUrl: string;
  productUrl: string;
  externalUrl: string;
  evaluationScore: number | string;
  tags: string;
  volumePrice: string;
  reviewCount: string;
};

// Define return type for getProducts function
export type ProductsResponse = {
  products: Product[];
  total: number;
};

export async function getProducts(page = 1, productsPerPage = 20): Promise<ProductsResponse> {
  console.log(`Firebase query: Getting products for page ${page}, limit ${productsPerPage}`);
  
  if (!isClient) {
    console.log("Server-side rendering detected, returning empty products");
    return { products: [], total: 0 };
  }
  
  try {
    console.log("Importing initializeFirebaseWithFallback...");
    const { initializeFirebaseWithFallback } = await import("./firebase");
    console.log("Initializing Firebase with fallback...");
    const { app, db } = await initializeFirebaseWithFallback();
    console.log("Firebase initialized:", db ? "Success" : "Failed");
    
    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for products...");
      const documents = await fetchFromFirestoreREST("products", productsPerPage);
      console.log(`✅ REST API: Fetched ${documents.length} products`, documents);
      
      // For simplicity in the REST API fallback, we'll return all fetched products
      // without proper pagination
      const convertedProducts = documents.map(convertFirestoreDocument) as Product[];
      console.log("Converted products:", convertedProducts);
      return { products: convertedProducts, total: documents.length };
    }
    
    // Continue with the original implementation using the db from initializeFirebaseWithFallback
    console.log("Using standard Firestore SDK");
    const productsRef = collection(db, 'products');
    console.log("Created collection reference for 'products'");
    
    // Get total count for pagination
    console.log("Getting count from server...");
    const snapshot = await getCountFromServer(productsRef);
    const total = snapshot.data().count;
    console.log(`Total products in collection: ${total}`);
  
  
    
    // Try a simple query first without any ordering or pagination
    console.log("Trying a simple query first to check access...");
    const simpleQuery = query(productsRef, limit(1));
    const simpleQuerySnapshot = await getDocs(simpleQuery);
    console.log(`Simple query returned ${simpleQuerySnapshot.docs.length} documents`);
    
    if (simpleQuerySnapshot.docs.length > 0) {
      const sampleDoc = simpleQuerySnapshot.docs[0];
      console.log("Sample document exists:", sampleDoc.id);
      console.log("Sample document data keys:", Object.keys(sampleDoc.data()));
      console.log("Sample product name:", sampleDoc.data().productName);
    } else {
      console.error("⚠️ WARNING: Simple query returned no documents despite count showing records exist");
      console.log("Trying alternative query approach...");
      
      // Try without the productName ordering that might be causing issues
      const alternativeQuery = query(productsRef, limit(productsPerPage));
      const alternativeSnapshot = await getDocs(alternativeQuery);
      console.log(`Alternative query returned ${alternativeSnapshot.docs.length} documents`);
      
      if (alternativeSnapshot.docs.length > 0) {
        console.log("Alternative query successful, using this approach");
        const products = alternativeSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            productName: data["商品名"] || data.productName || "",
            brand: data["ブランド名"] || data.brand || "",
            category: data["カテゴリ"] || data.category || "",
            description: data["商品詳細"] || data.description || "",
            imageUrl: data["商品画像URL"] || data.imageUrl || "",
            productUrl: data["商品URL"] || data.productUrl || "",
            externalUrl: data["外部URL"] || data.externalUrl || "",
            evaluationScore: data["評価スコア"] || data.evaluationScore || "",
            tags: data["タグ"] || data.tags || "",
            volumePrice: data["容量・参考価格"] || data.volumePrice || "",
            reviewCount: data["口コミ件数"] || data.reviewCount || "",
          };
        });
        
        console.log(`Retrieved ${products.length} products using alternative approach`);
        return { products, total };
      }
    }
    
    if (total === 0) {
      console.log("⚠️ Warning: No products found in the database");
      return { products: [], total: 0 };
    }

    // Create base query
    console.log(`Creating query for page ${page} with limit ${productsPerPage}`);
    // Try without ordering since that might be causing issues
    let productsQuery = query(
      productsRef,
      orderBy("createdAt", "desc"), // <-- Add this line
      limit(productsPerPage)
    );

    // If not the first page, use startAfter with pagination
    if (page > 1) {
      console.log(`Getting previous page documents for pagination (page ${page})`);
      // Get the last document from the previous page
      const previousPageQuery = query(
        productsRef,
        limit((page - 1) * productsPerPage)
      );
      const previousPageDocs = await getDocs(previousPageQuery);
      console.log(`Previous page query returned ${previousPageDocs.docs.length} docs`);
      
      if (previousPageDocs.docs.length === 0) {
        console.log("⚠️ Warning: Previous page has no documents, returning empty result");
        return { products: [], total };
      }
      
      const lastVisibleDoc = previousPageDocs.docs[previousPageDocs.docs.length - 1];
      console.log(`Got last visible doc with ID: ${lastVisibleDoc.id}`);
      
      // Apply startAfter to the query
      productsQuery = query(
        productsRef,
        startAfter(lastVisibleDoc),
        limit(productsPerPage)
      );
      console.log("Created pagination query with startAfter");
    }

    // Execute query
    console.log("Executing query...");
    const querySnapshot = await getDocs(productsQuery);
    console.log(`Query returned ${querySnapshot.docs.length} documents`);
    
    // Map documents to Product objects
    const products: Product[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const mapped = {
        id: doc.id,
        productName: data["商品名"] || data.productName || "",
        brand: data["ブランド名"] || data.brand || "",
        category: data["カテゴリ"] || data.category || "",
        description: data["商品詳細"] || data.description || "",
        imageUrl: data["商品画像URL"] || data.imageUrl || "",
        productUrl: data["商品URL"] || data.productUrl || "",
        externalUrl: data["外部URL"] || data.externalUrl || "",
        evaluationScore: data["評価スコア"] || data.evaluationScore || "",
        tags: data["タグ"] || data.tags || "",
        volumePrice: data["容量・参考価格"] || data.volumePrice || "",
        reviewCount: data["口コミ件数"] || data.reviewCount || "",
      };
      console.log(`Mapped product: ${mapped.id} - ${mapped.productName}`);
      return mapped;
    });

    console.log(`Retrieved ${products.length} products for page ${page}:`, products);
    return { products, total };
  } catch (error) {
    console.error("Error fetching products from Firestore:", error);
    // Log more details about the error
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
      console.error(`Error stack: ${error.stack}`);
    }
    throw error;
  }
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

export async function getSkinAnalyses(): Promise<SkinAnalysis[]> {
  if (!isClient) return []

  try {
    console.log("📊 Attempting to fetch all skin analyses...")

    const { initializeFirebaseWithFallback } = await import("./firebase")
    const { app, db } = await initializeFirebaseWithFallback()

    // Check if we're using fallback mode
    if (isMockFirestore(db)) {
      console.log("🌐 Using REST API fallback for skin analyses...")
      // For simplicity, we'll fetch users first, then their analyses
      const users = await fetchFromFirestoreREST("users", 50)
      
      let allAnalyses: SkinAnalysis[] = []
      
      // Fetch analyses for each user
      for (const user of users) {
        const projectId = "reme-57c1b" // Your project ID
        const userId = user.id
        const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}/skinAnalysis?pageSize=50`
        
        console.log(`🌐 Fetching skin analyses for user ${userId} via REST API...`)
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          const userAnalyses = (data.documents || []).map((doc: any) => ({
            ...convertFirestoreDocument(doc),
            userId // Add the user ID for reference
          }))
          allAnalyses = [...allAnalyses, ...userAnalyses]
        }
      }
      
      console.log(`✅ Successfully fetched ${allAnalyses.length} skin analyses via REST API`)
      return allAnalyses as SkinAnalysis[]
    }

    // Use normal Firestore SDK, but fetch user by user to avoid collectionGroup index requirement
    const { collection, getDocs, query, orderBy, limit } = await import("firebase/firestore")
    
    // First get all users
    const usersRef = collection(db, "users")
    const usersSnapshot = await getDocs(query(usersRef, limit(50)))
    
    let allAnalyses: SkinAnalysis[] = []
    
    // Then fetch analyses for each user
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id
      console.log(`Fetching skin analyses for user ${userId}...`)
      
      const analysisRef = collection(db, `users/${userId}/skinAnalysis`)
      // Note: We still use orderBy but it's on a specific collection path, not a collection group
      const snapshot = await getDocs(query(analysisRef, orderBy("timestamp", "desc"), limit(20)))
      
      const userAnalyses = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          userId: userId,
          analysisResults: data.analysisResults,
          firmness: data.firmness,
          pimples: data.pimples,
          pores: data.pores,
          redness: data.redness,
          sagging: data.sagging,
          skinAge: data.skinAge,
          skinGrade: data.skinGrade,
          imagePath: data.imagePath,
          timestamp: data.timestamp,
        } as SkinAnalysis
      })
      
      allAnalyses = [...allAnalyses, ...userAnalyses]
    }

    console.log(`✅ Successfully fetched ${allAnalyses.length} skin analyses`)
    return allAnalyses
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

// New user registration function
export async function createUserWithEmail({
  email,
  password,
  displayName,
}: { email: string; password: string; displayName: string }) {
  const auth = getAuth(getApp())
  const db = getFirestore(getApp())
  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const user = userCredential.user
  // Optionally set display name
  if (displayName) {
    await updateProfile(user, { displayName })
  }
  // Add user doc in Firestore
  await setDoc(doc(db, "users", user.uid), {
    email,
    displayName,
    provider: "email",
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
    photoURL: null,
  })
  return user
}

/**
 * Adds a new product to the Firestore "products" collection.
 * Accepts an object with Japanese field names as used in your form.
 */
export async function addProduct(product: Record<string, any>) {
  if (typeof window === "undefined") {
    console.log("[addProduct] Not running in browser, aborting.")
    return
  }

  console.log("[addProduct] Initializing Firebase for product add...", product)
  const { initializeFirebaseWithFallback } = await import("./firebase")
  const { db } = await initializeFirebaseWithFallback()

  if (!db || (db as any)._type === "mock") {
    console.log("[addProduct] Firestore is not available or running in mock mode.")
    alert("Firestore is not available or running in mock mode.")
    return
  }

  const firestoreDb = db as import("firebase/firestore").Firestore

  const { collection, addDoc, serverTimestamp } = await import("firebase/firestore")
  const productsRef = collection(firestoreDb, "products")
  const payload = { ...product, createdAt: serverTimestamp() }
  console.log("[addProduct] Adding document to Firestore:", payload)
  const docRef = await addDoc(productsRef, payload)
  console.log("[addProduct] Document added with ID:", docRef.id)
  return docRef.id
}


export async function importProductsFromCsv(products: Product[]) {
  const { initializeFirebaseWithFallback } = await import("./firebase");
  const { db } = await initializeFirebaseWithFallback();

  const { collection, doc, setDoc } = await import("firebase/firestore");

  const firestoreDb = db as import("firebase/firestore").Firestore;
  const batchPromises = products.map(async (product) => {
    // Use product.id as doc id, or generate one if not present
    const docId = product.id || crypto.randomUUID();
    await setDoc(doc(collection(firestoreDb, "products"), docId), { ...product, id: docId }, { merge: true });
  });
  await Promise.all(batchPromises);
}

