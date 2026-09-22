"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  OPEN_PREFS_EVENT,
  OPEN_PREFS_EVENT_ALT,
  getConsent,
  hasConsentDecision,
  saveConsent,
} from "@/lib/consent";

function Toggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="cookie-toggle">
      <div className="cookie-toggle-copy">
        <label htmlFor={id}>{label}</label>
        <p>{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`cookie-switch${checked ? " is-on" : ""}${disabled ? " is-disabled" : ""}`}
        data-testid={`consent-toggle-${id}`}
      >
        <span className="cookie-switch-knob" />
      </button>
    </div>
  );
}

export default function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    setMounted(true);
    const existing = getConsent();
    if (existing) {
      setAnalytics(!!existing.analytics);
      setMarketing(!!existing.marketing);
      setVisible(false);
    } else {
      setVisible(true);
    }

    const openPrefs = () => {
      const current = getConsent();
      setAnalytics(!!current?.analytics);
      setMarketing(!!current?.marketing);
      setPanelOpen(true);
      setVisible(true);
    };

    window.addEventListener(OPEN_PREFS_EVENT, openPrefs);
    window.addEventListener(OPEN_PREFS_EVENT_ALT, openPrefs);
    return () => {
      window.removeEventListener(OPEN_PREFS_EVENT, openPrefs);
      window.removeEventListener(OPEN_PREFS_EVENT_ALT, openPrefs);
    };
  }, []);

  const persist = useCallback(
    (nextAnalytics: boolean, nextMarketing: boolean, choice: string) => {
      saveConsent({
        analytics: nextAnalytics,
        marketing: nextMarketing,
        choice,
      });
      setAnalytics(nextAnalytics);
      setMarketing(nextMarketing);
      setPanelOpen(false);
      setVisible(false);
    },
    [],
  );

  if (!mounted || (!visible && !panelOpen)) return null;

  return (
    <div className="cookie-bar" data-testid="cookie-consent-root">
      <div
        className="cookie-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby="cookie-consent-title"
      >
        <div className="cookie-panel-head">
          <div>
            <span className="cookie-kicker">Privacy</span>
            <h2 id="cookie-consent-title">Cookie preferences</h2>
          </div>
          {(panelOpen || hasConsentDecision()) && (
            <button
              type="button"
              className="cookie-close"
              aria-label="Close cookie preferences"
              onClick={() => {
                setPanelOpen(false);
                if (hasConsentDecision()) setVisible(false);
              }}
              data-testid="cookie-consent-close"
            >
              ×
            </button>
          )}
        </div>

        <div className="cookie-panel-body">
          {!panelOpen ? (
            <>
              <p>
                We use strictly necessary cookies to run CFOmatics, plus optional
                analytics and marketing cookies. You can accept all, reject
                non-essential, or choose categories.{" "}
                <Link href="/privacy#cookies">Privacy Policy</Link>
              </p>
              <div className="cookie-actions">
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => persist(true, true, "accept_all")}
                  data-testid="cookie-accept-all"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => persist(false, false, "reject_all")}
                  data-testid="cookie-reject-all"
                >
                  Reject non-essential
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setPanelOpen(true)}
                  data-testid="cookie-customize"
                >
                  Customize
                </button>
              </div>
            </>
          ) : (
            <>
              <p>
                Strictly necessary cookies stay on. Toggle optional categories,
                then save.
              </p>
              <div className="cookie-toggles">
                <Toggle
                  id="necessary"
                  label="Strictly necessary"
                  description="Security, consent storage, and basic site navigation. Always on."
                  checked
                  disabled
                  onChange={() => {}}
                />
                <Toggle
                  id="analytics"
                  label="Analytics"
                  description="Anonymous page-view measurement and Google Analytics (Consent Mode) when allowed."
                  checked={analytics}
                  onChange={setAnalytics}
                />
                <Toggle
                  id="marketing"
                  label="Marketing / attribution"
                  description="First-touch UTM and landing-path attribution for campaign measurement."
                  checked={marketing}
                  onChange={setMarketing}
                />
              </div>
              <div className="cookie-actions">
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={() => persist(analytics, marketing, "custom")}
                  data-testid="cookie-save-prefs"
                >
                  Save preferences
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => persist(true, true, "accept_all")}
                  data-testid="cookie-accept-all-panel"
                >
                  Accept all
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => persist(false, false, "reject_all")}
                  data-testid="cookie-reject-panel"
                >
                  Reject non-essential
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
