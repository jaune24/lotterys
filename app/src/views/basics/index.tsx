
import { FC, useEffect, useState } from "react";
import { SignMessage } from '../../components/SignMessage';
import { InitializeLottery } from '../../components/InitializeLottery';
import { SendVersionedTransaction } from '../../components/SendVersionedTransaction';
import { BuyTicket } from '../../components/BuyTicket';
import { RugPull } from '../../components/RugPull';
import { DrawWinners } from '../../components/DrawWinners';
import { RedeemTickets } from '../../components/RedeemTickets';
import { FindLottery } from '../../components/FindLottery';
import { PublicKey } from "@solana/web3.js";

export interface LPProps {
  lottoPubkey: PublicKey,
  onLottoPubkeyUpdated: (pubkey: PublicKey) => void;
}

export const BasicsView: FC = ({ }) => {
  const [lottoPubkey, onLottoPubkeyUpdated] = useState(new PublicKey(0));
  useEffect(() => {
    console.log(lottoPubkey, '- Has changed')
  },[lottoPubkey])

  return (
    <div className="md:hero mx-auto p-4">
      <div className="md:hero-content flex flex-col">
        <h1 className="text-center text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mt-10 mb-8">
          SOLottery
        </h1>
        <p>
          Lottery Address: {lottoPubkey.toString()}
        </p>
        <div className="text-center">
          {/* <SignMessage />
          <SendVersionedTransaction /> */}
          <FindLottery lottoPubkey={lottoPubkey} onLottoPubkeyUpdated={onLottoPubkeyUpdated} />
          <InitializeLottery lottoPubkey={lottoPubkey} onLottoPubkeyUpdated={onLottoPubkeyUpdated}/>
          <BuyTicket lottoPubkey={lottoPubkey} onLottoPubkeyUpdated={onLottoPubkeyUpdated}/>
          <DrawWinners lottoPubkey={lottoPubkey} onLottoPubkeyUpdated={onLottoPubkeyUpdated}/>
          <RedeemTickets lottoPubkey={lottoPubkey} onLottoPubkeyUpdated={onLottoPubkeyUpdated}/>
          <RugPull lottoPubkey={lottoPubkey} onLottoPubkeyUpdated={onLottoPubkeyUpdated}/>
        </div>
      </div>
    </div>
  );
};
