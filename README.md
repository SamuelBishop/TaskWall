# TaskWall

A smart home tablet platform for **Raspberry Pi** with a 7-inch display (1280x720). Ships with two apps: **TaskWall** (Todoist task dashboard) and **Calendar** (Google Calendar integration with multi-user support).

![Display](https://img.shields.io/badge/display-1280×720-blue) ![React](https://img.shields.io/badge/react-19-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.7-blue) ![Vite](https://img.shields.io/badge/vite-6-purple)

## Features

### Home Screen
- **App launcher** with clock and date display
- **Configurable default app** — auto-launches on boot (TaskWall by default)
- **Grid icon navigation** — tap to return home from any app

### TaskWall (Todoist Dashboard)
- **2-column layout**: Today | Upcoming (7 days)
- **Additional views**: Overdue, Future, Completed (last 7 days)
- **Todoist integration** via REST API v2
- **Multi-user support** with assignee filtering
- **Auto-refresh** every 5 minutes
- **Touch-optimized** — on-screen keyboard, drag-to-scroll, large tap targets

### Calendar (Google Calendar)
- **3 views**: Day, Week, Month — switchable from the header
- **Multi-user calendars** — each person has their own Google account and refresh token
- **Color-coded events** with a persistent legend in the header
- **Day view**: Hourly timeline with event blocks, current time indicator, upcoming sidebar
- **Week view**: 7-column layout with event card lists per day
- **Month view**: Traditional grid with event snippets and color dots
- **Auto-refresh** every 5 minutes
- **OAuth2 authentication** — private calendars, no public sharing required

### Display
- **1280x720 fixed layout** optimized for Pi Display 2
- **Physical-size preview** with calibration slider for development
- **Kiosk mode** for fullscreen deployment
- **High-contrast typography** readable from 3-6 feet

## Prerequisites

- Node.js 18+ and npm
- A Todoist account with API token (for TaskWall)
- A Google Cloud project with Calendar API enabled (for Calendar)

## Installation

```bash
git clone <your-repo-url>
cd TaskWall
npm install
cp .env.example .env
```

## Configuration

Edit `.env` with your credentials:

### TaskWall (Todoist)

```env
VITE_TODOIST_API_TOKEN=your-todoist-api-token-here
```

Get your token at: **Todoist → Settings → Integrations → Developer**

Optional:
```env
VITE_TODOIST_PROJECT_ID=          # Filter to a specific project
VITE_DISPLAY_NAMES=Name1:Display1,Name2:Display2  # Username mapping
```

### Calendar (Google Calendar)

#### 1. Set up Google Cloud credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services**
2. Enable the **Google Calendar API**
3. Create an **OAuth 2.0 Client ID** (Web application type)
4. Add `http://localhost:3001/callback` as an **Authorized Redirect URI**
5. Add your Google accounts as **test users** (or publish the app to skip this)

#### 2. Get refresh tokens

Run the setup script for each user:

```bash
# Primary user (e.g. Sam)
node scripts/google-auth.mjs YOUR_CLIENT_ID YOUR_CLIENT_SECRET

# Secondary user (e.g. Shane) — sign in with their Google account
node scripts/google-auth.mjs YOUR_CLIENT_ID YOUR_CLIENT_SECRET
```

Each run opens a browser for Google sign-in and prints a refresh token.

#### 3. Add to `.env`

```env
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_REFRESH_TOKEN=primary-users-refresh-token
VITE_GOOGLE_REFRESH_TOKEN_SECONDARY=secondary-users-refresh-token
```

#### 4. Configure calendars

```env
VITE_GOOGLE_CALENDARS="email1:Name1:#color1:primary,email2:Name2:#color2:secondary"
```

- **Calendar ID**: Usually the email address (find in Google Calendar → Settings → calendar)
- **Name**: Display name shown in the legend
- **Color**: Hex color for events (wrap the whole value in quotes since `#` is a comment character in `.env`)
- **Token key**: `primary` or `secondary` — which refresh token to use

Example:
```env
VITE_GOOGLE_CALENDARS="sam@gmail.com:Sam:#7ec8e3:primary,shane@gmail.com:Shane:#6b9e8a:secondary"
```

### Kiosk Mode

```env
VITE_KIOSK=true  # Hides dev controls, runs fullscreen
```

> **Security Note**: Never commit your `.env` file. It is already in `.gitignore`.

## Development

```bash
npm run dev
```

Opens at `http://localhost:3000`. The UI renders inside a 1280x720 container simulating the Pi display, with optional physical-size calibration.

## Build for Production

```bash
npm run build
```

Output is in `dist/` — a static site ready for deployment.

## Deploying to Raspberry Pi

This guide is for a **Raspberry Pi 5** with the **Raspberry Pi Touch Display 2** (1280x720). The app is hosted on Vercel and loaded in Chromium kiosk mode.

### 1. Flash the OS

Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/) to flash **Raspberry Pi OS (64-bit)** (Desktop variant).

