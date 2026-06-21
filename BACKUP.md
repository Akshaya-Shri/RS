# Revathi Store - Database Backup & Restore Guide

This document outlines the backup and recovery procedures for the PostgreSQL database (`revathi_store`). Implementing these strategies ensures that product inventory, orders, and customer histories are preserved.

---

## 1. Manual Backup & Restore

PostgreSQL provides robust utilities `pg_dump` (for backing up) and `pg_restore`/`psql` (for restoring).

### 1.1 Creating a Backup
We recommend using the PostgreSQL **Custom (`-F c`)** format. It is compressed, fast, and allows flexible restore options.

```bash
# Run pg_dump from your terminal (substitute your database user)
pg_dump -U postgres -h localhost -F c -b -v -f /path/to/backups/revathi_store_$(date +%F_%H-%M-%S).dump revathi_store
```

### 1.2 Restoring a Backup
To restore a custom format (`.dump`) file, use `pg_restore`:

```bash
# Drop the existing database (optional/if rebuilding)
dropdb -U postgres -h localhost revathi_store

# Recreate the database
createdb -U postgres -h localhost revathi_store

# Restore the dump file
pg_restore -U postgres -h localhost -d revathi_store -v /path/to/backups/revathi_store_xxxx-xx-xx.dump
```

*Note: If your backup is in plain text SQL format (`.sql`), restore using `psql`:*
```bash
psql -U postgres -h localhost -d revathi_store -f /path/to/backups/revathi_store_xxxx-xx-xx.sql
```

---

## 2. Automated Backup Scripts

To avoid manual steps, configure automation scripts that include log rotation to prune older files and conserve disk space.

### 2.1 Linux/macOS Automate Script (`backup.sh`)
Create a file named `backup.sh` (e.g., in `/opt/db-backups/backup.sh`):

```bash
#!/bin/bash

# Configuration
DB_NAME="revathi_store"
DB_USER="postgres"
DB_HOST="localhost"
BACKUP_DIR="/opt/db-backups/files"
KEEP_DAYS=14 # Days of backups to retain
DATE=$(date +%F_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${DATE}.dump"

# Create backup directory if not exists
mkdir -p "$BACKUP_DIR"

# Run pg_dump (Ensure .pgpass is configured or PG_PASSWORD is set if run non-interactively)
echo "Starting PostgreSQL backup for ${DB_NAME}..."
pg_dump -U "$DB_USER" -h "$DB_HOST" -F c -b -v -f "$BACKUP_FILE" "$DB_NAME"

if [ $? -eq 0 ]; then
  echo "Backup successfully created: ${BACKUP_FILE}"
else
  echo "Database backup FAILED!" >&2
  exit 1
fi

# Prune older backups
echo "Pruning backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -type f -name "${DB_NAME}_*.dump" -mtime +"$KEEP_DAYS" -exec rm {} \;
echo "Cleanup completed."
```

Make the script executable:
```bash
chmod +x /opt/db-backups/backup.sh
```

### 2.2 Windows PowerShell Automate Script (`backup.ps1`)
For Windows environments, save the following as `backup.ps1`:

```powershell
# Configuration
$DB_NAME = "revathi_store"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$BACKUP_DIR = "C:\db-backups\files"
$KEEP_DAYS = 14
$DATE = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\${DB_NAME}_${DATE}.dump"

# Create backup directory if not exists
if (!(Test-Path -Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR
}

# Run pg_dump (ensure pg_dump.exe is in the System PATH)
Write-Host "Starting PostgreSQL backup for ${DB_NAME}..."
& pg_dump.exe -U $DB_USER -h $DB_HOST -F c -b -v -f $BACKUP_FILE $DB_NAME

if ($LASTEXITCODE -eq 0) {
    Write-Host "Backup successfully created: $BACKUP_FILE"
} else {
    Write-Error "Database backup FAILED!"
    exit 1
}

# Prune older backups
Write-Host "Pruning backups older than $KEEP_DAYS days..."
Get-ChildItem -Path $BACKUP_DIR -Filter "${DB_NAME}_*.dump" | 
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KEEP_DAYS) } | 
    Remove-Item -Force
Write-Host "Cleanup completed."
```

---

## 3. Scheduling Automated Backups

### 3.1 Linux Scheduling (cron)
Configure backups to run daily at 2:00 AM using `cron`:

1. Open the crontab editor for the root/backup user:
   ```bash
   crontab -e
   ```
2. Append the following line to schedule the script:
   ```cron
   0 2 * * * /opt/db-backups/backup.sh >> /var/log/db-backup.log 2>&1
   ```

*(Tip: In non-interactive environments, configure database credentials in `/home/username/.pgpass` so the backup command executes without password prompts. Format: `hostname:port:database:username:password`)*

### 3.2 Windows Scheduling (Task Scheduler)
Configure backups to run daily using Task Scheduler:

1. Open **Task Scheduler** and click **Create Basic Task**.
2. Name the task "PostgreSQL Database Backup".
3. Select **Daily** and set the time (e.g. 2:00 AM).
4. Select **Start a Program** and configure:
   - Program/Script: `powershell.exe`
   - Add arguments: `-ExecutionPolicy Bypass -File "C:\db-backups\backup.ps1"`
5. Click **Finish**. Ensure the task runs with high privileges.

---

## 4. Backup Best Practices

- **Configure Remote Offsite Storage**: Keeping backups on the same physical server is a single point of failure. Configure a script or tool (like AWS CLI, Rclone, or gsutil) to sync your backup directory with an S3 bucket or Google Cloud Storage daily.
- **Verify Restores Regularly**: A backup is only as good as its restore capability. Conduct monthly tests where you restore a backup dump into a testing/staging database to verify data integrity.
- **Monitor disk space**: Ensure the backup directory resides on a disk with ample room, and keep an eye on log reports.
