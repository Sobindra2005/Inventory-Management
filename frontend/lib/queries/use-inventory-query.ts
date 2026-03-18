import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api/inventory";
import { isInventoryDemoFallbackEnabled } from "@/lib/config/inventory-demo";
import type {
  AddInventoryProductRequest,
  InventoryListResponse,
  InventoryQueryParams,
  UpdateInventoryProductRequest,
} from "@/lib/contracts/inventory";
import { inventorySampleData } from "@/lib/demo/inventory-sample-data";

export const inventoryQueryKeys = {
  all: ["inventory"] as const,
  list: (params?: InventoryQueryParams) =>
    [...inventoryQueryKeys.all, "list", params] as const,
};

const applyInventoryFilters = (
  source: InventoryListResponse,
  params?: InventoryQueryParams
): InventoryListResponse => {
  const search = params?.search?.trim().toLowerCase();
  const category = params?.category?.trim().toLowerCase();
  const lowStockOnly = params?.lowStockOnly ?? false;

  const filteredProducts = source.products.filter((product) => {
    const matchesSearch =
      !search ||
      product.name.toLowerCase().includes(search) ||
      product.barcode.toLowerCase().includes(search);

    const matchesCategory =
      !category || category === "all" || product.category.toLowerCase() === category;

    const isLowStock = product.stock <= product.lowStockThreshold;
    const matchesLowStock = !lowStockOnly || isLowStock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const categories = Array.from(
    new Set(source.products.map((product) => product.category))
  );

  return {
    products: filteredProducts,
    totalCount: filteredProducts.length,
    categories,
  };
};

const withInventoryFallback = async (
  request: () => Promise<InventoryListResponse>,
  params?: InventoryQueryParams
): Promise<InventoryListResponse> => {
  try {
    return await request();
  } catch (error) {
    if (!isInventoryDemoFallbackEnabled) {
      throw error;
    }

    console.warn(
      "[inventory-demo-fallback] Using sample inventory data. Set NEXT_PUBLIC_INVENTORY_DEMO_FALLBACK=false to disable.",
      error
    );

    return applyInventoryFilters(inventorySampleData, params);
  }
};

export const useInventoryList = (params?: InventoryQueryParams) => {
  return useQuery<InventoryListResponse>({
    queryKey: inventoryQueryKeys.list(params),
    queryFn: () =>
      withInventoryFallback(() => inventoryApi.fetchInventory(params), params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};

export const useAddInventoryProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddInventoryProductRequest) => inventoryApi.addProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
};

export const useUpdateInventoryProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateInventoryProductRequest;
    }) => inventoryApi.updateProduct(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
};

export const useUpdateInventoryStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      inventoryApi.updateStock(id, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
};

export const useDeleteInventoryProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.all });
    },
  });
};
