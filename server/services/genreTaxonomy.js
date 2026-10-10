// Taxonomia de gêneros musicais: agrupa os gêneros "crus" (vindos do
// Spotify/Wikidata) em famílias amplas ("principal"), preservando o
// gênero original como subgênero.
//
// A classificação é feita por REGRAS de palavra-chave (pega também
// gêneros novos que apareçam depois) + OVERRIDES para os casos que a
// palavra-chave não resolve (nomes próprios, estrangeirismos, híbridos).
//
// Este módulo é puro: não acessa banco nem rede.

export const FAMILIES = [
    { id: "pop", label: "Pop" },
    { id: "rock", label: "Rock" },
    { id: "metal", label: "Metal" },
    { id: "punk", label: "Punk & Hardcore" },
    { id: "hiphop", label: "Hip Hop & Rap" },
    { id: "electronic", label: "Eletrônico & Dance" },
    { id: "jazz", label: "Jazz" },
    { id: "blues", label: "Blues" },
    { id: "rnb", label: "R&B & Soul" },
    { id: "funk", label: "Funk" },
    { id: "folk", label: "Folk & Tradicional" },
    { id: "country", label: "Country" },
    { id: "latin", label: "Latino" },
    { id: "reggae", label: "Reggae & Caribe" },
    { id: "gospel", label: "Gospel & Cristão" },
    { id: "classical", label: "Clássico & Ópera" },
    { id: "world", label: "Mundo & Regional" },
    { id: "other", label: "Outros" }
];

const FAMILY_ORDER = FAMILIES.map((f) => f.id);

const FAMILY_LABELS = Object.fromEntries(
    FAMILIES.map((f) => [f.id, f.label])
);

// Casos que a regra por palavra-chave erraria. Chave = gênero cru
// (minúsculo), valor = id da família.
const OVERRIDES = {
    // Híbridos com "rap"/"trap" que pertencem a outra família
    "punk rap": "hiphop",
    "rap rock": "rock",
    "rap metal": "metal",
    "rap chrétien": "gospel",
    "trap latino": "latin",
    "trap soul": "rnb",
    "trap funk": "funk",
    "edm trap": "electronic",
    "country rap": "hiphop",
    "country hip hop": "hiphop",
    "emo rap": "hiphop",
    "jazz rap": "hiphop",

    // Eletrônico que colide com palavras de outras famílias
    "dubstep": "electronic",
    "post-dubstep": "electronic",
    "dub techno": "electronic",
    "liquid funk": "electronic",
    "funky house": "electronic",
    "jazz house": "electronic",
    "latin house": "electronic",
    "drumstep": "electronic",
    "deathstep": "electronic",
    "hardcore techno": "electronic",
    "hardcore hip hop": "hiphop",
    "hardcore": "punk",
    "lo-fi": "electronic",
    "lo-fi beats": "electronic",
    "lo-fi house": "electronic",
    "vietnamese lo-fi": "electronic",
    "lo-fi music": "electronic",
    "lo-fi indie": "pop",
    "uk funky": "electronic",
    "chillwave": "electronic",
    "chillstep": "electronic",
    "electroclash": "electronic",
    "electro swing": "electronic",
    "happy hardcore": "electronic",
    "hi-nrg": "electronic",
    "big beat": "electronic",
    "big room": "electronic",
    "3 step": "electronic",
    "epadunk": "electronic",
    "freestyle": "electronic",
    "electro": "electronic",
    "new rave": "electronic",
    "afro house": "electronic",
    "afro tech": "electronic",
    "afropiano": "electronic",
    "amapiano": "electronic",
    "gqom": "electronic",
    "kuduro": "electronic",
    "riddim": "electronic",
    "tekno": "electronic",
    "funkot": "electronic",
    "budots": "electronic",
    "ratchet music": "electronic",
    "ballroom vogue": "electronic",
    "moombahton": "electronic",
    "witch house": "electronic",
    "drone": "electronic",
    "drone metal": "metal",
    "experimental": "electronic",
    "experimental music": "electronic",
    "avant-garde": "electronic",
    "noise music": "electronic",
    "industrial": "electronic",
    "industrial music": "electronic",
    "trip hop": "electronic",

    // Rock / pop colidindo com outras famílias
    "christian rock": "rock",
    "christian hip hop": "hiphop",
    "christian country": "country",
    "christian folk": "folk",
    "christian pop": "pop",
    "christian alternative rock": "rock",
    "folk rock": "rock",
    "celtic rock": "rock",
    "country rock": "rock",
    "blues rock": "rock",
    "britpop": "rock",
    "baroque pop": "pop",
    "orchestral pop": "pop",
    "symphonic rock": "rock",
    "pop rock": "rock",
    "electronic rock": "rock",
    "psychedelic music": "rock",
    "neo-psychedelic": "rock",
    "neo-psychedelia": "rock",
    "southern gothic": "rock",
    "cold wave": "electronic",
    "darkwave": "electronic",
    "new wave": "rock",
    "shoegaze": "rock",
    "grunge": "rock",

    // R&B / soul / funk
    "rhythm and blues": "rnb",
    "gospel r&b": "rnb",
    "hip-hop soul": "rnb",
    "g-funk": "hiphop",
    "p-funk": "funk",
    "go-go": "funk",
    "boogie": "funk",

    // Reggae / caribe colidindo
    "reggaeton": "latin",
    "dancehall": "reggae",
    "rocksteady": "reggae",
    "ska": "reggae",
    "soca": "reggae",
    "calypso": "reggae",
    "ragga": "reggae",
    "dub": "reggae",
    "lovers rock": "reggae",

    // Latino / world
    "afrobeat": "world",
    "afrobeats": "world",
    "latin afrobeat": "latin",
    "latin afrobeats": "latin",
    "afro adura": "world",
    "afroswing": "hiphop",
    "flamenco pop": "latin",
    "bachata pop": "latin",
    "tamil dance": "world",
    "variété française": "pop",
    "opm": "pop",
    "pop kreatif": "pop",
    "indie": "pop",
    "jam band": "rock",
    "aor": "rock",
    "visual kei": "rock",
    "bisrock": "rock",
    "pinoy alternative": "rock",
    "neue deutsche welle": "rock",
    "madchester": "rock",
    "slowcore": "rock",
    "sad sierreño": "latin",
    "norteño-sax": "latin",
    "electro corridos": "latin",
    "corridos bélicos": "latin",
    "popular colombian music": "latin",
    "música mexicana": "latin",
    "seresta": "latin",
    "trova": "latin",
    "nueva trova": "latin",
    "cha cha cha": "latin",
    "techengue": "latin",
    "hollands": "world",
    "gufeng": "world",
    "russelåter": "world",
    "koplo": "world",
    "egyptian shaabi": "world",
    "southern thai music": "world",
    "alté": "world",
    "rumba congolaise": "world",
    "asakaa": "hiphop",
    "hipdut": "hiphop",
    "schlager": "pop",
    "schlagerparty": "pop",
    "dansband": "pop",
    "dansktop": "pop",
    "swedish ballads": "pop",
    "k-ballad": "pop",
    "shibuya-kei": "pop",
    "malayalam pop": "pop",
    "malaysian pop": "pop",
    "malay pop": "pop",
    "desi pop": "pop",

    // Outros / genéricos
    "comedy": "other",
    "spoken word": "other",
    "soundtrack": "other",
    "musicals": "other",
    "children's music": "other",
    "anime": "other",
    "christmas": "other",
    "new age": "other",
    "space music": "other",
    "easy listening": "other",
    "adult standards": "other",
    "exotica": "other",
    "lounge": "other",
    "vocaloid": "other",
    "video game music": "other",
    "japanese vgm": "other",
    "dark cabaret": "other",
    "bacardi": "other",
    "private school piano": "classical",
    "new age music": "other",
    "adult contemporary music": "pop",
    "gospel music": "gospel",
    "classical music": "classical",
    "country music": "country",
    "rock music": "rock",
    "pop music": "pop",
    "folk music": "folk",
    "ambient music": "electronic",
    "heavy metal music": "metal",
    "house music": "electronic",
    "electronic music": "electronic",
    "electronic dance music": "electronic",
    "dance music": "electronic",
    "latin music": "latin",
    "traditional folk music": "folk",
    "intelligent dance music": "electronic",
    "psychedelic music": "rock"
};

