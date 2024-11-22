export type Wallet = {
    ownerEmail: string,
    balance: number | undefined;
};

export type CreditCard = {
    ownerName: string;
    cardNumber: number;
    cvvNumber: number;
    expirationDate: string;
};