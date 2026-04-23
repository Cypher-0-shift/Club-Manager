# Product Requirements Document: Landing Page Design

## 1. Project Overview
We are building the unauthenticated Landing Page for the "Club Manager" (Organization OS). The page must serve as a premium, highly polished front door to the platform, directing users to either the Admin Panel or the Member Portal.

## 2. Design System (Strict Adherence Required)
- **Aesthetic:** Dark mode, premium, minimalist "Soft Glassmorphism."
- **Background:** Base is `bg-black` with text `text-white`. Use subtle `indigo-500/[0.03]` radial blurs for ambient lighting.
- **Glass Components:** Use frosted glass cards (`backdrop-blur-md`, `bg-white/[0.04]`, `border-white/[0.12]`).
- **Animations:** Rely on `framer-motion` for smooth fade-ins and `transition-all duration-700` for hover states.

## 3. Structural Requirements
1. **Navigation:** Fixed top, blurred background, containing the brand logo/name on the left and "Sign In" / "Get Access" CTA on the right.
2. **Hero Section:** True vertically centered. Must include `SparklesCore` contained within a masked rectangle to prevent sharp edges. Tagline: "Governance · Execution · Proof".
3. **Interface Cards:** A 2-column grid. 
   - Card 1: "Executive Systems" (Admin Panel) with Indigo accents.
   - Card 2: "Contributor Node" (Member Portal) with Emerald accents.
   - *CRITICAL CSS FIX:* Cards must have `overflow-hidden` and `p-10 md:p-14` to prevent top-text from clipping into the border.
4. **Footer:** Simple, border-top, containing standard links.

## 4. Execution Rules for AI Agent
1. Read `progress.txt` to determine the current pending task.
2. Execute EXACTLY ONE task from the list below per iteration.
3. Validate your CSS structure (ensure no negative margin layout breaks).
4. Append your completed task to `progress.txt`.
5. If ALL tasks are complete, write the completion marker `ralph-done-x9k` at the bottom of `progress.txt`.

## 5. Master Task List

### Phase 1: Base Layout & Navigation
- [ ] **Task 1.1:** Scaffold the `app/page.tsx` file. Implement the base `min-h-[200vh] bg-black text-white` wrapper.
- [ ] **Task 1.2:** Build the fixed top `<nav>` using `framer-motion`. Include the animated brand logo and the "Get Access" button with proper hover rings and shadows.

### Phase 2: The Sparkle Hero
- [ ] **Task 2.1:** Build the Hero `<section>`. Add the ambient background blur and the main "Club Manager" `h1`.
- [ ] **Task 2.2:** Integrate the `SparklesCore` component. Wrap it in a `45rem` wide div with top gradient borders and a bottom radial mask to fade the edges.
- [ ] **Task 2.3:** Add the tagline below the sparkles, ensuring proper `z-index` and a bouncy scroll indicator at the bottom of the screen.

### Phase 3: Interface Selection Cards
- [ ] **Task 3.1:** Create the "Choose Your Interface" section with the `grid-cols-1 md:grid-cols-2` layout.
- [ ] **Task 3.2:** Implement the "Admin Panel" card. Enforce `overflow-hidden`, `min-h-[420px]`, and `p-10 md:p-14`. Add the subtle `indigo-500` hover glows and text accents.
- [ ] **Task 3.3:** Implement the "Member Portal" card. Use the exact same layout rules as Task 3.2, but swap the accents and hover glows to `emerald-500`.

### Phase 4: Footer
- [ ] **Task 4.1:** Build the bottom footer with a top border (`border-white/[0.08]`), links (Systems, Talent, Docs), and copyright text.