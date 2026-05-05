import minimalistMonochromePrompt from "./templates/minimalist-monochrome.prompt.txt?raw"
import maximalismDopaminePrompt from "./templates/maximalism-dopamine.prompt.txt?raw"
import bauhausPrompt from "./templates/bauhaus.prompt.txt?raw"
import linearModernPrompt from "./templates/linear-modern.prompt.txt?raw"
import newsprintPrompt from "./templates/newsprint.prompt.txt?raw"
import minimalistModernPrompt from "./templates/minimalist-modern.prompt.txt?raw"
import luxuryEditorialPrompt from "./templates/luxury-editorial.prompt.txt?raw"
import terminalCliPrompt from "./templates/terminal-cli.prompt.txt?raw"
import swissInternationalPrompt from "./templates/swiss-international.prompt.txt?raw"
import kineticTypographyPrompt from "./templates/kinetic-typography.prompt.txt?raw"
import materialYouPrompt from "./templates/material-you.prompt.txt?raw"
import neoBrutalismPrompt from "./templates/neo-brutalism.prompt.txt?raw"
import boldTypographyPrompt from "./templates/bold-typography.prompt.txt?raw"
import cyberpunkGlitchPrompt from "./templates/cyberpunk-glitch.prompt.txt?raw"
import bitcoinDefiPrompt from "./templates/bitcoin-defi.prompt.txt?raw"
import minimalistDarkPrompt from "./templates/minimalist-dark.prompt.txt?raw"
import claymorphismPrompt from "./templates/claymorphism.prompt.txt?raw"
import serifPrompt from "./templates/serif.prompt.txt?raw"
import botanicalOrganicPrompt from "./templates/botanical-organic.prompt.txt?raw"
import vaporwaveOutrunPrompt from "./templates/vaporwave-outrun.prompt.txt?raw"
import corporateTrustPrompt from "./templates/corporate-trust.prompt.txt?raw"
import handDrawnPrompt from "./templates/hand-drawn.prompt.txt?raw"
import industrialSkeuomorphismPrompt from "./templates/industrial-skeuomorphism.prompt.txt?raw"
import neumorphismPrompt from "./templates/neumorphism.prompt.txt?raw"
import organicNaturalPrompt from "./templates/organic-natural.prompt.txt?raw"
import retro90sPrompt from "./templates/retro-90s-nostalgia.prompt.txt?raw"

