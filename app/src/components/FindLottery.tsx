import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { FC, useState } from "react"
import { notify } from "utils/notifications";
import { LPProps } from 'views/basics';
import { deserializeUnchecked } from 'borsh'

import idl from "../../../program/target/idl/lottery.json";
import { BN } from "@coral-xyz/anchor";
import { PROGRAM_ID } from "../constants";

// class Config {
//     authority: PublicKey;
//     ticketCost: BN;
//     minEntrants: BN;
//     maxEntrants: BN;
//     currentEntrants: BN;
//     endTime: BN;
//     rewards: number[];
//     winners: BN[];
//     winningMints: PublicKey[];
//     closed: 1 | 0;
//     vault: PublicKey;
//     pot: BN;
// }


export const FindLottery: FC<LPProps> = ({lottoPubkey, onLottoPubkeyUpdated}) => {
    const [state, setState] = useState({value: ''});

    const { connection } = useConnection();

    const handleSubmit = (async (event) => {
        event.preventDefault();
        let lottoPK;
        try {
            lottoPK = new PublicKey(state.value);
            const lottoAccountInfo = await connection.getAccountInfo(lottoPK);
            console.log(lottoAccountInfo);
            console.log(lottoAccountInfo.data.length);
            console.log(lottoAccountInfo.owner.toString());
            console.log(PROGRAM_ID.toString());
            if (lottoAccountInfo.owner.toString() != PROGRAM_ID.toString()) {
                throw("account not owned by lottery program");
            }
            if (lottoAccountInfo.data.length != 326) {
                throw("account not a config account");
            }
            // const schema = new Map([[Config, idl.accounts[0].type]]);
            // const lottoAccount = deserializeUnchecked(schema, Config, lottoAccountInfo.data);
            // console.log(lottoAccount);

            onLottoPubkeyUpdated(lottoPK);
        } catch (error: any){
            notify({ type: 'error', message: `not a valid lottery address`, description: error?.message, txid: 'none' });
            console.log('error', `not a valid lottery address ${error?.message}`, 'none');
        };

    })

    const handleChange = (event) => {
        setState({value: event.target.value});
    }

    return (
        <form onSubmit={handleSubmit}>
            <div>
            <label>
            Search Lottery by Address:
            <input type="text" value={state.value} onChange={handleChange} size={40} className="lotto-address-input"/>
            </label>
            </div>
            <div>
            <button onClick={handleSubmit} className="lotto-address-input-button">
                -Search-
            </button>
            </div>
        </form>
    )
}