// Regras por palavra-chave, verificadas NESTA ORDEM.
const RULES = [
    {
        family: "punk",
        keywords: [
            "hardcore punk",
            "post-hardcore",
            "melodic hardcore",
            "punk",
            "screamo",
            "emocore",
            "emo",
            "queercore",
            "riot grrrl",
            "mathcore"
        ]
    },
    {
        family: "metal",
        keywords: [
            "metal",
            "metalcore",
            "deathcore",
            "grindcore",
            "djent"
        ]
    },
    {
        family: "hiphop",
        keywords: [
            "hip hop",
            "hip-hop",
            "hiplife",
            "boom bap",
            "trap",
            "drill",
            "grime",
            "phonk",
            "crunk",
            "hyphy",
            "horrorcore",
            "nerdcore",
            "chopper",
            "mumble",
            "gangster",
            "gangsta",
            "dirty south",
            "rap"
        ]
    },
    {
        family: "classical",
        keywords: [
            "opera",
            "choral",
            "chamber music",
            "baroque",
            "requiem",
            "gregorian",
            "symphony",
            "orchestral",
            "orchestra",
            "neoclassical",
            "classical",
            "medieval",
            "minimalism"
        ]
    },
    {
        family: "jazz",
        keywords: [
            "jazz",
            "bebop",
            "bop",
            "swing music",
            "ragtime",
            "big band",
            "boogie-woogie"
        ]
    },
    { family: "blues", keywords: ["blues"] },
    {
        family: "rnb",
        keywords: [
            "r&b",
            "rhythm and blues",
            "soul",
            "motown",
            "doo-wop",
            "new jack swing",
            "quiet storm"
        ]
    },
    { family: "funk", keywords: ["funk"] },
    {
        family: "gospel",
        keywords: [
            "gospel",
            "ccm",
            "worship",
            "christian",
            "pentecostal",
            "evangelical"
        ]
    },
    {
        family: "world",
        keywords: [
            "afrobeat",
            "highlife",
            "raï",
            "gnawa",
            "kizomba",
            "zouk",
            "kompa",
            "bhangra",
            "dangdut",
            "malay",
            "enka",
            "kayokyoku",
            "manele",
            "arabesk",
            "laïko",
            "iskelmä",
            "luk thung",
            "qawwali",
            "sufi",
            "sholawat",
            "bhajan",
            "ghazal",
            "khaleeji",
            "mizrahi",
            "fado",
            "chanson",
            "ndombolo",
            "bikutsi",
            "maskandi",
            "singeli",
            "gengetone",
            "bongo flava",
            "azonto",
            "shatta",
            "mahraganat",
            "chaabi",
            "karadeniz",
            "entehno",
            "oyun havasi",
            "garba",
            "batak",
            "maluku",
            "lagu",
            "kundiman",
            "harana",
            "kagok",
            "desi",
            "bollywood",
            "kollywood",
            "tollywood",
            "mollywood",
            "sandalwood",
            "bhojiwood",
            "phleng",
            "neomelodico",
            "canzone napoletana",
            "coupé décalé",
            "polka",
            "zydeco",
            "cajun",
            "native american",
            "fújì",
            "devotional"
        ]
    },
    {
        family: "latin",
        keywords: [
            "salsa",
            "cumbia",
            "bachata",
            "reggaeton",
            "merengue",
            "mambo",
            "timba",
            "son cubano",
            "guaracha",
            "bolero",
            "flamenco",
            "tango",
            "bossa",
            "samba",
            "pagode",
            "axé",
            "forró",
            "forro",
            "brega",
            "piseiro",
            "arrocha",
            "sertanejo",
            "mpb",
            "chicha",
            "huayno",
            "chamamé",
            "cuarteto",
            "murga",
            "candombe",
            "vallenato",
            "norteño",
            "norteno",
            "corrido",
            "banda",
            "grupera",
            "duranguense",
            "tejano",
            "ranchera",
            "mariachi",
            "dembow",
            "neoperreo",
            "punta",
            "latin",
            "tropical music",
            "urbano latino",
            "rkt",
            "turreo",
            "tecnobrega",
            "agronejo",
            "sierreño",
            "sierreno",
            "champeta",
            "folclor",
            "folklore",
            "punto guajiro",
            "son jarocho",
            "villancicos"
        ]
    },
    {
        family: "reggae",
        keywords: [
            "reggae",
            "ragga",
            "rocksteady",
            "ska",
            "soca",
            "calypso"
        ]
    },
    {
        family: "country",
        keywords: [
            "country",
            "bluegrass",
            "americana",
            "honky tonk",
            "newgrass",
            "red dirt",
            "outlaw"
        ]
    },
    {
        family: "folk",
        keywords: [
            "folk",
            "traditional music",
            "neofolk",
            "singer-songwriter",
            "sea shanties",
            "celtic"
        ]
    },
    {
        family: "rock",
        keywords: [
            "rock",
            "rockabilly",
            "psychobilly",
            "shoegaze",
            "grunge",
            "krautrock"
        ]
    },
    {
        family: "pop",
        keywords: [
            "pop",
            "synthpop",
            "hyperpop",
            "europop",
            "electropop",
            "afropop",
            "mandopop",
            "cantopop",
            "ballad",
            "opm"
        ]
    },
    {
        family: "electronic",
        keywords: [
            "techno",
            "tekno",
            "house",
            "trance",
            "dubstep",
            "jungle",
            "breakbeat",
            "breakcore",
            "ambient",
            "downtempo",
            "synthwave",
            "vaporwave",
            "idm",
            "edm",
            "electronic",
            "hardstyle",
            "gabber",
            "frenchcore",
            "speedcore",
            "drum and bass",
            "drumstep",
            "disco",
            "bass",
            "garage",
            "glitch",
            "electronica",
            "dance",
            "club",
            "footwork",
            "bounce",
            "ebm",
            "chiptune",
            "rave",
            "nightcore"
        ]
    },
    { family: "pop", keywords: ["indie"] },
    {
        family: "other",
        keywords: [
            "comedy",
            "spoken",
            "soundtrack",
            "musical",
            "children",
            "anime",
            "christmas",
            "new age",
            "easy listening",
            "exotica",
            "lounge",
            "humour",
            "satire",
            "ribaldry"
        ]
    }
];

export function classifyGenre(genre) {
    const value = String(genre ?? "")
        .toLowerCase()
        .trim();

    if (!value) {
        return "other";
    }

    if (OVERRIDES[value]) {
        return OVERRIDES[value];
    }

    for (const rule of RULES) {
        if (
            rule.keywords.some((keyword) =>
                value.includes(keyword)
            )
        ) {
            return rule.family;
        }
    }

    return "other";
}

export function getFamilyLabel(familyId) {
    return FAMILY_LABELS[familyId] || familyId;
}

export function getFamilyOrder() {
    return FAMILY_ORDER;
}
