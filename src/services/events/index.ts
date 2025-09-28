// 导出 BroadcastChannel 同步
export {
  BroadcastChannelSync,
  broadcastChannelSync,
} from './BroadcastChannelSync'

// 导出事件管理器
export {
  forumEvents,
  SimpleEventManager,
  simpleEventManager,
  SimpleStoreEventHandler,
} from './SimpleEventManager'

// 类型定义
export type {
  EventHandler as EventHandlerType,
  EventUnsubscribe as EventUnsubscribeType,
} from './SimpleEventManager'
