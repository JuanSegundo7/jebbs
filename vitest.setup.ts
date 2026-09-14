// Pinned per R16 (design.md DD1) so every test runs against the same
// timezone the deploy env asserts in lib/env.ts, regardless of the host
// machine's default zone.
process.env.TZ = "America/Argentina/Buenos_Aires";
