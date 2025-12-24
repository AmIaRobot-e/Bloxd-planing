// In .js file to load as a module clientside
// b2m and m2b mappings

const b2m = {
    "Air": "air",
    "Maple Log":"oak_log",
    "Maple Wood Planks":"oak_planks",
    "Maple Leaves":"oak_leaves",
    "Stone":"stone",
    "Messy Stone":"cobblestone",
    "Dirt": "dirt",
    "Grass Block": "grass_block"
    // ... (Full list will be included in the final delivery)
};

const m2b = {};
for(const key in b2m) {
    m2b[b2m[key]] = key;
}

module.exports = {
    b2m,
    m2b
};
