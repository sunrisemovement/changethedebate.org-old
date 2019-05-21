import { BaseElement } from './BaseElement'

const clamp = (min: number, max: number, value: number) => {
  return Math.min(Math.max(min, value), max)
}

interface HTMLElementTagNameMap {
  'youtube-video': YoutubeVideo
}

class YoutubeVideo extends BaseElement {
  private videoId: string = ''
  private startSeconds: number = 0
  private endSeconds: number | null = null
  private volume: number = 0
  private controls: boolean = true
  private modestBranding: boolean = false
  private disableKeyboard: boolean = false
  private autoplay: boolean = false
  private container: HTMLDivElement = document.createElement('div')
  private player?: YT.Player

  protected importAttributes() {
    this.videoId = this.getAttribute('video-id') || ''
    this.startSeconds = parseInt(this.getAttribute('start-seconds') || '0') || 0
    this.endSeconds = parseInt(this.getAttribute('end-seconds') || '') || null
    this.controls = this.getAttribute('controls') !== 'false'
    this.modestBranding = this.getAttribute('modest-branding') === 'true'
    this.disableKeyboard = this.getAttribute('keyboard') === 'false'
    this.autoplay = this.getAttribute('autoplay') === 'true'
    this.volume = this.parseVolume(this.getAttribute('volume') || '100')
  }

  protected static styles = `
    :host {
        display: inline-block;
        width: 644px;
        height: 362px;
        position: relative;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
    }
  `

  public static get observedAttributes() {
    return [
      'volume',
    ]
  }

  public attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ) {
    switch (name) {
      case 'volume':
        if (oldValue === newValue) return
        this.volume = this.parseVolume(newValue || '100')
        this.player && this.player.setVolume(this.volume)
        return
      default:
        return
    }
  }

  public async connectedCallback() {
    super.connectedCallback()
    this.shadowRoot!.appendChild(this.container)
    await this.loadYoutubeIframeApi()
    this.player = await this.createPlayer()
    this.loadRequestedVideo()
    this.player.setVolume(this.volume)
  }

  private parseVolume(attrValue: string) {
    const parsed = parseInt(attrValue)
    return isNaN(parsed) ? 100 : clamp(0, 100, parsed)
  }

  private loadRequestedVideo() {
    this.player!.loadVideoById({
      videoId: this.videoId,
      startSeconds: this.startSeconds,
      endSeconds: this.endSeconds || undefined,
      playerVars: {
        autoplay: this.autoplay,
        controls: this.controls ? 1 : 0,
        modestbranding: this.modestBranding ? 1 : 0,
        disablekb: this.disableKeyboard ? 1 : 0,
      },
    })
  }

  private loadYoutubeIframeApi(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof YT === 'object' && YT !== null && YT.loaded === 1) {
        resolve()
        return
      }

      window.addEventListener('youtubeiframeapiready', () => {
        resolve()
      }, { once: true })

      if (typeof window.onYouTubeIframeAPIReady !== 'function') {
        window.onYouTubeIframeAPIReady = () => {
          YT.ready(() => {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('youtubeiframeapiready'))
            })
          })
        }
      }

      if (document.getElementById('youtube-iframe-api') === null) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.id = 'youtube-iframe-api'
        script.async = true
        document.head.appendChild(script)
      }
    })
  }

  private createPlayer(): Promise<YT.Player> {
    return new Promise((resolve) => {
      new YT.Player(this.container, {
        videoId: this.videoId,
        playerVars: {
          controls: this.controls ? 1 : 0,
        },
        events: {
          onReady: (e: CustomEvent) => resolve(e.target as YT.Player),
          onStateChange: this.onChange,
        }
      })
    })
  }

  private onChange = () => {
    switch (this.player!.getPlayerState()) {
      case YT.PlayerState.UNSTARTED:
        this.setAttribute('player-state', 'unstarted')
        return
      case YT.PlayerState.PLAYING:
        this.setAttribute('player-state', 'playing')
        this.dispatchEvent(new CustomEvent('playing'))
        return
      case YT.PlayerState.ENDED:
        this.setAttribute('player-state', 'ended')
        this.dispatchEvent(new CustomEvent('ended'))
        return
      case YT.PlayerState.PAUSED:
        this.dispatchEvent(new CustomEvent('paused'))
      default:
        return
    }
  }
}

customElements.define('youtube-video', YoutubeVideo)