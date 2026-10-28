import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

const initialNews = []

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

const requestAiPredictions = async (games) => {
  const response = await fetch('/api/predictions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ games }),
  })
  let result
  try {
    result = await response.json()
  } catch (error) {
    if (error.name !== 'SyntaxError') throw error
    throw new Error('The AI prediction server is unavailable. Start it with npm run dev:server.')
  }

  if (!response.ok) {
    throw new Error(result.message || 'AI predictions could not be generated.')
  }

  return result.predictions.map((prediction) => {
    const game = games.find((item) => item.id === prediction.gameId)
    if (!game) throw new Error('AI response did not match the current scoreboard.')

    return {
      id: game.id,
      sport: game.sport,
      league: game.league,
      tag: game.status === 'Live' ? 'Live match' : 'Upcoming match',
      title: `${game.awayTeam} at ${game.homeTeam}`,
      predictedWinner: prediction.predictedWinner,
      winProbability: prediction.winProbability,
      detail: prediction.reason,
      score: game.status === 'Live'
        ? `${game.awayScore} - ${game.homeScore}`
        : game.startTime ? new Date(game.startTime).toLocaleString() : 'Start time unavailable',
    }
  })
}

function App() {
  const [selectedSport, setSelectedSport] = useState('all')
  const [selectedGameStatus, setSelectedGameStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [board, setBoard] = useState([])
  const [predictionCards, setPredictionCards] = useState([])
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState('')
  const [predictionUpdatedAt, setPredictionUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [boardError, setBoardError] = useState('')
  const [newsError, setNewsError] = useState('')
  const [boardUpdatedAt, setBoardUpdatedAt] = useState(null)
  const [newsUpdatedAt, setNewsUpdatedAt] = useState(null)
  const [newsArticles, setNewsArticles] = useState([])
  const [selectedNewsStoryId, setSelectedNewsStoryId] = useState('')
  const [newsLoading, setNewsLoading] = useState(true)
  const predictionRequestTime = useRef(0)
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

  const refreshPredictions = useCallback(async (force = false) => {
    const now = Date.now()
    if (!board.length || (!force && now - predictionRequestTime.current < 5 * 60 * 1000)) return

    const games = board
      .filter((game) => game.status === 'Live' || game.status === 'Scheduled')
      .slice(0, 8)
      .map(({ id, sport, league, status, homeTeam, awayTeam, homeScore, awayScore, homeRecord, awayRecord, startTime }) => ({
        id,
        sport,
        league,
        status,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        homeRecord,
        awayRecord,
        startTime,
      }))

    if (!games.length) {
      setPredictionCards([])
      setPredictionError('')
      return
    }

    predictionRequestTime.current = now
    setPredictionLoading(true)
    setPredictionError('')
    try {
      setPredictionCards(await requestAiPredictions(games))
      setPredictionUpdatedAt(new Date())
    } catch (error) {
      setPredictionCards([])
      setPredictionError(error.message)
    } finally {
      setPredictionLoading(false)
    }
  }, [board])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => refreshPredictions(), 0)
    return () => window.clearTimeout(timeoutId)
  }, [refreshPredictions])

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
      const statusMatches = selectedGameStatus === 'all' || game.status === selectedGameStatus
      const textMatches = !query || `${game.matchup} ${game.sport} ${game.league || ''}`.toLowerCase().includes(query)
      return sportMatches && statusMatches && textMatches
    })
  }, [search, selectedGameStatus, selectedSport, sourceBoard])

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
              predictionLoading={predictionLoading}
              predictionError={predictionError}
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
              selectedGameStatus={selectedGameStatus}
              setSelectedGameStatus={setSelectedGameStatus}
              error={boardError}
              updatedAt={boardUpdatedAt}
            />
          }
        />
        <Route path="/predictions" element={<PredictionsPage predictionCards={predictionCards} loading={loading} predictionLoading={predictionLoading} error={predictionError || boardError} updatedAt={predictionUpdatedAt} onRefresh={() => refreshPredictions(true)} />} />
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
  const [menuOpen, setMenuOpen] = useState(false)

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

        <nav id="primary-navigation" className={`main-nav ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen(false)}>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/scores">Scores</NavLink>
          <NavLink to="/predictions">Predictions</NavLink>
          <NavLink to="/news">News</NavLink>
        </nav>

        <div className="nav-actions">
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  )
}

function HomePage({ topStats, predictionCards, predictionLoading, predictionError, board, loading, boardError, newsCards, selectedNewsStoryId, setSelectedNewsStoryId }) {
  const activeStory = newsCards.find((story) => story.id === selectedNewsStoryId) || newsCards[0]
  const featuredGames = board.filter((game) => game.status === 'Live').slice(0, 2)

  return (
    <main>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">AI sports analysis</span>
            <h1>Live scores, AI match predictions, and the latest sports news.</h1>
            <p>
              Explore AI-generated match outcome probabilities, live scores, and current headlines across the NBA, NFL, MLB, and major soccer leagues.
            </p>
            <div className="cta-row">
              <NavLink to="/scores" className="btn btn-primary">View live scores</NavLink>
              <NavLink to="/predictions" className="btn btn-secondary">Explore predictions</NavLink>
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
              <div className="score-card" key={game.id}>
                <div className="score-topline">
                  <span>{game.league || game.sport} · {game.statusDetail || 'Live'}</span>
                  <span className="trend-pill">{game.awayScore} - {game.homeScore}</span>
                </div>
                <div className="score-row">
                  <div>
                    <strong>{game.awayTeam}</strong>
                    <small>{game.awayRecord}</small>
                  </div>
                  <div className="score-value">{game.awayScore}</div>
                </div>
                <div className="score-row">
                  <div>
                    <strong>{game.homeTeam}</strong>
                    <small>{game.homeRecord}</small>
                  </div>
                  <div className="score-value">{game.homeScore}</div>
                </div>
              </div>
            )) : (
              <div className="score-card">
                <div className="score-row">
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
              <h2>AI match predictions</h2>
            </div>
          </div>
          <div className="prediction-grid">
            {predictionCards.length ? predictionCards.slice(0, 3).map((pick) => (
              <article key={pick.id} className="prediction-card">
                <span className="tag-pill">{pick.tag}</span>
                <h3>{pick.title}</h3>
                <p>AI predicts {pick.predictedWinner} to win ({pick.winProbability}% estimated chance).</p>
                <div className="prediction-meta">
                  <span>{pick.league ? `${pick.sport} · ${pick.league}` : pick.sport}</span>
                  <span>{pick.score}</span>
                </div>
                <div className="prediction-meta secondary-meta">
                  <span>AI analysis</span>
                  <span>Estimated</span>
                </div>
              </article>
            )) : <p className="empty-state">{predictionLoading || loading ? 'Preparing AI analysis for current games…' : predictionError || 'No upcoming or live games are available from ESPN.'}</p>}
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

function ScoreboardPage({ board, loading, search, setSearch, selectedSport, setSelectedSport, selectedGameStatus, setSelectedGameStatus, error, updatedAt }) {
  return (
    <main>
      <section className="dashboard-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow dark">Dashboard</span>
              <h2>Live scores</h2>
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

            <div className="status-filters">
              <button type="button" className={`chip-button ${selectedGameStatus === 'all' ? 'active' : ''}`} onClick={() => setSelectedGameStatus('all')}>All</button>
              <button type="button" className={`chip-button ${selectedGameStatus === 'Live' ? 'active' : ''}`} onClick={() => setSelectedGameStatus('Live')}>Live</button>
              <button type="button" className={`chip-button ${selectedGameStatus === 'Final' ? 'active' : ''}`} onClick={() => setSelectedGameStatus('Final')}>Final</button>
              <button type="button" className={`chip-button ${selectedGameStatus === 'Scheduled' ? 'active' : ''}`} onClick={() => setSelectedGameStatus('Scheduled')}>Scheduled</button>
            </div>

            <label className="search-field">
              <span>Search</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search teams or leagues"
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
                        <td>{game.statusDetail || (game.startTime ? new Date(game.startTime).toLocaleString() : '—')}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="empty-state">No games match the current filters.</td>
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

function PredictionsPage({ predictionCards, loading, predictionLoading, error, updatedAt, onRefresh }) {
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
              <h2>AI match predictions</h2>
            </div>
            <div className="prediction-actions">
              <span className="status-pill">
                AI updates every 5 min{updatedAt ? ` · updated ${updatedAt.toLocaleTimeString()}` : ''}
              </span>
              <button type="button" className="btn btn-secondary" onClick={onRefresh} disabled={predictionLoading || loading}>
                {predictionLoading ? 'Analyzing…' : 'Refresh AI predictions'}
              </button>
            </div>
          </div>
          <p className="detail-summary">AI analyzes ESPN matchup status, current scores, and available season records. It does not access injury reports or other live context, and its probability estimates are not guarantees.</p>
          {error ? <p className="auth-error">{error}</p> : null}
          {!error && predictionCards.length && updatedAt ? <p className="detail-meta">AI analysis generated {updatedAt.toLocaleTimeString()}.</p> : null}

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
                        <span>Predicted winner: {pick.predictedWinner}</span>
                        <span>{pick.tag === 'Live match' ? 'Live score' : 'Start'}: {pick.score}</span>
                        <span>{pick.winProbability}% estimated win chance</span>
                      </div>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="prediction-detail">
                      <p>{pick.detail}</p>
                      <div className="prediction-reason-box">
                        <strong>AI analysis</strong>
                        <p>{pick.reason}</p>
                      </div>
                    </div>
                  ) : null}
                </article>
              )
            }) : <div className="empty-state">{predictionLoading || loading ? 'Preparing AI analysis for current games…' : error || 'No upcoming or live games are currently available from ESPN.'}</div>}
          </div>
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
  const trendingSports = useMemo(() => {
    const counts = articles.reduce((result, article) => {
      result.set(article.sport, (result.get(article.sport) || 0) + 1)
      return result
    }, new Map())

    return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [articles])

  return (
    <main className="news-page-shell">
      <section className="container news-layout">
        <div className="news-sidebar">
          <div className="section-heading compact-heading">
            <div>
              <span className="eyebrow dark">Newsroom</span>
              <h2>Current sports news</h2>
            </div>
          </div>

          <div className="trending-topics">
            <strong>Trending sports</strong>
            <span>Most represented in current ESPN headlines</span>
            <div className="trending-topic-list">
              {trendingSports.map(([sport, count]) => (
                <span className="trending-topic" key={sport}>{sport} · {count} {count === 1 ? 'story' : 'stories'}</span>
              ))}
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
      summary: 'Write a clear, fact-checked analysis of the latest team news and match developments.',
      author: authUser.name,
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
      status: 'Draft',
      content: ['Draft a factual sports story, verify the details, and explain the context for readers.'],
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
