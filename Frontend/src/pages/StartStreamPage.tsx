import React from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer'
import ChatBox from '../containers/ChatBox'
import ShoppingListBox from '../containers/ShoppingListBox'
import StepBox from '../containers/StepBox'
import PubSubClientProvider from '../context/PubSubClientProvider'
import {
  useEndStreamMutation,
  useGetLiveStreamQuery,
  useSendStreamStartTimeMutation,
  useStartStreamMutation,
} from '../redux/apiSlice'
import { setTitle } from '../redux/titleSlice'
import { LiveStatus } from '../redux/types'

export default function StartStreamPage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const { data, isLoading } = useGetLiveStreamQuery(id || '')
  const [startStream] = useStartStreamMutation()
  const [sendStreamStartTime] = useSendStreamStartTimeMutation()
  const [endStream] = useEndStreamMutation()
  const [streamState, setStreamState] = React.useState<LiveStatus | undefined>(
    undefined,
  )

  React.useEffect(() => {
    dispatch(setTitle('Start stream'))
  }, [])

  React.useEffect(() => {
    if (data) setStreamState(data.liveStatus)
  }, [isLoading])

  const onStartStream = () => {
    if (!id) return
    startStream(id)
    setStreamState(LiveStatus.Started)
  }
  const onStreamStart: React.ReactEventHandler<HTMLVideoElement> = (event) => {
    if (!id) return
    console.log(`Started at: ${event.currentTarget.currentTime}s`)
    sendStreamStartTime({ id, time: Math.floor(Date.now() / 1000) })
    setStreamState(LiveStatus.Started)
  }
  const onStopStream = () => {
    if (!id) return
    endStream(id)
    setStreamState(LiveStatus.Stopped)
  }

  const getStreamControl = () => {
    switch (streamState) {
      case LiveStatus.Initial:
        return (
          <Button onClick={onStartStream} variant="contained">
            Start
          </Button>
        )
      case LiveStatus.Started:
        return (
          <Button onClick={onStopStream} variant="contained">
            Stop stream
          </Button>
        )
      case LiveStatus.Stopped:
        return <Typography>Stream stopped</Typography>
      default:
        return <Typography>Loading...</Typography>
    }
  }

  return (
    <Container>
      {isLoading || !data ? (
        <CircularProgress />
      ) : (
        <PubSubClientProvider
          groupName={data.group}
          minStepId={data.recipe[0]?.id}
          maxStepId={data.recipe.at(-1)?.id}
        >
          <Grid container spacing={2}>
            <Grid size={4}>
              <Typography>Stream {id}</Typography>
              <Typography>URL: {data.input}</Typography>
              {getStreamControl()}
              <StepBox
                steps={data.recipe}
                show={streamState == LiveStatus.Started}
              />
              <ShoppingListBox list={data.shopping} />
            </Grid>
            <Grid size={8}>
              <VideoPlayer src={data.stream} onLoadedData={onStreamStart} />
              <ChatBox />
            </Grid>
          </Grid>
        </PubSubClientProvider>
      )}
    </Container>
  )
}
