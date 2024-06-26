import { useState, useEffect } from 'react'

const getOrientation = () => typeof window !== 'undefined' ?
  window.screen?.orientation?.type : 'portrait-primary';

const useScreenOrientation = () => {
  const [orientation, setOrientation] =
    useState(getOrientation())

  const updateOrientation = (event: Event) => {
    setOrientation(getOrientation())
  }

  useEffect(() => {
    window.addEventListener(
      'orientationchange',
      updateOrientation
    )
    return () => {
      window.removeEventListener(
        'orientationchange',
        updateOrientation
      )
    }
  }, [])

  return orientation
}

export default useScreenOrientation