use anchor_lang::prelude::*;
use crate::states::Config;
use crate::errors::ErrorCode;
use anchor_spl::token::{TokenAccount, Mint, Token, burn, Burn, approve, Approve, close_account, CloseAccount};
use mpl_token_metadata::state::{TokenMetadataAccount, Metadata};
use crate::CONFIG_SEED;
use crate::C_VAULT_SEED;
use crate::MINT_SEED;

#[derive(Accounts)]
pub struct RedeemTicket<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(mut,
        seeds = [CONFIG_SEED.as_ref(), config.authority.key().as_ref()], bump
    )]
    pub config: Account<'info, Config>,

    /// CHECK: just an account to store lamports
    #[account(mut,
        seeds = [C_VAULT_SEED.as_ref(), config.authority.as_ref()], bump
    )]
    pub config_vault: UncheckedAccount<'info>,

    #[account(mut)]
    pub ticket_mint: Account<'info, Mint>,

    /// CHECK: This is not dangerous because it will be checked in the inner instruction
    #[account(mut)]
    pub ticket_metadata: AccountInfo<'info>,

    #[account(
        mut,
        token::authority = signer,
    )]
    pub ticket_account_signer: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_,'info, RedeemTicket<'info>>,
) -> Result<()> {
    let metadata: Metadata = Metadata::from_account_info(&ctx.accounts.ticket_metadata.to_account_info())?;
    [msg!("metadata.symbol (ticket_num):{}", metadata.data.symbol)];
    let ticket_number = (metadata.data.symbol).trim_matches(|c: char| c.is_whitespace() || c=='\0').parse::<u64>().unwrap();
    let signer_mint = ctx.accounts.ticket_account_signer.mint;

    if metadata.mint != ctx.accounts.ticket_mint.key() {
        return Err(ErrorCode::MismatchedMetadata.into());
    }
    if signer_mint != ctx.accounts.ticket_mint.key() {
        return Err(ErrorCode::MintsDontMatch.into()); 
    }
    if !ctx.accounts.config.closed {
        return Err(ErrorCode::LottoNotClosed.into());
    }
    if ctx.accounts.ticket_account_signer.amount != 1 {
        return Err(ErrorCode::NoTickets.into());
    }

    // burn ticket
    let config_key_seed = &ctx.accounts.config.key();
    let ticket_num_seed = &[ticket_number as u8];
    let mint_bump = Pubkey::find_program_address(&[MINT_SEED.as_ref(), config_key_seed.as_ref(), ticket_num_seed], ctx.program_id).1;
    [msg!("derived mint = {}", Pubkey::find_program_address(&[MINT_SEED.as_ref(), config_key_seed.as_ref(), ticket_num_seed], ctx.program_id).0)];
    [msg!("provided mint = {}", ctx.accounts.ticket_mint.key())];

    // Get signer seeds for ticket_mint
    let seeds = &[
        MINT_SEED.as_bytes().as_ref(),
        config_key_seed.as_ref(),
        ticket_num_seed,
        &[mint_bump],
    ];
    let seeds = &[&seeds[..]];
    let signer_seeds = seeds;

    // need to delegate to mint first
    let approve_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(),
        Approve{
            to: ctx.accounts.ticket_account_signer.to_account_info(),
            delegate: ctx.accounts.ticket_mint.to_account_info(),
            authority: ctx.accounts.signer.to_account_info(),
        },
    );
    approve(approve_ctx, 1)?;

    // burn ix
    let burn_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
        Burn {
            mint: ctx.accounts.ticket_mint.to_account_info(),
            from: ctx.accounts.ticket_account_signer.to_account_info(),
            authority: ctx.accounts.ticket_mint.to_account_info(),
        },
        signer_seeds,
    );
    burn(burn_ctx, 1)?;

    // close ticket account
    let cpi_tkt_acc = CloseAccount {
        account: ctx.accounts.ticket_account_signer.to_account_info(),
        destination: ctx.accounts.signer.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let close_tkt_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_tkt_acc);
    close_account(close_tkt_ctx)?;

    // determine if ticket is a winner
    let winning_mints: [Pubkey; 5] = ctx.accounts.config.winning_mints;
    let result = winning_mints.iter().position(|&x| x == signer_mint);

    if result != None { // ticket is a winner
        // determine winnings
        let index = result.unwrap();
        let winnings = ((ctx.accounts.config.rewards[index] as f64 / 100 as f64) * (ctx.accounts.config.pot) as f64) as u64;
        [msg!("winnings = {}", winnings)];

        // Transfer winnings to signer
        let from = ctx.accounts.config_vault.to_account_info();
        let to = ctx.accounts.signer.to_account_info();

        **from.try_borrow_mut_lamports()? -= winnings;
        **to.try_borrow_mut_lamports()? += winnings;
    }

    Ok(())
}