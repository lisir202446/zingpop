import { query, createAsync, RouteSectionProps, useParams, A } from "@solidjs/router"
import "./workspace.css"
import { IconWorkspaceLogo } from "../component/icon"
import { WorkspacePicker } from "./workspace-picker"
import { UserMenu } from "./user-menu"
import { withActor } from "~/context/auth.withActor"
import { User } from "@opencode-ai/console-core/user.js"
import { Actor } from "@opencode-ai/console-core/actor.js"
import { Phone } from "@opencode-ai/console-core/phone.js"
import { useLanguage } from "~/context/language"

const getUserPhone = query(async (workspaceID: string) => {
  "use server"
  return withActor(async () => {
    const actor = Actor.assert("user")
    const phone = await User.getAuthPhone(actor.properties.userID)
    return phone ? Phone.mask(phone) : null
  }, workspaceID)
}, "userPhone")

export default function WorkspaceLayout(props: RouteSectionProps) {
  const params = useParams()
  const language = useLanguage()
  const userPhone = createAsync(() => getUserPhone(params.id!))
  return (
    <main data-page="workspace">
      <header data-component="workspace-header">
        <div data-slot="header-brand">
          <A href={language.route("/")} data-component="site-title">
            <IconWorkspaceLogo />
          </A>
          <WorkspacePicker />
        </div>
        <div data-slot="header-actions">
          <UserMenu login={userPhone()} />
        </div>
      </header>
      <div>{props.children}</div>
    </main>
  )
}
