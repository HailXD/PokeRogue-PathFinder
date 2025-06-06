import json

with open('pokemon_spawn.json', 'r') as file:
    data = json.load(file)

rarities = set()
for key in data:
    rarities.add(data[key][0][1])

{'COMMON', 'ULTRA_RARE', 'BOSS', 'BOSS_ULTRA_RARE', 'RARE', 'BOSS_SUPER_RARE', 'UNCOMMON', 'SUPER_RARE', 'BOSS_RARE'}
print(rarities)