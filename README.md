# irys-webby

This is a monorepo containing the sources for [catstret.ch](<https://catstret.ch>), [irys.cc](<https://irys.cc>), and the assets & common libraries shared between all of our sites.

## Building

`yarn run build` will build the sources for _everything_.

You can also build each "site" individually - `yarn run build:<sitename>` (where `<sitename>` is a directory under `src/`).

## Repo structure

- `shared/` - Common build configuration helpers
- `lib/` - Common JS/TypeScript libraries
- `src/` - Site sources

## License

MIT, see [the `LICENSE` file](./LICENSE).
