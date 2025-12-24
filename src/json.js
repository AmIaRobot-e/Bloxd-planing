// Convert between the read .schem and .bloxdschem files
const { b2m, m2b } = require("./block-jsons.js");

function posToIdxBloxd(pos, size) {
    return pos[0] * size[1] * size[2] + pos[1] * size[2] + pos[2];
}

const mcJSONToBloxd = function (mcJson, name = "New Schematic") {
    function idxToPos(idx, size) {
        const x = idx % size[0];
        const y = Math.floor(idx / (size[0] * size[2]));
        const z = (size[2] - 1 - Math.floor(idx / size[0]) % size[2]);
        return [x, y, z];
    }

    const bloxdJson = {
        name: name,
        pos: [0, 0, 0], // Origin at (0,0,0) as requested
        size: mcJson.size,
        chunks: []
    };

    const chunksSize = mcJson.size.map(axis => Math.ceil(axis / 32));

    // Initialize chunks
    for(let cx = 0; cx < chunksSize[0]; cx++) {
        for(let cy = 0; cy < chunksSize[1]; cy++) {
            for(let cz = 0; cz < chunksSize[2]; cz++) {
                bloxdJson.chunks.push({
                    pos: [cx, cy, cz],
                    blocks: new Array(32768).fill(0)
                });
            }
        }
    }

    // Convert blocks
    for(let i = 0; i < mcJson.blocks.length; i++) {
        const pos = idxToPos(i, mcJson.size);
        const chunkPos = pos.map(axis => Math.floor(axis / 32));
        const chunkLocalPos = pos.map(axis => axis % 32);
        
        const chunkIdx = chunkPos[0] * chunksSize[1] * chunksSize[2] + chunkPos[1] * chunksSize[2] + chunkPos[2];
        const localIdx = posToIdxBloxd(chunkLocalPos, [32, 32, 32]);
        
        const mcBlockId = mcJson.palette[mcJson.blocks[i]];
        const bloxdBlockName = m2b[mcBlockId] || "Dirt";
        // Note: In a real implementation, you'd map names to Bloxd's internal numeric IDs
        // For now, we're following the structure provided
        bloxdJson.chunks[chunkIdx].blocks[localIdx] = bloxdBlockName; 
    }

    return bloxdJson;
};

module.exports = {
    mcJSONToBloxd
};