In the Imager customisation screen, configure:
- **Hostname**: `TaskWall`
- **Enable SSH** (password authentication)
- **Username / password**
- **Wi-Fi** credentials

### 2. SSH in and install dependencies

```bash
ssh taskwall@TaskWall.local
```

> **Known issue (Raspberry Pi OS Trixie, Dec 2025 image):** Running `sudo apt full-upgrade` updates the kernel/compositor and breaks Touch Display 2 touchscreen rotation mapping. Only upgrade Chromium — do **not** run `full-upgrade`.

```bash
sudo apt update
sudo apt install --only-upgrade chromium
sudo apt install -y fonts-noto-color-emoji kanshi wlr-randr
```

### 3. Rotate the display

The Touch Display 2 defaults to portrait (720x1280). The output is `DSI-2` on the Pi 5.

```bash
export WAYLAND_DISPLAY=wayland-0
wlr-randr
```

Make persistent with kanshi:

```bash
mkdir -p ~/.config/kanshi
cat > ~/.config/kanshi/config << 'EOF'
profile {
  output DSI-2 mode 720x1280 transform 270
}
EOF
```

> Use `transform 270` or `transform 90` depending on mounting orientation.

### 4. Set up Chromium kiosk autostart

```bash
mkdir -p ~/.config/autostart
cat > ~/.config/autostart/taskwall-kiosk.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=TaskWall Kiosk
Exec=/bin/bash -c 'sleep 5 && chromium --noerrdialogs --disable-infobars --disable-session-crashed-bubble --disable-restore-session-state --password-store=basic --kiosk https://your-deployed-app-url/'
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

Disable the default keyring prompt:

```bash
rm -rf ~/.local/share/keyrings/*
cat > ~/.config/chromium-flags.conf << 'EOF'
--password-store=basic
EOF
```

### 5. Configure auto-login and disable screen blanking

```bash
sudo raspi-config
```

- **System Options → Boot / Auto Login → Desktop Autologin**
- **Display Options → Screen Blanking → Disable**

### 6. Reboot

```bash
sudo reboot
```

### 7. Display brightness & sleep control

The display dims when idle and turns off at night, waking on touch. Uses `swayidle` with cron scheduling. Backlight at `/sys/class/backlight/11-0045/`.

#### Install swayidle

```bash
sudo apt install -y swayidle
```

#### Set timezone

```bash
sudo timedatectl set-timezone America/Denver
```

#### Allow passwordless backlight control

```bash
sudo tee /etc/sudoers.d/backlight << 'EOF'
taskwall ALL=(ALL) NOPASSWD: /usr/bin/tee /sys/class/backlight/11-0045/bl_power, /usr/bin/tee /sys/class/backlight/11-0045/brightness
EOF
```

#### Add user to input group

```bash
sudo usermod -aG input taskwall
```

#### Create scripts

**Daytime dimmer** — dims to brightness 2 after 60s idle, restores to 31 on touch:

```bash
sudo tee /usr/local/bin/taskwall-display-dim << 'SCRIPT'
#!/bin/bash
BL="/sys/class/backlight/11-0045/brightness"
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/run/user/$(id -u)
swayidle -w \
    timeout 60 "echo 2 | sudo tee $BL > /dev/null" \
    resume     "echo 31 | sudo tee $BL > /dev/null"
SCRIPT
sudo chmod +x /usr/local/bin/taskwall-display-dim
```

**Night sleep** — backlight off after 15s, wakes briefly at brightness 8 on touch:

```bash
sudo tee /usr/local/bin/taskwall-display-sleep << 'SCRIPT'
#!/bin/bash
BL_POWER="/sys/class/backlight/11-0045/bl_power"
BL_BRIGHT="/sys/class/backlight/11-0045/brightness"
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/run/user/$(id -u)
pkill -f taskwall-display-dim || true
swayidle -w \
    timeout 15 "echo 1 | sudo tee $BL_POWER > /dev/null" \
    resume     "echo 0 | sudo tee $BL_POWER > /dev/null; echo 8 | sudo tee $BL_BRIGHT > /dev/null"
SCRIPT
sudo chmod +x /usr/local/bin/taskwall-display-sleep
```

**Wake** — kills night mode, restores full brightness, restarts daytime dimmer:

```bash
sudo tee /usr/local/bin/taskwall-display-wake << 'SCRIPT'
#!/bin/bash
pkill -f swayidle || true
pkill -f taskwall-display-sleep || true
sleep 1
echo 0 | sudo tee /sys/class/backlight/11-0045/bl_power > /dev/null
echo 31 | sudo tee /sys/class/backlight/11-0045/brightness > /dev/null
nohup /usr/local/bin/taskwall-display-dim > /dev/null 2>&1 &
SCRIPT
sudo chmod +x /usr/local/bin/taskwall-display-wake
```

#### Autostart the daytime dimmer

```bash
cat > ~/.config/autostart/taskwall-dim.desktop << 'EOF'
[Desktop Entry]
Type=Application
Name=TaskWall Dim
Exec=/usr/local/bin/taskwall-display-dim
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
```

#### Schedule night mode via cron

```bash
crontab -e
```

Add:

```
0 21 * * * /usr/local/bin/taskwall-display-sleep &
0  6 * * * /usr/local/bin/taskwall-display-wake
```

#### Behavior summary

| Time | Idle behavior | On touch |
|---|---|---|
| **6 AM - 9 PM** | Dims to brightness 2 after 60s | Restores to full brightness (31) |
| **9 PM - 6 AM** | Backlight off after 15s | Wakes at brightness 8 for 15s |

## Project Structure

```
src/
├── api/
│   ├── todoist.ts              # Todoist REST API v2 client
│   └── googleCalendar.ts       # Google Calendar API v3 with OAuth2
├── components/
│   ├── HomeScreen.tsx           # App launcher with clock & tiles
│   ├── TaskWallApp.tsx          # TaskWall app shell
│   ├── Header.tsx               # TaskWall top bar
│   ├── TaskSection.tsx          # Task list column
│   ├── TaskCard.tsx             # Individual task card
│   ├── CalendarApp.tsx          # Calendar app with header & view switching
│   ├── CalendarDayView.tsx      # Hourly timeline + upcoming sidebar
│   ├── CalendarWeekView.tsx     # 7-column event card layout
│   ├── CalendarMonthView.tsx    # Month grid with event snippets
│   ├── AddTaskForm.tsx          # New task form
│   ├── DatePicker.tsx           # Calendar date selector
│   ├── RecurrencePicker.tsx     # Task recurrence configuration
│   ├── OnScreenKeyboard.tsx     # Touch-friendly virtual keyboard
│   ├── Popover.tsx              # Floating popover component
│   ├── ErrorBanner.tsx          # Dismissible error display
│   └── SignInScreen.tsx         # Setup instructions screen
├── hooks/
│   ├── useTasks.ts              # Todoist data fetching & auto-refresh
│   ├── useCalendarEvents.ts     # Google Calendar data fetching & auto-refresh
│   └── useDragScroll.ts         # Touch drag-to-scroll behavior
├── utils/
│   └── date.ts                  # Date formatting helpers
├── types.ts                     # TypeScript interfaces
├── App.tsx                      # App shell with routing & display scaling
├── main.tsx                     # Entry point
└── index.css                    # Tailwind + global styles
scripts/
└── google-auth.mjs              # One-time OAuth2 setup for Google Calendar
```

## Tech Stack

- **React 19** + **TypeScript 5.7**
- **Vite 6** (build tool)
- **Tailwind CSS 3.4** (styling)
- **Todoist REST API v2** (task data)
- **Google Calendar API v3** (calendar data, OAuth2)

## License

See [LICENSE](LICENSE) for details.
