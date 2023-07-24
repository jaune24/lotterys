use anchor_lang::{prelude::*, solana_program::sysvar::clock::Clock};
use crate::states::{Config, EmptyAcc};
use crate::errors::ErrorCode;
use crate::CONFIG_SEED;
use crate::C_VAULT_SEED;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init, 
        payer = signer, 
        space = Config::len(),
        seeds = [CONFIG_SEED.as_ref(), signer.key().as_ref()], bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: just an account to store lamports, not proper or necessary just testing some things out
    #[account(init,
        space = EmptyAcc::len(),
        payer = signer,
        seeds = [C_VAULT_SEED.as_ref(), signer.key().as_ref()], bump
    )]
    pub config_vault: Account<'info, EmptyAcc>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_,'info, Initialize<'info>>,
    name: String,
    ticket_cost: u64,
    min_entrants: u64,
    max_entrants: u64,
    end_time: i64,
    rewards: [u8; 5],
) -> Result<()> {
    let r_sum: u8 = rewards.iter().sum();
    msg!(format!("r_sum = {}",r_sum).as_str());
    if r_sum > 100 {
        return Err(ErrorCode::BadRewardsArray.into());
    }
    msg!(format!("curr_time = {}", Clock::get().unwrap().unix_timestamp).as_str());
    msg!(format!("end_time = {}", end_time).as_str());
    if end_time < Clock::get().unwrap().unix_timestamp {
        return Err(ErrorCode::BadEndTime.into());
    }
    if min_entrants < 5 {
        return Err(ErrorCode::BadMinEntrants.into());
    }
    if name.len() != 10 {
        return  Err(ErrorCode::NameLengthErr.into());
    }

    let name_u8: [u8; 10] = name.as_bytes().try_into().unwrap_or([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.signer.key();
    config.name = name_u8;
    config.ticket_cost = ticket_cost;
    config.min_entrants = min_entrants;
    config.max_entrants = max_entrants;
    config.current_entrants = 0;
    config.end_time = end_time;
    config.rewards = rewards;
    config.closed = false;
    config.vault = ctx.accounts.config_vault.key();

    Ok(())
}