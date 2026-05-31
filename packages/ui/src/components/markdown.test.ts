import { expect, test } from "bun:test"
import { zingpopUrl } from "./markdown"

test("zingpopUrl normalizes public support and homepage URLs", () => {
  expect(zingpopUrl("主页：https://zingpop.ai")).toBe("主页：https://www.zingpop.cn")
  expect(zingpopUrl("支持：https://zingpop.ai/support")).toBe("支持：https://www.zingpop.cn")
  expect(zingpopUrl("主页：http://opencode.ai")).toBe("主页：https://www.zingpop.cn")
  expect(zingpopUrl("社区：opencode.ai/discord")).toBe("社区：www.zingpop.cn")
})
