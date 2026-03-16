# Lessons Learned

## 2026-03-16: Don't remove hardware-dependent logic without explicit permission
- **Mistake**: Removed `getHardwareCapabilities()` from High mode preset, forcing AV1 unconditionally regardless of GPU support.
- **Rule**: Never remove hardware/capability detection logic. If a preset depends on HW capabilities, that check exists for a reason — it prevents forcing codecs the GPU can't decode.
- **Pattern**: When cleaning up "unused" code, verify it's truly unused and not serving a safety/compatibility purpose.

## 2026-03-16: Don't bundle independent features into a single toggle
- **Mistake**: Eco UI toggle was hiding comments, chat, and Shorts all at once — user wanted granular control.
- **Rule**: Features that affect different content areas (comments vs Shorts vs animations) should always be separate toggles. Users expect to control what they hide independently.
## 2026-03-16: Rebranding and Affinity Aesthetic
- **Lesson**: High-contrast B/W combined with vibrant emerald/purple accents and bold serif typography (DM Serif Display) instantly elevates a "lite" tool to a "bettr" premium experience.
- **Rule**: When doing a major redesign, prioritize typography and spatial grouping (accordions) to manage complexity without overwhelming the user.
- **Pattern**: Use "Segmented Pill Controls" instead of dropdowns for 2-3 options; they are more discoverable and feel more modern.

## 2026-03-16: Logical Grouping vs. Technical Grouping
- **Mistake**: Left "Capas Básicas" (technical optimization) separate from "Capas Estáticas" (UI improvement).
- **Rule**: Group features by the *user's* intent (e.g., "all thumbnail options") rather than the *developer's* technical implementation (e.g., "video tweaks" vs "css tweaks").
- **Pattern**: Periodic UI audits should check if logically related toggles have drifted apart.

## 2026-03-16: Windows File Locking during Rename
- **Lesson**: Local folder renaming often fails via terminal if the specific folder is open in VS Code or another shell.
- **Rule**: Always warn the user before a rename operation that they might need to close their editor for it to succeed.
- **Pattern**: Perform all sub-file renames first, and leave the parent directory rename as the final manual or advisory step.
