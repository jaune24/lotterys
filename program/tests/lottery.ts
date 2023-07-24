import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Lottery } from "../target/types/lottery";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { assert } from "chai";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAccount } from "@solana/spl-token";
import { findMetadataPda } from "@metaplex-foundation/js";

// some util functions
function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

function hasDuplicates(array) {
  return (new Set(array)).size !== array.length;
}

function map_help(pubkey: anchor.web3.PublicKey) {
  return pubkey.toBase58();
}

describe("lottery", () => {
  const CONFIG_SEED = "ConfigSeed";
  const C_VAULT_SEED = "CVaultSeed";
  const MINT_SEED = "MintSeed";

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.AnchorProvider.env();

  const program = anchor.workspace.Lottery as Program<Lottery>;

  const METADATA_PROGRAM_ID = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
  
  const LOTTO_ORG_KP = program.provider;
  const [CONFIG_PDA, CONFIG_BUMP] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED), LOTTO_ORG_KP.publicKey.toBuffer()],
    program.programId
  );
  const [C_VAULT_PDA, C_VAULT_BUMP] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from(C_VAULT_SEED), LOTTO_ORG_KP.publicKey.toBuffer()],
    program.programId
  );
  const LOTTO_P_KP = [anchor.web3.Keypair.generate(), anchor.web3.Keypair.generate(), anchor.web3.Keypair.generate(), anchor.web3.Keypair.generate(), anchor.web3.Keypair.generate(), anchor.web3.Keypair.generate()];
  let tkt_ata: anchor.web3.PublicKey[] = [];
  let ticket_mint_pda: anchor.web3.PublicKey[] = [];
  let ticket_meta_pda: anchor.web3.PublicKey[] = [];

  const LOTTO_NAME = "LotteryJJJ"
  const TICKET_COST = new anchor.BN(16666);
  const MIN_ENTRANTS = new anchor.BN(5);
  const MAX_ENTRANTS = new anchor.BN(100);
  let END_TIME: anchor.BN;
  const REWARDS = [80, 10, 5, 3, 2];

  let vault_rent;

  it("initialize", async () => {

    END_TIME = new anchor.BN(await provider.connection.getBlockTime(await provider.connection.getSlot()) + 10000);

    // send initialize transaction
    const tx = await program.methods.initialize(LOTTO_NAME, TICKET_COST, MIN_ENTRANTS, MAX_ENTRANTS, END_TIME, REWARDS).accounts({
      signer: LOTTO_ORG_KP.publicKey,
      config: CONFIG_PDA,
      systemProgram: anchor.web3.SystemProgram.programId,
      configVault: C_VAULT_PDA,
    }).rpc({
      skipPreflight: true,
    });
    console.log("initialize transaction signature", tx);
    // console.log((await provider.connection.getAccountInfo(CONFIG_PDA)).data);
    // console.log(await program.account.config.fetch(CONFIG_PDA));

    // save vault_rent
    vault_rent = (await provider.connection.getAccountInfo(C_VAULT_PDA)).lamports;

    // fetch on chain data
    const config_acc = await program.account.config.fetch(CONFIG_PDA);

    const nameString = String.fromCharCode.apply(null, config_acc.name);

    // check on chain results
    assert.equal(nameString, LOTTO_NAME, "config_acc.name not set correctly");
    assert.equal(config_acc.authority.toBase58(), LOTTO_ORG_KP.publicKey.toBase58(), "config_acc.authority not set correctly");
    assert.equal(config_acc.ticketCost.toNumber(), TICKET_COST.toNumber(), "config_acc.ticketCost not set correctly");
    assert.equal(config_acc.minEntrants.toNumber(), MIN_ENTRANTS.toNumber(), "config_acc.minEntrants not set correctly");
    assert.equal(config_acc.maxEntrants.toNumber(), MAX_ENTRANTS.toNumber(), "config_acc.maxEntrants not set correctly");
    assert.equal(config_acc.currentEntrants.toNumber(), 0, "config_acc.currentEntrants not set correctly");
    assert.equal(config_acc.endTime.toNumber(), END_TIME.toNumber(), "config_acc.endTime not set correctly");
    assert.equal(config_acc.rewards.toString(), REWARDS.toString(), "config_acc.rewards not set correctly");
    assert.equal(config_acc.closed, false, "config_acc.closed not set correctly");
    assert.equal(config_acc.vault.toBase58(), C_VAULT_PDA.toBase58(), "config_acc.vault not set correctly");
  });

  it("buy_ticket", async () => {
    for (let i = 0; i < LOTTO_P_KP.length; i++) {
      // airdrop to each lottery player
      const ad = await provider.connection.requestAirdrop(LOTTO_P_KP[i].publicKey, 500e9);
      // await provider.connection.confirmTransaction(ad, "finalized");
      await delay(1000);

      let vault_lamports_before = (await provider.connection.getAccountInfo(C_VAULT_PDA)).lamports;

      // derive ticket mint pda for the lotto player
      const ticket_num = (await program.account.config.fetch(CONFIG_PDA)).currentEntrants.add(new anchor.BN(1));

      console.log(ticket_num.toBuffer());

      ticket_mint_pda[i] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(MINT_SEED), CONFIG_PDA.toBuffer(), ticket_num.toBuffer()],
        program.programId
      )[0];

      ticket_meta_pda[i] = findMetadataPda(ticket_mint_pda[i]);

      tkt_ata[i] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          LOTTO_P_KP[i].publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          ticket_mint_pda[i].toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID)[0];

      // sedn buy_ticket transaction
      const tx = await program.methods.buyTicket().accounts({
        signer: LOTTO_P_KP[i].publicKey,
        config: CONFIG_PDA,
        configVault: C_VAULT_PDA,
        ticketMint: ticket_mint_pda[i],
        ticketMetadata: ticket_meta_pda[i],
        ticketAccountSigner: tkt_ata[i],
        metadataProgram: METADATA_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      }).signers([
        LOTTO_P_KP[i],
      ]).rpc({
        skipPreflight: true,
      });
      console.log("buy_ticket transaction signature", tx);

      // fetch on chain data
      let vault_lamports_after = (await provider.connection.getAccountInfo(C_VAULT_PDA)).lamports;
      let signer_ticket_balance = (await getAccount(provider.connection, tkt_ata[i])).amount;
      const config_acc = await program.account.config.fetch(CONFIG_PDA);

      // check on chain results
      assert.equal(vault_lamports_before + TICKET_COST.toNumber(), vault_lamports_after, "config_vault receieved wrong number of lamports");
      assert.equal(new anchor.BN(signer_ticket_balance.toString()).toNumber(), 1, "signer ticket account didn't receive ticket");
      assert.equal(config_acc.currentEntrants.toNumber(), i + 1, "current_entrants not incremented");
    }
  });

  it("draw_winners", async () => {
    // send draw winners transaction
    const tx = await program.methods.drawWinners().accounts({
      signer: LOTTO_ORG_KP.publicKey,
      config: CONFIG_PDA,
      configVault: C_VAULT_PDA,
    }).rpc();
    console.log("draw_winners transaction signature", tx);

    // fetch on chain data
    const config_acc = await program.account.config.fetch(CONFIG_PDA);
    const winners_arr = config_acc.winners;
    const winning_mints_arr = config_acc.winningMints;

    // check on chain results
    for (let i = 0; i++; i < winners_arr.length) { // check each winning ticket number and each winning mint
      const winning_pda_exp = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(MINT_SEED), CONFIG_PDA.toBuffer(), winners_arr[i].toBuffer()],
        program.programId
      )[0];
      assert.isOk((winners_arr[i].toNumber() > 0 && winners_arr[i] <= config_acc.currentEntrants), "winner is not a valid ticket number");
      assert.equal(winning_mints_arr[i], winning_pda_exp, "winning pda does not match winning ticket number");
    }
    assert.isOk(!hasDuplicates(winners_arr), "winners array has duplicate winners");
    assert.equal(config_acc.pot.toNumber(), config_acc.currentEntrants.toNumber() * TICKET_COST.toNumber(), "pot != current_entrants * ticket_cost");
    assert.equal((await provider.connection.getAccountInfo(C_VAULT_PDA)).lamports - vault_rent, config_acc.currentEntrants.toNumber() * TICKET_COST.toNumber(), "lamports - rent != current_entrants * ticket_cost");
    assert.equal(config_acc.closed, true, "config.closed not set to true");
  });

  it("redeem_ticket", async () => {
    // loop through each lotto player
    for (let i = 0; i < LOTTO_P_KP.length; i++) {

      let vault_lamports_before = (await provider.connection.getAccountInfo(C_VAULT_PDA)).lamports;

      // send redeem_ticket transaction
      const tx = await program.methods.redeemTicket().accounts({
        signer: LOTTO_P_KP[i].publicKey,
        config: CONFIG_PDA,
        configVault: C_VAULT_PDA,
        ticketMint: ticket_mint_pda[i],
        ticketMetadata: ticket_meta_pda[i],
        ticketAccountSigner: tkt_ata[i],
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      }).signers([
        LOTTO_P_KP[i],
      ]).rpc({
        skipPreflight: true,
      });
      console.log("redeem_ticket transaction signature", tx);

      // fetch on chain data
      const config_acc = await program.account.config.fetch(CONFIG_PDA);
      let vault_lamports_after = (await provider.connection.getAccountInfo(C_VAULT_PDA)).lamports;
      let lamport_change = vault_lamports_after - vault_lamports_before;
      // let signer_ticket_balance = (await getAccount(provider.connection, tkt_ata[i])).amount;

      let w_index = config_acc.winningMints.map(map_help).indexOf(ticket_mint_pda[i].toBase58());

      // check on chain data
      if (w_index == -1) { // not a winner
        assert.equal(lamport_change, 0, "lamports sent to a holder of a non-winning ticket");
      } else { // winner
        assert.closeTo(lamport_change, -1 * (config_acc.rewards[w_index] / 100) * config_acc.pot.toNumber(), 1, "winner sent wrong number of lamports");
        // assert.equal(new anchor.BN(signer_ticket_balance.toString()).toNumber(), 0, "ticket not burned");
      }
    }
  });

  it("rug_pull", async () => {
    const tx = await program.methods.rugPull().accounts({
      signer: LOTTO_ORG_KP.publicKey,
      config: CONFIG_PDA,
      configVault: C_VAULT_PDA,
      systemProgram: anchor.web3.SystemProgram.programId,
    }).rpc({
      skipPreflight: true,
    });
    console.log("rug_pull transaction signature", tx);
  });
});
