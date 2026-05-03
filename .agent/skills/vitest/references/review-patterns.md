# Review Patterns: Anti-patterns and Fixes

Common issues in AI-generated Vitest tests with corrected versions.

---

## 1. Meaningless Assertions

**❌ Before**

```ts
test('creates a user', () => {
  const user = createUser('Alice', 'alice@example.com')
  expect(user).toBeDefined()
  expect(user).not.toBeNull()
})
```

**✅ After**

```ts
test('creates a user with the correct fields', () => {
  const user = createUser('Alice', 'alice@example.com')
  expect(user).toMatchObject({
    name: 'Alice',
    email: 'alice@example.com',
  })
  expect(user.id).toBeTypeOf('string')
  expect(user.createdAt).toBeInstanceOf(Date)
})
```

---

## 2. Testing Implementation Details

**❌ Before** — breaks on any internal refactor

```ts
test('saves user to database', async () => {
  const saveSpy = vi.spyOn(db, 'save')
  const hashSpy = vi.spyOn(bcrypt, 'hash')

  await createUser('Alice', 'alice@example.com', 'password')

  expect(hashSpy).toHaveBeenCalledOnce()
  expect(saveSpy).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'Alice' })
  )
})
```

**✅ After** — tests the observable contract

```ts
test('stores a hashed password, not plaintext', async () => {
  const user = await createUser('Alice', 'alice@example.com', 'secret')

  expect(user.password).not.toBe('secret')
  expect(user.password).toMatch(/^\$2[aby]\$/) // bcrypt hash format
})
```

---

## 3. Jest APIs Instead of Vitest

**❌ Before**

```ts
import { jest } from '@jest/globals'

const mockFn = jest.fn()
jest.mock('./userService')
jest.useFakeTimers()
jest.spyOn(console, 'error')
```

**✅ After**

```ts
import { vi } from 'vitest'

const mockFn = vi.fn()
vi.mock(import('./userService'))
vi.useFakeTimers()
vi.spyOn(console, 'error')
```

---

## 4. Mock Leaks Between Tests

**❌ Before** — spy state leaks into other tests

```ts
test('logs errors', () => {
  const spy = vi.spyOn(console, 'error')
  doSomething()
  expect(spy).toHaveBeenCalled()
  // spy never restored!
})
```

**✅ After — Option A**: restore manually

```ts
afterEach(() => {
  vi.restoreAllMocks()
})
```

**✅ After — Option B**: set globally in config (recommended)

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    restoreMocks: true,
  },
})
```

---

## 5. Over-mocking (Mock Everything)

**❌ Before** — tests nothing real

```ts
vi.mock(import('./db'))
vi.mock(import('./validator'))
vi.mock(import('./logger'))
vi.mock(import('./emailService'))

test('createUser calls validator', async () => {
  await createUser({ name: 'Alice' })
  expect(validateUser).toHaveBeenCalledWith({ name: 'Alice' })
})
```

**✅ After** — mock only what crosses a real boundary (network, filesystem, time)

```ts
// Only mock the email service — it sends real HTTP requests
vi.mock(import('./emailService'))

test('sends welcome email after user creation', async () => {
  await createUser({ name: 'Alice', email: 'alice@example.com' })
  expect(sendWelcomeEmail).toHaveBeenCalledWith('alice@example.com')
})
```

---

## 6. Verbose Test Names

**❌ Before**

```ts
test(
  'should correctly return the formatted price string when given a valid positive number and a supported currency code'
)
test(
  'should throw an error when the amount is negative and the currency is USD'
)
```

**✅ After**

```ts
test('formats positive amounts with currency code')
test('throws for negative amounts')
```

---

## 7. Missing Async Handling

**❌ Before** — test passes vacuously, never awaits the promise

```ts
test('fetches user profile', () => {
  const profile = fetchUserProfile('123')
  expect(profile.name).toBe('Alice') // ❌ profile is a Promise, not an object
})
```

**✅ After**

```ts
test('fetches user profile', async () => {
  const profile = await fetchUserProfile('123')
  expect(profile.name).toBe('Alice')
})

// Or use .resolves
test('fetches user profile', () => {
  return expect(fetchUserProfile('123')).resolves.toMatchObject({
    name: 'Alice',
  })
})
```

---

## 8. Bare `vitest` in Scripts (Watch Mode Hang)

**❌ Before** — hangs waiting for file changes

```bash
vitest src/userService.test.ts
```

**✅ After**

```bash
vitest run src/userService.test.ts
# or
vitest --no-watch src/userService.test.ts
```

---

## 9. Happy-Path Only Coverage

**❌ Before** — only the sunny day

```ts
describe('divide', () => {
  test('divides two numbers', () => {
    expect(divide(10, 2)).toBe(5)
  })
})
```

**✅ After** — includes the cases that bite you in production

```ts
describe('divide', () => {
  test('divides two numbers', () => {
    expect(divide(10, 2)).toBe(5)
  })

  test('handles decimal results', () => {
    expect(divide(1, 3)).toBeCloseTo(0.333)
  })

  test('throws when dividing by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero')
  })

  test.each([
    [0, 5, 0],
    [-10, 2, -5],
    [-10, -2, 5],
  ])('divide(%i, %i) = %i', (a, b, expected) => {
    expect(divide(a, b)).toBe(expected)
  })
})
```
