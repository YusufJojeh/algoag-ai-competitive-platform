# ALGOAG Demo Script - English

Target length: 90 to 120 seconds.

## Script

We start on the landing page. ALGOAG is a competitive programming learning platform that brings together a problem bank, Arena contests, Python and C++ submissions, and AI assistance.

I log in as a demo user and open Problems. Public problems are listed with difficulty and connected topics. I choose a problem, read the statement, and submit a Python or C++ solution.

After submission, the result page shows the verdict. For local demos, the real judge can be enabled with `JUDGE_USE_REAL=true` when Python and g++ are installed. By default, the safer stub judge is used. Hidden tests are never exposed to the user.

Next, I open Arena. Before the contest starts, the page shows a not-started state and a countdown based on the configured application timezone. When the contest is running, joined users can submit. Then we open standings and review ICPC-style ranking.

Now I switch to the Admin area. Admins can manage users, topics, courses and lessons, problems and tags, contests, and settings. Inside a contest, an admin can create contest-only private problems that stay hidden from the public Problems page.

After the contest ends, the scheduler or the command `php artisan arena:publish-ended-problems` publishes those private problems automatically. Difficulty is computed from participant count, solve rate, and median first accepted time.

Finally, I show the AI Assistant and Codeforces solver. Users can request analysis or generate a Python/C++ style solution workflow.

In short, ALGOAG demonstrates a complete full-stack product: Laravel backend, React/Inertia frontend, queue and scheduler workflows, authorization, testing, and release-ready documentation.
