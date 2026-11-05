/**
 * Fair Price Index & Regional Benchmark Auditor
 * Compares extracted street menu and artisan items against authentic regional benchmarks
 * to protect travelers from the "tourist tax" and elevate transparent micro-vendors.
 */

// Regional street commerce price benchmarks (in INR / local currency baseline)
export const REGIONAL_BENCHMARKS = {
  beverage: {
    label: 'Street Beverages & Chai',
    min: 10,
    typicalMax: 40,
    fairCeiling: 60,
    currencySymbol: '₹',
  },
  street_snack: {
    label: 'Street Confections & Chaat',
    min: 20,
    typicalMax: 80,
    fairCeiling: 120,
    currencySymbol: '₹',
  },
  meal: {
    label: 'Artisan Meals & Platters',
    min: 50,
    typicalMax: 150,
    fairCeiling: 220,
    currencySymbol: '₹',
  },
  craft: {
    label: 'Handturned Pottery & Crafts',
    min: 40,
    typicalMax: 350,
    fairCeiling: 550,
    currencySymbol: '₹',
  },
  textile: {
    label: 'Hand-Embroidered & Block Prints',
    min: 150,
    typicalMax: 700,
    fairCeiling: 1100,
    currencySymbol: '₹',
  },
  heritage: {
    label: 'Brass & Heirlooms',
    min: 150,
    typicalMax: 950,
    fairCeiling: 1500,
    currencySymbol: '₹',
  },
};

/**
 * Detects benchmark category from item name or vendor category
 */
export function classifyItemCategory(itemName = '', vendorCategory = 'Food') {
  const name = itemName.toLowerCase();

  if (name.includes('chai') || name.includes('tea') || name.includes('coffee') || name.includes('lassi') || name.includes('juice') || name.includes('sharbat')) {
    return 'beverage';
  }
  if (name.includes('jalebi') || name.includes('kulfi') || name.includes('chaat') || name.includes('kachori') || name.includes('samosa') || name.includes('falooda') || name.includes('snack')) {
    return 'street_snack';
  }
  if (name.includes('thali') || name.includes('paratha') || name.includes('meal') || name.includes('curry') || name.includes('roti') || name.includes('rice')) {
    return 'meal';
  }
  if (name.includes('flute') || name.includes('pottery') || name.includes('kulhad') || name.includes('toy') || name.includes('diya') || name.includes('bamboo')) {
    return 'craft';
  }
  if (name.includes('stole') || name.includes('print') || name.includes('zari') || name.includes('scarf') || name.includes('shawl') || name.includes('fabric')) {
    return 'textile';
  }
  if (name.includes('brass') || name.includes('copper') || name.includes('lamp') || name.includes('vintage') || name.includes('heirloom')) {
    return 'heritage';
  }

  // Fallback using vendor category
  const cat = vendorCategory?.toLowerCase() || '';
  if (cat === 'food') return 'street_snack';
  if (cat === 'craft') return 'craft';
  if (cat === 'heritage') return 'heritage';

  return 'craft';
}

/**
 * Audits a single price item against regional thresholds
 */
export function auditSingleItem(item, vendorCategory = 'Food') {
  const categoryKey = item.category || classifyItemCategory(item.name, vendorCategory);
  const benchmark = REGIONAL_BENCHMARKS[categoryKey] || REGIONAL_BENCHMARKS.street_snack;
  const price = Number(item.price) || 0;

  const isBelowTypical = price <= benchmark.typicalMax;
  const isFair = price <= benchmark.fairCeiling;

  let status = 'Fair';
  if (isBelowTypical) {
    status = 'Great Value';
  } else if (!isFair) {
    status = 'Premium / Above Average';
  }

  return {
    name: item.name || 'Artisan Special',
    price,
    unit: item.unit || 'unit',
    categoryKey,
    categoryLabel: benchmark.label,
    benchmarkRange: `${benchmark.currencySymbol}${benchmark.min}–${benchmark.currencySymbol}${benchmark.typicalMax}`,
    isFair,
    status,
  };
}

/**
 * Performs full Grounded Benchmark Audit for a collection of menu/catalog items
 * @param {Array} items [{ name, price, unit }]
 * @param {string} vendorCategory
 * @returns {{
 *   isFairPriceVerified: boolean,
 *   badge: string,
 *   scorePercentage: number,
 *   auditedItems: Array,
 *   summaryText: string
 * }}
 */
export function auditVendorPricing(items = [], vendorCategory = 'Food') {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      isFairPriceVerified: true,
      badge: '⚖️ Fair Price Verified (Local Standard)',
      scorePercentage: 100,
      auditedItems: [],
      summaryText: 'Calibrated to community heritage index.',
    };
  }

  const audited = items.map((item) => auditSingleItem(item, vendorCategory));
  const fairCount = audited.filter((a) => a.isFair).length;
  const scorePercentage = Math.round((fairCount / audited.length) * 100);

  const isFairPriceVerified = scorePercentage >= 75;

  return {
    isFairPriceVerified,
    badge: isFairPriceVerified
      ? '⚖️ Fair Price Verified (Local Standard)'
      : '⚠️ Variable Pricing (Tourist Alert)',
    scorePercentage,
    auditedItems: audited,
    summaryText: isFairPriceVerified
      ? `${scorePercentage}% of offerings match regional artisan standards.`
      : 'Some items exceed local benchmark averages.',
  };
}
