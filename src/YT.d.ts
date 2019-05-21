declare interface Window {
  onYouTubeIframeAPIReady: () => void
}

declare namespace YT {
  export const loaded: number
  export const ready: (callback: () => void) => void
  export type EventMap = { [key: string]: (e: CustomEvent) => void }
  export type PlayerVars = { [key: string]: any }
  export type PlayerOptions = {
    height?: string,
    width?: string,
    videoId?: string,
    host?: string,
    events?: EventMap,
    playerVars?: PlayerVars,
  }
  export type LoadVideoOptions = {
    videoId: string,
    startSeconds?: number,
    endSeconds?: number,
    playerVars: PlayerVars
  }
  export enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
  export class Player extends EventTarget {
    constructor(id: string | Element, options?: PlayerOptions)
    loadVideoById(options: LoadVideoOptions): void
    playVideo(): void
    pauseVideo(): void
    mute(): void
    getPlayerState(): PlayerState
    getCurrentTime(): number
    setVolume(volume: number): void
  }
}