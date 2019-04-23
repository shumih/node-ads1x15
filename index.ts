// javascript/node  rewrite of the Adafruit ads1x15 python library...
import * as I2C from 'i2c';

// Pointer Register
const ADS1015_REG_POINTER_MASK = 0x03;
const ADS1015_REG_POINTER_CONVERT = 0x00;
const ADS1015_REG_POINTER_CONFIG = 0x01;
const ADS1015_REG_POINTER_LOWTHRESH = 0x02;
const ADS1015_REG_POINTER_HITHRESH = 0x03;

// Config Register
const ADS1015_REG_CONFIG_OS_MASK = 0x8000;
const ADS1015_REG_CONFIG_OS_SINGLE = 0x8000; // Write: Set to start a single-conversion
const ADS1015_REG_CONFIG_OS_BUSY = 0x0000; // Read: Bit = 0 when conversion is in progress
const ADS1015_REG_CONFIG_OS_NOTBUSY = 0x8000; // Read: Bit = 1 when device is not performing a conversion
const ADS1015_REG_CONFIG_MUX_MASK = 0x7000;
const ADS1015_REG_CONFIG_MUX_DIFF_0_1 = 0x0000; // Differential P = AIN0, N = AIN1 (default)
const ADS1015_REG_CONFIG_MUX_DIFF_0_3 = 0x1000; // Differential P = AIN0, N = AIN3
const ADS1015_REG_CONFIG_MUX_DIFF_1_3 = 0x2000; // Differential P = AIN1, N = AIN3
const ADS1015_REG_CONFIG_MUX_DIFF_2_3 = 0x3000; // Differential P = AIN2, N = AIN3
const ADS1015_REG_CONFIG_MUX_SINGLE_0 = 0x4000; // Single-ended AIN0
const ADS1015_REG_CONFIG_MUX_SINGLE_1 = 0x5000; // Single-ended AIN1
const ADS1015_REG_CONFIG_MUX_SINGLE_2 = 0x6000; // Single-ended AIN2
const ADS1015_REG_CONFIG_MUX_SINGLE_3 = 0x7000; // Single-ended AIN3
const ADS1015_REG_CONFIG_PGA_MASK = 0x0e00;
const ADS1015_REG_CONFIG_PGA_6_144V = 0x0000; // +/-6.144V range
const ADS1015_REG_CONFIG_PGA_4_096V = 0x0200; // +/-4.096V range
const ADS1015_REG_CONFIG_PGA_2_048V = 0x0400; // +/-2.048V range (default)
const ADS1015_REG_CONFIG_PGA_1_024V = 0x0600; // +/-1.024V range
const ADS1015_REG_CONFIG_PGA_0_512V = 0x0800; // +/-0.512V range
const ADS1015_REG_CONFIG_PGA_0_256V = 0x0a00; // +/-0.256V range
const ADS1015_REG_CONFIG_MODE_MASK = 0x0100;
const ADS1015_REG_CONFIG_MODE_CONTIN = 0x0000; // Continuous conversion mode
const ADS1015_REG_CONFIG_MODE_SINGLE = 0x0100; // Power-down single-shot mode (default)
const ADS1015_REG_CONFIG_DR_MASK = 0x00e0;
const ADS1015_REG_CONFIG_DR_128SPS = 0x0000; // 128 samples per second
const ADS1015_REG_CONFIG_DR_250SPS = 0x0020; // 250 samples per second
const ADS1015_REG_CONFIG_DR_490SPS = 0x0040; // 490 samples per second
const ADS1015_REG_CONFIG_DR_920SPS = 0x0060; // 920 samples per second
const ADS1015_REG_CONFIG_DR_1600SPS = 0x0080; // 1600 samples per second (default)
const ADS1015_REG_CONFIG_DR_2400SPS = 0x00a0; // 2400 samples per second
const ADS1015_REG_CONFIG_DR_3300SPS = 0x00c0; // 3300 samples per second (also 0x00E0)
const ADS1115_REG_CONFIG_DR_8SPS = 0x0000; // 8 samples per second
const ADS1115_REG_CONFIG_DR_16SPS = 0x0020; // 16 samples per second
const ADS1115_REG_CONFIG_DR_32SPS = 0x0040; // 32 samples per second
const ADS1115_REG_CONFIG_DR_64SPS = 0x0060; // 64 samples per second
const ADS1115_REG_CONFIG_DR_128SPS = 0x0080; // 128 samples per second
const ADS1115_REG_CONFIG_DR_250SPS = 0x00a0; // 250 samples per second (default)
const ADS1115_REG_CONFIG_DR_475SPS = 0x00c0; // 475 samples per second
const ADS1115_REG_CONFIG_DR_860SPS = 0x00e0; // 860 samples per second
const ADS1015_REG_CONFIG_CMODE_MASK = 0x0010;
const ADS1015_REG_CONFIG_CMODE_TRAD = 0x0000; // Traditional comparator with hysteresis (default)
const ADS1015_REG_CONFIG_CMODE_WINDOW = 0x0010; // Window comparator
const ADS1015_REG_CONFIG_CPOL_MASK = 0x0008;
const ADS1015_REG_CONFIG_CPOL_ACTVLOW = 0x0000; // ALERT/RDY pin is low when active (default)
const ADS1015_REG_CONFIG_CPOL_ACTVHI = 0x0008; // ALERT/RDY pin is high when active
const ADS1015_REG_CONFIG_CLAT_MASK = 0x0004; // Determines if ALERT/RDY pin latches once asserted
const ADS1015_REG_CONFIG_CLAT_NONLAT = 0x0000; // Non-latching comparator (default)
const ADS1015_REG_CONFIG_CLAT_LATCH = 0x0004; // Latching comparator
const ADS1015_REG_CONFIG_CQUE_MASK = 0x0003;
const ADS1015_REG_CONFIG_CQUE_1CONV = 0x0000; // Assert ALERT/RDY after one conversions
const ADS1015_REG_CONFIG_CQUE_2CONV = 0x0001; // Assert ALERT/RDY after two conversions
const ADS1015_REG_CONFIG_CQUE_4CONV = 0x0002; // Assert ALERT/RDY after four conversions
const ADS1015_REG_CONFIG_CQUE_NONE = 0x0003; // Disable the comparator and put ALERT/RDY in high state (default)

