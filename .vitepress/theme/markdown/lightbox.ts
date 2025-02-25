/**
 * VitePress plugin to add `medium-zoom` lightbox to images.
 * @param {any} md - Markdown.
 */
export default function lightbox(md: any) {
  // Store the original image renderer
  const defaultImageRenderer = md.renderer.rules.image

  // Customize the image renderer.
  md.renderer.rules.image = (
    tokens: any,
    idx: any,
    options: any,
    env: any,
    self: any,
  ) => {
    // Add data-zoomable attribute to the images
    tokens[idx].attrSet('data-zoomable', true)

    return defaultImageRenderer(tokens, idx, options, env, self)
  }
}
