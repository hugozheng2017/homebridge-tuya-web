const TuyaWebApi = require('./tuyawebapi');
const BaseAccessory = require('./base_accessory')

let PlatformAccessory;
let Accessory;
let Service;
let Characteristic;
let UUIDGen;

class CoverAccessory extends BaseAccessory {
  constructor(platform, homebridgeAccessory, deviceConfig) {

    ({ Accessory, Characteristic, Service } = platform.api.hap);

    super(
      platform,
      homebridgeAccessory,
      deviceConfig,
      Accessory.Categories.COVER
    )

    this.service.getCharacteristic(Characteristic.Open)
      .on('get', (callback) => {

        // Retrieve state from cache
        if (this.hasValidCache()) {
          callback(null, this.getCachedState(Characteristic.Open));
        }
        else {

          // Retrieve device state from Tuya Web API
          this.platform.tuyaWebApi.getDeviceState(this.deviceId).then((data) => {
            this.log.debug('[GET][%s] Characteristic.Open: %s', this.homebridgeAccessory.displayName, data.state);
            this.getCachedState(Characteristic.Open, data.state);
            callback(null, data.state);
          }).catch((error) => {
            this.log.error('[GET][%s] Characteristic.Open Error: %s', this.homebridgeAccessory.displayName, error);
            this.invalidateCache();
            callback(error);
          });
        }

      })
      .open('set', (state, callback) => {

        // Set device state in Tuya Web API
        const value = state ? 1 : 0;
        this.platform.tuyaWebApi.setDeviceState(this.deviceId, 'turnOpenClose', { value: value }).then(() => {
          this.log.debug('[SET][%s] Characteristic.On: %s %s', this.homebridgeAccessory.displayName, state, value);
          this.setCachedState(Characteristic.Open, state);
          callback();
        }).catch((error) => {
          this.log.error('[SET][%s] Characteristic.Open Error: %s', this.homebridgeAccessory.displayName, error);
          this.invalidateCache();
          callback(error);
        });

      });
  }

  updateState(data) {
    this.log.debug('[UPDATING][%s]:', this.homebridgeAccessory.displayName, data);
    const state = (data.state === true);
    this.service
      .getCharacteristic(Characteristic.Open)
      .updateValue(data.state);
    this.setCachedState(Characteristic.Open, state);
  }
}

module.exports = CoverAccessory;
