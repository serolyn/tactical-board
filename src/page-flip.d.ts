declare module 'page-flip' {
  export class PageFlip {
    constructor(container: HTMLElement, options?: Record<string, unknown>)
    on(eventName: string, handler: (event: { data: number }) => void): void
    loadFromImages(images: readonly string[]): void
    loadFromHTML(elements: readonly HTMLElement[]): void
    destroy(): void
    flipPrev(): void
    flipNext(): void
  }
}