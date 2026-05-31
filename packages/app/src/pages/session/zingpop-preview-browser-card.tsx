import { Button } from "@opencode-ai/ui/button"
import { Icon } from "@opencode-ai/ui/icon"
import { showToast } from "@opencode-ai/ui/toast"
import type { PreviewArtifact } from "@/utils/zingpop-preview"

function absoluteUrl(url: string) {
  return new URL(url, window.location.origin).toString()
}

export async function copyPreviewArtifact(artifact: PreviewArtifact) {
  await navigator.clipboard.writeText(absoluteUrl(artifact.url))
  showToast({ variant: "success", icon: "circle-check", title: "预览链接已复制" })
}

export function zingpopPreviewBrowserCardConfig(artifact: PreviewArtifact) {
  return {
    title: "网页预览",
    openLabel: "新窗口打开",
    copyLabel: "复制链接",
    iframeSrc: artifact.fileUrl,
    openHref: artifact.url,
  }
}

export function ZingpopPreviewBrowserCard(props: { artifact: PreviewArtifact }) {
  const card = () => zingpopPreviewBrowserCardConfig(props.artifact)

  return (
    <div
      data-component="zingpop-preview-browser-card"
      class="mx-4 mb-4 overflow-hidden rounded-md border border-border-weak-base bg-background-base shadow-sm md:mx-5"
    >
      <div class="flex min-w-0 items-center justify-between gap-3 border-b border-border-weaker-base px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-md bg-background-stronger text-icon-base">
            <Icon name="window-cursor" size="medium" />
          </div>
          <div class="min-w-0">
            <div class="text-13-medium text-text-strong">{card().title}</div>
            <div class="truncate text-12-regular text-text-weak">{props.artifact.name}</div>
          </div>
        </div>
        <div class="flex shrink-0 gap-2">
          <Button
            as="a"
            data-slot="zingpop-preview-open"
            href={card().openHref}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
            variant="secondary"
            icon="open-file"
          >
            {card().openLabel}
          </Button>
          <Button size="small" variant="secondary" icon="copy" onClick={() => copyPreviewArtifact(props.artifact)}>
            {card().copyLabel}
          </Button>
        </div>
      </div>
      <iframe
        title={props.artifact.path}
        src={card().iframeSrc}
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-downloads"
        class="h-[420px] w-full border-0 bg-white"
      />
    </div>
  )
}
