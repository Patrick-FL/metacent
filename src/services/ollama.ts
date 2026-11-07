import { Category } from '../types';

export interface OllamaCategorizationResponse {
  categoryId: string;
  confidence: number;
  model: string;
}

/**
 * Service to request local AI categorization from a running Ollama daemon.
 * Target models: llama3.2:3b, qwen2.5:3b, phi3.5.
 */
export async function categorizeWithOllama(
  payee: string,
  memo: string,
  amountCents: number,
  categories: Category[],
  model: string = 'llama3.2:3b'
): Promise<OllamaCategorizationResponse | null> {
  const categoryNames = categories.map((c) => `"${c.id}": "${c.name}"`).join(', ');

  const prompt = `Du bist ein intelligenter Assistent für Buchungskategorisierung in einer Finanz-App.
Gegeben ist eine Buchung:
- Zahlungsempfänger: "${payee}"
- Verwendungszweck: "${memo}"
- Betrag: ${(amountCents / 100).toFixed(2)} EUR

Wähle die passendste Kategorie aus folgender Liste:
{ ${categoryNames} }

Antworte ausschließlich mit einem JSON-Objekt im Format:
{"categoryId": "<id>", "confidence": 0.9}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const res = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        format: 'json',
        stream: false,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallbackHeuristic(payee, categories);
    }

    const json = await res.json();
    const parsed = JSON.parse(json.response);
    if (parsed.categoryId && categories.some((c) => c.id === parsed.categoryId)) {
      return {
        categoryId: parsed.categoryId,
        confidence: parsed.confidence || 0.85,
        model,
      };
    }
  } catch {
    // If Ollama is not running, gracefully use local semantic heuristic
    return fallbackHeuristic(payee, categories);
  }

  return fallbackHeuristic(payee, categories);
}

/**
 * Local lightweight heuristic fallback when Ollama is offline.
 */
function fallbackHeuristic(payee: string, categories: Category[]): OllamaCategorizationResponse | null {
  const p = payee.toLowerCase();

  const keywords: Record<string, string[]> = {
    'cat-lebensmittel': ['supermarkt', 'rewe', 'edeka', 'aldi', 'lidl', 'kaufland', 'bäckerei', 'baeckerei'],
    'cat-gastronomie': ['restaurant', 'café', 'cafe', 'bar', 'pizzeria', 'mcdonalds', 'burger', 'sumup'],
    'cat-strom': ['stadtwerke', 'energie', 'vattenfall', 'strom', 'gas'],
    'cat-telefon': ['telekom', 'vodafone', 'o2', 'telefonica', 'congstar'],
    'cat-unterhaltung': ['spotify', 'netflix', 'amazon prime', 'cinema', 'kino', 'steam'],
    'cat-mobilitaet': ['db vertrieb', 'bahn', 'uber', 'bolt', 'tankstelle', 'aral', 'shell', 'total'],
    'cat-gesundheit': ['apotheke', 'zahnarzt', 'arzt', 'dm-drogerie', 'rossmann'],
  };

  for (const [catId, words] of Object.entries(keywords)) {
    if (words.some((w) => p.includes(w))) {
      if (categories.some((c) => c.id === catId)) {
        return {
          categoryId: catId,
          confidence: 0.8,
          model: 'local-heuristic',
        };
      }
    }
  }

  return null;
}

