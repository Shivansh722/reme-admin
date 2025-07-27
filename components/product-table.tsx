"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ExternalLink, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getProducts, type Product } from "@/lib/firebase-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const productsPerPage = 20

  useEffect(() => {
    console.log("ProductTable component mounted")
    
    // Log component state
    console.log("Current state:", { 
      loading, 
      products: products.length, 
      error, 
      currentPage, 
      totalProducts
    })
    
    async function fetchProducts() {
      setLoading(true)
      console.log(`Fetching products from Firebase (page ${currentPage}, limit ${productsPerPage})...`)
      
      try {
        console.log("Calling getProducts function...")
        const { products: productData, total } = await getProducts(currentPage, productsPerPage)
        console.log(`Successfully fetched ${productData.length} products (page ${currentPage}/${Math.ceil(total/productsPerPage)})`)
        
        if (productData.length === 0) {
          console.log("⚠️ Warning: No products returned from getProducts")
        } else {
          console.log("First product:", productData[0])
        }
        
        setProducts(productData)
        setTotalProducts(total)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error("Error loading products:", error)
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentPage])

  const totalPages = Math.ceil(totalProducts / productsPerPage)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Loading product data from Firebase (page {currentPage})...</p>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 rounded-md">
        <h2 className="text-lg font-semibold text-red-700">Error Loading Products</h2>
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-sm text-gray-600 mt-2">Please check your Firebase connection and try again.</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="p-4 border border-gray-300 bg-gray-50 rounded-md">
        <h2 className="text-lg font-semibold">No Products Found</h2>
        <p className="text-sm text-gray-600">No products available in the database.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Recommendation Management</h2>
        <p className="text-sm text-gray-500">
          Showing {(currentPage - 1) * productsPerPage + 1}-{Math.min(currentPage * productsPerPage, totalProducts)} of {totalProducts} products
        </p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Ingredients</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {product.imageUrl && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.productName}
                            className="w-10 h-10 rounded object-cover"
                            onError={(e) => {
                              console.log(`Failed to load image for product: ${product.productName}`)
                              e.currentTarget.src = "/placeholder.svg"
                              e.currentTarget.onerror = null
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <img
                            src={product.imageUrl}
                            alt={product.productName}
                            className="max-w-[200px] max-h-[200px] object-contain"
                          />
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {product.productName || "Unknown Product"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{product.category || "Uncategorized"}</Badge>
              </TableCell>
              <TableCell>{product.brand || "Unknown Brand"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{product.evaluationScore || 0}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate" title={product.description}>
                        {product.description || "No description available"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      {product.description || "No description available"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="max-w-xs">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="truncate">
                        {product.ingredients ? `${product.ingredients.slice(0, 30)}...` : "No ingredients listed"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      {product.ingredients || "No ingredients listed"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {product.productUrl && (
                    <a href={product.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => console.log("Edit product:", product)}>
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Pagination controls */}
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePreviousPage} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextPage} 
          disabled={currentPage === totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
