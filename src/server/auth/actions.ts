'use server'

import { signOut } from './index'

export async function signOutFromElection() {
  await signOut({ redirectTo: '/' })
}
