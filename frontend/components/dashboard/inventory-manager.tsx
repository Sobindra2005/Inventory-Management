"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { Search } from "lucide-react";
import {
    addInventoryProductDefaults,
    addInventoryProductSchema,
    type AddInventoryProductFormData,
} from "@/lib/forms/inventory";
import type { InventoryProduct } from "@/lib/contracts/inventory";
import {
    useAddInventoryProduct,
    useDeleteInventoryProduct,
    useInventoryList,
    useUpdateInventoryProduct,
    useUpdateInventoryStock,
} from "@/lib/queries/use-inventory-query";
import { requestPopupConfirm } from "@/lib/ui/popup-message";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { CustomSelect } from "@/components/ui/custom-select";

const formatPrice = (value: number) => `Rs.${value.toFixed(2)}`;

export const InventoryManager: React.FC = () => {
    const inventoryQuery = useInventoryList();
    const addMutation = useAddInventoryProduct();
    const updateMutation = useUpdateInventoryProduct();
    const updateStockMutation = useUpdateInventoryStock();
    const deleteMutation = useDeleteInventoryProduct();

    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [lowStockOnly, setLowStockOnly] = useState(false);
    const [editingStockId, setEditingStockId] = useState<string | null>(null);
    const [inlineStockValue, setInlineStockValue] = useState("");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<AddInventoryProductFormData>({
        resolver: zodResolver(addInventoryProductSchema),
        defaultValues: addInventoryProductDefaults,
    });

    useEffect(() => {
        if (inventoryQuery.data?.products) {
            setProducts(inventoryQuery.data.products);
        }
    }, [inventoryQuery.data]);

    const categoryOptions = useMemo(() => {
        const unique = new Set(products.map((item) => item.category));
        return [
            { value: "all", label: "All Categories" },
            ...Array.from(unique).map((category) => ({ value: category, label: category })),
        ];
    }, [products]);

    const filteredProducts = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                !searchTerm ||
                product.name.toLowerCase().includes(searchTerm) ||
                product.barcode.toLowerCase().includes(searchTerm);
            const matchesCategory =
                selectedCategory === "all" || product.category === selectedCategory;
            const isLowStock = product.stock <= product.lowStockThreshold;
            const matchesLowStock = !lowStockOnly || isLowStock;

            return matchesSearch && matchesCategory && matchesLowStock;
        });
    }, [products, search, selectedCategory, lowStockOnly]);

    const onAddOrEditSubmit = async (data: AddInventoryProductFormData) => {
        if (editingProductId) {
            const previous = [...products];
            setProducts((current) =>
                current.map((item) =>
                    item.id === editingProductId
                        ? {
                            ...item,
                            ...data,
                            updatedAt: new Date().toISOString(),
                        }
                        : item
                )
            );

            try {
                await updateMutation.mutateAsync({
                    id: editingProductId,
                    payload: data,
                });
            } catch (error) {
                setProducts(previous);
                console.warn("Update product failed, reverted local change", error);
            }
        } else {
            const shouldAdd = await requestPopupConfirm({
                title: "Add Product",
                message: `Add ${data.name} to inventory?`,
                confirmLabel: "Add",
                cancelLabel: "Cancel",
            });

            if (!shouldAdd) {
                return;
            }

            const optimisticProduct: InventoryProduct = {
                id: `local-${Date.now()}`,
                name: data.name,
                barcode: data.barcode,
                stock: data.stock,
                price: data.price,
                category: data.category,
                lowStockThreshold: data.lowStockThreshold,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            setProducts((current) => [optimisticProduct, ...current]);

            try {
                await addMutation.mutateAsync(data);
            } catch (error) {
                console.warn("Add product failed, keeping local demo data", error);
            }
        }

        reset(addInventoryProductDefaults);
        setEditingProductId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (product: InventoryProduct) => {
        setEditingProductId(product.id);
        setIsFormOpen(true);
        reset({
            name: product.name,
            barcode: product.barcode,
            stock: product.stock,
            price: product.price,
            category: product.category,
            lowStockThreshold: product.lowStockThreshold,
        });
    };

    const handleDelete = async (productId: string) => {
        const product = products.find((item) => item.id === productId);
        const shouldDelete = await requestPopupConfirm({
            title: "Delete Product",
            message: `Delete ${product?.name ?? "this product"} from inventory?`,
            confirmLabel: "Delete",
            cancelLabel: "Cancel",
        });

        if (!shouldDelete) {
            return;
        }

        const previous = [...products];
        setProducts((current) => current.filter((item) => item.id !== productId));

        try {
            await deleteMutation.mutateAsync(productId);
        } catch (error) {
            setProducts(previous);
            console.warn("Delete failed, reverted local change", error);
        }
    };

    const startInlineStockEdit = (product: InventoryProduct) => {
        setEditingStockId(product.id);
        setInlineStockValue(String(product.stock));
    };

    const commitInlineStock = async (productId: string) => {
        const parsed = Number(inlineStockValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
            setEditingStockId(null);
            return;
        }

        const nextStock = Math.floor(parsed);
        const previous = [...products];

        setProducts((current) =>
            current.map((item) =>
                item.id === productId
                    ? { ...item, stock: nextStock, updatedAt: new Date().toISOString() }
                    : item
            )
        );

        setEditingStockId(null);

        try {
            await updateStockMutation.mutateAsync({ id: productId, stock: nextStock });
        } catch (error) {
            setProducts(previous);
            console.warn("Inline stock update failed, reverted local change", error);
        }
    };

    const closeForm = () => {
        setEditingProductId(null);
        setIsFormOpen(false);
        reset(addInventoryProductDefaults);
    };

    const inventoryColumns = useMemo<DataTableColumn<InventoryProduct>[]>(
        () => [
            {
                id: "name",
                header: "Product Name",
                cell: (product) => (
                    <div className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{product.barcode}</span>
                    </div>
                ),
            },
            {
                id: "stock",
                header: "Stock",
                cell: (product) => {
                    const isLowStock = product.stock <= product.lowStockThreshold;
                    const isInlineEditing = editingStockId === product.id;

                    if (isInlineEditing) {
                        return (
                            <input
                                autoFocus
                                type="number"
                                min={0}
                                value={inlineStockValue}
                                onChange={(event) => setInlineStockValue(event.target.value)}
                                onBlur={() => commitInlineStock(product.id)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        event.preventDefault();
                                        commitInlineStock(product.id);
                                    }
                                    if (event.key === "Escape") {
                                        setEditingStockId(null);
                                    }
                                }}
                                className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                            />
                        );
                    }

                    return (
                        <button
                            type="button"
                            onClick={() => startInlineStockEdit(product)}
                            className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${
                                isLowStock
                                    ? "bg-destructive/15 text-destructive hover:bg-destructive/20"
                                    : "bg-muted text-foreground hover:bg-accent"
                            }`}
                            title="Click to edit stock inline"
                        >
                            {product.stock}
                        </button>
                    );
                },
            },
            {
                id: "price",
                header: "Price",
                cell: (product) => formatPrice(product.price),
            },
            {
                id: "category",
                header: "Category",
                cell: (product) => <span className="text-muted-foreground">{product.category}</span>,
            },
            {
                id: "actions",
                header: "Actions",
                cell: (product) => (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleEdit(product)}
                            className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
                        >
                            Edit
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDelete(product.id)}
                            className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                        >
                            Delete
                        </button>
                    </div>
                ),
            },
        ],
        [
            commitInlineStock,
            editingStockId,
            handleDelete,
            handleEdit,
            inlineStockValue,
            startInlineStockEdit,
        ],
    );

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Inventory</h1>
                <p className="text-muted-foreground">
                    Easy to view, edit, and control stock.
                </p>
            </div>

            {inventoryQuery.isError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Failed to load live inventory. Demo fallback may be disabled.
                </div>
            )}

            <DataTable
                title="Inventory Products"
                subtitle="Easy to view, edit, and control stock."
                columns={inventoryColumns}
                rows={filteredProducts}
                rowKey={(product) => product.id}
                isLoading={inventoryQuery.isLoading}
                loadingMessage="Loading inventory..."
                emptyMessage="No products match your filters."
                minWidthClassName="min-w-[760px]"
                filters={(
                    <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
                        <div className="flex-1">
                            <label className="mb-2 block text-xs font-medium text-muted-foreground">
                                Search
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Product name or barcode"
                                    className="w-full h-10 pl-10 pr-4 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                        </div>

                        <div className="w-full lg:w-48">
                            <CustomSelect
                                label="Category"
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                options={categoryOptions}
                            />
                        </div>

                        <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5 h-10">
                            <input
                                id="low-stock-only"
                                type="checkbox"
                                checked={lowStockOnly}
                                onChange={(event) => setLowStockOnly(event.target.checked)}
                                className="h-4 w-4 accent-primary cursor-pointer"
                            />
                            <label htmlFor="low-stock-only" className="text-sm text-foreground cursor-pointer select-none">
                                Low stock only
                            </label>
                        </div>
                    </div>
                )}
                actions={(
                    <button
                        type="button"
                        onClick={() => {
                            if (isFormOpen && !editingProductId) {
                                closeForm();
                            } else {
                                reset(addInventoryProductDefaults);
                                setEditingProductId(null);
                                setIsFormOpen(true);
                            }
                        }}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        Add Product
                    </button>
                )}
                beforeTable={(
                    <AnimatePresence>
                        {isFormOpen && (
                            <motion.form
                                onSubmit={handleSubmit(onAddOrEditSubmit)}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="grid gap-3 border-t border-border px-2 pt-5 md:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Product Name
                                    </label>
                                    <input
                                        {...register("name")}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Barcode
                                    </label>
                                    <input
                                        {...register("barcode")}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {errors.barcode && (
                                        <p className="mt-1 text-xs text-destructive">{errors.barcode.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Category
                                    </label>
                                    <input
                                        {...register("category")}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {errors.category && (
                                        <p className="mt-1 text-xs text-destructive">{errors.category.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Stock
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        {...register("stock", { valueAsNumber: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {errors.stock && (
                                        <p className="mt-1 text-xs text-destructive">{errors.stock.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Price
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        {...register("price", { valueAsNumber: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {errors.price && (
                                        <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Low Stock Threshold
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        {...register("lowStockThreshold", { valueAsNumber: true })}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                    />
                                    {errors.lowStockThreshold && (
                                        <p className="mt-1 text-xs text-destructive">
                                            {errors.lowStockThreshold.message}
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2 lg:col-span-3 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={closeForm}
                                        className="rounded-lg border border-border bg-background px-4 py-2 text-sm hover:bg-accent transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || addMutation.isPending || updateMutation.isPending}
                                        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                                    >
                                        {editingProductId ? "Save Changes" : "Add Product"}
                                    </button>
                                </div>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                )}
            />
        </div>
    );
};
