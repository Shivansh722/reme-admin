"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, ExternalLink, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getProducts, type Product } from "@/lib/firebase-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg width='40' height='40' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'>No Image</text></svg>"

export function ProductTable({ search, refreshKey }: { search: string, refreshKey: number }) {
  const [products, setProducts] = useState<Product[]>([])
  const [latestProducts, setLatestProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20
  const maxPages = 5

  useEffect(() => {
    console.log("ProductTable component mounted")
    
    // Log component state
    console.log("Current state:", { 
      loading, 
      products: products.length, 
      error, 
      currentPage
    })
    
    async function fetchProducts() {
      setLoading(true)
      try {
        let productData: Product[] = []
        if (currentPage === 1) {
          // Fetch enough to fill latest + page
          const { products: all } = await getProducts(1, productsPerPage + 3)
          const latestIds = new Set(latestProducts.map(p => p.id))
          productData = all.filter(p => !latestIds.has(p.id)).slice(0, productsPerPage)
        } else {
          const { products: paged } = await getProducts(currentPage, productsPerPage)
          productData = paged
        }
        setProducts(productData)
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [currentPage, refreshKey, latestProducts])

  useEffect(() => {
    async function fetchLatest() {
      try {
        const { products: latest } = await getProducts(1, 3)
        setLatestProducts(latest)
      } catch (e) {
        setLatestProducts([])
      }
    }
    fetchLatest()
  }, [refreshKey])

  const totalPages = maxPages

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

  // Filter out latest products from paginated products
  const latestIds = new Set(latestProducts.map(p => p.id))
  const paginatedWithoutLatest = products.filter(p => !latestIds.has(p.id))

  // Filter both lists by search
  const q = search.trim().toLowerCase()
  const filterFn = (product: Product) =>
    !q ||
    (product.productName && product.productName.toLowerCase().includes(q)) ||
    (product.brand && product.brand.toLowerCase().includes(q)) ||
    (product.category && product.category.toLowerCase().includes(q))

  const filteredLatest = latestProducts.filter(filterFn)
  const filteredPaginated = paginatedWithoutLatest.filter(filterFn)

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

  if (filteredPaginated.length === 0 && filteredLatest.length === 0) {
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
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Links</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Latest products always at the top */}
          {filteredLatest.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <img
                          src={product.imageUrl || PLACEHOLDER_IMG}
                          alt={product.productName}
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = PLACEHOLDER_IMG
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <img
                          src={product.imageUrl || PLACEHOLDER_IMG}
                          alt={product.productName}
                          className="max-w-[200px] max-h-[200px] object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = PLACEHOLDER_IMG
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
          {/* Paginated products below */}
          {filteredPaginated.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <img
                          src={product.imageUrl || PLACEHOLDER_IMG}
                          alt={product.productName}
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = PLACEHOLDER_IMG
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <img
                          src={product.imageUrl || PLACEHOLDER_IMG}
                          alt={product.productName}
                          className="max-w-[200px] max-h-[200px] object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null
                            e.currentTarget.src = PLACEHOLDER_IMG
                          }}
                        />
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
