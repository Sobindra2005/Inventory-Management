export interface InventoryProduct {
  id: string;
  name: string;
  barcode: string;
  stock: number;
  price: number;
  category: string;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryListResponse {
  products: InventoryProduct[];
  totalCount: number;
  categories: string[];
}

export interface AddInventoryProductRequest {
  name: string;
  barcode: string;
  stock: number;
  price: number;
  category: string;
  lowStockThreshold: number;
}

export interface UpdateInventoryProductRequest {
  name: string;
  barcode: string;
  stock: number;
  price: number;
  category: string;
  lowStockThreshold: number;
}

export interface UpdateInventoryStockRequest {
  stock: number;
}

export interface InventoryQueryParams {
  search?: string;
  category?: string;
  lowStockOnly?: boolean;
}
