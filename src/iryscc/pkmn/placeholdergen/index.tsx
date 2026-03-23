import { g, x, n } from "@xeserv/xeact"
import { jsx } from "@meow/lib/jsx-runtime"
import POKEDEX, { PokemonImage, PokemonImageVariants, PokemonNameLanguages, PokemonTypeIcons, PokemonTypeIconVariants } from "../pokedex.ts";

const doFilter = (data) => {
    let thisDex = Array.from(Object.values(POKEDEX.pokemon));
    if (data.gentype === "dex" || data.gentype === "except") {
        thisDex = Array.from(POKEDEX.dexes[data.dex].pokemon).map((pkmn) => POKEDEX.pokemon[pkmn]);
    }

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

const doGenerate = (ev, options) => {
    ev.preventDefault();

    let data = Object.fromEntries(new FormData(options));
    let ourList = doFilter(data);
    let statusDiv = g("status");
    x(statusDiv);
    statusDiv.append((
        <span>
            <strong>{ourList.length} Pokémon</strong>,
            paper size set to <strong>{{usletter:"US Letter",a4:"A4"}[data.paper]}</strong>.
        </span>
    ));

    let cardDiv = g("cards");
    x(cardDiv);
    cardDiv.className = `paper-${data.paper}`;
    cardDiv.append(...ourList.map((pkmn) => {
        let headerExtra = <div class="pkmnCard-headerExtra"></div>;
        let footer = <div class="pkmnCard-footer"></div>;

        if (data.typeimg !== "none") {
            headerExtra.append(
                <div class="pkmnCard-types">
                    {...Array.from(pkmn.types).map((type) => <img src={PokemonTypeIcons[data.typeimg](type)}></img>)}
                </div>
            );
        }

        if (data.heightweight) {
            footer.append(
                <span class="pkmnCard-heightweight">
                    {(pkmn.height * 0.1).toFixed(1)}m
                    ({Math.floor((pkmn.height * 3.93701) / 12)}'{Math.ceil((pkmn.height * 3.93701) % 12)}")
                    / {(pkmn.weight * 0.1).toFixed(1)}kg
                    ({(pkmn.weight * 0.220462).toFixed(1)}lbs)
                </span>
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
                        #{pkmn.dex.national} {pkmn.name[data.namelang]}
                    </div>
                    {headerExtra}
                </div>
                <div class="pkmnCard-image">
                    <img src={PokemonImage[data.image](pkmn.dex.national)}></img>
                </div>
                {footer}
            </div>
       );
    }));

    g("options-go").classList.remove("btn-blue");
    g("options-print").classList.add("btn-blue");
    g("options-print").classList.remove("hidden");
    g("options-clear").classList.remove("hidden");
    return false;
};

const handleOptionsClear = (ev, options) => {
    ev.preventDefault();

    let cards = g("cards");
    cards.className = "";
    x(cards);

    g("options-go").classList.add("btn-blue");
    g("options-print").classList.remove("btn-blue");
    g("options-print").classList.add("hidden");
    g("options-clear").classList.add("hidden");
    x(g("status"));

    return false;
};

const handleOptionsChange = (options) => {
    let data = Object.fromEntries(new FormData(options));

    g("options-go").classList.add("btn-blue");
    g("options-print").classList.remove("btn-blue");

    let genlist = g("options-genlist");
    let dexlist = g("options-pokedex");

    if (data.gentype === "dex") {
        dexlist.classList.remove("hidden");
        genlist.classList.add("hidden");
    } else if (data.gentype === "only") {
        dexlist.classList.add("hidden");
        genlist.classList.remove("hidden");
    } else if (data.gentype === "except") {
        dexlist.classList.remove("hidden");
        genlist.classList.remove("hidden");
    } else {
        genlist.classList.add("hidden");
        dexlist.classList.add("hidden");
    }
};

const init = () => {
    let options = g("options");

    let dexList = g("g_dex");
    x(dexList);
    dexList.append(...Array.from(Object.entries(POKEDEX.dexes))
        .toSorted((a, b) => parseInt(a[1].id) - parseInt(b[1].id))
        .map((dex) => (
            <option value={dex[0]}>{dex[1].name.en} ({dex[1].pokemon.length} Pokémon)</option>
        )));

    let imageList = g("g_image");
    x(imageList);
    imageList.append(...Array.from(Object.entries(PokemonImageVariants))
        .map((img) => (
            <option value={img[0]} selected={img[1].default}>{img[1].friendly}</option>
        )));

    let typeimgList = g("g_typeimg");
    x(typeimgList);
    typeimgList.append(<option value="none" selected>None</option>);
    typeimgList.append(...Array.from(Object.entries(PokemonTypeIconVariants))
        .map((img) => (
            <option value={img[0]}>{img[1].friendly}</option>
        )));

    let langList = g("g_namelang");
    x(langList);
    langList.append(...Array.from(Object.entries(PokemonNameLanguages))
        .map((lang) => (
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
