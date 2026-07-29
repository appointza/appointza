# Appointza — User manual

This guide explains how to use **Appointza** from two perspectives: **customers** who book services and events, and **businesses** (organizations) that manage bookings, staff, and locations. Your administrator may host the app on the web or distribute it as a mobile app; the steps below are the same unless noted.

**Pitch & business overview (document):** For a README-style memo that maps routes to investor/partner narratives, see **[BUSINESS_OVERVIEW_PITCH.md](./BUSINESS_OVERVIEW_PITCH.md)** in this repo.

---

## 1. Before you start

- **Account:** Customers need a registered account to manage bookings and profile. Some browsing (for example **Explore**) may work without signing in until you start a booking that requires login.
- **Sign-in:** Use **Login** with the method your provider enabled (for example mobile number with OTP, email, or Google). If you do not have an account, use **Register** and complete **OTP verification** when asked.
- **Organization links:** Businesses often share a **booking link** or **public page** (including custom web addresses). You can open those links directly; they may skip the main marketing home page.

---

## 2. Customer guide — book and manage your visits

### 2.1 Home and general pages

From the **Home** page you can learn about the product, open **Login** or **Register**, or move to **Explore** to find businesses. You can also open sections such as **Pricing**, **Contact**, **Help**, **Terms**, and **Privacy** from the site navigation when available.

### 2.2 Find a business (Explore)

1. Open **Explore** (sometimes labeled in the bottom menu on phones).
2. Search or filter by organization, category, or location as shown on screen.
3. Open an organization to see details, services, hours, and links to book.

### 2.3 Book a service appointment

1. From an organization’s page or a **booking link** your provider sent you, start the booking flow for a **location**.
2. Choose **services** (and quantities if offered), **staff** if required, and an available **date and time**. The app respects the business **opening hours** and **closed days**.
3. Confirm your details. If **online payment** is enabled, complete payment when prompted (for example card or UPI via Razorpay).
4. After confirmation, the appointment appears under **Appointments** and on your **Dashboard**.

### 2.4 Book an event

1. Open **Browse events** (if available from a menu or link) or find events from **Explore**.
2. Select an event and open **Book** (or equivalent).
3. Enter the number of attendees, names, and any **extra questions** the organizer configured.
4. Pay if the event requires it, then confirm. Your registration appears under **My event bookings**.

### 2.5 Your Dashboard (signed-in)

The **Dashboard** summarizes:

- How many appointments you have and their status (such as confirmed or pending).
- **Upcoming** visits.
- Optional **spending** summary (where enabled).
- Prompts to leave a **review** after completed services (where enabled).

Pull to refresh or use the refresh control if the screen loads slowly.

### 2.6 Appointments (your service bookings)

1. Open **Appointments**.
2. Use tabs or filters for **upcoming** versus **past** bookings.
3. Open a booking to see location, time, services, and status.
4. If allowed, you can **cancel** or update **payment** information (for example mark cash paid) — follow the on-screen dialogs and reasons if cancellation asks for them.

### 2.7 My event bookings

1. Open **My event bookings** (on mobile the tab may be labeled **Events**).
2. Filter by event, payment, or check-in status if filters are shown.
3. Use the **QR code** or instructions shown for **check-in** at the venue when the organizer uses it.
4. Cancel or leave a **review** when the app offers those actions.

### 2.8 Profile and Settings

**Profile**

- Update your name, contact details, and **profile photo**.
- **Sign out** when you finish on a shared device.
- If your account supports it, you may **delete** your account (often with a confirmation or OTP step — read warnings carefully).

**Settings**

- Adjust **notification** and **privacy** options if your deployment exposes these tabs.

### 2.9 Other entry points

- **Organization detail pages** and **template or public URLs** are designed for visitors; they show business information and paths into booking without using the full internal menus.

---

## 3. Business guide — organization and staff

Use **Login** with your **organization owner** or **staff** credentials. After login, complete any **onboarding** steps your deployment requires (for example locations, hours, or services) before all menus unlock.

### 3.1 Dashboard

- Select the **location** you are working with when a selector is shown.
- Review **payment summaries**, counts, and quick metrics for the day or period shown.
- **Search by customer phone** when available to find appointments quickly.
- Open an appointment to see full details and **attachments** if present.

### 3.2 Appointments (manage bookings)

