# Prompting Guide

Effective prompting is the most critical factor in achieving high-quality results with Zeroshot. This guide provides principles, templates, and real-world examples for crafting prompts that lead to successful outcomes.

## Key Principles

1.  **Be Specific About Scope**: Clearly define what should be changed and, just as importantly, what should *not* be changed. This helps to prevent unintended side effects.
2.  **Specify the Output Format**: Don't leave the output format to chance. Tell the agent exactly what you expect. Should it create a new file? Modify an existing one? Generate a Markdown report?
3.  **Reference Context Documents**: If there are existing documents, audits, or other materials that provide context for the task, reference them in your prompt. The agent will read them to gain a deeper understanding of the task.
4.  **Break Large Tasks into Phases**: For complex undertakings, it is almost always better to run multiple, focused tasks rather than one large, unfocused one. This improves reliability and cost-effectiveness.
5.  **Set Clear Expectations**: Is this a research task or an implementation task? Make it clear from the outset.

## Prompt Templates

### For Audit and Research Tasks

When you want Zeroshot to analyze your code without making any changes, use this template.

```
Perform a comprehensive audit of [scope] in the [project name] project.
Do NOT modify any code - this is a research and audit task only.

CONTEXT:
- Tech stack: [e.g., React, Node.js, PostgreSQL]
- What you are looking for: [e.g., potential security vulnerabilities, performance bottlenecks, adherence to coding standards]

FOCUS AREAS:
1.  [First area of focus, with specific examples]
2.  [Second area of focus, with specific examples]
3.  ...

OUTPUT:
Create a detailed markdown report at `docs/audits/[name-of-audit].md` containing:
- An executive summary of the findings.
- Detailed findings categorized by area.
- A list of critical issues.
- A list of warnings and recommendations.
- File and line number references for all findings.
```

**Example from a real run:**

```
Perform a comprehensive audit of the Scout platform codebase (apps/platform and packages/database).
Do NOT modify any code - this is a research/audit task only.

FOCUS AREAS:
1. AI ROUTING AND LOGIC (apps/platform/src/lib/ai/)
   - Verify all AI tool definitions are properly structured
   - Check that tool routing logic correctly maps user intents to tools

2. UI BUTTON ROUTING AND BACKEND CONNECTIVITY
   - Check all clickable UI elements in src/components/
   - Verify buttons/actions have proper event handlers

OUTPUT:
Create a detailed markdown report at docs/audits/platform-audit.md
```

**Result:** 21 minutes, $6.45, 643-line audit report with file:line references.

### For Phased Implementation Tasks

When you have a complex task that you want to break down into phases, use this approach.

**Phase 1 Prompt:**

```
You are implementing fixes for the [project name] project based on the audit located at `docs/audits/[name-of-audit].md`.
READ THE AUDIT FIRST for full context.

EXECUTE ONLY PHASE 1 & 2 of the remediation plan:

## PHASE 1: CRITICAL FIXES
1.  [Description of the first critical fix]
2.  [Description of the second critical fix]

## PHASE 2: HIGH PRIORITY
3.  [Description of the first high-priority fix]
4.  [Description of the second high-priority fix]

REQUIREMENTS:
- Preserve existing functionality. Do not introduce any breaking changes.
- Follow the existing code patterns and style guide.
- Run the test suite after each phase to ensure all tests are still passing.

OUTPUT:
After completing the fixes, update the audit document at `docs/audits/[name-of-audit].md` to mark the completed items.
```

**Phase 2 Prompt (after Phase 1 completes):**

```
You are completing Phase 3 & 4 of [project] remediation.
Phase 1-2 are already complete. See docs/audits/[name].md for context.

FOCUS: Phase 3 (Type Safety) and Phase 4 (Performance) ONLY.

## PHASE 3: TYPE SAFETY
1. Specific type fix
2. Another type fix

## PHASE 4: PERFORMANCE
3. Performance improvement
4. Another performance improvement

REQUIREMENTS:
- Do NOT break existing functionality - all [N] tests must continue passing
- Follow existing code patterns

OUTPUT:
Mark all completed items in docs/audits/[name].md with ✅ status.
```

**Why this works:**

*   Smaller scope leads to fewer validator iterations.
*   Clear success criteria for each phase.
*   Allows for review and course correction between phases.
*   Better cost control ($12 + $12 is more predictable than one uncertain $30+ task).

### For Simple Implementation Tasks

For smaller, more straightforward tasks, you can use a simpler prompt.

```
Implement [specific feature or fix] in the [project name] project.

CONTEXT:
- Brief description of the application and its architecture.
- Any relevant architectural notes or constraints.

REQUIREMENTS:
1.  [First specific requirement]
2.  [Second specific requirement]

Run the test suite after implementation to ensure that no existing functionality has been broken.
```

### For Project Planning

Zeroshot can also be used to create validated project plans.

```bash
zeroshot run "Create a comprehensive implementation plan for adding user authentication to this app. Include: database schema changes, API endpoints, frontend components, and security considerations. Do NOT implement anything - only create the plan document."
```

The validators will then verify that:

*   All requirements are addressed in the plan.
*   The plan is technically feasible.
*   There are no gaps in the proposed approach.
