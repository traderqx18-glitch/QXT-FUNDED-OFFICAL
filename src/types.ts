export interface ChallengeAccount {
  size: string;
  price: number;
  target: number;
  dailyLimit: number;
  drawdown: number;
  status: string;
  cta: string;
}

export interface InstantAccount {
  size: string;
  price: number;
  dailyLimit: number;
  payout: string;
  status: string;
  cta: string;
}

export interface Broker {
  id: string;
  name: string;
  logo: string;
  desc: string;
}

export interface CryptoPaymentMethod {
  id: string;
  name: string;
  logo: string;
  wallet: string;
  qrCodeUrl: string;
}

export interface SystemSettings {
  trustpilotScore: number;
  promoText: string;
}
