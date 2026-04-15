# Network Simulator - macOS Installation Guide

## Quick Install (3 steps)

### Step 1: Install dependencies

Open Terminal and run:

```bash
brew install gns3-server vpcs
```

If you don't have Homebrew, install it first:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Copy Network Simulator

Copy `NetworkSimulator.app` anywhere you want (Desktop, Applications, etc.)

### Step 3: Run

Double-click `NetworkSimulator.app` — it will start the GNS3 server automatically.

Or from Terminal:
```bash
gns3server --local --port 3080 &
open NetworkSimulator.app
```

---

## Troubleshooting

### "App is damaged" or won't open
Run in Terminal:
```bash
xattr -cr /path/to/NetworkSimulator.app
```

### Server not connecting
```bash
gns3server --local --port 3080
```
Then open the app.
