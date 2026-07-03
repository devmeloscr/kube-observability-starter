import { useCallback, useEffect, useState } from "react";
import { api } from "./api.js";

// ─── Estacionamentos (fake, mas realistas) ────────────────────────────────────
const ESTACIONAMENTOS = [
  {
    id: 1,
    nome: "Estapar Shopping BarraShopping",
    endereco: "Av. das Américas, 4666 – Barra da Tijuca",
    tipo: "shopping",
    precoHora: 12,
    precoDia: 60,
    totalVagas: 800,
    disponiveis: 143,
    comodidades: ["Coberto", "24h", "Câmeras", "Acessível"],
    lat: -22.9997, lng: -43.3650,
  },
  {
    id: 2,
    nome: "Multipark Av. Rio Branco",
    endereco: "Av. Rio Branco, 156 – Centro",
    tipo: "edificio",
    precoHora: 18,
    precoDia: 90,
    totalVagas: 350,
    disponiveis: 27,
    comodidades: ["Coberto", "Câmeras", "Manobrista"],
    lat: -22.9025, lng: -43.1753,
  },
  {
    id: 3,
    nome: "Park Leblon",
    endereco: "Av. Ataulfo de Paiva, 1079 – Leblon",
    tipo: "edificio",
    precoHora: 22,
    precoDia: 110,
    totalVagas: 500,
    disponiveis: 89,
    comodidades: ["Coberto", "Câmeras", "EV Charging", "Manobrista"],
    lat: -22.9847, lng: -43.2234,
  },
  {
    id: 4,
    nome: "Estacionamento Botafogo",
    endereco: "R. Voluntários da Pátria, 400 – Botafogo",
    tipo: "rua",
    precoHora: 8,
    precoDia: 40,
    totalVagas: 120,
    disponiveis: 34,
    comodidades: ["Descoberto", "Câmeras"],
    lat: -22.9502, lng: -43.1853,
  },
  {
    id: 5,
    nome: "Parking Shopping Tijuca",
    endereco: "Av. Maracanã, 987 – Tijuca",
    tipo: "edificio",
    precoHora: 15,
    precoDia: 75,
    totalVagas: 280,
    disponiveis: 0,
    comodidades: ["Coberto", "Câmeras", "Acessível"],
    lat: -22.9173, lng: -43.2333,
  },
  {
    id: 6,
    nome: "Estapar Ipanema",
    endereco: "R. Visconde de Pirajá, 547 – Ipanema",
    tipo: "edificio",
    precoHora: 14,
    precoDia: 70,
    totalVagas: 200,
    disponiveis: 55,
    comodidades: ["Coberto", "24h", "Câmeras"],
    lat: -22.9839, lng: -43.2096,
  },
  {
    id: 7,
    nome: "Estac. Centro Histórico",
    endereco: "Praça XV de Novembro, 48 – Centro",
    tipo: "rua",
    precoHora: 6,
    precoDia: 30,
    totalVagas: 250,
    disponiveis: 112,
    comodidades: ["Descoberto", "Acessível"],
    lat: -22.9021, lng: -43.1731,
  },
  {
    id: 8,
    nome: "Multipark Copacabana",
    endereco: "Av. Nossa Sra. de Copacabana, 680 – Copacabana",
    tipo: "edificio",
    precoHora: 16,
    precoDia: 80,
    totalVagas: 160,
    disponiveis: 18,
    comodidades: ["Coberto", "Câmeras", "Acessível", "EV Charging"],
    lat: -22.9685, lng: -43.1853,
  },
];

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TIPO_LABEL = { shopping: "Shopping", edificio: "Edifício", rua: "Rua" };

