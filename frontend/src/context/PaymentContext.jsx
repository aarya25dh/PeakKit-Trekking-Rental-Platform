/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";

const PaymentContext = createContext(null);
export function PaymentProvider({ children }) { const [payment, setPayment] = useState(null); const [transaction, setTransaction] = useState(null); const completePayment = (method) => { const orderId = `PK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`; setTransaction({ orderId, method, amount: payment?.amount || 0 }); setPayment(null); }; return <PaymentContext.Provider value={{ payment, transaction, openPayment: (amount) => setPayment({ amount }), closePayment: () => setPayment(null), completePayment }}>{children}</PaymentContext.Provider>; }
export const usePayment = () => useContext(PaymentContext);
