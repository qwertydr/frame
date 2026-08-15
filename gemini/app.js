// ==========================================
// 1. Security Measures (Prevent Inspect & Right Click)
// ==========================================
document.addEventListener('contextmenu', event => event.preventDefault()); // Disable Right Click
document.addEventListener('keydown', (e) => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    if (e.key === 'F12' || 
       (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
       (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
    }
});

// ==========================================
// 2. Data (Curriculum & Timeline)
// ==========================================
const assignments = [
    { title: "Proposal Submission", date: "2026-09-30T23:59:00-05:00", link: "#", desc: "Max 2 pages (excluding cover). Submission link will be emailed Sept 05." },
    { title: "Video Pitch Submission", date: "2026-10-15T23:59:00-05:00", link: "#", desc: "Top 100 Finalists. 2.5-5 minute video presentation." }
];

const modules = [
    { id: 1, lang: "en", vimeoId: "76979871", title: "1. Your First Step Into Academic Research", desc: "This foundational lesson introduces you to the world of academic research.", topics: ["Understanding academic research standards", "Selecting a research topic", "Developing research questions", "Ethical considerations in research", "Introduction to literature review"] },
    { id: 2, lang: "en", vimeoId: "76979871", title: "2. Research Methodology", desc: "Learn about different research methodologies and how to select the most appropriate approach.", topics: ["Quantitative vs. qualitative research", "Experimental design", "Data collection methods", "Sampling techniques", "Ensuring validity and reliability"] },
    { id: 3, lang: "en", vimeoId: "76979871", title: "3. Research Proposal", desc: "Master the art of writing a compelling research proposal.", topics: ["Structure of a research proposal", "Writing clear objectives", "Literature review techniques", "Methodology section", "Expected outcomes and impact"] },
    { id: 4, lang: "en", vimeoId: "76979871", title: "4. Practice Research Proposal", desc: "Apply what you've learned by analyzing real research proposal examples.", topics: ["Analyzing successful proposals", "Common mistakes to avoid", "Formatting and submission guidelines", "Peer review process", "Final checklist before submission"] }
];

// ==========================================
// 3. Application Logic
// ==========================================
const app = document.getElementById('app');
let currentUser = JSON.parse(localStorage.getItem('userSession'));

function init() {
    if (!currentUser) renderLogin();
    else renderDashboard();
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('users.json');
        const users = await response.json();
        
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem('userSession', JSON.stringify(user));
            currentUser = user;
            renderDashboard();
        } else {
            alert('Invalid email or password!');
        }
    } catch (error) {
        alert('Error fetching user data. Ensure you are running on a local server.');
    }
}

function logout() {
    localStorage.removeItem('userSession');
    currentUser = null;
    history.pushState(null, '', '/'); // Reset URL
    init();
}

// ==========================================
// 4. UI Render Functions
// ==========================================
function renderLogin() {
    app.innerHTML = `
        <div class="login-container">
            <div class="login-box">
                <h2>Portal Login</h2>
                <form id="loginForm">
                    <input type="email" id="email" placeholder="Email" required>
                    <input type="password" id="password" placeholder="Password" required>
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    `;
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

function renderDashboard(showModules = false) {
    let sidebarHTML = `<div class="sidebar"><h3>Assignments Timeline</h3><div id="timeline-container"></div></div>`;
    
    let mainContent = `
        <div class="welcome-card" id="welcome-section" style="display: ${showModules ? 'none' : 'block'}">
            <h2>Welcome back, ${currentUser.name}!</h2>
            <p>Institution: ${currentUser.institution}</p><br>
            <p>Welcome to the Academic Research Bootcamp. This program is designed to guide you through the fundamentals of research methodology, proposal writing, and academic presentation.</p>
            <button class="next-btn" onclick="startCourse()">Next: Go to Modules</button>
        </div>
        
        <div id="course-section" style="display: ${showModules ? 'block' : 'none'}">
            <div id="video-player-container"></div>
            <div id="modules-container"></div>
        </div>
    `;

    app.innerHTML = `
        <div class="dashboard">
            <header>
                <h3>Dynamic Course Portal</h3>
                <button onclick="logout()">Logout</button>
            </header>
            <div class="main-layout">
                <div class="content-area">${mainContent}</div>
                ${sidebarHTML}
            </div>
        </div>
    `;

    renderTimeline();
    if (showModules) renderModules();
}

function renderTimeline() {
    const container = document.getElementById('timeline-container');
    container.innerHTML = assignments.map((task, index) => `
        <div class="timeline-item">
            <h4>${task.title}</h4>
            <p style="font-size: 13px; color: #555; margin: 5px 0;">${task.desc}</p>
            <div class="timer" id="timer-${index}">Calculating...</div>
            <a href="${task.link}" style="display:block; margin-top:5px; font-size: 14px;">Submit Here</a>
        </div>
    `).join('');

    setInterval(updateTimers, 1000);
}

function updateTimers() {
    assignments.forEach((task, index) => {
        const target = new Date(task.date).getTime();
        const now = new Date().getTime();
        const diff = target - now;

        const el = document.getElementById(`timer-${index}`);
        if (!el) return;

        if (diff < 0) {
            el.innerText = "Deadline Passed";
            el.style.color = "gray";
            return;
        }

        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        el.innerText = `Time left: ${d}d ${h}h ${m}m`;
    });
}

function startCourse() {
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('course-section').style.display = 'block';
    renderModules();
}

function renderModules() {
    const container = document.getElementById('modules-container');
    
    // Filter modules based on user's language profile
    const userModules = modules.filter(m => currentUser.languages.includes(m.lang));
    
    container.innerHTML = `<h2>Bootcamp Curriculum</h2><br>` + userModules.map(m => `
        <div class="accordion">
            <div class="accordion-header" onclick="toggleAccordion(${m.id})">
                <span>${m.title}</span>
                <span>▼</span>
            </div>
            <div class="accordion-content" id="acc-${m.id}">
                <p>${m.desc}</p>
                <strong>Topics Covered:</strong>
                <ul>${m.topics.map(t => `<li>${t}</li>`).join('')}</ul>
                <button class="play-btn" onclick="playVideo('${m.vimeoId}')">Play Video</button>
            </div>
        </div>
    `).join('');
}

function toggleAccordion(id) {
    const content = document.getElementById(`acc-${id}`);
    content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

function playVideo(vimeoId) {
    // 1. Load Custom Vimeo iframe (controls=0 hides standard controls, keeping it clean)
    const playerContainer = document.getElementById('video-player-container');
    playerContainer.innerHTML = `
        <div class="video-container">
            <iframe src="https://player.vimeo.com/video/${vimeoId}?controls=1&autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>
        </div>
    `;

    // 2. URL Obfuscation: Create a random URL path in the address bar
    const randomPath = Math.random().toString(36).substring(2, 15);
    history.pushState({ video: vimeoId }, '', `/watch/${randomPath}`);
    
    // Scroll to top to see video
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle URL manipulation 404 effect
// If user refreshes on the fake URL, the browser will look for that folder and throw a natural 404 (since it's a static site without routing).
window.addEventListener('popstate', (event) => {
    // Handle back button behavior
    if (!event.state) {
        document.getElementById('video-player-container').innerHTML = '';
    }
});

// Start App
init();