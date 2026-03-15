class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });

        this.width = Config.GRID_WIDTH;
        this.height = Config.GRID_HEIGHT;

        // Initial dimension (will be overridden quickly by resize)
        this.width = Config.GRID_WIDTH;
        this.height = Config.GRID_HEIGHT;

        // The Simulation Grid: stores the Element ID for each pixel
        this.grid = new Uint8Array(this.width * this.height);
        this.frameCount = 0;

        // Simulation state
        this.isPaused = false;
        this.stepRequested = false;

        // NEW: Animated streaks (for TNT, Firecrackers, etc.)
        this.activeStreaks = [];

        this.clear();

        this.setupCanvas();
    }

    setupCanvas() {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${this.width * Config.SCALE}px`;
        this.canvas.style.height = `${this.height * Config.SCALE}px`;
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.view = new Uint32Array(this.imageData.data.buffer);
    }

    resize() {
        const uiPanel = document.getElementById('ui-panel');
        // Hide canvas to let UI panel settle to its natural height without canvas pushing it
        this.canvas.style.display = 'none';
        const uiHeight = uiPanel.getBoundingClientRect().height;
        const availableHeight = window.innerHeight - uiHeight;
        const availableWidth = window.innerWidth;
        this.canvas.style.display = 'block';

        const newWidth = Math.max(1, Math.floor(availableWidth / Config.SCALE));
        const newHeight = Math.max(1, Math.floor(availableHeight / Config.SCALE));

        if (newWidth === this.width && newHeight === this.height) return;

        const newGrid = new Uint8Array(newWidth * newHeight);
        newGrid.fill(Elements.BLANK);

        // Copy old grid to new grid boundary
        const minW = Math.min(this.width, newWidth);
        const minH = Math.min(this.height, newHeight);

        for (let y = 0; y < minH; y++) {
            for (let x = 0; x < minW; x++) {
                newGrid[y * newWidth + x] = this.grid[y * this.width + x];
            }
        }

        this.width = newWidth;
        this.height = newHeight;
        this.grid = newGrid;

        Config.GRID_WIDTH = newWidth;
        Config.GRID_HEIGHT = newHeight;

        this.setupCanvas();
    }

    clear() {
        this.grid.fill(Elements.BLANK);
    }

    // Convert (x, y) to a 1D array index
    getIndex(x, y) {
        return y * this.width + x;
    }

    // Check if coordinates are within the grid bounds
    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    // Get the element at (x, y)
    getElement(x, y) {
        // If it falls off the bottom edge, treat it as BLANK space so it falls
        if (y >= this.height) return Elements.BLANK;
        // Treat sides and top as solid wall
        if (x < 0 || x >= this.width || y < 0) return Elements.WALL;

        return this.grid[this.getIndex(x, y)];
    }

    // Set the element at (x, y)
    setElement(x, y, el) {
        if (this.inBounds(x, y)) {
            this.grid[this.getIndex(x, y)] = el;
        }
    }

    // Swap two elements. If the target is out of bounds (off the bottom), just erase the source.
    swap(x1, y1, x2, y2) {
        if (!this.inBounds(x2, y2)) {
            // Target is off-screen. Set the original spot to blank and we're done.
            this.setElement(x1, y1, Elements.BLANK);
            return;
        }

        const i1 = this.getIndex(x1, y1);
        const i2 = this.getIndex(x2, y2);
        const temp = this.grid[i1];
        this.grid[i1] = this.grid[i2];
        this.grid[i2] = temp;
    }

    /**
     * Returns the drag/resistance of a medium element (0 = no drag, 1 = impassable).
     * When a particle tries to move through this medium, it will be blocked with this probability.
     * Based on real-world viscosity relative to air.
     */
    getMediumResistance(el) {
        switch (el) {
            case Elements.BLANK: return 0.00; // Air — free fall
            case Elements.STEAM: return 0.03; // Gas — barely any drag
            case Elements.GAS: return 0.03;
            case Elements.LIQUID_NITROGEN: return 0.40; // Low-viscosity cryogen
            case Elements.WATER: return 0.50; // Water — moderate drag
            case Elements.SALT_WATER: return 0.52; // Slightly denser than water
            case Elements.OIL: return 0.65; // Noticeable viscosity
            case Elements.NAPALM: return 0.80; // Very thick
            case Elements.LAVA: return 0.92; // Extremely viscous
            default: return 0.00; // Solid walls etc = already blocked
        }
    }

    step() {
        if (this.isPaused && !this.stepRequested) {
            return;
        }

        this.stepRequested = false;

        // Iterate from bottom to top, randomly left-to-right or right-to-left
        for (let y = this.height - 1; y >= 0; y--) {
            // Processing direction alternates to prevent elements from always drifting one way
            const dir = (this.frameCount % 2 === 0) ? 1 : -1;
            const startX = dir === 1 ? 0 : this.width - 1;
            const endX = dir === 1 ? this.width : -1;

            for (let x = startX; x !== endX; x += dir) {
                const i = this.getIndex(x, y);
                const el = this.grid[i];
                if (el !== Elements.BLANK && el !== Elements.WALL) {
                    this.updateElement(x, y, el);
                }
            }
        }

        // Process Animated Streaks
        this.updateActiveStreaks();

        this.frameCount++;
    }

    updateElement(x, y, el) {
        switch (el) {
            case Elements.SAND:
            case Elements.SALT:
            case Elements.CONCRETE:
            case Elements.ASH:
                this.updateSolid(x, y, el);
                break;
            case Elements.WATER:
            case Elements.SALT_WATER:
            case Elements.OIL:
            case Elements.NAPALM:
                this.updateLiquid(x, y, el);
                break;
            case Elements.ICE:
            case Elements.SNOW:
                this.updateIceAndSnow(x, y, el);
                break;
            case Elements.LIQUID_NITROGEN:
            case Elements.LAVA:
                this.updateSpecialLiquids(x, y, el);
                break;
            case Elements.GAS:
            case Elements.STEAM:
                this.updateGas(x, y, el);
                break;
            case Elements.SPOUT:
                let targetEl = this.getElement(x, y + 1);
                if (Math.random() < 0.1 && (targetEl === Elements.BLANK || targetEl === Elements.STEAM)) {
                    this.setElement(x, y + 1, Elements.WATER);
                }
                break;
            case Elements.TORCH:
                if (Math.random() < 0.2) {
                    const dx = Math.floor(Math.random() * 3) - 1;
                    const dy = Math.random() < 0.5 ? -1 : 0;
                    if (this.getElement(x + dx, y + dy) === Elements.BLANK) {
                        this.setElement(x + dx, y + dy, Elements.FIRE_1);
                    }
                }
                break;
            case Elements.FIRE_0:
            case Elements.FIRE_1:
            case Elements.FIRE_2:
            case Elements.FIRE_3:
            case Elements.SPARK_RED:
            case Elements.SPARK_GREEN:
            case Elements.SPARK_BLUE:
            case Elements.SPARK_YELLOW:
            case Elements.SPARK_PURPLE:
                this.updateFire(x, y, el);
                break;
            case Elements.PLANT:
            case Elements.WAX:
            case Elements.TNT:
            case Elements.WOOD:
            case Elements.COAL:
            case Elements.COAL_GLOWING:
            case Elements.FUSE:
            case Elements.FIRECRACKER:
            case Elements.WORMHOLE:
                this.updateImmobile(x, y, el);
                break;
        }
    }

    // Helper for granular materials (sand, salt, concrete)
    updateSolid(x, y, el) {
        // Specific material reactions
        if (el === Elements.SALT) {
            let converted = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (this.getElement(x + dx, y + dy) === Elements.WATER) {
                        this.setElement(x + dx, y + dy, Elements.SALT_WATER); // Water becomes Salt Water

                        // 10% chance for the Salt grain itself to finally dissolve
                        if (Math.random() < 0.1) {
                            this.setElement(x, y, Elements.SALT_WATER);
                            return; // Fully dissolved
                        }
                        converted = true;
                        break;
                    }
                }
                if (converted) break;
            }
            // If it didn't fully dissolve yet, physics continues below so it can fall
        }
        else if (el === Elements.CONCRETE) {
            // "probabilistically becomes wall when touching something solid (sand, salt, wall, wax, or plant)"
            if (Math.random() < 0.05 && this.checkNeighbors(x, y, [Elements.SAND, Elements.SALT, Elements.WALL, Elements.WAX, Elements.PLANT])) {
                this.setElement(x, y, Elements.WALL);
                return; // Set
            }
        }

        // Entropy/scatter: small chance to drift sideways even when falling straight is possible
        // This creates the organic "scattered particle" feel seen in Sandboxels
        const dir = Math.random() < 0.5 ? -1 : 1;
        const tryDiagonal = Math.random() < 0.15;

        // Pre-compute medium resistance for candidate cells
        const belowEl = this.getElement(x, y + 1);
        const diag1El = this.getElement(x + dir, y + 1);
        const diag2El = this.getElement(x - dir, y + 1);
        const canBelow = this.isEmptyOrLiquid(x, y + 1) && Math.random() >= this.getMediumResistance(belowEl);
        const canDiag1 = this.isEmptyOrLiquid(x + dir, y + 1) && Math.random() >= this.getMediumResistance(diag1El);
        const canDiag2 = this.isEmptyOrLiquid(x - dir, y + 1) && Math.random() >= this.getMediumResistance(diag2El);

        if (!tryDiagonal && canBelow) {
            this.swap(x, y, x, y + 1);
        } else if (canDiag1) {
            this.swap(x, y, x + dir, y + 1);
        } else if (canBelow) {
            this.swap(x, y, x, y + 1);
        } else if (canDiag2) {
            this.swap(x, y, x - dir, y + 1);
        }
    }

    // Helper for liquids (water, oil, salt water, napalm)
    updateLiquid(x, y, el) {
        // Specific material reactions
        if (el === Elements.NAPALM) {
            // Check EXACTLY the same heat sources as Oil so it paces identically
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA])) {
                // Surface detection: only fire streaks if touching air
                const isSurface = this.getElement(x, y - 1) === Elements.BLANK ||
                    this.getElement(x + 1, y) === Elements.BLANK ||
                    this.getElement(x - 1, y) === Elements.BLANK;

                if (isSurface) {
                    // Match Oil's slow burn speed (0.002) but produce massive streaks
                    if (Math.random() < 0.002) {
                        this.setElement(x, y, Elements.FIRE_3);
                        // Mega density: 12 to 20 streaks per particle to trigger huge chain reactions
                        const numStreaks = Math.floor(Math.random() * 9) + 12;
                        for (let i = 0; i < numStreaks; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const streakLength = 15 + Math.random() * 20;
                            this.drawArcStreak(x, y, angle, streakLength, 1);
                        }
                        return;
                    }
                } else {
                    // Interior matches oil's consumption rate
                    if (Math.random() < 0.002) {
                        this.setElement(x, y, Elements.FIRE_2);
                        return;
                    }
                }
            }
        }
        else if (el === Elements.OIL) {
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA])) {
                // Oil burns like a slow sustained fuel — stays as liquid and keeps producing fire
                // High chance to spawn ambient fire in surrounding blank spaces (like coal sustaining flames)
                if (Math.random() < 0.8) {
                    const dx = Math.floor(Math.random() * 3) - 1;
                    const dy = Math.floor(Math.random() * 3) - 1;
                    if (this.getElement(x + dx, y + dy) === Elements.BLANK) {
                        this.setElement(x + dx, y + dy, Elements.FIRE_2);
                    }
                }
                // Very slow self-consumption (~8 seconds at 60 FPS, similar to coal)
                if (Math.random() < 0.002) {
                    // NEW: Occasionally produce a tiny, single streak when oil consumes itself
                    if (Math.random() < 0.15) {
                        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2; // Mostly upwards
                        const len = 8 + Math.random() * 12;
                        this.drawArcStreak(x, y, angle, len, 1);
                    }
                    this.setElement(x, y, Elements.BLANK); // Oil burns away cleanly (no ash)
                    return;
                }
            }
        }
        else if (el === Elements.WATER || el === Elements.SALT_WATER) {
            // Evaporate near heat
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA])) {
                if (Math.random() < 0.2) {
                    if (el === Elements.SALT_WATER) {
                        // 1 Salt dissolved 10 Water. So Salt Water is ~9% salt and 91% water.
                        this.setElement(x, y, Math.random() < 0.09 ? Elements.SALT : Elements.STEAM);
                    } else {
                        this.setElement(x, y, Elements.STEAM);
                    }
                    return;
                }
            }

            if (el === Elements.WATER && this.checkNeighbors(x, y, [Elements.PLANT])) {
                // Water accelerates plant growth — runs at 2× the base upward growth rate (0.005)
                if (Math.random() < 0.01) {
                    this.setElement(x, y, Elements.PLANT);
                    return;
                }
            }
        }

        // Density checks: each liquid can displace lighter ones below it
        let displaceable = [Elements.BLANK];
        if (el === Elements.NAPALM) displaceable.push(Elements.OIL);
        if (el === Elements.WATER) displaceable.push(Elements.OIL, Elements.NAPALM);
        if (el === Elements.SALT_WATER) displaceable.push(Elements.WATER, Elements.OIL, Elements.NAPALM);

        // Per-element scatter/entropy rates (how likely a liquid is to drift sideways even when falling)
        // Based on real-world viscosity - water is very fluid, lava barely moves
        const LIQUID_SCATTER = {
            [Elements.WATER]: 0.30,
            [Elements.SALT_WATER]: 0.28,
            [Elements.OIL]: 0.15,
            [Elements.NAPALM]: 0.08,
        };
        const scatterChance = LIQUID_SCATTER[el] ?? 0.10;

        const dir2 = Math.random() < 0.5 ? -1 : 1;
        const tryDiagonal2 = Math.random() < scatterChance;

        // Gate each candidate move on the medium's resistance
        const belowLqEl = this.getElement(x, y + 1);
        const diag1LqEl = this.getElement(x + dir2, y + 1);
        const diag2LqEl = this.getElement(x - dir2, y + 1);
        const canFallBelow = displaceable.includes(belowLqEl) && Math.random() >= this.getMediumResistance(belowLqEl);
        const canFallDiag1 = displaceable.includes(diag1LqEl) && Math.random() >= this.getMediumResistance(diag1LqEl);
        const canFallDiag2 = displaceable.includes(diag2LqEl) && Math.random() >= this.getMediumResistance(diag2LqEl);

        if (!tryDiagonal2 && canFallBelow) {
            this.swap(x, y, x, y + 1);
        } else if (canFallDiag1) {
            this.swap(x, y, x + dir2, y + 1);
        } else if (canFallBelow) {
            this.swap(x, y, x, y + 1);
        } else if (canFallDiag2) {
            this.swap(x, y, x - dir2, y + 1);
        }
        // Flow horizontally via pressure scan: look ahead N cells through same-liquid to find empty space
        // This lets interior cells of a mound "see" the edge and flow — preventing slow leveling
        else {
            const HORIZ_REACH = {
                [Elements.WATER]: 5,  // Very fluid
                [Elements.SALT_WATER]: 5,
                [Elements.OIL]: 3,  // Moderately viscous
                [Elements.NAPALM]: 1,  // Very thick
            };
            const reach = HORIZ_REACH[el] ?? 3;

            // Scan in primary direction through liquid of same type
            let horizDir = 0;
            for (let d = 1; d <= reach; d++) {
                const cell = this.getElement(x + dir2 * d, y);
                if (displaceable.includes(cell)) { horizDir = dir2; break; }   // Found space!
                if (cell !== el) break;                                         // Blocked by wall/other
            }
            // If nothing found, scan the opposite direction
            if (horizDir === 0) {
                for (let d = 1; d <= reach; d++) {
                    const cell = this.getElement(x - dir2 * d, y);
                    if (displaceable.includes(cell)) { horizDir = -dir2; break; }
                    if (cell !== el) break;
                }
            }
            // Move one step toward the detected open space
            if (horizDir !== 0) {
                this.swap(x, y, x + horizDir, y);
            }
        }

        // Firecracker Combustion Logic
        if (el === Elements.FIRECRACKER) {
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA, Elements.SPARK_RED, Elements.SPARK_GREEN, Elements.SPARK_BLUE, Elements.SPARK_YELLOW, Elements.SPARK_PURPLE])) {

                // Explode violently like Napalm
                const sparkColors = [Elements.SPARK_RED, Elements.SPARK_GREEN, Elements.SPARK_BLUE, Elements.SPARK_YELLOW, Elements.SPARK_PURPLE];

                // Explode centerpiece into a random spark
                this.setElement(x, y, sparkColors[Math.floor(Math.random() * sparkColors.length)]);

                // Shoot 1 to 3 long rainbow streaks
                const numStreaks = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < numStreaks; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const streakLength = Math.random() * 20 + 20; // 20 to 40 pixels long
                    const colorPick = sparkColors[Math.floor(Math.random() * sparkColors.length)];

                    for (let dist = 1; dist < streakLength; dist++) {
                        for (let w = -1; w <= 1; w++) {
                            const sx = Math.floor(x + Math.cos(angle) * dist + Math.sin(angle) * w);
                            const sy = Math.floor(y + Math.sin(angle) * dist - Math.cos(angle) * w);

                            if (this.inBounds(sx, sy)) {
                                const targetEl = this.getElement(sx, sy);
                                let streakDamage = 0.95 - (dist / streakLength) * 0.4;

                                if (targetEl === Elements.WALL || targetEl === Elements.CONCRETE) {
                                    streakDamage -= 0.3; // Hard materials resist
                                }

                                if (Math.random() < streakDamage) {
                                    this.setElement(sx, sy, colorPick);
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Helper for gases (Steam)
    updateGas(x, y, el) {
        // Disappear if it reaches the very top row
        if (y === 0) {
            this.setElement(x, y, Elements.BLANK);
            return;
        }

        // State-specific behavior
        if (el === Elements.STEAM) {
            if (Math.random() < 0.0005) {
                this.setElement(x, y, Elements.WATER);
                return;
            }
            // Steam is slightly less fluid than combustible Gas
            if (Math.random() > 0.6) return;
        }
        else if (el === Elements.GAS) {
            // Flammable chain-reaction
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA, Elements.SPARK_RED, Elements.SPARK_GREEN, Elements.SPARK_BLUE, Elements.SPARK_YELLOW, Elements.SPARK_PURPLE])) {
                // Increased ignition chance to 50% for a faster fireball wavefront
                if (Math.random() < 0.5) {
                    this.setElement(x, y, Elements.FIRE_2);

                    // Increased jump chance to 70% to throw flames further ahead
                    if (Math.random() < 0.7) {
                        const dx = Math.floor(Math.random() * 5) - 2; // Increased jump radius (-2 to 2)
                        const dy = Math.floor(Math.random() * 5) - 2;
                        if (this.isEmptyOrLiquid(x + dx, y + dy) || this.getElement(x + dx, y + dy) === Elements.GAS) {
                            this.setElement(x + dx, y + dy, Elements.FIRE_2);
                        }
                    }
                    return;
                }
            }
            // Combustible Gas is extremely fluid and active
            if (Math.random() > 0.9) return;
        }

        // Movement Logic: Like water in reverse.
        const dir = (this.frameCount + x + y) % 2 === 0 ? 1 : -1;

        // Gas can bubble through all liquids or enter empty air
        const checkRise = (tx, ty) => {
            const head = this.getElement(tx, ty);
            return head === Elements.BLANK || this.isLiquid(tx, ty);
        };

        // 1. Try straight up (Rise)
        if (checkRise(x, y - 1)) {
            this.swap(x, y, x, y - 1);
        }
        // 2. Try diagonal upwards (Scatter)
        else if (checkRise(x + dir, y - 1)) {
            this.swap(x, y, x + dir, y - 1);
        } else if (checkRise(x - dir, y - 1)) {
            this.swap(x, y, x - dir, y - 1);
        }
        // 3. Horizontal Pressure Scan (Reverse Leveling)
        // Find a nearby gap in the ceiling to flow toward
        else {
            const reach = 15; // Increased reach for better tunnel filling
            let horizDir = 0;

            for (let d = 1; d <= reach; d++) {
                const targetX = x + dir * d;
                const cell = this.getElement(targetX, y);

                // If we find a cell with open space above it, flow that way!
                if (checkRise(targetX, y - 1)) {
                    horizDir = dir;
                    break;
                }

                // We can scan through air or more of ourselves
                if (cell !== el && cell !== Elements.BLANK) break;
            }

            if (horizDir === 0) {
                for (let d = 1; d <= reach; d++) {
                    const targetX = x - dir * d;
                    const cell = this.getElement(targetX, y);
                    if (checkRise(targetX, y - 1)) {
                        horizDir = -dir;
                        break;
                    }
                    if (cell !== el && cell !== Elements.BLANK) break;
                }
            }

            if (horizDir !== 0) {
                this.swap(x, y, x + horizDir, y);
            }
            // 4. Pure Diffusion: If still stuck, slowly drift horizontally anyway
            else if (Math.random() < 0.1) {
                if (this.getElement(x + dir, y) === Elements.BLANK) {
                    this.swap(x, y, x + dir, y);
                }
            }
        }
    }

    // Helper for Ice and Snow
    updateIceAndSnow(x, y, el) {
        // Melts universally near heat
        if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA])) {
            this.setElement(x, y, Elements.WATER);
            return;
        }

        // Specific Ice logic
        if (el === Elements.ICE) {
            // Ice naturally melts slowly at "room temperature"
            // We only prevent melting if touching Liquid Nitrogen (super cold)
            if (!this.checkNeighbors(x, y, [Elements.LIQUID_NITROGEN])) {
                if (Math.random() < 0.002) { // 0.2% chance per frame to melt
                    this.setElement(x, y, Elements.WATER);
                    return;
                }
            }
            // Ice is a static solid — it doesn't fall (like wood or coal)
            return;
        }

        // Specific Snow logic
        if (el === Elements.SNOW) {
            // Freezes adjacent water into ice on contact (always — even mid-air)
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (this.getElement(x + dx, y + dy) === Elements.WATER) {
                        this.setElement(x + dx, y + dy, Elements.ICE);
                    }
                }
            }

            // Moves very slowly (60% of the time it just skips its turn to fall)
            if (Math.random() < 0.6) return;
        }

        // Movement logic (falling/sliding)
        let didMove = false;
        if (this.isEmptyOrLiquid(x, y + 1)) {
            this.swap(x, y, x, y + 1);
            didMove = true;
        } else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            if (this.isEmptyOrLiquid(x + dir, y + 1)) {
                this.swap(x, y, x + dir, y + 1);
                didMove = true;
            } else if (this.isEmptyOrLiquid(x - dir, y + 1)) {
                this.swap(x, y, x - dir, y + 1);
                didMove = true;
            }
        }

        // If snow couldn't move downwards at all, it settled. Turn into ice over time.
        // This is the ONLY place snow turns into ice, ensuring it never happens mid-air.
        if (el === Elements.SNOW && !didMove) {
            // Check foundation: only solidify if resting on something TRULY static (Wall, Wood, Coal, existing Ice)
            // or if we have reached the bottom of the grid.
            const below = this.getElement(x, y + 1);
            const isStaticFoundation = (y + 1 >= this.height) ||
                [Elements.WALL, Elements.WOOD, Elements.COAL, Elements.ICE, Elements.CONCRETE].includes(below);

            if (isStaticFoundation && Math.random() < 0.02) {
                this.setElement(x, y, Elements.ICE);
            }
        }
    }

    // Helper for reactive/special liquids (Liquid N2, Acid)
    updateSpecialLiquids(x, y, el) {
        if (el === Elements.LIQUID_NITROGEN) {
            let didFreeze = false;
            // Freezes adjacent water extremely quickly in a 2-block radius (more severe than snow)
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const targetEl = this.getElement(x + dx, y + dy);
                    if (targetEl === Elements.WATER || targetEl === Elements.SALT_WATER) {
                        this.setElement(x + dx, y + dy, Elements.ICE);
                        didFreeze = true;
                    } else if (targetEl === Elements.PLANT) {
                        // Freezes and kills plants instantly
                        this.setElement(x + dx, y + dy, Elements.ICE);
                        didFreeze = true;
                    }
                }
            }

            // Evaporates instantly upon freezing something
            if (didFreeze) {
                this.setElement(x, y, Elements.BLANK);
                return;
            }

            // Evaporates slowly over time natively
            if (Math.random() < 0.02) {
                this.setElement(x, y, Elements.BLANK);
                return;
            }
        }
        else if (el === Elements.LAVA) {
            let didCorrode = false;
            // Eat through everything except blank space and other lava
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const targetEl = this.getElement(x + dx, y + dy);

                    if (targetEl === Elements.WATER || targetEl === Elements.SALT_WATER ||
                        targetEl === Elements.ICE || targetEl === Elements.SNOW) {
                        // Lava cools into stone (ASH) when touching water/cold
                        this.setElement(x, y, Elements.ASH);

                        // Water/ice/salt-water occasionally vaporizes into steam/salt
                        if (Math.random() < 0.5) {
                            if (targetEl === Elements.SALT_WATER) {
                                // 9% salt, 91% steam to conserve 1:10 dissolve ratio
                                this.setElement(x + dx, y + dy, Math.random() < 0.09 ? Elements.SALT : Elements.STEAM);
                            } else {
                                this.setElement(x + dx, y + dy, Elements.STEAM);
                            }
                        }
                        return;
                    }

                    if (targetEl === Elements.PLANT || targetEl === Elements.WAX || targetEl === Elements.OIL) {
                        // Ignites flammable materials
                        this.setElement(x + dx, y + dy, Elements.FIRE_2);
                    }

                    if (targetEl !== Elements.BLANK && targetEl !== Elements.LAVA &&
                        targetEl !== Elements.FIRE_0 && targetEl !== Elements.FIRE_1 &&
                        targetEl !== Elements.FIRE_2 && targetEl !== Elements.FIRE_3) {

                        // Determine corrosion probability based on material
                        let corrodeChance = 0.05; // Base 5% chance

                        if (targetEl === Elements.CONCRETE) {
                            corrodeChance = 0.005; // Concrete is highly resistant
                        } else if (targetEl === Elements.WALL) {
                            corrodeChance = 0.02; // Wall is somewhat resistant
                        }

                        if (Math.random() < corrodeChance) {
                            this.setElement(x + dx, y + dy, Elements.BLANK);
                            didCorrode = true;

                            // Concrete takes more lava with it when corroded/melted
                            if (targetEl === Elements.CONCRETE && Math.random() < 0.8) {
                                this.setElement(x, y, Elements.ASH); // Lava cools
                                return;
                            }
                        }
                    }
                }
            }
            // Consumes itself occasionally when corroding (turns into ASH/stone)
            if (didCorrode && Math.random() < 0.5) {
                this.setElement(x, y, Elements.ASH);
                return;
            }

            // Lava occasionally spawns fire above it
            if (Math.random() < 0.01 && this.getElement(x, y - 1) === Elements.BLANK) {
                this.setElement(x, y - 1, Elements.FIRE_1);
            }
        }

        // Standard flowing logic for these liquids
        let below = this.getElement(x, y + 1);
        if (below === Elements.BLANK) {
            this.swap(x, y, x, y + 1);
        } else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            if (this.getElement(x + dir, y + 1) === Elements.BLANK) {
                this.swap(x, y, x + dir, y + 1);
            } else if (this.getElement(x - dir, y + 1) === Elements.BLANK) {
                this.swap(x, y, x - dir, y + 1);
            } else if (this.getElement(x + dir, y) === Elements.BLANK) {
                this.swap(x, y, x + dir, y);
            } else if (this.getElement(x - dir, y) === Elements.BLANK) {
                this.swap(x, y, x - dir, y);
            }
        }
    }

    // Helper for Fire states
    updateFire(x, y, el) {
        // Water dampens fire - downgrades by one fire tier when touching water/salt water
        if (el >= Elements.FIRE_0 && el <= Elements.FIRE_3) {
            if (this.checkNeighbors(x, y, [Elements.WATER, Elements.SALT_WATER])) {
                // NEW: Fuses are waterproof! This prevents water from artificially speeding up the fuse
                // by forcing FIRE_3 to rapidly decay down to FIRE_1. 
                if (!this.checkNeighbors(x, y, [Elements.FUSE])) {
                    if (Math.random() < 0.6) { // 60% chance per frame to be dampened
                        if (el === Elements.FIRE_0) {
                            this.setElement(x, y, Elements.BLANK); // weakest tier just gets snuffed out
                        } else if (el === Elements.FIRE_1) {
                            this.setElement(x, y, Elements.FIRE_0);
                        } else if (el === Elements.FIRE_2) {
                            this.setElement(x, y, Elements.FIRE_1);
                        } else if (el === Elements.FIRE_3) {
                            this.setElement(x, y, Elements.FIRE_2);
                        }
                        return;
                    }
                }
            }
        }

        // Rise up randomly
        // Further reduced from 0.6 to 0.3 for a more 'weighted' and slow-moving fire wave
        if (el === Elements.FIRE_0 || el === Elements.FIRE_1) {
            const dx = Math.floor(Math.random() * 3) - 1;
            if (this.getElement(x + dx, y - 1) === Elements.BLANK && Math.random() < 0.3) {
                this.swap(x, y, x + dx, y - 1);
            }
        }

        // State machine logic - SLOWED DOWN (Half the speed of before)
        if (el === Elements.FIRE_0) {
            this.setElement(x, y, Elements.BLANK);
            if (Math.random() < 0.1 && this.getElement(x, y - 1) === Elements.BLANK) {
                this.setElement(x, y - 1, Elements.FIRE_1);
            }
        }
        else if (el === Elements.FIRE_1) {
            if (Math.random() < 0.15) this.setElement(x, y, Elements.FIRE_0);
        }
        else if (el === Elements.FIRE_2) {
            if (Math.random() < 0.05) this.setElement(x, y, Elements.FIRE_1);
        }
        else if (el === Elements.FIRE_3) {
            if (Math.random() < 0.01) this.setElement(x, y, Elements.FIRE_2);
        }

        // --- NEW: SURFACE SPARKS ---
        // Intense fire (FIRE_3, FIRE_2) occasionally throws arcing streaks into the air
        // but only if it is at the surface (touching empty air)
        if (el === Elements.FIRE_3 || (el === Elements.FIRE_2 && Math.random() < 0.2)) {
            if (Math.random() < 0.001) { // Very rare per pixel to avoid flooding
                if (this.getElement(x, y - 1) === Elements.BLANK ||
                    this.getElement(x + 1, y) === Elements.BLANK ||
                    this.getElement(x - 1, y) === Elements.BLANK) {

                    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5; // Mostly upwards
                    const len = 15 + Math.random() * 25;
                    this.drawArcStreak(x, y, angle, len, 1);
                }
            }
        }
        // Sparks fade much slower (5% chance to vanish instead of 20%)
        else if (el >= Elements.SPARK_RED && el <= Elements.SPARK_PURPLE) {
            if (Math.random() < 0.05) {
                this.setElement(x, y, Elements.BLANK);
            }
        }
    }

    // Helper for reactive immobile things (Plant, Wax, TNT)
    updateImmobile(x, y, el) {
        let isHot = this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.TORCH]);

        if (el === Elements.TNT) {
            if (isHot || this.checkNeighbors(x, y, [Elements.LAVA, Elements.FIRE_2, Elements.FIRE_3])) {
                // High ignition chance for rapid blast propagation (85% chance per frame)
                if (Math.random() < 0.85) {
                    // Convert only this single pixel to high fire
                    this.setElement(x, y, Elements.FIRE_3);

                    // TNT: 2 to 4 streaks per particle
                    const numPerParticle = Math.floor(Math.random() * 3) + 2;
                    for (let i = 0; i < numPerParticle; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const streakLength = 10 + Math.random() * 15;
                        this.drawArcStreak(x, y, angle, streakLength, 1);
                    }
                }
            }
        }
        else if (el === Elements.PLANT) {
            if (isHot) {
                this.setElement(x, y, Elements.FIRE_2);
            } else {
                // Grow upwards slowly
                if (Math.random() < 0.005) { // Very low probability each frame
                    // Pick directly above or diagonally above
                    const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                    if (this.getElement(x + dx, y - 1) === Elements.BLANK) {
                        this.setElement(x + dx, y - 1, Elements.PLANT);
                    }
                }
            }
        }
        else if (el === Elements.WAX) {
            if (isHot) {
                // Burns 80% as fast as it used to
                if (Math.random() < 0.8) {
                    this.setElement(x, y, Elements.FIRE_3);
                }
            }
        }
        else if (el === Elements.FUSE) {
            if (isHot) {
                // Convert self
                this.setElement(x, y, Elements.FIRE_3);
                // Instantly ignite adjacent fuse pixels for ~2x propagation speed
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        if (this.getElement(x + dx, y + dy) === Elements.FUSE) {
                            this.setElement(x + dx, y + dy, Elements.FIRE_3);
                        }
                    }
                }
            }
        }
        else if (el === Elements.WOOD || el === Elements.COAL || el === Elements.COAL_GLOWING) {
            let isGlowing = (el === Elements.COAL_GLOWING);
            let burning = isHot || this.checkNeighbors(x, y, [Elements.LAVA, Elements.FIRE_2, Elements.FIRE_3]) || isGlowing;

            if (burning) {
                // If this is regular COAL that caught fire, turn it into COAL_GLOWING
                if (el === Elements.COAL) {
                    this.setElement(x, y, Elements.COAL_GLOWING);
                    el = Elements.COAL_GLOWING; // Update local tracker
                    isGlowing = true;
                }

                // If this is glowing coal, slowly propagate the heat directly to adjacent unlit coal layers
                if (isGlowing && Math.random() < 0.0005) {
                    const dx = Math.floor(Math.random() * 3) - 1;
                    const dy = Math.floor(Math.random() * 3) - 1;
                    if (this.getElement(x + dx, y + dy) === Elements.COAL) {
                        this.setElement(x + dx, y + dy, Elements.COAL_GLOWING);
                    }
                }

                // Guarantee the fire sustains by aggressively spawning ambient flames around it
                // We use a very high probability so the fire never accidentally dies out naturally
                if (Math.random() < 0.8) {
                    const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                    const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, 1 (all directions including bottom)
                    if (this.getElement(x + dx, y + dy) === Elements.BLANK) {
                        this.setElement(x + dx, y + dy, Elements.FIRE_2);
                    }
                }

                // Slow-burn self-consumption (Wood = ~4 seconds, Coal = ~20 seconds at 60 FPS)
                // When completely consumed, only 25% chance to leave behind ASH (less clutter)
                if (el === Elements.WOOD && Math.random() < 0.004) {
                    this.setElement(x, y, Math.random() < 0.40 ? Elements.ASH : Elements.BLANK);
                } else if (isGlowing && Math.random() < 0.00083) {
                    this.setElement(x, y, Math.random() < 0.10 ? Elements.ASH : Elements.BLANK);
                }
            }
        }
        else if (el === Elements.FIRECRACKER) {
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA, Elements.SPARK_RED, Elements.SPARK_GREEN, Elements.SPARK_BLUE, Elements.SPARK_YELLOW, Elements.SPARK_PURPLE, Elements.NAPALM])) {
                // Slower propagation for firecrackers (20% chance)
                if (Math.random() < 0.15) {
                    this.setElement(x, y, Elements.SPARK_YELLOW);

                    // Firecracker: 1 to 2 longer streaks per particle
                    const numArcs = 1;
                    for (let i = 0; i < numArcs; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const arcLen = Math.random() * 50 + 90; // Giant rainbow trails
                        // Use special 'RAINBOW' flag for overrideColor
                        this.drawArcStreak(x, y, angle, arcLen, 1, 'RAINBOW');
                    }
                }
            }
        }
        else if (el === Elements.WORMHOLE) {
            // 1. EVENT HORIZON: Delete anything that touches the wormhole
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;

                    const targetEl = this.getElement(x + dx, y + dy);

                    // Don't delete boundaries, walls, or other wormholes
                    if (targetEl !== Elements.BOUNDS && targetEl !== Elements.BLANK && targetEl !== Elements.WALL && targetEl !== Elements.WORMHOLE) {
                        this.setElement(x + dx, y + dy, Elements.BLANK);
                    }
                }
            }

            // 2. GRAVITY: Pull nearby particles toward the center
            // We sample multiple random points in a radius around the wormhole to simulate gravity
            const gravityRadius = 25;
            const pullStrength = 8; // Number of pull samples per frame

            for (let i = 0; i < pullStrength; i++) {
                const rx = x + Math.floor(Math.random() * (gravityRadius * 2 + 1)) - gravityRadius;
                const ry = y + Math.floor(Math.random() * (gravityRadius * 2 + 1)) - gravityRadius;

                if (rx === x && ry === y) continue;
                if (!this.inBounds(rx, ry)) continue;

                const targetEl = this.grid[this.getIndex(rx, ry)];

                // Only pull movable/physical things
                if (targetEl !== Elements.BLANK && targetEl !== Elements.WALL && targetEl !== Elements.WORMHOLE && targetEl !== Elements.BOUNDS) {
                    // Calculate vector toward black hole center
                    const vX = Math.sign(x - rx);
                    const vY = Math.sign(y - ry);

                    const nextX = rx + vX;
                    const nextY = ry + vY;

                    if (this.inBounds(nextX, nextY)) {
                        const destinationEl = this.getElement(nextX, nextY);
                        // Pull if the path is air or if we're displacing a fluid
                        if (destinationEl === Elements.BLANK || this.isLiquid(nextX, nextY)) {
                            this.swap(rx, ry, nextX, nextY);
                        }
                    }
                }
            }
        }
    }

    // Optimized streak update system to prevent freezing during massive explosions
    updateActiveStreaks() {
        if (this.activeStreaks.length === 0) return;

        // Process a fixed chunk of streaks each frame to maintain FPS
        // If we have too many, we process them over multiple frames
        const limit = 3000;
        const count = Math.min(this.activeStreaks.length, limit);

        for (let i = 0; i < count; i++) {
            const s = this.activeStreaks[i];

            s.progress++;
            if (s.progress >= s.length) {
                s.dead = true;
                continue;
            }

            const currentAngle = s.angle + s.curve * (s.progress - s.radius);
            const gOffset = s.gravity * Math.pow(s.progress - s.radius, 1.85);

            const sx = Math.floor(s.originX + Math.cos(currentAngle) * s.progress);
            const sy = Math.floor(s.originY + Math.sin(currentAngle) * s.progress + gOffset);

            if (this.inBounds(sx, sy)) {
                const targetEl = this.getElement(sx, sy);

                // NEW: Collision and Destruction Logic
                // Streaks are now destructive projectiles that "eat through" materials
                if (targetEl !== Elements.BLANK && targetEl !== Elements.BOUNDS) {
                    const ratio = s.progress / s.length;
                    let destructiveChance = 0.9 - (ratio * 0.4); // Strongest at the start

                    if (targetEl === Elements.WALL || targetEl === Elements.CONCRETE) {
                        // Firecracker (RAINBOW) streaks are decorative and rarely break hard walls
                        // TNT and Napalm streaks remain powerful demolition tools
                        const wallPierceChance = (s.overrideColor === 'RAINBOW') ? 0.05 : 0.50;
                        
                        if (Math.random() < wallPierceChance) {
                            this.setElement(sx, sy, Elements.FIRE_3);
                        } else {
                            // If we don't break the wall, the streak terminates
                            s.dead = true;
                            continue;
                        }
                    } else {
                        // Softer materials (Sand, Napalm, Wood, etc) get vaporized/ignited
                        if (Math.random() < destructiveChance) {
                            this.setElement(sx, sy, Elements.FIRE_3);
                        }
                    }
                }

                let color = s.overrideColor;
                if (color === 'RAINBOW') {
                    // Cycle through spark colors based on progress/frame
                    const sparkColors = [Elements.SPARK_RED, Elements.SPARK_GREEN, Elements.SPARK_BLUE, Elements.SPARK_YELLOW, Elements.SPARK_PURPLE];
                    color = sparkColors[(s.progress + this.frameCount) % sparkColors.length];
                } else if (!color) {
                    const ratio = s.progress / s.length;
                    if (ratio < 0.3) color = Elements.FIRE_3;
                    else if (ratio < 0.6) color = Elements.FIRE_2;
                    else if (Math.random() < 0.5) color = Elements.SPARK_YELLOW;
                    else color = Elements.FIRE_1;
                }

                // Visual trail drawing
                if (Math.random() < 0.65) {
                    this.setElement(sx, sy, color);
                }
            }
        }

        // Single pass cleanup: significantly faster than multiple splices
        // We only clean up when the queue gets bulky or after some time
        if (this.frameCount % 5 === 0) {
            this.activeStreaks = this.activeStreaks.filter(s => !s.dead);
        }

        // Hard protective cap
        if (this.activeStreaks.length > 15000) {
            this.activeStreaks = this.activeStreaks.slice(-15000);
        }
    }

    // Pushes a new animated streak to the queue
    drawArcStreak(x, y, angle, length, startRadius, overrideColor = null) {
        this.activeStreaks.push({
            originX: x,
            originY: y,
            angle: angle,
            length: length,
            radius: startRadius,
            progress: startRadius,
            curve: (Math.random() - 0.5) * 0.06,
            gravity: 0.015,
            overrideColor: overrideColor
        });
    }


    // Return true if any of the surrounding 8 pixels are one of the elements
    checkNeighbors(x, y, elArray) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                if (elArray.includes(this.getElement(x + dx, y + dy))) return true;
            }
        }
        return false;
    }

    // Checks if the pixel is empty or a liquid (so solids can sink)
    isEmptyOrLiquid(x, y) {
        const target = this.getElement(x, y);
        return target === Elements.BLANK || this.isLiquid(x, y);
    }

    // Checks if the pixel is specifically a displacement-friendly liquid
    isLiquid(x, y) {
        const target = this.getElement(x, y);
        return target === Elements.WATER || target === Elements.SALT_WATER ||
            target === Elements.OIL || target === Elements.LIQUID_NITROGEN ||
            target === Elements.LAVA;
    }

    // HSL (Hue, Saturation, Lightness) to 32-bit packed RGB helper
    hslToRgbPacked(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1 / 3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1 / 3);
        }

        const outR = Math.round(r * 255);
        const outG = Math.round(g * 255);
        const outB = Math.round(b * 255);

        // Pack into 32-bit little-endian ABGR (actually RGBA since ImageData view reverses it)
        return (255 << 24) | (outB << 16) | (outG << 8) | outR;
    }

    render() {
        for (let i = 0; i < this.grid.length; i++) {
            const el = this.grid[i];

            if (el === Elements.FIRECRACKER) {
                // Alternating white and bright pink speckles based on grid position (checkerboard pattern)
                // 0xFFFFFFFF = Pure White (ABGR)
                // 0xFFB432FF = Bright Pink RGB(255, 50, 180) -> ABGR(255, 180, 50, 255)
                const x = i % this.width;
                const y = Math.floor(i / this.width);
                this.view[i] = ((x + y) % 2 === 0) ? 0xFFFFFFFF : 0xFFB432FF;
            } else {
                const color = ElementColors[el];
                this.view[i] = color !== undefined ? color : 0xFF000000;
            }
        }
        this.ctx.putImageData(this.imageData, 0, 0);
    }
}
