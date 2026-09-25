/**
 * Authoritative Backend Quotation Pricing & Discount Engine
 *
 * Implements Step 2A Pricing Rules:
 * 1. Line-level Actual Price & Product-Level Discount (percentage or fixed amount per unit).
 * 2. Quotation-level Overall Discount (percentage or fixed amount) applied on post-product-discount subtotal.
 * 3. Proportional Allocation of Overall Discount across lines with exact 2-decimal remainder reconciliation.
 * 4. Anti-tampering validation.
 */

export function validateQuotationPricingInput({ items, overallDiscountType, overallDiscountValue, taxPercent }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Quotation must have at least one line item');
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const qty = Number(item.qty);
    const actualPrice = Number(item.actual_unit_price !== undefined ? item.actual_unit_price : item.price);

    if (isNaN(qty) || qty <= 0) {
      throw new Error(`Line ${i + 1}: Quantity must be greater than zero`);
    }
    if (isNaN(actualPrice) || actualPrice < 0) {
      throw new Error(`Line ${i + 1}: Actual unit price cannot be negative`);
    }

    const discType = item.discount_type || item.discountType || 'none';
    const discVal = Number(item.discount_value !== undefined ? item.discount_value : item.discountValue) || 0;

    if (isNaN(discVal) || discVal < 0) {
      throw new Error(`Line ${i + 1}: Product discount cannot be negative`);
    }

    if (discType === 'percentage' && discVal > 100) {
      throw new Error(`Line ${i + 1}: Product discount percentage cannot exceed 100%`);
    }
    if (discType === 'amount' && discVal > actualPrice) {
      throw new Error(`Line ${i + 1}: Product discount amount cannot exceed actual unit price`);
    }
  }

  const oType = overallDiscountType || 'none';
  const oVal = Number(overallDiscountValue) || 0;

  if (isNaN(oVal) || oVal < 0) {
    throw new Error('Overall discount value cannot be negative');
  }
  if (oType === 'percentage' && oVal > 100) {
    throw new Error('Overall discount percentage cannot exceed 100%');
  }
}

