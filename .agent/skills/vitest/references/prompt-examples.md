# Prompt Templates for AI-Generated Vitest Tests

Copy and adapt these for your actual use case. Always attach the source file + at least one existing test file.

---

## Pure Function

```
Write Vitest tests for the `formatCurrency` function in `formatters.ts`.

Cover:
- Valid inputs: positive numbers, zero, large numbers
- Edge cases: negative amounts (should throw), null/undefined (should throw)
- All supported currency codes: USD, EUR, THB
- Use `test.each` for the currency format variations

Follow the style of `utils.test.ts`. Don't use snapshot tests.
```

---

## Async / API Call

```
Write Vitest tests for `fetchUserProfile` in `api/users.ts`.

The function fetches from `/api/users/:id` using fetch.

Cover:
- Successful response: returns mapped UserProfile object
- 404 response: throws UserNotFoundError
- Network failure: throws with a descriptive message
- Use `vi.fn()` to mock global fetch — do NOT use MSW

The project has `globals: true` in vitest.config — no imports needed.
```

---

## Service with Dependencies

```
Write Vitest tests for the `OrderService` class in `services/order.ts`.

Dependencies to mock:
- `PaymentGateway` from `./payment` — mock only `charge()` and `refund()`
- `InventoryService` from `./inventory` — mock `reserve()` and `release()`

Cover:
- `createOrder`: success path, payment failure (should release inventory), out-of-stock
- `cancelOrder`: refund issued, inventory released, status updated to CANCELLED

Use `describe` blocks per method. Don't mock the `Order` model itself.
Use `vi.mock(import('./payment'))` form for type safety.
```

---

## React Component (Browser Mode)

```
Write Vitest browser-mode tests for the `LoginForm` component in `components/LoginForm.tsx`.

Cover:
- Renders email and password fields
- Submit button is disabled when fields are empty
- Calls `onSubmit` prop with { email, password } on valid submission
- Shows validation error when email format is invalid
- Shows API error message when onSubmit rejects

Use `@testing-library/react`. Don't snapshot the entire component.
Follow the style of `components/RegisterForm.test.tsx`.
```

---

## Validation Schema (Zod)

```
Write Vitest tests for the `createUserSchema` Zod schema in `schemas/user.ts`.

Cover every field's constraints:
- `name`: required, min 2 chars, max 100 chars
- `email`: required, valid email format
- `role`: enum of 'admin' | 'member' | 'guest'
- `age`: optional, but if present must be 18-120

Use `test.each` for boundary values. Test both `.safeParse` success and failure shapes.
```

---

## Error Handling Focus

```
Write Vitest tests focused on error handling in `services/auth.ts`.

Functions to cover: `login`, `logout`, `refreshToken`

I only want tests for failure cases:
- Invalid credentials → throws AuthError with code 'INVALID_CREDENTIALS'
- Expired token → throws AuthError with code 'TOKEN_EXPIRED'
- Network down → throws AuthError with code 'NETWORK_ERROR'
- Rate limited → throws AuthError with code 'RATE_LIMITED'

Don't write happy-path tests. Use `expect(...).rejects.toThrow(AuthError)` and check `.code`.
```
