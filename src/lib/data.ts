import { ChallengeAccount, InstantAccount, Broker, CryptoPaymentMethod } from '../types';

export const challengeAccounts: ChallengeAccount[] = [
  { size: "$3,000", price: 45, target: 1200, dailyLimit: 900, drawdown: 2000, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$5,000", price: 75, target: 2000, dailyLimit: 1500, drawdown: 3333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$8,000", price: 120, target: 3200, dailyLimit: 2400, drawdown: 5333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$11,000", price: 165, target: 4400, dailyLimit: 3300, drawdown: 7333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$14,000", price: 210, target: 5600, dailyLimit: 4200, drawdown: 9333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$17,000", price: 255, target: 6800, dailyLimit: 5100, drawdown: 11333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$20,000", price: 300, target: 8000, dailyLimit: 6000, drawdown: 13333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$23,000", price: 345, target: 9200, dailyLimit: 6900, drawdown: 15333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$26,000", price: 390, target: 10400, dailyLimit: 7800, drawdown: 17333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$29,000", price: 435, target: 11600, dailyLimit: 8700, drawdown: 19333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$32,000", price: 480, target: 12800, dailyLimit: 9600, drawdown: 21333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$35,000", price: 525, target: 14000, dailyLimit: 10500, drawdown: 23333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$38,000", price: 570, target: 15200, dailyLimit: 11400, drawdown: 25333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$41,000", price: 615, target: 16400, dailyLimit: 12300, drawdown: 27333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$44,000", price: 660, target: 17600, dailyLimit: 13200, drawdown: 29333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$47,000", price: 705, target: 18800, dailyLimit: 14100, drawdown: 31333, status: "Evaluation Required", cta: "Get Funded" },
  { size: "$50,000", price: 750, target: 20000, dailyLimit: 15000, drawdown: 33333, status: "Evaluation Required", cta: "Get Funded" },
];

export const instantAccounts: InstantAccount[] = [
  { size: "$3,000", price: 65, dailyLimit: 700, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$5,000", price: 108, dailyLimit: 1167, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$8,000", price: 173, dailyLimit: 1867, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$11,000", price: 238, dailyLimit: 2567, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$14,000", price: 303, dailyLimit: 3267, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$17,000", price: 368, dailyLimit: 3967, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$20,000", price: 433, dailyLimit: 4667, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$23,000", price: 498, dailyLimit: 5367, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$26,000", price: 563, dailyLimit: 6067, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$29,000", price: 628, dailyLimit: 6767, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$32,000", price: 693, dailyLimit: 7467, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$35,000", price: 758, dailyLimit: 8167, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$32,000", price: 823, dailyLimit: 8867, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$41,000", price: 888, dailyLimit: 9567, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$44,000", price: 953, dailyLimit: 10267, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$47,000", price: 1018, dailyLimit: 10967, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
  { size: "$50,000", price: 1083, dailyLimit: 11667, payout: "92%", status: "Direct Funding", cta: "Get Funded" },
];

export const brokers: Broker[] = [
  { id: "pocketOption", name: "Pocket Option", logo: "https://i.ibb.co/4RWf6GPR/Pocket-Option-logo-PNG1.png", desc: "Top-rated broker with flexible options trade modes and premium liquidity levels." },
  { id: "quotex", name: "Quotex", logo: "https://i.ibb.co/XxgfVcbP/quotex-io-seeklogo.png", desc: "Highly customizable UI and perfect modern trading interface for active clients." },
  { id: "binomo", name: "Binomo", logo: "https://i.ibb.co/kCCmxZ7/binomo-logo.png", desc: "Robust and steady execution speed, excellent for scalping models and rapid entries." },
  { id: "olympTrade", name: "Olymp Trade", logo: "https://i.ibb.co/FqDRTqx1/toppng-com-olymp-trade-transparent-logo-png-5000x5113.png", desc: "Multi-market broker with deep indicators selection and lightning fast fills." }
];

export const cryptoPaymentMethods: CryptoPaymentMethod[] = [
  {
    id: "usdtERC20",
    name: "USDT ERC20",
    logo: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png",
    wallet: "0xddFe4cf18e35Baf826d85383530a07f41BE80773",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=0xddFe4cf18e35Baf826d85383530a07f41BE80773&color=b5903b"
  },
  {
    id: "usdtTRC20",
    name: "USDT TRC20",
    logo: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png",
    wallet: "TYMR9veu9r1ULfDSppe1dS2LApkUnwA8iA",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=TYMR9veu9r1ULfDSppe1dS2LApkUnwA8iA&color=0075ff"
  },
  {
    id: "bep20",
    name: "BEP20 (USDT / BNB)",
    logo: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/usdt.png",
    wallet: "0xddFe4cf18e35Baf826d85383530a07f41BE80773",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=0xddFe4cf18e35Baf826d85383530a07f41BE80773&color=b5903b"
  },
  {
    id: "btc",
    name: "BTC (Bitcoin)",
    logo: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/btc.png",
    wallet: "bc1q4vcj0c0ffe56spnj8chg2umgvcdn2q22w6q7ux",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=bc1q4vcj0c0ffe56spnj8chg2umgvcdn2q22w6q7ux&color=b5903b"
  },
  {
    id: "eth",
    name: "ETH (Ethereum)",
    logo: "https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/128/color/eth.png",
    wallet: "0xddFe4cf18e35Baf826d85383530a07f41BE80773",
    qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=0xddFe4cf18e35Baf826d85383530a07f41BE80773&color=0075ff"
  }
];
