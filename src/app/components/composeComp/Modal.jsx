"use client";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertCircle } from "lucide-react";

export default function ModalComponent({
  isOpen,
  onOpenChange,
  logMessages,
  sentCount,
  totalEmails,
  isSending,
  onClose,
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} className="max-w-2xl">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Campaign Progress
            </ModalHeader>
            <ModalBody>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logMessages.length === 0 && (
                  <p className="text-sm text-slate-500">Starting campaign...</p>
                )}
                {logMessages.map((log, index) => (
                  <p
                    key={index}
                    className={`text-sm ${
                      log.type === "success"
                        ? "text-green-600"
                        : log.type === "error"
                        ? "text-red-600"
                        : "text-blue-600"
                    }`}
                  >
                    {log.type === "error" && (
                      <AlertCircle className="inline w-4 h-4 mr-1" />
                    )}
                    {log.message}{" "}
                    <span className="text-xs text-slate-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                  </p>
                ))}
              </div>
              {sentCount > 0 && totalEmails > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-slate-700">
                    Progress: {sentCount}/{totalEmails} emails sent (
                    {((sentCount / totalEmails) * 100).toFixed(1)}%)
                  </p>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${(sentCount / totalEmails) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                variant="light"
                onPress={onClose}
                disabled={isSending}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}