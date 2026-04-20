// SRS Service for local flashcards
export interface Card {
    id: string;
    word: string;
    text: string;
    videoId: string;
    startTime: number;
    ease: number;
    interval: number;
    repetitions: number;
    dueDate: number;
}

const STORAGE_KEY = 'bitesize_srs_cards';

export function loadCards(): Card[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
}

export function saveCard(card: Omit<Card, 'ease' | 'interval' | 'repetitions' | 'dueDate'>) {
    const cards = loadCards();
    if (cards.some(c => c.id === card.id)) return;

    const newCard: Card = {
        ...card,
        ease: 2.5,
        interval: 0,
        repetitions: 0,
        dueDate: Date.now()
    };

    cards.push(newCard);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function updateCardSRS(cardId: string, rating: number) {
    const cards = loadCards();
    const cardIndex = cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    let { ease, interval, repetitions } = cards[cardIndex];

    if (rating === 0) { // Again
        repetitions = 0;
        interval = 0;
        ease = Math.max(1.3, ease - 0.2);
    } else if (rating === 1) { // Hard
        interval = Math.max(1, Math.round(interval * 1.2));
        ease = Math.max(1.3, ease - 0.15);
    } else if (rating === 2) { // Good
        if (repetitions === 0) interval = 1;
        else if (repetitions === 1) interval = 6;
        else interval = Math.round(interval * ease);
        repetitions++;
    } else { // Easy
        if (repetitions === 0) interval = 4;
        else interval = Math.round(interval * ease * 1.3);
        repetitions++;
        ease += 0.15;
    }

    cards[cardIndex] = {
        ...cards[cardIndex],
        ease,
        interval,
        repetitions,
        dueDate: Date.now() + interval * 24 * 60 * 60 * 1000
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}
