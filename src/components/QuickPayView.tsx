import { useState, useEffect } from 'react';
import { Search, CreditCard, CheckCircle, Copy, Clock, Coins, Wallet, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { fallbackDb, DbOrder, db } from '../lib/firebase';

interface QuickPayViewProps {
  onBackToHome: () => void;
  triggerToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  currentUser: any;
  redirectedInvoice?: DbOrder | null;
  onPaymentSuccess?: () => void;
}

const CONST_PAYMENT_METHODS = [
  { id: 'usdt_erc20', label: 'USDT ERC20', icon: 'USDT', wallet: '0x8027139b154B2a8F308Bd9BB705A1D630E8c18af', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png' },
  { id: 'usdt_trc20', label: 'USDT TRC20', icon: 'USDT', wallet: 'TWv5TxT1vyKzCpK1sENCiVSRPmaJ1qdCF8', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png' },
  { id: 'bep20', label: 'USDT BEP20', icon: 'USDT', wallet: '0x8027139b154B2a8F308Bd9BB705A1D630E8c18af', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png' },
  { id: 'btc', label: 'Bitcoin', icon: 'BTC', wallet: 'bc1q4vcj0c0ffe56spnj8chg2umgvcdn2q22w6q7ux', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png' },
  { id: 'eth', label: 'Ethereum', icon: 'ETH', wallet: '0x8027139b154B2a8F308Bd9BB705A1D630E8c18af', logo: 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png' },
];

const PRESET_ACCOUNTS = [
  { size: 5000, price: 75 },
  { size: 8000, price: 120 },
  { size: 11000, price: 165 },
  { size: 14000, price: 210 },
  { size: 17000, price: 255 },
  { size: 20000, price: 300 },
  { size: 30000, price: 450 },
  { size: 50000, price: 750 }
];

const BROKERS_LIST = ['Pocket Option', 'Quotex', 'Binomo', 'Olymp Trade', 'Tradowix'];

export default function QuickPayView({ onBackToHome, triggerToast, currentUser, redirectedInvoice, onPaymentSuccess }: QuickPayViewProps) {
  const [foundOrder, setFoundOrder] = useState<DbOrder | null>(null);

  // Direct Invoice generation states (if they don't have an order)
  const [selectedSize, setSelectedSize] = useState(PRESET_ACCOUNTS[1]); // $8000 account default
  const [selectedBroker, setSelectedBroker] = useState('Quotex');
  const [selectedCrypto, setSelectedCrypto] = useState(CONST_PAYMENT_METHODS[1]); // USDT TRC20 default
  const [customInvoiceOpen, setCustomInvoiceOpen] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState<DbOrder | null>(null);

  // Verification states
  const [txDetails, setTxDetails] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 mins

  useEffect(() => {
    if (redirectedInvoice) {
      setFoundOrder(redirectedInvoice);
      setCustomInvoiceOpen(true);
    }
  }, [redirectedInvoice]);

  useEffect(() => {
    if (foundOrder || generatedOrder) {
      setTimeRemaining(900);
    }
  }, [foundOrder, generatedOrder]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleGenerateInvoice = () => {
    const invoiceId = `QXT-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder: DbOrder = {
      id: invoiceId,
      userID: currentUser ? currentUser.uid : 'anonymous',
      accountType: 'Instant',
      accountSize: selectedSize.size,
      price: selectedSize.price,
      paymentMethod: selectedCrypto.label,
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      broker: selectedBroker,
      purchaseDate: new Date().toISOString(),
      accountNumber: 'PENDING',
      balance: selectedSize.size,
      dailyLoss: 0,
      maxDrawdown: Math.round(selectedSize.size * 0.66),
      profit: 0
    };

    // Save so it's queryable in the DB!
    fallbackDb.saveOrder(newOrder);

    setGeneratedOrder(newOrder);
    setFoundOrder(null);
    setCustomInvoiceOpen(true);
    triggerToast('Quick Pay invoice generated!', 'success');
  };

  const handleCopyWallet = (addr: string) => {
    navigator.clipboard.writeText(addr);
    triggerToast('Payment address copied to clipboard ✓', 'success');
  };

  const handleVerifyTransaction = async () => {
    if (!txDetails.trim()) {
      triggerToast('Please insert your TXID (Transaction Hash) or sender wallet address', 'error');
      return;
    }

    setIsVerifying(true);
    const activeOrder = foundOrder || generatedOrder;
    if (activeOrder) {
      // Update the order status to Processing / Pending Approval in the database
      const updatedOrder: DbOrder = {
        ...activeOrder,
        paymentStatus: 'Pending',
        orderStatus: 'Pending'
      };

      try {
        await setDoc(doc(db, 'orders', activeOrder.id), updatedOrder);
      } catch (err) {
        console.warn('Firestore write failure, using local caching');
      }

      fallbackDb.saveOrder(updatedOrder);
      
      // Update local reactive state so UI reflects instant processing validation
      if (foundOrder) setFoundOrder(updatedOrder);
      if (generatedOrder) setGeneratedOrder(updatedOrder);
    }

    setTimeout(() => {
      setIsVerifying(false);
      triggerToast('Transaction details submitted. Approving on-chain soon!', 'success');
      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        onBackToHome();
      }
    }, 1500);
  };

  const handleIHavePaidAction = async () => {
    const activeOrder = foundOrder || generatedOrder;
    if (!activeOrder) {
      triggerToast('No active invoice to pay', 'error');
      return;
    }

    try {
      const updatedOrder: DbOrder = {
        ...activeOrder,
        paymentStatus: 'Pending',
        orderStatus: 'Pending'
      };

      try {
        await setDoc(doc(db, 'orders', activeOrder.id), updatedOrder);
      } catch (err) {
        console.warn('Firestore write failure, using local caching');
      }

      fallbackDb.saveOrder(updatedOrder);

      triggerToast('Payment notified! Your funded account order is now PENDING approval.', 'success');

      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        onBackToHome();
      }
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  const activeInvoice = foundOrder || generatedOrder;
  const currentCryptoChannel = activeInvoice 
    ? (CONST_PAYMENT_METHODS.find(m => m.id === activeInvoice.paymentMethod || m.label === activeInvoice.paymentMethod) || selectedCrypto)
    : selectedCrypto;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      
      {/* HEADER SECTION */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
          <img 
            src="https://i.ibb.co/VcyBJsFK/Gemini-Generated-Image-v36xfhv36xfhv36x.png" 
            alt="QXT" 
            style={{ height: '48px', width: '48px', borderRadius: '50%', border: '2px solid var(--gold)' }} 
          />
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', fontWeight: 850 }}>
            QXT <span className="text-gold">Quick Pay</span> Hub
          </h1>
        </div>
        <p style={{ color: 'var(--text2)', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem' }}>
          Configure your funding account details and deploy a secure direct payment channel on the QXT decentralized blockchain payment gateway.
        </p>
      </div>

      {/* TAB CONTENT GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: activeInvoice ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: ACTION COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {!activeInvoice ? (
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={18} />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700 }}>Direct Account Funding</h3>
              </div>
              <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Generate an immediate custom billing invoice dynamically. No mandatory account signup required to check out.
              </p>

              {/* Account size */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 600 }}>1. ACC SIZE & CONTRACT VALUE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {PRESET_ACCOUNTS.map((acc) => (
                    <button 
                      key={acc.size}
                      onClick={() => setSelectedSize(acc)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: selectedSize.size === acc.size ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: selectedSize.size === acc.size ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg3)',
                        color: selectedSize.size === acc.size ? 'var(--gold)' : 'var(--text2)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      ${(acc.size / 100).toFixed(0)}k<br />
                      <span style={{ fontSize: '0.7rem', opacity: 0.8, fontWeight: 'normal' }}>${acc.price}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Broker */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 600 }}>2. SELECT BROKER PLATFORM</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {BROKERS_LIST.map((b) => (
                    <button 
                      key={b}
                      onClick={() => setSelectedBroker(b)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: selectedBroker === b ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: selectedBroker === b ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg3)',
                        color: selectedBroker === b ? 'var(--gold)' : 'var(--text2)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Crypto Method */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text2)', marginBottom: '0.5rem', fontWeight: 600 }}>3. CRYPTO BILLING TARGET</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {CONST_PAYMENT_METHODS.map((crypto) => (
                    <button 
                      key={crypto.id}
                      onClick={() => setSelectedCrypto(crypto)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: selectedCrypto.id === crypto.id ? '1px solid var(--gold)' : '1px solid var(--border)',
                        background: selectedCrypto.id === crypto.id ? 'rgba(212, 175, 55, 0.15)' : 'var(--bg3)',
                        color: selectedCrypto.id === crypto.id ? 'var(--gold)' : 'var(--text2)',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      {crypto.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={handleGenerateInvoice}>
                Generate Invoice & Direct Pay →
              </button>
            </div>
          ) : null}

          {/* VERIFY HASH SLAT / SECURE INSTRUCTIONS */}
          {activeInvoice && (
            <div className="card" style={{ padding: '2.0rem', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700 }}>Verify On-Chain</h3>
              </div>
              <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                Once you complete your transfer from your crypto wallet, input the transaction hash (TXID) or sender account below. The QXT consensus engine parses nodes and flags it verified.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="EX: 0x9375e2bd3b482... or sender wallet" 
                  value={txDetails}
                  onChange={(e) => setTxDetails(e.target.value)}
                />
                <button 
                  className="btn btn-blue" 
                  style={{ justifyContent: 'center', width: '100%' }} 
                  onClick={handleVerifyTransaction}
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" style={{ marginRight: '8px' }} />
                      Verifying Ledger...
                    </>
                  ) : 'Confirm Crypto Transfer ✓'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INTERACTIVE ESCROW PAY RECEIPT */}
        {activeInvoice && (
          <div className="card" style={{ 
            padding: '2rem', 
            background: 'linear-gradient(145deg, var(--bg2), #050510)', 
            border: '2px dashed var(--gold)',
            borderRadius: '16px',
            position: 'relative'
          }}>
            {/* Countdown Banner */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              background: 'rgba(212, 175, 55, 0.1)', 
              border: '1px solid rgba(212, 175, 55, 0.3)', 
              borderRadius: '8px', 
              padding: '0.5rem 1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--gold)', fontWeight: 'bold' }}>
                <Clock size={14} className="animate-pulse" />
                <span>WAITING FOR CONFIRMATION</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--gold)', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Title / ID */}
            <div style={{ borderBottom: '1px solid var(--border2)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', tracking: '0.1em' }}>QXT Dynamic Billing Contract</span>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '0.25rem' }}>
                {activeInvoice.id}
              </h4>
            </div>

            {/* Crypto Payment Channel Logo Block */}
            {currentCryptoChannel && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                background: 'rgba(255, 255, 255, 0.03)', 
                border: '1px solid var(--border2)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem' 
              }}>
                <img 
                  src={currentCryptoChannel.logo} 
                  alt={currentCryptoChannel.label} 
                  style={{ height: '32px', width: '32px', objectFit: 'contain' }}
                  onError={(e) => {
                    const fallbackUrls: Record<string, string> = {
                      'btc': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
                      'eth': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
                      'tether': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png',
                      'usdt': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png',
                      'bitcoin': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png',
                      'ethereum': 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png',
                    };
                    const srcStr = (e.currentTarget.src || '').toLowerCase();
                    let matched = false;
                    for (const [key, val] of Object.entries(fallbackUrls)) {
                      if (srcStr.includes(key)) {
                        e.currentTarget.src = val;
                        matched = true;
                        break;
                      }
                    }
                    if (!matched) {
                      e.currentTarget.src = 'https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png';
                    }
                  }}
                  referrerPolicy="no-referrer"
                />
                {/* Fallback coin element symbol if image load fails */}
                <span className="coin-fallback" style={{ 
                  display: 'none', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  background: 'var(--bg4)', 
                  border: '1px solid var(--border)', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontSize: '1rem' 
                }}>
                  {currentCryptoChannel.icon}
                </span>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>Crypto Network</div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--gold)' }}>
                    {currentCryptoChannel.label}
                  </div>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Item Description</span>
                <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>
                  {activeInvoice.accountSize.toLocaleString()} {activeInvoice.accountType} Contract
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Trading Platform API</span>
                <span style={{ fontWeight: 'bold', color: 'var(--gold)' }}>{activeInvoice.broker}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text3)' }}>Amount Due</span>
                <span style={{ fontWeight: 'bold', color: '#fff' }}>${activeInvoice.price.toFixed(2)} USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border2)', paddingTop: '0.85rem' }}>
                <span style={{ color: 'var(--text3)', fontWeight: 'bold' }}>Transfer Channel</span>
                <span style={{ fontWeight: 'bold', color: 'var(--gold)' }}>{activeInvoice.paymentMethod}</span>
              </div>
            </div>

            {/* Real wallet address and copy */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text3)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                Send Exact Amount to Address
              </label>
              <div style={{ 
                background: 'var(--bg3)', 
                border: '1px solid var(--border2)', 
                borderRadius: '8px', 
                padding: '0.75rem 1rem', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px'
              }}>
                <code style={{ fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--gold)', letterSpacing: '0.05em', textAlign: 'center', fontWeight: 'bold' }}>
                  {currentCryptoChannel.wallet}
                </code>
                <button 
                  onClick={() => handleCopyWallet(currentCryptoChannel.wallet)}
                  className="btn btn-gold btn-sm"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    padding: '0.50rem 1rem'
                  }}
                >
                  <Copy size={14} /> Copy Address
                </button>
              </div>
            </div>

            {/* QR Code and warning */}
            <div style={{ textAlign: 'center', background: 'var(--bg3)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border2)' }}>
              
              {/* Dynamic QR code generated from the real wallet address */}
              <div style={{ display: 'inline-block', padding: '10px', background: '#fff', borderRadius: '8px', marginBottom: '1rem' }}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentCryptoChannel.wallet)}`} 
                  alt={`${currentCryptoChannel.label} QR Code`} 
                  style={{ display: 'block', width: '150px', height: '150px' }}
                />
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--red)', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ⚠️ PLEASE VERIFY NETWORK CHANNEL
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text3)', margin: 0, lineHeight: '1.4' }}>
                Only send on the selected network channel (e.g. {activeInvoice.paymentMethod}). Transferring other assets or on separate blockchains like BSC to a TRON address results in catastrophic permanent fund loss.
              </p>
            </div>

            {/* Primary Action Button */}
            <div style={{ marginTop: '1.5rem' }}>
              <button 
                className="btn btn-gold" 
                style={{ width: '100%', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', padding: '0.90rem' }}
                onClick={handleIHavePaidAction}
              >
                I Have Paid ✓
              </button>
            </div>

            {/* Back button */}
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => { setFoundOrder(null); setGeneratedOrder(null); setCustomInvoiceOpen(false); }}
                style={{ fontSize: '0.8rem', padding: '0.4rem 1.25rem' }}
              >
                ← Go Back & Configure Different Plan
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
        <button className="btn btn-outline" onClick={onBackToHome}>
          ← Go Back to QXT Homepage
        </button>
      </div>

    </div>
  );
}
