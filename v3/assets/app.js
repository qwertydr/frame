(() => {
"use strict";

const ROOT = document.getElementById("app");
const SESSION_KEY = "research_portal_session_v3";
const ROUTE_KEY = "research_portal_route_v3";
const state = { user:null, modules:[], timeline:[] };

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

async function loadJSON(path){
  const r = await fetch(path,{cache:"no-store"});
  if(!r.ok) throw new Error("Could not load "+path);
  return r.json();
}

function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); }
  catch { return null; }
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ROUTE_KEY);
  location.hash = "";
  renderLogin();
}

function renderLogin(message=""){
  ROOT.innerHTML = `
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">Research Bootcamp Portal</div>
      <p class="muted">Sign in with your registered participant account.</p>
      <form id="loginForm">
        <div class="field">
          <label>Email</label>
          <input id="loginEmail" type="email" autocomplete="username" required>
        </div>
        <div class="field">
          <label>Password</label>
          <input id="loginPassword" type="password" autocomplete="current-password" required>
        </div>
        ${message ? `<div class="error">${esc(message)}</div>` : ""}
        <button class="btn" style="width:100%;margin-top:16px">Login</button>
      </form>
      <p class="muted small">Demo: student@example.com / DemoPass123!</p>
    </div>
  </div>`;

  document.getElementById("loginForm").addEventListener("submit", async e=>{
    e.preventDefault();
    const users = await loadJSON("data/users.json");
    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const u = users.find(x => x.email.toLowerCase() === email && x.password === password);
    if(!u){
      renderLogin("Invalid email or password.");
      return;
    }
    state.user = {
      email:u.email,
      name:u.name,
      institution:u.institution,
      languages:Array.isArray(u.languages) ? u.languages : [u.language].filter(Boolean)
    };
    localStorage.setItem(SESSION_KEY,JSON.stringify(state.user));
    location.hash = "";
    renderDashboard();
  });
}

/* ---------- Timeline ---------- */

function remaining(ms){
  if(ms <= 0) return "Deadline passed";
  let total = Math.floor(ms/1000);
  const d = Math.floor(total/86400);
  total %= 86400;
  const h = Math.floor(total/3600);
  total %= 3600;
  const m = Math.floor(total/60);
  const s = total % 60;
  return `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
}

function countdownText(date){
  return remaining(new Date(date).getTime() - Date.now());
}

function updateCountdowns(){
  document.querySelectorAll("[data-deadline]").forEach(el=>{
    el.textContent = countdownText(el.dataset.deadline);
  });
}

function timelineSidebarHTML(){
  if(!state.timeline.length) return `<div class="muted small">No timeline items.</div>`;
  return state.timeline.map(x=>`
    <div class="timeline-item">
      <h4>${esc(x.title)}</h4>
      <div class="countdown" data-deadline="${esc(x.date)}">${countdownText(x.date)}</div>
      <div class="timeline-actions">
        <a class="side-link" target="_blank" rel="noopener noreferrer" href="${esc(x.submitUrl)}">Submit</a>
        <a class="side-link" target="_blank" rel="noopener noreferrer" href="${esc(x.rulesUrl)}">Rules</a>
      </div>
    </div>
  `).join("");
}

function timelineMainHTML(){
  if(!state.timeline.length) return "";
  return `
  <section class="timeline-main">
    <h2>Assignment Timeline</h2>
    <p class="muted">Countdown is calculated against the site's fixed EST clock (UTC−05:00).</p>
    <div class="deadline-grid">
      ${state.timeline.map(x=>`
        <article class="deadline-row">
          <h3>${esc(x.title)}</h3>
          <div class="deadline-time" data-deadline="${esc(x.date)}">${countdownText(x.date)}</div>
          <div class="deadline-meta">Deadline: ${esc(x.date.replace("T"," ").replace("-05:00"," EST"))}</div>
          <p class="muted">${esc(x.description)}</p>
          <div class="actions">
            <a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(x.submitUrl)}">${esc(x.submitLabel)}</a>
            <a class="btn secondary" target="_blank" rel="noopener noreferrer" href="${esc(x.rulesUrl)}">${esc(x.rulesLabel)}</a>
          </div>
        </article>
      `).join("")}
    </div>
  </section>`;
}

function shell(content){
  ROOT.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="brand">Research Portal</div>
      <div style="color:#d0d5dd">${esc(state.user.name)}</div>
      <div class="side-title">Assignment Timeline</div>
      <div class="timeline">${timelineSidebarHTML()}</div>
      <div style="margin-top:20px">
        <button class="btn danger" id="logoutBtn">Logout</button>
      </div>
    </aside>
    <main class="main">${content}</main>
  </div>`;
  document.getElementById("logoutBtn").onclick = logout;
  updateCountdowns();
}

/* ---------- Dashboard ---------- */

