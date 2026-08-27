# Feedback Forum Glossary / 反馈论坛术语表

Source of truth for the feedback forum UI copy (`forum` table in `.vitepress/locales/{zh,en,ja}/forum.ts`).
Any translation change must stay consistent with this glossary. When in doubt, ask in the issue/PR with the exact key name.

This glossary follows the structure used by the Apple Style Guide for key terms: the English term, its approved translations, and usage notes. The English column is the canonical key; UI copy should use the target-language column of the user's locale.

## Key Terms

| Key | English (canonical) | 简体中文 | 日本語 | Notes |
| --- | --- | --- | --- | --- |
| feedback | feedback | 反馈 | フィードバック | Generic name for a forum post. Consistent across the forum; do not substitute 意见 / 问题 unless the term refers to a *type* of feedback. |
| topic | topic | 话题 | トピック | Used for lists (recent topics) and topic pages. In the sidebar personal sections, 反馈 / feedback is the accepted legacy wording — keep it. |
| forum | feedback forum | 反馈论坛 | フィードバックフォーラム | |
| sidebar-title | my feedback / following / participated | 我的反馈 / 我关注的 / 我参与的 | マイフィードバック / フォロー中 / 参加した | Sidebar personal section titles. Keep them terse and symmetric — no 最近 / recent and no redundant verbs (发布 / submit). |
| comment | comment | 评论 | コメント | |
| like / dislike | agree / disagree | 赞同 / 不赞同 | 賛成 / 反対 | Reaction names. Do not use Upvote/Downvote (English), 顶 / 踩 (Chinese), or other variants. |
| follow / unfollow | follow / unfollow | 关注 / 取消关注 | フォロー / フォロー解除 | 收藏 is rejected. Success message must read 取消关注成功 — never the shorthand 取关. |
| official | official | 官方 | 公式 | |
| author | author | 作者 | 作成者 | |
| resolved | resolved | 已解决 | 解決済み | |
| open | open | 开启 | オープン | Topic state. |
| closed | closed | 已关闭 | クローズ済み | Topic state; also the navigation name 已结反馈 / Closed feedback / クローズ済みフィードバック. |
| progressing | in progress | 进行中 | 進行中 | |
| rejected | rejected | 已拒绝 | 却下 | |
| announcement | announcement | 公告 | お知らせ | Never use the katakana アナウンスメント in Japanese. |
| submit | submit / post | 提交 | 送信 / 投稿 | Form buttons use 提交 / Submit / 送信; a completed action reads 已发布 / posted / 投稿しました. |
| draft | draft | 草稿 | 下書き | Keep 草稿 for the unsaved form state; keep-draft dialog wording stays linked. |
| login / logout | login / logout | 登录 / 登出 | ログイン / ログアウト | |
| pin / unpin | pin / unpin | 固定 / 取消固定 | 固定 / 固定解除 | |
| sort | sort | 排序 | 並び順 | |
| user agreement | user agreement | 用户协议 | 利用規約 | Sidebar "More information" menu item, links to `/agreement`. |
| open source | open source | 开源代码 | オープンソース | Sidebar "More information" menu item, links to the GitHub repository (opens in a new tab). |
| screenshot | error screenshot | 错误截图 | スクリーンショット | The upload-field label. English: Upload Error Screenshot. |

## Style Rules

1. **English UI text uses sentence case**, e.g. `Searching…`, not `SEARCHING…`. Keep action verbs in sentence case too (`Hide feedback`, not `Hide Feedback`).
2. **No clipped wording**: write `Back to previous page`, not `Back to Prev Page`; `Bug report`, not `Bug repoort`.
3. **Brands and proper nouns stay untranslated**: Gitee, Kongying Tavern, Meta Seq2Seq, SSO, FAQ, QR.
4. **Keep placeholder tokens verbatim** in every locale: `%login`, `%signup`, `%size`, `%maxSize`, `%range`, `%filename`, `{query}`, `{count}`, `{id}`, `{min}`, `{max}`.
5. **Punctuation follows the target language**: full-width `（）` and `～` in Chinese/Japanese copy, half-width in English. Do not mix.
6. **When the English-blog items are listed in the sidebar** (`aside.teamBlog.items`), translate the display text per locale; keep the `link` unchanged (`/blog/…`).
7. **The announcement permission message** uses the same wording as the validation rule in every locale (管理员 / administrators / 管理者).
8. **Japanese avoids unnecessary katakana loans** when a natural Japanese word exists (お知らせ, not アナウンスメント; さらに読み込む for load-more comments).
9. **Sidebar section titles are terse**: drop 最近 / recent and redundant verbs such as 发布 / submit. Approved forms are 我的反馈 / 我关注的 / 我参与的 (My feedback / Following / Participated; マイフィードバック / フォロー中 / 参加した).

## Rejected Wording

| Rejected | Locale | Use instead |
| --- | --- | --- |
| 收藏 | zh | 关注 |
| 取关 | zh | 取消关注 |
| Upvote / Downvote | en | Agree / Disagree |
| Bug Repoort | en | Bug Report |
| Back To Prev Page | en | Back to Previous Page |
| アナウンスメント | ja | お知らせ |
| 閉鎖中 (for a topic state) | ja | クローズ済み |