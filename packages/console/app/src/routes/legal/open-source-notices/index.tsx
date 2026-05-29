import { LegalPage } from "../common"

export default function OpenSourceNotices() {
  return (
    <LegalPage
      path="/legal/open-source-notices"
      title="开源与第三方声明"
      description="Zingpop 开源与第三方声明：MIT 许可、opencode 归属、第三方依赖和品牌边界。"
    >
      <h1>开源与第三方声明</h1>
      <p class="effective-date">生效日期：2026 年 5 月 27 日</p>

      <h2>开源许可</h2>
      <p>
        Zingpop 的工作台技术栈包含基于 MIT 许可的开源组件，并保留原始版权和许可声明。除非页面另有说明，Zingpop 自有品牌、商标、域名、运营资料和商业服务不因开源许可而授予额外商标或服务经营权。
      </p>

      <h2>与 opencode 的关系</h2>
      <p>
        Zingpop 基于开源技术和自有产品层构建，不是 opencode 官方服务，也不代表 opencode 原项目方运营、背书或承担支持责任。涉及原项目的版权、MIT 许可和开源归属会在仓库 LICENSE、NOTICE 或第三方声明中保留。
      </p>

      <h2>第三方依赖</h2>
      <p>
        产品使用的运行时、前端框架、图标、字体、SDK、支付、短信、云服务、模型供应商和构建工具可能适用各自的许可、条款和商用限制。上线前应运行依赖 license audit，并对 GPL、AGPL、SSPL、专有许可、字体、图标、图片、SDK 和模型供应商条款做商业用途复核。
      </p>

      <h2>品牌边界</h2>
      <p>
        用户可见界面应优先使用 Zingpop 品牌。只有在保留开源归属、许可声明、兼容性说明或技术文档需要时，才应出现 opencode 名称，且不得暗示 Zingpop 是 opencode 官方服务。
      </p>
    </LegalPage>
  )
}
