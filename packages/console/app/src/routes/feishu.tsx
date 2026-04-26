import "./brand/index.css"
import { Title, Meta } from "@solidjs/meta"
import { Header } from "~/component/header"
import { Footer } from "~/component/footer"
import { Legal } from "~/component/legal"
import { LocaleLinks } from "~/component/locale-links"

const feishuInvite =
  "https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=738j8655-cd59-4633-a30a-1124e0096789&qr_code=true"

export default function Feishu() {
  return (
    <main data-page="community">
      <Title>Zingpop | 飞书社群</Title>
      <LocaleLinks path="/feishu" />
      <Meta name="description" content="加入 Zingpop 飞书社群，获取国内新手工作流、产品反馈和上手支持。" />
      <div data-component="container">
        <Header />

        <div data-component="content">
          <section data-component="community-content">
            <h1>Zingpop 飞书社群</h1>
            <p>
              加入社群后，可以获得新手上手支持、工作台更新通知、国内模型与支付问题答疑，以及把你的第一个作品继续打磨下去的反馈入口。
            </p>
            <a data-component="download-button" href={feishuInvite} target="_blank" rel="noreferrer">
              加入飞书
            </a>

            <div data-component="community-section">
              <h2>社群能做什么</h2>
              <div data-component="community-grid">
                <div data-component="community-card">
                  <h4>新手上手</h4>
                  <p>不知道第一句该怎么写、该选哪个方向、结果跑不出来时，可以在这里提问。</p>
                </div>
                <div data-component="community-card">
                  <h4>产品反馈</h4>
                  <p>支付、模型、工作台、文档、品牌展示等问题都可以集中反馈。</p>
                </div>
                <div data-component="community-card">
                  <h4>更新通知</h4>
                  <p>Zen、Go、国内模型接入、工作流模板和内测资格会优先在这里同步。</p>
                </div>
              </div>
            </div>

            <div data-component="community-section">
              <h2>提问格式</h2>
              <ol>
                <li>说明你想做什么，例如小游戏、个人主页、小工具或课程展示。</li>
                <li>贴出你在工作台中看到的问题、截图或错误提示。</li>
                <li>说明你用的是 Zen 充值余额还是 Go 订阅额度。</li>
              </ol>
            </div>

            <div data-component="community-section">
              <h2>边界说明</h2>
              <p>
                社群用于产品支持和反馈，不处理敏感个人信息、付款密码、验证码或完整 API 密钥。涉及账户和支付的问题请通过工作台官方入口继续处理。
              </p>
            </div>
          </section>
        </div>

        <Footer />
      </div>
      <Legal />
    </main>
  )
}
