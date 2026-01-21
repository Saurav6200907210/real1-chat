// Generate and persist a unique user ID
const USER_ID_KEY = 'realchat_user_id';
const USER_NAME_KEY = 'realchat_user_name';

export function getUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

export function getUserName(): string {
  let userName = localStorage.getItem(USER_NAME_KEY);
  if (!userName) {
    const userNumber = Math.floor(Math.random() * 9999) + 1;
    userName = `User ${userNumber}`;
    localStorage.setItem(USER_NAME_KEY, userName);
  }
  return userName;
}

export function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name);
}

// Generate a short room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Get invite link for a room
export function getInviteLink(roomCode: string): string {
  return `${window.location.origin}/join/${roomCode}`;
}
