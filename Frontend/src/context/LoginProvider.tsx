/*
https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-acquire-token?tabs=react

https://learn.microsoft.com/en-us/entra/identity-platform/scenario-spa-sign-in?tabs=react#sign-out-behavior-on-browsers

The following code handles a login request and listens to a response to update the active account.
'activeAccount' can be used to retrieve the current user's ID, username and more.
The access token is accquired using the active account.

*/

import React from 'react'
import { AccountInfo, SilentRequest } from '@azure/msal-browser'
import { useMsal } from '@azure/msal-react'
import { useDispatch } from 'react-redux'
import { loginRequest } from '../config/authConfig'
import RecipesPage from '../pages/RecipesPage'
import { setToken } from '../redux/tokenSlice'
import { clearUser, setUser } from '../redux/userSlice'

export type ProviderValue = {
  activeAccount: AccountInfo | null
  handleLoginPopup?: () => void
  handleLogin?: () => Promise<void>
  handleLogout?: () => void
}

export type LoginProviderProps = {
  children: React.ReactNode
}

export const LoginContext = React.createContext<ProviderValue>({
  activeAccount: null,
})

export default function LoginProvider(props: LoginProviderProps) {
  const dispatch = useDispatch()
  const { instance } = useMsal()
  const [activeAccount, setActiveAccount] = React.useState(
    instance.getActiveAccount(),
  )

  const handleLogout = async () => {
    console.log('Log out request received')
    try {
      await instance.logoutRedirect()
      console.log('Logout successful via popup')
      setActiveAccount(null)
      dispatch(setToken(''))
      dispatch(clearUser())
    } catch (error) {
      console.error('Popup logout failed:', error)
      //console.log('Attempting logout redirect as fallback')
      //await instance.logoutRedirect();
    }
  }

  //Set new active account and access token after logging in
  const handleLoginPopup = async () => {
    try {
      const response = await instance.loginPopup(loginRequest)
      if (response) {
        setActiveAccount(response.account)
        instance.setActiveAccount(response.account)
        console.log('ACTIVE ACCOUNT SET')
        console.log('Active account:', response.account)
        //Set access token
        dispatch(setToken(response.accessToken))
        //Set user details
        dispatch(
          setUser({
            id: response.account.localAccountId,
            displayName: response.account.idTokenClaims?.name ?? '',
            givenName:
              (response.account.idTokenClaims?.given_name as string) ?? '',
            familyName:
              (response.account.idTokenClaims?.family_name as string) ?? '',
          }),
        )
        console.log('Login successful via popup')
      }
      return response
    } catch (error) {
      console.error('Error during popup login:', error)
      throw error
    }
  }

  //Get access token from active account
  const getAccessTokenSilently: () => Promise<string | null> = async () => {
    const tokenRequest: SilentRequest = {
      scopes: ['https://livefeedlog.onmicrosoft.com/livefeed-api/user.read'], // Backend scope
      account: activeAccount ? activeAccount : undefined,
    }
    try {
      await instance.initialize()
      const response = await instance.acquireTokenSilent(tokenRequest)
      const token = response.accessToken
      console.log(response)
      console.log('Obtained access token: ' + token)
      dispatch(setToken(token))
      return token
    } catch (error: any) {
      console.error('Token acquisition failed:', error)

      // Fallback to interactive login if silent token acquisition fails
      if (error.name === 'InteractionRequiredAuthError') {
        const response = await instance.acquireTokenPopup(tokenRequest)
        const token = response.accessToken
        dispatch(setToken(token))
        return token
      }
    }
    return null
  }

  //Call login pop-up if not already logged in
  const handleLogin: ProviderValue['handleLogin'] = async () => {
    console.log('Handle login invoked')
    try {
      if (!activeAccount) {
        console.log('No active account found. Login required.')
        const response = await handleLoginPopup()
        if (response) {
          console.log('Logged in as :', response.account.name)
        }
        return
      }
      console.log(`User already logged in as ${activeAccount.name}`)
    } catch (error) {
      console.error('Error handling login:', error)
    }
  }

  // Restore active account on load
  React.useEffect(() => {
    const cachedAccount = instance.getActiveAccount()
    if (!cachedAccount) {
      const accounts = instance.getAllAccounts()
      if (accounts.length > 0) {
        instance.setActiveAccount(accounts[0])
        setActiveAccount(accounts[0])
        console.log('Restored Active Account from cache:', accounts[0])
        getAccessTokenSilently()
      } else {
        console.log('No accounts found in cache. User needs to log in.')
      }
    } else {
      setActiveAccount(cachedAccount)
      console.log('Active Account already set:', cachedAccount)
      getAccessTokenSilently()
    }
  }, [instance])

  const value: ProviderValue = {
    activeAccount,
    handleLoginPopup,
    handleLogin,
    handleLogout,
  }

  return (
    <LoginContext.Provider value={value}>
      {props.children}
    </LoginContext.Provider>
  )
}
const App = () => {
  return (
    <LoginProvider>
      <RecipesPage />
    </LoginProvider>
  )
}