function renderDashboard(){
  shell(`
    <div class="topbar">
      <div>
        <div class="muted">Participant dashboard</div>
        <h2>Welcome, ${esc(state.user.name)}!</h2>
      </div>
    </div>

    <section class="hero">
      <h1>Welcome to the Academic Research Bootcamp</h1>
      <p class="muted">
        This portal contains your bootcamp curriculum, research lessons,
        assignments, and submission information.
      </p>
      <p>
        <b>Institution:</b> ${esc(state.user.institution)}<br>
        <b>Available languages:</b>
        ${state.user.languages.map(x=>`<span>${esc(x.toUpperCase())}</span>`).join(", ")}
      </p>
      <button class="btn" id="nextBtn">Next →</button>
    </section>

    <section class="info-card" style="margin-top:18px">
      <h2>Bootcamp Curriculum</h2>
      <p class="muted">Your curriculum is available in every language assigned to your account.</p>
    </section>

    ${timelineMainHTML()}
  `);

  document.getElementById("nextBtn").onclick = renderModules;
}

/* ---------- Modules ---------- */

function renderModules(){
  const groups = state.user.languages
    .map(lang => ({
      lang,
      items:state.modules.filter(m=>m.language === lang)
    }))
    .filter(g=>g.items.length);

  shell(`
    <div class="topbar">
      <div>
        <div class="muted">Curriculum</div>
        <h2>Bootcamp Curriculum</h2>
      </div>
      <button class="btn secondary" id="homeBtn">Dashboard</button>
    </div>

    ${groups.map(g=>`
      <section>
        <h3 class="language-heading">
          ${esc(g.items[0].languageName)} (${esc(g.lang.toUpperCase())})
        </h3>
        <div class="module-list">
          ${g.items.map(m=>`
            <article class="module-card">
              <div class="module-head">
                <h3>${m.id}. ${esc(m.title)}</h3>
                <span>＋</span>
              </div>
              <div class="module-body">
                <p class="muted">${esc(m.description)}</p>
                <b>Topics Covered:</b>
                <ul class="topic-list">
                  ${m.topics.map(t=>`<li>${esc(t)}</li>`).join("")}
                </ul>
                <button class="btn watch" data-id="${m.id}" data-lang="${esc(m.language)}">
                  Open lesson
                </button>
              </div>
            </article>
          `).join("")}
        </div>
      </section>
    `).join("")}

    ${timelineMainHTML()}
  `);

  document.getElementById("homeBtn").onclick = renderDashboard;

  document.querySelectorAll(".module-head").forEach(el=>{
    el.onclick = ()=>el.parentElement.classList.toggle("open");
  });

  document.querySelectorAll(".watch").forEach(el=>{
    el.onclick = ()=>openVideo(el.dataset.id,el.dataset.lang);
  });
}

/* ---------- Temporary route ---------- */

function openVideo(id,language){
  const t = (crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)+Date.now()
  ).replaceAll("-","");

  sessionStorage.setItem(ROUTE_KEY,JSON.stringify({
    t,moduleId:id,language,created:Date.now()
  }));

  location.hash = "video/"+t;
}

function validRoute(t,id,language){
  try{
    const x = JSON.parse(sessionStorage.getItem(ROUTE_KEY)||"null");
    return x &&
      x.t === t &&
      String(x.moduleId) === String(id) &&
      x.language === language &&
      state.user.languages.includes(language) &&
      Date.now()-x.created < 30*60*1000;
  }catch{
    return false;
  }
}

/* ---------- Vimeo custom presentation ---------- */

/*
  This is intentionally an overlay/custom-control approach.

  IMPORTANT:
  A static browser application cannot make an iframe/network request
  invisible to the person controlling the browser. It can hide the
  Vimeo UI visually, but it cannot make the Vimeo URL uninspectable.
*/

function loadVimeoSDK(){
  return new Promise((resolve,reject)=>{
    if(window.Vimeo && window.Vimeo.Player) return resolve();
    const existing=document.querySelector('script[data-vimeo-sdk]');
    if(existing){
      existing.addEventListener("load",resolve,{once:true});
      existing.addEventListener("error",reject,{once:true});
      return;
    }
    const s=document.createElement("script");
    s.src="https://player.vimeo.com/api/player.js";
    s.async=true;
    s.dataset.vimeoSdk="1";
    s.onload=resolve;
    s.onerror=reject;
    document.head.appendChild(s);
  });
}

