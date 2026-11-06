# Client Alignment Questions

Meeting script to align the client's vision with the Live Voting design (see [GLOSSARY.md](./GLOSSARY.md), [product-spec.md](product-spec.md)).

⚠️ = confirms a decision already baked into the design — verify these first.

## 1. Current process: Google Forms (open here, let them talk)

**Opener:** "Before we talk about the new system, walk us through how an election runs today with Google Forms, start to finish."

### Before voting
- Who decides an election is happening, and how far ahead?
- How are candidates nominated and confirmed? How does their info reach voters?
- Who builds the Google Form? How long does it take? Who reviews it? *(Sets the bar for admin setup effort.)*
- How do you decide who's eligible? Is there a voter list?
- How is the form link shared with voters (group chats, email, posts)?

### During voting
- How long is voting open? Who opens and closes the form?
- How do you stop double voting? "Limit to 1 response"? Has anyone gotten around it?
- Are email addresses collected? Did voters worry admins could see their vote? *(Our design makes that impossible.)*
- What questions or problems come in from voters while voting is open?
- Can people see results or turnout while voting is open? Do they want to?

### After voting
- How are results counted? A Sheets export, a manual count? Who does it, and how long does it take?
- How are results checked? Has anyone ever disputed a result?
- How and when are results announced?
- Has a response ever been deleted or corrected? Why? *(We can't: ballots are final and unlinkable.)*

### Pain points
- What's the **most frustrating** part of the whole process?
- What's gone wrong in past elections? What was the worst one?
- Where does the most manual work or time go?
- What complaints do you hear from voters? From candidates?
- If you could fix only one thing, what would it be?

### What works
- What do you **like** about the current process that we must keep? (Familiar, quick to set up, free, easy to edit?)

> Ask: can you share a past form and its results sheet, so we can mirror the real ballot structure?

## 2. Vision
- In one sentence, what does a successful election look like with the new system?
- Who's the audience: members only, or the public watching too?
- What would make you say this *failed*?

## 3. Election structure
- What election is this for? When, and how long is voting open?
- What positions/Questions are on the ballot? How many?
- For each: can voters pick one Candidate or several? What's the max? *(Selection Limit)*
- ⚠️ One election at a time, or several concurrently / a history of past ones? *(Design: single Election.)*
- Any need for ranked voting, yes/no referendums, or write-ins? *(Design: pick from a list only.)*

## 4. Candidates
- What's on a candidate profile — photo, platform, party, course/year, video?
- Who enters candidate info, and when is it locked?
- Candidate order: random, alphabetical, or fixed?

## 5. Voters & eligibility
- ⚠️ Voters sign in with an organization-domain account. Which domain? Does every eligible voter have one?
- Is everyone on that domain eligible, or only a specific list (paid members, specific college)?
- Roughly how many voters? How many in the first 10 minutes? *(load planning)*
- What happens if someone eligible can't log in?

## 6. Anonymity & trust ⚠️
- Ballots are unlinkable: we record *that* you voted, never *what* you voted. No one — not even admins — can look up or change a vote. Is that what you want?
- Ballots are final once submitted — no edits. OK?
- Voters can abstain on a Question and still submit. OK?
- If results are disputed, what proof do you need? (Turnout count, audit log, observer?)

## 7. Live Tally ⚠️
- The tally is public and updates live while voting is open. Are you sure? It can influence late voters.
  - Alternatives: hidden until close, admin-only during voting, or turnout-only.
- Who sees final results? Is there an official announcement moment?

## 8. Admins & operations
- Who are the admins? Can admins also vote?
- Admins can open, close, and reopen the election. When would reopening be allowed?
- Scheduled auto-open/close, or always manual?
- Voter reminders (email, announcements)?

## 9. Constraints & wrap-up
- Hard deadline? When do you need a test run before the real election?
- Branding: logo, colors, publication name?
- Mobile-first? (Most voters will likely use phones.)
- Who signs off on decisions? Who's the day-of contact?

**Closing:** "Let me confirm — I heard X, Y, Z. I'll send a summary, and anything that changes scope comes back to you before we build."

## Notes

_Record client answers verbatim here._
