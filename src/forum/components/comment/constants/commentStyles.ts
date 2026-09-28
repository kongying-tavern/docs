export interface CommentStyleConfig {
  container: string
  avatarSize: 'xs' | 'sm' | 'md' | 'lg'
  leftWidth: string
  header: string
  contentContainer: string
  content: string
}

// @unocss-include
export const COMMENT_STYLES: Record<'small' | 'normal', CommentStyleConfig> = {
  small: {
    // flex-col：译文状态行排在「用户名: 正文」这一行之外，不参与该行的宽度分配
    container: 'py-2 flex-col',
    avatarSize: 'xs',
    leftWidth: '',
    header: 'mt-1',
    // items-baseline：标题行盒被身份 badge 撑到 21px，正文行盒 16px，按基线对齐两者首行
    contentContainer: 'w-full items-baseline',
    content: 'break-words line-clamp-3 overflow-hidden pr-4 font-size-xs c-[var(--vp-c-text-2)] whitespace-pre-wrap flex-1',
  },
  normal: {
    container: 'mt-.5',
    contentContainer: 'pb-3 flex-col  b-b-1 border-b-[var(--vp-c-divider)] border-b-solid',
    avatarSize: 'md',
    leftWidth: 'w-[64px] mr-2',
    header: 'mt-2',
    content: 'break-words font-size-3.5 line-height-[24px] break-all mt-1.5 whitespace-pre-wrap',
  },
}
