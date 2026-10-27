import { useEffect, useMemo, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'

const sportConfigs = [
  { key: 'all', label: 'All Sports' },
  { key: 'NBA', label: 'NBA' },
  { key: 'NFL', label: 'NFL' },
  { key: 'MLB', label: 'MLB' },
  { key: 'Soccer', label: 'Soccer' },
]

const soccerLeagues = [
  { code: 'eng.1', name: 'Premier League' },
  { code: 'esp.1', name: 'La Liga' },
  { code: 'ger.1', name: 'Bundesliga' },
  { code: 'ita.1', name: 'Serie A' },
  { code: 'fra.1', name: 'Ligue 1' },
  { code: 'usa.1', name: 'MLS' },
  { code: 'uefa.champions', name: 'UEFA Champions League' },
  { code: 'mex.1', name: 'Liga MX' },
]

const adminUsers = [
  { email: 'writer@allsport.com', password: 'writer123', role: 'Writer', name: 'Maya Brooks' },
  { email: 'editor@allsport.com', password: 'editor123', role: 'Editor', name: 'Cal Reed' },
]

const promoOffers = [
  {
    id: 'promo-1',
    title: 'Bet $5, Get $150 in Bonus Bets',
    brand: 'FanDuel',
    sport: 'NBA',
    code: 'ALLSPORT150',
    detail: 'New customers can turn a small first wager into bonus cash across basketball, football, and baseball markets.',
    expiry: 'Ends in 7 days',
    tag: 'Top pick',
  },
  {
    id: 'promo-2',
    title: 'Up to $1,000 First Deposit Match',
    brand: 'DraftKings',
    sport: 'NFL',
    code: 'ALLSPORT1000',
    detail: 'Get matched bonus funds on your first deposit and unlock boosted odds on primetime matchups.',
    expiry: 'Ends in 14 days',
    tag: 'Best value',
  },
  {
    id: 'promo-3',
    title: 'No Sweat First Bet up to $250',
    brand: 'Caesars',
    sport: 'MLB',
    code: 'ALLSPORT250',
    detail: 'Place your first wager with confidence thanks to insurance on early losses and daily parlay boosts.',
    expiry: 'Ends in 5 days',
    tag: 'Fresh offer',
  },
  {
    id: 'promo-4',
    title: 'Profit Boost Bundle',
    brand: 'BetMGM',
    sport: 'NCAAB',
    code: 'ALLSPORTBOOST',
    detail: 'Stack multiple parlay boosts across college basketball and prop markets this week.',
    expiry: 'Ends in 9 days',
    tag: 'Boosted',
  },
  {
    id: 'promo-5',
    title: 'Free Bet for Live Betting',
    brand: 'PointsBet',
    sport: 'Soccer',
    code: 'LIVEEDGE',
    detail: 'Receive a targeted live-betting bonus for in-play wagers on major games and global matchups.',
    expiry: 'Ends in 3 days',
    tag: 'Live play',
  },
  {
    id: 'promo-6',
    title: 'Exclusive Signup Credit',
    brand: 'Fanatics',
    sport: 'NHL',
    code: 'ALLSPORTCREDIT',
    detail: 'Tap in on a free welcome offer for sportsbook and casino access with a simple signup flow.',
    expiry: 'Ends in 11 days',
    tag: 'New',
  },
]

const initialNews = [
  {
    id: 'story-1',
    sport: 'NBA',
    category: 'Breaking',
    title: 'Boston’s late-game execution keeps them ahead of the market',
    summary: 'The Celtics continue to dominate in the most important possessions of the fourth quarter.',
    author: 'Jordan Hayes',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
    status: 'Published',
    content: [
      'The Celtics are winning the matchup on the margin that matters most: clutch execution. Boston is converting a higher share of late-game possessions while forcing more rushed decisions on the wing.',
      'The market still sees the spread as manageable, but the underlying efficiency numbers suggest the edge is tilting toward the stronger side. The team’s ball security and spacing have remained especially steady when the defense tightens.',
      'That late-game pattern matters in the same way a sharp bettor cares about injury reports, tempo, and travel. The value is not just the number in the box score; it is the rate at which that number is produced under pressure.',
    ],
  },
  {
    id: 'story-2',
    sport: 'NFL',
    category: 'Injury Report',
    title: 'How injuries and weather are moving totals across the early slate',
    summary: 'Wind, rest, and workload are changing the market faster than expected this week.',
    author: 'Alicia Ross',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
    status: 'Published',
    content: [
      'A cold-weather game with a tighter injury report can quickly move the market harder than a standard Sunday card. The line movement is reflecting more than just the public opinion; it is reflecting changing pace expectations and operational risk.',
      'This week’s most significant factor is the overlap between short rest and windy conditions. Once the weather forecast shifts, the best value often goes away with it.',
      'For bettors, the lesson is simple: be patient with totals and monitor decision-making. The early game may be the best place to find a better number before it settles.',
    ],
  },
  {
    id: 'story-3',
    sport: 'MLB',
    category: 'Analysis',
    title: 'Playoff races tighten as divisional leaders keep pushing',
    summary: 'Bullpen volatility and contact quality are defining the final stretch of the season.',
    author: 'Ruben Diaz',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    status: 'Published',
    content: [
      'With the playoff race tightening, more teams are leaning harder on their best relievers and their most contact-efficient lineups. The market is now reflecting a much smaller margin for error.',
      'When bullpen leverage climbs, run totals drop and moneyline value shifts toward the clubs with more depth. That is where sharp bettors tend to move early in the day.',
      'The key this week is not just the standings. It is the way those standings are being created: by who is forcing contact, who is still getting groundballs, and who is managing fatigue late in games.',
    ],
  },
  {
    id: 'story-4',
    sport: 'NBA',
    category: 'Analysis',
    title: 'The midseason adjustments that are reshaping playoff odds',
    summary: 'Teams with better bench units are creating more separation in the final stretch of the season.',
    author: 'Samir Cole',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    status: 'In Review',
    content: [
      'The playoff race is being decided more by sustainability than explosive talent. Clubs that can maintain pace through the bench rotation are the ones making the most efficient late-run adjustments.',
      'Bench production, particularly on defense, is proving to be a better predictor than headline scoring trends. That may explain why several teams are climbing without a major shift in the public perception.',
      'Sharp bettors are less interested in the streak and more interested in the underlying structure behind it. That is exactly where the value is being created right now.',
    ],
  },
  {
    id: 'story-5',
    sport: 'NFL',
    category: 'Breaking',
    title: 'Quarterback availability still defines the market’s early confidence',
    summary: 'The injury report is setting tone for both spread and total movement across the week.',
    author: 'Nina Harris',
    readTime: '3 min read',
    image: 'https://images.unsplash.com/photo-1518604660418-8823f29f5d2e?auto=format&fit=crop&w=1200&q=80',
    status: 'Draft',
    content: [
      'A single quarterback question can reshape the market in a matter of hours. That pressure spreads into both the spread and the total as bettors reprice the expected point production.',
      'The most reliable edge comes when the market reacts before the public fully understands the replacement plan. Getting there early often matters more than getting the exact outcome right.',
      'For now, the data suggests discipline. Monitor the route tree and the expected snap count before making the move.',
    ],
  },
]

const cleanText = (input) => {
  return String(input || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const normalizeNewsArticle = (article, sport) => {
  const summary = cleanText(article?.description || article?.summary || '')
  const image = article?.images?.[0]?.url || article?.image || ''
  const link = article?.links?.web?.href || article?.links?.api?.news?.href || ''

  return {
    id: article?.id || link || `${sport}-${article?.headline}`,
    sport,
    category: cleanText(article?.type || article?.category || 'News'),
    title: cleanText(article?.headline || article?.title || 'Sports news'),
    summary,
    author: cleanText(article?.byline || article?.author || 'ESPN'),
    readTime: '',
    image,
    status: 'Published',
    content: [],
    source: 'ESPN',
    published: article?.published || article?.lastModified || '',
    link,
  }
}

const fetchLiveNews = async (signal) => {
  const sources = [
    { sport: 'NBA', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/news' },
    { sport: 'NFL', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news' },
    { sport: 'MLB', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/news' },
    { sport: 'Soccer', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news' },
    { sport: 'Soccer', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/news' },
    { sport: 'Soccer', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/news' },
  ]

  const results = await Promise.allSettled(sources.map(async (source) => {
    const response = await fetch(source.endpoint, { signal })
    if (!response.ok) throw new Error(`ESPN news request failed (${response.status})`)
    const data = await response.json()
    const items = Array.isArray(data.articles) ? data.articles : Array.isArray(data.headlines) ? data.headlines : []
    return { sport: source.sport, articles: items.map((article) => normalizeNewsArticle(article, source.sport)) }
  }))

  const fulfilled = results.filter((result) => result.status === 'fulfilled').map((result) => result.value)
  if (!fulfilled.length) throw new Error('Unable to load news from ESPN')
  return {
    articles: fulfilled
      .flatMap((result) => result.articles)
      .filter((article) => article.title !== 'Sports news')
      .sort((a, b) => new Date(b.published || 0) - new Date(a.published || 0))
      .slice(0, 12),
    errors: results.filter((result) => result.status === 'rejected').length,
  }
}

const parseRecord = (value) => {
  if (!value || value === '—') return 0.5
  const match = value.match(/(\d+)-(\d+)(?:-(\d+))?/)
  if (!match) return 0.5
  const wins = Number(match[1])
  const losses = Number(match[2])
  const draws = Number(match[3] || 0)
  return (wins + draws / 2) / Math.max(1, wins + losses + draws)
}

const getShortTeamName = (name = '') => name.split(' ').filter(Boolean).slice(-1)[0] || 'Team'

const makePrediction = (item, index) => {
  const homeWinRate = parseRecord(item.homeRecord)
  const awayWinRate = parseRecord(item.awayRecord)
  const liveMargin = item.status === 'Live' ? item.awayScore - item.homeScore : 0
  const homeEstimate = Math.round(Math.min(75, Math.max(25, 50 + (homeWinRate - awayWinRate) * 35 - liveMargin * 1.5)))
  const awayName = getShortTeamName(item.awayTeam)
  const homeName = getShortTeamName(item.homeTeam)
  const favorite = homeEstimate >= 50 ? homeName : awayName
  const confidence = Math.max(homeEstimate, 100 - homeEstimate)
  const score = item.status === 'Live'
    ? `${item.awayScore}-${item.homeScore}`
    : item.startTime ? new Date(item.startTime).toLocaleString() : 'Not started'
  const records = item.homeRecord !== '—' && item.awayRecord !== '—'
    ? `Season records: ${item.awayTeam} ${item.awayRecord}, ${item.homeTeam} ${item.homeRecord}.`
    : 'Season records are not available, so this estimate starts from an even matchup.'
  const liveContext = item.status === 'Live'
    ? `Live score: ${item.awayTeam} ${item.awayScore}, ${item.homeTeam} ${item.homeScore}.`
    : 'This is a pre-game estimate and will update with the scoreboard.'
  const reason = `${records} ${liveContext} The pick is a simple estimate based on the season win rates and current score, not a sportsbook line or a guaranteed outcome.`

  return {
    id: item.id || `pick-${index}`,
    sport: item.sport,
    league: item.league,
    tag: item.status === 'Live' ? 'Live estimate' : 'Pre-game estimate',
    title: `${awayName} at ${homeName}`,
    detail: `Current pick: ${favorite} (${confidence}% estimated win chance). This estimate uses season records${item.status === 'Live' ? ' and the live score' : ''}.`,
    reason,
    odds: item.spread || 'Odds unavailable',
    confidence: `${confidence}% estimated`,
    projectedScore: score,
  }
}

const normalizeEvent = (event, sport, league = '') => {
  const competition = event?.competitions?.[0]
  const competitors = competition?.competitors ?? []
  const home = competitors.find((team) => team.homeAway === 'home')
  const away = competitors.find((team) => team.homeAway === 'away')

  if (!home || !away) return null

  const homeTeam = home.team?.displayName || 'Home'
  const awayTeam = away.team?.displayName || 'Away'
  const statusState = competition?.status?.type?.state || event?.status?.type?.state || 'scheduled'
  const isLive = statusState === 'in'
  const isFinal = statusState === 'post' || statusState === 'final'

  const homeScore = Number(home.score ?? 0)
  const awayScore = Number(away.score ?? 0)
  const odds = competition?.odds?.[0]

  return {
    id: event.id || `${sport}-${homeTeam}-${awayTeam}`,
    sport,
    league,
    status: isFinal ? 'Final' : isLive ? 'Live' : 'Scheduled',
    matchup: `${awayTeam} vs ${homeTeam}`,
    homeTeam,
    awayTeam,
    homeScore,
    awayScore,
    spread: odds?.details || '',
    total: odds?.overUnder ? String(odds.overUnder) : '',
    homeRecord: home.records?.[0]?.summary || '—',
    awayRecord: away.records?.[0]?.summary || '—',
    startTime: event.date || '',
    statusDetail: competition?.status?.type?.shortDetail || event?.status?.type?.shortDetail || '',
  }
}

const fetchScoreboard = async (sport, endpoint, signal, league = '') => {
  const response = await fetch(endpoint, { signal })
  if (!response.ok) throw new Error(`ESPN ${sport} scoreboard request failed (${response.status})`)
  const data = await response.json()
  const competitionName = league || data.leagues?.[0]?.name || ''
  return (data.events || []).map((item) => normalizeEvent(item, sport, competitionName)).filter(Boolean)
}

function App() {
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedMarket, setSelectedMarket] = useState('all')
  const [search, setSearch] = useState('')
  const [board, setBoard] = useState([])
  const [loading, setLoading] = useState(true)
  const [boardError, setBoardError] = useState('')
  const [newsError, setNewsError] = useState('')
  const [boardUpdatedAt, setBoardUpdatedAt] = useState(null)
  const [newsUpdatedAt, setNewsUpdatedAt] = useState(null)
  const [newsArticles, setNewsArticles] = useState([])
  const [selectedNewsStoryId, setSelectedNewsStoryId] = useState('')
  const [newsLoading, setNewsLoading] = useState(true)
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('allsport-admin-user') || 'null')
    } catch {
      return null
    }
  })

  const refreshNews = async () => {
    setNewsLoading(true)
    try {
      const { articles, errors } = await fetchLiveNews()
      setNewsArticles(articles)
      setSelectedNewsStoryId((current) => (articles.some((story) => story.id === current) ? current : articles[0]?.id ?? ''))
      setNewsUpdatedAt(new Date())
      setNewsError(errors ? `Some ESPN news feeds could not be refreshed (${errors} failed).` : '')
    } catch (error) {
      setNewsError(error.message)
    } finally {
      setNewsLoading(false)
    }
  }

  useEffect(() => {
    if (authUser) {
      window.localStorage.setItem('allsport-admin-user', JSON.stringify(authUser))
    } else {
      window.localStorage.removeItem('allsport-admin-user')
    }
  }, [authUser])

  useEffect(() => {
    let active = true
    let loadingBoard = false
    let loadingNews = false
    const controller = new AbortController()

    const loadBoard = async () => {
      if (loadingBoard) return
      loadingBoard = true
      const endpoints = [
        { sport: 'NBA', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard' },
        { sport: 'NFL', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard' },
        { sport: 'MLB', endpoint: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
        ...soccerLeagues.map((league) => ({
          sport: 'Soccer',
          league: league.name,
          endpoint: `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.code}/scoreboard`,
        })),
      ]

      try {
        const results = await Promise.allSettled(endpoints.map((item) => fetchScoreboard(item.sport, item.endpoint, controller.signal, item.league)))
        if (!active) return
        const successful = results.filter((result) => result.status === 'fulfilled')
        const failed = results.length - successful.length
        if (successful.length) {
          setBoard(successful.flatMap((result) => result.value))
          setBoardUpdatedAt(new Date())
          setBoardError(failed ? `${failed} sports or league scoreboard feed(s) could not be refreshed.` : '')
        } else {
          setBoardError('Unable to load live scores from ESPN.')
        }
      } catch (error) {
        if (active && error.name !== 'AbortError') setBoardError(error.message)
      } finally {
        loadingBoard = false
        if (active) setLoading(false)
      }
    }

    const loadNews = async () => {
      if (loadingNews) return
      loadingNews = true
      setNewsLoading(true)
      try {
        const { articles, errors } = await fetchLiveNews(controller.signal)
        if (!active) return
        setNewsArticles(articles)
        setSelectedNewsStoryId((current) => (articles.some((story) => story.id === current) ? current : articles[0]?.id ?? ''))
        setNewsUpdatedAt(new Date())
        setNewsError(errors ? `Some ESPN news feeds could not be refreshed (${errors} failed).` : '')
      } catch (error) {
        if (active && error.name !== 'AbortError') setNewsError(error.message)
      } finally {
        loadingNews = false
        if (active) setNewsLoading(false)
      }
    }

    loadBoard()
    loadNews()

    const scoreTickerId = window.setInterval(loadBoard, 30000)
    const newsTickerId = window.setInterval(loadNews, 120000)

    return () => {
      active = false
      controller.abort()
      window.clearInterval(scoreTickerId)
      window.clearInterval(newsTickerId)
    }
  }, [])

  const sourceBoard = board

  const filteredBoard = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sourceBoard.filter((game) => {
      const sportMatches = selectedSport === 'all' || game.sport === selectedSport
      const marketMatches = selectedMarket === 'all' || game.status === selectedMarket
      const textMatches = !query || `${game.matchup} ${game.spread} ${game.sport} ${game.league || ''}`.toLowerCase().includes(query)
      return sportMatches && marketMatches && textMatches
    })
  }, [search, selectedMarket, selectedSport, sourceBoard])

  const predictionCards = useMemo(() => {
    return sourceBoard
      .filter((game) => game.status === 'Live' || game.status === 'Scheduled')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'Live' ? -1 : 1
        return new Date(a.startTime || 0) - new Date(b.startTime || 0)
      })
      .slice(0, 8)
      .map((item, index) => makePrediction(item, index))
  }, [sourceBoard])

  const topStats = useMemo(() => {
    const allGames = filteredBoard.length ? filteredBoard : sourceBoard
    const liveCount = allGames.filter((game) => game.status === 'Live').length
    const finalCount = allGames.filter((game) => game.status === 'Final').length
    const scheduledCount = allGames.filter((game) => game.status === 'Scheduled').length
    return [
      { label: 'Live games', value: liveCount },
      { label: 'Finals', value: finalCount },
      { label: 'Upcoming', value: scheduledCount },
    ]
  }, [filteredBoard, sourceBoard])

  return (
    <div className="sports-app-shell">
      <TickerBar board={board} />
      <Header authUser={authUser} />
      <NavLink to={authUser ? '/admin' : '/admin-login'} className="staff-access-trigger">Staff access</NavLink>

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              topStats={topStats}
              predictionCards={predictionCards}
              board={board}
              loading={loading}
              boardError={boardError}
              newsCards={newsArticles.slice(0, 3)}
              selectedNewsStoryId={selectedNewsStoryId}
              setSelectedNewsStoryId={setSelectedNewsStoryId}
            />
          }
        />
        <Route
          path="/scores"
          element={
            <ScoreboardPage
              board={filteredBoard}
              loading={loading}
              search={search}
              setSearch={setSearch}
              selectedSport={selectedSport}
              setSelectedSport={setSelectedSport}
              selectedMarket={selectedMarket}
              setSelectedMarket={setSelectedMarket}
              error={boardError}
              updatedAt={boardUpdatedAt}
            />
          }
        />
        <Route path="/predictions" element={<PredictionsPage predictionCards={predictionCards} loading={loading} error={boardError} updatedAt={boardUpdatedAt} />} />
        <Route path="/promos" element={<PromosPage />} />
        <Route path="/news" element={<NewsPage articles={newsArticles} newsLoading={newsLoading} error={newsError} updatedAt={newsUpdatedAt} />} />
        <Route path="/admin-login" element={<AdminLoginPage authUser={authUser} setAuthUser={setAuthUser} />} />
        <Route path="/admin" element={authUser ? <AdminDashboard authUser={authUser} setAuthUser={setAuthUser} onRefreshStories={refreshNews} /> : <Navigate to="/admin-login" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function TickerBar({ board = [] }) {
  const tickerGames = board.filter((game) => game.status === 'Live').slice(0, 6)

  return (
    <div className="ticker-bar">
      <div className="container ticker-inner">
        <span className="ticker-label">Live events</span>
        <div className="ticker-wrap">
          <div className="ticker-track">
            {tickerGames.length ? tickerGames.map((game) => {
              const awayName = game.awayTeam?.split(' ').slice(-1)[0] || 'Away'
              const homeName = game.homeTeam?.split(' ').slice(-1)[0] || 'Home'

              return (
                <div key={game.id} className="ticker-item">
                  <span className="ticker-status">{game.status}</span>
                  <span className="ticker-score">
                    {awayName} {game.awayScore}-{game.homeScore} {homeName}
                  </span>
                </div>
              )
            }) : <span className="ticker-item">No live games right now</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function Header({ authUser }) {
  return (
    <header className="site-header">
      <div className="container nav-bar">
        <div className="brand-wrap">
          <div className="brand-mark">A</div>
          <div>
            <div className="brand-name">AllSport</div>
            <div className="brand-tag">Daily</div>
          </div>
        </div>

        <nav className="main-nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/scores">Scores</NavLink>
          <NavLink to="/predictions">Predictions</NavLink>
          <NavLink to="/promos">Promos</NavLink>
          <NavLink to="/news">News</NavLink>
        </nav>

        <div className="nav-actions">
          <button className="btn btn-primary" type="button">Get Picks</button>
        </div>
      </div>
    </header>
  )
}

function HomePage({ topStats, predictionCards, board, loading, boardError, newsCards, selectedNewsStoryId, setSelectedNewsStoryId }) {
  const activeStory = newsCards.find((story) => story.id === selectedNewsStoryId) || newsCards[0]
  const featuredGames = board.filter((game) => game.status === 'Live').slice(0, 2)

  return (
    <main>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Data-driven betting</span>
            <h1>Live scores, sharper picks, and real-time market movement.</h1>
            <p>
              Monitor current matchups, projected outcomes, and betting value across the NBA, NFL, MLB, and top soccer leagues worldwide.
            </p>
            <div className="cta-row">
              <NavLink to="/scores" className="btn btn-primary">View live board</NavLink>
              <NavLink to="/predictions" className="btn btn-secondary">Explore picks</NavLink>
            </div>

            <div className="stats-grid">
              {topStats.map((item) => (
                <div key={item.label} className="stat-box">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="hero-panel">
            <div className="panel-header">
              <span className="live-dot" />
              Live scoreboard
            </div>

            {featuredGames.length ? featuredGames.map((game) => (
              <div className="market-card" key={game.id}>
                <div className="market-topline">
                  <span>{game.league || game.sport} · {game.statusDetail || 'Live'}</span>
                  <span className="trend-pill">{game.awayScore} - {game.homeScore}</span>
                </div>
                <div className="market-row">
                  <div>
                    <strong>{game.awayTeam}</strong>
                    <small>{game.awayRecord}</small>
                  </div>
                  <div className="price">{game.awayScore}</div>
                </div>
                <div className="market-row">
                  <div>
                    <strong>{game.homeTeam}</strong>
                    <small>{game.homeRecord}</small>
                  </div>
                  <div className="price">{game.homeScore}</div>
                </div>
              </div>
            )) : (
              <div className="market-card">
                <div className="market-row">
                  <strong>{loading ? 'Loading live scores…' : boardError || 'No games are live right now.'}</strong>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="prediction-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">Predictions</span>
              <h2>Live-data estimates</h2>
            </div>
          </div>
          <div className="prediction-grid">
            {predictionCards.length ? predictionCards.slice(0, 3).map((pick) => (
              <article key={pick.id} className="prediction-card">
                <span className="tag-pill">{pick.tag}</span>
                <h3>{pick.title}</h3>
                <p>{pick.detail}</p>
                <div className="prediction-meta">
                  <span>{pick.league ? `${pick.sport} · ${pick.league}` : pick.sport}</span>
                  <span>{pick.odds}</span>
                </div>
                <div className="prediction-meta secondary-meta">
                  <span>Confidence</span>
                  <span>{pick.confidence}</span>
                </div>
              </article>
            )) : <p className="empty-state">{loading ? 'Loading current games…' : 'No upcoming or live games are available from ESPN.'}</p>}
          </div>
        </div>
      </section>

      <section className="news-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">Newsroom</span>
              <h2>Latest ESPN headlines</h2>
            </div>
          </div>

          <div className="home-news-layout">
            <div className="news-grid home-news-grid">
              {newsCards.map((story) => (
                <button
                  key={story.id || `${story.sport}-${story.title}`}
                  type="button"
                  className={`news-card news-card-button ${selectedNewsStoryId === story.id ? 'selected' : ''}`}
                  onClick={() => setSelectedNewsStoryId(story.id)}
                >
                  {story.image ? <img src={story.image} alt={story.title} /> : null}
                  <div className="news-body">
                    <span className="story-tag">{story.sport}</span>
                    <h3>{story.title}</h3>
                    {story.summary ? <p>{story.summary}</p> : null}
                  </div>
                </button>
              ))}
            </div>
            {!newsCards.length ? <p className="empty-state">Live headlines will appear here when the ESPN news feed is available.</p> : null}

            {activeStory ? (
              <article className="home-feature-story">
                {activeStory.image ? <img src={activeStory.image} alt={activeStory.title} className="detail-image" /> : null}
                <div className="detail-body">
                  <div className="detail-meta">
                    <span className="story-tag alt-tag">{activeStory.category || activeStory.sport}</span>
                    <span>{activeStory.source || 'AllSport Desk'}</span>
                    {activeStory.published ? <span>{new Date(activeStory.published).toLocaleString()}</span> : null}
                  </div>
                  <h3>{activeStory.title}</h3>
                  <p className="detail-summary">{activeStory.summary}</p>
                  {(activeStory.content || []).slice(0, 2).map((paragraph) => (
                    <p key={paragraph} className="detail-copy">{paragraph}</p>
                  ))}
                  {activeStory.link ? <a href={activeStory.link} target="_blank" rel="noreferrer">Read original story on ESPN</a> : null}
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

function ScoreboardPage({ board, loading, search, setSearch, selectedSport, setSelectedSport, selectedMarket, setSelectedMarket, error, updatedAt }) {
  return (
    <main>
      <section className="dashboard-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">Dashboard</span>
              <h2>Betting board</h2>
            </div>
            <span className="status-pill">
              ESPN · refreshes every 30s{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}
            </span>
          </div>
          {error ? <p className="auth-error">{error}</p> : null}

          <div className="toolbar">
            <div className="chip-row">
              {sportConfigs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`chip-button ${selectedSport === item.key ? 'active' : ''}`}
                  onClick={() => setSelectedSport(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="market-filters">
              <button type="button" className={`chip-button ${selectedMarket === 'all' ? 'active' : ''}`} onClick={() => setSelectedMarket('all')}>All</button>
              <button type="button" className={`chip-button ${selectedMarket === 'Live' ? 'active' : ''}`} onClick={() => setSelectedMarket('Live')}>Live</button>
              <button type="button" className={`chip-button ${selectedMarket === 'Final' ? 'active' : ''}`} onClick={() => setSelectedMarket('Final')}>Final</button>
              <button type="button" className={`chip-button ${selectedMarket === 'Scheduled' ? 'active' : ''}`} onClick={() => setSelectedMarket('Scheduled')}>Scheduled</button>
            </div>

            <label className="search-field">
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams or odds"
              />
            </label>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="loading-box">Loading live board…</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Matchup</th>
                    <th>League</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Spread</th>
                    <th>Total</th>
                    <th>Game details</th>
                  </tr>
                </thead>
                <tbody>
                  {board.length ? (
                    board.map((game) => (
                      <tr key={game.id}>
                        <td>
                          <div className="team-cell">
                            <strong>{game.awayTeam}</strong>
                            <span>vs</span>
                            <strong>{game.homeTeam}</strong>
                          </div>
                        </td>
                        <td>{game.league || game.sport}</td>
                        <td>
                          <span className={`status-tag ${game.status.toLowerCase()}`}>{game.status}</span>
                        </td>
                        <td>{game.status === 'Scheduled' ? '—' : `${game.awayScore} - ${game.homeScore}`}</td>
                        <td>{game.spread || '—'}</td>
                        <td>{game.total || '—'}</td>
                        <td>{game.statusDetail || (game.startTime ? new Date(game.startTime).toLocaleString() : '—')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-state">No games match the current filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

function PredictionsPage({ predictionCards, loading, error, updatedAt }) {
  const [expandedId, setExpandedId] = useState(predictionCards[0]?.id ?? '')

  useEffect(() => {
    if (!predictionCards.some((pick) => pick.id === expandedId)) {
      setExpandedId(predictionCards[0]?.id ?? '')
    }
  }, [expandedId, predictionCards])

  return (
    <main>
      <section className="prediction-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">Predictions</span>
              <h2>Live-data estimates</h2>
            </div>
            <span className="status-pill">
              ESPN · refreshes every 30s{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}
            </span>
          </div>
          <p className="detail-summary">Estimates use current team records and, for live games, the current score. They are not betting advice or sportsbook odds.</p>
          {error ? <p className="auth-error">{error}</p> : null}

          <div className="prediction-list">
            {predictionCards.length ? predictionCards.map((pick) => {
              const isOpen = expandedId === pick.id

              return (
                <article key={pick.id} className={`prediction-list-item ${isOpen ? 'open' : ''}`}>
                  <button type="button" className="prediction-toggle" onClick={() => setExpandedId(isOpen ? '' : pick.id)}>
                    <div className="prediction-main">
                      <div className="prediction-header-row">
                        <span className="tag-pill">{pick.tag}</span>
                        <span className="prediction-sport">{pick.league ? `${pick.sport} · ${pick.league}` : pick.sport}</span>
                      </div>

                      <div className="prediction-title-wrap">
                        <h3>{pick.title}</h3>
                        <span className="prediction-arrow">{isOpen ? '−' : '+'}</span>
                      </div>

                      <div className="prediction-meta-row">
                        <span>{pick.odds}</span>
                        <span>{pick.tag === 'Live estimate' ? 'Live score' : 'Scheduled'}: {pick.projectedScore || '—'}</span>
                        <span>{pick.confidence}</span>
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="prediction-detail">
                      <p>{pick.detail}</p>
                      <div className="prediction-reason-box">
                        <strong>Why this pick?</strong>
                        <p>{pick.reason}</p>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            }) : <div className="empty-state">{loading ? 'Loading live games…' : 'No upcoming or live games are currently available from ESPN.'}</div>}
          </div>
        </div>
      </section>
    </main>
  )
}

function PromosPage() {
  return (
    <main className="promo-page">
      <section className="container promo-hero">
        <div className="promo-hero-copy">
          <span className="eyebrow dark">Exclusive offers</span>
          <h1>Sportsbook promo codes and welcome bonuses.</h1>
          <p>Compare the best legal sportsbook promos, bonus codes, and signup offers across top betting apps.</p>
        </div>

        <div className="promo-hero-card">
          <span className="promo-hero-label">Featured deal</span>
          <strong>Bet $5, Get $150</strong>
          <p>Use code <span>ALLSPORT150</span> to unlock a fast-start sportsbook bonus.</p>
        </div>
      </section>

      <section className="container promo-grid-section">
        <div className="promo-filters">
          <button type="button" className="chip-button active">All promos</button>
          <button type="button" className="chip-button">NBA</button>
          <button type="button" className="chip-button">NFL</button>
          <button type="button" className="chip-button">MLB</button>
        </div>

        <div className="promo-grid">
          {promoOffers.map((offer) => (
            <article key={offer.id} className="promo-card">
              <div className="promo-card-header">
                <span className="promo-tag">{offer.tag}</span>
                <span className="promo-brand">{offer.brand}</span>
              </div>

              <h3>{offer.title}</h3>
              <p>{offer.detail}</p>

              <div className="promo-meta">
                <span>{offer.sport}</span>
                <span>{offer.expiry}</span>
              </div>

              <div className="promo-code-row">
                <span>Code</span>
                <strong>{offer.code}</strong>
              </div>

              <button type="button" className="btn btn-primary promo-button">Claim offer</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function NewsPage({ articles, newsLoading, error, updatedAt }) {
  const categories = ['All', 'NBA', 'NFL', 'MLB', 'Soccer']
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedStoryId, setSelectedStoryId] = useState(articles[0]?.id ?? '')

  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'All') return articles
    return articles.filter((story) => story.sport === selectedCategory || story.category === selectedCategory)
  }, [articles, selectedCategory])

  useEffect(() => {
    if (!filteredArticles.some((story) => story.id === selectedStoryId)) {
      setSelectedStoryId(filteredArticles[0]?.id ?? '')
    }
  }, [filteredArticles, selectedStoryId])

  const activeStory = filteredArticles.find((story) => story.id === selectedStoryId) || filteredArticles[0]

  return (
    <main className="news-page-shell">
      <section className="container news-layout">
        <div className="news-sidebar">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow dark">Newsroom</span>
              <h2>Latest stories</h2>
            </div>
          </div>

          <div className="category-row">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip-button ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {newsLoading && !filteredArticles.length ? (
            <div className="loading-box">Loading current ESPN headlines…</div>
          ) : (
            <div className="story-list">
              {filteredArticles.map((story) => (
                <button
                  key={story.id}
                  type="button"
                  className={`story-card ${selectedStoryId === story.id ? 'active' : ''}`}
                  onClick={() => setSelectedStoryId(story.id)}
                >
                  {story.image ? <img src={story.image} alt={story.title} /> : null}
                  <div className="story-copy">
                    <span className="story-tag">{story.sport}</span>
                    <h3>{story.title}</h3>
                    {story.summary ? <p>{story.summary}</p> : null}
                  </div>
                </button>
              ))}
              {!filteredArticles.length ? <p className="empty-state">No live stories are available for this category.</p> : null}
            </div>
          )}
          {error ? <p className="auth-error">{error}</p> : null}
          <p className="detail-meta">Live ESPN feed · refreshes every 2 minutes{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}</p>
        </div>

        {activeStory ? (
          <article className="story-detail">
            {activeStory.image ? <img src={activeStory.image} alt={activeStory.title} className="detail-image" /> : null}
            <div className="detail-body">
              <div className="detail-meta">
                <span className="story-tag alt-tag">{activeStory.category}</span>
                <span>{activeStory.source || 'AllSport Desk'}</span>
                <span>{activeStory.author}</span>
                {activeStory.published ? <span>{new Date(activeStory.published).toLocaleString()}</span> : null}
              </div>
              <h3>{activeStory.title}</h3>
              {activeStory.summary ? <p className="detail-summary">{activeStory.summary}</p> : null}
              {activeStory.content.map((paragraph) => (
                <p key={paragraph} className="detail-copy">{paragraph}</p>
              ))}
              {activeStory.link ? <a href={activeStory.link} target="_blank" rel="noreferrer">Read original story on ESPN</a> : null}
            </div>
          </article>
        ) : null}
      </section>
    </main>
  )
}

function AdminLoginPage({ authUser, setAuthUser }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (authUser) {
      navigate('/admin', { replace: true })
    }
  }, [authUser, navigate])

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const match = adminUsers.find(
      (user) => user.email.toLowerCase() === form.email.toLowerCase() && user.password === form.password,
    )

    if (!match) {
      setError('Invalid email or password. Use a writer or editor account.')
      return
    }

    setAuthUser({ name: match.name, email: match.email, role: match.role })
    navigate('/admin', { replace: true })
  }

  return (
    <main className="auth-shell">
      <div className="container auth-wrap">
        <div className="auth-card">
          <span className="eyebrow dark">Staff access</span>
          <h2>Admin login</h2>
          <p>Writers and editors sign in to manage the newsroom.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="writer@allsport.com" required />
            </label>

            <label className="field-group">
              <span>Password</span>
              <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required />
            </label>

            <div className="auth-hints">
              <span>Writer: writer@allsport.com / writer123</span>
              <span>Editor: editor@allsport.com / editor123</span>
            </div>

            {error ? <div className="auth-error">{error}</div> : null}

            <button type="submit" className="btn btn-primary auth-button">Sign in</button>
          </form>
        </div>
      </div>
    </main>
  )
}

function AdminDashboard({ authUser, setAuthUser, onRefreshStories }) {
  const [articles, setArticles] = useState(() => {
    try {
      const saved = window.localStorage.getItem('allsport-admin-articles')
      return saved ? JSON.parse(saved) : initialNews
    } catch {
      return initialNews
    }
  })
  const [selectedId, setSelectedId] = useState(() => {
    try {
      const saved = window.localStorage.getItem('allsport-selected-story')
      return saved || initialNews[0]?.id || ''
    } catch {
      return initialNews[0]?.id || ''
    }
  })
  const [draft, setDraft] = useState(() => ({
    title: initialNews[0]?.title || '',
    summary: initialNews[0]?.summary || '',
    author: initialNews[0]?.author || '',
    category: initialNews[0]?.category || 'Analysis',
    status: initialNews[0]?.status || 'Draft',
  }))

  useEffect(() => {
    window.localStorage.setItem('allsport-admin-articles', JSON.stringify(articles))
  }, [articles])

  useEffect(() => {
    if (!selectedId && articles[0]) {
      setSelectedId(articles[0].id)
    }

    const active = articles.find((article) => article.id === selectedId) || articles[0]
    if (active) {
      setDraft({
        title: active.title,
        summary: active.summary,
        author: active.author,
        category: active.category,
        status: active.status,
      })
    }
  }, [articles, selectedId])

  const updateArticleStatus = (articleId, nextStatus) => {
    setArticles((current) =>
      current.map((article) => (article.id === articleId ? { ...article, status: nextStatus } : article)),
    )
  }

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const saveDraft = () => {
    if (!selectedId) return

    setArticles((current) =>
      current.map((article) =>
        article.id === selectedId
          ? { ...article, ...draft, title: draft.title || article.title, summary: draft.summary || article.summary }
          : article,
      ),
    )
  }

  const addStory = () => {
    const newStory = {
      id: `draft-${Date.now()}`,
      sport: 'NBA',
      category: 'Analysis',
      title: 'New feature story',
      summary: 'Write a fresh sportsbook angle for the latest market movement.',
      author: authUser.name,
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
      status: 'Draft',
      content: ['Draft a fresh market narrative and shape the angle before publishing.'],
      source: 'AllSport Desk',
    }

    setArticles((current) => [newStory, ...current])
    setSelectedId(newStory.id)
  }

  const dashboardStats = [
    { label: 'Published', value: articles.filter((article) => article.status === 'Published').length },
    { label: 'In review', value: articles.filter((article) => article.status === 'In Review').length },
    { label: 'Drafts', value: articles.filter((article) => article.status === 'Draft').length },
  ]

  const canPublish = authUser.role === 'Editor'

  return (
    <main className="admin-page">
      <div className="container admin-shell">
        <div className="admin-header">
          <div>
            <span className="eyebrow dark">Staff dashboard</span>
            <h2>Welcome, {authUser.name}</h2>
          </div>
          <div className="admin-actions">
            <span className="role-badge">{authUser.role}</span>
            <button className="btn btn-secondary" type="button" onClick={() => setAuthUser(null)}>Logout</button>
          </div>
        </div>

        <div className="admin-grid">
          {dashboardStats.map((stat) => (
            <div key={stat.label} className="stat-box admin-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="admin-toolbar">
          <button type="button" className="btn btn-secondary" onClick={onRefreshStories}>Sync live feed</button>
          <button type="button" className="btn btn-primary" onClick={addStory}>New story</button>
        </div>

        <div className="admin-layout">
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Story</th>
                  <th>Sport</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((article) => (
                  <tr key={article.id} className={selectedId === article.id ? 'selected-row' : ''} onClick={() => setSelectedId(article.id)}>
                    <td>
                      <div className="admin-story-cell">
                        <strong>{article.title}</strong>
                      </div>
                    </td>
                    <td>{article.sport}</td>
                    <td>
                      <span className={`status-tag ${article.status.toLowerCase().replace(/\s+/g, '-')}`}>{article.status}</span>
                    </td>
                    <td>{article.author}</td>
                    <td>
                      <div className="queue-actions">
                        {article.status !== 'Draft' ? (
                          <button type="button" onClick={() => updateArticleStatus(article.id, 'Draft')} className="small-button">Draft</button>
                        ) : null}

                        {article.status !== 'In Review' ? (
                          <button type="button" onClick={() => updateArticleStatus(article.id, 'In Review')} className="small-button">Review</button>
                        ) : null}

                        {canPublish && article.status !== 'Published' ? (
                          <button type="button" onClick={() => updateArticleStatus(article.id, 'Published')} className="small-button primary-small">Publish</button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-editor">
            <div className="editor-header">
              <span className="eyebrow dark">Editor</span>
              <h3>Story settings</h3>
            </div>

            <label className="field-group">
              <span>Title</span>
              <input value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
            </label>

            <label className="field-group">
              <span>Summary</span>
              <textarea value={draft.summary} onChange={(event) => updateDraft('summary', event.target.value)} rows="4" />
            </label>

            <div className="editor-row">
              <label className="field-group">
                <span>Author</span>
                <input value={draft.author} onChange={(event) => updateDraft('author', event.target.value)} />
              </label>

              <label className="field-group">
                <span>Sport</span>
                <select value={draft.category?.includes('NFL') ? 'NFL' : draft.category || 'NBA'} onChange={(event) => updateDraft('category', event.target.value)}>
                  <option value="NBA">NBA</option>
                  <option value="NFL">NFL</option>
                  <option value="MLB">MLB</option>
                </select>
              </label>
            </div>

            <label className="field-group">
              <span>Status</span>
              <select value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}>
                <option value="Draft">Draft</option>
                <option value="In Review">In Review</option>
                <option value="Published">Published</option>
              </select>
            </label>

            <div className="editor-actions">
              <button type="button" className="btn btn-secondary" onClick={saveDraft}>Save changes</button>
              {canPublish ? (
                <button type="button" className="btn btn-primary" onClick={() => updateDraft('status', 'Published')}>Mark published</button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
