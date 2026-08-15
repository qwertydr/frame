(() => {
"use strict";

const ROOT = document.getElementById("app");

const SESSION_KEY = "iarco_portal_session_v5";
const ROUTE_KEY = "iarco_portal_route_v5";

const state = {
  user: null,
  users: [],
  modules: [],
  timeline: [],
  config: {},
  loaded: false
};


/* =========================================================
   BASIC HELPERS
========================================================= */

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char];
  });
}


async function loadJSON(path) {
  const response = await fetch(path, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}


/* =========================================================
   CONFIG / DATA PREFETCH
========================================================= */

async function prefetchPortalData() {

  if (state.loaded) {
    return;
  }

  const [
    users,
    timeline,
    modules,
    config
  ] = await Promise.all([
    loadJSON("data/users.json"),
    loadJSON("data/timeline.json"),
    loadJSON("data/modules.json"),
    loadJSON("data/config.json")
  ]);

  state.users = Array.isArray(users) ? users : [];
  state.timeline = Array.isArray(timeline) ? timeline : [];
  state.modules = Array.isArray(modules) ? modules : [];
  state.config = config || {};

  state.loaded = true;
}


/* =========================================================
   LOADER
========================================================= */

function showLoader(message = "Loading your portal…") {

  ROOT.innerHTML = `
    <div class="portal-loader" role="status" aria-live="polite">

      <div class="loader-card">

        <div class="loader-logo">
          IARCO ${esc(state.config?.year || "2026")}
        </div>

        <div class="spinner"></div>

        <h2>${esc(message)}</h2>

        <p class="muted">
          Preparing your curriculum, timeline and course resources.
        </p>

      </div>

    </div>
  `;
}


/* =========================================================
   CONFIG HELPERS
========================================================= */

function watermarkPath() {

  const configured = String(
    state.config?.watermarkLogo || ""
  ).trim();

  return configured || "assets/logo-watermark.svg";
}


function sponsorText() {

  const sponsors = Array.isArray(state.config?.sponsors)
    ? state.config.sponsors.filter(
        sponsor => sponsor && sponsor.name
      )
    : [];

  if (!sponsors.length) {
    return "";
  }

  const links = sponsors.map(function (sponsor) {

    const name = esc(sponsor.name);
    const url = esc(sponsor.url || "#");

    return `
      <a
        class="sponsor-link"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${name}
      </a>
    `;
  });

  if (links.length === 1) {
    return links[0];
  }

  if (links.length === 2) {
    return `${links[0]} &amp; ${links[1]}`;
  }

  return `
    ${links.slice(0, -1).join(", ")}
    &amp;
    ${links[links.length - 1]}
  `;
}


function brandName() {

  return String(
    state.config?.brand ||
    `IARCO ${state.config?.year || "2026"}`
  );
}


function supportEmail() {

  return String(
    state.config?.supportEmail ||
    "iarco2026@yrjmail.com"
  );
}


function faqUrl() {

  return String(
    state.config?.faqUrl || "#"
  );
}


/* =========================================================
   NOTICE
========================================================= */

function noticeHTML() {

  const notice = String(
    state.config?.notice || ""
  ).trim();

  if (!notice) {
    return "";
  }

  return `
    <div class="site-notice" id="siteNotice">

      <div class="site-notice-text">
        ${esc(notice)}
      </div>

      <button
        type="button"
        class="site-notice-close"
        id="closeNotice"
        aria-label="Close notice"
      >
        ×
      </button>

    </div>
  `;
}


function attachNoticeHandler() {

  const notice = document.getElementById("siteNotice");
  const close = document.getElementById("closeNotice");

  if (!notice || !close) {
    return;
  }

  const noticeKey = "iarco_notice_closed_v5";

  if (localStorage.getItem(noticeKey) === "1") {
    notice.remove();
    return;
  }

  close.addEventListener("click", function () {

    localStorage.setItem(noticeKey, "1");

    notice.remove();
  });
}


/* =========================================================
   SESSION
========================================================= */

function getSession() {

  try {

    return JSON.parse(
      localStorage.getItem(SESSION_KEY) || "null"
    );

  } catch (error) {

    return null;
  }
}


function logout() {

  localStorage.removeItem(SESSION_KEY);

  sessionStorage.removeItem(ROUTE_KEY);

  state.user = null;

  location.hash = "";

  renderLogin();
}


/* =========================================================
   LOGIN
========================================================= */

function renderLogin(message = "") {

  ROOT.innerHTML = `

    ${noticeHTML()}

    <div class="login-wrap">

      <div class="login-card">

        <div class="brand">
          ${esc(brandName())}
        </div>

        <p class="muted">
          Academic Research Bootcamp Portal
        </p>

        <form id="loginForm">

          <div class="field">

            <label for="loginEmail">
              Email
            </label>

            <input
              id="loginEmail"
              type="email"
              autocomplete="username"
              required
            >

          </div>


          <div class="field">

            <label for="loginPassword">
              Password
            </label>

            <input
              id="loginPassword"
              type="password"
              autocomplete="current-password"
              required
            >

          </div>


          ${
            message
              ? `
                <div class="error">
                  ${esc(message)}
                </div>
              `
              : ""
          }


          <button
            class="btn"
            id="loginButton"
            type="submit"
            style="width:100%;margin-top:16px"
          >
            Login
          </button>

        </form>


        ${
          sponsorText()
            ? `
              <p class="muted small">
                ${esc(brandName())} Sponsored by
                ${sponsorText()}
              </p>
            `
            : ""
        }

      </div>

    </div>
  `;


  attachNoticeHandler();


  const form = document.getElementById("loginForm");

  if (!form) {
    return;
  }


  form.addEventListener("submit", async function (event) {

    event.preventDefault();


    const button =
      document.getElementById("loginButton");

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("loginPassword")
        .value;


    button.disabled = true;

    button.innerHTML = `
      <span class="button-spinner"></span>
      Loading…
    `;


    try {

      /*
       * Important:
       * All portal data is loaded before dashboard
       * rendering.
       */

      await prefetchPortalData();


      const user = state.users.find(function (item) {

        return (
          String(item.email || "").toLowerCase() === email &&
          String(item.password || "") === password
        );

      });


      if (!user) {

        renderLogin(
          "Invalid email or password."
        );

        return;
      }


      const languages = Array.isArray(user.languages)
        ? user.languages
        : (
            user.language
              ? [user.language]
              : []
          );


      state.user = {

        email: user.email,

        name: user.name,

        institution: user.institution,

        languages: languages

      };


      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(state.user)
      );


      sessionStorage.removeItem(
        ROUTE_KEY
      );


      location.hash = "";


      showLoader(
        "Preparing your dashboard…"
      );


      setTimeout(function () {

        renderDashboard();

        showQuickIntroIfNeeded();

      }, 350);


    } catch (error) {

      console.error(error);

      renderLogin(
        "Unable to load portal data. Please try again."
      );

    }

  });
}


