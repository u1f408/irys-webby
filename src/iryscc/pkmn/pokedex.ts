import POKEDEX from "./pokedex.json";
export default POKEDEX;

export const PokemonNameLanguages = {
    "en": "English",
    "ja": "日本語",
    "ko": "한국어",
    "de": "Deutsch",
    "fr": "Français",
    "it": "Italiano",
    "es": "Español",
};

export const PokemonImage = {
    "official-artwork": (natdex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${natdex}.png`,
    "home": (natdex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${natdex}.png`,
    "dream-world": (natdex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/dream-world/${natdex}.svg`,
    "sprite": (natdex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${natdex}.png`,
};

export const PokemonImageVariants = {
    "official-artwork": {
        default: true,
        friendly: "High resolution art (default)",
    },
    "home": {
        friendly: "Pokémon Home art",
    },
    "dream-world": {
        friendly: "Pokémon Dream World art (not all Pokémon included!)",
    },
    "sprite": {
        friendly: "Classic sprites",
    },
};

const typeIDs = {
    "normal": 1,
    "fighting": 2,
    "flying": 3,
    "poison": 4,
    "ground": 5,
    "rock": 6,
    "bug": 7,
    "ghost": 8,
    "steel": 9,
    "fire": 10,
    "water": 11,
    "grass": 12,
    "electric": 13,
    "psychic": 14,
    "ice": 15,
    "dragon": 16,
    "dark": 17,
    "fairy": 18,
};

export const PokemonTypeIcons = {
    "scarlet-violet": (type) => `https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-ix/scarlet-violet/${typeIDs[type]}.png`,
    "sword-shield": (type) => `https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-viii/sword-shield/${typeIDs[type]}.png`,
    "sun-moon": (type) => `https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/${typeIDs[type]}.png`,
};

export const PokemonTypeIconVariants = {
    "scarlet-violet": {
        friendly: 'Scarlet/Violet',
    },
    "sword-shield": {
        friendly: 'Sword/Shield (best for monochrome prints)',
    },
    "sun-moon": {
        friendly: 'Sun/Moon (most "classic" looking)',
    },
};