export function calculateQuotationPricing({
  items,
  overallDiscountType = 'none',
  overallDiscountValue = 0,
  taxPercent = 18,
}) {
  validateQuotationPricingInput({ items, overallDiscountType, overallDiscountValue, taxPercent });

  const taxPct = Number(taxPercent) >= 0 ? Number(taxPercent) : 18;

  // Step 1: Process Product-Level Discounts for each line
  const processedItems = items.map((item, idx) => {
    const qty = Number(item.qty) || 1;
    const actualUnitPrice = Number(item.actual_unit_price !== undefined ? item.actual_unit_price : item.price) || 0;
    const grossLineTotal = actualUnitPrice * qty;

    const discType = item.discount_type || item.discountType || 'none';
    const discVal = Number(item.discount_value !== undefined ? item.discount_value : item.discountValue) || 0;

    let productDiscountUnit = 0;
    let productDiscountAmount = 0;

    if (discType === 'percentage' && discVal > 0) {
      productDiscountUnit = (actualUnitPrice * discVal) / 100;
      productDiscountAmount = productDiscountUnit * qty;
    } else if (discType === 'amount' && discVal > 0) {
      productDiscountUnit = Math.min(discVal, actualUnitPrice);
      productDiscountAmount = productDiscountUnit * qty;
    }

    // Ensure product discount does not exceed gross line total
    productDiscountAmount = Math.min(productDiscountAmount, grossLineTotal);
    const afterProductDiscountAmount = Math.max(0, grossLineTotal - productDiscountAmount);

    return {
      id: item.id || null,
      product_id: item.product_id || item.productId || null,
      part_no: item.part_no || item.partNo || null,
      description: item.description || '',
      hsn_sac: item.hsn_sac || item.hsnSac || null,
      make: item.make || null,
      qty,
      actual_unit_price: actualUnitPrice,
      discount_type: discType,
      discount_value: discVal,
      product_discount_amount: Number(productDiscountAmount.toFixed(2)),
      after_product_discount_amount: Number(afterProductDiscountAmount.toFixed(2)),
      overall_discount_allocated: 0,
      final_unit_price: actualUnitPrice - productDiscountUnit,
      final_line_total: afterProductDiscountAmount,
      // Legacy compatibility properties
      price: actualUnitPrice,
      amount: afterProductDiscountAmount,
    };
  });

  const grossSubtotal = processedItems.reduce((sum, it) => sum + (it.actual_unit_price * it.qty), 0);
  const productDiscountTotal = processedItems.reduce((sum, it) => sum + it.product_discount_amount, 0);
  const eligibleSubtotal = Math.max(0, grossSubtotal - productDiscountTotal);

  // Step 2: Calculate Overall Quotation Discount Amount
  const oType = overallDiscountType || 'none';
  const oVal = Number(overallDiscountValue) || 0;
  let overallDiscountAmount = 0;

  if (oType === 'percentage' && oVal > 0) {
    overallDiscountAmount = (eligibleSubtotal * oVal) / 100;
  } else if (oType === 'amount' && oVal > 0) {
    overallDiscountAmount = Math.min(oVal, eligibleSubtotal);
  }

  overallDiscountAmount = Number(Math.min(overallDiscountAmount, eligibleSubtotal).toFixed(2));

  if (overallDiscountAmount > eligibleSubtotal) {
    throw new Error('Overall discount cannot exceed subtotal after product discounts');
  }

  // Step 3: Proportional Overall Discount Allocation with Exact Rounding Reconciled
  if (eligibleSubtotal > 0 && overallDiscountAmount > 0) {
    let allocatedSum = 0;
    let lastEligibleIdx = -1;

    for (let i = 0; i < processedItems.length; i++) {
      const it = processedItems[i];
      if (it.after_product_discount_amount > 0) {
        lastEligibleIdx = i;
        const share = it.after_product_discount_amount / eligibleSubtotal;
        // Floor to 2 decimal places to avoid over-allocating
        const rawAlloc = Math.floor(overallDiscountAmount * share * 100) / 100;
        it.overall_discount_allocated = rawAlloc;
        allocatedSum += rawAlloc;
      } else {
        it.overall_discount_allocated = 0;
      }
    }

    // Assign remaining penny/paisa to last eligible line item
    const remainder = Number((overallDiscountAmount - allocatedSum).toFixed(2));
    if (remainder !== 0 && lastEligibleIdx >= 0) {
      processedItems[lastEligibleIdx].overall_discount_allocated = Number(
        (processedItems[lastEligibleIdx].overall_discount_allocated + remainder).toFixed(2)
      );
    }
  }

  // Step 4: Compute Final Line Totals, Unit Prices, and Quotation Financial Totals
  for (const it of processedItems) {
    it.final_line_total = Number(Math.max(0, it.after_product_discount_amount - it.overall_discount_allocated).toFixed(2));
    it.final_unit_price = Number((it.final_line_total / it.qty).toFixed(4));
    it.amount = it.final_line_total; // Legacy compatibility
  }

  const netSubtotal = processedItems.reduce((sum, it) => sum + it.final_line_total, 0);

  // Backward compatibility alias: subtotal = netSubtotal
  const subtotal = netSubtotal;
  const taxableAmount = netSubtotal;
  const taxAmount = Number(((taxableAmount * taxPct) / 100).toFixed(2));
  const exactTotal = taxableAmount + taxAmount;
  const grandTotal = Math.round(exactTotal);
  const roundOff = Number((grandTotal - exactTotal).toFixed(2));

  return {
    gross_subtotal: Number(grossSubtotal.toFixed(2)),
    product_discount_total: Number(productDiscountTotal.toFixed(2)),
    subtotal_after_product_discounts: Number(eligibleSubtotal.toFixed(2)),
    overall_discount_type: oType,
    overall_discount_value: oVal,
    overall_discount_amount: overallDiscountAmount,
    net_subtotal: Number(netSubtotal.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)), // Legacy
    discount_type: oType, // Legacy alias
    discount_value: oVal, // Legacy alias
    discount_percent: oType === 'percentage' ? oVal : (eligibleSubtotal > 0 ? Number(((overallDiscountAmount / eligibleSubtotal) * 100).toFixed(2)) : 0),
    discount_amount: overallDiscountAmount, // Legacy alias
    taxable_amount: Number(taxableAmount.toFixed(2)),
    tax_percent: taxPct,
    tax_amount: taxAmount,
    round_off: roundOff,
    total: grandTotal,
    items: processedItems,
  };
}
