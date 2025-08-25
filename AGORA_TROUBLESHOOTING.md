# 🚨 LIVE STREAMING TROUBLESHOOTING GUIDE

## Issue: "CAN_NOT_GET_GATEWAY_SERVER: dynamic use static key"

### **Root Cause:**
Your Agora App ID configuration has authentication issues.

---

## 🔧 **IMMEDIATE FIXES (Do these in order):**

### **1. Verify Your Agora App ID**
Current App ID: `ae7e0fadaea8470fa5c8bee2cf6e2189`

**Check if this App ID is valid:**
1. Go to [Agora Console](https://console.agora.io/)
2. Log into your account
3. Go to "Projects" 
4. Find your project and verify the App ID matches

---

### **2. Fix Authentication Mode**

**The error suggests you need to disable App Certificate OR generate tokens.**

**Option A: Disable App Certificate (Easier for testing)**
1. In Agora Console → Your Project → Security
2. Find "App Certificate" 
3. **DISABLE** it if it's enabled
4. This allows testing without tokens

**Option B: Enable Token Authentication (Production)**
1. Keep App Certificate enabled
2. Generate access tokens for each user
3. This requires backend implementation

---

### **3. Update Environment Variables**

Make sure your `.env` file has:
```bash
# Current - Verify this is correct
VITE_AGORA_APP_ID=ae7e0fadaea8470fa5c8bee2cf6e2189

# If you get a new App ID, replace above
```

---

### **4. Quick Test Steps**

1. **Option 1: Try with a new Agora project**
   ```bash
   # Go to console.agora.io
   # Create a new project
   # Get the new App ID
   # Update your .env file
   # Make sure App Certificate is DISABLED
   ```

2. **Option 2: Test with Agora's demo App ID**
   ```bash
   # Temporarily use this for testing:
   VITE_AGORA_APP_ID=aab8b8f5a8cd4469a63042fcfafe7063
   ```

---

### **5. Test the Fix**

After updating your App ID:

1. **Build and redeploy:**
   ```bash
   npm run build
   git add .
   git commit -m "fix: update Agora App ID"
   git push
   ```

2. **Check Vercel environment variables:**
   - Go to Vercel dashboard
   - Your project → Settings → Environment Variables
   - Make sure `VITE_AGORA_APP_ID` is set correctly
   - Redeploy if needed

3. **Test on both devices:**
   - Instructor starts stream on laptop
   - Student should see it on phone

---

## 🔍 **Additional Debugging**

### Check Console Logs:
- Look for: `✅ Successfully joined channel`
- Should NOT see: `CAN_NOT_GET_GATEWAY_SERVER`

### Network Issues:
- Try different WiFi networks
- Check if corporate firewalls block Agora

### Browser Support:
- Chrome/Safari work best
- Mobile browsers may have restrictions

---

## 📱 **Cross-Device Detection Issue**

**The second issue:** Student phone not detecting instructor's stream

### Root Cause:
Database real-time subscriptions may not work reliably on mobile networks.

### Solutions:
1. **Manual Refresh:** Added refresh button in debug panel
2. **Periodic Checking:** Auto-check every 3 seconds (already implemented)
3. **Better Logging:** Debug panel shows connection status

---

## 🚀 **Next Steps**

1. **Fix Agora first** - This is blocking all streaming
2. **Test cross-device** - After Agora works
3. **Use debug panel** - To monitor connection status
4. **Manual refresh** - If auto-detection fails

---

## ⚡ **Quick Commands**

```bash
# Build and deploy
npm run build && git add . && git commit -m "fix agora" && git push

# Check environment variables
echo $VITE_AGORA_APP_ID

# Test locally
npm run dev
```

---

**Priority:** Fix the Agora App ID first - this will solve the primary streaming issue!
