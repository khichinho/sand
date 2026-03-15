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

        // Fall straight down
        if (this.isEmptyOrLiquid(x, y + 1)) {
            // Liquids sink in oil, sand sinks in water... let's refine this 
            // In a simple model: solids always displace liquids
            this.swap(x, y, x, y + 1);
        }
        // Slide left or right diagonally down
        else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            if (this.isEmptyOrLiquid(x + dir, y + 1)) {
                this.swap(x, y, x + dir, y + 1);
            } else if (this.isEmptyOrLiquid(x - dir, y + 1)) {
                this.swap(x, y, x - dir, y + 1);
            }
        }
    }

    // Helper for liquids (water, oil, salt water, napalm)
    updateLiquid(x, y, el) {
        // Specific material reactions
        if (el === Elements.NAPALM) {
            // Check EXACTLY the same heat sources as Oil so it paces identically
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA])) {

                // Oil is 0.05. Napalm is 0.10 (exactly 2x faster than oil)
                if (Math.random() < 0.10) {
                    this.setElement(x, y, Elements.FIRE_3);

                    // Shoot extremely long, THICK fire streaks
                    const numStreaks = Math.floor(Math.random() * 3) + 1; // 1 to 3 streaks
                    for (let i = 0; i < numStreaks; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const streakLength = Math.random() * 20 + 20; // 20 to 40 pixels long (halved)

                        // Draw the streak outward
                        for (let dist = 1; dist < streakLength; dist++) {
                            // Add thickness (-1 to 1) so it actually bores a visible hole
                            for (let w = -1; w <= 1; w++) {
                                const sx = Math.floor(x + Math.cos(angle) * dist + Math.sin(angle) * w);
                                const sy = Math.floor(y + Math.sin(angle) * dist - Math.cos(angle) * w);

                                if (this.inBounds(sx, sy)) {
                                    const targetEl = this.getElement(sx, sy);

                                    // Deal heavy damage to everything it touches, tapering off near the tip
                                    let streakDamage = 0.95 - (dist / streakLength) * 0.4;

                                    if (targetEl === Elements.WALL || targetEl === Elements.CONCRETE) {
                                        streakDamage -= 0.3; // Hard materials resist but can still be destroyed
                                    }

                                    if (Math.random() < streakDamage) {
                                        this.setElement(sx, sy, Elements.FIRE_3);
                                    }
                                }
                            }
                        }
                    }
                    return;
                }
                // Otherwise, just spawn intense fire above it so it continuously burns
                else if (Math.random() < 0.2 && this.getElement(x, y - 1) === Elements.BLANK) {
                    this.setElement(x, y - 1, Elements.FIRE_3);
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
                // "becomes plant when next to plant to simulate a plant that grows"
                if (Math.random() < 0.1) {
                    this.setElement(x, y, Elements.PLANT);
                    return;
                }
            }
        }

        // Density checks
        let displaceable = [Elements.BLANK];
        if (el === Elements.NAPALM) displaceable.push(Elements.OIL);
        if (el === Elements.WATER) displaceable.push(Elements.OIL, Elements.NAPALM);
        if (el === Elements.SALT_WATER) displaceable.push(Elements.WATER, Elements.OIL, Elements.NAPALM);

        let below = this.getElement(x, y + 1);

        // Fall straight down
        if (displaceable.includes(below)) {
            this.swap(x, y, x, y + 1);
        }
        // Flow diagonally
        else {
            const dir = Math.random() < 0.5 ? -1 : 1;
            let target1 = this.getElement(x + dir, y + 1);
            let target2 = this.getElement(x - dir, y + 1);

            if (displaceable.includes(target1)) {
                this.swap(x, y, x + dir, y + 1);
            } else if (displaceable.includes(target2)) {
                this.swap(x, y, x - dir, y + 1);
            }
            // Flow horizontally
            else {
                let target3 = this.getElement(x + dir, y);
                let target4 = this.getElement(x - dir, y);

                if (displaceable.includes(target3)) {
                    this.swap(x, y, x + dir, y);
                } else if (displaceable.includes(target4)) {
                    this.swap(x, y, x - dir, y);
                }
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

        if (el === Elements.STEAM) {
            // Condense back into water very slowly over time
            if (Math.random() < 0.0005) {
                this.setElement(x, y, Elements.WATER);
                return;
            }

            // Move slower (only update 40% of the time)
            if (Math.random() > 0.4) return;
        }
        else if (el === Elements.GAS) {
            // Highly flammable chain-reaction
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA])) {
                if (Math.random() < 0.8) { // 80% chance to violently ignite
                    this.setElement(x, y, Elements.FIRE_0); // Fire_0 burns out very fast
                    return;
                }
            }

            // Move slower (only update 40% of the time, just like Steam)
            if (Math.random() > 0.4) return;
        }

        // Rise upwards
        let above = this.getElement(x, y - 1);
        if (above === Elements.BLANK || this.isLiquid(x, y - 1)) {
            this.swap(x, y, x, y - 1);
        } else {
            // Flow diagonally upwards
            const dir = Math.random() < 0.5 ? -1 : 1;
            let diag1 = this.getElement(x + dir, y - 1);
            let diag2 = this.getElement(x - dir, y - 1);

            if (diag1 === Elements.BLANK || this.isLiquid(x + dir, y - 1)) {
                this.swap(x, y, x + dir, y - 1);
            } else if (diag2 === Elements.BLANK || this.isLiquid(x - dir, y - 1)) {
                this.swap(x, y, x - dir, y - 1);
            }
            // Flow horizontally
            else if (this.getElement(x + dir, y) === Elements.BLANK) {
                this.swap(x, y, x + dir, y);
            } else if (this.getElement(x - dir, y) === Elements.BLANK) {
                this.swap(x, y, x - dir, y);
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

            // Moves slowly
            if (this.frameCount % 2 === 0) return;
        }

        // Specific Snow logic
        if (el === Elements.SNOW) {
            // Freezes adjacent water into ice on contact
            let touchedWater = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (this.getElement(x + dx, y + dy) === Elements.WATER) {
                        this.setElement(x + dx, y + dy, Elements.ICE);
                        touchedWater = true;
                    }
                }
            }
            // If it froze water, or just randomly, snow turns into ice over time when resting
            if (touchedWater || Math.random() < 0.001) {
                this.setElement(x, y, Elements.ICE);
                return;
            }

            // Moves very slowly
            if (Math.random() > 0.3) return;
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

        // If snow couldn't move downwards at all, it settled. Turn into ice eventually.
        if (el === Elements.SNOW && !didMove) {
            if (Math.random() < 0.05) { // 5% chance to pack into ice every frame it is stationary
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
                        // Lava cools into stone (WALL) when touching water/cold
                        this.setElement(x, y, Elements.WALL);

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
                                this.setElement(x, y, Elements.WALL); // Lava cools
                                return;
                            }
                        }
                    }
                }
            }
            // Consumes itself occasionally when corroding (turns into wall/stone)
            if (didCorrode && Math.random() < 0.5) {
                this.setElement(x, y, Elements.WALL);
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

        // Rise up randomly
        if (el === Elements.FIRE_0 || el === Elements.FIRE_1) {
            const dx = Math.floor(Math.random() * 3) - 1;
            if (this.getElement(x + dx, y - 1) === Elements.BLANK && Math.random() < 0.8) {
                this.swap(x, y, x + dx, y - 1);
            }
        }

        // State machine logic
        if (el === Elements.FIRE_0) {
            this.setElement(x, y, Elements.BLANK);
            if (Math.random() < 0.2 && this.getElement(x, y - 1) === Elements.BLANK) {
                this.setElement(x, y - 1, Elements.FIRE_1);
            }
        }
        else if (el === Elements.FIRE_1) {
            if (Math.random() < 0.3) this.setElement(x, y, Elements.FIRE_0);
        }
        else if (el === Elements.FIRE_2) {
            if (Math.random() < 0.1) this.setElement(x, y, Elements.FIRE_1);
        }
        else if (el === Elements.FIRE_3) {
            if (Math.random() < 0.02) this.setElement(x, y, Elements.FIRE_2);
        }
        // Sparks fade extremely fast directly into nothingness (like fireworks)
        else if (el >= Elements.SPARK_RED && el <= Elements.SPARK_PURPLE) {
            // High chance to vanish
            if (Math.random() < 0.2) {
                this.setElement(x, y, Elements.BLANK);
            }
        }
    }

    // Helper for reactive immobile things (Plant, Wax, TNT)
    updateImmobile(x, y, el) {
        let isHot = this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.TORCH]);

        if (el === Elements.TNT) {
            if (isHot || this.checkNeighbors(x, y, [Elements.LAVA, Elements.FIRE_2, Elements.FIRE_3])) {

                // 1. Flood-fill to find all connected TNT and calculate mass
                let mass = 0;
                let queue = [[x, y]];
                let visited = new Set();
                visited.add(`${x},${y}`);
                let minX = x, maxX = x, minY = y, maxY = y;

                while (queue.length > 0 && mass < 2000) { // Cap at 2000 pixels to prevent hanging
                    let [cx, cy] = queue.shift();

                    // Consume the TNT immediately
                    this.setElement(cx, cy, Elements.FIRE_3);
                    mass++;

                    minX = Math.min(minX, cx);
                    maxX = Math.max(maxX, cx);
                    minY = Math.min(minY, cy);
                    maxY = Math.max(maxY, cy);

                    // Check neighbors
                    const neighbors = [
                        [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
                        [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
                    ];

                    for (let [nx, ny] of neighbors) {
                        if (this.inBounds(nx, ny) && this.getElement(nx, ny) === Elements.TNT) {
                            let key = `${nx},${ny}`;
                            if (!visited.has(key)) {
                                visited.add(key);
                                queue.push([nx, ny]);
                            }
                        }
                    }
                }

                // Center the explosion on the bounding box of the TNT mass
                const centerX = Math.floor((minX + maxX) / 2);
                const centerY = Math.floor((minY + maxY) / 2);

                // Calculate explosion radius based on mass (non-linear)
                // Mass 1 = radius ~ 6
                // Mass 100 = radius ~ 20
                // Mass 500 = radius ~ 38
                const radius = Math.floor(5 + Math.sqrt(mass) * 1.5);

                // 2. Core Circular Blast with radial falloff
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= radius) {
                            const targetX = centerX + dx;
                            const targetY = centerY + dy;
                            if (this.inBounds(targetX, targetY)) {
                                const targetEl = this.getElement(targetX, targetY);

                                // Calculate damage chance based on distance (1.2 at center, 0.2 at edge)
                                let damageChance = 1.2 - (dist / radius);

                                // Hard materials are much harder to destroy
                                if (targetEl === Elements.WALL || targetEl === Elements.CONCRETE) {
                                    damageChance -= 0.4;
                                }

                                // Center 20% is completely obliterated regardless of material
                                if (dist < radius * 0.2 || Math.random() < damageChance) {
                                    this.setElement(targetX, targetY, Elements.FIRE_3);
                                }
                            }
                        }
                    }
                }

                // 3. Explode outward with directional fire streaks (shrapnel/jets)
                const numStreaks = Math.floor(Math.random() * (8 + mass / 100)) + 8; // More mass = slightly more streaks
                for (let i = 0; i < numStreaks; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const streakLength = radius + Math.random() * 40 + 20; // Reach far beyond radius

                    // Draw the streak outward from center
                    for (let dist = 0; dist < streakLength; dist++) {
                        // Add some spread/thickness to the streak, tapering off
                        for (let w = -2; w <= 2; w++) {
                            // Taper thickness: tip of the streak is thinnest
                            if (Math.abs(w) > 1 && dist > streakLength * 0.5) continue;

                            const sx = Math.floor(centerX + Math.cos(angle) * dist + Math.sin(angle) * w);
                            const sy = Math.floor(centerY + Math.sin(angle) * dist - Math.cos(angle) * w);

                            if (this.inBounds(sx, sy)) {
                                const targetEl = this.getElement(sx, sy);

                                // Streaks do heavy damage to everything, tapering near tip
                                let streakDamage = 0.9 - (dist / streakLength) * 0.4;

                                if (targetEl === Elements.WALL || targetEl === Elements.CONCRETE) {
                                    streakDamage -= 0.3; // Less effective against walls
                                }

                                if (Math.random() < streakDamage) {
                                    this.setElement(sx, sy, Elements.FIRE_3); // Hot fire streak
                                }
                            }
                        }
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
        else if (el === Elements.WOOD || el === Elements.COAL) {
            if (isHot || this.checkNeighbors(x, y, [Elements.LAVA, Elements.FIRE_2, Elements.FIRE_3])) {

                // Guarantee the fire sustains by aggressively spawning ambient flames around it
                // We use a very high probability so the fire never accidentally dies out naturally
                if (Math.random() < 0.8) {
                    const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
                    const dy = Math.floor(Math.random() * 2) - 1; // -1, 0 (focusing upwards/sides)
                    if (this.getElement(x + dx, y + dy) === Elements.BLANK) {
                        this.setElement(x + dx, y + dy, Elements.FIRE_2);
                    }
                }

                // Slow-burn self-consumption (Wood = ~4 seconds, Coal = ~20 seconds at 60 FPS)
                // When completely consumed, only 25% chance to leave behind ASH (less clutter)
                if (el === Elements.WOOD && Math.random() < 0.004) {
                    this.setElement(x, y, Math.random() < 0.40 ? Elements.ASH : Elements.BLANK);
                } else if (el === Elements.COAL && Math.random() < 0.00083) {
                    this.setElement(x, y, Math.random() < 0.10 ? Elements.ASH : Elements.BLANK);
                }
            }
        }
        else if (el === Elements.FIRECRACKER) {
            if (this.checkNeighbors(x, y, [Elements.FIRE_0, Elements.FIRE_1, Elements.FIRE_2, Elements.FIRE_3, Elements.TORCH, Elements.LAVA, Elements.SPARK_RED, Elements.SPARK_GREEN, Elements.SPARK_BLUE, Elements.SPARK_YELLOW, Elements.SPARK_PURPLE])) {

                // Slow down the burn rate so it chain-reacts instead of vaporizing instantly
                if (Math.random() < 0.05) {
                    // Explode violently into rainbow sparks
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
        else if (el === Elements.WORMHOLE) {
            // Delete anything that touches the wormhole, acting like a cosmic vacuum
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
        }
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
