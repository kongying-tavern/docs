export const isSafari = () => {
  var ua = navigator.userAgent.toLowerCase()
  if (
    ua.indexOf('applewebkit') > -1 &&
    ua.indexOf('mobile') > -1 &&
    ua.indexOf('safari') > -1 &&
    ua.indexOf('linux') === -1 &&
    ua.indexOf('android') === -1 &&
    ua.indexOf('chrome') === -1 &&
    ua.indexOf('ios') === -1 &&
    ua.indexOf('browser') === -1
  ) {
    return true
  } else {
    return false
  }
}
