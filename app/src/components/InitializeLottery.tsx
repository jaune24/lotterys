import { useConnection, useWallet, useAnchorWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, Transaction, TransactionMessage, TransactionSignature, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { FC, useCallback, useState } from 'react';
import { notify } from "../utils/notifications";
import { Program, Idl, BN, AnchorProvider, setProvider } from '@coral-xyz/anchor';
import idl from "../../../program/target/idl/lottery.json";
import { PROGRAM_ID } from '../constants';
import { LPProps } from 'views/basics';


export const InitializeLottery: FC<LPProps> = ({lottoPubkey, onLottoPubkeyUpdated}) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const anchorWallet = useAnchorWallet();
    const provider = new AnchorProvider(connection, anchorWallet, {})
    setProvider(provider)

    const program = new Program(idl as Idl, PROGRAM_ID);

    const CONFIG_SEED = "ConfigSeed";
    const C_VAULT_SEED = "CVaultSeed";
    const MINT_SEED = "MintSeed";

    console.log("init_lotto- lotto address:", lottoPubkey.toString());

    const [inputs, setInputs] = useState({
        name: "LotteryJJJ",
        ticket_cost: 1,
        min_entrants: 5,
        max_entrants: 100,
        end_time: 0,
        rewards: [80, 10, 5, 3, 2],
    });

    const handleSubmit = (event) => {
        console.log("the data is correctly inserted")
    }

    const setEndTimeWeek = (async (event) => {
        event.preventDefault();
        const time = await connection.getBlockTime(await connection.getSlot());
        setInputs({...inputs, end_time: time + (7 * 24 * 60 * 60)});
    })
    const setEndTimeDay = (async (event) => {
        event.preventDefault();
        const time = await connection.getBlockTime(await connection.getSlot());
        setInputs({...inputs, end_time: time + (24 * 60 * 60)});
    })
    const setEndTimeHour = (async (event) => {
        event.preventDefault();
        const time = await connection.getBlockTime(await connection.getSlot());
        setInputs({...inputs, end_time: time + (60 * 60)});
    })

    const handleChange = {
        name: (event) => {
            if (event.target.value.length <= 10) {
                setInputs({...inputs, name: event.target.value});
            }
        },
        ticket_cost: (event) => {
            setInputs({...inputs, ticket_cost: event.target.value});
        },
        min_entrants: (event) => {
            setInputs({...inputs, min_entrants: event.target.value});
        },
        max_entrants: (event) => {
            setInputs({...inputs, max_entrants: event.target.value});
        },
        end_time: (event) => {
            setInputs({...inputs, end_time: event.target.value});
        },
        rewards1: (event) => {
            let new_rewards = inputs.rewards;
            new_rewards[0] = event.target.value;
            setInputs({...inputs, rewards: new_rewards});
        },
        rewards2: (event) => {
            let new_rewards = inputs.rewards;
            new_rewards[1] = event.target.value;
            setInputs({...inputs, rewards: new_rewards});
        },
        rewards3: (event) => {
            let new_rewards = inputs.rewards;
            new_rewards[2] = event.target.value;
            setInputs({...inputs, rewards: new_rewards});
        },
        rewards4: (event) => {
            let new_rewards = inputs.rewards;
            new_rewards[3] = event.target.value;
            setInputs({...inputs, rewards: new_rewards});
        },
        rewards5: (event) => {
            let new_rewards = inputs.rewards;
            new_rewards[4] = event.target.value;
            setInputs({...inputs, rewards: new_rewards});
        },
    }

    const onClick = useCallback(async () => {
        if (!publicKey) {
            notify({ type: 'error', message: `Wallet not connected!` });
            console.log('error', `Send Transaction: Wallet not connected!`);
            return;
        }

        let signature;

        const time = await connection.getBlockTime(await connection.getSlot());
        console.log(time);

        const LOTTO_NAME = inputs.name.padEnd(10).substring(0, 10);
        const TICKET_COST = new BN(inputs.ticket_cost);
        const MIN_ENTRANTS = new BN(inputs.min_entrants);
        const MAX_ENTRANTS = new BN(inputs.max_entrants);
        const END_TIME = new BN(inputs.end_time);
        const REWARDS = inputs.rewards;

        const [CONFIG_PDA, CONFIG_BUMP] = PublicKey.findProgramAddressSync(
            [Buffer.from(CONFIG_SEED), publicKey.toBuffer()],
            program.programId
        );
        console.log(CONFIG_PDA.toString());
        const [C_VAULT_PDA, C_VAULT_BUMP] = PublicKey.findProgramAddressSync(
            [Buffer.from(C_VAULT_SEED), publicKey.toBuffer()],
            program.programId
        );

        try {
            const tx = await program.methods.initialize(LOTTO_NAME, TICKET_COST, MIN_ENTRANTS, MAX_ENTRANTS, END_TIME, REWARDS).accounts({
                signer: publicKey,
                config: CONFIG_PDA,
                systemProgram: SystemProgram.programId,
                configVault: C_VAULT_PDA,
            }).transaction();

            let blockhash = (await connection.getLatestBlockhash('finalized')).blockhash;
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            signature = await sendTransaction(tx, connection, {preflightCommitment: 'finalized'});
            
            console.log(tx)
            
            onLottoPubkeyUpdated(CONFIG_PDA);

            await new Promise( resolve => setTimeout(resolve, 1000) );

            const config_acc = await program.account.config.fetch(CONFIG_PDA);
            console.log(config_acc);

            notify({ type: 'success', message: 'Transaction successful!', txid: signature });
        } catch (error: any) {
            notify({ type: 'error', message: `Transaction failed!`, description: error?.message, txid: signature });
            console.log('error', `Transaction failed! ${error?.message}`, signature);
            return;
        }
    }, [publicKey, notify, connection, sendTransaction, lottoPubkey, inputs]);


    return (
        <div className='init-lotto-border'>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>
                    Lottery Name:
                    <input type="text" size={10} className="lotto-address-input" value={inputs.name} onChange={handleChange.name}/>
                    </label>
                </div>
                <div>
                    <label>
                    Ticket Cost:
                    <input type="number" className="lotto-address-input" value={inputs.ticket_cost} onChange={handleChange.ticket_cost}/>
                    </label>
                </div>
                <div>
                    <label>
                    Minimum Entrants (≥ 5):
                    <input type="number" className="lotto-address-input" value={inputs.min_entrants} onChange={handleChange.min_entrants}/>
                    </label>
                </div>
                <div>
                    <label>
                    Maximum Entrants:
                    <input type="number" className="lotto-address-input" value={inputs.max_entrants} onChange={handleChange.max_entrants}/>
                    </label>
                </div>
                <div>
                    <label>
                    End Time:
                    <input type="number" className="lotto-address-input" value={inputs.end_time} onChange={handleChange.end_time}/>
                    </label>
                </div>
                <div>
                    <button onClick={setEndTimeWeek} className="lotto-address-input-button">
                    -Get Current Time +1 week-
                    </button>
                </div>
                <div>
                    <button onClick={setEndTimeDay} className="lotto-address-input-button">
                    -Get Current Time +1 day-
                    </button>
                </div>
                <div>
                    <button onClick={setEndTimeHour} className="lotto-address-input-button">
                    -Get Current Time +1 hour-
                    </button>
                </div>
                <div>
                    <label>
                    1st Place Rewards (% of pot):
                    <input type="number" className="lotto-address-input" value={inputs.rewards[0]} onChange={handleChange.rewards1}/>
                    </label>
                </div>
                <div>
                    <label>
                    2nd Place Rewards (% of pot):
                    <input type="number" className="lotto-address-input" value={inputs.rewards[1]} onChange={handleChange.rewards2}/>
                    </label>
                </div>
                <div>
                    <label>
                    3rd Place Rewards (% of pot):
                    <input type="number" className="lotto-address-input" value={inputs.rewards[2]} onChange={handleChange.rewards3}/>
                    </label>
                </div>
                <div>
                    <label>
                    4th Place Rewards (% of pot):
                    <input type="number" className="lotto-address-input" value={inputs.rewards[3]} onChange={handleChange.rewards4}/>
                    </label>
                </div>
                <div>
                    <label>
                    5th Place Rewards (% of pot):
                    <input type="number" className="lotto-address-input" value={inputs.rewards[4]} onChange={handleChange.rewards5}/>
                    </label>
                </div>
            </form>
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
                                Initialize Custom Lottery
                            </span>
                        </button>
                </div>
            </div>
        </div>
    );
};
