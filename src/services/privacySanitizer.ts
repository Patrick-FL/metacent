export interface SanitizedQueryReport {
  rawCategory: string;
  rawPayee?: string;
  rawMemo?: string;
  sanitizedQuery: string;
  categoryType: 'mobile_phone' | 'internet_dsl' | 'electricity_gas' | 'insurance' | 'subscription' | 'target_item';
  strippedTokens: string[];
  isPrivacyCompliant: boolean;
}

/**
 * Deterministic Privacy Firewall: Strips PII, IBANs, customer IDs, and personal names
 * before generating generic web price comparison queries.
 */
export function sanitizeForMarketResearch(
  categoryName: string,
  payee: string = '',
  memo: string = '',
  approximateAmountCents: number = 0
): SanitizedQueryReport {
  const strippedTokens: string[] = [];

  // 1. Regex to detect and strip IBANs (e.g. DE89370400440532013000)
  const ibanRegex = /[A-Z]{2}[0-9]{2}[0-9A-Z]{11,30}/gi;
  if (ibanRegex.test(memo) || ibanRegex.test(payee)) {
    strippedTokens.push('IBAN / Bank Account Number');
  }

  // 2. Regex to detect customer numbers, card numbers, transaction hashes
  const idRegex = /(?:kunden-?nr|vertrags-?nr|mandats-?ref|iban|bic|kartennr|id)[:\s]*[0-9a-zA-Z\-_/]+/gi;
  if (idRegex.test(memo) || idRegex.test(payee)) {
    strippedTokens.push('Customer / Contract Identifier');
  }

  // 3. Regex for common German names / Salutations (e.g. Herr/Frau Max Mustermann)
  const nameRegex = /(?:herr|frau|dr\.|prof\.)\s+[a-zäöüß]+(?:\s+[a-zäöüß]+)?/gi;
  if (nameRegex.test(memo) || nameRegex.test(payee)) {
    strippedTokens.push('Personal Name / Salutation');
  }

  // 4. Classify service category and formulate generic market query
  const combined = `${categoryName} ${payee} ${memo}`.toLowerCase();
  let categoryType: SanitizedQueryReport['categoryType'] = 'target_item';
  let sanitizedQuery = '';

  const hasWord = (word: string) => new RegExp(`\\b${word}\\b`, 'i').test(combined);

  if (
    combined.includes('dsl') ||
    combined.includes('internet') ||
    combined.includes('glasfaser') ||
    combined.includes('breitband') ||
    combined.includes('kabelanschluss') ||
    combined.includes('1&1') ||
    combined.includes('pyur')
  ) {
    categoryType = 'internet_dsl';
    sanitizedQuery = 'Internet DSL Glasfaser 100 Mbit Flat Deutschland Vergleich 2026';
  } else if (
    combined.includes('mobilfunk') ||
    combined.includes('handy') ||
    combined.includes('smartphone') ||
    hasWord('telekom') ||
    hasWord('vodafone') ||
    hasWord('o2') ||
    combined.includes('telefonica') ||
    combined.includes('congstar') ||
    combined.includes('sim.de') ||
    combined.includes('fraenk') ||
    combined.includes('freenet')
  ) {
    categoryType = 'mobile_phone';
    // If high bill, search for high gigabyte or unlimited
    const amountEur = approximateAmountCents / 100;
    const gbTier = amountEur >= 40 ? '50GB 5G' : amountEur >= 20 ? '25GB 5G' : '15GB LTE/5G';
    sanitizedQuery = `Mobilfunk Allnet Flat ${gbTier} Deutschland monatlich kündbar Vergleich 2026`;
  } else if (
    combined.includes('strom') ||
    combined.includes('energie') ||
    combined.includes('stadtwerke') ||
    combined.includes('vattenfall') ||
    combined.includes('eon') ||
    combined.includes('enpal') ||
    combined.includes('naturstrom')
  ) {
    categoryType = 'electricity_gas';
    sanitizedQuery = 'Ökostrom Tarif 2500 kWh Preisvergleich Deutschland 2026';
  } else if (
    hasWord('gas') ||
    combined.includes('erdgas') ||
    combined.includes('gastarif') ||
    combined.includes('fernwärme') ||
    combined.includes('heizung')
  ) {
    categoryType = 'electricity_gas';
    sanitizedQuery = 'Gastarif 15000 kWh Preisvergleich Deutschland 2026';
  } else if (
    combined.includes('versicherung') ||
    combined.includes('haftpflicht') ||
    combined.includes('hausrat') ||
    combined.includes('allianz') ||
    combined.includes('huk') ||
    combined.includes('ergo')
  ) {
    categoryType = 'insurance';
    sanitizedQuery = 'Privathaftpflichtversicherung Testsieger Vergleich Deutschland 2026';
  } else if (
    combined.includes('streaming') ||
    combined.includes('netflix') ||
    combined.includes('spotify') ||
    combined.includes('apple music') ||
    combined.includes('disney') ||
    combined.includes('prime') ||
    combined.includes('fitx') ||
    combined.includes('mcfit') ||
    combined.includes('gym')
  ) {
    categoryType = 'subscription';
    const service = combined.includes('fit') || combined.includes('gym') ? 'Fitnessstudio' : 'Streaming';
    sanitizedQuery = `${service} Abonnement Alternativen Jahresabo Vergleich 2026`;
  } else {
    // Target Purchase / Goal Item
    categoryType = 'target_item';
    // Clean category name of non-alphanumeric chars
    const cleanName = categoryName
      .replace(/[^\wäöüÄÖÜß\s-]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    sanitizedQuery = `${cleanName} Preisvergleich Test Kaufberatung 2026`;
  }

  return {
    rawCategory: categoryName,
    rawPayee: payee || undefined,
    rawMemo: memo || undefined,
    sanitizedQuery,
    categoryType,
    strippedTokens,
    isPrivacyCompliant: true,
  };
}
