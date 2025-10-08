// src/utils/pricingCalculations.js
// ملف جديد - منطق حساب الأسعار والتكاليف للمخزون والمبيعات
// المسار: src/utils/pricingCalculations.js (خارج مجلد database)

/**
 * ═══════════════════════════════════════════════════════════════
 * حساب الوزن الفعلي للدفعة
 * ═══════════════════════════════════════════════════════════════
 */
export function calculateEffectiveBatchWeight(quantity, sheetWeightKg, customBatchWeightKg) {
  const qty = Number(quantity) || 0;
  const sheetWeight = Number(sheetWeightKg) || 0;
  const batchWeight = Number(customBatchWeightKg) || 0;
  
  if (batchWeight > 0) {
    return batchWeight;
  }
  
  if (qty > 0 && sheetWeight > 0) {
    return qty * sheetWeight;
  }
  
  return 0;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * حساب التكاليف والأسعار بناءً على طريقة التسعير
 * ═══════════════════════════════════════════════════════════════
 */
export function computePricingPreview(pricingMode, pricePerKg, totalCost, quantity, sheetWeightKg, customBatchWeightKg) {
  const effectiveWeight = calculateEffectiveBatchWeight(quantity, sheetWeightKg, customBatchWeightKg);
  
  const inputPricePerKg = Number(pricePerKg) || 0;
  const inputTotalCost = Number(totalCost) || 0;
  const qty = Number(quantity) || 0;
  
  const result = {
    total_cost: null,
    price_per_kg: null,
    price_per_sheet: null,
    weight_used: effectiveWeight,
    is_valid: false,
    error_message: null
  };
  
  if (effectiveWeight <= 0) {
    result.error_message = 'لا يمكن الحساب بدون وزن. يرجى إدخال وزن الصفيحة أو الوزن الكلي للدفعة';
    return result;
  }
  
  if (pricingMode === 'per_kg') {
    if (inputPricePerKg > 0) {
      result.total_cost = effectiveWeight * inputPricePerKg;
      result.price_per_kg = inputPricePerKg;
      
      if (qty > 0) {
        result.price_per_sheet = result.total_cost / qty;
      }
      
      result.is_valid = true;
    } else {
      result.error_message = 'يجب إدخال السعر لكل كيلو';
    }
  }
  else if (pricingMode === 'per_batch') {
    if (inputTotalCost > 0) {
      result.total_cost = inputTotalCost;
      result.price_per_kg = inputTotalCost / effectiveWeight;
      
      if (qty > 0) {
        result.price_per_sheet = inputTotalCost / qty;
      }
      
      result.is_valid = true;
    } else {
      result.error_message = 'يجب إدخال التكلفة الإجمالية';
    }
  }
  
  return result;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * تنسيق الأرقام للعرض
 * ═══════════════════════════════════════════════════════════════
 */
export function formatNumber(num, decimals = 2) {
  if (num == null || isNaN(num)) return '—';
  return Number(num).toLocaleString(undefined, { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals 
  });
}

/**
 * ═══════════════════════════════════════════════════════════════
 * التحقق من صحة بيانات الدفعة قبل الحفظ
 * ═══════════════════════════════════════════════════════════════
 */
export function validateBatchData(preview, quantity) {
  const errors = [];
  
  if (!quantity || quantity <= 0) {
    errors.push('الكمية يجب أن تكون أكبر من صفر');
  }
  
  if (!preview.is_valid) {
    errors.push(preview.error_message || 'بيانات التسعير غير صحيحة');
  }
  
  if (preview.weight_used <= 0) {
    errors.push('الوزن غير صحيح');
  }
  
  return {
    is_valid: errors.length === 0,
    errors: errors
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * إنشاء كائن البيانات للحفظ في قاعدة البيانات
 * ═══════════════════════════════════════════════════════════════
 */
export function prepareBatchDataForSave(preview, formData) {
  if (!preview.is_valid) {
    return null;
  }
  
  return {
    supplier_id: formData.supplier_id || null,
    quantity: Number(formData.quantity),
    price_per_kg: preview.price_per_kg ? Number(preview.price_per_kg.toFixed(4)) : null,
    total_cost: preview.total_cost ? Number(preview.total_cost.toFixed(2)) : null,
    storage_location: formData.storage_location?.trim() || null,
    received_date: formData.received_date,
    notes: formData.notes?.trim() || null
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * الحصول على السعر الأصلي من الصفيحة أو البقايا
 * ═══════════════════════════════════════════════════════════════
 */
export function getOriginalPricePerKg(sheetOrRemnant, batches = []) {
  if (sheetOrRemnant.price_per_kg && sheetOrRemnant.price_per_kg > 0) {
    return Number(sheetOrRemnant.price_per_kg);
  }
  
  if (batches && batches.length > 0) {
    const sortedBatches = [...batches].sort((a, b) => {
      return new Date(b.received_date) - new Date(a.received_date);
    });
    
    for (const batch of sortedBatches) {
      if (batch.price_per_kg && batch.price_per_kg > 0) {
        return Number(batch.price_per_kg);
      }
    }
  }
  
  if (batches && batches.length > 0) {
    for (const batch of batches) {
      if (batch.total_cost && batch.quantity_original && sheetOrRemnant.weight_per_sheet_kg) {
        const totalWeight = batch.quantity_original * sheetOrRemnant.weight_per_sheet_kg;
        if (totalWeight > 0) {
          return Number(batch.total_cost) / totalWeight;
        }
      }
    }
  }
  
  return 0;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * مقارنة سعر البيع مع السعر الأصلي - للتلوين الذكي
 * ═══════════════════════════════════════════════════════════════
 */
export function compareSalePrice(sellingPrice, originalPricePerKg, weight, sellingMode = 'per_piece') {
  const inputPrice = Number(sellingPrice) || 0;
  const originalPrice = Number(originalPricePerKg) || 0;
  const itemWeight = Number(weight) || 0;
  
  if (inputPrice <= 0 || originalPrice <= 0 || itemWeight <= 0) {
    return {
      isValid: false,
      color: 'text.secondary',
      status: 'invalid',
      message: 'بيانات غير كافية للمقارنة',
      profitAmount: 0,
      profitPercentage: 0
    };
  }
  
  const originalPiecePrice = originalPrice * itemWeight;
  
  let sellingPricePerKg;
  if (sellingMode === 'per_kg') {
    sellingPricePerKg = inputPrice;
  } else {
    sellingPricePerKg = inputPrice / itemWeight;
  }
  
  const difference = sellingPricePerKg - originalPrice;
  const percentageDiff = ((difference / originalPrice) * 100);
  
  const sellingPiecePrice = sellingMode === 'per_kg' ? inputPrice * itemWeight : inputPrice;
  const profitAmount = sellingPiecePrice - originalPiecePrice;
  const profitPercentage = ((profitAmount / originalPiecePrice) * 100);
  
  let color, status, message;
  
  if (Math.abs(percentageDiff) < 0.01) {
    color = 'text.primary';
    status = 'equal';
    message = '⚫ السعر مساوي للتكلفة';
  } else if (percentageDiff > 0) {
    color = 'success.main';
    status = 'profit';
    message = `🟢 ربح: ${formatNumber(profitAmount, 2)} (${formatNumber(profitPercentage, 1)}%)`;
  } else {
    color = 'error.main';
    status = 'loss';
    message = `🔴 خسارة: ${formatNumber(Math.abs(profitAmount), 2)} (${formatNumber(Math.abs(profitPercentage), 1)}%)`;
  }
  
  return {
    isValid: true,
    color: color,
    status: status,
    message: message,
    profitAmount: profitAmount,
    profitPercentage: profitPercentage,
    sellingPricePerKg: sellingPricePerKg,
    originalPricePerKg: originalPrice,
    originalPiecePrice: originalPiecePrice,
    sellingPiecePrice: sellingPiecePrice
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * عرض معاينة مفصلة للمستخدم
 * ═══════════════════════════════════════════════════════════════
 */
export function getDetailedPreview(preview, quantity, currencySymbol = '$') {
  const qty = Number(quantity) || 0;
  
  if (!preview.is_valid) {
    return {
      isValid: false,
      errorMessage: preview.error_message,
      display: null
    };
  }
  
  const weightPerSheet = qty > 0 ? preview.weight_used / qty : 0;
  
  return {
    isValid: true,
    errorMessage: null,
    display: {
      totalWeight: formatNumber(preview.weight_used, 3),
      weightPerSheet: formatNumber(weightPerSheet, 3),
      pricePerKg: preview.price_per_kg ? formatNumber(preview.price_per_kg, 4) : '—',
      pricePerSheet: preview.price_per_sheet ? formatNumber(preview.price_per_sheet, 2) : '—',
      totalCost: preview.total_cost ? formatNumber(preview.total_cost, 2) : '—',
      currencySymbol: currencySymbol,
      quantity: qty
    }
  };
}

/**
 * ═══════════════════════════════════════════════════════════════
 * نص معاينة بسيط
 * ═══════════════════════════════════════════════════════════════
 */
export function getPricingPreviewText(preview, currencySymbol = '$') {
  if (!preview.is_valid) {
    return `❌ ${preview.error_message}`;
  }
  
  const weight = formatNumber(preview.weight_used, 3);
  const totalCost = preview.total_cost ? formatNumber(preview.total_cost, 2) : '—';
  const pricePerKg = preview.price_per_kg ? formatNumber(preview.price_per_kg, 4) : '—';
  const pricePerSheet = preview.price_per_sheet ? formatNumber(preview.price_per_sheet, 2) : '—';
  
  return `الوزن الكلي: ${weight} كغ | التكلفة: ${totalCost} ${currencySymbol} | السعر/كغ: ${pricePerKg} ${currencySymbol}/كغ | السعر/صفيحة: ${pricePerSheet} ${currencySymbol}`;
}