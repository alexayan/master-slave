import * as os from 'os';

export default function getHost() {
  let address = process.env.IPADDRESS;
  if (!address) {
      const interfaces = os.networkInterfaces();
      const addresses = [];
      for (const key in interfaces) {
          if (interfaces.hasOwnProperty(key)) {
              for (const addressData of interfaces[key]) {
                  if (addressData.family === 'IPv4' && !addressData.internal) {
                      addresses.push(addressData.address);
                  }
              }
          }
      }
      for (const add of addresses) {
          if (add.startsWith('10.')) {
              address = add;
              break;
          }
      }
  }
  return address;
}
