"use client";

import {
  Activity,
  BarChart3,
  BookOpen,
  CloudSun,
  Crosshair,
  Info,
  LineChart,
  ListChecks,
  MousePointerClick,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

type Sport = "MLB" | "NFL";

type SportHowToPageProps = {
  sport: Sport;
};

type GuideItem = {
  title: string;
  text: string;
};

type PageGuide = {
  name: string;
  text: string;
};

const workflow = [
  "Pick a game from the slate.",
  "Review the matchup and the most relevant team context.",
  "Check the players involved and their recent or historical data.",
  "Review injuries and weather before trusting a projection.",
  "Open the projections page and see what Alpha expects.",
  "Compare the Alpha projection with the sportsbook market.",
  "Look for meaningful differences rather than forcing a play.",
  "Use the full picture to make the final decision.",
];

const nflData: GuideItem[] = [
  {
    title: "Projection",
    text: "Alpha's model estimate for what a player or team is expected to produce. A projection is not the sportsbook line and is not a guarantee.",
  },
  {
    title: "Sportsbook Line",
    text: "The number offered by the sportsbook. For a player prop, this is the threshold you are deciding whether the player will finish over or under.",
  },
  {
    title: "Edge",
    text: "The difference between the Alpha projection and the sportsbook line. A larger edge means the model disagrees with the market by more, not that the bet is certain to win.",
  },
  {
    title: "Alpha Pick",
    text: "The model-side lean generated from the relationship between the projection and the available sportsbook line. Projection above the line points toward OVER; projection below the line points toward UNDER.",
  },
  {
    title: "Opponent History",
    text: "How a player has performed against the selected opponent in prior meetings. Use it as supporting context, especially when the sample is small.",
  },
  {
    title: "Totals vs Averages",
    text: "Totals show cumulative production. Averages show per-game production and are useful when comparing players with different numbers of games played.",
  },
  {
    title: "Offensive / Defensive Rank",
    text: "League-relative team performance. Use the ranking together with the actual stat value instead of judging the matchup from rank alone.",
  },
  {
    title: "Weather",
    text: "Game-day conditions such as temperature, wind and precipitation. Weather can change passing, kicking and overall scoring conditions.",
  },
  {
    title: "Injury Status",
    text: "Player availability information and, when available, an estimated return. Injuries can affect the injured player, teammates, usage and the overall game environment.",
  },
];

const mlbData: GuideItem[] = [
  {
    title: "Projection",
    text: "Alpha's model estimate for a player, team or game outcome. It should be compared with the market and matchup context rather than treated as a guaranteed result.",
  },
  {
    title: "Sportsbook Line",
    text: "The market number currently being offered by the sportsbook, such as a moneyline, run line, game total or player market when available.",
  },
  {
    title: "Edge",
    text: "The amount of disagreement between Alpha's model and the market. More edge means a bigger model-versus-market gap, not a guaranteed win.",
  },
  {
    title: "Pitching Data",
    text: "Use starter and bullpen performance to understand run prevention, strikeout potential, contact quality and how a lineup may match up with the opposing staff.",
  },
  {
    title: "Hitting Data",
    text: "Use batter and team offensive performance to understand power, contact, run production and how the lineup fits the opposing pitcher.",
  },
  {
    title: "Splits",
    text: "Performance in a specific context, such as versus left-handed or right-handed pitching. Splits are useful when the matchup makes that context relevant.",
  },
  {
    title: "Park / HR Environment",
    text: "Ballpark and weather conditions can help or suppress offense and home runs. Treat the environment as one part of the matchup, not the entire reason for a play.",
  },
  {
    title: "Weather",
    text: "Temperature, wind, humidity, precipitation and roof status can affect run scoring and home-run conditions. Outdoor games can change meaningfully as forecasts update.",
  },
  {
    title: "Injury / Lineup Context",
    text: "Missing hitters, pitchers or late lineup changes can materially alter projections. Re-check the slate when news changes.",
  },
];

const nflPages: PageGuide[] = [
  {
    name: "Slate Summary",
    text: "Start here. Select a game from the ticker, review the matchup card, then use the away and home opponent-history tables. Filter by QB, RB, WR or TE and sort the columns that matter to the bet you are researching.",
  },
  {
    name: "Players",
    text: "Use Last Season, Career and vs Matchup views to compare player production. Switch between totals and per-game averages. Player names are clickable, so you can open available sportsbook props and compare them directly with Alpha projections.",
  },
  {
    name: "Teams",
    text: "Review overall, offensive and defensive team performance. Team rankings are best used to identify strengths and weaknesses before you move into player-level research.",
  },
  {
    name: "Weather",
    text: "Review game-day conditions before finalizing a play. Pay special attention to wind, precipitation and extreme temperatures when researching passing, kicking and scoring markets.",
  },
  {
    name: "Projections",
    text: "See what the Alpha model expects before looking only at the sportsbook number. The most useful question is not simply whether a projection is high or low, but how it compares with the market.",
  },
  {
    name: "Injuries",
    text: "Check player status and estimated return information. Injuries may change opportunity, target share, rushing volume, protection, defensive matchups and the expected game script.",
  },
];

const mlbPages: PageGuide[] = [
  {
    name: "Slate Summary",
    text: "Start with the day's games and move matchup by matchup. Use the game selector to keep every other page focused on the same matchup while you research.",
  },
  {
    name: "Players",
    text: "Use player data to evaluate hitters and pitchers in the context of the selected matchup. Focus on the statistics that directly relate to the market you are considering.",
  },
  {
    name: "Teams",
    text: "Compare overall offensive and pitching strength. Team-level data is most useful for establishing matchup context before drilling into individual players.",
  },
  {
    name: "Weather",
    text: "Check temperature, wind, humidity, precipitation and roof status. For home-run research, pay close attention to whether the environment is helping, neutral or suppressing power.",
  },
  {
    name: "Projections",
    text: "Use Alpha projections as the model's independent expectation. Compare that expectation with the current market instead of treating either number in isolation.",
  },
  {
    name: "Injuries / Lineups",
    text: "Confirm important availability and lineup changes before finalizing a play. MLB projections can change meaningfully when a starter, batting-order spot or pitcher changes.",
  },
];

const quickTipsNFL = [
  "A positive edge does not mean a guaranteed win.",
  "Opponent history is context, not a standalone prediction.",
  "Treat small samples carefully.",
  "An injury can change usage for multiple teammates, not only the injured player.",
  "Weather matters differently for passing, rushing, kicking and overall scoring.",
  "Always compare the Alpha projection with the actual sportsbook line.",
  "If there is no sportsbook line, Alpha should not manufacture one.",
  "Re-check data close to kickoff because injuries, weather and markets can change.",
];

const quickTipsMLB = [
  "A positive edge does not mean a guaranteed win.",
  "Do not make a play from one stat alone.",
  "Pitcher quality, hitter matchup, park and weather should be read together.",
  "Treat small-sample splits carefully.",
  "Wind direction matters more when paired with ballpark layout and power profile.",
  "Confirm lineups and starting pitchers before finalizing a bet.",
  "Always compare the Alpha projection with the actual sportsbook line.",
  "Re-check outdoor games because forecasts and roof decisions can change.",
];

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
      {text ? (
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-400">
          {text}
        </p>
      ) : null}
    </div>
  );
}

