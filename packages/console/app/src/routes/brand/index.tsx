import "./index.css"
import { Title, Meta } from "@solidjs/meta"
import { Header } from "~/component/header"
import { Footer } from "~/component/footer"
import { Legal } from "~/component/legal"
import { useI18n } from "~/context/i18n"
import { LocaleLinks } from "~/component/locale-links"

export default function Brand() {
  const i18n = useI18n()

  return (
    <main data-page="brand">
      <Title>{i18n.t("brand.title")}</Title>
      <LocaleLinks path="/brand" />
      <Meta name="description" content={i18n.t("brand.meta.description")} />
      <div data-component="container">
        <Header />

        <div data-component="content">
          <section data-component="brand-content">
            <h1>{i18n.t("brand.heading")}</h1>
            <p>{i18n.t("brand.subtitle")}</p>

            <div data-component="brand-mark">
              <strong>Zingpop</strong>
              <span>给国内新手和创作者用的 AI 产品工作台。</span>
            </div>

            <div data-component="brand-system">
              <h2>名称与定位</h2>
              <div data-component="brand-grid">
                <div data-component="brand-card">
                  <h4>品牌名</h4>
                  <p>始终写作 Zingpop，中文语境中不翻译、不拆分，所有用户可见位置统一使用这个名称。</p>
                </div>
                <div data-component="brand-card">
                  <h4>一句话</h4>
                  <p>不会代码，也能先把想法做成可以看的第一版。</p>
                </div>
                <div data-component="brand-card">
                  <h4>核心受众</h4>
                  <p>国内个人新手、创作者、老师、小店主和想把想法快速做出来的人。</p>
                </div>
              </div>
            </div>

            <div data-component="brand-system">
              <h2>视觉规范</h2>
              <p>整体保持克制、清楚、可阅读。Zingpop 可以有一点轻松感，但界面优先服务任务完成，不做营销噪音。</p>
              <div data-component="swatches">
                <div data-component="swatch" style="--swatch: hsl(0, 5%, 12%)">
                  <span />
                  <strong>Ink</strong>
                  <span>主文字与按钮</span>
                </div>
                <div data-component="swatch" style="--swatch: hsl(0, 20%, 99%)">
                  <span />
                  <strong>Paper</strong>
                  <span>页面背景</span>
                </div>
                <div data-component="swatch" style="--swatch: hsl(62, 84%, 88%)">
                  <span />
                  <strong>Signal</strong>
                  <span>轻提示与选中</span>
                </div>
              </div>
            </div>

            <div data-component="brand-system">
              <h2>文案语气</h2>
              <ul>
                <li>先说用户能做什么，再说技术能力。</li>
                <li>使用“工作台、国内模型、支付宝、微信支付、充值余额”等国内用户能马上理解的词。</li>
                <li>避免把新手带进模型厂商、国外账户、外币卡和复杂配置的叙述里。</li>
                <li>可以温和、有陪伴感，但不要夸大承诺，不暗示结果一定商业成功。</li>
              </ul>
            </div>

            <div data-component="brand-system">
              <h2>使用边界</h2>
              <div data-component="brand-grid">
                <div data-component="brand-card">
                  <h4>可以</h4>
                  <p>用 Zingpop 描述产品、工作台、Zen、Go、文档、社群、支付和隐私政策。</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <Footer />
      </div>
      <Legal />
    </main>
  )
}
