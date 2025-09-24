export interface CommentStyleConfig {
  container: string
  avatarSize: 'xs' | 'sm' | 'md' | 'lg'
  leftWidth: string
  header: string
  contentContainer: string
  content: string
}

export const COMMENT_STYLES: Record<'small' | 'normal', CommentStyleConfig> = {
  small: {
    container: 'py-2',
    avatarSize: 'xs',
    leftWidth: '',
    header: 'mt-1',
    contentContainer: 'w-full',
    content: 'line-clamp-3 overflow-hidden pr-4 font-size-xs c-[var(--vp-c-text-2)] whitespace-pre-wrap',
  },
  normal: {
    container: 'mt-.5',
    contentContainer: 'border-b-1 border-[var(--vp-c-divider)] pb-3 flex-col',
    avatarSize: 'md',
    leftWidth: 'w-[64px] mr-2',
    header: 'mt-2',
    content: 'break-words font-size-3.75 line-height-[24px] break-all mt-1.5 whitespace-pre-wrap',
  },
}
