# n8n Installation & Setup Guide - Student Management System

**Document Version:** 1.0  
**Last Updated:** June 2024  
**Status:** Free Version Setup

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Install Docker & n8n](#part-1-install-docker--n8n)
3. [Part 2: Configure Credentials](#part-2-configure-credentials)
4. [Part 3: Create Workflow 1 - Fee Payment Reminder](#part-3-create-workflow-1---fee-payment-reminder)
5. [Part 4: Create Workflow 2 - Assignment Deadline Notification](#part-4-create-workflow-2---assignment-deadline-notification)
6. [Part 5: Create Workflow 3 - Low Attendance Alert](#part-5-create-workflow-3---low-attendance-alert)
7. [Part 6: Activate Workflows](#part-6-activate-workflows)
8. [Part 7: Monitor & Test](#part-7-monitor--test)
9. [Part 8: React Integration](#part-8-react-integration)
10. [Troubleshooting](#troubleshooting)
11. [Maintenance & Backup](#maintenance--backup)

---

## Prerequisites

### System Requirements
- **Operating System:** Windows 10+, macOS 10.15+, or Linux
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** 2GB free
- **Internet:** Required for API connections

### Required Accounts
- **Supabase Account** (Free tier) - https://app.supabase.com
- **Gmail Account** (or SendGrid)
- **Twilio Account** (Optional - for SMS)

### Knowledge Required
- Basic command line usage
- Understanding of Docker basics
- Familiarity with your Supabase database structure

---

# PART 1: Install Docker & n8n

## Step 1.1: Install Docker

### For Windows

1. Go to https://www.docker.com/products/docker-desktop
2. Click **Download for Windows**
3. Run the installer
4. Follow installation wizard
5. **Restart your computer** (important!)

### For macOS

1. Go to https://www.docker.com/products/docker-desktop
2. Click **Download for Mac**
3. Choose:
   - **Apple Silicon** (M1/M2/M3 chips)
   - **Intel Chip** (older Macs)
4. Run the installer
5. **Restart your computer**

### For Linux (Ubuntu/Debian)

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Restart your computer
sudo reboot
```

### Verify Installation

Open terminal/PowerShell and run:

```bash
docker --version
```

**Expected Output:**
```
Docker version 24.0.0, build abcdef
```

If you see a version number, ✅ Docker is installed correctly.

---

## Step 1.2: Create n8n Project Directory

### Windows (PowerShell)

```powershell
# Create directory
New-Item -ItemType Directory -Path "C:\n8n-school" -Force

# Navigate to directory
Set-Location "C:\n8n-school"

# Verify
Get-Location
```

### macOS/Linux (Terminal)

```bash
# Create directory
mkdir -p ~/n8n-school

# Navigate
cd ~/n8n-school

# Verify
pwd
```

---

## Step 1.3: Create Configuration Files

### Create `.env` File

**Windows (PowerShell):**
```powershell
New-Item -ItemType File -Path "C:\n8n-school\.env" -Force
```

**macOS/Linux:**
```bash
touch ~/.n8n-school/.env
```

**Content for `.env` file:**

```bash
# n8n Basic Auth
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=SecurePassword123!

# Encryption
N8N_ENCRYPTION_KEY=your_encryption_key_min_32_chars_long_abcdefghij12345

# Host Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_WEBHOOK_URL=http://localhost:5678/

# Timezone (change to your timezone)
GENERIC_TIMEZONE=America/New_York

# Database (optional - for later)
# DB_SQLITE_PATH=/home/node/.n8n/database.sqlite
```

> ⚠️ **IMPORTANT:** Save your password somewhere safe! You'll need it to login.

### Create `docker-compose.yml` File

**Windows (PowerShell):**
```powershell
New-Item -ItemType File -Path "C:\n8n-school\docker-compose.yml" -Force
```

**macOS/Linux:**
```bash
touch ~/n8n-school/docker-compose.yml
```

**Content for `docker-compose.yml`:**

```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-school
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=SecurePassword123!
      - N8N_ENCRYPTION_KEY=your_encryption_key_min_32_chars_long_abcdefghij12345
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - N8N_WEBHOOK_URL=http://localhost:5678/
      - GENERIC_TIMEZONE=America/New_York
    volumes:
      - n8n_data:/home/node/.n8n
    restart: unless-stopped
    networks:
      - n8n-network

networks:
  n8n-network:
    driver: bridge

volumes:
  n8n_data:
    driver: local
```

---

## Step 1.4: Start n8n

### Windows (PowerShell)

```powershell
# Navigate to project directory
Set-Location "C:\n8n-school"

# Start Docker containers
docker-compose up -d

# Wait 30 seconds for startup

# Check status
docker-compose ps
```

### macOS/Linux (Terminal)

```bash
# Navigate to project directory
cd ~/n8n-school

# Start Docker containers
docker-compose up -d

# Wait 30 seconds for startup

# Check status
docker-compose ps
```

**Expected Output:**
```
NAME          STATUS              PORTS
n8n-school    Up 2 minutes        0.0.0.0:5678->5678/tcp
```

### Check if Running Properly

```bash
# View logs
docker-compose logs n8n

# Should see: "🟢 Start n8n with --help" and other startup messages
```

---

## Step 1.5: Access n8n Dashboard

1. Open your web browser (Chrome, Firefox, Edge, Safari)
2. Go to: **http://localhost:5678**
3. You should see the n8n login page

**Login with:**
- Username: `admin`
- Password: `SecurePassword123!` (or your password from .env)

✅ **If you see the dashboard, n8n is running successfully!**

---

# PART 2: Configure Credentials

## Step 2.1: Add Supabase Credentials

### Get Your Supabase Keys

1. Go to https://app.supabase.com
2. Sign in with your account
3. Select your **student-management** project
4. Go to **Settings** → **API** (left sidebar)
5. Copy these:
   - **Project URL** (starts with `https://`)
   - **Service Role Key** (starts with `eyJhbGc...`)

> ⚠️ Keep Service Role Key secret!

### Add Credentials to n8n

1. In n8n dashboard, click **Credentials** (bottom left)
2. Click **Create New**
3. Search for **Supabase**
4. Click **Supabase**
5. Fill in:

| Field | Value |
|-------|-------|
| **Credential Name** | Supabase School |
| **Host** | (paste Project URL) |
| **Service Role Key** | (paste Service Role Key) |

6. Click **Save**

### Test Connection

1. Still in credentials page
2. Find **Supabase School** credential
3. Click **Test**
4. Should see: ✅ **Connection successful**

---

## Step 2.2: Add Gmail Credentials (for Email)

### Generate Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
2. Sign in if needed
3. Select **Mail** and **Windows Computer** (or your device)
4. Google generates a 16-character password
5. Copy it (you won't see it again!)

Example: `abcd efgh ijkl mnop`

### Add to n8n

1. In n8n, click **Credentials** → **Create New**
2. Search for **Gmail**
3. Click **Gmail**
4. Fill in:

| Field | Value |
|-------|-------|
| **Credential Name** | Gmail School |
| **Email** | your_email@gmail.com |
| **Password** | (paste the 16-char app password) |

5. Click **Save**

### Test Connection

1. Find **Gmail School** credential
2. Click **Test**
3. Should see: ✅ **Connection successful**

---

## Step 2.3: Add Twilio Credentials (Optional - for SMS)

> 💡 You can skip this for now. Email reminders work fine without SMS!

### Get Twilio Keys (if using)

1. Go to https://www.twilio.com/console
2. Sign in
3. Copy:
   - **Account SID**
   - **Auth Token**

### Add to n8n

1. Click **Credentials** → **Create New**
2. Search for **Twilio**
3. Fill in:

| Field | Value |
|-------|-------|
| **Credential Name** | Twilio School |
| **Account SID** | (paste) |
| **Auth Token** | (paste) |
| **From Number** | Your Twilio phone number |

4. Click **Save**

---

# PART 3: Create Workflow 1 - Fee Payment Reminder

## Overview

```
Trigger: Daily at 8:00 AM
├─ Query Supabase: Get pending fees
├─ Calculate: Days until due
├─ Filter: Only fees needing reminder
├─ For Each Fee: Send email to parent
└─ Log: Record in activity_logs
```

## Step 3.1: Create New Workflow

1. Click **Workflows** (top left)
2. Click **Create New** (or **+** button)
3. Name: `Fee Payment Reminder`
4. Press Enter

## Step 3.2: Add Schedule Trigger

1. Click **+** button in canvas (center area)
2. Search: **Schedule**
3. Click **Cron**
4. Configure:
   - **Mode:** Every day fixed time
   - **Hour:** 8
   - **Minute:** 0
   - **Timezone:** America/New_York
5. Click **Save**

## Step 3.3: Add Supabase Query Node

1. Click **+** to add node
2. Search: **Supabase**
3. Click **Supabase**
4. Configure:
   - **Credential:** Supabase School
   - **Resource:** Execute Query
   - **Query:** Copy below

**SQL Query:**

```sql
SELECT 
  f.id,
  f.student_id,
  f.amount,
  f.due_date,
  f.status,
  f.description,
  f.invoice_number,
  s.full_name as student_name,
  s.email as student_email,
  p.full_name as parent_name,
  p.email as parent_email
FROM fees f
JOIN profiles s ON f.student_id = s.id
LEFT JOIN profiles p ON (
  SELECT id FROM profiles WHERE id = (
    SELECT parent_id FROM students WHERE id = f.student_id LIMIT 1
  )
) ON true
WHERE (f.status = 'pending' OR f.status = 'overdue')
AND f.due_date IS NOT NULL
ORDER BY f.due_date ASC;
```

5. Click **Save**

## Step 3.4: Add Code Node (Calculate Days)

1. Click **+** to add node
2. Search: **Code**
3. Click **Code**
4. Make sure **Language:** JavaScript
5. Clear default code and paste:

```javascript
return $input.getAll().map(item => {
  const due = new Date(item.json.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  
  const daysUntilDue = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  
  let reminderType = 'none';
  if (daysUntilDue <= 0) reminderType = 'overdue';
  else if (daysUntilDue === 1) reminderType = '1-day';
  else if (daysUntilDue <= 7) reminderType = '7-day';
  
  return {
    ...item.json,
    daysUntilDue: daysUntilDue,
    reminderType: reminderType
  };
});
```

6. Click **Save**

## Step 3.5: Add Filter Node

1. Click **+** to add node
2. Search: **Filter**
3. Click **Filter**
4. Configure:
   - **Condition:** Keep items where:
   - **Field:** reminderType
   - **Operator:** Is not equal to
   - **Value:** none
5. Click **Save**

## Step 3.6: Add Loop Node

1. Click **+** to add node
2. Search: **Item Lists**
3. Click **Item Lists**
4. Configure:
   - **Mode:** Split Out
5. Click **Save**

## Step 3.7: Add Email Node

1. Click **+** to add node
2. Search: **Send Email**
3. Click **Send Email**
4. Configure:

| Field | Value |
|-------|-------|
| **Credential** | Gmail School |
| **From Email** | your_email@gmail.com |
| **To Email** | Click **ABC** → Paste: `{{ $node["Item Lists"].json.parent_email }}` |
| **Subject** | Click **ABC** → Paste: `{{ $node["Item Lists"].json.reminderType === 'overdue' ? '🚨 URGENT: Overdue Fee' : '📢 Fee Due Soon' }}` |
| **Email Type** | HTML |
| **HTML Body** | (See below) |

**HTML Body to paste:**

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .danger { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px; border-bottom: 1px solid #ddd; }
    .btn { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h2>NEXUS - Fee Payment Reminder</h2></div>
    <p>Dear {{ $node["Item Lists"].json.parent_name }},</p>
    
    {{ $node["Item Lists"].json.reminderType === 'overdue' ? 
      '<div class="danger"><strong>⚠️ OVERDUE PAYMENT</strong><br>Payment is now OVERDUE. Please pay immediately.</div>' 
      : 
      '<div class="warning"><strong>📌 DUE SOON</strong><br>Payment is due on ' + new Date($node["Item Lists"].json.due_date).toLocaleDateString() + '</div>' 
    }}
    
    <p><strong>Fee Details:</strong></p>
    <table>
      <tr>
        <td><strong>Student Name</strong></td>
        <td>{{ $node["Item Lists"].json.student_name }}</td>
      </tr>
      <tr>
        <td><strong>Amount Due</strong></td>
        <td><strong style="color: #ef4444;">${{ Number($node["Item Lists"].json.amount).toFixed(2) }}</strong></td>
      </tr>
      <tr>
        <td><strong>Due Date</strong></td>
        <td>{{ new Date($node["Item Lists"].json.due_date).toLocaleDateString() }}</td>
      </tr>
      <tr>
        <td><strong>Description</strong></td>
        <td>{{ $node["Item Lists"].json.description }}</td>
      </tr>
      <tr>
        <td><strong>Invoice</strong></td>
        <td>{{ $node["Item Lists"].json.invoice_number }}</td>
      </tr>
    </table>
    
    <center>
      <a href="https://yourschool.com/portal/finance" class="btn">Pay Online Now</a>
    </center>
    
    <p><strong>Payment Methods:</strong></p>
    <ul>
      <li>📱 Online: Portal</li>
      <li>🏦 Bank Transfer: See invoice</li>
      <li>💳 Card: Call school</li>
    </ul>
    
    <p>Thank you,<br>Nexus School Management System</p>
  </div>
</body>
</html>
```

5. Click **Save**

## Step 3.8: Test Fee Reminder Workflow

1. Click **Execute** button (top right)
2. Wait 10 seconds
3. Check:
   - ✅ No red errors
   - ✅ Email received in inbox
   - ✅ Data looks correct

4. Go to **Executions** tab (left side)
5. Verify successful run

✅ **Workflow 1 is ready!**

---

# PART 4: Create Workflow 2 - Assignment Deadline Notification

## Overview

```
Trigger: 4 times daily (9 AM, 12 PM, 6 PM, 9 PM)
├─ Query Assignments: Due in next 24 hours
├─ Get Students in Class
├─ Get Submissions: Who submitted
├─ Filter: Non-submitted students
├─ Send Reminder: To each student
└─ Notify Teacher: Pending count
```

## Step 4.1: Create Workflow

1. Click **Workflows** → **Create New**
2. Name: `Assignment Deadline Notification`

## Step 4.2: Add Schedule Trigger

1. Click **+**
2. Search: **Schedule**
3. Configure:
   - **Mode:** Every day, specific hours
   - **Hours:** 9,12,18,21 (separate by comma)
   - **Minute:** 0
4. Click **Save**

## Step 4.3: Add Query Assignments Node

1. Click **+**
2. Search: **Supabase**
3. Configure:
   - **Credential:** Supabase School
   - **Query:**

```sql
SELECT 
  a.id,
  a.title,
  a.deadline,
  a.class_id,
  a.created_by,
  a.subject_name,
  c.grade_name,
  c.section
FROM assignments a
JOIN classes c ON a.class_id = c.id
WHERE a.deadline > NOW()
AND a.deadline < NOW() + INTERVAL '24 hours'
ORDER BY a.deadline ASC;
```

4. Click **Save**

## Step 4.4: Add Calculate Hours Node

1. Click **+**
2. Search: **Code**
3. Paste:

```javascript
return $input.getAll().map(item => {
  const deadline = new Date(item.json.deadline);
  const now = new Date();
  const hours = Math.ceil((deadline - now) / (1000 * 60 * 60));
  
  let timeLeft = '';
  if (hours > 24) timeLeft = Math.floor(hours / 24) + ' days';
  else if (hours > 0) timeLeft = hours + ' hours';
  else timeLeft = 'Now!';
  
  return {
    ...item.json,
    hoursRemaining: hours,
    timeLeft: timeLeft
  };
});
```

4. Click **Save**

## Step 4.5: Add Split Items Node

1. Click **+**
2. Search: **Item Lists**
3. Configure:
   - **Mode:** Split Out
4. Click **Save**

## Step 4.6: Add Get Class Students

1. Click **+**
2. Search: **Supabase**
3. Query:

```sql
SELECT s.id, s.student_id, p.email, p.full_name 
FROM students s 
JOIN profiles p ON s.id = p.id 
WHERE s.class_id = '{{ $node["Item Lists"].json.class_id }}'
AND s.status = 'active'
ORDER BY p.full_name;
```

4. Click **Save**

## Step 4.7: Add Get Submissions

1. Click **+**
2. Search: **Supabase**
3. Query:

```sql
SELECT student_id FROM submissions 
WHERE assignment_id = '{{ $node["Item Lists"].json.id }}';
```

4. Click **Save**

## Step 4.8: Add Filter Non-Submitted

1. Click **+**
2. Search: **Code**
3. Paste:

```javascript
const submitted = $node["Get Submissions"].json.map(s => s.student_id);
const allStudents = $node["Get Class Students"].json;
const nonSubmitted = allStudents.filter(s => !submitted.includes(s.id));

return nonSubmitted.map(s => ({
  ...s,
  assignmentId: $node["Item Lists"].json.id,
  assignmentTitle: $node["Item Lists"].json.title,
  deadline: $node["Item Lists"].json.deadline,
  timeLeft: $node["Calculate Hours"].json.timeLeft,
  teacherId: $node["Item Lists"].json.created_by,
  subjectName: $node["Item Lists"].json.subject_name
}));
```

4. Click **Save**

## Step 4.9: Add Split Students

1. Click **+**
2. Search: **Item Lists**
3. Mode: **Split Out**
4. Click **Save**

## Step 4.10: Add Send Student Email

1. Click **+**
2. Search: **Send Email**
3. Configure:

| Field | Value |
|-------|-------|
| **Credential** | Gmail School |
| **To Email** | `{{ $node["Split Students"].json.email }}` |
| **Subject** | `⏰ Assignment Due: {{ $node["Split Students"].json.assignmentTitle }}` |
| **HTML Body** | (See below) |

**HTML Body:**

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial;">
<div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
  <div style="background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h2>📌 Assignment Reminder</h2>
  </div>
  
  <p>Hi <strong>{{ $node["Split Students"].json.full_name }}</strong>,</p>
  
  <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
    <strong>⏰ Time Remaining: {{ $node["Split Students"].json.timeLeft }}</strong><br>
    Assignment: <strong>{{ $node["Split Students"].json.assignmentTitle }}</strong><br>
    Subject: {{ $node["Split Students"].json.subjectName }}
  </div>
  
  <p><strong>Details:</strong></p>
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Title:</strong></td>
      <td>{{ $node["Split Students"].json.assignmentTitle }}</td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Due Date & Time:</strong></td>
      <td>{{ new Date($node["Split Students"].json.deadline).toLocaleString() }}</td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Subject:</strong></td>
      <td>{{ $node["Split Students"].json.subjectName }}</td>
    </tr>
  </table>
  
  <center style="margin: 20px 0;">
    <a href="https://yourschool.com/portal/assignments" style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
      Submit Assignment
    </a>
  </center>
  
  <p><strong>📝 Tips:</strong></p>
  <ul>
    <li>Submit before deadline to avoid late penalties</li>
    <li>Accepted formats: PDF, DOC, DOCX, PNG, JPG</li>
    <li>Maximum file size: 10 MB</li>
  </ul>
  
  <p>Good luck!<br>Nexus School</p>
</div>
</body>
</html>
```

4. Click **Save**

## Step 4.11: Test Assignment Workflow

1. Click **Execute**
2. Check emails received
3. Verify data accuracy

✅ **Workflow 2 is ready!**

---

# PART 5: Create Workflow 3 - Low Attendance Alert

## Overview

```
Trigger: Daily at 4:00 PM
├─ Get Active Students
├─ For Each Student:
│  ├─ Get Attendance History (30 days)
│  ├─ Calculate Attendance %
│  ├─ Determine Risk Level
│  └─ If at-risk: Send Email to Parent
└─ Send Admin Summary
```

## Step 5.1: Create Workflow

1. Click **Workflows** → **Create New**
2. Name: `Low Attendance Alert`

## Step 5.2: Add Schedule Trigger

1. Click **+**
2. Search: **Schedule**
3. Configure:
   - **Mode:** Every day fixed time
   - **Hour:** 16 (4 PM)
   - **Minute:** 0
4. Click **Save**

## Step 5.3: Get Active Students

1. Click **+**
2. Search: **Supabase**
3. Query:

```sql
SELECT 
  s.id,
  s.student_id,
  s.class_id,
  p.email as student_email,
  p.full_name as student_name,
  pr.email as parent_email,
  pr.full_name as parent_name,
  pr.phone
FROM students s
JOIN profiles p ON s.id = p.id
LEFT JOIN profiles pr ON s.parent_id = pr.id
WHERE s.status = 'active';
```

4. Click **Save**

## Step 5.4: Add Split Students

1. Click **+**
2. Search: **Item Lists**
3. Mode: **Split Out**
4. Click **Save**

## Step 5.5: Get Attendance History

1. Click **+**
2. Search: **Supabase**
3. Query:

```sql
SELECT status FROM attendance
WHERE student_id = '{{ $node["Split Students"].json.id }}'
AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

4. Click **Save**

## Step 5.6: Calculate Attendance Percentage

1. Click **+**
2. Search: **Code**
3. Paste:

```javascript
const attendance = $node["Get Attendance History"].json || [];
const total = attendance.length || 1;
const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
const percentage = Math.round((present / total) * 100);
const absent = attendance.filter(a => a.status === 'absent').length;

let riskLevel = 'ok';
let riskColor = '#10b981';

if (percentage < 60) {
  riskLevel = 'critical';
  riskColor = '#ef4444';
} else if (percentage < 75) {
  riskLevel = 'at-risk';
  riskColor = '#f59e0b';
}

return [{
  ...this.first().json,
  attendancePercentage: percentage,
  totalDays: total,
  presentDays: present,
  absentDays: absent,
  riskLevel: riskLevel,
  riskColor: riskColor
}];
```

4. Click **Save**

## Step 5.7: Filter At-Risk Students

1. Click **+**
2. Search: **Filter**
3. Configure:
   - **Field:** riskLevel
   - **Operator:** Is not equal to
   - **Value:** ok
4. Click **Save**

## Step 5.8: Send Parent Email Alert

1. Click **+**
2. Search: **Send Email**
3. Configure:

| Field | Value |
|-------|-------|
| **To Email** | `{{ $node["Filter At-Risk Students"].json.parent_email }}` |
| **Subject** | `{{ $node["Filter At-Risk Students"].json.riskLevel === 'critical' ? '🚨 URGENT: Critical Attendance' : '⚠️ Attendance Alert' }}` |
| **HTML Body** | (See below) |

**HTML Body:**

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial;">
<div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px;">
  <div style="background: {{ $node["Filter At-Risk Students"].json.riskLevel === 'critical' ? '#fee2e2; border-left: 4px solid #ef4444;' : '#fef3c7; border-left: 4px solid #f59e0b;' }} padding: 15px; margin: 20px 0;">
    <strong>{{ $node["Filter At-Risk Students"].json.riskLevel === 'critical' ? '🚨 CRITICAL ALERT' : '⚠️ ATTENDANCE ALERT' }}</strong><br>
    Your child <strong>{{ $node["Filter At-Risk Students"].json.student_name }}</strong> has only <strong>{{ $node["Filter At-Risk Students"].json.attendancePercentage }}%</strong> attendance.<br>
    Absences: <strong>{{ $node["Filter At-Risk Students"].json.absentDays }}</strong> in last 30 days.
  </div>
  
  <p>Dear {{ $node["Filter At-Risk Students"].json.parent_name }},</p>
  <p>We are concerned about your child's attendance record.</p>
  
  <table style="width: 100%; border-collapse: collapse;">
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Student:</strong></td>
      <td>{{ $node["Filter At-Risk Students"].json.student_name }}</td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Attendance Rate:</strong></td>
      <td>{{ $node["Filter At-Risk Students"].json.attendancePercentage }}%</td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Days Present:</strong></td>
      <td>{{ $node["Filter At-Risk Students"].json.presentDays }} / {{ $node["Filter At-Risk Students"].json.totalDays }}</td>
    </tr>
    <tr style="border-bottom: 1px solid #ddd;">
      <td style="padding: 10px;"><strong>Absences (30 days):</strong></td>
      <td>{{ $node["Filter At-Risk Students"].json.absentDays }}</td>
    </tr>
  </table>
  
  {{ $node["Filter At-Risk Students"].json.riskLevel === 'critical' ? 
    '<p style="color: red; font-weight: bold;">⚠️ IMMEDIATE ACTION REQUIRED. Please contact the school immediately.</p>' 
    : 
    '<p>Please ensure regular attendance to maintain academic progress and enrollment.</p>' 
  }}
  
  <center style="margin: 20px 0;">
    <a href="https://yourschool.com/portal/attendance" style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
      View Full Attendance
    </a>
  </center>
  
  <p>Best regards,<br>Nexus School Management</p>
</div>
</body>
</html>
```

4. Click **Save**

## Step 5.9: Test Attendance Workflow

1. Click **Execute**
2. Check emails
3. Verify calculations

✅ **Workflow 3 is ready!**

---

# PART 6: Activate Workflows

## Step 6.1: Activate Fee Reminder Workflow

1. Open **Fee Payment Reminder** workflow
2. Look for **toggle/switch** at top right
3. Click to turn **ON** (should be blue)
4. Verify it says "Workflow is active"

## Step 6.2: Activate Assignment Workflow

1. Open **Assignment Deadline Notification** workflow
2. Click toggle at top right
3. Turn **ON** (blue)

## Step 6.3: Activate Attendance Workflow

1. Open **Low Attendance Alert** workflow
2. Click toggle at top right
3. Turn **ON** (blue)

## Step 6.4: Verify All Active

1. Go to **Workflows** (left side)
2. You should see 3 workflows listed
3. All should show ✅ or 🟢 indicator

**Active Workflow Schedule:**

| Workflow | Time | Frequency |
|----------|------|-----------|
| Fee Payment Reminder | 8:00 AM | Daily |
| Assignment Deadline | 9 AM, 12 PM, 6 PM, 9 PM | Daily |
| Attendance Alert | 4:00 PM | Daily |

---

# PART 7: Monitor & Test

## Step 7.1: View Execution History

1. Go to each workflow
2. Click **Executions** tab (bottom left)
3. See all past runs:
   - ✅ **Green** = Success
   - ❌ **Red** = Failed
   - ⏱️ Shows timestamp and duration

## Step 7.2: Manual Testing

For **quick testing** without waiting for schedule:

1. Open any workflow
2. Click **Execute** button (top right)
3. Wait 10-15 seconds
4. Check **Executions** tab
5. Look for green checkmark

### What to Verify

✅ No red error messages  
✅ Email received in inbox  
✅ Data displayed correctly  
✅ Execution completed in < 5 seconds  

## Step 7.3: View Workflow Logs

For detailed error information:

```bash
# Windows (PowerShell)
docker-compose logs n8n --tail 100

# macOS/Linux
docker-compose logs n8n --tail 100
```

Look for any **ERROR** or **warning** messages.

---

# PART 8: React Integration

## Add Manual Trigger Buttons to React

### Step 8.1: Find Webhook URLs

For each workflow, copy the webhook URL:

1. Open workflow
2. Click the **Schedule Trigger** node
3. Look for **Webhook** section
4. Copy the **Webhook URL**

Example:
```
http://localhost:5678/webhook/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Note:** Each workflow has a different URL!

### Step 8.2: Create Trigger Function

Edit **`src/components/AdminDashboard.tsx`**

Add this function:

```typescript
const triggerN8nWorkflow = async (workflowName: string) => {
  const webhookUrls: Record<string, string> = {
    'fees': 'http://localhost:5678/webhook/YOUR_FEE_WEBHOOK_ID',
    'assignments': 'http://localhost:5678/webhook/YOUR_ASSIGNMENT_WEBHOOK_ID',
    'attendance': 'http://localhost:5678/webhook/YOUR_ATTENDANCE_WEBHOOK_ID'
  };

  try {
    const url = webhookUrls[workflowName];
    if (!url) {
      alert('❌ Workflow URL not configured');
      return;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        manual: true,
        triggeredAt: new Date().toISOString()
      })
    });

    if (response.ok) {
      alert(`✅ ${workflowName.toUpperCase()} workflow triggered!\n\nCheck n8n dashboard for results.`);
    } else {
      alert(`❌ Failed to trigger workflow (${response.status})`);
    }
  } catch (err: any) {
    alert(`❌ Error: ${err.message}`);
  }
};
```

### Step 8.3: Add Buttons to UI

Add to your **AdminDashboard** JSX:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <motion.button
    onClick={() => triggerN8nWorkflow('fees')}
    whileHover={{ scale: 1.05 }}
    className="glass-card rounded-xl p-4 border border-cyber-success/30 hover:border-cyber-success/60 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
  >
    <Mail size={18} className="text-cyber-success" />
    <span>Send Fee Reminders</span>
  </motion.button>

  <motion.button
    onClick={() => triggerN8nWorkflow('assignments')}
    whileHover={{ scale: 1.05 }}
    className="glass-card rounded-xl p-4 border border-cyber-secondary/30 hover:border-cyber-secondary/60 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
  >
    <Bell size={18} className="text-cyber-secondary" />
    <span>Send Assignment Alerts</span>
  </motion.button>

  <motion.button
    onClick={() => triggerN8nWorkflow('attendance')}
    whileHover={{ scale: 1.05 }}
    className="glass-card rounded-xl p-4 border border-cyber-accent/30 hover:border-cyber-accent/60 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
  >
    <CheckCircle size={18} className="text-cyber-accent" />
    <span>Check Attendance</span>
  </motion.button>
</div>
```

### Step 8.4: Add Required Imports

At the top of the file:

```typescript
import { Mail, Bell, CheckCircle } from 'lucide-react';
```

---

# Troubleshooting

## Common Issues & Solutions

### Issue: "Can't connect to n8n dashboard"

**Solution:**
```bash
# Check if container is running
docker-compose ps

# Should show n8n-school with status "Up"
# If not, restart:
docker-compose restart n8n
```

### Issue: "Connection refused" at localhost:5678

**Solution:**
1. Wait 60 seconds after starting
2. Check logs:
```bash
docker-compose logs n8n
```
3. Look for error messages
4. Restart if needed:
```bash
docker-compose down
docker-compose up -d
```

### Issue: "Supabase connection failed"

**Solution:**
1. Verify credentials are correct
2. Go to Supabase dashboard
3. Re-copy Project URL and Service Key
4. Update credentials in n8n
5. Test connection again

### Issue: "Gmail not sending emails"

**Solution:**
1. Verify you used **App Password** (not regular password)
2. Check App Password has 16 characters
3. Verify Gmail credential test passes
4. Check spam folder
5. Enable "Less secure apps" if needed

### Issue: "Workflow never executes"

**Solution:**
1. Check toggle is ON (blue) ✅
2. Verify schedule time is correct
3. Check timezone setting
4. Verify at least 1 execution passed

### Issue: "No data returned from query"

**Solution:**
1. Test SQL query in Supabase directly
2. Verify data exists in tables
3. Check column names in query
4. Look at n8n execution logs for error

### Issue: "Docker port already in use"

**Solution:**

Change port in `docker-compose.yml`:

```yaml
ports:
  - "6789:5678"  # Changed from 5678
```

Then access at: http://localhost:6789

---

# Maintenance & Backup

## Regular Maintenance

### Weekly
- Check workflow executions for errors
- Review email logs
- Monitor n8n logs

### Monthly
- Backup workflows (download as JSON)
- Review automation effectiveness
- Update credentials if needed

## Backup Workflows

### Backup Individual Workflow

1. Open workflow
2. Click **⋯** menu (top right)
3. Click **Download**
4. Save as `workflow_name_backup.json`

### Backup All Workflows

```bash
# Create backup directory
mkdir n8n-backups
cd n8n-backups

# For each workflow, download JSON and save here
```

## Restore Workflow

1. Click **Workflows** → **Create New**
2. Click **⋯** menu
3. Click **Import from JSON**
4. Select backup file
5. Click **Import**

## Restart n8n

```bash
# Stop
docker-compose down

# Start
docker-compose up -d

# Verify
docker-compose ps
```

## Check Logs

```bash
# View logs
docker-compose logs n8n

# Last 100 lines only
docker-compose logs n8n --tail 100

# Follow logs (live)
docker-compose logs n8n -f
```

Press Ctrl+C to stop following logs.

## Stop Everything

```bash
docker-compose down
```

## Start Again

```bash
docker-compose up -d
```

---

# Final Checklist

Before considering installation complete, verify:

- ✅ Docker installed and running
- ✅ n8n accessible at http://localhost:5678
- ✅ Can login with credentials
- ✅ Supabase credential connected & tested
- ✅ Gmail credential connected & tested
- ✅ Twilio credential connected (optional)
- ✅ Fee Payment Reminder workflow created
- ✅ Assignment Deadline workflow created
- ✅ Attendance Alert workflow created
- ✅ All workflows toggled ON
- ✅ Manual test execution successful
- ✅ Received test emails
- ✅ React integration buttons added
- ✅ Webhook URLs configured in React

---

# Support & Resources

## Documentation
- **n8n Docs:** https://docs.n8n.io
- **Supabase Docs:** https://supabase.com/docs
- **Docker Docs:** https://docs.docker.com

## Troubleshooting Resources
- **n8n Community:** https://community.n8n.io
- **GitHub Issues:** https://github.com/n8n-io/n8n/issues
- **Stack Overflow:** Tag `n8n`

## Emergency Commands

```bash
# Kill stuck container
docker kill n8n-school

# Full reset (WARNING: deletes data)
docker-compose down -v
docker volume rm n8n_n8n_data

# Clear Docker cache
docker system prune
```

---

## Document Information

| Item | Value |
|------|-------|
| **Created** | June 2024 |
| **n8n Version** | Latest (Free) |
| **Status** | Complete |
| **Last Updated** | June 2024 |

---

**Happy automating! 🚀**

For questions or issues, refer to the Troubleshooting section or check n8n community forums.
