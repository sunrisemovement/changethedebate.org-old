import { BaseElement } from './BaseElement'

class ActionNetworkForm extends BaseElement {
  private _actionId: string | null = null
  private _iframe!: HTMLIFrameElement
  private _showActionName: boolean = true
  private _showActionNetworkLogo: boolean = true
  private _theme: string = 'light'

  protected importAttributes() {
    this.actionId = this.getAttribute('action-id')
    this._showActionName = this.getAttribute('show-action-name') !== 'false'
    this._showActionNetworkLogo = this.getAttribute('show-action-network-logo') !== 'false'
    this._theme = this.getAttribute('theme') === 'dark' ? 'dark' : 'light'
  }

  protected static styles = `
    :host {
      display: block;
      position: relative;
    }
    iframe {
      border: 0;
      width: 100%;
      position: relative;
      display: block;
    }
  `

  public get actionId(): string | null {
    return this.getAttribute('action-id')
  }

  public set actionId(value: string | null) {
    const current = this.getAttribute('action-id')
    if (value === current) return
    if (value === null) this.removeAttribute('action-id')
    else this.setAttribute('action-id', value)
  }

  public connectedCallback() {
    super.connectedCallback()
    if (this.actionId) this.injectForm()
  }

  public disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('resize', this.setIframeHeight)
  }

  private injectForm() {
    this._iframe = document.createElement('iframe')
    this._iframe.setAttribute('loading', 'lazy')
    this._iframe.srcdoc = this.createIframeContent()
    this._iframe.addEventListener('load', this.onIframeLoad)
    this.shadowRoot!.append(this._iframe)
  }

  private onIframeLoad = () => {
    this._iframe.contentWindow!.addEventListener('needsresize', this.setIframeHeight)
  }

  private setIframeHeight = () => {
    this._iframe.style.height = this._iframe.contentDocument!.body.scrollHeight + 'px'
  }

  private createIframeContent() {
    return `<!DOCTYPE html>
<html>
<head>
  <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro&display=swap" rel="stylesheet">
  <script async src="https://actionnetwork.org/widgets/v3/form/${this.actionId}?format=js&source=widget"></script>
  <style>
    :root {
      --sunrise-yellow: #ffde16;
      --sunrise-charcoal: #33342e;
      --sunrise-magenta: #8f0d56;
      --sunrise-orange: #fd9014;
    }
    * {
      box-sizing: border-box;
    }
    body {
      font-family: Source Sans Pro;
      margin: 0;
      color: ${this._theme === 'dark' ? '#ffffff' : '#000000'};
      position: relative;
      padding: 16px;
    }
    h2 {
      margin: 0;
      display: ${this._showActionName ? 'block' : 'none'};
    }
    h4 {
      margin: 0;
    }
    #logo_wrap {
      display: ${this._showActionNetworkLogo ? 'block' : 'none'};
    }
    li.form_builder_output {
      list-style: none;
    }
    li.core_field {
      list-style: none;
      padding: 8px 0;
    }
    li.control-group input[type="text"],
    li.control-group input[type="email"],
    li.core_field input[type="text"],
    li.core_field input[type="email"] {
      width: 100%;
      height: 48px;
      border: 0;
      outline: 0;
      border-radius: 8px;
      padding: 0 16px;
      font-size: 16px;
      font-family: inherit;
    }
    li.control-group {
      list-style: none;
      display: flex;
      flex-direction: column;
      padding: 8px 0;
    }
    li.control-group label {
      font-size: 14px;
      padding-bottom: 4px;
      padding-left: 16px;
    }
    .international_link-wrap {
      display: block;
      color: #ffde16;
      padding: 8px 0;
      cursor: pointer;
    }
    .can_select {
      width: 100%;
      display: block;
      height: 48px;
      border: 0;
      outline: 0;
      cursor: pointer;
      font-size: 16px;
      padding: 0 16px;
      font-family: inherit;
    }
    .country_drop_wrap {
      display: block;
      padding: 8px 0;
    }
    .hide {
      display: none;
    }
  </style>
</head>
<body>
  <div id="can-form-area-${this.actionId}"></div>
  <script>
    var observer = new MutationObserver(() => {
      window.dispatchEvent(new CustomEvent('needsresize'))
    })
    observer.observe(document.body, { subtree: true, attributes: true })
  </script>
</body>
</html>
    `
  }
}

customElements.define('action-network-form', ActionNetworkForm)