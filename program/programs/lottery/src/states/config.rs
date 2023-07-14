use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub ticket_cost: u64,
    pub min_entrants: u64,
    pub max_entrants: u64,
    pub current_entrants: u64,
    pub end_time: i64,
    pub rewards: [u8; 5],
    pub winners: [u64; 5],
    pub winning_mints: [Pubkey; 5],
    pub closed: bool,
    pub vault: Pubkey,
    pub pot: u64,
}

impl Config {
    pub fn len() -> usize {
        8 + 32 + 8 + 8 + 8 + 8 + 8 + (5 * 1) + (5 * 8) + (5 * 32) + 1 + 32 + 8
    }
}