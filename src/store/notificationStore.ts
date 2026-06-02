import { create } from 'zustand';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'new_request' | 'new_offer' | 'info' | 'success';
  timestamp: string;
  read: boolean;
  linkTo?: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  syncNotifications: (
    user: any,
    currentRequests: any[],
    currentProposals: any[]
  ) => void;
}

const getStoredNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem('campus_connect_notifications');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: getStoredNotifications(),

  addNotification: (notification) => {
    const newNotif: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      localStorage.setItem('campus_connect_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      localStorage.setItem('campus_connect_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  markAllAsRead: () => {
    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      localStorage.setItem('campus_connect_notifications', JSON.stringify(updated));
      return { notifications: updated };
    });
  },

  clearAll: () => {
    set(() => {
      localStorage.removeItem('campus_connect_notifications');
      return { notifications: [] };
    });
  },

  syncNotifications: (user, currentRequests, currentProposals) => {
    if (!user) return;

    const storedRequestsKey = 'cc_seen_request_ids';
    const storedProposalsKey = 'cc_seen_proposal_ids';

    const seenRequestIdsRaw = localStorage.getItem(storedRequestsKey);
    const seenProposalIdsRaw = localStorage.getItem(storedProposalsKey);

    const isFirstRequestLoad = seenRequestIdsRaw === null;
    const isFirstProposalLoad = seenProposalIdsRaw === null;

    const seenRequestIdsSet = new Set<string>(
      seenRequestIdsRaw ? JSON.parse(seenRequestIdsRaw) : []
    );
    const seenProposalIdsSet = new Set<string>(
      seenProposalIdsRaw ? JSON.parse(seenProposalIdsRaw) : []
    );

    let madeChanges = false;
    const notificationsToAdd: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [];

    // --- VENDORS NOTIFICATION CRITERIA ---
    if (user.role === 'vendor') {
      currentRequests.forEach((req) => {
        if (!req || !req.id) return;
        // Check if we already know about this request
        if (!seenRequestIdsSet.has(req.id)) {
          seenRequestIdsSet.add(req.id);
          madeChanges = true;

          // If this isn't the fallback/first load, notify
          if (!isFirstRequestLoad) {
            notificationsToAdd.push({
              title: 'New Student Request Posted!',
              message: `A student on campus is looking for "${req.item || req.title || 'item'}" with a budget of M${req.budget || '0'}.`,
              type: 'new_request',
              linkTo: '/requests',
            });
          }
        }
      });
    }

    // --- STUDENTS NOTIFICATION CRITERIA ---
    if (user.role === 'student' || !user.role) {
      // Find students' own request IDs to compare incoming proposals
      const studentRequests = currentRequests.filter(
        (r) => r && (r.studentUid === user.uid || (user.displayName && r.student === user.displayName))
      );
      const studentRequestIds = new Set<string>(studentRequests.map((r) => r.id));

      currentProposals.forEach((prop) => {
        if (!prop || !prop.id) return;

        // Is this proposal belonging to a request started by the student?
        const isMyRequest = studentRequestIds.has(prop.requestId);

        if (isMyRequest && !seenProposalIdsSet.has(prop.id)) {
          seenProposalIdsSet.add(prop.id);
          madeChanges = true;

          // If this isn't the fallback/first load, notify
          if (!isFirstProposalLoad) {
            notificationsToAdd.push({
              title: 'New Vendor Offer Received!',
              message: `"${prop.vendorName || 'A vendor'}" sent a pitch of M${prop.proposedPrice} for your request "${prop.requestTitle || 'your item'}".`,
              type: 'new_offer',
              linkTo: '/dashboard',
            });
          }
        }
      });
    }

    // Persist seen sets
    if (madeChanges || isFirstRequestLoad || isFirstProposalLoad) {
      localStorage.setItem(storedRequestsKey, JSON.stringify(Array.from(seenRequestIdsSet)));
      localStorage.setItem(storedProposalsKey, JSON.stringify(Array.from(seenProposalIdsSet)));
    }

    // Add generated notifications to store
    if (notificationsToAdd.length > 0) {
      notificationsToAdd.forEach((notif) => {
        get().addNotification(notif);
      });
    }
  },
}));
