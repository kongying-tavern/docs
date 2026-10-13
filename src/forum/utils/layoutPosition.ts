/** Document layout position, unaffected by ancestor entry/exit transforms. */
export function layoutTop(root: HTMLElement): number {
  let top = 0
  for (let element: HTMLElement | null = root; element; element = element.offsetParent as HTMLElement | null)
    top += element.offsetTop
  return top
}
