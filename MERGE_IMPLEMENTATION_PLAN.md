# UI Merge Implementation Plan

## Objective

Use the UI/UX of `Universal-Algorand-Kit-main` with the complete, unchanged functionality and backend of `Universal-Kit-Arc-main`.

The final application remains `Universal-Kit-Arc-main`.

This is a presentation migration only. The Arc application flow is the source of truth and must not be redesigned, replaced, or redirected to Algorand functionality.

## Non-Negotiable Constraints

- Preserve the Next.js runtime and existing dependency versions.
- Preserve the existing wallet provider and RainbowKit integration.
- Preserve the existing Somnia source-chain configuration.
- Preserve the existing Arc Testnet destination-chain configuration.
- Preserve all Arc contract addresses and ABIs.
- Preserve `useIntent`, `useCounter`, `useTodo`, and `useTodoIntent` behavior.
- Preserve intent history polling, status values, and JSON schema.
- Preserve the Arc relayer and its environment variables.
- Preserve Counter and Todo transaction payloads and gateway calls.
- Do not import Algorand contracts, Algorand hooks, the Algorand relayer, Vite configuration, or React Router from `Universal-Algorand-Kit-main`.
- Do not modify the Arc backend to match the visual project.
- Do not silently describe Arc execution as Algorand execution.

## Source and Target

### Target project

`Universal-Kit-Arc-main`

This project keeps:

- Next.js application structure
- React and TypeScript configuration
- RainbowKit and wagmi setup
- Arc contract configuration
- Counter and Todo functionality
- Arc EVM relayer
- Deployment and operational scripts

### UI reference project

`Universal-Algorand-Kit-main`

Use only its presentation patterns:

- Dark RemitStar visual language
- Lime accent color system
- Typography hierarchy
- Landing-page section rhythm
- Sidebar and top-bar application shell
- Responsive mobile navigation
- Cards, tables, loading states, and status treatments
- Form spacing, button hierarchy, and interaction states
- Motion and reveal patterns where compatible with the target app

Do not copy its business logic or network integrations.

## Protected Arc Files

These files and directories must not be changed during the UI migration unless a build-only import fix is unavoidable. Any unavoidable change must preserve behavior exactly.

- `src/hooks/useIntent.ts`
- `src/hooks/useCounter.ts`
- `src/hooks/useTodo.ts`
- `src/hooks/useTodoIntent.ts`
- `src/lib/contracts.ts`
- `src/config/chains.ts`
- `src/components/Providers.tsx`
- `src/components/RainbowKitWrapper.tsx`
- `src/lib/wallet.ts`
- `src/types/`
- `web3-hardhat-intent/relayer/index.ts`
- `web3-hardhat-intent/contracts/`
- `web3-hardhat-intent/scripts/`
- `web3-hardhat-intent/hardhat.config.ts`
- `web3-hardhat-intent/package.json`
- `public/intent-history.json` schema and relayer write behavior
- `package.json` dependency versions and scripts unless a strictly required UI package is missing

## UI Migration Map

### 1. Global styling

Use the visual direction from:

- `Universal-Algorand-Kit-main/src/index.css`
- `Universal-Algorand-Kit-main/src/theme.ts`

Apply the equivalent styles to:

- `Universal-Kit-Arc-main/src/app/globals.css`
- Existing Tailwind configuration and utility classes

Preserve the target project's CSS loading and Next.js conventions. Do not copy Vite-specific imports or root setup.

Required visual characteristics:

- Near-black page backgrounds
- Layered dark surfaces
- White and muted-gray text
- Lime accent for primary actions and active states
- Restrained borders and shadows
- Responsive layouts for desktop and mobile
- Consistent focus, disabled, loading, success, and error states

### 2. Navigation and application shell

Use the structure and behavior of these UI references:

- `Universal-Algorand-Kit-main/src/components/landing/Navbar.tsx`
- `Universal-Algorand-Kit-main/src/components/app/AppSidebar.tsx`
- `Universal-Algorand-Kit-main/src/components/app/AppTopBar.tsx`
- `Universal-Algorand-Kit-main/src/components/app/AppMobileNav.tsx`
- `Universal-Algorand-Kit-main/src/pages/AppLayout.tsx`

Adapt them to Next.js routing and the existing Arc routes. Do not introduce React Router.

Navigation must expose the existing Arc features:

- Home
- Counter
- Todo
- Intent history or the existing history view
- Documentation or SDK information where already supported

All links must use Next.js `Link` or the existing target navigation approach.

### 3. Landing page

Restyle the existing Arc landing page using the information hierarchy of:

- `Universal-Algorand-Kit-main/src/pages/Landing.tsx`
- Its landing components under `src/components/landing/`

Keep the content accurate for the Arc flow:

`User wallet -> Somnia/source chain -> ArcGateway -> relayer -> ArcExecutor -> Counter or Todo`

Replace any copied Algorand-specific wording with Arc-specific wording. Do not claim that the destination is Algorand.

### 4. Counter page

Keep the existing Counter page and its hook calls unchanged in behavior.

Restyle the UI using the RemitStar patterns from:

