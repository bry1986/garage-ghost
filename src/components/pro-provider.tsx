"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ProModal } from "@/components/pro-modal";
import {
  activateLicense,
  deactivateLicense,
  deriveLicenseStatus,
  getProState,
  validateLicense,
  type LicenseStatus,
} from "@/lib/pro";

interface ActivateOutcome {
  ok: boolean;
  error?: string;
}

interface ProContextValue {
  /** True when a validated, active license is stored in this browser. */
  isPro: boolean;
  /** "active" | "expired" | null — drives the header status badge. */
  licenseStatus: LicenseStatus;
  /** True while the stored license is being re-validated on load. */
  validating: boolean;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  activate: (licenseKey: string) => Promise<ActivateOutcome>;
  deactivate: () => Promise<void>;
}

const ProContext = createContext<ProContextValue | null>(null);

export function ProProvider({ children }: { children: ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>(null);
  const [validating, setValidating] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const checkedOnMount = useRef(false);

  // On load, re-validate any stored license so an expired/cancelled
  // subscription loses access. Network failures keep the stored state
  // (validateLicense returns true on transient errors).
  useEffect(() => {
    if (checkedOnMount.current) return;
    checkedOnMount.current = true;
    const state = getProState();
    if (!state) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- external-store read on mount is intentional here
      setLicenseStatus(null);
      setValidating(false);
      return;
    }
    validateLicense(state)
      .then((valid) => {
        setIsPro(valid);
        setLicenseStatus(deriveLicenseStatus(true, valid));
      })
      .catch(() => {
        // Unexpected failure while validating a stored license — surface it as
        // expired so the user can renew or re-enter a key.
        setIsPro(false);
        setLicenseStatus("expired");
      })
      .finally(() => setValidating(false));
  }, []);

  const openModal = useCallback(() => setModalOpen(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);

  const activate = useCallback(async (licenseKey: string): Promise<ActivateOutcome> => {
    try {
      await activateLicense(licenseKey);
      setIsPro(true);
      setLicenseStatus("active");
      return { ok: true };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Activation failed. Try again.";
      return { ok: false, error: message };
    }
  }, []);

  const deactivate = useCallback(async () => {
    await deactivateLicense();
    setIsPro(false);
    setLicenseStatus(null);
  }, []);

  const value = useMemo<ProContextValue>(
    () => ({
      isPro,
      licenseStatus,
      validating,
      modalOpen,
      openModal,
      closeModal,
      activate,
      deactivate,
    }),
    [isPro, licenseStatus, validating, modalOpen, openModal, closeModal, activate, deactivate]
  );

  return (
    <ProContext.Provider value={value}>
      {children}
      <ProModal
        open={modalOpen}
        isPro={isPro}
        licenseStatus={licenseStatus}
        onClose={closeModal}
        onActivate={activate}
        onDeactivate={deactivate}
      />
    </ProContext.Provider>
  );
}

export function usePro(): ProContextValue {
  const context = useContext(ProContext);
  if (!context) {
    throw new Error("usePro must be used within a ProProvider");
  }
  return context;
}
