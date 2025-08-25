import React, { useState, useRef, useEffect } from "react";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    const currentInput = input;

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentInput,
          sessionId: "webSession",
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        const aiMessage = { role: "ai", content: data.response };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || "No response received from agent");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(`Error communicating with the agent: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    inputRef.current?.focus();
  };

  const styles = {
    appContainer: {
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      fontFamily:
        "Poppins, sans-serif,arial",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      boxSizing: "border-box",
      width:'100vw'
    },

    animatedBg: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      zIndex: -1,
    },

    chatContainer: {
      maxWidth: "900px",
      width: "100%",
      height: "90vh",
      maxHeight: "800px",
      display: "flex",
      flexDirection: "column",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)",
      overflow: "hidden",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      position: "relative",
    },

    chatHeader: {
      background:
        "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      padding: "20px 30px",
      backdropFilter: "blur(10px)",
    },

    headerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    logoSection: {
      display: "flex",
      alignItems: "center",
      gap: "15px",
    },

    aiIcon: {
      position: "relative",
      fontSize: "32px",
      animation: "pulse 2s infinite",
    },

    headerTitle: {
      fontSize: "24px",
      fontWeight: "700",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      margin: 0,
    },

    headerSubtitle: {
      color: "#666",
      fontSize: "14px",
      margin: "2px 0 0 0",
    },

    clearBtn: {
      background: "rgba(255, 255, 255, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "12px",
      padding: "12px",
      cursor: "pointer",
      fontSize: "18px",
      transition: "all 0.3s ease",
    },

    messagesContainer: {
      flex: 1,
      overflowY: "auto",
      padding: "20px",
    },

    welcomeScreen: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      textAlign: "center",
      gap: "20px",
    },

    welcomeIcon: {
      fontSize: "60px",
      animation: "bounce 2s infinite",
    },

    welcomeTitle: {
      fontSize: "28px",
      color: "#333",
      margin: 0,
    },

    welcomeText: {
      color: "#666",
      fontSize: "16px",
      maxWidth: "500px",
      lineHeight: 1.5,
    },

    suggestionChips: {
      display: "flex",
      gap: "15px",
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: "20px",
    },

    chip: {
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "white",
      padding: "12px 20px",
      borderRadius: "25px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
      border: "none",
    },

    messagesList: {
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },

    message: {
      display: "flex",
      gap: "15px",
      animation: "slideIn 0.5s ease-out",
    },

    userMessage: {
      flexDirection: "row-reverse",
    },

    messageAvatar: {
      width: "40px",
      height: "40px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "white",
      flexShrink: 0,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    },

    userAvatar: {
      background: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
    },

    messageContent: {
      flex: 1,
      maxWidth: "70%",
    },

    messageBubble: {
      background: "white",
      padding: "16px 20px",
      borderRadius: "20px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(0, 0, 0, 0.05)",
      lineHeight: 1.5,
      wordWrap: "break-word",
      color: "#ab13c3ff",
    },

    userBubble: {
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      color: "white",
    },

    loadingBubble: {
      background: "#f8f9fa",
      width: "80px",
      padding: "20px",
    },

    typingIndicator: {
      display: "flex",
      gap: "4px",
      alignItems: "center",
      justifyContent: "center",
    },

    typingDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "#667eea",
      animation: "typing 1.4s ease-in-out infinite",
    },

    messageTime: {
      fontSize: "12px",
      color: "#999",
      marginTop: "5px",
      textAlign: "right",
    },

    userTime: {
      textAlign: "left",
    },

    inputContainer: {
      padding: "20px 30px 30px",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      background: "rgba(255, 255, 255, 0.05)",
    },

    errorMessage: {
      background: "linear-gradient(135deg, #ff6b6b, #ff5252)",
      color: "white",
      padding: "12px 16px",
      borderRadius: "12px",
      marginBottom: "15px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },

    errorClose: {
      background: "none",
      border: "none",
      color: "white",
      cursor: "pointer",
      fontSize: "16px",
      padding: "0 5px",
    },

    inputWrapper: {
      display: "flex",
      gap: "15px",
      alignItems: "end",
    },

    messageInput: {
      flex: 1,
      background: "white",
      border: "2px solid transparent",
      borderRadius: "20px",
      padding: "16px 20px",
      fontSize: "16px",
      fontFamily: "inherit",
      resize: "none",
      maxHeight: "120px",
      minHeight: "24px",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      outline: "none",
      color: "#333",
    },

    messageInputFocused: {
      borderColor: "#667eea",
      boxShadow: "0 4px 20px rgba(102, 126, 234, 0.2)",
    },

    messageInputDisabled: {
      background: "#f5f5f5",
      opacity: 0.7,
    },

    sendButton: {
      width: "50px",
      height: "50px",
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      border: "none",
      borderRadius: "50%",
      color: "white",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 15px rgba(102, 126, 234, 0.3)",
    },

    sendButtonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },

    spinner: {
      width: "20px",
      height: "20px",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderTop: "2px solid white",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    },
  };

  // Add CSS animations
  const cssAnimations = `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      60% { transform: translateY(-5px); }
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes typing {
      0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
      30% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4) !important;
    }
    
    .clear-btn:hover {
      background: rgba(255, 255, 255, 0.3) !important;
      transform: scale(1.05);
    }
    
    .send-button:hover:not(:disabled) {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
    }
    
    .messages-container::-webkit-scrollbar {
      width: 6px;
    }
    
    .messages-container::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .messages-container::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
    
    .messages-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.3);
    }
    
    /* Floating orbs */
    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      animation: float 20s ease-in-out infinite;
    }
    
    .orb-1 {
      width: 300px;
      height: 300px;
      background: linear-gradient(45deg, #ff6b6b, #ffd93d);
      top: -150px;
      right: -150px;
      animation-delay: 0s;
    }
    
    .orb-2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(45deg, #6c5ce7, #74b9ff);
      bottom: -200px;
      left: -200px;
      animation-delay: -7s;
    }
    
    .orb-3 {
      width: 250px;
      height: 250px;
      background: linear-gradient(45deg, #fd79a8, #fdcb6e);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation-delay: -14s;
    }
    
    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(30px, -30px) rotate(90deg); }
      50% { transform: translate(-20px, 20px) rotate(180deg); }
      75% { transform: translate(-30px, -10px) rotate(270deg); }
    }
    
    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .app-container {
        padding: 10px !important;
      }
      
      .chat-container {
        height: 95vh !important;
        border-radius: 16px !important;
      }
      
      .suggestion-chips {
        flex-direction: column !important;
        align-items: center !important;
      }
      
      .chip {
        width: 100% !important;
        max-width: 280px !important;
        text-align: center !important;
      }
      
      .message-content {
        max-width: 85% !important;
      }
    }
  `;

  useEffect(() => {
    // Inject CSS animations
    const style = document.createElement("style");
    style.textContent = cssAnimations;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div style={styles.appContainer} className="app-container">
      {/* Animated background */}
      <div style={styles.animatedBg}>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div style={styles.chatContainer} className="chat-container">
        {/* Header */}
        <div style={styles.chatHeader}>
          <div style={styles.headerContent}>
            <div style={styles.logoSection}>
              <div style={styles.aiIcon}>🤖</div>
              <div>
                <h1 style={styles.headerTitle}>Lumina AI</h1>
                <p style={styles.headerSubtitle}>Your Intelligent Assistant</p>
              </div>
            </div>
            <button
              style={styles.clearBtn}
              className="clear-btn"
              onClick={clearChat}
              title="Clear Chat"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={styles.messagesContainer} className="messages-container">
          {messages.length === 0 ? (
            <div style={styles.welcomeScreen}>
              <div style={styles.welcomeIcon}>✨</div>
              <h2 style={styles.welcomeTitle}>Welcome to Lumina AI</h2>
              <p style={styles.welcomeText}>
                I can help you with weather, calculations, web searches, and
                answer questions on any topic!
              </p>
              <div style={styles.suggestionChips} className="suggestion-chips">
                <button
                  style={styles.chip}
                  className="chip"
                  onClick={() => setInput("What is JavaScript?")}
                >
                  💻 What is JavaScript?
                </button>
                <button
                  style={styles.chip}
                  className="chip"
                  onClick={() => setInput("What's the weather in New York?")}
                >
                  🌤️ Weather in NYC
                </button>
                <button
                  style={styles.chip}
                  className="chip"
                  onClick={() => setInput("Calculate 15 * 23")}
                >
                  🔢 Calculate 15 × 23
                </button>
              </div>
            </div>
          ) : (
            <div style={styles.messagesList}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.message,
                    ...(msg.role === "user" ? styles.userMessage : {}),
                  }}
                >
                  <div
                    style={{
                      ...styles.messageAvatar,
                      ...(msg.role === "user" ? styles.userAvatar : {}),
                    }}
                  >
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div style={styles.messageContent}>
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...(msg.role === "user" ? styles.userBubble : {}),
                      }}
                    >
                      {msg.content}
                    </div>
                    <div
                      style={{
                        ...styles.messageTime,
                        ...(msg.role === "user" ? styles.userTime : {}),
                      }}
                    >
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={styles.message}>
                  <div style={styles.messageAvatar}>🤖</div>
                  <div style={styles.messageContent}>
                    <div
                      style={{
                        ...styles.messageBubble,
                        ...styles.loadingBubble,
                      }}
                    >
                      <div style={styles.typingIndicator}>
                        <span
                          style={{ ...styles.typingDot, animationDelay: "0s" }}
                        ></span>
                        <span
                          style={{
                            ...styles.typingDot,
                            animationDelay: "0.2s",
                          }}
                        ></span>
                        <span
                          style={{
                            ...styles.typingDot,
                            animationDelay: "0.4s",
                          }}
                        ></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div style={styles.inputContainer}>
          {error && (
            <div style={styles.errorMessage}>
              <span>⚠️ {error}</span>
              <button style={styles.errorClose} onClick={() => setError(null)}>
                ✕
              </button>
            </div>
          )}

          <div style={styles.inputWrapper}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              placeholder="Type your message here... (Press Enter to send)"
              rows="1"
              style={{
                ...styles.messageInput,
                ...(isLoading ? styles.messageInputDisabled : {}),
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                ...styles.sendButton,
                ...(isLoading || !input.trim()
                  ? styles.sendButtonDisabled
                  : {}),
              }}
              className="send-button"
            >
              {isLoading ? (
                <div style={styles.spinner}></div>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="20"
                  height="20"
                >
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
