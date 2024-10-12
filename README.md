# Shutter CLI
Unofficial command-line interface for [Shutterfly](https://www.shutterfly.com).

## Repository Organization
- `fixtures`: Sample requests, responses, and other data structures.
- `src`: Business logic.
  - `components`: The component tree for this application containing large workflows, medium-sized tasks, and miniscule sub-tasks. This codebase favors composition over inheritance, and components may reference one another as needed. Structure changes to match relationships between components.
  - `utilities`: Tools that aren't specific to this application. (They typically have nothing to do with Shutterfly.) Utilities could be abstracted into their own codebase and imported to this one if needed.
  - `index`: The entrypoint for this application. Receives commands from the end user via the command line and invokes business logic accordingly.
- `tsd`: TypeScript definitions that are not specific to this application. Declares items that should not be type-checked and hosts type definitions for any packages that don't provide their own.

## Disclaimer
All product and company names are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them. See [LICENSE](LICENSE) for limitation of liability.
