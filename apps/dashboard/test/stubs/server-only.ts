// `server-only` is Next's build-time marker: importing it makes the build fail
// if a module is ever pulled into a client bundle. It has no runtime behaviour
// and isn't resolvable outside a Next build, so Vitest aliases it here. The
// guard stays on the source modules where it does its job.
export {}
