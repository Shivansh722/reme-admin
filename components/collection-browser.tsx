"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Database, File } from "lucide-react";
import { getAllCollections, getCollection, getDocument } from "@/lib/firebase-service";
import { Skeleton } from "@/components/ui/skeleton";



export function CollectionBrowser() {
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState({
    collections: false,
    documents: false,
    document: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all collections
  useEffect(() => {
    async function fetchCollections() {
      setLoading((prev) => ({ ...prev, collections: true }));
      const fetchedCollections = await getAllCollections();
      setCollections(fetchedCollections);
      setLoading((prev) => ({ ...prev, collections: false }));
    }

    fetchCollections();
  }, []);

  // Fetch documents when a collection is selected
  useEffect(() => {
    if (!selectedCollection) return;

    async function fetchDocuments() {
      setLoading((prev) => ({ ...prev, documents: true }));
      setSelectedDocument(null);
      const fetchedDocuments = await getCollection(selectedCollection as string);
      setDocuments(fetchedDocuments);
      setLoading((prev) => ({ ...prev, documents: false }));
    }

    fetchDocuments();
  }, [selectedCollection]);

  // Fetch a single document when selected
  async function handleDocumentSelect(docId: string) {
    setLoading((prev) => ({ ...prev, document: true }));
    if (!selectedCollection) return;
    
    const document = await getDocument(selectedCollection, docId);
    setSelectedDocument(document);
    setLoading((prev) => ({ ...prev, document: false }));
  }

  // Filter documents based on search query
  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery) return true;
    
    // Search by ID
    if (doc.id.toLowerCase().includes(searchQuery.toLowerCase())) return true;
    
    // Search in fields (basic implementation)
    return Object.values(doc).some(
      (value) => typeof value === "string" && value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Render function for document fields
  function renderDocumentField(value: any, key: string) {
    if (value === null || value === undefined) return <span className="text-muted-foreground">null</span>;
    
    if (typeof value === "object" && value.toDate) {
      return new Date(value.toDate()).toLocaleString();
    }
    
    if (typeof value === "object") {
      return <pre className="text-xs overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
    }
    
    if (typeof value === "boolean") {
      return value ? "true" : "false";
    }
    
    if (key === "photoURL" || key === "imageUrl" || key.includes("image")) {
      return (
        <div className="flex flex-col gap-1">
          <span className="truncate max-w-[300px] text-xs">{value}</span>
          {typeof value === "string" && value.startsWith("http") && (
            <img src={value} alt="Preview" className="h-16 w-16 object-cover rounded border" />
          )}
        </div>
      );
    }
    
    return <span className="truncate max-w-[300px]">{String(value)}</span>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Collections List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Collections
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading.collections ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {collections.map((collection) => (
                <Button
                  key={collection}
                  variant={selectedCollection === collection ? "default" : "outline"}
                  className="w-full justify-between"
                  onClick={() => setSelectedCollection(collection)}
                >
                  {collection}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-4 w-4" /> Documents 
            {selectedCollection && <span className="text-muted-foreground">({selectedCollection})</span>}
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {!selectedCollection ? (
            <div className="text-center py-8 text-muted-foreground">
              Select a collection to view documents
            </div>
          ) : loading.documents ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
           
              <div className="space-y-1">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">No documents found</div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <Button
                      key={doc.id}
                      variant={selectedDocument?.id === doc.id ? "default" : "outline"}
                      className="w-full justify-between text-left"
                      onClick={() => handleDocumentSelect(doc.id)}
                    >
                      <span className="truncate">{doc.id}</span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </Button>
                  ))
                )}
              </div>
          
          )}
        </CardContent>
      </Card>

      {/* Document Detail */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Document Details</CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDocument ? (
            <div className="text-center py-8 text-muted-foreground">
              {loading.document 
                ? "Loading document..." 
                : selectedCollection 
                  ? "Select a document to view details" 
                  : "Select a collection and document"
              }
            </div>
          ) : (
    
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Field</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(selectedDocument).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium">{key}</TableCell>
                      <TableCell>{renderDocumentField(value, key)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

          )}
        </CardContent>
      </Card>
    </div>
  );
}