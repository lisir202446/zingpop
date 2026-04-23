import { envFiles, loadDeployEnv, missingDeployEnv } from "../infra/deploy-env.js"

const stage = process.argv[2] ?? "dev"
const env = loadDeployEnv(stage)
const missing = missingDeployEnv(stage)

if (missing.length > 0) {
  console.error(`Missing deploy secrets for stage "${stage}": ${missing.join(", ")}`)
  console.error(`Looked for local files: ${envFiles(stage).join(", ")}`)
  process.exit(1)
}

const child = Bun.spawn(["bun", "sst", "deploy", `--stage=${stage}`], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    ...env,
  },
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
})

process.exit(await child.exited)
