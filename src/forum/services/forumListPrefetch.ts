/** 为请求与渲染预留时间，已登录用户提前两到四个视口加载下一页。 */
export function forumListPrefetchDistance(
  loggedIn: boolean,
  viewportHeight: number,
  downwardSpeed: number,
  requestDuration: number,
): number {
  if (!loggedIn || downwardSpeed <= 0)
    return 64
  return Math.max(64, Math.min(
    viewportHeight * 4,
    viewportHeight * 2 + downwardSpeed * (requestDuration + 600),
  ))
}
