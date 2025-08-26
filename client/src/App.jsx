import React, { useState, useRef, useEffect } from "react";
import {FaTrash, FaCode, FaCopy, FaPlay} from 'react-icons/fa';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Agent Output Parser Class
  class AgentOutputParser {
    static parseMarkdown(text) {
      // Handle bold italic first (***text***)
      text = text.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
      // Handle bold (**text**)
      text = text.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
      // Handle italic (*text*)
      text = text.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
      // Handle code blocks with language detection
      text = text.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text';
        const codeId = 'code-' + Math.random().toString(36).substring(2, 11);
        return `<div class="code-block-container" data-language="${language}" data-code-id="${codeId}">
                  <div class="code-header">
                    <span class="code-language">${language}</span>
                    <div class="code-actions">
                      <button class="code-btn copy-btn" onclick="copyCode('${codeId}')" title="Copy Code">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 2h-4.18C14.4.84 13.3 0 12 0c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"/>
                        </svg>
                        Copy
                      </button>
                      ${this.isExecutableLanguage(language) ? `
                        <button class="code-btn run-btn" onclick="executeCode('${codeId}', '${language}')" title="Run Code">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5.14v14l11-7-11-7z"/>
                          </svg>
                          Run
                        </button>
                      ` : ''}
                    </div>
                  </div>
                  <pre class="code-content" id="${codeId}"><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>
                </div>`;
      });
      
      // Handle inline code
      text = text.replace(/`([^`]+?)`/g, '<code class="inline-code">$1</code>');
      
      // Handle line breaks and paragraphs
      text = text.replace(/\n\n/g, '</p><p>');
      text = text.replace(/\n/g, '<br>');
      
      return `<div class="parsed-content"><p>${text}</p></div>`;
    }

    static structuredParse(text) {
      // Split by main headings (**text**)
      const sections = text.split(/(?=\*\*[^*]+?\*\*)/);
      let html = '<div class="structured-content">';
      
      sections.forEach((section, index) => {
        if (!section.trim()) return;
        
        const headingMatch = section.match(/^\*\*([^*]+?)\*\*:?\s*([\s\S]*)/);
        if (headingMatch) {
          const heading = headingMatch[1];
          const content = headingMatch[2];
          
          html += `<div class="section" key="${index}">
                    <h3 class="section-heading">${heading}</h3>`;
          
          // Parse subsections (***text***)
          const subsections = content.split(/(?=\*\*\*[^*]+?\*\*\*)/);
          subsections.forEach((sub, subIndex) => {
            if (!sub.trim()) return;
            
            const subMatch = sub.match(/^\*\*\*([^*]+?)\*\*\*:?\s*([\s\S]*)/);
            if (subMatch) {
              const subHeading = subMatch[1];
              const subContent = subMatch[2];
              html += `<div class="subsection" key="${subIndex}">
                        <h4 class="subsection-heading">${subHeading}:</h4>
                        <div class="subsection-content">${this.parseMarkdown(subContent)}</div>
                      </div>`;
            } else {
              html += `<div class="content-block">${this.parseMarkdown(sub)}</div>`;
            }
          });
          
          html += '</div>';
        } else {
          html += `<div class="content-block">${this.parseMarkdown(section)}</div>`;
        }
      });
      
      html += '</div>';
      return html;
    }

    static detectContentType(text) {
      // Check for code blocks
      if (/```[\s\S]*?```/.test(text)) {
        return 'code';
      }
      
      // Check for structured markdown (sections with ** and ***)
      if (/\*\*[^*]+?\*\*[\s\S]*?\*\*\*[^*]+?\*\*\*/.test(text)) {
        return 'structured';
      }
      
      // Check for simple markdown
      if (/\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`/.test(text)) {
        return 'markdown';
      }
      
      return 'plain';
    }

    static isExecutableLanguage(language) {
      const executableLanguages = ['javascript', 'js', 'python', 'py', 'html', 'css'];
      return executableLanguages.includes(language.toLowerCase());
    }

    static escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    static parse(text) {
      const contentType = this.detectContentType(text);
      
      switch (contentType) {
        case 'structured':
          return this.structuredParse(text);
        case 'code':
        case 'markdown':
          return this.parseMarkdown(text);
        default:
          return `<div class="plain-content">${text}</div>`;
      }
    }
  }

  // Memoized Message Component
  const MessageBubble = React.memo(({ content, role }) => {
    const parsedContent = React.useMemo(() => {
      if (role === 'ai') {
        return AgentOutputParser.parse(content);
      }
      return content;
    }, [content, role]);

    // Setup code actions only once
    React.useEffect(() => {
      if (!window.codeActionsInitialized) {
        window.codeActionsInitialized = true;
        
        window.copyCode = (codeId) => {
          const codeElement = document.getElementById(codeId);
          if (codeElement) {
            const text = codeElement.textContent;
            navigator.clipboard.writeText(text).then(() => {
              const copyBtn = document.querySelector(`[onclick="copyCode('${codeId}')"]`);
              if (copyBtn) {
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span style="color: #10b981;">✓</span>';
                setTimeout(() => {
                  copyBtn.innerHTML = originalHTML;
                }, 1500);
              }
            });
          }
        };

        window.executeCode = (codeId, language) => {
          const codeElement = document.getElementById(codeId);
          if (codeElement) {
            const code = codeElement.textContent;
            executeCodeFunction(code, language);
          }
        };
      }
    }, []);

    const executeCodeFunction = (code, language) => {
      try {
        switch (language.toLowerCase()) {
          case 'javascript':
          case 'js':
            // Create a safe execution environment
            const result = eval(code);
            addExecutionResult(code, result, language);
            break;
          case 'python':
          case 'py':
            // For Python, you'd need to integrate with a Python interpreter
            // This is a placeholder
            addExecutionResult(code, 'Python execution requires backend integration', language);
            break;
          case 'html':
            // Open HTML in new window/iframe
            const htmlWindow = window.open();
            htmlWindow.document.body.innerHTML = code;
            break;
          default:
            addExecutionResult(code, `Execution not supported for ${language}`, language);
        }
      } catch (error) {
        addExecutionResult(code, `Error: ${error.message}`, language);
      }
    };

    const addExecutionResult = (code, result, language) => {
      const executionMessage = {
        role: 'system',
        content: `**Code Execution Result (${language}):**\n\`\`\`\n${result}\n\`\`\``,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, executionMessage]);
    };

    if (role === 'ai') {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: parsedContent }}
          style={{
            ...styles.messageBubble,
            color: '#333'
          }}
        />
      );
    }

    return (
      <div style={{ ...styles.messageBubble, ...styles.userBubble }}>
        {content}
      </div>
    );
  });

  // Debounce scroll to prevent excessive updates
  const scrollToBottom = React.useCallback(() => {
    if (messagesEndRef.current) {
      const messageContainer = messagesEndRef.current.parentElement;
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }
  }, []);

  // Only scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages, scrollToBottom]);

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
        const aiMessage = { 
          role: "ai", 
          content: data.response,
          timestamp: new Date().toISOString()
        };
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
      fontFamily: "Poppins, sans-serif,arial",
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
      maxWidth: "1200px",
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
      background: "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
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
      color: "red",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    messagesContainer: {
      flex: 1,
      overflowY: "auto",
      padding: "20px",
      willChange: "transform",
      transform: "translateZ(0)",
      backfaceVisibility: "hidden",
      WebkitOverflowScrolling: "touch",
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
      willChange: "transform",
      transform: "translateZ(0)",
      position: "relative",
      paddingBottom: "10px",
    },

    message: {
      display: "flex",
      gap: "15px",
      position: "relative",
      willChange: "transform",
      transform: "translateZ(0)",
      "&:last-child": {
        animation: "slideIn 0.3s ease-out",
      },
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
      animation: "pulse 2s infinite",
    },

    userAvatar: {
      background: "linear-gradient(135deg, #ff6b6b, #ffd93d)",
    },

    messageContent: {
      flex: 1,
      maxWidth: "80%",
    },

    messageBubble: {
      background: "white",
      padding: "16px 20px",
      borderRadius: "20px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      border: "1px solid rgba(0, 0, 0, 0.05)",
      lineHeight: 1.6,
      wordWrap: "break-word",
      color: "#333",
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
      alignItems: "center", // Change from end to center
      position: "relative", // Add position relative
      minHeight: "65px", // Match send button height to prevent container shifts
    },

    messageInput: {
      width: "100%",
      background: "white",
      border: "2px solid transparent",
      borderRadius: "20px",
      padding: "16px 20px",
      fontSize: "16px",
      fontFamily: "inherit",
      resize: "none",
      height: "44px", // Fixed height to prevent container jerking
      maxHeight: "250px",
      overflowY: "auto",
      transition: "all 0.3s ease",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      outline: "none",
      color: "#333",
      "&::-webkit-scrollbar": {
        width: "8px",
        backgroundColor: "#f1f5f9",
        borderRadius: "8px"
      },
      "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#c7d2fe",
        borderRadius: "8px"
      },
      "&::-webkit-scrollbar-thumb:hover": {
        backgroundColor: "#667eea"
      },
      scrollbarWidth: "thin",
      scrollbarColor: "#c7d2fe #f1f5f9",
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
      width: "65px",
      height: "65px",
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

  // CSS Animations and Styles
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
        transform: translate3d(0, 10px, 0);
      }
      to {
        opacity: 1;
        transform: translate3d(0, 0, 0);
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
  
    /* Enhanced Code Block Styles */
    .code-block-container {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
    }

    .code-header {
      background: #f3f4f6 !important;
      padding: 8px 12px !important;
      border-bottom: 1px solid #e5e7eb !important;
    }

    .code-language {
      font-size: 0.8rem !important;
      color: #374151 !important;
      font-weight: 600 !important;
      letter-spacing: 0.025em !important;
    }

    .code-btn {
      background: #ffffff !important;
      border: 1px solid #d1d5db !important;
      padding: 4px 12px !important;
      height: 30px !important;
      font-size: 0.8rem !important;
      font-weight: 500 !important;
      color: #4b5563 !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
      display: inline-flex !important;
      align-items: center !important;
      gap: 6px !important;
      min-width: 70px !important;
      justify-content: center !important;
    }

    .code-btn svg {
      width: 14px !important;
      height: 14px !important;
      flex-shrink: 0 !important;
    }

    .code-btn:hover {
      background: #f9fafb !important;
      border-color: #9ca3af !important;
      color: #1f2937 !important;
    }

    .copy-btn:hover {
      background: #eff6ff !important;
      border-color: #2563eb !important;
      color: #2563eb !important;
      box-shadow: 0 1px 3px rgba(37, 99, 235, 0.1) !important;
    }

    .run-btn:hover {
      background: #ecfdf5 !important;
      border-color: #059669 !important;
      color: #059669 !important;
      box-shadow: 0 1px 3px rgba(5, 150, 105, 0.1) !important;
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

      .code-header {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }

      .code-actions {
        width: 100%;
        justify-content: flex-end;
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
                <p style={styles.headerSubtitle}>Your Intelligent Assistant with Code Execution</p>
              </div>
            </div>
            <button
              style={styles.clearBtn}
              className="clear-btn"
              onClick={clearChat}
              title="Clear Chat"
            >
              <FaTrash/> Clear
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
                I can help you with code execution, calculations, web searches, and
                answer questions on any topic with properly formatted responses!
              </p>
              <div style={styles.suggestionChips} className="suggestion-chips">
                <button
                  style={styles.chip}
                  className="chip"
                  onClick={() => setInput("Write a Python function to calculate fibonacci numbers")}
                >
                  🐍 Python Fibonacci
                </button>
                <button
                  style={styles.chip}
                  className="chip"
                  onClick={() => setInput("Create a JavaScript function to sort an array")}
                >
                  💻 JavaScript Sort
                </button>
                <button
                  style={styles.chip}
                  className="chip"
                  onClick={() => setInput("Explain the benefits of learning Go programming language")}
                >
                  🔍 Go Language Benefits
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
                      ...(msg.role === "system" ? { background: "linear-gradient(135deg, #10b981, #34d399)" } : {})
                    }}
                  >
                    {msg.role === "user" ? "👤" : msg.role === "system" ? "⚡" : "🤖"}
                  </div>
                  <div style={styles.messageContent}>
                    <MessageBubble content={msg.content} role={msg.role} />
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
              placeholder="Ask me anything... I can parse markdown, execute code, and format responses beautifully! (Press Enter to send)"
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
