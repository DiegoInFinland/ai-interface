// Responsive hook used by the shadcn sidebar to choose desktop or mobile UI.
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initially unknown; the effect reads the viewport after mounting.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Listen for crossing the breakpoint, rather than every resize event.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    // Remove the browser listener when the component using this hook unmounts.
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Convert the initial undefined value to false so callers always get a boolean.
  return !!isMobile
}
