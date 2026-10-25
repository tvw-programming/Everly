# Modern UI capabilities in Expo SDK 58 / React Native 0.88: feasibility for an Expo Router app

Context: Everly is on expo ~58.0.19, react-native 0.88.0, expo-router ~58.0.26, react-native-reanimated 4.7.1. It currently uses a custom JS bottom dock with a center "+" FAB, react-native-safe-area-context, expo-haptics, expo-audio, and Light/Dark/"3D Glass" themes. Research date: 2026-10-25. Most claims below come from the current Expo docs (`/versions/latest/` = SDK 58) and the SDK 58 release posts. Anything verified only for an earlier SDK is flagged.

### SDK 58 baseline facts that affect every section
- SDK 58 moves React Native from 0.86 to 0.88, so it includes the 0.87 and 0.88 changes. — [How to upgrade to SDK 58](https://expo.dev/blog/how-to-upgrade-to-sdk-58)
- "SDK 58 is built for iOS 27." Apps built with the iOS 27 SDK use the scene-based life cycle and are resizable. `ScreenOrientation.lockAsync` may have no effect while the app is resizable. — [SDK 58 beta changelog](https://expo.dev/changelog/sdk-58-beta)
- Prebuild now generates `SceneDelegate.swift`. Projects that customize `AppDelegate.swift` must follow the migration guide. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58); [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- EAS images: the beta post said Xcode 27 images were "coming soon" and that `latest` shipped Xcode 26.6 — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta). The later upgrade guide (Oct 21, 2026) says "the `sdk-58` and `latest` iOS image aliases now point to the Xcode 27.1 image" — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58). These do not conflict: the image changed between beta and stable. The upgrade guide is the current one.
- Expo Go supports only SDK 58. The store versions follow "in the next few weeks". Expo recommends development builds for new projects. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58). Before the store update, SDK 58 Expo Go is available through Expo CLI on Android devices and emulators and on iOS simulators. iOS devices use `eas go`. — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- RN 0.88 makes the Strict TypeScript API the default. Deep imports from `react-native/Libraries/*` are type errors, and refs use instance types such as `ViewInstance`. RN 0.88 removes `InteractionManager` (use `requestIdleCallback`), the `Modal` `animated` prop, and the `StatusBar` `backgroundColor`, `translucent` and `networkActivityIndicatorVisible` props. `ImageBackground` is deprecated in favor of a `View` with an absolutely positioned `Image`. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58); [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- The Android template now enables R8 in release builds by default. Opt out with `android.enableMinifyInReleaseBuilds: false` via `expo-build-properties`. Libraries that rely on reflection may need keep rules. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58)
- `expo-symbols` and `@expo/ui` are now optional peer dependencies of expo-router, so they must be installed explicitly if used. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58); [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)

---

## Liquid Glass in React Native: expo-glass-effect and @expo/ui SwiftUI, requirements, fallbacks, Expo Go

### Takeaway
`expo-glass-effect` (`GlassView`, `GlassContainer`) renders real iOS 26+ Liquid Glass through `UIVisualEffectView`. It is included in Expo Go and becomes a plain `View` on Android, web and older iOS. Everly's "3D Glass" theme therefore needs its own Android/older-iOS look, for example an `expo-blur` material plus a tint. On SDK 58, iOS 26+ headers are also transparent glass by default, and that will change existing screen layouts.

