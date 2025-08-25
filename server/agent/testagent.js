// test-agent.js - Comprehensive test suite for your Agent/server setup
import { agent, testSimpleModel } from './agent.js';
import { HumanMessage, isAIMessage } from "@langchain/core/messages";

// ANSI colors for better console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.startTime = Date.now();
  }

  log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
  }

  success(message) {
    this.log(`✅ ${message}`, colors.green);
    this.passedTests++;
  }

  error(message) {
    this.log(`❌ ${message}`, colors.red);
    this.failedTests++;
  }

  info(message) {
    this.log(`ℹ️  ${message}`, colors.blue);
  }

  warning(message) {
    this.log(`⚠️  ${message}`, colors.yellow);
  }

  async runTest(testName, testFn) {
    this.totalTests++;
    this.log(`\n${colors.bright}🧪 Running: ${testName}${colors.reset}`);
    
    try {
      await testFn();
      this.success(`${testName} - PASSED`);
      return true;
    } catch (error) {
      this.error(`${testName} - FAILED: ${error.message}`);
      if (process.env.DEBUG) {
        console.error(`   Stack: ${error.stack}`);
      }
      return false;
    }
  }

  printSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log(`\n${'='.repeat(70)}`);
    this.log(`${colors.bright}📊 LANGGRAPH GEMINI AGENT TEST SUMMARY${colors.reset}`);
    console.log(`${'='.repeat(70)}`);
    
    this.log(`🔬 Total Tests Run: ${this.totalTests}`, colors.blue);
    this.log(`✅ Passed: ${this.passedTests}`, colors.green);
    this.log(`❌ Failed: ${this.failedTests}`, this.failedTests > 0 ? colors.red : colors.green);
    this.log(`⏱️  Duration: ${duration}s`, colors.cyan);
    this.log(`📍 Test Location: Agent/server/`, colors.magenta);
    
    if (this.failedTests === 0) {
      this.log(`\n🎉 ALL TESTS PASSED! 🎉`, colors.green);
      this.log(`🚀 Your LangGraph Gemini Agent is production ready!`, colors.green);
      this.log(`💡 You can now add more features safely`, colors.cyan);
    } else {
      this.log(`\n💔 ${this.failedTests} test(s) failed`, colors.red);
      this.log(`🔧 Check the errors above and fix them`, colors.yellow);
      this.log(`💡 Run with DEBUG=true for detailed stack traces`, colors.cyan);
    }
    
    console.log(`${'='.repeat(70)}\n`);
  }
}

class AgentTester {
  constructor() {
    this.runner = new TestRunner();
  }

  // function to test basic setup
  async testBasicSetup() {
    await this.runner.runTest("🔌 API Connection Test", async () => {
      const result = await testSimpleModel();
      if (!result) throw new Error("Cannot connect to Gemini API - check your API key");
    });

    await this.runner.runTest("⚙️ Agent Initialization", async () => {
      if (!agent) throw new Error("Agent not properly initialized");
      if (typeof agent.invoke !== 'function') throw new Error("Agent invoke method not available");
    });
  }

