# Our Little Date

A responsive, three-part romantic date invitation built with lightweight HTML, CSS, and vanilla JavaScript. It runs directly in a browser without a build step, framework install, backend, or account. Animations and the teddy illustration are local CSS/SVG; Google Fonts are an optional enhancement with system-font fallbacks.

## Run it

Open `index.html` in a modern browser.

## What's inside

- `index.html` — the invitation, date planner, and personalized celebration
- `css/styles.css` — responsive styling, illustrations, and reduced-motion support
- `js/main.js` — the playful invitation, local-date calendar, time validation, date-card PNG generation, and sharing fallbacks
- `assets/images/` — space for any additional local image assets

Dates and times use the visitor's local date and time. Past calendar days and time slots that have already passed today cannot be selected.

After confirming a date, the celebration screen can generate a personalized PNG date card. Supported browsers can share it through the native share sheet; otherwise, download the image and use the prefilled WhatsApp link to choose a chat and attach it manually. No recipient number is embedded in the site. WhatsApp does not allow a regular click-to-chat link to attach a locally generated image automatically, and the website never sends anything without the user's action.
