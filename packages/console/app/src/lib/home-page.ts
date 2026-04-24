export const homePage = {
  title: "Zingpop",
  eyebrow: "Built for teams shipping inside China",
  description: "短信登录、国内模型接入和本地化支付联调，都先从同一个入口开始。",
  sectionTitle: "先把核心链路跑通",
  sectionBody: "先把登录、支付、模型调用和团队入口联通，再逐步把官网、短信参数和正式支付参数收口。",
  links: [
    { href: "/auth/phone", labelKey: "nav.login", primary: true },
    { href: "/docs", labelKey: "nav.docs", primary: false },
    { href: "/enterprise", labelKey: "nav.enterprise", primary: false },
  ],
  highlights: [
    {
      title: "短信登录",
      body: "支持中国大陆手机号验证码登录，先把团队成员顺滑带进工作区。",
    },
    {
      title: "国内支付",
      body: "围绕支付宝和微信支付做联调，优先把充值和回跳链路跑通。",
    },
    {
      title: "模型接入",
      body: "支持你的国内中转 API，让真实模型调用可以先在现有页面里跑起来。",
    },
  ],
  steps: [
    {
      title: "登录进入工作区",
      body: "手机号验证码通过后自动落到你的默认工作区，不再先看到旧官网。",
    },
    {
      title: "联调支付和余额",
      body: "在开发态先打通充值动作、回跳地址和余额变化，再接正式支付参数。",
    },
    {
      title: "继续扩展团队功能",
      body: "成员管理、企业版和模型接入继续沿用同一套后台，不做重复系统。",
    },
  ],
} as const
