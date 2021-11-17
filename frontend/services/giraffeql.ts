import axios from 'axios'
import { pusher } from './pusher'
import firebase from '~/services/fireinit'
import 'firebase/auth'
import { Root, GetQuery, GetResponse } from '~/types/schema'

const prodResource = axios.create({
  baseURL: process.env.apiUrl,
})

export async function executeGiraffeql<Key extends keyof Root>(
  _that,
  query: GetQuery<Key>
): Promise<GetResponse<Key>> {
  // fetches the idToken
  const currentUser = firebase.auth().currentUser
  const idToken = currentUser ? await currentUser.getIdToken() : null

  // if logged in and no idToken, logout user
  /*
  // should never need this, as auth state is synced in plugin/auth.js
  if (that && !idToken && that.$store.getters['auth/user']) {
    handleLogout(that.$store)
  }
  */

  const request = idToken
    ? {
        headers: {
          Authorization: 'Bearer ' + idToken,
        },
      }
    : undefined

  const { data } = await prodResource.post('/giraffeql', query, request)

  return data.data
}

export async function executeGiraffeqlSubscription(_that, query, callbackFn) {
  // fetches the idToken
  const currentUser = firebase.auth().currentUser
  const idToken = currentUser ? await currentUser.getIdToken() : null

  // if logged in and no idToken, logout user
  /*
  // should never need this, as auth state is synced in plugin/auth.js
  if (that && !idToken && that.$store.getters['auth/user']) {
    handleLogout(that.$store)
  }
  */

  const request = idToken
    ? {
        headers: {
          Authorization: 'Bearer ' + idToken,
        },
      }
    : undefined

  const { data } = await prodResource.post('/giraffeql', query, request)

  const channel = pusher.subscribe(data.data.channel_name)

  channel.bind('subscription-data', callbackFn)

  return data.data.channel_name
}
