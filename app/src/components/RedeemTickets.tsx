import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, TransactionMessage, TransactionSignature, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import { Program, Idl, BN, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import idl from "../../../program/target/idl/lottery.json";
import { PROGRAM_ID } from '../constants';
import { LPProps } from 'views/basics';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { findMetadataPda } from '@metaplex-foundation/js';


export const RedeemTickets: FC<LPProps> = ({lottoPubkey, onLottoPubkeyUpdated}) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet, {})
    setProvider(provider)

    const program = new Program(idl as Idl, PROGRAM_ID);

    const CONFIG_SEED = "ConfigSeed";
    const C_VAULT_SEED = "CVaultSeed";
    const MINT_SEED = "MintSeed";

    console.log("redeem_ticket- lotto address:", lottoPubkey.toString());


    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }

        let signature;

        const time = await connection.getBlockTime(await connection.getSlot());
        console.log(time);

        const CONFIG_PDA = lottoPubkey;
        console.log("CONFIG_PDA", CONFIG_PDA.toString())
        const config_acc = await program.account.config.fetch(CONFIG_PDA);
        console.log(config_acc.authority);
        const [C_VAULT_PDA, C_VAULT_BUMP] = PublicKey.findProgramAddressSync(
            [Buffer.from(C_VAULT_SEED), (config_acc.authority as any).toBuffer()],
            program.programId
        );

        let ticket_mint_pda: PublicKey[] = [];
        let ticket_meta_pda: PublicKey[] = [];
        let tkt_ata: PublicKey[] = [];

        console.log(config_acc.currentEntrants.toString());

        for(let ticket_num = 1; ticket_num <= (config_acc.currentEntrants as BN).toNumber(); ticket_num++) { // (config_acc.maxEntrants as BN).toNumber()
            

            const [TICKET_MINT_PDA, TICKET_MINT_BUMP] = PublicKey.findProgramAddressSync(
                [Buffer.from(MINT_SEED), CONFIG_PDA.toBuffer(), Buffer.from(new BN(ticket_num).toArray())],
                program.programId
            );

            const lottoAccountInfo = await connection.getAccountInfo(TICKET_MINT_PDA);
            console.log(lottoAccountInfo);
            if(lottoAccountInfo != null) {
                const TICKET_META_PDA = findMetadataPda(TICKET_MINT_PDA);
                
                const [TKT_ATA, TKT_ATA_BUMP] = PublicKey.findProgramAddressSync(
                    [
                    publicKey.toBuffer(),
                    TOKEN_PROGRAM_ID.toBuffer(),
                    TICKET_MINT_PDA.toBuffer(),
                    ],
                    ASSOCIATED_TOKEN_PROGRAM_ID
                );
                const TKT_ATA_ACC = await getAccount(provider.connection, TKT_ATA).catch((reason: any) => null);
                if(TKT_ATA_ACC != null && TKT_ATA_ACC.owner.toString() == publicKey.toString()) {
                    console.log("ticket found:", ticket_num);
                    ticket_mint_pda.push(TICKET_MINT_PDA);
                    ticket_meta_pda.push(TICKET_META_PDA);
                    tkt_ata.push(TKT_ATA);
                }
            }
        }

        let tx: Transaction;

        for (let i = 0; i < ticket_mint_pda.length; i++){
            if(i == 0) {
                tx = await program.methods.redeemTicket().accounts({
                    signer: publicKey,
                    config: CONFIG_PDA,
                    configVault: C_VAULT_PDA,
                    ticketMint: ticket_mint_pda[i],
                    ticketMetadata: ticket_meta_pda[i],
                    ticketAccountSigner: tkt_ata[i],
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                }).transaction();
            } else {
                tx.add(await program.methods.redeemTicket().accounts({
                    signer: publicKey,
                    config: CONFIG_PDA,
                    configVault: C_VAULT_PDA,
                    ticketMint: ticket_mint_pda[i],
                    ticketMetadata: ticket_meta_pda[i],
                    ticketAccountSigner: tkt_ata[i],
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                }).transaction());
            }
        }

        try {
            // const tx = await program.methods.redeemTicket().accounts({
            //     signer: publicKey,
            //     config: CONFIG_PDA,
            //     configVault: C_VAULT_PDA,
            //     ticketMint: ticket_mint_pda[i],
            //     ticketMetadata: ticket_meta_pda[i],
            //     ticketAccountSigner: tkt_ata[i],
            //     tokenProgram: TOKEN_PROGRAM_ID,
            //     systemProgram: SystemProgram.programId,
            // }).transaction();
    
            let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;
    
            signature = await sendTransaction(tx, connection, {skipPreflight: true});
            
            console.log(tx)
            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction, lottoPubkey]);

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
                            Redeem Ticket(s)
                        </span>
                    </button>
             </div>
        </div>
    );
};
