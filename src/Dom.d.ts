declare interface ShadowRoot {
  adoptedStyleSheets?: ReadonlyArray<CSSStyleSheet>
}

declare interface CSSStyleSheet {
  replaceSync: (text: string) => void
}

declare type NetworkInformationType =
  | 'bluetooth'
  | 'cellular'
  | 'ethernet'
  | 'none'
  | 'wifi'
  | 'wimax'
  | 'other'
  | 'unknown'

declare interface NetworkInformation {
  readonly type: NetworkInformationType
}

declare interface Navigator {
  readonly connection?: NetworkInformation
}