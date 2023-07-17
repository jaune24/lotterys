use anchor_lang::prelude::*;

// only needed for config_vault-- need to get rid of this

#[account]
pub struct EmptyAcc {
    
}

impl EmptyAcc {
    pub fn len() -> usize {
        8
    }
}