#! /usr/bin/env python3

import requests
import json

def get_pokemon(name, url):
    print("--> fetching pokemon %s: %s" % (name, url))
    r = requests.get(url)
    r.raise_for_status()
    pkmn = r.json()

    variant_pkmn = [x["pokemon"] for x in pkmn["varieties"] if x["is_default"] == True][0]
    print("-----> fetching variant %s: %s" % (variant_pkmn["name"], variant_pkmn["url"]))
    vr = requests.get(variant_pkmn["url"])
    vr.raise_for_status()
    variant = vr.json()

    flags = []
    if pkmn["is_mythical"]:
        flags.append("mythical")
    if pkmn["is_legendary"]:
        flags.append("legendary")
    if pkmn["is_baby"]:
        flags.append("baby")

    typelist = sorted([(x["slot"], x["type"]["name"]) for x in variant["types"]], key=lambda x: x[0])
    natdex = [x["entry_number"] for x in pkmn["pokedex_numbers"] if x["pokedex"]["name"] == "national"][0]
    output = {
        "name": dict([(x["language"]["name"], x["name"]) for x in pkmn["names"]]),
        "dex": dict([(x["pokedex"]["name"], x["entry_number"]) for x in pkmn["pokedex_numbers"]]),
        "types": [x[1] for x in typelist],
        "flags": flags,
        "height": variant["height"],
        "weight": variant["weight"],
    }

    return output

def get_dex(name, url, include_entries=False):
    print("--> fetching pokedex %s: %s" % (name, url))
    r = requests.get(url)
    r.raise_for_status()
    dex = r.json()

    output = {
        "id": "%d" % dex["id"],
        "name": dict([(x["language"]["name"], x["name"]) for x in dex["names"]]),
    }

    if include_entries:
        output["pokemon_entries"] = dex["pokemon_entries"]

    return output

def main():
    print("==> fetching pokedexes...")
    r = requests.get("https://pokeapi.co/api/v1/pokedex/?limit=100000&offset=0")
    r.raise_for_status()

    dexes = {}
    for dex in r.json()["results"]:
        dexes[dex["name"]] = get_dex(dex["name"], dex["url"], include_entries=(dex["name"] == "national"))

    natdex_entries = dexes["national"].pop("pokemon_entries")
    print("==> national dex has %d entries, fetching..." % len(natdex_entries))
    allPkmn = [get_pokemon(entry["pokemon_species"]["name"], entry["pokemon_species"]["url"]) for entry in natdex_entries]

    print("==> populating per-dex pokemon list...")
    for dexName in dexes.keys():
        dexes[dexName]["pokemon"] = ["%d" % pkmn["dex"]["national"] for pkmn in allPkmn if dexName in pkmn["dex"]]

    output = {
        "pokemon": dict([("%d" % pkmn["dex"]["national"], pkmn) for pkmn in allPkmn]),
        "dexes": dexes,
    }

    print("==> writing to 'pokedex.json'...")
    with open("pokedex.json", "w") as fh:
        json.dump(output, fh, sort_keys=True, indent=2)

if __name__ == "__main__":
    main()
