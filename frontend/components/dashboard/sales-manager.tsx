/**
 * Sales Manager Component
 * Main interface for processing sales, managing cart, and generating invoices
 */

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Plus, Trash2, ChevronDown, X, Loader } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createCustomerSchema,
    createCustomerDefaults,
    type CreateCustomerFormData,
} from "@/lib/forms/sales";
import { useInventoryList } from "@/lib/queries/use-inventory-query";
import { useSalesHistory, useCreateSale, useCustomers, useCreateCustomer } from "@/lib/queries/use-sales-query";
import { InvoiceModal } from "./invoice-modal";
import { SalesHistoryFeed } from "./sales-history-feed";
import type { CartItem, CartItemWithTotal, Invoice } from "@/lib/contracts/sales";

const formatPrice = (value: number) => `Rs.${value.toFixed(2)}`;

export const SalesManager: React.FC = () => {
    const inventoryQuery = useInventoryList();
    const salesHistoryQuery = useSalesHistory();
    const customersQuery = useCustomers();
    const createSaleMutation = useCreateSale();
    const createCustomerMutation = useCreateCustomer();

    // Form for creating new customer
    const {
        register,
        handleSubmit,
        reset: resetCustomerForm,
        formState: { errors: customerErrors, isSubmitting: isSubmitterCustomer },
    } = useForm<CreateCustomerFormData>({
        resolver: zodResolver(createCustomerSchema),
        defaultValues: createCustomerDefaults,
    });

    // Cart and UI state
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "credit">("cash");
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [searchProduct, setSearchProduct] = useState("");
    const [showCreateCustomer, setShowCreateCustomer] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
    const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);

    const products = inventoryQuery.data?.products || [];

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        const searchTerm = searchProduct.trim().toLowerCase();
        if (!searchTerm) return products;

        return products.filter(
            (product) =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.barcode.toLowerCase().includes(searchTerm)
        );
    }, [products, searchProduct]);

    // Calculate cart totals
    const cartTotals = useMemo(() => {
        const items: CartItemWithTotal[] = cartItems.map((item) => ({
            ...item,
            itemTotal: item.price * item.quantity,
        }));

        const subtotal = items.reduce((sum, item) => sum + item.itemTotal, 0);
        const total = Math.max(0, subtotal - discount);

        return { items, subtotal, total };
    }, [cartItems, discount]);

    // Add product to cart
    const addToCart = (productId: string) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return;

        setCartItems((prev) => {
            const existing = prev.find((item) => item.productId === productId);
            if (existing) {
                // Increase quantity if already in cart
                return prev.map((item) =>
                    item.productId === productId && item.quantity < product.stock
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            // Add new item
            return [
                ...prev,
                {
                    productId,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    stock: product.stock,
                },
            ];
        });
    };

    // Update cart item quantity
    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: Math.min(quantity, item.stock) }
                    : item
            )
        );
    };

    // Remove item from cart
    const removeFromCart = (productId: string) => {
        setCartItems((prev) => prev.filter((item) => item.productId !== productId));
    };

    // Handle create new customer
    const onCreateCustomer = async (data: CreateCustomerFormData) => {
        setIsCreatingCustomer(true);
        try {
            const newCustomer = await createCustomerMutation.mutateAsync(data);
            setSelectedCustomerId(newCustomer.id);
            setShowCreateCustomer(false);
            resetCustomerForm();
        } catch (error) {
            console.error("Failed to create customer:", error);
        } finally {
            setIsCreatingCustomer(false);
        }
    };

    // Handle generate invoice
    const generateInvoice = async () => {
        if (cartItems.length === 0) {
            alert("Cart is empty. Add products first.");
            return;
        }

        const dueAmount = paymentMethod === "credit" ? cartTotals.total : 0;

        try {
            const response = await createSaleMutation.mutateAsync({
                items: cartItems,
                discount,
                paymentMethod,
                customerId: paymentMethod === "credit" ? selectedCustomerId || undefined : undefined,
                customerName:
                    paymentMethod === "credit" && selectedCustomerId
                        ? customersQuery.data?.customers.find((c) => c.id === selectedCustomerId)?.name
                        : undefined,
                dueAmount: paymentMethod === "credit" ? dueAmount : undefined,
            });

            setGeneratedInvoice(response.invoice);
            setShowInvoiceModal(true);

            // Clear cart after successful invoice
            setTimeout(() => {
                setCartItems([]);
                setDiscount(0);
                setPaymentMethod("cash");
                setSelectedCustomerId(null);
                setSearchProduct("");
            }, 500);
        } catch (error) {
            console.error("Failed to generate invoice:", error);
            alert("Failed to generate invoice. Please try again.");
        }
    };

    // Clear cart
    const clearCart = () => {
        if (cartItems.length === 0) return;
        if (confirm("Are you sure you want to clear the cart?")) {
            setCartItems([]);
            setDiscount(0);
            setPaymentMethod("cash");
            setSelectedCustomerId(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight">Sales & Billing</h1>
                <p className="text-muted-foreground">
                    Quick product selection, cart management, and invoice generation
                </p>
            </div>

            {/* Error states */}
            {inventoryQuery.isError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Failed to load products. Demo fallback may be disabled.
                </div>
            )}

            {/* Main Sales Layout - Two Column on Desktop */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Section - Product Selection & Cart */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Product Selection */}
                    <div className="rounded-2xl border border-border bg-card text-card-foreground ">
                        <div className="mb-4 p-4 md:p-6">
                            <h2 className="text-lg font-semibold mb-3">Select Products</h2>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <input
                                    value={searchProduct}
                                    onChange={(e) => setSearchProduct(e.target.value)}
                                    placeholder="Search products by name or barcode..."
                                    className="w-full h-10 pl-10 pr-4 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-muted-foreground/50"
                                />
                            </div>
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto px-4 md:px-6 md:pb-6">
                            {inventoryQuery.isLoading && (
                                <div className="col-span-full flex items-center justify-center py-8">
                                    <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                            )}

                            {!inventoryQuery.isLoading && filteredProducts.length === 0 && (
                                <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                                    No products found
                                </div>
                            )}

                            {filteredProducts.map((product) => (
                                <motion.button
                                    key={product.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => addToCart(product.id)}
                                    disabled={product.stock === 0}
                                    className="text-left rounded-lg border border-border bg-muted/50 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-3 group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                                            {product.name}
                                        </h3>
                                        <Plus className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>{formatPrice(product.price)}</span>
                                        <span
                                            className={
                                                product.stock <= product.lowStockThreshold
                                                    ? "text-destructive font-semibold"
                                                    : ""
                                            }
                                        >
                                            {product.stock} in stock
                                        </span>
                                    </div>
                                    {product.barcode && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {product.barcode}
                                        </div>
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Cart Section */}
                    <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-6">
                        <h2 className="text-lg font-semibold mb-4">Cart Items ({cartItems.length})</h2>

                        {cartItems.length === 0 ? (
                            <div className="text-center py-8 text-sm text-muted-foreground">
                                Cart is empty. Add products to get started.
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {cartItems.map((item) => (
                                    <motion.div
                                        key={item.productId}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 p-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatPrice(item.price)}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                className="px-2 py-1 rounded border border-border hover:bg-accent text-xs"
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                                                min={1}
                                                max={item.stock}
                                                className="w-10 h-8 text-center text-xs border border-border rounded bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                className="px-2 py-1 rounded border border-border hover:bg-accent text-xs"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section - Billing Summary */}
                <div className="lg:col-span-1 space-y-4 h-fit lg:sticky lg:top-24">
                    <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-6 space-y-4">
                        <h2 className="text-lg font-semibold">Billing Summary</h2>

                        {/* Items in Summary */}
                        {cartTotals.items.length > 0 && (
                            <div className="space-y-2 border-b border-border pb-4 max-h-48 overflow-y-auto">
                                {cartTotals.items.map((item) => (
                                    <div key={item.productId} className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {item.name} × {item.quantity}
                                        </span>
                                        <span className="font-medium">{formatPrice(item.itemTotal)}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Subtotal */}
                        <div className="flex justify-between text-sm border-b border-border pb-3">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold">{formatPrice(cartTotals.subtotal)}</span>
                        </div>

                        {/* Discount */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Discount</label>
                            <input
                                type="number"
                                value={discount}
                                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                min={0}
                                max={cartTotals.subtotal}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        {/* Total */}
                        <div className="flex justify-between text-lg border-b border-border pb-4 pt-2">
                            <span className="font-semibold">Total</span>
                            <span className="font-bold text-lg">{formatPrice(cartTotals.total)}</span>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => {
                                        setPaymentMethod("cash");
                                        setSelectedCustomerId(null);
                                    }}
                                    className={`rounded-lg py-2 px-3 text-sm font-medium transition-colors border ${paymentMethod === "cash"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-background hover:bg-accent"
                                        }`}
                                >
                                    💵 Cash
                                </button>
                                <button
                                    onClick={() => setPaymentMethod("credit")}
                                    className={`rounded-lg py-2 px-3 text-sm font-medium transition-colors border ${paymentMethod === "credit"
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border bg-background hover:bg-accent"
                                        }`}
                                >
                                    💳 Credit
                                </button>
                            </div>
                        </div>

                        {/* Customer Selection (Credit Only) */}
                        {paymentMethod === "credit" && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground">Customer</label>

                                {customersQuery.isLoading ? (
                                    <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                                        <Loader className="w-4 h-4 animate-spin mr-2" />
                                        Loading customers...
                                    </div>
                                ) : (
                                    <>
                                        <select
                                            value={selectedCustomerId || ""}
                                            onChange={(e) => setSelectedCustomerId(e.target.value || null)}
                                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">Select a customer...</option>
                                            {customersQuery.data?.customers.map((customer) => (
                                                <option key={customer.id} value={customer.id}>
                                                    {customer.name} (Due: {formatPrice(customer.dueAmount)})
                                                </option>
                                            ))}
                                        </select>

                                        {!showCreateCustomer && (
                                            <button
                                                onClick={() => setShowCreateCustomer(true)}
                                                className="w-full text-xs text-primary hover:underline"
                                            >
                                                + Add New Customer
                                            </button>
                                        )}
                                    </>
                                )}

                                {/* Create New Customer Form */}
                                <AnimatePresence>
                                    {showCreateCustomer && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-t border-border pt-3 space-y-2"
                                        >
                                            <input
                                                {...register("name")}
                                                placeholder="Customer name"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                            />
                                            {customerErrors.name && (
                                                <p className="text-xs text-destructive">{customerErrors.name.message}</p>
                                            )}

                                            <input
                                                {...register("email")}
                                                placeholder="Email (optional)"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                            />
                                            {customerErrors.email && (
                                                <p className="text-xs text-destructive">{customerErrors.email.message}</p>
                                            )}

                                            <input
                                                {...register("phone")}
                                                placeholder="Phone (optional)"
                                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                            />
                                            {customerErrors.phone && (
                                                <p className="text-xs text-destructive">{customerErrors.phone.message}</p>
                                            )}

                                            <div className="flex gap-2 pt-2">
                                                <button
                                                    onClick={handleSubmit(onCreateCustomer)}
                                                    disabled={isSubmitterCustomer || isCreatingCustomer}
                                                    className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowCreateCustomer(false);
                                                        resetCustomerForm();
                                                    }}
                                                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-accent transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t border-border">
                            <button
                                onClick={generateInvoice}
                                disabled={cartItems.length === 0 || createSaleMutation.isPending}
                                className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60 transition-opacity"
                            >
                                {createSaleMutation.isPending ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin inline mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    "Generate Invoice"
                                )}
                            </button>
                            <button
                                onClick={clearCart}
                                disabled={cartItems.length === 0}
                                className="rounded-lg border border-border bg-background px-4 py-2.5 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Clear Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales History Section */}
            <div className="rounded-2xl border border-border bg-card text-card-foreground p-4 md:p-6">
                <h2 className="text-lg font-semibold mb-4">Sales History</h2>
                {salesHistoryQuery.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <SalesHistoryFeed sales={salesHistoryQuery.data?.sales || []} />
                )}
            </div>

            {/* Invoice Modal */}
            <InvoiceModal
                invoice={generatedInvoice}
                isOpen={showInvoiceModal}
                onClose={() => {
                    setShowInvoiceModal(false);
                    setGeneratedInvoice(null);
                }}
            />
        </div>
    );
};
