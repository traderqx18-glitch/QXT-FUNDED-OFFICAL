import React, { useState, useEffect, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  getDoc 
} from 'firebase/firestore';
import { 
  auth, db, fallbackDb, 
  DbUser, DbOrder, DbSupportTicket 
} from './lib/firebase';
import QuickPayView from './components/QuickPayView';

// Accounts Data Constants
const INSTANT_ACCOUNTS = [
  { size: 3000, price: 65, daily: 700, payout: '92%' },
  { size: 5000, price: 108, daily: 1167, payout: '92%' },
  { size: 8000, price: 173, daily: 1867, payout: '92%' },
  { size: 11000, price: 238, daily: 2567, payout: '92%' },
  { size: 14000, price: 303, daily: 3267, payout: '92%' },
  { size: 17000, price: 368, daily: 3967, payout: '92%' },
  { size: 20000, price: 433, daily: 4667, payout: '92%' },
  { size: 23000, price: 498, daily: 5367, payout: '92%' },
  { size: 26000, price: 563, daily: 6067, payout: '92%' },
  { size: 29000, price: 628, daily: 6767, payout: '92%' },
  { size: 32000, price: 693, daily: 7467, payout: '92%' },
  { size: 35000, price: 758, daily: 8167, payout: '92%' },
  { size: 38000, price: 823, daily: 8867, payout: '92%' },
  { size: 41000, price: 888, daily: 9567, payout: '92%' },
  { size: 44000, price: 953, daily: 10267, payout: '92%' },
  { size: 47000, price: 1018, daily: 10967, payout: '92%' },
  { size: 50000, price: 1083, daily: 11667, payout: '92%' },
];

const CHALLENGE_ACCOUNTS = [
  { size: 3000, price: 45, target: 1200, daily: 900, drawdown: 2000 },
  { size: 5000, price: 75, target: 2000, daily: 1500, drawdown: 3333 },
  { size: 8000, price: 120, target: 3200, daily: 2400, drawdown: 5333 },
  { size: 11000, price: 165, target: 4400, daily: 3300, drawdown: 7333 },
  { size: 14000, price: 210, target: 5600, daily: 4200, drawdown: 9333 },
  { size: 17000, price: 255, target: 6800, daily: 5100, drawdown: 11333 },
  { size: 20000, price: 300, target: 8000, daily: 6000, drawdown: 13333 },
  { size: 23000, price: 345, target: 9200, daily: 6900, drawdown: 15333 },
  { size: 26000, price: 390, target: 10400, daily: 7800, drawdown: 17333 },
  { size: 29000, price: 435, target: 11600, daily: 8700, drawdown: 19333 },
  { size: 32000, price: 480, target: 12800, daily: 9600, drawdown: 21333 },
  { size: 35000, price: 525, target: 14000, daily: 10500, drawdown: 23333 },
  { size: 38000, price: 570, target: 15200, daily: 11400, drawdown: 25333 },
  { size: 41000, price: 615, target: 16400, daily: 12300, drawdown: 27333 },
  { size: 44000, price: 660, target: 17600, daily: 13200, drawdown: 29333 },
  { size: 47000, price: 705, target: 18800, daily: 14100, drawdown: 31333 },
  { size: 50000, price: 750, target: 20000, daily: 15000, drawdown: 33333 },
];

const BROKERS = ['Pocket Option', 'Quotex', 'Binomo', 'Olymp Trade', 'Tradowix'];

const BROKER_LOGOS: Record<string, string> = {
  'Pocket Option': 'https://i.ibb.co/4RWf6GPR/Pocket-Option-logo-PNG1.png',
  'Quotex': 'https://i.ibb.co/XxgfVcbP/quotex-io-seeklogo.png',
  'Binomo': 'https://i.ibb.co/kCCmxZ7/binomo-logo.png',
  'Olymp Trade': 'https://i.ibb.co/FqDRTqx1/toppng-com-olymp-trade-transparent-logo-png-5000x5113.png',
  'Tradowix': 'https://i.ibb.co/23dgStg7/Trado-Wix-logo.jpg',
};

const BROKER_LINKS: Record<string, string> = {
  'Pocket Option': 'https://i.ibb.co/4RWf6GPR/Pocket-Option-logo-PNG1.png',
  'Quotex': 'https://i.ibb.co/XxgfVcbP/quotex-io-seeklogo.png',
  'Binomo': 'https://i.ibb.co/kCCmxZ7/binomo-logo.png',
  'Olymp Trade': 'https://i.ibb.co/FqDRTqx1/toppng-com-olymp-trade-transparent-logo-png-5000x5113.png',
  'Tradowix': 'https://ibb.co/4RpP2TPZ',
};

