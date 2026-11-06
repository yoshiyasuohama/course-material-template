/**
 * 丸印を貫く1本の線。先頭と末尾の丸印の中心を実測して引き、
 * activeIndex の丸印まで緑の線を伸ばす。
 */
export class Track {
  private readonly line = document.createElement('div');
  private readonly fill = document.createElement('i');

  constructor(
    private readonly host: HTMLElement,
    private readonly nodes: () => HTMLElement[],
    private readonly activeIndex: () => number,
  ) {
    this.line.className = 'track';
    this.line.setAttribute('aria-hidden', 'true');
    this.line.append(this.fill);
    host.prepend(this.line);
    new ResizeObserver(() => this.update()).observe(host);
  }

  update(): void {
    const nodes = this.nodes();
    if (nodes.length < 2 || this.host.offsetParent === null) return;
    const origin = this.host.getBoundingClientRect();
    const centerY = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top + rect.height / 2 - origin.top;
    };
    const first = nodes[0].getBoundingClientRect();
    const start = centerY(nodes[0]);
    const span = centerY(nodes[nodes.length - 1]) - start;
    if (span <= 0) return;
    this.line.style.left = `${first.left + first.width / 2 - origin.left}px`;
    this.line.style.top = `${start}px`;
    this.line.style.height = `${span}px`;
    this.fill.style.transform = `scaleY(${(centerY(nodes[this.activeIndex()]) - start) / span})`;
  }

  /** 線を上から伸ばし直す */
  replay(): void {
    this.fill.style.transition = 'none';
    this.fill.style.transform = 'scaleY(0)';
    void this.fill.offsetHeight;
    this.fill.style.transition = '';
    requestAnimationFrame(() => this.update());
  }
}
