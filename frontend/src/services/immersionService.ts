const IMMERSION_API = "https://apiv2.immersionkit.com/search";
const MEDIA_BASE = "https://us-southeast-1.linodeobjects.com/immersionkit/media/anime";

export interface ImmersionExample {
    id: string;
    sentence: string;
    translation: string;
    image: string;
    sound: string;
    title: string;
}

const CDN_TITLE_MAP: Record<string, string> = {
    "hunterxhunter": "Hunter × Hunter",
    "kon": "K-On!",
    "durarara": "Durarara!!",
    "toradora": "Toradora!",
    "angelbeats": "Angel Beats!",
    "newgame": "New Game!",
    "soundeuphonium": "Sound! Euphonium",
    "kanon2006": "Kanon (2006)",
    "relife": "ReLIFE",
    "demonslayerkimetsunoyaiba": "Demon Slayer - Kimetsu no Yaiba",
    "rezerostartinglifeinanotherworld": "Re Zero - Starting Life in Another World",
    "godsblessingonthiswonderfulworld": "God's Blessing on This Wonderful World!",
    "howlsmovingcastle": "Howl's Moving Castle",
    "kikisdeliveryservice": "Kiki's Delivery Service",
    "kinosjourney": "Kino's Journey",
    "frierenbeyondjourneysend": "Frieren Beyond Journey's End",
    "mylittlesistercantbethiscute": "My Little Sister Can't Be This Cute",
    "anohana": "Anohana: The Flower We Saw That Day",
    "alyasometimeshidesherfeelingsinrussian": "Alya Sometimes Hides Her Feelings in Russian",
    "anohanatheflowerwesawthatday": "Anohana: The Flower We Saw That Day",
    "assassinationclassroomseason1": "Assassination Classroom Season 1",
    "bakemonogatari": "Bakemonogatari",
    "bokunoheroacademiaseason1": "Boku no Hero Academia Season 1",
    "cardcaptorsakura": "Cardcaptor Sakura",
    "castleinthesky": "Castle in the sky",
    "chobits": "Chobits",
    "clannad": "Clannad",
    "clannadafterstory": "Clannad After Story",
    "dailylivesofhighschoolboys": "Daily Lives of High School Boys",
    "codegeassseason1": "Code Geass Season 1",
    "deathnote": "Death Note",
    "erased": "Erased",
    "fairytail": "Fairy Tail",
    "fatestaynightubwseason1": "Fate Stay Night UBW Season 1",
    "fatestaynightubwseason2": "Fate Stay Night UBW Season 2",
    "fatezero": "Fate Zero",
    "fermatkitchen": "Fermat Kitchen",
    "fromuponpoppyhill": "From Up on Poppy Hill",
    "fromthenewworld": "From the New World",
    "fruitsbasketseason1": "Fruits Basket Season 1",
    "fullmetalalchemistbrotherhood": "Fullmetal Alchemist Brotherhood",
    "girlsbandcry": "Girls Band Cry",
    "graveofthefireflies": "Grave of the Fireflies",
    "haruhisuzumiya": "Haruhi Suzumiya",
    "hyouka": "Hyouka",
    "istheorderarabbit": "Is The Order a Rabbit",
    "kakegurui": "Kakegurui",
    "killlakill": "Kill la Kill",
    "kokoroconnect": "Kokoro Connect",
    "littlewitchacademia": "Little Witch Academia",
    "mahoushoujomadokamagica": "Mahou Shoujo Madoka Magica",
    "myneighbortotoro": "My Neighbor Totoro",
    "nogamenolife": "No Game No Life",
    "noragami": "Noragami",
    "oneweekfriends": "One Week Friends",
    "onlyyesterday": "Only Yesterday",
    "princessmononoke": "Princess Mononoke",
    "psychopass": "Psycho Pass",
    "shirokumacafe": "Shirokuma Cafe",
    "spiritedaway": "Spirited Away",
    "steinsgate": "Steins Gate",
    "swordartonline": "Sword Art Online",
    "thecatreturns": "The Cat Returns",
    "thegardenofwords": "The Garden of Words",
    "theirregularatmagichighschool": "The Irregular at Magic High School",
    "thegirlwholeaptthroughtime": "The Girl Who Leapt Through Time",
    "thesecretworldofarrietty": "The Secret World of Arrietty",
    "thewindrises": "The Wind Rises",
    "theworldgodonlyknows": "The World God Only Knows",
    "wanderingwitchthejourneyofelaina": "Wandering Witch The Journey of Elaina",
    "weatheringwithyou": "Weathering with You",
    "whenmarniewasthere": "When Marnie Was There",
    "whisperoftheheart": "Whisper of the Heart",
    "wolfchildren": "Wolf Children",
    "yourlieinapril": "Your Lie in April",
    "yourname": "Your Name",
};

const SMALL_WORDS = new Set([
    "a", "an", "the", "in", "on", "at", "of", "for", "to", "by",
    "and", "but", "or", "nor", "la", "no", "de", "von", "x",
]);

function formatTitle(slug: string): string {
    let title: string;
    const normalized = slug.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (CDN_TITLE_MAP[normalized]) {
        title = CDN_TITLE_MAP[normalized];
    } else {
        title = slug
            .split("_")
            .filter(Boolean)
            .map((w, i) => {
                if (i === 0) return w.charAt(0).toUpperCase() + w.slice(1);
                if (SMALL_WORDS.has(w.toLowerCase())) return w.toLowerCase();
                return w.charAt(0).toUpperCase() + w.slice(1);
            })
            .join(" ");
    }
    return encodeURIComponent(title);
}

export async function searchImmersionKit(keyword: string): Promise<ImmersionExample[]> {
    const trimmed = keyword.trim();
    if (!trimmed) return [];

    try {
        const res = await fetch(`${IMMERSION_API}?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
            const data = await res.json();
            const examples = data.examples?.slice(0, 20) ?? [];
            return examples.map((ex: any) => ({
                id: ex.id || Math.random().toString(),
                sentence: ex.sentence || "",
                translation: ex.translation || "",
                image: buildImageUrl(ex.title, ex.image),
                sound: buildAudioUrl(ex.title, ex.sound),
                title: ex.title || "Unknown Anime"
            }));
        }
    } catch (err) {
        console.error("ImmersionKit fetch failed:", err);
    }
    return [];
}

function buildImageUrl(title: string, image: string): string {
    if (!image) return "";
    if (image.startsWith('http')) return image;
    return `${MEDIA_BASE}/${formatTitle(title)}/media/${encodeURIComponent(image)}`;
}

function buildAudioUrl(title: string, sound: string): string {
    if (!sound) return "";
    if (sound.startsWith('http')) return sound;
    return `${MEDIA_BASE}/${formatTitle(title)}/media/${encodeURIComponent(sound)}`;
}
