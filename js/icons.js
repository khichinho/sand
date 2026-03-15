// Procedural Pixel Art Generator for UI
// Uses a templating system to generate SVG data URIs for each element

const IconShapes = {
    DROP: [
        ".......K......",
        "......K2K.....",
        ".....K222K....",
        ".....K222K....",
        "....K22222K...",
        "...K1222222K..",
        "..K11222222K..",
        "..K11122222KK.",
        "..K11112222KK.",
        "..K11111222KK.",
        "...K1111122KK.",
        "....K111122K..",
        ".....KKKKKK...",
        ".............."
    ],
    BLOCK: [
        "..............",
        ".....KKKKKK...",
        "....K111112K..",
        "...K11111112K.",
        "..K1111111112K",
        "K333333333333K",
        "K111111111111K",
        "K111111111111K",
        "K111111111111K",
        "K111111111111K",
        "K111111111111K",
        ".KKKKKKKKKKKK.",
        "..............",
        ".............."
    ],
    PILE: [
        "..............",
        "..............",
        ".......K......",
        "......K1K.....",
        ".....K112K....",
        "....K11112K...",
        "....K11112K...",
        "...K1111112K..",
        "...K11111112K.",
        "..K111113312K.",
        ".K1111133312K.",
        "K113333333111K",
        ".KKKKKKKKKKKK.",
        ".............."
    ],
    FLASK: [
        ".....KKKKK....",
        ".....K222K....",
        ".....KWWWK....",
        ".....K111K....",
        "....K11111K...",
        "...K1111111K..",
        "..K111111111K.",
        ".K11111111111K",
        "K111111111111K",
        "K111111111111K",
        "K111111111111K",
        "K111111111111K",
        ".KKKKKKKKKKKK.",
        ".............."
    ],
    CONCRETE_BLOCK: [
        "..............",
        "..KKKKKKKKKK..",
        ".K1111111111K.",
        "K11K333K11111K",
        "K1K33333K1111K",
        "K11K333K11111K",
        "K1K33333K1111K",
        "K111111111111K",
        "K111111111111K",
        "K11K333K11111K",
        ".K3333333333K.",
        "..KKKKKKKKKK..",
        "..............",
        ".............."
    ],
    WAX_CANDLE: [
        ".......K......",
        "......KOK.....",
        ".....KORKK....",
        "......KK......",
        "....KKKKKK....",
        "...K111111K...",
        "..K11111111K..",
        ".K1111111111K.",
        "K11K111111K11K",
        "K111K1111K111K",
        "K1111K11K1111K",
        "K111111111111K",
        ".KKKKKKKKKKKK.",
        ".............."
    ],
    TORCH_STICK: [
        "......KK......",
        ".....KYOYK....",
        "....KYOOOYK...",
        "....KORRROK...",
        "....KORRROK...",
        ".....KRORKK...",
        "......KROK....",
        "......KBK.....",
        "......KBK.....",
        "......KBK.....",
        "......KBK.....",
        "......KBK.....",
        "......KBK.....",
        "......KBK....."
    ],
    SPOUT_PIPE: [
        "..............",
        "KKKKKKKKKKK...",
        "KDDDDDDDDDK...",
        "KDDDDDDDDDK...",
        "KKKKKKKDDDK...",
        ".......KDDK...",
        ".......KDDK...",
        ".......KDDK...",
        ".....KKKDDKK..",
        "....KDDDDDDDK.",
        "....KKKKKKKKK.",
        "......K111K...",
        ".......K1K....",
        "........KK...."
    ],
    BLACKHOLE: [
        ".....KKKKKK...",
        "....K222222K..",
        "...K22....22K.",
        "..K22......22K",
        ".K221......122K",
        "K221........12K",
        "K221........12K",
        "K221........12K",
        ".K221......122K",
        "..K22......22K.",
        "...K22....22K..",
        "....K222222K...",
        ".....KKKKKK....",
        ".............."
    ],
    LOG: [
        "..............",
        ".......KKKKK..",
        ".....KK33333K.",
        "...KK3311113K.",
        "..K22K311113K.",
        ".K1122K31113K.",
        "K111222KK33K..",
        "K11112222KK...",
        ".K1111222K....",
        "..K11112K.....",
        "...KKKKK......",
        "..............",
        "..............",
        ".............."
    ],
    FLAME: [
        ".....K........",
        "....K1K.......",
        "....K12K..K...",
        "...K112K.2K...",
        "...K112K.2K...",
        "..K1112K..2K..",
        ".K111111112K..",
        "K11133111122K.",
        "K1133331112K..",
        "K133333112K...",
        ".K3333112K....",
        "..K33112K.....",
        "...K112K......",
        ".............."
    ],
    PLANT: [
        "..............",
        "..............",
        "..............",
        ".....K........",
        "....K2K.......",
        "...K22K...K...",
        "...K22K..K2K..",
        "..K122K.K22K..",
        "K.K112K.K122K.",
        "K2K112K.K1122K",
        "K2K112KKK112K.",
        ".K2111111111K.",
        "..KKKKKKKKKK..",
        ".............."
    ],
    SNOWFLAKE: [
        "..............",
        "....W..W..W...",
        ".....W.W.W....",
        "......W.W.....",
        "....W..W..W...",
        ".....WWWWW....",
        "..W..WWWWW..W.",
        ".....WWWWW....",
        "....W..W..W...",
        "......W.W.....",
        ".....W.W.W....",
        "....W..W..W...",
        "..............",
        ".............."
    ],
    ERASER: [
        "1............1",
        ".1..........1.",
        "..1........1..",
        "...1......1...",
        "....1....1....",
        ".....1..1.....",
        "......11......",
        "......11......",
        ".....1..1.....",
        "....1....1....",
        "...1......1...",
        "..1........1..",
        ".1..........1.",
        "1............1"
    ],
    DYNAMITE: [
        "........W.....",
        ".......W......",
        "......W.......",
        ".....KKK......",
        "....K112K.....",
        "...K11112K....",
        "...K11112K....",
        "...K11112K....",
        "...K11112K....",
        "...K11112K....",
        "...K11112K....",
        "...K11112K....",
        "...K11112K....",
        "...KKKKKKK...."
    ],
    WALL: [
        "..............",
        "KKKKKKKKKKKKKK",
        "K111K11111111K",
        "K111K11111111K",
        "KKKKKKKKKKKKKK",
        "K1111111K1111K",
        "K1111111K1111K",
        "KKKKKKKKKKKKKK",
        "K111K11111111K",
        "K111K11111111K",
        "KKKKKKKKKKKKKK",
        "K1111111K1111K",
        "KKKKKKKKKKKKKK",
        ".............."
    ],
    STEAM_VAPOR: [
        "..............",
        ".......K......",
        "......K2K.....",
        ".....K212K....",
        "....K21112K...",
        "...K211112K...",
        "..K2111112K...",
        "..K111112K....",
        "...K1112K.....",
        "....KKKK......",
        ".......K......",
        "......K2K.....",
        ".....K212K....",
        "......KKK....."
    ],
    LAVA_CRACKS: [
        "......KKKK....",
        "....KKRRRRKK..",
        "...KRRRRRRRRK.",
        "..KRROOOOORRK.",
        ".KROOOOOOOOOK.",
        "KROOOOOOOOOKK.",
        "KROOOYYYOOOK..",
        "KROOOYYYYOOK..",
        "KROOOYYYOOOK..",
        "KROOOOOOOOOK..",
        ".KRRROOOOOOK..",
        "..KRRRRRRKK...",
        "....KKKKK.....",
        ".............."
    ],
    ICE_CUBE: [
        ".......KK.....",
        ".....KK22KK...",
        "....K222222K..",
        "..KK22222222K.",
        ".K22222222222K",
        "K111111K3K333K",
        "K111111311K33K",
        "K1111131111K3K",
        "K11113111111KK",
        ".K1131111111K.",
        "..K31111111K..",
        "...K111111K...",
        "....K1111K....",
        ".....KKKK....."
    ],
    WOOD_LOG: [
        "..............",
        "....KKKKKKK...",
        "...K3333333K..",
        "..K333333333K.",
        ".K33333K.K333K",
        "K33333K111K33K",
        "K3333K11311K3K",
        "K3333K13331K3K",
        "K33333K111K33K",
        ".K33333K.K333K",
        "..K333333333K.",
        "...K3333333K..",
        "....KKKKKKK...",
        ".............."
    ],
    COAL_ROCK: [
        "..............",
        "......KKKKK...",
        "....KK11111KK.",
        "...K111111111K",
        "..K1111221111K",
        ".K1111233211KK",
        "K11111333311K.",
        "K11112333211K.",
        "K11111222111K.",
        ".K111111111K..",
        "..K1111111K...",
        "...KK111KK....",
        ".....KKK......",
        ".............."
    ],
    DYNAMITE_TNT: [
        "..............",
        "KKKKKKKKKKKKKK",
        "K111K1111K111K",
        "K111K1111K111K",
        "KWWWWWWWWWWWWK",
        "K222W22W2W222K",
        "KW2WW22W2WW2WK",
        "KW2WW2W22WW2WK",
        "KW2WW2W22WW2WK",
        "KWWWWWWWWWWWWK",
        "K111K1111K111K",
        "K111K1111K111K",
        "KKKKKKKKKKKKKK",
        ".............."
    ],
    FUSE_ROPE: [
        "W.............",
        ".Y............",
        "..1...........",
        "...1..........",
        "....1.........",
        ".....1........",
        "......1.......",
        ".......1......",
        "........11....",
        "..........11..",
        "............11",
        ".............1",
        ".............1",
        ".............."
    ],
    GAS_CLOUD: [
        "....KKK.......",
        "...K111K..KK..",
        "..K11122KK11K.",
        "..K111222112K.",
        "...K1122211K..",
        "....KKK11KK...",
        "......K11K....",
        "...KKK111KK...",
        "..K11111111K..",
        ".K1112221111K.",
        "K111222221111K",
        ".K1112221111K.",
        "..K11111111K..",
        "....KKKKKK...."
    ]
};

