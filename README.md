# Live Event Lottery System Demo

Public portfolio version of a live event lottery workflow.

This repository is intentionally sanitized for hiring review:

- Uses fake demo participant data only.
- Stores demo draw results in browser `localStorage` instead of a production database.
- Does not expose real participant spreadsheets.
- Does not include a public operator login flow.
- Keeps the claim/admin page as a read-only mock.

## Live Demo Links

- Lottery operator demo: https://byyoung184179.vercel.app/lottery.html?room=2026
- Winner query demo: https://byyoung184179.vercel.app/check.html?room=2026
- Host display demo: https://byyoung184179.vercel.app/hoster.html?room=2026
- Read-only claim mock: https://byyoung184179.vercel.app/admin.html?room=2026

## What This Demonstrates

- Multi-role event workflow: operator, participant query, host display, claim desk.
- Room-based URLs using a `room` query parameter.
- Real-time style synchronization across pages through browser storage events.
- Draw logic, duplicate-winner prevention, grouped result rendering, and QR entry flow.
- Public portfolio hygiene: source code is reviewable while private data and operational controls are removed.

## Source Safety Notes

This public repo is not the production event system. Real event data, spreadsheets, private operational details, and writable backend integrations are intentionally excluded.
