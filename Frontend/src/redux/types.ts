import { WebPubSubClient } from '@azure/web-pubsub-client'

export type TitleState = {
  title: string
}

export type LiveStream = {
  name: string // Stream/recipe name
  stream: string // Video URL
  channel: string // PubSub channel
  group: string // PubSub group
  recipe: RecipeStep[]
  shopping: ShoppingListEntry[]
}

export type OndemandStream = {
  name: string
  stream: string
  recipe: TimedRecipeStep[]
  shopping: ShoppingListEntry[]
}

export type RecipeStep = {
  id: number
  text: string
}

export type TimedRecipeStep = RecipeStep & {
  time: number // Time from start of video in seconds
}

export type ShoppingListEntry = {
  id: number
  name: string
  quantity?: string
}

export type PubsubState = {
  client?: WebPubSubClient
}

export type TokenState = {
  token?: string
}

export type StartStream = {
  // stream data
  id?: string
}

export type StartStreamParams = {
  recipeName: string
}

export type State = {
  title: TitleState
  pubsub: PubsubState
  token: TokenState
}
