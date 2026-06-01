# Security Specification & Threat Model - QXT Funded

This document sets down the Security Specification, Threat Model, and Test Assertions for the QXT Funded Firestore security rules implementation as required by Phase 0: Payload-First Security Test-Driven Development (TDD).

## 1. Core Data Invariants

1. **User Identity & Isolation**: A user can only see, create, or edit their own profile in `/users/{userId}`. They cannot alter their registration date, email, or assign themselves special claims.
2. **Order Integrity & Verification**: A user can create an order `/orders/{orderId}` but ONLY with `userID` matching their authenticated `uid`. The initial order state must always have `orderStatus == "Pending"` and `paymentStatus == "Pending"`.
3. **No Self-Approval of Orders**: A standard authenticated user is strictly blocked from updating `orderStatus` to `"Approved"` or `paymentStatus` to `"Completed"`. These are administrative properties.
4. **Order State Locking**: Once an order's status becomes `"Approved"` or `"Rejected"`, it enters a terminal state. No user (and no client-side SDK) is allowed to modify its properties further.
5. **Payment Association**: Each transaction `/payments/{paymentId}` can only be created if it references a valid order owned by the user, and if the blockchain fields match strict length and type limits to avoid wallet depletion.
6. **Support Integrity**: Support tickets in `/support/{supportId}` can only be read/written by the user who created them (matching `userID`). The user cannot modify `adminReply` or forge the ticket's `status` to `"Replied"` directly.
7. **Public Settings Read-Only**: Settings documents `/settings/{settingsId}` are readable by anyone (including unauthenticated visitors) but can only be modified by true administrator accounts.

---

## 2. The "Dirty Dozen" Threat Payloads

Below are the 12 specific payloads crafted by an attacker attempting to bypass QXT Funded authorization layout or hijack client interactions. All 12 payloads must return `PERMISSION_DENIED`.

