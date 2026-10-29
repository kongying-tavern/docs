# Feedback Forum Glossary / 反馈论坛术语表

Use these terms in `forum.yml`. General syntax and submission rules are in the [translation guide](./translation-guide.md). When wording needs discussion, include the message key in the issue or pull request.

## Key terms

| Key | English (canonical) | 简体中文 | 日本語 | Notes |
| --- | --- | --- | --- | --- |
| feedback | feedback | 反馈 | フィードバック | A forum post. Use 反馈; reserve 意见 / 问题 for feedback types. |
| topic | topic | 话题 | トピック | Used in topic lists and pages. Personal sidebar sections use 反馈 / feedback. |
| forum | feedback forum | 反馈论坛 | フィードバックフォーラム | |
| sidebar-title | my feedback / following / participated | 我的反馈 / 我关注的 / 我参与的 | マイフィードバック / フォロー中 / 参加した | Keep these headings short; omit 最近 / recent and 发布 / submit. |
| comment | comment | 评论 | コメント | |
| like / dislike | agree / disagree | 赞同 / 不赞同 | 賛成 / 反対 | Do not use Upvote/Downvote or 顶 / 踩. |
| follow / unfollow | follow / unfollow | 关注 / 取消关注 | フォロー / フォロー解除 | Use 取消关注成功 for the success message. Avoid 收藏 and 取关. |
| official | official | 官方 | 公式 | |
| author | author | 作者 | 作成者 | |
| resolved | resolved | 已解决 | 解決済み | |
| open | open | 开启 | オープン | Topic state. |
| closed | closed | 已关闭 | クローズ済み | The navigation entry uses 已结反馈 / Closed feedback / クローズ済みフィードバック. |
| progressing | in progress | 进行中 | 進行中 | |
| rejected | rejected | 已拒绝 | 却下 | |
| announcement | announcement | 公告 | お知らせ | Use お知らせ rather than アナウンスメント. |
| submit | submit / post | 提交 | 送信 / 投稿 | Buttons use 提交 / Submit / 送信; success messages use 已发布 / posted / 投稿しました. |
| draft | draft | 草稿 | 下書き | Use the same term in autosave and keep/discard dialogs. |
| login / logout | login / logout | 登录 / 登出 | ログイン / ログアウト | |
| pin / unpin | pin / unpin | 固定 / 取消固定 | 固定 / 固定解除 | |
| sort | sort | 排序 | 並び順 | |
| user agreement | user agreement | 用户协议 | 利用規約 | Links to `/agreement` in the sidebar. |
| open source | open source | 开源代码 | オープンソース | Opens the GitHub repository in a new tab. |
| screenshot | error screenshot | 错误截图 | スクリーンショット | Used for screenshots attached to feedback. |

## Style rules

1. Use sentence case in English: `Searching…`, `Hide feedback`, `Back to previous page`.
2. Keep established product names and technical abbreviations consistent, including Gitee, Meta Seq2Seq, SSO, FAQ and QR.
3. Preserve named placeholders and component slots as described in [message syntax](../scripts/x18n/README.md#组件用法).
4. Use punctuation appropriate to the language. Preserve code, URLs and emoticons.
5. Translate the sidebar blog titles in `aside.teamBlog.items`. Their destinations come from shared configuration.
6. Use the same terms in announcement permission messages and validation errors: 管理员 / administrators / 管理者.
7. Prefer natural Japanese wording: お知らせ for announcements, さらに読み込む for more comments.

## Rejected wording

| Rejected | Locale | Use instead |
| --- | --- | --- |
| 收藏 | zh | 关注 |
| 取关 | zh | 取消关注 |
| Upvote / Downvote | en | Agree / Disagree |
| Bug Repoort | en | Bug report |
| Back To Prev Page | en | Back to previous page |
| アナウンスメント | ja | お知らせ |
| 閉鎖中 (for a topic state) | ja | クローズ済み |
