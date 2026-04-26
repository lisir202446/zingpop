import { For, createMemo, createSignal } from "solid-js"
import "./inspiration.css"

const actions = [
  { label: "基于这个风格开始", mode: "start", direction: "保留这个案例的整体视觉气质，重新生成一个适合我产品目标的完整页面。" },
  { label: "换一版", mode: "vary", direction: "在同一风格族内做一次明显变体，版式、构图和组件节奏都要变化。" },
  { label: "换颜色", mode: "color", direction: "保留版式，重新设计配色、对比关系、强调色和局部纹理。" },
  { label: "做成 App", mode: "app", direction: "把这个风格转成移动端 App 首屏和一个关键功能页。" },
  { label: "做成官网", mode: "site", direction: "把这个风格转成产品官网，包含首屏、卖点、场景、价格或行动入口。" },
] as const

const inspirations = [
  {
    id: "retro-device",
    title: "复古设备商品页",
    domain: "商品官网",
    headline: "Introducing Byte Mint.",
    body: "米白纸张、老设备、衬线大标题和小规格参数，适合硬件、文创、课程或小众品牌。",
    product: "一个能售卖的复古质感产品官网",
    tone: "复古、安静、昂贵、手工印刷感",
    visual: "老电脑/产品盒/小徽章/参数表，使用 CSS 和 SVG 画出设备，不使用外链图",
    height: "large",
    tags: ["serif", "cream", "device"],
  },
  {
    id: "aura-auth",
    title: "暗黑光带认证页",
    domain: "登录 / 安全",
    headline: "Authenticate",
    body: "黑色空间、蓝白光带、浮动登录面板和系统状态文字，适合 AI、隐私、安全、开发者工具。",
    product: "一个有未来感的登录页或控制台入口",
    tone: "克制、神秘、空间感、强对比",
    visual: "发光曲线、暗色玻璃面板、身份按钮、系统刻度",
    height: "large",
    tags: ["dark", "glow", "auth"],
  },
  {
    id: "pastel-event",
    title: "柔和活动落地页",
    domain: "活动 / 服务",
    headline: "给品牌活动一套完整系统",
    body: "粉紫渐变、圆形阵列、轻导航和居中大标题，适合活动报名、服务介绍、女性消费品牌。",
    product: "一个面向报名转化的活动落地页",
    tone: "柔和、明亮、亲和、轻商业",
    visual: "柔光圆球、淡色渐变、圆角胶囊导航、居中主标题",
    height: "large",
    tags: ["pastel", "event", "soft"],
  },
  {
    id: "botanical-poster",
    title: "植物迷宫海报页",
    domain: "视觉展览",
    headline: "Botanical Wayfinder",
    body: "大量手绘笔触围绕中心主题，像海报也像游戏地图，适合展览、音乐、故事项目。",
    product: "一个有强视觉记忆点的作品展示页",
    tone: "有机、密集、手绘、沉浸",
    visual: "用重复短线、彩色颗粒和中心路径模拟植物纹理",
    height: "large",
    tags: ["organic", "poster", "dense"],
  },
  {
    id: "paper-editor",
    title: "纸张编辑器",
    domain: "创作工具",
    headline: "For quieter days",
    body: "纸张、便签、印章、邮票和小按钮叠放，适合写作、日记、内容管理、知识产品。",
    product: "一个轻量创作工具或内容编辑工作台",
    tone: "温暖、纸感、手账、低压",
    visual: "卡纸层叠、邮戳、日期、小圆按钮、微阴影",
    height: "medium",
    tags: ["paper", "editor", "warm"],
  },
  {
    id: "ribbon-system",
    title: "彩带设计系统官网",
    domain: "SaaS 官网",
    headline: "Design systems that carry your product.",
    body: "大号衬线标题、右侧彩色胶囊 3D 条、清晰 CTA，适合组件库、设计工具、协作软件。",
    product: "一个面向付费转化的 SaaS 官网",
    tone: "专业、漂亮、有产品力、轻 3D",
    visual: "用 CSS 胶囊和分段色块模拟 3D 彩带，不依赖生图",
    height: "large",
    tags: ["saas", "ribbon", "3d"],
  },
  {
    id: "sonic-scan",
    title: "声波扫描杂志页",
    domain: "研究 / 数据",
    headline: "Signal Sculpting",
    body: "黑白波形、细线导航、实验室标签和大标题，适合研究报告、数据可视化、AI 工具。",
    product: "一个偏研究感的数据产品首页",
    tone: "理性、实验、黑白、学术科技",
    visual: "SVG 波形、密集横线、扫描标记、论文式分栏",
    height: "medium",
    tags: ["data", "wave", "lab"],
  },
  {
    id: "archive-noir",
    title: "中文暗黑档案馆",
    domain: "内容集合",
    headline: "以往信札",
    body: "黑色背景、竖排中文、暗调封面和档案索引，适合文章集合、影像库、播客专题。",
    product: "一个中文内容合集或知识库首页",
    tone: "安静、神秘、文艺、档案感",
    visual: "暗色封面列、竖排文字、微弱红点、低亮度图片占位",
    height: "medium",
    tags: ["archive", "cn", "noir"],
  },
  {
    id: "blue-portfolio",
    title: "蓝底个人作品集",
    domain: "个人主页",
    headline: "julienne",
    body: "高饱和蓝底、优雅斜体大字和像素小花，适合个人作品、创意开发者、自由职业者。",
    product: "一个不模板化的个人作品集",
    tone: "明亮、个人、艺术、可爱但专业",
    visual: "纯蓝大底、衬线斜体、像素装饰、稀疏导航",
    height: "medium",
    tags: ["portfolio", "blue", "type"],
  },
  {
    id: "st-claire",
    title: "大型排版视觉页",
    domain: "品牌发布",
    headline: "MARLOWE STUDIO",
    body: "超大标题、荧光装饰、深棕背景和展览式信息，适合服装、艺术家、个人品牌发布。",
    product: "一个视觉冲击很强的品牌首屏",
    tone: "大胆、时装、展览、强字体",
    visual: "巨型无衬线字、荧光花朵、暗底网格和小号系统信息",
    height: "medium",
    tags: ["fashion", "type", "bold"],
  },
  {
    id: "academic-catalog",
    title: "学院课程目录",
    domain: "教育 / 内容",
    headline: "Index of Contemporary Lessons",
    body: "左侧课程表、右侧影像预览、密集但清晰，适合教育平台、课程售卖、资料库。",
    product: "一个课程平台或资料目录页",
    tone: "学院、秩序、可信、内容密集",
    visual: "表格、分栏、照片窗口、课程编号和细边框",
    height: "medium",
    tags: ["education", "table", "editorial"],
  },
  {
    id: "mobile-fitness",
    title: "霓黄移动健身页",
    domain: "移动 App",
    headline: "KEEP MOVING",
    body: "高亮黄色、粗黑字体、百分比卡片和底部导航，适合健身、习惯、打卡、健康类 App。",
    product: "一个移动端运动或习惯 App",
    tone: "年轻、直接、高能量、移动优先",
    visual: "手机竖屏比例、亮黄背景、粗线卡片、底部 tab",
    height: "small",
    tags: ["mobile", "fitness", "neon"],
  },
  {
    id: "ad-dashboard",
    title: "广告数据工作台",
    domain: "数据分析",
    headline: "Creative Strategy Lab",
    body: "左侧素材列表、右侧指标图表、冷静卡片，适合投放分析、CRM、运营后台。",
    product: "一个可以扫描数据的运营工作台",
    tone: "实用、信息密集、专业、可比较",
    visual: "筛选栏、图表卡、排行列表、绿色状态标签",
    height: "small",
    tags: ["dashboard", "ads", "charts"],
  },
  {
    id: "gift-card",
    title: "极简礼品卡",
    domain: "支付 / 票券",
    headline: "Member Pass",
    body: "大面积留白、中心卡片、二维码/条形码感，适合会员卡、票券、优惠券、支付结果页。",
    product: "一个礼品卡或票券领取页面",
    tone: "干净、可信、精致、留白",
    visual: "白底、浮动卡片、苹果式图标、条形码纹理",
    height: "small",
    tags: ["card", "payment", "minimal"],
  },
  {
    id: "diagram-paper",
    title: "中文论文图表页",
    domain: "报告 / 白皮书",
    headline: "交互条件：扰动与拓扑",
    body: "中文正文、四宫格图表、学术页码和注释，适合白皮书、研究摘要、知识课程。",
    product: "一个中文研究报告或课程讲义页面",
    tone: "学术、清晰、中文排版、可信",
    visual: "点阵图、网格图、等高线、中文段落和编号",
    height: "medium",
    tags: ["paper", "cn", "diagram"],
  },
  {
    id: "cafe-editorial",
    title: "黑底咖啡社论页",
    domain: "餐饮 / 品牌",
    headline: "Notas sensoriales de cafe lento",
    body: "黑底大衬线、西语标题、底部产品胶囊图，适合咖啡、香氛、餐饮和小众消费品牌。",
    product: "一个高级餐饮或消费品牌页面",
    tone: "高级、慢、社论、感官",
    visual: "黑底、超大白色衬线、低位产品卡、横向胶囊",
    height: "medium",
    tags: ["editorial", "cafe", "black"],
  },
  {
    id: "pixel-builder",
    title: "像素建站工作台",
    domain: "开发者工具",
    headline: "Hello",
    body: "早期软件窗口、蓝色线框、像素图标和系统菜单，适合编辑器、建站器、复古工具。",
    product: "一个有趣的可视化建站或编辑工具",
    tone: "复古软件、像素、玩具感、工具感",
    visual: "窗口边框、蓝色选区、点阵网格、像素 logo",
    height: "large",
    tags: ["pixel", "builder", "retro"],
  },
  {
    id: "generative-texture",
    title: "生成纹理作品页",
    domain: "艺术 / 素材",
    headline: "Noise Atlas",
    body: "彩色噪声纹理、流动图案和小型控制条，适合生成艺术、素材库、AI 视觉工具。",
    product: "一个生成艺术或视觉素材产品页",
    tone: "实验、炫彩、流动、可变化",
    visual: "CSS 径向渐变、噪声感叠层、参数标签和暗色控制条",
    height: "small",
    tags: ["texture", "generative", "color"],
  },
] as const

