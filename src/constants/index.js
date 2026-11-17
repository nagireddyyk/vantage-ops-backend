export const CATEGORIES = [
  'Desktop Computers',
  'Laptops',
  'Printers',
  'Servers',
  'Storage / NAS',
  'Networking',
  'Monitors & Displays',
  'Accessories & Peripherals',
]
export const MODES = ['buy', 'rent', 'lease']
export const QUOTE_STATUS = [ 'Submitted', 'Assigned', 'Contacted', 'Won', 'Lost', 'Under Review', 'Quote Ready', 'Sent to Customer', 'Accepted', 'Rejected', 'Cancelled', 'Expired', 'Revision Requested', 'PO Sent' ];
export const ORDER_STATUS = [ 'Placed', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled' ];
export const LEASE_STATUS = [ 'Submitted', 'Under Review', 'Pending Approval', 'Lease Offer Sent', 'Approved', 'Active', 'Rejected', 'Cancelled' ];
export const RENTAL_STATUS = [ 'Submitted', 'Under Review', 'Rental Quote Sent', 'Booking Confirmed', 'Ready for Dispatch', 'Active', 'Returned', 'Cancelled' ];
export const TICKET_STATUS = [ 'Open', 'Assigned', 'In Progress', 'Waiting for Customer', 'Waiting for Parts', 'Resolved', 'Closed', 'Reopened' ];
export const WORKFLOW_STATUS = ['Pending', 'Assigned', 'In Progress', 'Closed']
export const USER_ROLES = ['customer', 'admin', 'superAdmin', 'sales']
export const PO_STATUS = ['Submitted', 'Approved', 'Rejected']
export const PRIORITIES = ['Low', 'Medium', 'High']

// Dropdown options are sourced by the frontend from GET /api/config.
// Option values use zero price adjustment until your business pricing is supplied.
// The product's base price and rentPct/leasePct remain the server-side price source.
const choices = (items) => Object.fromEntries(items.map((item) => [item, 0]))

export const OPTIONS = {
  'Desktop Computers': {
    'Requirement Type': choices(['Buy', 'Lease', 'Rent', 'Buyback / Exchange']),
    'Computer Type': choices(['Business Desktop', 'Home Desktop', 'Gaming Desktop', 'Workstation', 'All-in-One', 'Mini PC', 'Thin Client']),
    'Configuration': choices(['Office / Business', 'Student', 'Home', 'Programming', 'Graphic Design', 'Video Editing', 'Engineering', 'Gaming', 'AI / Machine Learning']),
    'Brand': choices(['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Custom Build', 'Other']),
    'Processor Brand': choices(['Intel', 'AMD']),
    'Processor': choices(['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M series']),
    'Generation / Series': choices(['Current generation', 'Previous generation', 'Specify in notes']),
    'RAM': choices(['8 GB', '16 GB', '32 GB', '64 GB', '128 GB+']),
    'RAM Type': choices(['DDR4', 'DDR5', 'ECC RAM']),
    'Storage Type': choices(['HDD', 'SATA SSD', 'M.2 SSD', 'NVMe SSD']),
    'Storage Capacity': choices(['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB+']),
    'Graphics Type': choices(['Integrated', 'NVIDIA', 'AMD', 'Professional Graphics', 'Gaming Graphics']),
    'Graphics Memory': choices(['2 GB', '4 GB', '6 GB', '8 GB', '12 GB+']),
    'Monitor Required': choices(['Yes', 'No']),
    'Monitor Size': choices(['18.5"', '19.5"', '21.5"', '23.8"', '27"', '32"+']),
    'Resolution': choices(['Full HD', 'IPS', '2K', '4K']),
    'Monitor Setup': choices(['Single Monitor', 'Dual Monitor']),
    'Software': choices(['Windows 11 Home', 'Windows 11 Professional', 'Linux', 'No OS', 'Microsoft Office', 'Antivirus', 'Internet Security', 'Total Security']),
  },
  'Laptops': {
    'Requirement': choices(['Buy', 'Lease', 'Rent', 'Exchange']),
    'Usage': choices(['Office / Business', 'Student', 'Home', 'Programming', 'Graphic Design', 'Video Editing', 'Engineering', 'Gaming', 'AI / Machine Learning', 'Travel / Lightweight']),
    'Brand': choices(['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Samsung', 'Apple', 'Microsoft', 'Other']),
    'Processor Brand': choices(['Intel', 'AMD', 'Apple']),
    'Processor': choices(['Intel Core i3', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Intel Core Ultra 5', 'Intel Core Ultra 7', 'Intel Core Ultra 9', 'AMD Ryzen 3', 'AMD Ryzen 5', 'AMD Ryzen 7', 'AMD Ryzen 9', 'Apple M series']),
    'Screen Size': choices(['13"', '14"', '15.6"', '16"', '17"', 'Other']),
    'Display': choices(['HD', 'Full HD', '2K', '2.5K', '4K', 'OLED', 'Touchscreen', 'Non-touch']),
    'RAM': choices(['8 GB', '16 GB', '32 GB', '64 GB', '128 GB+']),
    'Storage': choices(['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD', 'Other']),
    'Graphics': choices(['Integrated', 'NVIDIA RTX', 'NVIDIA GTX', 'AMD Radeon', 'Apple Integrated', 'Professional GPU']),
    'Other Features': choices(['Backlit Keyboard', 'Fingerprint', 'Face Recognition', 'Touchscreen', '360° Convertible', 'Stylus Support', 'Wi-Fi 6/6E', 'Bluetooth', '4G/5G', 'Webcam', 'Number Pad']),
    'Operating System': choices(['Windows 11 Home', 'Windows 11 Professional', 'macOS', 'Linux', 'No OS']),
    'Software': choices(['Microsoft Office', 'Antivirus', 'Internet Security', 'Total Security']),
    'Accessories': choices(['Laptop Bag', 'Mouse', 'Keyboard', 'Docking Station', 'Monitor', 'External HDD/SSD', 'Headset', 'Webcam']),
  },
  'Printers': {
    'Requirement': choices(['Buy', 'Lease', 'Rent', 'Buyback / Exchange']),
    'Print Need': choices(['Documents', 'Invoices', 'Reports', 'Photos', 'Labels', 'Barcodes', 'ID Cards', 'Marketing Material', 'Engineering Drawings']),
    'Printer Type': choices(['Inkjet', 'Laserjet', 'Ink Tank', 'A3 Printers', 'Dot Matrix', 'Thermal', 'Barcode', 'Photo Printer', 'Large Format Printer']),
    'Brand': choices(['HP', 'Canon', 'Epson', 'Brother', 'Samsung', 'Other']),
    'Printing': choices(['Black & White', 'Colour', 'Both']),
    'Function': choices(['Print Only', 'Print + Scan + Copy', 'Print + Scan + Copy + Fax', 'Print + Scan + Copy + Duplex']),
    'Paper Size': choices(['A4', 'A3', 'A2', 'A1', 'A0', 'Legal', 'Letter', 'Custom']),
    'Printing Speed': choices(['Below 20 PPM', '20–30 PPM', '30–40 PPM', '40–60 PPM', '60+ PPM']),
    'Duplex': choices(['Manual', 'Automatic']),
    'Connectivity': choices(['USB', 'Wi-Fi', 'Ethernet', 'Wi-Fi Direct', 'Bluetooth']),
    'RAM': choices(['8 GB', '16 GB', '32 GB', '64 GB']),
    'Storage': choices(['256 GB SSD', '512 GB SSD', '1 TB SSD', '2 TB SSD', 'Other']),
    'Monthly Volume': choices(['<1,000 pages', '1,000–5,000', '5,000–10,000', '10,000–25,000', '25,000+']),
    'Consumables': choices(['Toner', 'Ink Cartridge', 'Ink Tank', 'Ribbon', 'Thermal Roll']),
  },
  'Servers': {
    'Requirement': choices(['File Server', 'Application Server', 'Database Server', 'Virtualization Server', 'Backup Server', 'Mail Server', 'Web Server', 'CCTV Server', 'AI/GPU Server', 'ERP Server', 'Domain Controller']),
    'Server Type': choices(['Tower Server', 'Rack Server', 'Blade Server', 'GPU Server', 'Storage Server']),
    'Brand': choices(['Dell', 'HP', 'Lenovo', 'Supermicro', 'Custom', 'Other']),
    'Processor': choices(['Intel Xeon', 'AMD EPYC', 'Other']),
    'CPU': choices(['1 CPU', '2 CPU', '4 CPU']),
    'CPU Cores': choices(['4', '8', '12', '16', '24', '32', '48', '64+']),
    'RAM': choices(['16 GB', '32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB+']),
    'Storage': choices(['NAS', 'SATA', 'SAS', 'SSD', 'NVMe']),
    'Drive Type': choices(['HDD', 'SSD', 'NVMe']),
    'Capacity': choices(['480 GB', '960 GB', '1.92 TB', '3.84 TB', '7.68 TB', '10 TB+']),
    'RAID': choices(['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10', 'Hardware RAID']),
    'Network': choices(['1 GbE', '2.5 GbE', '10 GbE', '25 GbE', '40 GbE', '100 GbE']),
    'Power Supply': choices(['Single PSU', 'Redundant PSU']),
    'Operating System': choices(['Windows Server', 'Linux', 'VMware', 'Proxmox', 'Hyper-V', 'No OS']),
    'Warranty / Support': choices(['1 Year', '3 Years', '5 Years', 'On-site Support', '24×7 Support']),
  },
  'Storage / NAS': {
    'Requirement': choices(['File Storage', 'Backup', 'CCTV', 'Media Storage', 'Virtualization', 'Business Storage']),
    'NAS Type': choices(['2 Bay', '4 Bay', '6 Bay', '8 Bay', '12 Bay+']),
    'Brand': choices(['Synology', 'QNAP', 'Dell', 'HP', 'Other']),
    'Drive Type': choices(['HDD', 'SSD', 'NVMe', 'SATA', 'SAS']),
    'Capacity': choices(['4 TB', '8 TB', '16 TB', '32 TB', '50 TB+']),
    'RAID': choices(['RAID 0', 'RAID 1', 'RAID 5', 'RAID 6', 'RAID 10', 'Hardware RAID']),
    'Network': choices(['1 GbE', '2.5 GbE', '10 GbE', '25 GbE', '40 GbE', '100 GbE']),
  },
  'Networking': {
    'Usage': choices(['Home', 'Small Office', 'Enterprise', 'Data Centre', 'Wi-Fi', 'CCTV Network']),
    'Product': choices(['Router', 'Switch', 'Managed Switch', 'Unmanaged Switch', 'Firewall', 'Access Point', 'Wi-Fi Mesh', 'Network Rack', 'SFP Module', 'Network Card']),
    'Brand': choices(['Cisco', 'TP-Link', 'Ubiquiti', 'D-Link', 'Netgear', 'Fortinet', 'Other']),
    'Switch Ports': choices(['5 Port', '8 Port', '16 Port', '24 Port', '48 Port']),
    'Speed': choices(['1 GbE', '2.5 GbE', '10 GbE', '25 GbE', '40 GbE', '100 GbE']),
    'PoE': choices(['No PoE', 'PoE', 'PoE+', 'PoE++']),
  },
  'Monitors & Displays': {
    'Usage': choices(['Office', 'Gaming', 'Design', 'Video Editing', 'Trading', 'CCTV', 'Digital Signage']),
    'Size': choices(['21.5"', '23.8"', '27"', '32"', '34"', '43"', '55"+']),
    'Resolution': choices(['Full HD', '2K', '4K', '5K', '8K']),
    'Panel': choices(['IPS', 'VA', 'OLED', 'LED']),
    'Refresh Rate': choices(['60 Hz', '75 Hz', '100 Hz', '144 Hz', '165 Hz', '240 Hz+']),
    'Brand': choices(['Dell', 'HP', 'Lenovo', 'ASUS', 'Acer', 'Samsung', 'LG', 'Other']),
  },
  'Accessories & Peripherals': {
    'Category': choices(['Keyboard', 'Mouse', 'Webcam', 'Headset', 'Speakers', 'UPS', 'Power Supply', 'Docking Station', 'Laptop Bag', 'External Storage', 'Pen Drive', 'Memory Card', 'Cables', 'Adapters', 'Chargers']),
    'Brand': choices(['Dell', 'HP', 'Lenovo', 'Logitech', 'Samsung', 'SanDisk', 'APC', 'Other']),
    'Connectivity': choices(['Wired USB', 'Wireless', 'Bluetooth', 'USB-C', 'HDMI', 'DisplayPort']),
  },
}

// ---- Helpers for category-specific product fields ----
// Fields that duplicate top-level product columns or the quote `mode`.
export const BRAND_FIELD = 'Brand'
export const REQUIREMENT_FIELDS = ['Requirement', 'Requirement Type']
// Field names the configurator exposes for a category, e.g. ['Requirement Type', 'Computer Type', ...].
export const categoryFields = (category) => Object.keys(OPTIONS[category] || {})
