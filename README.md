# Shutter CLI
Unofficial command-line interface for [Shutterfly](https://www.shutterfly.com).

## Getting Started
Requires [Node.js (latest LTS)](https://nodejs.org/en/download/package-manager).
```shell
# Clone project OR download archive from GitHub.
git clone https://github.com/jordanpatton/shutter-cli.git
cd shutter-cli
npm install
npm run build && npm run start
```

## Examples
```shell
# Build application (always do this first!).
npm run build
# Download all assets from a Shutterfly account.
npm run start -- --command download-assets
# Download assets to a specific directory using an existing login session.
npm run start -- --command download-assets --cognito-id-token "YOUR TOKEN HERE" --download-to-directory "/path/to/directory"
# Download assets between two dates with a longer delay between downloads.
npm run start -- --command download-assets --start-time 2023-01-01 --end-time 2023-12-31 --download-delay-fixed-milliseconds 5000 --download-delay-jitter-milliseconds 2000
# Manually run a command without npm scripts.
node ./dist/index.js --command download-assets
```

## Repository Organization
- `fixtures`: Sample requests, responses, and other data structures.
- `src`: Business logic.
  - `components`: The component tree for this application containing large workflows, medium-sized tasks, and miniscule sub-tasks. This codebase favors composition over inheritance, and components may reference one another as needed. Structure changes to match relationships between components.
  - `utilities`: Tools that aren't specific to this application. (They typically have nothing to do with Shutterfly.) Utilities could be abstracted into their own codebase and imported to this one if needed.
  - `index`: The entrypoint for this application. Receives commands from the end user via the command line and invokes business logic accordingly.
- `tsd`: TypeScript definitions that are not specific to this application. Declares items that should not be type-checked and hosts type definitions for any packages that don't provide their own.

## Disclaimer
All product and company names are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them. See [LICENSE](LICENSE) for limitation of liability.
