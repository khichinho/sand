class Input {
    constructor(engine) {
        this.engine = engine;
        this.canvas = engine.canvas;

        this.isDrawing = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.currentElement = Elements.SAND; // Default
        this.brushSize = 4; // Default

        this.setupListeners();
        this.setupUI();
    }

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.updateMousePos(e);
            this.draw();
        });

        window.addEventListener('mouseup', () => {
            this.isDrawing = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this.updateMousePos(e);
            if (this.isDrawing) {
                this.draw();
            }
        });

        // Brush slider
        const brushSlider = document.getElementById('brush-size');
        brushSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.updateBrushPreview();
        });
    }

    updateMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        // Calculate coordinate based on the CSS scaled size vs actual grid size
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        this.mouseX = Math.floor((e.clientX - rect.left) * scaleX);
        this.mouseY = Math.floor((e.clientY - rect.top) * scaleY);
    }

    draw() {
        // Draw a circle/square shape depending on brush size
        const r = this.brushSize;
        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                if (i * i + j * j <= r * r) { // Circular brush
                    const px = this.mouseX + i;
                    const py = this.mouseY + j;
                    // For now, raw placement. Later we might want to probabilistically place things
                    this.engine.setElement(px, py, this.currentElement);
                }
            }
        }
    }

    setupUI() {
        const select = document.getElementById('category-select');

        // Populate dropdown options
        Object.keys(ElementCategories).forEach(catName => {
            const opt = document.createElement('option');
            opt.value = catName;
            opt.innerText = catName;
            select.appendChild(opt);
        });

        // Listen for changes
        select.addEventListener('change', (e) => {
            this.renderCategory(e.target.value);
            // Tell the engine to immediately resize if needed when tool changes to prevent layout shift
            if (this.engine.resize) this.engine.resize();
        });

        // Initial render
        this.renderCategory('Basic');
        this.updateBrushPreview();
    }

    updateBrushPreview() {
        const previewCanvas = document.getElementById('brush-preview');
        if (!previewCanvas) return;

        const ctx = previewCanvas.getContext('2d');
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        const r = this.brushSize;
        const c = ElementColors[this.currentElement];

        let rgb = 'rgba(255,255,255,0)';
        let isEraser = false;

        if (c !== undefined && c !== 0) {
            const rCol = c & 0xFF;
            const gCol = (c >> 8) & 0xFF;
            const bCol = (c >> 16) & 0xFF;
            rgb = `rgb(${rCol},${gCol},${bCol})`;
        } else {
            isEraser = true;
        }

        // The canvas is 21x21 internally, index 0 to 20. Center is at 10.
        const center = Math.floor(previewCanvas.width / 2);

        for (let i = -r; i <= r; i++) {
            for (let j = -r; j <= r; j++) {
                if (i * i + j * j <= r * r) {
                    const x = center + i;
                    const y = center + j;

                    if (isEraser) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.fillRect(x, y, 1, 1);
                    } else if (this.currentElement === Elements.FIRECRACKER) {
                        // Replicate the engine's checkerboard math for the preview box
                        ctx.fillStyle = ((i + j) % 2 === 0) ? '#FFFFFF' : '#FF3296';
                        ctx.fillRect(x, y, 1, 1);
                    } else {
                        ctx.fillStyle = rgb;
                        ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    }

    // Renders a specific category to the palette
    renderCategory(categoryName) {
        const palette = document.getElementById('element-palette');
        palette.innerHTML = ''; // Clear existing buttons

        const elementsToRender = ElementCategories[categoryName];
        if (!elementsToRender) return;

        elementsToRender.forEach(id => {
            this.createParticleButton(id, palette);
        });

        // Always ensure the currently selected element is highlighted if it exists in the new palette
        const selectedBtn = Array.from(palette.children).find(b => parseInt(b.dataset.id) === this.currentElement);
        if (selectedBtn) {
            selectedBtn.classList.add('selected');
        } else {
            // Optional: Auto-select the first element in the new category if the old one isn't present
            // this.currentElement = elementsToRender[0];
            // palette.children[0].classList.add('selected');
        }
    }

    // Helper to create standard particle buttons
    createParticleButton(id, container) {
        const name = ElementNames[id];
        if (!name) return; // Skip if no UI name defined

        const btn = document.createElement('button');
        btn.className = 'element-btn';
        btn.innerText = name;
        btn.dataset.id = id; // Store ID for highlighting logic

        // Set border color hint
        if (id === Elements.FIRECRACKER) {
            // border-image only renders where border-width > 0
            // Zero out top/left/right so stripe only shows on bottom
            btn.style.borderTop = '0px solid transparent';
            btn.style.borderLeft = '0px solid transparent';
            btn.style.borderRight = '0px solid transparent';
            btn.style.borderBottom = '4px solid transparent';
            btn.style.borderImage = 'repeating-linear-gradient(90deg, #FF3296, #FF3296 4px, #FFFFFF 4px, #FFFFFF 8px) 0 0 1 0';
        } else {
            const c = ElementColors[id];
            if (c !== undefined && c !== 0) {
                const r = c & 0xFF;
                const g = (c >> 8) & 0xFF;
                const b = (c >> 16) & 0xFF;
                btn.style.borderBottom = `4px solid rgb(${r},${g},${b})`;
            } else {
                btn.style.borderBottom = `4px solid #fff`; // Eraser fallback
            }
        }

        if (id === this.currentElement) {
            btn.classList.add('selected');
        }

        btn.onclick = () => {
            // When selecting a new element, update global state and UI selection locally
            document.querySelectorAll('.element-btn.selected').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            this.currentElement = id;
            this.updateBrushPreview();
        };

        container.appendChild(btn);
    }
}
