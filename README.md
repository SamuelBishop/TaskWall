# TaskWall

A minimalist, wall-mounted dashboard that displays your **Todoist** tasks in a clean, glanceable format. Designed for a Raspberry Pi with a 7-inch display (1280×720).

![Dark Mode Dashboard](https://img.shields.io/badge/display-1280×720-blue) ![React](https://img.shields.io/badge/react-19-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.7-blue) ![Vite](https://img.shields.io/badge/vite-6-purple)

## Features

- **3-column layout**: Overdue | Today | Upcoming
- **Todoist integration** via REST API v2
- **Auto-refresh** every 5 minutes
- **Dark mode** optimized for always-on displays
- **High-contrast, large typography** readable from 3–6 feet
- **1280×720 fixed container** for accurate Pi display simulation during development
- **Physical-size preview** with calibration slider to simulate the actual 7″ screen

## Prerequisites

- Node.js 18+ and npm
- A Todoist account (free or Pro)
- A Todoist API token

## Todoist API Setup

1. Open [Todoist](https://todoist.com) and log in
2. Go to **Settings → Integrations → Developer**
3. Copy your **API token**

> Your API token gives full access to your Todoist account. Keep it secret.

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd TaskWall

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

## Configuration

Edit the `.env` file with your Todoist API token:

```env
VITE_TODOIST_API_TOKEN=your-todoist-api-token-here
```

> **Security Note**: Never commit your `.env` file. It is already included in `.gitignore`.

## Development

```bash
npm run dev
```

The app opens at `http://localhost:3000`. During development, the UI renders inside a fixed 1280×720 container centered on the page, simulating the Pi display.

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder — a static site ready for deployment.

## Deploying to Raspberry Pi

This guide is for a **Raspberry Pi 5** with the **Raspberry Pi Touch Display 2** (1280×720). The app is hosted on Vercel and loaded in Chromium kiosk mode — no local build or web server needed.

### 1. Flash the OS

Use [Raspberry Pi Imager](https://www.raspberrypi.com/software/) to flash **Raspberry Pi OS (64-bit)** (the Desktop variant) to your SD card or USB drive.

In the Imager customisation screen, configure:

- **Hostname**: `TaskWall`
- **Enable SSH** (password authentication)
- **Username / password**
- **Wi-Fi** credentials

### 2. SSH in and install dependencies

```bash
ssh taskwall@TaskWall.local
```

> **⚠️ Known issue (Raspberry Pi OS Trixie, Dec 2025 image):** Running `sudo apt full-upgrade` updates the kernel/compositor and breaks the Touch Display 2 touchscreen rotation mapping. To work around this, only upgrade Chromium — do **not** run `full-upgrade`.

```bash
sudo apt update
sudo apt install --only-upgrade chromium
sudo apt install -y fonts-noto-color-emoji kanshi wlr-randr
```

### 3. Rotate the display

The Touch Display 2 defaults to portrait (720×1280). The display output is named `DSI-2` on the Pi 5. To verify:

```bash
export WAYLAND_DISPLAY=wayland-0
wlr-randr
```

Make the rotation persistent with kanshi:

```bash
mkdir -p ~/.config/kanshi
cat > ~/.config/kanshi/config << 'EOF'
profile {
  output DSI-2 mode 720x1280 transform 270
}
EOF
```

> Use `transform 270` or `transform 90` depending on how the display is physically mounted. Test with `wlr-randr --output DSI-2 --transform 270` first to confirm the correct orientation.

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

Disable the default keyring prompt (prevents a popup on boot):

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

The Pi should now boot straight into the desktop, rotate to landscape, and launch TaskWall in fullscreen kiosk mode.

### 7. Display brightness & sleep control

The display automatically dims when idle during the day and turns off at night, waking on touch. This uses `swayidle` (which integrates with the Wayland compositor) and cron for scheduling. The backlight is at `/sys/class/backlight/11-0045/`.

#### Install swayidle

```bash
sudo apt install -y swayidle
```

#### Set timezone

```bash
sudo timedatectl set-timezone America/Denver
```

This handles MDT ↔ MST transitions automatically.

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

**Daytime dimmer** — dims to brightness 2 after 60 seconds idle, restores to 31 on touch. Runs at boot via autostart.

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

**Night sleep** — kills the daytime dimmer, then turns the backlight off after 15 seconds idle. Touch wakes the screen at brightness 8 for 15 seconds before turning off again. Started by cron at 9 PM.

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

**Wake** — kills night mode, restores full brightness, and restarts the daytime dimmer. Started by cron at 6 AM.

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
| **6 AM – 9 PM** | Dims to brightness 2 after 60s | Restores to full brightness (31) |
| **9 PM – 6 AM** | Backlight off after 15s | Wakes at brightness 8 for 15s |

## Project Structure

```
src/
├── api/
│   └── todoist.ts         # Todoist REST API v2 client
├── components/
│   ├── ErrorBanner.tsx    # Dismissible error display
│   ├── Header.tsx         # Top bar with date & controls
│   ├── SignInScreen.tsx   # Setup instructions screen
│   ├── TaskCard.tsx       # Individual task display
│   └── TaskSection.tsx    # Column with header + task list
├── hooks/
│   └── useTasks.ts        # Data fetching & auto-refresh hook
├── utils/
│   └── date.ts            # Date formatting helpers
├── types.ts               # TypeScript interfaces
├── App.tsx                # Main app layout
├── main.tsx               # Entry point
└── index.css              # Tailwind + global styles
```

## Tech Stack

- **React 19** + **TypeScript 5.7**
- **Vite 6** (build tool)
- **Tailwind CSS 3.4** (styling)
- **Todoist REST API v2** (data source)

## License

See [LICENSE](LICENSE) for details.