function ExampleNFL() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200/70">
          Player Prop Example
        </div>
        <div className="mt-1 text-lg font-black text-white">Passing Yards</div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-4">
        {[
          ["Sportsbook Line", "257.5"],
          ["Alpha Projection", "271.8"],
          ["Difference", "+14.3"],
          ["Edge", "+5.6%"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-white/10 bg-white/[0.035] p-4 text-center"
          >
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              {label}
            </div>
            <div className="mt-1 text-xl font-black text-white">{value}</div>
          </div>
        ))}
      </div>

      <div className="mx-5 mb-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.07] p-4 text-center">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/70">
          Alpha Pick
        </div>
        <div className="mt-1 text-2xl font-black text-cyan-200">OVER 257.5</div>
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-slate-400">
        The sportsbook line is 257.5 yards and Alpha projects 271.8. Because the
        projection is 14.3 yards above the market, the model leans OVER. The edge
        shows the size of that disagreement; it does not guarantee the outcome.
      </div>
    </div>
  );
}

function ExampleMLB() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-pink-200/70">
          MLB Research Example
        </div>
        <div className="mt-1 text-lg font-black text-white">
          Building a Full Matchup Read
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {[
          [
            "Pitching",
            "Review the starter, bullpen and the skills that directly affect the market you are considering.",
          ],
          [
            "Hitting",
            "Check the lineup's power, contact and relevant handedness splits.",
          ],
          [
            "Environment",
            "Use park, temperature, wind, humidity and roof status to understand run and HR conditions.",
          ],
          [
            "Market",
            "Compare Alpha's projection with the current sportsbook price or line and decide whether the gap is meaningful.",
          ],
        ].map(([title, text]) => (
          <div
            key={title}
            className="rounded-xl border border-white/10 bg-white/[0.035] p-4"
          >
            <div className="font-black text-white">{title}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">{text}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-sm leading-6 text-slate-400">
        The strongest MLB reads usually come from several pieces of evidence pointing
        in the same direction. A favorable weather environment alone is not enough if
        the pitching matchup, lineup or market does not support it.
      </div>
    </div>
  );
}

export default function SportHowToPage({ sport }: SportHowToPageProps) {
  const isNFL = sport === "NFL";
  const dataItems = isNFL ? nflData : mlbData;
  const pageGuides = isNFL ? nflPages : mlbPages;
  const tips = isNFL ? quickTipsNFL : quickTipsMLB;

  return (
    <div className="space-y-5 pt-4">
      <section className="glass rounded-3xl px-6 py-8 text-center sm:px-8">
        <div className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200/70">
          Alpha Wagerz {sport}
        </div>

        <h1 className="mt-2 text-3xl font-black neon-text sm:text-5xl">
          How To Use Alpha Wagerz
        </h1>

        <p className="mx-auto mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-400">
          Learn how to read the {sport} data, understand the model, compare Alpha
          with sportsbook markets, and use every page as part of one complete
          research process.
        </p>

        <div className="mt-5 flex justify-center">
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
            Alpha Wagerz Guide to Success
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="Getting Started"
          title="What Alpha Wagerz Is Showing You"
          text={
            isNFL
              ? "Alpha Wagerz combines NFL slate information, player and team data, matchup history, weather, injuries, projections and sportsbook markets so you can research a bet from several angles instead of relying on one number."
              : "Alpha Wagerz combines MLB slate information, pitching, hitting, matchup context, park and weather conditions, projections and sportsbook markets so you can research the entire game environment before deciding on a play."
          }
        />

        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: <BookOpen size={20} />,
              title: "Context First",
              text: "Start with the matchup before jumping directly to the market.",
            },
            {
              icon: <LineChart size={20} />,
              title: "Model Second",
              text: "Understand what Alpha projects and why the matchup may support it.",
            },
            {
              icon: <Target size={20} />,
              title: "Market Last",
              text: "Compare the projection with the actual sportsbook number and decide whether the difference is worth acting on.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                {item.icon}
              </div>
              <div className="mt-4 font-black text-white">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-400">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="The Alpha Workflow"
          title="Use The Site In This Order"
          text="You do not have to follow this sequence every time, but it is a strong default workflow for researching a new game or market."
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
              <div className="pt-1 text-sm font-bold leading-6 text-slate-300">{step}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="How To Read The Slate"
          title="The Slate Is Your Starting Point"
          text={
            isNFL
              ? "Use the game ticker to select a matchup. The selected game drives the context shown throughout the slate. In opponent-history tables, use the position filters and clickable column headers to isolate the data that matters."
              : "Use the game selector to move through the day's matchups. Keep the selected game in mind as you move into pitching, hitting, weather and projection pages so every stat is being read in the correct matchup context."
          }
        />

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <MousePointerClick className="text-cyan-200" size={22} />
            <div className="mt-3 font-black text-white">Select The Game</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Start by clicking the matchup you want to research. Do not compare unrelated
              stats before confirming which game is active.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <BarChart3 className="text-cyan-200" size={22} />
            <div className="mt-3 font-black text-white">Read The Relevant Stats</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Focus on the statistics connected to your market. Passing yards, for example,
              should be researched differently than an anytime TD or an MLB home-run market.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <Activity className="text-cyan-200" size={22} />
            <div className="mt-3 font-black text-white">Add Context</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Opponent, injuries, weather, role, recent usage and the market all help explain
              whether a raw statistic is meaningful today.
            </p>
          </div>
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="What The Data Means"
          title={`${sport} Data Dictionary`}
          text="These are the core ideas to understand before using the numbers to make a decision."
        />

        <div className="grid gap-3 md:grid-cols-2">
          {dataItems.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="flex items-center gap-3">
                <Info size={18} className="text-cyan-200" />
                <div className="font-black text-white">{item.title}</div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="How To Use Each Page"
          title={`Getting The Most From Alpha Wagerz ${sport}`}
          text="Each page answers a different question. The goal is to combine them rather than treating any one page as the entire handicapping process."
        />

        <div className="space-y-3">
          {pageGuides.map((page, index) => (
            <div
              key={page.name}
              className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/55 p-5 md:grid-cols-[180px_1fr]"
            >
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
                  Page {index + 1}
                </div>
                <div className="mt-1 font-black text-white">{page.name}</div>
              </div>
              <div className="text-sm leading-6 text-slate-400">{page.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading
          eyebrow="How To Build A Bet"
          title={isNFL ? "Reading A Player Prop" : "Building An MLB Matchup Read"}
          text={
            isNFL
              ? "When a player has sportsbook markets available, click the player's name. Alpha can show the sportsbook line beside the model projection so the market disagreement is easy to understand."
              : "MLB research is strongest when the pitcher, lineup, splits, environment and market all support the same general conclusion."
          }
        />

        {isNFL ? <ExampleNFL /> : <ExampleMLB />}
      </section>

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
              text: "Understand the game before narrowing into one player or market.",
            },
            {
              icon: <CloudSun size={20} />,
              title: "Check Conditions",
              text: "Weather and availability can change the meaning of earlier research.",
            },
            {
              icon: <Crosshair size={20} />,
              title: "Compare To Market",
              text: "A projection becomes most actionable when you compare it with the real line.",
            },
            {
              icon: <Sparkles size={20} />,
              title: "Look For Agreement",
              text: "The best research often has several independent signals pointing the same way.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="text-cyan-200">{item.icon}</div>
              <div className="mt-3 font-black text-white">{item.title}</div>
              <div className="mt-2 text-sm leading-6 text-slate-400">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-5 sm:p-6">
        <SectionHeading eyebrow="Quick Tips" title="Important Things To Remember" />

        <div className="grid gap-3 md:grid-cols-2">
          {tips.map((tip) => (
            <div
              key={tip}
              className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <ListChecks size={18} className="mt-0.5 shrink-0 text-cyan-200" />
              <div className="text-sm font-bold leading-6 text-slate-300">{tip}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-pink-300/15 bg-pink-300/[0.05] p-5 sm:p-6">
        <div className="flex gap-4">
          <ShieldAlert size={24} className="mt-1 shrink-0 text-pink-200" />
          <div>
            <div className="font-black text-white">Use Alpha As A Research Tool</div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Alpha Wagerz projections, rankings, edges and picks are analytical outputs.
              They help organize information and identify possible market disagreements,
              but they do not guarantee results. Markets, injuries, lineups and conditions
              can change, so always confirm the latest information before making a decision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
