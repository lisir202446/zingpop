import { useLanguage } from "~/context/language"
import { LegalPage } from "../common"

export default function DataProcessingNotice() {
  const language = useLanguage()
  return (
    <LegalPage
      path="/legal/data-processing"
      title="数据处理说明"
      description="Zingpop 数据处理说明：数据类别、处理目的、保存期限、训练政策、导出和删除路径。"
    >
      <h1>数据处理说明</h1>
      <p class="effective-date">生效日期：2026 年 5 月 27 日</p>

      <p>
        本说明补充
        <a href={language.route("/legal/privacy-policy")}>《隐私政策》</a>
        ，帮助你理解 Zingpop 在工作台、项目、模型调用、支付和安全运营中的数据处理边界。
      </p>

      <h2>处理范围</h2>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>数据类别</th>
              <th>处理目的</th>
              <th>典型保存期限</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>手机号、账号标识、登录日志</td>
              <td>注册、登录、找回密码、异常登录保护、账号支持</td>
              <td>账号存续期间；安全日志按运营和法律要求留存</td>
            </tr>
            <tr>
              <td>工作区、项目、文件、Git 导入记录</td>
              <td>提供项目管理、文件读取、会话上下文和同步能力</td>
              <td>账号或项目存续期间；删除后按流程清理或匿名化</td>
            </tr>
            <tr>
              <td>提示词、模型输出、命令输出</td>
              <td>完成模型请求、展示结果、排障、计费和安全审计</td>
              <td>按会话和项目设置保存；可按删除流程请求清理</td>
            </tr>
            <tr>
              <td>支付、余额、订阅、发票信息</td>
              <td>计费、对账、退款、发票、财务和税务合规</td>
              <td>按交易、税务、审计和争议处理要求留存</td>
            </tr>
            <tr>
              <td>IP、设备、Cookie、风控日志</td>
              <td>认证、安全、限流、防滥用、故障定位</td>
              <td>按安全运营需要留存，超期删除或匿名化</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>私有代码训练政策</h2>
      <p>
        Zingpop 默认不使用私有客户代码、项目文件、提示词和模型输出训练模型。只有在你明确选择参与反馈、案例、评测或改进计划时，我们才会按单独说明处理相关材料。
      </p>

      <h2>导出、复制和删除</h2>
      <p>
        你可以请求导出账号基础信息、项目文件、订单记录和可复制的个人信息。删除、注销和保留例外见
        <a href={language.route("/legal/account-deletion")}>《账号注销与数据删除》</a>。
      </p>

      <h2>处理者与委托处理</h2>
      <p>
        第三方处理者类别、处理目的和可能的跨境情形见
        <a href={language.route("/legal/third-party-disclosures")}>《第三方服务披露》</a>。
      </p>
    </LegalPage>
  )
}
