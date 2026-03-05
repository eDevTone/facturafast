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
 * Clerk appearance - Dark/Light theme matching FacturaFast
 */
export const clerkAppearance: Appearance = {
  baseTheme: undefined, // Let our CSS variables handle it
  variables: {
    // Brand colors (emerald accent)
    colorPrimary: "#10b981",
    colorSuccess: "#10b981",
    colorWarning: "#f59e0b",
    colorDanger: "#ef4444",
    
    // Border radius
    borderRadius: "0.5rem",
    
    // Fonts
    fontFamily: "var(--font-geist-sans)",
    fontFamilyButtons: "var(--font-geist-sans)",
    
    // Spacing
    spacingUnit: "1rem",
  },
  elements: {
    // Root card
    card: "bg-card border border-border shadow-none",
    rootBox: "mx-auto",
    
    // Header
    headerTitle: "text-foreground text-2xl font-semibold tracking-tight",
    headerSubtitle: "text-muted-foreground text-sm",
    
    // Form elements
    formFieldLabel: "text-foreground text-sm font-medium",
    formFieldInput: 
      "bg-muted/50 border-input text-foreground placeholder:text-muted-foreground " +
      "focus:ring-1 focus:ring-primary focus:border-primary",
    
    // Buttons
    formButtonPrimary: 
      "bg-primary text-primary-foreground hover:bg-primary/90 " +
      "font-medium shadow-none border-0",
    
    formButtonReset: 
      "text-muted-foreground hover:text-foreground",
    
    // Links
    footerActionLink: "text-primary hover:text-primary/90 font-medium",
    
    // Social buttons
    socialButtonsBlockButton: 
      "border-border bg-background text-foreground hover:bg-muted/50",
    
    socialButtonsBlockButtonText: "text-foreground font-medium",
    
    // Divider
    dividerLine: "bg-border",
    dividerText: "text-muted-foreground text-sm",
    
    // Form messages
    formFieldErrorText: "text-destructive text-sm",
    formFieldSuccessText: "text-success text-sm",
    
    // Footer
    footer: "bg-transparent",
    footerActionText: "text-muted-foreground text-sm",
    
    // Identity preview
    identityPreview: "border-border bg-muted/30",
    identityPreviewText: "text-foreground",
    identityPreviewEditButton: "text-primary hover:text-primary/90",
    
    // Alert
    alert: "border-border bg-muted/30 text-foreground",
    alertText: "text-sm",
    
    // Form field (general)
    formField: "space-y-2",
    
    // Loading spinner
    spinner: "text-primary",
    
    // Badge
    badge: "bg-primary/15 text-primary border-primary/20",
    
    // Navbar (user button dropdown)
    navbar: "bg-card border border-border",
    navbarButton: "text-foreground hover:bg-muted/50",
    navbarButtonIcon: "text-muted-foreground",
    
    // User button
    userButtonBox: "border-border",
    userButtonTrigger: "hover:bg-muted/50",
    userButtonAvatarBox: "border-border",
    
    // Profile card (user button dropdown)
    profileSection: "border-border",
    profileSectionTitle: "text-foreground text-sm font-medium",
    profileSectionContent: "text-muted-foreground text-sm",
  },
};
