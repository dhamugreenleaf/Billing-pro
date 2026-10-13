/**
 * Indian GST States & State Codes Master List (37 States & UTs)
 */
export const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir', aliases: ['jammu and kashmir', 'jammu & kashmir', 'j&k', 'jk'] },
  { code: '02', name: 'Himachal Pradesh', aliases: ['himachal pradesh', 'hp'] },
  { code: '03', name: 'Punjab', aliases: ['punjab', 'pb'] },
  { code: '04', name: 'Chandigarh', aliases: ['chandigarh', 'ch'] },
  { code: '05', name: 'Uttarakhand', aliases: ['uttarakhand', 'uttaranchal', 'uk', 'ua'] },
  { code: '06', name: 'Haryana', aliases: ['haryana', 'hr'] },
  { code: '07', name: 'Delhi', aliases: ['delhi', 'dl', 'new delhi'] },
  { code: '08', name: 'Rajasthan', aliases: ['rajasthan', 'rj'] },
  { code: '09', name: 'Uttar Pradesh', aliases: ['uttar pradesh', 'up'] },
  { code: '10', name: 'Bihar', aliases: ['bihar', 'br'] },
  { code: '11', name: 'Sikkim', aliases: ['sikkim', 'sk'] },
  { code: '12', name: 'Arunachal Pradesh', aliases: ['arunachal pradesh', 'ar'] },
  { code: '13', name: 'Nagaland', aliases: ['nagaland', 'nl'] },
  { code: '14', name: 'Manipur', aliases: ['manipur', 'mn'] },
  { code: '15', name: 'Mizoram', aliases: ['mizoram', 'mz'] },
  { code: '16', name: 'Tripura', aliases: ['tripura', 'tr'] },
  { code: '17', name: 'Meghalaya', aliases: ['meghalaya', 'ml'] },
  { code: '18', name: 'Assam', aliases: ['assam', 'as'] },
  { code: '19', name: 'West Bengal', aliases: ['west bengal', 'wb'] },
  { code: '20', name: 'Jharkhand', aliases: ['jharkhand', 'jh'] },
  { code: '21', name: 'Odisha', aliases: ['odisha', 'orissa', 'or', 'od'] },
  { code: '22', name: 'Chhattisgarh', aliases: ['chhattisgarh', 'chattisgarh', 'cg'] },
  { code: '23', name: 'Madhya Pradesh', aliases: ['madhya pradesh', 'mp'] },
  { code: '24', name: 'Gujarat', aliases: ['gujarat', 'gj'] },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu', aliases: ['dadra & nagar haveli', 'daman & diu', 'dnh', 'dd', 'daman and diu'] },
  { code: '27', name: 'Maharashtra', aliases: ['maharashtra', 'mh'] },
  { code: '28', name: 'Andhra Pradesh', aliases: ['andhra pradesh', 'ap'] },
  { code: '29', name: 'Karnataka', aliases: ['karnataka', 'ka'] },
  { code: '30', name: 'Goa', aliases: ['goa', 'ga'] },
  { code: '31', name: 'Lakshadweep', aliases: ['lakshadweep', 'ld'] },
  { code: '32', name: 'Kerala', aliases: ['kerala', 'kl'] },
  { code: '33', name: 'Tamil Nadu', aliases: ['tamil nadu', 'tamilnadu', 'tn'] },
  { code: '34', name: 'Puducherry', aliases: ['puducherry', 'pondicherry', 'py'] },
  { code: '35', name: 'Andaman & Nicobar Islands', aliases: ['andaman & nicobar', 'andaman and nicobar', 'an'] },
  { code: '36', name: 'Telangana', aliases: ['telangana', 'ts', 'tg'] },
  { code: '37', name: 'Andhra Pradesh (New)', aliases: ['andhra pradesh new', 'ad'] },
  { code: '38', name: 'Ladakh', aliases: ['ladakh', 'la'] }
];

/**
 * Normalizes state string/code into a standard state record.
 * Handles case variations, extra whitespace, 2-digit codes, and common aliases.
 */
