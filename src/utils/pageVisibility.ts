import process from 'node:process'

export function shouldPublishPage(frontmatter: Record<string, unknown>): boolean {
  return frontmatter.githubPagesOnly !== true || process.env.DOCS_DEPLOY_TARGET === 'github-pages'
}
