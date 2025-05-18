"use client";

import { useRef, useState } from "react";
import LivePreview from "./LivePreview";
import ModalComponent from "./Modal";
import {
  Button,
  Card,
  Input,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { Paperclip, Upload } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ComposeComp = ({
  htmlBody,
  setHtmlBody,
  subject,
  setSubject,
  csvFile,
  setCsvFile,
  interval,
  setInterval,
}) => {
  const fileInputRef = useRef(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [logMessages, setLogMessages] = useState([]);
  const [sentCount, setSentCount] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [totalEmails, setTotalEmails] = useState(0);
  const [campaignName, setCampaignName] = useState("");

  const handleSubmit = async () => {
    if (!csvFile || !subject || !campaignName || !htmlBody || !interval) {
      toast.error("Please fill all required fields", {
        position: "top-right",
        autoClose: 5000,
      });
      return;
    }

    setIsSending(true);
    setLogMessages([]);
    setSentCount(0);
    setTotalEmails(0);
    onOpen();

    const formData = new FormData();
    formData.append("file", csvFile);
    formData.append("subject", subject);
    formData.append("campaignName", campaignName);
    formData.append("body", htmlBody);
    formData.append("interval", interval);

    try {
      const response = await fetch("/api/handleMail", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send emails");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.trim());

        lines.forEach((line) => {
          try {
            const data = JSON.parse(line);
            if (data.type === "sent") {
              setLogMessages((prev) => [
                ...prev.slice(-100),
                {
                  type: "success",
                  message: `Email ${data.sentCount} to ${data.email} sent successfully`,
                  timestamp: data.timestamp,
                },
              ]);
              setSentCount(data.sentCount);
            } else if (data.type === "failed") {
              setLogMessages((prev) => [
                ...prev.slice(-100),
                {
                  type: "error",
                  message: `Failed to send email ${sentCount + 1} to ${data.email}: ${data.error}`,
                  timestamp: data.timestamp,
                },
              ]);
            } else if (data.type === "complete") {
              setLogMessages((prev) => [
                ...prev.slice(-100),
                {
                  type: "info",
                  message: `Campaign completed: ${data.sent} emails sent, ${data.failed} failed`,
                  timestamp: data.timestamp,
                },
              ]);
              setTotalEmails(data.sent + data.failed);
              if (data.sent > 0) {
                toast.success(
                  `${data.sent} emails sent successfully! Check MongoDB for campaign logs.`,
                  {
                    position: "top-right",
                    autoClose: 5000,
                  }
                );
              }
              if (data.failed > 0) {
                toast.warn(
                  `${data.failed} emails failed to send. Check MongoDB logs for details.`,
                  {
                    position: "top-right",
                    autoClose: 5000,
                  }
                );
              }
            }
          } catch (error) {
            console.error("Error parsing stream data:", error);
          }
        });
      }
    } catch (error) {
      console.error("Failed to send emails:", error);
      setLogMessages((prev) => [
        ...prev,
        {
          type: "error",
          message: `Error: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
      ]);
      toast.error(`Failed to send emails: ${error.message}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-5">
      {isSending || sentCount > 0 ? (
        <Card className="mt-6 border-slate-200">
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Campaign Status</h3>
            <p className="text-sm font-medium text-slate-700">
              Emails Sent: {sentCount}
              {totalEmails > 0 ? ` / ${totalEmails}` : ""}
            </p>
            {totalEmails > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-700">
                  Progress: {((sentCount / totalEmails) * 100).toFixed(1)}%
                </p>
                <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{
                      width: `${(sentCount / totalEmails) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-5">
        <Card className="overflow-hidden border-slate-200">
          <div className="bg-gradient-to-r from-blue-600 to-blue-600 h-1"></div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email List (CSV)
              </label>
              <div
                className="flex items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-blue-400 transition-colors bg-slate-50 group"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-100 transition-colors">
                  <Paperclip className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <div className="space-y-1 text-center">
                  <span className="text-sm font-medium text-slate-700">
                    {csvFile ? csvFile.name : "Click to upload CSV file"}
                  </span>
                  <p className="text-xs text-slate-500">
                    CSV with email, name columns
                  </p>
                </div>
              </div>
              <Input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setCsvFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            <div className="border-t border-slate-200 my-6"></div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Campaign Name
              </label>
              <Input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Email Subject
              </label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter a compelling subject line"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Email Body (HTML)
                </label>
                <span className="text-xs text-slate-500">
                  Supports full HTML & CSS
                </span>
              </div>
              <Textarea
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={15}
                placeholder="Paste complete HTML content including <style> here"
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Send Interval (ms)
              </label>
              <Input
                type="number"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                placeholder="e.g., 1000 for 1 email/sec"
              />
              <p className="text-xs text-slate-500">
                Recommended: 1000ms+ to avoid rate limiting
              </p>
            </div>

            <Button
              onPress={handleSubmit}
              disabled={isSending}
              className={`w-full py-6 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all ${isSending ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isSending ? "Sending Campaign..." : "Upload & Start Campaign"}
            </Button>
          </div>
        </Card>

        <LivePreview htmlBody={htmlBody} />
      </div>

      <ModalComponent
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        logMessages={logMessages}
        sentCount={sentCount}
        totalEmails={totalEmails}
        isSending={isSending}
        onClose={onOpenChange}
      />
    </div>
  );
};

export default ComposeComp;