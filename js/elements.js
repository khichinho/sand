/* 
Element Registry and Properties
We assign an integer ID to each element type for fast grid storage.
*/

const Elements = {
    BLANK: 0,
    WALL: 1,
    SAND: 2,
    WATER: 3,
    OIL: 4,
    SALT: 5,
    CONCRETE: 6,
    SALT_WATER: 7,
    PLANT: 8,
    WAX: 9,
    FIRE_0: 10,
    FIRE_1: 11,
    FIRE_2: 12,
    FIRE_3: 13,
    TORCH: 14,
    SPOUT: 15,

    // New Liquids
    ICE: 16,
    SNOW: 17,
    LIQUID_NITROGEN: 18,
    LAVA: 19,
    STEAM: 20,
    GAS: 21,
    TNT: 22,
    NAPALM: 23,
    WOOD: 24,
    COAL: 25,
    ASH: 26,
    FUSE: 27,
    FIRECRACKER: 28,
    COAL_GLOWING: 36,
    SPARK_RED: 29,
    SPARK_GREEN: 30,
    SPARK_BLUE: 31,
    SPARK_YELLOW: 32,
    SPARK_PURPLE: 33,
    WORMHOLE: 34,
};

// Map Element IDs to their rendering Colors
const ElementColors = {
    [Elements.BLANK]: rgb(0, 0, 0, 0),       // Transparent/Black
    [Elements.WALL]: rgb(128, 128, 128),     // Grey
    [Elements.SAND]: rgb(210, 180, 140),     // Tan
    [Elements.WATER]: rgb(0, 0, 255),        // Blue
    [Elements.OIL]: rgb(139, 69, 19),        // Brown
    [Elements.SALT]: rgb(204, 204, 204),     // Light Grey
    [Elements.CONCRETE]: rgb(128, 155, 155), // Steel-ish Blue-Grey
    [Elements.SALT_WATER]: rgb(65, 105, 225),// Royal Blue
    [Elements.PLANT]: rgb(0, 255, 0),        // Green
    [Elements.WAX]: rgb(255, 255, 0),        // Yellow
    [Elements.FIRE_0]: rgb(255, 68, 68),     // Red variants
    [Elements.FIRE_1]: rgb(255, 100, 68),
    [Elements.FIRE_2]: rgb(255, 140, 68),
    [Elements.FIRE_3]: rgb(255, 180, 68),
    [Elements.TORCH]: rgb(255, 102, 0),      // Orange
    [Elements.SPOUT]: rgb(100, 149, 237),     // Cornflower Blue

    // New Liquids
    [Elements.ICE]: rgb(176, 224, 230),       // Powder Blue
    [Elements.SNOW]: rgb(255, 250, 250),      // Snow white
    [Elements.LIQUID_NITROGEN]: rgb(224, 255, 255), // Light Cyan
    [Elements.LAVA]: rgb(255, 69, 0),         // Orange Red (Lava)
    [Elements.STEAM]: rgb(160, 180, 200, 240),// Greyish blue
    [Elements.GAS]: rgb(100, 100, 100, 240),  // Dark grey
    [Elements.TNT]: rgb(240, 230, 140),       // Buttery yellow
    [Elements.NAPALM]: rgb(0, 106, 78),       // Bottle green
    [Elements.WOOD]: rgb(139, 69, 19),        // Rich brown
    [Elements.COAL]: rgb(40, 40, 40),         // Dark charcoal
    [Elements.COAL_GLOWING]: rgb(255, 69, 0), // Fiery glowing orange
    [Elements.ASH]: rgb(105, 105, 105),       // Ashen grey
    [Elements.FUSE]: rgb(255, 255, 255),      // Pure white
    [Elements.FIRECRACKER]: rgb(255, 192, 203), // Pinkish white
    [Elements.SPARK_RED]: rgb(255, 50, 50),
    [Elements.SPARK_GREEN]: rgb(50, 255, 50),
    [Elements.SPARK_BLUE]: rgb(50, 150, 255),
    [Elements.SPARK_YELLOW]: rgb(255, 255, 50),
    [Elements.SPARK_PURPLE]: rgb(255, 50, 255),
    [Elements.WORMHOLE]: rgb(128, 0, 128),    // Deep Purple
};

// UI Name mapping for buttons
const ElementNames = {
    [Elements.WALL]: 'WALL',
    [Elements.SAND]: 'SAND',
    [Elements.WATER]: 'WATER',
    [Elements.OIL]: 'OIL',
    [Elements.SALT]: 'SALT',
    [Elements.CONCRETE]: 'CONCRETE',
    [Elements.PLANT]: 'PLANT',
    [Elements.WAX]: 'WAX',
    [Elements.TORCH]: 'TORCH',
    [Elements.SPOUT]: 'SPOUT',
    [Elements.FIRE_0]: 'FIRE', // Expose one fire type for drawing
    [Elements.BLANK]: 'ERASER', // Use blank as eraser
    [Elements.SALT_WATER]: 'SALT WATER',

    [Elements.ICE]: 'ICE',
    [Elements.SNOW]: 'SNOW',
    [Elements.LIQUID_NITROGEN]: 'LIQUID N2',
    [Elements.LAVA]: 'LAVA',
    [Elements.STEAM]: 'STEAM',
    [Elements.GAS]: 'GAS',
    [Elements.TNT]: 'TNT',
    [Elements.NAPALM]: 'NAPALM',
    [Elements.WOOD]: 'WOOD',
    [Elements.COAL]: 'COAL',
    [Elements.COAL_GLOWING]: 'COAL',
    [Elements.FUSE]: 'FUSE',
    [Elements.FIRECRACKER]: 'FIRECRACKER',
    [Elements.WORMHOLE]: 'WORMHOLE',
};

// New UI Grouping Logic
const ElementCategories = {
    'Basic': [
        Elements.BLANK, Elements.SAND, Elements.WATER, Elements.WALL, Elements.PLANT,
        Elements.FIRE_0, Elements.OIL, Elements.CONCRETE,
        Elements.TORCH, Elements.SPOUT
        // , Elements.SALT, Elements.WAX
    ],
    'Advanced': [
        Elements.STEAM, Elements.LAVA, Elements.ICE, Elements.WOOD, Elements.NAPALM,
        Elements.COAL, Elements.SNOW, Elements.GAS, Elements.TNT, Elements.FUSE,
        Elements.WORMHOLE, Elements.FIRECRACKER
        // , Elements.LIQUID_NITROGEN
    ]
};