// Maps element IDs to shape + brand color
// Fallback is PILE if not specified
const ElementIconConfig = {
    [Elements.BLANK]: { shape: 'ERASER', color: '#ff3333' },
    [Elements.WALL]: { shape: 'WALL', color: '#7f8c8d' },
    [Elements.SAND]: { shape: 'PILE', color: '#e6c27a' },
    [Elements.WATER]: { shape: 'DROP', color: '#4a90e2' },
    [Elements.PLANT]: { shape: 'PLANT', color: '#2ecc71' },
    [Elements.SPOUT]: { shape: 'SPOUT_PIPE', color: '#3498db' },
    [Elements.SALT]: { shape: 'PILE', color: '#ecf0f1' },
    [Elements.SALT_WATER]: { shape: 'DROP', color: '#85c1e9' },
    [Elements.OIL]: { shape: 'DROP', color: '#3e2723' },
    [Elements.CONCRETE]: { shape: 'CONCRETE_BLOCK', color: '#95a5a6' },
    [Elements.WAX]: { shape: 'WAX_CANDLE', color: '#f1c40f' },
    [Elements.FIRE_0]: { shape: 'FLAME', color: '#ff3300' },
    [Elements.FIRE_1]: { shape: 'FLAME', color: '#ff5500' },
    [Elements.FIRE_2]: { shape: 'FLAME', color: '#ff7700' },
    [Elements.FIRE_3]: { shape: 'FLAME', color: '#ff9900' },
    [Elements.FIRE]: { shape: 'FLAME', color: '#ff3300' },
    [Elements.TORCH]: { shape: 'TORCH_STICK', color: '#d35400' },
    [Elements.ICE]: { shape: 'ICE_CUBE', color: '#a9cce3' },
    [Elements.SNOW]: { shape: 'SNOWFLAKE', color: '#ffffff' },
    [Elements.LIQUID_NITROGEN]: { shape: 'FLASK', color: '#00ffff' },
    [Elements.STEAM]: { shape: 'STEAM_VAPOR', color: '#bdc3c7' },
    [Elements.GAS]: { shape: 'GAS_CLOUD', color: '#90a4ae' },
    [Elements.TNT]: { shape: 'DYNAMITE_TNT', color: '#e74c3c' },
    [Elements.NAPALM]: { shape: 'FLASK', color: '#1abc9c' },
    [Elements.WOOD]: { shape: 'WOOD_LOG', color: '#6d4c41' },
    [Elements.COAL]: { shape: 'COAL_ROCK', color: '#546e7a' },
    [Elements.COAL_GLOWING]: { shape: 'COAL_ROCK', color: '#ff4b14' },
    [Elements.FUSE]: { shape: 'FUSE_ROPE', color: '#ecf0f1' },
    [Elements.FIRECRACKER]: { shape: 'DYNAMITE', color: '#ff3296' },
    [Elements.WORMHOLE]: { shape: 'BLACKHOLE', color: '#9b59b6' },
    [Elements.LAVA]: { shape: 'LAVA_CRACKS', color: '#ff6600' }
};

