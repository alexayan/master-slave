export default {
  info(message) {
    console.log('\n' + new Date().toLocaleString() + ' ' + '[info] ' + message);
  },
  error(e) {
    console.error(e);
  }
}
