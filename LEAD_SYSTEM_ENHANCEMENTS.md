# Lead Distribution System - Enhancement Implementation Plan

## Enhancement 1: Scheduled Distributions (Auto-distribute Weekly/Monthly)

### Overview
Automatically distribute leads on a regular schedule (weekly/monthly) without manual admin intervention.

### Implementation Strategy

#### A. Database Schema Changes

**New Collection: `distribution_schedules`**
```json
{
  "schedule_id": "uuid",
  "name": "Weekly Bronze Lead Distribution",
  "frequency": "weekly|monthly",
  "day_of_week": 1,        // 1-7 for weekly (1=Monday)
  "day_of_month": 15,      // 1-31 for monthly
  "time": "09:00",         // UTC time
  "enabled": true,
  "min_leads_required": 50,
  "tier_allocations": {
    "bronze": 100,
    "silver": 250,
    "gold": 500
  },
  "last_run": "2025-01-09T09:00:00Z",
  "next_run": "2025-01-16T09:00:00Z",
  "run_count": 45,
  "created_by": "admin_username",
  "created_at": "2025-01-01T00:00:00Z"
}
```

**Update `lead_distributions` Collection:**
```json
{
  // ... existing fields ...
  "schedule_id": "uuid",  // NEW: Link to schedule if auto-distributed
  "auto_distributed": true  // NEW: Flag for automated distributions
}
```

#### B. Backend Implementation

**1. Create Schedule Management Endpoints**

```python
# /app/backend/server.py

@app.post("/api/admin/leads/schedules")
async def create_distribution_schedule(
    schedule: DistributionSchedule,
    admin: dict = Depends(get_admin_user)
):
    """Create a new distribution schedule"""
    schedule_doc = {
        "schedule_id": str(uuid.uuid4()),
        "name": schedule.name,
        "frequency": schedule.frequency,  # 'weekly' or 'monthly'
        "day_of_week": schedule.day_of_week,  # 1-7 (Monday-Sunday)
        "day_of_month": schedule.day_of_month,  # 1-31
        "time": schedule.time,  # "HH:MM" in UTC
        "enabled": True,
        "min_leads_required": schedule.min_leads_required,
        "tier_allocations": schedule.tier_allocations,
        "last_run": None,
        "next_run": calculate_next_run(schedule),
        "run_count": 0,
        "created_by": admin["username"],
        "created_at": datetime.utcnow()
    }
    
    await db.distribution_schedules.insert_one(schedule_doc)
    return schedule_doc

@app.get("/api/admin/leads/schedules")
async def get_distribution_schedules(admin: dict = Depends(get_admin_user)):
    """Get all distribution schedules"""
    schedules = await db.distribution_schedules.find().to_list(None)
    return {"schedules": schedules}

@app.put("/api/admin/leads/schedules/{schedule_id}")
async def update_distribution_schedule(
    schedule_id: str,
    updates: dict,
    admin: dict = Depends(get_admin_user)
):
    """Update a schedule (enable/disable, change time, etc.)"""
    await db.distribution_schedules.update_one(
        {"schedule_id": schedule_id},
        {"$set": updates}
    )
    return {"message": "Schedule updated"}

@app.delete("/api/admin/leads/schedules/{schedule_id}")
async def delete_distribution_schedule(
    schedule_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Delete a schedule"""
    await db.distribution_schedules.delete_one({"schedule_id": schedule_id})
    return {"message": "Schedule deleted"}
```

**2. Create Scheduler Service**

