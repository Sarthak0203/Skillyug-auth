# Cross-Device Live Streaming Troubleshooting Guide

## Current Issue
**Problem**: Student phone cannot detect instructor's live stream after Vercel deployment
- ✅ Instructor can start stream on laptop
- ✅ Database operations working
- ✅ Agora.io integration complete
- ❌ Student phone shows "No Active Stream"

## Enhanced Debugging Added

### 1. LiveStreamContext Enhanced Logging
- **Device detection**: Mobile device identification
- **Database queries**: Detailed query results and timing
- **Real-time subscriptions**: Connection status and payload details
- **Stream state changes**: Complete state transition logging

### 2. ProductionLiveStreamPlayer Enhanced Logging
- **Auto-join process**: Detailed channel joining for students
- **Agora connections**: Connection success/failure tracking
- **Environment variables**: Configuration validation

## Systematic Troubleshooting Steps

### Step 1: Check Environment Variables on Vercel
```bash
# Verify these are set in Vercel dashboard:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_AGORA_APP_ID=your-agora-app-id-here
```

### Step 2: Mobile Console Debugging
1. Open student phone browser dev tools (Chrome DevTools via USB debugging)
2. Navigate to Console tab
3. Look for these specific log patterns:

#### Expected Logs for Student Device:
```
[LiveStreamContext] 🚀 Setting up live stream monitoring...
[LiveStreamContext] 👤 User role - canStream: false
[LiveStreamContext] 📱 Device info: { isMobile: true, canStream: false, currentUser: "student_id" }
[LiveStreamContext] 📡 Setting up real-time subscriptions...
[LiveStreamContext] 📡 Live streams subscription status: "SUBSCRIBED"
```

#### When Instructor Starts Stream:
```
[LiveStreamContext] 🔔 Real-time stream update received: { eventType: "INSERT", new: {...} }
[LiveStreamContext] 📱 Student received real-time update, triggering check...
[LiveStreamContext] ✅ Found active live stream: {...}
[ProductionPlayer] 🔄 Auto-join effect triggered with: { shouldJoin: true }
[ProductionPlayer] 🎯 Auto-joining as viewer: { channelName: "...", userId: "..." }
```

### Step 3: Database Real-time Subscription Test
Run this in browser console on both devices:

```javascript
// Test real-time connection
window.supabase.channel('test-channel')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_streams'
  }, (payload) => {
    console.log('TEST: Real-time working:', payload)
  })
  .subscribe((status) => {
    console.log('TEST: Subscription status:', status)
  })
```

### Step 4: Manual Database Query Test
```javascript
// Test direct database access from student phone
window.supabase
  .from('live_streams')
  .select('*')
  .eq('is_active', true)
  .then(result => console.log('Manual query result:', result))
```

### Step 5: Agora Configuration Check
```javascript
// Test Agora App ID availability
console.log('Agora App ID:', import.meta.env.VITE_AGORA_APP_ID)
console.log('All env vars:', import.meta.env)
```

## Common Issues & Solutions

### Issue 1: Environment Variables Not Available
**Symptoms**: `undefined` in Agora App ID
**Solution**: 
1. Check Vercel dashboard → Settings → Environment Variables
2. Ensure all variables start with `VITE_`
3. Redeploy after adding variables

### Issue 2: Real-time Subscriptions Not Working
**Symptoms**: No real-time update logs on student device
**Solution**:
1. Check Supabase dashboard → Authentication → RLS policies
2. Verify `live_streams` table has proper SELECT policies
3. Test with RLS disabled temporarily

### Issue 3: Cross-Domain/CORS Issues
**Symptoms**: Network errors, blocked requests
**Solution**:
1. Check Supabase dashboard → Settings → API
2. Add Vercel domain to allowed origins
3. Verify HTTPS is working on both devices

### Issue 4: Mobile Network/Performance
**Symptoms**: Slow updates, connection timeouts
**Solution**:
1. Test on WiFi vs mobile data
2. Check periodic polling (every 3 seconds for students)
3. Verify mobile browser supports WebRTC

## Diagnostic Commands

### For Student Phone:
```javascript
// Complete diagnostic
console.log('=== DIAGNOSTIC START ===')
console.log('User Agent:', navigator.userAgent)
console.log('Is Mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
console.log('Environment:', import.meta.env)
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('Agora App ID:', import.meta.env.VITE_AGORA_APP_ID)
console.log('=== DIAGNOSTIC END ===')
```

### For Instructor Laptop:
```javascript
// Test stream creation
window.supabase
  .from('live_streams')
  .insert({
    title: 'Test Stream',
    stream_url: 'stream_test_123',
    is_active: true
  })
  .then(result => console.log('Test stream created:', result))
```

## Next Steps Based on Logs

1. **If no real-time updates**: Focus on Supabase configuration
2. **If real-time works but no Agora connection**: Check environment variables
3. **If Agora connects but no video**: Check media permissions
4. **If everything logs correctly but UI not updating**: Check React state management

## Contact Points for Further Help

- **Supabase Issues**: Check Supabase dashboard logs
- **Agora Issues**: Verify App ID and channel naming
- **Vercel Issues**: Check deployment logs and environment variables
- **Mobile Issues**: Use Chrome DevTools via USB debugging

---

Run through these steps systematically and share the console output to identify the exact point of failure.
