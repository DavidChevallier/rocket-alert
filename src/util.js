import queryString from "query-string";

/*
 * The duration in milliseconds of the css transition for real-time alert
 */
const REAL_TIME_ALERT_TRANSITION_DURATION = 400;

/*
 * The interval in milliseconds in which real-time alerts are processed from the alert queue
 * Display time + total transition time;
 */
const REAL_TIME_ALERT_THROTTLE_DURATION = 5000;

/*
 * The duration in milliseconds in which a real-time alert is displayed, not including css transition time
 */
const REAL_TIME_ALERT_DISPLAY_DURATION =
  REAL_TIME_ALERT_THROTTLE_DURATION - REAL_TIME_ALERT_TRANSITION_DURATION * 2;

/*
 * Checks whether the Alert Mode query string is set. Dev only.
 */
const isAlertModeQueryString = () => {
  const query = queryString.parse(window.location.search);
  const queryKeys = Object.keys(query);
  if (queryKeys.length !== 1) {
    return false;
  }
  return queryKeys[0].toLowerCase() === "mode" &&
    query[queryKeys[0]] === "alert"
    ? true
    : false;
};

const Util = {
  isDev: () => process.env.NODE_ENV === "development",
  isAlertModeQueryString,
  REAL_TIME_ALERT_TRANSITION_DURATION,
  REAL_TIME_ALERT_DISPLAY_DURATION,
  REAL_TIME_ALERT_THROTTLE_DURATION,
};

export default Util;
