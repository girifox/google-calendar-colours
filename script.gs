// original author and instructions  https://mathiasw.medium.com/automate-your-google-calendar-coloring-4e7b15ed5560
// /* Written by Mathias Wagner www.linkedin.com/in/mathias-wagner */
//
// this version includes customisations for Giri Fox, working at Canonical. Nothing confidential, just refers to my team and the keywords we use in meeting invites
//
// Global debug setting
// true: print info for every event
// false: print info for only newly colorized event
const DEBUG = false


/* Entry for the whole colorizing magic.
   Select this function when deploying it and assigning a trigger function
*/
function colorizeCalendar() {
 
  const pastDays = 1 // looking 1 day back to catch last minute changes
  const futureDays = 7 * 4 // looking 4 weeks into the future
 
  const now       = new Date()
  const startDate = new Date(now.setDate(now.getDate() - pastDays))
  const endDate   = new Date(now.setDate(now.getDate() + futureDays))
  // Extracting the domain of your email, e.g. company.com
  const myOrg     = CalendarApp.getDefaultCalendar().getName().split("@")[1];
 
  // Get all calender events within the defined range
  // For now only from the default calendar
  var calendarEvents = CalendarApp.getDefaultCalendar().getEvents(startDate, endDate)


  if (DEBUG) {
   console.log("Calendar default org: " + myOrg)
  }


  // Walk through all events, check and colorize
  for (var i=0; i<calendarEvents.length; i++) {


    // Skip for better performance, else go to colorizing below
   if (skipCheck(calendarEvents[i])) {
      continue
    }
    colorizeByRegex(calendarEvents[i], myOrg)
  }
}


/* Performance tweak: skip all events, that do no longer have the DEFAULT color,
   or have been declined already.
   This avoids overriding user settings and doesn't burn regex / string ops
   for already adjusted event colors.


   @param CalendarEvent
*/  
function skipCheck(event) {


 if(event.getColor() != "" || event.getMyStatus() == CalendarApp.GuestStatus.NO) {
      if(DEBUG) {
        console.log("Skipping already colored / declined event:" + event.getTitle())
      }
      return true
    }
 return false
}


/* Actual colorizing of events based on Regex matching.
   Makes only sense for frequent stuff you want to auto colorize.
   Order matters for performance! Function exits after first matching color set.
   
   https://developers.google.com/apps-script/reference/calendar/event-color
   Mapping of Google Calendar color names to API color names (Kudos to Jason!):
   https://developers.google.com/apps-script/reference/calendar/event-color
   @param CalendarEvent
   @param String
*/

function colorizeByRegex(event, myOrg) {

  // Converting to lower case for easier matching.
  // Keep lower case in mind when defining your regex(s) below!
  eventTitle = event.getTitle().toLowerCase()
 
  // Check for "blockers" in my calendar
    if (/dnb/.test(eventTitle) ||
        /blocker/.test(eventTitle)) {
     
      console.log("Colorizing DNB found: " + eventTitle)
      event.setColor(CalendarApp.EventColor.YELLOW)
      return
    }


    // Check for travel related entries
    if(/travel/.test(eventTitle) ||
       /stay at/.test(eventTitle) ||
       /lunch/.test(eventTitle) ||
       /flight/.test(eventTitle)) {
      console.log("Colorizing travel found: " + eventTitle)
      event.setColor(CalendarApp.EventColor.GREEN)
      return
    }


    /* Check external participation.
       NB: If there are no external participants, one could mark this
       with the "INTERNAL" color. But that would also colorize
       e.g. trainings or events as "INTERNAL", which is technically
       correct, but you might want to give those a "special" color.
    */
    if (checkForExternal(event, myOrg)) {
     
      console.log("Colorizing external event found: " + eventTitle)
      event.setColor(CalendarApp.EventColor.RED)
      return
    }


    // Check for my team "Alliance" or related keywrords like 'VAR' (lowercased) mentioned in meetings
    if (/alliance/.test(eventTitle) ||
        /jgtm/.test(eventTitle) ||
        /var/.test(eventTitle)) {
      console.log("Colorizing Alliance team stuff found: " + eventTitle)
      event.setColor(CalendarApp.EventColor.BLUE)
      return
    }


    // Check for interviews or hiring keywords
    if (/interview/.test(eventTitle) ||
       /hiring/.test(eventTitle) ||
       /grading/.test(eventTitle)  ) {
      console.log("Colorizing interview stuff found: " + eventTitle)
      event.setColor(CalendarApp.EventColor.PALE_RED)
      return
    }


    // Check for meetings with my name in it "Giri" in lowercase, 1:1 related meetings
    if (/giri/.test(eventTitle)) {
     
      console.log("Colorizing Giri-named meeting found: " + eventTitle)
      event.setColor(CalendarApp.EventColor.ORANGE)
      return
    }


    // No match found, therefore no colorizing
    else {
      console.log("No matching rule for: " + eventTitle)
    }
}


/* Check participants for external domain other than myOrg. Requires adjustment
   if you have multiple "internal" domains, like company.com and company.de.
   The first external participant match exits this function.
   @param CalendarEvent
   @param String
*/
function checkForExternal(event, myOrg) {
 
  // Create guest list including organizer -> true parameter
  const guestList = event.getGuestList(true)
 
  // Building guest email and domain arrays, not needed by me.
  // Uncomment if you need it
  /*
  var guestEmails = []
  var guestDomains = []


  for (guest of guestList) {
    guestEmails.push(guest.getEmail())
    guestDomains.push(guest.getEmail().split("@")[1])
    if (DEBUG)
    console.log("Participant emails are: " + guestEmails)
  }
  */


  for (guest of guestList) {


    // get domain of guest and match to my domain
    if (guest.getEmail().split("@")[1] != myOrg) {
     
      console.log("External domain found: " +
        guest.getEmail().split("@")[1] + " in " + event.getTitle())
      return true
    }
  }
  return false
}