/* =========================================================
   COUNTDOWN
========================================================= */

function countdownText(date) {

  let milliseconds =
    new Date(date).getTime() -
    Date.now();


  if (milliseconds <= 0) {

    return "Deadline passed";

  }


  let seconds =
    Math.floor(milliseconds / 1000);


  const days =
    Math.floor(seconds / 86400);

  seconds %= 86400;


  const hours =
    Math.floor(seconds / 3600);

  seconds %= 3600;


  const minutes =
    Math.floor(seconds / 60);

  seconds %= 60;


  return (
    `${days}d ` +
    `${String(hours).padStart(2, "0")}h ` +
    `${String(minutes).padStart(2, "0")}m ` +
    `${String(seconds).padStart(2, "0")}s`
  );
}


/* =========================================================
   ACTUAL DEADLINE DATE
========================================================= */

function formatDeadline(date) {

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {

    return String(date);

  }


  const formatter =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "America/New_York",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZoneName: "short"
      }
    );


  return formatter.format(parsed);
}


/* =========================================================
   UPDATE COUNTDOWNS
========================================================= */

function updateCountdowns() {

  document
    .querySelectorAll("[data-deadline]")
    .forEach(function (element) {

      element.textContent =
        countdownText(
          element.dataset.deadline
        );

    });
}


/* =========================================================
   SIDEBAR TIMELINE
========================================================= */

function timelineSidebarHTML() {

  if (!state.timeline.length) {

    return `
      <div class="muted small">
        No timeline items.
      </div>
    `;

  }


  return state.timeline.map(function (item) {

    return `

      <div class="timeline-item">

        <h4>
          ${esc(item.title)}
        </h4>


        <div
          class="countdown"
          data-deadline="${esc(item.date)}"
        >
          ${countdownText(item.date)}
        </div>


        <div class="deadline-date">
          Deadline:
          ${esc(formatDeadline(item.date))}
        </div>


        <div class="timeline-actions">

          <button
            type="button"
            class="side-link submit-trigger"
            data-timeline-id="${esc(item.id)}"
          >
            Submit
          </button>


          ${
            item.rulesUrl
              ? `
                <a
                  class="side-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  href="${esc(item.rulesUrl)}"
                >
                  Rules
                </a>
              `
              : ""
          }

        </div>

      </div>

    `;

  }).join("");

}


/* =========================================================
   DASHBOARD TIMELINE
========================================================= */

