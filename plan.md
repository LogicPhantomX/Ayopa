# Ayopá demo upgrade plan

## Implementation

The existing React/Vite frontend remains the presentation layer and the NestJS API remains intact for future integration. The demo entry point uses a local, seeded state orchestrator so buyers, sellers, and operations staff can move through the same products, escrows, disputes, KYC decisions, messages, and notifications without a live backend session. Existing workspace components are reused and wired through shared callbacks rather than duplicated.

The demo is Nigeria-first: listings, sellers, buyer companies, origin hubs, ports, bank details, and logistics are grounded in Nigerian trade context. It includes six trade listings with product photography, four escrows spanning funding, dispatch, inspection, dispute, and settlement states, a pending seller verification record, seeded mediator chat, and cross-role updates. Backend development defaults use the Ayopá database name and Ayopá service labels.

## Design

The visual direction is an editorial commodity exchange with restrained dark finance-console cues. Graphite surfaces establish trust and focus; a single warm saffron accent signals actions and verified value. The layout keeps the existing asymmetric operations workspace, with a primary work column and contextual side rail.

Interaction stays human and legible: actions expose consequences immediately through shared state and short-lived confirmation toasts. Motion is purposeful rather than decorative—subtle lift, fade, ambient mark movement, and a live connection pulse—while reduced-motion preferences are respected. Space Grotesk handles hierarchy, Inter handles operational detail, and JetBrains Mono handles IDs and telemetry.

Ayopá is positioned as a dependable Nigerian trade network for verified buyers and sellers: assured, precise, grounded. Example voice: “Move goods with certainty.” and “Your money moves when the evidence is clear.” The signature brand color remains Ayopá saffron `#D4A017`.
