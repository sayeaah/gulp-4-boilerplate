/**
 * Function for multiple events
 */
const multipleEvents = (el, eventNames, listener) => {
  const events = eventNames.split(' ');

  events.forEach(event => {
    el.addEventListener(event, listener, false);
  });
};
