// --- 1. MOCK DATA ---
// Replace the framePath with actual links relative to eframe.me or external hosts
const framesData = [
    {
        id: 1,
        eventName: "Tech Summit 2025",
        details: "Annual Developer Meetup",
        eventBy: "DevCommunity",
        graphicsBy: "John Doe",
        socialLink: "https://twitter.com",
        framePath: "https://eframe.me/frames/frame.png" 
    },
    {
        id: 2,
        eventName: "Alumni Reunion",
        details: "Batch of 2020",
        eventBy: "University Board",
        graphicsBy: "Jane Smith",
        socialLink: "https://linkedin.com",
        framePath: "https://eframe.me/frames/frame.png"
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
    lastMouseY: 0,
    isValidEmail: false
};

// --- 3. DOM ELEMENTS ---
const elements = {
    framesGrid: document.getElementById('frames-grid'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    galleryView: document.getElementById('gallery-view'),
    editorView: document.getElementById('editor-view'),
    backBtn: document.getElementById('back-btn'),
    shareBtn: document.getElementById('share-btn'),
    canvas: document.getElementById('main-canvas'),
    uploadInput: document.getElementById('upload-image'),
    adjustmentsGroup: document.getElementById('adjustments-group'),
    scaleSlider: document.getElementById('scale-slider'),
    rotateSlider: document.getElementById('rotate-slider'),
    downloadBtn: document.getElementById('download-btn'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    emailError: document.getElementById('email-error'),
    apiStatus: document.getElementById('api-status'),
    platformBtns: document.querySelectorAll('.platform-btn'),
    eventTitle: document.getElementById('selected-event-title'),
    eventMeta: document.getElementById('selected-event-meta'),
    graphicsLink: document.getElementById('graphics-link'),
    
    // Modal Elements
    modal: document.getElementById('submit-modal'),
    openModalBtn: document.getElementById('open-submit-modal'),
    footerModalBtn: document.getElementById('footer-submit-link'),
    closeModalBtn: document.getElementById('close-modal'),
    mailtoLink: document.getElementById('mailto-link')
};

const ctx = elements.canvas.getContext('2d');

// --- 4. INITIALIZATION ---
function init() {
    renderGallery(framesData);
    setupEventListeners();
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
    state.frameImage.crossOrigin = "Anonymous";
    state.frameImage.src = frame.framePath;
    
    state.frameImage.onload = () => {
        resetState();
        drawCanvas();
    };

    elements.eventTitle.textContent = frame.eventName;
    elements.eventMeta.textContent = `By ${frame.eventBy}`;
    elements.graphicsLink.textContent = frame.graphicsBy;
    elements.graphicsLink.href = frame.socialLink;

    elements.galleryView.classList.add('hidden');
    elements.editorView.classList.remove('hidden');
    
    // Clear previous user data
    elements.userName.value = "";
    elements.userEmail.value = "";
    elements.apiStatus.classList.add('hidden');
}

function resetState() {
    state.userImage = null;
    state.scale = 1;
    state.rotation = 0;
    state.offsetX = 0;
    state.offsetY = 0;
    state.isValidEmail = false;
    elements.scaleSlider.value = 1;
    elements.rotateSlider.value = 0;
    elements.adjustmentsGroup.classList.add('disabled');
    elements.uploadInput.value = "";
    checkDownloadEligibility();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.userImage = new Image();
        state.userImage.onload = () => {
            elements.adjustmentsGroup.classList.remove('disabled');
            drawCanvas();
            checkDownloadEligibility();
        };
        state.userImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

// --- 6. CANVAS DRAWING ---
function drawCanvas() {
    ctx.clearRect(0, 0, state.canvasSize, state.canvasSize);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, state.canvasSize, state.canvasSize);

    if (state.userImage) {
        ctx.save();
        ctx.translate(state.canvasSize / 2 + state.offsetX, state.canvasSize / 2 + state.offsetY);
        ctx.rotate((state.rotation * Math.PI) / 180);
        ctx.scale(state.scale, state.scale);
        ctx.drawImage(state.userImage, -state.userImage.width / 2, -state.userImage.height / 2);
        ctx.restore();
    }

    if (state.frameImage) {
        ctx.drawImage(state.frameImage, 0, 0, state.canvasSize, state.canvasSize);
    }
}

// --- 7. EVENT LISTENERS ---
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

    // Share Button
    elements.shareBtn.onclick = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'eFrame.me - Event Frame Generator',
                    text: 'Create your custom event profile picture now!',
                    url: 'https://eframe.me'
                });
            } catch (err) { console.log('Share failed', err); }
        } else {
            // Fallback for desktop browsers
            alert("Share this URL: https://eframe.me");
        }
    };

    // Inputs
    elements.uploadInput.onchange = handleImageUpload;
    elements.scaleSlider.oninput = (e) => { state.scale = parseFloat(e.target.value); drawCanvas(); };
    elements.rotateSlider.oninput = (e) => { state.rotation = parseInt(e.target.value); drawCanvas(); };

    // Canvas Drag
    const handleDrag = (e, isStart, isEnd) => {
        if(isEnd) { state.isDragging = false; return; }
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const rect = elements.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        if(isStart) {
            if(!state.userImage) return;
            state.isDragging = true;
            state.lastMouseX = x;
            state.lastMouseY = y;
        } else if(state.isDragging) {
            e.preventDefault();
            const dx = x - state.lastMouseX;
            const dy = y - state.lastMouseY;
            const ratio = state.canvasSize / elements.canvas.clientWidth;
            state.offsetX += dx * ratio;
            state.offsetY += dy * ratio;
            state.lastMouseX = x;
            state.lastMouseY = y;
            drawCanvas();
        }
    };

    elements.canvas.addEventListener('mousedown', e => handleDrag(e, true));
    elements.canvas.addEventListener('mousemove', e => handleDrag(e, false));
    window.addEventListener('mouseup', e => handleDrag(e, false, true));
    elements.canvas.addEventListener('touchstart', e => handleDrag(e, true), {passive:false});
    elements.canvas.addEventListener('touchmove', e => handleDrag(e, false), {passive:false});
    elements.canvas.addEventListener('touchend', e => handleDrag(e, false, true));

    // Form Logic
    elements.userName.addEventListener('input', checkDownloadEligibility);
    elements.userEmail.addEventListener('input', validateEmail);
    elements.downloadBtn.onclick = handleDownloadClick;

    // Platform Buttons
    elements.platformBtns.forEach(btn => {
        btn.onclick = () => {
            elements.platformBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        };
    });

    // Modal Logic
    const openModal = () => {
        // Construct the mailto link dynamically
        const subject = encodeURIComponent("New Frame Design Submission");
        const body = encodeURIComponent(
            "Hello eFrame Team,\n\nI would like to submit a design.\n\nEvent Name:\nOrganizer:\n\n[Please attach your 1080x1080 PNG here]"
        );
        elements.mailtoLink.href = `mailto:design@eframe.me?subject=${subject}&body=${body}`;
        elements.modal.classList.remove('hidden');
    };
    
    elements.openModalBtn.onclick = openModal;
    elements.footerModalBtn.onclick = openModal;
    elements.closeModalBtn.onclick = () => elements.modal.classList.add('hidden');
    window.onclick = (e) => { if (e.target == elements.modal) elements.modal.classList.add('hidden'); };
}

