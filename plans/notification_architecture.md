# Notification System Architecture Design

## Overview

The notification system will handle email notifications, price change alerts, user notification settings, portfolio reports, and asset historical price tracking. It integrates with the existing NestJS backend using TypeORM for data persistence.

## Key Requirements

- Email notifications via nodemailer with Yandex SMTP
- Price change alerts based on user-defined thresholds
- User notification settings: enable/disable per asset type, custom intervals (2-12 hours in 2-hour steps)
- Portfolio reports: daily/weekly/monthly/quarterly/yearly with totals
- Asset historical price tracking for charts and LLM predictions

## Database Entities

### NotificationSettings

- userId: number (FK to User)
- assetType: string (crypto, nft)
- enabled: boolean
- thresholdPercent: number (e.g., 5 for 5% change)
- intervalHours: number (2,4,6,8,10,12)
- lastNotified: Date

### HistoricalPrice

- assetId: number (FK to Asset)
- price: decimal
- timestamp: Date
- source: string (e.g., API name)

### NotificationLog

- userId: number
- type: string (alert, report)
- subject: string
- message: string
- sentAt: Date
- status: string (sent, failed)

## Services

### EmailService

- Uses nodemailer with Yandex SMTP configuration
- Methods: sendEmail(to, subject, message)

### AlertService

- Checks price changes against user thresholds
- Triggers notifications based on settings and intervals
- Integrates with SchedulerService

### ReportService

- Generates portfolio reports (daily/weekly/etc.)
- Calculates totals for user's assets
- Sends reports via EmailService

### SchedulerService

- Uses @nestjs/schedule for cron jobs
- Schedules report generation and alert checks
- Handles custom intervals for alerts

## API Endpoints

### Notification Settings

- GET /notifications/settings - Get user's settings
- POST /notifications/settings - Update settings
- DELETE /notifications/settings/:id - Delete setting

### Historical Data

- GET /assets/:id/history - Get price history for asset
- GET /portfolio/history - Get portfolio value history

### Reports

- POST /notifications/reports/generate - Manual report generation

## Architecture Diagram

```mermaid
graph TD
    A[User] --> B[NotificationsController]
    B --> C[NotificationsService]
    C --> D[EmailService]
    C --> E[AlertService]
    C --> F[ReportService]
    E --> G[SchedulerService]
    F --> G
    D --> H[Yandex SMTP]
    G --> I[@nestjs/schedule]
    C --> J[NotificationSettings Entity]
    C --> K[HistoricalPrice Entity]
    C --> L[NotificationLog Entity]
    J --> M[Database]
    K --> M
    L --> M
    E --> N[Asset Entity]
    F --> N
```

## Workflow

### Price Alerts

1. Scheduler runs every X hours based on user settings
2. AlertService fetches current prices (via AssetUpdateService?)
3. Compares with previous prices and thresholds
4. If threshold exceeded and interval passed, send email

### Reports

1. Scheduler runs daily/weekly/etc.
2. ReportService calculates portfolio totals
3. Generates report email
4. Sends via EmailService

### Historical Tracking

1. AssetUpdateService saves prices to HistoricalPrice
2. API provides data for charts and predictions

## Dependencies

- nodemailer: for email sending
- @nestjs/schedule: for scheduling
- Existing: TypeORM, class-validator

## Configuration

- Yandex SMTP credentials in .env
- Report schedules in config

## Security

- Notifications only for authenticated users
- Validate settings input
- Log notification attempts
