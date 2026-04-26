import { ComponentProps } from "solid-js"

export const LOGO_URL = "https://app.cxmt.com/s3/oa-public/fedt/agi/cimicode-icon_beta.svg"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image href={LOGO_URL} width="64" height="64" preserveAspectRatio="xMidYMid slice" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <image href={LOGO_URL} width="80" height="80" preserveAspectRatio="xMidYMid slice" />
    </svg>
  )
}

export const Logo = (props: { class?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 198 42"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <image href={LOGO_URL} width="42" height="42" preserveAspectRatio="xMidYMid slice" />
      <text x="52" y="27" fill="var(--icon-strong-base)" font-size="22" font-weight="650" font-family="sans-serif">
        CimiCode
      </text>
    </svg>
  )
}
