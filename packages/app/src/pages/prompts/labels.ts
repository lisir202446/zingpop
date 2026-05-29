import { type PromptTemplate } from "./data"

export const filterModes = ["All", "Light", "Dark"] as const
export const filterTypes = ["All", "Sans", "Serif", "Mono"] as const

const modeLabels = {
  All: "全部",
  Light: "浅色",
  Dark: "深色",
} satisfies Record<(typeof filterModes)[number], string>

const typeLabels = {
  All: "全部",
  Sans: "无衬线",
  Serif: "衬线",
  Mono: "等宽",
} satisfies Record<(typeof filterTypes)[number], string>

const templateSummaries: Record<string, string> = {
  "minimalist-monochrome": "纯黑白的编辑型设计系统，没有强调色、圆角和阴影。",
  "maximalism-dopamine": "高饱和的愉悦风格，使用电光强调色、叠层阴影、粗边框和动效。",
  bauhaus: "包豪斯构成风格，强调原色块、几何形态、粗黑边框和硬阴影。",
  "linear-modern": "高级开发工具风格，结合电影感景深、靛蓝环境光、玻璃卡片和精准动效。",
  newsprint: "报纸编辑风格，使用锐利网格、衬线标题、密集分栏、纸张纹理和少量红色强调。",
  "minimalist-modern": "自信的现代极简风格，使用电蓝渐变、温暖标题字、留白和精致动效。",
  "luxury-editorial": "精致的高级编辑风格，使用暖色纸面、炭黑文字、金色强调和缓慢图像揭示。",
  "terminal-cli": "赛博工业命令行风格，使用荧光绿文本、分栏窗格、ASCII 结构、扫描线和光标闪烁。",
  "swiss-international": "瑞士国际主义排版风格，使用大字号、可见网格、严格矩形、黑色结构和红色信号。",
  "kinetic-typography": "高能动态排版风格，使用大写字体、跑马灯、酸性黄色反转和粗粝边框。",
  "material-you": "友好的 Material Design 3 风格，使用紫色调表面、胶囊按钮、柔和形态和触感状态层。",
  "neo-brutalism": "高声量新粗野主义风格，使用厚黑边框、硬偏移阴影、纸面底色和饱和色块。",
  "bold-typography": "深色编辑排版风格，强调清晰层级、朱红强调、锐利下划线、细分隔线和直角。",
  "cyberpunk-glitch": "霓虹赛博朋克风格，使用扫描线、HUD 面板、终端提示、色差故障文字和电光焦点。",
  "bitcoin-defi": "数字黄金技术风格，使用黑色虚空背景、比特币橙色光效、玻璃金库卡片和数据排版。",
  "minimalist-dark": "沉稳的深色高级风格，使用石板色层次、暖琥珀光、玻璃卡片和克制间距。",
  claymorphism: "触感黏土风格，使用糖果色、超圆角表面、柔和叠层阴影、玻璃卡片和弹性互动。",
  serif: "经典编辑衬线风格，使用优雅标题、象牙纸面、金色细节、细线规则和充足留白。",
  "botanical-organic": "温暖自然风格，使用鼠尾草绿、陶土色、斜体标题、胶囊按钮、错落卡片和纸张颗粒。",
  "vaporwave-outrun": "复古未来主义风格，使用霓虹品红与青色、CRT 扫描线、透视网格和终端窗口外壳。",
  "corporate-trust": "成熟企业 SaaS 风格，使用靛紫渐变、悬浮卡片、彩色阴影和专业间距。",
  "hand-drawn": "纸张手绘风格，使用不规则边框、硬阴影、手写字体和草图本质感。",
  "industrial-skeuomorphism": "工业拟物风格，使用机箱面板、内嵌屏幕、LED、螺丝、通风口和机械按压状态。",
  "neumorphism-soft-ui": "柔和 Soft UI 风格，使用冷灰同色深度、双向阴影、内嵌凹槽和触感微交互。",
  "organic-natural": "平静的侘寂自然风格，使用米纸纹理、苔藓与陶土色、有机形状和柔和动效。",
  "retro-90s-nostalgia": "早期互联网复古风格，使用 Windows 95 浮雕、平铺背景、跑马灯、彩虹标题和施工条纹。",
}

export const promptModeLabel = (value: (typeof filterModes)[number] | PromptTemplate["mode"]) => modeLabels[value]

export const promptTypeLabel = (value: (typeof filterTypes)[number] | PromptTemplate["type"]) => typeLabels[value]

export const promptTemplateSummary = (template: PromptTemplate) => templateSummaries[template.id] ?? template.summary
