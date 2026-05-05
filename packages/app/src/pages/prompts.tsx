import "./prompts.css"
import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { showToast } from "@opencode-ai/ui/toast"
import { createMemo, createSignal, For, Match, Show, Switch } from "solid-js"
import { createStore } from "solid-js/store"
import { promptTemplates, type PromptTemplate } from "./prompts/data"

const filterModes = ["All", "Light", "Dark"] as const
const filterTypes = ["All", "Sans", "Serif", "Mono"] as const
const featureCards = [
  ["01", "Prompt to System", "Turn a raw design prompt into tokens, layout rules, and reusable UI decisions."],
  ["02", "Editorial Preview", "Inspect the visual personality before using the prompt in your own workspace."],
  ["03", "Copy and Build", "Extract the full prompt when the example feels right, then use it directly."],
]
const stats = [
  ["21:1", "Contrast"],
  ["0px", "Radius"],
  ["100ms", "Motion"],
]
const faqItems = [
  ["Can I use this prompt directly?", "Yes. Get Prompt copies the full role and design-system prompt exactly as stored."],
  ["Is the preview real?", "Yes. It has hover inversion, anchor navigation, selectable kits, and expandable FAQ content."],
  ["Why is the page so strict?", "The source prompt asks for pure monochrome, serif-led type, hard borders, no radius, and no shadows."],
]
const dopamineStats = [
  ["48h", "Pop-up pass"],
  ["05", "Sound rooms"],
  ["999", "Candy badges"],
]
const dopamineCards = [
  ["01", "Bubble synth lab", "Build a hook from neon loops, glitch vox, and crowd-triggered samples.", "Spark"],
  ["02", "Sticker wall", "Trade animated badges and unlock absurd visual skins for the live stage.", "Trade"],
  ["03", "Afterglow shop", "Grab limited zines, charms, and color-drunk merch before midnight.", "Drop"],
]
const dopamineTickets = [
  ["day", "Day Crush", "$39", "Workshops + daytime arcade"],
  ["night", "Night Rush", "$79", "Main show + remix battle"],
  ["all", "Ultra Pass", "$129", "All access + secret finale"],
]
const dopamineFaqItems = [
  ["Is it actually interactive?", "Yes. The nav jumps, RSVP button changes state, tickets are selectable, and FAQ rows expand."],
  ["Why this content type?", "The prompt asks for euphoric maximalism, so a hyperpop event page gives color, motion, tickets, and playful cards room to work."],
  ["Does it affect the prompt board UI?", "No. This loud system stays contained inside the live preview panel."],
]
const bauhausStats = [
  ["1925", "Grid logic"],
  ["03", "Primary colors"],
  ["08px", "Hard shadow"],
  ["100%", "Geometry"],
]
const bauhausWorkshops = [
  ["Circle Systems", "Compose repeatable product cards from circles, grids, and stark black rules.", "red"],
  ["Square Layouts", "Turn a dashboard into a geometric composition with strict functional hierarchy.", "blue"],
  ["Triangle Motion", "Prototype mechanical interactions: press, lift, rotate, reveal.", "yellow"],
]
const bauhausPasses = [
  ["student", "Student", "$24", "One-day composition lab"],
  ["studio", "Studio", "$64", "Full workshop + critique wall"],
  ["archive", "Archive", "$96", "Workshop, templates, and layout files"],
]
const bauhausFaqItems = [
  ["Why this demo content?", "Bauhaus works best when the page feels like a constructed grid, so this preview uses a design school workshop page."],
  ["What can I interact with?", "The navigation jumps, enroll button changes state, pricing passes are selectable, and FAQ rows expand."],
  ["Is the style faithful?", "The preview uses primary color blocking, geometric shapes, thick black borders, hard shadows, and uppercase type."],
]
const linearMetrics = [
  ["99.98%", "Uptime"],
  ["184ms", "P95 latency"],
  ["12.4k", "Events/min"],
]
const linearFeatures = [
  ["Orchestration", "Route deploys through preview, staging, and production with deterministic checks.", "large"],
  ["Observability", "Surface traces, incidents, and regressions in one ambient command surface.", "small"],
  ["Automations", "Trigger rollbacks, owners, and release notes without breaking flow.", "small"],
  ["Review Flow", "Keep decisions attached to the work, with precise status and zero noisy chrome.", "wide"],
]
const linearPlans = [
  ["team", "Team", "$19", "Shared command center"],
  ["scale", "Scale", "$49", "Advanced deploy controls"],
  ["enterprise", "Enterprise", "Custom", "Governance and SSO"],
]
const linearFaqItems = [
  ["Why this demo content?", "The Linear / Modern prompt is strongest for premium developer tools, so this preview uses a deployment command center."],
  ["What is interactive?", "Navigation jumps, the launch CTA toggles state, plan cards are selectable, and FAQ rows expand."],
  ["Where are the signature details?", "The preview includes animated ambient blobs, layered near-black gradients, glass cards, subtle grid texture, glow buttons, and tiny hover movement."],
]
const newsprintTicker = ["Breaking: Design systems consolidate tokens", "Markets: Grid layouts rise 12%", "Opinion: Sharp corners return", "Archive: The serif headline endures"]
const newsprintBriefs = [
  ["Fig. 1.1", "Component libraries move toward editorial density without sacrificing usability."],
  ["Fig. 1.2", "New research shows metadata improves trust when paired with clear hierarchy."],
  ["Fig. 1.3", "Teams revive print-style columns for dashboards that must be scanned quickly."],
]
const newsprintSections = [
  ["Front Page", "Top stories and urgent signals"],
  ["Markets", "Release velocity and team health"],
  ["Culture", "The craft of interface writing"],
]
const newsprintFaqItems = [
  ["Why this preview content?", "Newsprint fits a publication product, so this preview uses a technology newspaper front page instead of a generic SaaS landing page."],
  ["What is interactive?", "The nav jumps, subscription button changes state, section cards are selectable, and FAQ rows expand."],
  ["Where is the prompt style visible?", "The preview uses a newspaper masthead, edition metadata, drop caps, ticker, collapsed borders, dense columns, paper texture, and sparse red accents."],
]
const modernStats = [
  ["42%", "Faster launch"],
  ["18k", "Signals mapped"],
  ["3.8x", "Experiment lift"],
  ["96", "Live cohorts"],
]
const modernFeatures = [
  ["Signal Studio", "Cluster qualitative and product signals into clean growth opportunities."],
  ["Launch Canvas", "Plan experiments with owner, audience, motion, and success metrics in one surface."],
  ["Insight Loops", "Turn outcomes into reusable playbooks that keep the next sprint moving."],
]
const modernSteps = [
  ["01", "Collect", "Pull in feedback, analytics, and support themes."],
  ["02", "Shape", "Use AI-assisted patterns to frame high-confidence tests."],
  ["03", "Launch", "Publish variants and watch the signal board pulse."],
]
const modernPlans = [
  ["solo", "Solo", "$29", "For one product lead"],
  ["studio", "Studio", "$79", "For growth teams"],
  ["scale", "Scale", "$149", "For portfolio work"],
]
const modernFaqItems = [
  ["Why this demo content?", "Minimalist Modern fits a premium creative SaaS, so this preview uses a growth experiment studio with bold electric-blue details."],
  ["What is interactive?", "Navigation jumps, primary CTA toggles state, plan cards are selectable, and FAQ rows expand."],
  ["Which style details are included?", "The preview includes gradient text, pulsing section badges, floating hero cards, inverted stats, gradient icon cards, and accent-tinted shadows."],
]
const luxuryStats = [
  ["08", "Seasonal compositions"],
  ["192", "Hand-numbered editions"],
  ["04", "Private rituals"],
]
const luxuryCollections = [
  ["No. 01", "Alabaster Smoke", "Cedar, iris, warm paper"],
  ["No. 02", "Midnight Linen", "Tea leaf, amber, rain"],
  ["No. 03", "Gold Archive", "Saffron, suede, pale wood"],
]
const luxuryFaqItems = [
  ["Why this demo content?", "Luxury Editorial is strongest for curated objects, fashion, hospitality, fragrance, and magazines, so this preview uses an artisan fragrance house."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles, collection cards are selectable, and FAQ rows expand."],
  ["Which signature details appear?", "The preview includes warm paper color, large serif headlines, italic gold emphasis, vertical labels, drop caps, subtle grid lines, slow grayscale image reveals, and gold sliding button animation."],
]
const terminalStats = [
  ["CPU", "[||||||||||....] 72%"],
  ["MEM", "[||||||||......] 58%"],
  ["NET", "[||||||||||||..] 88%"],
]
const terminalModes = [
  ["audit", "--audit", "scan packages and permissions"],
  ["deploy", "--deploy", "ship current build to edge"],
  ["rollback", "--rollback", "restore previous stable image"],
]
const terminalFaqItems = [
  ["Why this demo content?", "Terminal CLI fits system-level software, so this preview is a deployment and audit console instead of a marketing page."],
  ["What is interactive?", "The nav jumps, INITIATE toggles a run state, command modes are selectable, and FAQ panes expand."],
  ["Which style details are included?", "The preview uses monospace-only typography, ASCII panes, prompt characters, status codes, raw progress bars, scanlines, phosphor glow, and a blinking cursor."],
]
const swissStats = [
  ["24", "Grid modules"],
  ["04", "Transit zones"],
  ["128", "Signals"],
  ["01", "Red system"],
]
const swissSystems = [
  ["01", "Wayfinding", "Clear hierarchy for museum entries, platform changes, and exhibition flows."],
  ["02", "Archive", "Dense catalog cards with objective labels, dates, and classification marks."],
  ["03", "Schedule", "Timetables that keep content aligned to the grid without decoration."],
]
const swissRoutes = [
  ["north", "North Hall", "Exhibitions / 08-18"],
  ["center", "Central Index", "Transit / Tickets / Info"],
  ["south", "South Archive", "Public records / Reading room"],
]
const swissFaqItems = [
  ["Why this demo content?", "Swiss International fits civic information, transit, museums, and indexes, so this preview uses a cultural wayfinding system."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles state, route cards are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses massive uppercase grotesque typography, strict left alignment, visible borders, grid/dot/diagonal patterns, red section numbers, geometric composition, and full color-inversion hover states."],
]
const kineticMarquee = ["TYPE IN MOTION", "NO STATIC LAYOUTS", "WEB ENERGY", "ACID SIGNAL"]
const kineticStats = [
  ["120", "beats per minute"],
  ["08", "motion stages"],
  ["24h", "live typography"],
  ["999", "moving glyphs"],
]
const kineticPasses = [
  ["floor", "Floor Pass", "$49", "Main kinetic stage"],
  ["studio", "Studio Pass", "$89", "Workshops + after hours"],
  ["archive", "Archive Pass", "$129", "All access + print pack"],
]
const kineticFaqItems = [
  ["Why this demo content?", "Kinetic Typography is strongest for music sites, festival schedules, campaign pages, and motion systems, so this preview uses a moving type event."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles, pass cards are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses clamp-scale uppercase headlines, two marquees, massive numbers, brutal borders, acid yellow inversions, noise texture, and dramatic hover states."],
]
const materialStats = [
  ["07", "focus rituals"],
  ["42m", "avg session"],
  ["93%", "week clarity"],
]
const materialFeatures = [
  ["Adaptive day plan", "Turn tasks, meetings, and recovery time into a soft schedule that updates as your day moves."],
  ["Tonal habit cards", "Keep streaks, reminders, and wellbeing signals in approachable surfaces with clear state feedback."],
  ["Gentle insights", "Review energy, focus, and interruptions without a cold analytics dashboard."],
]
const materialPlans = [
  ["solo", "Solo", "$12", "Personal schedule and habit loops"],
  ["family", "Family", "$24", "Shared routines and reminders"],
  ["studio", "Studio", "$48", "Team rituals and weekly reviews"],
]
const materialFaqItems = [
  ["Why this demo content?", "Material You is strongest for personal, adaptive applications, so this preview uses a daily planning and wellbeing product."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles state, mood chips and pricing plans are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses tonal purple surfaces, pill buttons, organic blur shapes, filled inputs, soft elevation, tactile press feedback, and Material-style state layers."],
]
const neoStats = [
  ["14", "open quests"],
  ["03", "ship lanes"],
  ["98%", "loud clarity"],
]
const neoCards = [
  ["01", "Bug Bash", "Triage rough edges with thick rules, owner tags, and zero hidden status.", "red"],
  ["02", "Launch Kit", "Package copy, QA notes, and release blockers into one tactile board.", "yellow"],
  ["03", "Crit Wall", "Collect direct feedback without sanding off the useful friction.", "violet"],
]
const neoPacks = [
  ["starter", "Starter", "$18", "Solo sprint board"],
  ["crew", "Crew", "$44", "Shared critique wall"],
  ["shop", "Shop", "$88", "Templates + review rituals"],
]
const neoFaqItems = [
  ["Why this demo content?", "Neo-brutalism fits tools that need energy and visible structure, so this preview uses a sprint board for creative teams."],
  ["What is interactive?", "Navigation jumps, the main CTA toggles, card and pack selections update state, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses cream paper, pure black borders, hard offset shadows, saturated red/yellow/violet blocks, sticker badges, halftone texture, and mechanical press states."],
]
const boldStats = [
  ["13", "editorial systems"],
  ["04", "active briefs"],
  ["2.4x", "scan speed"],
]
const boldSections = [
  ["Briefing", "Convert product noise into one clear hierarchy of title, support, proof, and action."],
  ["Launch Notes", "Frame release detail with precise dividers, short labels, and restrained accent underlines."],
  ["Archive", "Keep past decisions readable through metadata, mono labels, and deliberate whitespace."],
]
const boldPlans = [
  ["reader", "Reader", "$16", "Editorial templates and saved issues"],
  ["studio", "Studio", "$42", "Shared reviews and live brief states"],
  ["desk", "Desk", "$96", "Governance, archive, and export flow"],
]
const boldFaqItems = [
  ["Why this demo content?", "Bold Typography fits editorial tools, publishing products, and content operations, so this preview uses a type-led briefing workspace."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles, issue sections and tiers are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses near-black surfaces, warm white type, vermillion accents, tight display tracking, mono labels, thin dividers, animated underlines, and zero radius."],
]
const cyberStats = [
  ["07", "open nodes"],
  ["128", "packets/s"],
  ["03", "risk spikes"],
]
const cyberNodes = [
  ["alpha", "Alpha Gate", "Proxy traffic through low-noise routes and verify spoof signatures.", "green"],
  ["ghost", "Ghost Relay", "Watch encrypted handoffs, anomaly bursts, and corrupted identity trails.", "cyan"],
  ["pulse", "Pulse Trap", "Isolate hostile pings before the city grid starts screaming.", "magenta"],
]
const cyberPlans = [
  ["solo", "Solo Runner", "$19", "Private terminal and alert stream"],
  ["cell", "Signal Cell", "$59", "Shared nodes and incident handoff"],
  ["black", "Black Desk", "$149", "Governance, audits, and stealth exports"],
]
const cyberFaqItems = [
  ["Why this demo content?", "Cyberpunk / Glitch is strongest for security, devops, monitoring, and hacker-fiction interfaces, so this preview uses a rogue network operations console."],
  ["What is interactive?", "Navigation jumps, the main CTA toggles a live state, nodes and access tiers are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses neon green, magenta, and cyan glows, scanlines, terminal prompts, chamfered panels, circuit-grid backgrounds, blinking cursor, and chromatic glitch text."],
]
const bitcoinStats = [
  ["12.8 BTC", "secured value"],
  ["04", "vault routes"],
  ["99.99%", "proof uptime"],
]
const bitcoinVaults = [
  ["cold", "Cold Reserve", "Multisig custody, low movement, high assurance treasury routing."],
  ["yield", "Yield Mesh", "Transparent allocations, conservative liquidity, and daily proof checks."],
  ["node", "Node Watch", "Monitor mempool pressure, settlement latency, and signer health."],
]
const bitcoinPlans = [
  ["stack", "Stacker", "$29", "Personal vault and live proof feed"],
  ["desk", "Treasury", "$99", "Team limits, approvals, and route guardrails"],
  ["prime", "Prime", "$249", "Institutional controls and audit exports"],
]
const bitcoinFaqItems = [
  ["Why this demo content?", "Bitcoin DeFi is strongest for vaults, treasuries, trading, staking, and financial dashboards, so this preview uses a digital-gold asset console."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles secure mode, vaults and plans are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses true void backgrounds, Bitcoin orange and gold gradients, glass panels, mono data, live status dots, grid texture, colored glow shadows, and precise 1px borders."],
]
const darkStats = [
  ["18", "quiet tasks"],
  ["04", "focus rooms"],
  ["92%", "calm delivery"],
]
const darkCards = [
  ["Review Queue", "Collect product, copy, and design checks into one low-noise surface."],
  ["Focus Room", "Dim distractions and preserve the tiny context needed for deep work."],
  ["Night Notes", "Keep decisions readable with warm accents and calm metadata."],
]
const darkPlans = [
  ["solo", "Solo", "$18", "Personal focus spaces"],
  ["studio", "Studio", "$54", "Shared rooms and review queues"],
  ["org", "Org", "$120", "Permissions, reports, and archive"],
]
const darkFaqItems = [
  ["Why this demo content?", "Minimalist Dark fits premium developer tools and focus apps, so this preview uses a calm nighttime workbench."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles focus mode, cards and plans are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses layered slate tones, amber accents, glass cards, subtle borders, ambient glow, mono labels, and spacious calm layouts."],
]
const clayStats = [
  ["08", "soft rituals"],
  ["24m", "happy focus"],
  ["96%", "gentle streak"],
]
const clayCards = [
  ["Mood Garden", "Track energy with rounded, color-rich cards that feel like soft objects."],
  ["Tiny Wins", "Convert small habits into squishy checkpoints with joyful feedback."],
  ["Rest Timer", "Build breaks into the flow with low-pressure reminders and friendly motion."],
]
const clayPlans = [
  ["seed", "Seed", "$9", "Personal mood loops"],
  ["bloom", "Bloom", "$19", "Shared habits and daily notes"],
  ["garden", "Garden", "$39", "Family spaces and weekly rituals"],
]
const clayFaqItems = [
  ["Why this demo content?", "Claymorphism fits playful wellbeing, education, family, and habit apps, so this preview uses a tactile mood and routine product."],
  ["What is interactive?", "Navigation jumps, the main CTA toggles, mood chips, cards, plans, and FAQ rows all respond to selection."],
  ["Which style details appear?", "The preview uses pale lavender canvas, candy blobs, Nunito-style rounded headings, glass-clay cards, layered shadows, super-rounded surfaces, and squishy active states."],
]
const serifStats = [
  ["12", "curated essays"],
  ["04", "salon letters"],
  ["186", "archival notes"],
]
const serifDepartments = [
  ["Architecture", "Measured studies on rooms, public thresholds, and the quiet rituals of place."],
  ["Literature", "Close readings, author notes, and essays that reward slow attention."],
  ["Objects", "A cabinet of useful things: lamps, notebooks, chairs, and tools with memory."],
]
const serifMemberships = [
  ["reader", "Reader", "$18", "Monthly issue and annotated archive"],
  ["patron", "Patron", "$42", "Print folio, salon letters, and early essays"],
  ["library", "Library", "$96", "Institution seats, archive packs, and private briefings"],
]
const serifFaqItems = [
  ["Why this demo content?", "Serif systems are strongest for editorial products, luxury publishing, literature, architecture, and thoughtful commerce, so this preview uses a refined review journal."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles membership, departments and memberships are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses ivory paper, Playfair-style serif display type, burnished gold accents, small caps labels, rule lines, white cards, restrained shadows, and generous whitespace."],
]
const vaporwaveStats = [
  ["128", "active nodes"],
  ["04", "neon zones"],
  ["99%", "uptime signal"],
  ["∞", "grid depth"],
]
const vaporwaveNodes = [
  ["ZONE_01", "ARCADE GRID", "Plug into infinite synthwave arenas. Race the horizon before the grid resets at dawn.", "cyan"],
  ["ZONE_02", "NEON VAULT", "Store your digital artifacts in encrypted glass panels. Your data, your frequency.", "magenta"],
  ["ZONE_03", "PULSE RELAY", "Broadcast your signal across nodes. Real-time sync at the speed of neon light.", "orange"],
]
const vaporwavePlans = [
  ["ghost", "GHOST", "$19", "Solo runner access"],
  ["neon", "NEON", "$49", "Full grid + vault"],
  ["chrome", "CHROME", "$99", "All nodes + relay"],
]
const vaporwaveFaqItems = [
  ["Why this demo content?", "Vaporwave / Outrun is strongest for gaming, creative tools, music, and digital culture brands, so this preview uses a retro-futuristic grid platform."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles access state, zones and plans are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses void backgrounds, Orbitron headings, neon magenta and cyan glows, perspective grid floors, CRT scanlines, skewed buttons, terminal window chrome, and gradient text fills."],
]
const botanicalStats = [
  ["140+", "living varieties"],
  ["08", "seasonal rituals"],
  ["3yr", "sourcing care"],
  ["100%", "wild-grown"],
]
const botanicalCollections = [
  ["Forest Floor", "Ferns, mosses, and shade-loving perennials curated for interiors without direct light."],
  ["Sun Garden", "Heat-loving aromatics, flowering herbs, and trailing botanicals for south-facing spaces."],
  ["Water's Edge", "Calathea, peace lily, and moisture-loving species that thrive in humid corners."],
]
const botanicalPlans = [
  ["seed", "Seed", "$28", "Seasonal starter box and care notes"],
  ["grove", "Grove", "$54", "Monthly curation, care cards, and prints"],
  ["canopy", "Canopy", "$96", "Studio access, bespoke sourcing, and ritual kits"],
]
const botanicalFaqItems = [
  ["Why this demo content?", "Botanical Organic is strongest for wellness, garden, beauty, and curated lifestyle brands, so this preview uses a botanical studio membership."],
  ["What is interactive?", "Navigation jumps, the primary CTA toggles membership, collections and plans are selectable, and FAQ rows expand."],
  ["Which style details appear?", "The preview uses ivory paper, Playfair Display serif headlines, sage green accents, terracotta hover states, staggered organic cards, paper grain texture, pill buttons, and generous whitespace."],
]
const corporateTrustStats = [
  ["99.98%", "Trust uptime"],
  ["184ms", "Decision latency"],
  ["42k", "Audited events"],
  ["11", "Risk checks"],
]
const corporateTrustFeatures = [
  [
    "Governance",
    "Map approvals, owners, and release policy into one structured operating surface.",
    "Policy-ready",
  ],
  [
    "Assurance",
    "Surface the signals teams need before customers, finance, and legal ask for them.",
    "Live checks",
  ],
  [
    "Momentum",
    "Keep enterprise polish while helping product teams move from draft to launch.",
    "Fast path",
  ],
]
const corporateTrustPlans = [
  ["team", "Team", "$49", "Shared workspace, templates, and approval flows"],
  ["business", "Business", "$129", "Audit-ready controls, SSO, and usage review"],
  ["enterprise", "Enterprise", "Custom", "Security reviews, procurement, and governance"],
]
const corporateTrustFaqItems = [
  [
    "Why this demo content?",
    "Corporate Trust is strongest for enterprise SaaS, governance, onboarding, and executive-ready product pages, so this preview uses a release assurance platform.",
  ],
  [
    "What is interactive?",
    "Navigation jumps, the launch CTA toggles state, feature cards and plans are selectable, and FAQ rows expand.",
  ],
  [
    "Which signature details appear?",
    "The preview uses indigo-to-violet CTAs, blue-tinted shadows, dimensional cards, warm enterprise copy, crisp typography, and emerald assurance signals.",
  ],
]
const handDrawnStats = [
  ["42", "sticky ideas"],
  ["08", "rough sketches"],
  ["3min", "first draft"],
  ["0", "perfect lines"],
]
const handDrawnCards = [
  ["Brainstorm wall", "Collect scattered ideas as taped notes with playful rotation and marker labels.", "tape"],
  ["Napkin map", "Turn a fuzzy plan into a sketchy flow that still feels useful and clear.", "tack"],
  ["Classroom mode", "Make product guidance approachable with friendly shapes and handwritten rhythm.", "tape"],
]
const handDrawnPlans = [
  ["starter", "Starter Note", "$12", "One sketchbook workspace"],
  ["studio", "Studio Wall", "$38", "Shared boards and prompt kits"],
  ["school", "Class Pack", "$84", "Team templates and review flows"],
]
const handDrawnFaqItems = [
  [
    "Why this demo content?",
    "Hand Drawn works best for brainstorming, education, creative tools, and early concepting, so this preview uses a collaborative sketchbook board.",
  ],
  [
    "What is interactive?",
    "Navigation jumps, the hero CTA presses flat, cards and plans are selectable, and FAQ notes expand.",
  ],
  [
    "Which signature details appear?",
    "The preview uses wobbly borders, hard offset shadows, paper grain, tape strips, thumbtacks, tiny rotations, and handwritten-style typography.",
  ],
]
const industrialStats = [
  ["98.7%", "system load"],
  ["042", "active relays"],
  ["12ms", "switch lag"],
  ["PWR", "online"],
]
const industrialModules = [
  ["Control Deck", "A raised chassis panel with screw heads, vent slots, and tactile hardware controls.", "RUN"],
  ["Signal Screen", "A recessed CRT-style monitor with scanlines, telemetry, and status LEDs.", "SYNC"],
  ["Relay Bay", "A modular routing unit that makes every decision feel bolted into place.", "LOCK"],
]
const industrialPlans = [
  ["bench", "Bench Unit", "$29", "Single operator control deck"],
  ["rack", "Rack System", "$79", "Team relays and audit panels"],
  ["factory", "Factory Grid", "$190", "Governance, telemetry, and SSO"],
]
const industrialFaqItems = [
  [
    "Why this demo content?",
    "Industrial Skeuomorphism is strongest for technical products, monitoring, hardware-adjacent tools, and operational dashboards, so this preview uses a tactile control console.",
  ],
  [
    "What is interactive?",
    "Navigation jumps, the power switch depresses, modules and plans are selectable, and diagnostic rows expand.",
  ],
  [
    "Which signature details appear?",
    "The preview uses neumorphic chassis shadows, recessed screens, LEDs, screw heads, vent slots, scanlines, safety red controls, and monospace labels.",
  ],
]
const neumorphismStats = [
  ["9px", "raised depth"],
  ["10px", "inset well"],
  ["300ms", "soft motion"],
  ["AA", "contrast"],
]
const neumorphismFeatures = [
  ["Icon Wells", "Deep carved pockets hold status glyphs while the outer cards rise from the same cool-grey surface.", "01"],
  ["Soft Inputs", "Search and control fields stay monochrome, using inset shadows and violet focus rings for clarity.", "02"],
  ["Nested Depth", "Concentric surfaces alternate raised and pressed states so the visual feels molded, not layered.", "03"],
]
const neumorphismPlans = [
  ["solo", "Solo Mold", "$18", "A tactile workspace for one"],
  ["team", "Team Surface", "$54", "Shared boards and depth presets"],
  ["studio", "Studio Clay", "$128", "Design tokens, QA, and audit trails"],
]
const neumorphismFaqItems = [
  [
    "Why this demo content?",
    "Neumorphism is strongest for calm productivity surfaces, controls, device-like dashboards, and settings tools, so this preview uses a soft workspace console.",
  ],
  [
    "What is interactive?",
    "Navigation jumps, the primary control toggles a pressed state, feature cards and plans are selectable, and FAQ wells expand.",
  ],
  [
    "Which signature details appear?",
    "The preview uses cool-grey same-surface backgrounds, opposing RGB shadows, deep inset wells, rounded controls, accent focus states, and nested depth circles.",
  ],
]
const organicStats = [
  ["04", "seasonal notes"],
  ["32", "native species"],
  ["7min", "quiet setup"],
  ["0", "sharp corners"],
]
const organicFeatures = [
  ["Rice Paper Base", "A soft off-white surface with visible grain keeps the whole interface tactile and warm.", "grain"],
  ["Moss Actions", "Pill controls use grounded green, soft shadows, and gentle scale instead of digital sharpness.", "moss"],
  ["Clay Layers", "Asymmetric cards and terracotta accents create the feel of handmade labels and small studio objects.", "clay"],
]
const organicPlans = [
  ["seed", "Seed Journal", "$16", "For one quiet garden log"],
  ["grove", "Grove Studio", "$48", "Shared rituals and seasonal boards"],
  ["forest", "Forest Circle", "$120", "Guided systems, reviews, and archives"],
]
const organicFaqItems = [
  [
    "Why this demo content?",
    "Organic / Natural systems fit sustainability, wellness, gardening, slow commerce, and handcrafted tools, so this preview uses a seasonal garden studio.",
  ],
  [
    "What is interactive?",
    "Navigation jumps, the hero CTA toggles a soft pressed state, feature cards and plans are selectable, and FAQ notes expand.",
  ],
  [
    "Which signature details appear?",
    "The preview uses rice-paper texture, moss and terracotta color, amorphous blobs, organic border radii, rotated frames, soft colored shadows, and gentle hover motion.",
  ],
]
const retro90sRows = [
  ["01", "Guestbook", "Collect visitor notes with a proud blue hyperlink trail.", "HOT"],
  ["02", "Download Zone", "Ship badges, counters, and goofy homepage widgets.", "NEW"],
  ["03", "Web Ring", "Connect friendly sites with dense table-like navigation.", "WOW"],
]
const retro90sPlans = [
  ["home", "Personal Page", "$9", "1 animated banner + guestbook"],
  ["club", "Fan Club", "$19", "Web ring, counters, and banners"],
  ["portal", "Mega Portal", "$49", "Directory tables and bonus buttons"],
]
const retro90sFaqItems = [
  [
    "Why this demo content?",
    "Retro / 90s Nostalgia is strongest for playful launches, fan hubs, nostalgic tools, and deliberately loud campaign pages, so this preview uses a GeoCities-style homepage kit.",
  ],
  [
    "What is interactive?",
    "Navigation jumps, the install button toggles state, rows and plans are selectable, and FAQ windows expand with pressed 90s controls.",
  ],
  [
    "Which signature details appear?",
    "The preview uses tiled gray backgrounds, beveled buttons, marquee text, rainbow headings, Windows title bars, hit counters, blue links, color squares, groove rules, and construction stripes.",
  ],
]

function TemplateCard(props: {
  template: PromptTemplate
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      class="prompt-template-card"
      data-selected={props.selected ? "true" : undefined}
      onClick={props.onSelect}
    >
      <span class="prompt-swatch" data-swatch={props.template.swatch}>
        <span />
      </span>
      <span class="prompt-template-copy">
        <span>{props.template.name}</span>
        <small>{props.template.mode}</small>
      </span>
      <span class="prompt-template-index">{props.template.index}</span>
    </button>
  )
}

function FilterButton(props: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" class="prompt-filter" data-active={props.active ? "true" : undefined} onClick={props.onClick}>
      {props.children}
    </button>
  )
}

function MonochromeDemo() {
  const [store, setStore] = createStore({
    styleSelected: false,
    tier: "atelier",
    openFaq: "Can I use this prompt directly?",
  })

  const jump = (id: string) => {
    document.getElementById(`mono-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="mono-demo">
      <header class="mono-site-nav">
        <div class="mono-brand">ZINGPOP MONO</div>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("features")}>
            Rules
          </button>
          <button type="button" onClick={() => jump("pricing")}>
            Kits
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="mono-hero" id="mono-top">
        <div class="mono-available">
          <span />
          Prompt Style 01
        </div>
        <h1>Shape every prompt into product-grade UI</h1>
        <div class="mono-rule-mark">
          <span />
          <i />
        </div>
        <p>
          Zingpop turns design-system prompts into inspectable interface examples, so users can feel the style before
          they copy it into an assistant.
        </p>
        <div class="mono-actions">
          <button
            type="button"
            class="mono-primary"
            data-active={store.styleSelected ? "true" : undefined}
            onClick={() => setStore("styleSelected", !store.styleSelected)}
          >
            {store.styleSelected ? "Style Selected" : "Use This Style"} <span>{"->"}</span>
          </button>
          <button type="button" class="mono-secondary" onClick={() => jump("features")}>
            View Rules
          </button>
        </div>
      </section>

      <section class="mono-section mono-features" id="mono-features">
        <div class="mono-section-kicker">RULES</div>
        <h2>A prompt board that proves the style.</h2>
        <div class="mono-card-grid">
          <For each={featureCards}>
            {(card) => (
              <article class="mono-feature-card">
                <span>{card[0]}</span>
                <h3>{card[1]}</h3>
                <p>{card[2]}</p>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="mono-stats">
        <For each={stats}>
          {(item) => (
            <div>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </div>
          )}
        </For>
      </section>

      <section class="mono-section mono-detail">
        <div class="mono-section-kicker">PRODUCT DETAIL</div>
        <h2>Every prompt becomes a working surface.</h2>
        <p>
          <span>Z</span>
          ingpop keeps each style prompt paired with a live interface case: large decisions, small metadata, hard rules,
          and interactive states that invert instantly when the user needs certainty.
        </p>
      </section>

      <section class="mono-section mono-pricing" id="mono-pricing">
        <div class="mono-section-kicker">KITS</div>
        <h2>Choose a reusable prompt kit.</h2>
        <div class="mono-price-grid">
          <For each={["studio", "atelier", "archive"]}>
            {(tier) => (
              <button
                type="button"
                class="mono-price-card"
                data-selected={store.tier === tier ? "true" : undefined}
                onClick={() => setStore("tier", tier)}
              >
                <span>{tier}</span>
                <strong>{tier === "studio" ? "01" : tier === "atelier" ? "30" : "oo"}</strong>
                <small>{tier === "studio" ? "single style" : tier === "atelier" ? "template batch" : "custom library"}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="mono-section mono-faq" id="mono-faq">
        <div class="mono-section-kicker">FAQ</div>
        <For each={faqItems}>
          {(item) => (
            <article>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function DopamineDemo() {
  const [store, setStore] = createStore({
    rsvp: false,
    ticket: "night",
    openFaq: "Is it actually interactive?",
  })

  const jump = (id: string) => {
    document.getElementById(`dopamine-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="dopamine-demo">
      <div class="dopamine-bg-word" aria-hidden="true">
        WOW
      </div>
      <div class="dopamine-shape dopamine-shape-one" aria-hidden="true">
        ✦
      </div>
      <div class="dopamine-shape dopamine-shape-two" aria-hidden="true">
        ★
      </div>
      <div class="dopamine-shape dopamine-shape-three" aria-hidden="true">
        ⚡
      </div>

      <header class="dopamine-nav">
        <button type="button" class="dopamine-logo" onClick={() => jump("top")}>
          POP!LAB
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("rooms")}>
            Rooms
          </button>
          <button type="button" onClick={() => jump("tickets")}>
            Tickets
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="dopamine-hero" id="dopamine-top">
        <div class="dopamine-pill">Hyperpop Weekender</div>
        <h1>
          Neon noise, candy visuals, <span>maximum joy</span>
        </h1>
        <p>
          A two-night playable music fair for synth makers, zine collectors, remix crews, and anyone who thinks quiet
          pages should be illegal.
        </p>
        <div class="dopamine-actions">
          <button
            type="button"
            class="dopamine-primary"
            data-active={store.rsvp ? "true" : undefined}
            onClick={() => setStore("rsvp", !store.rsvp)}
          >
            {store.rsvp ? "You are glowing" : "Grab a pass"}
          </button>
          <button type="button" class="dopamine-secondary" onClick={() => jump("rooms")}>
            Explore rooms
          </button>
        </div>
      </section>

      <section class="dopamine-stats" aria-label="Event stats">
        <For each={dopamineStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="dopamine-section" id="dopamine-rooms">
        <div class="dopamine-section-label">Rooms that shout back</div>
        <h2>Pattern on pattern, beat on beat.</h2>
        <div class="dopamine-card-grid">
          <For each={dopamineCards}>
            {(card) => (
              <article class="dopamine-card">
                <div>{card[0]}</div>
                <h3>{card[1]}</h3>
                <p>{card[2]}</p>
                <button type="button">{card[3]}</button>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="dopamine-section dopamine-ticket-section" id="dopamine-tickets">
        <div class="dopamine-section-label">Choose your chaos</div>
        <h2>
          Pick the pass with the <span>loudest</span> shadow.
        </h2>
        <div class="dopamine-ticket-grid">
          <For each={dopamineTickets}>
            {(ticket) => (
              <button
                type="button"
                class="dopamine-ticket"
                data-selected={store.ticket === ticket[0] ? "true" : undefined}
                onClick={() => setStore("ticket", ticket[0])}
              >
                <span>{ticket[1]}</span>
                <strong>{ticket[2]}</strong>
                <small>{ticket[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="dopamine-section dopamine-faq" id="dopamine-faq">
        <div class="dopamine-section-label">Tiny questions, giant borders</div>
        <For each={dopamineFaqItems}>
          {(item) => (
            <article>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "Close" : "Open"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function BauhausLogo() {
  return (
    <span class="bauhaus-logo-mark" aria-hidden="true">
      <i />
      <b />
      <em />
    </span>
  )
}

function BauhausComposition() {
  return (
    <div class="bauhaus-composition" aria-hidden="true">
      <span class="bauhaus-circle" />
      <span class="bauhaus-square" />
      <span class="bauhaus-small-square" />
      <span class="bauhaus-triangle" />
      <span class="bauhaus-line" />
    </div>
  )
}

function BauhausDemo() {
  const [store, setStore] = createStore({
    enrolled: false,
    pass: "studio",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`bauhaus-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="bauhaus-demo">
      <header class="bauhaus-nav">
        <button type="button" class="bauhaus-brand" onClick={() => jump("top")}>
          <BauhausLogo />
          FORMHAUS
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("workshops")}>
            Workshops
          </button>
          <button type="button" onClick={() => jump("passes")}>
            Passes
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="bauhaus-hero" id="bauhaus-top">
        <div class="bauhaus-hero-copy">
          <div class="bauhaus-kicker">Prompt Style 03 / Bauhaus</div>
          <h1>Build clear interface systems.</h1>
          <p>
            A geometric workshop page for designers who want functional screens with primary color, hard structure, and
            mechanical interaction.
          </p>
          <div class="bauhaus-actions">
            <button
              type="button"
              class="bauhaus-button bauhaus-button-red"
              data-active={store.enrolled ? "true" : undefined}
              onClick={() => setStore("enrolled", !store.enrolled)}
            >
              {store.enrolled ? "Enrolled" : "Enroll Now"}
            </button>
            <button type="button" class="bauhaus-button bauhaus-button-outline" onClick={() => jump("workshops")}>
              View Program
            </button>
          </div>
        </div>
        <div class="bauhaus-hero-art">
          <BauhausComposition />
        </div>
      </section>

      <section class="bauhaus-stats" aria-label="Bauhaus principles">
        <For each={bauhausStats}>
          {(item, index) => (
            <article data-shape={index() % 3 === 0 ? "circle" : index() % 3 === 1 ? "square" : "diamond"}>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="bauhaus-section bauhaus-workshops" id="bauhaus-workshops">
        <div class="bauhaus-kicker">Constructed curriculum</div>
        <h2>Three exercises. One strict visual grammar.</h2>
        <div class="bauhaus-card-grid">
          <For each={bauhausWorkshops}>
            {(item) => (
              <article class="bauhaus-card" data-color={item[2]}>
                <span />
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
                <button type="button">Open Module</button>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="bauhaus-section bauhaus-product">
        <div>
          <div class="bauhaus-kicker">Product detail</div>
          <h2>Every control has a visible construction.</h2>
          <p>
            No hidden polish, no soft blur. Cards, buttons, and content blocks declare their edges through black rules,
            primary planes, and offset layers that feel physical.
          </p>
        </div>
        <BauhausComposition />
      </section>

      <section class="bauhaus-section bauhaus-passes" id="bauhaus-passes">
        <div class="bauhaus-kicker">Workshop passes</div>
        <h2>Select a pass.</h2>
        <div class="bauhaus-pass-grid">
          <For each={bauhausPasses}>
            {(pass) => (
              <button
                type="button"
                class="bauhaus-pass"
                data-selected={store.pass === pass[0] ? "true" : undefined}
                onClick={() => setStore("pass", pass[0])}
              >
                <span>{pass[1]}</span>
                <strong>{pass[2]}</strong>
                <small>{pass[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="bauhaus-section bauhaus-faq" id="bauhaus-faq">
        <div class="bauhaus-kicker">Questions</div>
        <For each={bauhausFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "Up" : "Down"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function LinearDemo() {
  const [store, setStore] = createStore({
    launched: false,
    plan: "scale",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`linear-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="linear-demo">
      <div class="linear-blob linear-blob-one" aria-hidden="true" />
      <div class="linear-blob linear-blob-two" aria-hidden="true" />
      <div class="linear-blob linear-blob-three" aria-hidden="true" />

      <header class="linear-nav">
        <button type="button" class="linear-brand" onClick={() => jump("top")}>
          <span />
          NEXUS
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("features")}>
            Features
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="linear-hero" id="linear-top">
        <div class="linear-hero-copy">
          <div class="linear-pill">Realtime deploy intelligence</div>
          <h1>
            Ship from a precise <span>command center.</span>
          </h1>
          <p>
            Nexus gives engineering teams a cinematic control plane for deploys, incidents, and release decisions
            without sacrificing speed.
          </p>
          <div class="linear-actions">
            <button
              type="button"
              class="linear-primary"
              data-active={store.launched ? "true" : undefined}
              onClick={() => setStore("launched", !store.launched)}
            >
              {store.launched ? "Launch armed" : "Arm launch"}
            </button>
            <button type="button" class="linear-secondary" onClick={() => jump("features")}>
              Explore surface
            </button>
          </div>
        </div>

        <div class="linear-console" aria-label="Preview command console">
          <div class="linear-window-bar">
            <span />
            <span />
            <span />
            <strong>deploy.preview</strong>
          </div>
          <div class="linear-terminal">
            <div>
              <span>main</span>
              <b>Ready for production</b>
            </div>
            <pre>{">"} nexus deploy --target production</pre>
            <pre>checks passed: types, tests, latency budget</pre>
            <pre>edge regions warmed: sfo, iad, fra, sin</pre>
          </div>
          <div class="linear-progress">
            <span style={{ width: store.launched ? "92%" : "64%" }} />
          </div>
        </div>
      </section>

      <section class="linear-metrics" aria-label="Platform metrics">
        <For each={linearMetrics}>
          {(item) => (
            <article class="linear-card">
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="linear-section" id="linear-features">
        <div class="linear-section-head">
          <div class="linear-pill">Bento system</div>
          <h2>Everything responds with precise depth.</h2>
        </div>
        <div class="linear-bento">
          <For each={linearFeatures}>
            {(item) => (
              <article class="linear-card linear-feature-card" data-size={item[2]}>
                <span class="linear-card-glow" />
                <small>{item[0]}</small>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="linear-section linear-plans" id="linear-plans">
        <div class="linear-section-head">
          <div class="linear-pill">Access tiers</div>
          <h2>Select an operating mode.</h2>
        </div>
        <div class="linear-plan-grid">
          <For each={linearPlans}>
            {(plan) => (
              <button
                type="button"
                class="linear-card linear-plan"
                data-selected={store.plan === plan[0] ? "true" : undefined}
                onClick={() => setStore("plan", plan[0])}
              >
                <span>{plan[1]}</span>
                <strong>{plan[2]}</strong>
                <small>{plan[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="linear-section linear-faq" id="linear-faq">
        <div class="linear-section-head">
          <div class="linear-pill">Implementation notes</div>
        </div>
        <For each={linearFaqItems}>
          {(item) => (
            <article class="linear-card" data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "Hide" : "Show"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function NewsprintDemo() {
  const [store, setStore] = createStore({
    subscribed: false,
    section: "Markets",
    openFaq: "Why this preview content?",
  })

  const jump = (id: string) => {
    document.getElementById(`newsprint-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="newsprint-demo">
      <header class="newsprint-header" id="newsprint-top">
        <div class="newsprint-meta">Vol. 05 | Morning Edition | Interface City</div>
        <div class="newsprint-masthead">
          <button type="button" onClick={() => jump("top")}>
            The Interface Gazette
          </button>
        </div>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("briefs")}>
            Briefs
          </button>
          <button type="button" onClick={() => jump("sections")}>
            Sections
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <div class="newsprint-ticker" aria-label="News ticker">
        <div>
          <For each={newsprintTicker}>
            {(item) => (
              <span>
                <b>Alert</b>
                {item}
              </span>
            )}
          </For>
        </div>
      </div>

      <section class="newsprint-hero newsprint-texture">
        <article class="newsprint-lead">
          <div class="newsprint-label">Lead story</div>
          <h1>Structured screens make complex work readable.</h1>
          <p>
            <span>D</span>
            esign teams are returning to the discipline of visible structure: columns, borders, metadata, and headlines
            that can be scanned under pressure.
          </p>
          <div class="newsprint-actions">
            <button
              type="button"
              class="newsprint-primary"
              data-active={store.subscribed ? "true" : undefined}
              onClick={() => setStore("subscribed", !store.subscribed)}
            >
              {store.subscribed ? "Subscribed" : "Subscribe"}
            </button>
            <button type="button" class="newsprint-secondary" onClick={() => jump("briefs")}>
              Read briefs
            </button>
          </div>
        </article>
        <aside class="newsprint-sidebar">
          <div class="newsprint-label">Editor's desk</div>
          <h2>Today's column</h2>
          <p>
            The most useful screen is not always the softest screen. Sometimes a hard rule, a short label, and one red
            word carry the whole hierarchy.
          </p>
          <div class="newsprint-photo" role="img" aria-label="Halftone editorial image placeholder">
            <span>Fig. A</span>
          </div>
        </aside>
      </section>

      <section class="newsprint-briefs" id="newsprint-briefs">
        <For each={newsprintBriefs}>
          {(item) => (
            <article>
              <span>{item[0]}</span>
              <p>{item[1]}</p>
            </article>
          )}
        </For>
      </section>

      <section class="newsprint-inverted">
        <div class="newsprint-label">How it works</div>
        <div class="newsprint-step-grid">
          <article>
            <b>01</b>
            <h3>Frame the lead</h3>
            <p>Establish hierarchy with one dominant story and strict surrounding columns.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Print the grid</h3>
            <p>Let borders carry structure so the reader never loses their place.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Use red once</h3>
            <p>Reserve emphasis for urgent labels, CTAs, and selected states.</p>
          </article>
        </div>
      </section>

      <section class="newsprint-sections" id="newsprint-sections">
        <div class="newsprint-label">Choose edition desk</div>
        <div class="newsprint-section-grid">
          <For each={newsprintSections}>
            {(item) => (
              <button
                type="button"
                data-selected={store.section === item[0] ? "true" : undefined}
                onClick={() => setStore("section", item[0])}
              >
                <span>{item[0]}</span>
                <small>{item[1]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <div class="newsprint-ornament" aria-hidden="true">
        * * *
      </div>

      <section class="newsprint-faq" id="newsprint-faq">
        <div class="newsprint-label">Reader questions</div>
        <For each={newsprintFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "+" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>

      <footer class="newsprint-footer">Edition: Vol 5.0 | Printed for the prompt archive | Archive No. 0005</footer>
    </div>
  )
}

function ModernDemo() {
  const [store, setStore] = createStore({
    started: false,
    plan: "studio",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`modern-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="modern-demo">
      <header class="modern-nav">
        <button type="button" class="modern-brand" onClick={() => jump("top")}>
          <span />
          LumaLab
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("features")}>
            Features
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="modern-hero" id="modern-top">
        <div class="modern-hero-copy">
          <div class="modern-badge">
            <span />
            Growth OS
          </div>
          <h1>
            Minimal systems for bold <span>experiments.</span>
          </h1>
          <p>
            LumaLab helps product teams turn scattered customer signals into crisp experiments, polished narratives, and
            measurable launches.
          </p>
          <div class="modern-actions">
            <button
              type="button"
              class="modern-primary"
              data-active={store.started ? "true" : undefined}
              onClick={() => setStore("started", !store.started)}
            >
              {store.started ? "Workspace ready" : "Start workspace"}
              <span>{"->"}</span>
            </button>
            <button type="button" class="modern-secondary" onClick={() => jump("features")}>
              View features
            </button>
          </div>
        </div>
        <div class="modern-hero-graphic" aria-label="Animated experiment dashboard preview">
          <div class="modern-ring" aria-hidden="true" />
          <article class="modern-float-card modern-float-one">
            <span>Live signal</span>
            <strong>+28%</strong>
          </article>
          <article class="modern-float-card modern-float-two">
            <span>Variant B</span>
            <strong>Wins</strong>
          </article>
          <div class="modern-dot-grid" aria-hidden="true" />
        </div>
      </section>

      <section class="modern-stats" aria-label="Product outcomes">
        <For each={modernStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="modern-section" id="modern-features">
        <div class="modern-badge">
          <span />
          Feature set
        </div>
        <h2>
          Clarity for every <span>launch loop.</span>
        </h2>
        <div class="modern-feature-grid">
          <For each={modernFeatures}>
            {(item, index) => (
              <article class="modern-card">
                <div>{index() + 1}</div>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="modern-timeline">
        <div class="modern-badge">
          <span />
          Method
        </div>
        <div class="modern-step-grid">
          <For each={modernSteps}>
            {(item) => (
              <article>
                <strong>{item[0]}</strong>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="modern-section modern-plans" id="modern-plans">
        <div class="modern-badge">
          <span />
          Plans
        </div>
        <h2>Select your operating rhythm.</h2>
        <div class="modern-plan-grid">
          <For each={modernPlans}>
            {(plan) => (
              <button
                type="button"
                class="modern-plan"
                data-selected={store.plan === plan[0] ? "true" : undefined}
                onClick={() => setStore("plan", plan[0])}
              >
                <span>{plan[1]}</span>
                <strong>{plan[2]}</strong>
                <small>{plan[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="modern-section modern-faq" id="modern-faq">
        <div class="modern-badge">
          <span />
          Questions
        </div>
        <For each={modernFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function LuxuryDemo() {
  const [store, setStore] = createStore({
    requested: false,
    collection: "No. 02",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`luxury-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="luxury-demo">
      <div class="luxury-gridline luxury-gridline-one" aria-hidden="true" />
      <div class="luxury-gridline luxury-gridline-two" aria-hidden="true" />
      <div class="luxury-gridline luxury-gridline-three" aria-hidden="true" />
      <div class="luxury-gridline luxury-gridline-four" aria-hidden="true" />

      <header class="luxury-nav">
        <button type="button" class="luxury-brand" onClick={() => jump("top")}>
          Maison Aurel
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("collection")}>
            Collection
          </button>
          <button type="button" onClick={() => jump("journal")}>
            Journal
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="luxury-hero" id="luxury-top">
        <div class="luxury-vertical-label">Editorial / Vol. 07</div>
        <div class="luxury-hero-copy">
          <div class="luxury-overline">
            <span />
            Limited seasonal edition
          </div>
          <h1>
            Curated <em>silence</em> for rooms that linger.
          </h1>
          <p>
            Maison Aurel composes restrained fragrances for private interiors, made in small numbered runs and archived
            like objects of memory.
          </p>
          <div class="luxury-actions">
            <button
              type="button"
              class="luxury-primary"
              data-active={store.requested ? "true" : undefined}
              onClick={() => setStore("requested", !store.requested)}
            >
              <span />
              <b>{store.requested ? "Request Sent" : "Request Viewing"}</b>
            </button>
            <button type="button" class="luxury-secondary" onClick={() => jump("collection")}>
              View collection
            </button>
          </div>
        </div>
        <div class="luxury-image luxury-hero-image" role="img" aria-label="Editorial fragrance still life">
          <span>No. 07</span>
        </div>
      </section>

      <section class="luxury-stats" aria-label="Maison details">
        <For each={luxuryStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="luxury-section luxury-detail">
        <div>
          <div class="luxury-overline">
            <span />
            Material notes
          </div>
          <h2>
            The <em>details</em> are quiet by design.
          </h2>
        </div>
        <p>
          <span>E</span>
          ach edition is built from a narrow olfactory palette, held in matte glass and wrapped in uncoated stock. The
          interface mirrors that restraint: lines, silence, shadow, and a single glint of gold.
        </p>
      </section>

      <section class="luxury-section luxury-collection" id="luxury-collection">
        <div class="luxury-overline">
          <span />
          Collection
        </div>
        <div class="luxury-collection-grid">
          <For each={luxuryCollections}>
            {(item) => (
              <button
                type="button"
                data-selected={store.collection === item[0] ? "true" : undefined}
                onClick={() => setStore("collection", item[0])}
              >
                <small>{item[0]}</small>
                <strong>{item[1]}</strong>
                <span>{item[2]}</span>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="luxury-journal" id="luxury-journal">
        <div class="luxury-image luxury-journal-image" role="img" aria-label="Editorial journal image">
          <span>Fig. II</span>
        </div>
        <article>
          <div class="luxury-overline">
            <span />
            Journal
          </div>
          <h2>
            On the ritual of <em>arrival.</em>
          </h2>
          <p>
            A room announces itself slowly: first by light, then texture, then the faintest trace of cedar and linen.
            The web page should behave the same way.
          </p>
        </article>
      </section>

      <section class="luxury-section luxury-faq" id="luxury-faq">
        <div class="luxury-overline">
          <span />
          Notes
        </div>
        <For each={luxuryFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>{store.openFaq === item[0] ? "+" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function TerminalDemo() {
  const [store, setStore] = createStore({
    running: false,
    mode: "deploy",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`terminal-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="terminal-demo">
      <header class="terminal-nav" id="terminal-top">
        <button type="button" class="terminal-logo" onClick={() => jump("top")}>
          <pre>{String.raw`  ____  _   _ 
 / ___|| | | |
 \___ \| |_| |
  ___) |  _  |
 |____/|_| |_|`}</pre>
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("status")}>
            ./status
          </button>
          <button type="button" onClick={() => jump("modes")}>
            ./modes
          </button>
          <button type="button" onClick={() => jump("faq")}>
            ./help
          </button>
        </nav>
      </header>

      <section class="terminal-hero">
        <div class="terminal-pane terminal-main-pane">
          <div class="terminal-pane-title">+--- SECURE SHELL // SESSION 08 ---+</div>
          <div class="terminal-hero-line">root@sector:~$ boot sequence --style terminal_cli</div>
          <h1>
            SYSTEM ONLINE<span class="terminal-cursor">_</span>
          </h1>
          <p>
            {">"} a brutally functional command surface for audits, deploys, rollbacks, and raw operational visibility.
          </p>
          <div class="terminal-actions">
            <button
              type="button"
              class="terminal-button"
              data-active={store.running ? "true" : undefined}
              onClick={() => setStore("running", !store.running)}
            >
              [{store.running ? " RUNNING " : " INITIATE "}]
            </button>
            <button type="button" class="terminal-button terminal-button-secondary" onClick={() => jump("status")}>
              [ STATUS ]
            </button>
          </div>
        </div>
        <div class="terminal-pane terminal-log-pane">
          <div class="terminal-pane-title">+--- LIVE LOG ---+</div>
          <pre>
            {`[OK]  handshake accepted
[OK]  loading environment
[WARN] stale cache detected
[OK]  ${store.mode} mode armed
${store.running ? "[RUN] executing selected task" : "[IDLE] waiting for input"}
user@sector:~$ `}
            <span class="terminal-block" />
          </pre>
        </div>
      </section>

      <section class="terminal-status" id="terminal-status">
        <For each={terminalStats}>
          {(item) => (
            <article class="terminal-pane">
              <div class="terminal-pane-title">+--- {item[0]} ---+</div>
              <strong>{item[1]}</strong>
              <span>[OK] telemetry stable</span>
            </article>
          )}
        </For>
      </section>

      <section class="terminal-section" id="terminal-modes">
        <div class="terminal-pane-title">+--- SELECT COMMAND FLAG ---+</div>
        <div class="terminal-mode-grid">
          <For each={terminalModes}>
            {(item) => (
              <button
                type="button"
                class="terminal-pane terminal-mode"
                data-selected={store.mode === item[0] ? "true" : undefined}
                onClick={() => setStore("mode", item[0])}
              >
                <span>{item[1]}</span>
                <small>{item[2]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="terminal-section terminal-map">
        <div class="terminal-pane terminal-map-pane">
          <div class="terminal-pane-title">+--- NODE MAP ---+</div>
          <pre>{String.raw`edge-sfo  [OK] ----\
edge-iad  [OK] -----+---- origin-core [OK]
edge-fra  [OK] ----/
edge-sin  [ERR] --- retry --count 03`}</pre>
        </div>
      </section>

      <section class="terminal-section terminal-faq" id="terminal-faq">
        <div class="terminal-pane-title">+--- MAN PAGE ---+</div>
        <For each={terminalFaqItems}>
          {(item) => (
            <article class="terminal-pane" data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {">"} {item[0]}
                <span>{store.openFaq === item[0] ? "[CLOSE]" : "[OPEN]"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function SwissDemo() {
  const [store, setStore] = createStore({
    active: false,
    route: "center",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`swiss-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="swiss-demo">
      <header class="swiss-nav" id="swiss-top">
        <button type="button" class="swiss-brand" onClick={() => jump("top")}>
          SYSTM/09
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("system")}>
            System
          </button>
          <button type="button" onClick={() => jump("routes")}>
            Routes
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="swiss-hero">
        <div class="swiss-hero-copy">
          <div class="swiss-label">
            <span>01.</span> International Typographic System
          </div>
          <h1>Cultural wayfinding index.</h1>
          <p>
            Objective communication for exhibition halls, transit paths, archive access, and public information points.
          </p>
          <div class="swiss-actions">
            <button
              type="button"
              class="swiss-primary"
              data-active={store.active ? "true" : undefined}
              onClick={() => setStore("active", !store.active)}
            >
              {store.active ? "Index active" : "Activate index"}
            </button>
            <button type="button" class="swiss-secondary" onClick={() => jump("system")}>
              Read system
            </button>
          </div>
        </div>
        <div class="swiss-composition" aria-hidden="true">
          <span class="swiss-red-block" />
          <span class="swiss-black-line" />
          <span class="swiss-circle" />
          <span class="swiss-square" />
        </div>
      </section>

      <section class="swiss-stats" aria-label="System statistics">
        <For each={swissStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
              <b>+</b>
            </article>
          )}
        </For>
      </section>

      <section class="swiss-section" id="swiss-system">
        <div class="swiss-section-head">
          <div class="swiss-label">
            <span>02.</span> System
          </div>
          <h2>Information before expression.</h2>
        </div>
        <div class="swiss-card-grid">
          <For each={swissSystems}>
            {(item) => (
              <article>
                <small>{item[0]}</small>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
                <b aria-hidden="true">+</b>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="swiss-routes" id="swiss-routes">
        <div class="swiss-label">
          <span>03.</span> Routes
        </div>
        <div class="swiss-route-grid">
          <For each={swissRoutes}>
            {(route) => (
              <button
                type="button"
                data-selected={store.route === route[0] ? "true" : undefined}
                onClick={() => setStore("route", route[0])}
              >
                <strong>{route[1]}</strong>
                <span>{route[2]}</span>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="swiss-section swiss-faq" id="swiss-faq">
        <div class="swiss-label">
          <span>04.</span> FAQ
        </div>
        <For each={swissFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>+</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function KineticDemo() {
  const [store, setStore] = createStore({
    locked: false,
    pass: "studio",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`kinetic-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="kinetic-demo">
      <header class="kinetic-nav" id="kinetic-top">
        <button type="button" onClick={() => jump("top")}>
          K/TYP
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("stats")}>
            Stats
          </button>
          <button type="button" onClick={() => jump("passes")}>
            Passes
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="kinetic-hero">
        <div class="kinetic-label">Festival / Moving Type / 10</div>
        <h1>
          TYPE
          <br />
          IN FLOW
        </h1>
        <p>
          A kinetic web program for designers, motion artists, and typographers who want motion without losing structure.
        </p>
        <div class="kinetic-actions">
          <button
            type="button"
            class="kinetic-primary"
            data-active={store.locked ? "true" : undefined}
            onClick={() => setStore("locked", !store.locked)}
          >
            {store.locked ? "Locked In" : "Get Pass"}
          </button>
          <button type="button" class="kinetic-outline" onClick={() => jump("stats")}>
            See Motion
          </button>
        </div>
        <div class="kinetic-bg-number" aria-hidden="true">
          10
        </div>
      </section>

      <div class="kinetic-marquee" aria-hidden="true">
        <div>
          <For each={kineticMarquee}>
            {(item) => (
              <span>
                {item}
                <b>/</b>
              </span>
            )}
          </For>
          <For each={kineticMarquee}>
            {(item) => (
              <span>
                {item}
                <b>/</b>
              </span>
            )}
          </For>
        </div>
      </div>

      <section class="kinetic-stats" id="kinetic-stats">
        <For each={kineticStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="kinetic-section">
        <div class="kinetic-section-head">
          <span>01 / Program</span>
          <h2>Posters that refuse to hold still.</h2>
        </div>
        <div class="kinetic-card-stack">
          <article>
            <b aria-hidden="true">01</b>
            <h3>Marquee Systems</h3>
            <p>Design looping type bands that maintain contrast, speed, and legibility.</p>
          </article>
          <article>
            <b aria-hidden="true">02</b>
            <h3>Scale Violence</h3>
            <p>Use massive numbers and viewport type without destroying responsive structure.</p>
          </article>
          <article>
            <b aria-hidden="true">03</b>
            <h3>Hard Inversion</h3>
            <p>Build hover states that flip the entire surface instead of whispering.</p>
          </article>
        </div>
      </section>

      <div class="kinetic-marquee kinetic-marquee-slow" aria-hidden="true">
        <div>
          <span>LOUD TYPOGRAPHY</span>
          <span>BRUTAL EDGES</span>
          <span>CONSTANT MOTION</span>
          <span>MOTION WEB</span>
          <span>LOUD TYPOGRAPHY</span>
          <span>BRUTAL EDGES</span>
        </div>
      </div>

      <section class="kinetic-section kinetic-passes" id="kinetic-passes">
        <div class="kinetic-section-head">
          <span>02 / Tickets</span>
          <h2>Select the pass that hits hardest.</h2>
        </div>
        <div class="kinetic-pass-grid">
          <For each={kineticPasses}>
            {(pass) => (
              <button
                type="button"
                data-selected={store.pass === pass[0] ? "true" : undefined}
                onClick={() => setStore("pass", pass[0])}
              >
                <span>{pass[1]}</span>
                <strong>{pass[2]}</strong>
                <small>{pass[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="kinetic-section kinetic-faq" id="kinetic-faq">
        <div class="kinetic-section-head">
          <span>03 / Help</span>
        </div>
        <For each={kineticFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>+</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function MaterialYouDemo() {
  const [store, setStore] = createStore({
    started: false,
    mood: "Calm",
    plan: "family",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`material-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="material-demo">
      <div class="material-blob material-blob-one" aria-hidden="true" />
      <div class="material-blob material-blob-two" aria-hidden="true" />
      <header class="material-nav">
        <button type="button" class="material-brand" onClick={() => jump("top")}>
          <span>Bloom</span>
          <small>Material You / 11</small>
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("features")}>
            Features
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="material-hero" id="material-top">
        <div class="material-hero-copy">
          <div class="material-chip-row" aria-label="Mood choices">
            <For each={["Calm", "Focus", "Restore"]}>
              {(item) => (
                <button
                  type="button"
                  class="material-chip"
                  data-active={store.mood === item ? "true" : undefined}
                  onClick={() => setStore("mood", item)}
                >
                  {item}
                </button>
              )}
            </For>
          </div>
          <h1>Plan a softer, smarter day.</h1>
          <p>
            Bloom turns calendar pressure, habits, and recovery time into a personal surface that feels adaptive instead
            of demanding.
          </p>
          <div class="material-actions">
            <button
              type="button"
              class="material-filled"
              data-active={store.started ? "true" : undefined}
              onClick={() => setStore("started", !store.started)}
            >
              {store.started ? "Routine started" : "Start routine"}
            </button>
            <button type="button" class="material-tonal" onClick={() => jump("features")}>
              View flow
            </button>
          </div>
        </div>

        <div class="material-phone" aria-label="Adaptive day preview">
          <div class="material-phone-head">
            <span>{store.mood}</span>
            <strong>Today</strong>
          </div>
          <div class="material-field">
            <span>Morning intention</span>
            <b>Design calmly, ship clearly</b>
          </div>
          <div class="material-progress">
            <span style={{ width: store.started ? "82%" : "54%" }} />
          </div>
          <div class="material-mini-grid">
            <article>
              <strong>2</strong>
              <span>Deep blocks</span>
            </article>
            <article>
              <strong>18m</strong>
              <span>Reset time</span>
            </article>
          </div>
        </div>
      </section>

      <section class="material-stats" aria-label="Planning statistics">
        <For each={materialStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="material-section" id="material-features">
        <div class="material-section-head">
          <span>Adaptive surfaces</span>
          <h2>Everything feels personal without losing structure.</h2>
        </div>
        <div class="material-feature-grid">
          <For each={materialFeatures}>
            {(item) => (
              <article class="material-card">
                <span aria-hidden="true" />
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </article>
            )}
          </For>
        </div>
      </section>

      <section class="material-section material-plans" id="material-plans">
        <div class="material-section-head">
          <span>Tonal plans</span>
          <h2>Choose a rhythm that matches your day.</h2>
        </div>
        <div class="material-plan-grid">
          <For each={materialPlans}>
            {(item) => (
              <button
                type="button"
                class="material-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="material-section material-faq" id="material-faq">
        <div class="material-section-head">
          <span>Details</span>
        </div>
        <For each={materialFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>+</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function NeoBrutalDemo() {
  const [store, setStore] = createStore({
    armed: false,
    card: "02",
    pack: "crew",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`neo-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="neo-demo">
      <div class="neo-bg-word" aria-hidden="true">
        BUILD
      </div>
      <header class="neo-nav">
        <button type="button" class="neo-brand" onClick={() => jump("top")}>
          <span>SPRINT LAB</span>
          <small>Neo Brutal / 12</small>
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("cards")}>
            Cards
          </button>
          <button type="button" onClick={() => jump("packs")}>
            Packs
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="neo-hero" id="neo-top">
        <div class="neo-hero-copy">
          <div class="neo-sticker">No soft launches</div>
          <h1>Ship rough work with visible rules.</h1>
          <p>
            Sprint Lab gives creative teams a loud, tactile board for launch tasks, critique rituals, and decisions that
            should never disappear into gray UI.
          </p>
          <div class="neo-actions">
            <button
              type="button"
              class="neo-primary"
              data-active={store.armed ? "true" : undefined}
              onClick={() => setStore("armed", !store.armed)}
            >
              {store.armed ? "Board armed" : "Arm board"}
            </button>
            <button type="button" class="neo-secondary" onClick={() => jump("cards")}>
              Open cards
            </button>
          </div>
        </div>

        <div class="neo-board" aria-label="Sprint board preview">
          <div class="neo-board-bar">LIVE / ISSUE STACK</div>
          <article>
            <span>Owner</span>
            <strong>Release notes</strong>
            <small>Due today</small>
          </article>
          <article>
            <span>Risk</span>
            <strong>{store.armed ? "Blocker cleared" : "Copy review"}</strong>
            <small>{store.armed ? "Ready" : "Needs eyes"}</small>
          </article>
        </div>
      </section>

      <section class="neo-stats" aria-label="Sprint metrics">
        <For each={neoStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="neo-section" id="neo-cards">
        <div class="neo-section-head">
          <span>Board blocks</span>
          <h2>Every module has weight, borders, and a job.</h2>
        </div>
        <div class="neo-card-grid">
          <For each={neoCards}>
            {(item) => (
              <button
                type="button"
                class="neo-card"
                data-tone={item[3]}
                data-selected={store.card === item[0] ? "true" : undefined}
                onClick={() => setStore("card", item[0])}
              >
                <span>{item[0]}</span>
                <h3>{item[1]}</h3>
                <p>{item[2]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="neo-section neo-packs" id="neo-packs">
        <div class="neo-section-head">
          <span>Pick a kit</span>
          <h2>Pricing that clicks like a physical switch.</h2>
        </div>
        <div class="neo-pack-grid">
          <For each={neoPacks}>
            {(item) => (
              <button
                type="button"
                class="neo-pack"
                data-selected={store.pack === item[0] ? "true" : undefined}
                onClick={() => setStore("pack", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="neo-section neo-faq" id="neo-faq">
        <div class="neo-section-head">
          <span>Sharp answers</span>
        </div>
        <For each={neoFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span>+</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function BoldTypographyDemo() {
  const [store, setStore] = createStore({
    published: false,
    section: "Briefing",
    plan: "studio",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`bold-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="bold-demo">
      <div class="bold-backdrop" aria-hidden="true">
        TYPE
      </div>
      <header class="bold-nav">
        <button type="button" class="bold-brand" onClick={() => jump("top")}>
          Type Index
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("sections")}>
            Sections
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="bold-hero" id="bold-top">
        <div>
          <span class="bold-label">Bold Typography / 13</span>
          <h1>Editorial systems for decisive teams.</h1>
        </div>
        <div class="bold-hero-aside">
          <p>
            A dark publishing workspace where hierarchy, spacing, and underline states make complex briefings feel
            calm, sharp, and ready to ship.
          </p>
          <div class="bold-actions">
            <button
              type="button"
              class="bold-primary"
              data-active={store.published ? "true" : undefined}
              onClick={() => setStore("published", !store.published)}
            >
              {store.published ? "Issue queued" : "Queue issue"}
            </button>
            <button type="button" class="bold-secondary" onClick={() => jump("sections")}>
              Read system
            </button>
          </div>
        </div>
      </section>

      <section class="bold-stats" aria-label="Editorial metrics">
        <For each={boldStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="bold-section" id="bold-sections">
        <div class="bold-section-head">
          <span class="bold-label">Issue architecture</span>
          <h2>Sharp content blocks with one obvious reading path.</h2>
        </div>
        <div class="bold-section-grid">
          <For each={boldSections}>
            {(item) => (
              <button
                type="button"
                class="bold-card"
                data-selected={store.section === item[0] ? "true" : undefined}
                onClick={() => setStore("section", item[0])}
              >
                <span>{item[0]}</span>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="bold-section bold-plans" id="bold-plans">
        <div class="bold-section-head">
          <span class="bold-label">Access</span>
          <h2>Pricing with borders instead of decoration.</h2>
        </div>
        <div class="bold-plan-grid">
          <For each={boldPlans}>
            {(item) => (
              <button
                type="button"
                class="bold-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="bold-section bold-faq" id="bold-faq">
        <div class="bold-section-head">
          <span class="bold-label">Notes</span>
        </div>
        <For each={boldFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function CyberpunkGlitchDemo() {
  const [store, setStore] = createStore({
    live: false,
    node: "ghost",
    plan: "cell",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`cyber-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="cyber-demo">
      <header class="cyber-nav">
        <button type="button" class="cyber-brand" onClick={() => jump("top")}>
          NIGHT OPS<span />
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("nodes")}>
            Nodes
          </button>
          <button type="button" onClick={() => jump("access")}>
            Access
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="cyber-hero" id="cyber-top">
        <div class="cyber-hero-copy">
          <span class="cyber-kicker">Cyberpunk / Glitch / 14</span>
          <h1 data-text="Trace the signal before it mutates.">Trace the signal before it mutates.</h1>
          <p>
            A rogue operations surface for monitoring hostile traffic, corrupt packets, and relay routes across the
            midnight network.
          </p>
          <div class="cyber-actions">
            <button
              type="button"
              class="cyber-primary"
              data-active={store.live ? "true" : undefined}
              onClick={() => setStore("live", !store.live)}
            >
              {store.live ? "Live feed armed" : "Arm live feed"}
            </button>
            <button type="button" class="cyber-secondary" onClick={() => jump("nodes")}>
              Inspect nodes
            </button>
          </div>
        </div>

        <div class="cyber-terminal" aria-label="Network terminal preview">
          <div class="cyber-terminal-bar">
            <span />
            <span />
            <span />
            <strong>root@night-ops</strong>
          </div>
          <pre>{">"} scan --relay ghost --noise low</pre>
          <pre>packets: {store.live ? "streaming" : "standby"} / route: encrypted</pre>
          <pre>risk: <b>{store.live ? "CONTAINED" : "WATCHING"}</b><i /></pre>
        </div>
      </section>

      <section class="cyber-stats" aria-label="Network statistics">
        <For each={cyberStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="cyber-section" id="cyber-nodes">
        <div class="cyber-section-head">
          <span>Signal nodes</span>
          <h2>HUD panels with cut corners and unstable glow.</h2>
        </div>
        <div class="cyber-node-grid">
          <For each={cyberNodes}>
            {(item) => (
              <button
                type="button"
                class="cyber-node"
                data-tone={item[3]}
                data-selected={store.node === item[0] ? "true" : undefined}
                onClick={() => setStore("node", item[0])}
              >
                <span>{item[1]}</span>
                <p>{item[2]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="cyber-section cyber-access" id="cyber-access">
        <div class="cyber-section-head">
          <span>Access tiers</span>
          <h2>Choose the clearance level for the feed.</h2>
        </div>
        <div class="cyber-plan-grid">
          <For each={cyberPlans}>
            {(item) => (
              <button
                type="button"
                class="cyber-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="cyber-section cyber-faq" id="cyber-faq">
        <div class="cyber-section-head">
          <span>Encrypted notes</span>
        </div>
        <For each={cyberFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function BitcoinDefiDemo() {
  const [store, setStore] = createStore({
    secured: false,
    vault: "yield",
    plan: "desk",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`bitcoin-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="bitcoin-demo">
      <div class="bitcoin-orb bitcoin-orb-one" aria-hidden="true" />
      <div class="bitcoin-orb bitcoin-orb-two" aria-hidden="true" />
      <header class="bitcoin-nav">
        <button type="button" class="bitcoin-brand" onClick={() => jump("top")}>
          <span>₿</span>
          VaultGrid
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("vaults")}>
            Vaults
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="bitcoin-hero" id="bitcoin-top">
        <div class="bitcoin-hero-copy">
          <span class="bitcoin-badge">
            <i />
            Bitcoin DeFi / 15
          </span>
          <h1>
            Secure digital gold with transparent <span>vault logic.</span>
          </h1>
          <p>
            A technical treasury interface for allocation routes, signer health, proof status, and conservative DeFi
            operations.
          </p>
          <div class="bitcoin-actions">
            <button
              type="button"
              class="bitcoin-primary"
              data-active={store.secured ? "true" : undefined}
              onClick={() => setStore("secured", !store.secured)}
            >
              {store.secured ? "Secure mode on" : "Enable secure mode"}
            </button>
            <button type="button" class="bitcoin-outline" onClick={() => jump("vaults")}>
              View vaults
            </button>
          </div>
        </div>

        <div class="bitcoin-vault" aria-label="Treasury vault preview">
          <div class="bitcoin-vault-head">
            <span>Proof status</span>
            <strong>{store.secured ? "Locked" : "Watching"}</strong>
          </div>
          <div class="bitcoin-balance">
            <span>Total balance</span>
            <strong>₿ 12.8472</strong>
          </div>
          <div class="bitcoin-ledger">
            <span>mempool</span>
            <b>clear</b>
            <span>signers</span>
            <b>{store.secured ? "4/4" : "3/4"}</b>
          </div>
        </div>
      </section>

      <section class="bitcoin-stats" aria-label="Treasury statistics">
        <For each={bitcoinStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="bitcoin-section" id="bitcoin-vaults">
        <div class="bitcoin-section-head">
          <span>Block routes</span>
          <h2>Glass cards that make risk and value easy to scan.</h2>
        </div>
        <div class="bitcoin-vault-grid">
          <For each={bitcoinVaults}>
            {(item) => (
              <button
                type="button"
                class="bitcoin-card"
                data-selected={store.vault === item[0] ? "true" : undefined}
                onClick={() => setStore("vault", item[0])}
              >
                <span>{item[1]}</span>
                <p>{item[2]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="bitcoin-section bitcoin-plans" id="bitcoin-plans">
        <div class="bitcoin-section-head">
          <span>Access tiers</span>
          <h2>Precision controls for every treasury size.</h2>
        </div>
        <div class="bitcoin-plan-grid">
          <For each={bitcoinPlans}>
            {(item) => (
              <button
                type="button"
                class="bitcoin-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="bitcoin-section bitcoin-faq" id="bitcoin-faq">
        <div class="bitcoin-section-head">
          <span>Trust layer</span>
        </div>
        <For each={bitcoinFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function MinimalistDarkDemo() {
  const [store, setStore] = createStore({
    focus: false,
    card: "Focus Room",
    plan: "studio",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`dark-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="dark-demo">
      <div class="dark-orb dark-orb-one" aria-hidden="true" />
      <div class="dark-orb dark-orb-two" aria-hidden="true" />
      <header class="dark-nav">
        <button type="button" class="dark-brand" onClick={() => jump("top")}>
          Nocturne
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("spaces")}>
            Spaces
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="dark-hero" id="dark-top">
        <div class="dark-hero-copy">
          <span class="dark-badge">
            <i />
            Minimalist Dark / 16
          </span>
          <h1>Quiet software for focused night work.</h1>
          <p>
            Nocturne layers reviews, tasks, and decisions into a calm dark workspace with warm amber cues and generous
            breathing room.
          </p>
          <div class="dark-actions">
            <button
              type="button"
              class="dark-primary"
              data-active={store.focus ? "true" : undefined}
              onClick={() => setStore("focus", !store.focus)}
            >
              {store.focus ? "Focus mode on" : "Start focus"}
            </button>
            <button type="button" class="dark-secondary" onClick={() => jump("spaces")}>
              View spaces
            </button>
          </div>
        </div>

        <div class="dark-panel" aria-label="Focus room preview">
          <div class="dark-panel-head">
            <span>{store.focus ? "Deep focus" : "Evening queue"}</span>
            <b>02:14</b>
          </div>
          <article>
            <strong>Design review</strong>
            <p>Resolve navigation density without adding visual noise.</p>
          </article>
          <article>
            <strong>Release note</strong>
            <p>Write the smallest useful summary for tomorrow's handoff.</p>
          </article>
        </div>
      </section>

      <section class="dark-stats" aria-label="Focus statistics">
        <For each={darkStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="dark-section" id="dark-spaces">
        <div class="dark-section-head">
          <span>Calm surfaces</span>
          <h2>Layered slate cards that stay useful after midnight.</h2>
        </div>
        <div class="dark-card-grid">
          <For each={darkCards}>
            {(item) => (
              <button
                type="button"
                class="dark-card"
                data-selected={store.card === item[0] ? "true" : undefined}
                onClick={() => setStore("card", item[0])}
              >
                <span>{item[0]}</span>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="dark-section dark-plans" id="dark-plans">
        <div class="dark-section-head">
          <span>Plans</span>
          <h2>Pricing that keeps the room quiet.</h2>
        </div>
        <div class="dark-plan-grid">
          <For each={darkPlans}>
            {(item) => (
              <button
                type="button"
                class="dark-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="dark-section dark-faq" id="dark-faq">
        <div class="dark-section-head">
          <span>Details</span>
        </div>
        <For each={darkFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function ClaymorphismDemo() {
  const [store, setStore] = createStore({
    started: false,
    mood: "Sunny",
    card: "Tiny Wins",
    plan: "bloom",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`clay-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="clay-demo">
      <div class="clay-blob clay-blob-one" aria-hidden="true" />
      <div class="clay-blob clay-blob-two" aria-hidden="true" />
      <div class="clay-blob clay-blob-three" aria-hidden="true" />
      <header class="clay-nav">
        <button type="button" class="clay-brand" onClick={() => jump("top")}>
          Mochi
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("cards")}>
            Cards
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="clay-hero" id="clay-top">
        <div class="clay-hero-copy">
          <div class="clay-chip-row" aria-label="Mood selector">
            <For each={["Sunny", "Cozy", "Brave"]}>
              {(item) => (
                <button
                  type="button"
                  class="clay-chip"
                  data-active={store.mood === item ? "true" : undefined}
                  onClick={() => setStore("mood", item)}
                >
                  {item}
                </button>
              )}
            </For>
          </div>
          <h1>Soft routines that feel good to touch.</h1>
          <p>
            Mochi turns daily habits, moods, and tiny wins into friendly clay cards that respond with lift, squish, and
            calm color.
          </p>
          <div class="clay-actions">
            <button
              type="button"
              class="clay-primary"
              data-active={store.started ? "true" : undefined}
              onClick={() => setStore("started", !store.started)}
            >
              {store.started ? "Ritual started" : "Start ritual"}
            </button>
            <button type="button" class="clay-secondary" onClick={() => jump("cards")}>
              Explore cards
            </button>
          </div>
        </div>

        <div class="clay-widget" aria-label="Mood widget preview">
          <div class="clay-orb">{store.mood.slice(0, 1)}</div>
          <span>{store.mood} mode</span>
          <strong>{store.started ? "3 wins saved" : "Ready when you are"}</strong>
          <div class="clay-progress">
            <span style={{ width: store.started ? "78%" : "42%" }} />
          </div>
        </div>
      </section>

      <section class="clay-stats" aria-label="Routine statistics">
        <For each={clayStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="clay-section" id="clay-cards">
        <div class="clay-section-head">
          <span>Digital clay</span>
          <h2>Every card has volume, warmth, and friendly physics.</h2>
        </div>
        <div class="clay-card-grid">
          <For each={clayCards}>
            {(item, index) => (
              <button
                type="button"
                class="clay-card"
                data-tone={index() === 0 ? "blue" : index() === 1 ? "pink" : "green"}
                data-selected={store.card === item[0] ? "true" : undefined}
                onClick={() => setStore("card", item[0])}
              >
                <span>{item[0]}</span>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="clay-section clay-plans" id="clay-plans">
        <div class="clay-section-head">
          <span>Plans</span>
          <h2>Choose the softest shape for your routine.</h2>
        </div>
        <div class="clay-plan-grid">
          <For each={clayPlans}>
            {(item) => (
              <button
                type="button"
                class="clay-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="clay-section clay-faq" id="clay-faq">
        <div class="clay-section-head">
          <span>Details</span>
        </div>
        <For each={clayFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function SerifDemo() {
  const [store, setStore] = createStore({
    joined: false,
    department: "Literature",
    membership: "patron",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`serif-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="serif-demo">
      <div class="serif-ambient" aria-hidden="true" />
      <header class="serif-nav">
        <button type="button" class="serif-brand" onClick={() => jump("top")}>
          Aster Review
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("departments")}>
            Departments
          </button>
          <button type="button" onClick={() => jump("membership")}>
            Membership
          </button>
          <button type="button" onClick={() => jump("faq")}>
            Notes
          </button>
        </nav>
      </header>

      <section class="serif-hero" id="serif-top">
        <div class="serif-label">
          <span />
          <b>Issue 18 / Spring reading</b>
          <span />
        </div>
        <h1>Essays for rooms with quiet light.</h1>
        <p>
          Aster Review gathers architecture, literature, and material culture into a slower editorial membership for
          readers who still believe in margin, proportion, and the well-placed line.
        </p>
        <div class="serif-actions">
          <button
            type="button"
            class="serif-primary"
            data-active={store.joined ? "true" : undefined}
            onClick={() => setStore("joined", !store.joined)}
          >
            {store.joined ? "Membership noted" : "Join the review"}
          </button>
          <button type="button" class="serif-secondary" onClick={() => jump("departments")}>
            Read departments
          </button>
        </div>
        <aside class="serif-pullquote">
          <span aria-hidden="true">“</span>
          <p>Good typography is not decoration. It is hospitality for thought.</p>
        </aside>
      </section>

      <section class="serif-stats" aria-label="Editorial statistics">
        <For each={serifStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="serif-section" id="serif-departments">
        <div class="serif-section-label">
          <span />
          <b>Departments</b>
          <span />
        </div>
        <div class="serif-section-head">
          <h2>Three columns of considered attention.</h2>
          <p>Choose a department to see how a quiet card can still carry state, rhythm, and hierarchy.</p>
        </div>
        <div class="serif-card-grid">
          <For each={serifDepartments}>
            {(item) => (
              <button
                type="button"
                class="serif-card"
                data-selected={store.department === item[0] ? "true" : undefined}
                onClick={() => setStore("department", item[0])}
              >
                <span>{item[0]}</span>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="serif-section serif-membership" id="serif-membership">
        <div class="serif-section-label">
          <span />
          <b>Membership</b>
          <span />
        </div>
        <div class="serif-membership-layout">
          <div>
            <h2>Printed calm, digital archive, and letters worth keeping.</h2>
            <p>
              The selected tier keeps its golden rule line and pale tint without resorting to loud badges or inflated
              decoration.
            </p>
          </div>
          <div class="serif-plan-grid">
            <For each={serifMemberships}>
              {(item) => (
                <button
                  type="button"
                  class="serif-plan"
                  data-selected={store.membership === item[0] ? "true" : undefined}
                  onClick={() => setStore("membership", item[0])}
                >
                  <span>{item[1]}</span>
                  <strong>{item[2]}</strong>
                  <small>{item[3]}</small>
                </button>
              )}
            </For>
          </div>
        </div>
      </section>

      <section class="serif-section serif-faq" id="serif-faq">
        <div class="serif-section-label">
          <span />
          <b>Notes</b>
          <span />
        </div>
        <For each={serifFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function VaporwaveDemo() {
  const [store, setStore] = createStore({
    connected: false,
    zone: "ZONE_01",
    plan: "neon",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`vapor-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="vapor-demo">
      <div class="vapor-scan" aria-hidden="true" />
      <div class="vapor-grid-bg" aria-hidden="true" />
      <div class="vapor-sun" aria-hidden="true" />

      <header class="vapor-nav">
        <div class="vapor-nav-chrome" aria-hidden="true">
          <span class="vapor-dot vapor-dot-m" />
          <span class="vapor-dot vapor-dot-c" />
          <span class="vapor-dot vapor-dot-o" />
        </div>
        <button type="button" class="vapor-brand" onClick={() => jump("top")}>
          GRID.EXE
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("zones")}>
            ZONES
          </button>
          <button type="button" onClick={() => jump("access")}>
            ACCESS
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="vapor-hero" id="vapor-top">
        <div class="vapor-hero-label">&gt; INITIALIZING GRID.EXE v2.0.88_</div>
        <h1>
          <span class="vapor-gradient-text">RUN THE</span>
          <span class="vapor-gradient-text">NEON</span>
          <span class="vapor-gradient-text">GRID</span>
        </h1>
        <p>
          Plug into a synthetic reality where retro-futurism meets raw digital power. Your signal travels at the speed
          of neon. The grid never sleeps.
        </p>
        <div class="vapor-actions">
          <button
            type="button"
            class="vapor-primary"
            data-active={store.connected ? "true" : undefined}
            onClick={() => setStore("connected", !store.connected)}
          >
            <span>{store.connected ? "> CONNECTED_" : "> JACK IN_"}</span>
          </button>
          <button type="button" class="vapor-secondary" onClick={() => jump("zones")}>
            EXPLORE ZONES
          </button>
        </div>
      </section>

      <section class="vapor-stats" aria-label="Grid statistics">
        <For each={vaporwaveStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="vapor-section" id="vapor-zones">
        <div class="vapor-section-head">
          <div class="vapor-kicker">&gt; SELECT_ZONE</div>
          <h2>ENTER A ZONE</h2>
          <p>Three portals into the grid. Each zone runs on a different frequency. Choose your signal.</p>
        </div>
        <div class="vapor-card-grid">
          <For each={vaporwaveNodes}>
            {(item) => (
              <button
                type="button"
                class="vapor-card"
                data-color={item[3]}
                data-selected={store.zone === item[0] ? "true" : undefined}
                onClick={() => setStore("zone", item[0])}
              >
                <div class="vapor-card-bar" />
                <div class="vapor-card-header">
                  <span class="vapor-card-id">{item[0]}</span>
                  <span class="vapor-card-title">{item[1]}</span>
                </div>
                <p>{item[2]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="vapor-section vapor-access" id="vapor-access">
        <div class="vapor-section-head">
          <div class="vapor-kicker">&gt; ACCESS_TIERS</div>
          <h2>CHOOSE ACCESS</h2>
          <p>Select a tier to activate your node. Selection state updates instantly — no lag, no noise.</p>
        </div>
        <div class="vapor-plan-grid">
          <For each={vaporwavePlans}>
            {(item) => (
              <button
                type="button"
                class="vapor-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="vapor-section vapor-faq-section" id="vapor-faq">
        <div class="vapor-section-head">
          <div class="vapor-kicker">&gt; QUERY_LOG</div>
          <h2>QUERY LOG</h2>
        </div>
        <For each={vaporwaveFaqItems}>
          {(item) => (
            <article class="vapor-faq-item" data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                <span class="vapor-prompt" aria-hidden="true">&gt;</span>
                {item[0]}
                <span class="vapor-toggle" aria-hidden="true">{store.openFaq === item[0] ? "[-]" : "[+]"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function BotanicalDemo() {
  const [store, setStore] = createStore({
    joined: false,
    collection: "Forest Floor",
    plan: "grove",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`botan-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="botan-demo">
      <div class="botan-grain" aria-hidden="true" />

      <header class="botan-nav">
        <button type="button" class="botan-brand" onClick={() => jump("top")}>
          Verdure
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("collections")}>
            Collections
          </button>
          <button type="button" onClick={() => jump("membership")}>
            Membership
          </button>
          <button type="button" onClick={() => jump("faq")}>
            Journal
          </button>
        </nav>
      </header>

      <section class="botan-hero" id="botan-top">
        <div class="botan-hero-label">
          <span />
          Studio No. 19 / Botanical
          <span />
        </div>
        <h1>
          A living archive of <em>nature</em>, curated for thoughtful interiors.
        </h1>
        <p>
          Verdure selects rare and enduring botanicals from small growers and returns them to the homes, studios, and
          quiet corners where they belong.
        </p>
        <div class="botan-actions">
          <button
            type="button"
            class="botan-primary"
            data-active={store.joined ? "true" : undefined}
            onClick={() => setStore("joined", !store.joined)}
          >
            {store.joined ? "Membership noted" : "Join the studio"}
          </button>
          <button type="button" class="botan-secondary" onClick={() => jump("collections")}>
            Explore collections
          </button>
        </div>
      </section>

      <section class="botan-stats" aria-label="Studio statistics">
        <For each={botanicalStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="botan-section" id="botan-collections">
        <div class="botan-section-label">
          <span />
          <b>Collections</b>
          <span />
        </div>
        <h2>
          Three <em>living</em> worlds, hand-sourced each season.
        </h2>
        <p>Select a collection to see how the organic card holds selection state with quiet grace.</p>
        <div class="botan-card-grid">
          <For each={botanicalCollections}>
            {(item) => (
              <button
                type="button"
                class="botan-card"
                data-selected={store.collection === item[0] ? "true" : undefined}
                onClick={() => setStore("collection", item[0])}
              >
                <div class="botan-card-dot" />
                <span>{item[0]}</span>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="botan-section botan-membership" id="botan-membership">
        <div class="botan-section-label">
          <span />
          <b>Membership</b>
          <span />
        </div>
        <h2>
          Grow with the <em>seasons</em>.
        </h2>
        <p>Each tier arrives as a considered box of living things, care notes, and printed field guides.</p>
        <div class="botan-plan-grid">
          <For each={botanicalPlans}>
            {(item) => (
              <button
                type="button"
                class="botan-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="botan-section botan-faq" id="botan-faq">
        <div class="botan-section-label">
          <span />
          <b>Journal</b>
          <span />
        </div>
        <For each={botanicalFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "−" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function CorporateTrustDemo() {
  const [store, setStore] = createStore({
    activated: false,
    feature: "Governance",
    plan: "business",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`corp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="corp-demo">
      <header class="corp-nav">
        <button type="button" class="corp-brand" onClick={() => jump("top")}>
          <span aria-hidden="true">Z</span>
          TrustGrid
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("platform")}>
            Platform
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            FAQ
          </button>
        </nav>
      </header>

      <section class="corp-hero" id="corp-top">
        <div class="corp-hero-copy">
          <div class="corp-eyebrow">
            <span aria-hidden="true" />
            Enterprise release assurance
          </div>
          <h1>
            Ship faster with a <span>trustworthy operating layer</span>.
          </h1>
          <p>
            TrustGrid gives product, security, and revenue teams one polished place to approve launches, monitor risk,
            and keep every stakeholder aligned.
          </p>
          <div class="corp-actions">
            <button
              type="button"
              class="corp-primary"
              data-active={store.activated ? "true" : undefined}
              onClick={() => setStore("activated", !store.activated)}
            >
              {store.activated ? "Launch Board Active" : "Open Launch Board"}
              <span aria-hidden="true">-&gt;</span>
            </button>
            <button type="button" class="corp-secondary" onClick={() => jump("platform")}>
              Review Platform
            </button>
          </div>
        </div>

        <div class="corp-visual" aria-label="Assurance dashboard preview">
          <div class="corp-dashboard">
            <div class="corp-dashboard-head">
              <div>
                <span>Release posture</span>
                <strong>Ready for enterprise review</strong>
              </div>
              <b>{store.activated ? "Live" : "Draft"}</b>
            </div>
            <div class="corp-score">
              <strong>94</strong>
              <span>Trust score</span>
            </div>
            <div class="corp-flow">
              <span data-state="done">Brief</span>
              <span data-state="done">Security</span>
              <span data-state={store.activated ? "done" : "active"}>Legal</span>
              <span data-state={store.activated ? "done" : undefined}>Launch</span>
            </div>
            <div class="corp-mini-grid">
              <article>
                <span>Risk</span>
                <strong>Low</strong>
              </article>
              <article>
                <span>Owners</span>
                <strong>08</strong>
              </article>
              <article>
                <span>Approvals</span>
                <strong>{store.activated ? "12/12" : "10/12"}</strong>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section class="corp-stats" aria-label="TrustGrid metrics">
        <For each={corporateTrustStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="corp-section" id="corp-platform">
        <div class="corp-section-head">
          <span>Platform</span>
          <h2>A system that feels polished before procurement enters the room.</h2>
          <p>
            Select a capability to see the elevated card language, colored shadows, and restrained enterprise rhythm.
          </p>
        </div>
        <div class="corp-card-grid">
          <For each={corporateTrustFeatures}>
            {(item) => (
              <button
                type="button"
                class="corp-feature-card"
                data-selected={store.feature === item[0] ? "true" : undefined}
                onClick={() => setStore("feature", item[0])}
              >
                <span>{item[2]}</span>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="corp-section corp-plans" id="corp-plans">
        <div class="corp-section-head">
          <span>Pricing</span>
          <h2>Three ways to bring assurance into the workflow.</h2>
        </div>
        <div class="corp-plan-grid">
          <For each={corporateTrustPlans}>
            {(item) => (
              <button
                type="button"
                class="corp-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="corp-section corp-faq" id="corp-faq">
        <div class="corp-section-head">
          <span>Questions</span>
          <h2>Built for a credible SaaS first impression.</h2>
        </div>
        <For each={corporateTrustFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "-" : "+"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function HandDrawnDemo() {
  const [store, setStore] = createStore({
    pinned: false,
    card: "Brainstorm wall",
    plan: "studio",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`draw-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="draw-demo">
      <header class="draw-nav">
        <button type="button" class="draw-brand" onClick={() => jump("top")}>
          ScribbleBoard
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("ideas")}>
            Ideas
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Kits
          </button>
          <button type="button" onClick={() => jump("faq")}>
            Notes
          </button>
        </nav>
      </header>

      <section class="draw-hero" id="draw-top">
        <div class="draw-hero-copy">
          <span class="draw-sticky-label">messy on purpose</span>
          <h1>
            Sketch the first version before the idea gets scared.
            <span aria-hidden="true">!</span>
          </h1>
          <p>
            ScribbleBoard turns prompts into playful whiteboard flows, sticky notes, rough diagrams, and tiny decisions
            that feel human enough to edit.
          </p>
          <div class="draw-actions">
            <button
              type="button"
              class="draw-primary"
              data-active={store.pinned ? "true" : undefined}
              onClick={() => setStore("pinned", !store.pinned)}
            >
              {store.pinned ? "pinned to wall" : "pin this sketch"}
            </button>
            <button type="button" class="draw-secondary" onClick={() => jump("ideas")}>
              peek at notes
            </button>
          </div>
        </div>

        <div class="draw-board" aria-label="Sketch board preview">
          <div class="draw-tape" aria-hidden="true" />
          <div class="draw-pin" aria-hidden="true" />
          <h2>launch doodle</h2>
          <div class="draw-map">
            <span>idea</span>
            <i aria-hidden="true" />
            <span>sketch</span>
            <i aria-hidden="true" />
            <span>{store.pinned ? "share" : "revise"}</span>
          </div>
          <p>
            no straight lines, no sterile cards, just a scrappy plan with enough structure to move forward.
          </p>
        </div>
      </section>

      <section class="draw-stats" aria-label="Sketch metrics">
        <For each={handDrawnStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="draw-section" id="draw-ideas">
        <div class="draw-section-head">
          <span>idea scraps</span>
          <h2>Every card feels like it was pulled from a sketchbook.</h2>
        </div>
        <div class="draw-card-grid">
          <For each={handDrawnCards}>
            {(item) => (
              <button
                type="button"
                class="draw-card"
                data-decoration={item[2]}
                data-selected={store.card === item[0] ? "true" : undefined}
                onClick={() => setStore("card", item[0])}
              >
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="draw-section draw-plans" id="draw-plans">
        <div class="draw-section-head">
          <span>prompt kits</span>
          <h2>Pick a kit, then watch the paper press into place.</h2>
        </div>
        <div class="draw-plan-grid">
          <For each={handDrawnPlans}>
            {(item) => (
              <button
                type="button"
                class="draw-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="draw-section draw-faq" id="draw-faq">
        <div class="draw-section-head">
          <span>margin notes</span>
          <h2>Still rough, already useful.</h2>
        </div>
        <For each={handDrawnFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "fold" : "open"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function IndustrialDemo() {
  const [store, setStore] = createStore({
    powered: false,
    module: "Signal Screen",
    plan: "rack",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`ind-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="ind-demo">
      <header class="ind-nav">
        <button type="button" class="ind-brand" onClick={() => jump("top")}>
          <span aria-hidden="true" />
          RelayWorks
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("modules")}>
            Modules
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Units
          </button>
          <button type="button" onClick={() => jump("faq")}>
            Logs
          </button>
        </nav>
      </header>

      <section class="ind-hero" id="ind-top">
        <div class="ind-copy">
          <div class="ind-kicker">
            <span aria-hidden="true" />
            SYSTEM OPERATIONAL
          </div>
          <h1>Mission control for work that needs to feel permanent.</h1>
          <p>
            RelayWorks turns fragile workflows into physical-feeling modules: recessed displays, bolted panels, status
            LEDs, and controls that press like real hardware.
          </p>
          <div class="ind-actions">
            <button
              type="button"
              class="ind-primary"
              data-active={store.powered ? "true" : undefined}
              onClick={() => setStore("powered", !store.powered)}
            >
              {store.powered ? "POWER ENGAGED" : "ENGAGE POWER"}
            </button>
            <button type="button" class="ind-secondary" onClick={() => jump("modules")}>
              INSPECT MODULES
            </button>
          </div>
        </div>

        <div class="ind-device" aria-label="Industrial control panel preview">
          <div class="ind-screw ind-screw-a" aria-hidden="true" />
          <div class="ind-screw ind-screw-b" aria-hidden="true" />
          <div class="ind-screen">
            <div class="ind-scanlines" aria-hidden="true" />
            <div class="ind-screen-head">
              <span>RELAY.OS</span>
              <b>{store.powered ? "ACTIVE" : "STANDBY"}</b>
            </div>
            <div class="ind-bars">
              <span style={{ width: store.powered ? "92%" : "62%" }} />
              <span style={{ width: store.powered ? "76%" : "48%" }} />
              <span style={{ width: store.powered ? "84%" : "54%" }} />
            </div>
            <div class="ind-terminal">
              <span>&gt; module: {store.module}</span>
              <span>&gt; status: {store.powered ? "locked / running" : "waiting for input"}</span>
            </div>
          </div>
          <div class="ind-device-controls">
            <span data-on={store.powered ? "true" : undefined} />
            <span />
            <span />
          </div>
          <div class="ind-vents" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section class="ind-stats" aria-label="RelayWorks telemetry">
        <For each={industrialStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="ind-section" id="ind-modules">
        <div class="ind-section-head">
          <span>MODULE BAY</span>
          <h2>Raised panels, recessed data, and status lights mounted to a strict grid.</h2>
        </div>
        <div class="ind-module-grid">
          <For each={industrialModules}>
            {(item) => (
              <button
                type="button"
                class="ind-module"
                data-selected={store.module === item[0] ? "true" : undefined}
                onClick={() => setStore("module", item[0])}
              >
                <div class="ind-module-head">
                  <span>{item[2]}</span>
                  <i aria-hidden="true" />
                </div>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="ind-section ind-plans" id="ind-plans">
        <div class="ind-section-head">
          <span>UNIT OPTIONS</span>
          <h2>Select the chassis size for your operating surface.</h2>
        </div>
        <div class="ind-plan-grid">
          <For each={industrialPlans}>
            {(item) => (
              <button
                type="button"
                class="ind-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="ind-section ind-faq" id="ind-faq">
        <div class="ind-section-head">
          <span>DIAGNOSTIC LOG</span>
          <h2>Mechanical details that make the interface feel manufactured.</h2>
        </div>
        <For each={industrialFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "CLOSE" : "OPEN"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function NeumorphismDemo() {
  const [store, setStore] = createStore({
    active: false,
    feature: "Nested Depth",
    plan: "team",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`neu-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="neu-demo">
      <header class="neu-nav">
        <button type="button" class="neu-brand" onClick={() => jump("top")}>
          <span aria-hidden="true">S</span>
          SurfaceOS
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("features")}>
            Wells
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Plans
          </button>
          <button type="button" onClick={() => jump("faq")}>
            Notes
          </button>
        </nav>
      </header>

      <section class="neu-hero" id="neu-top">
        <div class="neu-copy">
          <span class="neu-kicker">SOFT UI SYSTEM</span>
          <h1>Controls that feel molded from the page.</h1>
          <p>
            SurfaceOS keeps every control on one cool-grey material plane, then uses light, shadow, and rounded depth
            to make each action feel calm and physical.
          </p>
          <div class="neu-actions">
            <button
              type="button"
              class="neu-primary"
              data-active={store.active ? "true" : undefined}
              onClick={() => setStore("active", !store.active)}
            >
              {store.active ? "Pressed Mode" : "Start Session"}
            </button>
            <button type="button" class="neu-secondary" onClick={() => jump("features")}>
              Inspect Wells
            </button>
          </div>
        </div>

        <div class="neu-visual" aria-label="Soft UI nested depth preview">
          <div class="neu-orbit neu-orbit-a" aria-hidden="true" />
          <div class="neu-orbit neu-orbit-b" aria-hidden="true" />
          <div class="neu-panel">
            <div class="neu-dial">
              <div>
                <span>{store.active ? "ON" : "IDLE"}</span>
              </div>
            </div>
            <div class="neu-input-row">
              <span />
              <p>{store.feature}</p>
            </div>
            <div class="neu-meter" data-active={store.active ? "true" : undefined}>
              <span />
            </div>
          </div>
        </div>
      </section>

      <section class="neu-stats" aria-label="SurfaceOS depth tokens">
        <For each={neumorphismStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="neu-section" id="neu-features">
        <div class="neu-section-head">
          <span>DEPTH KIT</span>
          <h2>Convex cards, concave wells, and nested surfaces without breaking the material illusion.</h2>
        </div>
        <div class="neu-feature-grid">
          <For each={neumorphismFeatures}>
            {(item) => (
              <button
                type="button"
                class="neu-feature"
                data-selected={store.feature === item[0] ? "true" : undefined}
                onClick={() => setStore("feature", item[0])}
              >
                <span class="neu-feature-well">
                  <b>{item[2]}</b>
                </span>
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="neu-section neu-plans" id="neu-plans">
        <div class="neu-section-head">
          <span>SURFACE SIZES</span>
          <h2>Select a same-surface plan with a clear pressed state.</h2>
        </div>
        <div class="neu-plan-grid">
          <For each={neumorphismPlans}>
            {(item) => (
              <button
                type="button"
                class="neu-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="neu-section neu-faq" id="neu-faq">
        <div class="neu-section-head">
          <span>SOFT NOTES</span>
          <h2>The details that keep Soft UI readable instead of washed out.</h2>
        </div>
        <For each={neumorphismFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "Soft" : "Open"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function OrganicNaturalDemo() {
  const [store, setStore] = createStore({
    planted: false,
    feature: "Rice Paper Base",
    plan: "grove",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`org-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="org-demo">
      <header class="org-nav">
        <button type="button" class="org-brand" onClick={() => jump("top")}>
          <span aria-hidden="true" />
          Root & Ritual
        </button>
        <nav aria-label="Demo sections">
          <button type="button" onClick={() => jump("features")}>
            Texture
          </button>
          <button type="button" onClick={() => jump("plans")}>
            Circles
          </button>
          <button type="button" onClick={() => jump("faq")}>
            Notes
          </button>
        </nav>
      </header>

      <section class="org-hero" id="org-top">
        <div class="org-blob org-blob-a" aria-hidden="true" />
        <div class="org-blob org-blob-b" aria-hidden="true" />
        <div class="org-copy">
          <span class="org-kicker">ORGANIC / NATURAL</span>
          <h1>Slow tools for work that wants to breathe.</h1>
          <p>
            Root & Ritual turns planning into a grounded seasonal practice with rice-paper texture, moss actions,
            clay-toned layers, and shapes that feel shaped by hand.
          </p>
          <div class="org-actions">
            <button
              type="button"
              class="org-primary"
              data-active={store.planted ? "true" : undefined}
              onClick={() => setStore("planted", !store.planted)}
            >
              {store.planted ? "Garden Open" : "Begin Ritual"}
            </button>
            <button type="button" class="org-outline" onClick={() => jump("features")}>
              Read Texture
            </button>
          </div>
        </div>

        <div class="org-visual" aria-label="Organic natural interface preview">
          <div class="org-photo">
            <div class="org-photo-mark" />
            <span>{store.planted ? "spring room" : "quiet seed"}</span>
          </div>
          <div class="org-note">
            <strong>{store.feature}</strong>
            <p>Soft edges, natural color, and paper grain keep the preview tactile without feeling busy.</p>
          </div>
        </div>
      </section>

      <section class="org-stats" aria-label="Root and Ritual garden signals">
        <For each={organicStats}>
          {(item) => (
            <article>
              <strong>{item[0]}</strong>
              <span>{item[1]}</span>
            </article>
          )}
        </For>
      </section>

      <section class="org-section" id="org-features">
        <div class="org-section-head">
          <span>FOREST FLOOR</span>
          <h2>Amorphous cards with enough structure to stay useful.</h2>
        </div>
        <div class="org-feature-grid">
          <For each={organicFeatures}>
            {(item) => (
              <button
                type="button"
                class="org-feature"
                data-kind={item[2]}
                data-selected={store.feature === item[0] ? "true" : undefined}
                onClick={() => setStore("feature", item[0])}
              >
                <span aria-hidden="true" />
                <h3>{item[0]}</h3>
                <p>{item[1]}</p>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="org-section org-plans" id="org-plans">
        <div class="org-section-head">
          <span>GROWING CIRCLES</span>
          <h2>Pricing cards stagger like handmade tags on a garden wall.</h2>
        </div>
        <div class="org-plan-grid">
          <For each={organicPlans}>
            {(item) => (
              <button
                type="button"
                class="org-plan"
                data-selected={store.plan === item[0] ? "true" : undefined}
                onClick={() => setStore("plan", item[0])}
              >
                <span>{item[1]}</span>
                <strong>{item[2]}</strong>
                <small>{item[3]}</small>
              </button>
            )}
          </For>
        </div>
      </section>

      <section class="org-section org-faq" id="org-faq">
        <div class="org-section-head">
          <span>FIELD NOTES</span>
          <h2>Organic does not mean vague: the details stay deliberate.</h2>
        </div>
        <For each={organicFaqItems}>
          {(item) => (
            <article data-open={store.openFaq === item[0] ? "true" : undefined}>
              <button
                type="button"
                aria-expanded={store.openFaq === item[0]}
                onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
              >
                {item[0]}
                <span aria-hidden="true">{store.openFaq === item[0] ? "close" : "open"}</span>
              </button>
              <Show when={store.openFaq === item[0]}>
                <p>{item[1]}</p>
              </Show>
            </article>
          )}
        </For>
      </section>
    </div>
  )
}

function Retro90sDemo() {
  const [store, setStore] = createStore({
    installed: false,
    row: "Download Zone",
    plan: "club",
    openFaq: "Why this demo content?",
  })

  const jump = (id: string) => {
    document.getElementById(`retro-${id}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }

  return (
    <div class="retro90-demo">
      <div class="retro90-marquee" aria-label="Scrolling 90s announcement">
        <div>
          <span>*** WELCOME TO PAGEFORGE 97 ***</span>
          <span>UNDER CONSTRUCTION</span>
          <span>BEST VIEWED AT 800x600</span>
          <span>FREE GUESTBOOK INCLUDED</span>
        </div>
      </div>

      <main class="retro90-shell">
        <header class="retro90-window retro90-hero" id="retro-top">
          <div class="retro90-titlebar">
            <span>PAGEFORGE.EXE</span>
            <b>_ [ ] X</b>
          </div>
          <div class="retro90-window-body">
            <nav class="retro90-nav" aria-label="Demo sections">
              <button type="button" onClick={() => jump("features")}>
                FEATURES
              </button>
              <button type="button" onClick={() => jump("plans")}>
                PRICES
              </button>
              <button type="button" onClick={() => jump("faq")}>
                FAQ
              </button>
              <a href="#retro-guest" onClick={(event) => event.preventDefault()}>
                Guestbook
              </a>
            </nav>

            <div class="retro90-badge">NEW!</div>
            <h1 class="retro90-rainbow">Homepage Kit 97</h1>
            <p>
              Build a loud personal web portal with beveled windows, hit counters, blinking labels, scrolling news, and
              table grids that feel hand-coded after midnight.
            </p>

            <div class="retro90-actions">
              <button
                type="button"
                class="retro90-primary"
                data-active={store.installed ? "true" : undefined}
                onClick={() => setStore("installed", !store.installed)}
              >
                {store.installed ? "INSTALLED!" : "INSTALL NOW"}
              </button>
              <button type="button" onClick={() => jump("features")}>
                VIEW README
              </button>
            </div>

            <div class="retro90-counter" aria-label="Visitor counter">
              Visitors: 0001266 | Since 1997 | Selected: {store.row}
            </div>

            <div class="retro90-colors" aria-label="Decorative 90s color squares">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </header>

        <div class="retro90-groove" aria-hidden="true" />

        <section class="retro90-window" id="retro-features">
          <div class="retro90-titlebar">
            <span>FEATURES.TBL</span>
            <b>3 ITEMS</b>
          </div>
          <div class="retro90-table">
            <For each={retro90sRows}>
              {(item) => (
                <button
                  type="button"
                  data-selected={store.row === item[1] ? "true" : undefined}
                  onClick={() => setStore("row", item[1])}
                >
                  <span>{item[0]}</span>
                  <strong>{item[1]}</strong>
                  <em>{item[2]}</em>
                  <b>{item[3]}</b>
                </button>
              )}
            </For>
          </div>
        </section>

        <section class="retro90-window retro90-prices" id="retro-plans">
          <div class="retro90-titlebar">
            <span>ORDER_FORM.WIN</span>
            <b>ONLINE</b>
          </div>
          <div class="retro90-plan-grid">
            <For each={retro90sPlans}>
              {(item) => (
                <button
                  type="button"
                  class="retro90-plan"
                  data-selected={store.plan === item[0] ? "true" : undefined}
                  onClick={() => setStore("plan", item[0])}
                >
                  <span>{item[1]}</span>
                  <strong>{item[2]}</strong>
                  <small>{item[3]}</small>
                </button>
              )}
            </For>
          </div>
        </section>

        <section class="retro90-construction">
          <div>
            <span>UNDER CONSTRUCTION</span>
            <button type="button" onClick={() => jump("faq")}>
              READ FAQ
            </button>
          </div>
        </section>

        <section class="retro90-window retro90-faq" id="retro-faq">
          <div class="retro90-titlebar">
            <span>HELP_TOPICS.HLP</span>
            <b>F1</b>
          </div>
          <For each={retro90sFaqItems}>
            {(item) => (
              <article data-open={store.openFaq === item[0] ? "true" : undefined}>
                <button
                  type="button"
                  aria-expanded={store.openFaq === item[0]}
                  onClick={() => setStore("openFaq", store.openFaq === item[0] ? "" : item[0])}
                >
                  {item[0]}
                  <span aria-hidden="true">{store.openFaq === item[0] ? "[-]" : "[+]"}</span>
                </button>
                <Show when={store.openFaq === item[0]}>
                  <p>{item[1]}</p>
                </Show>
              </article>
            )}
          </For>
        </section>
      </main>
    </div>
  )
}

function TemplatePreview(props: { template: PromptTemplate }) {
  return (
    <Switch>
      <Match when={props.template.id === "retro-90s-nostalgia"}>
        <Retro90sDemo />
      </Match>
      <Match when={props.template.id === "organic-natural"}>
        <OrganicNaturalDemo />
      </Match>
      <Match when={props.template.id === "neumorphism-soft-ui"}>
        <NeumorphismDemo />
      </Match>
      <Match when={props.template.id === "industrial-skeuomorphism"}>
        <IndustrialDemo />
      </Match>
      <Match when={props.template.id === "hand-drawn"}>
        <HandDrawnDemo />
      </Match>
      <Match when={props.template.id === "corporate-trust"}>
        <CorporateTrustDemo />
      </Match>
      <Match when={props.template.id === "maximalism-dopamine"}>
        <DopamineDemo />
      </Match>
      <Match when={props.template.id === "bauhaus"}>
        <BauhausDemo />
      </Match>
      <Match when={props.template.id === "linear-modern"}>
        <LinearDemo />
      </Match>
      <Match when={props.template.id === "newsprint"}>
        <NewsprintDemo />
      </Match>
      <Match when={props.template.id === "minimalist-modern"}>
        <ModernDemo />
      </Match>
      <Match when={props.template.id === "luxury-editorial"}>
        <LuxuryDemo />
      </Match>
      <Match when={props.template.id === "terminal-cli"}>
        <TerminalDemo />
      </Match>
      <Match when={props.template.id === "swiss-international"}>
        <SwissDemo />
      </Match>
      <Match when={props.template.id === "kinetic-typography"}>
        <KineticDemo />
      </Match>
      <Match when={props.template.id === "material-you"}>
        <MaterialYouDemo />
      </Match>
      <Match when={props.template.id === "neo-brutalism"}>
        <NeoBrutalDemo />
      </Match>
      <Match when={props.template.id === "bold-typography"}>
        <BoldTypographyDemo />
      </Match>
      <Match when={props.template.id === "cyberpunk-glitch"}>
        <CyberpunkGlitchDemo />
      </Match>
      <Match when={props.template.id === "bitcoin-defi"}>
        <BitcoinDefiDemo />
      </Match>
      <Match when={props.template.id === "minimalist-dark"}>
        <MinimalistDarkDemo />
      </Match>
      <Match when={props.template.id === "claymorphism"}>
        <ClaymorphismDemo />
      </Match>
      <Match when={props.template.id === "serif"}>
        <SerifDemo />
      </Match>
      <Match when={props.template.id === "vaporwave-outrun"}>
        <VaporwaveDemo />
      </Match>
      <Match when={props.template.id === "botanical-organic"}>
        <BotanicalDemo />
      </Match>
      <Match when={true}>
        <MonochromeDemo />
      </Match>
    </Switch>
  )
}

export default function PromptsPage() {
  const [selectedId, setSelectedId] = createSignal(promptTemplates[0]?.id)
  const [mode, setMode] = createSignal<(typeof filterModes)[number]>("All")
  const [type, setType] = createSignal<(typeof filterTypes)[number]>("All")
  const [showPrompt, setShowPrompt] = createSignal(false)
  const [previewOpen, setPreviewOpen] = createSignal(false)
  const selected = createMemo(() => promptTemplates.find((template) => template.id === selectedId()) ?? promptTemplates[0])
  const filtered = createMemo(() =>
    promptTemplates.filter((template) => {
      if (mode() !== "All" && template.mode !== mode()) return false
      if (type() !== "All" && template.type !== type()) return false
      return true
    }),
  )

  const copyPrompt = async () => {
    const template = selected()
    if (!template) return
    await navigator.clipboard.writeText(template.prompt)
    showToast({ title: "Prompt copied", description: template.name, icon: "copy" })
  }

  return (
    <div class="prompt-page">
      <aside class="prompt-sidebar">
        <div class="prompt-sidebar-head">
          <h1>Prompt Templates</h1>
          <p>Choose a style, inspect the live example, then copy the original prompt when it fits.</p>
        </div>
        <div class="prompt-filters">
          <div>
            <span>MODE</span>
            <For each={filterModes}>
              {(item) => <FilterButton active={mode() === item} onClick={() => setMode(item)}>{item}</FilterButton>}
            </For>
          </div>
          <div>
            <span>TYPE</span>
            <For each={filterTypes}>
              {(item) => <FilterButton active={type() === item} onClick={() => setType(item)}>{item}</FilterButton>}
            </For>
          </div>
        </div>
        <div class="prompt-list">
          <Switch>
            <Match when={filtered().length > 0}>
              <For each={filtered()}>
                {(template) => (
                  <TemplateCard
                    template={template}
                    selected={selected()?.id === template.id}
                    onSelect={() => {
                      setSelectedId(template.id)
                      setPreviewOpen(false)
                    }}
                  />
                )}
              </For>
            </Match>
            <Match when={true}>
              <div class="prompt-empty">No templates match these filters.</div>
            </Match>
          </Switch>
        </div>
      </aside>

      <main class="prompt-main">
        <Show when={selected()}>
          {(template) => (
            <>
              <header class="prompt-topbar">
                <div class="prompt-topbar-template">
                  <span class="prompt-swatch prompt-swatch-large" data-swatch={template().swatch}>
                    <span />
                  </span>
                  <div>
                    <div class="prompt-title-row">
                      <h2>{template().name}</h2>
                      <span>{template().mode}</span>
                      <span>{template().type}</span>
                    </div>
                    <p>{template().summary}</p>
                  </div>
                </div>
                <div class="prompt-actions">
                  <Button size="large" variant="ghost" onClick={() => setPreviewOpen(true)}>
                    Preview
                  </Button>
                  <Button icon="copy" size="large" onClick={copyPrompt}>
                    Get Prompt
                  </Button>
                  <Button size="large" variant="ghost" onClick={() => setShowPrompt(!showPrompt())}>
                    {showPrompt() ? "Hide Source" : "View Source"}
                  </Button>
                </div>
              </header>

              <div class="prompt-content">
                <section class="prompt-panel prompt-preview-panel">
                  <div class="prompt-preview-shell">
                    <Show
                      when={!previewOpen()}
                      fallback={
                        <div class="prompt-preview-paused">
                          <p>Large preview is open.</p>
                        </div>
                      }
                    >
                      <TemplatePreview template={template()} />
                    </Show>
                  </div>
                </section>

                <Show when={showPrompt()}>
                  <section class="prompt-panel prompt-source-panel">
                    <div class="prompt-panel-head">
                      <div>
                        <h3>Prompt source</h3>
                        <p>Original English prompt stored for this template.</p>
                      </div>
                      <Button icon="copy" size="normal" onClick={copyPrompt}>
                        Copy
                      </Button>
                    </div>
                    <pre>{template().prompt}</pre>
                  </section>
                </Show>
              </div>

              <Show when={previewOpen()}>
                <div class="prompt-preview-modal" role="dialog" aria-modal="true" aria-label={`${template().name} preview`}>
                  <div class="prompt-preview-modal-card">
                    <header class="prompt-preview-modal-head">
                      <div>
                        <h3>{template().name} Preview</h3>
                        <p>Interactive full-size case generated from this prompt.</p>
                      </div>
                      <div class="prompt-preview-modal-actions">
                        <Button icon="copy" size="normal" onClick={copyPrompt}>
                          Get Prompt
                        </Button>
                        <Button size="normal" variant="ghost" onClick={() => setPreviewOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </header>
                    <div class="prompt-preview-modal-shell">
                      <TemplatePreview template={template()} />
                    </div>
                  </div>
                </div>
              </Show>
            </>
          )}
        </Show>
      </main>
    </div>
  )
}
