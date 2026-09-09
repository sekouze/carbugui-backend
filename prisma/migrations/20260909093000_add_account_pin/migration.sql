-- Quick-unlock PIN for DRIVER accounts, so a still-valid session doesn't
-- need a fresh OTP SMS on every app open (see /app/auth/pin/*).
ALTER TABLE `accounts`
  ADD COLUMN `pinHash` VARCHAR(191) NULL,
  ADD COLUMN `pinAttempts` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `pinLockedUntil` DATETIME(3) NULL;

-- PIN_RESET is used by /app/auth/pin/forgot to send the SMS confirmation
-- code that lets a driver set a new PIN without knowing the old one.
ALTER TABLE `otp_challenges` MODIFY `purpose` ENUM('SIGN_IN', 'PHONE_CHANGE', 'PIN_RESET') NOT NULL DEFAULT 'SIGN_IN';
