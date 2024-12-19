import React from 'react'
import { ListItem, Typography } from '@mui/material'
import { RecipeStep } from '../redux/types'

export type RecipeStepProps = {
  step: RecipeStep
  current?: boolean
}

export default function RecipeStepItem(props: RecipeStepProps) {
  return (
    <ListItem>
      <Typography bgcolor={props.current ? 'red' : 'green'}>
        {props.step.text}
      </Typography>
    </ListItem>
  )
}
