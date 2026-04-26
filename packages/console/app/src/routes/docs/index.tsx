import "../brand/index.css"
import { Title, Meta } from "@solidjs/meta"
import { Header } from "~/component/header"
import { Footer } from "~/component/footer"
import { Legal } from "~/component/legal"
import { LocaleLinks } from "~/component/locale-links"

export default function Docs() {
  return (
    <main data-page="docs">
      <Title>Zingpop | 文档</Title>
      <LocaleLinks path="/docs" />
      <Meta
        name="description"
        content="Zingpop 文档：国内模型、工作台、Zen、Go、支付、隐私和新手上手说明。"
      />
      <div data-component="container">
        <Header />

        <div data-component="content">
          <section data-component="docs-content">
            <h1>Zingpop 文档</h1>
            <p>
              这里是 Zingpop 面向国内新手和创作者的第一方文档。文档优先解释如何进入工作台、使用国内模型、完成支付宝或微信支付，以及如何保护数据。
            </p>

            <div data-component="docs-grid">
              <a data-component="docs-card" href="#quick-start">
                <h4>快速开始</h4>
                <p>从登录到第一个结果。</p>
              </a>
              <a data-component="docs-card" href="#how-it-works">
                <h4>Zen 如何工作</h4>
                <p>国内模型、充值余额和自动续充。</p>
              </a>
              <a data-component="docs-card" href="#pricing">
                <h4>价格与支付</h4>
                <p>人民币余额、支付宝和微信支付。</p>
              </a>
              <a data-component="docs-card" href="#privacy">
                <h4>隐私与安全</h4>
                <p>国内模型链路和数据使用边界。</p>
              </a>
            </div>

            <section id="quick-start" data-component="docs-section">
              <h2>快速开始</h2>
              <ol>
                <li>登录 Zingpop，进入工作台。</li>
                <li>选择一个具体目标，例如小游戏、个人主页、小工具或作品展示。</li>
                <li>用中文描述你想要的结果，Zingpop 会优先使用已接入的国内模型。</li>
                <li>看到第一版后继续修改文案、样式、页面结构和交互。</li>
              </ol>
            </section>

            <section id="how-it-works" data-component="docs-section">
              <h2>Zen 如何工作</h2>
              <p>
                Zen 是 Zingpop 筛选后的国内模型入口。用户不需要自己比较国外模型、申请外币卡或处理复杂代理配置，先用稳定的中文任务路径把结果跑出来。
              </p>
              <ol>
                <li>充值人民币余额，当前入口从 ¥20 起。</li>
                <li>发起任务后按实际模型使用量消耗余额。</li>
                <li>余额不足时提醒续充；如开启自动充值，会按用户设置的阈值和金额执行。</li>
              </ol>
            </section>

            <section id="go" data-component="docs-section">
              <h2>Go 如何工作</h2>
              <p>
                Go 是给高频使用者的订阅方案，面向国内用户提供更稳定的模型额度。订阅、续费和取消都应在 Zingpop 工作台中完成。
              </p>
              <ul>
                <li>首月优惠价以页面展示为准。</li>
                <li>订阅后仍可使用余额处理超出额度或额外模型请求。</li>
                <li>目前优先接入支付宝和微信支付。</li>
              </ul>
            </section>

            <section id="pricing" data-component="docs-section">
              <h2>价格与支付</h2>
              <p>
                Zingpop 面向国内用户使用人民币计价。充值、订阅和自动续充会显示清楚的金额、支付方式、余额和消费记录。
              </p>
              <ul>
                <li>支持支付宝和微信支付。</li>
                <li>支持月度消费限额，适合个人学习、课堂或小团队试用。</li>
                <li>订单、余额和订阅状态应在工作台计费页可追踪。</li>
              </ul>
            </section>

            <section id="workspace" data-component="docs-section">
              <h2>工作台</h2>
              <p>
                工作台是用户真正使用 Zingpop 的地方。它应优先展示任务、模型、余额、成员和历史记录，而不是把新手带到外部文档或国外模型账户。
              </p>
              <ul>
                <li>模型页只展示已接入的国内模型。</li>
                <li>计费页展示人民币余额、支付宝和微信支付。</li>
                <li>API 密钥和成员权限用于团队、课堂或多项目管理。</li>
              </ul>
            </section>

            <section id="privacy" data-component="docs-section">
              <h2>隐私与安全</h2>
              <p>
                Zingpop 当前产品口径是国内模型优先。除完成用户请求、计费、安全审计和法定义务外，不应将用户输入、项目内容或生成结果用于模型训练。
              </p>
              <ul>
                <li>模型服务优先使用国内可用链路。</li>
                <li>支付信息由支付宝、微信支付等支付机构处理。</li>
                <li>用户可以通过工作台、飞书社群或官方客服渠道反馈数据与账户问题。</li>
              </ul>
            </section>
          </section>
        </div>

        <Footer />
      </div>
      <Legal />
    </main>
  )
}
