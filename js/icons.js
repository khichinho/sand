// Procedural Pixel Art Generator for UI
// Uses a templating system to generate SVG data URIs for each element

const IconShapes = {
    DROP: [
        ".....K......",
        "....K2K.....",
        "....K22K....",
        "...K122K....",
        "...K1122K...",
        "...K1112K...",
        "..K111122K..",
        "..K111112K..",
        "..K111112K..",
        "...K1112K...",
        "....KKKK....",
        "............"
    ],
    BLOCK: [
        "............",
        "....KKKKK...",
        "...K11112K..",
        "..K1111112K.",
        ".K111111112K",
        "K3333333333K",
        "K1111111111K",
        "K1111111111K",
        "K1111111111K",
        ".KKKKKKKKK..",
        "............",
        "............"
    ],
    PILE: [
        "............",
        "............",
        "............",
        "......K.....",
        ".....K1K....",
        "....K112K...",
        "....K112K...",
        "...K11112K..",
        "..K1111112K.",
        ".K111331112K",
        "K1133333111K",
        ".KKKKKKKKKK."
    ],
    FLASK: [
        "....KKKK....",
        "....K22K....",
        "....KWWK....",
        "....K11K....",
        "...K1111K...",
        "..K111111K..",
        ".K11111111K.",
        "K1111111111K",
        "K1111111111K",
        "K1111111111K",
        ".KKKKKKKKKK.",
        "............"
    ],
    CONCRETE_BLOCK: [
        "............",
        "..KKKKKKKK..",
        ".K11111111K.",
        "K11K33K1111K",
        "K1K3333K111K",
        "K11K33K1111K",
        "K1K3333K111K",
        "K1111111111K",
        ".K33333333K.",
        "..KKKKKKKK..",
        "............",
        "............"
    ],
    WAX_CANDLE: [
        "......K.....",
        ".....KOK....",
        "....KORK....",
        ".....KK.....",
        "...KKKKKK...",
        "..K111111K..",
        ".K11111111K.",
        "K11K1111K11K",
        "K111K11K111K",
        "K1111111111K",
        ".KKKKKKKKKK.",
        "............"
    ],
    TORCH_STICK: [
        ".....KK.....",
        "....KYOYK...",
        "...KYOOOYK..",
        "...KORRROK..",
        "....KRORKK..",
        ".....KROK...",
        ".....KBK....",
        ".....KBK....",
        ".....KBK....",
        ".....KBK....",
        ".....KBK....",
        ".....KBK...."
    ],
    SPOUT_PIPE: [
        "............",
        "KKKKKKKKK...",
        "KDDDDDDDK...",
        "KDDDDDDDK...",
        "KKKKKKDDK...",
        ".....KDDK...",
        ".....KDDK...",
        "....KKDDKK..",
        "....KDDDDK..",
        "....KKKKKK..",
        ".....K11K...",
        "......KK...."
    ],
    CLOUD: [
        "............",
        "............",
        "....KKK.....",
        "..KK111KK...",
        ".K1111112K..",
        "K111K11112K.",
        "K11K111111KK",
        "K1111111112K",
        ".KK111111KK.",
        "...KKKKKK...",
        "............",
        "............"
    ],
    LOG: [
        "............",
        "......KKKK..",
        "....KK3333K.",
        "..KK331113K.",
        ".K22K31113K.",
        "K1122KK33K..",
        "K111222KK...",
        ".K11122K....",
        "..KKKKK.....",
        "............",
        "............",
        "............"
    ],
    FLAME: [
        "....K.......",
        "...K1K......",
        "...K12K.K...",
        "..K112K.2K..",
        ".K1112K..2K.",
        "K111111112K.",
        "K113311122K.",
        "K13333112K..",
        ".K333112K...",
        "..K3312K....",
        "...K12K.....",
        "............"
    ],
    PLANT: [
        "............",
        "............",
        "............",
        "....K.......",
        "...K2K......",
        "...K22K..K..",
        "..K122K.K2K.",
        "K.K112K.K22K",
        "K2K112K.K12K",
        "K2K112KK112K",
        ".K21111111K.",
        "..KKKKKKKK.."
    ],
    SNOWFLAKE: [
        "............",
        "...W.W.W....",
        "....W.W.....",
        "..W..W..W...",
        "...WWWWW....",
        ".W..W.W..W..",
        "...WWWWW....",
        "..W..W..W...",
        "....W.W.....",
        "...W.W.W....",
        "............",
        "............"
    ],
    ERASER: [
        "K..........K",
        ".K........K.",
        "..K......K..",
        "...K....K...",
        "....K..K....",
        ".....KK.....",
        ".....KK.....",
        "....K..K....",
        "...K....K...",
        "..K......K..",
        ".K........K.",
        "K..........K"
    ],
    DYNAMITE: [
        ".......W....",
        "......W.....",
        "....KKK.....",
        "...K112K....",
        "..K11112K...",
        "..K11112K...",
        "..K11112K...",
        "..K11112K...",
        "..K11112K...",
        "..K11112K...",
        "..K11112K...",
        "..KKKKKKK..."
    ],
    WALL: [
        "............",
        "KKKKKKKKKKKK",
        "K111K111111K",
        "K111K111111K",
        "KKKKKKKKKKKK",
        "K111111K111K",
        "K111111K111K",
        "KKKKKKKKKKKK",
        "K111K111111K",
        "K111K111111K",
        "KKKKKKKKKKKK",
        "............"
    ],
    STEAM_VAPOR: [
        "......K.....",
        ".....K1K....",
        "....K11K....",
        "...K11K.....",
        "..K11K......",
        ".K11K..K....",
        "K11K..K1K...",
        "K1K...K11K..",
        "K1K...K11K..",
        ".KK...K11K..",
        "......K11K..",
        "......KKKK.."
    ],
    LAVA_CRACKS: [
        "............",
        "....KKK.....",
        "...K222KK...",
        "..K2222212K.",
        ".K222222212K",
        "K2222212222K",
        "K21222K2222K",
        "K2222K.K222K",
        ".K222K.K22K.",
        "..KKKK.KKK..",
        "............",
        "............"
    ],
    ICE_CUBE: [
        "....KKKKK...",
        "...K22222K..",
        "..K2222222K.",
        ".K22222K111K",
        "K2222K.K111K",
        "K333K..K111K",
        "K333K..K111K",
        "K333K..K111K",
        "K333K..K111K",
        "KKKKKKKKKKKK",
        "............",
        "............"
    ],
    WOOD_LOG: [
        "............",
        "...KKKKKK...",
        "..K333333K..",
        ".K33333333K.",
        "K3333K.K333K",
        "K333K111K33K",
        "K333K131K33K",
        "K333K111K33K",
        "K3333K.K333K",
        ".K33333333K.",
        "..KKKKKKKK..",
        "............"
    ],
    COAL_ROCK: [
        "............",
        ".......KKKK.",
        "....KKK2222K",
        "...K2222222K",
        "..K22222222K",
        ".K2222222K..",
        "K22222K22K..",
        "K22222K2K...",
        "K2222K2K....",
        ".KKK22K.....",
        "....KKK.....",
        "............"
    ],
    DYNAMITE_TNT: [
        "............",
        "KKKKKKKKKKKK",
        "K11K111K111K",
        "K11K111K111K",
        "KWWWWWWWWWWK",
        "K222W2W2W22K",
        "KW2WW222WW2K",
        "KW2WW2W2WW2K",
        "K11K111K111K",
        "K11K111K111K",
        "KKKKKKKKKKKK",
        "............"
    ],
    FUSE_ROPE: [
        "W...........",
        ".Y..........",
        "..K.........",
        "...K........",
        "....K.......",
        ".....K......",
        "......K.....",
        ".......KK...",
        "........KK..",
        ".........K..",
        "..........K.",
        "...........K"
    ],
    GAS_CLOUD: [
        "............",
        "..K....K....",
        ".K1K..K1K...",
        "K111KKK11K..",
        "K111K..K11K.",
        "K111K..K11K.",
        ".K111KK111K.",
        "..K1111111K.",
        "...K22221K..",
        "....KKKKK...",
        "............",
        "............"
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
    [Elements.FUSE]: { shape: 'FUSE_ROPE', color: '#ecf0f1' },
    [Elements.FIRECRACKER]: { shape: 'DYNAMITE', color: '#ff3296' },
    [Elements.WORMHOLE]: { shape: 'CLOUD', color: '#9b59b6' },
    [Elements.LAVA]: { shape: 'LAVA_CRACKS', color: '#ff6600' }
};

class Icons {
    static getSVG(elementId) {
        const config = ElementIconConfig[elementId] || { shape: 'PILE', color: '#aaaaaa' };
        const shapeStr = IconShapes[config.shape];
        if (!shapeStr) return "";

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="100%" height="100%" shape-rendering="crispEdges">`;

        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 12; x++) {
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
