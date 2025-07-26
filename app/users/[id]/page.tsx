"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { getDocument, getUserSkinAnalyses } from "@/lib/firebase-service"
import { User, SkinAnalysis } from "@/lib/firebase-service"
import { ArrowLeft, Calendar, UserIcon } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Tabs, TabsContent, TabsTrigger } from "@radix-ui/react-tabs"
import { TabsList } from "@/components/ui/tabs"

export default function UserDetailsPage() {
  const { id } = useParams()
  const [user, setUser] = useState<User | null>(null)
  const [skinAnalyses, setSkinAnalyses] = useState<SkinAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      
      try {
        // Fetch user details
        const userData = await getDocument("users", id as string) as User | null
        setUser(userData)
        
        // Fetch user's skin analyses
        if (userData) {
          const analyses = await getUserSkinAnalyses(id as string)
          setSkinAnalyses(analyses)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchUserData()
    }
  }, [id])
  
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Details</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/users">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">User Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>The user with ID {id} could not be found.</p>
            <Button asChild className="mt-4">
              <Link href="/users">Return to Users</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">User Profile</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative h-24 w-24 rounded-full overflow-hidden mb-4">
                {user.photoURL ? (
                  <Image 
                    src={user.photoURL}
                    alt={user.displayName || "User"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-muted flex items-center justify-center">
                    <UserIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold">{user.displayName || "Anonymous User"}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-4 text-sm w-full">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Provider</span>
                  <span>{user.provider || "Email"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(user.createdAt?.toString() || "").toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Last Active</span>
                  <span>{new Date(user.lastLoginAt?.toString() || "").toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Skin Analysis Content */}
        <div className="md:col-span-2">
          <Tabs defaultValue="analyses">
            <TabsList>
              <TabsTrigger value="analyses">Skin Analyses</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            
            <TabsContent value="analyses">
              <Card>
                <CardHeader>
                  <CardTitle>Skin Analyses History</CardTitle>
                  <CardDescription>
                    {skinAnalyses.length 
                      ? `${skinAnalyses.length} analyses found` 
                      : "No skin analyses found for this user"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {skinAnalyses.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p>No skin analyses available for this user.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {skinAnalyses.map((analysis) => (
                        <Card key={analysis.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                              {analysis.imagePath && (
                                <div className="relative h-32 w-32 rounded-md overflow-hidden shrink-0">
                                  <Image
                                    src={analysis.imagePath}
                                    alt="Skin Analysis"
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                  <h3 className="font-medium">Analysis #{analysis.id.slice(0, 6)}</h3>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(analysis.timestamp?.toString() || "").toLocaleString()}
                                  </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Firmness:</span> {analysis.firmness}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Pores:</span> {analysis.pores}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Pimples:</span> {analysis.pimples}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Redness:</span> {analysis.redness}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Sagging:</span> {analysis.sagging}
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-muted-foreground">Skin Age:</span> {analysis.skinAge}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle>Personalized Recommendations</CardTitle>
                  <CardDescription>Products recommended based on skin analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    This feature is coming soon.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}