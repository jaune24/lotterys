
# Solana Lottery dApp 

built with Next and Anchor, running on Solana devnet

This frontend was adapted from the scaffold found at 

https://github.com/solana-developers/create-solana-dapp

## Installation

```bash
npm install
# or
yarn install
```

## Build and Run

Next, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages
### - Home

- after connecting wallet you can airdrop yourself some SOL on devnet and see balance

### - Basic

- search for somebody else's lottery to interact with 
- create your own to interact with and/or send to others to join
- lottery interactions:
- 1. Buy ticket: buy a ticket for a chance to win a share of the lottery.
- 2. Draw winners: draw winners if they haven't been drawn and the lottery end time has passed.
- 3. Redeem ticket(s): redeem your ticket(s) for the chosen lottery 
- 4. Rug pull: Take 100% the pot and close the config account if you are the lottery organizer.

## Features

Each Scaffold will contain at least the following features:

```
Wallet Integration with Auto Connec / Refresh

State Management

Components: One or more components demonstrating state management

Web3 Js: Examples of one or more uses of web3 js including a transaction with a connection provider

Sample navigation and page changing to demonstate state

Clean Simple Styling 

Notifications (optional): Example of using a notification system

```

A Solana Components Repo will be released in the near future to house a common components library.


### Structure

The scaffold project structure may vary based on the front end framework being utilized. The below is an example structure for the Next js Scaffold.
 
```
├── public : publically hosted files
├── src : primary code folders and files 
│   ├── components : should house anything considered a resuable UI component
│   ├── contexts` : any context considered reusable and useuful to many compoennts that can be passed down through a component tree
│   ├── hooks` : any functions that let you 'hook' into react state or lifecycle features from function components
│   ├── models` : any data structure that may be reused throughout the project
│   ├── pages` : the pages that host meta data and the intended `View` for the page
│   ├── stores` : stores used in state management
│   ├── styles` : contain any global and reusable styles
│   ├── utils` : any other functionality considered reusable code that can be referenced
│   ├── views` : contains the actual views of the project that include the main content and components within
style, package, configuration, and other project files

```

