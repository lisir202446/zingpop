/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  async app(input) {
    const { loadDeployEnv } = await import("./infra/deploy-env.js")
    const env = loadDeployEnv(input?.stage)
    return {
      name: "opencode",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "cloudflare",
      providers: {
        cloudflare: {
          apiToken: env.CLOUDFLARE_API_TOKEN,
        },
        stripe: {
          apiKey: env.STRIPE_SECRET_KEY,
        },
        planetscale: "0.4.1",
      },
    }
  },
  async run() {
    await import("./infra/app.js")
    await import("./infra/console.js")
    await import("./infra/enterprise.js")
  },
})
