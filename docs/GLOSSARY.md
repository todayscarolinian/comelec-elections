# Live Voting

One-ballot-per-person voting in a single Election for registered members of one organization domain, counting only Ballots whose Registration is approved, with Ballots auditable by Admins and a public Turnout count while voting is open.

## Election

**Election**:
The single voting event this app runs, made up of one or more Questions; it is either open or closed, and can be reopened.
_Avoid_: Poll, vote, contest

**Question**:
A single item on the Election that Voters answer, such as one office.
_Avoid_: Race, position, item

**Candidate**:
A person who can be picked on a Question, presented with a profile; a Candidate belongs to at most one Party.
_Avoid_: Option, choice, nominee

**Party**:
A political party that Candidates can run under; a Candidate with no Party is Independent.
_Avoid_: Slate, group, alliance

**Independent**:
A Candidate who runs under no Party.
_Avoid_: Unaffiliated, no party

**Selection Limit**:
The maximum number of Candidates a Voter may pick on a Question; a limit of one makes it a single-choice Question.
_Avoid_: Max votes, seats

## Registration

**Registration**:
A person's request to become a Voter, made during the Registration Period or while the Election is open; it carries their Student Profile and Year Level and is pending, approved or rejected.
_Avoid_: Application, sign-up, enrollment

**Applicant**:
A person signed in with an organization-domain account whose Registration is not yet approved.
_Avoid_: Registrant, pending voter

**Student Profile**:
A screenshot of the person's Student Profile in ISMIS, showing their name, student ID, Year Level and current term, submitted as proof that they are eligible to vote.
_Avoid_: Study Load, COR, enrollment proof, ID

**Year Level**:
The year a person declares they are in, recorded on their Registration and Ballot for information only; it does not change which Questions appear on their Ballot.
_Avoid_: Batch, year, grade

**Registration Period**:
The window before the Election in which Registrations can be submitted and reviewed. Registrations are also accepted while the Election is open, but never after it closes.
_Avoid_: Pre-registration, validation period

## Voting

**Voter**:
A person whose Registration has been approved and who may therefore cast a Ballot.
_Avoid_: User, member, participant

**Ballot**:
A person's complete, final set of answers to every Question shown to them, submitted once and recorded under their name; it counts toward the Results only while their Registration is approved.
_Avoid_: Vote, response, submission

**Held Ballot**:
A Ballot whose Registration is pending or rejected; it is recorded but left out of the Results, and it counts as soon as the Registration is approved, even after the Election closes.
_Avoid_: Provisional ballot, pending vote, uncounted vote

**Abstention**:
A Voter's explicit decision to pick no Candidate on a Question while still casting their Ballot.
_Avoid_: Blank, skip, null vote

**Turnout**:
The public running count of Ballots cast, including Held Ballots, viewable by anyone while the Election is open and after it closes.
_Avoid_: Live tally, participation, voter count

**Results**:
The count of picks for each Candidate from Ballots whose Registration is approved, seen only by Admins until they choose to release it.
_Avoid_: Tally, live results, scoreboard

## Administration

**Admin**:
A Voter granted authority to review Registrations, open and close the Election, audit Ballots and Results, and grant or revoke Admin to others.
_Avoid_: Organizer, moderator, owner, commissioner
