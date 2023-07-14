use anchor_lang::prelude::*;
use crate::states::{Config, EmptyAcc};
use crate::errors::ErrorCode;
use crate::utils::random;
use crate::MINT_SEED;
use crate::C_VAULT_SEED;

#[derive(Accounts)]
pub struct DrawWinner<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub config: Account<'info, Config>,
    /// CHECK: just an account to store lamports
    #[account(mut, 
        seeds = [C_VAULT_SEED.as_ref(), config.authority.as_ref()], bump
    )]
    pub config_vault: UncheckedAccount<'info>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_,'info, DrawWinner<'info>>,
) -> Result<()> {
    if ctx.accounts.config.end_time < Clock::get().unwrap().unix_timestamp { // FIX: < needs to be flipped
        return Err(ErrorCode::EndTimeNotPassed.into());
    }
    if ctx.accounts.config.current_entrants < ctx.accounts.config.min_entrants {
        return Err(ErrorCode::NotEnoughEntrants.into());
    }
    if ctx.accounts.config.closed {
        return Err(ErrorCode::LottoAlrClosed.into());
    }

    // Get winning ticket numbers and derive the winning mints
    let mut winners: [u64; 5] = [0, 0, 0, 0, 0];
    let mut winning_mints: [Pubkey; 5] = [ctx.accounts.config.key(), ctx.accounts.config.key(), ctx.accounts.config.key(), ctx.accounts.config.key(), ctx.accounts.config.key()];
    for i in 0..5 as usize{
        // Get a random ticket number (not true random)
        let mut random = random::get_from_time(Clock::get().unwrap().unix_timestamp, i, ctx.accounts.config.current_entrants);

        while winners.iter().position(|&x| x == random) != None { // If random has already been chosen, increment until a ticket number is found that hasn't been picked
            random = (random % ctx.accounts.config.current_entrants) + 1;
        }
        [msg!("random: {}", random)];
        winners[i] = random;
        winning_mints[i] = Pubkey::find_program_address(&[MINT_SEED.as_ref(), ctx.accounts.config.key().as_ref(), &[winners[i] as u8]], ctx.program_id).0;
    }
    ctx.accounts.config.winners = winners;
    ctx.accounts.config.winning_mints = winning_mints;

    // Get the total pot for the lottery
    let rent_min = Rent::minimum_balance(&Rent::get()?, EmptyAcc::len());
    ctx.accounts.config.pot = ctx.accounts.config_vault.to_account_info().lamports() - rent_min;

    ctx.accounts.config.closed = true;
    Ok(())
}