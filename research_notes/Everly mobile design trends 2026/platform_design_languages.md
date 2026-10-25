# Platform Design Languages and Layout Conventions (iOS + Android, 2025–2026) for a React Native/Expo App

Research date: 2026-10-25. Primary sources: Apple HIG (fetched through Apple's JSON data endpoints, since the HTML pages render client-side), WWDC25 session 356, Android Developers behavior-change docs, Compose Material3 release notes, Expo changelog. Secondary sources: NN/g, 9to5Mac, TapSmart, Wikipedia, design blogs. m3.material.io pages render client-side and could not be fetched, so Material specifics come from Google's Material Components GitHub docs and secondary sources.

## 1. Apple Liquid Glass (iOS 26, WWDC 2025) and its state in 2026 (iOS 27)

### Takeaway
Liquid Glass is Apple's translucent, refractive material for a separate **navigation/controls layer** that floats above content. It is not meant for content itself. On iPhone, tab bars float and can minimize on scroll, toolbars break into floating grouped "bubbles", and shapes follow a concentric/capsule system. After legibility complaints, Apple added a Clear/Tinted toggle in iOS 26.1. In iOS 27 (WWDC June 8, 2026) it replaced that toggle with a continuous slider, lowered default transparency and sharpened icons. Building with the iOS 27 SDK (Xcode 27) ignores the `UIDesignRequiresCompatibility` opt-out, so apps can no longer avoid the new design.

### Cited Findings
**Announcement and scope**
- Announced at WWDC on June 9, 2025, for iOS 26, iPadOS 26, macOS Tahoe, tvOS 26, visionOS 26 and watchOS 26. It succeeds the flat design iOS 7 introduced in 2013. — [Wikipedia: Liquid Glass](https://en.wikipedia.org/wiki/Liquid_Glass); [Apple Newsroom, June 2025](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/)
- The material is translucent: it refracts and reflects what is behind it, adapts to light and dark appearances to keep text legible, and on iOS/iPadOS reacts to device movement. — [Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass)

**HIG: glass vs. content layer (Materials page)**
- "Liquid Glass forms a distinct functional layer for controls and navigation elements — like tab bars and sidebars — that floats above the content layer." — [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- "**Don't use Liquid Glass in the content layer.**" For content-layer elements such as app backgrounds, use the standard materials. One exception: transient interactive controls in the content layer, such as sliders and toggles, take on a glass look while someone is using them. — [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- "**Use Liquid Glass effects sparingly.** Limit these effects to the most important functional elements in your app." — [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- There are two variants:
  - **Regular** blurs and adjusts luminosity. Use it when the background could hurt legibility, or for text-heavy components such as alerts, sidebars and popovers.
  - **Clear** is highly translucent. Use it only over visually rich media backgrounds such as photos and video. "If the underlying content is bright, consider adding a dark dimming layer of 35% opacity."
  — [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- Variant appearance can change with the user's preferred Liquid Glass look and with the Reduce Transparency and Increase Contrast settings. Change log: Liquid Glass guidance added June 9, 2025 and updated September 9, 2025. — [Apple HIG: Materials](https://developer.apple.com/design/human-interface-guidelines/materials)

**Tab bars (HIG Tab bars page; Liquid Glass guidance added July 28, 2025, updated December 16, 2025 and June 8, 2026)**
- "A tab bar floats above content at the bottom of the screen. Its items rest on a Liquid Glass background that allows content beneath to peek through." — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Minimizing: "For tab bars with an attached accessory, like the MiniPlayer in Music, you can choose to minimize the tab bar and move the accessory inline with it when a person scrolls down. A person can exit the minimized state by tapping a tab or scrolling to the top of the view." — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- The APIs are SwiftUI `tabBarMinimizeBehavior(.onScrollDown)` and UIKit `UITabBarController.MinimizeBehavior`. The bar re-expands when the user scrolls the other way. — [WWDC25 session 284](https://developer.apple.com/videos/play/wwdc2025/284/); [CreateWithSwift](https://www.createwithswift.com/making-the-tab-bar-collapse-while-scrolling/)
- "Use a tab bar to support navigation, not to provide actions. If you need to provide controls that act on elements in the current view, use a toolbar instead." — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- Tab count and labels:
  - The HIG gives no hard maximum for iPhone: "it's generally easier to navigate among fewer tabs." It says "Avoid overflow tabs." If there is not enough room, the trailing tab becomes a "More" tab.
  - "Include tab labels… Use single words whenever possible."
  - "five or fewer" appears only in the iPadOS customizable-tab guidance.
  — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- A dedicated **Search tab** can sit at the trailing end of the bar. "Make sure the tab bar is visible when people navigate to different sections" (modals are the exception). "Reserve badges for critical information." — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- WWDC25: "iOS now includes a dedicated Search tab at the bottom." Accessory views hold persistent features such as media controls. "Avoid placing screen-specific actions here—a checkout button, for example, belongs with the content it supports." — [WWDC25 session 356 "Get to know the new design system"](https://developer.apple.com/videos/play/wwdc2025/356/)

**Toolbars, sheets, shapes, typography (WWDC25 session 356)**
- Toolbars are no longer pinned to the device bezels. They split into floating bubbles that appear and disappear depending on context. — [Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass)
- Toolbar guidance:
  - Remove custom bar backgrounds and borders, and show hierarchy through "layout and grouping".
  - Items grouped with the correct API share a background.
  - Move secondary actions into a "more" menu.
  - Don't group text buttons with symbols.
  - Keep the primary action separate and tinted, often a blue checkmark on iOS.
  — [WWDC25 session 356](https://developer.apple.com/videos/play/wwdc2025/356/)
- Shape system:
  - Fixed shapes keep a constant corner radius.
  - Capsules use a radius of half the container height.
  - Concentric shapes take the parent's radius minus the padding.
  - On iPhone, "use a capsule with extra margin to create space near the screen edge."
  - Nested or standalone components use concentric shapes with a fallback radius.
  — [WWDC25 session 356](https://developer.apple.com/videos/play/wwdc2025/356/)
- Sheets and modals:
  - Action sheets now spring from the control that triggered them, not from the bottom of the screen.
  - Modal tasks pair glass with a dimming layer.
  - When a sheet is dragged up, the glass "recedes, becoming more opaque and gently growing in size."
  — [WWDC25 session 356](https://developer.apple.com/videos/play/wwdc2025/356/)
- **Scroll edge effects** replace hard dividers with a subtle blur under floating UI. Soft is the default on iOS. Apply "one scroll edge effect per view", and don't use one where nothing floats. — [WWDC25 session 356](https://developer.apple.com/videos/play/wwdc2025/356/)
- Typography is "bolder and left-aligned" in alerts and onboarding. System colors were retuned for Light, Dark and Increased Contrast. — [WWDC25 session 356](https://developer.apple.com/videos/play/wwdc2025/356/)
- App icons became layered and translucent, with a glass shimmer that reacts to motion and a new "clear" appearance. They are built with Icon Composer, which runs on macOS only (Expo SDK 54 note). — [Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass); [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54)

**Backlash and accessibility settings**
- After beta 1, Apple raised the opacity of navigation bars and other chrome. iOS 26 beta 4 (July 22, 2025) refined the effect again. — [Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass); [MacRumors](https://www.macrumors.com/2025/07/22/apple-liquid-glass-ios-26-beta-4/)
- NN/g (Raluca Budiu, October 10, 2025) found these problems:
  - Translucent controls over busy content reduce contrast ("Text on top of text creates an illegible mess").
  - Floating titles, search and tab bars obscure content.
  - Animation is distracting ("Motion for motion's sake is not usability").
  - Tab bars are cramped, and the search button is split off from them.
  - Health's tab bar collapses into one icon when search is active.
  - Search moved to the bottom, and back buttons dropped the previous page's label.
  - Verdict: "Apple is prioritizing spectacle over usability."
  — [NN/g: Liquid Glass Is Cracked](https://www.nngroup.com/articles/liquid-glass/)
- Wired quoted designers calling it "beautiful" and "hard to read". — [Wired](https://www.wired.com/story/designers-react-to-apple-liquid-glass/)
- **iOS 26.1** (toggle first seen in beta 4, October 20, 2025) added Settings › Display & Brightness › Liquid Glass with **Clear** (the launch look) or **Tinted**. Apple's description: "Tinted increases opacity and adds more contrast." The older all-or-nothing **Reduce Transparency** remains under Accessibility › Display & Text Size. — [MacRumors](https://www.macrumors.com/2025/10/20/ios-26-1-liquid-glass-toggle/); [TechRadar](https://www.techradar.com/phones/ios/the-latest-ios-26-1-beta-finally-gives-iphone-users-what-theyve-been-crying-out-for); [Bottomless Black Void](https://bottomlessblackvoid.bearblog.dev/on-liquid-glass-toggle)
- Webnots reports that the Liquid Glass options are disabled while the accessibility transparency/contrast settings are on, and that iOS 26.2 prompts users to turn those off. Single source, unverified. — [Webnots](https://www.webnots.com/how-to-reduce-liquid-glass-effect-on-iphone-and-mac/)

**iOS 27 (WWDC June 8, 2026)**
- A new **slider** runs "between an opaque tinted and a clear appearance", replacing the two fixed modes.
- Default rendering is changed to give higher contrast.
- App icons get more separation between layers and "sharper defined edges", answering complaints that they looked blurry at small sizes.
— [9to5Mac, June 8, 2026](https://9to5mac.com/2026/06/08/apple-updates-liquid-glass-ui-in-ios-27-with-new-slider-to-customize-how-it-looks/)
- TapSmart adds:
  - Lower default transparency.
  - "Toolbars are making a comeback in some apps", so floating buttons don't feel disconnected.
  - Unnecessary sidebar bezels and overly round corners are reined in.
  - Only some icon elements catch the light now.
  - It frames iOS 27 as a "tock" refinement year.
  — [TapSmart WWDC26 recap](https://www.tapsmart.com/news/wwdc26-recap/); [Tom's Guide](https://www.tomsguide.com/phones/iphones/ios-27-has-a-bunch-of-changes-including-a-refined-liquid-glass-design-but-how-much-has-changed-from-ios-26)
- Wikipedia's infobox lists iOS 27.0.1 stable on September 28, 2026 and 27.2 RC on October 19, 2026. Not independently verified. — [Wikipedia](https://en.wikipedia.org/wiki/Liquid_Glass)
- **Opt-out ends.** Apple's docs, as quoted on the developer forums, say the system ignores `UIDesignRequiresCompatibility` when you build for iOS 27 or later. In 2025 Apple had said "We intend this option to be removed in the next major release." An Apple Frameworks Engineer confirmed the rule follows the build SDK, not the device OS: apps built with older SDKs keep the old look on iOS 27. A claimed "April 2027 App Store deadline" is unconfirmed. — [Apple Dev Forums 832543](https://developer.apple.com/forums/thread/832543); [Apple Dev Forums 832710](https://developer.apple.com/forums/thread/832710); [Baytech (deadline misunderstood)](https://www.baytechconsulting.com/blog/liquid-glass-app-store-deadline-misunderstood)

**React Native / Expo relevance**
- Expo SDK 54 / Expo Router v6 exposes the iOS 26 Liquid Glass bottom tabs as **native tabs**. Status: alpha, import path `expo-router/unstable-native-tabs`, and the API may change. `NativeTabs.Trigger.Icon` arrives in SDK 55. Glass adapts automatically when you use dynamic colors such as `PlatformColor("label")`. — [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54); [Expo Router v6 blog](https://expo.dev/blog/expo-router-v6); [Expo native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)

### Inferences
- For a productivity/wellness app, the HIG points to these choices:
  - Glass only on chrome (tab bar, toolbars, floating buttons).
  - Opaque or standard-material cards and backgrounds for content.
  - Regular glass rather than clear, except over imagery such as a meditation photo or video.
  - A 35% dimming layer when clear glass sits over bright content.
- Custom JS-drawn "fake glass" tab bars (a blur view plus custom shapes) will not follow the user's Clear/Tinted slider, Reduce Transparency or Increase Contrast. Native tabs (for example `expo-router` native tabs, or react-native-screens) inherit those settings automatically. That is a strong argument for native chrome on iOS.
- Since iOS 27 removes the opt-out at build time, any Expo app built with Xcode 27 gets Liquid Glass system components whether or not it was designed for them. Audit the native headers and sheets.
- Because Apple pulled back in iOS 27 (less transparency, toolbars returning), a restrained, legible use of glass is the safer bet than maximal translucency.

### Gaps
- I could not fetch the HIG "Layout" page, so this section has no primary-source quote on safe areas, the Dynamic Island or the home indicator. See section 3.
- There is no primary Apple source here for iOS 27 tab bar changes specifically. 9to5Mac and TapSmart do not mention any.
- The default `tabBarMinimizeBehavior` (`.automatic`) is described only by a third-party blog.
- The iOS 26.2 accessibility-prompt detail comes from a single unverified source.

## 2. Material 3 Expressive (May 2025, Android 16) and its state in 2026

### Takeaway
M3 Expressive, announced May 13, 2025 and shipped on Pixel with Android 16 QPR1 in September 2025, is an evolution of Material 3 rather than a replacement. It adds spring-based motion physics in place of the old duration/easing system, a library of 35 new shapes with shape morphing, emphasized typography, richer dynamic color, and new components: button groups, split button, a FAB menu, docked and floating toolbars, a loading indicator, and a shorter "flexible" navigation bar. The **bottom app bar is deprecated** in favor of the docked toolbar. In Compose, Material3 1.4.0 is stable and 1.5.0 is in beta as of October 2026, and many Expressive APIs graduated from experimental during the 1.5 alphas.

### Cited Findings
- Google announced it on May 13, 2025 for Android 16 and Wear OS 6, with Pixel first "later this year". The announcement mentions:
  - Updated dynamic color themes, responsive components and emphasized typography.
  - "Springy" animations, for example dragging one notification moves its neighbours, and snapping one off the stack triggers a haptic.
  - A blurred notification shade.
  - Rollout to Google Photos, Fitbit and Gmail.
  — [Google Blog, May 13, 2025](https://blog.google/products/android/material-3-expressive-android-wearos-launch/)
- It shipped stable in Android 16 QPR1 with the September 2025 Pixel Feature Drop, for Pixel 6 and newer. It first appeared in QPR1 Beta 1 in May 2025. — [Rozetked](https://rozetked.me/news/41312); [Android Authority](https://www.androidauthority.com/material-3-expressive-android-16-qpr1-beta-3557763)
- Research claims, from a Google post that was briefly published then pulled:
  - 46 studies with more than 18,000 participants.
  - Key UI elements spotted "up to four times faster".
  - Users aged 45+ performed on par with younger users.
  - Expressive design was preferred over designs that followed the iOS HIG, especially by 18–24-year-olds.
  Treat these as vendor claims. — [Chrome Unboxed](https://chromeunboxed.com/google-leaks-the-reason-and-process-behind-their-new-material-3-expressive-design-language); [Supercharge Design](https://supercharge.design/blog/material-3-expressive)
- Components (secondary summary):
  - **Button groups** apply shape, motion and width changes to buttons, sizes XS–XL.
  - **FAB menu** replaces speed dial and stacked small FABs.
  - **Split button** comes in 5 sizes and 4 color styles.
  - **Loading indicator** covers waits under about 5 seconds and should replace most indeterminate circular progress.
  - **Docked toolbar** replaces the bottom app bar; the **floating toolbar** gives more placement options.
  - Shapes: **35 new shapes plus morphing**, corner-radius tokens, and "full" rounding instead of 50%.
  - The motion **physics system replaces the easing and duration system**.
  — [Supercharge Design](https://supercharge.design/blog/material-3-expressive)
- Official MDC docs say the bottom app bar "is being deprecated in favor of the docked toolbar", and the toolbars page says the bottom app bar is "no longer recommended". The **docked toolbar** spans the full width and is for global actions that stay the same across pages. The **floating toolbar** floats above content and is for contextual, page-specific actions. — [MDC Android: BottomAppBar.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomAppBar.md); [MDC Android: DockedToolbar.md](https://github.com/material-components/material-components-android/blob/master/docs/components/DockedToolbar.md); [M3 Toolbars](https://m3.material.io/components/toolbars/overview)
- Real app adoption:
  - Google Chat and Fitbit use the pill-shaped floating toolbar.
  - Google Drive replaced a bottom sheet with a FAB menu. Google's guidance suggests 2–6 actions, and 9to5Google noted it makes the UI tall.
  - Fitbit uses the contained loading indicator.
  - Drive's list/grid switch is a button group.
  — [9to5Google Material Design guide](https://9to5google.com/guides/material-design/)
- Compose API status:
  - Material3 **1.4.0 is stable**. **1.5.0-beta02** shipped October 21, 2026 (beta01 on October 7, 2026).
  - Graduated from experimental in the 1.5 alphas: ButtonGroup, FloatingToolbar, SplitButton, FlexibleBottomAppBar, expressive list items, and several top app bars.
  - `BottomAppBar` became stable in 1.5.0-alpha26.
  - `LocalMotionScheme` was removed; use `MaterialTheme.motionScheme`.
  - `ShortNavigationBar` (the flexible navigation bar) still had changes in alpha26.
  — [Compose Material3 release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3)
- `ShortNavigationBar` is the Expressive "flexible" nav bar. On medium screens it should hold 3–6 items, centered rather than spread out evenly. — [composables.com ShortNavigationBar](https://composables.com/docs/androidx.compose.material3/material3/1.4.0-alpha17/components/ShortNavigationBar); [Compose package summary](https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary.html)

### Inferences
- React Native has no first-party M3 Expressive kit, so an Expo app will imitate the patterns: spring animations (Reanimated `withSpring`), pill-shaped floating toolbars, bigger and rounder FABs, emphasized display type, shape morphing on press.
- The most transferable ideas for a productivity/wellness app:
  - A FAB menu with 2–6 quick-create actions (task, reminder, journal, voice note) instead of a center "+" tab.
  - A floating toolbar for contextual actions on detail screens.
  - Spring motion in place of fixed durations.
  - A shorter navigation bar.
- Because the bottom app bar is deprecated, don't build an Android "BottomAppBar with cradled FAB" (the old M2 notch pattern).

### Gaps
- m3.material.io pages could not be fetched, so these have no primary-source citations: the exact flexible navigation bar height (reported elsewhere as 64dp vs. 80dp, unverified and omitted), the spring token values (spatial vs. effects, expressive vs. standard schemes), and the emphasized type-scale names.
- I could not confirm the Compose stable status of `FloatingActionButtonMenu`, `LoadingIndicator` or `MaterialExpressiveTheme` from the part of the release notes I read.
- I found no reliable info on an Android 17 / M3 design update in 2026.

## 3. Edge-to-edge enforcement (Android 15/16) and iOS safe areas

### Takeaway
On Android 15 (API 35), apps targeting SDK 35 draw edge-to-edge by default: status-bar and nav-bar color APIs do nothing, and the display-cutout mode is forced to ALWAYS. Android 16 (API 36) removes the `windowOptOutEdgeToEdgeEnforcement` escape hatch. Expo SDK 54 targets Android 16, so edge-to-edge is always on and cannot be turned off in Expo apps. Content must handle insets for system bars, cutouts and gestures. On iOS the equivalent is safe-area handling.

### Cited Findings
- Android 15 (API 35):
  - "Apps are edge-to-edge by default on devices running Android 15 if the app is targeting Android 15."
  - The status bar is transparent; "`setStatusBarColor`… deprecated and have no effect on Android 15."
  - The gesture nav bar is transparent, and `setNavigationBarColor` does nothing for gesture navigation.
  - 3-button navigation gets an 80% opaque background by default (`navigationBarContrastEnforced` = true).
  - `layoutInDisplayCutoutMode` values `SHORT_EDGES`, `NEVER` and `DEFAULT` are treated as `ALWAYS`.
  — [Android 15 behavior changes](https://developer.android.com/about/versions/15/behavior-changes-15)
- Android 16 (API 36): "`R.attr#windowOptOutEdgeToEdgeEnforcement` is deprecated and disabled, and your app can't opt-out of going edge-to-edge." The opt-out still works when an API-36-targeting app runs on an Android 15 device. — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Android 16 also:
  - Turns on **predictive back** system animations by default for apps targeting API 36. `onBackPressed` is no longer called and `KEYCODE_BACK` is no longer dispatched. Temporary opt-out: `android:enableOnBackInvokedCallback="false"`.
  - Ignores orientation, resizability and aspect-ratio restrictions on screens ≥ sw600dp. That opt-out goes away at API 37.
  — [Android 16 behavior changes](https://developer.android.com/about/versions/16/behavior-changes-16)
- Inset types to handle:
  - `systemBars()`, for tappable views that must not be hidden.
  - `displayCutout()`.
  - `systemGestures()`, for bottom sheets, carousels and swipe areas, where system gestures take priority.
  — [Android edge-to-edge guide](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- Guidance from the edge-to-edge guide:
  - Apply system-bar insets as margins on FABs.
  - Set `clipToPadding="false"` on scrolling lists so items can scroll behind the bars.
  - "Don't create a translucent gesture navigation bar."
  - Full-screen dialogs need to be made edge-to-edge explicitly.
  - Before Android 10, consuming insets can stop siblings from getting them.
  — [Android edge-to-edge guide](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- Compose Material 3 `TopAppBar`, `BottomAppBar` and `NavigationBar`, and views-based `BottomNavigationView`, handle insets automatically. Custom components must apply insets as padding by hand. — [Android 15 behavior changes](https://developer.android.com/about/versions/15/behavior-changes-15)
- **Expo SDK 54:** "because SDK 54 targets Android 16, edge-to-edge will be enabled in all Android apps, and cannot be disabled." Apps that used the `react-native-edge-to-edge` config plugin must now install it as a direct dependency. — [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54)

### Inferences
- Common mistakes in RN/Expo apps, inferred from the docs above:
  1. A hardcoded header height or `StatusBar` background color. These no longer work on Android 15+; use top-inset padding instead.
  2. A custom bottom tab bar or FAB with a fixed `bottom: 16` that collides with the gesture handle or 3-button bar. Add `insets.bottom`.
  3. Scroll content cut off at the bottom. Add `contentContainerStyle` bottom padding equal to tab bar height plus inset, so the last item clears the floating bar.
  4. Horizontal swipe carousels or bottom-sheet drag handles placed inside system-gesture zones.
  5. Assuming portrait-only on tablets or foldables (Android 16 at sw600dp+).
  6. Custom back interception that breaks predictive back.
- On iOS, the equivalent is respecting the top safe area (status bar and Dynamic Island) and the bottom safe area (home indicator), typically with `react-native-safe-area-context`. With floating Liquid Glass tab bars, content should scroll *under* the bar, with bottom content inset so the last row stays reachable, rather than stopping above an opaque bar.

### Gaps
- I did not fetch Apple HIG Layout or safe-area documentation, so there are no primary quotes on the Dynamic Island or home-indicator spacing. The report writer should mark the iOS safe-area points as standard practice, not cited facts.
- I did not fetch docs for `react-native-safe-area-context` or `react-native-edge-to-edge`.

## 4. Bottom navigation best practices (2025–2026): floating vs. docked, item count, center "+" button, labels, hide-on-scroll

### Takeaway
Both platforms now favor bottom navigation with **3–5 labelled destinations for navigation only**. iOS 26+ uses a floating glass tab bar that can minimize on scroll, with search as a separate trailing tab. Android M3 Expressive uses a shorter flexible navigation bar and moves actions into a FAB, FAB menu or floating toolbar. Neither guideline endorses a center "+" action inside the tab bar: Apple says explicitly to use the tab bar for navigation, not actions. Primary create actions belong in a toolbar button (iOS) or a FAB/FAB menu (Android).

### Cited Findings
- iOS: "Use a tab bar to support navigation, not to provide actions… use a toolbar instead." — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- iOS: no screen-specific actions in the tab-bar accessory ("a checkout button… belongs with the content it supports"). — [WWDC25 session 356](https://developer.apple.com/videos/play/wwdc2025/356/)
- iOS: fewer tabs are easier to navigate; avoid overflow; use single-word labels; keep the tab bar visible across sections (modals excepted); a search tab can sit at the trailing end. — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- iOS hide-on-scroll: minimizing on scroll is supported, the bar re-expands on reverse scroll, a tap, or scrolling to the top. HIG frames it around tab bars that have an accessory. — [Apple HIG: Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars); [WWDC25 session 284](https://developer.apple.com/videos/play/wwdc2025/284/)
- NN/g criticizes shrinking and collapsing tab bars, and controls that change size or location, because they make the interface "harder to learn and less predictable". — [NN/g](https://www.nngroup.com/articles/liquid-glass/)
- Android: navigation bars are for three to five equally important destinations. The flexible `ShortNavigationBar` holds 3–6 items on medium screens. — [Android Compose navigation bar docs](https://developer.android.com/develop/ui/compose/components/navigation-bar); [composables.com ShortNavigationBar](https://composables.com/docs/androidx.compose.material3/material3/1.4.0-alpha17/components/ShortNavigationBar)
- Android: the bottom app bar, which used to host a cradled FAB, is deprecated. The docked toolbar is for global actions, and the floating toolbar is for contextual actions. The FAB menu covers 2–6 actions. — [MDC BottomAppBar.md](https://github.com/material-components/material-components-android/blob/master/docs/components/BottomAppBar.md); [MDC DockedToolbar.md](https://github.com/material-components/material-components-android/blob/master/docs/components/DockedToolbar.md); [9to5Google](https://9to5google.com/guides/material-design/)
- An Expo floating toolbar can take the Scaffold FAB slot, keeping actions at the bottom of the screen, per a Compose article. — [ProAndroidDev](https://proandroiddev.com/material-3-expressive-design-a-new-era-part-2-6a93483c98b0)

### Inferences
- A center "+" or "mic" button styled as a fake tab (common in productivity apps) conflicts with the HIG's navigation-only rule. It also cannot be built inside native iOS 26 tab bars without custom chrome, which loses the native glass and accessibility settings.
- Platform-aligned alternatives:
  - **iOS:** a floating glass button or toolbar item (bottom-trailing, or in the nav bar), or a bottom accessory only if it is *app-wide and persistent*, such as a global "now playing / recording" control.
  - **Android:** a FAB or FAB menu above the nav bar, offset by `insets.bottom`.
- Recommended structure for a productivity/wellness app:
  - 3–5 single-word labelled tabs, with labels always visible.
  - Search as its own trailing tab on iOS 26+.
  - Hide-on-scroll only for long feed screens, if at all, given NN/g's predictability concerns.
  - Floating bar on iOS. On Android, docked or flexible-nav-bar styling with edge-to-edge insets.
- "Floating vs. docked" is now platform-specific: iOS floats by default. Material's navigation bar remains a full-width, docked component, and only Material *toolbars* float.

### Gaps
- I could not access m3.material.io to confirm whether Material explicitly says "don't place a FAB inside the navigation bar", or the exact Expressive navigation-bar height.
- I found no 2026 usability studies comparing floating and docked bars, or center-action tabs, beyond the NN/g critique.
