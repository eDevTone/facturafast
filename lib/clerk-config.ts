/**
 * Clerk Configuration - FacturaFast Theme
 * Matches the app's dark/light emerald design system
 */

import { esMX } from "@clerk/localizations";
import type { Appearance } from "@clerk/types";

/**
 * Spanish (Mexico) localization with custom overrides
 */
export const clerkLocalization = {
  ...esMX,
  signIn: {
    ...esMX.signIn,
    start: {
      ...esMX.signIn?.start,
      title: "Inicia sesión",
      subtitle: "para continuar en FacturaFast",
    },
  },
  signUp: {
    ...esMX.signUp,
    start: {
      ...esMX.signUp?.start,
      title: "Crea tu cuenta",
      subtitle: "para comenzar a facturar electrónicamente",
    },
  },
};

/**
 * Clerk appearance - Dark/Light theme matching FacturaFast
 * Uses CSS variable references so colors follow the active theme automatically.
 */
export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#10b981",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorDanger: "#ef4444",
    colorBackground: "var(--color-card)",
    colorInputBackground: "var(--color-muted)",
    colorInputText: "var(--color-foreground)",
    colorText: "var(--color-foreground)",
    colorTextSecondary: "var(--color-muted-foreground)",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    spacingUnit: "1rem",
  },
  elements: {
    // Root card
    card: "bg-card border border-border/60 shadow-none rounded-xl",
    rootBox: "mx-auto",

    // Header
    headerTitle: "text-foreground text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-muted-foreground text-sm",

    // Form elements
    formFieldLabel: "text-foreground text-sm font-medium",
    formFieldInput:
      "bg-muted/50 border-input text-foreground placeholder:text-muted-foreground " +
      "focus:ring-1 focus:ring-primary focus:border-primary rounded-lg",

    // Buttons
    formButtonPrimary:
      "bg-primary text-primary-foreground hover:bg-primary/90 " +
      "font-medium shadow-none border-0 rounded-lg",

    formButtonReset: "text-muted-foreground hover:text-foreground",

    // Links
    footerActionLink: "text-primary hover:text-primary/90 font-medium",

    // Social buttons
    socialButtonsBlockButton:
      "border-border/60 bg-background text-foreground hover:bg-muted/50 rounded-lg",
    socialButtonsBlockButtonText: "text-foreground font-medium text-sm",

    // Divider
    dividerLine: "bg-border/60",
    dividerText: "text-muted-foreground text-sm",

    // Form messages
    formFieldErrorText: "text-destructive text-sm",
    formFieldSuccessText: "text-success text-sm",

    // Footer
    footer: "bg-transparent",
    footerActionText: "text-muted-foreground text-sm",

    // Identity preview
    identityPreview: "border-border/60 bg-muted/30 rounded-lg",
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",

    // Alert
    alert: "border-border/60 bg-muted/30 text-foreground rounded-lg",
    alertText: "text-sm",

    // Form field (general)
    formField: "space-y-2",

    // Loading spinner
    spinner: "text-primary",

    // Badge
    badge: "bg-primary/15 text-primary border-primary/20",

    // Navbar (user button dropdown)
    navbar: "bg-card border border-border/60",
    navbarButton: "text-foreground hover:bg-muted/50",
    navbarButtonIcon: "text-muted-foreground",

    // User button
    userButtonBox: "border-border",
    userButtonTrigger: "hover:bg-muted/50",
    userButtonAvatarBox: "border-border",

    // Profile card
    profileSection: "border-border/60",
    profileSectionTitle: "text-foreground text-sm font-medium",
    profileSectionContent: "text-muted-foreground text-sm",
  },
};
