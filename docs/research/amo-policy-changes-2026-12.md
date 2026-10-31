# Research: the AMO policy changes effective 2026-12-01

_Date: 2026-10-31. Context: issue [#11](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues/11),
charted on the map in issue [#1](https://github.com/SuperKXT/lichess-to-chesscom-extension/issues/1)._
_Claims labelled **CONFIRMED** (primary source), **INFERRED**, or **UNKNOWN**._

## Question

The previous research pass found that new AMO add-on policies, new enterprise policies and a
new Firefox Add-on Distribution Agreement take effect **2026-12-01** (previews dated
2026-10-20), but did not diff them. What actually changes, and does any of it invalidate a
decision already recorded on the map?

## The answer in one line

**The whole change is the introduction of an enterprise add-on channel.** For a free,
listed, open-source extension nothing substantive changes — the only action item is
**accepting the updated Distribution Agreement when AMO prompts for it**. CONFIRMED.

## 0. Method — this is a literal diff, not a reading

The policy pages are Markdown in a public Mozilla repo, and the previews were added as
*new files alongside the current ones* by a single merged PR. So the diff is exact rather
than impressionistic.

- PR [mozilla/extension-workshop#2488](https://github.com/mozilla/extension-workshop/pull/2488),
  "Preview Distribution Agreement and Policies Update Dec 1, 2026", merged **2026-10-26**,
  +928/-5 over 6 files. CONFIRMED.
- Files added: `add-on-policies-preview-2026-12.md` (376 lines),
  `add-on-policies-for-enterprise-preview-2026-12.md` (133 lines),
  `firefox-add-on-distribution-agreement-preview-2026-12.md` (289 lines). Files modified:
  `add-on-policies.md` (+8/-2), `firefox-add-on-distribution-agreement.md` (+8/-3) — both
  modifications are **only** the "a preview exists" note block. CONFIRMED.
- Everything below is `diff -u` of the current file against its preview, taken from
  `raw.githubusercontent.com/mozilla/extension-workshop/master/...`. CONFIRMED.

**Consequence worth stating plainly**: the current policies file and its preview are both
**376 lines**, and the diff is confined to the title/permalink front matter, the note block,
the scoping sentences, and a re-ordering of section 2. Every other byte — including all of
§3 Submission Guidelines, §4 Development Practices and §6 Data Collection — is
**identical**. CONFIRMED.

## 1. Add-on Policies: the entire substantive diff

| What | Current | Preview (2026-12-01) |
| --- | --- | --- |
| Scope sentence | "**All add-ons** are subject to these policies, regardless of how they are distributed." | "**All Listed and Self-distributed Add-ons** are subject to these policies." + a pointer to the separate enterprise policies. |
| §2 Content, Acceptable Use Policy | Listed as an **AMO-listing-only** item ("add-ons listed on addons.mozilla.org must adhere to…" #1) | Promoted to a **top-level** item #1, applying to listed *and* self-distributed |
| §2 Content, conformance to US law | AMO-listing-only item #3 | Promoted to top-level item #2 |
| §2 Content, Mozilla trademarks / "`<Add-on name>` for Firefox" | Unnumbered lead paragraph | Numbered item #3 — **text unchanged** |
| §2 remaining items (payment disclosure, fork naming, no promo-only add-ons, theme quality) | items 2, 4, 5, 6 | renumbered 1, 2, 3, 4 — **text unchanged** |

CONFIRMED — that table is the complete diff of the policies document. There are no other
changed lines.

So the only real-world tightening is that the **Acceptable Use Policy and US-law
conformance now bind self-distributed add-ons explicitly**, where previously they were
written as listing conditions. We are shipping **listed**, so both already bound us.
CONFIRMED that the clauses are unchanged in text; INFERRED (trivially) that this is a
no-op for a listed add-on.

### 1.1. Source-code submission — no change at all

- Policy §3.1 "Source Code Submission" is **byte-identical** between current and preview.
  It still says reviewers need "a copy of the source code before any of these steps have
  been applied", requires "instructions on how to reproduce the build", requires
  dependencies be vendored or fetched "only through the respective official package
  managers", rejects unmaintained build tools, and bans obfuscation while permitting
  minification. CONFIRMED.
- The **Source code submission** page
  (<https://extensionworkshop.com/documentation/publish/source-code-submission/>) was
  **not touched by PR #2488** and is not among its 6 files. Its last two content commits
  are 2026-03-16 ("Update Node and npm versions in submission guidelines") and 2026-03-09
  ("Update default reviewer build environment version") — i.e. seven months before the
  policy update, unrelated to it. CONFIRMED (git history via the GitHub API).
- Therefore all three specifics the ticket asked about **survive unchanged**:
  - **"There must be no differences."** Still the literal standard: "the reviewer runs the
    instructions you provided and then uses a diff tool to compare the generated sources to
    those in the extension. There must be no differences." CONFIRMED.
  - **Pinned default reviewer environment**: Ubuntu 24.04.4 LTS (Desktop edition), ARM64,
    10 GB RAM / 6 vCPU cores, **Node 24.14.0 and npm 11.9.0**, 35 GB free disk. Still
    present, still with the obligation to declare in the README if your environment
    differs. CONFIRMED.
  - **Per-version submission**: "matching source code must be attached to **every**
    extension version". Max source file size 200 MB. Still present. CONFIRMED.
- Lockfile requirement (`package-lock.json`) and the "build tools must be open source and
  not web-based" rules are also unchanged. CONFIRMED.

### 1.2. Data collection — no change at all

- Policy **§6 "Data Collection and Transmission Disclosure and Control"**, including
  §6.1 prohibited collection, §6.2 consent, §6.2.1 (Firefox 140+ with the built-in consent
  experience), §6.2.2 (Firefox 139 and earlier), the enterprise-policy consent bypass and
  the implicit-consent carve-out, is **byte-identical** between current and preview.
  CONFIRMED.
- §6.2.1 still reads: the add-on "must accurately state the data collection practices in
  the extension manifest, **including when it does not collect data**, in line with the
  Firefox add-on data classification taxonomy". The manifest key is **not** renamed or
  re-scoped. CONFIRMED.
- `browser_specific_settings.gecko.data_collection_permissions` with
  **`"required": ["none"]`** remains the documented way to declare that nothing is
  collected: "If your extension doesn't collect or transmit any data, you indicate that by
  specifying the `none` required permission in the manifest." The taxonomy page's only
  2026-10-20 commit is "Screenshot updates to Nova" — screenshots, not rules. CONFIRMED —
  <https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/>.
- Bonus detail that matters for our zero-telemetry posture: on **update**, Firefox does not
  notify the user about the `none` data type, "because when the extension doesn't collect
  any data, that doesn't need to be notified to the user". CONFIRMED (same page).

### 1.3. Remote code, CSP, host permissions — no change at all

Policy §4 Development Practices is unchanged. Still in force verbatim: "Add-ons must be
self-contained and not load remote code for execution" and "Add-ons must not relax web page
security headers, such as the Content Security Policy". §1 "No Surprises" and §1.1
"Unexpected features" are likewise unchanged. CONFIRMED.

### 1.4. Add-on naming — no change, and it was never about third-party trademarks

- The **only** naming rules anywhere in the current or preview policies are: (a) comply with
  the **Mozilla** Trademark Guidelines and use "`<Add-on name>` for Firefox" if the name
  contains "Firefox"; (b) a **fork**'s name must clearly distinguish it from the original.
  Neither is touched by the update beyond renumbering. CONFIRMED.
- AMO policy says **nothing** about third-party trademarks in an add-on name. The relevant
  obligation lives in the Distribution Agreement §5(c) "Intellectual Property Rights" —
  you warrant you hold the rights needed to distribute — and in §1 "No Surprises", which
  requires the name to reflect what the add-on does. **§5(c) is unchanged by the update**
  (it is not in the agreement diff). CONFIRMED.
- Also unchanged: the agreement's §5(a) requirement that an add-on "will not imply in any
  way that it is produced, sponsored or endorsed by **Mozilla**". That clause is about
  Mozilla only; the non-affiliation disclaimer we already planned for Lichess and
  Chess.com is a self-imposed measure, not an AMO requirement. CONFIRMED (text), INFERRED
  (that it is therefore self-imposed).
- Consequence: nothing in the 2026-12-01 change creates a new naming hazard for
  "Lichess to Chess.com Review". The pre-existing risk — a third-party trademark complaint
  routed through the agreement's Take-Down Request machinery — is exactly as it was
  yesterday. CONFIRMED for the policy text; the likelihood of such a complaint is UNKNOWN
  and unknowable from primary sources.

## 2. Firefox Add-on Distribution Agreement: the diff

Effective date changes from **December 1, 2021** to **December 1, 2026**. CONFIRMED.

Substantive changes, all of them consequences of the enterprise channel:

1. **New definition** in §3: "'Enterprise Add-on' means an Add-on that self-declares its
   enterprise status via the specific manifest key
   `browser_specific_settings: { gecko: { admin_install_only: true } }`." CONFIRMED.
2. **§4(a)** gains a third distribution option: "_Enterprise Add-ons_: Add-ons that are
   distributed via enterprise policies only." CONFIRMED.
3. **§4(b)** now says links are provided for "Signed Self-distributed **and Enterprise**
   Add-ons". CONFIRMED.
4. **§4(c)** is retitled from "Review Process" to "Policies and Review" (and §4's heading
   from "Distribution, certificates, & review process" to "Distribution, certificates, &
   Policies and Review"). Instead of pointing at one "Review Policies" document it now
   points at **two**: the policies for Listed and Self-distributed Add-ons, and the policies
   for Enterprise Add-ons. CONFIRMED.
5. **§5(b)** adds five words: disclosure of permissions and end-user data is now required
   "**as required by the applicable Add-on policies**" — i.e. the flat obligation becomes a
   pointer to whichever policy set applies. CONFIRMED. For a listed add-on the applicable
   set is the one we already read, so this is a no-op. INFERRED.
6. **§7(b)** generalises "any Listed or Self-distributed Add-ons" to "any Add-ons" in the
   removal/revocation clause, and replaces the two hardcoded links to "Review Policies" with
   "the applicable Add-on Policies". No new ground for removal is added. CONFIRMED.
7. **§11(b)** "Entire Agreement" now incorporates "Add-on Policies" by reference rather
   than the single hyperlinked "Review Policies". CONFIRMED.
8. Two cosmetic fixes: an anchor id `release-idemnification` → `release-indemnification`,
   and the §4 anchor id. CONFIRMED.

**Nothing else changed.** Specifically unchanged: §5(c) IP rights, §8–§10
(disclaimers, limitation of liability, indemnification), §11(c) termination,
take-down handling, and every clause about fees or revenue. There is **no new obligation
of any kind specific to free, open-source or MIT-licensed add-ons** — the agreement does
not mention licensing terms at all. CONFIRMED.

### 2.1. The one thing we must actually do

Mozilla's announcement is explicit, in a Q&A aimed exactly at our situation:

> "I'm an individual developer with a public add-on on AMO. Does this affect me? Your
> submission process doesn't change, but you will need to accept the updated developer
> agreement."

and

> "Do I really need to accept the updated agreement? Yes. Every developer on AMO,
> enterprise or not, needs to accept it, because the new policies are part of it."

CONFIRMED —
<https://blog.mozilla.org/addons/2026/10/28/introducing-enterprise-add-on-policies/>
(published 2026-10-28, author cbacharakis).

The same post states "If you build public add-ons: Nothing changes in how you submit or how
your add-on is reviewed," and "Until December 1, the current policies remain in effect."
CONFIRMED.

**INFERRED**: the acceptance is an interstitial on the AMO developer hub shown at next
submission or next sign-in on/after 2026-12-01. The announcement says "when prompted" and
does not describe the mechanism; a prompt blocking a first submission is plausible but
**UNKNOWN**. Practical mitigation: if we sign in to AMO before our first upload, we will
hit it then rather than mid-release.

## 3. Enterprise policies: confirmed irrelevant to us

The enterprise document is a **new, much shorter parallel policy set** (133 lines vs 376),
not an amendment to ours. Confirmed contents:

- **§1.1** An enterprise add-on is one that *self-declares* via
  `browser_specific_settings.gecko.admin_install_only: true`. **§2** such add-ons "can only
  be installed through enterprise policies" and never appear on AMO. CONFIRMED.
- **§3 Content** is identical to the three top-level Content items in the new listed
  policies. **§4** requires submission through the enterprise channel and makes **source
  code submission optional** unless Mozilla requests it, with a 14-day deadline on request
  and blocking of non-reviewable versions on failure. **§5** covers blocking. CONFIRMED.
- There is **no** §6 data-collection section and **no** §4-equivalent development-practices
  section in the enterprise document. CONFIRMED (the whole document is §1–§5 as listed).

Because the channel is **opt-in via a manifest key we do not and will not set**, none of
this applies. We never declare `admin_install_only`, so our versions remain governed by the
Listed/Self-distributed policies. CONFIRMED (the declaration is the sole trigger, per §1.1
and the agreement's definition).

Worth noting for completeness: the enterprise channel is **not** a shortcut we could abuse
to skip source-code submission, because an enterprise version "won't appear on AMO or be
distributed by Mozilla in any other way" — it would make the extension undiscoverable,
which contradicts the map's destination. CONFIRMED (the distribution restriction),
INFERRED (that this rules it out for us).

## Impact on the map

**No map decision is invalidated. Not one.** Taking each affected-looking decision in turn:

| Map decision | Affected? |
| --- | --- |
| **Stack: WXT, with `wxt zip -b firefox` emitting the AMO sources zip**; sources reproducible against Ubuntu 24.04 ARM64 / Node 24.14, lockfile committed | **No.** The source-code rules and the pinned reviewer environment are unchanged, and the Source code submission page was not part of the policy update. |
| **`gecko.data_collection_permissions.required: ["none"]`** in the manifest | **No.** Policy §6 is byte-identical and the taxonomy still documents `["none"]` as the way to declare no collection. |
| **Zero-config / zero-telemetry posture** (no `storage`, no options page, no analytics) | **No.** It is what §6 asks for, and §6 did not change. |
| **Permissions exactly `activeTab`, `contextMenus`, `https://lichess.org/*`** | **No.** §4 Development Practices — least privilege, self-contained, no CSP relaxation — is unchanged. |
| **No remote code; strict MV3 CSP** | **No.** The "self-contained and not load remote code" and "must not relax… Content Security Policy" clauses are unchanged. |
| **Name "Lichess to Chess.com Review"** + "Not affiliated with Lichess or Chess.com" as the first line of the store description | **No.** AMO naming policy covers only Mozilla trademarks and fork disambiguation; neither changed. The third-party-trademark exposure sits in the agreement's unchanged §5(c), and the disclaimer remains a prudent self-imposed measure rather than a policy requirement. |
| **Write-only posture / no Chess.com reading** | **No.** Driven by Chess.com's User Agreement and `robots.txt`, which AMO policy does not touch. |
| **CI publishing via `web-ext sign --channel listed --upload-source-code`** | **No.** Per-version source attachment is unchanged, so the CI shape stands. |

**One new to-do, not a decision change**: before the first AMO submission, sign in to the
AMO developer hub and accept the updated Firefox Add-on Distribution Agreement. Worth doing
deliberately rather than discovering it during a release.

**One doc edit owed elsewhere**: `docs/research/cross-browser-extension-stack.md` lists
"Substance of the AMO policy changes effective 2026-12-01 — previews live, not diffed"
under **Not confirmed**. That line is now answered by this document and should be struck
when the two research branches are reconciled. (Not edited here — this branch is scoped to
the policy diff.)

## Not confirmed

- **The exact mechanism and timing of the agreement re-acceptance prompt.** The
  announcement says developers "will need to accept the updated developer agreement" and
  "when prompted"; whether it blocks sign-in, blocks submission, or is merely shown is
  **UNKNOWN**. No primary source describes it. (Mozilla's own tracking issue
  `mozilla/addons#16529`, "Update devhub agreement page to include policies for enterprise
  add-ons", surfaced in search and suggests the devhub page is still being updated, but its
  contents were **not read** for this document.)
- **Whether the previews are final.** They are labelled previews of text "becoming
  effective Dec 1, 2026" and the blog says "The full policy text will be published on
  Extension Workshop". Mozilla could still edit before 2026-12-01; a re-diff on or shortly
  after 2026-12-01 is cheap insurance. **INFERRED** that they are substantially final,
  given the merged PR and the dated announcement.
- **Any policy change not routed through the extension-workshop repo.** This analysis is
  complete with respect to the three documents in PR #2488 plus the source-code-submission
  and data-consent pages. If Mozilla changed reviewer practice, the
  `addons-server` validator, or `about:addons` behaviour without a docs commit, that is
  **not** covered here. The October 2026 add-ons blog carries only two posts — the
  enterprise announcement and a developer spotlight — so there is no second announcement to
  chase. CONFIRMED for the blog's October archive.
- **Third-party-trademark risk for our name.** Unchanged by this update, but its underlying
  likelihood remains **UNKNOWN**; no primary source speaks to how AMO handles a Take-Down
  Request over a descriptive third-party name.
- **The preview policies' prose was not read line-by-line** beyond the diffed regions —
  it did not need to be, because the diff proves the undiffed regions are identical to the
  current text, which prior research already covered.

## Sources

- <https://github.com/mozilla/extension-workshop/pull/2488> — the merged preview PR (the diff)
- <https://extensionworkshop.com/documentation/publish/add-on-policies/> — current policies
- <https://extensionworkshop.com/documentation/publish/add-on-policies-preview-2026-12/> — preview policies
- <https://extensionworkshop.com/documentation/publish/add-on-policies-for-enterprise-preview-2026-12/> — preview enterprise policies
- <https://extensionworkshop.com/documentation/publish/firefox-add-on-distribution-agreement/> — current agreement
- <https://extensionworkshop.com/documentation/publish/firefox-add-on-distribution-agreement-preview-2026-12/> — preview agreement
- <https://extensionworkshop.com/documentation/publish/source-code-submission/> — source-code submission (unchanged)
- <https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/> — data classification taxonomy, `["none"]`
- <https://blog.mozilla.org/addons/2026/10/28/introducing-enterprise-add-on-policies/> — the announcement
