Features
---

This is a trainer, along with a timing suite.

# Global

Features availible across the app:
- Connecting/disconnecting to the cube
- Resetting cube to solved state
- Dark mode toggling

# Timer
Timer is based on scramble type.

General timer features
- Scramble type selector -> allows also selecting session
- Dynamic scramble updating based on cube state
- Hide cube preview when scramble completed
- Manage focus on the window
- Show current cube state, with blurring when not hovered

Scramble types:
- 3BLD
- Edges (with option to show if parity present)
- Corners
- Time to U2 (take the cube out of the box and do a U2)
All of the scramble types have an option to set a random orientation

Each scramble type has a number of session which can be created

Session components:
- Name
- Times / Attempts
- Stats inc. averages (global, current, best)
- Attempt list and viewer
- Merging sessions

Attempt viewer:
- Time/date
- Time (total, memo, exec corners/edges?)
- View of scramble and final state
- Alg list
- - Hover to show the case
- - Integration with alg sheet
- - Stats about that case
- - Marker if included in analysis
- Analysis result
- - Type
- - Where in the solution