function timelineMainHTML() {

  if (!state.timeline.length) {

    return "";

  }


  return `

    <section class="timeline-main">

      <h2>
        Assignment Timeline
      </h2>

      <p class="muted">
        Countdown uses the deadline timezone configured
        by the timeline data.
      </p>


      <div class="deadline-grid">

        ${state.timeline.map(function (item) {

          return `

            <article class="deadline-row">

              <h3>
                ${esc(item.title)}
              </h3>


              <div
                class="deadline-time"
                data-deadline="${esc(item.date)}"
              >
                ${countdownText(item.date)}
              </div>


              <div class="deadline-meta">

                Deadline:
                ${esc(formatDeadline(item.date))}

              </div>


              <p class="muted">
                ${esc(item.description || "")}
              </p>


              <div class="actions">

                <button
                  type="button"
                  class="btn submit-trigger"
                  data-timeline-id="${esc(item.id)}"
                >
                  ${
                    esc(
                      item.submitLabel ||
                      "Assignment Submission"
                    )
                  }
                </button>


                ${
                  item.rulesUrl
                    ? `
                      <a
                        class="btn secondary"
                        target="_blank"
                        rel="noopener noreferrer"
                        href="${esc(item.rulesUrl)}"
                      >
                        ${esc(
                          item.rulesLabel ||
                          "Rules"
                        )}
                      </a>
                    `
                    : ""
                }

              </div>

            </article>

          `;

        }).join("")}

      </div>

    </section>

  `;

}


/* =========================================================
   SUBMISSION MODAL
========================================================= */

