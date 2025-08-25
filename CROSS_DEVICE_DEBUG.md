# 🔍 CROSS-DEVICE STREAMING TROUBLESHOOTING

## Current Issue: Student phone not detecting instructor's laptop stream

### Quick Debug Steps:

1. **Check if both devices are using the SAME Vercel deployment URL**
   - Laptop: https://your-app.vercel.app
   - Phone: https://your-app.vercel.app (same URL)

2. **Verify database connection on phone**
   - Open browser console on phone (if possible)
   - Look for Supabase connection errors

3. **Check environment variables on Vercel**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Ensure these are set:
     ```
     VITE_SUPABASE_URL=https://wqgpioqfjizvgrnocwqf.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     VITE_AGORA_APP_ID=ae7e0fadaea8470fa5c8bee2cf6e2189
     ```

4. **Test sequence**:
   - Laptop: Login as instructor → Start stream
   - Wait 10 seconds
   - Phone: Login as student → Check if "Live Stream Active" appears

## Common Issues:

### Issue 1: Environment Variables Not Set in Vercel
**Solution**: Add all env vars to Vercel Dashboard

### Issue 2: Different Users Not Logged In
**Solution**: Ensure instructor and student are different accounts

### Issue 3: Database Real-time Subscription Issues
**Solution**: Check Supabase real-time is enabled

### Issue 4: Network/Firewall Blocking
**Solution**: Try different network or mobile data

## Quick Test Commands:

```bash
# Redeploy with environment variables
vercel --prod

# Check if env vars are available
vercel env ls
```

## Expected Console Output:

### On Instructor (Laptop):
```
[LiveStreamContext] 👨‍🏫 Instructor ready to stream
[LiveStreamContext] 🌐 Sharing stream globally to all students...
Stream saved to database successfully
```

### On Student (Phone):
```
[LiveStreamContext] 📡 Student: Listening for instructor stream...
Found active live stream: Object
[ProductionPlayer] Auto-joining as viewer
```

If you don't see the "Found active live stream" message on the phone, the issue is database connection or real-time subscription.
