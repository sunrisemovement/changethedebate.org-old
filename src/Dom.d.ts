declare interface ShadowRoot {
  adoptedStyleSheets?: ReadonlyArray<CSSStyleSheet>
}

declare interface CSSStyleSheet {
  replaceSync: (text: string) => void
}