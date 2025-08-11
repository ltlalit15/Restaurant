# Thermal Printer Setup Guide

## Compatible Printers
- Epson TM-T20II (80mm)
- Epson TM-T82II (80mm)
- Epson TM-T88V (80mm)
- Star TSP143III (80mm)
- Any ESC/POS compatible thermal printer

## Network Setup

### 1. Connect Printer to Wi-Fi
1. Power on your thermal printer
2. Press and hold the FEED button while powering on to enter setup mode
3. Print network configuration page
4. Connect printer to your Wi-Fi network using printer's built-in setup
5. Note down the IP address assigned to the printer

### 2. Configure in POS System
1. Go to Admin Dashboard → Printer Setup
2. Click "Add Printer"
3. Fill in details:
   - **Name**: Kitchen Printer 01
   - **Type**: Kitchen Printer
   - **IP Address**: 192.168.1.100 (your printer's IP)
   - **Port**: 9100 (standard ESC/POS port)
   - **Paper Size**: 80mm
4. Click "Test Print" to verify connection
5. Save printer configuration

### 3. Category Assignment
1. Go to Admin Dashboard → Business Settings
2. Under "KOT Settings", configure:
   - Auto-print: Enabled
   - Duplicate slips: As needed
   - Paper size: Match your printer

## Troubleshooting

### Printer Not Responding
- Check power and paper
- Verify IP address is correct
- Ensure printer and POS are on same network
- Try pinging printer IP from computer

### Poor Print Quality
- Check thermal paper quality
- Clean print head with alcohol wipe
- Adjust print density in printer settings

### Network Issues
- Restart printer and router
- Check firewall settings
- Verify port 9100 is open

## Paper Loading
1. Open printer cover
2. Insert paper roll with paper feeding from bottom
3. Pull out 6 inches of paper
4. Close cover firmly
5. Press FEED button to test

## Daily Maintenance
- Check paper levels
- Clean exterior with damp cloth
- Verify print quality
- Test network connection
