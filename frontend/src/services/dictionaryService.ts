// Merged Dictionary Service from Immersion-Flashcard
const MAZII_WORD_API = 'https://mazii.net/api/search';
const MAZII_KANJI_API = 'https://mazii.net/api/search/kanji/v3';

export interface DictResult {
    word: string;
    reading: string;
    meaning: string;
    hanviet?: string;
    level?: string;
    onyomi?: string;
    kunyomi?: string;
    type: 'word' | 'kanji';
}

export async function lookupMazii(query: string): Promise<DictResult | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    try {
        // Try word search first
        const res = await fetch(MAZII_WORD_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dict: 'javi',
                type: 'word',
                query: trimmed,
                limit: 1,
                page: 1
            })
        });

        const data = await res.json();
        const results = data?.results || data?.data || [];

        if (results.length > 0) {
            const item = results[0];
            return {
                word: item.word || item.kanji || trimmed,
                reading: item.phonetic || item.reading || item.kana || '',
                meaning: cleanMeaning(item.mean || item.meaning || item.vi || ''),
                hanviet: item.short_mean || item.hanviet || '',
                type: 'word'
            };
        }

        // If no word, try Kanji search
        if (trimmed.length === 1) {
            const kRes = await fetch(MAZII_KANJI_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: trimmed, dict: 'javi' })
            });
            const kData = await kRes.json();
            const kResults = kData?.results || kData?.data || [];
            if (kResults.length > 0) {
                const k = kResults[0];
                return {
                    word: k.kanji || trimmed,
                    reading: '',
                    meaning: cleanMeaning(k.detail || k.mean || k.vi || ''),
                    hanviet: k.short_mean || k.hanviet || '',
                    level: k.level || '',
                    onyomi: k.on || '',
                    kunyomi: k.kun || '',
                    type: 'kanji'
                };
            }
        }

        return null;
    } catch (err) {
        console.error('Dictionary lookup failed:', err);
        return null;
    }
}

function cleanMeaning(raw: string): string {
    if (!raw) return '';
    let clean = raw.replace(/<[^>]*>/g, '');
    clean = clean.replace(/^[\d①②③④⑤⑥⑦⑧⑨⑩]+[.)\s]*/gm, '');
    const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.slice(0, 3).join('; ');
}

export async function fetchKanjiStrokes(kanji: string) {
    if (!kanji) return null;
    const charCode = kanji.charCodeAt(0);
    try {
        const res = await fetch(`https://heyj.eupgroup.net/assets/strokes/${charCode}.json`);
        if (res.ok) return await res.json();
    } catch (e) {
        console.warn('Strokes fetch failed');
    }
    return null;
}
