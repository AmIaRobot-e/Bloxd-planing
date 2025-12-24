// Read and write .bloxdschem files using avsc
const { Buffer } = require("buffer");
const avsc = require("avsc");

const schema0 = avsc.Type.forSchema({
    type: "record",
    name: "Schematic",
    fields: [
        { name: 'headers', type: { type: 'fixed', size: 4 }, default: "\u{0}\u{0}\u{0}\u{0}" },
        { name: "name", type: "string" },
        { name: "x", type: "int" },
        { name: "y", type: "int" },
        { name: "z", type: "int" },
        { name: "sizeX", type: "int" },
        { name: "sizeY", type: "int" },
        { name: "sizeZ", type: "int" },
        {
            name: "chunks",
            type: {
                type: "array",
                items: {
                    type: "record",
                    fields: [
                        { name: "x", type: "int" },
                        { name: "y", type: "int" },
                        { name: "z", type: "int" },
                        { name: "blocks", type: "bytes" }
                    ]
                }
            }
        }
    ]
});

const parse = function(buffer) {
    let avroJson;
    try {
        avroJson = schema0.fromBuffer(buffer);
    } catch (e) {
        console.error("Failed to parse bloxdschem", e);
        return null;
    }
    
    const json = {
        name: avroJson.name,
        pos: [ avroJson.x, avroJson.y, avroJson.z ],
        size: [ avroJson.sizeX, avroJson.sizeY, avroJson.sizeZ ],
        chunks: []
    };
    
    for(const avroChunk of avroJson.chunks) {
        const chunk = {
            pos: [ avroChunk.x, avroChunk.y, avroChunk.z ],
            blocks: []
        };

        let avroI = 0;
        function decodeLEB128() {
            let shift = 0;
            let value = 0;
            while(true) {
                const byte = avroChunk.blocks[avroI++];
                value |= (byte & 127) << shift;
                shift += 7;
                if((byte & 128) !== 128) break;
            }
            return value;
        }
        
        while(avroI < avroChunk.blocks.length) {
            const amount = decodeLEB128();
            const id = decodeLEB128();
            for(let i = 0; i < amount; i++) {
                chunk.blocks.push(id);
            }
        }
        json.chunks.push(chunk);
    }
    return json;
}

const write = function(json) {
    function encodeLEB128(value) {
        const bytes = [];
        while((value & -128) != 0) {
            bytes.push(value & 127 | 128);
            value >>>= 7;
        }
        bytes.push(value);
        return bytes;
    }

    const avroJson = {
        name: json.name,
        x: json.pos[0],
        y: json.pos[1],
        z: json.pos[2],
        sizeX: json.size[0],
        sizeY: json.size[1],
        sizeZ: json.size[2],
        chunks: []
    };

    for(const chunk of json.chunks) {
        const avroChunk = {
            x: chunk.pos[0],
            y: chunk.pos[1],
            z: chunk.pos[2]
        };
        const RLEArray = [];
        if (chunk.blocks.length > 0) {
            let currId = chunk.blocks[0];
            let currAmt = 1;
            for(let i = 1; i <= chunk.blocks.length; i++) {
                const id = chunk.blocks[i];
                if(id === currId) {
                    currAmt++;
                } else {
                    RLEArray.push(...encodeLEB128(currAmt));
                    RLEArray.push(...encodeLEB128(currId));
                    currAmt = 1;
                    currId = id;
                }
            }
        }
        avroChunk.blocks = Buffer.from(RLEArray);
        avroJson.chunks.push(avroChunk);
    }

    return {
        schems: [schema0.toBuffer(avroJson)],
        sliceSize: 32
    };
};

module.exports = {
    parseBloxdschem: parse,
    writeBloxdschem: write
}
