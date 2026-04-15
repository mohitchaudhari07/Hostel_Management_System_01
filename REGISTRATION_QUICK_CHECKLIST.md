# ✅ Quick Registration Checklist

## Pre-Registration Checklist

Before you start, make sure:

- [ ] **Backend is running**
  ```bash
  cd Backend
  npm start
  # Should show: ✅ Server running on port 5000
  ```

- [ ] **Frontend is running**
  ```bash
  cd frontend
  npm run dev
  # Should show: Local: http://localhost:5175
  ```

- [ ] **Browser has permission to use camera**
  - Look for camera icon in address bar
  - Click and allow camera access

- [ ] **Good lighting available**
  - Face lamp on
  - Or sit near window
  - Avoid shadows

---

## Registration Flow Checklist

### For Each Student:

#### Step 1: Start Camera
- [ ] Click "🎥 Start Camera" button
- [ ] See live camera preview
- [ ] You appear in the webcam box

#### Step 2: Get Face Detected
- [ ] Position face clearly
- [ ] Good lighting on face
- [ ] See "✅ Face detected" message
- [ ] Wait max 3 seconds for detection

#### Step 3: Capture the Face
- [ ] Click "📸 Capture Face" button
- [ ] Button changes to "✨ Face Captured ✓"
- [ ] See message: "Face captured! Now select a student..."

#### Step 4: Select Student
- [ ] Click student dropdown
- [ ] Choose student name
- [ ] Student name appears in dropdown

#### Step 5: Register the Face
- [ ] "✨ Register Face" button is now enabled (not greyed out)
- [ ] Click "✨ Register Face" button
- [ ] See "⏳ Registering face..." (wait 1-2 seconds)
- [ ] See "✅ Registration successful" message

#### Step 6: Verify Registration
- [ ] Look at "✅ Registered Students" panel on right
- [ ] Your student appears in the list
- [ ] Shows student name with "Delete" button

#### Step 7: Repeat for Next Student
- [ ] Reset: Click "🛑 Stop Camera"
- [ ] Click "🎥 Start Camera" again
- [ ] Go back to Step 2 for next student

---

## Troubleshooting Checklist

### Issue: Face Not Detecting

- [ ] **Better lighting?** 
  - Increase light in room
  - Face lamp on
  - Bright white light (not yellow/orange)

- [ ] **Straight angle?**
  - Look directly at camera
  - Not tilted or angled
  - Face centered in frame

- [ ] **Close enough?**
  - ~30cm from camera
  - Face takes up ~25% of frame
  - Not too close, not too far

- [ ] **Face fully visible?**
  - No hat or mask
  - Eyes open
  - Whole face visible

- [ ] **Try refresh?**
  - Ctrl+Shift+R
  - Wait 20 seconds for models to load
  - Try again

---

### Issue: Button Disabled (Can't Click)

**"📸 Capture Face" disabled?**
- [ ] Face detected? See "✅ Face detected" message somewhere?
- [ ] Try repositioning face
- [ ] Better lighting?
- [ ] Camera working? See yourself in preview?

**"✨ Register Face" disabled?**
- [ ] Did you click "Capture Face"? Button should say "Face Captured ✓"
- [ ] Did you select a student from dropdown?
- [ ] Both required!

---

### Issue: Registration Fails

After clicking "Register Face", if you see error:

- [ ] **"Cannot find module"** → Backend not running
  - Stop frontend
  - Start backend: `cd Backend && npm start`
  - Restart frontend

- [ ] **"Network error"** → Backend offline
  - Check backend terminal for errors
  - Make sure port 5000 is not blocked
  - Try: `http://localhost:5000/api/health`

- [ ] **"Failed to register"** → Student already registered
  - This student already has a face
  - Delete existing registration first
  - Or register a different student

- [ ] **"Student not found"** → Wrong student ID
  - Click dropdown again
  - Make sure you selected a student
  - Select a different one if needed

---

### Issue: Camera Not Working

- [ ] **Permission denied?**
  - Click camera icon in address bar
  - Click "Allow" for camera access
  - Refresh page
  - Try again

- [ ] **Browser doesn't support?**
  - Use Chrome, Edge, Firefox
  - Safari might have issues
  - Internet Explorer won't work

- [ ] **Camera not connected?**
  - Check USB cable
  - Windows Settings → Privacy → Camera
  - Make sure app has permission

---

## Success Indicators ✅

You've successfully registered a face when:

1. ✅ "✅ Registration successful" message appears
2. ✅ Student appears in "Registered Students" panel (right side)
3. ✅ No errors in browser console (F12)
4. ✅ Backend terminal shows no errors
5. ✅ Can see timestamp of registration

---

## Testing Face Registration ✅

After registering faces, test that it worked:

1. Go to **Face Attendance** (Admin menu)
2. Click "Start Recognition"
3. Wait for your face to be recognized
4. Should see:
   - ✅ "Matched: [Your Name]"
   - ✅ Confidence percentage
   - ✅ Timestamp
   - ✅ Attendance marked

---

## Performance Targets

| Action | Target Time | Status |
|--------|-------------|--------|
| Face detection | < 500ms | ✅ Automatic every 500ms |
| Capture Face click | Instant | ✅ Immediate confirmation |
| Register Face API | 1-2 seconds | ✅ Depends on internet |
| Total per student | 30-60 seconds | ✅ With good lighting |

---

## Numbers to Check

- **Students detected**: Should show count in dropdown
  - "X students waiting for face registration"
  - If 0, all students already registered!

- **Students registered**: Check right panel
  - Shows number in title "✅ Registered Students"
  - Increases after each registration

- **Face descriptor size**: Technical (128 dimensions)
  - Should be saved automatically
  - Don't need to manually track

---

## Final Checklist Before Going Live

Before using with actual students:

- [ ] Test with 3-5 people (good lighting)
- [ ] All registrations successful?
- [ ] All faces recognized in Face Attendance?
- [ ] Attendance marked correctly with timestamp?
- [ ] Student dashboard shows attendance records?
- [ ] Backend console has no error messages?
- [ ] No browser errors (F12 console empty)?

---

## Command Reference

### Start Everything
```bash
# Terminal 1
cd Backend
npm start

# Terminal 2
cd frontend
npm run dev

# Browser
http://localhost:5175
# Admin credentials to log in
```

### Rebuild After Changes
```bash
cd frontend
npm run build
```

### Test Backend API
```bash
# In browser URL bar
http://localhost:5000/api/auth/students
# Should return list of students
```

### Debug Browser
```bash
F12  # Open Developer Tools
Console tab  # See error messages
Network tab  # See API calls
```

---

## Contact/Support

If something's stuck:

1. **Check browser console** (F12 → Console) for error messages
2. **Check backend terminal** for errors
3. **Force refresh** (Ctrl+Shift+R)
4. **Restart both** (backend + frontend)
5. **Read error messages** carefully - usually explain the issue

---

## Time Estimates

- **Setting up first time**: 5-10 minutes
- **Per student registration**: 30-60 seconds
- **Registering 20 students**: 15-20 minutes
- **Registering 50 students**: 30-45 minutes

---

**Last Updated**: Feb 20, 2026  
**Version**: 1.0.2  
**Status**: ✅ Ready to Use

Good luck! 🎉
