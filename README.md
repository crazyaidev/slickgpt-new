# AI Agent Builder

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/developerdefi0782gmailcoms-projects/v0-ai-agent-builder)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/thLb4VPwlSs)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Features

### 🌐 OpenAI Web Search Integration
Enable real-time web search in your AI conversations! The AI Agent Builder now supports OpenAI's web search capability:

- **Toggle Web Search**: Click the Globe icon next to the chat input to enable/disable web search per message
- **Visual Indicators**: Messages using web search display a "Web Search Used" badge
- **Current Information**: Get up-to-date answers with real-time data from the web
- **Smart Integration**: Works seamlessly with your existing agents

For detailed documentation, see [WEB_SEARCH_FEATURE.md](./WEB_SEARCH_FEATURE.md)

### 🤖 AI Agent Management
- Create and configure custom AI agents
- Set system prompts and model parameters
- Enable/disable features per agent (file upload, web search)

### 💬 Advanced Chat Interface
- Real-time streaming responses
- Chat history management
- Multiple conversations per agent
- Markdown support in messages

### 📚 RAG Pipeline
- Embed content from URLs and files
- Build custom knowledge bases
- Query embedded documents with AI

## Deployment

Your project is live at:

**[https://vercel.com/developerdefi0782gmailcoms-projects/v0-ai-agent-builder](https://vercel.com/developerdefi0782gmailcoms-projects/v0-ai-agent-builder)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/thLb4VPwlSs](https://v0.app/chat/thLb4VPwlSs)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Quick Start

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Add your OpenAI API key in Settings
4. Create an agent with web search enabled
5. Start chatting with web search capabilities!

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **UI**: React + TailwindCSS + shadcn/ui
- **State Management**: Zustand
- **AI Integration**: OpenAI API
- **Storage**: LocalStorage (browser-based)