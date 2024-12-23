export type Chat = {
  id: number
  username: string
  message: string
  time: number
}

export enum MessageType {
  Message,
  Next,
}

export type MessageContent = {
  message?: string
  step?: number
  time?: number
  type: MessageType
}

export type UserInfo = {
  name?: string
  given_name?: string
  family_name?: string
}
