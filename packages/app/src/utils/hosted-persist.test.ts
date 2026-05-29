import { describe, expect, test } from "bun:test"
import { globalSyncProjectPersistTarget } from "@/context/global-sync"
import { serverPersistTarget } from "@/context/server"

describe("hosted workbench persistence", () => {
  test("uses separate server storage for the hosted workbench", () => {
    expect(serverPersistTarget(true).key).toBe("server.zingpop")
    expect(serverPersistTarget(false).key).toBe("server")
  })

  test("uses separate project cache storage for the hosted workbench", () => {
    expect(globalSyncProjectPersistTarget(true).key).toBe("globalSync.project.zingpop")
    expect(globalSyncProjectPersistTarget(false).key).toBe("globalSync.project")
  })
})
