import express from "express";
import cors from "cors";
import { HumanMessage, isAIMessage } from "@langchain/core/messages";
import { agent, testAgent, testSimpleModel } from "./agent.js";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({ origin: "*" }));

// Helper function to extract text from message content
function extractTextContent(content) {
  if (!content) return "";
  
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        if (typeof c === 'string') return c;
        if (c.text) return c.text;
        if (c.content) return c.content;
        return c.toString();
      })
      .join("\n")
      .trim();
  }
  
  return content.toString().trim();
}

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "LangGraph Gemini Agent Server",
    endpoints: {
      "POST /generate": "Generate AI response",
      "GET /health": "Health check",
      "GET /test": "Run agent tests"
    }
  });
});

//generate AI response endpoint
app.post("/generate", async (req, res) => {
  try {
    const { question, sessionId = "default", history = [] } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        error: "Question is required",
        success: false 
      });
    }

    console.log(`\n🧑 Question: "${question}"`);
    console.log(`📝 Session: ${sessionId}`);

    // Build messages array from history + current question
    const messages = [];
    
    // Add history messages if provided
    if (history && history.length > 0) {
      for (const msg of history) {
        if (msg.role === 'user') {
          messages.push(new HumanMessage(msg.content));
        }
        // Note: AI messages from history are handled by the checkpoint system
      }
    }
    
    // Add current question
    messages.push(new HumanMessage(question));

      const result = await agent.invoke(
      { messages }, // First parameter: the input
      {             // Second parameter: the configuration
        configurable: { 
          thread_id: sessionId || "default" 
        }
      }
    );

    console.log(`📊 Total messages in response: ${result.messages.length}`);

    // Find the final AI message
    const finalMessage = result.messages.filter((m) => isAIMessage(m)).pop();

    if (finalMessage) {
      const textOutput = extractTextContent(finalMessage.content);
      
      console.log(`🤖 Response: ${textOutput.substring(0, 100)}${textOutput.length > 100 ? '...' : ''}`);
      
      if (!textOutput) {
        console.warn("⚠️ Empty response content");
        return res.status(500).json({
          error: "Empty response from AI",
          success: false,
          debug: {
            messageType: finalMessage.constructor.name,
            contentType: typeof finalMessage.content,
            hasContent: !!finalMessage.content
          }
        });
      }

      res.json({ 
        response: textOutput,
        success: true,
        sessionId: sessionId,
        messageCount: result.messages.length
      });

    } else {
      console.error("❌ No AI response found");
      console.error("Available messages:", result.messages.map(m => ({
        type: m.constructor.name,
        hasContent: !!m.content,
        contentPreview: typeof m.content === 'string' 
          ? m.content.substring(0, 50) 
          : JSON.stringify(m.content).substring(0, 50)
      })));
      
      res.status(404).json({ 
        error: "No AI response found",
        success: false,
        debug: {
          totalMessages: result.messages.length,
          messageTypes: result.messages.map(m => m.constructor.name)
        }
      });
    }

  } catch (error) {
    console.error("❌ Error in /generate:", error.message);
    console.error("Error stack:", error.stack);
    
    // Check for specific API errors
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.message.includes('API key')) {
      errorMessage = "Invalid API key configuration";
      statusCode = 401;
    } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
      errorMessage = "API quota exceeded or rate limited";
      statusCode = 429;
    } else if (error.message.includes('model')) {
      errorMessage = "Model not available or invalid";
      statusCode = 400;
    }
    
    res.status(statusCode).json({ 
      error: errorMessage,
      success: false,
      type: error.constructor.name,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        originalError: error.message 
      })
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasApiKey: !!process.env.GOOGLE_API_KEY
  });
});

// Test endpoint for debugging
app.get("/test", async (req, res) => {
  try {
    console.log("\n🧪 Running tests via API endpoint...");
    
    // Test 1: Simple model
    const simpleTest = await testSimpleModel();
    if (!simpleTest) {
      return res.status(500).json({
        error: "Simple model test failed",
        success: false,
        recommendation: "Check your API key and model availability"
      });
    }

    // Test 2: Agent test
    await testAgent();
    
    res.json({
      message: "Tests completed - check server console for detailed results",
      success: true,
      simpleModelWorks: simpleTest
    });

  } catch (error) {
    console.error("❌ Test endpoint error:", error);
    res.status(500).json({
      error: "Test failed",
      message: error.message,
      success: false
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    error: "Internal server error",
    success: false
  });
});

// Start server
app.listen(port, () => {
  console.log(`\n🚀 Server running on port ${port}`);
  //console.log(`📍 Health check: http://localhost:${port}/health`);
  //console.log(`🧪 Test endpoint: http://localhost:${port}/test`);
  console.log(`🔑 API Key configured: ${!!process.env.GOOGLE_API_KEY}`);
  
  // Auto-run tests in development
  // if (process.env.NODE_ENV !== 'production') {
  //   console.log("\n🔧 Development mode - running initial tests...");
  //   setTimeout(() => {
  //     testSimpleModel().then((works) => {
  //       if (works) {
  //         console.log("✅ Initial API test passed");
  //       } else {
  //         console.log("❌ Initial API test failed - check your configuration");
  //       }
  //     });
  //   }, 1000);
  // }
});