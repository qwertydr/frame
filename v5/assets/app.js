(() => {
"use strict";

const ROOT=document.getElementById("app");
const SESSION_KEY="iarco_portal_session_v5";
const ROUTE_KEY="iarco_portal_route_v5";
const state={user:null,users:[],modules:[],timeline:[],config:null,loaded:false};

function esc(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}

async function loadJSON(path){
  const response=await fetch(path,{cache:"no-store"});
  if(!response.ok) throw new Error("Could not load "+path);
  return response.json();
}

async function prefetchPortalData(){
  if(state.loaded) return;
  const [users,timeline,modules,config]=await Promise.all([loadJSON("data/users.json"),loadJSON("data/timeline.json"),loadJSON("data/modules.json"),loadJSON("data/config.json")]);
  state.users=users;
  state.timeline=timeline;
  state.modules=modules;
  state.config=config||{};
  state.loaded=true;
}

function showLoader(message="Loading your portal…"){
  ROOT.innerHTML=`<div class="portal-loader" role="status" aria-live="polite">
    <div class="loader-card">
      <div class="loader-logo">IARCO 2026</div>
      <div class="spinner"></div>
      <h2>${esc(message)}</h2>
      <p class="muted">Preparing your curriculum, timeline and course resources.</p>
    </div>
  </div>`;
}

function getSession(){
  try{return JSON.parse(localStorage.getItem(SESSION_KEY)||"null");}catch{return null;}
}

function logout(){
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(ROUTE_KEY);
  state.user=null;
  location.hash="";
  renderLogin();
}


function cfg(){return state.config||{year:"2026",brand:"IARCO 2026",sponsors:[],notice:"",faqUrl:"#",supportEmail:"iarco2026@yrjmail.com"};}
function sponsorHTML(){const a=(cfg().sponsors||[]).filter(x=>x&&x.name);const l=a.map(x=>`<a class="sponsor-link" href="${esc(x.url||"#")}" target="_blank" rel="noopener noreferrer">${esc(x.name)}</a>`);return l.length===0?"":l.length===1?l[0]:l.slice(0,-1).join(", ")+" &amp; "+l[l.length-1];}
function formatDeadline(v){const d=new Date(v);if(isNaN(d))return v;const ms=["January","February","March","April","May","June","July","August","September","October","November","December"];let h=d.getUTCHours(),ap=h>=12?"PM":"AM";h=h%12||12;return `${ms[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${h}:${String(d.getUTCMinutes()).padStart(2,"0")} ${ap} (EST)`;}
function submissionModal(item){const m=document.createElement("div");m.className="modal-backdrop";m.innerHTML=`<div class="modal-card"><button class="modal-close" id="mx">×</button><h2>${esc(item.title)} — Submission Instructions</h2><p class="muted">Please review these requirements before continuing.</p><ul class="modal-rules">${(item.rules||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul><label class="confirm-row"><input type="checkbox" id="rc"> I have reviewed the instructions.</label><div class="modal-actions"><button class="btn secondary" id="mc">Cancel</button><button class="btn" id="mf" disabled>Continue to Submission</button></div></div>`;document.body.appendChild(m);const close=()=>m.remove();m.querySelector('#mx').onclick=close;m.querySelector('#mc').onclick=close;const c=m.querySelector('#rc'),f=m.querySelector('#mf');c.onchange=()=>f.disabled=!c.checked;f.onclick=()=>{window.open(item.submitUrl,'_blank','noopener,noreferrer');close()};m.onclick=e=>{if(e.target===m)close()};}
function noticeHTML(){const n=String(cfg().notice||'').trim();return !n||sessionStorage.getItem('notice_closed_v6')?'':`<div class="site-notice" id="siteNotice"><span>${esc(n)}</span><button id="closeNotice">×</button></div>`;}
function watermarkPath(){
  const p=String(state.config?.watermarkLogo||"").trim();
  return p || "assets/logo-watermark.svg";
}

function renderLogin(message=""){
  ROOT.innerHTML=`<div class="login-wrap"><div class="login-card">
    <div class="brand">IARCO 2026</div>
    <p class="muted">Academic Research Bootcamp Portal</p>
    <form id="loginForm">
      <div class="field"><label>Email</label><input id="loginEmail" type="email" autocomplete="username" required></div>
      <div class="field"><label>Password</label><input id="loginPassword" type="password" autocomplete="current-password" required></div>
      ${message?`<div class="error">${esc(message)}</div>`:""}
      <button class="btn" id="loginButton" style="width:100%;margin-top:16px">Login</button>
    </form>
    <p class="muted small">IARCO 2026 Sponsored by <a class="sponsor-link" href="https://www.savemyexams.com/" target="_blank" rel="noopener noreferrer">SaveMyExams</a> &amp; <a class="sponsor-link" href="https://domain.me/" target="_blank" rel="noopener noreferrer">Domain.Me</a></p>
  </div></div>`;

  document.getElementById("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const button=document.getElementById("loginButton");
    const email=document.getElementById("loginEmail").value.trim().toLowerCase();
    const password=document.getElementById("loginPassword").value;
    button.disabled=true;
    button.innerHTML='<span class="button-spinner"></span> Loading…';

    try{
      await prefetchPortalData();
      const user=state.users.find(u=>String(u.email).toLowerCase()===email&&u.password===password);
      if(!user){renderLogin("Invalid email or password.");return;}

      state.user={
        email:user.email,
        name:user.name,
        institution:user.institution,
        languages:Array.isArray(user.languages)?user.languages:[user.language].filter(Boolean)
      };
      localStorage.setItem(SESSION_KEY,JSON.stringify(state.user));
      sessionStorage.removeItem(ROUTE_KEY);
      location.hash="";
      showLoader("Preparing your dashboard…");
      setTimeout(()=>{renderDashboard();showQuickIntroIfNeeded();},350);
    }catch(error){
      console.error(error);
      renderLogin("Unable to load portal data. Please try again.");
    }
  });
}

function countdownText(date){
  let ms=new Date(date).getTime()-Date.now();
  if(ms<=0)return"Deadline passed";
  let s=Math.floor(ms/1000);
  const d=Math.floor(s/86400);s%=86400;
  const h=Math.floor(s/3600);s%=3600;
  const m=Math.floor(s/60);s%=60;
  return `${d}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`;
}

function updateCountdowns(){
  document.querySelectorAll("[data-deadline]").forEach(el=>el.textContent=countdownText(el.dataset.deadline));
}

function timelineSidebarHTML(){return state.timeline.length?state.timeline.map((x,i)=>`<div class="timeline-item"><h4>${esc(x.title)}</h4><div class="deadline-label">Deadline: ${esc(formatDeadline(x.date))}</div><div class="countdown" data-deadline="${esc(x.date)}">${countdownText(x.date)}</div><div class="timeline-actions"><button class="side-submit" data-timeline="${i}">${esc(x.submitLabel||"Submit")}</button><a class="side-link" target="_blank" rel="noopener noreferrer" href="${esc(x.rulesUrl||'#')}">${esc(x.rulesLabel||"Rules")}</a></div></div>`).join(''):'<div class="muted small">No timeline items.</div>';}
function timelineMainHTML(){
  return state.timeline.length?`<section class="timeline-main"><h2>Assignment Timeline</h2>
    <p class="muted">Countdown uses fixed EST (UTC−05:00).</p>
    <div class="deadline-grid">${state.timeline.map(x=>`<article class="deadline-row">
      <h3>${esc(x.title)}</h3>
      <div class="deadline-time" data-deadline="${esc(x.date)}">${countdownText(x.date)}</div>
      <div class="deadline-meta">Deadline: ${esc(formatDeadline(x.date))}</div>
      <p class="muted">${esc(x.description)}</p>
      <div class="actions"><button class="btn main-submit" data-timeline="${state.timeline.indexOf(x)}">${esc(x.submitLabel||"Submit")}</button>
      <a class="btn secondary" target="_blank" rel="noopener noreferrer" href="${esc(x.rulesUrl)}">${esc(x.rulesLabel)}</a></div>
    </article>`).join("")}</div>
  </section>`:"";
}

function shell(content){
  ROOT.innerHTML=`${noticeHTML()}<div class="shell"><aside class="sidebar">
    <div class="brand">IARCO 2026</div>
    <div style="color:#d0d5dd">${esc(state.user.name)}</div>
    <div class="side-title">Assignment Timeline</div>
    <div class="timeline">${timelineSidebarHTML()}</div>
    <div class="support-box"><b>Need help?</b><p class="small">If you have any question first visit our <a class="side-link" href="${esc(cfg().faqUrl||"#")}" target="_blank" rel="noopener noreferrer">FAQ</a> section then email <a class="side-link" href="mailto:${esc(cfg().supportEmail)}">${esc(cfg().supportEmail)}</a>.</p></div><div style="margin-top:20px"><button class="btn danger" id="logoutBtn">Logout</button></div>
  </aside><main class="main">${content}</main></div>`;
  document.getElementById("logoutBtn").onclick=logout; document.getElementById("closeNotice")?.addEventListener("click",()=>{sessionStorage.setItem("notice_closed_v6","1");document.getElementById("siteNotice")?.remove();}); document.querySelectorAll(".side-submit,.main-submit").forEach(b=>b.onclick=()=>submissionModal(state.timeline[+b.dataset.timeline]));
  updateCountdowns();
}

function showQuickIntroIfNeeded(){
  const key=`iarco_intro_seen_v5_${state.user.email}`;
  if(localStorage.getItem(key)==="1")return;
  const overlay=document.createElement("div");
  overlay.className="intro-overlay";
  overlay.innerHTML=`<div class="intro-card">
    <div class="intro-progress"><span id="introStepLabel">1 / 3</span></div>
    <div class="intro-step active" data-step="1"><div class="intro-icon">👋</div><h2>Welcome to IARCO 2026</h2><p class="muted">This quick guide explains your bootcamp portal.</p></div>
    <div class="intro-step" data-step="2"><div class="intro-icon">📚</div><h2>Use Next to continue</h2><p class="muted">Click Next on your dashboard to open your assigned modules and languages.</p></div>
    <div class="intro-step" data-step="3"><div class="intro-icon">⏱️</div><h2>Watch your timeline</h2><p class="muted">The sidebar and dashboard contain live assignment countdowns, Submit links and Rules.</p></div>
    <div class="intro-actions"><button class="btn secondary" id="introSkip">Skip</button><button class="btn" id="introNext">Next</button></div>
  </div>`;
  document.body.appendChild(overlay);
  let step=1;
  const render=()=>{
    overlay.querySelectorAll(".intro-step").forEach(x=>x.classList.toggle("active",Number(x.dataset.step)===step));
    overlay.querySelector("#introStepLabel").textContent=`${step} / 3`;
    overlay.querySelector("#introNext").textContent=step===3?"Get Started":"Next";
  };
  const close=()=>{localStorage.setItem(key,"1");overlay.remove();};
  overlay.querySelector("#introSkip").onclick=close;
  overlay.querySelector("#introNext").onclick=()=>{if(step===3)close();else{step++;render();}};
}

function renderDashboard(){
  shell(`<div class="topbar"><div><div class="muted">Participant dashboard</div><h2>Welcome, ${esc(state.user.name)}!</h2></div></div>
  <section class="hero"><h1>Welcome to the IARCO 2026 Academic Research Bootcamp</h1>
    <p class="sponsor-line">IARCO 2026 Sponsored by <a href="https://www.savemyexams.com/" target="_blank" rel="noopener noreferrer">SaveMyExams</a> &amp; <a href="https://domain.me/" target="_blank" rel="noopener noreferrer">Domain.Me</a></p>
    <p class="muted">This portal contains your bootcamp curriculum, research lessons, assignments, and submission information.</p>
    <p><b>Institution:</b> ${esc(state.user.institution)}<br><b>Available languages:</b> ${state.user.languages.map(x=>esc(x.toUpperCase())).join(", ")}</p>
    <button class="btn" id="nextBtn">Next →</button>
  </section>
  <section class="info-card" style="margin-top:18px"><h2>Bootcamp Curriculum</h2><p class="muted">Your assigned curriculum appears in every language assigned to your account.</p></section>
  ${timelineMainHTML()}`);
  document.getElementById("nextBtn").onclick=renderModules;
}

function renderModules(){
  const groups=state.user.languages.map(lang=>({lang,items:state.modules.filter(m=>m.language===lang)})).filter(g=>g.items.length);
  shell(`<div class="topbar"><div><div class="muted">Curriculum</div><h2>Bootcamp Curriculum</h2></div><button class="btn secondary" id="homeBtn">Dashboard</button></div>
  ${groups.map(g=>`<section><h3 class="language-heading">${esc(g.items[0].languageName)} (${esc(g.lang.toUpperCase())})</h3><div class="module-list">
  ${g.items.map(m=>`<article class="module-card"><div class="module-head"><h3>${m.id}. ${esc(m.title)}</h3><span>＋</span></div><div class="module-body"><p class="muted">${esc(m.description)}</p><b>Topics Covered:</b><ul class="topic-list">${m.topics.map(t=>`<li>${esc(t)}</li>`).join("")}</ul><div class="lecture-list">${(m.lectures&&m.lectures.length?m.lectures:[{title:m.title,videoId:m.videoId,resource:m.resource||""}]).map((l,i)=>`<div class="lecture-row"><b>${i+1}. ${esc(l.title||m.title)}</b><span><button class="btn watch" data-id="${m.id}" data-lang="${esc(m.language)}" data-lecture="${i}">Open Lesson</button>${l.resource ? ` <a class="btn secondary" target="_blank" rel="noopener noreferrer" href="${esc(l.resource)}">Resources</a>` : ""}</span></div>`).join()}</div></div></article>`).join("")}</div></section>`).join("")}
  ${timelineMainHTML()}`);
  document.getElementById("homeBtn").onclick=renderDashboard;
  document.querySelectorAll(".module-head").forEach(el=>el.onclick=()=>el.parentElement.classList.toggle("open"));
  document.querySelectorAll(".watch").forEach(el=>el.onclick=()=>openVideo(el.dataset.id,el.dataset.lang,+el.dataset.lecture||0));
}

function openVideo(id,language,lectureIndex=0){
  const token=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now()).replaceAll("-","");
  sessionStorage.setItem(ROUTE_KEY,JSON.stringify({token,moduleId:id,language,lectureIndex,created:Date.now()}));
  location.hash="video/"+token;
}

