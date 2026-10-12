# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences, weighted equally:

- **E-commerce brands** (small and growing DTC / marketplace sellers) that need product imagery for store listings, variants and ads without organising a photo shoot.
- **Larger brands' marketing teams and agencies** that outsource 3D product rendering for campaigns and launches.

Both arrive evaluating whether ViewportStudio3D can deliver imagery at the level their product deserves, and leave by requesting a quote.

## Product Purpose

ViewportStudio3D is the 3D product-render studio of Lucas Expósito (Spain). The website turns visits from brands into qualified enquiries (quote requests via the contact form or email). Success is a brand sending a brief.

Services: e-commerce packshots, lifestyle / campaign scenes, and product animation, all made in Blender.

## Positioning

**Premium visual quality**: lighting, materials and art direction at campaign level, not just catalogue output. This is the differentiator future work must make evident and never dilute.

Supporting (factual, but not the lead claim): one 3D model yields consistent packshots, variants, scenes and animation; clients work directly with Lucas.

## Operating Context

- Process: brief (client sends photos/plans, packaging artwork, style references) → model and materials preview → lighting and render with two revision rounds → delivery in the formats needed for store, web, social and ads.
- Quoted response time: 24–48 h. Indicative timings: packshots 3–5 working days, lifestyle 1–2 weeks, animation 2–4 weeks.
- Contact form sends via Resend; fallback is the visitor's own email client.

## Capabilities and Constraints

- Next.js (App Router) + TypeScript + Tailwind, static pages, no database. GSAP + ScrollTrigger and Lenis loaded after first paint. An interactive three.js model (pPhone 17 variant studio) demonstrates variants in the browser.
- **Bilingual, required**: Spanish at `/`, English at `/en`. Every surface ships in both languages.
- **Performance and accessibility, required**: fast on mobile; motion disabled under `prefers-reduced-motion`. Media is AVIF/JPEG 4:4:4 and muted H.264 at 1080p/720p.
- Legal notice (LSSI-CE) still needs NIF and address before publishing.
- Content lives in `src/content/` (copy, projects, legal) and `src/lib/site.ts`.

## Brand Commitments

- Name: **ViewportStudio3D**. Founder: Lucas Expósito. Tools: Blender (6+ years), Cinema 4D, Photoshop, After Effects, Premiere.
- Voice: first person, direct and warm ("Trabajas directamente conmigo"); plain language aimed at brand owners, not 3D jargon.
- Existing typography (Satoshi + Geist) is incumbent, not a binding commitment.

## Evidence on Hand

- Client case: **Fine Nipona** (Matcha and Mulberry Matcha bags): packshots, scene and animation in `src/content/projects.ts` and media.
- Personal/demo project: **pPhone 17**, a fictional smartphone brand, and must stay labelled as fictional.
- Testimonials: none yet (section hidden until Fine Nipona provides a quote with permission). Do not fabricate clients, testimonials, metrics or pricing.

## Product Principles

1. The work is the argument: every surface should show render quality before it claims it.
2. Premium, never generic: the site itself must look as carefully lit and composed as the renders it sells.
3. Speak to both a founder and an agency producer: clear process, timings and deliverables, without jargon.
4. One path to action: every page leads to a quote request.
5. Equal quality in both languages and on every device, including with reduced motion.

## Accessibility & Inclusion

Respect `prefers-reduced-motion` (no scroll-driven motion or smooth scroll), keyboard-operable interactive 3D viewer, meaningful alt text on all renders, WCAG AA as the baseline.
