# Accessibility verification

Expenses Tracker supports keyboard focus indicators, semantic labels, live status/error regions, a skip link, minimum 44-point native controls, Dynamic Type, VoiceOver labels on icon-only controls, Reduce Motion, increased contrast/forced colors, and hidden-amount privacy controls.

Before each App Store release, test the complete critical journey with:

- VoiceOver on the smallest and largest supported iPhone layouts
- Dynamic Type at the largest accessibility size
- Reduce Motion and Increase Contrast
- Switch Control or Full Keyboard Access
- Web keyboard-only navigation at 200% zoom
- Web screen reader announcements for errors, saves, imports, deletion, and MFA recovery codes
- English and Kiswahili, including validation and destructive confirmations

Record device, OS/browser, assistive technology, failed step, fix, and retest result. Do not mark a locale supported if critical controls or errors fall back to untranslated text.
