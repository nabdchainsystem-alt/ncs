import { InventoryItem, Vendor, PurchaseOrder } from '../types/shared';

export const procurementService = {
    /**
     * Checks inventory items against their reorder points.
     * Returns items that need replenishment.
     */
    checkReorderLevels: (inventory: InventoryItem[]): InventoryItem[] => {
        return inventory.filter(item => item.quantity <= item.reorderPoint);
    },

    /**
     * Generates a draft Purchase Order for a specific item.
     */
    generateAutoPO: (item: InventoryItem, vendor: Vendor): PurchaseOrder => {
        const orderQuantity = Math.max(item.reorderPoint * 2, 10); // Simple logic: Order double the reorder point or at least 10

        return {
            id: `po-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            vendorId: vendor.id,
            items: [{
                itemId: item.id,
                quantity: orderQuantity,
                unitPrice: item.unitPrice
            }],
            totalAmount: orderQuantity * item.unitPrice,
            status: 'Draft',
            createdAt: new Date(),
            notes: 'Auto-generated based on low stock alert.'
        };
    },

    /**
     * Groups low stock items by vendor to create consolidated POs.
     */
    createConsolidatedPOs: (inventory: InventoryItem[], vendors: Vendor[]): PurchaseOrder[] => {
        const lowStockItems = procurementService.checkReorderLevels(inventory);
        const pos: PurchaseOrder[] = [];
        const itemsByVendor: Record<string, InventoryItem[]> = {};

        // Group items by vendor
        lowStockItems.forEach(item => {
            if (!itemsByVendor[item.supplierId]) {
                itemsByVendor[item.supplierId] = [];
            }
            itemsByVendor[item.supplierId].push(item);
        });

        // Create PO for each vendor
        Object.keys(itemsByVendor).forEach(vendorId => {
            const vendor = vendors.find(v => v.id === vendorId);
            if (!vendor) return;

            const vendorItems = itemsByVendor[vendorId];
            const poItems = vendorItems.map(item => ({
                itemId: item.id,
                quantity: Math.max(item.reorderPoint * 2, 10),
                unitPrice: item.unitPrice
            }));

            const totalAmount = poItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

            pos.push({
                id: `po-${Date.now()}-${vendorId}`,
                vendorId: vendorId,
                items: poItems,
                totalAmount,
                status: 'Draft',
                createdAt: new Date(),
                notes: 'Consolidated auto-replenishment order.'
            });
        });

        return pos;
    }
};
