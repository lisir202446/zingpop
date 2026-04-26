import "../../brand/index.css"
import "./index.css"
import { Title, Meta } from "@solidjs/meta"
import { Header } from "~/component/header"
import { Footer } from "~/component/footer"
import { Legal } from "~/component/legal"
import { LocaleLinks } from "~/component/locale-links"
import { useLanguage } from "~/context/language"

export default function PrivacyPolicy() {
  const language = useLanguage()
  return (
    <main data-page="legal">
      <Title>Zingpop | 隐私政策</Title>
      <LocaleLinks path="/legal/privacy-policy" />
      <Meta name="description" content="Zingpop 隐私政策：个人信息、国内模型、支付、数据安全和用户权利说明。" />
      <div data-component="container">
        <Header />

        <div data-component="content">
          <section data-component="brand-content">
            <article data-component="privacy-policy">
              <h1>隐私政策</h1>
              <p class="effective-date">生效日期：2026 年 4 月 26 日</p>

              <p>
                本政策说明 Zingpop 如何收集、使用、存储、共享和保护你的信息。我们面向国内用户提供服务，并按照
                《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》《中华人民共和国数据安全法》等法律法规处理个人信息。
              </p>

              <h2>我们收集的信息</h2>
              <ul>
                <li>账户信息：邮箱、手机号、登录状态、工作区成员关系和权限。</li>
                <li>使用信息：你在工作台中创建的任务、模型调用记录、余额变动、订阅状态和操作日志。</li>
                <li>内容信息：你主动提交的提示词、项目上下文、文件内容、生成结果和反馈。</li>
                <li>支付信息：订单号、金额、支付渠道、支付状态和发票所需信息；完整支付凭证由支付宝、微信支付等支付机构处理。</li>
                <li>设备与安全信息：浏览器、设备、IP、访问时间、异常请求和风控日志。</li>
              </ul>

              <h2>我们如何使用信息</h2>
              <ul>
                <li>提供 Zingpop 工作台、Zen、Go、余额、订阅和团队协作功能。</li>
                <li>调用已接入的国内模型完成你的请求，并展示任务历史和消费记录。</li>
                <li>处理支付宝、微信支付、退款、发票、月度限额和自动充值。</li>
                <li>定位故障、防止滥用、保障账户和服务安全。</li>
                <li>在你同意或法律允许的范围内发送产品更新、内测通知和服务提醒。</li>
              </ul>

              <h2>模型与训练</h2>
              <p>
                Zingpop 当前优先接入国内模型链路。除完成你的请求、排查问题、计费、安全审计和遵守法定义务外，我们不会将你的输入内容、项目文件或生成结果用于模型训练。
              </p>

              <h2>共享与委托处理</h2>
              <p>为完成服务，我们可能向必要的合作方提供最小范围的信息，例如：</p>
              <ul>
                <li>国内模型服务商，用于处理你的模型请求。</li>
                <li>支付宝、微信支付等支付机构，用于完成付款、退款和对账。</li>
                <li>云服务、短信、邮件、日志和安全服务商，用于基础设施、通知和风险控制。</li>
              </ul>
              <p>我们会要求合作方仅为约定目的处理信息，并采取必要的安全保护措施。</p>

              <h2>存储与安全</h2>
              <p>
                我们会在实现服务目的所需的期限内保存信息，并通过访问控制、加密传输、日志审计和权限隔离保护数据。超出保存期限或不再需要时，我们会删除或匿名化处理相关信息。
              </p>

              <h2>你的权利</h2>
              <p>
                你可以依法访问、更正、复制、删除个人信息，撤回同意，注销账户，或要求解释个人信息处理规则。你可以通过工作台、飞书社群或官方客服入口联系我们。
              </p>

              <h2>未成年人</h2>
              <p>
                如果你未满 14 周岁，应在监护人同意和指导下使用 Zingpop。我们不会主动面向未成年人收集与服务无关的信息。
              </p>

              <h2>政策更新</h2>
              <p>
                如果本政策发生重大变化，我们会在网站、工作台或服务通知中提示。继续使用服务表示你已了解更新后的政策。
              </p>

              <h2>相关文件</h2>
              <p>
                使用 Zingpop 服务还需遵守{" "}
                <a href={language.route("/legal/terms-of-service")}>《服务条款》</a>。
              </p>
            </article>
          </section>
        </div>

        <Footer />
      </div>
      <Legal />
    </main>
  )
}
