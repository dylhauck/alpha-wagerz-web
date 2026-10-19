"use client";

import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  Crosshair,
  Info,
  LineChart,
  ListChecks,
  MousePointerClick,
  ShieldAlert,
  Target,
  Trophy,
  Users,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

type GuideItem = {
  title: string;
  text: string;
};

type PageGuide = {
  name: string;
  text: string;
};

// ============================================================
// NBA DATA DICTIONARY
// ============================================================

const nbaData: GuideItem[] = [
  {
    title: "Alpha Projection",
    text: "The model's estimated result for a game, team, or player. Projections represent expectations, not guaranteed outcomes.",
  },
  {
    title: "Sportsbook Line",
    text: "The number offered by a sportsbook. Alpha compares its projections against available market lines to identify potential differences.",
  },
  {
    title: "Projected Score",
    text: "Alpha's estimated points for both teams. These scores help establish the projected winner, scoring margin, and combined total.",
  },
  {
    title: "Projected Total",
    text: "The combined projected points for both teams. Compare this number with the sportsbook's over/under line.",
  },
  {
    title: "Projected Spread",
    text: "The model's expected scoring margin expressed as a point spread. A negative spread indicates the favored team.",
  },
  {
    title: "Win Probability",
    text: "The model's estimated percentage chance of each team winning. A higher probability indicates a stronger model favorite, not a guaranteed victory.",
  },
  {
    title: "Model Edge",
    text: "The difference between the model's estimate and the sportsbook market. A larger difference can identify an opportunity worth researching further.",
  },
  {
    title: "Cover Probability",
    text: "An estimated probability that a team covers the available sportsbook spread. This depends on the model's scoring-margin assumptions.",
  },
  {
    title: "Over / Under Probability",
    text: "An estimated probability that the combined score finishes above or below the sportsbook total. These estimates depend on scoring-variance assumptions.",
  },
  {
    title: "Quarter Projections",
    text: "Estimated scoring for Q1, Q2, Q3, and Q4. Alpha uses historical quarter-scoring patterns to distribute its full-game projections across individual periods.",
  },
  {
    title: "Half Projections",
    text: "Estimated first-half and second-half scoring. These projections help research markets that settle before the full game ends.",
  },
  {
    title: "Team Rankings",
    text: "League-relative measures of team performance. Use rankings alongside actual statistics to understand offensive and defensive strengths.",
  },
  {
    title: "Player Statistics",
    text: "Individual production such as points, rebounds, assists, and other available statistics. Use player performance alongside matchup and playing-time context.",
  },
  {
    title: "Injury Status",
    text: "Reported player availability, including Out, Doubtful, Questionable, and Probable designations when available. Injuries can affect rotations, usage, minutes, and team performance.",
  },
];

// ============================================================
// NBA PAGE GUIDES
// ============================================================

const nbaPages: PageGuide[] = [
  {
    name: "Slate Summary",
    text: "Start with the day's NBA matchups. Select a game from the matchup ticker and review the available team and player information before moving into detailed research.",
  },
  {
    name: "Players",
    text: "Research individual NBA players and their available statistics. Consider scoring, rebounds, assists, playing time, recent performance, and opponent context when evaluating player markets.",
  },
  {
    name: "Teams",
    text: "Compare team performance and rankings to identify offensive and defensive strengths. Use the underlying numbers rather than relying only on ranking positions.",
  },
  {
    name: "Projections",
    text: "View Alpha's projected scores, win probabilities, spreads, totals, and available sportsbook comparisons. Switch between Full Game, Q1, Q2, 1st Half, Q3, Q4, and 2nd Half to research different betting markets.",
  },
  {
    name: "Injuries",
    text: "Review reported injuries for both teams in the selected matchup. Pay attention to questionable starters, missing rotation players, and late availability changes before placing a bet.",
  },
];

// ============================================================
// RESEARCH WORKFLOW
// ============================================================

const workflow = [
  "Select an NBA matchup from the game ticker.",
  "Review the teams and their statistical strengths and weaknesses.",
  "Research relevant players and their expected roles.",
  "Check the injury report for availability concerns.",
  "Open the projections page and review Alpha's full-game prediction.",
  "Switch between quarters and halves when researching period-specific markets.",
  "Compare Alpha's projections against available sportsbook lines.",
  "Evaluate the entire matchup before deciding whether a bet is worthwhile.",
];

// ============================================================
// QUICK TIPS
// ============================================================

