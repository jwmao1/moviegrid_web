const data = window.MGPT_DATA;

const githubMediaRoot = "https://raw.githubusercontent.com/jwmao1/moviegrid_web/master/";

function resolveVideoSource(src, preferLocal = false) {
  if (!preferLocal && location.hostname === "jwmao1.github.io" && src.startsWith("assets/videos/")) {
    return `${githubMediaRoot}${src}`;
  }
  return src;
}

const visibleVideos = new Set();
const playRetryTimers = new WeakMap();

function clearPlayRetry(video) {
  const timer = playRetryTimers.get(video);
  if (timer) {
    clearTimeout(timer);
    playRetryTimers.delete(video);
  }
}

function safePlay(video) {
  if (document.hidden || !visibleVideos.has(video)) return;
  if (!video.loop && video.ended) return;
  clearPlayRetry(video);
  const playRequest = video.play();
  if (!playRequest) return;
  playRequest.catch(() => {
    if (document.hidden || !visibleVideos.has(video)) return;
    const timer = setTimeout(() => safePlay(video), 350);
    playRetryTimers.set(video, timer);
  });
}

const videoPlaybackObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting) {
      visibleVideos.add(video);
      video.preload = "auto";
      if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
      safePlay(video);
    } else {
      visibleVideos.delete(video);
      clearPlayRetry(video);
      video.pause();
    }
  });
}, { threshold: 0.05 });

document.addEventListener("visibilitychange", () => {
  document.querySelectorAll("video").forEach((video) => video.pause());
  if (!document.hidden) {
    visibleVideos.forEach((video) => safePlay(video));
  }
});

function mediaCard(item, options = {}) {
  const card = document.createElement("article");
  card.className = `media-card${options.ours ? " media-card--ours" : ""}`;

  if (options.label) {
    const label = document.createElement("div");
    label.className = "method-label";
    label.textContent = options.label;
    card.appendChild(label);
  }

  const shell = document.createElement("div");
  shell.className = `media-shell${options.hero ? " media-shell--hero" : ""}`;

  const video = document.createElement("video");
  video.src = resolveVideoSource(item.src, options.hero);
  video.muted = true;
  video.autoplay = true;
  video.loop = !options.hero;
  video.playsInline = true;
  video.preload = options.hero ? "auto" : "metadata";
  video.controls = true;
  video.setAttribute("aria-label", item.title || options.label || "MovieGrid video result");

  video.addEventListener("loadedmetadata", () => {
    if (video.videoWidth && video.videoHeight) {
      shell.style.aspectRatio = `${video.videoWidth} / ${video.videoHeight}`;
    }
  });

  const placeholder = document.createElement("div");
  placeholder.className = "media-placeholder";
  placeholder.innerHTML = '<span class="play-mark">▶</span><strong>Video Results</strong>';

  video.addEventListener("loadeddata", () => {
    shell.classList.add("has-video");
    safePlay(video);
  });
  video.addEventListener("canplay", () => safePlay(video));
  if (!options.hero) {
    video.addEventListener("ended", () => {
      video.currentTime = 0;
      safePlay(video);
    });
  }
  video.addEventListener("error", () => shell.classList.add("is-placeholder"));

  shell.append(video, placeholder);
  if (options.continuation) {
    const firstRowGuide = document.createElement("div");
    firstRowGuide.className = "continuation-first-row-guide";
    firstRowGuide.setAttribute("aria-hidden", "true");
    shell.appendChild(firstRowGuide);
  }
  videoPlaybackObserver.observe(video);
  card.appendChild(shell);

  if (item.caption || options.caption) {
    const caption = document.createElement("div");
    caption.className = "media-caption";
    const content = document.createElement("div");
    content.className = "caption-content";
    content.textContent = item.caption || options.caption;
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "caption-toggle";
    toggle.textContent = "+";
    toggle.setAttribute("aria-label", "Show full caption");
    toggle.setAttribute("aria-expanded", "false");
    toggle.addEventListener("click", () => {
      const expanded = caption.classList.toggle("expanded");
      toggle.textContent = expanded ? "−" : "+";
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("aria-label", expanded ? "Collapse caption" : "Show full caption");
    });
    caption.append(content, toggle);
    card.appendChild(caption);
  }
  return card;
}

function renderSimpleGrid(id, items) {
  const root = document.getElementById(id);
  items.forEach((item) => root.appendChild(mediaCard(item)));
}

function renderLabeledGrid(id, items) {
  const root = document.getElementById(id);
  items.forEach((item) => root.appendChild(mediaCard(item, { label: item.title })));
}

document.getElementById("hero-video").appendChild(mediaCard(data.hero, { hero: true }));

const mglvRoot = document.getElementById("mglv-grid");
function mglvPart(title) {
  const part = document.createElement("section");
  part.className = "mglv-part";
  const heading = document.createElement("h3");
  heading.className = "mglv-part-heading";
  heading.textContent = title;
  part.appendChild(heading);
  return part;
}

