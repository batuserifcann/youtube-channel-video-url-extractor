# YouTube Channel Video URL Extractor

A small Chrome extension for collecting video URLs from the currently open YouTube channel `Videos` page and copying them as a newline-separated list.

## Why This Exists

Some research and note-taking workflows let you use YouTube videos as sources. When a channel has many videos, collecting those URLs by hand is slow and error-prone. This extension helps turn a channel's video archive into a clean list of links that can be pasted into tools such as NotebookLM, spreadsheets, documents, or your own research notes.

The extension is intentionally simple: it reads links from the page you are already viewing, scrolls to load more videos, and gives you a copyable list.

## Features

- Collects YouTube video URLs from a channel's `Videos` tab.
- Supports an optional video limit, such as collecting only the first 50 loaded videos.
- Keeps one URL per line.
- Removes duplicate video links.
- Copies the final list to your clipboard.
- Does not require login credentials, API keys, or a backend server.
- Does not store or send collected links anywhere.

## How It Works

YouTube loads channel videos lazily as you scroll. The extension runs in the active YouTube tab, reads visible video links from the channel video grid, scrolls down, waits for more videos to load, and repeats until the page stops adding new videos.

It does not use the YouTube Data API. It only reads links already rendered in your browser.

## Installation

This extension is not packaged in the Chrome Web Store. Load it locally:

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable `Developer mode`.
4. Click `Load unpacked`.
5. Select the project folder.

## Usage

1. Open a YouTube channel.
2. Go to that channel's `Videos` tab.
3. Sort the videos in YouTube if you need a specific order, for example oldest to newest.
4. Click the extension icon.
5. Optionally enter a video limit, for example `50`.
6. Click `Collect links`.
7. Keep the tab open while the extension scrolls and loads videos.
8. Click `Copy`.

The output will look like this:

```text
https://www.youtube.com/watch?v=VIDEO_ID_1
https://www.youtube.com/watch?v=VIDEO_ID_2
https://www.youtube.com/watch?v=VIDEO_ID_3
```

## Important Notes

- The extension only works on YouTube channel `Videos` pages.
- It does not switch channels, click subscriptions, or navigate to another page.
- It does not change the sort order for you. Sort the channel videos manually before collecting.
- Very large channels can take several minutes because YouTube loads videos gradually.
- YouTube may change its page structure over time, which can require small selector updates.

## Privacy

This extension runs locally in your browser. It does not collect analytics, call external services, upload URLs, or save your data to a remote server.

Requested permissions:

- `activeTab`: lets the extension work on the current YouTube tab after you click it.
- `scripting`: lets the popup communicate with the page script.
- `clipboardWrite`: lets the extension copy the collected URL list.
- `https://www.youtube.com/*`: limits page access to YouTube.

## Development

The project uses plain JavaScript, HTML, and CSS. There is no build step.

Useful checks:

```bash
node --check popup.js
node --check content.js
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('manifest ok')"
```

After editing the extension:

1. Go to `chrome://extensions`.
2. Click `Reload` on the extension card.
3. Refresh or reopen the YouTube tab before testing.

## Contributing

Issues and pull requests are welcome. Helpful contributions include:

- Fixes for YouTube layout changes.
- Better detection for channel video grids.
- UI improvements.
- Browser compatibility testing.

Please keep the extension lightweight and privacy-friendly.

## License

MIT
