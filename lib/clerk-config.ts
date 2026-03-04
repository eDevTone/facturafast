/**
 * Clerk Configuration - Spanish Localization
 */

import { esMX } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";

/**
 * Spanish (Mexico) localization with custom overrides
 */
export const clerkLocalization: LocalizationResource = {
  ...esMX,
  // Custom overrides (opcional)
  signIn: {
    ...esMX.signIn,
    start: {
      ...esMX.signIn?.start,
      title: "Inicia sesión en FacturaFast",
      subtitle: "para continuar con la facturación",
    },
  },
  signUp: {
    ...esMX.signUp,
    start: {
      ...esMX.signUp?.start,
      title: "Crea tu cuenta en FacturaFast",
      subtitle: "para comenzar a facturar electrónicamente",
    },
  },
};

/**
 * Clerk appearance customization
 */
export const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "#3f3f46", // zinc-700 (matches app theme)
    colorDanger: "#ef4444",   // red-500
  },
  elements: {
    formButtonPrimary: "bg-zinc-700 hover:bg-zinc-600",
    card: "border border-zinc-200 shadow-sm",
    headerTitle: "text-zinc-900",
    headerSubtitle: "text-zinc-600",
  },
};
