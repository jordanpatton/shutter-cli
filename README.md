# Shutter CLI
Unofficial command-line interface for [Shutterfly](https://www.shutterfly.com).

## Repository Organization
Each command maps to a single **workflow**, and each **workflow** is comprised of one or more **tasks**. In general, workflows should not reference other workflows, and tasks should not reference other tasks.

Separate from this hierarchy is a small collection of **common** items. These items are typically unrelated to Shutterfly, and they may be imported and used by any other layer of the application (workflows, tasks, etc.):
- **common/helpers** perform small tasks unrelated to Shutterfly. (Example: generate a random integer.)
- **common/constants** store values used by **common/helpers**. (Example: default new file name.)

## Disclaimer
All product and company names are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them. See [LICENSE](LICENSE) for limitation of liability.
