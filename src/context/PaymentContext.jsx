"use client";

import {
  applyCustomerCredit,
  createCustomerCredit,
  markCredit,
  receivePayment,
  settleCustomerCredit,
} from "@/service/paymentApi";
import { useDashboard } from "@/context/DashboardContext";
import { useDeliveries } from "@/context/DeliveryContext";
import { createContext, useContext, useState } from "react";

const PaymentContext = createContext(null);

export const PaymentProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const { loadDashboard } = useDashboard();
  const { loadDeliveries } = useDeliveries();

  const refreshAppData = async () => {
    await Promise.all([
      loadDeliveries(),
      loadDashboard(),
    ]);
  };

  const handleReceivePayment = async (payload) => {
    try {
      setLoading(true);

      const response = await receivePayment(payload);

      await refreshAppData();

      return response;
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCredit = async (deliveryId) => {
    try {
      setLoading(true);

      const response = await markCredit(deliveryId);

      await refreshAppData();

      return response;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomerCredit = async (payload) => {
    try {
      setLoading(true);

      const response = await createCustomerCredit(payload);

      await refreshAppData();

      return response;
    } finally {
      setLoading(false);
    }
  };

  const handleUseCustomerCredit = async (payload) => {
    try {
      setLoading(true);

      const response = await applyCustomerCredit(payload);

      await refreshAppData();

      return response;
    } finally {
      setLoading(false);
    }
  };

  const handleSettleCustomerCredit = async (payload) => {
    try {
      setLoading(true);

      const response = await settleCustomerCredit(payload);

      await refreshAppData();

      return response;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        loading,
        receivePayment: handleReceivePayment,
        markCredit: handleMarkCredit,
        createCustomerCredit: handleCreateCustomerCredit,
        applyCustomerCredit: handleUseCustomerCredit,
        settleCustomerCredit: handleSettleCustomerCredit,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayment = () => {
  const context = useContext(PaymentContext);

  if (!context) {
    throw new Error("usePayment must be used within PaymentProvider");
  }

  return context;
};
