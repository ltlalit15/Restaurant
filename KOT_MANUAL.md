# Kitchen Order Ticket (KOT) System Manual

## Overview
The KOT system automatically generates and prints kitchen order tickets when orders are created in the POS system. This manual provides instructions for kitchen staff and administrators.

## For Kitchen Staff

### Loading Thermal Paper
1. **Open the printer cover** by pressing the release button
2. **Insert the paper roll** with the paper feeding from the bottom
3. **Pull out about 6 inches** of paper and close the cover
4. **Press the feed button** to advance the paper and ensure proper loading

### Checking Printer Connection
1. Look for the **green status light** on the printer
2. If the light is red or blinking:
   - Check the power cable connection
   - Verify the Wi-Fi connection (network printers)
   - Check for paper jams or low paper

### Understanding KOT Slips
Each KOT slip contains:
- **Order Number**: Unique identifier for tracking
- **Date & Time**: When the order was placed
- **Table Number**: Customer location (for dine-in orders)
- **Customer Name**: If provided
- **Order Type**: DINE IN, TAKEAWAY, or DELIVERY
- **Items**: List with quantities and special instructions
- **Special Instructions**: Customer requests or allergies
- **Station**: Which kitchen station should prepare the order

### Order Types
- **DINE IN**: Customer eating at the restaurant
- **TAKEAWAY**: Customer picking up the order
- **DELIVERY**: Order being delivered to customer

### Reprinting Orders
1. Go to the **Orders Management** screen
2. Find the order in the **Recent Orders** list
3. Click the **"Reprint"** button next to the order
4. The KOT will be sent to the appropriate printer

## For Administrators

### Adding New Printers
1. Navigate to **Admin Dashboard > Printer Setup**
2. Click **"Add Printer"** button
3. Fill in the printer details:
   - **Name**: Descriptive name (e.g., "Kitchen Printer 01")
   - **Type**: Kitchen Printer, Bar Printer, or Receipt Printer
   - **IP Address**: Network IP of the printer
   - **Port**: Usually 9100 for ESC/POS printers
   - **Paper Size**: 80mm (standard) or 58mm (compact)
4. Click **"Add Printer"** to save

### Testing Printers
1. In the **Printer Setup** screen, find your printer
2. Click the **"Test Print"** button
3. A test slip should print with current date/time
4. If the test fails, check:
   - IP address and port settings
   - Network connectivity
   - Printer power and paper

### Printer Assignment
- **Food items** automatically route to **Kitchen Printers**
- **Drink items** automatically route to **Bar Printers**
- **Game items** route to **Game Zone Printers**

### Troubleshooting

#### Printer Not Responding
1. Check power connection
2. Verify network settings (IP/Port)
3. Test network connectivity
4. Restart the printer
5. Check for paper jams

#### Poor Print Quality
1. Check paper quality and type
2. Clean the print head
3. Adjust print density settings
4. Replace thermal paper if old

#### Orders Not Printing
1. Verify printer is enabled in Printer Setup
2. Check printer assignment for menu categories
3. Test printer connection
4. Check for error messages in the system

#### Network Connection Issues
1. Verify printer IP address
2. Check Wi-Fi connection
3. Ping the printer from the POS system
4. Restart network equipment if needed

### Maintenance Schedule
- **Daily**: Check paper levels and print quality
- **Weekly**: Clean printer exterior and check connections
- **Monthly**: Clean print head and check for wear
- **Quarterly**: Update printer firmware if available

## Emergency Procedures

### If All Printers Fail
1. Use the **manual order tracking** system
2. Write orders on paper tickets
3. Contact IT support immediately
4. Continue service with manual processes

### If Only One Printer Fails
1. Temporarily route all orders to working printers
2. Use the **reprint function** for missed orders
3. Fix or replace the failed printer when possible

## Contact Information
- **IT Support**: [Your IT contact]
- **Printer Vendor**: [Printer support contact]
- **System Administrator**: [Admin contact]

---

*This manual should be kept near all kitchen stations and updated when system changes are made.*
