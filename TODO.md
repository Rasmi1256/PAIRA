# TODO: Add Incoming Call Modal to DashboardPage

## Steps to Complete

- [ ] Create IncomingCallModal component with caller info, accept/reject buttons
- [ ] Update DashboardPage.tsx: Add state for modal visibility and incoming call data; subscribe to videoCallSocket.onIncomingCallEvent to show modal and play ringtone; handle accept (navigate to "/video-call", stop ringtone) and reject (close modal, stop ringtone)
- [ ] Update VideoCallGlobalListener.tsx: Check if on dashboard (location.pathname === "/"); if yes, skip navigation to avoid conflict with modal
- [ ] Test the flow: Caller initiates, callee sees modal on dashboard, ringtone plays, accept navigates to "/video-call", reject closes modal and stops ringtone