const mglvFigurePart = mglvPart("Dataset Construction");
const mglvFigure = document.createElement("figure");
mglvFigure.className = "image-card mglv-overview";
const mglvImage = document.createElement("img");
mglvImage.src = data.mglv.image;
mglvImage.alt = data.mglv.imageAlt || "MGLV overview";
mglvImage.loading = "lazy";
mglvFigure.appendChild(mglvImage);
mglvFigurePart.appendChild(mglvFigure);

mglvRoot.append(mglvFigurePart);

renderSimpleGrid("grid16", data.grid16);
renderSimpleGrid("grid64", data.grid64.map(({ caption, ...item }) => item));
const continuationRoot = document.getElementById("continuation-grid");
data.continuation.forEach((item) => continuationRoot.appendChild(mediaCard(item, { continuation: true })));

const comparisonRoot = document.getElementById("comparison-root");

function comparisonHeading(index, title, description) {
  const heading = document.createElement("div");
  heading.className = "comparison-subheading";
  heading.innerHTML = `<span>0${index}</span><div><h3>${title}</h3>${description ? `<p>${description}</p>` : ""}</div>`;
  return heading;
}

const multiShotSection = document.createElement("section");
multiShotSection.className = "comparison-subsection";
multiShotSection.appendChild(comparisonHeading(1, "Comparison with multi-shot methods", "Swipe or use the arrows to browse matched comparison examples."));

const carousel = document.createElement("div");
carousel.className = "comparison-carousel";
const track = document.createElement("div");
track.className = "comparison-track";

data.comparison.multiShotPages.forEach((page, pageIndex) => {
  const pageEl = document.createElement("div");
  pageEl.className = "comparison-page";
  pageEl.dataset.page = pageIndex;
  const pageTitle = document.createElement("div");
  pageTitle.className = "comparison-page-title";
  pageTitle.textContent = page.title || `Example ${String(pageIndex + 1).padStart(2, "0")}`;
  const grid = document.createElement("div");
  grid.className = "video-grid comparison-grid";
  page.videos.forEach((item) => grid.appendChild(mediaCard(item, { label: item.method, ours: item.ours })));
  pageEl.append(pageTitle, grid);
  track.appendChild(pageEl);
});

const controls = document.createElement("div");
controls.className = "carousel-controls";
const previous = document.createElement("button");
previous.type = "button";
previous.className = "carousel-button";
previous.setAttribute("aria-label", "Previous comparison page");
previous.textContent = "←";
const status = document.createElement("span");
status.className = "carousel-status";
const next = document.createElement("button");
next.type = "button";
next.className = "carousel-button";
next.setAttribute("aria-label", "Next comparison page");
next.textContent = "→";
controls.append(previous, status, next);
carousel.append(track, controls);
multiShotSection.appendChild(carousel);
comparisonRoot.appendChild(multiShotSection);

let comparisonPage = 0;
function updateComparisonPage(page, behavior = "smooth") {
  const count = data.comparison.multiShotPages.length;
  comparisonPage = Math.max(0, Math.min(page, count - 1));
  track.scrollTo({ left: track.clientWidth * comparisonPage, behavior });
  status.textContent = `${String(comparisonPage + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  previous.disabled = comparisonPage === 0;
  next.disabled = comparisonPage === count - 1;
}
previous.addEventListener("click", () => updateComparisonPage(comparisonPage - 1));
next.addEventListener("click", () => updateComparisonPage(comparisonPage + 1));
let comparisonScrollTimer;
track.addEventListener("scroll", () => {
  clearTimeout(comparisonScrollTimer);
  comparisonScrollTimer = setTimeout(() => updateComparisonPage(Math.round(track.scrollLeft / track.clientWidth), "auto"), 80);
});
window.addEventListener("resize", () => updateComparisonPage(comparisonPage, "auto"));
updateComparisonPage(0, "auto");

function renderPairedComparison(index, title, items) {
  const section = document.createElement("section");
  section.className = "comparison-subsection";
  section.appendChild(comparisonHeading(index, title));
  const grid = document.createElement("div");
  grid.className = "video-grid paired-comparison-grid";
  items.forEach((item) => grid.appendChild(mediaCard(item, { label: item.method, ours: item.ours })));
  section.appendChild(grid);
  comparisonRoot.appendChild(section);
}
renderPairedComparison(2, "Temporal Packing vs Grid Packing", data.comparison.temporalPacking);
renderPairedComparison(3, "VIC vs MovieGrid", data.comparison.vicVsMgpt);

const diverseRoot = document.getElementById("diverse-groups");
diverseRoot.className = "video-grid three-col";
data.diverseResults.forEach((item) => diverseRoot.appendChild(mediaCard(item)));

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...document.querySelectorAll("nav a")];
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.hash === `#${entry.target.id}`));
  });
}, { rootMargin: "-25% 0px -65% 0px" });
sections.forEach((section) => observer.observe(section));
