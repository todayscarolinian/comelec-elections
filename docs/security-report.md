# Live Voting: Security Report

| | |
|---|---|
| **Prepared for** | The Commission on Elections (COMELEC) |
| **Prepared by** | Today's Carolinian Web Development Department |
| **Date** | 2026-11-22 |
| **Status** | Draft for commission review |

## 1. Summary

The Live Voting system replaces the Google Forms process used in past elections. This report explains, in plain language, how the system protects the election and the people who take part in it. It also lists the risks the commission has knowingly accepted.

**In short:**

- **Only university students can take part.** Everyone signs in with their university Google account. Personal Gmail accounts and accounts from other schools are turned away.
- **One person, one ballot.** The system guarantees that each person can cast only one ballot, even if they click "Submit" twice or open two browser tabs.
- **A ballot can't be changed once cast.** Not by the voter, and the system offers no way for anyone else to edit it.
- **Only approved registrations count.** Ballots from people whose registration hasn't been approved are kept aside and never added to the results unless an admin approves them.
- **Results stay hidden until the commission releases them.** The public sees only how many people have voted, never who is winning.
- **Every sensitive action is recorded.** Every time an Authorized COMELEC Staff member views or downloads ballots, views results, approves or rejects a registration, or changes admin access, the system records who did it and when.
- **Ballots are not secret from the commission.** By the commission's own decision, each ballot is stored under the voter's name so it can be audited. Voters are told this clearly before they vote.
- **Site usage statistics are anonymous and optional.** The site counts visits with Google Analytics only if the visitor agrees. It never sends names, student numbers or votes to Google.

## 2. Who can do what

| Person | What they can do |
|---|---|
| **Anyone** (no sign-in) | See candidate profiles, the live turnout count, and the results once the commission releases them |
| **Student who has registered** | Everything above, plus submit or fix their registration and cast one ballot |
| **Authorized COMELEC Staff** (Admins) | Everything above, plus review registrations, open and close voting, view all ballots and results, release results, and give or remove admin access. All Authorized COMELEC Staff have the same permissions |

A person's access is checked against the system's records **every time** they do something. If a staff member's admin access is removed, it stops working on their very next action, even if they are still signed in.

## 3. How the system protects the election

### 3.1 Signing in

- There are **no passwords** in this system, so there are none to steal or guess. Sign-in is handled by Google.
- The system only accepts accounts that Google confirms belong to the university's Google Workspace. Someone who creates a personal Google account using a university-looking email address is still turned away.
- After signing in, a person stays signed in for **at most 8 hours**, then must sign in again.
- The sign-in record kept in the browser is encrypted, and other websites can't read it or use it to act on the person's behalf.

### 3.2 Registering

- Students upload a screenshot of their ISMIS Student Profile. The image goes into **private storage**. It is not on any public web page.
- Only Authorized COMELEC Staff can view these images, and each viewing link **expires after 10 minutes**, so a copied link stops working shortly after.
- Students can only attach images they uploaded themselves. They can't point their registration at someone else's file.
- Only image files (JPEG, PNG, WebP) are accepted.
- The system reads the screenshot automatically and flags details that don't match (for example, a different name). These flags only **assist** Authorized COMELEC Staff. A staff member always makes the final decision.
- From the screenshot, the system stores only the four details it checks. It does **not** store the full text of the image, such as the date of birth.

### 3.3 Voting

- **One ballot per person** is enforced by the database itself, not just by the web page. Even many simultaneous attempts by the same person result in exactly one ballot.
- Ballots can only be cast while the commission has voting **open**.
- The system checks every ballot against the official list of positions and candidates. A ballot can't include made-up candidates or pick more candidates than a position allows.
- Before voting, every voter sees and must tick a notice that the commission can see their ballot (see §5).
- What a person voted for is **never written to the system's error or activity logs**, and never sent to usage analytics (see §3.8). The only way to see ballot choices is through the commission's audited screens.

### 3.4 Results and turnout

- The public page shows only **how many ballots have been cast** and how many voters are approved. It never shows counts per candidate.
- Results only count ballots from **approved** registrations.
- Results can only be released **after voting has closed** and once **every pending registration with a ballot has been decided**.
- Releasing results **can't be undone**, and voting can't be reopened afterwards, so released results can't change.
- Results broken down by school stay **visible to Authorized COMELEC Staff only**, even after release.

### 3.5 Accountability for Authorized COMELEC Staff

- Every time a staff member views ballots, downloads ballots, views results before release, approves or rejects a registration, opens or closes voting, releases results, or gives or removes admin access, the system records **who did it and when**.
- The system can only add entries to this record. It never edits or deletes them.
- All Authorized COMELEC Staff can read this record, so they can see what each other has accessed.
- The last remaining staff member with admin access can't remove their own access, so the commission can't lock itself out.

### 3.6 Protecting the data behind the scenes

- All traffic between students' browsers and the system is **encrypted** (HTTPS).
- The database is locked so that it can only be reached by the system itself. The public interface that our hosting provider offers by default can read **nothing**.
- The developers who build the system **don't have access to the live database**. Only Today's Carolinian's Chief Technology Officer (CTO), who sets up the infrastructure, does.
- Passwords and secret keys that connect the system to Google, the database and storage are kept on the server. They are never sent to students' browsers or stored in the code.
- The system rejects requests that come from other websites trying to act on a signed-in person's behalf.

