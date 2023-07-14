import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, TransactionMessage, TransactionSignature, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { FC, useCallback } from 'react';
import { notify } from "../utils/notifications";
import { Program, Idl, BN, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import idl from "../../../program/target/idl/lottery.json";
import { PROGRAM_ID } from '../constants';
import { LPProps } from 'views/basics';


export const DrawWinners: FC<LPProps> = ({lottoPubkey, onLottoPubkeyUpdated}) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet, {})
    setProvider(provider)

    const program = new Program(idl as Idl, PROGRAM_ID);

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

        try {

            const tx = await program.methods.drawWinners().accounts({
                signer: publicKey,
                config: CONFIG_PDA,
                configVault: C_VAULT_PDA,
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
                            Draw Winners
                        </span>
                    </button>
             </div>
        </div>
    );
};
