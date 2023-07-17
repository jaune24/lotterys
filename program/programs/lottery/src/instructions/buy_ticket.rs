use anchor_lang::{prelude::*, solana_program::sysvar::clock::Clock};
use anchor_spl::token::{mint_to, TokenAccount, Mint, Token, MintTo};
use anchor_spl::associated_token::AssociatedToken;
use mpl_token_metadata::instruction::create_metadata_accounts_v3;
use solana_program::program::invoke_signed;
use crate::MINT_SEED;
use crate::states::Config;
use crate::errors::ErrorCode;
use crate::CONFIG_SEED;
use crate::C_VAULT_SEED;

#[derive(Accounts)]
pub struct BuyTicket<'info> {
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
    
    #[account(
        init,
        payer = signer,
        mint::decimals = 0,
        mint::authority = ticket_mint,
        seeds = [MINT_SEED.as_ref(), config.key().as_ref(), &[(((config.current_entrants) + 1) as u8)]], bump
    )]
    pub ticket_mint: Account<'info, Mint>,

    /// CHECK: This is not dangerous because it will be checked in the inner instruction
    #[account(mut)]
    pub ticket_metadata: AccountInfo<'info>,

    #[account(
        init,
        payer = signer,
        associated_token::mint = ticket_mint,
        associated_token::authority = signer,
    )]
    pub ticket_account_signer: Account<'info, TokenAccount>,

    /// CHECK: This is not dangerous because it will be checked in the inner instruction
    pub metadata_program: AccountInfo<'info>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub token_program: Program<'info, Token>,

    pub system_program: Program<'info, System>,

    pub rent: Sysvar<'info, Rent>,
}

pub fn handler<'info>(
    ctx: Context<'_, '_, '_,'info, BuyTicket<'info>>,
) -> Result<()> {
    if ctx.accounts.config.end_time < Clock::get().unwrap().unix_timestamp {
        return Err(ErrorCode::PassedEndTime.into());
    }
    if ctx.accounts.config.max_entrants == ctx.accounts.config.current_entrants {
        return Err(ErrorCode::MaxEntrantsReached.into());
    }
    // ADD config.closed check

    // Transfer ticket cost to config_vault from the signer
    let ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.signer.key(),
        &ctx.accounts.config_vault.key(),
        ctx.accounts.config.ticket_cost,
    );
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.config_vault.to_account_info(),
        ],
    )?;


    // get ticket_mint seeds
    let config_key_seed = &ctx.accounts.config.key();

    let seeds = &[
        MINT_SEED.as_bytes().as_ref(),
        config_key_seed.as_ref(),
        &[(ctx.accounts.config.current_entrants + 1) as u8],
        &[*ctx.bumps.get("ticket_mint").unwrap()],
    ];
    let seeds = &[&seeds[..]];
    let signer_seeds = seeds;

    // Create metadata account for ticket
    let ix = create_metadata_accounts_v3(
        *ctx.accounts.metadata_program.to_account_info().key, // program_id,
        *ctx.accounts.ticket_metadata.to_account_info().key, // metadata_account,
        *ctx.accounts.ticket_mint.to_account_info().key, //mint,
        *ctx.accounts.ticket_mint.to_account_info().key, //mint_authority,
        *ctx.accounts.signer.to_account_info().key, //payer,
        *ctx.accounts.ticket_mint.to_account_info().key, //update_authority, ERR MAYBE
        String::from("LOTTO"), // name,
        String::from(format!("{}", ctx.accounts.config.current_entrants + 1)), // symbol,
        String::from("none"), // uri,
        None, // creators,
        0u16, //seller_fee_basis_points,
        false, // update_authority_is_signer,
        false, // is_mutable,
        None, // collection,
        None, // uses,
        None, // collection_details
    );
    invoke_signed(
        &ix,
        &[
            ctx.accounts.metadata_program.to_account_info().clone(), // Metadata program id
            ctx.accounts.ticket_metadata.to_account_info().clone(), // Metadata account
            ctx.accounts.ticket_mint.to_account_info().clone(), // Mint
            ctx.accounts.ticket_mint.to_account_info().clone(), // Mint Authority
            ctx.accounts.signer.to_account_info().clone(), // Payer
            ctx.accounts.ticket_mint.to_account_info().clone(), // Update Authority
            ctx.accounts.system_program.to_account_info().clone(), // System Program
            ctx.accounts.rent.to_account_info().clone(), // Rent Sysvar
        ],
        signer_seeds,
    )?;

    // Mint ticket to signer
    let mint_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.ticket_mint.to_account_info(),
            to: ctx.accounts.ticket_account_signer.to_account_info(),
            authority: ctx.accounts.ticket_mint.to_account_info(),
        },
        signer_seeds,
    );
    mint_to(mint_ctx, 1)?;

    ctx.accounts.config.current_entrants += 1; 

    Ok(())
}