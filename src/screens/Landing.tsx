import ThemeToggle from "../components/ThemeToggle";
import LiveBoard, { SwappingWord } from "../components/LiveBoard";
import "../landing.css";

type Props = { onEnter: () => void };

const SWAP_WORDS = ["offer", "interview", "reply", "yes"];

export default function Landing({ onEnter }: Props) {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            JP
          </span>
          <span className="brand-name">JobPulse</span>
        </div>
        <ThemeToggle />
      </header>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow mono">Every application, one live board</p>
          <h1 className="hero-title">
            <span className="sr-only">Apply. Track. Get the offer.</span>
            <span aria-hidden="true">
              Apply. Track. <br />
              <span className="hero-accent">
                Get the <SwappingWord words={SWAP_WORDS} />.
              </span>
            </span>
          </h1>
          <p className="hero-sub">Every application, tracked from inbox to offer.</p>
          <div className="hero-cta">
            <button className="btn btn-hero" onClick={onEnter}>
              Enter the board
            </button>
            <span className="hero-note mono">No sign-up · your data, your running list</span>
          </div>
        </div>

        <div className="hero-visual">
          <LiveBoard />
        </div>

        <div className="scroll-cue" aria-hidden="true">
          <svg width="14" height="24" viewBox="0 0 14 24" fill="none">
            <path
              d="M7 1v14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.5"
            />
            <path
              d="M1 15l6 7 6-7"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </section>

      <footer className="landing-foot">
        <span className="mono">opeyemi-8915@agentmail.to</span>
        <span className="mono">Realtime · Convex</span>
      </footer>
    </div>
  );
}