// --- 8. VALIDATION & DOWNLOAD ---
function validateEmail() {
    const email = elements.userEmail.value;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic Email Regex
    state.isValidEmail = re.test(String(email).toLowerCase());

    if (email.length > 0 && !state.isValidEmail) {
        elements.emailError.classList.remove('hidden');
    } else {
        elements.emailError.classList.add('hidden');
    }
    checkDownloadEligibility();
}

function checkDownloadEligibility() {
    const hasName = elements.userName.value.trim().length > 0;
    const hasImage = state.userImage !== null;

    if (hasName && state.isValidEmail && hasImage) {
        elements.downloadBtn.classList.remove('disabled');
        elements.downloadBtn.disabled = false;
    } else {
        elements.downloadBtn.classList.add('disabled');
        elements.downloadBtn.disabled = true;
    }
}

function handleDownloadClick() {
    // Prevent multiple clicks
    elements.downloadBtn.disabled = true;
    elements.downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    elements.apiStatus.classList.add('hidden');

    const name = elements.userName.value;
    const email = elements.userEmail.value;

    // API Post
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);

    fetch('https://eptonline.org/subscribe.php', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        // We log the response but proceed to download regardless to ensure user gets image
        console.log('API Response:', response);
        startDownload(); 
        elements.apiStatus.textContent = "Thank you! Downloading now...";
        elements.apiStatus.classList.remove('hidden');
    })
    .catch(error => {
        console.error('API Error:', error);
        startDownload(); // Fallback: download anyway
    })
    .finally(() => {
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Image';
    });
}

function startDownload() {
    const timestamp = new Date().getTime();
    // Clean filename
    const cleanEvent = state.currentFrame.eventName.replace(/[^a-z0-9]/gi, '_');
    const cleanUser = elements.userName.value.replace(/[^a-z0-9]/gi, '_');
    const filename = `${cleanEvent}_${cleanUser}_${timestamp}.png`;

    elements.canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    });
}

init();
