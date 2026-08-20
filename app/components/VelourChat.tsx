"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const VELOUR_SUGGESTIONS = [
  "How do I customize my storefront theme?",
  "How do order receipts and tracking work?",
  "How do I connect Stripe or test checkout?",
  "What is the Juniper Studio showcase?",
];

export default function VelourChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to Velour. ✦ I am your studio concierge. How may I assist you with your storefront, themes, or store setup today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      textareaRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await res.json();
      const reply =
        data.response ||
        "Velour Concierge is ready to assist. Please feel free to ask any question about setting up your artisanal storefront.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Connection notice. Please refresh or explore your store dashboard directly.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Concierge Window */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "68px",
            right: "0",
            width: "370px",
            maxWidth: "calc(100vw - 32px)",
            height: "510px",
            maxHeight: "calc(100vh - 110px)",
            background: "#fffcf4",
            border: "1px solid #e2ded4",
            borderRadius: "14px",
            boxShadow:
              "0 20px 50px rgba(23, 55, 46, 0.12), 0 4px 12px rgba(0,0,0,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              background: "#17372e",
              color: "#fffcf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#d9825a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fffcf4",
                  fontSize: "14px",
                }}
              >
                ✦
              </div>
              <div>
                <div
                  style={{
                    fontWeight: "500",
                    fontSize: "14px",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Velour Concierge
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#a9b8b0",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#78c288",
                    }}
                  />
                  Artisan Studio Assistant
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#a9b8b0",
                cursor: "pointer",
                fontSize: "18px",
                padding: "4px",
                lineHeight: 1,
              }}
              aria-label="Close concierge"
            >
              ✕
            </button>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "#fbf9f2",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "86%",
                  background: m.role === "user" ? "#17372e" : "#fff",
                  color: m.role === "user" ? "#fffcf4" : "#17372e",
                  padding: "10px 14px",
                  borderRadius:
                    m.role === "user"
                      ? "14px 14px 2px 14px"
                      : "14px 14px 14px 2px",
                  fontSize: "13.5px",
                  lineHeight: 1.5,
                  border: m.role === "assistant" ? "1px solid #eae6dc" : "none",
                  wordBreak: "break-word",
                  boxShadow:
                    m.role === "assistant"
                      ? "0 2px 6px rgba(23,55,46,0.03)"
                      : "none",
                }}
              >
                {m.content}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "#fff",
                  color: "#6e7c73",
                  padding: "8px 14px",
                  borderRadius: "14px 14px 14px 2px",
                  fontSize: "13px",
                  border: "1px solid #eae6dc",
                }}
              >
                Refining thoughts...
              </div>
            )}

            {/* Quick Suggestions (if 1 message) */}
            {messages.length === 1 && !isLoading && (
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    color: "#8a978c",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  Curated Topics
                </div>
                {VELOUR_SUGGESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    style={{
                      textAlign: "left",
                      background: "#fff",
                      border: "1px solid #e2ded4",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      color: "#17372e",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#17372e";
                      e.currentTarget.style.background = "#f4f1e8";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e2ded4";
                      e.currentTarget.style.background = "#fff";
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Row */}
          <div
            style={{
              padding: "12px",
              borderTop: "1px solid #e2ded4",
              background: "#fffcf4",
              display: "flex",
              gap: "8px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Inquire with Velour..."
              rows={1}
              style={{
                flex: 1,
                background: "#f7f5ed",
                border: "1px solid #dcd7cb",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#17372e",
                fontSize: "13px",
                outline: "none",
                resize: "none",
                maxHeight: "80px",
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={{
                background: "#17372e",
                border: "none",
                borderRadius: "8px",
                width: "36px",
                height: "36px",
                cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                opacity: !input.trim() || isLoading ? 0.4 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fffcf4",
                flexShrink: 0,
              }}
              aria-label="Send message"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Concierge Bubble */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: "54px",
          height: "54px",
          borderRadius: "50%",
          background: "#17372e",
          border: "1px solid #2d554a",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(23, 55, 46, 0.25)",
          color: "#fffcf4",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.06)";
          e.currentTarget.style.boxShadow = "0 12px 30px rgba(23, 55, 46, 0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 8px 24px rgba(23, 55, 46, 0.25)";
        }}
        aria-label="Toggle Velour Concierge"
      >
        {isOpen ? (
          <span style={{ fontSize: "16px" }}>✕</span>
        ) : (
          <span style={{ fontSize: "20px" }}>✦</span>
        )}
      </button>
    </div>
  );
}
