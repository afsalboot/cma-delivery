"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getDeliveries,
  getDelivery,
  createDelivery,
  updateDelivery,
  deleteDelivery,
} from "@/service/deliveryApi";

const DeliveryContext =
  createContext();

const AUTO_REFRESH_INTERVAL_MS = 15000;

export const DeliveryProvider = ({
  children,
}) => {
  const [deliveries, setDeliveries] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadDeliveries = useCallback(
    async ({
      showLoading = false,
    } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        const data =
          await getDeliveries();

        setDeliveries(
          data.data || []
        );
      } catch (error) {
        console.error(error);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const getDeliveryById =
    async (id) => {
      const data =
        await getDelivery(id);

      return data.data;
    };

  const addDelivery = async (
    payload
  ) => {
    const data =
      await createDelivery(
        payload
      );

    await loadDeliveries();

    return data.data;
  };

  const editDelivery = async (
    id,
    payload
  ) => {
    const data =
      await updateDelivery(
        id,
        payload
      );

    await loadDeliveries();

    return data.data;
  };

  const removeDelivery =
    async (id) => {
      await deleteDelivery(id);

      await loadDeliveries();
    };

  useEffect(() => {
    let mounted = true;

    const fetchData =
      async () => {
        try {
          const data =
            await getDeliveries();

          if (mounted) {
            setDeliveries(
              data.data || []
            );
          }
        } catch (error) {
          console.error(error);
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") {
        loadDeliveries();
      }
    };

    const intervalId = window.setInterval(
      refreshIfVisible,
      AUTO_REFRESH_INTERVAL_MS,
    );

    window.addEventListener("focus", refreshIfVisible);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshIfVisible);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loadDeliveries]);

  return (
    <DeliveryContext.Provider
      value={{
        deliveries,
        loading,
        loadDeliveries,
        getDeliveryById,
        addDelivery,
        editDelivery,
        removeDelivery,
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDeliveries = () => {
  const context = useContext(
    DeliveryContext
  );

  if (!context) {
    throw new Error(
      "useDeliveries must be used within DeliveryProvider"
    );
  }

  return context;
};
