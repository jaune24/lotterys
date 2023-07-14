import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, TransactionMessage, TransactionSignature, VersionedTransaction, PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import { Program, Idl, BN, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import idl from "../../../program/target/idl/lottery.json";
import { TOKEN_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/utils/token';

import { ASSOCIATED_TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { findMetadataPda } from "@metaplex-foundation/js";
import { PROGRAM_ID } from '../constants';
import { LPProps } from 'views/basics';

export const BuyTicket: FC<LPProps> = ({lottoPubkey, onLottoPubkeyUpdated}) => {

    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet, {})
    setProvider(provider)

    const program = new Program(idl as Idl, PROGRAM_ID);

    const METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

    const CONFIG_SEED = "ConfigSeed";
    const C_VAULT_SEED = "CVaultSeed";
    const MINT_SEED = "MintSeed";

    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }

        let signature;

        const time = await connection.getBlockTime(await connection.getSlot());
        console.log(time);

        const [CONFIG_PDA, CONFIG_BUMP] = PublicKey.findProgramAddressSync(
            [Buffer.from(CONFIG_SEED), publicKey.toBuffer()],
            program.programId
        );
        const [C_VAULT_PDA, C_VAULT_BUMP] = PublicKey.findProgramAddressSync(
            [Buffer.from(C_VAULT_SEED), publicKey.toBuffer()],
            program.programId
        );

        const ticket_num: BN = ((await program.account.config.fetch(CONFIG_PDA)).currentEntrants as BN).add(new BN(1));
        console.log(Buffer.from(ticket_num.toArray()));

        const [TICKET_MINT_PDA, TICKET_MINT_BUMP] = PublicKey.findProgramAddressSync(
            [Buffer.from(MINT_SEED), CONFIG_PDA.toBuffer(), Buffer.from(ticket_num.toArray())],
            program.programId
        );

        const TICKET_META_PDA = findMetadataPda(TICKET_MINT_PDA);
        
        const [TKT_ATA, TKT_ATA_BUMP] = PublicKey.findProgramAddressSync(
            [
              publicKey.toBuffer(),
              TOKEN_PROGRAM_ID.toBuffer(),
              TICKET_MINT_PDA.toBuffer(),
            ],
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        try {

            const tx = await program.methods.buyTicket().accounts({
                signer: publicKey,
                config: CONFIG_PDA,
                configVault: C_VAULT_PDA,
                ticketMint: TICKET_MINT_PDA,
                ticketMetadata: TICKET_META_PDA,
                ticketAccountSigner: TKT_ATA,
                metadataProgram: METADATA_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
                rent: SYSVAR_RENT_PUBKEY,
            }).transaction();
    
            let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;
    
            signature = await sendTransaction(tx, connection);
              
            console.log(tx)
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction]);

    return (
        <div className="flex flex-row justify-center">
            <div className="relative group items-center">
                <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 
                rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                    <button
                        className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                        onClick={onClick} disabled={!publicKey}
                    >
                        <div className="hidden group-disabled:block ">
                        Wallet not connected
                        </div>
                         <span className="block group-disabled:hidden" >
                            Buy Ticket
                        </span>
                    </button>
             </div>
        </div>
    );
};
