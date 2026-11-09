# Simple Booking System

## Files
- `index.html` - the three-step booking interface.
- `api/book.js` - Vercel serverless endpoint that sends the booking email through Brevo.

## Deploy
1. Upload the contents of this folder to the root of a GitHub repository.
2. Import that repository into Vercel and deploy it.
3. In Vercel, open **Project Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `BREVO_API_KEY` | Your Brevo API key |
| `BOOKING_TO_EMAIL` | The email address that should receive booking requests |
| `FROM_EMAIL` | A sender address verified/authenticated in Brevo |
| `FROM_NAME` | The sender name shown in the email, e.g. Your Business |

4. Redeploy after adding/changing environment variables.

## Customise the booking page
Open `index.html` and edit the `BOOKING_SETTINGS` object near the bottom:
- `businessName`: business name shown in the booking notification.
- `appointmentLabel`: label for the type of booking.
- `times`: available appointment times in 24-hour format, e.g. `["09:00","10:00","11:00"]`.
- `disabledWeekdays`: JavaScript weekday numbers to disable (Sunday = 0, Saturday = 6). Use `[]` to allow every day.
- `maxAdvanceDays`: how far ahead people may book, or `null` for no limit.

Also change the decorative `A` brandmark and page title/copy in `index.html` to your business identity.

## Important
- Never put your Brevo API key in `index.html` or any public GitHub file.
- Brevo requires the `FROM_EMAIL` sender to be verified/authenticated in your Brevo account.
- The email is sent to `BOOKING_TO_EMAIL`; replies go to the customer's email via `replyTo`.
- This simple version sends booking requests by email. It does not maintain a database, check calendar availability, prevent two people selecting the same slot, or automatically send a confirmation email to the customer. The page clearly tells customers that the appointment is a request until you confirm it.
- Deploy the HTML and `api` folder together at the repository root so Vercel detects the API function.
