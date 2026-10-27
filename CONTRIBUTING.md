# Contributing

Thanks for wanting to help. The project is small on purpose: read this page, then run `pnpm check` before opening a pull request.

## Set up

```bash
pnpm install
pnpm start
```

Node 24 and pnpm 10 (see `packageManager` in `package.json`).

## Where things live

See the project structure in the [README](README.md#project-structure). The one rule that matters: **`core/render` knows nothing about Angular.** It takes a canvas context and a loop position `t` in [0, 1) and draws one frame.

Components follow these conventions, which the linter enforces where it can:

- Standalone components with `ChangeDetectionStrategy.OnPush`, selector prefix `kf-`.
- `inject()` in fields, signals for state, `input()` / `output()` / `model()` instead of decorators.
- Tailwind classes in the template first. Plain CSS only for what utilities cannot express (see the bottom of `src/styles.css`).
- About 140 lines per file at most. Split a big template by section. Static arrays longer than ~20 lines go to a sibling `*.constants.ts`.
- Look for an existing component or helper before writing a new one (`shared/ui`, `core/render/canvas.utils.ts`). Extract after three real repeats, not before.
- No dead code, no commented-out blocks.

## Adding a ready-made style

1. Write `themes/yourstyle.theme.ts` in `core/render`: a `ThemeDefinition` with `id`, `name`, `description`, default `frames` and `delay`, and a `draw(ctx, frame, options)` function.
2. Anything that moves must complete **whole cycles** of `t` over one loop, so the animation has no jump when it wraps. Elements that deliberately restart each loop (for example the sunglasses dropping in) are fine, but say so in a comment.
3. Register it in `themes.registry.ts`, add its options to `StudioStore` and its case to `FrameRenderer`.
4. Add its settings in `features/settings/theme-settings`.
5. Add it to `themes.spec.ts`, which draws every style at several loop positions and fails on a thrown error or a non-finite number.

## Adding a layer type

Extend the `Layer` union in `layer.model.ts`, add its defaults in `layer-factory.ts`, its size in `layer-geometry.ts`, its drawing in `layer-renderer.ts`, and its fields in `features/editor/layer-properties`. If it has enumerated fields, list the allowed values in `style-file.ts` so a loaded file can not carry others.

## Tests

`pnpm test` runs Vitest under jsdom, which has no canvas. `src/testing/recording-context.ts` is a stand-in context that records drawing calls, used to check that a renderer draws and that its numbers are sane. It cannot tell you a style looks good: **open the page and look at it** at real size (the "Voir les pixels" switch helps), in light and dark, before you ask for a review. Put a screenshot in the pull request for anything visual.

## Pull requests

- One topic per pull request.
- `pnpm check` must pass (tests with coverage, lint, production build).
- Keep commit messages short and in the imperative: `Add snow effect loop test`.

## Supporting another keyboard

Open an issue with the keyboard model, its screen size in pixels, the pixel format and how its official software takes images. The screen size is currently a constant (`SCREEN_SIZE` in `canvas.utils.ts`); making it a setting is on the roadmap.
