export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Header = { key: string; value: string };

export type Preset = {
  id: string;
  name: string;
  method: Method;
  url: string;
  group: PresetGroup;
  headers?: Header[];
  body?: string;
};

export type PresetGroup = "This site" | "Playground" | "Out there";

/** Sidebar order for the group headings. */
export const PRESET_GROUPS: PresetGroup[] = ["This site", "Playground", "Out there"];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const JSON_HEADER: Header[] = [{ key: "Content-Type", value: "application/json" }];

export const PRESETS: Preset[] = [
  /* ---------- this site's own server ---------- */
  {
    id: "health",
    name: "Server health",
    method: "GET",
    url: `${API_BASE}/api/health`,
    group: "This site",
  },
  {
    id: "fun-index",
    name: "Endpoint index",
    method: "GET",
    url: `${API_BASE}/api/fun`,
    group: "This site",
  },
  {
    id: "fun-uptime",
    name: "Server uptime",
    method: "GET",
    url: `${API_BASE}/api/fun/uptime`,
    group: "This site",
  },
  {
    id: "guestbook-list",
    name: "Guestbook",
    method: "GET",
    url: `${API_BASE}/api/guestbook`,
    group: "This site",
  },
  {
    id: "guestbook-sign",
    name: "Sign guestbook",
    method: "POST",
    url: `${API_BASE}/api/guestbook`,
    group: "This site",
    headers: JSON_HEADER,
    body: JSON.stringify(
      { name: "anonymous", message: "signed from the API Studio", emoji: "👾" },
      null,
      2,
    ),
  },
  {
    id: "blog-list",
    name: "Blog posts",
    method: "GET",
    url: `${API_BASE}/api/blog`,
    group: "This site",
  },

  /* ---------- playground routes on the same server ---------- */
  {
    id: "fun-whoami",
    name: "Who am I?",
    method: "GET",
    url: `${API_BASE}/api/fun/whoami`,
    group: "Playground",
  },
  {
    id: "fun-echo",
    name: "Echo my request",
    method: "POST",
    url: `${API_BASE}/api/fun/echo?hello=world`,
    group: "Playground",
    headers: [...JSON_HEADER, { key: "X-Sent-From", value: "Workbench" }],
    body: JSON.stringify({ ping: "pong", nested: { works: true } }, null, 2),
  },
  {
    id: "fun-guru",
    name: "Guru Meditation",
    method: "GET",
    url: `${API_BASE}/api/fun/guru`,
    group: "Playground",
  },
  {
    id: "fun-fortune",
    name: "Fortune cookie",
    method: "GET",
    url: `${API_BASE}/api/fun/fortune`,
    group: "Playground",
  },
  {
    id: "fun-dice",
    name: "Roll 2d20",
    method: "GET",
    url: `${API_BASE}/api/fun/dice?d=20&n=2`,
    group: "Playground",
  },
  {
    id: "fun-coin",
    name: "Flip 5 coins",
    method: "GET",
    url: `${API_BASE}/api/fun/coin?n=5`,
    group: "Playground",
  },
  {
    id: "fun-palette",
    name: "Random palette",
    method: "GET",
    url: `${API_BASE}/api/fun/palette?n=6`,
    group: "Playground",
  },
  {
    id: "fun-time",
    name: "Time (Amiga epoch)",
    method: "GET",
    url: `${API_BASE}/api/fun/time`,
    group: "Playground",
  },
  {
    id: "fun-hash",
    name: "Hash some text",
    method: "POST",
    url: `${API_BASE}/api/fun/hash`,
    group: "Playground",
    headers: JSON_HEADER,
    body: JSON.stringify({ text: "Only Amiga makes it possible" }, null, 2),
  },
  {
    id: "fun-delay",
    name: "Slow response (2s)",
    method: "GET",
    url: `${API_BASE}/api/fun/delay/2000`,
    group: "Playground",
  },
  {
    id: "fun-status",
    name: "Force a 503",
    method: "GET",
    url: `${API_BASE}/api/fun/status/503`,
    group: "Playground",
  },
  {
    id: "fun-teapot",
    name: "418 teapot",
    method: "GET",
    url: `${API_BASE}/api/fun/teapot`,
    group: "Playground",
  },

  /* ---------- public APIs out on the internet ---------- */
  {
    id: "gh-user",
    name: "Github profile",
    method: "GET",
    url: "https://api.github.com/users/nourinawadd",
    group: "Out there",
  },
  {
    id: "posts-list",
    name: "List posts",
    method: "GET",
    url: "https://jsonplaceholder.typicode.com/posts",
    group: "Out there",
  },
  {
    id: "post-create",
    name: "Create post",
    method: "POST",
    url: "https://jsonplaceholder.typicode.com/posts",
    group: "Out there",
    headers: JSON_HEADER,
    body: JSON.stringify(
      { title: "hello", body: "from workbench", userId: 1 },
      null,
      2,
    ),
  },
  {
    id: "cat-fact",
    name: "Random cat fact",
    method: "GET",
    url: "https://catfact.ninja/fact",
    group: "Out there",
  },
  {
    id: "dog-photo",
    name: "Random dog photo",
    method: "GET",
    url: "https://dog.ceo/api/breeds/image/random",
    group: "Out there",
  },
  {
    id: "chuck",
    name: "Chuck Norris joke",
    method: "GET",
    url: "https://api.chucknorris.io/jokes/random",
    group: "Out there",
  },
  {
    id: "advice",
    name: "Unsolicited advice",
    method: "GET",
    url: "https://api.adviceslip.com/advice",
    group: "Out there",
  },
  {
    id: "useless-fact",
    name: "Useless fact",
    method: "GET",
    url: "https://uselessfacts.jsph.pl/api/v2/facts/random",
    group: "Out there",
  },
  {
    id: "pokemon",
    name: "Pokédex: ditto",
    method: "GET",
    url: "https://pokeapi.co/api/v2/pokemon/ditto",
    group: "Out there",
  },
  {
    id: "cards",
    name: "Deal 5 cards",
    method: "GET",
    url: "https://deckofcardsapi.com/api/deck/new/draw/?count=5",
    group: "Out there",
  },
  {
    id: "iss",
    name: "Where's the ISS?",
    method: "GET",
    url: "https://api.wheretheiss.at/v1/satellites/25544",
    group: "Out there",
  },
  {
    id: "nasa-apod",
    name: "NASA photo of the day",
    method: "GET",
    url: "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
    group: "Out there",
  },
  {
    id: "weather",
    name: "Weather now",
    method: "GET",
    url: "https://api.open-meteo.com/v1/forecast?latitude=43.65&longitude=-79.38&current=temperature_2m,weather_code,wind_speed_10m",
    group: "Out there",
  },
  {
    id: "crypto",
    name: "BTC / ETH price",
    method: "GET",
    url: "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
    group: "Out there",
  },
  {
    id: "dictionary",
    name: "Define: pixel",
    method: "GET",
    url: "https://api.dictionaryapi.dev/api/v2/entries/en/pixel",
    group: "Out there",
  },
  {
    id: "hn-top",
    name: "Hacker News top",
    method: "GET",
    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    group: "Out there",
  },
  {
    id: "random-user",
    name: "Random person",
    method: "GET",
    url: "https://randomuser.me/api/",
    group: "Out there",
  },
  {
    id: "my-ip",
    name: "My public IP",
    method: "GET",
    url: "https://api.ipify.org?format=json",
    group: "Out there",
  },
  {
    id: "httpbin",
    name: "httpbin: anything",
    method: "POST",
    url: "https://httpbin.org/anything",
    group: "Out there",
    headers: JSON_HEADER,
    body: JSON.stringify({ from: "Amiga Workbench", year: 1992 }, null, 2),
  },
];