### Cited Findings
- **Package and component:** `expo-glass-effect` provides "React components that render a liquid glass effect using iOS's native UIVisualEffectView." Its platforms are iOS and tvOS, and it is "Included in Expo Go." — [Expo GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **Fallback:** "`GlassView` is only available on iOS 26 and above. It will fallback to regular `View` on unsupported platforms." — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **`GlassView` props:**
  - `glassEffectStyle`: `'regular'` (default), `'clear'` or `'none'`, or a config `{ style, animate, animationDuration }` that animates style changes natively.
  - `tintColor`.
  - `isInteractive` (default `false`).
  - `colorScheme`: `'auto' | 'light' | 'dark'`, "to override the system appearance when your app has its own theme toggle". This matters for Everly's in-app Light/Dark toggle.

  — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **`GlassContainer`:** "allows you to combine multiple glass views into a combined effect". Its `spacing` prop is "the distance at which glass elements start affecting each other", which controls the merge/morph. — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **Opacity:** Apple does not recommend `opacity` below 1 on a `GlassView` or its parents, and "at very low opacity, the glass effect does not render." Animate the style with `glassEffectStyle={{style, animate:true}}` toggling to `'none'` instead. The documented Reanimated workaround animates a wrapper's opacity and flips `glassEffectStyle` through `useAnimatedProps`; the docs label it iOS 26.1+. — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **Runtime checks:** `isLiquidGlassAvailable()` validates "system and compiler versions, as well as the Info.plist settings" (`UIDesignRequiresCompatibility`). `isGlassEffectAPIAvailable()` exists because "some iOS 26 beta versions do not have the Liquid Glass API available, which can lead to crashes"; check it before using `GlassView`/`GlassContainer` ([issue #40911](https://github.com/expo/expo/issues/40911)). — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **Accessibility:** `isLiquidGlassAvailable` "may also be `true` if the user has enabled accessibility settings that limit the Liquid Glass effect". Use `AccessibilityInfo.isReduceTransparencyEnabled()` to detect that. — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **iOS 27 SDK:** in SDK 58, "`expo-glass-effect` reports `isLiquidGlassAvailable` as `true` in apps built with the iOS 27 SDK." — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- **Headers:** "iOS 26+ headers are transparent with Liquid Glass by default, and content extends beneath them" in SDK 58 Expo Router. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58)
- **@expo/ui SwiftUI:** SDK 58 adds `NavigationStack`, `Toolbar`, `NavigationLink`, `NavigationSplitView` and a `Background` component. Modifiers such as `background`, `tint`, `border` and `foregroundStyle` accept any `ShapeStyle`. **Breaking:** `HStack`, `VStack` and `GlassEffectContainer` now pass an unset `spacing` as `nil`; pass `spacing={0}` to keep the old layout. `<Host>` now top-aligns its content. — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)

### Inferences
- **Fallback chain for the "3D Glass" theme:**
  1. `isGlassEffectAPIAvailable() && isLiquidGlassAvailable() && !reduceTransparency` → `GlassView` with `colorScheme` set from the app theme.
  2. Otherwise on iOS → `BlurView` with a system material tint.
  3. On Android → `BlurView` with `blurMethod="dimezisBlurViewSdk31Plus"` plus a translucent tint.
  4. Web → CSS `backdrop-filter`. This is unverified; see Gaps.
- `GlassContainer` with `spacing` is the practical way to get the morphing "pill + FAB" glass look on iOS for the custom dock. The FAB can stay a JS component.
- Expo Go shows the effect only on an iOS 26+ device or simulator, and Expo Go was itself built with a recent Xcode. For the true iOS 27-SDK behavior, test in a development build compiled on the Xcode 27.1 EAS image.

### Gaps
- No official fallback is given for Android "glass": the docs only say `GlassView` becomes a `View`. I found no Expo-documented Android Material 3 Expressive "glass-like" component.
- I did not verify whether `@expo/ui/swift-ui` exposes a `glassEffect()` view modifier on SDK 58. Only `GlassEffectContainer` is named in the changelog.
- Not verified: web behavior of `GlassView` beyond "fallback to regular View".

---

## Native tabs (Expo Router NativeTabs) vs JS tabs with a custom tab bar

### Takeaway
In SDK 58, native tabs graduated from `expo-router/unstable-native-tabs` to stable `expo-router/native-tabs`. They give a real UITabBar with Liquid Glass on iOS 26+ and a Material bottom navigation bar on Android, but they cannot draw a custom tab bar or a raised center "+" FAB. For Everly's dock-with-FAB design, the realistic options are:
- keep JS/custom tabs, which now share the same "standard-navigation" integration in SDK 58; or
- adopt NativeTabs and move "+" into a floating overlay, `NativeTabs.BottomAccessory`, or a `prominent` tab (SDK 58 + Xcode 27).