// This is a javascript port of python, so use objects instead of dictionaries here
// These simplify and clean the code (avoid the abuse of if/elif/else clauses)
const spsADS1115 = {
  8: ADS1115_REG_CONFIG_DR_8SPS,
  16: ADS1115_REG_CONFIG_DR_16SPS,
  32: ADS1115_REG_CONFIG_DR_32SPS,
  64: ADS1115_REG_CONFIG_DR_64SPS,
  128: ADS1115_REG_CONFIG_DR_128SPS,
  250: ADS1115_REG_CONFIG_DR_250SPS,
  475: ADS1115_REG_CONFIG_DR_475SPS,
  860: ADS1115_REG_CONFIG_DR_860SPS,
};

const spsADS1015 = {
  128: ADS1015_REG_CONFIG_DR_128SPS,
  250: ADS1015_REG_CONFIG_DR_250SPS,
  490: ADS1015_REG_CONFIG_DR_490SPS,
  920: ADS1015_REG_CONFIG_DR_920SPS,
  1600: ADS1015_REG_CONFIG_DR_1600SPS,
  2400: ADS1015_REG_CONFIG_DR_2400SPS,
  3300: ADS1015_REG_CONFIG_DR_3300SPS,
};

// Dictionary with the programable gains

const pgaADS1x15 = {
  6144: ADS1015_REG_CONFIG_PGA_6_144V,
  4096: ADS1015_REG_CONFIG_PGA_4_096V,
  2048: ADS1015_REG_CONFIG_PGA_2_048V,
  1024: ADS1015_REG_CONFIG_PGA_1_024V,
  512: ADS1015_REG_CONFIG_PGA_0_512V,
  256: ADS1015_REG_CONFIG_PGA_0_256V,
};

enum AdsTypes {
  ADS1015 = 0x00,
  ADS1115,
}

// I2C for ADS1015/ADS1115
class Ads {
  public busy: boolean = false;

  private pga: keyof typeof pgaADS1x15 = 6144;
  private wire: typeof I2C;
  constructor(
    private ic: AdsTypes = AdsTypes.ADS1115,
    private address: number = 0x48,
    private device: string = '/dev/I2C-1'
  ) {
    this.wire = new I2C(address, { device });
  }