const quickTips = [
  "A high win probability does not guarantee a team will win.",
  "A projected edge is a reason to investigate, not an automatic bet.",
  "Player injuries can affect the entire rotation, not just the injured player.",
  "Quarter and half projections are estimates and have not been backtested.",
  "Do not compare a full-game projection against a first-half sportsbook line.",
  "Always confirm that the sportsbook market matches the selected period.",
  "Team rankings should be evaluated alongside actual statistical performance.",
  "Recheck injury reports and sportsbook lines before tipoff.",
];

// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-5">
      <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/70">
        {eyebrow}
      </div>

      <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
        {title}
      </h2>

      {text && (
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-400">
          {text}
        </p>
      )}
    </div>
  );
}

// ============================================================
// NBA PROJECTION EXAMPLE
// ============================================================

function NBAProjectionExample() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">
          Example — Hypothetical Numbers
        </div>

        <div className="mt-1 text-lg font-black text-white">
          Understanding A Full-Game Projection
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Away Score", "108.4"],
          ["Home Score", "115.7"],
          ["Projected Total", "224.1"],
          ["Home Win Probability", "68.5%"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-center"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {label}
            </div>

            <div className="mt-2 text-xl font-black text-white">
              {value}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
          Alpha Projected Spread
        </div>

        <div className="mt-1 text-2xl font-black text-cyan-200">
          HOME -7.3
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-slate-400">
        Alpha projects the home team to win by 7.3 points,
        with a combined score of 224.1.

        <br />
        <br />

        If a sportsbook offers Home -5.5, Alpha's projected
        margin is 1.8 points more favorable to the home team
        than the market spread.

        <br />
        <br />

        This difference is worth investigating, but it does
        not guarantee the home team will cover.
      </div>
    </div>
  );
}

// ============================================================
// PERIOD EXAMPLE
// ============================================================

