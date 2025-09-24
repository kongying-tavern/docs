import type { EntityTable } from 'dexie'
import { Dexie } from 'dexie'

export interface BlogDraft {
  id?: string
  title: string
  content: string
  contentJson: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  autoSaveAt: Date
}

export class BlogDraftDB extends Dexie {
  drafts!: EntityTable<BlogDraft, 'id'>

  constructor() {
    super('BlogDraftDB')
    this.version(1).stores({
      drafts: '++id, title, createdAt, updatedAt, autoSaveAt',
    })
  }
}

export const blogDraftDB = new BlogDraftDB()
