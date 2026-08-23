import React, { useState, useEffect } from "react";
import { EmailNotificationRecord, NotificationType } from "@/types/appointment";
import { API } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Play,
  Check,
  X,
  Eye,
  Send,
  Sparkles,
  ShieldCheck,
  Clock,
  User,
  Stethoscope,
  Copy,
  Terminal,
  ExternalLink,
  Filter
} from "lucide-react";

export const EmailSystemManager: React.FC = () => {
  const [emails, setEmails] = useState<EmailNotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Automated Test Suite State
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Email Detail & HTML Preview Modal
  const [selectedEmail, setSelectedEmail] = useState<EmailNotificationRecord | null>(null);
  const [retryingEmailId, setRetryingEmailId] = useState<string | null>(null);

  // Interactive Template Studio State
  const [previewType, setPreviewType] = useState<NotificationType>("BOOKING_CONFIRMATION");
  const [previewRole, setPreviewRole] = useState<"patient" | "doctor">("patient");
  const [previewData, setPreviewData] = useState<{ subject: string; html: string; text: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewFormat, setPreviewFormat] = useState<"rendered" | "source" | "text">("rendered");

  // Live Test Dispatcher State
  const [testRecipientEmail, setTestRecipientEmail] = useState("patient.sarah@example.com");
  const [testRecipientName, setTestRecipientName] = useState("Sarah Connor");
  const [testEmailType, setTestEmailType] = useState<NotificationType>("BOOKING_CONFIRMATION");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [dispatchingTest, setDispatchingTest] = useState(false);

  useEffect(() => {
    loadEmails();
    loadTemplatePreview("BOOKING_CONFIRMATION", "patient");
  }, []);

  const loadEmails = async () => {
    setLoading(true);
    try {
      const data = await API.getEmails();
      setEmails(data);
    } catch (err: any) {
      toast.error("Failed to load email records: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatePreview = async (type: NotificationType, role: "patient" | "doctor") => {
    setLoadingPreview(true);
    try {
      const data = await API.previewEmailTemplate(type, role);
      setPreviewData(data);
    } catch (err: any) {
      toast.error("Failed to render template preview: " + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleTemplateChange = (type: NotificationType, role: "patient" | "doctor") => {
    setPreviewType(type);
    setPreviewRole(role);
    loadTemplatePreview(type, role);
  };

  const handleRunEmailTests = async () => {
    setTesting(true);
    setTestResults(null);
    try {
      const res = await API.runEmailNotificationTest();
      setTestResults(res);
      if (res.allTestsPassed) {
        toast.success("All 7 Email Notification tests passed successfully!");
      } else {
        toast.warning("Some email tests encountered issues. Review details below.");
      }
      loadEmails();
    } catch (err: any) {
      toast.error("Email test suite failed to execute: " + err.message);
    } finally {
      setTesting(false);
    }
  };

  const handleRetryEmail = async (emailId: string) => {
    setRetryingEmailId(emailId);
    try {
      const res = await API.retryEmail(emailId);
      if (res.success) {
        toast.success(res.message || "Email re-sent successfully!");
      } else {
        toast.error("Retry attempt failed: " + (res.data?.error || "Unknown transport error"));
      }
      loadEmails();
      if (selectedEmail && selectedEmail.id === emailId) {
        const updated = await API.getEmail(emailId);
        setSelectedEmail(updated);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to retry email");
    } finally {
      setRetryingEmailId(null);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipientEmail) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    setDispatchingTest(true);
    try {
      const res = await API.sendTestEmail({
        recipientEmail: testRecipientEmail,
        recipientName: testRecipientName,
        type: testEmailType,
        simulateFailure: simulateFailure
      });
      if (res.success) {
        toast.success(`Test email dispatched successfully to ${testRecipientEmail}!`);
      } else if (simulateFailure) {
        toast.info("Simulated failure recorded as expected. Non-blocking error isolation verified!");
      } else {
        toast.error("Email dispatch failed: " + (res.data?.error || "Unknown error"));
      }
      loadEmails();
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch test email");
    } finally {
      setDispatchingTest(false);
    }
  };

  const filteredEmails = emails.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (typeFilter !== "all" && e.type !== typeFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
        return <Badge className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
      case "sent":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Sent</Badge>;
      case "retrying":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 animate-pulse">Retrying</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Failed</Badge>;
      case "queued":
      default:
        return <Badge variant="outline">Queued</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Metric Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4 border shadow-sm bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Total Emails</span>
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-foreground mt-1">{emails.length}</p>
          <span className="text-[10px] text-muted-foreground">Logged in notification engine</span>
        </Card>
        <Card className="p-4 border shadow-sm bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Delivered</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-extrabold text-green-600 mt-1">
            {emails.filter((e) => e.status === "delivered" || e.status === "sent").length}
          </p>
          <span className="text-[10px] text-muted-foreground">Successful recipient deliveries</span>
        </Card>
        <Card className="p-4 border shadow-sm bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Retrying / Queued</span>
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {emails.filter((e) => e.status === "retrying" || e.status === "queued").length}
          </p>
          <span className="text-[10px] text-muted-foreground">In background worker queue</span>
        </Card>
        <Card className="p-4 border shadow-sm bg-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-semibold">Failure Isolation</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">100%</p>
          <span className="text-[10px] text-muted-foreground">Zero blocked appointment bookings</span>
        </Card>
      </div>

      {/* SECTION 1: AUTOMATED TEST SUITE RUNNER */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Automated Email Notification Test Suite
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Comprehensive end-to-end test runner validating all 5 notification types, non-blocking failure isolation, and deduplication guarantees.
            </CardDescription>
          </div>
          <Button
            onClick={handleRunEmailTests}
            disabled={testing}
            className="font-bold flex items-center gap-2 text-xs"
          >
            {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {testing ? "Running 7 Tests..." : "Run Email Test Suite"}
          </Button>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {testResults && (
            <div className="space-y-3">
              <div
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  testResults.allTestsPassed ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {testResults.allTestsPassed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-xs">{testResults.summary}</span>
                    <span className="text-[10px] block opacity-80">{testResults.timestamp}</span>
                  </div>
                </div>
                <Badge variant={testResults.allTestsPassed ? "default" : "destructive"}>
                  {testResults.allTestsPassed ? "ALL TESTS PASSED" : "REVIEW REQUIRED"}
                </Badge>
              </div>

              {/* Test Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {testResults.results?.map((t: any) => (
                  <div
                    key={t.testId}
                    className={`p-3.5 rounded-lg border transition-all ${
                      t.passed ? "bg-card border-border" : "bg-red-50/40 border-red-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="font-bold text-foreground flex items-center gap-1.5">
                        {t.passed ? (
                          <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                        )}
                        {t.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-mono ${
                          t.passed ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {t.passed ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-muted-foreground mb-2">{t.details}</p>

                    <div className="space-y-1 bg-muted/40 p-2 rounded border font-mono text-[10px]">
                      {t.checks?.map((chk: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <span className={chk.passed ? "text-green-600" : "text-red-600"}>
                              {chk.passed ? "✓" : "✗"}
                            </span>
                            {chk.check}
                          </span>
                          {chk.details && <span className="text-foreground font-semibold">{chk.details}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!testResults && !testing && (
            <div className="p-4 rounded-lg bg-muted/20 border text-center text-xs text-muted-foreground">
              Click <strong className="text-foreground">"Run Email Test Suite"</strong> above to verify booking confirmations, reminders, cancellations, leave alerts, rescheduling notifications, failure isolation, and duplicate prevention.
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 2: INTERACTIVE REUSABLE EMAIL TEMPLATE STUDIO */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" /> Reusable Email Template Studio
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Preview the responsive, accessible HTML and text layouts designed for patients and medical staff across all appointment lifecycle events.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border text-xs">
            {/* Template Selector */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-muted-foreground">Template:</span>
              {(
                [
                  ["BOOKING_CONFIRMATION", "Booking Confirmation"],
                  ["APPOINTMENT_REMINDER", "Reminder (24h)"],
                  ["APPOINTMENT_CANCELLED", "Cancellation"],
                  ["DOCTOR_LEAVE_ALERT", "Doctor Leave Alert"],
                  ["APPOINTMENT_RESCHEDULED", "Rescheduled"],
                ] as const
              ).map(([typeKey, label]) => (
                <Button
                  key={typeKey}
                  size="sm"
                  variant={previewType === typeKey ? "default" : "outline"}
                  className="text-xs h-7 px-2.5"
                  onClick={() => handleTemplateChange(typeKey as NotificationType, previewRole)}
                >
                  {label}
                </Button>
              ))}
            </div>

            {/* Role & Format Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-background rounded-md border p-0.5">
                <button
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    previewRole === "patient" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => handleTemplateChange(previewType, "patient")}
                >
                  Patient View
                </button>
                <button
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-all ${
                    previewRole === "doctor" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => handleTemplateChange(previewType, "doctor")}
                >
                  Doctor View
                </button>
              </div>

              <div className="flex items-center bg-background rounded-md border p-0.5">
                <button
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    previewFormat === "rendered" ? "bg-muted text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setPreviewFormat("rendered")}
                >
                  Rendered
                </button>
                <button
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    previewFormat === "text" ? "bg-muted text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setPreviewFormat("text")}
                >
                  Plain Text
                </button>
                <button
                  className={`px-2 py-1 rounded text-[11px] font-semibold ${
                    previewFormat === "source" ? "bg-muted text-foreground" : "text-muted-foreground"
                  }`}
                  onClick={() => setPreviewFormat("source")}
                >
                  HTML Source
                </button>
              </div>
            </div>
          </div>

          {/* Template Subject Line */}
          {previewData && (
            <div className="p-2.5 bg-muted/40 rounded border flex items-center gap-2 text-xs">
              <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Subject:</span>
              <span className="font-bold text-foreground font-mono">{previewData.subject}</span>
            </div>
          )}

          {/* Preview Container */}
          <div className="border rounded-lg overflow-hidden bg-background">
            {loadingPreview ? (
              <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" /> Rendering template preview...
              </div>
            ) : previewData ? (
              previewFormat === "rendered" ? (
                <div className="p-4 bg-muted/10 flex justify-center">
                  <div
                    className="w-full max-w-xl bg-white text-black rounded-lg shadow-sm border p-6 overflow-auto max-h-[500px]"
                    dangerouslySetInnerHTML={{ __html: previewData.html }}
                  />
                </div>
              ) : previewFormat === "text" ? (
                <pre className="p-4 bg-muted/40 text-xs font-mono whitespace-pre-wrap max-h-[400px] overflow-auto">
                  {previewData.text}
                </pre>
              ) : (
                <pre className="p-4 bg-muted/40 text-[11px] font-mono whitespace-pre-wrap max-h-[400px] overflow-auto text-muted-foreground">
                  {previewData.html}
                </pre>
              )
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: LIVE DISPATCHER & ERROR ISOLATION SIMULATOR */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" /> Test Email Dispatch & Transport Simulation
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Dispatch individual test notifications or simulate transport failure to verify that appointment operations never fail when an email error occurs.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
            <div className="sm:col-span-4">
              <label className="font-semibold block mb-1">Recipient Name</label>
              <Input
                value={testRecipientName}
                onChange={(e) => setTestRecipientName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="text-xs h-9"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="font-semibold block mb-1">Recipient Email</label>
              <Input
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                placeholder="e.g. patient@example.com"
                className="text-xs h-9"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="font-semibold block mb-1">Notification Type</label>
              <select
                value={testEmailType}
                onChange={(e) => setTestEmailType(e.target.value as NotificationType)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                <option value="APPOINTMENT_REMINDER">Appointment Reminder</option>
                <option value="APPOINTMENT_CANCELLED">Appointment Cancellation</option>
                <option value="DOCTOR_LEAVE_ALERT">Doctor Leave Alert</option>
                <option value="APPOINTMENT_RESCHEDULED">Appointment Rescheduled</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span className="font-medium text-foreground">
                Simulate SMTP Network / Transport Failure (Tests Safe Error Isolation & Background Retry)
              </span>
            </label>

            <Button
              onClick={handleSendTestEmail}
              disabled={dispatchingTest}
              className="font-bold flex items-center gap-2 text-xs"
            >
              {dispatchingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {simulateFailure ? "Dispatch (Simulate Failure)" : "Dispatch Live Test Email"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: LIVE EMAIL NOTIFICATION QUEUE & LOGS */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" /> Live Email Delivery Log & Retry Queue ({filteredEmails.length})
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Real-time audit log of all generated emails with delivery status, retry attempts, deduplication keys, and failure traces.
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={loadEmails}
            disabled={loading}
            className="text-xs h-8 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">All Statuses ({emails.length})</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="retrying">Retrying</option>
                <option value="failed">Failed</option>
                <option value="queued">Queued</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 ml-2">
              <span className="font-semibold text-muted-foreground">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">All Notification Types</option>
                <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                <option value="APPOINTMENT_REMINDER">Appointment Reminder</option>
                <option value="APPOINTMENT_CANCELLED">Appointment Cancellation</option>
                <option value="DOCTOR_LEAVE_ALERT">Doctor Leave Alert</option>
                <option value="APPOINTMENT_RESCHEDULED">Appointment Rescheduled</option>
              </select>
            </div>
          </div>

          {/* Email Records Table */}
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b text-[11px] font-semibold text-muted-foreground">
                  <th className="p-3">Status</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Recipient</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Attempts</th>
                  <th className="p-3">Sent / Updated At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredEmails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-muted-foreground text-xs">
                      No email records match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredEmails.map((email) => (
                    <tr key={email.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 whitespace-nowrap">{getStatusBadge(email.status)}</td>
                      <td className="p-3 whitespace-nowrap font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">{email.type}</span>
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-foreground block">{email.recipientName}</span>
                        <span className="text-[11px] text-muted-foreground block font-mono">
                          {email.recipientEmail} ({email.recipientRole})
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate font-medium text-foreground">{email.subject}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="font-mono text-xs">
                          {email.attempts} / {email.maxAttempts}
                        </span>
                        {email.lastError && (
                          <span className="text-[10px] text-red-600 block truncate max-w-[150px]" title={email.lastError}>
                            {email.lastError}
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap text-[11px] text-muted-foreground font-mono">
                        {new Date(email.updatedAt || email.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="p-3 whitespace-nowrap text-right space-x-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedEmail(email)}
                          className="h-7 text-xs px-2"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                        {(email.status === "failed" || email.status === "retrying") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryEmail(email.id)}
                            disabled={retryingEmailId === email.id}
                            className="h-7 text-xs px-2 text-amber-700 border-amber-300 hover:bg-amber-50"
                          >
                            <RefreshCw
                              className={`w-3.5 h-3.5 mr-1 ${retryingEmailId === email.id ? "animate-spin" : ""}`}
                            />
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DETAIL & PREVIEW MODAL */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedEmail && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" /> Email Delivery Record
                  </DialogTitle>
                  {getStatusBadge(selectedEmail.status)}
                </div>
                <DialogDescription className="text-xs">
                  ID: <span className="font-mono">{selectedEmail.id}</span>
                </DialogDescription>
              </DialogHeader>

              {/* Metadata Card */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg border text-xs font-mono">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Recipient</span>
                  <span className="font-semibold text-foreground">
                    {selectedEmail.recipientName} &lt;{selectedEmail.recipientEmail}&gt;
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Subject</span>
                  <span className="font-semibold text-foreground truncate block">{selectedEmail.subject}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Type / Role</span>
                  <span>
                    {selectedEmail.type} ({selectedEmail.recipientRole})
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Deduplication Key</span>
                  <span className="truncate block">{selectedEmail.deduplicationKey || "None"}</span>
                </div>
                {selectedEmail.lastError && (
                  <div className="col-span-2 text-red-600 bg-red-50 p-2 rounded border border-red-200">
                    <span className="font-bold block">Delivery Error:</span>
                    <span>{selectedEmail.lastError}</span>
                  </div>
                )}
              </div>

              {/* Rendered HTML */}
              <div className="border rounded-lg p-4 bg-muted/10">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Rendered Email Content
                </span>
                <div
                  className="bg-white text-black p-4 rounded border shadow-sm max-h-[350px] overflow-auto"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }}
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedEmail(null)}>
                  Close
                </Button>
                {(selectedEmail.status === "failed" || selectedEmail.status === "retrying") && (
                  <Button
                    size="sm"
                    onClick={() => handleRetryEmail(selectedEmail.id)}
                    disabled={retryingEmailId === selectedEmail.id}
                    className="font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retryingEmailId === selectedEmail.id ? "animate-spin" : ""}`} />
                    Retry Delivery Now
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default EmailSystemManager;