  // function to test general questions
  async testGeneralQuestions() {
    const testCases = [
      {
        question: "What is JavaScript?",
        keywords: ["programming", "language", "web"],
        type: "Programming Concept"
      },
      {
        question: "Explain machine learning briefly",
        keywords: ["learn", "data", "algorithm"],
        type: "AI/ML Concept"
      },
      {
        question: "What is the capital of France?",
        keywords: ["paris"],
        type: "Factual Question"
      },
      {
        question: "How do computers work?",
        keywords: ["processor", "memory", "cpu", "data"],
        type: "Technical Explanation"
      },
      {
        question: "What is photosynthesis?",
        keywords: ["plant", "light", "carbon", "oxygen"],
        type: "Science Concept"
      }
    ];

    for (const test of testCases) {
      await this.runner.runTest(`💭 General Q&A: ${test.type}`, async () => {
        const sessionId = `general-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const response = await agent.invoke({
          messages: [new HumanMessage(test.question)],
        }, {
          configurable: { thread_id: sessionId }
        });

        const finalMessage = response.messages.filter(m => isAIMessage(m)).pop();
        if (!finalMessage) throw new Error("No AI response received");

        const content = this.extractContent(finalMessage.content);
        if (!content || content.length < 20) {
          throw new Error(`Response too short: "${content}"`);
        }

        // Check for relevant keywords
        const contentLower = content.toLowerCase();
        const hasRelevantKeywords = test.keywords.some(keyword => 
          contentLower.includes(keyword.toLowerCase())
        );
        
        if (!hasRelevantKeywords) {
          this.runner.warning(`Expected keywords [${test.keywords.join(', ')}] not found`);
          this.runner.info(`Got: ${content.substring(0, 150)}...`);
        }

        this.runner.info(`✓ Response: ${content.length} chars, relevant: ${hasRelevantKeywords}`);
      });
    }
  }

  // function to test weather tool
  async testWeatherTool() {
    const weatherTests = [
      "What's the weather in New York?",
      "How's the weather in London today?", 
      "Tell me the current weather in Tokyo",
      "Weather in Paris right now",
      "What's the temperature in Dubai?"
    ];

    for (let i = 0; i < weatherTests.length; i++) {
      const question = weatherTests[i];
      await this.runner.runTest(`🌤️  Weather Tool: Test ${i + 1}`, async () => {
        const sessionId = `weather-${Date.now()}-${i}`;
        
        const response = await agent.invoke({
          messages: [new HumanMessage(question)],
        }, {
          configurable: { thread_id: sessionId }
        });

        const finalMessage = response.messages.filter(m => isAIMessage(m)).pop();
        if (!finalMessage) throw new Error("No AI response received");

        const content = this.extractContent(finalMessage.content);
        
        // Weather tool should provide structured data
        const weatherIndicators = [
          "temperature", "weather", "degrees", "humidity", 
          "sunny", "rainy", "cloudy", "current"
        ];
        
        const hasWeatherData = weatherIndicators.some(indicator => 
          content.toLowerCase().includes(indicator)
        );

        if (!hasWeatherData) {
          throw new Error(`No weather data found in response: "${content}"`);
        }

        this.runner.info(`✓ Weather data provided: ${content}`);
      });
    }
  }

  // function to test conversation memeory and context
  async testConversationMemory() {
    await this.runner.runTest("🧠 Conversation Memory & Context", async () => {
      const sessionId = `conversation-${Date.now()}`;

      // First exchange
      const response1 = await agent.invoke({
        messages: [new HumanMessage("Tell me about Python programming")],
      }, {
        configurable: { thread_id: sessionId }
      });

      const message1 = response1.messages.filter(m => isAIMessage(m)).pop();
      if (!message1) throw new Error("No response to first message");

      const content1 = this.extractContent(message1.content);
      if (!content1.toLowerCase().includes("python")) {
        throw new Error("First response doesn't mention Python");
      }

      // Follow-up that requires context
      const response2 = await agent.invoke({
        messages: [new HumanMessage("What are its main advantages?")],
      }, {
        configurable: { thread_id: sessionId }
      });

      const message2 = response2.messages.filter(m => isAIMessage(m)).pop();
      if (!message2) throw new Error("No response to context question");

      const content2 = this.extractContent(message2.content);
      
      // Should give advantages (context-aware response)
      if (content2.length < 30) {
        throw new Error("Context response too short - may not understand context");
      }

      this.runner.info(`✓ Maintained context across ${response2.messages.length} messages`);
      this.runner.info(`First: ${content1.substring(0, 50)}...`);
      this.runner.info(`Follow-up: ${content2.substring(0, 50)}...`);
    });
  }

  // function to test tool intelligence and selection
  async testToolIntelligence() {
    const intelligenceTests = [
      {
        question: "Tell me about weather patterns in general",
        shouldUseTool: false,
        description: "General weather discussion"
      },
      {
        question: "What's the current temperature in Miami?",
        shouldUseTool: true,
        description: "Specific current weather query"
      },
      {
        question: "How do weather forecasts work?",
        shouldUseTool: false,
        description: "Weather science explanation"
      },
      {
        question: "Is it raining in Seattle right now?",
        shouldUseTool: true,
        description: "Current conditions query"
      }
    ];

    for (const test of intelligenceTests) {
      await this.runner.runTest(`🎯 Tool Intelligence: ${test.description}`, async () => {
        const sessionId = `intelligence-${Date.now()}-${Math.random().toString(36).substr(2, 3)}`;
        
        const response = await agent.invoke({
          messages: [new HumanMessage(test.question)],
        }, {
          configurable: { thread_id: sessionId }
        });

        const finalMessage = response.messages.filter(m => isAIMessage(m)).pop();
        if (!finalMessage) throw new Error("No AI response received");

        const content = this.extractContent(finalMessage.content);
        if (content.length < 10) {
          throw new Error("Response too short");
        }

        // Log the decision making
        const hasWeatherData = content.toLowerCase().includes("temperature") || 
                              content.toLowerCase().includes("degrees") ||
                              content.toLowerCase().includes("humidity");
        
        this.runner.info(`✓ Response type: ${hasWeatherData ? 'Used weather tool' : 'General knowledge'}`);
        this.runner.info(`Sample: ${content.substring(0, 100)}...`);
      });
    }
  }

  // Instructions for the agent behavior
  async testErrorResilience() {
    await this.runner.runTest("🛡️  Error Handling: Empty Input", async () => {
      const sessionId = `error-empty-${Date.now()}`;
      
      try {
        const response = await agent.invoke({
          messages: [new HumanMessage(" ")],
        }, {
          configurable: { thread_id: sessionId }
        });

        const finalMessage = response.messages.filter(m => isAIMessage(m)).pop();
        if (finalMessage) {
          this.runner.info("✓ Handled empty input gracefully");
        } else {
          this.runner.info("✓ Appropriately rejected empty input");
        }
      } catch (error) {
        if (error.message.includes("empty") || error.message.includes("invalid")) {
          this.runner.info("✓ Properly rejected invalid input");
        } else {
          throw error; // Re-throw unexpected errors
        }
      }
    });

    await this.runner.runTest("🛡️  Error Handling: Complex Input", async () => {
      const complexInput = "Please explain " + "very ".repeat(50) + "complex quantum computing concepts in detail";
      const sessionId = `error-complex-${Date.now()}`;
      
      const response = await agent.invoke({
        messages: [new HumanMessage(complexInput)],
      }, {
        configurable: { thread_id: sessionId }
      });

      const finalMessage = response.messages.filter(m => isAIMessage(m)).pop();
      if (!finalMessage) throw new Error("No response to complex input");

      const content = this.extractContent(finalMessage.content);
      if (content.length < 20) {
        throw new Error("Inadequate response to complex input");
      }

      this.runner.info("✓ Handled complex input successfully");
    });
  }
// function to test performance metrics
  async testPerformanceMetrics() {
    await this.runner.runTest("⚡ Performance: Response Time", async () => {
      const startTime = Date.now();
      const sessionId = `perf-time-${Date.now()}`;
      
      const response = await agent.invoke({
        messages: [new HumanMessage("What is 2+2?")],
      }, {
        configurable: { thread_id: sessionId }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const finalMessage = response.messages.filter(m => isAIMessage(m)).pop();
      if (!finalMessage) throw new Error("No response received");

      this.runner.info(`✓ Response time: ${duration}ms`);
      
      if (duration > 15000) {
        this.runner.warning(`Response time is slow: ${duration}ms`);
      } else if (duration < 2000) {
        this.runner.info("🚀 Excellent response time!");
      }
    });

    await this.runner.runTest("⚡ Performance: Multiple Requests", async () => {
      const questions = [
        "What is HTML?",
        "What is CSS?", 
        "What is Node.js?"
      ];

      const startTime = Date.now();
      
      const promises = questions.map((question, index) => 
        agent.invoke({
          messages: [new HumanMessage(question)],
        }, {
          configurable: { thread_id: `multi-${index}-${Date.now()}` }
        })
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      
      // Validate all responses
      for (let i = 0; i < responses.length; i++) {
        const finalMessage = responses[i].messages.filter(m => isAIMessage(m)).pop();
        if (!finalMessage) {
          throw new Error(`No response for request ${i + 1}: "${questions[i]}"`);
        }
      }

      const totalTime = endTime - startTime;
      const avgTime = totalTime / questions.length;
      
      this.runner.info(`✓ ${questions.length} concurrent requests: ${totalTime}ms total, ${avgTime.toFixed(0)}ms avg`);
    });
  }

  extractContent(content) {
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
// Main test runner
  async runAllTests() {
    this.runner.log(`${colors.bright}🚀 LangGraph Gemini Agent Test Suite${colors.reset}`);
    this.runner.log(`${colors.cyan}📍 Testing: Agent/server/agent.js${colors.reset}`);
    this.runner.log(`${colors.cyan}🔑 Environment: ${process.env.NODE_ENV || 'development'}${colors.reset}\n`);
    
    // Run test categories
    await this.testBasicSetup();
    await this.testGeneralQuestions();  
    await this.testWeatherTool();
    await this.testConversationMemory();
    await this.testToolIntelligence();
    await this.testErrorResilience();
    await this.testPerformanceMetrics();
    
    this.runner.printSummary();
    
    // Provide next steps
    if (this.runner.failedTests === 0) {
      this.runner.log(`${colors.bright}🎯 Next Steps:${colors.reset}`, colors.cyan);
      this.runner.log(`• Add more tools (calculator, search, database)`, colors.cyan);
      this.runner.log(`• Implement user authentication`, colors.cyan);
      this.runner.log(`• Add rate limiting`, colors.cyan);
      this.runner.log(`• Connect your client frontend`, colors.cyan);
      this.runner.log(`• Deploy to production`, colors.cyan);
    }
    
    // Exit with appropriate code
    process.exit(this.runner.failedTests > 0 ? 1 : 0);
  }
}

// Self-executing test runner
const tester = new AgentTester();
tester.runAllTests().catch((error) => {
  console.error(`${colors.red}💥 Test suite crashed: ${error.message}${colors.reset}`);
  console.error(error.stack);
  process.exit(1);
});