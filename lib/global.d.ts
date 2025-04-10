// Deklaracja typów dla Wake Lock API
interface WakeLockSentinel {
    released: boolean
    release(): Promise<void>
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void
  }
  
  interface WakeLock {
    request(type: "screen"): Promise<WakeLockSentinel>
  }
  
  interface Navigator {
    wakeLock?: WakeLock
  }
  