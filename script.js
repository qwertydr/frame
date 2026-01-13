/**
 * SENIOR ENGINEER NOTES:
 * 1. State Management: We use a 'state' object to track the canvas interactions.
 * 2. Performance: Canvas drawing is handled in a 'draw()' loop triggered only on changes.
 * 3. Accessibility: Form validation ensures data collection before download.
 */

// --- 1. MOCK DATA (Ideally fetched from frames.json) ---
const framesData = [
    {
        id: 1,
        eventName: "Tech Summit 2025",
        details: "Annual Developer Meetup",
        eventBy: "DevCommunity",
        graphicsBy: "John Doe",
        socialLink: "https://twitter.com",
        // Using a placeholder image for demonstration. Replace with your local paths.
        framePath: "https://qwertydr.github.io/frame/frame.png" 
    },
    {
        id: 2,
        eventName: "Alumni Reunion",
        details: "Batch of 2020",
        eventBy: "University Board",
        graphicsBy: "Jane Smith",
        socialLink: "https://linkedin.com",
        framePath: "https://qwertydr.github.io/frame/frame.png"
    },
    {
        id: 3,
        eventName: "Charity Run",
        details: "Run for a cause",
        eventBy: "NGO World",
        graphicsBy: "PixelArt",
        socialLink: "https://instagram.com",
        framePath: "https://qwertydr.github.io/frame/frame.png"
    }
];

// --- 2. STATE MANAGEMENT ---
const state = {
    currentFrame: null,
    userImage: null,
    frameImage: null,
    canvasSize: 1080, // High res for download
    scale: 1,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
};

