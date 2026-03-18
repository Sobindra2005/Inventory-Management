import { httpClient } from "./http-client";
import type {
  AddInventoryProductRequest,
  InventoryListResponse,
  InventoryProduct,
  InventoryQueryParams,
  UpdateInventoryProductRequest,
  UpdateInventoryStockRequest,
} from "@/lib/contracts/inventory";

export const inventoryApi = {
  fetchInventory: async (
    params?: InventoryQueryParams
  ): Promise<InventoryListResponse> => {
    const response = await httpClient.get<InventoryListResponse>(
      "/api/v1/inventory",
      {
        params,
      }
    );
    return response.data;
  },

  addProduct: async (
    payload: AddInventoryProductRequest
  ): Promise<InventoryProduct> => {
    const response = await httpClient.post<InventoryProduct>(
      "/api/v1/inventory",
      payload
    );
    return response.data;
  },

  updateProduct: async (
    id: string,
    payload: UpdateInventoryProductRequest
  ): Promise<InventoryProduct> => {
    const response = await httpClient.put<InventoryProduct>(
      `/api/v1/inventory/${id}`,
      payload
    );
    return response.data;
  },

  updateStock: async (
    id: string,
    payload: UpdateInventoryStockRequest
  ): Promise<InventoryProduct> => {
    const response = await httpClient.patch<InventoryProduct>(
      `/api/v1/inventory/${id}/stock`,
      payload
    );
    return response.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await httpClient.delete(`/api/v1/inventory/${id}`);
  },
};