```python
# /app/backend/scheduler.py (NEW FILE)

import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def run_distribution_scheduler():
    """Main scheduler loop - runs every minute"""
    client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
    db = client[os.getenv("DB_NAME")]
    
    while True:
        try:
            now = datetime.utcnow()
            
            # Find schedules that need to run
            schedules_to_run = await db.distribution_schedules.find({
                "enabled": True,
                "next_run": {"$lte": now}
            }).to_list(None)
            
            for schedule in schedules_to_run:
                try:
                    await execute_scheduled_distribution(db, schedule)
                except Exception as e:
                    logger.error(f"Failed to run schedule {schedule['schedule_id']}: {e}")
            
            # Sleep for 1 minute
            await asyncio.sleep(60)
            
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            await asyncio.sleep(60)

async def execute_scheduled_distribution(db, schedule):
    """Execute a scheduled distribution"""
    schedule_id = schedule["schedule_id"]
    
    # Check if there are enough undistributed leads
    available_leads = await db.leads.count_documents({
        "distribution_count": {"$lt": 10}
    })
    
    min_required = schedule.get("min_leads_required", 50)
    if available_leads < min_required:
        logger.warning(f"Schedule {schedule_id}: Not enough leads ({available_leads} < {min_required})")
        # Update next run time and skip
        next_run = calculate_next_run(schedule)
        await db.distribution_schedules.update_one(
            {"schedule_id": schedule_id},
            {"$set": {"next_run": next_run}}
        )
        return
    
    # Get the oldest queued distribution or create a virtual one
    distribution = await db.lead_distributions.find_one({
        "status": "queued"
    }, sort=[("uploaded_at", 1)])
    
    if not distribution:
        # Create a virtual distribution for auto-distribution
        distribution_id = str(uuid.uuid4())
        distribution_doc = {
            "distribution_id": distribution_id,
            "filename": f"auto_distribution_{datetime.utcnow().strftime('%Y%m%d')}",
            "total_leads": available_leads,
            "status": "processing",
            "uploaded_by": "SYSTEM_AUTO",
            "uploaded_at": datetime.utcnow(),
            "schedule_id": schedule_id,
            "auto_distributed": True
        }
        await db.lead_distributions.insert_one(distribution_doc)
    else:
        distribution_id = distribution["distribution_id"]
        # Mark as processing
        await db.lead_distributions.update_one(
            {"distribution_id": distribution_id},
            {"$set": {
                "status": "processing",
                "schedule_id": schedule_id,
                "auto_distributed": True
            }}
        )
    
    # Perform the distribution
    await perform_lead_distribution(distribution_id)
    
    # Update schedule
    next_run = calculate_next_run(schedule)
    await db.distribution_schedules.update_one(
        {"schedule_id": schedule_id},
        {"$set": {
            "last_run": datetime.utcnow(),
            "next_run": next_run,
            "$inc": {"run_count": 1}
        }}
    )
    
    logger.info(f"Completed scheduled distribution {distribution_id}")

def calculate_next_run(schedule):
    """Calculate the next run time based on schedule settings"""
    now = datetime.utcnow()
    frequency = schedule.get("frequency", "weekly")
    time_parts = schedule.get("time", "09:00").split(":")
    hour = int(time_parts[0])
    minute = int(time_parts[1])
    
    if frequency == "weekly":
        # Calculate next occurrence of specified day_of_week
        target_day = schedule.get("day_of_week", 1)  # 1 = Monday
        days_ahead = target_day - now.isoweekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        next_run = now + timedelta(days=days_ahead)
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
        
    elif frequency == "monthly":
        # Calculate next occurrence of specified day_of_month
        target_day = schedule.get("day_of_month", 1)
        if now.day >= target_day:
            # Next month
            if now.month == 12:
                next_run = now.replace(year=now.year + 1, month=1, day=target_day)
            else:
                next_run = now.replace(month=now.month + 1, day=target_day)
        else:
            # This month
            next_run = now.replace(day=target_day)
        next_run = next_run.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    return next_run
```

**3. Update server.py to Start Scheduler**

```python
# /app/backend/server.py

from scheduler import run_distribution_scheduler

@app.on_event("startup")
async def startup_event():
    """Start background tasks on server startup"""
    # Start distribution scheduler in background
    asyncio.create_task(run_distribution_scheduler())
    logger.info("Distribution scheduler started")
```

#### C. Frontend Implementation

**Admin Dashboard - Schedules Tab**

