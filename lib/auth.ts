import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'
import { toast } from 'sonner'

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    
    // Call API to store/update user in database
    await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        provider: 'email'
      })
    })
    
    toast.success("Login successful!", {
      description: "Welcome back!",
      position: "top-right"
    })
    return { user: result.user, error: null }
  } catch (error: any) {
    toast.error("Login failed", {
      description: error.message,
      position: "top-right"
    })
    return { user: null, error: error.message }
  }
}

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    
    // Call API to store/update user in database
    await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        provider: 'google'
      })
    })
    
    toast.success("Login successful!", {
      description: "Welcome back!",
      position: "top-right"
    })
    return { user: result.user, error: null }
  } catch (error: any) {
    toast.error("Login failed", {
      description: error.message,
      position: "top-right"
    })
    return { user: null, error: error.message }
  }
}

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    
    // Call API to store user in database
    await fetch('/api/auth/sync-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        provider: 'email'
      })
    })
    
    toast.success("Account created successfully!", {
      description: "Welcome! Please verify your email.",
      position: "top-right"
    })
    return { user: result.user, error: null }
  } catch (error: any) {
    toast.error("Signup failed", {
      description: error.message,
      position: "top-right"
    })
    return { user: null, error: error.message }
  }
}

export const signOut = async () => {
  // Show loading toast
  toast.loading("Signing out...", {
    id: "logout-toast",
    position: "top-right"
  })

  return new Promise((resolve) => {
    setTimeout(async () => {
      try {
        await firebaseSignOut(auth)
        toast.success("Logged out successfully", {
          id: "logout-toast",
          position: "top-right"
        })
        resolve({ error: null })
      } catch (error: any) {
        toast.error("Logout failed", {
          id: "logout-toast",
          description: error.message,
          position: "top-right"
        })
        resolve({ error: error.message })
      }
    }, 1500) // 1.5 second delay to show the loading toast
  })
}

export const onAuthStateChange = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback)
}