function showSubmissionModal(timelineId) {

  const item =
    state.timeline.find(function (entry) {

      return String(entry.id) ===
        String(timelineId);

    });


  if (!item) {
    return;
  }


  const existing =
    document.getElementById(
      "submissionModal"
    );


  if (existing) {
    existing.remove();
  }


  const modal =
    document.createElement("div");


  modal.id =
    "submissionModal";


  modal.className =
    "submission-modal";


  modal.innerHTML = `

    <div
      class="submission-modal-backdrop"
      data-close-modal="1"
    ></div>


    <div
      class="submission-modal-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submissionModalTitle"
    >

      <button
        type="button"
        class="submission-modal-close"
        id="closeSubmissionModal"
        aria-label="Close"
      >
        ×
      </button>


      <h2 id="submissionModalTitle">
        ${esc(item.title)}
      </h2>


      <div class="submission-modal-rules">

        <h3>
          Before submitting
        </h3>


        <p>
          ${esc(item.description || "")}
        </p>


        ${
          Array.isArray(item.rules)
            ? `
              <ul>
                ${item.rules.map(function (rule) {

                  return `
                    <li>
                      ${esc(rule)}
                    </li>
                  `;

                }).join("")}
              </ul>
            `
            : ""
        }

      </div>


      <label
        class="submission-confirm"
      >

        <input
          type="checkbox"
          id="submissionConfirm"
        >

        <span>
          I have reviewed the submission
          requirements and understand the
          instructions.
        </span>

      </label>


      <div class="submission-modal-actions">

        <button
          type="button"
          class="btn secondary"
          id="cancelSubmission"
        >
          Cancel
        </button>


        <button
          type="button"
          class="btn"
          id="continueSubmission"
          disabled
        >
          Continue to Submission
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(modal);


  const closeModal = function () {

    modal.remove();

  };


  document
    .getElementById(
      "closeSubmissionModal"
    )
    .addEventListener(
      "click",
      closeModal
    );


  document
    .getElementById(
      "cancelSubmission"
    )
    .addEventListener(
      "click",
      closeModal
    );


  modal
    .querySelector(
      "[data-close-modal]"
    )
    .addEventListener(
      "click",
      closeModal
    );


  const checkbox =
    document.getElementById(
      "submissionConfirm"
    );


  const continueButton =
    document.getElementById(
      "continueSubmission"
    );


  checkbox.addEventListener(
    "change",
    function () {

      continueButton.disabled =
        !checkbox.checked;

    }
  );


  continueButton.addEventListener(
    "click",
    function () {

      if (!checkbox.checked) {
        return;
      }


      const url =
        String(
          item.submitUrl || ""
        ).trim();


      if (!url) {
        return;
      }


      window.open(
        url,
        "_blank",
        "noopener,noreferrer"
      );


      closeModal();

    }
  );

}


/* =========================================================
   SIDEBAR + MAIN SHELL
========================================================= */

function shell(content) {

  ROOT.innerHTML = `

    ${noticeHTML()}

    <div class="shell">

      <aside class="sidebar">

        <div class="brand">
          ${esc(brandName())}
        </div>


        <div
          style="color:#d0d5dd;margin-top:4px"
        >
          ${esc(state.user.name)}
        </div>


        <div class="side-title">
          Assignment Timeline
        </div>


        <div class="timeline">
          ${timelineSidebarHTML()}
        </div>


        <div class="sidebar-support">

          <p class="small">

            If you have any question first visit
            our

            <a
              href="${esc(faqUrl())}"
              target="_blank"
              rel="noopener noreferrer"
            >
              FAQ
            </a>

            section then if you did not get
            your answers then email us

            <a
              href="mailto:${esc(supportEmail())}"
            >
              ${esc(supportEmail())}
            </a>

          </p>

        </div>


        <div
          style="margin-top:20px"
        >

          <button
            class="btn danger"
            id="logoutBtn"
            type="button"
          >
            Logout
          </button>

        </div>

      </aside>


      <main class="main">

        ${content}

      </main>

    </div>

  `;


  attachNoticeHandler();


  const logoutButton =
    document.getElementById(
      "logoutBtn"
    );


  if (logoutButton) {

    logoutButton.addEventListener(
      "click",
      logout
    );

  }


  document
    .querySelectorAll(".submit-trigger")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          showSubmissionModal(
            button.dataset.timelineId
          );

        }
      );

    });


  updateCountdowns();
}


/* =========================================================
   QUICK INTRO
========================================================= */

function showQuickIntroIfNeeded() {

  const key =
    `iarco_intro_seen_v5_${state.user.email}`;


  if (
    localStorage.getItem(key) === "1"
  ) {
    return;
  }


  const overlay =
    document.createElement("div");


  overlay.className =
    "intro-overlay";


  overlay.innerHTML = `

    <div class="intro-card">

      <div class="intro-progress">

        <span id="introStepLabel">
          1 / 3
        </span>

      </div>


      <div
        class="intro-step active"
        data-step="1"
      >

        <div class="intro-icon">
          👋
        </div>

        <h2>
          Welcome to ${esc(brandName())}
        </h2>

        <p class="muted">
          This quick guide explains how
          to use your bootcamp portal.
        </p>

      </div>


      <div
        class="intro-step"
        data-step="2"
      >

        <div class="intro-icon">
          📚
        </div>

        <h2>
          Use Next to continue
        </h2>

        <p class="muted">
          Click Next on your dashboard
          to open your assigned modules
          and languages.
        </p>

      </div>


      <div
        class="intro-step"
        data-step="3"
      >

        <div class="intro-icon">
          ⏱️
        </div>

        <h2>
          Watch your timeline
        </h2>

        <p class="muted">
          The sidebar and dashboard contain
          live assignment countdowns,
          submission links and rules.
        </p>

      </div>


      <div class="intro-actions">

        <button
          class="btn secondary"
          id="introSkip"
          type="button"
        >
          Skip
        </button>


        <button
          class="btn"
          id="introNext"
          type="button"
        >
          Next
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    overlay
  );


  let step = 1;


  function renderStep() {

    overlay
      .querySelectorAll(".intro-step")
      .forEach(function (element) {

        element.classList.toggle(
          "active",
          Number(element.dataset.step) === step
        );

      });


    overlay
      .querySelector(
        "#introStepLabel"
      )
      .textContent =
      `${step} / 3`;


    overlay
      .querySelector(
        "#introNext"
      )
      .textContent =
      step === 3
        ? "Get Started"
        : "Next";

  }


  function closeIntro() {

    localStorage.setItem(
      key,
      "1"
    );

    overlay.remove();

  }


  overlay
    .querySelector(
      "#introSkip"
    )
    .addEventListener(
      "click",
      closeIntro
    );


  overlay
    .querySelector(
      "#introNext"
    )
    .addEventListener(
      "click",
      function () {

        if (step === 3) {

          closeIntro();

        } else {

          step++;

          renderStep();

        }

      }
    );

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  shell(`

    <div class="topbar">

      <div>

        <div class="muted">
          Participant dashboard
        </div>

        <h2>
          Welcome, ${esc(state.user.name)}!
        </h2>

      </div>

    </div>


    <section class="hero">

      <h1>
        Welcome to the
        ${esc(brandName())}
        Academic Research Bootcamp
      </h1>


      ${
        sponsorText()
          ? `
            <p class="sponsor-line">

              ${esc(brandName())}
              Sponsored by

              ${sponsorText()}

            </p>
          `
          : ""
      }


      <p class="muted">

        This portal contains your bootcamp
        curriculum, research lessons,
        assignments, and submission information.

      </p>


      <p>

        <b>
          Institution:
        </b>

        ${esc(state.user.institution)}

        <br>

        <b>
          Available languages:
        </b>

        ${state.user.languages
          .map(function (language) {

            return esc(
              String(language).toUpperCase()
            );

          })
          .join(", ")}

      </p>


      <button
        class="btn"
        id="nextBtn"
        type="button"
      >
        Next →
      </button>

    </section>


    <section
      class="info-card"
      style="margin-top:18px"
    >

      <h2>
        Bootcamp Curriculum
      </h2>

      <p class="muted">

        Your assigned curriculum appears
        in every language assigned to your account.

      </p>

    </section>


    ${timelineMainHTML()}

  `);


  document
    .getElementById("nextBtn")
    .addEventListener(
      "click",
      renderModules
    );

}


