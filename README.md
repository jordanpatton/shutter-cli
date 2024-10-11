# Shutter CLI
Unofficial command-line interface for [Shutterfly](https://www.shutterfly.com).

## Repository Organization
The **logic** in this repository is organized as follows:
- `workflows`
  - Use **tasks** and **common/helpers**.
  - Cannot reference other **workflows**.
  - Tightly-bound to Shutterfly.
  - Example: Download assets from Shutterfly.
- `tasks`
  - Use **common/helpers**.
  - Cannot reference **workflows** or other **tasks**.
  - Tightly-bound to Shutterfly.
  - Example: Log in to Shutterfly.
- `common/helpers`
  - Rarely use other **common/helpers**.
  - Cannot reference **workflows** or **tasks**.
  - Unrelated to Shutterfly.
  - Example: Generate a random integer.

**Constants** and **types** remain in the same module as their consuming logic when they aren't being used by another unit **at the same logical level**. When constants and types are shared across multiple units at the same logical level, they are moved into their respective files **at that logical level**. Example: A `task` constant is consumed by one `task` and two `workflows`. That constant remains in the same file as its `task`. A new `task` is created that consumes the constant. Now we move that constant into `tasks/constants` and import it into both `tasks`.

The "cannot reference" rules that apply to logic (above) also apply to constants and types. This means logic cannot import constants or types from above itself in the hierarchy. Example: A `task` cannot import `workflows/constants` or `workflows/types`, but a `workflow` can import `tasks/constants` and `tasks/types`.

## Disclaimer
All product and company names are trademarks&trade; or registered&reg; trademarks of their respective holders. Use of them does not imply any affiliation with or endorsement by them. See [LICENSE](LICENSE) for limitation of liability.
