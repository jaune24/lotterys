use anchor_lang::prelude::*;
use crate::CONFIG_SEED;
use crate::C_VAULT_SEED;
use crate::states::{Config, EmptyAcc};
use crate::errors::ErrorCode;

#[derive(Accounts)]
pub struct RugPull<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        seeds = [CONFIG_SEED.as_ref(), config.authority.key().as_ref()], bump,
        close = signer,
    )]
    pub config: Account<'info, Config>,

    #[account(mut, 
        seeds = [C_VAULT_SEED.as_ref(), config.authority.as_ref()], bump,
        close = signer,
    )]
    pub config_vault: Account<'info, EmptyAcc>,

    pub system_program: Program<'info, System>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_,'info, RugPull<'info>>,
) -> Result<()> {
    if *ctx.accounts.signer.key != ctx.accounts.config.authority {
        return Err(ErrorCode::MismatchedAuthority.into());
    }
    Ok(())
}