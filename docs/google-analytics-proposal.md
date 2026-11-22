# Proposal: Google Analytics for Live Voting

**Prepared for:** COMELEC
**Date:** November 22, 2026

## Summary

We propose adding Google Analytics to the Live Voting website. It would show us how voters use the site, such as how many people visit, which pages they open, what devices they use, and where they get stuck. We would use this to make the site faster and easier to use. With COMELEC's approval, the development team would also like to cite overall figures (for example, "served 3,000 voters on election day") in their professional portfolios and resumes. **It will never record who a voter is or how anyone voted.**

## What is Google Analytics?

Google Analytics is a free tool from Google that counts how people use a website or app. Think of it as a visitor counter that also notes which pages are opened and for how long. It shows totals and trends, such as "1,200 visits on election day, 70% on mobile." It does not show what any one person did.

## What data it collects

| Collected | Not collected |
| --- | --- |
| Pages visited and time spent on them | Names, student numbers, emails |
| Device type, operating system, browser | Ballots, votes, or candidate choices |
| Approximate location (country/city level) | Exact location or IP address (Google discards it) |
| Screen size and language setting | Passwords or login details |
| A random ID per browser, so repeat visits are counted once | Anything typed into forms |

Google's own terms forbid sending personal information to Analytics, and we will set it up to send none.

## Data security

- All data is encrypted while it travels from the voter's browser to Google.
- It is stored in Google's data centers, which are independently audited (e.g., ISO 27001 and SOC 2).
- Only people we approve can view the reports, using their Google accounts. COMELEC can be given read-only access.
- The analytics data is kept completely separate from the voting database.

## Data retention

- Detailed visit records are automatically deleted after **2 months**, which is the shortest setting available. We recommend keeping this setting.
- Summary reports (for example, "total visits per day") are kept so we can compare elections over time. These contain no individual-level data.
- We can delete all analytics data at any time if COMELEC asks.

## Privacy and compliance

- **Data Privacy Act of 2012 (RA 10173):** We will add a short notice to the site's privacy policy explaining that anonymous usage data is collected and why.
- **Consent:** Analytics uses small browser files (cookies). We can show a banner that lets voters accept or decline. Declining has no effect on their ability to vote.
- **No advertising:** We will turn off Google's advertising features and data sharing.
- **How the data is used:** Only to improve the site and, with COMELEC's approval, to cite overall totals in team members' portfolios and resumes. Only summary figures would be shared publicly, never individual records or election results. We will run any figures past COMELEC before publishing them.

## Next steps

We need four things from COMELEC:

1. Approval to proceed.
2. A decision on whether to show a consent banner (recommended).
3. Permission for team members to cite overall usage figures in their portfolios and resumes.
4. The names of anyone who should get read-only access to the reports.

Once approved, setup takes about one to two days and does not interrupt the live site.