// ─── App ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [filtroDisp, setFiltroDisp] = useState(false);
  const [reservas, setReservas] = useState(new Set());
  const [health, setHealth] = useState("connecting");
  const [toast, setToast] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSorted, setGeoSorted] = useState(null);
  const [distances, setDistances] = useState({});

  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type, id: Math.random() });
    setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const check = async () => {
      try { await api.health(); setHealth("up"); }
      catch { setHealth("down"); }
    };
    check();
    const t = setInterval(check, 6000);
    return () => clearInterval(t);
  }, []);

  const handleLogin = useCallback(async (name) => {
    try {
      await api.login(name);
      setUser({ name });
      setModal(null);
      showToast(`Bem-vindo, ${name}!`);
    } catch {
      showToast("Falha ao entrar. Tente novamente.", "err");
    }
  }, [showToast]);

  const handleRegister = useCallback(async (name) => {
    try {
      await api.login(name);
      setUser({ name });
      setModal(null);
      showToast(`Conta criada! Bem-vindo, ${name}!`);
    } catch {
      showToast("Falha ao criar conta.", "err");
    }
  }, [showToast]);

  const handleLogout = useCallback(async () => {
    if (!user) return;
    try { await api.logout(user.name); } catch { /* ignore */ }
    setUser(null);
    setGeoSorted(null);
    setDistances({});
    showToast("Até logo!");
  }, [user, showToast]);

  const handleReservar = useCallback(async (est) => {
    if (!user) {
      setModal("login");
      showToast("Faça login para reservar.", "warn");
      return;
    }
    if (reservas.has(est.id) || est.disponiveis === 0) return;
    try {
      await api.reservar(est.id);
      setReservas((prev) => new Set([...prev, est.id]));
      showToast(`Vaga reservada em ${est.nome}!`);
    } catch {
      showToast("Erro ao reservar vaga.", "err");
    }
  }, [user, reservas, showToast]);

  const handleBuscarPerto = useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Geolocalização não disponível.", "warn");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        await api.work().catch(() => {});
        const { latitude: lat, longitude: lng } = coords;
        const dist = {};
        ESTACIONAMENTOS.forEach((e) => {
          dist[e.id] = haversine(lat, lng, e.lat, e.lng);
        });
        setDistances(dist);
        const sorted = [...ESTACIONAMENTOS].sort((a, b) => dist[a.id] - dist[b.id]);
        setGeoSorted(sorted);
        setSearch("");
        setFiltroDisp(false);
        setGeoLoading(false);
        showToast("Estacionamentos ordenados por distância!");
      },
      () => {
        setGeoLoading(false);
        showToast("Não foi possível obter sua localização.", "err");
      }
    );
  }, [showToast]);

  const handleSearch = useCallback((q) => {
    setSearch(q);
    setGeoSorted(null);
    setDistances({});
    if (q.length > 2) api.work().catch(() => {});
  }, []);

  const lista = (geoSorted || ESTACIONAMENTOS).filter((e) => {
    if (filtroDisp && e.disponiveis === 0) return false;
    const q = search.toLowerCase();
    return !q || e.nome.toLowerCase().includes(q) || e.endereco.toLowerCase().includes(q);
  });

  return (
    <>
      <Navbar
        user={user}
        health={health}
        reservasCount={reservas.size}
        onLogin={() => setModal("login")}
        onRegister={() => setModal("register")}
        onLogout={handleLogout}
      />

      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "login" ? (
            <LoginForm onSubmit={handleLogin} onSwitch={() => setModal("register")} />
          ) : (
            <RegisterForm onSubmit={handleRegister} onSwitch={() => setModal("login")} />
          )}
        </Modal>
      )}

      {detail ? (
        <DetailView
          est={detail}
          onBack={() => setDetail(null)}
          onReservar={handleReservar}
          reservou={reservas.has(detail.id)}
          distancia={distances[detail.id]}
          user={user}
        />
      ) : (
        <HomeView
          lista={lista}
          total={ESTACIONAMENTOS.length}
          filtroDisp={filtroDisp}
          search={search}
          geoLoading={geoLoading}
          geoAtivo={!!geoSorted}
          distances={distances}
          onFiltroDisp={() => setFiltroDisp((v) => !v)}
          onSearch={handleSearch}
          onBuscarPerto={handleBuscarPerto}
          onSelect={setDetail}
          onReservar={handleReservar}
          reservas={reservas}
          user={user}
        />
      )}

      {toast && <Toast key={toast.id} msg={toast.msg} type={toast.type} />}
    </>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
