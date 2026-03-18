"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown } from "lucide-react";
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

const formatPrice = (value: number) => `Rs.${value.toFixed(2)}`;

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    label?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = "Select...",
    label,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const displayLabel =
        value === "all" ? "All Categories" : options.find((opt) => opt === value) || placeholder;

    return (
        <div className="relative" ref={dropdownRef}>
            {label && (
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    {label}
                </label>
            )}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-10 px-4 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-left flex items-center justify-between hover:bg-muted/50 text-foreground"
            >
                <span className="text-sm">{displayLabel}</span>
                <ChevronDown
                    className="w-4 h-4 text-muted-foreground transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-10 overflow-hidden"
                    >
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                    value === option
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-foreground hover:bg-accent"
                                }`}
                            >
                                {option === "all" ? "All Categories" : option}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};


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

    const categories = useMemo(() => {
        const unique = new Set(products.map((item) => item.category));
        return ["all", ...Array.from(unique)];
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

            <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-6">
                <div className="flex flex-col gap-3">
                    {/* Search and Filters Row */}
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
                        {/* Search Input */}
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

                        {/* Category Select */}
                        <div className="w-full lg:w-48">
                            <CustomSelect
                                label="Category"
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                options={categories}
                            />
                        </div>
                    </div>

                    {/* Low Stock and Add Button Row */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
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
                            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity h-10"
                        >
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Form with Animation */}
                <AnimatePresence>
                    {isFormOpen && (
                        <motion.form
                            onSubmit={handleSubmit(onAddOrEditSubmit)}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="mt-5 overflow-hidden"
                        >
                            <div className="grid gap-3 border-t border-border pt-5 md:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                        Product Name
                                    </label>
                                    <input
                                        {...register("name")}
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
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
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
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
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
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
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
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
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
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
                                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
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
            </div>

            <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-6">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px]">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Product Name
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Stock
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Price
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Category
                                </th>
                                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {inventoryQuery.isLoading && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-sm text-muted-foreground">
                                        Loading inventory...
                                    </td>
                                </tr>
                            )}

                            {!inventoryQuery.isLoading && filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-sm text-muted-foreground">
                                        No products match your filters.
                                    </td>
                                </tr>
                            )}

                            {filteredProducts.map((product) => {
                                const isLowStock = product.stock <= product.lowStockThreshold;
                                const isInlineEditing = editingStockId === product.id;

                                return (
                                    <tr key={product.id} className="hover:bg-accent/40">
                                        <td className="px-3 py-3 text-sm font-medium">
                                            <div className="flex flex-col">
                                                <span>{product.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {product.barcode}
                                                </span>
                                            </div>
                                        </td>

                                        <td className="px-3 py-3 text-sm">
                                            {isInlineEditing ? (
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
                                                    className="w-20 rounded-md border border-input bg-background px-2 py-1 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                                />
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => startInlineStockEdit(product)}
                                                    className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${isLowStock
                                                            ? "bg-destructive/15 text-destructive hover:bg-destructive/20"
                                                            : "bg-muted text-foreground hover:bg-accent"
                                                        }`}
                                                    title="Click to edit stock inline"
                                                >
                                                    {product.stock}
                                                </button>
                                            )}
                                        </td>

                                        <td className="px-3 py-3 text-sm">{formatPrice(product.price)}</td>
                                        <td className="px-3 py-3 text-sm text-muted-foreground">{product.category}</td>
                                        <td className="px-3 py-3 text-sm">
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
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
