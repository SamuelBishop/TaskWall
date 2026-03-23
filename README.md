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

### 1. Build the app

```bash
npm run build
```

### 2. Transfer to the Pi

```bash
scp -r dist/ pi@<pi-ip>:~/taskwall/
```

### 3. Serve on the Pi

Install a lightweight static server:

```bash
# On the Pi
sudo apt install -y nginx
sudo cp -r ~/taskwall/dist/* /var/www/html/
```

### 4. Launch in Kiosk Mode

Create an autostart script:

```bash
# /etc/xdg/lxsession/LXDE-pi/autostart (add this line)
@chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost
```

Or run manually:

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars http://localhost
```

### 5. Keep the display on

Disable screen blanking:

```bash
sudo raspi-config
# → Display Options → Screen Blanking → Disable
```

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
