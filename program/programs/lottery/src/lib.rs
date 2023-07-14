// Lottery Solana Program
// Written by: Jacob Aune 06/2023

use anchor_lang::prelude::*;
use crate::instructions::*;


declare_id!("2AejTiqCJ5QxE7VsdF2WhGBVDrCeXmuubjni7jV8DbM7");

#[doc(hidden)]
mod instructions; 
#[doc(hidden)]
mod states;
#[doc(hidden)]
mod errors; 
#[doc(hidden)]
mod utils; 

const MINT_SEED: &str = "MintSeed";
const CONFIG_SEED: &str = "ConfigSeed";
const C_VAULT_SEED: &str = "CVaultSeed";

#[program]
pub mod lottery {
    use super::*;

    /// Initializes the configuration account for the lottery, it contains ticket_cost, min_entrants, 
    /// end_time, rewards.
    /// 
    /// ### Parameters
    /// ticket_cost: number of lamports needed to be sent to enter the lottery
    /// min_entrants: number of entrants needed to draw the winners of the lottery
    /// max_entrants: max number of entrants allowed in the lottery
    /// end_time: time that the lottery stops selling tickets, can only draw winner after this time
    /// rewards: an array with length 5 that represents the percent of the pot each of the 5 winners recieves
    /// 
    /// ### Special Errors 
    /// BadRewardsArray: sum of 5 entries in rewards array is >= 100
    /// BadEndTime: end_time is < current time
    /// BadMinEntrants: min_entrants < 5
    /// Transaction Fails: each address can only create 1 lottery
    pub fn initialize<'info>(
        ctx: Context<'_, '_, '_, 'info, Initialize<'info>>,
        ticket_cost: u64,
        min_entrants: u64,
        max_entrants: u64,
        end_time: i64,
        rewards: [u8; 5],
    ) -> Result<()> {
        initialize::handler(ctx, ticket_cost, min_entrants, max_entrants, end_time, rewards)
    }

    /// Lottery players call this function to buy a lottery ticket. They will recieve a token, each with a unique mint.
    /// The mint address is a PDA using "MintSeed", config account pubkey, ticket number (current entrants + 1) as seeds.
    /// Note: ticket numbers start at 1
    /// 
    /// ### Parameters
    /// NONE
    /// 
    /// ### Special Errors 
    /// PassedEndTime: Cannot buy ticket passed the end time
    /// MaxEntrantsReached: The maximum number of people have already entered the lottery
    pub fn buy_ticket<'info>(ctx: Context<'_, '_, '_, 'info, BuyTicket<'info>>) -> Result<()> {
        buy_ticket::handler(ctx)
    }

    /// Anybody can call this function to draw the winners of the lottery, given that the end_time has been reached. Not true random.
    /// 
    /// ### Parameters
    /// NONE
    /// 
    /// ### Special Errors 
    /// EndTimeNotPassed: Cannot draw winners before end_time
    /// LottoAlrClosed: winners have already been drawn
    pub fn draw_winners<'info>(ctx: Context<'_, '_, '_, 'info, DrawWinner<'info>>) -> Result<()> {
        draw_winner::handler(ctx)
    }

    /// Call this function to redeem your lottery ticket, the signer will be sent the proper amount of winnings (or nothing). Win or lose,
    /// your ticket token will be burned. 
    /// 
    /// ### Parameters
    /// NONE
    /// 
    /// ### Special Errors 
    /// LottoNotClosed: Cannot redeem ticket if winners have not been drawn
    /// MintsDontMatch: Mint of token account doesn't match provided mint
    /// NoTickets: You do not have any tickets in the specified ticket account
    pub fn redeem_ticket<'info>(ctx: Context<'_, '_, '_, 'info, RedeemTicket<'info>>) -> Result<()> {
        redeem_ticket::handler(ctx)
    }

    /// This function closes the config and config_vault PDAs. Essentially if the lotto authority calls this they steal all lotto funds.
    /// And the lotto is over, data is gone. 
    /// 
    /// ### Parameters
    /// NONE
    /// 
    /// ### Special Errors 
    /// MismatchedAuthority: Only lotto config.authority can rug pull
    pub fn rug_pull<'info>(ctx: Context<'_, '_, '_, 'info, RugPull<'info>>) -> Result<()> {
        rug_pull::handler(ctx)
    }
}


