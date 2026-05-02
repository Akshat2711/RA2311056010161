# Campus Notification System Design

This design is for a simple campus notification system for students. It supports events, results, and placement updates.

## APIs

Basic APIs:

```http
GET /api/v1/notifications
POST /api/v1/notifications
PATCH /api/v1/notifications/{id}/read
GET /api/v1/notifications/unread-count
```

All protected APIs should use:

```http
Authorization: Bearer <token>
```

Example notification:

```json
{
  "type": "Placement",
  "message": "New placement drive announced",
  "channels": ["in_app", "email"]
}
```

## Real Time Updates

For live notifications, WebSocket or Server-Sent Events can be used.

The backend should first save the notification in the database, then push it to connected students.

## Database

PostgreSQL is a good choice because the data is structured and needs reliable queries.

Main tables:

- `students`
- `notifications`
- `student_notifications`
- `notification_deliveries`

`student_notifications` stores read/unread status for each student.

## Better Query

Instead of fetching everything, use pagination:

```sql
SELECT n.id, n.notification_type, n.message, n.created_at
FROM student_notifications sn
JOIN notifications n ON n.id = sn.notification_id
WHERE sn.student_id = 1042
  AND sn.is_read = false
ORDER BY n.created_at DESC
LIMIT 20;
```

Useful index:

```sql
CREATE INDEX idx_student_notifications_unread
ON student_notifications (student_id, is_read, created_at DESC);
```

Do not add indexes on every column. Add indexes only where they help common queries.

## Scaling

For many students, notifications should not be sent one by one in the request.

Better flow:

1. Save the notification.
2. Bulk insert student notification rows.
3. Add delivery jobs to a queue.
4. Workers send email and in-app messages later.
5. Retry failed jobs.

This makes the system faster and safer if email or push delivery fails.

## Priority Inbox

Notifications can be ranked like this:

- Placement: highest priority
- Result: medium priority
- Event: normal priority
- Newer notifications come first if priority is same

The implementation is in:

```text
notification_app_be/priority_inbox.js
```

Run it with:

```bash
npm run notifications
```

Logs are saved in the `logs` folder.