function validRoute(token,id,language){
  try{
    const r=JSON.parse(sessionStorage.getItem(ROUTE_KEY)||"null");
    return r&&r.token===token&&String(r.moduleId)===String(id)&&r.language===language&&state.user.languages.includes(language)&&Date.now()-r.created<1800000;
  }catch{return false;}
}

function loadVimeoSDK(){
  return new Promise((resolve,reject)=>{
    if(window.Vimeo?.Player)return resolve();
    const s=document.createElement("script");
    s.src="https://player.vimeo.com/api/player.js";
    s.async=true;s.onload=resolve;s.onerror=reject;
    document.head.appendChild(s);
  });
}

async function renderVideo(id,language,token){
  if(!validRoute(token,id,language))return notFound();
  const m=state.modules.find(x=>String(x.id)===String(id)&&x.language===language);
  if(!m)return notFound(); const route=JSON.parse(sessionStorage.getItem(ROUTE_KEY)||"{}"); const lectures=m.lectures&&m.lectures.length?m.lectures:[{title:m.title,videoId:m.videoId}]; const li=Math.max(0,Math.min(+route.lectureIndex||0,lectures.length-1)); const lecture=lectures[li];

  shell(`<div class="topbar"><h2>${esc(lecture.title||m.title)}</h2><button class="btn secondary" id="backBtn">← Curriculum</button></div>
  <section class="hero video-card"><div style="padding:26px 26px 0"><p class="muted">${esc(m.description)}</p></div>
  <div class="player" id="customPlayer">
    <iframe id="vimeoFrame" src="https://player.vimeo.com/video/${encodeURIComponent(lecture.videoId||m.videoId)}?dnt=1&controls=0&title=0&byline=0&portrait=0&badge=0&pip=0&keyboard=0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen tabindex="-1"></iframe>
    <div class="player-shield"></div>
    <div class="player-brand-wrap"><img class="player-brand" src="${esc(watermarkPath())}" alt="" draggable="false" onerror="this.style.display='none';this.parentElement.classList.add('logo-fallback')"><span class="player-brand-fallback">IARCO 2026</span></div>
    <div class="player-status" id="playerStatus">Ready</div>
    <div class="player-cover" id="playerCover"><button class="play-big" id="playBig">▶</button></div>
    <div class="player-toolbar"><button id="playPause">▶</button><button id="muteBtn">🔊</button><button id="fullBtn">⛶</button><span class="label">IARCO 2026 Academic Research Bootcamp</span></div>
  </div><div class="lecture-nav"><small>Lecture ${li+1} of ${lectures.length}: ${esc(lecture.title||m.title)}</small><div><button class="btn secondary" id="prevLecture" ${li===0?"disabled":""}>← Previous</button> <button class="btn" id="nextLecture" ${li===lectures.length-1?"disabled":""}>Next →</button></div></div><div style="padding:0 26px 26px"><p class="small muted">Custom course presentation. Vimeo controls are disabled and replaced by portal controls.</p></div></section>`);

  document.getElementById("backBtn").onclick=renderModules; document.getElementById("prevLecture")?.addEventListener("click",()=>openVideo(id,language,li-1)); document.getElementById("nextLecture")?.addEventListener("click",()=>openVideo(id,language,li+1));
  try{
    await loadVimeoSDK();
    const player=new Vimeo.Player(document.getElementById("vimeoFrame"),{controls:false,title:false,byline:false,portrait:false,keyboard:false,pip:false});
    const pp=document.getElementById("playPause"),big=document.getElementById("playBig"),mute=document.getElementById("muteBtn"),full=document.getElementById("fullBtn"),cover=document.getElementById("playerCover"),status=document.getElementById("playerStatus");
    async function toggle(){try{const paused=await player.getPaused();if(paused)await player.play();else await player.pause();}catch{status.textContent="Playback unavailable";}}
    pp.onclick=toggle;big.onclick=toggle;
    mute.onclick=async()=>{try{const x=await player.getMuted();await player.setMuted(!x);mute.textContent=x?"🔊":"🔇";}catch{}};
    full.onclick=async()=>{try{await player.requestFullscreen();}catch{document.getElementById("customPlayer").requestFullscreen?.();}};
    player.on("play",()=>{pp.textContent="❚❚";cover.classList.add("hidden");status.textContent="Playing";});
    player.on("pause",()=>{pp.textContent="▶";cover.classList.remove("hidden");status.textContent="Paused";});
    player.on("ended",()=>{pp.textContent="▶";cover.classList.remove("hidden");status.textContent="Completed";});
    player.on("error",()=>status.textContent="Video error");
  }catch{document.getElementById("playerStatus").textContent="Player unavailable";}
}