/* =========================================================
   RESOURCE BUTTON
   IMPORTANT FIX FOR PREVIOUS SYNTAX ERROR
========================================================= */

function resourceButton(resource) {

  const value =
    String(resource || "").trim();


  if (!value) {

    return "";

  }


  return `
    <a
      class="btn secondary"
      target="_blank"
      rel="noopener noreferrer"
      href="${esc(value)}"
    >
      Resources
    </a>
  `;

}


/* =========================================================
   MODULE RESOURCE
========================================================= */

function getModuleLectures(module) {

  if (
    Array.isArray(module.lectures) &&
    module.lectures.length
  ) {

    return module.lectures;

  }


  return [
    {
      id: 1,

      title:
        module.title || "Lesson",

      videoId:
        module.videoId || "",

      resource:
        module.resource || ""
    }
  ];

}


/* =========================================================
   MODULES
========================================================= */

function renderModules() {

  const groups =
    state.user.languages
      .map(function (language) {

        return {

          language: language,

          items:
            state.modules.filter(
              function (module) {

                return (
                  module.language === language
                );

              }
            )

        };

      })
      .filter(function (group) {

        return group.items.length;

      });


  shell(`

    <div class="topbar">

      <div>

        <div class="muted">
          Curriculum
        </div>

        <h2>
          Bootcamp Curriculum
        </h2>

      </div>


      <button
        class="btn secondary"
        id="homeBtn"
        type="button"
      >
        Dashboard
      </button>

    </div>


    ${
      groups.length
        ? groups.map(function (group) {

            return `

              <section>

                <h3 class="language-heading">

                  ${esc(
                    group.items[0].languageName ||
                    group.language
                  )}

                  (
                  ${esc(
                    String(
                      group.language
                    ).toUpperCase()
                  )}
                  )

                </h3>


                <div class="module-list">

                  ${
                    group.items.map(
                      function (module) {

                        const lectures =
                          getModuleLectures(
                            module
                          );


                        return `

                          <article
                            class="module-card"
                          >

                            <div
                              class="module-head"
                            >

                              <h3>

                                ${module.id}.
                                ${esc(
                                  module.title
                                )}

                              </h3>

                              <span>
                                ＋
                              </span>

                            </div>


                            <div
                              class="module-body"
                            >

                              <p class="muted">
                                ${esc(
                                  module.description ||
                                  ""
                                )}
                              </p>


                              <b>
                                Topics Covered:
                              </b>


                              <ul
                                class="topic-list"
                              >

                                ${
                                  Array.isArray(
                                    module.topics
                                  )
                                    ? module.topics
                                        .map(
                                          function (
                                            topic
                                          ) {

                                            return `
                                              <li>
                                                ${esc(
                                                  topic
                                                )}
                                              </li>
                                            `;

                                          }
                                        )
                                        .join("")
                                    : ""
                                }

                              </ul>


                              <div
                                class="lecture-list"
                              >

                                ${
                                  lectures
                                    .map(
                                      function (
                                        lecture,
                                        index
                                      ) {

                                        return `

                                          <div
                                            class="lecture-row"
                                          >

                                            <div>

                                              <b>
                                                ${
                                                  index + 1
                                                }.
                                                ${esc(
                                                  lecture.title ||
                                                  module.title
                                                )}
                                              </b>

                                            </div>


                                            <div>

                                              <button
                                                class="btn watch"
                                                type="button"
                                                data-id="${esc(
                                                  module.id
                                                )}"
                                                data-lang="${esc(
                                                  module.language
                                                )}"
                                                data-lecture="${index}"
                                              >
                                                Open Lesson
                                              </button>


                                              ${resourceButton(
                                                lecture.resource
                                              )}

                                            </div>

                                          </div>

                                        `;

                                      }
                                    )
                                    .join("")
                                }

                              </div>

                            </div>

                          </article>

                        `;

                      }
                    ).join("")
                  }

                </div>

              </section>

            `;

          }).join("")
        : `
          <section class="info-card">

            <h2>
              No modules available
            </h2>

            <p class="muted">
              No modules are currently assigned
              to your selected languages.
            </p>

          </section>
        `
    }


    ${timelineMainHTML()}

  `);


  document
    .getElementById("homeBtn")
    .addEventListener(
      "click",
      renderDashboard
    );


  document
    .querySelectorAll(".module-head")
    .forEach(function (element) {

      element.addEventListener(
        "click",
        function () {

          element
            .parentElement
            .classList.toggle(
              "open"
            );

        }
      );

    });


  document
    .querySelectorAll(".watch")
    .forEach(function (button) {

      button.addEventListener(
        "click",
        function () {

          openVideo(
            button.dataset.id,
            button.dataset.lang,
            Number(
              button.dataset.lecture
            )
          );

        }
      );

    });

}


