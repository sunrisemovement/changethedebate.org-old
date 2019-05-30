import { BaseElement } from './BaseElement'
import filepath from '../assets/video/ctd_video.mp4'

export class HeaderVideo extends BaseElement {
  public get currentTime() {
    return this._currentTime
  }

  private _video: HTMLVideoElement | null = null
  private _currentTime: number = 0

  protected static styles = `
    :host {
      display: block;
      height: auto;
      position: relative;
      padding-top: 56.25%;
      pointer-events: none;
    }
    video {
      display: block;
      position: absolute;
      top: 50%;
      left: 50%;
      height: 100%;
      width: 100%;
      transform: translateX(-50%) translateY(-50%);
    }
  `

  public connectedCallback() {
    super.connectedCallback()
    this._video = document.createElement('video')
    this._video.setAttribute('playsinline', '')
    this._video.autoplay = true
    this._video.muted = true
    this._video.controls = false
    this._video.addEventListener('loadstart', this.onVideoLoadStart)
    this._video.addEventListener('canplaythrough', this.onVideoCanPlayThrough)
    this._video.addEventListener('playing', this.onVideoPlaying)
    this._video.addEventListener('waiting', this.onVideoWaiting)
    this._video.addEventListener('timeupdate', this.onVideoTimeUpdate)
    this._video.src = filepath
    this.shadowRoot!.appendChild(this._video)
  }

  private onVideoLoadStart = () => {
    this.setAttribute('state', 'loading')
  }

  private onVideoCanPlayThrough = () => {
    this.setAttribute('state', 'ready')
    console.log('hi')
  }

  private onVideoPlaying = () => {
    this.setAttribute('state', 'playing')
  }

  private onVideoWaiting = () => {
    this.setAttribute('state', 'loading')
  }

  private onVideoError = () => {
    this.setAttribute('state', 'error')
  }

  private onVideoTimeUpdate = () => {
    this._currentTime = this._video!.currentTime
    this.dispatchEvent(new CustomEvent('timeupdate'))
  }
}

customElements.define('header-video', HeaderVideo)