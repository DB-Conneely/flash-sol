flash-sol/
├── src/
│   ├── bot/
│   │   ├── commands/
│   │   │   ├── balance.ts        # Handles /balance command to fetch wallet SOL balance
│   │   │   ├── buy.ts            # Manages /buy command for token purchases
│   │   │   ├── connect.ts        # Implements /connect to link an existing wallet
│   │   │   ├── disconnect.ts     # Handles /disconnect to remove wallet association
│   │   │   ├── privatekey.ts     # Retrieves private key with /privatekey after passkey verification
│   │   │   ├── sell.ts           # Manages /sell command for token sales
│   │   │   ├── securitycheck.ts  # passkey system ensures user session is secured
│   │   │   ├── menu.ts           # Central Dashboard for the bot and commands
│   │   │   ├── wallet.ts         # Handles /wallet to generate or display wallet info
│   │   │   └──splippage.ts       # Splippage configuration
│   │   ├── commands.ts           # Registers all bot commands and handles callback queries
│   │   ├── keyboards.ts          # Defines inline keyboard layouts for bot interactions
│   │   └── cache.ts              #passkey cache for security for signing txs and keeping secret keys private without sacrificing execution speed
│   ├── solana/
│   │   ├── client.ts             # Sets up Solana RPC connection and balance fetching
│   │   ├── sniping.ts            # Empty; intended for token sniping logic - Post MVP feature
│   │   ├── trading.ts            # Implements buy/sell token logic via Jupiter API
│   │   ├── wallet.ts             # Generates new Solana wallets
│   │   └── helius.ts             # grabs helius data for tokens
│   ├── utils/
│   │   ├── config.ts             # Empty; Will act as a settings command for the entire bot - Post MVP feature
│   │   ├── helpers.ts            # intended for utility functions 
│   │   ├──logger.ts              # winston logging
│   │   └── Redis.ts              # Redis caching
│   ├── db.ts                     # Manages MongoDB connection and wallet/message/transaction storage
│   └── index.ts                  # Bot entry point; initializes Telegram bot and basic commands
├── tests/                        # Unit and integration tests
│   ├── bot.test.ts               # Tests for Telegram bot commands
│   ├── solana.test.ts            # Tests for Solana interactions
│   ├── helius.test.ts            # Tests to ensure we are getting the correct Helius Data
│   ├── helpers.test.ts           # Tests to ensure the Helpers file operates correctly
│   ├── redis.test.ts             # Tests to ensure the Redis cache operates correctly
│   ├── db.test.ts                # Tests to ensure all database information is correctely collected
│   ├── utils.test.ts             # Tests to ensure winston operates correctly - later other utils files
│   └── trading.test.ts           # Tests for trading logic
├── .env                          # Environment variables (API keys, RPC URLs)
├── package.json                  # Node.js dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # TS config to allow Jest
├── jest.setup.js                 # TS config to allow Jest
├── README.md                     # Project documentation
├── fly.toml                      # fly deployment config
├── Dockerfile                    # Docker file for deployment
├── .gitignore                    # Git ignore file
└── nodemon.json                  # Nodemon config for local development