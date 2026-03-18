import { z } from "zod";

export const addInventoryProductSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  barcode: z.string().min(4, "Barcode is required"),
  stock: z.number().int().min(0, "Stock must be 0 or more"),
  price: z.number().min(0, "Price must be 0 or more"),
  category: z.string().min(2, "Category is required"),
  lowStockThreshold: z
    .number()
    .int()
    .min(1, "Low stock threshold must be at least 1"),
});

export type AddInventoryProductFormData = z.infer<
  typeof addInventoryProductSchema
>;

export const addInventoryProductDefaults: AddInventoryProductFormData = {
  name: "",
  barcode: "",
  stock: 0,
  price: 0,
  category: "",
  lowStockThreshold: 10,
};
