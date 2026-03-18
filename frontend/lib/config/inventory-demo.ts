const inventoryDemoFallbackEnv = process.env.NEXT_PUBLIC_INVENTORY_DEMO_FALLBACK;

export const isInventoryDemoFallbackEnabled =
  inventoryDemoFallbackEnv === undefined
    ? true
    : inventoryDemoFallbackEnv.toLowerCase() === "true";