class Icons {
    static getSVG(elementId) {
        const config = ElementIconConfig[elementId] || { shape: 'PILE', color: '#aaaaaa' };
        const shapeStr = IconShapes[config.shape];
        if (!shapeStr) return "";

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="100%" height="100%" shape-rendering="crispEdges">`;

        for (let y = 0; y < 14; y++) {
            for (let x = 0; x < 14; x++) {
                const char = shapeStr[y][x];
                if (char === '.') continue;

                let fill = '#000000';
                let opacity = 1.0;
                let secondaryStr = ''; // Used for shadows/highlights via layering

                if (char === 'K') {
                    fill = '#222222';
                } else if (char === 'W') {
                    fill = '#ffffff';
                } else if (char === '1') {
                    fill = config.color;
                } else if (char === '2') {
                    // Highlight (base color + semi-transparent white on top)
                    fill = config.color;
                    secondaryStr = `<rect x="${x}" y="${y}" width="1.1" height="1.1" fill="#ffffff" opacity="0.4"/>`;
                } else if (char === '3') {
                    // Shadow (base color + semi-transparent black on top)
                    fill = config.color;
                    secondaryStr = `<rect x="${x}" y="${y}" width="1.1" height="1.1" fill="#000000" opacity="0.3"/>`;
                } else if (char === 'R') {
                    fill = '#e74c3c'; // Red
                } else if (char === 'O') {
                    fill = '#e67e22'; // Orange
                } else if (char === 'Y') {
                    fill = '#f1c40f'; // Yellow
                } else if (char === 'D') {
                    fill = '#95a5a6'; // Dark Grey 
                } else if (char === 'B') {
                    fill = '#8d6e63'; // Brown
                }

                // Add 0.1 to width/height to prevent sub-pixel rendering gaps
                svg += `<rect x="${x}" y="${y}" width="1.1" height="1.1" fill="${fill}" opacity="${opacity}"/>`;
                if (secondaryStr) {
                    svg += secondaryStr;
                }
            }
        }

        svg += `</svg>`;
        return svg;
    }
}
