# Image Storage Guide

## Directory Structure

### `/public/images/` - Static Assets
**Use for:** Static images that are part of your application design
**Access:** Directly accessible via URL
**Examples:** Logos, backgrounds, icons, default avatars

#### Subdirectories:
- `/auth/` - Login/register page images, branding
- `/events/` - Default event images, category icons
- `/users/` - Default profile pictures, placeholder avatars

**URL Access Example:**
```
http://your-domain.com/images/auth/login-background.jpg
```

**React/Frontend Usage:**
```tsx
<img src="/images/auth/login-background.jpg" alt="Login Background" />
```

### `/storage/app/public/uploads/` - User Uploads
**Use for:** User-uploaded content (profile pictures, event photos)
**Access:** Via Laravel storage link
**Security:** Can implement access controls

**Laravel Usage:**
```php
// Store uploaded file
$path = $request->file('image')->store('uploads', 'public');

// Generate URL
$url = Storage::url($path);
```

## Recommendations

1. **Static UI Images** → `/public/images/`
2. **User Uploads** → `/storage/app/public/uploads/`
3. **Temporary Files** → `/storage/app/temp/`

## Setup Storage Link
Run this command to create a symbolic link for storage:
```bash
php artisan storage:link
```