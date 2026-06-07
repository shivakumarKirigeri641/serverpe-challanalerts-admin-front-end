# AlertMyVahan — Admin Console

React (CRA) admin front-end for the ServerPe vehicle-alerts platform. Talks to
the `adminRouter` mounted in **serverpe-challanalerts-back-end** at
`/vehicleowneralerts/platform/admin`.

## Features

- **OTP login** restricted to the admin mobile (`9886122415`). The OTP is
  generated server-side and delivered over SMS (Fast2SMS) — same flow as the
  public app.
- **Dashboard** with live platform stats.
- **Generic CRUD** over every managed table (subscription plans, users,
  rc/challan/fastag details, policies, payments, invoices, logs, …):
  list + search + active filter + pagination, create, edit, soft/hard delete.
- **Transparent AES-256-GCM** request/response encryption matching the backend.

## Setup

```bash
npm install
npm start          # http://localhost:3000
```

`.env` must define:

- `REACT_APP_API_BASE_URL` — admin API base URL.
- `REACT_APP_SECRET_KEY` — must equal the backend `SECRET_KEY_VEHCILEOWNER`.

The backend must be running on port 7777 with `ADMIN_MOBILE=9886122415`.
