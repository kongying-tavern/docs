import type { JSONContent } from '@tiptap/core'

export const LEGACY_PLAIN_TOPIC = 'Legacy Topic body'

export const LEGACY_PLAIN_COMMENT = 'Legacy Comment @alice'

export const VALID_JSON_PLAIN_TEXTS = [
  '123',
  'true',
  'null',
  '"quoted string"',
  '{}',
  '[]',
] as const

export const VALID_TIPTAP_DOC = {
  type: 'doc',
  attrs: { resolved: true },
  content: [
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Hello ' },
        { type: 'mention', attrs: { id: 7, label: 'alice' } },
        { type: 'text', text: ' ' },
        { type: 'emoji', attrs: { emoji: 'emoji/happy.webp' } },
      ],
    },
  ],
} satisfies JSONContent

export const TIPTAP_WITH_LITERAL_MENTION_TEXT = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'hello @alice' }],
    },
  ],
} satisfies JSONContent

export const MALFORMED_COMMENT_JSON = '{"type":"doc","content":['

export const TIPTAP_WITH_IMAGES = `${JSON.stringify(VALID_TIPTAP_DOC)}
![first](https://assets.example/one.webp){thumbhash:"abc+/=",width:"640",height:"480"}
![second](https://assets.example/two.png?x=1&y=2)`

export const TOPIC_WITH_METADATA_AND_IMAGE = `<!-- {"labels":["WEB-FEEDBACK","CATA-DOCS"],"state":"open","legacy":{"keep":true}} -->Topic body
![diagram](https://webp.assets.inter-knot.site/a.webp){thumbhash:"hash",width:"800",height:"600"}`

// This fixture names the intentionally preserved legacy ambiguity explicitly.
export const AMBIGUOUS_JSON_COMMENT = '<!-- {"unknown":"legacy"} -->Body'

export const MALFORMED_AND_ORDINARY_COMMENTS = '<!-- not-json --><!-- {broken -->Visible'
