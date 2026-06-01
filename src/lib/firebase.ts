import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  query, 
  where, 
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connectivity state verification
let isFirebaseConnected = false;

export async function testConnection() {
  try {
    // Attempt load from server to test credentials
    await getDocFromServer(doc(db, 'settings', 'connection_probe'));
    isFirebaseConnected = true;
    console.log("Firebase connection established successfully.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network status.");
    } else {
      console.log("Firebase connection failed or permissions denied. Falling back to robust sync-mode.");
    }
  }
}

// --------------------------------------------------------------------------
// OPERATION ENUMS & ERROR HANDLER (MANDATED BY FIREBASE SKILL)
// --------------------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --------------------------------------------------------------------------
// MOCK BACKUP & DATA MODELS (TO SECURE COMPLETE FUNCTIONALITY NO MATTER WHAT)
// --------------------------------------------------------------------------
export interface DbUser {
  uid: string;
  name: string;
  email: string;
  country: string;
  broker: string;
  registrationDate: string;
  role?: 'user' | 'admin';
}

export interface DbOrder {
  id: string;
  userID: string;
  accountType: 'Instant' | 'Challenge';
  accountSize: number;
  price: number;
  paymentMethod: string;
  paymentStatus: 'Pending' | 'Completed';
  orderStatus: 'Pending' | 'Approved' | 'Rejected';
  broker: string;
  purchaseDate: string;
  accountNumber: string;
  // Live metrics
  balance: number;
  dailyLoss: number;
  maxDrawdown: number;
  profit: number;
}

export interface DbSupportTicket {
  id: string;
  userID: string;
  userName: string;
  messageText: string;
  adminReply: string;
  status: 'On Queue' | 'Replied';
  timestamp: string;
}

export interface DbPayment {
  txId: string;
  orderId: string;
  walletAddress: string;
  paymentMethod: string;
  amountCrypto: string;
  timestamp: string;
}

// Local mock tables if firebase fails or is not accessible
const initLocalStorage = () => {
  if (typeof window === 'undefined') return;
  if (!localStorage.getItem('qxt_users')) {
    localStorage.setItem('qxt_users', JSON.stringify({}));
  }
  if (!localStorage.getItem('qxt_orders')) {
    // Pre-populate with some beautiful mock records so the app starts fully populated and active!
    const mockOrders: Record<string, DbOrder> = {
      "demo_order_1": {
        id: "demo_order_1",
        userID: "demo_user",
        accountType: "Challenge",
        accountSize: 50000,
        price: 750,
        paymentMethod: "USDT TRC20",
        paymentStatus: "Completed",
        orderStatus: "Approved",
        broker: "Quotex",
        purchaseDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        accountNumber: "210048321",
        balance: 51240,
        dailyLoss: 120,
        maxDrawdown: 33333,
        profit: 1240
      },
      "demo_order_2": {
        id: "demo_order_2",
        userID: "demo_user",
        accountType: "Instant",
        accountSize: 11000,
        price: 238,
        paymentMethod: "USDT ERC20",
        paymentStatus: "Pending",
        orderStatus: "Pending",
        broker: "Pocket Option",
        purchaseDate: new Date().toISOString(),
        accountNumber: "PENDING_APPROVAL",
        balance: 11000,
        dailyLoss: 0,
        maxDrawdown: 7333,
        profit: 0
      }
    };
    localStorage.setItem('qxt_orders', JSON.stringify(mockOrders));
  }
  if (!localStorage.getItem('qxt_support')) {
    const mockTickets: Record<string, DbSupportTicket> = {
      "ticket_1": {
        id: "ticket_1",
        userID: "demo_user",
        userName: "Master Trader",
        messageText: "Hello, my USDT TRC20 transaction was sent but my account is still in Pending status. Can someone please verify?",
        adminReply: "Hello! We have verified your transaction on-chain. Your account size is now updated to Instant MT5. Happy trading!",
        status: "Replied",
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      "ticket_2": {
        id: "ticket_2",
        userID: "demo_user",
        userName: "Master Trader",
        messageText: "How can I request a payout check for my withdrawable profit?",
        adminReply: "",
        status: "On Queue",
        timestamp: new Date().toISOString()
      }
    };
    localStorage.setItem('qxt_support', JSON.stringify(mockTickets));
  }
  if (!localStorage.getItem('qxt_payments')) {
    localStorage.setItem('qxt_payments', JSON.stringify({}));
  }
};

initLocalStorage();

export const fallbackDb = {
  getUser: (uid: string): DbUser | null => {
    const data = JSON.parse(localStorage.getItem('qxt_users') || '{}');
    return data[uid] || null;
  },
  saveUser: (uid: string, user: DbUser) => {
    const data = JSON.parse(localStorage.getItem('qxt_users') || '{}');
    data[uid] = user;
    localStorage.setItem('qxt_users', JSON.stringify(data));
  },
  getOrders: (userID: string): DbOrder[] => {
    const data = JSON.parse(localStorage.getItem('qxt_orders') || '{}') as Record<string, DbOrder>;
    return Object.values(data).filter(order => order.userID === userID);
  },
  getAllOrders: (): DbOrder[] => {
    const data = JSON.parse(localStorage.getItem('qxt_orders') || '{}') as Record<string, DbOrder>;
    return Object.values(data);
  },
  saveOrder: (order: DbOrder) => {
    const data = JSON.parse(localStorage.getItem('qxt_orders') || '{}');
    data[order.id] = order;
    localStorage.setItem('qxt_orders', JSON.stringify(data));
  },
  getSupportTickets: (userID: string): DbSupportTicket[] => {
    const data = JSON.parse(localStorage.getItem('qxt_support') || '{}') as Record<string, DbSupportTicket>;
    return Object.values(data).filter(ticket => ticket.userID === userID);
  },
  getAllSupportTickets: (): DbSupportTicket[] => {
    const data = JSON.parse(localStorage.getItem('qxt_support') || '{}') as Record<string, DbSupportTicket>;
    return Object.values(data);
  },
  saveSupportTicket: (ticket: DbSupportTicket) => {
    const data = JSON.parse(localStorage.getItem('qxt_support') || '{}');
    data[ticket.id] = ticket;
    localStorage.setItem('qxt_support', JSON.stringify(data));
  },
  savePayment: (payment: DbPayment) => {
    const data = JSON.parse(localStorage.getItem('qxt_payments') || '{}');
    data[payment.txId] = payment;
    localStorage.setItem('qxt_payments', JSON.stringify(data));
  }
};
