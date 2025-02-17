import React from 'react'
import Button from '@mui/material/Button'
import { PubSubClientContext } from '../context/PubSubClientProvider'
import RecipeBox, { RecipeBoxProps } from './RecipeBox'

export type StepBoxProps = {
  show?: boolean
  steps: RecipeBoxProps['steps']
  getVideoTime: () => number | undefined
}

export default function StepBox(props: StepBoxProps) {
  const { currentStep, changeStep, ready } =
    React.useContext(PubSubClientContext)
  const [step, setStep] = React.useState<number>(0)

  React.useEffect(() => {
    const time = props.getVideoTime()
    if (ready && changeStep && props.show && time != undefined)
      changeStep(1, time)
  }, [ready, props.show])

  const onChange = (change: number) => {
    const time = props.getVideoTime()
    console.log(`onChange time:${time}`)
    if (changeStep && time != undefined) {
      setStep((step) => {
        const newStep = step + change
        return changeStep(newStep, time) ? newStep : step
      })
    }
  }

  return (
    <>
      {props.show ? (
        <div>
          <p>{currentStep}</p>
          <Button variant="contained" onClick={() => onChange(-1)}>
            Previous
          </Button>
          <Button variant="contained" onClick={() => onChange(1)}>
            Next
          </Button>
        </div>
      ) : null}
      <RecipeBox steps={props.steps} currentStep={step} />
    </>
  )
}