  // Gets a single-ended ADC reading from the specified channel in mV. \
  // The sample rate for this mode (single-shot) can be used to lower the noise \
  // (low sps) or to lower the power consumption (high sps) by duty cycling, \
  // see datasheet page 14 for more info. \
  // The pga must be given in mV, see page 13 for the supported values.
  public readADCSingleEnded(
    channel: number = 0,
    pga: keyof typeof pgaADS1x15 = this.pga,
    sps: keyof typeof spsADS1015 & keyof typeof spsADS1115 = 250,
    callback: (err: Error | null, value?: number) => void
  ): void {
    if (!this.busy) {
      if (channel > 3 || channel < 0) {
        this.busy = false;
        callback(new Error('Error: Channel must be between 0 and 3'));
      }

      // Disable comparator, Non-latching, Alert/Rdy active low
      // traditional comparator, single-shot mode
      let config =
        ADS1015_REG_CONFIG_CQUE_NONE |
        ADS1015_REG_CONFIG_CLAT_NONLAT |
        ADS1015_REG_CONFIG_CPOL_ACTVLOW |
        ADS1015_REG_CONFIG_CMODE_TRAD |
        ADS1015_REG_CONFIG_MODE_SINGLE;

      // Set sample per seconds, defaults to 250sps
      // If sps is in the dictionary (defined in init) it returns the value of the constant
      // othewise it returns the value for 250sps. This saves a lot of if/elif/else code!

      if (this.ic == AdsTypes.ADS1015) {
        if (spsADS1015[sps]) {
          config |= spsADS1015[sps];
        } else callback(new Error('ADS1x15: Invalid sps specified'));
      } else {
        if (!spsADS1115[sps]) {
          this.busy = false;
          callback(new Error('ADS1x15: Invalid sps specified'));
        } else {
          config |= spsADS1115[sps];
        }
      }
      // Set PGA/voltage range, defaults to +-6.144V
      if (!pgaADS1x15[pga]) {
        this.busy = false;
        callback(new Error('ADS1x15: Invalid pga specified'));
      } else {
        config |= pgaADS1x15[pga];
      }
      this.pga = pga;

      // Set the channel to be converted
      if (channel == 3) {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_3;
      } else if (channel == 2) {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_2;
      } else if (channel == 1) {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_1;
      } else {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_0;
      }

      // Set 'start single-conversion' bit
      config |= ADS1015_REG_CONFIG_OS_SINGLE;

      // Write config register to the ADC
      let bytes = [(config >> 8) & 0xff, config & 0xff];
      this.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, (err: Error | null) => {
        if (err) {
          this.busy = false;
          console.log("We've got an Error, Lance Constable Carrot!: " + err.toString());
          callback(err);
        }

        // Wait for the ADC conversion to complete
        // The minimum delay depends on the sps: delay >= 1s/sps
        // We add 1ms to be sure
        const delay = 1000 / sps + 1;
        setTimeout(() => {
          // Read the conversion results
          this.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, (err: Error | null, res: Buffer) => {
            if (err) {
              this.busy = false;
              console.log("We've got an Error, Lance Constable Carrot!: " + err.toString());
              callback(err);
            }
            if (this.ic == AdsTypes.ADS1015) {
              // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
              // console.log('res0 = ' + res[0] + ', res1: ' + res[1]);

              let data = ((((res[0] << 8) | (res[1] & 0xff)) >> 4) * this.pga) / 2048.0;
              this.busy = false;
              callback(null, data);
            } else {
              // Return a mV value for the ADS1115
              // (Take signed values into account as well)
              let data = -0.1;
              const val = (res[0] << 8) | res[1];
              if (val > 0x7fff) {
                data = ((val - 0xffff) * pga) / 32768.0;
              } else {
                data = (((res[0] << 8) | res[1]) * pga) / 32768.0;
              }
              this.busy = false;
              callback(null, data);
            }
          });
        }, delay);
      });
    } else {
      callback(new Error('ADC is busy...'));
    }
  }

  // Starts the continuous conversion mode and returns the first ADC reading
  // in mV from the specified channel.
  // The sps controls the sample rate.
  // The pga must be given in mV, see datasheet page 13 for the supported values.
  // Use getLastConversionResults() to read the next values and
  // stopContinuousConversion() to stop converting.

  public startContinuousConversion(
    channel: number = 0,
    pga: keyof typeof pgaADS1x15 = this.pga,
    sps: keyof typeof spsADS1015 & keyof typeof spsADS1115 = 250,
    callback: (err: Error | null, value?: number) => void
  ): void {
    if (!this.busy) {
      this.busy = true;

      // Default to channel 0 with invalid channel, or return -1?
      if (channel > 3) {
        this.busy = false;
        callback(new Error('ADS1x15: Invalid channel specified, Lance Corporal Carrot!'));
      }

      // Disable comparator, Non-latching, Alert/Rdy active low
      // traditional comparator, continuous mode
      // The last flag is the only change we need, page 11 datasheet

      let config =
        ADS1015_REG_CONFIG_CQUE_NONE |
        ADS1015_REG_CONFIG_CLAT_NONLAT |
        ADS1015_REG_CONFIG_CPOL_ACTVLOW |
        ADS1015_REG_CONFIG_CMODE_TRAD |
        ADS1015_REG_CONFIG_MODE_CONTIN;

      // Set sample per seconds, defaults to 250sps
      // If sps is in the dictionary (defined in init()) it returns the value of the constant
      // othewise it returns the value for 250sps. This saves a lot of if/elif/else code!
      if (this.ic == AdsTypes.ADS1015) {
        config |= spsADS1015[sps];
      } else {
        if (!spsADS1115[sps]) {
          this.busy = false;
          callback(new Error('ADS1x15: Invalid sps specified'));
        } else {
          config |= spsADS1115[sps];
        }
      }
      // Set PGA/voltage range, defaults to +-6.144V
      if (!pgaADS1x15[pga]) {
        this.busy = false;
        callback(new Error('ADS1x15: Invalid pga specified'));
      } else {
        config |= pgaADS1x15[pga];
      }
      this.pga = pga;

      // Set the channel to be converted
      if (channel == 3) {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_3;
      } else if (channel == 2) {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_2;
      } else if (channel == 1) {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_1;
      } else {
        config |= ADS1015_REG_CONFIG_MUX_SINGLE_0;
      }
      // Set 'start single-conversion' bit to begin conversions
      // No need to change this for continuous mode!
      config |= ADS1015_REG_CONFIG_OS_SINGLE;

      // Write config register to the ADC
      // Once we write the ADC will convert continously
      // we can read the next values using getLastConversionResult

      let bytes = [(config >> 8) & 0xff, config & 0xff];
      this.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, (err: Error) => {
        if (err) {
          this.busy = false;
          callback(new Error(`We've got an Error, Lance Constable Carrot!: ${err}`));
        }
      });
      // Wait for the ADC conversion to complete
      // The minimum delay depends on the sps: delay >= 1s/sps
      // We add 1ms to be sure

      const delay = 1000 / sps + 1;
      setTimeout(() => {
        this.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, (err: Error, res: Buffer) => {
          if (this.ic == AdsTypes.ADS1015) {
            // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
            let data = ((((res[0] << 8) | (res[1] & 0xff)) >> 4) * pga) / 2048.0;
            callback(null, data);
          } else {
            // Return a mV value for the ADS1115
            // (Take signed values into account as well)
            let data = -1;
            const val = (res[0] << 8) | res[1];
            if (val > 0x7fff) {
              data = ((val - 0xffff) * pga) / 32768.0;
            } else {
              data = (((res[0] << 8) | res[1]) * pga) / 32768.0;
            }
            callback(null, data);
          }
        });
      }, delay);
    } else {
      callback(new Error('ADC is busy...'));
    }
  }

  // Stops the ADC's conversions when in continuous mode \
  // and resets the configuration to its default value."

  public stopContinuousConversion(callback: (error: Error) => void): void {
    // Write the default config register to the ADC
    // Once we write, the ADC will do a single conversion and
    //  enter power-off mode.
    let config = 0x8583; // Page 18 datasheet.
    let bytes = [(config >> 8) & 0xff, config & 0xff];
    this.wire.writeBytes(ADS1015_REG_POINTER_CONFIG, bytes, (err: Error) => {
      this.busy = false;
      if (err) {
        callback(err);
      } else return true;
    });
  }

  // Returns the last ADC conversion result in mV

  public getLastConversionResults(callback: (err: Error | null, value?: number) => void): void {
    // Read the conversion results
    this.wire.readBytes(ADS1015_REG_POINTER_CONVERT, 2, (err: Error, res: Buffer) => {
      if (this.ic == AdsTypes.ADS1015) {
        // Shift right 4 bits for the 12-bit ADS1015 and convert to mV
        const data = ((((res[0] << 8) | (res[1] & 0xff)) >> 4) * this.pga) / 2048.0;
        callback(null, data);
      } else {
        // Return a mV value for the ADS1115
        // (Take signed values into account as well)
        let data = -1;
        const val = (res[0] << 8) | res[1];
        if (val > 0x7fff) {
          data = ((val - 0xffff) * this.pga) / 32768.0;
        } else {
          data = (((res[0] << 8) | res[1]) * this.pga) / 32768.0;
        }

        callback(null, data);
      }
    });
  }
}

export default Ads;
