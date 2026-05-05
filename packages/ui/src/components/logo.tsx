import { ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zingpop"
    >
      <path data-slot="logo-logo-mark-shadow" d="M5 5H17V8H10L16 15V18H3V15H11L5 8V5Z" fill="var(--icon-weak-base)" />
      <path data-slot="logo-logo-mark-z" d="M3 2H17V5H8L17 15V18H3V15H12L3 5V2Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Zingpop"
    >
      <path d="M21 26H65V42H41L64 73V86H15V70H41L18 39V26H21Z" fill="var(--icon-base)" />
      <path d="M16 14H64V28H37L64 64V86H16V72H43L16 36V14Z" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 250 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
      aria-label="Zingpop"
    >
      <path d="M6 6H32V13H17L32 29V36H5V29H20L5 13V6H6Z" fill="var(--icon-base)" />
      <text
        x="42"
        y="31"
        fill="var(--icon-strong-base)"
        font-family="Inter, ui-sans-serif, system-ui, sans-serif"
        font-size="31"
        font-weight="650"
        letter-spacing="0"
      >
        Zingpop
      </text>
    </svg>
  )
}