async function renderVideo(id,language,t){
  if(!validRoute(t,id,language)) return notFound();

  const m = state.modules.find(x=>
    String(x.id)===String(id) && x.language===language
  );
  if(!m) return notFound();

  shell(`
    <div class="topbar">
      <h2>${esc(m.title)}</h2>
      <button class="btn secondary" id="backBtn">← Curriculum</button>
    </div>

    <section class="hero video-card">
      <div style="padding:26px 26px 0">
        <p class="muted">${esc(m.description)}</p>
      </div>

      <div class="player" id="customPlayer">
        <iframe
          id="vimeoFrame"
          src="https://player.vimeo.com/video/${encodeURIComponent(m.videoId)}?dnt=1&controls=0&title=0&byline=0&portrait=0&badge=0&pip=0&keyboard=0&transparent=0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          tabindex="-1">
        </iframe>

        <div class="player-shield" id="playerShield"></div>

        <img
          class="player-brand"
          src="assets/hat-svgrepo-com.svg"
          alt=""
          draggable="false">

        <div class="player-status" id="playerStatus">Ready</div>

        <div class="player-cover" id="playerCover">
          <button class="play-big" id="playBig" aria-label="Play">▶</button>
        </div>

        <div class="player-toolbar">
          <button id="playPause" aria-label="Play or pause">▶</button>
          <button id="muteBtn" aria-label="Mute">🔊</button>
          <button id="fullBtn" aria-label="Fullscreen">⛶</button>
          <span class="label">Academic Research Bootcamp</span>
        </div>
      </div>

      <div style="padding:12px 26px 26px">
        <p class="small muted">
          Protected course presentation. Vimeo controls are disabled in the
          embedded player and replaced with the portal's own controls.
        </p>
      </div>
    </section>
  `);

  document.getElementById("backBtn").onclick = renderModules;

  try{
    await loadVimeoSDK();

    const iframe=document.getElementById("vimeoFrame");
    const player=new Vimeo.Player(iframe,{
      controls:false,
      title:false,
      byline:false,
      portrait:false,
      keyboard:false,
      pip:false
    });

    const playPause=document.getElementById("playPause");
    const playBig=document.getElementById("playBig");
    const muteBtn=document.getElementById("muteBtn");
    const fullBtn=document.getElementById("fullBtn");
    const cover=document.getElementById("playerCover");
    const status=document.getElementById("playerStatus");

    const setStatus=t=>status.textContent=t;

    async function togglePlay(){
      try{
        const paused=await player.getPaused();
        if(paused){
          await player.play();
          playPause.textContent="❚❚";
          cover.classList.add("hidden");
          setStatus("Playing");
        }else{
          await player.pause();
          playPause.textContent="▶";
          cover.classList.remove("hidden");
          setStatus("Paused");
        }
      }catch(e){
        setStatus("Playback unavailable");
      }
    }

    playPause.onclick=togglePlay;
    playBig.onclick=togglePlay;

    muteBtn.onclick=async()=>{
      try{
        const muted=await player.getMuted();
        await player.setMuted(!muted);
        muteBtn.textContent=muted?"🔊":"🔇";
      }catch{}
    };

    fullBtn.onclick=async()=>{
      try{
        await player.requestFullscreen();
      }catch{
        document.getElementById("customPlayer").requestFullscreen?.();
      }
    };

    player.on("play",()=>{
      playPause.textContent="❚❚";
      cover.classList.add("hidden");
      setStatus("Playing");
    });

    player.on("pause",()=>{
      playPause.textContent="▶";
      cover.classList.remove("hidden");
      setStatus("Paused");
    });

    player.on("ended",()=>{
      playPause.textContent="▶";
      cover.classList.remove("hidden");
      setStatus("Completed");
    });

    player.on("error",()=>setStatus("Video error"));

    setStatus("Ready");
  }catch{
    document.getElementById("playerStatus").textContent="Player unavailable";
  }
}

/* ---------- 404 ---------- */

function notFound(){
  ROOT.innerHTML=`
    <div class="error-page">
      <main>
        <div class="error-code">404</div>
        <h1>Invalid or expired lesson link</h1>
        <p class="muted">The requested lesson route is not valid in this session.</p>
        <a class="btn" href="${location.pathname}">Return to Portal</a>
      </main>
    </div>`;
}

/* ---------- Boot ---------- */

async function boot(){
  state.user=getSession();

  if(!state.user){
    renderLogin();
    return;
  }

  try{
    [state.timeline,state.modules]=await Promise.all([
      loadJSON("data/timeline.json"),
      loadJSON("data/modules.json")
    ]);

    const match=location.hash.match(/^#video\/([^/]+)$/);

    if(match){
      let route=null;
      try{ route=JSON.parse(sessionStorage.getItem(ROUTE_KEY)||"null"); }catch{}
      if(route && route.t===match[1]){
        await renderVideo(route.moduleId,route.language,match[1]);
      }else{
        notFound();
      }
    }else{
      renderDashboard();
    }

    updateCountdowns();
  }catch(e){
    ROOT.innerHTML=`
      <div class="error-page">
        <main>
          <h1>Portal configuration error</h1>
          <p>${esc(e.message)}</p>
        </main>
      </div>`;
  }
}

/*
  These are deterrents only. They cannot stop a technically capable
  browser user from opening DevTools through browser menus.
*/
document.addEventListener("contextmenu", e => {
  e.preventDefault();
}, true);

document.addEventListener("dragstart", e => {
  e.preventDefault();
}, true);

document.addEventListener("selectstart", e => {
  const target = e.target;

  if (
    target instanceof Element &&
    target.closest(".player")
  ) {
    e.preventDefault();
  }
}, true);

document.addEventListener("keydown", e => {
  const key = String(e.key || "").toUpperCase();

  const blocked =
    e.key === "F12" ||
    (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(key)) ||
    (e.ctrlKey && key === "U");

  if (blocked) {
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

window.addEventListener("hashchange",boot);
setInterval(updateCountdowns,1000);
boot();

})();