const PAYMENT_METHODS = [
  { id: 'usdt_erc20', label: 'USDT ERC20', icon: 'USDT', wallet: '0x1B4AA3ecfDDe71bfb92486aBA7DC66a5282Bb562', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: 'USDT', wallet: 'TJifFFsKRS3McB5eLhNDjpjzZFHbgqk3Dz', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'bep20', label: 'USDT BEP20', icon: 'USDT', wallet: '0x1B4AA3ecfDDe71bfb92486aBA7DC66a5282Bb562', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png' },
  { id: 'btc', label: 'Bitcoin', icon: 'BTC', wallet: 'bc1qfckj3f02hmpawgck4x3w0dah4jl08q2mcrcra6', logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png' },
  { id: 'eth', label: 'Ethereum', icon: 'ETH', wallet: '0x1B4AA3ecfDDe71bfb92486aBA7DC66a5282Bb562', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
];

const adjustOrderStatus = (order: DbOrder): DbOrder => {
  if (order.orderStatus === 'Pending') {
    const elapsedMs = Date.now() - new Date(order.purchaseDate).getTime();
    if (elapsedMs > 1 * 60 * 60 * 1000) { // 1 hour
      return {
        ...order,
        orderStatus: 'Rejected' as const
      };
    }
  }
  return order;
};

export default function App() {
  // Navigation & User session states
  const [activePage, setActivePage] = useState<'home' | 'accounts' | 'purchase' | 'dashboard' | 'admin' | 'payment'>('home');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<DbUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Home accounts toggle
  const [accountsTab, setAccountsTab] = useState<'instant' | 'challenge'>('instant');

  // Auth Modal states
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'login' | 'signup' }>({ open: false, mode: 'login' });
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPass, setSuPass] = useState('');
  const [suCountry, setSuCountry] = useState('United States');
  const [suLoading, setSuLoading] = useState(false);
  const [liEmail, setLiEmail] = useState('');
  const [liPass, setLiPass] = useState('');
  const [liLoading, setLiLoading] = useState(false);

  // Purchase States
  const [purchaseState, setPurchaseState] = useState<{
    step: number;
    account: any;
    type: 'instant' | 'challenge';
    broker: string | null;
    payment: string | null;
  } | null>(null);
  const [pendingPurchaseData, setPendingPurchaseData] = useState<any>(null);
  const [redirectedInvoice, setRedirectedInvoice] = useState<DbOrder | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Promo Code States
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [showPromoInput, setShowPromoInput] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  // Dashboard Sub-navigation Tab
  const [dashActiveTab, setDashActiveTab] = useState<'overview' | 'accounts' | 'orders' | 'support'>('overview');
  const [dashboardOrders, setDashboardOrders] = useState<DbOrder[]>([]);
  const [dashboardSupport, setDashboardSupport] = useState<DbSupportTicket[]>([]);
  const [supportInputMsg, setSupportInputMsg] = useState('');

  // Admin section States
  const [adminActiveTab, setAdminActiveTab] = useState<'orders' | 'users' | 'support'>('orders');
  const [adminOrders, setAdminOrders] = useState<DbOrder[]>([]);
  const [adminUsers, setAdminUsers] = useState<DbUser[]>([]);
  const [adminSupport, setAdminSupport] = useState<DbSupportTicket[]>([]);
  const [adminReplies, setAdminReplies] = useState<Record<string, string>>({});

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'info' }>({
    show: false,
    msg: '',
    type: 'info'
  });

  // FAQ Page interactive states
  const [faqSearchQuery, setFaqSearchQuery] = useState('');
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  // Display date
  const [dashDateString, setDashDateString] = useState('');

  useEffect(() => {
    setDashDateString(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
  }, []);

  // Show customized system toasts
  const triggerToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  // Firebase auth sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Look up custom Firestore profile, fallback to localStorage
        let profile = fallbackDb.getUser(user.uid);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            profile = snap.data() as DbUser;
          }
        } catch (err) {
          console.warn('Firestore profile load error, falling back locally', err);
        }

        if (!profile) {
          profile = {
            uid: user.uid,
            name: user.displayName || user.email?.split('@')[0].toUpperCase() || 'Candidate',
            email: user.email || '',
            country: 'Global',
            broker: 'Quotex',
            registrationDate: new Date().toISOString()
          };
          fallbackDb.saveUser(user.uid, profile);
        }

        setUserData(profile);
        const checkIsAdmin = user.email === 'qxtfunded0@gmail.com' || (profile as any)?.isAdmin === true;
        setIsAdmin(checkIsAdmin);

        // Resume purchase flow if page configuration cached previously
        if (pendingPurchaseData) {
          setPurchaseState(pendingPurchaseData);
          setPendingPurchaseData(null);
          setAuthModal({ open: false, mode: 'login' });
          setActivePage('purchase');
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setIsAdmin(false);
      }
    });

    return () => unsub();
  }, [pendingPurchaseData]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Signout issue', e);
    }
    setCurrentUser(null);
    setUserData(null);
    setIsAdmin(false);
    setActivePage('home');
    triggerToast('Logged out successfully', 'info');
  };

  // Handle Registration / Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suName || !suEmail || !suPass) return;
    setSuLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, suEmail, suPass);
      const newProfile: DbUser = {
        uid: cred.user.uid,
        name: suName,
        email: suEmail,
        country: suCountry,
        broker: 'Quotex',
        registrationDate: new Date().toISOString()
      };
      
      // Save in Firestore
      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch (err) {
        console.warn('Firestore write failure, using offline storage');
      }
      fallbackDb.saveUser(cred.user.uid, newProfile);
      setUserData(newProfile);

      triggerToast('Account created! Welcome to QXT Funded 🎉', 'success');
      setAuthModal({ open: false, mode: 'login' });
      setSuName('');
      setSuEmail('');
      setSuPass('');

      if (pendingPurchaseData) {
        setPurchaseState(pendingPurchaseData);
        setPendingPurchaseData(null);
        setActivePage('purchase');
      } else {
        setActivePage('dashboard');
        setDashActiveTab('overview');
      }
    } catch (err: any) {
      triggerToast(err.message || 'Signup error', 'error');
    } finally {
      setSuLoading(false);
    }
  };

  // Handle Log In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liEmail || !liPass) return;
    setLiLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, liEmail, liPass);
      triggerToast('Welcome back!', 'success');
      setAuthModal({ open: false, mode: 'login' });
      setLiEmail('');
      setLiPass('');

      // Check user role
      let profile = fallbackDb.getUser(cred.user.uid);
      try {
        const snap = await getDoc(doc(db, 'users', cred.user.uid));
        if (snap.exists()) {
          profile = snap.data() as DbUser;
        }
      } catch (err) {
        console.warn('Firestore load profile error', err);
      }

      const adminCheck = cred.user.email === 'qxtfunded0@gmail.com' || (profile as any)?.isAdmin === true;

      if (pendingPurchaseData) {
        setPurchaseState(pendingPurchaseData);
        setPendingPurchaseData(null);
        setActivePage('purchase');
      } else {
        if (adminCheck) {
          setActivePage('admin');
          setAdminActiveTab('orders');
        } else {
          setActivePage('dashboard');
          setDashActiveTab('overview');
        }
      }
    } catch (err: any) {
      triggerToast('Invalid email or password', 'error');
    } finally {
      setLiLoading(false);
    }
  };

  const getAccountPrice = (account: any, type: string) => {
    if (appliedPromo === 'QXTFUNDED40') {
      return Math.round(account.price * 0.6); // 40% off on every account
    }
    return account.price;
  };

  // Choose Account to proceed to purchase
  const handleSelectAccount = (idx: number, type: 'instant' | 'challenge') => {
    // Reset Promo States on selection
    setPromoCode('');
    setAppliedPromo(null);
    setShowPromoInput(false);
    setPromoError(null);

    const account = type === 'instant' ? INSTANT_ACCOUNTS[idx] : CHALLENGE_ACCOUNTS[idx];
    const initialPurchase = {
      step: 1,
      account,
      type,
      broker: null,
      payment: null
    };

    if (!currentUser) {
      setPendingPurchaseData(initialPurchase);
      setAuthModal({ open: true, mode: 'signup' });
      return;
    }

    setPurchaseState(initialPurchase);
    setActivePage('purchase');
  };

  const handleBrokerClick = (b: string) => {
    const link = BROKER_LINKS[b];
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  // Submit actual order to Firestore / LocalStorage
  const handleFinalizeOrder = async (paymentOverride?: string) => {
    if (!currentUser || !purchaseState || !purchaseState.account) return;
    const { account, type, broker, payment } = purchaseState;
    const finalPayment = paymentOverride || payment || 'usdt_trc20';

    const orderPayload = {
      accountType: type === 'instant' ? 'Instant' as const : 'Challenge' as const,
      accountSize: account.size,
      price: getAccountPrice(account, type),
      broker: broker || 'Quotex',
      paymentMethod: finalPayment,
      userID: currentUser.uid,
      userEmail: currentUser.email || '',
      paymentStatus: 'Pending' as const,
      orderStatus: 'Pending' as const,
      purchaseDate: new Date().toISOString(),
      accountNumber: 'PENDING_APPROVAL',
      balance: account.size,
      dailyLoss: 0,
      maxDrawdown: type === 'instant' ? (account.daily * 3) : account.drawdown,
      profit: 0
    };

    try {
      const orderId = 'order_' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const finalOrder = { id: orderId, ...orderPayload };
      
      // Write database order
      try {
        await setDoc(doc(db, 'orders', orderId), finalOrder);
      } catch (err) {
        console.warn('Firestore write blocked, caching locally');
      }

      fallbackDb.saveOrder(finalOrder);

      // Update user purchasedAccounts reference
      const accounts = userData?.purchasedAccounts || [];
      const updatedAccounts = [...accounts, { orderId, ...orderPayload, status: 'Pending' }];

      try {
        await updateDoc(doc(db, 'users', currentUser.uid), { purchasedAccounts: updatedAccounts });
      } catch (err) {
        console.warn('Firestore user profile sync error');
      }

      if (userData) {
        setUserData({ ...userData, purchasedAccounts: updatedAccounts as any });
      }

      triggerToast('Redirecting to separate payment page...', 'success');
      setRedirectedInvoice(finalOrder);
      setPurchaseState(null);
      setActivePage('payment');
    } catch (err: any) {
      triggerToast('Error initiating payment page: ' + err.message, 'error');
    }
  };

  // Load user data for Dashboard view
  useEffect(() => {
    if (currentUser && activePage === 'dashboard') {
      const fetchUserData = async () => {
        // Fallback sync initially
        const locOrders = fallbackDb.getOrders(currentUser.uid);
        locOrders.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        setDashboardOrders(locOrders.map(adjustOrderStatus));

        const locTickets = fallbackDb.getSupportTickets(currentUser.uid);
        locTickets.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setDashboardSupport(locTickets);

        // Firestore real-time load
        try {
          const qOrders = query(collection(db, 'orders'), where('userID', '==', currentUser.uid));
          const snapOrders = await getDocs(qOrders);
          const ordersList: DbOrder[] = [];
          snapOrders.forEach((doc) => {
            ordersList.push(doc.data() as DbOrder);
          });
          if (ordersList.length > 0) {
            ordersList.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
            setDashboardOrders(ordersList.map(adjustOrderStatus));
          }

          const qSupport = query(collection(db, 'support'), where('userID', '==', currentUser.uid));
          const snapSupport = await getDocs(qSupport);
          const supportList: DbSupportTicket[] = [];
          snapSupport.forEach((doc) => {
            supportList.push(doc.data() as DbSupportTicket);
          });
          if (supportList.length > 0) {
            supportList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setDashboardSupport(supportList);
          }
        } catch (err) {
          console.warn('Firestore premium loader failed. Active local fallback matches.');
        }
      };

      fetchUserData();
    }
  }, [currentUser, activePage, dashActiveTab]);

  // Load Admin metrics and elements
  const fetchAdminData = async () => {
    if (!currentUser || !isAdmin) return;

    // Fallbacks
    const locOrders = fallbackDb.getAllOrders();
    locOrders.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
    setAdminOrders(locOrders);

    const locSupport = fallbackDb.getAllSupportTickets();
    locSupport.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setAdminSupport(locSupport);

    // Load registered users from localStorage fallbacks initially
    const locUsers: DbUser[] = Object.values(JSON.parse(localStorage.getItem('qxt_users') || '{}'));
    setAdminUsers(locUsers);

    // Try loads through real firestore
    try {
      const snapOrders = await getDocs(collection(db, 'orders'));
      const listOrders: DbOrder[] = [];
      snapOrders.forEach(doc => {
        listOrders.push(doc.data() as DbOrder);
      });
      if (listOrders.length > 0) {
        listOrders.sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
        setAdminOrders(listOrders);
      }

      const snapSupport = await getDocs(collection(db, 'support'));
      const listSupport: DbSupportTicket[] = [];
      snapSupport.forEach(doc => {
        listSupport.push(doc.data() as DbSupportTicket);
      });
      if (listSupport.length > 0) {
        listSupport.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setAdminSupport(listSupport);
      }

      const snapUsers = await getDocs(collection(db, 'users'));
      const listUsers: DbUser[] = [];
      snapUsers.forEach(doc => {
        listUsers.push(doc.data() as DbUser);
      });
      if (listUsers.length > 0) {
        setAdminUsers(listUsers);
      }
    } catch (err) {
      console.warn('Firestore administration list fetching offline / permission blocked.');
    }
  };

  useEffect(() => {
    if (activePage === 'admin' && isAdmin) {
      fetchAdminData();
    }
  }, [activePage, adminActiveTab, isAdmin]);

  // Submit Support Ticket from client dashboard
  const handleSendSupportMessage = async () => {
    if (!supportInputMsg.trim() || !currentUser) return;
    const ticketId = 'ticket_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const payload: DbSupportTicket = {
      id: ticketId,
      userID: currentUser.uid,
      userName: userData?.name || 'Trader Candidate',
      messageText: supportInputMsg,
      adminReply: '',
      status: 'On Queue',
      timestamp: new Date().toISOString()
    };

    try {
      try {
        await setDoc(doc(db, 'support', ticketId), payload);
      } catch (err) {
        console.warn('Firestore database write restricted');
      }

      fallbackDb.saveSupportTicket(payload);
      setSupportInputMsg('');
      triggerToast('Message sent! Our support team will reply soon.', 'success');

      // Sync active state list
      setDashboardSupport(prev => [payload, ...prev]);
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Admin approvals update orderStatus
  const handleAdminUpdateOrderStatus = async (orderId: string, status: 'Approved' | 'Rejected') => {
    try {
      try {
        await updateDoc(doc(db, 'orders', orderId), { orderStatus: status });
      } catch (err) {
        console.warn('Firestore update restricted, updating locally');
      }

      const allOrders = JSON.parse(localStorage.getItem('qxt_orders') || '{}');
      if (allOrders[orderId]) {
        allOrders[orderId].orderStatus = status;
        localStorage.setItem('qxt_orders', JSON.stringify(allOrders));
      }

      triggerToast(`Order status successfully updated to ${status}!`, 'success');
      fetchAdminData();
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Admin reply support messages
  const handleAdminReplySupport = async (ticketId: string) => {
    const adminReplyText = adminReplies[ticketId];
    if (!adminReplyText || !adminReplyText.trim()) {
      triggerToast('Reply message cannot be empty', 'error');
      return;
    }

    try {
      try {
        await updateDoc(doc(db, 'support', ticketId), { adminReply: adminReplyText, status: 'Replied' });
      } catch (err) {
        console.warn('Firestore admin write failure');
      }

      const allTickets = JSON.parse(localStorage.getItem('qxt_support') || '{}');
      if (allTickets[ticketId]) {
        allTickets[ticketId].adminReply = adminReplyText;
        allTickets[ticketId].status = 'Replied';
        localStorage.setItem('qxt_support', JSON.stringify(allTickets));
      }

      triggerToast('Support ticket answer submitted!', 'success');
      setAdminReplies(prev => ({ ...prev, [ticketId]: '' }));
      fetchAdminData();
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // Helper formatting numbers
  const fmtMoney = (n: number) => {
    return '$' + n.toLocaleString();
  };

  return (
    <>
      {/* Toast Alert */}
      <div className={`toast toast-${toast.type} ${toast.show ? 'show' : ''}`}>
        {toast.msg}
      </div>

      {/* Nav Section */}
      <nav>
        <div 
          className="nav-logo cursor-pointer" 
          onClick={() => { setActivePage('home'); setPurchaseState(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <img 
            src="https://i.ibb.co/VcyBJsFK/Gemini-Generated-Image-v36xfhv36xfhv36x.png" 
            alt="QXT Funded" 
            style={{ height: '42px', width: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold)' }}
          />
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 850, color: 'var(--text)', fontSize: '1.25rem', tracking: '-0.02em' }}>
            <span style={{ color: 'var(--gold)' }}>QXT</span> Funded
          </span>
        </div>
        
        <ul className="nav-links">
          <li><a href="#accounts" onClick={() => setActivePage('home')}>Accounts</a></li>
          <li><a href="#brokers" onClick={() => setActivePage('home')}>Brokers</a></li>
          <li><a href="#how-it-works" onClick={() => setActivePage('home')}>How It Works</a></li>
          <li><span className="cursor-pointer" onClick={() => { setActivePage('faq'); window.scrollTo({ top: 0 }); }}>FAQ</span></li>
          <li><a href="#reviews" onClick={() => setActivePage('home')}>Reviews</a></li>
        </ul>

        <div className="nav-actions">
          {currentUser ? (
            <>
              {/* Admin Panel button removed from the top bar per instructions */}
              <button 
                className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-blue' : 'btn-outline'}`}
                onClick={() => { setActivePage('dashboard'); setDashActiveTab('overview'); }}
              >
                Dashboard
              </button>
              <button 
                className="btn btn-sm" 
                onClick={handleLogout}
                style={{ background: '#000000', color: '#ffffff', border: '1px solid var(--border)' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-outline" onClick={() => setAuthModal({ open: true, mode: 'login' })}>
                Sign In
              </button>
              <button className="btn btn-gold" onClick={() => setAuthModal({ open: true, mode: 'signup' })}>
                Get Funded
              </button>
            </>
          )}
          <button className="mobile-nav-toggle" onClick={() => setMobileNavOpen(true)}>☰</button>
        </div>
      </nav>

      {/* Mobile Nav menu mapping */}
      <div className={`mobile-nav-menu ${mobileNavOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--gold)', fontSize: '1.2rem' }}>
            QXT Funded
          </span>
          <button 
            onClick={() => setMobileNavOpen(false)} 
            style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.4rem', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
        <a 
          href="#accounts" 
          onClick={() => { setMobileNavOpen(false); setActivePage('home'); }} 
          style={{ color: 'var(--text2)', fontSize: '1rem', decoration: 'none', padding: '0.75rem 0', borderBottom: '1px solid var(--border2)' }}
        >
          Accounts
        </a>
        <a 
          href="#brokers" 
          onClick={() => { setMobileNavOpen(false); setActivePage('home'); }} 
          style={{ color: 'var(--text2)', fontSize: '1rem', decoration: 'none', padding: '0.75rem 0', borderBottom: '1px solid var(--border2)' }}
        >
          Brokers
        </a>
        <a 
          href="#how-it-works" 
          onClick={() => { setMobileNavOpen(false); setActivePage('home'); }} 
          style={{ color: 'var(--text2)', fontSize: '1rem', decoration: 'none', padding: '0.75rem 0', borderBottom: '1px solid var(--border2)' }}
        >
          How It Works
        </a>
        <span 
          onClick={() => { setMobileNavOpen(false); setActivePage('terms'); window.scrollTo({ top: 0 }); }} 
          style={{ color: 'var(--text2)', fontSize: '1rem', cursor: 'pointer', padding: '0.75rem 0', borderBottom: '1px solid var(--border2)' }}
        >
          Terms & Agreement
        </span>
        <span 
          onClick={() => { setMobileNavOpen(false); setActivePage('privacy'); window.scrollTo({ top: 0 }); }} 
          style={{ color: 'var(--text2)', fontSize: '1rem', cursor: 'pointer', padding: '0.75rem 0', borderBottom: '1px solid var(--border2)' }}
        >
          Privacy Agreement
        </span>
        <span 
          onClick={() => { setMobileNavOpen(false); setActivePage('faq'); window.scrollTo({ top: 0 }); }} 
          style={{ color: 'var(--text2)', fontSize: '1rem', cursor: 'pointer', padding: '0.75rem 0', borderBottom: '1px solid var(--border2)' }}
        >
          FAQ
        </span>
        
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
          {currentUser ? (
            <>
              <button 
                className="btn btn-blue" 
                onClick={() => { setMobileNavOpen(false); setActivePage('dashboard'); }}
                style={{ justifyContent: 'center' }}
              >
                Dashboard
              </button>
              <button 
                className="btn" 
                onClick={() => { setMobileNavOpen(false); handleLogout(); }}
                style={{ background: '#000000', color: '#ffffff', border: '1px solid var(--border)', justifyContent: 'center' }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button 
                className="btn btn-outline" 
                onClick={() => { setMobileNavOpen(false); setAuthModal({ open: true, mode: 'login' }); }}
                style={{ justifyContent: 'center' }}
              >
                Sign In
              </button>
              <button 
                className="btn btn-gold" 
                onClick={() => { setMobileNavOpen(false); setAuthModal({ open: true, mode: 'signup' }); }}
                style={{ justifyContent: 'center' }}
              >
                Get Funded
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pages Container */}
      <div style={{ paddingTop: '70px', minHeight: 'calc(100vh - 70px)' }}>

        {/* PAGE 1: HOME PAGE */}
        {activePage === 'home' && (
          <div id="home-view">
            {/* HERO */}
            <section className="hero">
              <div className="hero-bg"></div>
              <div className="hero-grid"></div>
              <div className="hero-content">
                <h1 className="hero-title">Trade With<br /><span>Real Capital</span><br />No Risk</h1>
                <p className="hero-sub">
                  QXT Funded gives elite traders access to professional capital — up to $50,000. Choose instant funding or prove yourself through our evaluation. Keep up to 92% of profits.
                </p>
                <div className="hero-cta">
                  <a 
                    href="#accounts"
                    className="btn btn-gold" 
                    style={{ fontSize: '1rem', padding: '0.85rem 2rem', border: 'none', cursor: 'pointer' }}
                  >
                    Start Trading ↗
                  </a>
                  <a 
                    href="#how-it-works"
                    className="btn btn-outline" 
                    style={{ fontSize: '1rem', padding: '0.85rem 2rem', border: '1px solid var(--border)', cursor: 'pointer' }}
                  >
                    How It Works
                  </a>
                </div>
                
                <div className="hero-stats">
                  <div className="hero-stat">
                    <div className="hero-stat-num">$50K</div>
                    <div className="hero-stat-label">Max Funding</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-num">92%</div>
                    <div className="hero-stat-label">Profit Split</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-num">4</div>
                    <div className="hero-stat-label">Brokers</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-num">24/7</div>
                    <div className="hero-stat-label">Support</div>
                  </div>
                </div>
              </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" style={{ background: 'var(--bg2)' }}>
              <div className="section-inner">
                <div className="section-label">Process</div>
                <h2 className="section-title">Get Funded in <span className="text-gold">4 Steps</span></h2>
                <p className="section-sub" style={{ marginBottom: '3rem' }}>
                  Simple, fast and transparent. From signup to funded account in under 24 hours.
                </p>
                <div className="steps-grid">
                  <div className="step-card">
                    <div className="step-num">01</div>
                    <h3 className="step-title" style={{ marginTop: '1rem' }}>Create Account</h3>
                    <p className="step-desc">Sign up with your email, verify your identity and join the QXT Funded community.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-num">02</div>
                    <h3 className="step-title" style={{ marginTop: '1rem' }}>Choose Plan</h3>
                    <p className="step-desc">Select Instant Funding for immediate access or Challenge Account to prove your skills.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-num">03</div>
                    <h3 className="step-title" style={{ marginTop: '1rem' }}>Pay & Activate</h3>
                    <p className="step-desc">Pay via crypto — USDT, BTC, ETH. Instant confirmation and account activation.</p>
                  </div>
                  <div className="step-card">
                    <div className="step-num">04</div>
                    <h3 className="step-title" style={{ marginTop: '1rem' }}>Trade & Withdraw</h3>
                    <p className="step-desc">Start trading on your funded account. Request withdrawals anytime, keep up to 92%.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ACCOUNTS */}
            <section id="accounts">
              <div className="section-inner">
                <div className="section-label">Account Types</div>
                <h2 className="section-title">Choose Your <span className="text-gold">Trading Account</span></h2>
                <p className="section-sub" style={{ marginBottom: '2.5rem' }}>
                  Instant accounts for direct trading or challenge accounts with lower entry cost.
                </p>
                
                <div className="tab-bar">
                  <button 
                    className={`tab ${accountsTab === 'instant' ? 'active' : ''}`}
                    onClick={() => setAccountsTab('instant')}
                  >
                    Instant Accounts
                  </button>
                  <button 
                    className={`tab ${accountsTab === 'challenge' ? 'active' : ''}`}
                    onClick={() => setAccountsTab('challenge')}
                  >
                    Challenge Accounts
                  </button>
                </div>

                <div className="account-grid">
                  {(accountsTab === 'instant' ? INSTANT_ACCOUNTS : CHALLENGE_ACCOUNTS).map((a: any, i: number) => {
                    const isPopular = a.size === 20000;
                    return (
                      <div 
                        key={i} 
                        className={`account-card ${isPopular ? 'popular' : ''}`}
                        onClick={() => handleSelectAccount(i, accountsTab)}
                      >
                        {isPopular && <div className="popular-badge">POPULAR</div>}
                        <div style={{ marginBottom: '0.25rem' }}>
                          {accountsTab === 'instant' ? (
                            <span className="account-status status-direct"><span className="status-dot"></span>Direct Funding</span>
                          ) : (
                            <span className="account-status status-eval"><span className="status-dot"></span>Evaluation Required</span>
                          )}
                        </div>
                        <div className="account-size">{fmtMoney(a.size)}</div>
                        <div className="account-price">{fmtMoney(a.price)}<span>/one-time</span></div>
                        
                        <div className="account-rows">
                          {accountsTab === 'instant' ? (
                            <>
                              <div className="account-row">
                                <span className="account-row-label">Daily Loss Limit</span>
                                <span className="account-row-value">{fmtMoney(a.daily)}</span>
                              </div>
                              <div className="account-row">
                                <span className="account-row-label">Payout Split</span>
                                <span className="account-row-value" style={{ color: 'var(--green)' }}>{a.payout}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="account-row">
                                <span className="account-row-label">Profit Target</span>
                                <span className="account-row-value" style={{ color: 'var(--green)' }}>{fmtMoney(a.target)}</span>
                              </div>
                              <div className="account-row">
                                <span className="account-row-label">Daily Loss Limit</span>
                                <span className="account-row-value">{fmtMoney(a.daily)}</span>
                              </div>
                              <div className="account-row">
                                <span className="account-row-label">Max Drawdown</span>
                                <span className="account-row-value" style={{ color: 'var(--red)' }}>{fmtMoney(a.drawdown)}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }}>
                          Get Funded →
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* BROKERS */}
            <section id="brokers" style={{ background: 'var(--bg2)' }}>
              <div className="section-inner">
                <div className="section-label">Partner Brokers</div>
                <h2 className="section-title">Regulated <span className="text-gold">Trading Brokers</span></h2>
                <p className="section-sub" style={{ marginBottom: '3rem' }}>
                  Trade on leading binary options brokers with full support and high payouts.
                </p>
                <div className="broker-grid">
                  {BROKERS.map((b) => (
                    <div key={b} className="broker-card cursor-pointer" onClick={() => handleBrokerClick(b)}>
                      {!imageErrors[b] ? (
                        <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                          <img 
                            className="broker-logo" 
                            src={BROKER_LOGOS[b]} 
                            alt={b} 
                            onError={() => setImageErrors(prev => ({ ...prev, [b]: true }))}
                            referrerPolicy="no-referrer"
                            style={{ height: '100%', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 'bold',
                          marginBottom: '0.85rem',
                          marginLeft: 'auto',
                          marginRight: 'auto',
                        }}>
                          {b.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="broker-name" style={{ fontWeight: 700, fontSize: '1.05rem' }}>{b}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>Features Active</div>
                      <div className="broker-check">✓</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* REVIEWS */}
            <section id="reviews" className="trust-section">
              <div className="section-inner" style={{ padding: '4rem 0' }}>
                <div className="section-label">Trustpilot</div>
                <h2 className="section-title">What Our <span className="text-gold">Traders Say</span></h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '1rem 0 2.5rem', flexWrap: 'wrap' }}>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--gold)' }}>4.8</div>
                  <div>
                    <div style={{ color: 'var(--gold)', fontSize: '1.3rem', marginBottom: '4px' }}>★★★★★</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Based on 1,240+ reviews</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  <div className="review-card">
                    <div className="review-stars">★★★★★</div>
                    <p className="review-text">"Got my $20K instant account approved within hours. The dashboard is clean and payouts are reliable. Best prop firm experience!"</p>
                    <div className="reviewer">
                      <div className="reviewer-avatar">MK</div>
                      <div>
                        <div className="reviewer-name">Mohammed K.</div>
                        <div className="reviewer-country">🇦🇪 UAE</div>
                      </div>
                    </div>
                  </div>
                  <div className="review-card">
                    <div className="review-stars">★★★★★</div>
                    <p className="review-text">"Challenge account was straightforward. Hit the target in 2 weeks and got funded. 92% split is real, no hidden fees."</p>
                    <div className="reviewer">
                      <div className="reviewer-avatar">SP</div>
                      <div>
                        <div className="reviewer-name">Sarah P.</div>
                        <div className="reviewer-country">🇬🇧 UK</div>
                      </div>
                    </div>
                  </div>
                  <div className="review-card">
                    <div className="review-stars">★★★★★</div>
                    <p className="review-text">"Customer support replied within minutes. Crypto payments are instant and secure. Highly recommend QXT Funded!"</p>
                    <div className="reviewer">
                      <div className="reviewer-avatar">AL</div>
                      <div>
                        <div className="reviewer-name">Ahmed L.</div>
                        <div className="reviewer-country">🇵🇰 Pakistan</div>
                      </div>
                    </div>
                  </div>
                  <div className="review-card">
                    <div className="review-stars">★★★★★</div>
                    <p className="review-text">"Very transparent platform. I can track my drawdown and profit targets live. Professional team behind this."</p>
                    <div className="reviewer">
                      <div className="reviewer-avatar">JR</div>
                      <div>
                        <div className="reviewer-name">James R.</div>
                        <div className="reviewer-country">🇺🇸 USA</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* PAGE 2: PURCHASE WIZARD FLOW */}
        {activePage === 'purchase' && purchaseState && (
          <div id="purchase-page" style={{ display: 'block', minHeight: '100vh', background: 'var(--bg)' }}>
            <div style={{ maxWidth: '900px', margin: '0 auto', padding: '3rem 2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2.5rem' }}>
                <button className="btn btn-outline btn-sm" onClick={() => { setActivePage('home'); setPurchaseState(null); }}>
                  ← Back
                </button>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700 }}>
                  Complete Your Purchase
                </div>
              </div>

              {/* FLOW STEPS */}
              <div className="flow-steps">
                <div className={`flow-step ${purchaseState.step >= 1 ? 'done' : ''} ${purchaseState.step === 1 ? 'active' : ''}`}>
                  <div className="flow-num">1</div><span>Broker</span>
                </div>
                <div className={`flow-line ${purchaseState.step > 1 ? 'done' : ''}`} />
                <div className={`flow-step ${purchaseState.step >= 2 ? 'done' : ''} ${purchaseState.step === 2 ? 'active' : ''}`}>
                  <div className="flow-num">2</div><span>Payment</span>
                </div>
                <div className={`flow-line ${purchaseState.step > 2 ? 'done' : ''}`} />
                <div className={`flow-step ${purchaseState.step >= 3 ? 'done' : ''} ${purchaseState.step === 3 ? 'active' : ''}`}>
                  <div className="flow-num">3</div><span>Confirm</span>
                </div>
              </div>

              {/* STEP 1 CONTENT: SELECT BROKER */}
              {purchaseState.step === 1 && (
                <div>
                  <div className="selected-account-bar">
                    <span>
                      Selected: <strong style={{ color: 'var(--gold)' }}>
                        {fmtMoney(purchaseState.account.size)} {purchaseState.type === 'instant' ? 'Instant' : 'Challenge'} Account
                      </strong>
                    </span>
                    <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{fmtMoney(getAccountPrice(purchaseState.account, purchaseState.type))}</strong>
                  </div>

                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    Choose Your Broker Partner
                  </h3>

                  <div className="broker-grid">
                    {BROKERS.map((b) => (
                      <div 
                        key={b} 
                        className={`broker-card ${purchaseState.broker === b ? 'selected' : ''}`}
                        onClick={() => setPurchaseState({ ...purchaseState, broker: b })}
                      >
                        {!imageErrors[b] ? (
                          <div style={{ height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                            <img 
                              className="broker-logo" 
                              src={BROKER_LOGOS[b]} 
                              alt={b} 
                              onError={() => setImageErrors(prev => ({ ...prev, [b]: true }))}
                              referrerPolicy="no-referrer"
                              style={{ height: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        ) : (
                          <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--gold), var(--gold2))',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            marginBottom: '0.85rem',
                            marginLeft: 'auto',
                            marginRight: 'auto',
                          }}>
                            {b.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="broker-name" style={{ fontWeight: 700 }}>{b}</div>
                        <div className="broker-check">✓</div>
                      </div>
                    ))}
                  </div>

                  <button 
                    className="btn btn-gold" 
                    style={{ marginTop: '2rem', padding: '0.85rem 2.5rem' }}
                    onClick={() => {
                      if (!purchaseState.broker) {
                        triggerToast('Please select a trading broker', 'error');
                        return;
                      }
                      setPurchaseState({ ...purchaseState, step: 2 });
                    }}
                  >
                    Continue to Payment →
                  </button>
                </div>
              )}

              {/* STEP 2 CONTENT: SELECT PAYMENT METHOD */}
              {purchaseState.step === 2 && (
                <div>
                  <div className="selected-account-bar" style={{ marginBottom: '1.5rem' }}>
                    <span>
                      Selected: <strong style={{ color: 'var(--gold)' }}>
                        {fmtMoney(purchaseState.account.size)} {purchaseState.type === 'instant' ? 'Instant' : 'Challenge'} Account
                      </strong>
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {appliedPromo === 'QXTFUNDED40' && (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text3)', textDecoration: 'line-through' }}>
                          {fmtMoney(purchaseState.account.price)}
                        </span>
                      )}
                      <strong style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>
                        {fmtMoney(getAccountPrice(purchaseState.account, purchaseState.type))}
                      </strong>
                    </div>
                  </div>

                  {/* Promo Code interactive section */}
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border2)' }}>
                    {!showPromoInput && !appliedPromo && (
                      <button 
                        type="button"
                        onClick={() => {
                          setShowPromoInput(true);
                          setPromoError(null);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--gold)',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          textDecoration: 'underline'
                        }}
                      >
                        I have a promo code
                      </button>
                    )}

                    {showPromoInput && !appliedPromo && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 600 }}>ENTER PROMO CODE</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input 
                            type="text" 
                            className="input-field" 
                            placeholder="" 
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            style={{ flex: 1, textTransform: 'uppercase' }}
                          />
                          <button 
                            type="button"
                            className="btn btn-gold btn-sm"
                            onClick={() => {
                              if (promoCode.trim().toUpperCase() === 'QXTFUNDED40') {
                                setAppliedPromo('QXTFUNDED40');
                                setPromoError(null);
                                triggerToast('Promo code QXTFUNDED40 applied! 40% discount matches.', 'success');
                              } else {
                                setPromoError('Invalid promo code. Please try again.');
                              }
                            }}
                            style={{ padding: '0.5rem 1rem' }}
                          >
                            Apply
                          </button>
                        </div>
                        {promoError && (
                          <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '500' }}>
                            {promoError}
                          </div>
                        )}
                      </div>
                    )}

                    {appliedPromo && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge badge-success" style={{ background: 'var(--green)', color: '#000', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>QXTFUNDED40 APPLIED</span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>40% off account discount applied</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            setAppliedPromo(null);
                            setPromoCode('');
                            triggerToast('Promo code removed', 'info');
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--red)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                    Select Payment Method (Crypto)
                  </h3>

                  <div className="payment-method-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', margin: '1.5rem 0' }}>
                    {PAYMENT_METHODS.map((p) => (
                      <div 
                        key={p.id} 
                        className={`pay-method ${purchaseState.payment === p.id ? 'selected' : ''}`}
                        onClick={() => {
                          setPurchaseState({ ...purchaseState, payment: p.id });
                          handleFinalizeOrder(p.id);
                        }}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '1.25rem 0.75rem',
                          background: 'var(--bg4)',
                          borderRadius: '12px',
                          border: purchaseState.payment === p.id ? '2px solid var(--gold)' : '1px solid var(--border2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'center'
                        }}
                      >
                        <img 
                          src={p.logo} 
                          alt={p.label}
                          style={{ width: '36px', height: '36px', objectFit: 'contain', marginBottom: '4px' }}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const fallbackUrls: Record<string, string> = {
                              'bitcoin-btc-logo.png': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
                              'ethereum-eth-logo.png': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
                              'tether-usdt-logo.png': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png',
                            };
                            const srcStr = e.currentTarget.src || '';
                            let matched = false;
                            for (const [key, val] of Object.entries(fallbackUrls)) {
                              if (srcStr.includes(key)) {
                                e.currentTarget.src = val;
                                matched = true;
                                break;
                              }
                            }
                            if (!matched) {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{p.label}</span>
                      </div>
                    ))}
                  </div>

                  {purchaseState.payment && (
                    <div style={{ marginTop: '1rem' }}>
                      <div className="payment-box">
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'Syne, sans-serif', marginBottom: '0.25rem' }}>
                          Send {fmtMoney(getAccountPrice(purchaseState.account, purchaseState.type))}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '1rem' }}>
                          in {PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.label} equivalent
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
                          <img 
                            src={PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.logo} 
                            alt={PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.label}
                            style={{ height: '48px', width: '48px', objectFit: 'contain' }}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const fallbackUrls: Record<string, string> = {
                                'bitcoin-btc-logo.png': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
                                'ethereum-eth-logo.png': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
                                'tether-usdt-logo.png': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png',
                              };
                              const srcStr = e.currentTarget.src || '';
                              let matched = false;
                              for (const [key, val] of Object.entries(fallbackUrls)) {
                                if (srcStr.includes(key)) {
                                  e.currentTarget.src = val;
                                  matched = true;
                                  break;
                                }
                              }
                              if (!matched) {
                                e.currentTarget.style.display = 'none';
                              }
                            }}
                          />
                        </div>

                        <div style={{ display: 'inline-block', padding: '10px', background: '#fff', borderRadius: '8px', marginBottom: '1.25rem' }}>
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.wallet || '')}`} 
                            alt="QR Code" 
                            style={{ display: 'block', width: '150px', height: '150px' }}
                          />
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: '0.5rem' }}>
                          Wallet Address (click to copy)
                        </div>
                        <div 
                          className="wallet-address"
                          style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}
                        >
                          <code style={{ fontSize: '0.85rem', color: 'var(--gold)', wordBreak: 'break-all', fontWeight: 'bold' }}>
                            {PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.wallet}
                          </code>
                          <button 
                            className="btn btn-gold btn-sm"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const wallet = PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.wallet || '';
                              navigator.clipboard.writeText(wallet);
                              triggerToast('Address copied to clipboard!', 'success');
                            }}
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem 1rem' }}
                          >
                            Copy Address
                          </button>
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(212,175,55,0.06)', borderRadius: '8px', border: '1px solid rgba(212,175,55,0.15)' }}>
                          ⚠️ Please send the exact amount. Verification on-chain completes immediately.
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setPurchaseState({ ...purchaseState, step: 1 })}
                    >
                      Back
                    </button>
                    <button 
                      className="btn btn-gold"
                      style={{ padding: '0.85rem 2.5rem' }}
                      onClick={() => {
                        if (!purchaseState.payment) {
                          triggerToast('Please select a payment method', 'error');
                          return;
                        }
                        handleFinalizeOrder();
                      }}
                    >
                      Proceed to Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3 CONTENT: FINAL CONFIRMATION */}
              {purchaseState.step === 3 && (
                <div style={{ maxWidth: '540px', margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', border: '2px solid var(--gold)', margin: '0 auto 1.5rem', color: 'var(--gold)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Payment Submitted
                  </h3>
                  <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Your order will be verified on-chain. QXT Back-office handles review within 1 to 24 hours.
                  </p>

                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
                      <div style={{ color: 'var(--text3)' }}>Account Type</div>
                      <div style={{ fontWeight: 600 }}>{purchaseState.type === 'instant' ? 'Instant' : 'Challenge'}</div>
                      <div style={{ color: 'var(--text3)' }}>Account Size</div>
                      <div style={{ fontWeight: 600, color: 'var(--gold)' }}>{fmtMoney(purchaseState.account.size)}</div>
                      <div style={{ color: 'var(--text3)' }}>Price Paid</div>
                      <div style={{ fontWeight: 600 }}>{fmtMoney(getAccountPrice(purchaseState.account, purchaseState.type))}</div>
                      <div style={{ color: 'var(--text3)' }}>Broker API</div>
                      <div style={{ fontWeight: 600 }}>{purchaseState.broker}</div>
                      <div style={{ color: 'var(--text3)' }}>USDT Address Channel</div>
                      <div style={{ fontWeight: 600 }}>{PAYMENT_METHODS.find(p => p.id === purchaseState.payment)?.label}</div>
                      <div style={{ color: 'var(--text3)' }}>Status</div>
                      <div><span className="badge badge-pending">PENDING</span></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button 
                      className="btn btn-outline" 
                      onClick={() => setPurchaseState({ ...purchaseState, step: 2 })}
                    >
                      Back
                    </button>
                    <button 
                      className="btn btn-gold" 
                      style={{ padding: '0.85rem 2.5rem' }}
                      onClick={handleFinalizeOrder}
                    >
                      Go to Dashboard →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE 5: QUICK PAY / LOOKUP PAGE */}
        {activePage === 'payment' && (
          <div id="quickpay-page" className="fade-in" style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: '3.5rem' }}>
            <QuickPayView 
              onBackToHome={() => { 
                setRedirectedInvoice(null); 
                setActivePage('home'); 
              }}
              triggerToast={triggerToast}
              currentUser={currentUser}
              redirectedInvoice={redirectedInvoice}
              onPaymentSuccess={() => {
                setRedirectedInvoice(null);
                setActivePage('dashboard');
                setDashActiveTab('accounts');
              }}
            />
          </div>
        )}

        {/* PAGE 6: TERMS & AGREEMENT */}
        {activePage === 'terms' && (
          <div id="terms-page" className="fade-in" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '6rem 1rem 4rem' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)' }}>
                  Terms & <span style={{ color: 'var(--gold)' }}>Agreement</span>
                </h1>
                <button 
                  className="btn btn-gold btn-sm" 
                  onClick={() => { setActivePage('home'); window.scrollTo({ top: 0 }); }}
                >
                  ← Home
                </button>
              </div>

              <div className="card" style={{ padding: '2.5rem', lineHeight: '1.7', color: 'var(--text2)', fontSize: '0.95rem' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Last updated: June 1, 2026</p>
                
                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>1. Service Evaluation and Simulated Accounts</h3>
                <p>
                  QXT Funded delivers simulated evaluation programs ("Challenge Accounts" and "Instant Accounts") constructed to test trading strategy efficacy. All accounts provided inside the evaluation and funded phases are completely virtual simulator environments. Simulator metrics represent evaluations; actual payouts map performance indicators directly cleared and settled via cryptocurrency utility keys.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>2. Account Parameters & Failure Thresholds</h3>
                <p>
                  Traders must adhere strictly to specified account constraints:
                </p>
                <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', listStyleType: 'disc' }}>
                  <li><strong>Challenge Accounts:</strong> Must not exceed a daily loss limit of 30% of account size, or the pre-specified maximum trailing drawdown. Users must hit evaluation profit targets to attain funded status.</li>
                  <li><strong>Instant Accounts:</strong> Allow immediate profit accumulation sandbox access with specified structural loss boundaries.</li>
                </ul>
                <p style={{ marginTop: '0.5rem' }}>
                  Breaching evaluation daily loss, max drawdown, or compliance variables terminates simulated evaluation status immediately.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>3. Secure Payouts & Crypto Settlement</h3>
                <p>
                  All purchases representing entry fees are strictly evaluated and settled via multi-chain cryptocurrency payment. Supported keys include USDT (ERC20, TRC20, BEP20), Bitcoin (BTC), and Ethereum (ETH). Withdrawals are cleared upon passing authentication and processed strictly inside simulation ledger rules under standard regulatory clearing intervals.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>4. Refunding Strategy</h3>
                <p>
                  Due to digital allocation of simulated nodes and back-office credentials, evaluation service fees are strictly non-refundable once sandbox credentials have been generated and issued to the customer. All dispute resolutions remain governed by our support unit at <code>qxtfunded0@gmail.com</code>.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>5. Account Confirmations</h3>
                <p>
                  Upon account selector completion and payment channel validation, an electronic welcome letter titled <strong>"Welcome to QXT Funded"</strong> is systematically distributed containing user registration data and custom credentials.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 7: PRIVACY POLICY */}
        {activePage === 'privacy' && (
          <div id="privacy-page" className="fade-in" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '6rem 1rem 4rem' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)' }}>
                  Privacy <span style={{ color: 'var(--gold)' }}>Agreement</span>
                </h1>
                <button 
                  className="btn btn-gold btn-sm" 
                  onClick={() => { setActivePage('home'); window.scrollTo({ top: 0 }); }}
                >
                  ← Home
                </button>
              </div>

              <div className="card" style={{ padding: '2.5rem', lineHeight: '1.7', color: 'var(--text2)', fontSize: '0.95rem' }}>
                <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Last updated: June 1, 2026</p>
                
                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>1. Secure Data Collection</h3>
                <p>
                  We gather minimal essential parameters required to establish secure trading nodes and dispatch account details. Collected parameters contain: email handles, payment addresses, selected sandboxed broker choices, and cryptographic hashes of passwords. No plaintext credentials or credit cards are collected.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>2. Firestore Database Encryption & Client-Side Local Storage</h3>
                <p>
                  We rely on professional cloud storage engines (Firebase Firestore) safeguarded with strict security parameters to prevent leaks. Your operational metrics, ledger balances, and custom orders are securely bound to your decentralized userID and shielded from unauthorized third parties.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>3. Public Blockchains & Payment Privacy</h3>
                <p>
                  Transactions executed via decentralized on-chain settlement networks (Tether USDT, Bitcoin, Ethereum) are publicly indexed as part of standard distributed ledger systems. While transaction hashes remain public on-chain, QXT Funded does not bind personal identifiability elements to distributed nodes.
                </p>

                <h3 style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)', fontSize: '1.3rem', fontWeight: 700, margin: '1.5rem 0 0.75rem' }}>4. Service Communication</h3>
                <p>
                  Upon select, notification parameters containing Welcome emails and support replies are disseminated to keep your evaluations secure. For concerns regarding deletion, please reach support at <code>qxtfunded0@gmail.com</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 8: FAQS SECTION */}
        {activePage === 'faq' && (
          <div id="faq-page" className="fade-in" style={{ background: 'var(--bg)', minHeight: '100vh', padding: '6rem 1rem 4rem' }}>
            <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.5rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.25rem' }}>
                    Frequently Asked <span style={{ color: 'var(--gold)' }}>Questions</span>
                  </h1>
                  <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>
                    Find immediate answers to QXT Funded accounts, confirmations, and rules.
                  </p>
                </div>
                <button 
                  className="btn btn-gold btn-sm" 
                  onClick={() => { setActivePage('home'); window.scrollTo({ top: 0 }); }}
                >
                  ← Home
                </button>
              </div>

              {/* SEARCH BAR */}
              <div style={{ marginBottom: '2rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Search FAQ topics... (e.g., confirmation, daily loss, drawdown)" 
                  value={faqSearchQuery}
                  onChange={(e) => setFaqSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1.25rem', fontSize: '1rem', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text)' }}
                />
              </div>

              {/* FAQ LIST */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  {
                    id: "conf",
                    q: "When I select an account, how do I receive my account confirmation?",
                    a: "The user will receive a confirmation email (\"Welcome to QXT Funded\") after account selection."
                  },
                  {
                    id: "drawdown",
                    q: "What are the rules and profit targets for Challenge Accounts?",
                    a: "Challenge Accounts have evaluation parameters: a 40% target profit milestone must be met without breaching active daily loss limits (30% of relative size) or the trailing maximum drawdown limits. These boundaries remain fully fixed per predefined tier models."
                  },
                  {
                    id: "loss_limit",
                    q: "How does the Daily Loss Limit function on Instant and Challenge tracks?",
                    a: "The Daily Loss Limit is calculated as a fixed maximum allowable loss based on previous day end-of-day equity. Keep in mind that Challenge limits and Instant rules remain unchanged to protect simulator evaluation logic."
                  },
                  {
                    id: "broker",
                    q: "Which brokers and sandbox trading environments are supported?",
                    a: "We systematically route simulated allocations to Olymp Trade, Pocket Option, Binomo, Quotex, and Tradowix platforms. You can configure your preference during account setup."
                  },
                  {
                    id: "support",
                    q: "How can I contact QXT Funded for clearing assistance?",
                    a: "Contact our decentralized clearing desk via the dashboard, or email us directly at qxtfunded0@gmail.com. We deliver round-the-clock simulator support."
                  }
                ].filter(item => 
                  item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                  item.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
                ).map(item => {
                  const isOpen = activeFaqId === item.id;
                  return (
                    <div 
                      key={item.id} 
                      className="card" 
                      style={{ 
                        padding: '1.25rem 1.75rem', 
                        cursor: 'pointer', 
                        background: isOpen ? 'var(--bg4)' : 'var(--bg3)', 
                        border: isOpen ? '1px solid var(--gold)' : '1px solid var(--border)',
                        transition: 'all 0.25s ease'
                      }}
                      onClick={() => setActiveFaqId(isOpen ? null : item.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.05rem', fontWeight: 700, color: isOpen ? 'var(--gold)' : 'var(--text)', margin: 0 }}>
                          {item.q}
                        </h4>
                        <span style={{ fontSize: '1.2rem', color: isOpen ? 'var(--gold)' : 'var(--text3)' }}>
                          {isOpen ? '−' : '+'}
                        </span>
                      </div>
                      
                      {isOpen && (
                        <div style={{ marginTop: '1rem', color: 'var(--text2)', fontSize: '0.92rem', lineHeight: '1.6', paddingTop: '0.75rem', borderTop: '1px solid var(--border2)' }}>
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}

                {[
                  {
                    id: "conf",
                    q: "When I select an account, how do I receive my account confirmation?",
                    a: "The user will receive a confirmation email (\"Welcome to QXT Funded\") after account selection."
                  },
                  {
                    id: "drawdown",
                    q: "What are the rules and profit targets for Challenge Accounts?",
                    a: "Challenge Accounts have evaluation parameters: a 40% target profit milestone must be met without breaching active daily loss limits (30% of relative size) or the trailing maximum drawdown limits. These boundaries remain fully fixed per predefined tier models."
                  },
                  {
                    id: "loss_limit",
                    q: "How does the Daily Loss Limit function on Instant and Challenge tracks?",
                    a: "The Daily Loss Limit is calculated as a fixed maximum allowable loss based on previous day end-of-day equity. Keep in mind that Challenge limits and Instant rules remain unchanged to protect simulator evaluation logic."
                  },
                  {
                    id: "broker",
                    q: "Which brokers and sandbox trading environments are supported?",
                    a: "We systematically route simulated allocations to Olymp Trade, Pocket Option, Binomo, Quotex, and Tradowix platforms. You can configure your preference during account setup."
                  },
                  {
                    id: "support",
                    q: "How can I contact QXT Funded for clearing assistance?",
                    a: "Contact our decentralized clearing desk via the dashboard, or email us directly at qxtfunded0@gmail.com. We deliver round-the-clock simulator support."
                  }
                ].filter(item => 
                  item.q.toLowerCase().includes(faqSearchQuery.toLowerCase()) || 
                  item.a.toLowerCase().includes(faqSearchQuery.toLowerCase())
                ).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', background: 'var(--bg3)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    No results matched your search query. Try typing another word.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PAGE 3: CLIENT DASHBOARD */}
        {activePage === 'dashboard' && currentUser && (
          <div id="dashboard-page" style={{ display: 'block', minHeight: '100vh', background: 'var(--bg)' }}>
            <div className="dash-layout">
              {/* SIDEBAR */}
              <aside className="sidebar">
                <div className="sidebar-logo">
                  <img src="https://i.ibb.co/VcyBJsFK/Gemini-Generated-Image-v36xfhv36xfhv36x.png" alt="QXT" style={{ height: '32px' }} />
                </div>
                <div 
                  className={`sidebar-nav-item ${dashActiveTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setDashActiveTab('overview')}
                  style={{ gap: '0', paddingLeft: '1.25rem' }}
                >
                  Overview
                </div>
                <div 
                  className={`sidebar-nav-item ${dashActiveTab === 'accounts' ? 'active' : ''}`}
                  onClick={() => setDashActiveTab('accounts')}
                  style={{ gap: '0', paddingLeft: '1.25rem' }}
                >
                  My Accounts
                </div>
                <div 
                  className={`sidebar-nav-item ${dashActiveTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setDashActiveTab('orders')}
                  style={{ gap: '0', paddingLeft: '1.25rem' }}
                >
                  Orders
                </div>
                <div 
                  className={`sidebar-nav-item ${dashActiveTab === 'support' ? 'active' : ''}`}
                  onClick={() => setDashActiveTab('support')}
                  style={{ gap: '0', paddingLeft: '1.25rem' }}
                >
                  Support
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div className="sidebar-nav-item" onClick={handleLogout} style={{ gap: '0', paddingLeft: '1.25rem' }}>
                    Logout
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT REGION */}
              <main className="dash-main">
                <div className="dash-header">
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1.1rem' }}>
                      Welcome back, {userData?.name || 'Trader'}!
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                      {dashDateString}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button className="btn btn-gold btn-sm" onClick={() => setActivePage('home')}>
                      + New Account
                    </button>
                    <div 
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'var(--bg4)', 
                        border: '1px solid var(--border)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontFamily: 'Syne, sans-serif', 
                        fontWeight: 700, 
                        fontSize: '0.85rem', 
                        color: 'var(--gold)' 
                      }}
                    >
                      {(userData?.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                  </div>
                </div>

                <div className="dash-body">
                  
                  {/* OVERVIEW TAB */}
                  {dashActiveTab === 'overview' && (
                    <div>
                      <div className="metric-grid">
                        <div className="metric-card">
                          <div className="metric-label">Total Accounts</div>
                          <div className="metric-value metric-gold">{dashboardOrders.length}</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-label">Active Accounts</div>
                          <div className="metric-value metric-green">
                            {dashboardOrders.filter(o => o.orderStatus === 'Approved').length}
                          </div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-label">Pending Reviews</div>
                          <div className="metric-value" style={{ color: 'var(--gold)' }}>
                            {dashboardOrders.filter(o => o.orderStatus === 'Pending').length}
                          </div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-label">Total Invested</div>
                          <div className="metric-value metric-gold">
                            ${dashboardOrders.reduce((acc, o) => acc + (o.price || 0), 0).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '1.5rem' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>
                          Recent Account Orders
                        </div>

                        {dashboardOrders.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
                            <div style={{ marginBottom: '1rem' }}>No accounts active yet.</div>
                            <button className="btn btn-gold btn-sm" onClick={() => setActivePage('home')}>
                              Get Your First Account →
                            </button>
                          </div>
                        ) : (
                          <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Type</th>
                                  <th>Size</th>
                                  <th>Broker Platform</th>
                                  <th>Status</th>
                                  <th>Purchase Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dashboardOrders.map((o) => (
                                  <tr key={o.id}>
                                    <td>{o.accountType} Track</td>
                                    <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmtMoney(o.accountSize)}</td>
                                    <td>{o.broker}</td>
                                    <td>
                                      <span className={`badge badge-${(o.orderStatus || 'pending').toLowerCase()}`}>
                                        {o.orderStatus}
                                      </span>
                                    </td>
                                    <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>
                                      {new Date(o.purchaseDate).toLocaleDateString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ACTIVE ACCOUNTS DETAILS TAB */}
                  {dashActiveTab === 'accounts' && (
                    <div>
                      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>
                          My Funded Accounts
                        </div>
                        <button className="btn btn-gold btn-sm" onClick={() => setActivePage('home')}>
                          + New Account
                        </button>
                      </div>

                      {dashboardOrders.length === 0 ? (
                        <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '3rem', textAlign: 'center', color: 'var(--text3)' }}>
                          <div style={{ marginBottom: '1rem' }}>No funding accounts purchased yet</div>
                          <button className="btn btn-gold btn-sm" onClick={() => setActivePage('home')}>
                            Acquire Funded Account →
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
                          {dashboardOrders.map(o => (
                            <div 
                              key={o.id} 
                              style={{ 
                                background: 'linear-gradient(135deg, var(--bg3), rgba(212,175,55,0.03))', 
                                border: o.orderStatus === 'Approved' ? '1px solid rgba(34, 197, 94, 0.25)' : o.orderStatus === 'Rejected' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border2)', 
                                borderRadius: '16px', 
                                padding: '1.5rem',
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '60px',
                                height: '60px',
                                background: o.orderStatus === 'Approved' ? 'rgba(34, 197, 94, 0.05)' : o.orderStatus === 'Rejected' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(212,175,55,0.05)',
                                borderRadius: '0 0 0 100%'
                              }} />

                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                                <div>
                                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.35rem', fontWeight: 800, color: 'var(--gold)' }}>
                                    {fmtMoney(o.accountSize)}
                                  </div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text3)', fontWeight: 600 }}>{o.accountType} Tracker Account</div>
                                </div>
                                <span className={`badge badge-${o.orderStatus.toLowerCase()}`}>
                                  {o.orderStatus === 'Approved' ? 'Approved (Active)' : o.orderStatus}
                                </span>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', fontSize: '0.83rem', borderTop: '1px solid var(--border2)', paddingTop: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Account Number</span>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--blue3)' }}>
                                    {o.orderStatus === 'Approved' ? (o.accountNumber || `QX-${o.id.substring(4, 10).toUpperCase()}`) : 'PENDING_APPROVAL'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Broker API Partner</span>
                                  <span style={{ fontWeight: 600, color: '#fff' }}>{o.broker}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Current Balance</span>
                                  <span style={{ fontWeight: 'bold', color: 'var(--green)' }}>
                                    {o.orderStatus === 'Approved' ? fmtMoney(o.balance || o.accountSize) : '—'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Today's Live Loss</span>
                                  <span style={{ fontWeight: '600', color: (o.dailyLoss && o.dailyLoss > 0) ? 'var(--red)' : 'var(--text2)' }}>
                                    {o.orderStatus === 'Approved' ? fmtMoney(o.dailyLoss || 0) : '—'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Max Permitted Drawdown</span>
                                  <span style={{ fontWeight: '600', color: 'var(--text2)' }}>
                                    {o.orderStatus === 'Approved' ? fmtMoney(o.maxDrawdown || (o.accountSize * 0.08)) : '—'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Withdrawable Profit</span>
                                  <span style={{ fontWeight: 'bold', color: 'var(--gold)' }}>
                                    {o.orderStatus === 'Approved' ? fmtMoney(o.profit || 0) : '—'}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Platform Purchase Date</span>
                                  <span style={{ color: 'var(--text2)' }}>
                                    {new Date(o.purchaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text3)' }}>Payout Profit Split</span>
                                  <span style={{ color: 'var(--green)', fontWeight: 700 }}>92% payout share</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ORDER HISTORY TAB */}
                  {dashActiveTab === 'orders' && (
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        Order History Details
                      </div>
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '1.5rem', overflowX: 'auto' }}>
                        {dashboardOrders.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>
                            No orders generated yet.
                          </div>
                        ) : (
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Order ID</th>
                                <th>Track Type</th>
                                <th>Capital Limit</th>
                                <th>Price</th>
                                <th>Broker API</th>
                                <th>Blockchain Payment</th>
                                <th>Order Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardOrders.map((o) => (
                                <tr key={o.id}>
                                  <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text3)' }}>
                                    {o.id}
                                  </td>
                                  <td>{o.accountType}</td>
                                  <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmtMoney(o.accountSize)}</td>
                                  <td>{fmtMoney(o.price)}</td>
                                  <td>{o.broker}</td>
                                  <td style={{ textTransform: 'uppercase', fontSize: '0.78rem' }}>
                                    {o.paymentMethod.replace('_', ' ')}
                                  </td>
                                  <td>
                                    <span className={`badge badge-${o.orderStatus.toLowerCase()}`}>
                                      {o.orderStatus}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUPPORT CONDUIT TAB */}
                  {dashActiveTab === 'support' && (
                    <div>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                        Support & Q&A Board
                      </div>
                      <div style={{ maxWidth: '680px' }}>
                        <div className="support-thread">
                          {dashboardSupport.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '2rem', fontSize: '0.875rem' }}>
                              No messages yet. Initialize support conversation below.
                            </div>
                          ) : (
                            dashboardSupport.map((m) => (
                              <div key={m.id} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="msg-bubble msg-user">
                                  {m.messageText}
                                  <div className="msg-time">{new Date(m.timestamp).toLocaleTimeString()}</div>
                                </div>
                                {m.adminReply ? (
                                  <div className="msg-bubble msg-admin">
                                    <div className="msg-from">QXT SUPPORT DESK</div>
                                    {m.adminReply}
                                    <div className="msg-time">
                                      <span className="badge badge-replied">REPLIED</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--text3)', padding: '4px 8px' }}>
                                    <span className="badge badge-queue">On Queue</span>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input 
                            className="form-input" 
                            type="text"
                            placeholder="Type support inquiry or payment TXhash ID..."
                            value={supportInputMsg}
                            onChange={(e) => setSupportInputMsg(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSendSupportMessage(); }}
                          />
                          <button className="btn btn-gold" onClick={handleSendSupportMessage}>
                            Send →
                          </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: '0.5rem' }}>
                          Our specialist desk responds within 1–4 hours. Live 24/7.
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </main>
            </div>
          </div>
        )}

        {/* PAGE 4: ADMIN MODULE */}
        {activePage === 'admin' && isAdmin && (
          <div id="admin-page" style={{ display: 'block', minHeight: '100vh', background: 'var(--bg)' }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>
                  QXT Admin Control Console
                </div>
                <span className="badge badge-approved">● Live Admin System</span>
              </div>

              <div className="admin-tabs">
                <button 
                  className={`admin-tab ${adminActiveTab === 'orders' ? 'active' : ''}`}
                  onClick={() => setAdminActiveTab('orders')}
                >
                  Customer Orders
                </button>
                <button 
                  className={`admin-tab ${adminActiveTab === 'users' ? 'active' : ''}`}
                  onClick={() => setAdminActiveTab('users')}
                >
                  Registered Users
                </button>
                <button 
                  className={`admin-tab ${adminActiveTab === 'support' ? 'active' : ''}`}
                  onClick={() => setAdminActiveTab('support')}
                >
                  Support & Q&A Desk
                </button>
              </div>

              {/* ADMIN ORDERS SUITE */}
              {adminActiveTab === 'orders' && (
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                    All Customer Checkout Orders ({adminOrders.length})
                  </div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '1.5rem', overflowX: 'auto' }}>
                    {adminOrders.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                        No orders recorded in system database.
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>User Email</th>
                            <th>Account Type</th>
                            <th>Size</th>
                            <th>Fee Paid</th>
                            <th>Broker API</th>
                            <th>Status Badge</th>
                            <th>Administrative Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminOrders.map((o) => (
                            <tr key={o.id}>
                              <td style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>{o.userEmail}</td>
                              <td>{o.accountType} Tracker</td>
                              <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmtMoney(o.accountSize)}</td>
                              <td>{fmtMoney(o.price)}</td>
                              <td>{o.broker}</td>
                              <td>
                                <span className={`badge badge-${o.orderStatus.toLowerCase()}`}>
                                  {o.orderStatus}
                                </span>
                              </td>
                              <td>
                                {o.orderStatus === 'Pending' ? (
                                  <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                      className="btn btn-gold btn-sm" 
                                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                                      onClick={() => handleAdminUpdateOrderStatus(o.id, 'Approved')}
                                    >
                                      Approve Account
                                    </button>
                                    <button 
                                      className="btn btn-danger btn-sm" 
                                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }}
                                      onClick={() => handleAdminUpdateOrderStatus(o.id, 'Rejected')}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>Handled</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ADMIN REGISTERED USERS SUITE */}
              {adminActiveTab === 'users' && (
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Registered Platform Users ({adminUsers.length})
                  </div>
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '16px', padding: '1.5rem', overflowX: 'auto' }}>
                    {adminUsers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)' }}>
                        No user entries.
                      </div>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Platform Name</th>
                            <th>Email Handle</th>
                            <th>Origin Country</th>
                            <th>Creation Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUsers.map((u) => (
                            <tr key={u.uid}>
                              <td style={{ fontWeight: 600 }}>{u.name}</td>
                              <td style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{u.email}</td>
                              <td>{u.country}</td>
                              <td style={{ color: 'var(--text3)', fontSize: '0.8rem' }}>
                                {u.registrationDate ? new Date(u.registrationDate).toLocaleDateString() : 'Initial'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* ADMIN SUPPORT TICKETS AND Q&A */}
              {adminActiveTab === 'support' && (
                <div>
                  <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                    Active Q&A Support Tickets ({adminSupport.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {adminSupport.length === 0 ? (
                      <div style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: 'var(--text3)' }}>
                        No active technical tickets in database.
                      </div>
                    ) : (
                      adminSupport.map((m) => (
                        <div key={m.id} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: '14px', padding: '1.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.50rem' }}>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                              User: <strong>{m.userName}</strong> ({m.userEmail})
                            </div>
                            <span className={`badge badge-${m.status === 'Replied' ? 'replied' : 'queue'}`}>
                              {m.status}
                            </span>
                          </div>
                          
                          <p style={{ fontSize: '0.875rem', color: 'var(--text)', marginBottom: '1rem' }}>
                            {m.messageText}
                          </p>

                          {m.adminReply && (
                            <div style={{ background: 'var(--bg4)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.83rem', color: 'var(--text2)', marginBottom: '0.75rem' }}>
                              <strong style={{ color: 'var(--gold)' }}>Admin Answer Reply:</strong> {m.adminReply}
                            </div>
                          )}

                          {m.status !== 'Replied' && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                className="form-input" 
                                type="text"
                                placeholder="Type support response answer here..."
                                value={adminReplies[m.id] || ''}
                                onChange={(e) => setAdminReplies({ ...adminReplies, [m.id]: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAdminReplySupport(m.id); }}
                                style={{ flex: 1, fontSize: '0.85rem' }}
                              />
                              <button className="btn btn-gold btn-sm" onClick={() => handleAdminReplySupport(m.id)}>
                                Submit Reply
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* FOOTER */}
      <footer id="footer">
        <img className="footer-logo" src="https://i.ibb.co/VcyBJsFK/Gemini-Generated-Image-v36xfhv36xfhv36x.png" alt="QXT Funded" />
        <ul className="footer-links">
          <li><span className="cursor-pointer font-semibold hover:text-white transition-all text-xs" style={{ cursor: 'pointer', margin: '0 8px' }} onClick={() => { setActivePage('home'); window.scrollTo({ top: 0 }); }}>Home</span></li>
          <li><a href="#accounts" onClick={() => { setActivePage('home'); }} style={{ margin: '0 8px' }}>Accounts</a></li>
          <li><a href="#brokers" onClick={() => { setActivePage('home'); }} style={{ margin: '0 8px' }}>Brokers</a></li>
          <li><span className="cursor-pointer font-semibold hover:text-white transition-all text-xs" style={{ cursor: 'pointer', margin: '0 8px' }} onClick={() => { setActivePage('terms'); window.scrollTo({ top: 0 }); }}>Terms & Agreement</span></li>
          <li><span className="cursor-pointer font-semibold hover:text-white transition-all text-xs" style={{ cursor: 'pointer', margin: '0 8px' }} onClick={() => { setActivePage('privacy'); window.scrollTo({ top: 0 }); }}>Privacy Agreement</span></li>
          <li><span className="cursor-pointer font-semibold hover:text-white transition-all text-xs" style={{ cursor: 'pointer', margin: '0 8px' }} onClick={() => { setActivePage('faq'); window.scrollTo({ top: 0 }); }}>FAQ</span></li>
        </ul>
        <div className="footer-copy">© 2025 QXT Funded. All protocols secured.</div>
        <div className="footer-disclaimer">
          DISCLAIMER: Trading simulated evaluations carries risk. All capital sizes represent demo parameters; payouts map simulation models directly paid in USDT/crypto utility keys. QXT Funded does not deliver commercial investment advice.
        </div>
      </footer>

      {/* AUTHENTICATION MODAL */}
      {authModal.open && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="modal-close" onClick={() => setAuthModal({ open: false, mode: 'login' })}>
              ✕
            </button>
            
            {authModal.mode === 'login' ? (
              <div>
                <h2 className="modal-title">Welcome Back</h2>
                <p className="modal-sub">Sign in to access your funded workspace.</p>
                
                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Email Handle</label>
                    <input 
                      className="form-input" 
                      type="email" 
                      placeholder="trader@email.com" 
                      value={liEmail}
                      onChange={(e) => setLiEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password Key</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder="••••••••" 
                      value={liPass}
                      onChange={(e) => setLiPass(e.target.value)}
                      required 
                    />
                  </div>
                  <button 
                    className="btn btn-gold" 
                    type="submit"
                    disabled={liLoading}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
                  >
                    {liLoading ? <span className="loader"></span> : 'Sign In'}
                  </button>
                </form>
                <div className="modal-switch">
                  Don't have an account? <a onClick={() => setAuthModal({ open: true, mode: 'signup' })}>Sign up free</a>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="modal-title">Get Started</h2>
                <p className="modal-sub">Create your free account and get funded today.</p>
                
                <form onSubmit={handleSignup}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="Your full name" 
                      value={suName}
                      onChange={(e) => setSuName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Handle</label>
                    <input 
                      className="form-input" 
                      type="email" 
                      placeholder="trader@email.com" 
                      value={suEmail}
                      onChange={(e) => setSuEmail(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password Key</label>
                    <input 
                      className="form-input" 
                      type="password" 
                      placeholder="Min 6 characters" 
                      value={suPass}
                      onChange={(e) => setSuPass(e.target.value)}
                      minLength={6}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Origin Country</label>
                    <input 
                      className="form-input" 
                      type="text" 
                      placeholder="Your country" 
                      value={suCountry}
                      onChange={(e) => setSuCountry(e.target.value)}
                      required 
                    />
                  </div>
                  <button 
                    className="btn btn-gold" 
                    type="submit"
                    disabled={suLoading}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', marginTop: '0.5rem' }}
                  >
                    {suLoading ? <span className="loader"></span> : 'Create Account'}
                  </button>
                </form>
                <div className="modal-switch">
                  Already have an account? <a onClick={() => setAuthModal({ open: true, mode: 'login' })}>Sign in</a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