function Navbar({ user, health, reservasCount, onLogin, onRegister, onLogout }) {
  return (
    <nav className="navbar">
      <div className="nav-inner">
        <a className="logo" href="#">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#6366f1" />
            <text x="14" y="20" textAnchor="middle" fill="white" fontSize="15" fontWeight="700" fontFamily="Inter,sans-serif">P</text>
          </svg>
          <span>VagaPark</span>
        </a>

        <div className="nav-right">
          <span className={`api-pill api-${health}`}>
            <span className="api-dot" />
            {health === "up" ? "Sistema online" : health === "down" ? "Offline" : "Conectando"}
          </span>

          {user ? (
            <div className="user-area">
              {reservasCount > 0 && (
                <span className="cand-badge">
                  {reservasCount} reserva{reservasCount !== 1 ? "s" : ""}
                </span>
              )}
              <div className="user-chip">
                <span className="user-avatar">{user.name[0].toUpperCase()}</span>
                <span className="user-name">{user.name}</span>
              </div>
              <button className="btn-ghost-sm" onClick={onLogout}>Sair</button>
            </div>
          ) : (
            <div className="auth-btns">
              <button className="btn-outline" onClick={onLogin}>Entrar</button>
              <button className="btn-primary" onClick={onRegister}>Criar conta</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─── HomeView ─────────────────────────────────────────────────────────────────
function HomeView({ lista, total, filtroDisp, search, geoLoading, geoAtivo, distances, onFiltroDisp, onSearch, onBuscarPerto, onSelect, onReservar, reservas, user }) {
  const totalDisp = ESTACIONAMENTOS.reduce((s, e) => s + e.disponiveis, 0);

  return (
    <main className="main">
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-inner">
          <p className="hero-eyebrow">
            <span className="eyebrow-dot" />
            {totalDisp} vagas disponíveis agora no Rio de Janeiro
          </p>
          <h1 className="hero-title">
            Encontre uma vaga de<br />
            <span className="hero-accent">estacionamento</span> rápido
          </h1>
          <p className="hero-sub">
            Reserve online e garanta seu lugar antes de sair de casa.
          </p>

          <div className="search-wrap">
            <div className="search-bar">
              <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="search-input"
                placeholder="Buscar por nome ou endereço…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <button className="geo-btn" onClick={onBuscarPerto} disabled={geoLoading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {geoLoading ? "Buscando…" : "Perto de mim"}
            </button>
          </div>
        </div>
      </section>

      <section className="content">
        <div className="content-header">
          <div className="filters">
            <button
              className={`filter-btn ${!filtroDisp ? "active" : ""}`}
              onClick={() => filtroDisp && onFiltroDisp()}
            >
              Todos
            </button>
            <button
              className={`filter-btn ${filtroDisp ? "active" : ""}`}
              onClick={() => !filtroDisp && onFiltroDisp()}
            >
              Com vagas
            </button>
          </div>
          <span className="result-count">
            {geoAtivo && (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 4 }}>
                <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            )}
            {lista.length} {lista.length === 1 ? "estacionamento" : "estacionamentos"}
            {geoAtivo ? " mais próximos" : ""}
          </span>
        </div>

        {lista.length === 0 ? (
          <div className="empty-state">
            <p className="empty-icon">🅿️</p>
            <p className="empty-title">Nenhum estacionamento encontrado</p>
            <p className="empty-sub">Tente ajustar os filtros ou o termo de busca.</p>
          </div>
        ) : (
          <div className="job-grid">
            {lista.map((e) => (
              <ParkCard
                key={e.id}
                est={e}
                reservou={reservas.has(e.id)}
                distancia={distances[e.id]}
                onSelect={() => onSelect(e)}
                onReservar={() => onReservar(e)}
                user={user}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

// ─── ParkCard ─────────────────────────────────────────────────────────────────
function ParkCard({ est, reservou, distancia, onSelect, onReservar, user }) {
  const pct = est.totalVagas > 0 ? est.disponiveis / est.totalVagas : 0;
  const dispColor = pct === 0 ? "disp-zero" : pct < 0.2 ? "disp-low" : "disp-ok";

  return (
    <article className="job-card">
      <div className="card-top">
        <div className="park-icon-wrap">
          <span className="park-icon">🅿</span>
          <div>
            <p className="company-name">{est.nome}</p>
            <p className="company-city">{est.endereco}</p>
          </div>
        </div>
        <span className={`tipo-badge tipo-${est.tipo}`}>{TIPO_LABEL[est.tipo]}</span>
      </div>

      <div className="card-disponivel">
        <span className={`disp-num ${dispColor}`}>{est.disponiveis}</span>
        <span className="disp-label">vagas disponíveis de {est.totalVagas}</span>
      </div>

      <div className="disp-bar-wrap">
        <div className="disp-bar">
          <div className={`disp-bar-fill ${dispColor}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
        </div>
      </div>

      <div className="card-meta">
        <span className="card-salary">R$ {est.precoHora}/h</span>
        {distancia != null && (
          <span className="card-contract">{distancia < 1 ? `${Math.round(distancia * 1000)} m` : `${distancia.toFixed(1)} km`}</span>
        )}
      </div>

      <div className="tag-list">
        {est.comodidades.map((c) => <span className="tag" key={c}>{c}</span>)}
      </div>

      <div className="card-footer">
        <button className="btn-ghost-sm" onClick={onSelect}>Ver detalhes</button>
        {reservou ? (
          <span className="candidatou-badge">✓ Reservado</span>
        ) : est.disponiveis === 0 ? (
          <span className="candidatou-badge badge-lotado">Lotado</span>
        ) : (
          <button className="btn-primary btn-sm" onClick={onReservar}>
            {user ? "Reservar vaga" : "Entrar e reservar"}
          </button>
        )}
      </div>
    </article>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────
function DetailView({ est, onBack, onReservar, reservou, distancia, user }) {
  const pct = est.totalVagas > 0 ? est.disponiveis / est.totalVagas : 0;
  const dispColor = pct === 0 ? "disp-zero" : pct < 0.2 ? "disp-low" : "disp-ok";

  return (
    <main className="main">
      <div className="detail-container">
        <button className="back-btn" onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          Voltar
        </button>

        <div className="detail-card">
          <div className="detail-header">
            <div className="detail-company">
              <div className="park-icon-lg">🅿</div>
              <div>
                <h2 className="detail-company-name">{est.nome}</h2>
                <p className="detail-city">{est.endereco}</p>
              </div>
            </div>
            <span className={`tipo-badge tipo-${est.tipo}`}>{TIPO_LABEL[est.tipo]}</span>
          </div>

          <h1 className="detail-title">
            <span className={`disp-num-lg ${dispColor}`}>{est.disponiveis}</span>
            <span className="disp-label-lg"> vagas disponíveis</span>
          </h1>

          <div className="disp-bar-wrap" style={{ marginBottom: 24 }}>
            <div className="disp-bar disp-bar-lg">
              <div className={`disp-bar-fill ${dispColor}`} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
            </div>
            <span className="disp-bar-cap">{est.totalVagas} vagas no total</span>
          </div>

          <div className="detail-meta">
            <span className="detail-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              R$ {est.precoHora}/hora
            </span>
            <span className="detail-meta-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              R$ {est.precoDia}/dia
            </span>
            {distancia != null && (
              <span className="detail-meta-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" />
                </svg>
                {distancia < 1 ? `${Math.round(distancia * 1000)} m de você` : `${distancia.toFixed(1)} km de você`}
              </span>
            )}
          </div>

          <div className="detail-section">
            <h3 className="detail-section-title">Comodidades</h3>
            <div className="tag-list detail-tags">
              {est.comodidades.map((c) => <span className="tag" key={c}>{c}</span>)}
            </div>
          </div>

          <div className="detail-cta">
            {reservou ? (
              <div className="cta-success">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Vaga reservada com sucesso!
              </div>
            ) : est.disponiveis === 0 ? (
              <div className="cta-lotado">Estacionamento lotado no momento</div>
            ) : (
              <button className="btn-primary btn-lg" onClick={() => onReservar(est)}>
                {user ? "Reservar vaga agora" : "Entrar para reservar"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

// ─── LoginForm ────────────────────────────────────────────────────────────────
function LoginForm({ onSubmit, onSwitch }) {
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");

  const submit = (e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); };

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-logo">🅿 VagaPark</div>
      <h2 className="auth-title">Entrar na sua conta</h2>
      <p className="auth-sub">Acesse para reservar vagas de estacionamento</p>

      <label className="form-label">Usuário</label>
      <input className="form-input" placeholder="seu.nome" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="username" />

      <label className="form-label">Senha</label>
      <input className="form-input" type="password" placeholder="••••••••" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />

      <button className="btn-primary btn-block" type="submit" disabled={!name.trim()}>Entrar</button>

      <p className="auth-switch">
        Não tem conta?{" "}
        <button type="button" className="link-btn" onClick={onSwitch}>Criar conta grátis</button>
      </p>
    </form>
  );
}

// ─── RegisterForm ─────────────────────────────────────────────────────────────
function RegisterForm({ onSubmit, onSwitch }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const submit = (e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); };

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-logo">🅿 VagaPark</div>
      <h2 className="auth-title">Criar sua conta</h2>
      <p className="auth-sub">Reserve vagas de estacionamento em segundos</p>

      <label className="form-label">Nome completo</label>
      <input className="form-input" placeholder="Seu Nome" value={name} onChange={(e) => setName(e.target.value)} autoFocus autoComplete="name" />

      <label className="form-label">E-mail</label>
      <input className="form-input" type="email" placeholder="voce@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />

      <label className="form-label">Senha</label>
      <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />

      <button className="btn-primary btn-block" type="submit" disabled={!name.trim()}>Criar conta</button>

      <p className="auth-switch">
        Já tem conta?{" "}
        <button type="button" className="link-btn" onClick={onSwitch}>Entrar</button>
      </p>
    </form>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{type === "err" ? "✕" : type === "warn" ? "⚠" : "✓"}</span>
      {msg}
    </div>
  );
}
