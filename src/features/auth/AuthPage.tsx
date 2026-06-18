import { useState } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Link from '@mui/material/Link'
import BoltIcon from '@mui/icons-material/Bolt'
import { useAuth } from './authContext'

type Mode = 'login' | 'signup' | 'forgot'

const TITLES: Record<Mode | 'reset', string> = {
  login: 'Sign in to continue',
  signup: 'Create your account',
  forgot: 'Reset your password',
  reset: 'Set a new password',
}

function AuthPage() {
  const { signIn, signUp, sendPasswordReset, updatePassword, recovery } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // A recovery session (from the email link) forces the "set new password" view.
  const effectiveMode: Mode | 'reset' = recovery ? 'reset' : mode

  const emailValid = /\S+@\S+\.\S+/.test(email)
  const passwordValid = password.length >= 6
  const valid =
    effectiveMode === 'forgot'
      ? emailValid
      : effectiveMode === 'reset'
        ? passwordValid
        : emailValid && passwordValid

  const goto = (next: Mode) => {
    setMode(next)
    setError(null)
    setInfo(null)
  }

  const submit = async () => {
    if (!valid) return
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      if (effectiveMode === 'signup') {
        const { needsConfirmation } = await signUp(email.trim(), password)
        if (needsConfirmation) {
          setInfo('Account created. Check your email to confirm, then sign in.')
          setMode('login')
        }
      } else if (effectiveMode === 'forgot') {
        await sendPasswordReset(email.trim())
        setInfo('If that email exists, a reset link is on its way. Check your inbox.')
        setMode('login')
      } else if (effectiveMode === 'reset') {
        await updatePassword(password)
        // recovery clears -> the app loads automatically (now signed in).
      } else {
        await signIn(email.trim(), password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 400, borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
            <BoltIcon color="warning" sx={{ fontSize: 40 }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              My Home
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {TITLES[effectiveMode]}
            </Typography>
          </Stack>

          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            {info && <Alert severity="success">{info}</Alert>}

            {effectiveMode !== 'reset' && (
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                autoComplete="email"
                inputMode="email"
              />
            )}

            {effectiveMode !== 'forgot' && (
              <TextField
                label={effectiveMode === 'reset' ? 'New password' : 'Password'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                autoComplete={effectiveMode === 'login' ? 'current-password' : 'new-password'}
                helperText={effectiveMode !== 'login' ? 'At least 6 characters' : undefined}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !busy) submit()
                }}
              />
            )}

            <Button variant="contained" size="large" onClick={submit} disabled={!valid || busy}>
              {busy
                ? 'Please wait…'
                : effectiveMode === 'signup'
                  ? 'Sign up'
                  : effectiveMode === 'forgot'
                    ? 'Send reset link'
                    : effectiveMode === 'reset'
                      ? 'Update password'
                      : 'Sign in'}
            </Button>

            {effectiveMode === 'login' && (
              <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
                <Link component="button" type="button" onClick={() => goto('forgot')}>
                  Forgot password?
                </Link>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link component="button" type="button" onClick={() => goto('signup')}>
                    Sign up
                  </Link>
                </Typography>
              </Stack>
            )}

            {(effectiveMode === 'signup' || effectiveMode === 'forgot') && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                <Link component="button" type="button" onClick={() => goto('login')}>
                  Back to sign in
                </Link>
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

export default AuthPage