export type PromptTemplate = {
  id: string
  name: string
  shortName: string
  mode: "Light" | "Dark"
  type: "Sans" | "Serif" | "Mono"
  summary: string
  prompt: string
  index: string
  swatch:
    | "monochrome"
    | "dopamine"
    | "bauhaus"
    | "linear"
    | "newsprint"
    | "modern"
    | "luxury"
    | "terminal"
    | "swiss"
    | "kinetic"
    | "material"
    | "neo"
    | "bold"
    | "cyber"
    | "bitcoin"
    | "dark"
    | "clay"
    | "serif"
    | "botanical"
    | "vaporwave"
    | "corporate"
    | "handdrawn"
    | "industrial"
    | "neumorphic"
    | "organic"
    | "retro90s"
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "minimalist-monochrome",
    name: "Monochrome",
    shortName: "Monochrome",
    mode: "Light",
    type: "Serif",
    summary: "A stark, editorial design system built on pure black and white. No accents, no radius, no shadows.",
    prompt: minimalistMonochromePrompt,
    index: "01",
    swatch: "monochrome",
  },
  {
    id: "maximalism-dopamine",
    name: "Dopamine",
    shortName: "Dopamine",
    mode: "Dark",
    type: "Sans",
    summary: "A joyful maximalist system with electric accents, stacked shadows, thick borders, motion, and layered patterns.",
    prompt: maximalismDopaminePrompt,
    index: "02",
    swatch: "dopamine",
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    shortName: "Bauhaus",
    mode: "Light",
    type: "Sans",
    summary: "A constructivist system of primary color blocks, geometric forms, thick black borders, and hard shadows.",
    prompt: bauhausPrompt,
    index: "03",
    swatch: "bauhaus",
  },
  {
    id: "linear-modern",
    name: "Linear",
    shortName: "Linear",
    mode: "Dark",
    type: "Sans",
    summary: "A premium developer-tool system with cinematic depth, ambient indigo lighting, glass cards, and precise motion.",
    prompt: linearModernPrompt,
    index: "04",
    swatch: "linear",
  },
  {
    id: "newsprint",
    name: "Newsprint",
    shortName: "Newsprint",
    mode: "Light",
    type: "Serif",
    summary: "An editorial newspaper system with sharp grids, serif drama, dense columns, paper texture, and sparse red accents.",
    prompt: newsprintPrompt,
    index: "05",
    swatch: "newsprint",
  },
  {
    id: "minimalist-modern",
    name: "Modern",
    shortName: "Modern",
    mode: "Light",
    type: "Sans",
    summary: "A confident minimalist system with electric blue gradients, warm display type, airy spacing, and polished motion.",
    prompt: minimalistModernPrompt,
    index: "06",
    swatch: "modern",
  },
  {
    id: "luxury-editorial",
    name: "Luxury",
    shortName: "Luxury",
    mode: "Light",
    type: "Serif",
    summary: "A refined editorial system with warm alabaster paper, charcoal typography, gold accents, cinematic spacing, and slow image reveals.",
    prompt: luxuryEditorialPrompt,
    index: "07",
    swatch: "luxury",
  },
  {
    id: "terminal-cli",
    name: "Terminal",
    shortName: "Terminal",
    mode: "Dark",
    type: "Mono",
    summary: "A cyber-industrial CLI system with phosphor green text, panes, ASCII structure, scanlines, status codes, and blinking cursors.",
    prompt: terminalCliPrompt,
    index: "08",
    swatch: "terminal",
  },
  {
    id: "swiss-international",
    name: "Swiss",
    shortName: "Swiss",
    mode: "Light",
    type: "Sans",
    summary: "An objective typographic system with massive Inter-style type, visible grids, strict rectangles, black structure, and Swiss red signals.",
    prompt: swissInternationalPrompt,
    index: "09",
    swatch: "swiss",
  },
  {
    id: "kinetic-typography",
    name: "Kinetic",
    shortName: "Kinetic",
    mode: "Dark",
    type: "Sans",
    summary: "A high-energy web system where uppercase type, constant marquees, acid yellow inversions, and brutalist borders create motion.",
    prompt: kineticTypographyPrompt,
    index: "10",
    swatch: "kinetic",
  },
  {
    id: "material-you",
    name: "Material You",
    shortName: "Material",
    mode: "Light",
    type: "Sans",
    summary: "A friendly Material Design 3 system with tonal purple surfaces, pill buttons, organic blur shapes, and tactile state layers.",
    prompt: materialYouPrompt,
    index: "11",
    swatch: "material",
  },
  {
    id: "neo-brutalism",
    name: "Neo Brutal",
    shortName: "Neo",
    mode: "Light",
    type: "Sans",
    summary: "A loud neo-brutalist system with thick black borders, hard offset shadows, cream paper, saturated blocks, and mechanical clicks.",
    prompt: neoBrutalismPrompt,
    index: "12",
    swatch: "neo",
  },
  {
    id: "bold-typography",
    name: "Bold Type",
    shortName: "Bold Type",
    mode: "Dark",
    type: "Sans",
    summary: "A dark editorial typography system with sharp hierarchy, vermillion accents, crisp underlines, thin dividers, and no rounded corners.",
    prompt: boldTypographyPrompt,
    index: "13",
    swatch: "bold",
  },
  {
    id: "cyberpunk-glitch",
    name: "Cyber Glitch",
    shortName: "Cyber",
    mode: "Dark",
    type: "Mono",
    summary: "A neon cyberpunk system with scanlines, chamfered HUD panels, terminal prompts, chromatic glitch text, and electric focus states.",
    prompt: cyberpunkGlitchPrompt,
    index: "14",
    swatch: "cyber",
  },
  {
    id: "bitcoin-defi",
    name: "Bitcoin DeFi",
    shortName: "Bitcoin",
    mode: "Dark",
    type: "Sans",
    summary: "A technical digital-gold system with true void backgrounds, Bitcoin orange glow, glass vault cards, grid textures, and precise data typography.",
    prompt: bitcoinDefiPrompt,
    index: "15",
    swatch: "bitcoin",
  },
  {
    id: "minimalist-dark",
    name: "Minimalist Dark",
    shortName: "Dark",
    mode: "Dark",
    type: "Sans",
    summary: "An atmospheric dark system with layered slate surfaces, warm amber glow, glass cards, subtle borders, and calm premium spacing.",
    prompt: minimalistDarkPrompt,
    index: "16",
    swatch: "dark",
  },
  {
    id: "claymorphism",
    name: "Claymorphism",
    shortName: "Clay",
    mode: "Light",
    type: "Sans",
    summary: "A tactile digital-clay system with candy colors, super-rounded surfaces, layered soft shadows, glass cards, and squishy interactions.",
    prompt: claymorphismPrompt,
    index: "17",
    swatch: "clay",
  },
  {
    id: "serif",
    name: "Serif",
    shortName: "Serif",
    mode: "Light",
    type: "Serif",
    summary: "A timeless editorial system with Playfair-style headlines, ivory paper, burnished gold accents, fine rules, small caps, and generous whitespace.",
    prompt: serifPrompt,
    index: "18",
    swatch: "serif",
  },
  {
    id: "botanical-organic",
    name: "Botanical",
    shortName: "Botanical",
    mode: "Light",
    type: "Serif",
    summary: "A warm organic system with earthy sage and terracotta, Playfair italic headlines, pill buttons, staggered cards, paper grain texture, and generous breathing space.",
    prompt: botanicalOrganicPrompt,
    index: "19",
    swatch: "botanical",
  },
  {
    id: "vaporwave-outrun",
    name: "Vaporwave",
    shortName: "Vapor",
    mode: "Dark",
    type: "Sans",
    summary: "A retro-futurist system with neon magenta and cyan glows, Orbitron headings, CRT scanlines, perspective grids, skewed buttons, and terminal window chrome.",
    prompt: vaporwaveOutrunPrompt,
    index: "20",
    swatch: "vaporwave",
  },
  {
    id: "corporate-trust",
    name: "Corporate Trust",
    shortName: "Trust",
    mode: "Light",
    type: "Sans",
    summary:
      "A polished enterprise SaaS system with indigo-violet gradients, elevated cards, colored shadows, and warm professional spacing.",
    prompt: corporateTrustPrompt,
    index: "21",
    swatch: "corporate",
  },
  {
    id: "hand-drawn",
    name: "Hand Drawn",
    shortName: "Sketch",
    mode: "Light",
    type: "Sans",
    summary:
      "A playful paper-and-marker system with wobbly borders, hard offset shadows, handwritten type, and sketchbook energy.",
    prompt: handDrawnPrompt,
    index: "22",
    swatch: "handdrawn",
  },
  {
    id: "industrial-skeuomorphism",
    name: "Industrial",
    shortName: "Machine",
    mode: "Light",
    type: "Sans",
    summary:
      "A tactile industrial realism system with neumorphic chassis panels, recessed screens, LEDs, screws, vents, and mechanical press states.",
    prompt: industrialSkeuomorphismPrompt,
    index: "23",
    swatch: "industrial",
  },
  {
    id: "neumorphism-soft-ui",
    name: "Neumorphism",
    shortName: "Soft UI",
    mode: "Light",
    type: "Sans",
    summary:
      "A calm Soft UI system with cool-grey same-surface depth, dual RGB shadows, deep inset wells, rounded controls, and tactile micro-interactions.",
    prompt: neumorphismPrompt,
    index: "24",
    swatch: "neumorphic",
  },
  {
    id: "organic-natural",
    name: "Organic Natural",
    shortName: "Organic",
    mode: "Light",
    type: "Serif",
    summary:
      "A peaceful wabi-sabi system with rice-paper texture, moss and clay tones, amorphous blobs, organic radii, and gentle natural motion.",
    prompt: organicNaturalPrompt,
    index: "25",
    swatch: "organic",
  },
  {
    id: "retro-90s-nostalgia",
    name: "Retro 90s",
    shortName: "90s",
    mode: "Light",
    type: "Sans",
    summary:
      "A loud early-web system with Windows 95 bevels, tiled backgrounds, marquee text, rainbow headings, hit counters, title bars, and construction stripes.",
    prompt: retro90sPrompt,
    index: "26",
    swatch: "retro90s",
  },
]
