# Flash-SOL: Telegram Bot for Solana Token Trading

[![Tests](https://img.shields.io/badge/tests-61%20passing-green?style=flat-square)](https://github.com/sk3neels/flash-sol/tree/main/tests)
[![Language](https://img.shields.io/badge/language-TypeScript-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-1.98.x-purple?style=flat-square)](https://solana.com/)
[![Deployment](https://img.shields.io/badge/deployment-Fly.io-orange?style=flat-square)](https://fly.io/)

![Flash-SOL Logo](assets/FLASH.jpeg) 


**DISCLAIMER** - this is the Partial Public Repo - the FULL CODEBASE is available to view on a private repo subject to further discussion.

Flash-SOL is a recently deployed Minimum Viable Product (MVP) Telegram bot for trading Solana (SOL) tokens via Jupiter DEX. Built in TypeScript, it enables fast buys, sells, and portfolio management on Solana's high-performance blockchain. This portfolio project highlights my expertise in blockchain development and AI-assisted coding, serving as a scalable foundation for future Solana-based tools.

Currently in its early stages post-deployment, Flash-SOL is ready to onboard users. It features a 0.5% transaction fee—designed to be minimal for users (simplifying trading, especially for beginners) while offering revenue potential as adoption grows. This proof-of-concept demonstrates a robust base for expansion into broader Solana ecosystems.


## Key Highlights
- **Efficient Development**: Completed in 2 months using AI tools (Grok v3/v4, Gemini Pro) to accelerate code generation, with my focus on architecture, edge case handling, and debugging.
- **Security Focus**: Implements passkey-based sessions, encrypted keys, and Redis caching for secure operations.
- **Live Demo**: Test the bot at [@flashsol_bot](https://t.me/flashsol_bot). A walkthrough video is available on [YouTube](https://youtu.be/iJOtwT8uimE).
- **Portfolio Showcase**: A demonstration of my skills, open to remote Solana/DeFi opportunities.


## Features
- **Trading**: `/buy` and `/sell` commands with customizable slippage and amounts via Jupiter DEX.
- **Wallet Management**: Generate (`/wallet`), import (`/connect`), disconnect (`/disconnect`), and securely retrieve keys (`/privatekey`).
- **Portfolio Insights**: `/portfolio` displays paginated token holdings using Helius API.
- **Security**: `/securitycheck` refreshes sessions with passkey authentication.
- **Slippage Control**: `/slippage` adjusts tolerance (default 5%).
- **Interactive Dashboard**: `/menu` offers an inline keyboard for all commands.
- **Logging**: Winston-based logging for debugging, errors, and transactions.
- **Caching**: Redis for state management, locks, and security.
- **Testing**: 61 passing Jest tests ensure reliability.
- **Deployment**: Dockerized and configured for Fly.io.
- **Future Potential**: Plans for advanced Solana tools (details available in discussions).


## Development Process
This MVP was architected with AI tools (Grok v3/v4 and Gemini Pro) accelerating code generation, allowing me to prioritize system design, scalability, and bug resolution. Built over 2 months (with breaks), it reflects a balance of rapid prototyping and thoughtful engineering.


## Project Structure
flash-sol/
├── src/          # Bot, Solana, utils, DB, entry
├── tests/        # Jest suite
├── .env          # Config
├── package.json  # Deps
├── tsconfig.json # TS config
├── jest.config.js# Jest
├── README.md     # Doc
├── fly.toml      # Fly
├── Dockerfile    # Docker
└── nodemon.json  # Dev


## Testing
From a run on July 22, 2025, at 04:57 AM BST:
Test Suites: 9 passed, 9 total
Tests:       61 passed, 61 total
Time:        11.816 s


## Deployment
- **Docker**: Build with `docker build -t flash-sol .` and run with environment variables.
- **Fly.io**: Deploy using the Fly CLI with pre-configured `fly.toml`.


## Demo & Feedback
- **Bot**: Explore [@flashsol_bot](https://t.me/flashsol_bot). Start with `/menu` or `/help`.
- **Video**: Demo videos on YouTube: [Main Demo (5 mins)](https://youtu.be/iJOtwT8uimE) | [Technical Breakdown](https://youtu.be/fAfZb3UqQSU)
- **Input**: As a fresh deploy, feedback is welcome. Contact me for discussions or opportunities.


## Dependencies (Key)
- Core: `@solana/web3.js`, `@jup-ag/api`, `node-telegram-bot-api`
- Data: `mongodb`, `ioredis`, `axios`
- Security: `bcrypt`, `bs58`
- Utilities: `winston`, `dotenv`, `cross-fetch`
- Dev: `jest`, `ts-jest`, `nodemon`


## License
Proprietary. All rights reserved. This code is available for viewing in this repository as a portfolio showcase only. No use, modification, or distribution is permitted without explicit written consent from the author.


## Contact
Reach me on Telegram or X at [@sk3neels](https://t.me/sk3neels). I’m open to remote Solana/DeFi development opportunities—let’s discuss!