function buildPrompt(inspiration: (typeof inspirations)[number], action: (typeof actions)[number], idea: string) {
  const target = idea.trim() || "把我的产品想法替换到这里：例如一个给小红书博主使用的内容选题工具"
  return [
    `我要基于「${inspiration.title}」这个视觉方向 DIY 一个产品。`,
    `我的产品目标：${target}`,
    "",
    `本次动作：${action.direction}`,
    "",
    "请你用三类能力协作，但不要让我手动配置模型：",
    "1. 主模型 / 推理代码模型：理解产品目标，拆出页面结构、信息层级、组件状态，并直接生成可运行的前端代码。",
    `2. 视觉模型 / 多模态能力：学习这个风格族的视觉规律：${inspiration.tone}；参考视觉元素：${inspiration.visual}。`,
    "3. 生图能力：只在局部插画、纹理、3D 物件或背景素材需要时使用；不要把整页做成不可编辑的大图。",
    "",
    "生成要求：",
    `- 产品方向：${inspiration.product}`,
    `- 风格标签：${inspiration.tags.join(" / ")}`,
    "- 首屏必须像真实产品，不要空洞营销文案，不要占位 lorem ipsum。",
    "- 优先使用 HTML/CSS/SVG/Canvas 做可编辑视觉，图片只作为局部素材。",
    "- 保证移动端和桌面端都能看，文字不能溢出，按钮和输入框要有真实状态。",
    "- 生成后请做一次自检：视觉完整度、中文文案、响应式、可运行、可继续编辑。",
  ].join("\n")
}

