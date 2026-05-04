if (!globalThis.__youtubeUrlExtractorV2Initialized) {
  globalThis.__youtubeUrlExtractorV2Initialized = true;
  globalThis.__youtubeUrlExtractorState = {
    running: false
  };

  const delay = (ms) =>
    new Promise((resolve) => window.setTimeout(resolve, ms));

  const normalizeVideoUrl = (url) => {
    const parsed = new URL(url, window.location.origin);
    const videoId = parsed.searchParams.get("v");

    if (!videoId) return null;
    return `https://www.youtube.com/watch?v=${videoId}`;
  };

  const getChannelVideoContainer = () =>
    document.querySelector("ytd-rich-grid-renderer") ||
    document.querySelector("ytd-grid-renderer") ||
    document.querySelector("ytd-two-column-browse-results-renderer");

  const getVisibleVideoUrls = () => {
    const container = getChannelVideoContainer();
    if (!container) return [];

    const anchors = container.querySelectorAll(
      'a[href^="/watch"], a[href^="https://www.youtube.com/watch"]'
    );
    const urls = [];

    for (const anchor of anchors) {
      const normalized = normalizeVideoUrl(anchor.href);
      if (normalized) urls.push(normalized);
    }

    return urls;
  };

  const isChannelPage = () => {
    const path = window.location.pathname;
    return (
      path.startsWith("/@") ||
      path.startsWith("/c/") ||
      path.startsWith("/channel/") ||
      path.startsWith("/user/")
    );
  };

  const isChannelVideosPage = () => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return isChannelPage() && parts.at(-1) === "videos";
  };

  const scrollAndCollect = async (limit) => {
    if (!isChannelVideosPage()) {
      throw new Error("Open this channel's Videos tab first.");
    }

    const urls = new Set();
    let stableRounds = 0;
    let lastCount = 0;
    let lastHeight = 0;

    for (let round = 0; round < 1200; round += 1) {
      for (const url of getVisibleVideoUrls()) urls.add(url);
      if (limit && urls.size >= limit) break;

      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const madeProgress = urls.size > lastCount || height > lastHeight;

      if (!madeProgress) {
        stableRounds += 1;
      } else {
        stableRounds = 0;
      }

      if (stableRounds >= 6) break;

      lastCount = urls.size;
      lastHeight = height;
      window.scrollTo({ top: height, behavior: "auto" });
      await delay(700);
    }

    const collectedUrls = Array.from(urls);
    return limit ? collectedUrls.slice(0, limit) : collectedUrls;
  };

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "COLLECT_YOUTUBE_VIDEO_URLS") return false;

    if (globalThis.__youtubeUrlExtractorState.running) {
      sendResponse({ ok: false, error: "Collection is already running." });
      return false;
    }

    globalThis.__youtubeUrlExtractorState.running = true;

    const limit = Number.isInteger(message.limit) && message.limit > 0
      ? message.limit
      : null;

    scrollAndCollect(limit)
      .then((urls) => sendResponse({ ok: true, urls }))
      .catch((error) =>
        sendResponse({
          ok: false,
          error: error.message || "Could not collect video links."
        })
      )
      .finally(() => {
        globalThis.__youtubeUrlExtractorState.running = false;
      });

    return true;
  });
}
