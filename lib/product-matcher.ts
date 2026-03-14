interface VideoInput {
  title: string | null;
  description: string | null;
  category: string | null;
}

interface ProductInput {
  id: string;
  title: string;
  tags: string | null;
  productType: string | null;
  vendor: string | null;
}

interface MatchResult {
  productId: string;
  title: string;
  score: number;
}

function extractWords(text: string | null): Set<string> {
  if (!text) return new Set();
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  Array.from(a).forEach((word) => {
    if (b.has(word)) overlap++;
  });
  return overlap / Math.max(a.size, b.size);
}

export function matchProducts(video: VideoInput, products: ProductInput[]): MatchResult[] {
  const videoWords = new Set(
    Array.from(extractWords(video.title))
      .concat(Array.from(extractWords(video.description)))
      .concat(Array.from(extractWords(video.category)))
  );

  const results = products.map((product) => {
    const titleWords = extractWords(product.title);
    const tagWords = extractWords(product.tags);
    const typeWords = extractWords(product.productType);
    const vendorWords = extractWords(product.vendor);

    const titleScore = overlapScore(videoWords, titleWords) * 0.4;
    const tagScore = overlapScore(videoWords, tagWords) * 0.3;
    const typeScore = overlapScore(videoWords, typeWords) * 0.2;
    const vendorScore = overlapScore(videoWords, vendorWords) * 0.1;

    const score = Math.min(1, titleScore + tagScore + typeScore + vendorScore);

    return { productId: product.id, title: product.title, score };
  });

  return results.filter((r) => r.score > 0).sort((a, b) => b.score - a.score);
}
