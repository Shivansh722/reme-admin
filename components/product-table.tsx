"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, ExternalLink, Star, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { getProducts, type Product } from "@/lib/firebase-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"



const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg width='40' height='40' xmlns='http://www.w3.org/2000/svg'><rect width='100%' height='100%' fill='%23e5e7eb'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='10' fill='%239ca3af'>No Image</text></svg>"

export function ProductTable({ search, refreshKey }: { search: string, refreshKey: number }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 20
  const [hasNextPage, setHasNextPage] = useState(false)
  const [pageCursors, setPageCursors] = useState<(string | null)[]>([null])

  useEffect(() => {
    let ignore = false
    async function fetchProducts() {
      console.log(`📱 COMPONENT: Starting fetchProducts for page ${currentPage}, refreshKey: ${refreshKey}`);
      setLoading(true)
      try {
        const cursor = pageCursors[currentPage - 1] || null
        console.log(`📱 COMPONENT: Using cursor: ${cursor} for page ${currentPage}`);
        
        const { products: fetched, total, lastDocId } = await getProducts(productsPerPage, cursor)
        
        if (!ignore) {
          console.log(`📱 COMPONENT: Received ${fetched.length} products, lastDocId: ${lastDocId}`);
          setProducts(fetched)
          setHasNextPage(!!lastDocId && fetched.length === productsPerPage)
          
          // Save cursor for next page
          if (lastDocId && pageCursors.length === currentPage) {
            console.log(`📱 COMPONENT: Saving cursor ${lastDocId} for next page`);
            setPageCursors(prev => [...prev, lastDocId])
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error(`📱 COMPONENT ERROR:`, error);
          setError(error instanceof Error ? error.message : String(error))
        }
      } finally {
        if (!ignore) {
          console.log(`📱 COMPONENT: Finished loading page ${currentPage}`);
          setLoading(false)
        }
      }
    }
    fetchProducts()
    return () => { 
      console.log(`📱 COMPONENT: Cleanup for page ${currentPage}`);
      ignore = true 
    }
  }, [currentPage, refreshKey, pageCursors])

  const handlePreviousPage = () => {
    console.log(`📱 NAVIGATION: Going to previous page (${currentPage - 1})`);
    if (currentPage > 1) setCurrentPage(currentPage - 1)
  }

  const handleNextPage = () => {
    console.log(`📱 NAVIGATION: Going to next page (${currentPage + 1})`);
    if (hasNextPage) setCurrentPage(currentPage + 1)
  }

  const q = search.trim().toLowerCase()
  const filteredProducts = products.filter(product =>
    !q ||
    (product.productName && product.productName.toLowerCase().includes(q)) ||
    (product.brand && product.brand.toLowerCase().includes(q)) ||
    (product.category && product.category.toLowerCase().includes(q))
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">Firebaseから商品データを読み込み中（{currentPage}ページ目）...</p>
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
        <h2 className="text-lg font-semibold text-red-700">商品データの読み込みエラー</h2>
        <p className="text-sm text-red-600">{error}</p>
        <p className="text-sm text-gray-600 mt-2">Firebase接続を確認し、再度お試しください。</p>
      </div>
    )
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="p-4 border border-gray-300 bg-gray-50 rounded-md">
        <h2 className="text-lg font-semibold">商品が見つかりません</h2>
        <p className="text-sm text-gray-600">データベースに商品がありません。</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">商品おすすめ管理</h2>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>商品名</TableHead>
            <TableHead>カテゴリ</TableHead>
            <TableHead>ブランド</TableHead>
            <TableHead>評価スコア</TableHead>
            <TableHead>商品説明</TableHead>
            <TableHead>リンク</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.map((product) => (
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
                  {product.productName || "不明な商品"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{product.category || "未分類"}</Badge>
              </TableCell>
              <TableCell>{product.brand || "不明なブランド"}</TableCell>
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
                        {product.description || "説明なし"}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-md">
                      {product.description || "説明なし"}
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
                    <Edit className="h-4 w-4 mr-1" /> 編集
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-center space-x-2 py-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handlePreviousPage} 
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          前へ
        </Button>
        <span className="text-sm">
          ページ {currentPage}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleNextPage} 
          disabled={!hasNextPage}
        >
          次へ
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  )
}
