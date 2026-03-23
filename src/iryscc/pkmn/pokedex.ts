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

export const PokemonImageType = {
    highres: (natdex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${natdex}.png`,
    lowres: (natdex) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${natdex}.png`,
};

export const PokemonTypeIcons = {
    "normal": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/1.png",
    "fighting": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/2.png",
    "flying": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/3.png",
    "poison": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/4.png",
    "ground": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/5.png",
    "rock": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/6.png",
    "bug": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/7.png",
    "ghost": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/8.png",
    "steel": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/9.png",
    "fire": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/10.png",
    "water": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/11.png",
    "grass": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/12.png",
    "electric": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/13.png",
    "psychic": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/14.png",
    "ice": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/15.png",
    "dragon": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/16.png",
    "dark": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/17.png",
    "fairy": "https://raw.githubusercontent.com/PokeAPI/sprites/refs/heads/master/sprites/types/generation-vii/sun-moon/18.png",
};