function notFound(){
  ROOT.innerHTML=`<div class="error-page"><main><div class="error-code">404</div><h1>Invalid or expired lesson link</h1><p class="muted">The requested lesson route is not valid in this session.</p><a class="btn" href="${location.pathname}">Return to Portal</a></main></div>`;
}

async function boot(){
  state.user=getSession();
  if(!state.user){renderLogin();return;}
  showLoader("Loading your portal…");
  try{
    await prefetchPortalData();
    const match=location.hash.match(/^#video\/([^/]+)$/);
    if(match){
      let route=null;try{route=JSON.parse(sessionStorage.getItem(ROUTE_KEY)||"null");}catch{}
      if(route&&route.token===match[1])await renderVideo(route.moduleId,route.language,match[1]);else notFound();
    }else renderDashboard();
    updateCountdowns();
  }catch(e){
    console.error(e);
    ROOT.innerHTML=`<div class="error-page"><main><h1>Portal configuration error</h1><p>${esc(e.message)}</p></main></div>`;
  }
}

document.addEventListener("contextmenu",e=>e.preventDefault(),true);
document.addEventListener("dragstart",e=>e.preventDefault(),true);
document.addEventListener("selectstart",e=>{const t=e.target;if(t instanceof Element&&t.closest(".player"))e.preventDefault();},true);
document.addEventListener("keydown",e=>{
  const k=String(e.key||"").toUpperCase();
  if(e.key==="F12"||(e.ctrlKey&&e.shiftKey&&["I","J","C"].includes(k))||(e.ctrlKey&&k==="U")){e.preventDefault();e.stopPropagation();}
},true);
window.addEventListener("hashchange",boot);
setInterval(updateCountdowns,1000);
boot();

})();