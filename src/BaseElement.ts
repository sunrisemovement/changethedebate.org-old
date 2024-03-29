export abstract class BaseElement extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.addStyles()
  }

  protected static styles: string = ''

  public connectedCallback() {

  }

  public disconnectedCallback() {
    
  }

  private addStyles() {
    if ('adoptedStyleSheets' in this.shadowRoot!) {
      const sheet = new CSSStyleSheet()
      sheet.replaceSync((this.constructor as typeof BaseElement).styles)
      this.shadowRoot!.adoptedStyleSheets = [sheet]
    } else {
      const node = document.createElement('style')
      node.textContent = (this.constructor as typeof BaseElement).styles
      this.shadowRoot!.appendChild(node)
    }
  }
}