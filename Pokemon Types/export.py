import re
import json

def parse_pokemon_species_file(input_filename="pokemon-species.ts", output_filename="pokemon_types.json"):
    with open(input_filename, 'r', encoding='utf-8') as f:
        content = f.read()


    pattern = re.compile(
        r"""
        new\s+PokemonSpecies\(
        \s*
        SpeciesId\.([A-Z_0-9]+),
        \s*
        \d+,
        \s*
        (?:true|false),
        \s*
        (?:true|false),
        \s*
        (?:true|false),
        \s*
        ".*?",
        \s*
        PokemonType\.(\w+),
        \s*
        (?:PokemonType\.(\w+)|null)

        """,
        re.VERBOSE
    )

    matches = pattern.findall(content)
    
    if not matches:
        print("Warning: No Pokémon species were found. The regex might not be matching the file format.")
        return

    pokemon_types = {}

    for match in matches:
        species_raw, type1_raw, type2_raw = match

        types = [type1_raw.title()]
        if type2_raw:
            types.append(type2_raw.title())

        pokemon_types[species_raw] = types
        
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(pokemon_types, f)

    print(f"Successfully parsed {len(pokemon_types)} Pokémon.")
    print(f"Data saved to '{output_filename}'.")



if __name__ == "__main__":
    parse_pokemon_species_file()