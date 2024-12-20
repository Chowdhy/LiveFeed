import React from 'react'
import {
  OnGroupDataMessageArgs,
  WebPubSubClient,
} from '@azure/web-pubsub-client'
import { useDispatch, useSelector } from 'react-redux'
import { Chat } from '../context/types'
import { resetClient, setClient } from '../redux/pubsubSlice'
import { baseUrl } from '../redux/settings'
import { State } from '../redux/types'
import { MessageContent, MessageType } from './types'

export type ProviderValue = {
  ready: boolean
  chats: Chat[]
  sending: boolean
  sendMessage?: (message: string) => Promise<void>
  currentStep?: number
  changeStep?: (step: number) => Promise<void>
}

export type PubSubClientProviderProps = {
  children: React.ReactNode
  userId?: string
  channelId: string
  groupName: string
  minStepId?: number // currentStep cannot be less than this value
  maxStepId?: number // currentStep cannot be more than this value
}

export const PubSubClientContext = React.createContext<ProviderValue>({
  ready: false,
  chats: [],
  sending: false,
})

// WebPubSubClient code adapted from https://learn.microsoft.com/en-us/javascript/api/overview/azure/web-pubsub-client-readme?view=azure-node-latest
export default function PubSubClientProvider(props: PubSubClientProviderProps) {
  const dispatch = useDispatch()
  const client = useSelector((state: State) => state.pubsub.client)
  const [ready, setReady] = React.useState<boolean>(false)
  const [chats, setChats] = React.useState<Chat[]>([])
  const [sending, setSending] = React.useState<boolean>(false)
  const [currentStep, setCurrentStep] = React.useState<number | undefined>(
    undefined,
  )

  React.useEffect(() => {
    const client = new WebPubSubClient({
      getClientAccessUrl: async () => {
        const userId = props.userId || 'Anonymous'
        const response = await fetch(
          `${baseUrl}chat/negotiate?userId=${userId}&recipeId=${props.channelId}`,
        )
        const value = await response.json()
        console.log('pubsub URL')
        console.log(value)
        return value.url
      },
    })
    client.on('group-message', (e: OnGroupDataMessageArgs) => {
      console.log('received msg')
      console.log(e)
      if (e.message.dataType == 'json') {
        const messageData = e.message.data as MessageContent
        if (
          messageData.type == MessageType.Message &&
          messageData.message !== undefined
        ) {
          setChats((chats) =>
            chats.concat([
              {
                id: e.message.sequenceId || Date.now(),
                username: e.message.fromUserId,
                message: messageData.message || '',
                time: messageData.time || 0,
              },
            ]),
          )
        } else if (messageData.type == MessageType.Next) {
          setCurrentStep(messageData.step)
        } else {
          console.error('Unkown message type: ' + messageData.type)
        }
      } else {
        console.error('Unkown message received:')
        console.error(e.message)
      }
    })
    dispatch(setClient(client))
    client?.start().then(() => {
      setReady(true)
    })
  }, [])

  // Adapted from https://bobbyhadz.com/blog/react-hook-on-unmount
  React.useEffect(
    () => () => {
      dispatch(resetClient())
    },
    [],
  )

  const sendMessage: ProviderValue['sendMessage'] = async (message) => {
    console.log('Sending message: ' + message)
    setSending(true)
    const content: MessageContent = {
      message,
      time: Date.now(),
      type: MessageType.Message,
    }
    await client?.sendToGroup(props.groupName, content, 'json')
    setSending(false)
  }

  const changeStep: ProviderValue['changeStep'] = async (step) => {
    if (
      props.minStepId &&
      props.maxStepId &&
      step >= props.minStepId &&
      step <= props.maxStepId
    ) {
      console.log('Changing step to ' + step)
      const content: MessageContent = { step, type: MessageType.Next }
      await client?.sendToGroup(props.groupName, content, 'json')
    } else {
      console.log(`Step ${step} out of range`)
    }
  }

  const value: ProviderValue = {
    ready,
    chats,
    sending,
    sendMessage,
    currentStep,
    changeStep,
  }

  return (
    <PubSubClientContext.Provider value={value}>
      {props.children}
    </PubSubClientContext.Provider>
  )
}
