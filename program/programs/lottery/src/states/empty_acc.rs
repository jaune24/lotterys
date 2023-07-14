use anchor_lang::prelude::*;

#[account]
pub struct EmptyAcc {
    
}

impl EmptyAcc {
    pub fn len() -> usize {
        8
    }
}