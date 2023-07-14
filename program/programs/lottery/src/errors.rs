use anchor_lang::error_code; 

#[error_code]
#[derive(PartialEq)]
pub enum ErrorCode {
    #[msg("Rewards array does not add up to 100")] // custom program error: 0x1770 (6000)
    BadRewardsArray, 

    #[msg("End time should be after the current time")] // custom program error: 0x1771 (6001)
    BadEndTime,

    #[msg("Min entranst should be >= 5")] // custom program error: 0x1772 (6002)
    BadMinEntrants,

    #[msg("Max entrants has been reached")] // custom program error: 0x1773 (6003)
    MaxEntrantsReached,

    #[msg("Cannot buy tickets passed end time")] // custom program error: 0x1774 (6004)
    PassedEndTime,

    #[msg("Cannot end lotter before end time")] // custom program error: 0x1775 (6005)
    EndTimeNotPassed,

    #[msg("Lottery winners have already been drawn")] // custom program error: 0x1776 (6006)
    LottoAlrClosed,

    #[msg("Lottery winners have not been drawn yet, cannot redeem")] // custom program error: 0x1777 (6007)
    LottoNotClosed,

    #[msg("Mint of token account doesn't match the provided mint")] // custom program error: 0x1778 (6008)
    MintsDontMatch,

    #[msg("No tickets found in the provided ticket account")] // custom program error: 0x1779 (6009)
    NoTickets,

    #[msg("Only lotto config.authority can rug pull")] // custom program error: 0x177a (6010)
    MismatchedAuthority,

    #[msg("Metadata doesn't correspond to given ticket_mint")] // custom program error: 0x177b (6011)
    MismatchedMetadata,
    
    #[msg("Lotto can't be closed until min_entrants is satisfied")] // custom program error: 0x177c (6012)
    NotEnoughEntrants,
}