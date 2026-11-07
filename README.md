# Pranav A P — Cinematic 3D Portfolio

A personal portfolio for **Pranav A P**, built with React, Vite, Three.js, React Three Fiber, GSAP ScrollTrigger and Lenis. The experience connects seven 3D environments through one scroll-controlled camera journey.

## Experience

1. **Universe** — 3D identity, floating geometry, code glyphs and cursor parallax.
2. **Workspace** — a floating developer workspace with profile information and photo stack.
3. **Technology Galaxy** — five interactive skill clusters connected through animated elements.
4. **Journey** — a curved pathway synchronized with journey, experience and certification content.
5. **Project Gallery** — a 3D showcase of the projects maintained in `src/data.js`.
6. **GitHub Activity** — public repository and recent public-event visualization.
7. **Portal** — contact information and the final call to action.

The DOM content remains available if WebGL is unavailable. The 3D world is decorative and does not replace the accessible page content.

## Architecture

```text
src/
├── components/       # DOM content, navigation and interface
├── three/
│   ├── scenes/       # Seven lazy-loaded 3D environments
│   ├── World.jsx     # Shared Canvas, lighting and camera rig
│   ├── config.js     # Scene layout and camera keyframes
│   └── util.js       # Shared 3D helpers and resource utilities
├── lib/
│   ├── director.js   # DOM-to-scroll/keyframe synchronization
│   ├── motion.js     # Single Lenis + GSAP/ScrollTrigger setup
│   └── store.js      # Shared mutable state for DOM and 3D
├── styles/           # Global and 3D presentation styles
└── data.js           # Profile, projects, skills and journey content
```

### Camera and scroll flow

Lenis provides smooth scrolling and notifies ScrollTrigger. `director.js` measures `[data-scene]` and `[data-kf]` elements and writes progress to the shared store. `config.js` maps that progress to camera keyframes. The `World.jsx` camera rig interpolates along the global path and mounts only the nearby 3D environments. This keeps one shared WebGL Canvas for the entire experience.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- A modern browser with WebGL support for the full 3D experience

## Run locally

```bash
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Contact form setup

The contact form sends messages directly through [Web3Forms](https://web3forms.com/) rather than opening the visitor’s email application. To enable submissions:

1. Create a free Web3Forms access key for the inbox that should receive portfolio enquiries.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_WEB3FORMS_ACCESS_KEY` in `.env.local` to your access key.
4. Restart the Vite development server.
5. Add the same environment variable in your Vercel/Netlify project settings before deploying.

The access key is intended for browser-side use by Web3Forms. Do not put private SMTP passwords or other server secrets in `VITE_` variables. Without the key, the form displays a setup message and visitors can still contact you using the visible email link.

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Update portfolio content

Edit `src/data.js` to update:

- Name, role, introduction, location and contact email
- GitHub, LinkedIn and résumé links
- Projects, descriptions, technologies and live links
- Skills and skill groups
- Journey entries, experience and certifications
- Hero and About statistics

Only add URLs that are real and publicly accessible. Project preview artwork is generated from project metadata when no screenshot is supplied. Actual screenshots can be placed under `public/img/projects/` and referenced from the corresponding project data.

## Visual system

The portfolio uses a dark navy and electric-blue visual identity. Main colours are defined through CSS variables in `src/styles/global.css`; the 3D environment palettes and camera keyframes are in `src/three/config.js`.

## Performance and accessibility

- One shared React Three Fiber Canvas.
- Seven lazy-loaded scene modules.
- Adaptive device pixel ratio and quality tiers.
- Reduced particle counts on smaller devices.
- Shared 3D resources where practical.
- DOM content fallback when WebGL is unavailable.
- `prefers-reduced-motion` support.
- Keyboard focus styling and semantic navigation.

Always test the experience on a real mobile device before deployment. WebGL performance varies by GPU, browser and power mode.

## Deployment

For Vercel or Netlify:

- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Update the canonical URL and social preview metadata in `index.html` if the production domain changes. Also update `public/sitemap.xml` and `public/robots.txt` when changing domains.

## License

See `LICENSE` for the applicable license and attribution details.
