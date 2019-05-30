import { BaseElement } from './BaseElement'
import highDataVideoPath from '../assets/video/ctd_video.mp4'
import lowDataVideoPath from '../assets/video/ctd_video_mobile.mp4'

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
      pointer-events: none;
    }
    video {
      display: block;
      height: 100%;
      width: 100%;
      object-position: center;
      object-fit: cover;
    }
  `

  public connectedCallback() {
    super.connectedCallback()
    document.addEventListener('visibilitychange', this.onDocumentVisibilityChange)
    window.addEventListener('scroll', this.onWindowScroll)
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
    this._video.src = this.useHighDataVideo() ? highDataVideoPath : lowDataVideoPath
    this.shadowRoot!.appendChild(this._video)
  }

  public disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('visibilitychange', this.onDocumentVisibilityChange)
    window.removeEventListener('scroll', this.onWindowScroll)
    this._video && this.shadowRoot!.removeChild(this._video)
    this._video = null
  }

  private useHighDataVideo = (): boolean => {
    if (typeof window.orientation === 'undefined') {
      return true
    } else if (navigator.connection) {
      return navigator.connection.type !== 'cellular'
    } else {
      return /iPhone/.test(navigator.platform)
    }
  }

  private onWindowScroll = () => {
    if (this._video && this._video.ended) return
    const rect = this.getBoundingClientRect()
    if (rect.bottom <= 0) {
      this._video && this._video.pause()
    } else {
      this._video && this._video.play().catch(() => {})
    }
  }

  private onDocumentVisibilityChange = () => {
    if (this._video && this._video.ended) return
    if (document.visibilityState === 'visible') {
      this._video && this._video.play().catch(() => {})
    } else {
      this._video && this._video.pause()
    }
  }

  private onVideoLoadStart = () => {
    this.setAttribute('state', 'loading')
  }

  private onVideoCanPlayThrough = () => {
    this.setAttribute('state', 'ready')
    this._video!.play().catch(() => { })
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