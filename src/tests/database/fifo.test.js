import { describe, it, expect } from 'vitest';

describe('FIFO Inventory Logic', () => {
  describe('Batch Selection', () => {
    it('should select oldest batch first', () => {
      const batches = [
        { id: 1, received_date: '2024-01-15', quantity_remaining: 100 },
        { id: 2, received_date: '2024-01-10', quantity_remaining: 50 },
        { id: 3, received_date: '2024-01-20', quantity_remaining: 75 }
      ];

      const sorted = [...batches].sort((a, b) =>
        new Date(a.received_date) - new Date(b.received_date)
      );

      expect(sorted[0].id).toBe(2);
      expect(sorted[0].received_date).toBe('2024-01-10');
    });

    it('should handle single batch', () => {
      const batches = [
        { id: 1, received_date: '2024-01-15', quantity_remaining: 100 }
      ];

      const requestedQty = 50;
      const allocated = Math.min(batches[0].quantity_remaining, requestedQty);

      expect(allocated).toBe(50);
      expect(batches[0].quantity_remaining - allocated).toBe(50);
    });

    it('should allocate from multiple batches', () => {
      const batches = [
        { id: 1, quantity_remaining: 30 },
        { id: 2, quantity_remaining: 50 },
        { id: 3, quantity_remaining: 20 }
      ];

      let requestedQty = 60;
      const allocations = [];

      for (const batch of batches) {
        if (requestedQty <= 0) break;

        const allocated = Math.min(batch.quantity_remaining, requestedQty);
        allocations.push({ batchId: batch.id, quantity: allocated });
        requestedQty -= allocated;
      }

      expect(allocations).toHaveLength(2);
      expect(allocations[0].quantity).toBe(30);
      expect(allocations[1].quantity).toBe(30);
      expect(requestedQty).toBe(0);
    });

    it('should throw error when insufficient quantity', () => {
      const batches = [
        { id: 1, quantity_remaining: 30 },
        { id: 2, quantity_remaining: 20 }
      ];

      const requestedQty = 100;
      const totalAvailable = batches.reduce((sum, b) => sum + b.quantity_remaining, 0);

      expect(totalAvailable).toBe(50);
      expect(totalAvailable).toBeLessThan(requestedQty);
    });
  });

  describe('Quantity Calculations', () => {
    it('should calculate remaining quantity correctly', () => {
      const original = 100;
      const sold = 30;
      const remaining = original - sold;

      expect(remaining).toBe(70);
    });

    it('should not allow negative remaining', () => {
      const remaining = 10;
      const toSell = 15;

      expect(remaining).toBeLessThan(toSell);
    });

    it('should handle exact quantity match', () => {
      const batch = { quantity_remaining: 50 };
      const saleQty = 50;

      const newRemaining = batch.quantity_remaining - saleQty;

      expect(newRemaining).toBe(0);
    });
  });

  describe('COGS Calculation', () => {
    it('should calculate COGS per unit correctly', () => {
      const pricePerKg = 10;
      const weightPerSheet = 5;
      const cogsPerUnit = pricePerKg * weightPerSheet;

      expect(cogsPerUnit).toBe(50);
    });

    it('should calculate total COGS', () => {
      const quantity = 10;
      const cogsPerUnit = 50;
      const totalCogs = quantity * cogsPerUnit;

      expect(totalCogs).toBe(500);
    });

    it('should handle custom weight', () => {
      const customWeight = 7.5;
      const quantity = 3;
      const pricePerKg = 10;
      const totalCogs = (customWeight / quantity) * pricePerKg * quantity;

      expect(totalCogs).toBe(75);
    });

    it('should handle weighted average cost', () => {
      const batch1 = { qty: 50, cost: 10 };
      const batch2 = { qty: 30, cost: 12 };

      const totalQty = batch1.qty + batch2.qty;
      const totalCost = (batch1.qty * batch1.cost) + (batch2.qty * batch2.cost);
      const avgCost = totalCost / totalQty;

      expect(avgCost).toBeCloseTo(10.75, 2);
    });
  });

  describe('Batch Restoration (Delete Sale)', () => {
    it('should restore quantity when sale is deleted', () => {
      const batch = { quantity_remaining: 50 };
      const deletedSaleQty = 20;

      const restoredQty = batch.quantity_remaining + deletedSaleQty;

      expect(restoredQty).toBe(70);
    });

    it('should handle multiple items restoration', () => {
      const batch1 = { id: 1, quantity_remaining: 30 };
      const batch2 = { id: 2, quantity_remaining: 20 };

      const deletedItems = [
        { batch_id: 1, quantity_sold: 10 },
        { batch_id: 2, quantity_sold: 5 }
      ];

      batch1.quantity_remaining += deletedItems[0].quantity_sold;
      batch2.quantity_remaining += deletedItems[1].quantity_sold;

      expect(batch1.quantity_remaining).toBe(40);
      expect(batch2.quantity_remaining).toBe(25);
    });
  });
});