- Pick a **date** (calendar) and optional **status** filter.
- View **upcoming** and **past** lists.
- Change **status**, assign **staff**, or open **details** from the row or card.
- For clinical or follow-up documentation, open **Appointment record** when your process uses it (notes, tasks, uploads).

### 3.3 Event bookings

- See everyone registered for your **events** at this organization or location.
- Filter by event, **payment**, **check-in**, or **confirmation** status.
- Update statuses when you accept payments at the door, check guests in, or confirm attendance.
- Switch **view** (cards, rows, or columns) if the screen offers it.

### 3.4 Services and events

- Maintain **services**: name, description, duration, price, images, and which **location** they belong to.
- Create and edit **events** (schedules, capacity, public visibility, images, payment rules) according to the tabs or sections on the page.
- Save changes before leaving the screen.

### 3.5 Business hours and availability (Timing)

- Choose a **location**.
- Set **working hours** and **time slots** customers can book.
- Add **leave** or **blackout** periods for holidays or maintenance so slots do not appear online.

### 3.6 Locations

- Add or edit **branches**: address, map pin, phone, images.
- Copy or note **public** and **booking** URLs your customers will use (exact placement depends on your setup).

### 3.7 Clients (CRM)

- **Search** clients by name or phone.
- Select a client to see **timeline**, past services, event bookings, and **today’s** appointment if any.
- **Create** a new client or start **on-spot registration** for a walk-in.
- **Book for client** opens an internal booking flow so staff can reserve a service or event on behalf of that person.

### 3.8 On-spot registration

1. Collect the walk-in’s **name**, **mobile**, and **email** as required.
2. Complete **OTP** verification if the system creates a new user.
3. Choose **service** or **event**, date and time, and confirm the booking.

### 3.9 Staff

- **Staff management:** List team members, remove or adjust access, set **permissions** (which menus and features each role can use).
- **Add staff:** Enter the person’s **mobile** to find their user, pick a **location**, toggle **permissions**, then confirm.

Staff members only see menu items their **permissions** allow.

### 3.10 Templates and booking links

- Choose how the **public** page looks (colors, sections such as services and hours).
- Under the **booking** tab (or **Booking page** shortcut), generate or copy **shareable links** for each location so customers book without calling.

### 3.11 Payment settings

- Add your **payment gateway** credentials (for example Razorpay) as instructed by your administrator.
- Use **test mode** only in safe environments; switch to **live** when you are ready for real charges.
- Keep API keys secret and rotate them if they are exposed.

### 3.12 Reference values and forms

- Maintain dropdown lists and structured values used across appointments and events.
- Configure **event booking form fields** (labels, types, required flags) so guests answer the right questions when they register.

### 3.13 Organization settings and profile hub

- **Organization settings:** Notifications and preferences at business level.
- **Profile / Settings hub:** Central place for **account profile**, **hours**, **staff**, **locations**, **templates**, **payments**, and **reference data** — individual tabs may be hidden for **staff** with limited permissions.

### 3.14 Integrated products (if enabled)

- **Momantza:** May open an embedded booking experience for a linked product; use **Back** or your usual navigation to return.
- **Campusza:** Staff menu for education-oriented features if your tenant uses it.

---

## 4. Tips and troubleshooting

| Issue | What to try |
| --- | --- |
| Cannot log in | Check mobile number or email, request OTP again, ensure caps lock is off for passwords if used. |
| No time slots | Business may be closed that day, on leave, or fully booked — try another date or call the business. |
| Payment failed | Retry; confirm bank or UPI app; ask the business if live keys and gateway are active. |
| Wrong location | Organizations with multiple branches: confirm the **location** selector on Dashboard or booking link. |
| Missing menu (staff) | Your **permissions** may hide that area — ask an organization administrator to adjust access. |
| Page not found | The link may be old or mistyped; start again from **Explore** or the booking URL the business sent. |

For product-specific or account-specific problems, use **Contact** or **Help** on your deployment, or the support channel your organization provides.

---

## 5. Document information

- This manual describes behavior intended by the Appointza web app. Your host may **enable or disable** features, branding, and auth methods.
- Technical screen and route reference for implementers: see **README.md**, section *Application screens (complete catalog)*, in this repository.

*Aligned with the `appointza-ui-canvas` application.*
