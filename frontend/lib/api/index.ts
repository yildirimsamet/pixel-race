
export * from './client';
export * from './types';

export * from './features/auth-client';
export * from './features/users-client';
export * from './features/horses-client';
export * from './features/races-client';
export * from './features/notifications-client';
export * from './features/goodluck-client';
export * from './features/rewards-client';
export * from './features/admin-client';
export * from './features/feedback-client';
export * from './features/chat-client';

import { authApi } from './features/auth-client';
import { usersApi } from './features/users-client';
import { horsesApi } from './features/horses-client';
import { racesApi } from './features/races-client';
import { notificationsApi } from './features/notifications-client';
import { goodluckApi } from './features/goodluck-client';
import { rewardsApi } from './features/rewards-client';
import { adminApi } from './features/admin-client';
import { feedbackApi } from './features/feedback-client';
import { chatApi } from './features/chat-client';

export const api = {
  auth: authApi,
  users: usersApi,
  horses: horsesApi,
  races: racesApi,
  notifications: notificationsApi,
  goodluck: goodluckApi,
  rewards: rewardsApi,
  admin: adminApi,
  feedback: feedbackApi,
  chat: chatApi,
};

export default api;

export const auth = authApi;
export const users = usersApi;
export const horses = horsesApi;
export const races = racesApi;
export const notifications = notificationsApi;
export const goodluck = goodluckApi;
export const rewards = rewardsApi;
export const admin = adminApi;
export const feedback = feedbackApi;
export const chat = chatApi;
