# 7. Compliance: LFPDPPP and institutional policies

> This chapter is technical guidance to prepare the institution's legal review. It does not replace the opinion of the university's legal department or data-protection officer.

## 7.1 The applicable framework in Mexico

The **Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)** was published in the Diario Oficial de la Federación on 20 March 2025 and entered into force on 21 March 2025. It replaces the 2010 law. The regulator for the private sector is no longer INAI, which was dissolved, but the **Secretaría Anticorrupción y Buen Gobierno**.

Three points of the new law that touch FARO directly:

1. **Definition of personal data.** Any information about an identified *or identifiable* person, "when their identity can be determined directly or indirectly through any information". A numeric Canvas id is therefore personal data even without a name: it is indirectly identifiable by the institution.
2. **Privacy notice.** It must identify sensitive data and distinguish the purposes that require express consent. When data is collected electronically, a simplified notice must be offered that refers to the full one.
3. **Consent.** It may be express or tacit; it is tacit when, the privacy notice having been made available, the data subject does not object. Sensitive data still requires express consent.

**Note on the regulated party.** A private university such as Tecmilenio is a private party and the LFPDPPP applies. A public university is governed by the Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados. Both share the principles; this chapter's analysis holds for both, but the instrument and the authority change. **The institution must confirm which applies.**

## 7.2 The principles, one by one

| Principle | What it requires | How FARO meets it | Mark |
|---|---|---|---|
| **Lawfulness** | Process data according to law and without deception | FARO only reads what the student can already see about themselves in Canvas; the request log is visible on screen | [code] |
| **Consent** | Have the data subject's will | Pilot: express, informed consent from each participant (template in 7.4). Production: privacy notice embedded in the LTI launch | Policy / [pending] |
| **Information** | An accessible privacy notice | The *Profile → Canvas* screen and the Mentor footer show what is queried and what is sent; the formal notice is to be drafted with the institution | [code] / [pending] |
| **Quality** | Accurate, up-to-date data | Canvas is the source of truth; FARO does not copy the record, it reads it on each open | [code] |
| **Purpose** | Use data only for the stated purpose | Every Canvas path has a purpose written next to it (`server/src/allowlist.ts`, `purpose` field); there is no secondary use | [code] |
| **Loyalty** | No data obtained by deceptive means | No tracking beyond the 6 paths; no *dark patterns* to obtain the profile (everything is optional) | [code] |
| **Proportionality** | Only the data that is necessary | Chapter 5: view counts discarded, name and avatar from `users/self` discarded, mentor with 11 fields | [code] |
| **Accountability** | Ensure compliance and be able to demonstrate it | This book; the 20 automated tests; the checklist in chapter 9 | [test] |

## 7.3 Sensitive data

FARO **does not process sensitive data** as the law defines it (ethnic origin, health, beliefs, political opinions, sexual preference, genetic data). Two nuances the institution should consider:

- The *"life happened"* state (less time, overwhelmed, need a break) is self-declared, used only to choose an intervention, **never persisted and never leaves the browser**. It is not health data, but the privacy notice should mention it to leave no doubt.
- The **destination sentence** is free text. If a student wrote sensitive data there, FARO would store it locally and include it in the mentor context. Mitigation: an on-screen warning **[pending]** and a policy of not storing conversations.

## 7.4 Consent for the pilot

For a pilot with five to thirty students, written express consent is recommended. Minimum elements it must contain:

1. Who the controller is (the institution) and who the processor is (the FARO team).
2. What data is read from Canvas (the six paths, in plain language).
3. What data FARO creates (purpose, sessions, preferences, optional profile).
4. That FARO modifies nothing in Canvas.
5. That the AI mentor, once enabled, will receive a context with no name or email.
6. How long data is kept and how to request deletion (*Progress → Reset*, and token revocation).
7. That participation is voluntary and withdrawing does not affect grades.
8. How to exercise ARCO rights before the institution.

## 7.5 ARCO rights

| Right | How it is exercised in FARO today | In production |
|---|---|---|
| **Access** | *Profile* shows everything FARO stores about the student; *Profile → Canvas* shows everything it reads | Export from the backend |
| **Rectification** | Academic data is corrected in Canvas (source of truth); FARO data, in Profile | Same |
| **Cancellation** | *Progress → Reset* wipes local state; uninstalling the extension removes everything | Database deletion on request |
| **Opposition** | Do not install the extension; withdraw pilot consent | Disable the LTI tool for that student |

## 7.6 Transfers

- **To Canvas (Instructure):** FARO transfers nothing to Canvas; it only reads. The institution's relationship with Instructure is already covered by its existing contract.
- **To the AI model provider [pending]:** this will be a transfer of the 11 context fields plus the student's message. It must appear in the privacy notice, and the contract with the provider must forbid using that data for training. Until then, the mentor is local and there is no transfer.
- **Between the student's devices [pending]:** once the backend with a database exists, FARO's state will sync through it. That is processing by the processor, not a transfer to a third party.

## 7.7 Institutional Canvas policies

Regardless of the law, the institution controls in Canvas:

- Whether students can generate access tokens and with what expiry.
- Which scopes it grants to FARO's developer key (recommendation: exactly those in `requiredScopes`).
- Whether the LTI tool is installed at account, sub-account or course level.
- Whether students can view their own analytics (this determines whether FARO uses the activity endpoint or the submission-based fallback).

None of these decisions requires changes in FARO; the backend respects what Canvas allows and reports what it does not.
