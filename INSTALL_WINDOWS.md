# Network Simulator - Windows Installation Guide
# Tor Simulyatory - Windows gurnamak boyunca gollanma

## Quick Install (3 steps)
## Calt gurnamak (3 adim)

### Step 1: Install GNS3 Server
### 1-nji adim: GNS3 Serweri gurnap alyn

1. Download GNS3 from: https://github.com/GNS3/gns3-gui/releases
   - Download the file: `GNS3-2.2.49-all-in-one.exe`
2. Run the installer
3. During installation, make sure these are checked:
   - **GNS3 Server** (required)
   - **VPCS** (required - for virtual PCs)
   - **WinPCAP** or **Npcap** (required - for network capture)
   - You do NOT need SolarWinds, Wireshark, or other optional components
4. Finish the installation

### Step 2: Copy Network Simulator
### 2-nji adim: Tor Simulyatory-ny kopyalap alyn

1. Copy the `NetworkSimulator` folder to your computer (e.g., `C:\NetworkSimulator\`)
2. Copy the `examples` folder to `C:\NetworkSimulator\examples\`

### Step 3: Run
### 3-nji adim: Ishlap baslan

1. Double-click `NetworkSimulator.exe`
2. The guide dialog will appear with all 12 test cases
3. Go to **File > Open Project** and select a case from `examples\`
4. Click the green **Play** button to start the simulation
5. Double-click any PC to open its console
6. Use `ping` to test network connectivity

---

## Troubleshooting / Kynchylyklar

### "Server not found" or "Connection refused"
The GNS3 server must be running. The application starts it automatically, but if it fails:
1. Open Command Prompt
2. Run: `gns3server --local --port 3080`
3. Then start NetworkSimulator.exe

### "VPCS not found"
1. Make sure VPCS was installed with GNS3 (Step 1)
2. Check that `C:\Program Files\GNS3\vpcs.exe` exists
3. If installed elsewhere, go to **Edit > Preferences > VPCS** and set the correct path

### Console doesn't open
1. Make sure all nodes are started (green Play button)
2. Check that Telnet is available (Windows 10/11: Enable via "Turn Windows features on or off" > "Telnet Client")

---

## What's Inside / Icindakiler

| Folder/File | Description |
|------------|-------------|
| `NetworkSimulator.exe` | Main application (custom GNS3 GUI) |
| `examples/` | 12 pre-built network simulation projects |
| `branding/` | University logo and settings |
| `resources/` | Icons and symbols for network devices |

## 12 Test Cases / 12 Synag

| # | Name | What it tests |
|---|------|--------------|
| 1 | Basic Ping | 2 PCs + 1 Switch |
| 2 | Subnet Isolation | Different subnets can't communicate |
| 3 | VLAN Isolation | VLANs isolate same-subnet traffic |
| 4 | Hub vs Switch | Broadcast vs unicast behavior |
| 5 | Star Topology | 6 PCs + 1 central switch |
| 6 | Multi-Switch | 2 switches with uplink |
| 7 | Ring Topology | 4 switches in a ring |
| 8 | VLAN Trunk | Trunk carries multiple VLANs |
| 9 | Tree Topology | Hierarchical 3-level network |
| 10 | Broadcast Domain | Hub chain = one broadcast domain |
| 11 | Network Segmentation | Departments isolated by subnet |
| 12 | Full Mesh | Every switch connected to every other |