function NBAPeriodExample() {
  const periods = [
    {
      name: "Full Game",
      description:
        "The complete game, including overtime when applicable under the sportsbook's rules.",
    },
    {
      name: "Q1",
      description:
        "Only the first quarter of the game.",
    },
    {
      name: "Q2",
      description:
        "Only the second quarter of the game.",
    },
    {
      name: "1st Half",
      description:
        "The combined first and second quarters.",
    },
    {
      name: "Q3",
      description:
        "Only the third quarter of the game.",
    },
    {
      name: "Q4",
      description:
        "Only the fourth quarter of the game.",
    },
    {
      name: "2nd Half",
      description:
        "The combined third and fourth quarters, subject to the sportsbook's settlement rules.",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {periods.map((item) => (
        <div
          key={item.name}
          className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
        >
          <div className="flex items-center gap-3">
            <Clock3
              size={20}
              className="text-cyan-200"
            />

            <div className="font-black text-white">
              {item.name}
            </div>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function NBAHowToPage() {
  return (
    <div className="space-y-5 pt-4">
      {/* HERO */}

      <section className="glass rounded-3xl px-6 py-8 text-center sm:px-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
          Alpha Wagerz NBA
        </div>

        <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
          How To Use Alpha Wagerz
        </h1>

        <p className="mx-auto mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400">
          Learn how to read NBA statistics, understand Alpha
          projections, research quarter and half markets,
          and compare the model against sportsbook lines.
        </p>

        <div className="mt-5 flex justify-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            Alpha Wagerz Guide to Success
          </div>
        </div>
      </section>

      {/* INTRODUCTION */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="Getting Started"
          title="What Alpha Wagerz Is Showing You"
          text="Alpha Wagerz combines NBA matchup information, player statistics, team performance, injury reports, model projections, and sportsbook markets into one research experience."
        />

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: <BookOpen size={20} />,
              title: "Context First",
              text: "Understand the teams, players, and matchup before looking at a betting line.",
            },
            {
              icon: <LineChart size={20} />,
              title: "Model Second",
              text: "Review Alpha's projected scores, probabilities, and expected scoring margins.",
            },
            {
              icon: <Target size={20} />,
              title: "Market Last",
              text: "Compare the model with available sportsbook markets before making a decision.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                {item.icon}
              </div>

              <div className="mt-4 font-black text-white">
                {item.title}
              </div>

              <div className="mt-2 text-sm leading-6 text-slate-400">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WORKFLOW */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="The Alpha Workflow"
          title="Use The Site In This Order"
          text="Follow this process when researching an NBA matchup or identifying a potential betting opportunity."
        />

        <div className="grid gap-3 md:grid-cols-2">
          {workflow.map((step, index) => (
            <div
              key={step}
              className="flex gap-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-pink-300/20 bg-pink-300/10 text-sm font-black text-pink-200">
                {index + 1}
              </div>

              <div className="pt-1 text-sm font-bold leading-6 text-slate-300">
                {step}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SLATE GUIDE */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="How To Read The Slate"
          title="The Slate Is Your Starting Point"
          text="Select an NBA matchup from the game ticker before researching players, teams, projections, or injuries."
        />

        <div className="grid gap-3 lg:grid-cols-3">
          {[
            {
              icon: <MousePointerClick size={22} />,
              title: "Select The Matchup",
              text: "Choose the game you want to research from the matchup ticker.",
            },
            {
              icon: <BarChart3 size={22} />,
              title: "Review Team Performance",
              text: "Compare offensive and defensive statistics to understand the matchup.",
            },
            {
              icon: <Users size={22} />,
              title: "Evaluate Player Roles",
              text: "Consider injuries, playing time, and expected opportunities for important players.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="text-cyan-200">
                {item.icon}
              </div>

              <div className="mt-3 font-black text-white">
                {item.title}
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* DATA DICTIONARY */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="What The Data Means"
          title="NBA Data Dictionary"
          text="Understand these statistics and model outputs before using them to evaluate a betting market."
        />

        <div className="grid gap-3 md:grid-cols-2">
          {nbaData.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center gap-3">
                <Info
                  size={18}
                  className="text-cyan-200"
                />

                <div className="font-black text-white">
                  {item.title}
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* PAGE GUIDE */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="How To Use Each Page"
          title="Getting The Most From Alpha Wagerz NBA"
          text="Each NBA page provides a different part of the research process. Combine them to build a complete matchup evaluation."
        />

        <div className="space-y-3">
          {nbaPages.map((page, index) => (
            <div
              key={page.name}
              className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-5 md:grid-cols-[180px_1fr]"
            >
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
                  Page {index + 1}
                </div>

                <div className="mt-1 font-black text-white">
                  {page.name}
                </div>
              </div>

              <div className="text-sm leading-6 text-slate-400">
                {page.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTION EXAMPLE */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="How To Read Projections"
          title="Understanding An NBA Game Projection"
          text="Use Alpha's projected scores to understand the expected winner, scoring margin, and combined total before comparing against sportsbook markets."
        />

        <NBAProjectionExample />
      </section>

      {/* PERIOD GUIDE */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="Quarter And Half Markets"
          title="Understanding NBA Period Projections"
          text="Alpha provides separate projections for the full game, individual quarters, and each half. Select the same period as the sportsbook market you are researching."
        />

        <NBAPeriodExample />

        <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-5">
          <div className="flex gap-3">
            <Info
              size={20}
              className="mt-0.5 shrink-0 text-amber-200"
            />

            <p className="text-sm leading-6 text-slate-300">
              Quarter and half projections are currently
              estimated using historical scoring patterns
              and the full-game model.

              They are not independently backtested
              predictions. Sportsbook settlement rules
              can also differ by market, especially
              regarding overtime.
            </p>
          </div>
        </div>
      </section>

      {/* BETTING RESEARCH */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="Use The Website To Its Fullest"
          title="Do Not Stop At The First Good Number"
        />

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <Trophy size={20} />,
              title: "Start Broad",
              text: "Understand the matchup before narrowing your research to one market.",
            },
            {
              icon: <Activity size={20} />,
              title: "Check Availability",
              text: "Injuries and rotation changes can alter expected player and team performance.",
            },
            {
              icon: <Crosshair size={20} />,
              title: "Compare To Market",
              text: "Check whether Alpha's projection meaningfully differs from the available sportsbook line.",
            },
            {
              icon: <CheckCircle2 size={20} />,
              title: "Confirm The Details",
              text: "Verify the game, betting period, sportsbook line, and latest information.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="text-cyan-200">
                {item.icon}
              </div>

              <div className="mt-3 font-black text-white">
                {item.title}
              </div>

              <div className="mt-2 text-sm leading-6 text-slate-400">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QUICK TIPS */}

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="Quick Tips"
          title="Important Things To Remember"
        />

        <div className="grid gap-3 md:grid-cols-2">
          {quickTips.map((tip) => (
            <div
              key={tip}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <ListChecks
                size={18}
                className="mt-0.5 shrink-0 text-cyan-200"
              />

              <div className="text-sm font-bold leading-6 text-slate-300">
                {tip}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DISCLAIMER */}

      <section className="rounded-3xl border border-pink-300/15 bg-pink-300/[0.05] p-5 sm:p-6">
        <div className="flex gap-4">
          <ShieldAlert
            size={24}
            className="mt-1 shrink-0 text-pink-200"
          />

          <div>
            <div className="font-black text-white">
              Use Alpha As A Research Tool
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Alpha Wagerz projections, probabilities,
              rankings, and edges are analytical estimates.

              They are designed to help identify possible
              opportunities and organize research, but
              they do not guarantee results.

              Always confirm the latest injury reports,
              sportsbook markets, and player availability
              before making a decision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}