- `Universal-Algorand-Kit-main/src/components/demo/AlgorandCounterCard.tsx`
- `Universal-Algorand-Kit-main/src/components/demo/FlowPipeline.tsx`
- `Universal-Algorand-Kit-main/src/components/demo/IntentActions.tsx`
- `Universal-Algorand-Kit-main/src/components/demo/IntentStatus.tsx`

The visual copy must say Arc Testnet for destination execution. The implementation must continue to use the existing Arc hooks and gateway calls.

### 5. Todo page

Keep the existing Todo page, Todo display, Todo forwarder, and Todo history behavior.

Restyle them using the same RemitStar patterns:

- Dark surface cards
- Clear action hierarchy
- Compact status indicators
- Responsive list/table layout
- Loading and error states
- Explicit pending, completed, and failed states

The following operations must remain unchanged:

- Add Todo
- Toggle Todo
- Delete Todo
- Calldata encoding
- Gateway `forwardIntentWithData` call
- History polling and status updates

### 6. Intent history

Restyle the current Arc intent history using the RemitStar history-table patterns.

Do not change:

- History endpoint
- Polling interval
- Intent fields
- Status values
- Transaction hashes
- Execution hashes
- User filtering
- Explorer URL behavior

## Implementation Order

### Phase 1: Baseline and protection

1. Create a clean working checkpoint or record the existing git diff.
2. Run the target project's existing checks before editing:
   - `npm run lint`
   - `npm run build`
3. Record the files listed under **Protected Arc Files**.
4. Confirm the current Counter and Todo routes work before visual changes.

### Phase 2: Visual foundation

1. Update `src/app/globals.css` with the RemitStar visual system.
2. Preserve existing CSS variables and add equivalent variables only when needed.
3. Keep Next.js font loading and metadata behavior intact.
4. Validate the landing page after the CSS change.

### Phase 3: Shell and navigation

1. Restyle the existing Arc navbar.
2. Add or adapt the RemitStar-style desktop sidebar and top bar where appropriate.
3. Add responsive mobile navigation.
4. Keep all existing Arc routes and Next.js navigation semantics.
5. Validate navigation and route links before changing feature pages.

### Phase 4: Feature presentation

1. Restyle Counter components.
2. Run lint/build.
3. Restyle Todo components.
4. Run lint/build.
5. Restyle intent history.
6. Run lint/build.

### Phase 5: Copy and documentation

1. Update visible copy to accurately describe Somnia -> Arc execution.
2. Keep contract addresses, chain IDs, environment variables, and backend instructions unchanged.
3. Update only UI documentation that is made inaccurate by the new presentation.

## Post-Merge Cleanup

Remove files only after searching imports and confirming they are not needed by the build, tests, scripts, or backend.

### Candidates for removal in `Universal-Kit-Arc-main`

These are candidates only, not automatic deletions:

- Superseded Arc-only visual components replaced by the RemitStar presentation.
- Duplicate page-level presentation components no longer imported by any route.
- Unused local stylesheets after consolidation into `src/app/globals.css`.
- Unused UI helper components after checking all imports.
- Dead demo-only presentation files that are not part of Counter, Todo, history, navigation, or documentation.

### Files that must not be removed

- Any file under `src/hooks/` used by Counter, Todo, or history behavior.
- `src/lib/contracts.ts`
- `src/config/chains.ts`
- Wallet/provider files.
- Arc route files unless their replacement route is verified.
- `web3-hardhat-intent/` contracts, relayer, scripts, configuration, and tests.
- `public/intent-history.json`.
- Deployment and environment documentation required to run the relayer.

### Cleanup procedure

For each proposed deletion:

1. Search the entire target project for imports and references.
2. Confirm it is presentation-only and not used by backend scripts or tests.
3. Delete it only after the replacement UI builds.
4. Run `npm run lint` and `npm run build`.
5. Review the final diff and confirm no protected file changed.

Do not delete files from `Universal-Algorand-Kit-main` as part of this merge. That project is the UI reference and remains untouched.

## Validation Checklist

### Static validation

- `npm run lint` passes.
- `npm run build` passes.
- No protected Arc file has behavior changes.
- No Algorand contracts, hooks, provider files, or Vite files were added.
- No React Router dependency or route was introduced.

### Functional validation

- Wallet connects through the existing RainbowKit flow.
- Wrong-network behavior still requests Somnia/source-chain switching.
- Counter read still targets Arc Testnet.
- Counter intent still calls the existing gateway function.
- Todo add, toggle, and delete still call the existing gateway flow.
- Relayer continues detecting and executing intents.
- Intent history continues polling and displaying status changes.
- Source and execution explorer links remain correct.

### Visual validation

Check at desktop and mobile widths:

- Landing page
- Navigation and mobile menu
- Counter page
- Todo page
- Intent history
- Loading states
- Error states
- Completed states
- Wallet disconnected state
- Wrong-network state

## Definition of Done

The merge is complete when:

1. `Universal-Kit-Arc-main` has the RemitStar-style UI/UX.
2. Counter and Todo behavior is unchanged and functional.
3. The Arc relayer and backend are unchanged and functional.
4. The project still runs with its original Next.js, wagmi, RainbowKit, and Arc configuration.
5. No Algorand functionality has been introduced.
6. Unused presentation files have been removed only after reference checks.
7. Lint, build, functional checks, and responsive visual checks pass.