/* =========================================================
   RANDOMIZED VIDEO ROUTE
========================================================= */

function openVideo(
  moduleId,
  language,
  lectureIndex = 0
) {

  const randomToken =
    (
      crypto.randomUUID
        ? crypto.randomUUID()
        : (
            Math.random()
              .toString(36)
              .slice(2) +
            Date.now()
          )
    )
    .replaceAll("-", "");


  sessionStorage.setItem(
    ROUTE_KEY,
    JSON.stringify({

      token:
        randomToken,

      moduleId:
        String(moduleId),

      language:
        language,

      lectureIndex:
        lectureIndex,

      created:
        Date.now()

    })
  );


  location.hash =
    "video/" +
    randomToken;

}


/* =========================================================
   ROUTE VALIDATION
========================================================= */

function getRoute() {

  try {

    return JSON.parse(
      sessionStorage.getItem(
        ROUTE_KEY
      ) || "null"
    );

  } catch (error) {

    return null;

  }

}


function validRoute(
  token,
  moduleId,
  language
) {

  const route =
    getRoute();


  if (!route) {

    return false;

  }


  if (
    route.token !== token
  ) {

    return false;

  }


  if (
    String(route.moduleId) !==
    String(moduleId)
  ) {

    return false;

  }


  if (
    route.language !==
    language
  ) {

    return false;

  }


  if (
    !state.user.languages.includes(
      language
    )
  ) {

    return false;

  }


  /*
   * 30-minute temporary route.
   */

  if (
    Date.now() -
    Number(route.created || 0) >
    30 * 60 * 1000
  ) {

    return false;

  }


  return true;

}


/* =========================================================
   VIMEO SDK
========================================================= */

function loadVimeoSDK() {

  return new Promise(
    function (resolve, reject) {

      if (
        window.Vimeo &&
        window.Vimeo.Player
      ) {

        resolve();

        return;

      }


      const script =
        document.createElement(
          "script"
        );


      script.src =
        "https://player.vimeo.com/api/player.js";

      script.async = true;


      script.onload =
        resolve;


      script.onerror =
        reject;


      document.head.appendChild(
        script
      );

    }
  );

}


/* =========================================================
   VIDEO PAGE
========================================================= */

