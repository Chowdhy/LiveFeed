import React from 'react'
import { CircularProgress, Container, Typography } from '@mui/material'
import Grid from '@mui/material/Grid2'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer'
import ChatBox from '../containers/ChatBox'
import RecipeBox from '../containers/RecipeBox'
import ShoppingListBox from '../containers/ShoppingListBox'
import PubSubClientProvider from '../context/PubSubClientProvider'
import { setTitle } from '../redux/titleSlice'
import { State } from '../redux/types'

export default function WatchLivePage() {
  const dispatch = useDispatch()
  const { id } = useParams()
  const ready = useSelector((state: State) => state.chat.clientReady)

  React.useEffect(() => {
    dispatch(setTitle('Live'))
  }, [])

  return (
    <PubSubClientProvider>
      <Container>
        {ready ? (
          <Grid container spacing={2}>
            <Grid size={8}>
              <Typography>Stream {id}</Typography>
              <VideoPlayer />
              <ChatBox />
            </Grid>
            <Grid size={4}>
              <ShoppingListBox />
              <RecipeBox />
            </Grid>
          </Grid>
        ) : (
          <CircularProgress />
        )}
      </Container>
    </PubSubClientProvider>
  )
}