### Attack 1: User Profile Spoofing
*   **Attempt**: User `attacker123` tries to write a profile document under `users/victim456`.
*   **Malicious Payload**:
    ```json
    {
      "uid": "victim456",
      "name": "Jane Doe",
      "email": "victim@gmail.com",
      "country": "US",
      "broker": "Quotex",
      "registrationDate": "2026-06-01T12:00:00Z"
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - The path parameter `userId` must equal `request.auth.uid`.

### Attack 2: Self-Promotion to Admin
*   **Attempt**: User `attacker123` tries to create an entry in the `/admins` collection or claim admin status in their user document.
*   **Malicious Payload** (attempted write to `/admins/attacker123`):
    ```json
    {
      "roles": ["admin"]
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - True admins cannot self-appoint, and access to admin collections is protected.

### Attack 3: Order Forgery (Hijacking Owner ID)
*   **Attempt**: User `attacker123` authenticates with raw client SDK, then creates an order with `userID` set to `victim456`.
*   **Malicious Payload**:
    ```json
    {
      "id": "order_777",
      "userID": "victim456",
      "accountType": "Instant",
      "accountSize": 50000,
      "price": 1083,
      "paymentMethod": "USDT ERC20",
      "paymentStatus": "Pending",
      "orderStatus": "Pending",
      "broker": "Quotex",
      "purchaseDate": "2026-06-01T16:50:00Z"
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - The `userID` inside the document must match `request.auth.uid`.

### Attack 4: Self-Approving an Account Order (Direct Funding)
*   **Attempt**: User `attacker123` creates an order for a $50,000 account, setting both `paymentStatus` and `orderStatus` directly to `"Completed"` and `"Approved"` respectively, bypassing verification.
*   **Malicious Payload**:
    ```json
    {
      "id": "order_abc",
      "userID": "attacker123",
      "accountType": "Instant",
      "accountSize": 50000,
      "price": 1083,
      "paymentMethod": "USDT ERC20",
      "paymentStatus": "Completed",
      "orderStatus": "Approved",
      "broker": "Quotex",
      "purchaseDate": "2026-06-01T16:50:00Z",
      "accountNumber": "9876543",
      "balance": 50000,
      "dailyLoss": 0,
      "maxDrawdown": 0,
      "profit": 0
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - Creating/updating fields to status other than `Pending` requires Admin authorization, or rules enforce that initial creations must have `Pending` values.

### Attack 5: Ghost Fields Payload (Shadow Update Test)
*   **Attempt**: Attackers try to inject unauthorized boolean variables into the order scheme during an edit update.
*   **Malicious Update Payload**:
    ```json
    {
      "isVerifiedTrader": true,
      "freeAddonAppended": true
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - Rules must use strict schema validation and `affectedKeys().hasOnly()` during state edits to block ghost keys.

### Attack 6: Modifying Immortal Fields (Fraudulent Discount)
*   **Attempt**: User bought the $3,000 account for $45. After ordering, they try to update the `price` of their existing order to `$0` or alter `purchaseDate` to manipulate records.
*   **Malicious Update Payload**:
    ```json
    {
      "price": 0,
      "purchaseDate": "2020-01-01T00:00:00Z"
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - Pricing, purchase date, and dimensions are immutable fields post-creation.

### Attack 7: Status Shortcutting (Direct State Hijack post-rejection)
*   **Attempt**: Admin sets order status to `"Rejected"`. Attacker attempts to reopen or force-approve the rejected account order from the client.
*   **Malicious Update Payload**:
    ```json
    {
      "orderStatus": "Approved",
      "paymentStatus": "Completed"
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - Terminal state checking locks any document with status `"Approved"` or `"Rejected"` from further non-admin updates.

### Attack 8: Resource Poisoning via Garbage IDs
*   **Attempt**: Attacker creates a document with a massive garbage string ID (`"%%%%__&$$$__REALLY_LONG_ID..."`) inside `/orders/` to crash indexing, cause overflow, or trigger memory depletion.
*   **Malicious Write ID**: Post to `orders/` with a 2000-character non-alphanumeric key.
*   **Outcome**: `PERMISSION_DENIED` - Handled via `isValidId(orderId)` pattern checking string size and regex `^[a-zA-Z0-9_\-]+$`.

### Attack 9: Query Exfiltration & List Scraping
*   **Attempt**: Attacker requests `getDocs(collection(db, "orders"))` using client SDK without any filtering, attempting to download every order in the system.
*   **Query Payload**: Raw `list` request on root collections.
*   **Outcome**: `PERMISSION_DENIED` - The rule `allow list` explicitly validates that queries are scoped specifically to the user's records: `resource.data.userID == request.auth.uid`.

### Attack 10: Forged Support Tickets (Impersonating Administation Reply)
*   **Attempt**: User creates or edits a support ticket, setting `adminReply` to `"Your account has been credited $1000"` and status to `"Replied"` directly.
*   **Malicious Payload**:
    ```json
    {
      "id": "ticket_123",
      "userID": "attacker123",
      "userName": "Scammer",
      "messageText": "Help me!",
      "adminReply": "Verified. Credited account #555.",
      "status": "Replied",
      "timestamp": "2026-06-01T16:50:00Z"
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - Creating a ticket cannot set `adminReply` (must be empty/unset or validated via Admin-only rules) and status must be `"On Queue"`.

### Attack 11: Spoofed Server Timestamps (Client Clock Manipulation)
*   **Attempt**: Attacker tries to set `purchaseDate` to a future timestamp like `2035-12-31T23:59:59Z`.
*   **Malicious Payload**:
    ```json
    {
      "purchaseDate": "2035-12-31T23:59:59Z"
    }
    ```
*   **Outcome**: `PERMISSION_DENIED` - Timestamps must equal `request.time`.

### Attack 12: Anonymous Write Access
*   **Attempt**: Unauthenticated bot tries to push spam messages directly into the support queues `/support/` or `/payments/`.
*   **Write Attempt**: Signed out client pushes raw document.
*   **Outcome**: `PERMISSION_DENIED` - All writes require an authenticated user with verified email context or registered state.

---

## 3. Test Runner Verifications

The rules are built to verify these scenarios during operational runtime checks. We will integrate helper rules checking structures to enforce authorization layers.
 We are ready to draft the safe fortress rule pattern.
