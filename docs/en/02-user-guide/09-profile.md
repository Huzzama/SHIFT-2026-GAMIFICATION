# 9. Profile

## How to get there

Two ways, both valid:

1. **From Community** — tap your avatar or your name on the presence card, above the feed. It opens your public profile: what others see of you.
2. **From the bottom menu** — the Profile tab, next to Impact.

## What is inside

| Section | What it holds | Who sees it |
|---|---|---|
| **Name** | The name you choose to show. Empty until you set it. | Other students in the course. |
| **Photo** | A small square image, downsized in your own browser before being saved. The original is never uploaded. | Other students in the course. |
| **Bio** | One line, optional. | Other students in the course. |
| **Language** | Spanish or English. Changes the whole interface and also the language the Mentor answers in. | Only you. |
| **Mentor style** | Direct, encouraging, detailed, friendly or challenge me. | Only you. |
| **Your destination** | The purpose you declared at the start, editable. | Only you. |
| **Available time** | The minutes per day you said you have. Change it when your life changes: it recalculates the whole route. | Only you. |
| **Institutional account** | State of the link with Tecmilenio. **Labelled as simulated** in the prototype: there is no real SSO yet. | Only you. |
| **Canvas** | Technical panel: active mode (*Simulated* or *Live*), identified course, endpoints queried, refused scopes and a live request log. In *Live* mode it also says which backend the calls go through and whether activity is being derived from your submissions. | Only you. |

## Profile rules

- **Nothing from the profile travels to the Mentor.** Not the name, not the photo, not the bio. The context the Mentor receives is built elsewhere and does not read this file.
- **Everything is stored locally** in the prototype. In production, the FARO backend is the source of truth so it can sync across devices.
- **Nothing is mandatory.** You can use the whole of FARO without a name or photo. You will appear with your initials.
- **Classmates never have a photo** in the prototype: only initials and a colour. Only your own avatar can carry an image.
- **There is no follower count, no level, no ranking.** The avatar colour is decoration, not status.
