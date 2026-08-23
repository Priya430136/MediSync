import React, { useState, useEffect } from "react";
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Link,
  Unlink,
  Layers,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  Activity,
  AlertCircle,
  FileText
} from "lucide-react";
import { API } from "@/lib/api";
import { GoogleCalendarAccount, GoogleCalendarEventRecord, GoogleCalendarTestReport } from "@/types/appointment";

interface GoogleCalendarManagerProps {
  currentUser?: {
    email?: string;
    fullName?: string;
    role?: string;
    userId?: string;
  } | null;
  onRefreshAppointments?: () => void;
}

export const GoogleCalendarManager: React.FC<GoogleCalendarManagerProps> = ({
  currentUser,
  onRefreshAppointments,
}) => {
  const [calendarStatus, setCalendarStatus] = useState<any>(null);
  const [events, setEvents] = useState<GoogleCalendarEventRecord[]>([]);
  const [accounts, setAccounts] = useState<GoogleCalendarAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [testReport, setTestReport] = useState<GoogleCalendarTestReport | null>(null);
  const [runningTests, setRunningTests] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<"patient" | "doctor" | "admin">("patient");
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "events" | "accounts" | "tests" | "guide">("overview");

  const effectiveEmail = currentUser?.email || customEmail || "michael.chen@example.com";

  const loadData = async () => {
    setLoading(true);
    try {
      const statusRes = await API.getCalendarStatus(effectiveEmail);
      setCalendarStatus(statusRes);

      const eventsRes = await API.getCalendarEvents();
      setEvents(eventsRes);

      if (currentUser?.role === "admin" || currentUser?.role === "doctor") {
        const accsRes = await API.getCalendarAccounts();
        setAccounts(accsRes);
      }
    } catch (err: any) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.email) {
      setCustomEmail(currentUser.email);
    }
    if (currentUser?.role) {
      setSelectedRole(currentUser.role as any);
    }
    loadData();
  }, [currentUser?.email]);

  const handleConnectCalendar = async () => {
    setConnecting(true);
    setActionMessage(null);
    try {
      const res = await API.connectCalendar({
        email: effectiveEmail,
        role: selectedRole,
        userId: currentUser?.userId || `user-${Date.now()}`,
        scope: "https://www.googleapis.com/auth/calendar.events",
      });
      setActionMessage({ type: "success", text: res.message || "Google Calendar connected successfully!" });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to connect Google Calendar." });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    setActionMessage(null);
    try {
      const res = await API.disconnectCalendar(effectiveEmail);
      setActionMessage({ type: "success", text: res.message || "Google Calendar disconnected." });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to disconnect Google Calendar." });
    }
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    setActionMessage(null);
    try {
      const res = await API.refreshCalendarToken(effectiveEmail);
      setActionMessage({ type: "success", text: res.message || "Token refreshed successfully!" });
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to refresh token." });
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleRunVerificationSuite = async () => {
    setRunningTests(true);
    setActionMessage(null);
    try {
      const report = await API.runGoogleCalendarTests();
      setTestReport(report);
      setActionMessage({
        type: report.allTestsPassed ? "success" : "error",
        text: report.summary || "Completed Google Calendar integration tests.",
      });
      await loadData();
      if (onRefreshAppointments) onRefreshAppointments();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Failed to execute Google Calendar tests." });
    } finally {
      setRunningTests(false);
    }
  };

  const isConnected = calendarStatus?.connected;
  const accountInfo = calendarStatus?.account;

  return (
    <div id="google-calendar-manager-root" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide uppercase text-blue-100 border border-white/15">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <span>Google Calendar API & OAuth 2.0 Integration</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Calendar Synchronization & Event Hub
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Bi-directional appointment synchronization for patients and physicians with automated OAuth 2.0 token
              lifecycle, idempotent deduplication, and non-blocking failure isolation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="btn-run-calendar-tests"
              onClick={handleRunVerificationSuite}
              disabled={runningTests}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {runningTests ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Integration...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run 6-Point Test Suite</span>
                </>
              )}
            </button>
            <button
              id="btn-refresh-calendar-data"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/20"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/15 pt-4">
          {[
            { id: "overview", label: "Connection & Status", icon: ShieldCheck },
            { id: "events", label: `Synced Events (${events.length})`, icon: Layers },
            { id: "tests", label: "Automated Test Suite", icon: CheckCircle2 },
            { id: "guide", label: "GCP Setup & Docs", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-calendar-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? "bg-white text-blue-900 shadow"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Notifications */}
      {actionMessage && (
        <div
          id="calendar-action-banner"
          className={`p-4 rounded-xl text-sm font-medium flex items-center justify-between border ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          <div className="flex items-center gap-3">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-60 hover:opacity-100 font-semibold uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & CONNECTION CARD */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Account Connection Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Google Calendar Account</h2>
                  <p className="text-xs text-slate-500">OAuth 2.0 Integration & Token Management</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isConnected
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}
                  />
                  {isConnected ? "Connected & Active" : "Disconnected"}
                </span>
              </div>
            </div>

            {/* Email Switcher / Current Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Connected Email</label>
                <input
                  type="email"
                  value={effectiveEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. physician@medisync.com"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">User Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="patient">Patient (Michael Chen)</option>
                  <option value="doctor">Doctor (Dr. Sarah Jenkins)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            {/* Connection Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isConnected ? (
                <button
                  id="btn-connect-google-calendar"
                  onClick={handleConnectCalendar}
                  disabled={connecting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow transition-all disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Authorizing OAuth...</span>
                    </>
                  ) : (
                    <>
                      <Link className="w-4 h-4" />
                      <span>Connect Google Calendar</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    id="btn-disconnect-google-calendar"
                    onClick={handleDisconnectCalendar}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-semibold rounded-xl transition-all"
                  >
                    <Unlink className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>

                  <button
                    id="btn-refresh-oauth-token"
                    onClick={handleRefreshToken}
                    disabled={refreshingToken}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                  >
                    <RotateCcw className={`w-4 h-4 ${refreshingToken ? "animate-spin" : ""}`} />
                    <span>Refresh Token</span>
                  </button>
                </>
              )}
            </div>

            {/* Account Details if connected */}
            {accountInfo && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Integration Details & Security Parameters</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Granted OAuth Scope:</span>
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700 block truncate">
                      {accountInfo.scope || "https://www.googleapis.com/auth/calendar.events"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Token Expiry Window:</span>
                    <span className="font-medium text-slate-800">
                      {accountInfo.expiresAt
                        ? `${new Date(accountInfo.expiresAt).toLocaleTimeString()} (${
                            accountInfo.isExpired ? "Expired" : "Valid"
                          })`
                        : "Active"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Connected At:</span>
                    <span>{accountInfo.connectedAt ? new Date(accountInfo.connectedAt).toLocaleString() : "Recently"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Last Successful Sync:</span>
                    <span>{accountInfo.lastSyncedAt ? new Date(accountInfo.lastSyncedAt).toLocaleString() : "Pending sync"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sync Rules & Architecture Side Panel */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Idempotent Sync Rules</span>
            </h3>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Dual-Party Synchronization</strong>
                  Automatically syncs separate calendar events for both the patient and the consulting physician.
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Deterministic Deduplication</strong>
                  Idempotency keys prevent duplicate calendar event entries even when network requests are retried.
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 flex gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-900 block font-semibold">Non-Blocking Fault Isolation</strong>
                  If the Google Calendar API experiences an outage, appointment booking remains 100% successful with failure captured for retry.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE SYNCED CALENDAR EVENTS */}
      {activeTab === "events" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Google Calendar Event Log</h3>
              <p className="text-xs text-slate-500">Live ledger of synchronized Google Calendar entries & IDs</p>
            </div>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Ledger</span>
            </button>
          </div>

          {events.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium">No Google Calendar events synchronized yet.</p>
              <p className="text-xs text-slate-400">
                Book or reschedule an appointment to see automated calendar synchronization in action.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recipient & Role</th>
                    <th className="px-4 py-3">Event Summary</th>
                    <th className="px-4 py-3">Appointment / Ref</th>
                    <th className="px-4 py-3">Google Event ID</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider text-[10px] ${
                            evt.status === "created"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : evt.status === "updated"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : evt.status === "deleted"
                              ? "bg-slate-100 text-slate-600 line-through"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{evt.recipientEmail}</div>
                        <div className="text-slate-400 uppercase text-[10px] tracking-wider">{evt.recipientRole}</div>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-medium text-slate-800 truncate">{evt.summary}</div>
                        <div className="text-slate-400 text-[11px]">
                          {evt.startDateTime ? new Date(evt.startDateTime).toLocaleString() : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                        #{evt.bookingReference}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px] truncate max-w-[140px]">
                        {evt.googleEventId || "N/A (Failed)"}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {evt.htmlLink && (
                          <a
                            href={evt.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition-all"
                          >
                            <span>Open in Calendar</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AUTOMATED 6-POINT TEST SUITE */}
      {activeTab === "tests" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Automated Google Calendar & OAuth Test Suite</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Executes all 6 required integration verification tests against the live service engine.
              </p>
            </div>
            <button
              id="btn-run-tests-tab"
              onClick={handleRunVerificationSuite}
              disabled={runningTests}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold rounded-xl shadow transition-all disabled:opacity-50"
            >
              {runningTests ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running All Tests...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Execute Verification Suite</span>
                </>
              )}
            </button>
          </div>

          {testReport && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              <div className="p-4 bg-slate-50/80 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Test Execution Results ({testReport.results.filter((r) => r.passed).length}/{testReport.results.length} Passed)</span>
                <span className="text-slate-400">Timestamp: {new Date(testReport.timestamp).toLocaleTimeString()}</span>
              </div>

              {testReport.results.map((test) => {
                const isExpanded = expandedTest === test.testId;
                return (
                  <div key={test.testId} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedTest(isExpanded ? null : test.testId)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            test.passed ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {test.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">{test.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{test.expected}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            test.passed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {test.passed ? "PASSED" : "FAILED"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3 text-xs bg-slate-50 p-4 rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                          <div>
                            <span className="font-semibold text-slate-500 block">Actual Outcome:</span>
                            <span>{test.actual}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500 block">Verification Scope:</span>
                            <span>{test.details}</span>
                          </div>
                        </div>

                        {test.checks && test.checks.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <span className="font-semibold text-slate-800 block">Granular Assertions:</span>
                            {test.checks.map((chk, i) => (
                              <div key={i} className="flex items-center gap-2 text-slate-600">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{chk.check}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GCP SETUP & DOCUMENTATION */}
      {activeTab === "guide" && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-900">Google Cloud Project & OAuth 2.0 Reference Guide</h3>
            <p className="text-xs text-slate-500">
              Technical specifications and credentials configuration for production calendar integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>1. Required OAuth Scopes</span>
                </h4>
                <p className="text-slate-600">MediSync requests the minimum necessary scopes to manage patient consultations:</p>
                <ul className="list-disc list-inside font-mono bg-white p-2 rounded border border-slate-200 text-slate-800 space-y-1">
                  <li>https://www.googleapis.com/auth/calendar.events</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>2. Environment Variables (.env)</span>
                </h4>
                <p className="text-slate-600">Never expose client secrets on the client side:</p>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] leading-relaxed">
                  GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com<br />
                  GOOGLE_CLIENT_SECRET=your_client_secret<br />
                  GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/oauth/callback
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>3. Lifecycle Synchronization Architecture</span>
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  • <strong>Booking:</strong> Dual event creation for Patient and Physician. Event IDs persisted to appointment.<br />
                  • <strong>Rescheduling:</strong> In-place update to existing events with reschedule timestamp notices.<br />
                  • <strong>Cancellation:</strong> Safe event deletion and slot liberation.<br />
                  • <strong>Failure Tolerance:</strong> 100% isolated try-catch blocks protect clinical appointment booking.
                </p>
              </div>

              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>4. Complete Setup Documentation</span>
                </h4>
                <p className="text-blue-800 leading-relaxed">
                  Full step-by-step GCP project configuration instructions, consent screen requirements, and verification protocols are documented in <code className="bg-blue-100 px-1 py-0.5 rounded font-mono text-blue-900">GOOGLE_CALENDAR_SETUP.md</code> in the repository root.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