### Cited Findings
- **Stable import path:** "expo-router/unstable-native-tabs is now expo-router/native-tabs." — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58). "Native tabs, toolbars, and the standard navigation integration are also stable." — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta). The docs say to use `expo-router/native-tabs` in SDK 58+ and `expo-router/unstable-native-tabs` in SDK 54–57. — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)
- **JS navigators:** JavaScript `Tabs`, `TopTabs` and `Drawer` now use the same `standard-navigation` integration as `NativeTabs`. The navigation core was reworked and some `expo-router/react-navigation` APIs moved or were removed. New custom navigators should use `createStandardRouterNavigator` or `integrateWithRouter` instead of `withLayoutContext`. — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta); [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58)
- **Native tabs are not a custom bar:** "Unlike the other tabs layout, native tabs use the native system tab bar". The docs point to Custom tabs "if your app requires a fully custom design that is not possible using system tabs." — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)
- **API (SDK 55+ shape):** `<NativeTabs.Trigger name>` with `NativeTabs.Trigger.Label`, `.Icon`, and `.Badge`.
  - Icon accepts `sf` (SF Symbols), `md` (Material Symbols), `src` (image), `xcasset` (SDK 55+), `drawable`, or `{default, selected}` objects. Distinct selected icons on Android require SDK 56+ (react-native-screens 4.25+).
  - `md` "only renders outlined Material Symbols". For filled/outlined pairs on Android use `src` with `@react-native-vector-icons/*` `getImageSourceSync`, which "requires a development build".
  - Tabs must be listed explicitly; they "are not automatically added to the tab bar."

  — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)
- **Liquid Glass tab bar:** Liquid Glass changes colors based on what is behind it, with "no callback". Use `DynamicColorIOS`/`PlatformColor` for `tintColor` and `labelStyle.color`. On iOS 26+, background props such as `backgroundColor`/`blurEffect` "affect only iOS 18 and earlier." — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)
- **SDK 58 additions:**
  - `prominent` keeps one tab on its own surface when the bar minimizes (Xcode 27; only one tab may be prominent).
  - `preferredPlacement="sidebar"` (iOS 27+).
  - The search tab activates its field on selection (`disableAutomaticSearchActivation` turns this off).

  Earlier additions:
  - `role="search"` (iOS 26+).
  - `minimizeBehavior="onScrollDown"`.
  - `NativeTabs.BottomAccessory` (SDK 55+): a floating view above the bar with `'regular'`/`'inline'` placement. Two instances render and do not share state.
  - `hidden` on `NativeTabs` (SDK 55+).
  - `disabled` (SDK 56+; programmatic navigation still works).
  - `tabBarRespectsIMEInsets` (SDK 56+, Android 11+).
  - `disablePopToTop`/`disableScrollToTop` (Android, SDK 55+).

  — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)
- **Known limitations:**
  - Android maximum of 5 tabs (Material).
  - "The tab bar height cannot be measured".
  - Native tabs can't be nested in native tabs; JS tabs can nest inside them.
  - FlatList does not support scroll-to-top/minimize-on-scroll, and edge detection can make the bar look transparent (`disableTransparentOnScrollEdge`).
  - Adding or removing tabs at runtime remounts and loses state.
  - All tab screens render eagerly.
  - Default and selected custom icons must share a rendering mode on iOS.
  - Web falls back to a basic implementation; use `expo-router/ui` headless tabs in `_layout.web.tsx`.

  — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)
- **Common problems:**
  - White flashes on iOS 26: wrap the layout in `ThemeProvider` from `expo-router` (SDK 56+).
  - Transparent bar on iOS ≤18: keep the `ScrollView` as the first child or set `collapsable={false}`.
  - Insets: Android wraps content in a `SafeAreaView` for the bottom inset and iOS auto-adjusts the first `ScrollView`. `disableAutomaticContentInsets` opts out.
  - Native tabs "are not a drop-in replacement for JavaScript tabs". Migration means `Trigger` instead of `Screen`, components instead of option objects, and a nested native `Stack` for headers.

  — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)

### Inferences
- A raised center "+" FAB inside the native bar is not achievable; no API for a custom center button was found. Options:
  - **(a)** Keep the current JS dock and wrap it in `GlassView`/`GlassContainer` on iOS 26+. This keeps full design control and the FAB. Lowest risk for Everly.
  - **(b)** NativeTabs plus an absolutely positioned FAB overlay. This is fragile, because the bar height "cannot be measured" and minimize behavior moves it.
  - **(c)** NativeTabs with "+" as a `BottomAccessory` or a `prominent` tab, or as a tab that opens a modal route (for example `add-reminder`). This changes the design language toward iOS 26/27 native.
