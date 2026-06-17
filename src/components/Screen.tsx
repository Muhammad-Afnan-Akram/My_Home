import type { ReactNode } from 'react'
import Container from '@mui/material/Container'
import TopBar from './TopBar'

interface ScreenProps {
  title: string
  back?: boolean | string
  actions?: ReactNode
  children: ReactNode
}

/** A full mobile screen: sticky TopBar + a narrow, padded content column. */
function Screen({ title, back, actions, children }: ScreenProps) {
  return (
    <>
      <TopBar title={title} back={back} actions={actions} />
      <Container maxWidth="sm" sx={{ py: 2, px: 2 }}>
        {children}
      </Container>
    </>
  )
}

export default Screen