export default function WorkspaceInspiration() {
  const [idea, setIdea] = createSignal("")
  const [active, setActive] = createSignal(buildPrompt(inspirations[0], actions[0], ""))
  const [copied, setCopied] = createSignal("")
  const activePreview = createMemo(() => active().split("\n").slice(0, 6).join("\n"))

  async function copyPrompt(prompt: string, label = "已复制") {
    await navigator.clipboard.writeText(prompt)
    setActive(prompt)
    setCopied(label)
    window.setTimeout(() => setCopied(""), 1600)
  }

  return (
    <div data-page="workspace-inspiration">
      <section data-component="inspiration-hero">
        <div>
          <p data-slot="eyebrow">Zingpop Visual Workshop</p>
          <h1>像刷灵感社区一样，直接选择一个产品风格</h1>
          <p data-slot="body">
            我们把可见案例拆成风格族、视觉规律和提示词参数。你不用找 prompt，写下自己的产品目标，点一个案例就能让 agent 按这个方向开始。
          </p>
        </div>
        <label data-component="idea-box">
          <span>你的产品想法</span>
          <textarea
            value={idea()}
            onInput={(event) => setIdea(event.currentTarget.value)}
            placeholder="例如：给本地探店博主做一个内容选题和报价小工具"
          />
        </label>
      </section>

      <section data-component="inspiration-wall" aria-label="视觉案例墙">
        <For each={inspirations}>
          {(inspiration) => (
            <article data-component="inspiration-card" data-template={inspiration.id} data-size={inspiration.height}>
              <TemplatePreview inspiration={inspiration} />
              <div data-slot="card-meta">
                <div>
                  <p>{inspiration.domain}</p>
                  <h2>{inspiration.title}</h2>
                </div>
                <span>{inspiration.tags[0]}</span>
              </div>
              <div data-slot="card-actions">
                <For each={actions}>
                  {(action) => (
                    <button
                      type="button"
                      onClick={() => copyPrompt(buildPrompt(inspiration, action, idea()), action.label)}
                    >
                      {action.label}
                    </button>
                  )}
                </For>
              </div>
            </article>
          )}
        </For>
      </section>

      <section data-component="prompt-dock">
        <div>
          <span>{copied() || "已准备好内置提示词"}</span>
          <pre>{activePreview()}</pre>
        </div>
        <button type="button" onClick={() => copyPrompt(active(), "提示词已复制")}>
          复制完整提示词
        </button>
      </section>
    </div>
  )
}

function TemplatePreview(props: { inspiration: (typeof inspirations)[number] }) {
  return (
    <div data-component="template-preview">
      <div data-slot="preview-top">
        <span>{props.inspiration.tags[0]}</span>
        <span>{props.inspiration.tags[1]}</span>
      </div>
      <div data-slot="preview-stage">
        <span data-shape="one" />
        <span data-shape="two" />
        <span data-shape="three" />
        <span data-shape="four" />
      </div>
      <div data-slot="preview-copy">
        <p>{props.inspiration.domain}</p>
        <h3>{props.inspiration.headline}</h3>
        <small>{props.inspiration.body}</small>
      </div>
      <div data-slot="preview-footer">
        <For each={props.inspiration.tags}>{(tag) => <span>{tag}</span>}</For>
      </div>
    </div>
  )
}