- The Android 5-tab cap matters only if the dock has more than 5 destinations, counting "+" if it is a tab.
- Because all native tab screens render eagerly, heavy screens such as manifestation audio and ideas voice should defer work with `useIsFocused`.

### Gaps
- Expo Go support for NativeTabs is not stated on the docs page. NativeTabs depends on react-native-screens, which Expo Go bundles, so it likely works in Expo Go, but that is unverified.
- I found no detail on Android Material 3 Expressive styling of the native bar (label visibility modes, active indicator, ripple) in the fetched docs.

---

## Edge-to-edge on Android and safe-area handling

### Takeaway
Edge-to-edge has been the reality since SDK 54/RN 0.81. On Android 16 (targetSdk 36) it "cannot be disabled", and `edgeToEdgeEnabled` only affects Android 15 and below. Edge-to-edge is now built into React Native, so `react-native-edge-to-edge` is no longer an expo dependency. Every screen must apply insets itself through react-native-safe-area-context. RN 0.88 removed the `StatusBar` `translucent`/`backgroundColor` props, and old code that relied on them for layout will break.

### Cited Findings
- **Android 16:** once SDK 54/RN 0.81 target Android 16, edge-to-edge is enabled in all Android apps "and cannot be disabled". The `edgeToEdgeEnabled` app.json setting has no effect on Android 16 but still applies to Android 15 and below. — [Expo SDK 54 changelog](https://expo.dev/changelog/sdk-54); [Edge-to-edge blog](https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android)
- **Built into React Native:** "React-Native's enableEdgeToEdge build.gradle property is used to toggle this feature. Because of this, react-native-edge-to-edge is no longer a dependency of the expo package." Projects that still use that config plugin must install it directly. SDK 54 added `androidNavigationBar.enforceContrast` in app.json, replacing `enforceNavigationBarContrast`. — [Edge-to-edge blog](https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android); [SDK 54 upgrade guide](https://expo.dev/blog/expo-sdk-upgrade-guide)
- **Safe areas required:** with edge-to-edge you "will need to use safe areas to ensure that content does not overlap with system bars". Previously it was "common to have a translucent status bar and navigation bar". — [System bars docs](https://docs.expo.dev/develop/user-interface/system-bars/)
- **react-native-safe-area-context:**
  - It is a peer dependency of Expo Router, which provides the provider.
  - `SafeAreaView` is "a regular `<View>` with the safe area insets applied as extra padding or margin".
  - `useSafeAreaInsets()` returns `{top,right,bottom,left}`.
  - React Navigation handles safe areas by default.
  - On web, use CSS `env(safe-area-inset-*)`; "CSS values do not change the numbers returned by these hooks."
  - In SDK 58, Expo Router disables automatic safe-area measurements on web, and adding another `SafeAreaProvider` "can interrupt hydration and discard pending streamed content."

  — [Safe areas docs](https://docs.expo.dev/develop/user-interface/safe-areas/)
- **expo-status-bar:** `StatusBar` `style` (`auto` in the default template follows the color scheme), `hidden`, `setStatusBarStyle`, `setStatusBarHidden`. — [System bars docs](https://docs.expo.dev/develop/user-interface/system-bars/)
- **expo-navigation-bar (Android only, included in Expo Go):**
  - Component `NavigationBar` with `hidden`/`style`; methods `setHidden`/`setStyle`.
  - Deprecated: `useVisibility`, `getVisibilityAsync`, `setVisibilityAsync`, `addVisibilityListener`, and the static `setStyle`.
  - Config plugin: `enforceContrast` (default `true`), `hidden`, `style`.
  - `style` only takes effect when the device "navigation bar is using buttons" and requires `enforceContrast: false`, so it does nothing under gesture nav.
  - Android 15 emulator bug: "this function may have no effect".
  - Props of multiple mounted `NavigationBar`s are merged in mount order.

  — [expo-navigation-bar docs](https://docs.expo.dev/versions/latest/sdk/navigation-bar/)
- **RN 0.88 removals:** `StatusBar` props `backgroundColor`, `translucent` and `networkActivityIndicatorVisible` are removed. — [Upgrade guide](https://expo.dev/blog/how-to-upgrade-to-sdk-58)
- **Native tabs insets:** on Android, native tabs wrap content in a `SafeAreaView` for the bottom inset (opt out with `disableAutomaticContentInsets`). — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)

### Inferences
- **Headers under the status bar:** this comes from custom headers that don't apply `insets.top`. In SDK 58 it also appears on iOS 26+, because native headers are transparent glass with content extending beneath them. Use `contentInsetAdjustmentBehavior="automatic"` on ScrollViews, or pad by the header height and insets.
- **Bottom dock under the gesture bar:** this comes from a JS dock positioned `bottom: 0` without `insets.bottom`. Pad the dock with `Math.max(insets.bottom, N)` and pad scroll content by dock height + `insets.bottom`.
- Prefer `useSafeAreaInsets` over `SafeAreaView` for animated or absolutely positioned elements (dock, FAB, sheets). Use `SafeAreaView edges={['top']}` only for simple static screens. The `edges` prop exists in react-native-safe-area-context, but the Expo page does not document it.

### Gaps
- Not verified in the fetched docs: the exact react-native-safe-area-context version in SDK 58 and its `edges` per-edge `'additive'|'maximum'` mode semantics.
- Not verified: keyboard handling under edge-to-edge (`softwareKeyboardLayoutMode`, react-native-keyboard-controller recommendations).
- The edge-to-edge blog is dated Nov 2024 with an "SDK 54 update". I found no SDK 58-specific edge-to-edge changes in the SDK 58 posts.

---

## Blur and materials: expo-blur on Android

### Takeaway
`expo-blur` has been stable on Android since SDK 55, but real Android blur requires wrapping the background in `BlurTargetView` and passing its ref plus `blurMethod`. The default `'none'` only renders a semi-transparent view. Use `dimezisBlurViewSdk31Plus` to avoid the slow RenderScript path on Android ≤11.

### Cited Findings
- **Platforms:** Android, iOS, tvOS and Web; "Included in Expo Go". "In SDK 55 and later, `expo-blur` is stable on Android, but some code changes are required." — [Expo BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- **Android API:** wrap the content in `BlurTargetView` and pass `blurTarget={ref}` and `blurMethod` to `BlurView`. Multiple `BlurView`s can share one `BlurTargetView` if they fit inside its bounds, which "is more efficient." Without this, Android shows "a view with a semi-transparent background." — [BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- **Blur methods:**
  - `'none'` is the default (semi-transparent view).
  - `'dimezisBlurView'` uses the [Dimezis BlurView](https://github.com/Dimezis/BlurView) library; it "may lead to decreased performance on Android SDK 30 and below".
  - `'dimezisBlurViewSdk31Plus'` blurs on API 31+ and falls back to `'none'` below.
  - Efficient blur uses RenderNode (Android 12/API 31). Older versions fall back to RenderScript.
  - `blurReductionFactor` (default 4) tunes Android intensity to match iOS.

  — [BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- **Props:** `intensity` runs 1–100 (default 50) and "can be animated using `react-native-reanimated`". `tint` includes iOS system materials such as `systemUltraThinMaterial`…`systemChromeMaterialDark`, and "every tint adds a translucent color layer". — [BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- **Gotchas:** `borderRadius` is not applied unless you add `overflow: 'hidden'`. The blur doesn't update if `BlurView` renders before dynamic content such as `FlatList`, so render `BlurView` after it. — [BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/)

### Inferences
- For a blurred JS dock over scrolling content on Android, the screen's content (the scroll view) must sit inside a `BlurTargetView` and the dock must be a sibling rendered after it. With Expo Router, where each screen renders its own content, this means either a per-screen wrapper or the dock rendered inside each screen. A global dock in `_layout.tsx` cannot easily target screen content. This architecture constraint matters for Everly's `BottomDock`.
- Expect the Android blur to look different from iOS. Budget for tuning `blurReductionFactor` and tint per theme.

### Gaps
- I found no benchmark numbers for Android blur cost (fps/GPU), only qualitative statements.
- Not researched: Skia `BackdropBlur` as an alternative (see the last section).

---

## Motion: Reanimated 4 CSS animations/transitions, layout animations, shared elements, gesture handler, reduce motion

### Takeaway
Reanimated 4.7.x officially supports RN 0.86–0.88, pairs with react-native-worklets 0.13.x, and requires the New Architecture. CSS-style `animationName` keyframes work on iOS, Android and web. Shared element transitions are still experimental behind a feature flag and only work with the native stack, not tabs. `useReducedMotion()` is synchronous but reflects only the setting at app launch.

### Cited Findings
- **Compatibility:** "Reanimated 4 works only with the React Native New Architecture." 4.7.x supports RN 0.86, 0.87 and 0.88 and pairs with worklets 0.13.x. 4.8.x is the same RN range with worklets 0.14.x. 4.6.x does **not** support 0.88. — [Reanimated compatibility](https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility)
- **CSS animations (`animationName`):**
  - Keyframes are an object keyed by `'50%'`, `from`/`to`, or a 0–1 number.
  - You can pass an array of animations paired with `animationDuration` arrays; `none` disables.
  - "At minimum 1 keyframe is required." The current state is the implicit first keyframe, and later animations override earlier ones on the same property.
  - `react-native-svg` components can be animated.
  - Supported on Android, iOS and Web.

  — [Reanimated animationName docs](https://docs.swmansion.com/react-native-reanimated/docs/css-animations/animation-name)
- **Shared element transitions:**
  - "an experimental feature available behind a feature flag, not recommended for production use yet" (docs version 4.x).
  - "Only the native stack is supported". The tab navigator is not supported and "may result in no animation".
  - No web support.
  - iOS `transparentModal` is broken.
  - No custom animation functions (duration and spring only).
  - `backgroundColor` is unsupported in progress-based transitions.
  - iOS header-height vertical offset issues.
  - Enabling the flag changes the `zIndex` of views with exiting animations.

  — [Reanimated shared element transitions](https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview)
- **`useReducedMotion()`:** "lets you query the reduced motion system setting". It is synchronous, unlike the async `AccessibilityInfo.isReduceMotionEnabled()`. It returns whether reduce motion "was enabled when the app started", and a change made while the app runs does not re-render. Android/iOS/Web. — [Reanimated useReducedMotion](https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion)
- **Related:** `BlurView` `intensity` is animatable with Reanimated — [BlurView docs](https://docs.expo.dev/versions/latest/sdk/blur-view/). `GlassView` animatedProps work through `Animated.createAnimatedComponent` — [GlassEffect docs](https://docs.expo.dev/versions/latest/sdk/glass-effect/)
- **expo-router SDK 58:** `activityEnabled` on a navigator or screen hides inactive content while keeping state. — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)

### Inferences
- Everly's reanimated 4.7.1 is in the supported range for RN 0.88. Confirm that `react-native-worklets` is 0.13.x (run `npx expo install --check`).
- For live reduce-motion changes, combine `useReducedMotion()` (initial, sync) with an `AccessibilityInfo.addEventListener('reduceMotionChanged', …)` subscription. This is inferred from the docs' statement that the hook doesn't update.
- Don't build the core UX on shared element transitions, especially across tabs. Use them only, if at all, for stack pushes such as an idea card to its detail view.

### Gaps
- Not fetched or verified:
  - Reanimated's `ReduceMotion.System/Always/Never` per-animation config and how CSS animations and layout animations (entering/exiting/`LinearTransition`) respect it.
  - CSS transitions (`transitionProperty`, `transitionDuration`) details.
  - The react-native-gesture-handler version and API status for SDK 58 (v2 vs v3 hooks).
- I could not confirm the exact shared-element feature flag name; the docs link anchors `#enable_shared_element_transitions`.

---

## Expo UI (@expo/ui) SwiftUI and Jetpack Compose components, expo-symbols, Material Symbols

### Takeaway
`@expo/ui` has three entry points: universal (`@expo/ui`) for Android/iOS/web, `@expo/ui/swift-ui` for iOS, and `@expo/ui/jetpack-compose` for Android. Every component must sit inside a `<Host>`. It provides native BottomSheet, Picker, DateTimePicker, Slider, Switch, ContextMenu (SwiftUI) and Material 3 colors including dynamic color, and the docs page is marked "Included in Expo Go". `expo-symbols` renders SF Symbols on iOS and Material Symbols on Android/web with one per-platform `name` object.

### Cited Findings
- **Entry points:** universal `@expo/ui` ("Cross-platform components that run on Android, iOS, and web from a single source"), `@expo/ui/swift-ui` (iOS only; "renders SwiftUI views, which exist only on Apple platforms"), and `@expo/ui/jetpack-compose` (Android only). — [Expo UI docs](https://docs.expo.dev/versions/latest/sdk/ui/)
- **Host:** "You must wrap every Expo UI component in one". Flexbox styles apply to `Host`, but inside it "Yoga is not available": use Row/Column (Compose) or HStack/VStack (SwiftUI). RN views inside SwiftUI have their layout controlled by SwiftUI, and you must re-add a `Host` to return to Expo UI. — [Expo UI docs](https://docs.expo.dev/versions/latest/sdk/ui/); [SwiftUI Host](https://docs.expo.dev/versions/latest/sdk/ui/swift-ui/host/)
- **Components:**
  - **BottomSheet:** SwiftUI, Compose `ModalBottomSheet`, and universal. Described as a drop-in replacement for `@gorhom/bottom-sheet`.
  - **Picker:** universal "menu and wheel appearances"; drop-in for `@react-native-picker/picker`.
  - **DateTimePicker:** drop-in for `@react-native-community/datetimepicker`.
  - **Button/Switch/Slider:** universal plus native versions. Compose buttons are "native Material3 buttons".
  - **ContextMenu:** SwiftUI only.
  - **Material Colors:** "Read the Material 3 color palette (including Material 3 Dynamic Colors) from JavaScript."

  — [Expo UI docs](https://docs.expo.dev/versions/latest/sdk/ui/)
- **SDK 58 additions:**
  - **Compose:** `Image`, `DateRangePicker`, `DateRangePickerDialog`, `VerticalSlider`; `DropdownMenu` gains `cornerRadius`/`shadowElevation`.
  - **Universal BottomSheet:** gains `contentPadding`/`containerColor`/`contentColor`. On web, BottomSheet replaces `vaul` with an HTML `<dialog>`.
  - **ListItem:** `colors` prop.
  - **Hosted views:** views in `<RNHostView>` are measured where SwiftUI/Compose placed them, and "Tapping outside a hosted text field now dismisses the keyboard."
  - **Breaking:** on Android the `style` prop on `RNHostView` is removed; use `modifiers`.

  — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- **expo-symbols basics:** "On Android and web, it uses Material Symbols". Platforms are Android/iOS/tvOS/Web; "Included in Expo Go". — [expo-symbols docs](https://docs.expo.dev/versions/latest/sdk/symbols/)
- **expo-symbols `SymbolView` props:**
  - `name={{ ios: 'info.circle', android: 'info', web: 'info' }}`. A plain string "is treated as an SF Symbol name and renders only on iOS".
  - iOS-only: `type` (`monochrome`/`hierarchical`/`palette`/`multicolor`), `colors`, `animationSpec` (`bounce`/`pulse`/`scale`, repeat, variable), `scale`, `resizeMode`.
  - `weight`: an iOS string, or Android/web weight objects from `expo-symbols/androidWeights/*`. Weight names differ between platforms.
  - `fallback` node.
  - `unstable_getMaterialSymbolSourceAsync(symbol, size, color)` (Android) returns an image source for tab icons and similar uses.

  — [expo-symbols docs](https://docs.expo.dev/versions/latest/sdk/symbols/)
- **NativeTabs icons:** `md` uses Material Symbols, outlined only. — [Native tabs docs](https://docs.expo.dev/router/advanced/native-tabs/)

### Inferences
- `@expo/ui` BottomSheet and DateTimePicker are good fits for Everly's add-reminder flow: native sheets and pickers with less JS, and they are drop-ins for libraries Everly may already use.
- Keep Host boundaries coarse: one Host per native control cluster. Yoga does not work inside a Host, so don't build whole screens from Expo UI.
- Use `expo-symbols` with per-platform names for dock and FAB icons to match iOS 26/27 and Material styling. Provide a `fallback` for web.

### Gaps
- The Expo UI docs page does not state a stability label (alpha/beta/stable) or a minimum iOS version for `@expo/ui` on SDK 58. The page frontmatter lists platforms without "web", but universal components are described as web-capable; the docs are inconsistent here.
- Not verified: Material 3 **Expressive** components or theming in `@expo/ui/jetpack-compose`. No mention was found.
- Whether every SwiftUI/Compose component works in Expo Go was not stated per component; the page as a whole is marked "Included in Expo Go".

---

## Fonts (variable fonts), gradients/mesh gradients, haptics patterns, Android dynamic color

### Takeaway
SDK 58 adds real variable-font support in `expo-font` on Android/iOS/web, and RN 0.88 adds `fontVariationSettings` on `Text`. Android Material You dynamic colors are reachable from JS through Expo Router's typed `Color.android.dynamic.*`, which wraps `PlatformColor`, and through `@expo/ui` Material Colors. I did not verify gradients, Skia mesh gradients or haptics patterns in this pass.

### Cited Findings
- **Variable fonts:** `expo-font` has variable font support on Android, iOS and web, so "a single font file can provide a family with several weights or styles". It works with `useFonts`, `loadAsync` and the config plugin. RN 0.88 adds a `fontVariationSettings` prop on `Text`. — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- **expo-image:** new `svgVariables` prop for CSS custom properties in SVGs, and `transition.skipOnCacheHit`. — [SDK 58 beta](https://expo.dev/changelog/sdk-58-beta)
- **Expo Router `Color`:** `import { Color } from 'expo-router'`, Android and iOS.
  - `Color.ios.*` is a typed wrapper over `PlatformColor` (`label`, `systemBackground`, `systemBlue`…).
  - `Color.android.*` covers system colors (for example `system_accent1_500`), attributes (`attr.colorPrimary`), M3 static (`material.primary`, `surfaceContainer`, `outline`…) and M3 dynamic (`dynamic.primary`…), which "adapts based on the user's wallpaper and theme settings".
  - Gotcha: use these inside a component that responds to theme changes, such as one that calls `useColorScheme`, "especially important when using React Compiler, which can memoize components".
  - Typos aren't caught: "TypeScript does not reject misspelled or unsupported color names."

  — [Expo Router Color (v58)](https://docs.expo.dev/versions/v58.0.0/sdk/router/color/)
- **@expo/ui Material Colors:** reads the M3 palette including dynamic colors from JS. — [Expo UI docs](https://docs.expo.dev/versions/latest/sdk/ui/). The search results also surfaced an `isDynamicColorAvailable` check in Expo UI for Android 12+ devices — [Expo UI Jetpack Compose colors (v58)](https://docs.expo.dev/versions/v58.0.0/sdk/ui/jetpack-compose/colors.md). This is from a search summary only and was not fetched directly.
- **Android dynamic color baseline:** per AOSP docs, dynamic color is an Android 12+ platform feature. — [AOSP dynamic color](https://source.android.com/docs/core/display/dynamic-color)
- **RN `PlatformColor` fallback:** `PlatformColor(name, ...fallbacks)` tries each name in turn. — [RN colors docs](https://reactnative.dev/docs/0.86/colors)

### Inferences
- **Dynamic color as an opt-in theme:** Everly could add a "System" (Material You) accent on Android 12+ by mapping theme tokens to `Color.android.dynamic.primary`/`surfaceContainer` and similar, falling back to the brand palette elsewhere. Theme tokens computed outside components, or memoized by React Compiler, may not update.
- A variable font such as Inter or Roboto Flex can replace multiple static weight files in the existing theme system and enables animated weight via `fontVariationSettings`. Whether `fontVariationSettings` can be animated with Reanimated is unverified.

### Gaps
- Not researched in this pass (not verified for SDK 58):
  - **`expo-linear-gradient`:** API, Expo Go support. It is widely used and expected to be in Expo Go, but I did not verify this.
  - **`@shopify/react-native-skia`:** version for RN 0.88/SDK 58, mesh gradients, `BackdropBlur`, Expo Go inclusion, web support (CanvasKit/WASM size).
  - **`expo-haptics`:** SDK 58 API (`impactAsync`, `notificationAsync`, `selectionAsync`, Android `performAndroidHapticsAsync`) and recommended patterns.
  - **react-native-gesture-handler:** version and v3 API status.
- The exact minimum Android API for `Color.android.dynamic.*` is not stated on the Expo page; Android 12+ is inferred from the platform docs.