```jsx
// Add to AdminDashboard tabs
{ id: 'schedules', label: 'Schedules', icon: Clock }

function SchedulesTab() {
  const [schedules, setSchedules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const fetchSchedules = async () => {
    const response = await axios.get(`${API_URL}/admin/leads/schedules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSchedules(response.data.schedules);
  };
  
  return (
    <div>
      <button onClick={() => setShowCreateModal(true)}>
        Create New Schedule
      </button>
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Frequency</th>
            <th>Next Run</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map(schedule => (
            <tr key={schedule.schedule_id}>
              <td>{schedule.name}</td>
              <td>{schedule.frequency}</td>
              <td>{new Date(schedule.next_run).toLocaleString()}</td>
              <td>
                <Toggle 
                  enabled={schedule.enabled}
                  onChange={(enabled) => updateSchedule(schedule.schedule_id, {enabled})}
                />
              </td>
              <td>
                <button onClick={() => editSchedule(schedule)}>Edit</button>
                <button onClick={() => deleteSchedule(schedule.schedule_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {showCreateModal && <CreateScheduleModal />}
    </div>
  );
}
```

---

## Enhancement 2: Duplicate Detection (Check for Duplicate Emails)

### Overview
Prevent duplicate leads from being uploaded by checking email addresses against existing leads.

### Implementation Strategy

#### A. Database Index

```javascript
// Create unique index on email within each distribution
db.leads.createIndex(
  { "email": 1, "distribution_id": 1 }, 
  { unique: true }
)

// Create index for global duplicate checking
db.leads.createIndex({ "email": 1 })
```

#### B. Backend Implementation

**1. Update CSV Upload Endpoint**

```python
@app.post("/api/admin/leads/upload")
async def upload_leads_csv(
    request: Request,
    check_duplicates: bool = True,  # NEW PARAMETER
    admin: dict = Depends(get_admin_user)
):
    """Upload CSV file for lead distribution with duplicate checking"""
    try:
        # ... existing CSV parsing code ...
        
        if check_duplicates:
            # Check for duplicates within the uploaded CSV
            emails_in_csv = [lead["email"] for lead in leads_data]
            email_counts = {}
            duplicates_in_csv = []
            
            for email in emails_in_csv:
                email_lower = email.lower()
                if email_lower in email_counts:
                    duplicates_in_csv.append(email)
                email_counts[email_lower] = email_counts.get(email_lower, 0) + 1
            
            if duplicates_in_csv:
                return {
                    "error": "duplicate_in_csv",
                    "message": f"Found {len(set(duplicates_in_csv))} duplicate emails within the CSV",
                    "duplicates": list(set(duplicates_in_csv))[:10],  # Show first 10
                    "action_required": "remove_duplicates_and_reupload"
                }
            
            # Check for duplicates against existing leads in database
            existing_emails = set()
            for lead in leads_data:
                existing = await db.leads.find_one({"email": lead["email"].lower()})
                if existing:
                    existing_emails.add(lead["email"])
            
            if existing_emails:
                # Option 1: Reject upload
                return {
                    "error": "duplicate_in_database",
                    "message": f"Found {len(existing_emails)} emails that already exist in database",
                    "duplicates": list(existing_emails)[:10],
                    "total_new_leads": len(leads_data) - len(existing_emails),
                    "actions": {
                        "skip_duplicates": "Upload only new leads",
                        "cancel": "Cancel upload"
                    }
                }
                
                # Option 2: Allow user to choose to skip duplicates
                # This would require a two-step upload process
        
        # ... rest of existing upload code ...
```

**2. Create Duplicate Report Endpoint**

```python
@app.get("/api/admin/leads/duplicates")
async def get_duplicate_leads(admin: dict = Depends(get_admin_user)):
    """Get a report of duplicate email addresses in the database"""
    
    # Use MongoDB aggregation to find duplicate emails
    pipeline = [
        {
            "$group": {
                "_id": "$email",
                "count": {"$sum": 1},
                "lead_ids": {"$push": "$lead_id"},
                "distributions": {"$push": "$distribution_id"}
            }
        },
        {
            "$match": {
                "count": {"$gt": 1}
            }
        },
        {
            "$sort": {"count": -1}
        },
        {
            "$limit": 100
        }
    ]
    
    duplicates = await db.leads.aggregate(pipeline).to_list(None)
    
    return {
        "total_duplicates": len(duplicates),
        "duplicates": duplicates
    }

@app.post("/api/admin/leads/merge-duplicates")
async def merge_duplicate_leads(
    email: str,
    keep_lead_id: str,
    admin: dict = Depends(get_admin_user)
):
    """Merge duplicate leads - keep one, update references to others"""
    
    # Find all leads with this email
    duplicate_leads = await db.leads.find({"email": email}).to_list(None)
    
    if len(duplicate_leads) <= 1:
        raise HTTPException(status_code=400, detail="No duplicates found")
    
    # Get the lead to keep
    lead_to_keep = next((l for l in duplicate_leads if l["lead_id"] == keep_lead_id), None)
    if not lead_to_keep:
        raise HTTPException(status_code=404, detail="Lead to keep not found")
    
    # Get leads to merge
    leads_to_merge = [l for l in duplicate_leads if l["lead_id"] != keep_lead_id]
    
    # Update all member_leads references to point to kept lead
    for old_lead in leads_to_merge:
        await db.member_leads.update_many(
            {"lead_id": old_lead["lead_id"]},
            {"$set": {"lead_id": keep_lead_id}}
        )
        
        # Increment distribution count on kept lead
        await db.leads.update_one(
            {"lead_id": keep_lead_id},
            {"$inc": {"distribution_count": old_lead.get("distribution_count", 0)}}
        )
    
    # Delete duplicate leads
    await db.leads.delete_many({
        "email": email,
        "lead_id": {"$ne": keep_lead_id}
    })
    
    return {
        "message": f"Merged {len(leads_to_merge)} duplicate leads",
        "kept_lead_id": keep_lead_id
    }
```

#### C. Frontend Implementation

**Upload Modal with Duplicate Handling**

```jsx
function UploadLeadsModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [duplicateReport, setDuplicateReport] = useState(null);
  const [checkDuplicates, setCheckDuplicates] = useState(true);
  
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append('csv_file', file);
    formData.append('check_duplicates', checkDuplicates);
    
    const response = await axios.post(
      `${API_URL}/admin/leads/upload`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    if (response.data.error === 'duplicate_in_csv') {
      alert(`Found ${response.data.duplicates.length} duplicates in CSV. Please remove them and try again.`);
      setDuplicateReport(response.data);
    } else if (response.data.error === 'duplicate_in_database') {
      setDuplicateReport(response.data);
      // Show options to skip duplicates or cancel
    } else {
      // Success
      alert('Leads uploaded successfully!');
      onClose();
    }
  };
  
  return (
    <div className="modal">
      <h2>Upload Leads CSV</h2>
      
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      
      <label>
        <input 
          type="checkbox" 
          checked={checkDuplicates}
          onChange={(e) => setCheckDuplicates(e.target.checked)}
        />
        Check for duplicate emails
      </label>
      
      {duplicateReport && (
        <div className="duplicate-report">
          <h3>Duplicate Emails Found</h3>
          <p>{duplicateReport.message}</p>
          <p>Total new leads: {duplicateReport.total_new_leads}</p>
          
          <button onClick={() => handleSkipDuplicates()}>
            Upload {duplicateReport.total_new_leads} New Leads Only
          </button>
          <button onClick={onClose}>Cancel</button>
        </div>
      )}
      
      {!duplicateReport && (
        <button onClick={handleUpload}>Upload</button>
      )}
    </div>
  );
}
```

**Duplicate Management Page**

```jsx
function DuplicateLeadsTab() {
  const [duplicates, setDuplicates] = useState([]);
  
  const fetchDuplicates = async () => {
    const response = await axios.get(`${API_URL}/admin/leads/duplicates`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDuplicates(response.data.duplicates);
  };
  
  return (
    <div>
      <h2>Duplicate Email Addresses</h2>
      <p>Found {duplicates.length} emails with duplicates</p>
      
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {duplicates.map(dup => (
            <tr key={dup._id}>
              <td>{dup._id}</td>
              <td>{dup.count}</td>
              <td>
                <button onClick={() => viewDuplicateDetails(dup)}>
                  View Details
                </button>
                <button onClick={() => mergeDuplicates(dup._id)}>
                  Merge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Enhancement 3: Lead Verification (Validate Emails Before Distribution)

### Overview
Validate email addresses before distribution to ensure they are properly formatted and potentially deliverable.

### Implementation Strategy

#### A. Backend Implementation

**1. Email Validation Utilities**

```python
# /app/backend/email_validator.py (NEW FILE)

import re
import dns.resolver
import asyncio
from typing import Tuple

def validate_email_format(email: str) -> Tuple[bool, str]:
    """
    Validate email format using regex
    Returns: (is_valid, error_message)
    """
    # Basic email regex pattern
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not email:
        return False, "Email is empty"
    
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    # Check for common issues
    if email.count('@') != 1:
        return False, "Email must contain exactly one @"
    
    local_part, domain = email.split('@')
    
    if len(local_part) == 0 or len(local_part) > 64:
        return False, "Local part must be between 1 and 64 characters"
    
    if len(domain) == 0 or len(domain) > 255:
        return False, "Domain must be between 1 and 255 characters"
    
    # Check for consecutive dots
    if '..' in email:
        return False, "Email contains consecutive dots"
    
    # Check for valid characters
    if local_part.startswith('.') or local_part.endswith('.'):
        return False, "Local part cannot start or end with a dot"
    
    return True, ""

async def validate_email_domain(email: str) -> Tuple[bool, str]:
    """
    Validate email domain by checking MX records
    Returns: (is_valid, error_message)
    """
    try:
        domain = email.split('@')[1]
        
        # Check if domain has MX records
        mx_records = await asyncio.to_thread(dns.resolver.resolve, domain, 'MX')
        
        if not mx_records:
            return False, "No MX records found for domain"
        
        return True, ""
        
    except dns.resolver.NXDOMAIN:
        return False, "Domain does not exist"
    except dns.resolver.NoAnswer:
        return False, "No MX records found"
    except dns.resolver.Timeout:
        return False, "DNS lookup timeout"
    except Exception as e:
        return False, f"DNS lookup error: {str(e)}"

async def validate_email_comprehensive(email: str) -> dict:
    """
    Comprehensive email validation
    Returns: {
        "valid": bool,
        "email": str,
        "checks": {
            "format": {"valid": bool, "message": str},
            "domain": {"valid": bool, "message": str}
        }
    }
    """
    email = email.strip().lower()
    
    # Check format
    format_valid, format_message = validate_email_format(email)
    
    # Check domain (only if format is valid)
    domain_valid = False
    domain_message = ""
    if format_valid:
        domain_valid, domain_message = await validate_email_domain(email)
    
    overall_valid = format_valid and domain_valid
    
    return {
        "valid": overall_valid,
        "email": email,
        "checks": {
            "format": {
                "valid": format_valid,
                "message": format_message or "Valid format"
            },
            "domain": {
                "valid": domain_valid,
                "message": domain_message or "Valid domain" if format_valid else "Not checked"
            }
        }
    }
```

**2. Update CSV Upload with Validation**

```python
@app.post("/api/admin/leads/upload")
async def upload_leads_csv(
    request: Request,
    check_duplicates: bool = True,
    validate_emails: bool = True,  # NEW PARAMETER
    admin: dict = Depends(get_admin_user)
):
    """Upload CSV file with email validation"""
    try:
        # ... existing CSV parsing code ...
        
        if validate_emails:
            validation_results = []
            invalid_emails = []
            
            # Validate each email
            for lead in leads_data:
                result = await validate_email_comprehensive(lead["email"])
                validation_results.append({
                    "email": lead["email"],
                    "name": lead["name"],
                    **result
                })
                
                if not result["valid"]:
                    invalid_emails.append({
                        "email": lead["email"],
                        "name": lead["name"],
                        "reason": result["checks"]["format"]["message"] 
                                  if not result["checks"]["format"]["valid"]
                                  else result["checks"]["domain"]["message"]
                    })
            
            if invalid_emails:
                return {
                    "error": "invalid_emails",
                    "message": f"Found {len(invalid_emails)} invalid email addresses",
                    "invalid_emails": invalid_emails[:20],  # Show first 20
                    "total_valid": len(leads_data) - len(invalid_emails),
                    "actions": {
                        "skip_invalid": "Upload only valid emails",
                        "cancel": "Cancel and fix emails"
                    }
                }
        
        # ... rest of upload code ...
```

**3. Bulk Email Validation Endpoint**

```python
@app.post("/api/admin/leads/validate-csv")
async def validate_csv_before_upload(
    request: Request,
    admin: dict = Depends(get_admin_user)
):
    """Validate CSV emails before actual upload (preview mode)"""
    try:
        form = await request.form()
        csv_file = form.get("csv_file")
        
        # Parse CSV
        contents = await csv_file.read()
        csv_content = contents.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        # Validate each email
        validation_results = []
        stats = {
            "total": 0,
            "valid": 0,
            "invalid_format": 0,
            "invalid_domain": 0
        }
        
        for row in csv_reader:
            email = row.get('email', '').strip()
            name = row.get('name', '').strip()
            
            result = await validate_email_comprehensive(email)
            validation_results.append({
                "name": name,
                "email": email,
                **result
            })
            
            stats["total"] += 1
            if result["valid"]:
                stats["valid"] += 1
            elif not result["checks"]["format"]["valid"]:
                stats["invalid_format"] += 1
            else:
                stats["invalid_domain"] += 1
        
        return {
            "stats": stats,
            "validation_results": validation_results,
            "recommendation": "proceed" if stats["valid"] == stats["total"] else "review_invalid"
        }
        
    except Exception as e:
        logger.error(f"Failed to validate CSV: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate CSV")

@app.post("/api/admin/leads/batch-validate")
async def batch_validate_existing_leads(
    distribution_id: str = None,
    admin: dict = Depends(get_admin_user)
):
    """Validate existing leads in database"""
    try:
        # Get leads to validate
        query = {"distribution_id": distribution_id} if distribution_id else {}
        leads = await db.leads.find(query).to_list(None)
        
        validation_results = []
        
        for lead in leads:
            result = await validate_email_comprehensive(lead["email"])
            validation_results.append({
                "lead_id": lead["lead_id"],
                "email": lead["email"],
                **result
            })
            
            # Update lead with validation result
            await db.leads.update_one(
                {"lead_id": lead["lead_id"]},
                {"$set": {
                    "email_validated": result["valid"],
                    "validation_date": datetime.utcnow(),
                    "validation_details": result["checks"]
                }}
            )
        
        invalid_count = sum(1 for r in validation_results if not r["valid"])
        
        return {
            "total_validated": len(validation_results),
            "valid_count": len(validation_results) - invalid_count,
            "invalid_count": invalid_count,
            "results": validation_results
        }
        
    except Exception as e:
        logger.error(f"Failed to batch validate: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate leads")
```

**4. Update Lead Schema**

```python
# Add to leads collection document
{
  # ... existing fields ...
  "email_validated": bool,           # NEW
  "validation_date": datetime,       # NEW
  "validation_details": {            # NEW
    "format": {"valid": bool, "message": str},
    "domain": {"valid": bool, "message": str}
  }
}
```

#### B. Frontend Implementation

**Validation Preview Modal**

```jsx
function ValidateCSVModal({ file, onProceed, onCancel }) {
  const [validating, setValidating] = useState(false);
  const [results, setResults] = useState(null);
  
  const validateCSV = async () => {
    setValidating(true);
    const formData = new FormData();
    formData.append('csv_file', file);
    
    const response = await axios.post(
      `${API_URL}/admin/leads/validate-csv`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    setResults(response.data);
    setValidating(false);
  };
  
  useEffect(() => {
    validateCSV();
  }, []);
  
  if (validating) {
    return <div>Validating emails... This may take a moment.</div>;
  }
  
  if (!results) return null;
  
  return (
    <div className="modal">
      <h2>Email Validation Results</h2>
      
      <div className="stats">
        <div className="stat">
          <span>Total Emails:</span>
          <span>{results.stats.total}</span>
        </div>
        <div className="stat success">
          <span>Valid:</span>
          <span>{results.stats.valid}</span>
        </div>
        <div className="stat error">
          <span>Invalid Format:</span>
          <span>{results.stats.invalid_format}</span>
        </div>
        <div className="stat warning">
          <span>Invalid Domain:</span>
          <span>{results.stats.invalid_domain}</span>
        </div>
      </div>
      
      {results.stats.invalid_format > 0 || results.stats.invalid_domain > 0 ? (
        <div className="invalid-emails">
          <h3>Invalid Emails</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Issue</th>
              </tr>
            </thead>
            <tbody>
              {results.validation_results
                .filter(r => !r.valid)
                .slice(0, 20)
                .map((result, idx) => (
                  <tr key={idx}>
                    <td>{result.name}</td>
                    <td>{result.email}</td>
                    <td>
                      {!result.checks.format.valid 
                        ? result.checks.format.message
                        : result.checks.domain.message}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}
      
      <div className="actions">
        {results.stats.valid > 0 && (
          <button onClick={() => onProceed(true)}>
            Upload {results.stats.valid} Valid Emails
          </button>
        )}
        <button onClick={() => onProceed(false)}>
          Upload All (Skip Validation)
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

---

## Dependencies Required

### For Scheduled Distributions:
```bash
# No additional dependencies - uses Python asyncio
```

### For Email Validation:
```bash
# Backend
pip install dnspython

# Add to requirements.txt
dnspython==2.4.2
```

---

## Implementation Priority

**Recommended Order:**

1. **Duplicate Detection** (Easiest, High Impact)
   - Implement first as it prevents immediate data quality issues
   - Can be done in 1-2 hours

2. **Email Validation** (Medium Complexity, High Impact)
   - Significantly improves lead quality
   - Can be done in 2-3 hours

3. **Scheduled Distributions** (Most Complex, Medium Impact)
   - Requires background process/scheduler
   - Can be done in 4-6 hours
   - Test thoroughly before production

---

## Testing Strategy

### Duplicate Detection:
- [ ] Upload CSV with duplicate emails within file
- [ ] Upload CSV with emails already in database
- [ ] Verify duplicate report accuracy
- [ ] Test merge functionality

### Email Validation:
- [ ] Test with valid emails
- [ ] Test with invalid formats
- [ ] Test with non-existent domains
- [ ] Test with temporary/disposable email services
- [ ] Test performance with large CSV (1000+ emails)

### Scheduled Distributions:
- [ ] Create weekly schedule
- [ ] Create monthly schedule
- [ ] Verify next_run calculation
- [ ] Test enable/disable functionality
- [ ] Verify distributions run automatically
- [ ] Test with insufficient leads
- [ ] Test with no eligible members

---

## Monitoring & Logging

### Add Logging for:
- Duplicate detection results
- Email validation failures
- Scheduled distribution execution
- Failed schedule runs
- Email validation API timeouts

### Add Metrics:
- Number of duplicates prevented
- Invalid email percentage per upload
- Scheduled distribution success rate
- Average leads per scheduled run

---

**Ready for Implementation!**
