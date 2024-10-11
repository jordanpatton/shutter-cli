# Shutter CLI
Unofficial command-line interface for [Shutterfly](https://www.shutterfly.com).

## Repository Organization
- `workflows`
  - Use **tasks**, **common/helpers**, and **common/constants**.
  - Cannot reference other **workflows**.
  - Tightly-bound to Shutterfly.
  - Example: Download assets from Shutterfly.
- `tasks`
  - Use **common/helpers** and **common/constants**
  - Cannot reference **workflows** or other **tasks**.
  - Tightly-bound to Shutterfly.
  - Example: Log in to Shutterfly.
- `common/helpers`
  - Use **common/constants**. May occasionally use other **common/helpers**.
  - Cannot reference **workflows** or **tasks**.
  - Unrelated to Shutterfly.
  - Example: Generate a random integer.
- `common/constants`
  - Do not use anything.
  - Cannot reference anything.
  - Unrelated to Shutterfly.
  - Example: Default new file name.

## Disclaimer
All product and company names are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them. See [LICENSE](LICENSE) for limitation of liability.
