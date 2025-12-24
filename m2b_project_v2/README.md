# Minecraft to Bloxd Schematic Converter (M2B)

This tool allows you to convert Minecraft schematics (`.schematic`, `.schem`, `.litematic`) into Bloxd.io's `.bloxdschem` format.

## Features
- **Origin Alignment:** Automatically sets the origin (0,0,0) at the floor corner for easy placement.
- **Format Support:** Works with standard Minecraft schematic formats.
- **Simple Interface:** Just upload your file and get the converted version instantly.

## How to Use
1. Clone this repository.
2. Install dependencies: `npm install`
3. Run the project: `npm start`
4. Open your browser, upload a Minecraft schematic, and download the `.bloxdschem` file.

## Block Mapping
The converter maps Minecraft blocks to their closest Bloxd.io equivalents. For example:
- `oak_log` -> `Maple Log`
- `cobblestone` -> `Messy Stone`
- `grass_block` -> `Grass Block`

## Version 1.0 Limitations
- Supports full blocks only.
- No rotation or metadata support yet.
- Best used with the default Bloxd.io texture pack.

## Credits
Original logic by the M2B community. Reconstructed for GitHub by Manus.
