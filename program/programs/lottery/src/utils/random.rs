use solana_program::hash;

pub fn get_from_time(time: i64, i: usize, current_entrants: u64) -> u64 { // not true random, would be better to use slot hash also but SlotHashes sysvar pubkey was not recognoized (fix this)
    return ((u64::from_be_bytes(hash::hash(&[(time + (i as i64)) as u8]).to_bytes()[0..8].try_into().unwrap())) % current_entrants) + 1;
}