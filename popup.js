const collectBtn = document.querySelector("#collectBtn");
const copyBtn = document.querySelector("#copyBtn");
const output = document.querySelector("#output");
const statusEl = document.querySelector("#status");
const pageHint = document.querySelector("#pageHint");
const limitInput = document.querySelector("#limitInput");

let collectedText = "";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function isYouTubeUrl(url = "") {
  try {
    return new URL(url).hostname.endsWith("youtube.com");
  } catch {
    return false;
  }
}

function isYouTubeChannelVideosUrl(url = "") {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const firstPart = parts[0] || "";
    const isChannelPath =
      firstPart.startsWith("@") ||
      firstPart === "c" ||
      firstPart === "channel" ||
      firstPart === "user";

    return (
      parsed.hostname.endsWith("youtube.com") &&
      isChannelPath &&
      parts.at(-1) === "videos"
    );
  } catch {
    return false;
  }
}

async function sendToContentScript(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
    return chrome.tabs.sendMessage(tabId, message);
  }
}

function getVideoLimit() {
  const rawValue = limitInput.value.trim();
  if (!rawValue) return null;

  const limit = Number.parseInt(rawValue, 10);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("Video limit must be a positive number.");
  }

  return Math.min(limit, 10000);
}

async function collectLinks() {
  const tab = await getActiveTab();

  if (!tab?.id || !isYouTubeChannelVideosUrl(tab.url)) {
    setStatus("Open the exact channel's Videos tab first.");
    return;
  }

  collectBtn.disabled = true;
  copyBtn.disabled = true;
  output.value = "";

  try {
    const limit = getVideoLimit();
    setStatus(
      limit
        ? `Collecting up to ${limit} link(s)... keep this tab open.`
        : "Collecting all links... keep this tab open."
    );

    const response = await sendToContentScript(tab.id, {
      type: "COLLECT_YOUTUBE_VIDEO_URLS",
      limit
    });

    if (!response?.ok) {
      throw new Error(response?.error || "Could not collect links.");
    }

    collectedText = response.urls.join("\n");
    output.value = collectedText;
    copyBtn.disabled = response.urls.length === 0;
    setStatus(`Collected ${response.urls.length} video link(s).`);
  } catch (error) {
    setStatus(error.message || "Something went wrong.");
  } finally {
    collectBtn.disabled = false;
  }
}

async function copyLinks() {
  if (!collectedText) return;

  await navigator.clipboard.writeText(collectedText);
  setStatus("Copied to clipboard.");
}

async function init() {
  const tab = await getActiveTab();
  if (isYouTubeUrl(tab?.url)) {
    pageHint.textContent = isYouTubeChannelVideosUrl(tab.url)
      ? "Ready on this channel's Videos tab."
      : "Go to this channel's Videos tab first.";
  }
}

collectBtn.addEventListener("click", collectLinks);
copyBtn.addEventListener("click", copyLinks);
init();