export const normalizeState = (input) => {
  if (!input || typeof input !== 'string') return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Direct match on 2-digit code
  if (/^\d{2}$/.test(trimmed)) {
    const matchByCode = INDIAN_STATES.find(s => s.code === trimmed);
    if (matchByCode) return matchByCode;
  }

  // 2. Clean text: lowercase and strip excessive whitespace/punctuation
  const cleaned = trimmed
    .toLowerCase()
    .replace(/[._,-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Match against exact official name or aliases
  for (const s of INDIAN_STATES) {
    if (s.name.toLowerCase() === cleaned) return s;
    if (s.aliases && s.aliases.includes(cleaned)) return s;
  }

  // 4. Return null if no recognized state was matched
  return null;
};

/**
 * Extracts 2-digit state code from GSTIN if present.
 */
export const getStateFromGstin = (gstin) => {
  if (!gstin || typeof gstin !== 'string') return null;
  const cleanGstin = gstin.trim();
  if (cleanGstin.length >= 2) {
    const code = cleanGstin.substring(0, 2);
    if (/^\d{2}$/.test(code)) {
      return normalizeState(code);
    }
  }
  return null;
};

/**
 * Determines whether a transaction is INTRA_STATE or INTER_STATE.
 *
 * @param {string} sellerStateInput - Seller company state or GSTIN
 * @param {string} customerPosInput - Customer Place of Supply or state
 * @returns {object} { type: 'INTRA_STATE'|'INTER_STATE', sellerState, placeOfSupply }
 */
export const determineGstClassification = (sellerStateInput, customerPosInput) => {
  const seller = normalizeState(sellerStateInput);
  const pos = normalizeState(customerPosInput);

  // If customer place of supply is not specified, default to seller state (intra-state local transaction)
  if (!pos) {
    return {
      type: 'INTRA_STATE',
      isInterState: false,
      sellerState: seller,
      placeOfSupply: seller?.name || null,
      stateCode: seller?.code || null
    };
  }

  // If seller state is not specified, assume intra-state if no conflict
  if (!seller) {
    return {
      type: 'INTRA_STATE',
      isInterState: false,
      sellerState: pos,
      placeOfSupply: pos?.name || null,
      stateCode: pos?.code || null
    };
  }

  // Compare by official 2-digit state code if available
  if (seller.code && pos.code) {
    const isIntra = seller.code === pos.code;
    return {
      type: isIntra ? 'INTRA_STATE' : 'INTER_STATE',
      isInterState: !isIntra,
      sellerState: seller,
      placeOfSupply: pos.name,
      stateCode: pos.code
    };
  }

  // Compare by normalized official names
  const isIntra = seller.name.toLowerCase() === pos.name.toLowerCase();
  return {
    type: isIntra ? 'INTRA_STATE' : 'INTER_STATE',
    isInterState: !isIntra,
    sellerState: seller,
    placeOfSupply: pos.name,
    stateCode: pos.code || null
  };
};

/**
 * Safely rounds numeric value to 2 decimal places.
 */
export const roundTo2Decimals = (num) => {
  if (isNaN(num) || num === null || num === undefined) return 0;
  return Math.round((Number(num) + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates GST component splits dynamically (CGST/SGST vs IGST).
 */
export const calculateGstSplit = (taxableAmount, gstRate, gstPriceType, gstClassification) => {
  const rate = Number(gstRate) || 0;
  let taxAmount = 0;
  let finalTaxable = Number(taxableAmount) || 0;

  if (gstPriceType === 'inclusive') {
    finalTaxable = finalTaxable / (1 + (rate / 100));
    taxAmount = Number(taxableAmount) - finalTaxable;
  } else {
    taxAmount = (finalTaxable * rate) / 100;
  }

  taxAmount = roundTo2Decimals(taxAmount);
  finalTaxable = roundTo2Decimals(finalTaxable);

  const isInterState = gstClassification === 'INTER_STATE';

  if (isInterState) {
    return {
      taxableAmount: finalTaxable,
      taxAmount: taxAmount,
      cgst_rate: 0,
      cgst_amount: 0,
      sgst_rate: 0,
      sgst_amount: 0,
      igst_rate: rate,
      igst_amount: taxAmount
    };
  } else {
    const halfRate = rate / 2;
    const halfAmount = roundTo2Decimals(taxAmount / 2);

    return {
      taxableAmount: finalTaxable,
      taxAmount: taxAmount,
      cgst_rate: halfRate,
      cgst_amount: halfAmount,
      sgst_rate: halfRate,
      sgst_amount: halfAmount,
      igst_rate: 0,
      igst_amount: 0
    };
  }
};
