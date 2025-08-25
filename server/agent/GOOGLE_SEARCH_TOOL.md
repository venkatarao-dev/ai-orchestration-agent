# Google Search Tool Integration Documentation

This guide explains how to set up and use the Google Search Tool in your agent project.

## Prerequisites
- Node.js and npm installed
- Access to Google Custom Search Engine (CSE)
- Google Cloud API Key

## Setup Steps

### 1. Install Dependencies
Run the following command in your project directory:
```
npm install node-fetch
```

### 2. Get Google API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project (if needed)
- Enable the "Custom Search API" for your project
- Go to "APIs & Services > Credentials"
- Click "Create Credentials" > "API key"
- Copy your API key

### note if above not working follow below for the search  api key
- Go to Google Custom Search JSON API.
- Create a Custom Search Engine and get your API key and Search Engine ID (cx).


### 3. Create a Custom Search Engine (CSE)
- Go to [Google Custom Search Engine](https://cse.google.com/cse/all)
- Click "Add" to create a new search engine
- Enter a website to search (use `www.google.com` for web-wide search)
- After creation, go to the CSE control panel
- Copy the "Search engine ID" (looks like `012345678901234567890:abcde_fghij`)

### 4. Add Keys to .env File
Add the following lines to your `.env` file:
```
GOOGLE_SEARCH_API_KEY=your_api_key
GOOGLE_SEARCH_CX=your_search_engine_id
```

### 5. How the Tool Works
- The search tool uses the Google Custom Search API to fetch real search results.
- When the agent receives a search-related query, it calls the API and returns the top results in a formatted response.

### 6. Example Usage
Ask your agent:
- "Search for latest news on AI"
- "Find tutorials on Node.js"

The agent will reply with:
```
Here's what I found regarding "latest news on AI":
1. Title 1: https://link1
2. Title 2: https://link2
```

### 7. Troubleshooting
- Ensure your API key and CX are correct and active.
- Make sure the Custom Search API is enabled in your Google Cloud project.
- If you get no results, check your CSE settings (make sure it is set to search the entire web if needed).

## References
- [Google Custom Search JSON API](https://developers.google.com/custom-search/v1/overview)
- [Google Custom Search Engine Dashboard](https://cse.google.com/cse/all)

---
For further help, contact your project administrator or refer to the official Google documentation.