// --- 3. DOM ELEMENTS ---
const elements = {
    framesGrid: document.getElementById('frames-grid'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    galleryView: document.getElementById('gallery-view'),
    editorView: document.getElementById('editor-view'),
    backBtn: document.getElementById('back-btn'),
    canvas: document.getElementById('main-canvas'),
    uploadInput: document.getElementById('upload-image'),
    adjustmentsGroup: document.getElementById('adjustments-group'),
    scaleSlider: document.getElementById('scale-slider'),
    rotateSlider: document.getElementById('rotate-slider'),
    downloadBtn: document.getElementById('download-btn'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    platformBtns: document.querySelectorAll('.platform-btn'),
    eventTitle: document.getElementById('selected-event-title'),
    eventMeta: document.getElementById('selected-event-meta'),
    graphicsLink: document.getElementById('graphics-link')
};

const ctx = elements.canvas.getContext('2d');

// --- 4. INITIALIZATION & GALLERY ---
function init() {
    renderGallery(framesData);
    setupEventListeners();
    
    // Set internal canvas resolution (High Quality)
    elements.canvas.width = state.canvasSize;
    elements.canvas.height = state.canvasSize;
}

function renderGallery(data) {
    elements.framesGrid.innerHTML = '';
    if(data.length === 0) {
        elements.framesGrid.innerHTML = '<p>No events found.</p>';
        return;
    }

    data.forEach(frame => {
        const card = document.createElement('div');
        card.className = 'frame-card';
        card.innerHTML = `
            <img src="${frame.framePath}" alt="${frame.eventName}">
            <div class="frame-info">
                <h3>${frame.eventName}</h3>
                <p class="meta-text">${frame.eventBy}</p>
            </div>
        `;
        card.onclick = () => openEditor(frame);
        elements.framesGrid.appendChild(card);
    });
}

// --- 5. EDITOR LOGIC ---
function openEditor(frame) {
    state.currentFrame = frame;
    state.frameImage = new Image();
    state.frameImage.crossOrigin = "Anonymous"; // Prevent CORS issues
    state.frameImage.src = frame.framePath;
    
    state.frameImage.onload = () => {
        resetState();
        drawCanvas();
    };

    // Update UI text
    elements.eventTitle.textContent = frame.eventName;
    elements.eventMeta.textContent = `By ${frame.eventBy} | ${frame.details}`;
    elements.graphicsLink.textContent = frame.graphicsBy;
    elements.graphicsLink.href = frame.socialLink;

    // Switch Views
    elements.galleryView.classList.add('hidden');
    elements.editorView.classList.remove('hidden');
}

function resetState() {
    state.userImage = null;
    state.scale = 1;
    state.rotation = 0;
    state.offsetX = 0;
    state.offsetY = 0;
    elements.scaleSlider.value = 1;
    elements.rotateSlider.value = 0;
    elements.adjustmentsGroup.classList.add('disabled');
    elements.uploadInput.value = ""; // Reset file input
    validateForm();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.userImage = new Image();
        state.userImage.onload = () => {
            // Center the image initially
            state.scale = 1;
            state.rotation = 0;
            state.offsetX = 0;
            state.offsetY = 0;
            
            elements.adjustmentsGroup.classList.remove('disabled');
            drawCanvas();
        };
        state.userImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// --- 6. CANVAS DRAWING (The Core) ---
function drawCanvas() {
    // 1. Clear Canvas
    ctx.clearRect(0, 0, state.canvasSize, state.canvasSize);
    
    // 2. Fill White Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, state.canvasSize, state.canvasSize);

    // 3. Draw User Image (with transforms)
    if (state.userImage) {
        ctx.save(); // Save state before transforming
        
        // Translate to center of canvas
        ctx.translate(state.canvasSize / 2 + state.offsetX, state.canvasSize / 2 + state.offsetY);
        
        // Apply Rotate & Scale
        ctx.rotate((state.rotation * Math.PI) / 180);
        ctx.scale(state.scale, state.scale);
        
        // Draw Image (Offset by half its size to center it at the translation point)
        ctx.drawImage(
            state.userImage, 
            -state.userImage.width / 2, 
            -state.userImage.height / 2
        );
        
        ctx.restore(); // Restore state
    }

    // 4. Draw Frame (Top Layer)
    if (state.frameImage) {
        ctx.drawImage(state.frameImage, 0, 0, state.canvasSize, state.canvasSize);
    }
}

// --- 7. INTERACTIONS (Drag, Zoom, Rotate) ---
function setupEventListeners() {
    // Search
    elements.searchBtn.onclick = () => {
        const term = elements.searchInput.value.toLowerCase();
        const filtered = framesData.filter(f => 
            f.eventName.toLowerCase().includes(term) || 
            f.details.toLowerCase().includes(term)
        );
        renderGallery(filtered);
    };

    // Navigation
    elements.backBtn.onclick = () => {
        elements.editorView.classList.add('hidden');
        elements.galleryView.classList.remove('hidden');
    };

    // Upload
    elements.uploadInput.onchange = handleImageUpload;

    // Sliders
    elements.scaleSlider.oninput = (e) => {
        state.scale = parseFloat(e.target.value);
        drawCanvas();
    };
    elements.rotateSlider.oninput = (e) => {
        state.rotation = parseInt(e.target.value);
        drawCanvas();
    };

    // Canvas Dragging (Mouse & Touch)
    const startDrag = (x, y) => {
        if (!state.userImage) return;
        state.isDragging = true;
        state.lastMouseX = x;
        state.lastMouseY = y;
    };

    const doDrag = (x, y) => {
        if (!state.isDragging) return;
        const dx = x - state.lastMouseX;
        const dy = y - state.lastMouseY;
        
        // Adjust sensitivity based on canvas CSS display size vs actual size
        const ratio = state.canvasSize / elements.canvas.clientWidth;
        
        state.offsetX += dx * ratio;
        state.offsetY += dy * ratio;
        state.lastMouseX = x;
        state.lastMouseY = y;
        drawCanvas();
    };

    const stopDrag = () => { state.isDragging = false; };

    // Mouse Events
    elements.canvas.addEventListener('mousedown', e => startDrag(e.offsetX, e.offsetY));
    elements.canvas.addEventListener('mousemove', e => doDrag(e.offsetX, e.offsetY));
    window.addEventListener('mouseup', stopDrag);

    // Touch Events (Mobile)
    elements.canvas.addEventListener('touchstart', e => {
        const rect = elements.canvas.getBoundingClientRect();
        startDrag(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        e.preventDefault(); // Prevent scrolling while dragging
    }, {passive: false});

    elements.canvas.addEventListener('touchmove', e => {
        const rect = elements.canvas.getBoundingClientRect();
        doDrag(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
        e.preventDefault();
    }, {passive: false});

    elements.canvas.addEventListener('touchend', stopDrag);

    // Form Validation
    [elements.userName, elements.userEmail].forEach(input => {
        input.addEventListener('input', validateForm);
    });

    // Platform Selection
    elements.platformBtns.forEach(btn => {
        btn.onclick = () => {
            elements.platformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Logic for specific platform sizing can go here if frames differ
            // For now, we assume 1080x1080 works for all profile pics
        };
    });

    // Download
    elements.downloadBtn.onclick = downloadImage;
}

function validateForm() {
    const hasName = elements.userName.value.trim().length > 0;
    const hasEmail = elements.userEmail.value.trim().length > 0;
    const hasImage = state.userImage !== null;

    if (hasName && hasEmail && hasImage) {
        elements.downloadBtn.classList.remove('disabled');
        elements.downloadBtn.disabled = false;
    } else {
        elements.downloadBtn.classList.add('disabled');
        elements.downloadBtn.disabled = true;
    }
}

function downloadImage() {
    // 1. Create a temporary link
    const link = document.createElement('a');
    
    // 2. Set filename based on user inputs
    const cleanEvent = state.currentFrame.eventName.replace(/\s+/g, '_');
    const cleanUser = elements.userName.value.replace(/\s+/g, '_');
    link.download = `${cleanEvent}_${cleanUser}.png`;
    
    // 3. Convert canvas to Blob URL (better for large images than dataURL)
    elements.canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.click();
        URL.revokeObjectURL(url); // Clean up
    });
}

// Start app
init();
