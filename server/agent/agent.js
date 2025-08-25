import "dotenv/config";
import fetch from "node-fetch";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, isAIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

// 1. Weather Tool with Precise Configuration
const weatherTool = tool(
  async ({ location }) => {
    console.log("⛅ Weather tool executing for:", location);
    return JSON.stringify({
      location,
      temperature: 25 + Math.floor(Math.random() * 5),
      conditions: ["sunny", "partly cloudy", "rainy"][
        Math.floor(Math.random() * 3)
      ],
      humidity: 60 + Math.floor(Math.random() * 20),
    });
  },
  {
    name: "get_current_weather",
    description: "Get current weather conditions for a specific location. Only use when explicitly asked about current weather.",
    schema: z.object({
      location: z.string().describe("City name for weather lookup"),
    }),
  }
);

// Calculator Tool
const calculatorTool = tool(
  async ({ expression }) => {
    try {
      // Evaluate simple math expressions safely
      // Only allow numbers and math operators
      if (!/^[-+*/(). 0-9]+$/.test(expression)) {
        throw new Error("Invalid characters in expression");
      }
      // eslint-disable-next-line no-eval
      const result = eval(expression);
      return `Result: ${result}`;
    } catch (err) {
      return `Error: ${err.message}`;
    }
  },
  {
    name: "calculator",
    description: "Evaluate basic math expressions. Use for arithmetic calculations.",
    schema: z.object({
      expression: z.string().describe("Math expression to evaluate, e.g. '2+2*3'")
    }),
  }
);

// Search Tool (simulated)
const searchTool = tool(
  async ({ query }) => {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;
    const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!data.items || data.items.length === 0) {
        return `No results found for "${query}".`;
      }
      // Format top 2 results
      return [
        `Here's what I found regarding "${query}":`,
        ...data.items.slice(0, 2).map((item, idx) =>
          `${idx + 1}. ${item.title}: ${item.link}`
        )
      ].join('\n');
    } catch (err) {
      return `Error fetching search results: ${err.message}`;
    }
  },
  {
    name: "search",
    description: "Search the web for information. Use for questions requiring up-to-date info.",
    schema: z.object({
      query: z.string().describe("Search query")
    }),
  }
);

// 2. Model Configuration - Fixed Issues
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash", // Try experimental version first
  temperature: 0.7,
  maxOutputTokens: 2048,
  // Let LangGraph handle tool configuration
});

// 3. Memory Configuration
const memory = new MemorySaver();

// 4. Agent with Better Configuration
export const agent = createReactAgent({
  llm: model,
  tools: [weatherTool, calculatorTool, searchTool],
  checkpointSaver: memory,
  systemPrompt: `You are a helpful AI assistant. 

CRITICAL INSTRUCTIONS:
- Answer ALL general questions directly using your knowledge
- You can discuss any topic: programming, science, history, etc.
- Only use the weather tool when explicitly asked about current weather conditions
- Use the calculator tool for math calculations
- Use the search tool for questions requiring up-to-date info or web search
- Never refuse to answer general knowledge questions
- Be conversational, helpful, and informative

Examples of what to answer directly:
- "What is JavaScript?" -> Explain JavaScript
- "How does Python work?" -> Explain Python
- "Tell me about machine learning" -> Explain ML
- "What is the capital of France?" -> Answer: Paris
- "What is 2+2*3?" -> Use calculator tool
- "Search for latest news on AI" -> Use search tool

Only use weather tool for:
- "What's the weather in NYC?"
- "Current weather in London"
- "How's the weather today in Paris?"`,
});

// Test function for debugging
export async function testAgent() {
  try {
    console.log("\n=== Testing Agent ===");
    
    // Test general question
    console.log("1. Testing general question...");
    const generalResponse = await agent.invoke({
      messages: [new HumanMessage("What is JavaScript?")],
    }, {
      configurable: { thread_id: "test-session-1" }
    });

    const generalAnswer = generalResponse.messages
      .filter(m => isAIMessage(m))
      .pop();

    if (generalAnswer) {
      console.log("✅ General question response:", 
        Array.isArray(generalAnswer.content) 
          ? generalAnswer.content.map(c => c.text || c.toString()).join('\n')
          : generalAnswer.content
      );
    } else {
      console.log("❌ No response to general question");
    }

    // Test weather question
    console.log("\n2. Testing weather question...");
    const weatherResponse = await agent.invoke({
      messages: [new HumanMessage("What's the weather in New York?")],
    }, {
      configurable: { thread_id: "test-session-2" }
    });

    const weatherAnswer = weatherResponse.messages
      .filter(m => isAIMessage(m))
      .pop();

    if (weatherAnswer) {
      console.log("✅ Weather question response:", 
        Array.isArray(weatherAnswer.content) 
          ? weatherAnswer.content.map(c => c.text || c.toString()).join('\n')
          : weatherAnswer.content
      );
    } else {
      console.log("❌ No response to weather question");
    }
    // test  for calculator.
console.log("\n3. Testing calculator question...");
    const calcResponse = await agent.invoke({
      messages: [new HumanMessage("What is the addition of 5 and 10?")],
    }, {
      configurable: { thread_id: "test-session-3" }
     });
    const calcAnswer = calcResponse.messages
      .filter(m => isAIMessage(m))
      .pop();
    if (calcAnswer) {
      console.log("✅ Calculator question response:", 
        Array.isArray(calcAnswer.content) 
          ? calcAnswer.content.map(c => c.text || c.toString()).join('\n')
          : calcAnswer.content
      );
    } else {
      console.log("❌ No response to calculator question");
    }
    // Test search question
    console.log("\n4. Testing search question...");
    const searchResponse = await agent.invoke({
      messages: [new HumanMessage("Search for recent top model cars in tata motors.")],
    }, {
      configurable: { thread_id: "test-session-4" }
    });
    const searchAnswer = searchResponse.messages
      .filter(m => isAIMessage(m))
      .pop(); 
    if (searchAnswer) {
      console.log("✅ Search question response:", 
        Array.isArray(searchAnswer.content) 
          ? searchAnswer.content.map(c => c.text || c.toString()).join('\n')
          : searchAnswer.content
      );
    } else {
      console.log("❌ No response to search question");
    }

  } catch (error) {
    console.error("❌ Test error:", error.message);
    if (error.response?.data) {
      console.error("API Error details:", error.response.data);
    }
  }
}

// Test simple model without agent
export async function testSimpleModel() {
  try {
    console.log("\n=== Testing Simple Model ===");
    const simpleModel = new ChatGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
      model: "gemini-2.5-flash", // though api is having the rate limits we can use diiferent models see the rate limits of them in google ai studio and use the one which has remaining rate limits
      temperature: 0.7,
    });

    const response = await simpleModel.invoke("What is JavaScript?");
    console.log("✅ Simple model response:", response.content);
    
    return true;
  } catch (error) {
    console.error("❌ Simple model error:", error.message);
    
    // Try alternative model
    console.log("Trying alternative model: gemini-1.5-pro");
    try {
      const altModel = new ChatGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
        model: "gemini-1.5-pro",
        temperature: 0.7,
      });
      
      const response = await altModel.invoke("What is JavaScript?");
      console.log("✅ Alternative model works:", response.content);
      return true;
    } catch (altError) {
      console.error("❌ Alternative model also failed:", altError.message);
      return false;
    }
  }
}

// Uncomment to test directly
testSimpleModel().then(() => testAgent());