import "../../brand/index.css"
import "./index.css"
import { Title, Meta } from "@solidjs/meta"
import { Header } from "~/component/header"
import { Footer } from "~/component/footer"
import { Legal } from "~/component/legal"
import { LocaleLinks } from "~/component/locale-links"
import { useLanguage } from "~/context/language"

export default function TermsOfService() {
  const language = useLanguage()
  return (
    <main data-page="legal">
      <Title>Zingpop | 服务条款</Title>
      <LocaleLinks path="/legal/terms-of-service" />
      <Meta name="description" content="Zingpop 服务条款：账户、国内模型、支付、内容权利、退款和使用边界。" />
      <div data-component="container">
        <Header />

        <div data-component="content">
          <section data-component="brand-content">
            <article data-component="terms-of-service">
              <h1>服务条款</h1>
              <p class="effective-date">生效日期：2026 年 4 月 26 日</p>

              <p>
                欢迎使用 Zingpop。本条款适用于 Zingpop 网站、工作台、Zen、Go、模型调用、支付和相关支持服务。使用服务即表示你已阅读并同意本条款以及
                <a href={language.route("/legal/privacy-policy")}>《隐私政策》</a>。
              </p>

              <h2>服务内容</h2>
              <p>
                Zingpop 面向国内新手和创作者提供 AI 产品工作台，帮助用户通过中文描述生成、修改和管理项目。我们当前优先接入国内模型、人民币计价和支付宝、微信支付。
              </p>

              <h2>账户与工作区</h2>
              <ul>
                <li>你应使用真实、可联系的信息注册和管理账户。</li>
                <li>你应妥善保管登录凭证、API 密钥和工作区权限。</li>
                <li>工作区管理员可以管理成员、模型、计费、限额和密钥。</li>
                <li>因你主动分享、泄露或误配置造成的损失，由你自行承担。</li>
              </ul>

              <h2>模型与输出</h2>
              <p>
                AI 输出可能不准确、不完整或不适合直接上线。你需要自行审查生成内容、代码、图片、文案、合规材料和商业判断。Zingpop 不保证任何输出一定可用、合法、无侵权或能产生商业收益。
              </p>

              <h2>支付、余额与订阅</h2>
              <ul>
                <li>Zen 以人民币余额按实际使用消耗，页面会展示充值金额、余额和消费记录。</li>
                <li>Go 为订阅方案，价格、额度、续费周期和优惠以页面展示为准。</li>
                <li>当前优先支持支付宝和微信支付；自动充值仅在你主动开启并设置规则后执行。</li>
                <li>如因支付渠道、风控或法律要求导致交易失败，服务可能暂时不可用。</li>
              </ul>

              <h2>退款与取消</h2>
              <p>
                未消耗余额、订阅取消和异常扣费可通过工作台或官方客服入口提交处理。已实际消耗的模型成本通常不支持退还；法律法规另有规定的除外。
              </p>

              <h2>用户内容与权利</h2>
              <p>
                你保留对自己输入内容和合法生成结果的权利。你授予 Zingpop 为提供、维护和改进当前服务所必需的处理权限。你不得上传侵犯他人权益、违法违规、含恶意代码或危害网络安全的内容。
              </p>

              <h2>禁止行为</h2>
              <ul>
                <li>绕过限额、盗用他人账户、批量注册、攻击或干扰服务。</li>
                <li>生成、传播违法违规、侵权、欺诈、恶意软件或危害公共安全的内容。</li>
                <li>将服务用于违反《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》等法律法规的活动。</li>
                <li>未经授权抓取、转售、出租、转让或包装 Zingpop 服务。</li>
              </ul>

              <h2>服务变更与中止</h2>
              <p>
                我们可能根据模型供应、支付渠道、合规要求和产品调整变更功能、价格、额度或服务范围。涉及重大变化时，我们会通过页面、工作台或通知进行提示。
              </p>

              <h2>责任限制</h2>
              <p>
                在法律允许范围内，Zingpop 对间接损失、预期收益、业务中断、数据丢失或第三方服务导致的问题不承担超出已支付服务费用范围的责任。
              </p>

              <h2>争议处理</h2>
              <p>
                与本服务相关的争议应优先友好协商解决。协商不成的，适用中华人民共和国法律，并提交 Zingpop 运营方所在地有管辖权的人民法院处理。
              </p>

              <h2>联系我们</h2>
              <p>如需账户、支付、隐私或合规支持，请通过工作台、飞书社群或官方客服入口联系我们。</p>
            </article>
          </section>
        </div>

        <Footer />
      </div>
      <Legal />
    </main>
  )
}