async function renderVideo(
  moduleId,
  language,
  token
) {

  if (
    !validRoute(
      token,
      moduleId,
      language
    )
  ) {

    notFound();

    return;

  }


  const module =
    state.modules.find(
      function (item) {

        return (
          String(item.id) ===
          String(moduleId) &&
          item.language ===
          language
        );

      }
    );


  if (!module) {

    notFound();

    return;

  }


  const lectures =
    getModuleLectures(
      module
    );


  const route =
    getRoute();


  let lectureIndex =
    Number(
      route?.lectureIndex || 0
    );


  if (
    lectureIndex < 0
  ) {

    lectureIndex = 0;

  }


  if (
    lectureIndex >=
    lectures.length
  ) {

    lectureIndex =
      lectures.length - 1;

  }


  const lecture =
    lectures[lectureIndex];


  const videoId =
    lecture.videoId ||
    module.videoId ||
    "";


  const hasPrevious =
    lectureIndex > 0;


  const hasNext =
    lectureIndex <
    lectures.length - 1;


  shell(`

    <div class="topbar">

      <div>

        <div class="muted">
          ${esc(module.title)}
        </div>

        <h2>
          ${esc(
            lecture.title ||
            module.title
          )}
        </h2>

      </div>


      <button
        class="btn secondary"
        id="backBtn"
        type="button"
      >
        ← Curriculum
      </button>

    </div>


    <section
      class="hero video-card"
    >

      <div
        style="padding:26px 26px 0"
      >

        <p class="muted">

          ${esc(
            module.description ||
            ""
          )}

        </p>


        <div class="lecture-title-small">

          Lecture
          ${lectureIndex + 1}
          of
          ${lectures.length}

          —
          ${esc(
            lecture.title ||
            module.title
          )}

        </div>

      </div>


      <div
        class="player"
        id="customPlayer"
      >

        <iframe
          id="vimeoFrame"
          src="https://player.vimeo.com/video/${encodeURIComponent(
            videoId
          )}?dnt=1&controls=0&title=0&byline=0&portrait=0&badge=0&pip=0&keyboard=0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
          tabindex="-1"
        ></iframe>


        <div
          class="player-shield"
        ></div>


        <div
          class="player-brand-wrap"
        >

          <img
            class="player-brand"
            src="${esc(
              watermarkPath()
            )}"
            alt=""
            draggable="false"
            onerror="this.style.display='none';this.parentElement.classList.add('logo-fallback')"
          >


          <span
            class="player-brand-fallback"
          >
            ${esc(brandName())}
          </span>

        </div>


        <div
          class="player-status"
          id="playerStatus"
        >
          Ready
        </div>


        <div
          class="player-cover"
          id="playerCover"
        >

          <button
            class="play-big"
            id="playBig"
            type="button"
          >
            ▶
          </button>

        </div>


        <div
          class="player-toolbar"
        >

          <button
            id="playPause"
            type="button"
          >
            ▶
          </button>


          <button
            id="muteBtn"
            type="button"
          >
            🔊
          </button>


          <button
            id="fullBtn"
            type="button"
          >
            ⛶
          </button>


          <span class="label">

            ${esc(brandName())}

          </span>

        </div>

      </div>


      <div
        style="padding:12px 26px 26px"
      >

        <p class="small muted">

          ${esc(
            lecture.title ||
            module.title
          )}

        </p>


        <div
          class="lecture-navigation"
        >

          <button
            class="btn secondary"
            id="previousLecture"
            type="button"
            ${hasPrevious ? "" : "disabled"}
          >
            ← Previous
          </button>


          <span
            class="lecture-counter"
          >
            ${lectureIndex + 1}
            /
            ${lectures.length}
          </span>


          <button
            class="btn"
            id="nextLecture"
            type="button"
            ${hasNext ? "" : "disabled"}
          >
            Next →
          </button>

        </div>


        ${
          lecture.resource
            ? `
              <div
                class="lecture-resource"
              >

                ${resourceButton(
                  lecture.resource
                )}

              </div>
            `
            : ""
        }

      </div>

    </section>

  `);


  document
    .getElementById(
      "backBtn"
    )
    .addEventListener(
      "click",
      renderModules
    );


  const previousButton =
    document.getElementById(
      "previousLecture"
    );


  const nextButton =
    document.getElementById(
      "nextLecture"
    );


  if (hasPrevious) {

    previousButton.addEventListener(
      "click",
      function () {

        navigateLecture(
          module.id,
          language,
          lectureIndex - 1
        );

      }
    );

  }


  if (hasNext) {

    nextButton.addEventListener(
      "click",
      function () {

        navigateLecture(
          module.id,
          language,
          lectureIndex + 1
        );

      }
    );

  }


  try {

    await loadVimeoSDK();


    const player =
      new Vimeo.Player(
        document.getElementById(
          "vimeoFrame"
        ),
        {
          controls: false,
          title: false,
          byline: false,
          portrait: false,
          keyboard: false,
          pip: false
        }
      );


    const playPause =
      document.getElementById(
        "playPause"
      );


    const playBig =
      document.getElementById(
        "playBig"
      );


    const muteButton =
      document.getElementById(
        "muteBtn"
      );


    const fullButton =
      document.getElementById(
        "fullBtn"
      );


    const cover =
      document.getElementById(
        "playerCover"
      );


    const status =
      document.getElementById(
        "playerStatus"
      );


    async function togglePlayback() {

      try {

        const paused =
          await player.getPaused();


        if (paused) {

          await player.play();

        } else {

          await player.pause();

        }

      } catch (error) {

        status.textContent =
          "Playback unavailable";

      }

    }


    playPause.addEventListener(
      "click",
      togglePlayback
    );


    playBig.addEventListener(
      "click",
      togglePlayback
    );


    muteButton.addEventListener(
      "click",
      async function () {

        try {

          const muted =
            await player.getMuted();


          await player.setMuted(
            !muted
          );


          muteButton.textContent =
            muted
              ? "🔊"
              : "🔇";

        } catch (error) {}

      }
    );


    fullButton.addEventListener(
      "click",
      async function () {

        try {

          await player.requestFullscreen();

        } catch (error) {

          const customPlayer =
            document.getElementById(
              "customPlayer"
            );


          if (
            customPlayer &&
            customPlayer.requestFullscreen
          ) {

            customPlayer.requestFullscreen();

          }

        }

      }
    );


    player.on(
      "play",
      function () {

        playPause.textContent =
          "❚❚";

        cover.classList.add(
          "hidden"
        );

        status.textContent =
          "Playing";

      }
    );


    player.on(
      "pause",
      function () {

        playPause.textContent =
          "▶";

        cover.classList.remove(
          "hidden"
        );

        status.textContent =
          "Paused";

      }
    );


    player.on(
      "ended",
      function () {

        playPause.textContent =
          "▶";

        cover.classList.remove(
          "hidden"
        );

        status.textContent =
          "Completed";

      }
    );


    player.on(
      "error",
      function () {

        status.textContent =
          "Video error";

      }
    );


  } catch (error) {

    console.error(
      "Vimeo player error:",
      error
    );


    const status =
      document.getElementById(
        "playerStatus"
      );


    if (status) {

      status.textContent =
        "Player unavailable";

    }

  }

}


