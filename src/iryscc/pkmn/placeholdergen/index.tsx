import { g, x, n } from "@xeserv/xeact"
import { jsx } from "@meow/lib/jsx-runtime"
import POKEDEX, { PokemonImageType, PokemonNameLanguages, PokemonTypeIcons } from "../pokedex.ts";

const doGenerate = (ev, options) => {
    ev.preventDefault();

    let data = Object.fromEntries(new FormData(options));
    let ourList = doFilter(data);
    let statusDiv = g("status");
    x(statusDiv);
    statusDiv.append((
        <span>Filter returned {ourList.length} Pokémon.</span>
    ));

    let cardDiv = g("cards");
    x(cardDiv);
    cardDiv.append(...ourList.map((pkmn) => {
        let headerExtra = <div class="pkmnCard-headerExtra"></div>;
        let footer = <div class="pkmnCard-footer"></div>;

        if (data.typeicon) {
            headerExtra.append(
                <div class="pkmnCard-types">
                    {...Array.from(pkmn.types).map((type) => <img src={PokemonTypeIcons[type]}></img>)}
                </div>
            );
        }

        if (data.alllangs) {
            let names = {};
            Array.from(Object.keys(PokemonNameLanguages)).filter((lang) => lang !== data.namelang).forEach((lang) => {
                names[pkmn.name[lang]] ??= [];
                names[pkmn.name[lang]].push(lang);
            });

            let allNames = <div class="pkmnCard-allnames"></div>;
            allNames.append(...Array.from(Object.entries(names)).map((nl) => (
                <div class="pkmnCard-langname">
                    <span class="pkmnCard-langname-langs">{...nl[1].map((lang) => <span class="badge">{lang}</span>)}</span>
                    <span class="pkmnCard-langname-name">{nl[0]}</span>
                </div>
            )));

            footer.append(allNames);
        }

        return (
            <div class="pkmnCard">
                <div class="pkmnCard-header">
                    <div class="pkmnCard-header-name">
                        #{pkmn.dex.national} &ndash; {pkmn.name[data.namelang]}
                    </div>
                    {headerExtra}
                </div>
                <div class="pkmnCard-image">
                    <img src={PokemonImageType[data.imgtype](pkmn.dex.national)}></img>
                </div>
                {footer}
            </div>
       );
    }));

    g("options-clear").classList.remove("hidden");
    g("options-print").classList.remove("hidden");
    return false;
};

const handleOptionsClear = (ev, options) => {
    ev.preventDefault();

    g("options-clear").classList.add("hidden");
    g("options-print").classList.add("hidden");
    x(g("status"));
    x(g("cards"));

    //options.reset();
    //handleOptionsChange(options);

    return false;
};

const handleOptionsChange = (options) => {
    let data = Object.fromEntries(new FormData(options));

    let genlist = g("options-genlist");
    if (data.gentype == "all") {
        genlist.classList.add("hidden");
    } else {
        genlist.classList.remove("hidden");
    }
};

const doFilter = (data) => {
    let thisDex = Array.from(POKEDEX.dexes[data.dex].pokemon).map((pkmn) => POKEDEX.pokemon[pkmn]);
    let genlist = data.genlist
        .split(/(?:\s+|\n|,)/)
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => n > 0);

    if (data.gentype === "only") {
        thisDex = thisDex.filter((pkmn) => genlist.indexOf(pkmn.dex.national) !== -1);
    } else if (data.gentype === "except") {
        thisDex = thisDex.filter((pkmn) => genlist.indexOf(pkmn.dex.national) === -1);
    }

    return thisDex;
};

const init = () => {
    let options = g("options");

    let dexList = g("g_dex");
    x(dexList);
    dexList.append(...Array.from(Object.entries(POKEDEX.dexes)).map((dex) => (
        <option value={dex[0]}>{dex[1].name.en} ({dex[1].pokemon.length} Pokémon)</option>
    )));

    let imageList = g("g_imgtype");
    x(imageList);
    imageList.append(...Array.from(Object.keys(PokemonImageType)).map((img) => (
        <option value={img} selected={img === "highres"}>{img}</option>
    )));

    let langList = g("g_namelang");
    x(langList);
    langList.append(...Array.from(Object.entries(PokemonNameLanguages)).map((lang) => (
        <option value={lang[0]} selected={lang[0] === "en"}>{lang[1]}</option>
    )));

    g("options-print").addEventListener('click', (ev) => { ev.preventDefault(); setTimeout(() => window.print(), 1); return false; });
    g("options-clear").addEventListener('click', (ev) => handleOptionsClear(ev, options));
    options.addEventListener('change', () => handleOptionsChange(options));
    options.addEventListener('submit', (ev) => doGenerate(ev, options));
    handleOptionsChange(options);

    g("app-loading").classList.add("hidden");
    g("app").classList.remove("hidden");
}

init();
