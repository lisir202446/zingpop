import { describe, expect, test } from "bun:test"

const root = new URL("../../../../", import.meta.url)

describe("commercialization operations artifacts", () => {
  test("document the security operations launch runbook", async () => {
    const file = Bun.file(new URL("docs/security-operations.md", root))

    expect(await file.exists()).toBe(true)

    const source = await file.text()

    for (const required of [
      "OPENCODE_SERVER_PASSWORD",
      "GitHub token",
      "/etc/zingpop/zingpop.env",
      "database",
      "SMS",
      "model-provider",
      "payment",
      "rate limits",
      "audit logs",
      "command execution",
      "production-backup.sh",
      "production-restore-drill.sh",
      "production-health-check.mjs",
      "production-rotate-local-secrets.sh",
      "zingpop-backup.timer",
      "zingpop-health-check.timer",
      "logrotate",
      "公安联网备案",
      "粤公网安备44010602015865号",
    ]) {
      expect(source).toContain(required)
    }
  })

  test("document third-party license and open-source attribution review", async () => {
    const file = Bun.file(new URL("docs/open-source-notices.md", root))

    expect(await file.exists()).toBe(true)

    const source = await file.text()

    expect(source).toContain("MIT")
    expect(source).toContain("opencode")
    expect(source).toContain("Zingpop is not the official opencode service")
    expect(source).toContain("license audit")
    expect(source).toContain("@openauthjs/openauth")
    expect(source).toContain("@solidjs/start")
  })

  test("document model provider and generative AI compliance gates", async () => {
    const file = Bun.file(new URL("docs/model-provider-compliance.md", root))

    expect(await file.exists()).toBe(true)

    const source = await file.text()

    expect(source).toContain("commercial account")
    expect(source).toContain("data-retention policy")
    expect(source).toContain("training policy")
    expect(source).toContain("cross-border")
    expect(source).toContain("Generative AI Filing")
    expect(source).toContain("Emergency disable switch")
  })

  test("provide repeatable local checks for security, dependencies, and operations", async () => {
    for (const path of [
      "scripts/production-security-check.mjs",
      "scripts/license-audit.mjs",
      "scripts/production-backup.sh",
      "scripts/production-restore-drill.sh",
      "scripts/production-health-check.mjs",
      "scripts/production-rotate-local-secrets.sh",
      "deploy/systemd/zingpop-backup.service",
      "deploy/systemd/zingpop-backup.timer",
      "deploy/systemd/zingpop-health-check.service",
      "deploy/systemd/zingpop-health-check.timer",
      "deploy/logrotate/zingpop",
    ]) {
      const file = Bun.file(new URL(path, root))

      expect(await file.exists()).toBe(true)
    }

    const audit = await Bun.file(new URL("scripts/license-audit.mjs", root)).text()

    expect(audit).toContain("@openauthjs/openauth")
    expect(audit).toContain("@solidjs/start")
  })

  test("database backups work with least-privilege MySQL users", async () => {
    const backup = await Bun.file(new URL("scripts/production-backup.sh", root)).text()

    expect(backup).toContain("--no-tablespaces")
  })
})
