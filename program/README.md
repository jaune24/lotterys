# Anchor Solana Program


## A solana lottery not meant for mainnet use since it has a built in rug pull function.

You do not need to do any of these commands to use the frontend as the program is already deployed on devnet. Though you may need to run ```anchor build``` to populate the target folder due to the .gitignore (maybe)


There is a pretty basic test script at ```program/tests/lottery.ts```

To run test on localnet:

```bash
anchor test --provider.cluster "Localnet" --detach
```

```shell
anchor build
anchor deploy
```

Copy the **program ID** from the output logs; paste it in `Anchor.toml` & `lib.rs`.

```shell
anchor build
anchor deploy

yarn install
yarn add ts-mocha

anchor run test
```

