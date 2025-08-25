import "dotenv/config";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, isAIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

const weatherTool = tool(
  async ({ query }) => {
    console.log("Weather query received:", query);
    // Simulate a weather response
    return `The weather in bangalore is sunny with a high of 25°C.`;
  },
  {
    name: "getWeather",
    description: "Get the current weather for a given location.",
    schema: z.object({
      query: z
        .string()
        .describe("The query to use in search"),
    }),
  }
);

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.5-flash", // no need for "models/" prefix
});

const agent = createReactAgent({
  llm: model,
  tools: [weatherTool],
  agentType:"react-description",
  allowDirectResponses:true,
});

function extractAIText(aiMessage) {
  if (!aiMessage) {
    return "";
  }

  if (Array.isArray(aiMessage.content)) {
    return aiMessage.content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part.type === "text") {
          return part.text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }
  if (typeof aiMessage.content === "string") {
    return aiMessage.content.trim();
  }
}

(async () => {
  try {
    const response = await agent.invoke({
      messages: [
        new HumanMessage("what you know about golang?"),
      ],
    });

    //console.log(response.messages[response.messages.length - 1]?.content);
    //console.log(response);

    const aiMessage = response.messages.find((m) => isAIMessage(m));
    // If AI returned something
    if (aiMessage) {
      console.log("🤖 AI Final Response:\n");

      console.log(extractAIText(aiMessage));
    } else {
      console.log("⚠️ No AI message found");
    }
  } catch (error) {
    console.error("Error invoking agent:", error);
  }
})();

// sample index.js
import express from "express";
import cors from "cors";
import { HumanMessage, isAIMessage } from "@langchain/core/messages";

import { agent } from "./agent.js";
const app = express();
const port = 3001;

app.use(express.json());

app.use(cors({ origin: "*" }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/generate", async (req, res) => {
  try {
    const { question, sessionId, history } = req.body;
    // Build messages array from history + current question
    const messages = (history || []).map((m) => new HumanMessage(m.content));
    messages.push(new HumanMessage(question));

    const result = await agent.invoke({
      messages,
      config: { sessionId: sessionId || "default" },
    });

    const finalMessage = result.messages.filter((m) => isAIMessage(m)).pop();

    if (finalMessage) {
      console.log("\n🤖 Response:");
      console.log(finalMessage.content);
      let textOutput = "";
      if (Array.isArray(finalMessage.content)) {
        textOutput = finalMessage.content.map((c) => c.text || "").join("\n");
      } else {
        textOutput = finalMessage.content || "";
      }
      res.json({ finalMessage: textOutput.trim() });
      //s.json({ finalMessage: finalMessage.content });
    } else {
      res.status(404).json({ error: "No AI response found" });
    }
  } catch (error) {
    console.error("Error in /generate:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});
// sample agent.js
import "dotenv/config";
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
    return {
      location,
      temperature: 25 + Math.floor(Math.random() * 5),
      conditions: ["sunny", "partly cloudy", "rainy"][
        Math.floor(Math.random() * 3)
      ],
      humidity: 60 + Math.floor(Math.random() * 20),
    };
  },
  {
    name: "get_current_weather", // Must match the allowedFunctionNames
    description:
      "STRICTLY for current weather conditions when explicitly requested.",
    schema: z.object({
      location: z.string().describe("Exact city name for weather lookup"),
    }),
  }
);

// 2. Model Configuration with Correct Tool Name
const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.0-flash",
  temperature: 0.2,
  modelOptions: {
    toolConfig: {
      functionCallingConfig: {
        mode: "AUTO",
    
      },
    },
  },
});
const memory = new MemorySaver({
  memoryKey: "chat_history",
  maxMessages: 1000,
  saveOnFinish: true,
  saveOnError: true,
});

// 3. Agent with Strong Directives
export const agent = createReactAgent({
  llm: model,
  tools: [weatherTool],
  memory,
  systemMessage: `You are a knowledgeable AI assistant.
- Always answer general knowledge, factual, and reasoning questions directly using your own knowledge.
- Only use the tool "get_current_weather" when the user explicitly asks for *current weather conditions* in a location.
- Do NOT refuse general questions.
- If the user asks about an unknown or misspelled concept, attempt to clarify or provide your best guess.`,

  handleParsingErrors: true,
  maxIterations:5,
  earlyStoppingMethod: "generate",
  verbose: true,
});

// // 4. Enhanced Query Function with Debugging
// async function askAgent(question) {
//   try {
//     console.log(`\n🧑 Question: "${question}"`);

//     const response = await agent.invoke({
//       messages: [new HumanMessage(question)],
//     });

//     // Debug output
//     console.log("\n🔍 Full response structure:", JSON.stringify(response, null, 2));

//     const finalMessage = response.messages
//       .filter(m => isAIMessage(m))
//       .pop();

//     if (finalMessage) {
//       console.log("\n🤖 Response:");
//       console.log(finalMessage.content);

//       if (finalMessage.additional_kwargs?.tool_calls) {
//         console.log("⛅ Weather tool was used");
//       }
//     }
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// // 5. Comprehensive Test Cases
// (async () => {
//   // General knowledge (must work)
//   await askAgent("Can you explain JavaScript?");
// //   await askAgent("Tell me about Golang's concurrency model");
// //   await askAgent("What is the capital of France?");

// //   // Weather queries (must use tool)
//   await askAgent("for What this language is used for?");
// //   await askAgent("How's the weather in Dubai right now?");

// //   // Mixed queries
// //   await askAgent("First explain quantum computing, then tell me the weather in London");
// })();