/* =========================================================
   LECTURE NAVIGATION
========================================================= */

function navigateLecture(
  moduleId,
  language,
  lectureIndex
) {

  const route =
    getRoute();


  if (!route) {

    return;

  }


  const newToken =
    (
      crypto.randomUUID
        ? crypto.randomUUID()
        : (
            Math.random()
              .toString(36)
              .slice(2) +
            Date.now()
          )
    )
    .replaceAll("-", "");


  sessionStorage.setItem(
    ROUTE_KEY,
    JSON.stringify({

      token:
        newToken,

      moduleId:
        String(moduleId),

      language:
        language,

      lectureIndex:
        lectureIndex,

      created:
        Date.now()

    })
  );


  location.hash =
    "video/" +
    newToken;

}


/* =========================================================
   404
========================================================= */

function notFound() {

  ROOT.innerHTML = `

    <div class="error-page">

      <main>

        <div class="error-code">
          404
        </div>


        <h1>
          Invalid or expired lesson link
        </h1>


        <p class="muted">

          The requested lesson route is
          not valid in this session.

        </p>


        <a
          class="btn"
          href="${esc(
            location.pathname
          )}"
        >
          Return to Portal
        </a>

      </main>

    </div>

  `;

}


/* =========================================================
   BOOT
========================================================= */

async function boot() {

  state.user =
    getSession();


  if (!state.user) {

    /*
     * Load config before showing login,
     * so branding/sponsors/notice work
     * even before authentication.
     */

    try {

      const config =
        await loadJSON(
          "data/config.json"
        );

      state.config =
        config || {};

    } catch (error) {

      state.config = {};

    }


    renderLogin();

    return;

  }


  showLoader(
    "Loading your portal…"
  );


  try {

    await prefetchPortalData();


    const match =
      location.hash.match(
        /^#video\/([^/]+)$/
      );


    if (match) {

      const route =
        getRoute();


      if (
        route &&
        route.token === match[1]
      ) {

        await renderVideo(
          route.moduleId,
          route.language,
          match[1]
        );

      } else {

        notFound();

      }

    } else {

      renderDashboard();

    }


    updateCountdowns();


  } catch (error) {

    console.error(error);


    ROOT.innerHTML = `

      <div class="error-page">

        <main>

          <h1>
            Portal configuration error
          </h1>


          <p>
            ${esc(
              error.message
            )}
          </p>

        </main>

      </div>

    `;

  }

}


/* =========================================================
   SECURITY / UI DETERRENTS
========================================================= */

document.addEventListener(
  "contextmenu",
  function (event) {

    event.preventDefault();

  },
  true
);


document.addEventListener(
  "dragstart",
  function (event) {

    event.preventDefault();

  },
  true
);


document.addEventListener(
  "selectstart",
  function (event) {

    const target =
      event.target;


    if (
      target instanceof Element &&
      target.closest(".player")
    ) {

      event.preventDefault();

    }

  },
  true
);


document.addEventListener(
  "keydown",
  function (event) {

    const key =
      String(
        event.key || ""
      ).toUpperCase();


    /*
     * F12
     */

    if (
      event.key === "F12"
    ) {

      event.preventDefault();

      event.stopPropagation();

      return;

    }


    /*
     * Ctrl + Shift + I
     * Ctrl + Shift + J
     * Ctrl + Shift + C
     */

    if (
      event.ctrlKey &&
      event.shiftKey &&
      ["I", "J", "C"].includes(key)
    ) {

      event.preventDefault();

      event.stopPropagation();

      return;

    }


    /*
     * Ctrl + U
     */

    if (
      event.ctrlKey &&
      key === "U"
    ) {

      event.preventDefault();

      event.stopPropagation();

      return;

    }

  },
  true
);


/* =========================================================
   EVENTS / TIMER
========================================================= */

window.addEventListener(
  "hashchange",
  function () {

    boot();

  }
);


setInterval(
  updateCountdowns,
  1000
);


/* =========================================================
   START
========================================================= */

boot();

})();
