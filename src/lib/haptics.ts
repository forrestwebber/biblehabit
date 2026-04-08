// Haptic feedback for BibleHabit — gracefully no-ops on web
import { Capacitor } from "@capacitor/core"

let Haptics: typeof import("@capacitor/haptics").Haptics | null = null

async function getHaptics() {
  if (!Capacitor.isNativePlatform()) return null
  if (!Haptics) {
    const mod = await import("@capacitor/haptics")
    Haptics = mod.Haptics
  }
  return Haptics
}

/** Light tap — for verse selection, button press */
export async function hapticTap() {
  const h = await getHaptics()
  if (!h) return
  try {
    const { ImpactStyle } = await import("@capacitor/haptics")
    await h.impact({ style: ImpactStyle.Light })
  } catch {}
}

/** Medium impact — for saving note, saving highlight */
export async function hapticMedium() {
  const h = await getHaptics()
  if (!h) return
  try {
    const { ImpactStyle } = await import("@capacitor/haptics")
    await h.impact({ style: ImpactStyle.Medium })
  } catch {}
}

/** Success notification — for marking day complete */
export async function hapticSuccess() {
  const h = await getHaptics()
  if (!h) return
  try {
    const { NotificationType } = await import("@capacitor/haptics")
    await h.notification({ type: NotificationType.Success })
  } catch {}
}
