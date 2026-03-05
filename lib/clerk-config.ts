/**
 * Clerk Configuration - Spanish Localization
 */

import { esMX } from "@clerk/localizations";

/**
 * Spanish (Mexico) localization with custom overrides
 */
export const clerkLocalization = {
  ...esMX,
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