### 3.7 How we check our work

- The code includes automated tests for the rules above, including: non-university accounts are rejected, people without admin access can't reach any admin feature, a staff member whose access was removed is blocked straight away, two simultaneous votes by one person produce one ballot, results stay hidden before release, and every ballot view is recorded.
- These tests run automatically every time the code changes, and changes are reviewed by another team member before going live.

### 3.8 Usage analytics

The commission has approved adding usage analytics. The site uses Google Analytics, a free Google tool that counts how people use the site. It helps us find pages where people get stuck and make the site easier to use.

| Collected | Never collected |
|---|---|
| Pages visited and time spent on them | Names, student numbers, emails |
| Device type, operating system, browser | Ballots, votes, or candidate choices |
| Approximate location (country/city level) | Exact location or IP address (Google discards it) |
| Screen size and language setting | Passwords or sign-in details |
| A random ID per browser, so repeat visits are counted once | Anything typed into forms |

- **Visitors choose.** A banner asks each visitor to accept or decline analytics cookies. Analytics doesn't load at all until they accept, so declining sends nothing to Google. Declining has no effect on registering or voting.
- **Kept apart from the election.** Analytics data is stored by Google, separately from the voting database. It can't be used to work out who someone is or how they voted.
- **No advertising.** Google's advertising features and data sharing are turned off.
- **Short retention.** Detailed visit records are deleted automatically after 2 months. Only summary totals, such as visits per day, are kept.
- **Limited access.** Only approved Today's Carolinian staff and the Authorized COMELEC Staff the commission names can view the reports.
- **Portfolio use.** With the commission's approval, team members may cite overall figures, such as total voters served, in their professional portfolios and resumes. Only summary figures are used, never individual records or election results. The commission reviews any figure before it is published. Exact voter totals come from the voting database, because analytics doesn't count people who decline.

## 4. Risks the commission has accepted

These were discussed with and accepted by the commission. They are listed so the decision stays on record.

| Risk | Why it's accepted | What reduces it |
|---|---|---|
| **Authorized COMELEC Staff can see how any student voted**, including each other | Needed so the commission can audit the election (the same as the Google Forms process) | Voters are told before voting. Every ballot view and download is recorded |
| **Today's Carolinian's CTO has technical access to the live database**, including ballots | Someone must set up and maintain the infrastructure | Access is limited to the CTO alone, not the developers. Covered by the waiver the commission drafted |
| **A Student Profile screenshot can be edited or faked** | The same limitation as the previous process | Automatic checks flag mismatches, and Authorized COMELEC Staff review every image |
| **A Student Profile may not prove current enrollment** | Under discussion with the commission | Authorized COMELEC Staff review each registration |
| **A person stays signed in for up to 8 hours** and can't be signed out remotely | Short enough for one election day | A stolen sign-in can only ever cast that one person's single ballot. Removing admin access takes effect immediately |
| **A rush of late registrations can delay the results** | The commission chose to let late registrants vote | Late registrations with a ballot are shown first in the review queue |
| **Ballots from ineligible people are stored under their name** | A side effect of letting people vote before approval | These ballots never count and are visible in the ballot audit |

## 5. What voters are told

Before voting, every voter must read and tick:

> **Your Ballot is not anonymous to the election commission.** Your choices are recorded under your name and can be viewed by the commission (Audit Commissioner, Chair and COMELEC at-large) to audit the election. They are not shown to Candidates or other Voters. Every time the commission views Ballots, it is logged.

People whose registration isn't approved yet also tick:

> **Your Ballot will be held until your Registration is approved.** If your Registration is rejected, fix it before voting closes, or your Ballot won't count.

On their first visit, everyone sees a banner like this one and can accept or decline:

> We use cookies to count visits and improve this site. We never collect your name or your vote. **[Accept] [Decline]**

## 6. Personal data and privacy

The system follows the Data Privacy Act of 2012 (Republic Act No. 10173). The Privacy Notice on the site explains what we collect and why. It currently **proposes** the following retention periods, which still need the commission's approval:

| Data | Proposed retention |
|---|---|
| Student Profile screenshots | Deleted after 30 days |
| Registration details | Deleted after 1 year |
| Ballots and the commission's activity record | Deleted after 1 year, so a contested result can still be audited |
| Names and email addresses | Deleted together with the registration and ballot |
| Usage analytics visit records | Deleted automatically by Google after 2 months. Summary totals are kept |

The Privacy Notice will also explain the usage analytics described in §3.8, including what is collected and that visitors can decline.

## 7. Glossary

| Term | Meaning |
|---|---|
| **Authorized COMELEC Staff (Admin)** | A COMELEC member given access to the admin features. All have the same permissions |
| **Registration** | A student's request to vote, with their Student Profile screenshot, Year Level and School |
| **Held ballot** | A ballot cast before the registration is approved. It only counts once approved |
| **Turnout** | The public count of ballots cast |
| **Results** | Vote counts per candidate, hidden from the public until the commission releases them |
| **Activity record** | The system's permanent list of sensitive actions taken by Authorized COMELEC Staff |
| **Usage analytics** | Anonymous counts of how people use the site, collected by Google Analytics only from visitors who accept |
