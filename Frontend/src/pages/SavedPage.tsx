import React from 'react'
import { useDispatch } from 'react-redux'
import { setTitle } from '../redux/titleSlice'

export default function SavedPage() {
  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(setTitle('Saved'))
  }, [])
  
  return <p>Saved page</p>
}
