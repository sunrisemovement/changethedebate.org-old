import { BaseElement } from './BaseElement'

class ActionNetworkForm extends BaseElement {
  protected importAttributes() {

  }

  protected static styles = `
    :host {
      display: block;
      min-content;
    }
    iframe {
      height: 100%;
      width: 100%;
      display: block;
      border: 0;
      background-color: white;
    }
  `

  public connectedCallback() {
    super.connectedCallback()
    const iframe = document.createElement('iframe')
    iframe.srcdoc = this.createIframeHtml()
    this.shadowRoot!.append(iframe)
  }

  private createIframeHtml() {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            h2 { display: none; }
          </style>
        </head>
        <body>
          <script src="https://actionnetwork.org/widgets/v3/form/join-us-in-detroit-to-changethedebate?format=js&source=widget"></script>
          <div id="can-form-area-join-us-in-detroit-to-changethedebate"></div>
        </body>
      </html>
    `
  }
}

customElements.define('action-network-form', ActionNetworkForm)