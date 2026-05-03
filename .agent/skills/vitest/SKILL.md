---
name: vitest-ai-tests
description: >
  Generate high-quality Vitest test files using AI best practices. Use this skill
  whenever the user asks to write, generate, scaffold, or improve Vitest tests — even
  if they just say "write tests for X", "add unit tests", "cover this function", or
  "improve test coverage". Also triggers when reviewing or fixing AI-generated tests
  that look shallow, over-mocked, or that use Jest APIs. Always use this skill before
  generating any .test.ts or .test.js file.
---

# Vitest AI Tests Skill

Generate thorough, idiomatic Vitest tests by following a proven prompting and review workflow. This skill encodes the official Vitest guidance on writing tests with AI.

## Workflow Overview

1. **Gather context** from the codebase
2. **Build a targeted prompt** for the AI
3. **Generate tests** with the right Vitest APIs
4. **Review output** against the checklist
5. **Iterate** until the tests are worth keeping

---

## Step 1: Gather Context

Before generating any tests, collect:

| Context                                  | Why it matters                                                          |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Full source file being tested            | AI needs the real implementation, not a description                     |
| Existing `.test.ts` files in the project | Teaches naming conventions, `describe` structure, fixture patterns      |
| `vitest.config.ts` / `vite.config.ts`    | Reveals `globals`, `environment`, `setupFiles` — prevents wrong imports |
| Type signatures of dependencies          | Required to write useful mocks                                          |
| `AGENTS.md` or `CLAUDE.md` if present    | Project conventions the AI should follow                                |

**Minimal context = shallow tests.** Always include at least the source file + one existing test file.

---

## Step 2: Build the Prompt

### Bad prompt (avoid)

> "Write tests for `userService.ts`"

### Good prompt (use this pattern)

> "Write Vitest tests for the `createUser` function in `userService.ts`.
> Cover: validation errors (missing name, invalid email, duplicate email),
> the success path, and verify the password is hashed before storage.
> Use `test.each` for the validation cases. Don't mock the `hashPassword` utility."

### Prompt checklist

- [ ] Name the **specific function(s)** to test
- [ ] List **scenarios explicitly**: happy path, validation errors, edge cases, async failure
- [ ] Mention **Vitest features** to use: `test.each`, `toMatchInlineSnapshot`, `.resolves`, `.rejects`
- [ ] State what **not** to do: "don't mock X", "don't use snapshots"
- [ ] Specify **describe structure** if you have a preference
- [ ] Reference an existing test file for style: "follow the style of `auth.test.ts`"

See `references/prompt-examples.md` for copy-paste prompt templates.

---

## Step 3: Generate with Correct APIs

### Naming convention

Always use `test()`, never `it()`. Both work in Vitest, but `test` is the project standard.

```ts
// ✅
test('formats USD prices', () => { ... })

// ❌
it('formats USD prices', () => { ... })
```

### Vitest vs Jest — common AI mistakes

AI models are trained on lots of Jest code. Watch for and fix these automatically:

| Wrong (Jest)           | Correct (Vitest)           |
| ---------------------- | -------------------------- |
| `jest.fn()`            | `vi.fn()`                  |
| `jest.mock('./mod')`   | `vi.mock(import('./mod'))` |
| `jest.spyOn(...)`      | `vi.spyOn(...)`            |
| `jest.useFakeTimers()` | `vi.useFakeTimers()`       |
| `jest.resetAllMocks()` | `vi.resetAllMocks()`       |

### Import handling

- If `vitest.config` has `globals: true` → **no imports needed** (but harmless if included)
- If globals are **not** enabled → must import: `import { test, expect, vi, describe } from 'vitest'`

### Mock cleanup

Always add to `vitest.config.ts` (or prompt the AI to include it):

```ts
test: {
  restoreMocks: true,   // prevents vi.spyOn leaks
}
```

Or per-file: `afterEach(() => { vi.restoreAllMocks() })`

Prefer the typed import form for mocks:

```ts
// ✅ preferred — type-safe, refactor-friendly
vi.mock(import('./userService'))

// ⚠️ works but loses types
vi.mock('./userService')
```

---

## Step 4: Review Checklist

Run this after every AI generation pass:

### Assertions are meaningful

```ts
// ❌ passes for almost anything
expect(result).toBeDefined()

// ✅ checks actual behavior
expect(result).toMatchObject({ name: 'Alice', email: 'alice@example.com' })
expect(result.id).toBeTypeOf('string')
```

### Tests behavior, not implementation

Ask: "If someone refactored the internals without changing the output, would this test break?"

- If **yes** → test is over-coupled; remove spy assertions on internal methods
- If **no** → good; it tests the contract

### Tests actually run

```bash
# Always run before committing
vitest run src/path/to/file.test.ts
```

Check for: import errors, undefined references, wrong API usage.

### Edge cases are covered

AI skips hard cases. Ask explicitly if not present:

- Empty / null / undefined inputs
- Boundary values (0, -1, MAX)
- Network / async failures
- Empty arrays / lists

### Test names are scannable

```ts
// ❌ too verbose
test('should correctly return the formatted price string when given a valid positive number')

// ✅ scannable
test('formats USD prices')
test('throws for negative amounts')
```

### Watch mode exits

When running in CI or agent context:

```bash
vitest run          # exits after tests finish
vitest --no-watch   # explicit alternative
```

Never use bare `vitest` in automated scripts — it waits for file changes.

---

## Next.js: page.tsx / layout.tsx

**Do not mock child components** in page or layout tests. Mocking children leaves nothing meaningful to assert — you end up testing that React renders a div.

The page's real job is data fetching, composition, and routing. Test that with real children.

```ts
// ✅ test data fetching + composition with real components
test('renders user profile with fetched data', async () => {
  const page = await ProfilePage({ params: { id: '123' } })
  render(page)
  expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument()
})

// ❌ proves nothing — only tests your own mock
vi.mock('./ProfileCard', () => ({ default: () => <div>mocked</div> }))
test('renders ProfileCard', () => {
  render(<ProfilePage />)
  expect(screen.getByText('mocked')).toBeInTheDocument()
})
```

**Only mock a child component when it:**

- Makes its own network requests or has heavy side effects
- Pulls in a large dependency (charting library, map SDK) that breaks the test environment
- Uses browser APIs unavailable in the test environment
- Has its own thorough tests and you only need to confirm it's mounted

**Mock at the boundary, not at the component boundary** — mock the API call, the DB, the external service; not the `<ProfileCard>` that consumes the result.

---

## Step 5: Iterate

Treat the first output as a draft. Useful follow-up prompts:

- "These mock too many internals. Rewrite to only assert on return values and thrown errors."
- "Add edge cases: null input, empty array, network timeout."
- "Use `test.each` for the three validation scenarios instead of separate tests."
- "The async tests are missing `await`. Fix them."
- "Group by method with `describe` blocks."

---

## Reference Files

- `references/prompt-examples.md` — Ready-to-use prompt templates for common scenarios
- `references/review-patterns.md` — Anti-patterns with before/after fixes
